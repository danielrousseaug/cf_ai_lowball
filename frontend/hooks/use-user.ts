import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.users.getProfile(userId),
    enabled: !!userId,
  });
}

export function useUserBalance(userId: string) {
  return useQuery({
    queryKey: ['user-balance', userId],
    queryFn: () => api.users.getBalance(userId),
    enabled: !!userId,
  });
}

export function useUserTasks(userId: string) {
  return useQuery({
    queryKey: ['user-tasks', userId],
    queryFn: () => api.users.getTasks(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; name: string; email: string }) =>
      api.users.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}

export function useAddBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; currency: any }) =>
      api.users.addBalance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-balance', variables.userId] });
    },
  });
}
