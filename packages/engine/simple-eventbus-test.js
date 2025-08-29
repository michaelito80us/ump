// Simple EventBus Test (JavaScript)
const { EventBus } = require('./dist/eventBus');

console.log('🚀 Comprehensive EventBus Test\n');

// Test 1: Basic functionality
console.log('📝 Test 1: Basic EventBus');
const eventBus = new EventBus();

eventBus.subscribe('weather', (data) => {
  console.log(`🌤️  Weather update: ${data.venue} - ${data.forecast}`);
});

eventBus.subscribe('match', (data) => {
  console.log(`⚽ Match update: ${data.matchId} is ${data.status}`);
});

eventBus.publish('weather', { venue: 'Field A', forecast: 'sunny' });
eventBus.publish('match', { matchId: 'match-001', status: 'live' });

// Test 2: Multiple subscribers
console.log('\n📝 Test 2: Multiple Subscribers');
const handler1 = (data) => console.log('Handler 1:', data.message);
const handler2 = (data) => console.log('Handler 2:', data.message);

eventBus.subscribe('multi-test', handler1);
eventBus.subscribe('multi-test', handler2);
eventBus.publish('multi-test', { message: 'Hello to all handlers!' });

// Test 3: Unsubscribe
console.log('\n📝 Test 3: Unsubscribe');
console.log(
  'Before unsubscribe - listeners:',
  eventBus.listenerCount('multi-test')
);
eventBus.unsubscribe('multi-test', handler1);
console.log(
  'After unsubscribe - listeners:',
  eventBus.listenerCount('multi-test')
);

// Test 4: Performance
console.log('\n📝 Test 4: Performance Test');
const perfHandler = () => {}; // no-op
eventBus.subscribe('perf', perfHandler);

const start = Date.now();
for (let i = 0; i < 1000; i++) {
  eventBus.publish('perf', { iteration: i });
}
const end = Date.now();
console.log(`⚡ 1000 events in ${end - start}ms`);

console.log('\n🎉 All tests completed successfully!');
console.log(`📊 Active events: ${eventBus.eventNames().join(', ')}`);
