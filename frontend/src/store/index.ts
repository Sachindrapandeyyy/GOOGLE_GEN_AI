import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface DiaryEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id: string;
  score: number;
  notes?: string;
  createdAt: string;
  synced: boolean;
}

export interface UserState {
  userId: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
}

export interface AppState {
  // User state
  user: UserState;
  generateUserId: () => void;
  setOnboarded: (onboarded: boolean) => void;
  
  // Diary state
  diaryEntries: DiaryEntry[];
  currentDraft: string;
  addDiaryEntry: (content: string) => Promise<DiaryEntry>;
  updateDiaryEntry: (id: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
  setCurrentDraft: (content: string) => void;
  
  // Chat state
  conversations: ChatConversation[];
  currentConversationId: string | null;
  addConversation: () => void;
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  setCurrentConversation: (id: string | null) => void;
  
  // Mood state
  moodEntries: MoodEntry[];
  addMoodEntry: (score: number, notes?: string) => Promise<MoodEntry>;
  
  // App state
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
  
  // UI state
  isNavOpen: boolean;
  toggleNav: () => void;
}

// Create store
const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: {
        userId: null,
        isAuthenticated: false,
        isOnboarded: false,
      },
      generateUserId: () => {
        const userId = uuidv4().replace(/-/g, '').substring(0, 28);
        set((state) => ({
          user: {
            ...state.user,
            userId,
            isAuthenticated: true,
          }
        }));
        localStorage.setItem('sukoon-user-id', userId);
      },
      setOnboarded: (onboarded) => {
        set((state) => ({
          user: {
            ...state.user,
            isOnboarded: onboarded,
          }
        }));
      },
      
      // Diary state
      diaryEntries: [],
      currentDraft: '',
      addDiaryEntry: async (content) => {
        const newEntry: DiaryEntry = {
          id: uuidv4(),
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: navigator.onLine,
        };
        
        set((state) => ({
          diaryEntries: [newEntry, ...state.diaryEntries],
          currentDraft: '',
        }));
        
        // Try to sync with server if online
        if (navigator.onLine) {
          try {
            // API call would go here
            // const response = await api.diary.create(newEntry);
            // Update with server response if needed
          } catch (error) {
            console.error('Failed to sync diary entry:', error);
            // Mark as unsynced
            set((state) => ({
              diaryEntries: state.diaryEntries.map(entry => 
                entry.id === newEntry.id ? { ...entry, synced: false } : entry
              )
            }));
          }
        }
        
        return newEntry;
      },
      updateDiaryEntry: (id, content) => {
        set((state) => ({
          diaryEntries: state.diaryEntries.map(entry => 
            entry.id === id 
              ? { 
                  ...entry, 
                  content, 
                  updatedAt: new Date().toISOString(),
                  synced: false
                } 
              : entry
          )
        }));
      },
      deleteDiaryEntry: (id) => {
        set((state) => ({
          diaryEntries: state.diaryEntries.filter(entry => entry.id !== id)
        }));
      },
      setCurrentDraft: (content) => {
        set({ currentDraft: content });
      },
      
      // Chat state
      conversations: [],
      currentConversationId: null,
      addConversation: () => {
        const newConversation: ChatConversation = {
          id: uuidv4(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
        }));
      },
      addMessage: (content, role) => {
        const { currentConversationId, conversations } = get();
        
        if (!currentConversationId) {
          // Create a new conversation if none exists
          const conversationId = uuidv4();
          const newMessage: ChatMessage = {
            id: uuidv4(),
            content,
            role,
            timestamp: new Date().toISOString(),
          };
          
          const newConversation: ChatConversation = {
            id: conversationId,
            title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
            messages: [newMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            conversations: [newConversation, ...state.conversations],
            currentConversationId: conversationId,
          }));
          
          return;
        }
        
        const newMessage: ChatMessage = {
          id: uuidv4(),
          content,
          role,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          conversations: state.conversations.map(conv => 
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                }
              : conv
          )
        }));
      },
      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },
      
      // Mood state
      moodEntries: [],
      addMoodEntry: async (score, notes) => {
        const newEntry: MoodEntry = {
          id: uuidv4(),
          score,
          notes,
          createdAt: new Date().toISOString(),
          synced: navigator.onLine,
        };
        
        set((state) => ({
          moodEntries: [newEntry, ...state.moodEntries],
        }));
        
        // Try to sync with server if online
        if (navigator.onLine) {
          try {
            // API call would go here
            // const response = await api.mood.create(newEntry);
            // Update with server response if needed
          } catch (error) {
            console.error('Failed to sync mood entry:', error);
            // Mark as unsynced
            set((state) => ({
              moodEntries: state.moodEntries.map(entry => 
                entry.id === newEntry.id ? { ...entry, synced: false } : entry
              )
            }));
          }
        }
        
        return newEntry;
      },
      
      // App state
      isOffline: !navigator.onLine,
      setOfflineStatus: (status) => {
        set({ isOffline: status });
      },
      
      // UI state
      isNavOpen: false,
      toggleNav: () => {
        set((state) => ({ isNavOpen: !state.isNavOpen }));
      },
    }),
    {
      name: 'sukoon-storage',
      partialize: (state) => ({
        user: state.user,
        diaryEntries: state.diaryEntries,
        conversations: state.conversations,
        moodEntries: state.moodEntries,
      }),
    }
  )
);

export default useStore;
