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
