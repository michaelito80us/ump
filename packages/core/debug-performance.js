const { validateSchedule, createTimeSlot } = require('./dist/utils/date.js');
const { DateTime } = require('luxon');

console.log('=== Testing performance of schedule validation ===');

const TIMEZONE = 'Europe/Madrid';
const config = {
  timezone: TIMEZONE,
  defaultDurationMinutes: 60,
  bufferMinutes: 0,
};

const slots = [];
for (let i = 0; i < 100; i++) {
  const start = DateTime.fromISO('2025-06-15T08:00:00', {
    zone: TIMEZONE,
  }).plus({ hours: i });
  const end = start.plus({ minutes: 30 });
  slots.push(createTimeSlot(start.toISO(), end.toISO(), TIMEZONE));
}

console.log('Created', slots.length, 'slots');
console.log('First slot:', slots[0].start.toISO(), 'to', slots[0].end.toISO());
console.log(
  'Last slot:',
  slots[slots.length - 1].start.toISO(),
  'to',
  slots[slots.length - 1].end.toISO()
);

const startTime = Date.now();
const validation = validateSchedule(slots, config);
const endTime = Date.now();

const duration = endTime - startTime;
console.log('\nValidation result:');
console.log('  isValid:', validation.isValid);
console.log('  issues count:', validation.issues.length);
console.log('  duration:', duration, 'ms');
console.log('  expected: < 1000ms');
console.log('  result:', duration < 1000 ? 'PASS ✅' : 'FAIL ❌');

if (validation.issues.length > 0) {
  console.log('\nFirst few issues:');
  validation.issues.slice(0, 5).forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
}
