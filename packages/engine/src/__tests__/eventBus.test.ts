import {
  EventBus,
  createTypedEventBus,
  defaultEventBus,
  EventMap,
} from '../eventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('subscribe and publish', () => {
    it('should allow subscribing to events and receiving published data', () => {
      const mockHandler = jest.fn();
      const testData = { message: 'test data' };

      eventBus.subscribe('test-event', mockHandler);
      eventBus.publish('test-event', testData);

      expect(mockHandler).toHaveBeenCalledWith(testData);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers for the same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const testData = { value: 42 };

      eventBus.subscribe('multi-event', handler1);
      eventBus.subscribe('multi-event', handler2);
      eventBus.publish('multi-event', testData);

      expect(handler1).toHaveBeenCalledWith(testData);
      expect(handler2).toHaveBeenCalledWith(testData);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers for different events', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe('event-a', handler1);
      eventBus.subscribe('event-b', handler2);
      eventBus.publish('event-a', { data: 'a' });

      expect(handler1).toHaveBeenCalledWith({ data: 'a' });
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle publishing to events with no subscribers', () => {
      expect(() => {
        eventBus.publish('non-existent-event', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('should remove specific handler from event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe('test-event', handler1);
      eventBus.subscribe('test-event', handler2);
      eventBus.unsubscribe('test-event', handler1);
      eventBus.publish('test-event', { data: 'test' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should clean up event entry when no handlers remain', () => {
      const handler = jest.fn();

      eventBus.subscribe('cleanup-event', handler);
      expect(eventBus.listenerCount('cleanup-event')).toBe(1);

      eventBus.unsubscribe('cleanup-event', handler);
      expect(eventBus.listenerCount('cleanup-event')).toBe(0);
      expect(eventBus.eventNames()).not.toContain('cleanup-event');
    });

    it('should handle unsubscribing non-existent handler gracefully', () => {
      const handler = jest.fn();

      expect(() => {
        eventBus.unsubscribe('non-existent-event', handler);
      }).not.toThrow();

      eventBus.subscribe('test-event', handler);
      expect(() => {
        eventBus.unsubscribe('test-event', jest.fn()); // Different handler
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should catch and log errors in event handlers without stopping other handlers', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = jest.fn();

      eventBus.subscribe('error-event', errorHandler);
      eventBus.subscribe('error-event', goodHandler);
      eventBus.publish('error-event', { data: 'test' });

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalledWith({ data: 'test' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in event handler for 'error-event':",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle handlers that modify the listeners set during iteration', () => {
      const selfUnsubscribingHandler = jest.fn(() => {
        eventBus.unsubscribe('modify-event', selfUnsubscribingHandler);
      });
      const normalHandler = jest.fn();

      eventBus.subscribe('modify-event', selfUnsubscribingHandler);
      eventBus.subscribe('modify-event', normalHandler);

      expect(() => {
        eventBus.publish('modify-event', { data: 'test' });
      }).not.toThrow();

      expect(selfUnsubscribingHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should return correct listener count', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      expect(eventBus.listenerCount('count-event')).toBe(0);

      eventBus.subscribe('count-event', handler1);
      expect(eventBus.listenerCount('count-event')).toBe(1);

      eventBus.subscribe('count-event', handler2);
      expect(eventBus.listenerCount('count-event')).toBe(2);

      eventBus.unsubscribe('count-event', handler1);
      expect(eventBus.listenerCount('count-event')).toBe(1);
    });

    it('should return all event names with listeners', () => {
      const handler = jest.fn();

      expect(eventBus.eventNames()).toEqual([]);

      eventBus.subscribe('event-1', handler);
      eventBus.subscribe('event-2', handler);

      const eventNames = eventBus.eventNames();
      expect(eventNames).toContain('event-1');
      expect(eventNames).toContain('event-2');
      expect(eventNames).toHaveLength(2);
    });

    it('should remove all listeners', () => {
      const handler = jest.fn();

      eventBus.subscribe('event-1', handler);
      eventBus.subscribe('event-2', handler);
      expect(eventBus.eventNames()).toHaveLength(2);

      eventBus.removeAllListeners();
      expect(eventBus.eventNames()).toHaveLength(0);
      expect(eventBus.listenerCount('event-1')).toBe(0);
      expect(eventBus.listenerCount('event-2')).toBe(0);
    });

    it('should remove all listeners for specific event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.subscribe('event-1', handler1);
      eventBus.subscribe('event-1', handler2);
      eventBus.subscribe('event-2', handler1);

      eventBus.removeAllListenersForEvent('event-1');

      expect(eventBus.listenerCount('event-1')).toBe(0);
      expect(eventBus.listenerCount('event-2')).toBe(1);
      expect(eventBus.eventNames()).toEqual(['event-2']);
    });
  });

  describe('plugin communication scenarios', () => {
    it('should enable weather plugin to scheduling plugin communication', () => {
      const schedulingHandler = jest.fn();
      const weatherData = { venue: 'Field A', forecast: 'rain' };

      // Scheduling plugin subscribes to weather updates
      eventBus.subscribe('weather-plugin:weather-update', schedulingHandler);

      // Weather plugin publishes forecast
      eventBus.publish('weather-plugin:weather-update', weatherData);

      expect(schedulingHandler).toHaveBeenCalledWith(weatherData);
    });

    it('should support namespaced events for plugin isolation', () => {
      const pluginAHandler = jest.fn();
      const pluginBHandler = jest.fn();

      eventBus.subscribe('plugin-a:data-update', pluginAHandler);
      eventBus.subscribe('plugin-b:data-update', pluginBHandler);

      eventBus.publish('plugin-a:data-update', { source: 'A' });
      eventBus.publish('plugin-b:data-update', { source: 'B' });

      expect(pluginAHandler).toHaveBeenCalledWith({ source: 'A' });
      expect(pluginAHandler).not.toHaveBeenCalledWith({ source: 'B' });
      expect(pluginBHandler).toHaveBeenCalledWith({ source: 'B' });
      expect(pluginBHandler).not.toHaveBeenCalledWith({ source: 'A' });
    });

    it('should handle high-frequency events efficiently', () => {
      const handler = jest.fn();
      eventBus.subscribe('high-freq-event', handler);

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        eventBus.publish('high-freq-event', { iteration: i });
      }
      const endTime = Date.now();

      expect(handler).toHaveBeenCalledTimes(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('TypeScript type safety and event mapping', () => {
    it('should work with default event map types', () => {
      const weatherHandler = jest.fn();
      const matchHandler = jest.fn();

      eventBus.subscribe('weatherUpdate', weatherHandler);
      eventBus.subscribe('matchUpdate', matchHandler);

      const weatherData = {
        venue: 'Field A',
        forecast: 'sunny',
        temperature: 25,
      };
      const matchData = {
        matchId: 'match-1',
        status: 'live',
        score: { home: 2, away: 1 },
      };

      eventBus.publish('weatherUpdate', weatherData);
      eventBus.publish('matchUpdate', matchData);

      expect(weatherHandler).toHaveBeenCalledWith(weatherData);
      expect(matchHandler).toHaveBeenCalledWith(matchData);
    });

    it('should support custom typed event maps', () => {
      interface CustomEventMap extends EventMap {
        customEvent: { id: number; name: string };
        anotherEvent: { value: boolean };
      }

      const typedEventBus = createTypedEventBus<CustomEventMap>();
      const customHandler = jest.fn();

      typedEventBus.subscribe('customEvent', customHandler);
      typedEventBus.publish('customEvent', { id: 1, name: 'test' });

      expect(customHandler).toHaveBeenCalledWith({ id: 1, name: 'test' });
    });

    it('should work with typed event handlers', () => {
      interface WeatherData {
        venue: string;
        forecast: string;
        temperature?: number;
      }

      const typedHandler = jest.fn<void, [WeatherData]>();
      const weatherData: WeatherData = {
        venue: 'Field A',
        forecast: 'sunny',
        temperature: 25,
      };

      eventBus.subscribe('typed-event', typedHandler);
      eventBus.publish('typed-event', weatherData);

      expect(typedHandler).toHaveBeenCalledWith(weatherData);
    });

    it('should provide default event bus instance', () => {
      const handler = jest.fn();

      defaultEventBus.subscribe('test-default', handler);
      defaultEventBus.publish('test-default', { data: 'default test' });

      expect(handler).toHaveBeenCalledWith({ data: 'default test' });
    });
  });

  describe('engine integration scenarios', () => {
    it('should support the weather to scheduling plugin example from spec', () => {
      const adjustSchedule = jest.fn();

      // SchedulingPlugin listens
      eventBus.subscribe('weatherUpdate', (data) => adjustSchedule(data));

      // WeatherPlugin emits forecasts
      eventBus.publish('weatherUpdate', { venue: 'Field A', forecast: 'rain' });

      expect(adjustSchedule).toHaveBeenCalledWith({
        venue: 'Field A',
        forecast: 'rain',
      });
    });

    it('should handle plugin shared context communication pattern', () => {
      const getForecast = jest.fn((venue: string) => `${venue}: sunny`);
      const schedulingPlugin = jest.fn();

      // WeatherPlugin shares function via event
      eventBus.subscribe('weather:function-share', (data) => {
        if (data.type === 'getForecast') {
          schedulingPlugin(data.function);
        }
      });

      // WeatherPlugin publishes its function
      eventBus.publish('weather:function-share', {
        type: 'getForecast',
        function: getForecast,
      });

      expect(schedulingPlugin).toHaveBeenCalledWith(getForecast);
    });
  });
});
