import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
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

const PORT = process.env.PORT || 4001; // Changed from 4000 to 4001 for subgraph
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load GraphQL schema and parse it into DocumentNode
const schemaString = readFileSync(
  join(__dirname, 'schema', 'schema.graphql'),
  'utf8'
);
const typeDefs = gql(schemaString);

interface Context {
  user?: {
    id: string;
    email: string;
    role: string;
    clerkId?: string;
  };
  req: express.Request;
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

  // Build federated subgraph schema
  const schema = buildSubgraphSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server as a subgraph
  const server = new ApolloServer<Context>({
    schema,
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
      origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3000', // Gateway
      ],
      credentials: true,
    }),
    express.json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        let user;

        // Extract JWT token from Authorization header (forwarded from gateway)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);

          try {
            // TODO: Implement proper JWT verification
            // For now, we'll parse a simple payload
            const decoded = JSON.parse(
              Buffer.from(token.split('.')[1], 'base64').toString()
            );

            user = {
              id: decoded.sub || decoded.userId,
              email: decoded.email,
              role: decoded.role || 'user',
              clerkId: decoded.clerkId,
            };
          } catch (error) {
            logger.warn('Invalid JWT token:', error);
          }
        }

        return { user, req };
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'core-backend',
      version: '0.1.0',
    });
  });

  // Subgraph info endpoint for gateway discovery
  app.get('/subgraph', (req, res) => {
    res.json({
      name: 'core',
      url: `http://localhost:${PORT}/graphql`,
      version: '0.1.0',
      schema: 'federated',
    });
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

  logger.info(`🚀 Core subgraph ready at http://localhost:${PORT}/graphql`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔗 Subgraph info at http://localhost:${PORT}/subgraph`);

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
