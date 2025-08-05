import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

import { resolvers } from './resolvers';
import { db } from './services/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load GraphQL schema
const typeDefs = readFileSync(
  join(__dirname, 'schema', 'schema.graphql'),
  'utf8'
);

interface Context {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

async function startServer() {
  // Create Express app
  const app = express();
  const httpServer = http.createServer(app);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    includeStacktraceInErrorResponses: NODE_ENV === 'development',
  });

  // Start the server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }),
    express.json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: async ({ req: _req }) => {
        // TODO: Implement authentication middleware
        // For now, return empty context
        return {};
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Connect to database
  try {
    await db.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Start HTTP server
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);

  if (NODE_ENV === 'development') {
    logger.info(
      `🔍 GraphQL Playground available at http://localhost:${PORT}/graphql`
    );
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.disconnect();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
