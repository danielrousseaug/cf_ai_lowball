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
