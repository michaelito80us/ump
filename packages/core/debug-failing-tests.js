const { DateTime } = require('luxon');
const {
  createTimeSlot,
  validateSlotDuringDST,
  detectDSTTransitionsForYear,
} = require('./dist-esm/utils/date.js');

const TIMEZONE = 'Europe/Madrid';

console.log('=== Testing failing DST validation cases ===');

// First, let's check the DST transitions for 2025
console.log('\n--- DST Transitions for 2025 in Europe/Madrid ---');
const transitions = detectDSTTransitionsForYear(TIMEZONE, 2025);
console.log('Transitions:', JSON.stringify(transitions, null, 2));

// Test 1: should detect slot conflict during spring forward (2 AM - 3 AM skipped)
console.log('\n--- Test 1: Slot starting at 2:30 AM (in skipped hour) ---');
const slot1 = createTimeSlot(
  '2025-03-30T02:30:00',
  '2025-03-30T03:30:00',
  TIMEZONE
);

console.log('Slot 1:');
console.log('  start:', slot1.start.toISO());
console.log('  end:', slot1.end.toISO());
console.log('  start hour:', slot1.start.hour);
console.log('  end hour:', slot1.end.hour);

const validation1 = validateSlotDuringDST(slot1, TIMEZONE);
console.log('Validation 1:');
console.log('  isValid:', validation1.isValid);
console.log('  issues count:', validation1.issues.length);
console.log('  issues:', validation1.issues);
console.log('  expected: isValid = false, 1 issue about spring forward');

// Test 2: should detect slot ending in skipped hour
console.log('\n--- Test 2: Slot ending at 2:30 AM (in skipped hour) ---');
const slot2 = createTimeSlot(
  '2025-03-30T01:30:00',
  '2025-03-30T02:30:00',
  TIMEZONE
);

console.log('Slot 2:');
console.log('  start:', slot2.start.toISO());
console.log('  end:', slot2.end.toISO());
console.log('  start hour:', slot2.start.hour);
console.log('  end hour:', slot2.end.hour);

const validation2 = validateSlotDuringDST(slot2, TIMEZONE);
console.log('Validation 2:');
console.log('  isValid:', validation2.isValid);
console.log('  issues:', validation2.issues);
console.log('  expected: isValid = false, issues about spring forward');

// Let's also test what happens when we try to create times in the skipped hour
console.log('\n--- Testing direct time creation in skipped hour ---');
const testTime1 = DateTime.fromObject(
  {
    year: 2025,
    month: 3,
    day: 30,
    hour: 2,
    minute: 30,
  },
  { zone: TIMEZONE }
);

console.log('Direct creation of 2:30 AM on DST day:');
console.log('  isValid:', testTime1.isValid);
console.log('  actual time:', testTime1.toISO());
console.log('  hour:', testTime1.hour);

const testTime2 = DateTime.fromObject(
  {
    year: 2025,
    month: 3,
    day: 30,
    hour: 2,
    minute: 0,
  },
  { zone: TIMEZONE }
);

console.log('Direct creation of 2:00 AM on DST day:');
console.log('  isValid:', testTime2.isValid);
console.log('  actual time:', testTime2.toISO());
console.log('  hour:', testTime2.hour);
