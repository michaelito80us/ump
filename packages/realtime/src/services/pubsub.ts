import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import type { RealtimeEvent } from '../types/events';

export interface PubSubConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  keyPrefix?: string;
}

export class RedisPubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private keyPrefix: string;
  private eventHandlers: Map<string, Set<(event: RealtimeEvent) => void>> =
    new Map();
  private patternHandlers: Map<
    string,
    Set<(channel: string, event: RealtimeEvent) => void>
  > = new Map();

  constructor(config: PubSubConfig) {
    this.keyPrefix = config.keyPrefix || 'ump:realtime:';

    // Create Redis connections with proper options
    const redisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    };

    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);
    this.setupSubscriber();
  }

  private setupSubscriber(): void {
    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        const event: RealtimeEvent = JSON.parse(message);
        const cleanChannel = this.removeKeyPrefix(channel);
        const handlers = this.eventHandlers.get(cleanChannel);

        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(event);
            } catch (error: unknown) {
              console.error('Error in event handler:', error);
            }
          });
        }
      } catch (error: unknown) {
        console.error('Error parsing Redis message:', error);
      }
    });

    this.subscriber.on(
      'pmessage',
      (pattern: string, channel: string, message: string) => {
        try {
          const event: RealtimeEvent = JSON.parse(message);
          const cleanChannel = this.removeKeyPrefix(channel);

          // Find handlers for this pattern
          const handlers = this.patternHandlers.get(pattern);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(cleanChannel, event);
              } catch (error: unknown) {
                console.error('Error in pattern handler:', error);
              }
            });
          }
        } catch (error: unknown) {
          console.error('Error parsing pattern message:', error);
        }
      }
    );

    this.subscriber.on('error', (error: Error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  private addKeyPrefix(channel: string): string {
    return `${this.keyPrefix}${channel}`;
  }

  private removeKeyPrefix(channel: string): string {
    return channel.startsWith(this.keyPrefix)
      ? channel.slice(this.keyPrefix.length)
      : channel;
  }

  /**
   * Publish an event to a specific channel
   */
  async publish(channel: string, event: RealtimeEvent): Promise<void> {
    try {
      const message = JSON.stringify(event);
      const prefixedChannel = this.addKeyPrefix(channel);
      await this.publisher.publish(prefixedChannel, message);
    } catch (error: unknown) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events on a specific channel
   */
  async subscribe(
    channel: string,
    handler: (event: RealtimeEvent) => void
  ): Promise<void> {
    try {
      if (!this.eventHandlers.has(channel)) {
        this.eventHandlers.set(channel, new Set());
        const prefixedChannel = this.addKeyPrefix(channel);
        await this.subscriber.subscribe(prefixedChannel);
      }

      this.eventHandlers.get(channel)!.add(handler);
    } catch (error: unknown) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from events on a specific channel
   */
  async unsubscribe(
    channel: string,
    handler?: (event: RealtimeEvent) => void
  ): Promise<void> {
    try {
      const handlers = this.eventHandlers.get(channel);
      if (!handlers) return;

      if (handler) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(channel);
          const prefixedChannel = this.addKeyPrefix(channel);
          await this.subscriber.unsubscribe(prefixedChannel);
        }
      } else {
        // Unsubscribe all handlers for this channel
        this.eventHandlers.delete(channel);
        const prefixedChannel = this.addKeyPrefix(channel);
        await this.subscriber.unsubscribe(prefixedChannel);
      }
    } catch (error: unknown) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple channels using pattern matching
   */
  async psubscribe(
    pattern: string,
    handler: (channel: string, event: RealtimeEvent) => void
  ): Promise<void> {
    try {
      const prefixedPattern = this.addKeyPrefix(pattern);

      // Store the handler for this pattern
      if (!this.patternHandlers.has(prefixedPattern)) {
        this.patternHandlers.set(prefixedPattern, new Set());
      }
      this.patternHandlers.get(prefixedPattern)!.add(handler);

      console.log(
        `RedisPubSub calling psubscribe with pattern: ${prefixedPattern}`
      );
      await this.subscriber.psubscribe(prefixedPattern);
      console.log(
        `RedisPubSub psubscribe completed for pattern: ${prefixedPattern}`
      );
    } catch (error: unknown) {
      console.error('Error pattern subscribing:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return (
      this.publisher.status === 'ready' && this.subscriber.status === 'ready'
    );
  }

  /**
   * Close all Redis connections
   */
  async close(): Promise<void> {
    try {
      await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
    } catch (error: unknown) {
      console.error('Error closing Redis connections:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const testKey = `${this.keyPrefix}health:${uuidv4()}`;
      const testValue = Date.now().toString();

      await this.publisher.set(testKey, testValue, 'EX', 10);
      const result = await this.publisher.get(testKey);
      await this.publisher.del(testKey);

      if (result === testValue) {
        return {
          status: 'healthy',
          details: {
            publisher: this.publisher.status,
            subscriber: this.subscriber.status,
            connected: this.isConnected(),
          },
        };
      } else {
        return {
          status: 'unhealthy',
          details: { error: 'Redis read/write test failed' },
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        details: { error: errorMessage },
      };
    }
  }
}
