import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useChatHistory(userId: string) {
  return useQuery({
    queryKey: ['chat-history', userId],
    queryFn: () => api.chat.getHistory(userId),
    enabled: !!userId,
    refetchInterval: false, // Disable auto-refetch for better performance
    staleTime: Infinity, // Keep data fresh until manual invalidation
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; message: string }) =>
      api.chat.send(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', variables.userId] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.chat.clearHistory(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', userId] });
    },
  });
}
