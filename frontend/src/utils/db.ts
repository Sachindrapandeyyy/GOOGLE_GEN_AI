import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DiaryEntry, MoodEntry, ChatConversation } from '../store';
import { encryptObject, decryptObject } from './crypto';

// Define the database schema
interface SukoonDB extends DBSchema {
  diaryEntries: {
    key: string;
    value: {
      id: string;
      encryptedData: string;
      createdAt: string;
      updatedAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string };
  };
  moodEntries: {
    key: string;
    value: {
      id: string;
      encryptedData: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      encryptedData: string;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { 'by-date': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      endpoint: string;
      method: string;
      data: any;
      timestamp: string;
    };
  };
}

// Database connection
let dbPromise: Promise<IDBPDatabase<SukoonDB>> | null = null;

// Initialize the database
export async function initDB(): Promise<IDBPDatabase<SukoonDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SukoonDB>('sukoon-db', 1, {
      upgrade(db) {
        // Diary entries store
        const diaryStore = db.createObjectStore('diaryEntries', { keyPath: 'id' });
        diaryStore.createIndex('by-date', 'createdAt');

        // Mood entries store
        const moodStore = db.createObjectStore('moodEntries', { keyPath: 'id' });
        moodStore.createIndex('by-date', 'createdAt');

        // Conversations store
        const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
        conversationsStore.createIndex('by-date', 'updatedAt');

        // Sync queue store
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

// Diary Entry Operations
export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const db = await initDB();
  const encryptedData = await encryptObject({
    content: entry.content,
  });

  await db.put('diaryEntries', {
    id: entry.id,
    encryptedData,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    synced: entry.synced,
  });
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await initDB();
  const entries = await db.getAllFromIndex('diaryEntries', 'by-date');
  
  const decryptedEntries = await Promise.all(
    entries.map(async (entry) => {
      const decrypted = await decryptObject<{ content: string }>(entry.encryptedData);
      return {
        id: entry.id,
        content: decrypted.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        synced: entry.synced,
      };
    })
  );
  
  return decryptedEntries;
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('diaryEntries', id);
}

// Mood Entry Operations
export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  const db = await initDB();
  const encryptedData = await encryptObject({
    score: entry.score,
    notes: entry.notes,
  });

  await db.put('moodEntries', {
    id: entry.id,
    encryptedData,
    createdAt: entry.createdAt,
    synced: entry.synced,
  });
}

export async function getMoodEntries(): Promise<MoodEntry[]> {
  const db = await initDB();
  const entries = await db.getAllFromIndex('moodEntries', 'by-date');
  
  const decryptedEntries = await Promise.all(
    entries.map(async (entry) => {
      const decrypted = await decryptObject<{ score: number; notes?: string }>(entry.encryptedData);
      return {
        id: entry.id,
        score: decrypted.score,
        notes: decrypted.notes,
        createdAt: entry.createdAt,
        synced: entry.synced,
      };
    })
  );
  
  return decryptedEntries;
}

// Chat Conversation Operations
export async function saveConversation(conversation: ChatConversation): Promise<void> {
  const db = await initDB();
  const encryptedData = await encryptObject({
    title: conversation.title,
    messages: conversation.messages,
  });

  await db.put('conversations', {
    id: conversation.id,
    encryptedData,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  });
}

export async function getConversations(): Promise<ChatConversation[]> {
  const db = await initDB();
  const conversations = await db.getAllFromIndex('conversations', 'by-date');
  
  const decryptedConversations = await Promise.all(
    conversations.map(async (conversation) => {
      const decrypted = await decryptObject<{ title: string; messages: any[] }>(conversation.encryptedData);
      return {
        id: conversation.id,
        title: decrypted.title,
        messages: decrypted.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    })
  );
  
  return decryptedConversations;
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('conversations', id);
}

// Sync Queue Operations
export async function addToSyncQueue(endpoint: string, method: string, data: any): Promise<void> {
  const db = await initDB();
  await db.add('syncQueue', {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    endpoint,
    method,
    data,
    timestamp: new Date().toISOString(),
  });
}

export async function getSyncQueue(): Promise<any[]> {
  const db = await initDB();
  return db.getAll('syncQueue');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('syncQueue', id);
}

// Initialize the database when the module is imported
initDB().catch(console.error);
