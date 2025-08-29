const {
  createTimeSlot,
  validateSlotDuringDST,
} = require('./dist/utils/date.js');

console.log('=== Testing very short slot during DST transition ===\n');

// Test the exact same slot as in the failing test
const slot = createTimeSlot(
  '2025-03-30T02:00:00',
  '2025-03-30T02:01:00', // 1 minute in skipped hour
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

const transitionTime = springTransition.transitionTime;
const skippedHourStartTime = transitionTime;
const skippedHourEndTime = transitionTime.plus({ hours: 1 });

console.log('\n2. Skipped hour range:');
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

console.log('\n3. Comparison:');
console.log(
  '   slot.start.equals(skippedHourEndTime):',
  slot.start.equals(skippedHourEndTime)
);
console.log(
  '   slot.end.equals(skippedHourEndTime):',
  slot.end.equals(skippedHourEndTime)
);
console.log(
  '   slot.start.hour === skippedHourEndTime.hour:',
  slot.start.hour === skippedHourEndTime.hour
);
console.log(
  '   slot.end.hour === skippedHourEndTime.hour:',
  slot.end.hour === skippedHourEndTime.hour
);

// Run validation
const validation = validateSlotDuringDST(slot, 'Europe/Madrid');

console.log('\n4. Validation result:');
console.log('   isValid:', validation.isValid);
console.log('   issues:', validation.issues);

console.log('\n5. Expected: INVALID (2:00-2:01 AM is in the skipped hour)');
console.log('   Result:', validation.isValid ? 'FAIL ❌' : 'PASS ✅');
