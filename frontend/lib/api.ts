// API client for Cloudflare Workers backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://reverse-auction-coordinator.danielrousseaug.workers.dev';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Tasks
  tasks: {
    getAll: () => fetchAPI<any[]>('/api/tasks'),
    getById: (id: string) => fetchAPI<any>(`/api/tasks/${id}`),
    create: (data: any) => fetchAPI<any>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getBids: (taskId: string) => fetchAPI<any[]>(`/api/tasks/${taskId}/bids`),
    getPredictions: (taskId: string) => fetchAPI<any>(`/api/tasks/${taskId}/predictions`),
  },

  // Bids
  bids: {
    place: (data: any) => fetchAPI<any>('/api/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    buyNow: (data: any) => fetchAPI<any>('/api/tasks/buy-now', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Users
  users: {
    create: (data: any) => fetchAPI<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getProfile: (userId: string) => fetchAPI<any>(`/api/users/${userId}`),
    getBalance: (userId: string) => fetchAPI<any>(`/api/users/${userId}/balance`),
    addBalance: (data: any) => fetchAPI<any>('/api/balance/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getTasks: (userId: string) => fetchAPI<any>(`/api/users/${userId}/tasks`),
    getRecommendations: (userId: string) => fetchAPI<any>(`/api/users/${userId}/recommendations`),
  },

  // Leaderboard
  leaderboard: {
    get: (limit = 10) => fetchAPI<any[]>(`/api/leaderboard?limit=${limit}`),
  },

  // Chat
  chat: {
    send: (data: any) => fetchAPI<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getHistory: (userId: string) => fetchAPI<any[]>(`/api/chat/${userId}/history`),
    clearHistory: (userId: string) => fetchAPI<any>(`/api/chat/${userId}/history`, {
      method: 'DELETE',
    }),
  },

  // Task completion
  tasks_complete: (data: any) => fetchAPI<any>('/api/tasks/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
