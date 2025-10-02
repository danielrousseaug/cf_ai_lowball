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
  duration: number; // Duration in milliseconds
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  status: 'active' | 'completed' | 'cancelled' | 'in-progress';
}

export interface Bid {
  id: string;
  taskId: string;
  userId: string;
  amount: Currency;
  timestamp: number;
}
