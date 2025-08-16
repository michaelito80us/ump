import { MockRedis } from './mocks/redis-mock';

describe('Debug pmessage emission', () => {
  beforeEach(() => {
    MockRedis.clearInstances();
  });

  test('should emit pmessage when pattern matches', async () => {
    // Create two instances
    const publisher = new MockRedis();
    const subscriber = new MockRedis();

    // Connect both
    publisher.connect();
    subscriber.connect();

    let pmessageReceived = false;
    let receivedPattern = '';
    let receivedChannel = '';
    let receivedMessage = '';

    // Set up pmessage listener
    subscriber.on('pmessage', (pattern, channel, message) => {
      console.log('*** PMESSAGE RECEIVED ***');
      console.log('Pattern:', pattern);
      console.log('Channel:', channel);
      console.log('Message:', message);
      pmessageReceived = true;
      receivedPattern = pattern;
      receivedChannel = channel;
      receivedMessage = message;
    });

    // Subscribe to pattern
    await subscriber.psubscribe('ump:realtime:*');
    console.log('Pattern subscription complete');

    // Publish a message
    console.log('Publishing message...');
    const messageData = JSON.stringify({
      type: 'tournament_update',
      data: { id: 'test-tournament' },
    });

    publisher.publish('ump:realtime:tournament:test-tournament', messageData);

    // Wait for async emission
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify pmessage was received
    expect(pmessageReceived).toBe(true);
    expect(receivedPattern).toBe('ump:realtime:*');
    expect(receivedChannel).toBe('ump:realtime:tournament:test-tournament');
    expect(receivedMessage).toBe(messageData);
  });
});
