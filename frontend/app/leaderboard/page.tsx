'use client';

import { useLeaderboard } from '@/hooks/use-leaderboard';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderboardPage() {
  const { data: leaderboard } = useLeaderboard(20);

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tasks Completed</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Points</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry: any, index: number) => (
                    <tr key={entry.userId} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">#{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{entry.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{entry.tasksCompleted}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{entry.pointsEarned}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{entry.reliabilityScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No leaderboard data available yet</p>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
