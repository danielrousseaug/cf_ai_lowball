'use client';

import { use } from 'react';
import { useTask, useTaskBids } from '@/hooks/use-tasks';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BidForm } from '@/components/features/tasks/bid-form';
import { formatCurrency, formatTimeRemaining, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

const MOCK_USER_ID = 'test-user-1';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: task, isLoading } = useTask(resolvedParams.id);
  const { data: bids } = useTaskBids(resolvedParams.id);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="bg-white border border-gray-200 h-96 animate-pulse" />
      </Container>
    );
  }

  if (!task) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← Back to tasks
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
        ← Back to tasks
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={task.status === 'active' ? 'success' : 'default'}>
                      {task.status}
                    </Badge>
                    {task.category && <Badge variant="default">{task.category}</Badge>}
                    {task.auctionType !== 'standard' && (
                      <Badge variant="info">
                        {task.auctionType === 'dutch' ? 'Dutch Auction' : 'Buy It Now'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{task.description}</p>
              </div>

              {task.verificationRequired && (
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm text-gray-700">
                    ✓ Verification required ({task.verificationMethod})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {bids && bids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bid History ({bids.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bids.map((bid: any) => (
                    <div key={bid.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(bid.amount)}</p>
                        <p className="text-sm text-gray-500">{formatRelativeTime(bid.timestamp)}</p>
                      </div>
                      <Badge variant="default" className="text-xs">Bid</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Bid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(task.currentBid)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Starting: {formatCurrency(task.startingPayment)}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Time Remaining</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTimeRemaining(task.endTime)}
                </p>
              </div>

              {task.buyItNowPrice && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1">Buy It Now Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(task.buyItNowPrice)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Place Your Bid</CardTitle>
            </CardHeader>
            <CardContent>
              <BidForm task={task} userId={MOCK_USER_ID} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
