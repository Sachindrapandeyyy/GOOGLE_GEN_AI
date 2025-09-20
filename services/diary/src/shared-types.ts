// Shared types for Sukoon AI MVP services

export interface BaseEvent {
  userId: string;
  createdAt: string; // ISO8601 timestamp
  textUri?: string;  // GCS URI for text content
  lang?: string;     // Language code (e.g., 'en', 'hi')
}

export interface DiaryEntry extends BaseEvent {
  entryId: string;
  text?: string;
}

export interface ChatTurn extends BaseEvent {
  chatId: string;
  turnId: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface MoodEvent extends BaseEvent {
  eventId: string;
  moodScore: number; // 1.0 to 10.0
  notes?: string;
}

export interface RiskFlag extends BaseEvent {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  escalated: boolean;
  escalationId?: string;
}

export interface NotificationEvent {
  userId: string;
  notificationId: string;
  type: 'risk_escalation' | 'follow_up' | 'reminder';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

// Pub/Sub message schemas
export interface PubSubMessage<T = any> {
  data: string; // Base64 encoded JSON
  attributes?: Record<string, string>;
  messageId: string;
  publishTime: string;
}

// Event payloads for Pub/Sub
export interface DiarySavedEvent extends BaseEvent {
  entryId: string;
}

export interface ChatSavedEvent extends BaseEvent {
  chatId: string;
  turnId: string;
  riskLevel?: string;
}

export interface MoodLoggedEvent extends BaseEvent {
  eventId: string;
  moodScore: number;
  notes?: string;
}

export interface RiskFlaggedEvent extends BaseEvent {
  riskLevel: string;
  reason: string;
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
}

// Configuration types
export interface ServiceConfig {
  port: number;
  firestore: {
    projectId: string;
    emulatorHost?: string;
  };
  pubsub: {
    projectId: string;
    emulatorHost?: string;
  };
  storage: {
    bucketName: string;
  };
  kms: {
    keyRing: string;
    keyName: string;
  };
  vertex: {
    projectId: string;
    location: string;
    model: string;
  };
}

// Error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Validation helpers
export const isValidUserId = (userId: string): boolean => {
  return /^[a-zA-Z0-9_-]{20,40}$/.test(userId);
};

export const isValidTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
};

export const isValidMoodScore = (score: number): boolean => {
  return score >= 1.0 && score <= 10.0;
};
