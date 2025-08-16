import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { RealtimeWebSocketServer } from '../services/websocket-server';
import { RedisPubSub } from '../services/pubsub';
import { createConfig } from '../config';
import { SystemAnnouncementEvent } from '../types/events';

describe('Integration Tests', () => {
  let server: RealtimeWebSocketServer;
  let pubsub: RedisPubSub;
  const TEST_PORT = 8082;
  const JWT_SECRET = 'integration-test-secret';

  beforeAll(async () => {
    const config = createConfig({
      port: TEST_PORT,
      redis: {
        host: 'localhost',
        port: 6379,
      },
      jwt: {
        secret: JWT_SECRET,
      },
    });

    pubsub = new RedisPubSub(config);
    server = new RealtimeWebSocketServer({
      port: config.port,
      jwtSecret: config.jwt.secret,
      pubsub: pubsub,
      pingInterval: config.websocket.pingInterval,
    });

    await server.initialize();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await pubsub.close();
  });

  it('should broadcast events to subscribed clients', async () => {
    const validToken = jwt.sign(
      { sub: 'test-user-integration', userId: 'test-user-integration' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

    return new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // First authenticate
        const authMessage = {
          id: 'auth-integration',
          type: 'AUTH',
          timestamp: new Date(),
          data: { token: validToken },
        };
        ws.send(JSON.stringify(authMessage));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        console.log(
          'Client received message:',
          JSON.stringify(message, null, 2)
        );

        if (message.type === 'WELCOME') {
          // Send authentication
          const authMessage = {
            id: 'auth-integration',
            type: 'AUTH',
            timestamp: new Date(),
            data: {
              token: validToken,
            },
          };
          console.log('Sending auth message');
          ws.send(JSON.stringify(authMessage));
        }

        if (
          message.type === 'ACK' &&
          message.data.messageId === 'auth-integration'
        ) {
          if (message.data.success) {
            // Subscribe to a channel
            const subscribeMessage = {
              id: 'sub-integration',
              type: 'SUBSCRIBE',
              timestamp: new Date(),
              data: { channels: ['tournament:test-tournament'] },
            };
            console.log('Sending subscribe message');
            ws.send(JSON.stringify(subscribeMessage));
          } else {
            reject(new Error('Authentication failed'));
          }
        }

        if (
          message.type === 'ACK' &&
          message.data.messageId === 'sub-integration'
        ) {
          if (message.data.success) {
            console.log('Subscription ACK received, publishing event...');
            // Add a small delay to ensure subscription is fully established
            setTimeout(async () => {
              // Publish an event to the channel
              const testEvent: SystemAnnouncementEvent = {
                id: 'integration-event-1',
                type: 'SYSTEM_ANNOUNCEMENT',
                timestamp: new Date(),
                tournamentId: 'test-tournament',
                data: {
                  message: 'Integration Test Tournament Started',
                  level: 'info',
                },
              };

              console.log('About to publish event:', testEvent);
              await pubsub.publish('tournament:test-tournament', testEvent);
              console.log('Event published successfully');
            }, 50);
          } else {
            reject(new Error('Subscription failed'));
          }
        }

        if (message.type === 'EVENT') {
          console.log('Received EVENT message!');
          expect(message.data.channel).toBe('tournament:test-tournament');
          expect(message.data.event.type).toBe('SYSTEM_ANNOUNCEMENT');
          if (message.data.event.type === 'SYSTEM_ANNOUNCEMENT') {
            expect(message.data.event.data.message).toBe(
              'Integration Test Tournament Started'
            );
          }

          ws.close();
          resolve();
        }
      });

      ws.on('error', reject);

      setTimeout(() => {
        ws.close();
        reject(new Error('Integration test timeout'));
      }, 10000);
    });
  });
});
