import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Firestore, Timestamp } from '@google-cloud/firestore';

import {
  ServiceConfig,
  ServiceResponse,
  ServiceError,
  isValidUserId
} from './shared-types';

class InsightsService {
  private app: express.Application;
  private firestore: Firestore;
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

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '1mb' }));
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'insights-service' });
    });

    // Get user insights
    this.app.get('/users/:userId/insights', this.getInsights.bind(this));

    // Generate insights snapshot
    this.app.post('/users/:userId/insights/generate', this.generateInsights.bind(this));
  }

  private async getInsights(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      // Get latest insights snapshot
      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('insights')
        .doc('snapshot');

      const doc = await docRef.get();

      let insights = null;
      if (doc.exists) {
        const data = doc.data()!;
        insights = {
          moodTrends: data.moodTrends || [],
          diaryThemes: data.diaryThemes || [],
          riskPatterns: data.riskPatterns || [],
          recommendations: data.recommendations || [],
          generatedAt: data.generatedAt?.toDate()?.toISOString()
        };
      }

      const response: ServiceResponse = {
        success: true,
        data: insights
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async generateInsights(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!isValidUserId(userId)) {
        throw new ServiceError('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      // Generate insights from user's data
      const insights = await this.analyzeUserData(userId);

      // Store insights snapshot
      const docRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('insights')
        .doc('snapshot');

      await docRef.set({
        ...insights,
        generatedAt: Timestamp.fromDate(new Date())
      });

      const response: ServiceResponse = {
        success: true,
        data: insights
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async analyzeUserData(userId: string): Promise<any> {
    // Analyze mood data
    const moodTrends = await this.analyzeMoodTrends(userId);

    // Analyze diary themes
    const diaryThemes = await this.analyzeDiaryThemes(userId);

    // Analyze risk patterns
    const riskPatterns = await this.analyzeRiskPatterns(userId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(moodTrends, diaryThemes, riskPatterns);

    return {
      moodTrends,
      diaryThemes,
      riskPatterns,
      recommendations
    };
  }

  private async analyzeMoodTrends(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = this.firestore
      .collection('users')
      .doc(userId)
      .collection('mood')
      .where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'asc');

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { average: 0, trend: 'stable', entries: 0 };
    }

    const scores = snapshot.docs.map(doc => doc.data().moodScore);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Simple trend analysis
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    let trend = 'stable';
    if (secondAvg > firstAvg + 0.5) trend = 'improving';
    else if (secondAvg < firstAvg - 0.5) trend = 'declining';

    return {
      average: Math.round(average * 10) / 10,
      trend,
      entries: scores.length
    };
  }

  private async analyzeDiaryThemes(userId: string): Promise<any> {
    // Simplified theme analysis - in production would use NLP
    const query = this.firestore
      .collection('users')
      .doc(userId)
      .collection('diary')
      .orderBy('createdAt', 'desc')
      .limit(10);

    const snapshot = await query.get();

    const themes = [];
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful'];
    const negativeWords = ['sad', 'bad', 'difficult', 'hard', 'struggling'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const text = data.text || '';

      positiveWords.forEach(word => {
        if (text.toLowerCase().includes(word)) positiveCount++;
      });

      negativeWords.forEach(word => {
        if (text.toLowerCase().includes(word)) negativeCount++;
      });
    }

    if (positiveCount > negativeCount) {
      themes.push('Generally positive outlook');
    } else if (negativeCount > positiveCount) {
      themes.push('Some challenging experiences');
    } else {
      themes.push('Mixed experiences');
    }

    return themes;
  }

  private async analyzeRiskPatterns(userId: string): Promise<any> {
    // Check for risk patterns in recent activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Check chat turns with risk flags
    const chatQuery = this.firestore
      .collection('users')
      .doc(userId)
      .collection('chats')
      .where('lastActivity', '>=', Timestamp.fromDate(sevenDaysAgo));

    const chatSnapshot = await chatQuery.get();

    let riskIndicators = 0;
    for (const chatDoc of chatSnapshot.docs) {
      const turnsQuery = chatDoc.ref.collection('turns')
        .where('riskLevel', 'in', ['high', 'critical']);

      const turnsSnapshot = await turnsQuery.get();
      riskIndicators += turnsSnapshot.size;
    }

    return {
      riskIndicators,
      period: '7 days',
      riskLevel: riskIndicators > 5 ? 'high' : riskIndicators > 2 ? 'medium' : 'low'
    };
  }

  private generateRecommendations(moodTrends: any, diaryThemes: any, riskPatterns: any): string[] {
    const recommendations = [];

    if (moodTrends.trend === 'declining') {
      recommendations.push('Consider speaking with a mental health professional');
    }

    if (riskPatterns.riskLevel === 'high') {
      recommendations.push('Reach out to crisis support if you need immediate help');
    }

    if (moodTrends.entries < 5) {
      recommendations.push('Try logging your mood more regularly for better insights');
    }

    recommendations.push('Remember that it\'s okay to ask for help when needed');

    return recommendations;
  }

  private handleError(error: any, res: express.Response): void {
    console.error('Insights service error:', error);

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
      console.log(`Insights service listening on port ${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Configuration
const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '8085'),
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

if (require.main === module) {
  const service = new InsightsService(config);
  service.start(config.port);
}

export default InsightsService;
