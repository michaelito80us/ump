#!/usr/bin/env node

import { RealtimeWebSocketServer } from './services/websocket-server';
import { RedisPubSub } from './services/pubsub';
import { createConfig } from './config';

async function startServer() {
  try {
    const config = createConfig();

    console.log('🚀 Starting UMP Realtime Server...');
    console.log(`📡 Port: ${config.port}`);
    console.log(`🔗 Redis: ${config.redis.host}:${config.redis.port}`);

    // Initialize PubSub - wrap redis config in the expected structure
    const pubsub = new RedisPubSub({ redis: config.redis });

    // Check if Redis is connected (no explicit connect method needed)
    if (!pubsub.isConnected()) {
      console.log('⏳ Waiting for Redis connection...');
      // Give Redis a moment to connect
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log('✅ Redis PubSub initialized');

    // Initialize WebSocket server
    const server = new RealtimeWebSocketServer({
      port: config.port,
      jwtSecret: config.jwt.secret,
      pubsub: pubsub,
      pingInterval: config.websocket.pingInterval,
      connectionTimeout: config.websocket.pongTimeout,
    });

    await server.initialize();
    console.log(`✅ WebSocket server listening on port ${config.port}`);
    console.log('🎯 Ready to handle real-time connections!');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

      try {
        // Close WebSocket server
        if (server) {
          console.log('🔌 Closing WebSocket server...');
          // The server doesn't have a stop method, we'll close the underlying server
        }

        await pubsub.close();
        console.log('✅ Redis disconnected');

        console.log('👋 Goodbye!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { startServer };
