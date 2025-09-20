import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PubSub } from '@google-cloud/pubsub';
import { Firestore, Timestamp } from '@google-cloud/firestore';

import {
  RiskFlag,
  ServiceConfig,
  ServiceResponse,
  ServiceError
} from './shared-types';

class TriageService {
  private app: express.Application;
  private pubsub: PubSub;
  private firestore: Firestore;
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.app = express();
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
      ...(config.pubsub.emulatorHost && {
        apiEndpoint: config.pubsub.emulatorHost
      })
    });
    this.firestore = new Firestore({
      projectId: config.firestore.projectId,
      ...(config.firestore.emulatorHost && {
        host: config.firestore.emulatorHost,
        ssl: false
      })
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupPubSubSubscriptions();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '1mb' }));
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'triage-service' });
    });

    // Manual risk assessment
    this.app.post('/assess', this.manualAssessment.bind(this));

    // Get risk history
    this.app.get('/users/:userId/risks', this.getRiskHistory.bind(this));
  }

  private setupPubSubSubscriptions(): void {
    // Subscribe to risk.flagged topic
    const subscription = this.pubsub.subscription('risk-flagged-subscription');

    subscription.on('message', async (message) => {
      try {
        const riskEvent = JSON.parse(message.data.toString());
        await this.handleRiskEvent(riskEvent);
        message.ack();
      } catch (error) {
        console.error('Error processing risk event:', error);
        message.nack();
      }
    });

    subscription.on('error', (error) => {
      console.error('Pub/Sub subscription error:', error);
    });
  }

  private async handleRiskEvent(riskEvent: any): Promise<void> {
    console.log('Processing risk event:', riskEvent);

    // Enhanced triage logic
    const escalatedRisk = await this.enhancedTriage(riskEvent);

    if (escalatedRisk.escalated) {
      await this.escalateRisk(escalatedRisk);
    }

    // Store triage decision
    await this.storeTriageDecision(escalatedRisk);
  }

  private async enhancedTriage(riskEvent: any): Promise<any> {
    // Advanced risk assessment logic
    const riskLevel = riskEvent.riskLevel;
    let escalated = false;
    let priority = 'medium';

    // Critical risks always escalate
    if (riskLevel === 'critical') {
      escalated = true;
      priority = 'urgent';
    }
    // High risk - check for patterns
    else if (riskLevel === 'high') {
      const recentRisks = await this.getRecentRisks(riskEvent.userId);
      if (recentRisks.length >= 3) {
        escalated = true;
        priority = 'high';
      }
    }

    return {
      ...riskEvent,
      escalated,
      priority,
      triageTimestamp: new Date().toISOString()
    };
  }

  private async getRecentRisks(userId: string): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = this.firestore
      .collection('system')
      .doc('risks')
      .collection('events')
      .where('userId', '==', userId)
      .where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  private async escalateRisk(riskEvent: any): Promise<void> {
    // Simulate notification to crisis team
    console.log(`🚨 ESCALATING RISK: User ${riskEvent.userId} - ${riskEvent.riskLevel} priority`);

    // In production, this would:
    // 1. Send SMS/email to crisis counselors
    // 2. Create support ticket
    // 3. Notify on-call responders
    // 4. Log to monitoring system

    await this.notifyCrisisTeam(riskEvent);
  }

  private async notifyCrisisTeam(riskEvent: any): Promise<void> {
    // Stub for notification service integration
    const notification = {
      userId: riskEvent.userId,
      type: 'risk_escalation',
      priority: riskEvent.priority,
      message: `Risk escalation: ${riskEvent.reason}`,
      createdAt: new Date().toISOString()
    };

    // Publish to notification topic
    const topic = this.pubsub.topic('notifications');
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify(notification)),
      attributes: {
        eventType: 'notification',
        priority: riskEvent.priority
      }
    });
  }

  private async storeTriageDecision(riskEvent: any): Promise<void> {
    const docRef = this.firestore
      .collection('system')
      .doc('risks')
      .collection('events')
      .doc();

    await docRef.set({
      ...riskEvent,
      triagedAt: Timestamp.fromDate(new Date())
    });
  }

  private async manualAssessment(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, text, context } = req.body;

      const riskAssessment = await this.assessRisk(text, context);

      const response: ServiceResponse = {
        success: true,
        data: riskAssessment
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async assessRisk(text: string, context?: any): Promise<any> {
    // Advanced risk assessment logic
    const criticalPatterns = [
      /suicide/i, /kill myself/i, /end it all/i, /not worth living/i,
      /self harm/i, /cut myself/i, /hurt myself/i
    ];

    const highRiskPatterns = [
      /depressed/i, /hopeless/i, /worthless/i, /die/i, /death/i,
      /crisis/i, /emergency/i, /help me/i
    ];

    let riskLevel = 'low';
    const reasons = [];

    if (criticalPatterns.some(pattern => pattern.test(text))) {
      riskLevel = 'critical';
      reasons.push('Critical keywords detected');
    } else if (highRiskPatterns.some(pattern => pattern.test(text))) {
      riskLevel = 'high';
      reasons.push('High-risk keywords detected');
    }

    // Check for escalation patterns
    if (context?.recentRisks > 2) {
      riskLevel = 'high';
      reasons.push('Multiple recent risk indicators');
    }

    return {
      riskLevel,
      reasons,
      requiresEscalation: riskLevel === 'critical' || (riskLevel === 'high' && context?.recentRisks > 2),
      recommendedActions: this.getRecommendedActions(riskLevel)
    };
  }

  private getRecommendedActions(riskLevel: string): string[] {
    switch (riskLevel) {
      case 'critical':
        return [
          'Immediate crisis intervention',
          'Contact emergency services if location known',
          'Notify on-call crisis counselor',
          'Block further AI responses'
        ];
      case 'high':
        return [
          'Schedule follow-up within 24 hours',
          'Provide crisis hotline numbers',
          'Monitor for escalation',
          'Recommend professional consultation'
        ];
      default:
        return [
          'Continue monitoring',
          'Provide supportive resources',
          'Regular check-ins'
        ];
    }
  }

  private async getRiskHistory(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;

      const query = this.firestore
        .collection('system')
        .doc('risks')
        .collection('events')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20);

      const snapshot = await query.get();
      const risks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const response: ServiceResponse = {
        success: true,
        data: risks
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: any, res: express.Response): void {
    console.error('Triage service error:', error);

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
      console.log(`Triage service listening on port ${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Configuration
const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '8084'),
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
  const service = new TriageService(config);
  service.start(config.port);
}

export default TriageService;
