# DST-Aware Scheduling Documentation

## Overview

The UMP scheduling system now includes robust Daylight Saving Time (DST) awareness to prevent scheduling conflicts during DST transitions. This documentation covers the implementation, usage, and best practices for DST-aware scheduling.

## Key Features

- **Automatic DST Transition Detection**: Identifies when scheduling slots overlap with DST transitions
- **Timezone-Aware Calculations**: Uses Luxon library for precise timezone handling
- **Slot Validation**: Prevents scheduling during problematic DST transition periods
- **Performance Optimized**: Smart caching and validation to maintain scheduling performance

## Core Components

### 1. Date Utilities (`@ump/core/utils/date`)

The core date utilities provide DST-aware functions for scheduling operations:

```typescript
import {
  createTimeSlot,
  validateSlotDuringDST,
  validateSlotsNoOverlap,
  DateTime,
} from '@ump/core/utils/date';
```

#### Key Functions

##### `createTimeSlot(start: string, end: string, timezone?: string): TimeSlot`

Creates a timezone-aware time slot object.

```typescript
const slot = createTimeSlot(
  '2025-03-30T01:30:00.000Z',
  '2025-03-30T03:30:00.000Z',
  'Europe/Madrid'
);
```

##### `validateSlotDuringDST(slot: TimeSlot, timezone: string): DSTValidationResult`

Validates if a time slot conflicts with DST transitions.

```typescript
const validation = validateSlotDuringDST(slot, 'Europe/Madrid');
if (!validation.isValid) {
  console.warn('DST conflict:', validation.issues);
}
```

##### `validateSlotsNoOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean`

Checks if two time slots overlap, accounting for DST transitions.

```typescript
const noOverlap = validateSlotsNoOverlap(slot1, slot2);
```

### 2. DST-Aware Scheduling Plugins

#### GreedyScheduler

The GreedyScheduler has been updated to use DST-aware date utilities:

```typescript
import { GreedyScheduler } from '@ump/plugins/scheduling/greedy';

const scheduler = new GreedyScheduler();
const scheduledMatches = scheduler.scheduleMatches(matches, constraints);
```

The scheduler automatically:

- Validates slots for DST conflicts
- Uses DateTime objects for precise calculations
- Maintains team rest period constraints across DST transitions

## Usage Examples

### Basic DST Validation

```typescript
import { createTimeSlot, validateSlotDuringDST } from '@ump/core/utils/date';

// Create a slot during EU DST transition (March 30, 2025)
const problematicSlot = createTimeSlot(
  '2025-03-30T01:30:00.000Z', // 2:30 AM local time
  '2025-03-30T03:30:00.000Z', // 4:30 AM local time (after DST jump)
  'Europe/Madrid'
);

const validation = validateSlotDuringDST(problematicSlot, 'Europe/Madrid');
console.log(validation);
// Output: { isValid: false, issues: ['Slot spans DST transition...'] }
```

### Safe Scheduling Around DST

```typescript
import { GreedyScheduler } from '@ump/plugins/scheduling/greedy';

const constraints = {
  availableSlots: [
    {
      field: 'Field 1',
      start: '2025-03-30T00:00:00.000Z', // Before DST transition
      end: '2025-03-30T01:00:00.000Z',
    },
    {
      field: 'Field 1',
      start: '2025-03-30T03:00:00.000Z', // After DST transition
      end: '2025-03-30T04:00:00.000Z',
    },
  ],
  minRestMinutes: 120,
  maxMatchesPerDay: 10,
  blackoutHours: [],
};

const scheduler = new GreedyScheduler();
const result = scheduler.scheduleMatches(matches, constraints);
// Automatically avoids DST transition periods
```

### Custom DST Handling

```typescript
import {
  DateTime,
  createTimeSlot,
  validateSlotDuringDST,
} from '@ump/core/utils/date';

function scheduleWithDSTAwareness(matches, availableSlots, timezone = 'UTC') {
  const validSlots = availableSlots.filter((slot) => {
    const timeSlot = createTimeSlot(slot.start, slot.end, timezone);
    const validation = validateSlotDuringDST(timeSlot, timezone);

    if (!validation.isValid) {
      console.warn(
        `Skipping slot due to DST conflict: ${validation.issues.join(', ')}`
      );
      return false;
    }

    return true;
  });

  // Use validSlots for scheduling...
}
```

## DST Transition Scenarios

### Spring Forward (Clocks Jump Ahead)

In spring, clocks "spring forward" (e.g., 2:00 AM becomes 3:00 AM):

```typescript
// EU DST transition: March 30, 2025 at 2:00 AM → 3:00 AM
const springTransition = createTimeSlot(
  '2025-03-30T01:30:00.000Z', // 2:30 AM local
  '2025-03-30T02:30:00.000Z', // Would be 3:30 AM local (after jump)
  'Europe/Madrid'
);

// This slot is invalid because it spans the "missing hour"
```

### Fall Back (Clocks Jump Back)

In fall, clocks "fall back" (e.g., 3:00 AM becomes 2:00 AM):

```typescript
// EU DST transition: October 26, 2025 at 3:00 AM → 2:00 AM
const fallTransition = createTimeSlot(
  '2025-10-26T01:30:00.000Z', // 2:30 AM local (first occurrence)
  '2025-10-26T02:30:00.000Z', // 2:30 AM local (second occurrence)
  'Europe/Madrid'
);

// This slot may be ambiguous due to the repeated hour
```

