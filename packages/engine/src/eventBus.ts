/**
 * Lightweight pub/sub event bus implementation (~30 LOC)
 * Provides type-safe event handling for plugin communication
 */

export interface EventHandler<T = any> {
  (data: T): void;
}

/**
 * Type-safe event map interface for better TypeScript support
 * Plugins can extend this interface to define their event types
 */
export interface EventMap {
  [eventName: string]: any;
}

/**
 * Default event map with common plugin events
 */
export interface DefaultEventMap extends EventMap {
  weatherUpdate: { venue: string; forecast: string; temperature?: number };
  matchUpdate: { matchId: string; status: string; score?: any };
  scheduleChange: { matches: any[]; reason: string };
  playerUpdate: { playerId: string; stats: any };
  phaseComplete: { phaseId: string; results: any[] };
}

export class EventBus<TEventMap extends EventMap = DefaultEventMap> {
  private listeners = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event with type safety
   */
  subscribe<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): void;
  subscribe(event: string, handler: EventHandler): void;
  subscribe(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event with type safety
   */
  unsubscribe<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): void;
  unsubscribe(event: string, handler: EventHandler): void;
  unsubscribe(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Publish an event with type safety
   */
  publish<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void;
  publish(event: string, data: any): void;
  publish(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      // Create a copy to avoid issues if handlers modify the set during iteration
      const handlersCopy = Array.from(handlers);
      for (const handler of handlersCopy) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      }
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners for all events
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListenersForEvent(event: string): void {
    this.listeners.delete(event);
  }
}

/**
 * Create a typed EventBus instance for plugins
 */
export function createTypedEventBus<
  TEventMap extends EventMap = DefaultEventMap,
>(): EventBus<TEventMap> {
  return new EventBus<TEventMap>();
}

// Export default EventBus for backward compatibility
export const defaultEventBus = new EventBus();
