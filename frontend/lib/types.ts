// Shared types matching the backend API

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
  dutchDecreaseRate?: number;
  duration: number;
  startTime: number;
  endTime: number;
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
  reliabilityScore: number;
  qualityRating: number;
  totalTasksCompleted: number;
  totalTasksCreated: number;
  bidHistory: string[];
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
  timeBank: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  tasksCompleted: number;
  pointsEarned: number;
  reliabilityScore: number;
  rank: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UserTasks {
  created: TaskDetails[];
  won: TaskDetails[];
  bidding: TaskDetails[];
}
