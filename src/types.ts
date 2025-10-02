// Type definitions for the Reverse Auction Coordinator

export type CurrencyType = 'cash' | 'points' | 'favorTokens' | 'timeBank';

export interface Currency {
  type: CurrencyType;
  amount: number;
}

export interface TaskDetails {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  startingPayment: Currency;
  currentBid: Currency;
  auctionType: 'standard' | 'dutch' | 'buyItNow';
  buyItNowPrice?: Currency;
  dutchDecreaseRate?: number; // Amount to decrease per hour for dutch auctions
  duration: number; // Duration in milliseconds
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  status: 'active' | 'completed' | 'cancelled' | 'in-progress';
  winnerId?: string;
  verificationRequired: boolean;
  verificationMethod?: 'photo' | 'peer' | 'auto';
  category?: string;
  tags?: string[];
}

export interface Bid {
  id: string;
  taskId: string;
  userId: string;
  amount: Currency;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  reliabilityScore: number; // 0-100
  qualityRating: number; // 0-5
  totalTasksCompleted: number;
  totalTasksCreated: number;
  bidHistory: string[]; // Array of bid IDs
  achievements: Achievement[];
  preferences: UserPreferences;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number;
  icon?: string;
}

export interface UserPreferences {
  autoMaxBid?: Currency;
  categoryPreferences?: string[];
  notificationSettings: {
    outbid: boolean;
    newTasks: boolean;
    taskReminders: boolean;
  };
}

export interface Balances {
  cash: number;
  points: number;
  favorTokens: number;
  timeBank: number; // in minutes
}

export interface CompletedTask {
  taskId: string;
  winnerId: string;
  creatorId: string;
  completedAt: number;
  paymentAmount: Currency;
  qualityRating?: number;
  feedback?: string;
  verified: boolean;
}

export interface AuctionState {
  tasks: Map<string, TaskDetails>;
  bids: Map<string, Bid[]>; // taskId -> array of bids
  users: Map<string, UserProfile>;
  balances: Map<string, Balances>;
  completedTasks: CompletedTask[];
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  tasksCompleted: number;
  pointsEarned: number;
  reliabilityScore: number;
  rank: number;
}

export interface NotificationEvent {
  type: 'outbid' | 'won' | 'new_task' | 'task_ending' | 'task_completed';
  userId: string;
  taskId?: string;
  message: string;
  timestamp: number;
}
