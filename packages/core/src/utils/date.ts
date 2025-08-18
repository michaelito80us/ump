/**
 * DST-aware date utilities for tournament scheduling
 *
 * This module provides robust date/time handling that properly accounts for
 * Daylight Saving Time (DST) transitions to prevent scheduling conflicts
 * and overlapping time slots during DST changes.
 */

import { DateTime, Duration, Interval } from 'luxon';

// Re-export DateTime for convenience
export { DateTime };

/**
 * Represents a time slot for scheduling matches
 */
export interface TimeSlot {
  /** Start time of the slot */
  start: DateTime;
  /** End time of the slot */
  end: DateTime;
  /** Duration of the slot */
  duration?: number; // minutes
  /** Timezone for the slot */
  timezone?: string;
  /** Venue or location identifier */
  venue?: string;
}

/**
 * Configuration for DST-aware scheduling
 */
export interface SchedulingConfig {
  /** Timezone for the tournament */
  timezone: string;
  /** Default match duration in minutes */
  defaultDurationMinutes: number;
  /** Buffer time between matches in minutes */
  bufferMinutes: number;
  /** Minimum time before DST transition to avoid scheduling */
  dstBufferMinutes?: number;
}

/**
 * Result of DST transition detection
 */
export interface DSTTransition {
  date?: DateTime;
  /** Date/time of the transition */
  transitionTime: DateTime;
  /** Type of transition (spring forward or fall back) */
  type: 'spring_forward' | 'fall_back';
  skippedHour?: number;
  repeatedHour?: number;
  timezone?: string;
  offsetBefore?: number;
  offsetAfter?: number;
  /** Offset change in minutes */
  offsetChange: number;
  /** Whether this is a problematic transition for scheduling */
  isProblematic: boolean;
}

/**
 * Validation result for scheduling operations
 */
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Creates a DateTime instance in the specified timezone
 *
 * @param year - The year (e.g., 2025)
 * @param month - The month (1-12)
 * @param day - The day of the month (1-31)
 * @param hour - The hour (0-23), defaults to 0
 * @param minute - The minute (0-59), defaults to 0
 * @param timezone - IANA timezone identifier, defaults to 'UTC'
 * @returns DateTime instance in the specified timezone
 * @throws Error if the date parameters are invalid
 *
 * @example
 * ```typescript
 * const madridTime = createDateTime(2025, 3, 30, 14, 30, 'Europe/Madrid');
 * console.log(madridTime.toISO()); // 2025-03-30T14:30:00.000+02:00
 * ```
 */
export function createDateTime(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  timezone: string = 'UTC'
): DateTime {
  const dt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone }
  );

  if (!dt.isValid) {
    throw new Error(`Invalid date parameters: ${dt.invalidReason}`);
  }

  return dt;
}

/**
 * Detects DST transitions within a given date range
 *
 * @param startDate - Start of the date range to check
 * @param endDate - End of the date range to check
 * @param timezone - IANA timezone identifier, defaults to 'Europe/Madrid'
 * @returns Array of DST transitions found in the date range
 *
 * @example
 * ```typescript
 * const start = DateTime.fromISO('2025-03-01', { zone: 'Europe/Madrid' });
 * const end = DateTime.fromISO('2025-04-01', { zone: 'Europe/Madrid' });
 * const transitions = detectDSTTransitions(start, end, 'Europe/Madrid');
 * // Returns transitions for March 30, 2025 (spring forward)
 * ```
 */
export function detectDSTTransitions(
  startDate: DateTime,
  endDate: DateTime,
  timezone: string = 'Europe/Madrid'
): DSTTransition[] {
  const transitions: DSTTransition[] = [];
  const start = startDate.setZone(timezone);
  const end = endDate.setZone(timezone);

  // Check each day for DST transitions
  let current = start.startOf('day');
  while (current <= end) {
    const transition = detectDSTTransitionOnDate(current, timezone);
    if (transition) {
      transitions.push(transition);
    }
    current = current.plus({ days: 1 });
  }

  return transitions;
}

