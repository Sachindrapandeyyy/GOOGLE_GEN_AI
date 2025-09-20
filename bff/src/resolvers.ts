import axios from 'axios';

interface Context {
  userId?: string;
  correlationId: string;
}

// Service URLs
const SERVICES = {
  diary: process.env.DIARY_SERVICE_URL || 'http://localhost:8081',
  chat: process.env.CHAT_SERVICE_URL || 'http://localhost:8082',
  mood: process.env.MOOD_SERVICE_URL || 'http://localhost:8083',
  triage: process.env.TRIAGE_SERVICE_URL || 'http://localhost:8084',
  insights: process.env.INSIGHTS_SERVICE_URL || 'http://localhost:8085'
};

export const resolvers = {
  Query: {
    // Diary queries
    diaryEntries: async (_: any, { userId, limit, offset }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.diary}/users/${userId}/entries`, {
          params: { limit, offset },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data || [];
      } catch (error: any) {
        console.error('Diary service error:', error.message);
        return [];
      }
    },

    diaryEntry: async (_: any, { userId, entryId }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.diary}/users/${userId}/entries/${entryId}`, {
          params: { includeText: true },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Diary service error:', error.message);
        return null;
      }
    },

    // Chat queries
    chatHistory: async (_: any, { userId, chatId, limit }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.chat}/users/${userId}/chats/${chatId}`, {
          params: { limit },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data || [];
      } catch (error: any) {
        console.error('Chat service error:', error.message);
        return [];
      }
    },

    userChats: async (_: any, { userId, limit }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.chat}/users/${userId}/chats`, {
          params: { limit },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data || [];
      } catch (error: any) {
        console.error('Chat service error:', error.message);
        return [];
      }
    },

    // Mood queries
    moodHistory: async (_: any, { userId, limit, startDate, endDate }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.mood}/users/${userId}/mood`, {
          params: { limit, startDate, endDate },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data || [];
      } catch (error: any) {
        console.error('Mood service error:', error.message);
        return [];
      }
    },

    moodStats: async (_: any, { userId, days }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.mood}/users/${userId}/mood/stats`, {
          params: { days },
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Mood service error:', error.message);
        return { count: 0, average: 0, min: 0, max: 0, trend: 'stable' };
      }
    },

    // Insights queries
    userInsights: async (_: any, { userId }: any, context: Context) => {
      try {
        const response = await axios.get(`${SERVICES.insights}/users/${userId}/insights`, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Insights service error:', error.message);
        return null;
      }
    },

    // Health check
    health: async () => {
      try {
        const services = {
          diary: await checkService(`${SERVICES.diary}/health`),
          chat: await checkService(`${SERVICES.chat}/health`),
          mood: await checkService(`${SERVICES.mood}/health`),
          triage: await checkService(`${SERVICES.triage}/health`),
          insights: await checkService(`${SERVICES.insights}/health`)
        };

        const allHealthy = Object.values(services).every(service => service === 'healthy');

        return {
          status: allHealthy ? 'healthy' : 'degraded',
          services,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          services: {},
          timestamp: new Date().toISOString()
        };
      }
    }
  },

  Mutation: {
    // Diary mutations
    createDiaryEntry: async (_: any, { input }: any, context: Context) => {
      try {
        const response = await axios.post(`${SERVICES.diary}/entries`, input, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Diary service error:', error.message);
        throw new Error(`Failed to create diary entry: ${error.response?.data?.error || error.message}`);
      }
    },

    updateDiaryEntry: async (_: any, { userId, entryId, input }: any, context: Context) => {
      try {
        const response = await axios.put(`${SERVICES.diary}/users/${userId}/entries/${entryId}`, input, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Diary service error:', error.message);
        throw new Error(`Failed to update diary entry: ${error.response?.data?.error || error.message}`);
      }
    },

    deleteDiaryEntry: async (_: any, { userId, entryId }: any, context: Context) => {
      try {
        await axios.delete(`${SERVICES.diary}/users/${userId}/entries/${entryId}`, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return true;
      } catch (error: any) {
        console.error('Diary service error:', error.message);
        return false;
      }
    },

    // Chat mutations
    sendChatMessage: async (_: any, { input }: any, context: Context) => {
      try {
        const response = await axios.post(`${SERVICES.chat}/chat`, input, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Chat service error:', error.message);
        throw new Error(`Failed to send chat message: ${error.response?.data?.error || error.message}`);
      }
    },

    // Mood mutations
    logMood: async (_: any, { input }: any, context: Context) => {
      try {
        const response = await axios.post(`${SERVICES.mood}/mood`, input, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Mood service error:', error.message);
        throw new Error(`Failed to log mood: ${error.response?.data?.error || error.message}`);
      }
    },

    updateMood: async (_: any, { userId, eventId, input }: any, context: Context) => {
      try {
        const response = await axios.put(`${SERVICES.mood}/users/${userId}/mood/${eventId}`, input, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Mood service error:', error.message);
        throw new Error(`Failed to update mood: ${error.response?.data?.error || error.message}`);
      }
    },

    deleteMood: async (_: any, { userId, eventId }: any, context: Context) => {
      try {
        await axios.delete(`${SERVICES.mood}/users/${userId}/mood/${eventId}`, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return true;
      } catch (error: any) {
        console.error('Mood service error:', error.message);
        return false;
      }
    },

    // Insights mutations
    generateInsights: async (_: any, { userId }: any, context: Context) => {
      try {
        const response = await axios.post(`${SERVICES.insights}/users/${userId}/insights/generate`, {}, {
          headers: { 'x-correlation-id': context.correlationId }
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Insights service error:', error.message);
        throw new Error(`Failed to generate insights: ${error.response?.data?.error || error.message}`);
      }
    }
  },

  // Field resolvers for complex types
  DiaryEntry: {
    text: async (parent: any) => {
      // In a real implementation, you'd fetch text from storage
      // For now, return a placeholder
      return parent.text || '[Text content would be loaded from storage]';
    }
  },

  ChatTurn: {
    text: async (parent: any) => {
      // In a real implementation, you'd fetch text from storage
      return parent.text || '[Text content would be loaded from storage]';
    }
  }
};

async function checkService(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.data.status === 'healthy' ? 'healthy' : 'unhealthy';
  } catch (error) {
    return 'unreachable';
  }
}
