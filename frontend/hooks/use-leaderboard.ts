import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => api.leaderboard.get(limit),
  });
}
