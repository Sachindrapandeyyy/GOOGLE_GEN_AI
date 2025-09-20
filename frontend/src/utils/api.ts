import axios from 'axios';

// Base API client
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include user ID from localStorage
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('sukoon-user-id');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle offline state
    if (!navigator.onLine) {
      // Queue request for later
      queueRequest(error.config);
      return Promise.reject({ isOffline: true, message: 'You are offline. Request will be sent when you reconnect.' });
    }
    
    return Promise.reject(error);
  }
);

// Request queue for offline mode
const requestQueue: any[] = [];

// Queue a request for when online
function queueRequest(config: any) {
  requestQueue.push(config);
}

// Process queued requests when back online
window.addEventListener('online', async () => {
  while (requestQueue.length > 0) {
    const config = requestQueue.shift();
    try {
      await apiClient(config);
    } catch (error) {
      console.error('Failed to process queued request:', error);
    }
  }
});

// API endpoints
const api = {
  // Diary API
  diary: {
    getAll: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/diary`);
      return response.data;
    },
    get: async (userId: string, entryId: string) => {
      const response = await apiClient.get(`/users/${userId}/diary/${entryId}`);
      return response.data;
    },
    create: async (userId: string, content: string) => {
      const response = await apiClient.post('/diary', { userId, text: content });
      return response.data;
    },
    update: async (userId: string, entryId: string, content: string) => {
      const response = await apiClient.put(`/users/${userId}/diary/${entryId}`, { text: content });
      return response.data;
    },
    delete: async (userId: string, entryId: string) => {
      const response = await apiClient.delete(`/users/${userId}/diary/${entryId}`);
      return response.data;
    },
  },
  
  // Chat API
  chat: {
    send: async (userId: string, message: string, chatId?: string) => {
      const response = await apiClient.post('/chat', { userId, message, chatId });
      return response.data;
    },
    getHistory: async (userId: string, chatId: string) => {
      const response = await apiClient.get(`/users/${userId}/chats/${chatId}`);
      return response.data;
    },
    getUserChats: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/chats`);
      return response.data;
    },
  },
  
  // Mood API
  mood: {
    log: async (userId: string, moodScore: number, notes?: string) => {
      const response = await apiClient.post('/mood', { userId, moodScore, notes });
      return response.data;
    },
    getHistory: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/mood`);
      return response.data;
    },
    getStats: async (userId: string, days: number = 30) => {
      const response = await apiClient.get(`/users/${userId}/mood/stats`, { params: { days } });
      return response.data;
    },
  },
  
  // Insights API
  insights: {
    get: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/insights`);
      return response.data;
    },
    generate: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/insights/generate`);
      return response.data;
    },
  },
  
  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