## Performance Considerations

### Optimization Strategies

The DST-aware scheduling includes several performance optimizations:

1. **Slot Pre-processing**: DST validation is cached during initialization
2. **Smart Validation**: Skips expensive DST checks for dates clearly outside transition periods
3. **DateTime Caching**: Pre-computes DateTime objects to avoid repeated conversions

```typescript
// Performance-optimized approach used internally
const slotLookup = new Map();
for (const slot of availableSlots) {
  const slotTime = DateTime.fromISO(slot.start);
  const month = slotTime.month;

  // Skip expensive DST validation for summer months
  if (month >= 4 && month <= 9) {
    dstValidation = { isValid: true, issues: [] };
  } else {
    dstValidation = validateSlotDuringDST(timeSlot, timezone);
  }

  slotLookup.set(key, { slot, dstValidation, slotTime });
}
```

## Best Practices

### 1. Always Specify Timezones

```typescript
// ✅ Good: Explicit timezone
const slot = createTimeSlot(start, end, 'Europe/Madrid');

// ❌ Avoid: Implicit UTC (may cause issues)
const slot = createTimeSlot(start, end);
```

### 2. Validate Before Scheduling

```typescript
// ✅ Good: Validate slots before use
const validation = validateSlotDuringDST(slot, timezone);
if (validation.isValid) {
  // Proceed with scheduling
}

// ❌ Avoid: Assuming all slots are valid
```

### 3. Handle DST Conflicts Gracefully

```typescript
// ✅ Good: Graceful error handling
const validation = validateSlotDuringDST(slot, timezone);
if (!validation.isValid) {
  logger.warn(`DST conflict detected: ${validation.issues.join(', ')}`);
  // Skip this slot or adjust timing
}
```

### 4. Use DateTime Objects for Calculations

```typescript
// ✅ Good: DST-aware calculations
const matchTime = DateTime.fromISO(slot.start);
const duration = matchTime.diff(previousMatch, 'minutes');

// ❌ Avoid: Plain Date objects (not DST-aware)
const matchTime = new Date(slot.start);
```

## Testing DST Scenarios

### Unit Test Examples

```typescript
import { createTimeSlot, validateSlotDuringDST } from '@ump/core/utils/date';

describe('DST Validation', () => {
  it('should detect spring DST transition conflicts', () => {
    const slot = createTimeSlot(
      '2025-03-30T01:30:00.000Z',
      '2025-03-30T03:30:00.000Z',
      'Europe/Madrid'
    );

    const result = validateSlotDuringDST(slot, 'Europe/Madrid');
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Slot spans DST transition');
  });

  it('should allow valid slots outside DST transitions', () => {
    const slot = createTimeSlot(
      '2025-03-29T10:00:00.000Z',
      '2025-03-29T12:00:00.000Z',
      'Europe/Madrid'
    );

    const result = validateSlotDuringDST(slot, 'Europe/Madrid');
    expect(result.isValid).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **Performance Degradation**

   - Ensure DST validation is cached for repeated use
   - Use the optimized scheduling plugins rather than custom implementations

2. **Unexpected Slot Rejections**

   - Check if slots span DST transition periods
   - Verify timezone settings are correct

3. **Test Failures**
   - Ensure Jest configuration includes module mapping for `@ump/core/utils/date`
   - Use consistent timezone settings in tests

### Debug Tools

Use the debug utilities to investigate DST-related issues:

```javascript
// Available debug scripts in packages/core/
node debug-dst.js          // Basic DST transition detection
node debug-dst-logic.js    // Detailed DST validation logic
node debug-performance.js  // Performance analysis
```

## Migration Guide

### Updating Existing Schedulers

To migrate existing scheduling code to use DST-aware utilities:

1. **Replace Date with DateTime**:

   ```typescript
   // Before
   const matchTime = new Date(slot.start);

   // After
   const matchTime = DateTime.fromISO(slot.start);
   ```

2. **Add DST Validation**:

   ```typescript
   // Before
   if (isSlotAvailable(slot)) {
     scheduleMatch(slot);
   }

   // After
   const validation = validateSlotDuringDST(slot, timezone);
   if (validation.isValid && isSlotAvailable(slot)) {
     scheduleMatch(slot);
   }
   ```

3. **Update Function Signatures**:

   ```typescript
   // Before
   function checkRestPeriod(teamId: string, time: Date): boolean;

   // After
   function checkRestPeriod(teamId: string, time: DateTime): boolean;
   ```

## API Reference

### Types

```typescript
interface TimeSlot {
  start: DateTime;
  end: DateTime;
  timezone: string;
  duration: Duration;
}

interface DSTValidationResult {
  isValid: boolean;
  issues: string[];
  warnings?: string[];
}
```

### Constants

```typescript
// Common timezone identifiers
const TIMEZONES = {
  EU_MADRID: 'Europe/Madrid',
  US_EASTERN: 'America/New_York',
  US_PACIFIC: 'America/Los_Angeles',
  UTC: 'UTC',
};
```

## Conclusion

The DST-aware scheduling system provides robust timezone handling while maintaining performance. By following the best practices and using the provided utilities, you can ensure reliable scheduling across DST transitions.

For additional support or questions, refer to the test files in `packages/core/src/utils/__tests__/date.test.ts` for comprehensive usage examples.
