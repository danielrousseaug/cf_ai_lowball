'use client';

import { useState } from 'react';
import { usePlaceBid } from '@/hooks/use-tasks';
import { TaskDetails } from '@/lib/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BidFormProps {
  task: TaskDetails;
  userId: string;
}

export function BidForm({ task, userId }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState('');
  const placeBid = usePlaceBid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    if (amount >= task.currentBid.amount) {
      alert(`Bid must be lower than current bid (${formatCurrency(task.currentBid)})`);
      return;
    }

    try {
      await placeBid.mutateAsync({
        taskId: task.id,
        userId,
        amount: {
          type: task.currentBid.type,
          amount,
        },
      });
      setBidAmount('');
      alert('Bid placed successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to place bid');
    }
  };

  if (task.status !== 'active') {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bid-amount" className="block text-sm font-medium text-gray-700 mb-2">
          Your Bid (must be lower than {formatCurrency(task.currentBid)})
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="bid-amount"
              type="number"
              step="0.01"
              min="0"
              max={task.currentBid.amount - 1}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Enter amount (${getCurrencySymbol(task.currentBid.type)})`}
              required
            />
          </div>
          <Button
            type="submit"
            isLoading={placeBid.isPending}
            disabled={!bidAmount || parseFloat(bidAmount) >= task.currentBid.amount}
          >
            Place Bid
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          In reverse auctions, the lowest bidder wins
        </p>
      </div>
    </form>
  );
}
