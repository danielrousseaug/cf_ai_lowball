'use client';

import { useUserTasks, useUserBalance } from '@/hooks/use-user';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from '@/components/features/tasks/task-card';
import { formatCurrency } from '@/lib/utils';

const MOCK_USER_ID = 'test-user-1';

export default function DashboardPage() {
  const { data: tasks } = useUserTasks(MOCK_USER_ID);
  const { data: balance } = useUserBalance(MOCK_USER_ID);

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency({ type: 'cash', amount: balance.cash })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency({ type: 'points', amount: balance.points })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Favor Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency({ type: 'favorTokens', amount: balance.favorTokens })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Time Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency({ type: 'timeBank', amount: balance.timeBank })}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tasks && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Tasks ({tasks.created?.length || 0})</h2>
            {tasks.created?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.created.map((task: any) => <TaskCard key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-gray-600">No tasks created yet</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Won Tasks ({tasks.won?.length || 0})</h2>
            {tasks.won?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.won.map((task: any) => <TaskCard key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-gray-600">No won tasks yet</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Bids ({tasks.bidding?.length || 0})</h2>
            {tasks.bidding?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.bidding.map((task: any) => <TaskCard key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-gray-600">No active bids</p>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
