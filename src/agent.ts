import { Agent } from 'agents';
import {
  TaskDetails,
  Bid,
  UserProfile,
  Balances,
  CompletedTask,
  Currency,
  AuctionState,
  LeaderboardEntry,
  Achievement,
  NotificationEvent
} from './types';

export class AuctionAgent extends Agent {
  // Persistent state using Cloudflare Durable Objects
  private state: AuctionState = {
    tasks: new Map(),
    bids: new Map(),
    users: new Map(),
    balances: new Map(),
    completedTasks: [],
    leaderboard: []
  };

  private initialized = false;

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
  }

  async initialize() {
    // Create state table if it doesn't exist
    await this.sql`
      CREATE TABLE IF NOT EXISTS state (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;

    // Load state from storage
    const stored = await this.sql`SELECT * FROM state LIMIT 1`;
    if (stored.length > 0) {
      this.state = this.deserializeState(stored[0].data);
    }
  }

  // ==================== TASK CREATION ====================

  async createTask(params: {
    title: string;
    description: string;
    creatorId: string;
    startingPayment: Currency;
    duration: number;
    auctionType?: 'standard' | 'dutch' | 'buyItNow';
    buyItNowPrice?: Currency;
    dutchDecreaseRate?: number;
    verificationRequired?: boolean;
    verificationMethod?: 'photo' | 'peer' | 'auto';
    category?: string;
    tags?: string[];
  }): Promise<TaskDetails> {
    await this.ensureInitialized();

    const taskId = this.generateId();
    const now = Date.now();

    const task: TaskDetails = {
      id: taskId,
      title: params.title,
      description: params.description,
      creatorId: params.creatorId,
      startingPayment: params.startingPayment,
      currentBid: params.startingPayment,
      auctionType: params.auctionType || 'standard',
      buyItNowPrice: params.buyItNowPrice,
      dutchDecreaseRate: params.dutchDecreaseRate,
      duration: params.duration,
      startTime: now,
      endTime: now + params.duration,
      status: 'active',
      verificationRequired: params.verificationRequired || false,
      verificationMethod: params.verificationMethod,
      category: params.category,
      tags: params.tags
    };

    this.state.tasks.set(taskId, task);
    this.state.bids.set(taskId, []);

    await this.persistState();
    await this.notifyUsersOfNewTask(task);

    return task;
  }

  // ==================== BIDDING MECHANICS ====================

  async placeBid(params: {
    taskId: string;
    userId: string;
    amount: Currency;
  }): Promise<{ success: boolean; message: string; bid?: Bid }> {
    await this.ensureInitialized();

    const task = this.state.tasks.get(params.taskId);

    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    if (task.status !== 'active') {
      return { success: false, message: 'Task is not active' };
    }

    if (Date.now() > task.endTime) {
      return { success: false, message: 'Auction has ended' };
    }

    if (task.creatorId === params.userId) {
      return { success: false, message: 'Cannot bid on your own task' };
    }

    // Validate currency type matches
    if (params.amount.type !== task.currentBid.type) {
      return { success: false, message: 'Currency type must match task payment type' };
    }

    // In reverse auction, bid must be LOWER than current bid
    if (params.amount.amount >= task.currentBid.amount) {
      return { success: false, message: 'Bid must be lower than current bid' };
    }

    // Create bid
    const bid: Bid = {
      id: this.generateId(),
      taskId: params.taskId,
      userId: params.userId,
      amount: params.amount,
      timestamp: Date.now()
    };

    const bids = this.state.bids.get(params.taskId) || [];

    // Notify previous bidder they were outbid
    if (bids.length > 0) {
      const previousBid = bids[bids.length - 1];
      await this.sendNotification({
        type: 'outbid',
        userId: previousBid.userId,
        taskId: params.taskId,
        message: `You've been outbid on "${task.title}"`,
        timestamp: Date.now()
      });
    }

    bids.push(bid);
    this.state.bids.set(params.taskId, bids);

    // Update task current bid
    task.currentBid = params.amount;

    // Last-minute bidding protection
    const timeRemaining = task.endTime - Date.now();
    if (timeRemaining < 60000) { // Less than 1 minute
      task.endTime += 5 * 60000; // Extend by 5 minutes
    }

    await this.persistState();

    return { success: true, message: 'Bid placed successfully', bid };
  }

  // ==================== USER MANAGEMENT ====================

  async createUser(params: {
    id: string;
    name: string;
    email: string;
  }): Promise<UserProfile> {
    await this.ensureInitialized();

    const user: UserProfile = {
      id: params.id,
      name: params.name,
      email: params.email,
      reliabilityScore: 100,
      qualityRating: 5,
      totalTasksCompleted: 0,
      totalTasksCreated: 0,
      bidHistory: [],
      achievements: [],
      preferences: {
        notificationSettings: {
          outbid: true,
          newTasks: true,
          taskReminders: true
        }
      }
    };

    this.state.users.set(params.id, user);
    this.state.balances.set(params.id, this.getDefaultBalances());

    await this.persistState();

    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    await this.ensureInitialized();
    return this.state.users.get(userId) || null;
  }

  private getDefaultBalances(): Balances {
    return {
      cash: 0,
      points: 100, // Starting points
      favorTokens: 2, // Starting favor tokens
      timeBank: 0
    };
  }

  async getUserBalance(userId: string): Promise<Balances> {
    return this.state.balances.get(userId) || this.getDefaultBalances();
  }

  // ==================== QUERIES ====================

  async getTask(taskId: string): Promise<TaskDetails | null> {
    await this.ensureInitialized();
    return this.state.tasks.get(taskId) || null;
  }

  async getActiveTasks(): Promise<TaskDetails[]> {
    await this.ensureInitialized();

    // Check for ended auctions before returning
    await this.checkEndedAuctions();

    return Array.from(this.state.tasks.values())
      .filter(t => t.status === 'active')
      .sort((a, b) => a.endTime - b.endTime);
  }

  async getTaskBids(taskId: string): Promise<Bid[]> {
    await this.ensureInitialized();
    return this.state.bids.get(taskId) || [];
  }

  async getUserTasks(userId: string): Promise<{
    created: TaskDetails[];
    won: TaskDetails[];
    bidding: TaskDetails[];
  }> {
    const allTasks = Array.from(this.state.tasks.values());

    const created = allTasks.filter(t => t.creatorId === userId);
    const won = allTasks.filter(t => t.winnerId === userId);

    const userBids = Array.from(this.state.bids.entries())
      .filter(([_, bids]) => bids.some(b => b.userId === userId))
      .map(([taskId, _]) => taskId);

    const bidding = allTasks.filter(t =>
      userBids.includes(t.id) && t.status === 'active' && t.winnerId !== userId
    );

    return { created, won, bidding };
  }

  // ==================== AUCTION LIFECYCLE ====================

  async acceptBuyItNow(params: {
    taskId: string;
    userId: string;
  }): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();

    const task = this.state.tasks.get(params.taskId);

    if (!task || !task.buyItNowPrice) {
      return { success: false, message: 'Buy It Now not available' };
    }

    if (task.status !== 'active') {
      return { success: false, message: 'Task is not active' };
    }

    // Immediately end auction and assign winner
    task.status = 'in-progress';
    task.winnerId = params.userId;
    task.currentBid = task.buyItNowPrice;
    task.endTime = Date.now();

    await this.persistState();
    await this.notifyTaskWinner(task);

    return { success: true, message: 'Task claimed via Buy It Now' };
  }

  private async checkEndedAuctions() {
    const now = Date.now();

    for (const [taskId, task] of this.state.tasks.entries()) {
      if (task.status === 'active' && now >= task.endTime) {
        await this.finalizeAuction(taskId);
      }
    }
  }

  private async finalizeAuction(taskId: string) {
    const task = this.state.tasks.get(taskId);
    if (!task) return;

    const bids = this.state.bids.get(taskId) || [];

    if (bids.length > 0) {
      // Winner is the lowest bidder
      const winningBid = bids[bids.length - 1];
      task.winnerId = winningBid.userId;
      task.status = 'in-progress';

      await this.notifyTaskWinner(task);
    } else {
      // No bids, cancel task
      task.status = 'cancelled';
    }

    await this.persistState();
  }

  private async notifyTaskWinner(task: TaskDetails) {
    if (task.winnerId) {
      await this.sendNotification({
        type: 'won',
        userId: task.winnerId,
        taskId: task.id,
        message: `Congratulations! You won the task "${task.title}"`,
        timestamp: Date.now()
      });
    }
  }

  // ==================== TASK COMPLETION ====================

  async completeTask(params: {
    taskId: string;
    completerId: string;
    proof?: string; // URL to proof image or data
    qualityRating?: number;
    feedback?: string;
  }): Promise<{ success: boolean; message: string }> {
    const task = this.state.tasks.get(params.taskId);

    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    if (task.winnerId !== params.completerId) {
      return { success: false, message: 'Only the winner can complete this task' };
    }

    if (task.status !== 'in-progress') {
      return { success: false, message: 'Task is not in progress' };
    }

    // Process payment
    await this.processPayment({
      fromUserId: task.creatorId,
      toUserId: task.winnerId,
      amount: task.currentBid
    });

    // Update task status
    task.status = 'completed';

    // Record completed task
    const completedTask: CompletedTask = {
      taskId: params.taskId,
      winnerId: task.winnerId,
      creatorId: task.creatorId,
      completedAt: Date.now(),
      paymentAmount: task.currentBid,
      qualityRating: params.qualityRating,
      feedback: params.feedback,
      verified: true
    };
    this.state.completedTasks.push(completedTask);

    // Update user profiles
    await this.updateUserReputation(task.winnerId, params.qualityRating);
    await this.checkAchievements(task.winnerId);

    await this.persistState();

    return { success: true, message: 'Task completed successfully' };
  }

  async updateUserReputation(userId: string, qualityRating?: number) {
    const user = this.state.users.get(userId);
    if (!user) return;

    user.totalTasksCompleted++;

    if (qualityRating !== undefined) {
      // Update quality rating (weighted average)
      const totalRatings = user.totalTasksCompleted;
      user.qualityRating =
        (user.qualityRating * (totalRatings - 1) + qualityRating) / totalRatings;
    }

    // Calculate reliability score based on completion rate
    user.reliabilityScore = Math.min(100, user.reliabilityScore + 0.5);

    this.state.users.set(userId, user);
    await this.persistState();
  }

  // ==================== GAMIFICATION ====================

  private async checkAchievements(userId: string) {
    const user = this.state.users.get(userId);
    if (!user) return;

    const achievements: Achievement[] = [];

    // Check various achievement criteria
    if (user.totalTasksCompleted === 1) {
      achievements.push({
        id: 'first-task',
        name: 'Task Taker',
        description: 'Complete your first task',
        unlockedAt: Date.now()
      });
    }

    if (user.totalTasksCompleted === 10) {
      achievements.push({
        id: 'task-veteran',
        name: 'Task Veteran',
        description: 'Complete 10 tasks',
        unlockedAt: Date.now()
      });
    }

    if (user.totalTasksCompleted === 100) {
      achievements.push({
        id: 'task-master',
        name: 'Task Master',
        description: 'Complete 100 tasks',
        unlockedAt: Date.now()
      });
    }

    // Category-specific achievements
    const categoryCount = this.getCompletedTasksByCategory(userId);
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count === 10) {
        achievements.push({
          id: `${category}-hero`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Hero`,
          description: `Complete 10 ${category} tasks`,
          unlockedAt: Date.now()
        });
      }
    }

    // Add new achievements to user
    for (const achievement of achievements) {
      if (!user.achievements.find(a => a.id === achievement.id)) {
        user.achievements.push(achievement);
        await this.sendNotification({
          type: 'new_task',
          userId: userId,
          message: `Achievement unlocked: ${achievement.name}`,
          timestamp: Date.now()
        });
      }
    }

    await this.persistState();
  }

  private getCompletedTasksByCategory(userId: string): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const completedTask of this.state.completedTasks) {
      if (completedTask.winnerId === userId) {
        const task = this.state.tasks.get(completedTask.taskId);
        if (task && task.category) {
          counts[task.category] = (counts[task.category] || 0) + 1;
        }
      }
    }

    return counts;
  }

  private async updateLeaderboard() {
    const entries: LeaderboardEntry[] = [];

    for (const [userId, user] of this.state.users.entries()) {
      const balance = this.state.balances.get(userId) || this.getDefaultBalances();
      entries.push({
        userId: userId,
        userName: user.name,
        tasksCompleted: user.totalTasksCompleted,
        pointsEarned: balance.points,
        reliabilityScore: user.reliabilityScore,
        rank: 0
      });
    }

    // Sort by tasks completed, then by points
    entries.sort((a, b) => {
      if (a.tasksCompleted !== b.tasksCompleted) {
        return b.tasksCompleted - a.tasksCompleted;
      }
      return b.pointsEarned - a.pointsEarned;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.state.leaderboard = entries;
    await this.persistState();
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return this.state.leaderboard.slice(0, limit);
  }

  // ==================== SMART SCHEDULING ====================

  async getPredictedBidRange(taskId: string): Promise<{ min: number; max: number; average: number } | null> {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    // Find similar completed tasks
    const similarTasks = this.state.completedTasks.filter(ct => {
      const t = this.state.tasks.get(ct.taskId);
      return t && t.category === task.category && ct.paymentAmount.type === task.startingPayment.type;
    });

    if (similarTasks.length === 0) {
      return null;
    }

    const amounts = similarTasks.map(t => t.paymentAmount.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    return { min, max, average };
  }

  async getRecommendedTasks(userId: string): Promise<TaskDetails[]> {
    const user = this.state.users.get(userId);
    if (!user) return [];

    const activeTasks = Array.from(this.state.tasks.values())
      .filter(t => t.status === 'active');

    // Score tasks based on user preferences and history
    const scoredTasks = activeTasks.map(task => {
      let score = 0;

      // Prefer categories user has bid on before
      if (user.preferences.categoryPreferences?.includes(task.category || '')) {
        score += 10;
      }

      // Prefer tasks with payment types user likes
      const completedTasksByUser = this.state.completedTasks
        .filter(ct => ct.winnerId === userId);

      const preferredCurrency = this.getMostUsedCurrency(completedTasksByUser);
      if (task.currentBid.type === preferredCurrency) {
        score += 5;
      }

      // Prefer tasks ending soon
      const timeRemaining = task.endTime - Date.now();
      if (timeRemaining < 60 * 60 * 1000) { // Less than 1 hour
        score += 3;
      }

      return { task, score };
    });

    // Sort by score and return top tasks
    scoredTasks.sort((a, b) => b.score - a.score);
    return scoredTasks.slice(0, 10).map(st => st.task);
  }

  private getMostUsedCurrency(completedTasks: CompletedTask[]): string {
    const counts: Record<string, number> = {};

    for (const task of completedTasks) {
      counts[task.paymentAmount.type] = (counts[task.paymentAmount.type] || 0) + 1;
    }

    let maxCount = 0;
    let mostUsed = 'points';

    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = type;
      }
    }

    return mostUsed;
  }

  // ==================== CURRENCY & PAYMENT ====================

  private async processPayment(params: {
    fromUserId: string;
    toUserId: string;
    amount: Currency;
  }) {
    const fromBalance = this.state.balances.get(params.fromUserId) || this.getDefaultBalances();
    const toBalance = this.state.balances.get(params.toUserId) || this.getDefaultBalances();

    // Deduct from creator
    if (params.amount.type === 'cash') {
      fromBalance.cash -= params.amount.amount;
    } else if (params.amount.type === 'points') {
      fromBalance.points -= params.amount.amount;
    } else if (params.amount.type === 'favorTokens') {
      fromBalance.favorTokens -= params.amount.amount;
    } else if (params.amount.type === 'timeBank') {
      fromBalance.timeBank -= params.amount.amount;
    }

    // Add to winner
    if (params.amount.type === 'cash') {
      toBalance.cash += params.amount.amount;
    } else if (params.amount.type === 'points') {
      toBalance.points += params.amount.amount;
    } else if (params.amount.type === 'favorTokens') {
      toBalance.favorTokens += params.amount.amount;
    } else if (params.amount.type === 'timeBank') {
      toBalance.timeBank += params.amount.amount;
    }

    this.state.balances.set(params.fromUserId, fromBalance);
    this.state.balances.set(params.toUserId, toBalance);
  }

  async addBalance(params: {
    userId: string;
    currency: Currency;
  }): Promise<Balances> {
    const balance = this.state.balances.get(params.userId) || this.getDefaultBalances();

    if (params.currency.type === 'cash') {
      balance.cash += params.currency.amount;
    } else if (params.currency.type === 'points') {
      balance.points += params.currency.amount;
    } else if (params.currency.type === 'favorTokens') {
      balance.favorTokens += params.currency.amount;
    } else if (params.currency.type === 'timeBank') {
      balance.timeBank += params.currency.amount;
    }

    this.state.balances.set(params.userId, balance);
    await this.persistState();

    return balance;
  }

  // ==================== UTILITIES ====================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== NOTIFICATIONS ====================

  private async sendNotification(event: NotificationEvent) {
    // In a real implementation, this would send via WebSocket or push notification
    // For now, we'll just log it
    console.log('Notification:', event);
  }

  private async notifyUsersOfNewTask(task: TaskDetails) {
    // Notify all users with matching preferences
    for (const [userId, user] of this.state.users.entries()) {
      if (user.preferences.notificationSettings.newTasks) {
        if (!user.preferences.categoryPreferences ||
            user.preferences.categoryPreferences.includes(task.category || '')) {
          await this.sendNotification({
            type: 'new_task',
            userId: userId,
            taskId: task.id,
            message: `New task posted: ${task.title}`,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  // ==================== STATE PERSISTENCE ====================

  private async persistState() {
    const serialized = this.serializeState();
    await this.sql`
      INSERT INTO state (id, data, updated_at)
      VALUES (1, ${serialized}, ${Date.now()})
      ON CONFLICT (id) DO UPDATE SET data = ${serialized}, updated_at = ${Date.now()}
    `;
  }

  private serializeState(): string {
    return JSON.stringify({
      tasks: Array.from(this.state.tasks.entries()),
      bids: Array.from(this.state.bids.entries()),
      users: Array.from(this.state.users.entries()),
      balances: Array.from(this.state.balances.entries()),
      completedTasks: this.state.completedTasks,
      leaderboard: this.state.leaderboard
    });
  }

  private deserializeState(data: string): AuctionState {
    const parsed = JSON.parse(data);
    return {
      tasks: new Map(parsed.tasks),
      bids: new Map(parsed.bids),
      users: new Map(parsed.users),
      balances: new Map(parsed.balances),
      completedTasks: parsed.completedTasks,
      leaderboard: parsed.leaderboard
    };
  }
}
