import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check all services
    const services = {
      diary: await checkService('http://localhost:8081/health'),
      chat: await checkService('http://localhost:8082/health'),
      mood: await checkService('http://localhost:8083/health'),
      triage: await checkService('http://localhost:8084/health'),
      insights: await checkService('http://localhost:8085/health')
    };

    const allHealthy = Object.values(services).every(service => service === 'healthy');

    res.json({
      status: allHealthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// REST API fallback for non-GraphQL clients
app.post('/api/diary', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8081/entries', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal error' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8082/chat', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal error' });
  }
});

app.post('/api/mood', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8083/mood', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal error' });
  }
});

// Apollo Server setup
async function startServer() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      // Extract user context from headers or auth
      const userId = req.headers['x-user-id'] as string;
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

      return {
        userId,
        correlationId
      };
    },
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_ERROR',
          correlationId: error.extensions?.correlationId
        }
      };
    }
  });

  await server.start();
  // Cast to any to avoid duplicate @types/express mismatch
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`🚀 BFF Server ready at http://localhost:${port}`);
    console.log(`📊 GraphQL playground at http://localhost:${port}/graphql`);
  });
}

async function checkService(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.data.status === 'healthy' ? 'healthy' : 'unhealthy';
  } catch (error) {
    return 'unreachable';
  }
}

// Start the server
startServer().catch(console.error);