/**
 * Detects DST transitions for a specific year
 */
export function detectDSTTransitionsForYear(
  timezone: string,
  year: number
): DSTTransition[] {
  const start = DateTime.fromObject(
    { year, month: 1, day: 1 },
    { zone: timezone }
  );
  const end = DateTime.fromObject(
    { year: year + 1, month: 1, day: 1 },
    { zone: timezone }
  );

  return detectDSTTransitions(start, end, timezone);
}

/**
 * Detects DST transition on a specific date
 */
export function detectDSTTransitionOnDate(
  date: DateTime,
  timezone: string = 'Europe/Madrid'
): DSTTransition | null {
  const dayStart = date.setZone(timezone).startOf('day');
  const dayEnd = dayStart.endOf('day');

  // Check for offset changes throughout the day
  const startOffset = dayStart.offset;
  const endOffset = dayEnd.offset;

  if (startOffset === endOffset) {
    return null; // No DST transition on this day
  }

  // Find the exact transition time by checking each hour
  for (let hour = 0; hour < 24; hour++) {
    const currentTime = dayStart.plus({ hours: hour });
    const nextTime = dayStart.plus({ hours: hour + 1 });

    if (currentTime.offset !== nextTime.offset) {
      const offsetChange = Math.abs(nextTime.offset - currentTime.offset);

      // Spring forward: clocks jump ahead (offset becomes more positive)
      if (nextTime.offset > currentTime.offset) {
        return {
          transitionTime: currentTime,
          type: 'spring_forward',
          offsetChange,
          isProblematic: true,
        };
      }
      // Fall back: clocks fall back (offset becomes less positive)
      else {
        return {
          transitionTime: nextTime,
          type: 'fall_back',
          offsetChange,
          isProblematic: false,
        };
      }
    }
  }

  return null;
}

/**
 * Gets the exact DST transition time for a given date
 */
export function getDSTTransitionTime(
  date: DateTime,
  timezone: string = 'Europe/Madrid'
): DateTime | null {
  const transition = detectDSTTransitionOnDate(date, timezone);
  if (!transition) return null;

  return transition.transitionTime;
}

/**
 * Checks if a time slot overlaps with a DST transition
 */
