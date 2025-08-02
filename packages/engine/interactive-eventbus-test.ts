#!/usr/bin/env ts-node

/**
 * Interactive EventBus Test Script
 * Run with: npx ts-node interactive-eventbus-test.ts
 */

import { EventBus, createTypedEventBus, EventMap } from './src/eventBus';

console.log('🚀 EventBus Interactive Test\n');

// Test 1: Basic EventBus functionality
console.log('📝 Test 1: Basic EventBus functionality');
const eventBus = new EventBus();

const basicHandler = (data: any) => {
  console.log('✅ Received event:', data);
};

eventBus.subscribe('test-event', basicHandler);
console.log('📡 Publishing test event...');
eventBus.publish('test-event', {
  message: 'Hello EventBus!',
  timestamp: new Date(),
});

console.log(`📊 Listener count: ${eventBus.listenerCount('test-event')}`);
console.log(`📋 Event names: ${eventBus.eventNames().join(', ')}\n`);

// Test 2: Type-safe EventBus
console.log('📝 Test 2: Type-safe EventBus');

interface CustomEventMap extends EventMap {
  weatherUpdate: { venue: string; forecast: string; temperature?: number };
  matchUpdate: { matchId: string; status: string; score?: any };
}

const typedEventBus = createTypedEventBus<CustomEventMap>();

typedEventBus.subscribe('weatherUpdate', (data) => {
  console.log(
    `🌤️  Weather at ${data.venue}: ${data.forecast}${data.temperature ? ` (${data.temperature}°C)` : ''}`
  );
});

typedEventBus.subscribe('matchUpdate', (data) => {
  console.log(
    `⚽ Match ${data.matchId} is ${data.status}${data.score ? ` - Score: ${JSON.stringify(data.score)}` : ''}`
  );
});

console.log('📡 Publishing weather update...');
typedEventBus.publish('weatherUpdate', {
  venue: 'Field A',
  forecast: 'sunny',
  temperature: 25,
});

console.log('📡 Publishing match update...');
typedEventBus.publish('matchUpdate', {
  matchId: 'match-001',
  status: 'live',
  score: { home: 2, away: 1 },
});

// Test 3: Plugin communication simulation
console.log('\n📝 Test 3: Plugin Communication Simulation');

// Simulate WeatherPlugin
const weatherPlugin = {
  name: 'WeatherPlugin',
  publishForecast: (venue: string, forecast: string) => {
    console.log(`🌦️  [${weatherPlugin.name}] Publishing weather for ${venue}`);
    eventBus.publish('weather-plugin:forecast', {
      venue,
      forecast,
      timestamp: Date.now(),
    });
  },
};

// Simulate SchedulingPlugin
const schedulingPlugin = {
  name: 'SchedulingPlugin',
  init: () => {
    eventBus.subscribe('weather-plugin:forecast', (data) => {
      console.log(
        `📅 [${schedulingPlugin.name}] Received weather update: ${data.venue} - ${data.forecast}`
      );
      if (data.forecast === 'rain') {
        console.log(
          `📅 [${schedulingPlugin.name}] ⚠️  Adjusting schedule due to rain at ${data.venue}`
        );
      }
    });
  },
};

schedulingPlugin.init();
weatherPlugin.publishForecast('Field A', 'sunny');
weatherPlugin.publishForecast('Field B', 'rain');

// Test 4: Error handling
console.log('\n📝 Test 4: Error Handling');

const errorHandler = () => {
  throw new Error('Simulated handler error');
};

const goodHandler = (data: any) => {
  console.log('✅ Good handler still works:', data.message);
};

eventBus.subscribe('error-test', errorHandler);
eventBus.subscribe('error-test', goodHandler);

console.log('📡 Publishing event that will cause an error...');
eventBus.publish('error-test', { message: 'Testing error handling' });

// Test 5: Performance test
console.log('\n📝 Test 5: Performance Test');

const perfHandler = () => {
  /* no-op for performance */
};
eventBus.subscribe('perf-test', perfHandler);

const iterations = 10000;
console.log(`🏃 Running ${iterations} events...`);

const startTime = Date.now();
for (let i = 0; i < iterations; i++) {
  eventBus.publish('perf-test', { iteration: i });
}
const endTime = Date.now();

console.log(`⚡ Completed ${iterations} events in ${endTime - startTime}ms`);
console.log(
  `📈 Average: ${((endTime - startTime) / iterations).toFixed(3)}ms per event`
);

// Test 6: Cleanup
console.log('\n📝 Test 6: Cleanup');
console.log(`📊 Total events before cleanup: ${eventBus.eventNames().length}`);
eventBus.removeAllListeners();
console.log(`📊 Total events after cleanup: ${eventBus.eventNames().length}`);

console.log('\n🎉 All tests completed successfully!');
