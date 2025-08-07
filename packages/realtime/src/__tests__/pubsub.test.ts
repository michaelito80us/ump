import { RedisPubSub } from '../services/pubsub';
import { RealtimeEvent, SystemAnnouncementEvent } from '../types/events';

describe('RedisPubSub', () => {
  let pubsub: RedisPubSub;

  beforeAll(() => {
    pubsub = new RedisPubSub({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      keyPrefix: 'test:ump:realtime:',
    });
  });

  afterAll(async () => {
    await pubsub.close();
  });

  describe('Health Check', () => {
    it('should pass health check when Redis is available', async () => {
      const result = await pubsub.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.details.connected).toBe(true);
    });
  });

  describe('Pub/Sub Functionality', () => {
    it('should publish and receive events', async () => {
      const testChannel = 'test:channel:1';
      const testEvent: SystemAnnouncementEvent = {
        id: 'test-event-1',
        type: 'SYSTEM_ANNOUNCEMENT',
        timestamp: new Date(),
        data: {
          message: 'Test announcement',
          level: 'info',
        },
      };

      return new Promise<void>((resolve, reject) => {
        // Set up subscription first
        pubsub.subscribe(testChannel, (receivedEvent) => {
          try {
            expect(receivedEvent.id).toBe(testEvent.id);
            expect(receivedEvent.type).toBe(testEvent.type);
            if (receivedEvent.type === 'SYSTEM_ANNOUNCEMENT') {
              expect(receivedEvent.data.message).toBe(testEvent.data.message);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        // Wait a bit for subscription to be ready, then publish
        setTimeout(async () => {
          try {
            await pubsub.publish(testChannel, testEvent);
          } catch (error) {
            reject(error);
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Event not received within timeout'));
        }, 5000);
      });
    });

    it('should handle match score update events', async () => {
      const testChannel = 'test:channel:2';

      // Create mock team objects that match the Team interface
      const mockTeamA = {
        id: 'team-1',
        name: 'Team Alpha',
        sportIds: ['rugby-7s'],
        playerIds: ['player-1', 'player-2'],
        managers: ['manager-1'],
        tournaments: ['tournament-456'],
      };

      const mockTeamB = {
        id: 'team-2',
        name: 'Team Beta',
        sportIds: ['rugby-7s'],
        playerIds: ['player-3', 'player-4'],
        managers: ['manager-2'],
        tournaments: ['tournament-456'],
      };

      // Create a mock match object that matches the Match interface
      const mockMatch = {
        id: 'match-123',
        teamA: mockTeamA,
        teamB: mockTeamB,
        scoreA: 2,
        scoreB: 1,
        status: 'live' as const,
      };

      const testEvent: RealtimeEvent = {
        id: 'test-event-2',
        type: 'MATCH_SCORE_UPDATED',
        timestamp: new Date(),
        matchId: 'match-123',
        match: mockMatch,
        previousScore: {
          scoreA: 1,
          scoreB: 1,
        },
      };

      return new Promise<void>((resolve, reject) => {
        const handler = (receivedEvent: RealtimeEvent) => {
          try {
            expect(receivedEvent.id).toBe(testEvent.id);
            expect(receivedEvent.type).toBe('MATCH_SCORE_UPDATED');
            if (receivedEvent.type === 'MATCH_SCORE_UPDATED') {
              expect(receivedEvent.match.id).toBe('match-123');
              expect(receivedEvent.match.teamA.name).toBe('Team Alpha');
              expect(receivedEvent.match.teamB.name).toBe('Team Beta');
              expect(receivedEvent.previousScore.scoreA).toBe(1);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        // Subscribe and publish
        pubsub.subscribe(testChannel, handler);

        setTimeout(async () => {
          try {
            await pubsub.publish(testChannel, testEvent);
          } catch (error) {
            reject(error);
          }
        }, 100);

        // Timeout
        setTimeout(() => {
          reject(new Error('Event not received within timeout'));
        }, 5000);
      });
    });

    it('should handle multiple subscribers', async () => {
      const testChannel = 'test:channel:3';
      const testEvent: SystemAnnouncementEvent = {
        id: 'test-event-3',
        type: 'SYSTEM_ANNOUNCEMENT',
        timestamp: new Date(),
        data: {
          message: 'Multi-subscriber test',
          level: 'info',
        },
      };

      let receivedCount = 0;
      const expectedCount = 3;

      return new Promise<void>((resolve, reject) => {
        // Create unique handler functions for each subscription
        const handler1 = (receivedEvent: RealtimeEvent) => {
          receivedCount++;
          expect(receivedEvent.id).toBe(testEvent.id);

          if (receivedCount === expectedCount) {
            resolve();
          }
        };

        const handler2 = (receivedEvent: RealtimeEvent) => {
          receivedCount++;
          expect(receivedEvent.id).toBe(testEvent.id);

          if (receivedCount === expectedCount) {
            resolve();
          }
        };

        const handler3 = (receivedEvent: RealtimeEvent) => {
          receivedCount++;
          expect(receivedEvent.id).toBe(testEvent.id);

          if (receivedCount === expectedCount) {
            resolve();
          }
        };

        // Subscribe with unique handlers
        pubsub.subscribe(testChannel, handler1);
        pubsub.subscribe(testChannel, handler2);
        pubsub.subscribe(testChannel, handler3);

        // Wait for subscriptions, then publish
        setTimeout(async () => {
          try {
            await pubsub.publish(testChannel, testEvent);
          } catch (error) {
            reject(error);
          }
        }, 100);

        // Timeout
        setTimeout(() => {
          reject(
            new Error(`Expected ${expectedCount} events, got ${receivedCount}`)
          );
        }, 5000);
      });
    });
  });

  describe('Connection Management', () => {
    it('should report connection status', () => {
      expect(pubsub.isConnected()).toBe(true);
    });
  });
});
