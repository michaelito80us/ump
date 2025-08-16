import { MockRedis } from './mocks/redis-mock';

describe('Redis Debug', () => {
  it('should emit pmessage events correctly', async () => {
    const publisher = new MockRedis();
    const subscriber = new MockRedis();

    let receivedMessage = false;

    // Subscribe to pattern
    await subscriber.psubscribe('ump:realtime:*');

    // Listen for pmessage
    subscriber.on('pmessage', (pattern, channel, message) => {
      console.log('Received pmessage:', { pattern, channel, message });
      receivedMessage = true;
    });

    // Publish message
    await publisher.publish(
      'ump:realtime:tournament:test',
      JSON.stringify({ test: 'data' })
    );

    // Wait a bit for async emission
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(receivedMessage).toBe(true);
  });
});
