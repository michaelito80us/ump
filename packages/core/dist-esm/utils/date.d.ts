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
