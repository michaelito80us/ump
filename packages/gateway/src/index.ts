import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { logger } from './utils/logger';
import { ClerkAuthProvider } from '@ump/core';
import { PluginSchemaLoader } from './services/pluginSchemaLoader';
import {
  formatError,
  createValidationError,
  createPermissionError,
  createPluginExecutionError,
  ERROR_CODES,
} from './errorMapper';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

interface Context {
  user?: {
    id: string;
    email: string;
    role: string;
    clerkId?: string;
  };
  req: express.Request;
}

async function createGateway() {
  const pluginLoader = new PluginSchemaLoader();

  // Load plugin schemas dynamically
  const subgraphs = await pluginLoader.loadSubgraphs();

  // Create gateway with dynamic subgraph composition
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs,
    }),
    buildService({ url }) {
      return new RemoteGraphQLDataSource({
        url,
        willSendRequest({ request, context }) {
          // Forward authentication headers to subgraphs
          if (context.req?.headers?.authorization) {
            request.http?.headers.set(
              'authorization',
              context.req.headers.authorization
            );
          }
        },
      });
    },
  });

  return gateway;
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

  // Create gateway
  const gateway = await createGateway();

  // Create Apollo Server with Federation Gateway
  const server = new ApolloServer<Context>({
    gateway,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    includeStacktraceInErrorResponses: NODE_ENV === 'development',
    // Apply custom error formatting
    formatError,
  });

  // Start the server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
    }),
    express.json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        let user;

        // Extract JWT token from Authorization header
        const authHeader = req.headers.authorization;
        const token = ClerkAuthProvider.extractTokenFromHeader(authHeader);

        if (token) {
          try {
            // Verify JWT token (Clerk or custom)
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET || 'development-secret'
            ) as any;

            user = {
              id: decoded.sub || decoded.userId,
              email: decoded.email,
              role: decoded.role || 'user',
              clerkId: decoded.clerkId,
            };
          } catch (_error) {
            logger.warn('Invalid JWT token:', _error);
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
      service: 'gateway',
      version: '0.1.0',
    });
  });

  // Subgraph health check endpoint
  app.get('/subgraphs', async (req, res) => {
    try {
      const pluginLoader = new PluginSchemaLoader();
      const subgraphs = await pluginLoader.loadSubgraphs();
      res.json({ subgraphs });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to load subgraphs' });
    }
  });

  // Test error endpoints
  app.get('/test-validation-error', (req, res) => {
    try {
      throw createValidationError(
        'This is a test validation error',
        ERROR_CODES.INVALID_INPUT,
        { testField: 'testValue', timestamp: new Date().toISOString() }
      );
    } catch (error) {
      const err = error as any; // Type assertion since we know the error structure
      logger.error('Test validation error triggered', {
        errorId: `test_${Date.now()}`,
        error: err.message,
        stack: err.stack,
        details: err.details,
      });
      res.status(400).json({
        error: 'Validation failed',
        message: err.message,
        code: err.code,
        details: err.details,
      });
    }
  });

  app.get('/test-permission-error', (req, res) => {
    try {
      throw createPermissionError(
        'Access denied for test purposes',
        ERROR_CODES.FORBIDDEN,
        { requiredRole: 'admin', userRole: 'guest' }
      );
    } catch (error) {
      const err = error as any; // Type assertion since we know the error structure
      logger.error('Test permission error triggered', {
        errorId: `test_${Date.now()}`,
        error: err.message,
        stack: err.stack,
        details: err.details,
      });
      res.status(403).json({
        error: 'Permission denied',
        message: err.message,
        code: err.code,
        details: err.details,
      });
    }
  });

  app.get('/test-plugin-error', (req, res) => {
    try {
      throw createPluginExecutionError(
        'Plugin execution failed for testing',
        ERROR_CODES.TIMEOUT,
        { pluginName: 'test-plugin', timeoutMs: 5000 }
      );
    } catch (error) {
      const err = error as any; // Type assertion since we know the error structure
      logger.error('Test plugin error triggered', {
        errorId: `test_${Date.now()}`,
        error: err.message,
        stack: err.stack,
        details: err.details,
      });
      res.status(500).json({
        error: 'Plugin execution failed',
        message: err.message,
        code: err.code,
        details: err.details,
      });
    }
  });

  // Start HTTP server
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  logger.info(`🚀 Gateway ready at http://localhost:${PORT}/graphql`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔗 Subgraphs info at http://localhost:${PORT}/subgraphs`);

  if (NODE_ENV === 'development') {
    logger.info(
      `🔍 GraphQL Playground available at http://localhost:${PORT}/graphql`
    );
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start gateway server:', error);
  process.exit(1);
});
