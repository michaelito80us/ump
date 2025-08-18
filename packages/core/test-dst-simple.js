const {
  createTimeSlot,
  validateSlotDuringDST,
  detectDSTTransitionsForYear,
} = require('./dist-esm/utils/date.js');
const { DateTime } = require('luxon');

console.log('=== Testing DST validation directly ===');

try {
  console.log('\n1. Creating slot for 2:00-2:01 AM on 2025-03-30:');
  const slot = createTimeSlot(
    '2025-03-30T02:00:00',
    '2025-03-30T02:01:00',
    'Europe/Madrid'
  );
  console.log('   Slot start:', slot.start.toISO());
  console.log('   Slot end:', slot.end.toISO());

  console.log('\n2. Manual test - what happens when we create 2:00 AM:');
  const test2AM = DateTime.fromObject(
    {
      year: 2025,
      month: 3,
      day: 30,
      hour: 2,
      minute: 0,
      second: 0,
    },
    { zone: 'Europe/Madrid' }
  );
  const test2_01AM = DateTime.fromObject(
    {
      year: 2025,
      month: 3,
      day: 30,
      hour: 2,
      minute: 1,
      second: 0,
    },
    { zone: 'Europe/Madrid' }
  );

  console.log(
    '   2:00 AM becomes:',
    test2AM.toISO(),
    '(hour:',
    test2AM.hour,
    ')'
  );
  console.log(
    '   2:01 AM becomes:',
    test2_01AM.toISO(),
    '(hour:',
    test2_01AM.hour,
    ')'
  );
  console.log('   Slot start equals test 2:00?', slot.start.equals(test2AM));
  console.log('   Slot end equals test 2:01?', slot.end.equals(test2_01AM));

  console.log('\n3. Key insight:');
  console.log('   - Both 2:00 and 2:01 get adjusted to hour 3 (not 2)');
  console.log(
    '   - The slot times match exactly what Luxon creates for 2:00-2:01'
  );
  console.log('   - This proves the original input was in the skipped hour');

  console.log('\n4. Check DST transitions for 2025:');
  const transitions = detectDSTTransitionsForYear('Europe/Madrid', 2025);
  console.log('   Found transitions:', transitions.length);
  transitions.forEach((t, i) => {
    console.log(
      `   Transition ${i + 1}: ${t.type} at ${t.transitionTime.toISO()}`
    );
  });

  console.log('\n5. Running validation:');
  const validation = validateSlotDuringDST(slot, 'Europe/Madrid');
  console.log('   Is valid:', validation.isValid);
  console.log('   Issues:', validation.issues);

  console.log("\n6. Expected: INVALID (2:00-2:01 AM doesn't exist on DST day)");
  console.log('   Result:', validation.isValid ? 'FAIL ❌' : 'PASS ✅');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
