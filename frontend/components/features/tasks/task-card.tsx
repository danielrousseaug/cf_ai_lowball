'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { TaskDetails } from '@/lib/types';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: TaskDetails;
}

export function TaskCard({ task }: TaskCardProps) {
  const timeRemaining = formatTimeRemaining(task.endTime);
  const isEnding = useMemo(() => task.endTime - Date.now() < 3600000, [task.endTime]); // Less than 1 hour

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>{task.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {task.description}
            </CardDescription>
          </div>
          <Badge variant={task.status === 'active' ? 'success' : 'default'}>
            {task.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Bid</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(task.currentBid)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Time Remaining</span>
            <span className={`font-medium ${isEnding ? 'text-amber-600' : 'text-gray-900'}`}>
              {timeRemaining}
            </span>
          </div>

          {task.category && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Category:</span>
              <Badge variant="default">{task.category}</Badge>
            </div>
          )}

          {task.auctionType !== 'standard' && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="info">
                {task.auctionType === 'dutch' ? 'Dutch Auction' : 'Buy It Now'}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/tasks/${task.id}`} className="w-full">
          <Button variant="secondary" className="w-full">
            View & Bid
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
