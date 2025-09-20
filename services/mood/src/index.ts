import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { PubSub } from '@google-cloud/pubsub';

import {
  MoodEvent,
  MoodLoggedEvent,
  ServiceConfig,
  ServiceResponse,
  ServiceError,
  isValidUserId,
  isValidMoodScore
} from './shared-types';

interface MoodLogRequest {
  userId: string;
  moodScore: number;
  notes?: string;
  lang?: string;
}

class MoodService {
  private app: express.Application;
  private firestore: Firestore;
  private pubsub: PubSub;
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

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'mood-service' });
    });

    // Log mood
    this.app.post('/mood', this.logMood.bind(this));

    // Get mood history
    this.app.get('/users/:userId/mood', this.getMoodHistory.bind(this));

    // Get mood statistics
    this.app.get('/users/:userId/mood/stats', this.getMoodStats.bind(this));

    // Update mood entry
    this.app.put('/users/:userId/mood/:eventId', this.updateMood.bind(this));

    // Delete mood entry
    this.app.delete('/users/:userId/mood/:eventId', this.deleteMood.bind(this));
  }

  private async logMood(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, moodScore, notes, lang = 'en' }: MoodLogRequest = req.body;

      // Validation
      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      if (!isValidMoodScore(moodScore)) {
        throw new ServiceError('Invalid mood score (must be 1.0-10.0)', 'INVALID_MOOD_SCORE', 400);
      }

      if (notes && notes.length > 1000) {
        throw new ServiceError('Notes too long', 'NOTES_TOO_LONG', 400);
      }

      const eventId = uuidv4();
      const createdAt = new Date().toISOString();

      // Create mood event object
      const moodEvent: MoodEvent = {
        userId,
        eventId,
        createdAt,
        moodScore,
        notes,
        lang
      };

      // Save to Firestore
      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('mood')
        .doc(eventId);

      await docRef.set({
        ...moodEvent,
        createdAt: Timestamp.fromDate(new Date(createdAt))
      });

      // Publish to Pub/Sub
      await this.publishMoodLoggedEvent(moodEvent);

      const response: ServiceResponse<MoodEvent> = {
        success: true,
        data: moodEvent
      };

      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getMoodHistory(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = '50', startDate, endDate } = req.query;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      let query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('mood')
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit as string));

      // Apply date filters if provided
      if (startDate) {
        query = query.where('createdAt', '>=', Timestamp.fromDate(new Date(startDate as string)));
      }

      if (endDate) {
        query = query.where('createdAt', '<=', Timestamp.fromDate(new Date(endDate as string)));
      }

      const snapshot = await query.get();
      const events: MoodEvent[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        events.push({
          userId,
          eventId: doc.id,
          createdAt: data.createdAt.toDate().toISOString(),
          moodScore: data.moodScore,
          notes: data.notes,
          lang: data.lang
        });
      }

      const response: ServiceResponse<MoodEvent[]> = {
        success: true,
        data: events
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async getMoodStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { days = '30' } = req.query;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const query = this.firestore
        .collection('users')
        .doc(userId)
        .collection('mood')
        .where('createdAt', '>=', Timestamp.fromDate(daysAgo))
        .orderBy('createdAt', 'desc');

      const snapshot = await query.get();

      if (snapshot.empty) {
        const response: ServiceResponse = {
          success: true,
          data: {
            count: 0,
            average: 0,
            min: 0,
            max: 0,
            trend: 'stable'
          }
        };
        res.json(response);
        return;
      }

      const scores = snapshot.docs.map(doc => doc.data().moodScore);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const min = Math.min(...scores);
      const max = Math.max(...scores);

      // Calculate trend (simple: compare first half vs second half)
      const midpoint = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, midpoint);
      const secondHalf = scores.slice(midpoint);

      const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

      let trend = 'stable';
      const difference = secondHalfAvg - firstHalfAvg;

      if (difference > 0.5) trend = 'improving';
      else if (difference < -0.5) trend = 'declining';

      const response: ServiceResponse = {
        success: true,
        data: {
          count: scores.length,
          average: Math.round(average * 10) / 10,
          min,
          max,
          trend
        }
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async updateMood(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, eventId } = req.params;
      const { moodScore, notes } = req.body;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('mood')
        .doc(eventId);

      const doc = await docRef.get();

      if (!doc.exists) {
        throw new ServiceError('Mood event not found', 'EVENT_NOT_FOUND', 404);
      }

      const updateData: any = {};

      if (moodScore !== undefined) {
        if (!isValidMoodScore(moodScore)) {
          throw new ServiceError('Invalid mood score (must be 1.0-10.0)', 'INVALID_MOOD_SCORE', 400);
        }
        updateData.moodScore = moodScore;
      }

      if (notes !== undefined) {
        if (notes && notes.length > 1000) {
          throw new ServiceError('Notes too long', 'NOTES_TOO_LONG', 400);
        }
        updateData.notes = notes;
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

  private async deleteMood(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, eventId } = req.params;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('mood')
        .doc(eventId);

      const doc = await docRef.get();

      if (!doc.exists) {
        throw new ServiceError('Mood event not found', 'EVENT_NOT_FOUND', 404);
      }

      await docRef.delete();

      const response: ServiceResponse = {
        success: true
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async publishMoodLoggedEvent(event: MoodEvent): Promise<void> {
    const topic = this.pubsub.topic('mood.logged');

    const moodLoggedEvent: MoodLoggedEvent = {
      userId: event.userId,
      eventId: event.eventId,
      createdAt: event.createdAt,
      moodScore: event.moodScore,
      notes: event.notes
    };

    const message = {
      data: Buffer.from(JSON.stringify(moodLoggedEvent)),
      attributes: {
        eventType: 'mood.logged',
        userId: event.userId
      }
    };

    await topic.publishMessage(message);
  }

  private handleError(error: any, res: express.Response): void {
    console.error('Mood service error:', error);

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
      console.log(`Mood service listening on port ${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Load configuration
const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '8083'),
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
  const service = new MoodService(config);
  service.start(config.port);
}

export default MoodService;
