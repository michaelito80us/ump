/**
 * Lightweight pub/sub event bus implementation (~30 LOC)
 * Provides type-safe event handling for plugin communication
 */

export interface EventHandler<T = any> {
  (data: T): void;
}

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event
   */
  subscribe(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   */
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
   * Publish an event to all subscribers
   */
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
