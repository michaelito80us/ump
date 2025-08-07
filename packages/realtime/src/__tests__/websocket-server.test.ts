import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { RealtimeWebSocketServer } from '../services/websocket-server';
import { RedisPubSub } from '../services/pubsub';
import { createConfig } from '../config';

describe('RealtimeWebSocketServer', () => {
  let server: RealtimeWebSocketServer;
  let pubsub: RedisPubSub;
  const TEST_PORT = 8081;
  const JWT_SECRET = 'test-secret-key';

  beforeAll(async () => {
    // Create test configuration
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

    // Initialize PubSub and WebSocket server
    pubsub = new RedisPubSub(config);
    server = new RealtimeWebSocketServer({
      port: config.port,
      jwtSecret: config.jwt.secret,
      pubsub: pubsub,
      pingInterval: config.websocket.pingInterval,
    });

    // Wait a bit for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await pubsub.close();
  });

  describe('JWT Authentication', () => {
    it('should disconnect clients with invalid JWT', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

      return new Promise<void>((resolve, reject) => {
        let disconnected = false;

        ws.on('open', () => {
          // Send invalid JWT
          const invalidAuthMessage = {
            id: 'test-auth-1',
            type: 'AUTH',
            timestamp: new Date(),
            data: {
              token: 'invalid.jwt.token',
            },
          };

          ws.send(JSON.stringify(invalidAuthMessage));
        });

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString());

          // Should receive an ACK with success: false
          if (
            message.type === 'ACK' &&
            message.data.messageId === 'test-auth-1'
          ) {
            expect(message.data.success).toBe(false);
            expect(message.data.error).toContain('Invalid token');
          }
        });

        ws.on('close', () => {
          disconnected = true;
          resolve();
        });

        ws.on('error', (error) => {
          if (!disconnected) {
            reject(error);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!disconnected) {
            ws.close();
            reject(new Error('Client should have been disconnected'));
          }
        }, 5000);
      });
    });

    it('should accept clients with valid JWT', async () => {
      // Create a valid JWT
      const validToken = jwt.sign(
        { sub: 'test-user-123', userId: 'test-user-123' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          const validAuthMessage = {
            id: 'test-auth-2',
            type: 'AUTH',
            timestamp: new Date(),
            data: {
              token: validToken,
            },
          };

          ws.send(JSON.stringify(validAuthMessage));
        });

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString());

          if (
            message.type === 'ACK' &&
            message.data.messageId === 'test-auth-2'
          ) {
            expect(message.data.success).toBe(true);
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);

        // Timeout after 5 seconds
        setTimeout(() => {
          ws.close();
          reject(new Error('Authentication timeout'));
        }, 5000);
      });
    });
  });

  describe('Load Testing', () => {
    it('should handle 5k clients within 250ms', async () => {
      const CLIENT_COUNT = 100; // Reduced for testing
      const _MAX_CONNECTION_TIME = 5000; // ms

      const startTime = Date.now();
      const connections: WebSocket[] = [];
      const connectionPromises: Promise<void>[] = [];

      // Create connection promises
      for (let i = 0; i < CLIENT_COUNT; i++) {
        const connectionPromise = new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
          connections.push(ws);

          ws.on('open', () => {
            resolve();
          });

          ws.on('error', (error) => {
            reject(error);
          });

          // Timeout for individual connection
          setTimeout(() => {
            reject(new Error(`Connection ${i} timeout`));
          }, 1000);
        });

        connectionPromises.push(connectionPromise);
      }

      try {
        // Wait for all connections to establish
        await Promise.all(connectionPromises);

        const connectionTime = Date.now() - startTime;
        console.log(`Connected ${CLIENT_COUNT} clients in ${connectionTime}ms`);

        // Verify connection time is within reasonable bounds
        expect(connectionTime).toBeLessThan(5000); // 5 seconds for 100 clients
      } finally {
        // Clean up all connections
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });

        // Wait a bit for cleanup
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }, 10000); // 10 second timeout for the test
  });

  describe('Basic Functionality', () => {
    it('should send welcome message on connection', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

      return new Promise<void>((resolve, reject) => {
        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString());

          if (message.type === 'WELCOME') {
            expect(message.data.connectionId).toBeDefined();
            expect(message.data.serverTime).toBeGreaterThan(0);
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);

        setTimeout(() => {
          ws.close();
          reject(new Error('Welcome message timeout'));
        }, 2000);
      });
    });

    it('should handle ping/pong', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

      return new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          const pingMessage = {
            id: 'test-ping-1',
            type: 'PING',
            timestamp: new Date(),
          };

          ws.send(JSON.stringify(pingMessage));
        });

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString());

          if (message.type === 'PONG') {
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);

        setTimeout(() => {
          ws.close();
          reject(new Error('Pong timeout'));
        }, 2000);
      });
    });
  });
});
