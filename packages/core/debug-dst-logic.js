const { DateTime } = require('luxon');
const {
  createTimeSlot,
  validateSlotDuringDST,
} = require('./dist-esm/utils/date.js');

const TIMEZONE = 'Europe/Madrid';

console.log('=== Debugging DST Logic ===\n');

// Create the problematic slot
const slot = createTimeSlot(
  '2025-03-30T02:00:00',
  '2025-03-30T02:01:00',
  TIMEZONE
);

console.log('1. Slot details:');
console.log('   Start:', slot.start.toISO(), '(hour:', slot.start.hour, ')');
console.log('   End:', slot.end.toISO(), '(hour:', slot.end.hour, ')');

// Check transition details
const transitionTime = DateTime.fromISO('2025-03-30T01:00:00', {
  zone: TIMEZONE,
});
const skippedHourStart = transitionTime.hour + 1; // Should be 2
const skippedHourEnd = skippedHourStart + 1; // Should be 3

console.log('\n2. Transition details:');
console.log('   Transition time:', transitionTime.toISO());
console.log('   Skipped hour start:', skippedHourStart);
console.log('   Skipped hour end:', skippedHourEnd);

// Create the skipped hour time range (using the new logic)
const transitionDay = transitionTime.startOf('day');
const skippedHourStartTime = transitionTime; // 1:00 AM
const skippedHourEndTime = transitionTime.plus({ hours: 1 }); // This becomes 3:00 AM due to DST

console.log('\n3. Skipped hour range:');
console.log(
  '   Start time:',
  skippedHourStartTime.toISO(),
  '(hour:',
  skippedHourStartTime.hour,
  ')'
);
console.log(
  '   End time:',
  skippedHourEndTime.toISO(),
  '(hour:',
  skippedHourEndTime.hour,
  ')'
);

// Check the span logic
const slotSpansSkippedHour =
  slot.start < skippedHourEndTime && slot.end > skippedHourStartTime;
console.log('\n4. Span check:');
console.log(
  '   slot.start < skippedHourEndTime:',
  slot.start < skippedHourEndTime
);
console.log(
  '   slot.end > skippedHourStartTime:',
  slot.end > skippedHourStartTime
);
console.log('   slotSpansSkippedHour:', slotSpansSkippedHour);

// Test the precise detection
console.log('\n5. Precise detection test:');
const testStart = DateTime.fromObject(
  {
    year: transitionDay.year,
    month: transitionDay.month,
    day: transitionDay.day,
    hour: skippedHourStart,
    minute: slot.start.minute,
    second: slot.start.second,
  },
  { zone: TIMEZONE }
);

const testEnd = DateTime.fromObject(
  {
    year: transitionDay.year,
    month: transitionDay.month,
    day: transitionDay.day,
    hour: skippedHourStart,
    minute: slot.end.minute,
    second: slot.end.second,
  },
  { zone: TIMEZONE }
);

console.log('   Test start:', testStart.toISO(), '(hour:', testStart.hour, ')');
console.log('   Test end:', testEnd.toISO(), '(hour:', testEnd.hour, ')');

const startWasAdjusted = testStart.hour !== skippedHourStart;
const endWasAdjusted = testEnd.hour !== skippedHourStart;
const startMatches = slot.start.equals(testStart);
const endMatches = slot.end.equals(testEnd);

console.log('   Start was adjusted:', startWasAdjusted);
console.log('   End was adjusted:', endWasAdjusted);
console.log('   Start matches:', startMatches);
console.log('   End matches:', endMatches);

// Run the actual validation
console.log('\n6. Validation result:');
const validation = validateSlotDuringDST(slot, TIMEZONE);
console.log('   Is valid:', validation.isValid);
console.log('   Issues:', validation.issues);
