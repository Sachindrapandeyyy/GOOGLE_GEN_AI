import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';

import {
  DiaryEntry,
  DiarySavedEvent,
  ServiceConfig,
  ServiceResponse,
  ServiceError,
  isValidUserId,
  isValidTimestamp
} from './shared-types';

class DiaryService {
  private app: express.Application;
  private firestore: Firestore;
  private pubsub: PubSub;
  private storage: Storage;
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
      res.json({ status: 'healthy', service: 'diary-service' });
    });

    // Create diary entry
    this.app.post('/entries', this.createEntry.bind(this));

    // Get diary entries for user
    this.app.get('/users/:userId/entries', this.getEntries.bind(this));

    // Get specific entry
    this.app.get('/users/:userId/entries/:entryId', this.getEntry.bind(this));

    // Update entry
    this.app.put('/users/:userId/entries/:entryId', this.updateEntry.bind(this));

    // Delete entry
    this.app.delete('/users/:userId/entries/:entryId', this.deleteEntry.bind(this));
  }

  private async createEntry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, text, lang = 'en' } = req.body;

      // Validation
      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new ServiceError('Text content is required', 'MISSING_TEXT', 400);
      }

      if (text.length > 10000) {
        throw new ServiceError('Text content too long', 'TEXT_TOO_LONG', 400);
      }

      const entryId = uuidv4();
      const createdAt = new Date().toISOString();

      // Store text in Cloud Storage
      const textUri = await this.storeTextContent(userId, entryId, text);

      // Create diary entry object
      const entry: DiaryEntry = {
        userId,
        entryId,
        createdAt,
        textUri,
        lang
      };

      // Save to Firestore
      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('diary')
        .doc(entryId);

      await docRef.set({
        ...entry,
        // Firestore timestamps
        createdAt: Timestamp.fromDate(new Date(createdAt))
      });

      // Publish to Pub/Sub
      await this.publishDiarySavedEvent(entry);

      const response: ServiceResponse<DiaryEntry> = {
        success: true,
        data: entry
      };

      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getEntries(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = '50', offset } = req.query;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      let query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('diary')
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit as string));

      if (offset) {
        const offsetDoc = await this.firestore
          .collection('users')
          .doc(userId)
          .collection('diary')
          .doc(offset as string)
          .get();

        if (offsetDoc.exists) {
          query = query.startAfter(offsetDoc);
        }
      }

      const snapshot = await query.get();
      const entries: DiaryEntry[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        entries.push({
          userId,
          entryId: doc.id,
          createdAt: data.createdAt.toDate().toISOString(),
          textUri: data.textUri,
          lang: data.lang
        });
      }

      const response: ServiceResponse<DiaryEntry[]> = {
        success: true,
        data: entries
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getEntry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, entryId } = req.params;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('diary')
        .doc(entryId);

      const doc = await docRef.get();

      if (!doc.exists) {
        throw new ServiceError('Diary entry not found', 'ENTRY_NOT_FOUND', 404);
      }

      const data = doc.data()!;
      const entry: DiaryEntry = {
        userId,
        entryId: doc.id,
        createdAt: data.createdAt.toDate().toISOString(),
        textUri: data.textUri,
        lang: data.lang
      };

      // Optionally fetch text content
      if (req.query.includeText === 'true') {
        entry.text = await this.getTextContent(data.textUri);
      }

      const response: ServiceResponse<DiaryEntry> = {
        success: true,
        data: entry
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async updateEntry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, entryId } = req.params;
      const { text, lang } = req.body;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('diary')
        .doc(entryId);

      const doc = await docRef.get();

      if (!doc.exists) {
        throw new ServiceError('Diary entry not found', 'ENTRY_NOT_FOUND', 404);
      }

      const updateData: any = {};

      if (text !== undefined) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
          throw new ServiceError('Text content cannot be empty', 'INVALID_TEXT', 400);
        }
        if (text.length > 10000) {
          throw new ServiceError('Text content too long', 'TEXT_TOO_LONG', 400);
        }

        // Update text in Cloud Storage
        const textUri = await this.storeTextContent(userId, entryId, text);
        updateData.textUri = textUri;
      }

      if (lang !== undefined) {
        updateData.lang = lang;
      }

      await docRef.update(updateData);

      const response: ServiceResponse = {
        success: true
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async deleteEntry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, entryId } = req.params;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('diary')
        .doc(entryId);

      const doc = await docRef.get();

      if (!doc.exists) {
        throw new ServiceError('Diary entry not found', 'ENTRY_NOT_FOUND', 404);
      }

      // Delete from Firestore
      await docRef.delete();

      // Delete from Cloud Storage
      const data = doc.data()!;
      if (data.textUri) {
        await this.deleteTextContent(data.textUri);
      }

      const response: ServiceResponse = {
        success: true
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async storeTextContent(userId: string, entryId: string, text: string): Promise<string> {
    const bucket = this.storage.bucket(this.config.storage.bucketName);
    const fileName = `diary/${userId}/${entryId}.txt`;
    const file = bucket.file(fileName);

    await file.save(text, {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          userId,
          entryId,
          createdAt: new Date().toISOString()
        }
      }
    });

    return `gs://${this.config.storage.bucketName}/${fileName}`;
  }

  private async getTextContent(textUri: string): Promise<string> {
    const bucketName = textUri.replace('gs://', '').split('/')[0];
    const filePath = textUri.replace(`gs://${bucketName}/`, '');
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [content] = await file.download();
    return content.toString();
  }

  private async deleteTextContent(textUri: string): Promise<void> {
    const bucketName = textUri.replace('gs://', '').split('/')[0];
    const filePath = textUri.replace(`gs://${bucketName}/`, '');
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.delete();
  }

  private async publishDiarySavedEvent(entry: DiaryEntry): Promise<void> {
    const topic = this.pubsub.topic('diary.saved');

    const event: DiarySavedEvent = {
      userId: entry.userId,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
      textUri: entry.textUri,
      lang: entry.lang
    };

    const message = {
      data: Buffer.from(JSON.stringify(event)),
      attributes: {
        eventType: 'diary.saved',
        userId: entry.userId
      }
    };

    await topic.publishMessage(message);
  }

  private handleError(error: any, res: express.Response): void {
    console.error('Diary service error:', error);

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
      console.log(`Diary service listening on port ${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Load configuration
const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '8081'),
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
  const service = new DiaryService(config);
  service.start(config.port);
}

export default DiaryService;
