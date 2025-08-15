import { EventEmitter } from 'events';

/**
 * Mock Redis implementation for testing
 * Simulates basic Redis pub/sub functionality without requiring a real Redis instance
 */
export class MockRedis extends EventEmitter {
  private connected = true;
  private subscriptions = new Set<string>();
  private patternSubscriptions = new Set<string>();
  private static instances: MockRedis[] = [];

  constructor() {
    super();
    MockRedis.instances.push(this);
  }

  // Connection methods
  async ping(): Promise<string> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }
    return 'PONG';
  }

  disconnect(): void {
    this.connected = false;
    this.emit('close');
  }

  quit(): Promise<string> {
    this.disconnect();
    return Promise.resolve('OK');
  }

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }

    // Simulate publishing to all instances
    const subscribers = MockRedis.instances.filter(
      (instance) =>
        instance.connected &&
        (instance.subscriptions.has(channel) ||
          Array.from(instance.patternSubscriptions).some((pattern) =>
            this.matchesPattern(channel, pattern)
          ))
    );

    // Emit to subscribers
    subscribers.forEach((instance) => {
      if (instance.subscriptions.has(channel)) {
        instance.emit('message', channel, message);
      }

      // Check pattern subscriptions
      Array.from(instance.patternSubscriptions).forEach((pattern) => {
        if (this.matchesPattern(channel, pattern)) {
          instance.emit('pmessage', pattern, channel, message);
        }
      });
    });

    return subscribers.length;
  }

  async subscribe(channel: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }
    this.subscriptions.add(channel);
    return this.subscriptions.size;
  }

  async unsubscribe(channel?: string): Promise<number> {
    if (channel) {
      this.subscriptions.delete(channel);
    } else {
      this.subscriptions.clear();
    }
    return this.subscriptions.size;
  }

  async psubscribe(pattern: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }
    this.patternSubscriptions.add(pattern);
    return this.patternSubscriptions.size;
  }

  async punsubscribe(pattern?: string): Promise<number> {
    if (pattern) {
      this.patternSubscriptions.delete(pattern);
    } else {
      this.patternSubscriptions.clear();
    }
    return this.patternSubscriptions.size;
  }

  // Helper methods
  private matchesPattern(channel: string, pattern: string): boolean {
    // Convert Redis pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(channel);
  }

  // Static methods for test control
  static clearInstances(): void {
    MockRedis.instances.forEach((instance) => instance.disconnect());
    MockRedis.instances = [];
  }

  static getInstances(): MockRedis[] {
    return [...MockRedis.instances];
  }
}

// Mock ioredis module
export default MockRedis;
