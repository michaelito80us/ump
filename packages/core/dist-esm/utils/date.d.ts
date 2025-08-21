/**
 * DST-aware date utilities for tournament scheduling
 *
 * This module provides robust date/time handling that properly accounts for
 * Daylight Saving Time (DST) transitions to prevent scheduling conflicts
 * and overlapping time slots during DST changes.
 */
import { DateTime, Duration } from 'luxon';
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
  duration?: number;
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
export declare function createDateTime(
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  timezone?: string
): DateTime;
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
export declare function detectDSTTransitions(
  startDate: DateTime,
  endDate: DateTime,
  timezone?: string
): DSTTransition[];
/**
 * Detects DST transitions for a specific year
 */
export declare function detectDSTTransitionsForYear(
  timezone: string,
  year: number
): DSTTransition[];
/**
 * Detects DST transition on a specific date
 */
export declare function detectDSTTransitionOnDate(
  date: DateTime,
  timezone?: string
): DSTTransition | null;
/**
 * Gets the exact DST transition time for a given date
 */
export declare function getDSTTransitionTime(
  date: DateTime,
  timezone?: string
): DateTime | null;
/**
 * Checks if a time slot overlaps with a DST transition
 */
export declare function isSlotAffectedByDST(
  slot: TimeSlot,
  dstBufferMinutes?: number
): boolean;
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
export declare function validateSlotsNoOverlap(
  slot1: TimeSlot,
  slot2: TimeSlot
): boolean;
/**
 * Creates a safe time slot that avoids DST transitions
 */
export declare function createSafeTimeSlot(
  startTime: DateTime,
  durationMinutes: number,
  config: SchedulingConfig,
  venue?: string
): TimeSlot | null;
/**
 * Generates a series of time slots for a day, avoiding DST transitions
 */
export declare function generateDaySlots(
  date: DateTime,
  config: SchedulingConfig,
  startHour?: number,
  endHour?: number,
  venue?: string
): TimeSlot[];
/**
 * Formats a time slot for display, handling DST appropriately
 */
export declare function formatTimeSlot(slot: TimeSlot, format?: string): string;
/**
 * Checks if a date falls within a DST transition period
 */
export declare function isDSTTransitionDay(
  date: DateTime,
  timezone: string
): boolean;
/**
 * Gets the next safe scheduling time after a DST transition
 */
export declare function getNextSafeTime(
  afterTime: DateTime,
  config: SchedulingConfig
): DateTime;
/**
 * Validates a complete schedule against DST issues
 */
export declare function validateScheduleForDST(
  slots: TimeSlot[],
  config: SchedulingConfig
): {
  isValid: boolean;
  issues: string[];
};
/**
 * Validates a schedule for conflicts and DST issues
 * @param slots - Array of time slots
 * @param config - Scheduling configuration
 * @returns Validation result
 */
export declare function validateSchedule(
  slots: TimeSlot[],
  config: SchedulingConfig
): ValidationResult;
/**
 * Utility to get timezone-aware duration between two DateTimes
 * This properly handles DST transitions where the actual elapsed time
 * may differ from the nominal duration
 */
export declare function getActualDuration(
  start: DateTime,
  end: DateTime
): Duration;
/**
 * Checks if a given time exists (not skipped due to DST spring forward)
 */
export declare function timeExists(dateTime: DateTime): boolean;
/**
 * Adjusts a time if it falls in a DST gap (spring forward)
 */
export declare function adjustForDSTGap(dateTime: DateTime): DateTime;
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
export declare function createTimeSlot(
  start: string | DateTime,
  end: string | DateTime,
  timezone?: string,
  venue?: string
): TimeSlot;
/**
 * Converts a TimeSlot to ISO strings for serialization
 */
export declare function timeSlotToISO(slot: TimeSlot): {
  start: string;
  end: string;
  duration?: number;
  timezone?: string;
  venue?: string;
};
/**
 * Checks if two time slots overlap, considering DST transitions
 */
export declare function checkSlotOverlapWithDST(
  slot1: TimeSlot,
  slot2: TimeSlot,
  timezone?: string
): boolean;
/**
 * Validates a time slot for DST conflicts using pre-computed transitions
 * @param slot - The time slot to validate
 * @param timezone - The timezone to check
 * @param transitions - Pre-computed DST transitions
 * @returns Validation result with any issues found
 */
export declare function validateSlotDuringDSTWithTransitions(
  slot: TimeSlot,
  timezone: string,
  transitions: DSTTransition[]
): {
  isValid: boolean;
  issues: string[];
};
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
export declare function validateSlotDuringDST(
  slot: TimeSlot,
  timezone?: string
): {
  isValid: boolean;
  issues: string[];
};
/**
 * Adjusts a time slot to avoid DST transition issues
 */
export declare function adjustSlotForDST(
  slot: TimeSlot,
  timezone?: string
): TimeSlot;
//# sourceMappingURL=date.d.ts.map
