const {
  createTimeSlot,
  validateSlotDuringDST,
  detectDSTTransitions,
} = require('./dist-esm/utils/date.js');
const { DateTime } = require('luxon');

console.log('Testing DST validation...');

try {
  // First, let's check DST transitions
  const transitions = detectDSTTransitions('Europe/Madrid', 2025);
  console.log('DST transitions for 2025:');
  transitions.forEach((t) => {
    console.log(`${t.type} at ${t.transitionTime.toISO()}`);
  });

  console.log('\n--- Testing slot creation ---');
  const slot = createTimeSlot(
    '2025-03-30T02:00:00',
    '2025-03-30T02:01:00',
    'Europe/Madrid'
  );

  console.log('Created slot:');
  console.log('Start:', slot.start.toISO());
  console.log('End:', slot.end.toISO());
  console.log('Start hour:', slot.start.hour);
  console.log('End hour:', slot.end.hour);

  console.log('\n--- Testing manual DateTime creation ---');
  const testStart = DateTime.fromObject(
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

  console.log('Manual 2:00 AM creation:', testStart.toISO());
  console.log('Manual hour:', testStart.hour);

  console.log('\n--- Testing validation ---');
  const validation = validateSlotDuringDST(slot, 'Europe/Madrid');
  console.log('Is valid:', validation.isValid);
  console.log('Issues:', validation.issues);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
