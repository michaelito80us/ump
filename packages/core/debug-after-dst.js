const {
  createTimeSlot,
  validateSlotDuringDST,
} = require('./dist/utils/date.js');

console.log('=== Testing slot AFTER DST transition ===\n');

// Test slot from 3:00-4:00 AM on DST day (should be valid)
const slot = createTimeSlot(
  '2025-03-30T03:00:00',
  '2025-03-30T04:00:00',
  'Europe/Madrid'
);

console.log('1. Slot details:');
console.log('   Start:', slot.start.toISO());
console.log('   End:', slot.end.toISO());
console.log('   Start hour:', slot.start.hour);
console.log('   End hour:', slot.end.hour);

// Get DST transition info
const { detectDSTTransitionsForYear } = require('./dist/utils/date.js');
const transitions = detectDSTTransitionsForYear('Europe/Madrid', 2025);
const springTransition = transitions.find((t) => t.type === 'spring_forward');

console.log('\n2. DST transition details:');
console.log('   Transition time:', springTransition.transitionTime.toISO());
console.log('   Transition hour:', springTransition.transitionTime.hour);

// Calculate skipped hour range
const transitionTime = springTransition.transitionTime;
const skippedHourStartTime = transitionTime;
const skippedHourEndTime = transitionTime.plus({ hours: 1 });

console.log('\n3. Skipped hour range:');
console.log(
  '   Start:',
  skippedHourStartTime.toISO(),
  '(hour:',
  skippedHourStartTime.hour,
  ')'
);
console.log(
  '   End:',
  skippedHourEndTime.toISO(),
  '(hour:',
  skippedHourEndTime.hour,
  ')'
);

// Check span logic
const slotSpansSkippedHour =
  slot.start <= skippedHourEndTime && slot.end >= skippedHourStartTime;

console.log('\n4. Span check:');
console.log(
  '   slot.start <= skippedHourEndTime:',
  slot.start <= skippedHourEndTime
);
console.log(
  '   slot.end >= skippedHourStartTime:',
  slot.end >= skippedHourStartTime
);
console.log('   slotSpansSkippedHour:', slotSpansSkippedHour);

// Run validation
const validation = validateSlotDuringDST(slot, 'Europe/Madrid');

console.log('\n5. Validation result:');
console.log('   isValid:', validation.isValid);
console.log('   issues:', validation.issues);

console.log('\n6. Expected: VALID (3:00-4:00 AM is after the skipped hour)');
console.log('   Result:', validation.isValid ? 'PASS ✅' : 'FAIL ❌');
