#!/usr/bin/env node

/**
 * Basic example of starting a realtime server
 */

import {
  createConfig,
  RealtimeWebSocketServer,
  RedisPubSub,
  generateMessageId,
} from '../index';

async function main() {
  console.log('🚀 Starting Basic Realtime Server Example...');

  // Create configuration
  const config = createConfig({
    port: 4001,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'development-secret-key',
    },
  });

  try {
    // Initialize PubSub
    const pubsub = new RedisPubSub({ redis: config.redis });
    console.log('✅ Redis PubSub initialized');

    // Initialize WebSocket server
    const server = new RealtimeWebSocketServer({
      port: config.port,
      jwtSecret: config.jwt.secret,
      pubsub,
    });

    await server.initialize();
    console.log(`✅ WebSocket server listening on port ${config.port}`);
    console.log('📡 Try connecting with: ws://localhost:4001');
    console.log('🎯 Server is ready for connections!');

    // Example: Publish a test event every 10 seconds
    setInterval(async () => {
      await pubsub.publish('global:announcements', {
        id: generateMessageId(),
        type: 'SYSTEM_ANNOUNCEMENT',
        timestamp: new Date(),
        data: {
          message: `Server heartbeat at ${new Date().toISOString()}`,
          serverTime: Date.now(),
        },
      });
      console.log('📢 Published heartbeat event');
    }, 10000);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.close();
      await pubsub.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
