import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, Timestamp, FieldValue } from '@google-cloud/firestore';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

import {
  ChatTurn,
  ChatSavedEvent,
  ServiceConfig,
  ServiceResponse,
  ServiceError,
  isValidUserId
} from './shared-types';

interface ChatRequest {
  userId: string;
  message: string;
  chatId?: string;
  lang?: string;
}

interface ChatResponse {
  chatId: string;
  turnId: string;
  userMessage: string;
  aiResponse: string;
  riskLevel?: string;
  createdAt: string;
}

class ChatService {
  private app: express.Application;
  private firestore: Firestore;
  private pubsub: PubSub;
  private storage: Storage;
  private vertexClient: PredictionServiceClient;
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.app = express();
    this.firestore = new Firestore({
      projectId: config.firestore.projectId,
      ...(config.firestore.emulatorHost && {
        host: config.firestore.emulatorHost,
        ssl: false
      })
    });
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
      ...(config.pubsub.emulatorHost && {
        apiEndpoint: config.pubsub.emulatorHost
      })
    });
    this.storage = new Storage({
      projectId: config.firestore.projectId
    });
    this.vertexClient = new PredictionServiceClient({
      projectId: config.vertex.projectId,
      apiEndpoint: `${config.vertex.location}-aiplatform.googleapis.com`
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'chat-service' });
    });

    // Send chat message
    this.app.post('/chat', this.sendMessage.bind(this));

    // Get chat history
    this.app.get('/users/:userId/chats/:chatId', this.getChatHistory.bind(this));

    // Get user's chats
    this.app.get('/users/:userId/chats', this.getUserChats.bind(this));
  }

  private async sendMessage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, message, chatId, lang = 'en' }: ChatRequest = req.body;

      // Validation
      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new ServiceError('Message is required', 'MISSING_MESSAGE', 400);
      }

      if (message.length > 5000) {
        throw new ServiceError('Message too long', 'MESSAGE_TOO_LONG', 400);
      }

      // Sanitize input
      const sanitizedMessage = this.sanitizeInput(message);

      // Assess risk level
      const riskLevel = await this.assessRisk(sanitizedMessage);

      // If high risk, don't proceed with AI response
      if (riskLevel === 'critical') {
        await this.handleCriticalRisk(userId, sanitizedMessage, riskLevel);
        throw new ServiceError('Message flagged for safety review', 'CRITICAL_RISK', 403);
      }

      // Generate chat ID if not provided
      const finalChatId = chatId || uuidv4();
      const turnId = uuidv4();
      const createdAt = new Date().toISOString();

      // Store user message
      await this.storeChatTurn(userId, finalChatId, turnId, 'user', sanitizedMessage, createdAt, lang);

      let aiResponse = '';
      let finalRiskLevel = riskLevel;

      // Generate AI response if not high risk
      if (riskLevel !== 'high') {
        try {
          aiResponse = await this.generateAIResponse(sanitizedMessage, userId, finalChatId, lang);

          // Re-assess risk of AI response
          const responseRiskLevel = await this.assessRisk(aiResponse);
          finalRiskLevel = this.combineRiskLevels(riskLevel, responseRiskLevel);

          // Store AI response
          const aiTurnId = uuidv4();
          await this.storeChatTurn(userId, finalChatId, aiTurnId, 'assistant', aiResponse, createdAt, lang);
        } catch (aiError) {
          console.error('AI generation error:', aiError);
          aiResponse = 'I apologize, but I\'m unable to respond right now. Please try again later.';
        }
      }

      // Create response object
      const response: ChatResponse = {
        chatId: finalChatId,
        turnId,
        userMessage: sanitizedMessage,
        aiResponse,
        riskLevel: finalRiskLevel,
        createdAt
      };

      // Publish chat saved event
      await this.publishChatSavedEvent({
        userId,
        chatId: finalChatId,
        turnId,
        createdAt,
        textUri: '', // Will be set by storage operation
        lang,
        riskLevel: finalRiskLevel
      });

      const serviceResponse: ServiceResponse<ChatResponse> = {
        success: true,
        data: response
      };

      res.status(200).json(serviceResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getChatHistory(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, chatId } = req.params;
      const { limit = '50' } = req.query;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('chats')
        .doc(chatId)
        .collection('turns')
        .orderBy('createdAt', 'asc')
        .limit(parseInt(limit as string));

      const snapshot = await query.get();
      const turns: ChatTurn[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        turns.push({
          userId,
          chatId,
          turnId: doc.id,
          createdAt: data.createdAt.toDate().toISOString(),
          textUri: data.textUri,
          lang: data.lang,
          riskLevel: data.riskLevel
        });
      }

      const response: ServiceResponse<ChatTurn[]> = {
        success: true,
        data: turns
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getUserChats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = '20' } = req.query;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('chats')
        .orderBy('lastActivity', 'desc')
        .limit(parseInt(limit as string));

      const snapshot = await query.get();
      const chats = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        chats.push({
          chatId: doc.id,
          createdAt: data.createdAt.toDate().toISOString(),
          lastActivity: data.lastActivity.toDate().toISOString(),
          turnCount: data.turnCount || 0
        });
      }

      const response: ServiceResponse = {
        success: true,
        data: chats
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private sanitizeInput(input: string): string {
    // Basic sanitization - remove potentially harmful content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  private async assessRisk(message: string): Promise<string> {
    // Simple risk assessment based on keywords
    const criticalKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'self harm', 'cut myself', 'hurt myself'
    ];

    const highRiskKeywords = [
      'depressed', 'hopeless', 'worthless', 'die', 'death',
      'crisis', 'emergency', 'help me'
    ];

    const messageLower = message.toLowerCase();

    if (criticalKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'critical';
    }

    if (highRiskKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'high';
    }

    return 'low';
  }

  private combineRiskLevels(level1: string, level2: string): string {
    const levels = ['low', 'medium', 'high', 'critical'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);

    return levels[Math.max(index1, index2)];
  }

  private async handleCriticalRisk(userId: string, message: string, riskLevel: string): Promise<void> {
    // Publish risk flagged event
    await this.publishRiskFlaggedEvent({
      userId,
      createdAt: new Date().toISOString(),
      textUri: '', // Would store the message
      lang: 'en',
      riskLevel,
      reason: 'Critical risk keywords detected',
      escalated: true
    });
  }

  private async generateAIResponse(message: string, userId: string, chatId: string, lang: string): Promise<string> {
    // Get recent chat history for context
    const context = await this.getChatContext(userId, chatId);

    // Build prompt with guardrails
    const prompt = this.buildSafePrompt(message, context, lang);

    try {
      // Call Vertex AI
      // The official Vertex AI client types don’t yet include generative models,
      // so cast to <any> to avoid TS errors while still keeping runtime safety.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const [response] = await (this.vertexClient as any).predict({
        endpoint: `projects/${this.config.vertex.projectId}/locations/${this.config.vertex.location}/publishers/google/models/${this.config.vertex.model}`,
        instances: [
          // Cast to any because the predict REST proto expects arbitrary instances
          { prompt } as any
        ],
        // Generation parameters
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 40,
        } as any
      });

      return response.predictions?.[0]?.content || 'I apologize, but I couldn\'t generate a response.';
    } catch (error) {
      console.error('Vertex AI error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async getChatContext(userId: string, chatId: string): Promise<string> {
    try {
      const query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('chats')
        .doc(chatId)
        .collection('turns')
        .orderBy('createdAt', 'desc')
        .limit(10);

      const snapshot = await query.get();
      const context = [];

      for (const doc of snapshot.docs.reverse()) {
        const data = doc.data();
        const role = data.role === 'user' ? 'User' : 'Assistant';
        // Note: In real implementation, we'd fetch text from Storage
        context.push(`${role}: ${data.text || '[text content]'}`);
      }

      return context.join('\n');
    } catch (error) {
      console.error('Error getting chat context:', error);
      return '';
    }
  }

  private buildSafePrompt(message: string, context: string, lang: string): string {
    const systemPrompt = `You are Sukoon, a compassionate mental health support AI. You provide empathetic, non-judgmental support.

CRITICAL RULES:
1. Never give medical advice or diagnose conditions
2. Always encourage professional help for serious issues
3. Be empathetic and supportive
4. If someone expresses self-harm thoughts, strongly recommend immediate professional help
5. Keep responses supportive and hopeful

${context ? `Previous conversation:\n${context}\n\n` : ''}User: ${message}

Assistant:`;

    return systemPrompt;
  }

  private async storeChatTurn(
    userId: string,
    chatId: string,
    turnId: string,
    role: 'user' | 'assistant',
    text: string,
    createdAt: string,
    lang: string
  ): Promise<void> {
    // Store text in Cloud Storage
    const textUri = await this.storeTextContent(userId, chatId, turnId, text);

    // Store in Firestore
    const turnRef = this.firestore
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .collection('turns')
      .doc(turnId);

    await turnRef.set({
      role,
      textUri,
      lang,
      createdAt: Timestamp.fromDate(new Date(createdAt))
    });

    // Update chat metadata
    const chatRef = this.firestore
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId);

    await chatRef.set({
      lastActivity: Timestamp.fromDate(new Date(createdAt)),
      turnCount: FieldValue.increment(1)
    }, { merge: true });
  }

  private async storeTextContent(userId: string, chatId: string, turnId: string, text: string): Promise<string> {
    const bucket = this.storage.bucket(this.config.storage.bucketName);
    const fileName = `chat/${userId}/${chatId}/${turnId}.txt`;
    const file = bucket.file(fileName);

    await file.save(text, {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          userId,
          chatId,
          turnId,
          createdAt: new Date().toISOString()
        }
      }
    });

    return `gs://${this.config.storage.bucketName}/${fileName}`;
  }

  private async publishChatSavedEvent(event: ChatSavedEvent): Promise<void> {
    const topic = this.pubsub.topic('chat.saved');

    const message = {
      data: Buffer.from(JSON.stringify(event)),
      attributes: {
        eventType: 'chat.saved',
        userId: event.userId
      }
    };

    await topic.publishMessage(message);
  }

  private async publishRiskFlaggedEvent(event: any): Promise<void> {
    const topic = this.pubsub.topic('risk.flagged');

    const message = {
      data: Buffer.from(JSON.stringify(event)),
      attributes: {
        eventType: 'risk.flagged',
        userId: event.userId,
        riskLevel: event.riskLevel
      }
    };

    await topic.publishMessage(message);
  }

  private handleError(error: any, res: express.Response): void {
    console.error('Chat service error:', error);

    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  public start(port: number): void {
    this.app.listen(port, () => {
      console.log(`Chat service listening on port ${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Load configuration
const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '8082'),
  firestore: {
    projectId: process.env.GCP_PROJECT_ID || 'sukoon-dev',
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST
  },
  pubsub: {
    projectId: process.env.GCP_PROJECT_ID || 'sukoon-dev',
    emulatorHost: process.env.PUBSUB_EMULATOR_HOST
  },
  storage: {
    bucketName: process.env.STORAGE_BUCKET || 'sukoon-dev-sukoon-text'
  },
  kms: {
    keyRing: process.env.KMS_KEY_RING || 'sukoon-keyring',
    keyName: process.env.KMS_KEY_NAME || 'text-encryption-key'
  },
  vertex: {
    projectId: process.env.GCP_PROJECT_ID || 'sukoon-dev',
    location: process.env.VERTEX_LOCATION || 'us-central1',
    model: process.env.VERTEX_MODEL || 'text-bison'
  }
};

// Start service
if (require.main === module) {
  const service = new ChatService(config);
  service.start(config.port);
}

export default ChatService;
