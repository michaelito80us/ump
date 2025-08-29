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
    // Ensure we're connected immediately for tests
    this.connected = true;

    // Auto-connect for test environment
    process.nextTick(() => {
      this.emit('connect');
      this.emit('ready');
    });
  }

  // Connection methods
  handleConnection(): void {
    this.connected = true;
    this.emit('connect');
  }

  async ping(): Promise<string> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }
    return 'PONG';
  }

  get status(): string {
    return this.connected ? 'ready' : 'close';
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connect');
    this.emit('ready');
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

    // Use setTimeout to simulate async behavior
    setTimeout(() => {
      // Emit message events to ALL instances with matching channel subscriptions
      // This simulates how Redis pub/sub works across different connections
      MockRedis.instances.forEach((instance) => {
        if (instance.connected && instance.subscriptions.has(channel)) {
          instance.emit('message', channel, message);
        }
      });

      // Emit pmessage events to ALL instances with matching pattern subscriptions
      // This simulates how Redis pub/sub works across different connections
      MockRedis.instances.forEach((instance) => {
        if (instance.connected) {
          Array.from(instance.patternSubscriptions).forEach((pattern) => {
            const matches = this.matchesPattern(channel, pattern);
            if (matches) {
              instance.emit('pmessage', pattern, channel, message);
            }
          });
        }
      });
    }, 0);

    return 1;
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

  // Key-value methods for health checks
  private storage = new Map<string, { value: string; expiry?: number }>();

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number
  ): Promise<string> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }

    const entry: { value: string; expiry?: number } = { value };

    if (mode === 'EX' && duration) {
      entry.expiry = Date.now() + duration * 1000;
    }

    this.storage.set(key, entry);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }

    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.storage.delete(key);
      return null;
    }

    return entry.value;
  }

  async del(key: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Redis connection failed');
    }

    const existed = this.storage.has(key);
    this.storage.delete(key);
    return existed ? 1 : 0;
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
    MockRedis.instances.forEach((instance) => {
      instance.storage.clear();
      instance.disconnect();
      instance.removeAllListeners();
    });
    MockRedis.instances = [];
  }

  static resetInstances(): void {
    MockRedis.instances.forEach((instance) => {
      instance.connected = true;
      instance.subscriptions.clear();
      // Don't clear pattern subscriptions as they're set up during server initialization
      // instance.patternSubscriptions.clear();
      instance.storage.clear(); // Clear storage for fresh state
      // Don't remove all listeners - preserve message and pmessage listeners for pub/sub
      // instance.removeAllListeners();
      process.nextTick(() => {
        instance.emit('connect');
        instance.emit('ready');
      });
    });
  }

  static getInstances(): MockRedis[] {
    return [...MockRedis.instances];
  }
}

// Mock ioredis module
export default MockRedis;