export function isSlotAffectedByDST(
  slot: TimeSlot,
  dstBufferMinutes: number = 60
): boolean {
  const transitions = detectDSTTransitions(
    slot.start.minus({ hours: 1 }),
    slot.end.plus({ hours: 1 }),
    slot.timezone
  );

  for (const transition of transitions) {
    const bufferBefore = transition.transitionTime.minus({
      minutes: dstBufferMinutes,
    });
    const bufferAfter = transition.transitionTime.plus({
      minutes: dstBufferMinutes,
    });

    // Check if slot overlaps with the transition buffer zone
    if (
      (slot.start >= bufferBefore && slot.start <= bufferAfter) ||
      (slot.end >= bufferBefore && slot.end <= bufferAfter) ||
      (slot.start <= bufferBefore && slot.end >= bufferAfter)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that two time slots don't overlap, accounting for DST
 *
 * This function checks if two time slots overlap by comparing their start
 * and end times in the same timezone. It properly handles DST transitions
 * to ensure accurate overlap detection even during time changes.
 *
 * @param slot1 - First time slot to compare
 * @param slot2 - Second time slot to compare
 * @returns true if slots don't overlap, false if they do overlap
 *
 * @example
 * ```typescript
 * const slot1 = createTimeSlot(
 *   '2025-03-30T10:00:00.000Z',
 *   '2025-03-30T12:00:00.000Z',
 *   'Europe/Madrid'
 * );
 *
 * const slot2 = createTimeSlot(
 *   '2025-03-30T11:00:00.000Z',
 *   '2025-03-30T13:00:00.000Z',
 *   'Europe/Madrid'
 * );
 *
 * const noOverlap = validateSlotsNoOverlap(slot1, slot2);
 * console.log(noOverlap); // false (slots overlap from 11:00-12:00)
 * ```
 */
export function validateSlotsNoOverlap(
  slot1: TimeSlot,
  slot2: TimeSlot
): boolean {
  // Convert both slots to the same timezone for comparison
  const tz = slot1.timezone;
  const start1 = slot1.start.setZone(tz);
  const end1 = slot1.end.setZone(tz);
  const start2 = slot2.start.setZone(tz);
  const end2 = slot2.end.setZone(tz);

  // Check for overlap
  return end1 <= start2 || end2 <= start1;
}

/**
 * Creates a safe time slot that avoids DST transitions
 */
export function createSafeTimeSlot(
  startTime: DateTime,
  durationMinutes: number,
  config: SchedulingConfig,
  venue?: string
): TimeSlot | null {
  const duration = Duration.fromObject({ minutes: durationMinutes });
  const endTime = startTime.plus(duration);

  const slot: TimeSlot = {
    start: startTime,
    end: endTime,
    duration: duration.as('minutes'),
    timezone: config.timezone,
    venue,
  };

  // Check if this slot is affected by DST
  if (isSlotAffectedByDST(slot, config.dstBufferMinutes)) {
    return null; // Slot is not safe due to DST
  }

  return slot;
}

/**
 * Generates a series of time slots for a day, avoiding DST transitions
 */
export function generateDaySlots(
  date: DateTime,
  config: SchedulingConfig,
  startHour: number = 9,
  endHour: number = 18,
  venue?: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = config.defaultDurationMinutes + config.bufferMinutes;

  let currentTime = date.set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const dayEnd = date.set({
    hour: endHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  while (
    currentTime.plus({ minutes: config.defaultDurationMinutes }) <= dayEnd
  ) {
    const slot = createSafeTimeSlot(
      currentTime,
      config.defaultDurationMinutes,
      config,
      venue
    );

    if (slot) {
      slots.push(slot);
    }

    currentTime = currentTime.plus({ minutes: slotDuration });
  }

  return slots;
}

/**
 * Formats a time slot for display, handling DST appropriately
 */
export function formatTimeSlot(
  slot: TimeSlot,
  format: string = 'HH:mm'
): string {
  const start = slot.start.toFormat(format);
  const end = slot.end.toFormat(format);
  return `${start} - ${end}`;
}

/**
 * Checks if a date falls within a DST transition period
 */
export function isDSTTransitionDay(date: DateTime, timezone: string): boolean {
  const transitions = detectDSTTransitions(
    date.startOf('day'),
    date.endOf('day'),
    timezone
  );
  return transitions.length > 0;
}

/**
 * Gets the next safe scheduling time after a DST transition
 */
export function getNextSafeTime(
  afterTime: DateTime,
  config: SchedulingConfig
): DateTime {
  const transitions = detectDSTTransitions(
    afterTime,
    afterTime.plus({ days: 1 }),
    config.timezone
  );

  if (transitions.length === 0) {
    return afterTime;
  }

  // Find the latest transition and add buffer
  const latestTransition = transitions[transitions.length - 1];
  const bufferMinutes = config.dstBufferMinutes || 60;

  return latestTransition.transitionTime.plus({ minutes: bufferMinutes });
}

/**
 * Validates a complete schedule against DST issues
 */
export function validateScheduleForDST(
  slots: TimeSlot[],
  config: SchedulingConfig
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check each slot for DST issues
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    // Check if slot is affected by DST
    if (isSlotAffectedByDST(slot, config.dstBufferMinutes)) {
      issues.push(
        `Slot ${i + 1} (${formatTimeSlot(slot)}) conflicts with DST transition`
      );
    }

    // Check for overlaps with subsequent slots
    for (let j = i + 1; j < slots.length; j++) {
      if (!validateSlotsNoOverlap(slot, slots[j])) {
        issues.push(`Slot ${i + 1} overlaps with slot ${j + 1}`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validates a schedule for conflicts and DST issues
 * @param slots - Array of time slots
 * @param config - Scheduling configuration
 * @returns Validation result
 */
export function validateSchedule(
  slots: TimeSlot[],
  config: SchedulingConfig
): ValidationResult {
  const issues: string[] = [];

  // Pre-compute DST transitions for all years covered by the slots to avoid repeated calculations
  const yearsToCheck = new Set<number>();
  for (const slot of slots) {
    yearsToCheck.add(slot.start.year);
    yearsToCheck.add(slot.end.year);
  }

  const allTransitions: DSTTransition[] = [];
  for (const year of yearsToCheck) {
    allTransitions.push(...detectDSTTransitionsForYear(config.timezone, year));
  }

  // Check each slot for DST issues using pre-computed transitions
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const dstValidation = validateSlotDuringDSTWithTransitions(
      slot,
      config.timezone,
      allTransitions
    );

    if (!dstValidation.isValid) {
      issues.push(
        ...dstValidation.issues.map((issue) => `Slot ${i + 1}: ${issue}`)
      );
    }

    // Check for overlaps with subsequent slots
    for (let j = i + 1; j < slots.length; j++) {
      if (!validateSlotsNoOverlap(slot, slots[j])) {
        issues.push(`Slot ${i + 1} overlaps with slot ${j + 1}`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Utility to get timezone-aware duration between two DateTimes
 * This properly handles DST transitions where the actual elapsed time
 * may differ from the nominal duration
 */
export function getActualDuration(start: DateTime, end: DateTime): Duration {
  return Interval.fromDateTimes(start, end).toDuration();
}

/**
 * Checks if a given time exists (not skipped due to DST spring forward)
 */
export function timeExists(dateTime: DateTime): boolean {
  return dateTime.isValid && !dateTime.invalidReason;
}

/**
 * Adjusts a time if it falls in a DST gap (spring forward)
 */
export function adjustForDSTGap(dateTime: DateTime): DateTime {
  if (timeExists(dateTime)) {
    return dateTime;
  }

  // If the time doesn't exist due to DST, move it forward to the next valid time
  return dateTime.plus({ hours: 1 });
}

/**
 * Creates a TimeSlot from ISO strings or DateTime objects
 *
 * This function creates a timezone-aware time slot that can be used for
 * scheduling operations. It automatically calculates the duration and
 * ensures proper timezone handling for DST-aware scheduling.
 *
 * @param start - Start time as ISO string or DateTime object
 * @param end - End time as ISO string or DateTime object
 * @param timezone - IANA timezone identifier, defaults to 'Europe/Madrid'
 * @param venue - Optional venue or location identifier
 * @returns TimeSlot object with DateTime instances and calculated duration
 *
 * @example
 * ```typescript
 * // Create from ISO strings
 * const slot1 = createTimeSlot(
 *   '2025-03-30T10:00:00.000Z',
 *   '2025-03-30T12:00:00.000Z',
 *   'Europe/Madrid'
 * );
 *
 * // Create from DateTime objects
 * const start = DateTime.fromISO('2025-03-30T10:00:00.000Z');
 * const end = DateTime.fromISO('2025-03-30T12:00:00.000Z');
 * const slot2 = createTimeSlot(start, end, 'Europe/Madrid', 'Field 1');
 * ```
 */
export function createTimeSlot(
  start: string | DateTime,
  end: string | DateTime,
  timezone: string = 'Europe/Madrid',
  venue?: string
): TimeSlot {
  const startDateTime =
    typeof start === 'string'
      ? DateTime.fromISO(start, { zone: timezone })
      : start.setZone(timezone);
  const endDateTime =
    typeof end === 'string'
      ? DateTime.fromISO(end, { zone: timezone })
      : end.setZone(timezone);

  return {
    start: startDateTime,
    end: endDateTime,
    duration: Math.round(endDateTime.diff(startDateTime, 'minutes').minutes),
    timezone,
    venue,
  };
}

/**
 * Converts a TimeSlot to ISO strings for serialization
 */
export function timeSlotToISO(slot: TimeSlot): {
  start: string;
  end: string;
  duration?: number;
  timezone?: string;
  venue?: string;
} {
  return {
    start: slot.start.toISO() || '',
    end: slot.end.toISO() || '',
    duration: slot.duration,
    timezone: slot.timezone,
    venue: slot.venue,
  };
}

/**
 * Checks if two time slots overlap, considering DST transitions
 */
export function checkSlotOverlapWithDST(
  slot1: TimeSlot,
  slot2: TimeSlot,
  timezone: string = 'Europe/Madrid'
): boolean {
  const start1 = slot1.start.setZone(timezone);
  const end1 = slot1.end.setZone(timezone);
  const start2 = slot2.start.setZone(timezone);
  const end2 = slot2.end.setZone(timezone);

  // Check for DST transitions in the time range
  const earliestStart = start1 < start2 ? start1 : start2;
  const latestEnd = end1 > end2 ? end1 : end2;
  const transitions = detectDSTTransitions(earliestStart, latestEnd, timezone);

  if (transitions.length === 0) {
    // No DST transitions, use standard overlap check
    return start1 < end2 && start2 < end1;
  }

  // With DST transitions, we need to be more careful
  // Convert to UTC for accurate comparison
  const utcStart1 = start1.toUTC();
  const utcEnd1 = end1.toUTC();
  const utcStart2 = start2.toUTC();
  const utcEnd2 = end2.toUTC();

  return utcStart1 < utcEnd2 && utcStart2 < utcEnd1;
}

/**
 * Validates a time slot for DST conflicts using pre-computed transitions
 * @param slot - The time slot to validate
 * @param timezone - The timezone to check
 * @param transitions - Pre-computed DST transitions
 * @returns Validation result with any issues found
 */
export function validateSlotDuringDSTWithTransitions(
  slot: TimeSlot,
  timezone: string,
  transitions: DSTTransition[]
): { isValid: boolean; issues: string[] } {
  const start = slot.start.setZone(timezone);
  const end = slot.end.setZone(timezone);
  const issues: string[] = [];

  // Use the provided transitions instead of computing them
  for (const transition of transitions) {
    if (transition.type === 'spring_forward') {
      // For spring forward, check if the slot would be affected by the time jump
      const transitionTime = transition.transitionTime;

      // The problematic time range is the hour that gets skipped
      // In Madrid 2025-03-30, 1:00 AM becomes 2:00 AM, so 2:00-3:00 is skipped

      // Check if the slot overlaps with the transition day
      const transitionDay = transitionTime.startOf('day');
      const transitionDayEnd = transitionDay.endOf('day');

      // Check if slot overlaps with the transition day at all
      const slotOverlapsTransitionDay =
        start <= transitionDayEnd && end >= transitionDay;

      if (slotOverlapsTransitionDay) {
        // For multi-day slots, check if the slot spans through the skipped hour
        // We need to be careful here because Luxon will adjust times in the skipped hour
        // The skipped hour is from transitionTime to transitionTime + 1 hour
        const skippedHourStartTime = transitionTime; // 1:00 AM
        const skippedHourEndTime = transitionTime.plus({ hours: 1 }); // This becomes 3:00 AM due to DST

        // Check if the slot spans through the skipped hour period
        // This handles both single-day slots and multi-day slots
        // A slot spans the skipped hour if it starts before the end of the skipped hour
        // AND ends after the start of the skipped hour
        // Special case: if both start and end are in the same hour as skippedHourEndTime,
        // they were likely adjusted from the skipped hour
        const slotSpansSkippedHour =
          (start < skippedHourEndTime && end > skippedHourStartTime) ||
          (start.hour === skippedHourEndTime.hour &&
            end.hour === skippedHourEndTime.hour &&
            start >= skippedHourEndTime);

        if (slotSpansSkippedHour) {
          // For slots that are entirely within the same day as the transition,
          // use the more precise detection method
          const slotStartDay = start.startOf('day');
          const slotEndDay = end.startOf('day');

          if (
            slotStartDay.equals(transitionDay) &&
            slotEndDay.equals(transitionDay)
          ) {
            // Single-day slot - detect if times were adjusted from the skipped hour
            // The skipped hour is from 2:00 AM to 3:00 AM (becomes 3:00 AM)
            const skippedHour = transitionTime.hour + 1; // 2 AM
            let hasConflict = false;

            // Check if start time was originally in the skipped hour but got adjusted
            if (start.hour === skippedHour + 1) {
              // If it's now 3 AM, it might have been adjusted from 2 AM
              const originalStartTime = DateTime.fromObject(
                {
                  year: transitionDay.year,
                  month: transitionDay.month,
                  day: transitionDay.day,
                  hour: skippedHour, // Try to create the original 2 AM time
                  minute: start.minute,
                },
                { zone: timezone }
              );

              // If the original time gets adjusted to the same time as our slot start,
              // it means our slot start was originally in the skipped hour
              if (originalStartTime.equals(start)) {
                issues.push(
                  `Slot conflicts with DST spring forward transition at ${transitionTime.toISO()} - time ${skippedHour}:${start.minute.toString().padStart(2, '0')} does not exist`
                );
                hasConflict = true;
              }
            }

            // Check if end time was originally in the skipped hour but got adjusted
            // Only check if we haven't already found a conflict to avoid duplicate messages
            if (!hasConflict && end.hour === skippedHour + 1) {
              // If it's now 3 AM, it might have been adjusted from 2 AM
              const originalEndTime = DateTime.fromObject(
                {
                  year: transitionDay.year,
                  month: transitionDay.month,
                  day: transitionDay.day,
                  hour: skippedHour, // Try to create the original 2 AM time
                  minute: end.minute,
                },
                { zone: timezone }
              );

              // If the original time gets adjusted to the same time as our slot end,
              // it means our slot end was originally in the skipped hour
              if (originalEndTime.equals(end)) {
                issues.push(
                  `Slot conflicts with DST spring forward transition at ${transitionTime.toISO()} - time ${skippedHour}:${end.minute.toString().padStart(2, '0')} does not exist`
                );
              }
            }
          } else {
            // Multi-day slot
            issues.push(
              `Slot spans multiple days and conflicts with DST spring forward transition at ${transitionTime.toISO()}`
            );
          }
        }
      }
    } else if (transition.type === 'fall_back') {
      // For fall back, check if the slot would be in the ambiguous hour
      const transitionTime = transition.transitionTime;

      // Check if the slot overlaps with the transition day
      const transitionDay = transitionTime.startOf('day');
      const transitionDayEnd = transitionDay.endOf('day');

      // Check if slot overlaps with the transition day at all
      const slotOverlapsTransitionDay =
        start <= transitionDayEnd && end >= transitionDay;

      if (slotOverlapsTransitionDay) {
        // The ambiguous hour is the hour that occurs twice
        // In Madrid 2025-10-26, 3:00 AM becomes 2:00 AM, so 2:00-3:00 occurs twice
        const ambiguousHourStart = transitionTime.hour;
        const ambiguousHourEnd = ambiguousHourStart + 1;

        // Check if the slot falls within the ambiguous hour
        const slotInAmbiguousHour =
          (start.hour >= ambiguousHourStart && start.hour < ambiguousHourEnd) ||
          (end.hour >= ambiguousHourStart && end.hour < ambiguousHourEnd);

        if (slotInAmbiguousHour) {
          issues.push(
            `Slot conflicts with DST fall back transition at ${transitionTime.toISO()} - time occurs twice`
          );
        }
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validates that a time slot is safe during DST transitions
 *
 * This function checks if a time slot conflicts with DST transitions,
 * which can cause scheduling issues like overlapping times or missing hours.
 * It's essential for preventing match scheduling during problematic DST periods.
 *
 * @param slot - The time slot to validate
 * @param timezone - IANA timezone identifier, defaults to 'Europe/Madrid'
 * @returns Validation result with isValid flag and array of issues
 *
 * @example
 * ```typescript
 * // Safe slot (outside DST transition)
 * const safeSlot = createTimeSlot(
 *   '2025-03-29T10:00:00.000Z',
 *   '2025-03-29T12:00:00.000Z',
 *   'Europe/Madrid'
 * );
 * const result1 = validateSlotDuringDST(safeSlot, 'Europe/Madrid');
 * // { isValid: true, issues: [] }
 *
 * // Problematic slot (spans DST transition)
 * const problematicSlot = createTimeSlot(
 *   '2025-03-30T01:30:00.000Z', // 2:30 AM local
 *   '2025-03-30T03:30:00.000Z', // 4:30 AM local (after DST jump)
 *   'Europe/Madrid'
 * );
 * const result2 = validateSlotDuringDST(problematicSlot, 'Europe/Madrid');
 * // { isValid: false, issues: ['Slot spans DST transition...'] }
 * ```
 */
export function validateSlotDuringDST(
  slot: TimeSlot,
  timezone: string = 'Europe/Madrid'
): { isValid: boolean; issues: string[] } {
  const start = slot.start.setZone(timezone);
  const end = slot.end.setZone(timezone);

  // Get DST transitions for the years covered by this slot
  const startYear = start.year;
  const endYear = end.year;

  const transitions: DSTTransition[] = [];
  for (let year = startYear; year <= endYear; year++) {
    transitions.push(...detectDSTTransitionsForYear(timezone, year));
  }

  return validateSlotDuringDSTWithTransitions(slot, timezone, transitions);
}

/**
 * Adjusts a time slot to avoid DST transition issues
 */
export function adjustSlotForDST(
  slot: TimeSlot,
  timezone: string = 'Europe/Madrid'
): TimeSlot {
  const validation = validateSlotDuringDST(slot, timezone);

  if (validation.isValid) {
    return slot; // No adjustment needed
  }

  const start = slot.start.setZone(timezone);
  const end = slot.end.setZone(timezone);
  const transitions = detectDSTTransitions(start, end, timezone);

  let adjustedStart = start;
  let adjustedEnd = end;

  for (const transition of transitions) {
    if (transition.type === 'spring_forward') {
      const transitionTime = transition.transitionTime;
      const skippedEnd = transitionTime.plus({ hours: 1 });

      // If slot starts in skipped hour, move it after the transition
      if (adjustedStart >= transitionTime && adjustedStart < skippedEnd) {
        const duration = adjustedEnd.diff(adjustedStart);
        adjustedStart = skippedEnd;
        adjustedEnd = adjustedStart.plus(duration);
      }
    } else if (transition.type === 'fall_back') {
      // For fall back, ensure we use the first occurrence of the ambiguous time
      const transitionTime = transition.transitionTime;
      const ambiguousStart = transitionTime.minus({ hours: 1 });
      const ambiguousEnd = transitionTime;

      if (adjustedStart >= ambiguousStart && adjustedStart < ambiguousEnd) {
        // Use the first occurrence by setting keepLocalTime to false
        adjustedStart = adjustedStart.setZone(timezone, {
          keepLocalTime: false,
        });
        adjustedEnd = adjustedEnd.setZone(timezone, { keepLocalTime: false });
      }
    }
  }

  return {
    start: adjustedStart,
    end: adjustedEnd,
    duration: slot.duration,
    timezone: slot.timezone,
    venue: slot.venue,
  };
}
