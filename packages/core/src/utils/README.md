# Core Date Utilities

This module provides DST-aware date and time utilities for the UMP scheduling system.

## Installation

The utilities are part of the `@ump/core` package and use Luxon for timezone handling:

```bash
npm install luxon
npm install --save-dev @types/luxon
```

## Quick Start

```typescript
import {
  createTimeSlot,
  validateSlotDuringDST,
  DateTime,
} from '@ump/core/utils/date';

// Create a timezone-aware time slot
const slot = createTimeSlot(
  '2025-03-30T10:00:00.000Z',
  '2025-03-30T12:00:00.000Z',
  'Europe/Madrid'
);

// Validate for DST conflicts
const validation = validateSlotDuringDST(slot, 'Europe/Madrid');
if (validation.isValid) {
  console.log('Slot is safe to use');
} else {
  console.warn('DST conflict:', validation.issues);
}
```

## API Documentation

### Functions

#### `createTimeSlot(start: string, end: string, timezone?: string): TimeSlot`

Creates a timezone-aware time slot object with DST handling.

**Parameters:**

- `start`: ISO 8601 datetime string
- `end`: ISO 8601 datetime string
- `timezone`: IANA timezone identifier (defaults to 'UTC')

**Returns:** TimeSlot object with DateTime instances

#### `validateSlotDuringDST(slot: TimeSlot, timezone: string): DSTValidationResult`

Validates if a time slot conflicts with DST transitions.

**Parameters:**

- `slot`: TimeSlot object to validate
- `timezone`: IANA timezone identifier

**Returns:** Validation result with issues array

#### `validateSlotsNoOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean`

Checks if two time slots overlap, accounting for DST transitions.

**Parameters:**

- `slot1`: First time slot
- `slot2`: Second time slot

**Returns:** `true` if slots don't overlap

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

## DST Transition Handling

### Spring Forward (March)

- Clocks jump from 2:00 AM to 3:00 AM
- The hour from 2:00-3:00 AM doesn't exist
- Slots spanning this period are marked invalid

### Fall Back (October)

- Clocks jump from 3:00 AM to 2:00 AM
- The hour from 2:00-3:00 AM occurs twice
- Slots during this period may be ambiguous

## Examples

### Basic Usage

```typescript
import { createTimeSlot, validateSlotDuringDST } from '@ump/core/utils/date';

// Safe slot (outside DST transition)
const safeSlot = createTimeSlot(
  '2025-03-29T10:00:00.000Z',
  '2025-03-29T12:00:00.000Z',
  'Europe/Madrid'
);

// Problematic slot (spans DST transition)
const problematicSlot = createTimeSlot(
  '2025-03-30T01:30:00.000Z', // 2:30 AM local
  '2025-03-30T03:30:00.000Z', // 4:30 AM local (after DST jump)
  'Europe/Madrid'
);

console.log(validateSlotDuringDST(safeSlot, 'Europe/Madrid'));
// { isValid: true, issues: [] }

console.log(validateSlotDuringDST(problematicSlot, 'Europe/Madrid'));
// { isValid: false, issues: ['Slot spans DST transition...'] }
```

### Overlap Detection

```typescript
import { createTimeSlot, validateSlotsNoOverlap } from '@ump/core/utils/date';

const slot1 = createTimeSlot(
  '2025-03-30T10:00:00.000Z',
  '2025-03-30T12:00:00.000Z',
  'Europe/Madrid'
);

const slot2 = createTimeSlot(
  '2025-03-30T11:00:00.000Z',
  '2025-03-30T13:00:00.000Z',
  'Europe/Madrid'
);

const noOverlap = validateSlotsNoOverlap(slot1, slot2);
console.log(noOverlap); // false (slots overlap)
```

## Testing

Run the test suite to verify DST handling:

```bash
cd packages/core
npm test src/utils/__tests__/date.test.ts
```

The tests cover:

- DST transition detection
- Slot validation during spring/fall transitions
- Overlap detection across DST boundaries
- Performance with large datasets

## Performance Notes

- DST validation is optimized for months outside transition periods
- DateTime objects are cached to avoid repeated conversions
- Bulk operations use efficient lookup maps

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure Jest configuration includes moduleNameMapper for `@ump/core/utils/date`
2. **Timezone errors**: Use valid IANA timezone identifiers (e.g., 'Europe/Madrid', not 'CET')
3. **Performance issues**: Use the provided caching mechanisms for bulk operations

### Debug Scripts

```bash
# Test DST transition detection
node packages/core/debug-dst.js

# Analyze DST validation logic
node packages/core/debug-dst-logic.js

# Performance benchmarking
node packages/core/debug-performance.js
```

## Related Documentation

- [DST-Aware Scheduling Guide](../../docs/dst-aware-scheduling.md)
- [GreedyScheduler Documentation](../plugins/scheduling/greedy/README.md)
- [Luxon Documentation](https://moment.github.io/luxon/)
