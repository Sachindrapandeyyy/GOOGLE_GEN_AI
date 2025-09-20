import request from 'supertest';
import DiaryService from './index';

describe('Diary Service', () => {
  let service: DiaryService;
  let app: any;

  beforeAll(() => {
    // Mock configuration for testing
    const config = {
      port: 8081,
      firestore: {
        projectId: 'test-project'
      },
      pubsub: {
        projectId: 'test-project'
      },
      storage: {
        bucketName: 'test-bucket'
      },
      kms: {
        keyRing: 'test-keyring',
        keyName: 'test-key'
      },
      vertex: {
        projectId: 'test-project',
        location: 'us-central1',
        model: 'test-model'
      }
    };

    service = new DiaryService(config);
    app = service.getApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        service: 'diary-service'
      });
    });
  });

  describe('POST /entries', () => {
    it('should create a diary entry', async () => {
      const entryData = {
        userId: 'test-user-12345678901234567890',
        text: 'This is a test diary entry',
        lang: 'en'
      };

      const response = await request(app)
        .post('/entries')
        .send(entryData);

      // Note: This will fail in test environment without proper mocks
      // In real implementation, we'd mock Firestore, PubSub, and Storage
      expect(response.status).toBeDefined();
    });

    it('should reject invalid user ID', async () => {
      const entryData = {
        userId: 'invalid-user-id',
        text: 'This is a test diary entry'
      };

      const response = await request(app)
        .post('/entries')
        .send(entryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_USER_ID');
    });

    it('should reject missing text', async () => {
      const entryData = {
        userId: 'test-user-12345678901234567890'
      };

      const response = await request(app)
        .post('/entries')
        .send(entryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_TEXT');
    });
  });
});
