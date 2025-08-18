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
 * Creates a DateTime instance in the specified timezone
 */
export function createDateTime(
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  timezone = 'UTC'
) {
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
 */
export function detectDSTTransitions(
  startDate,
  endDate,
  timezone = 'Europe/Madrid'
) {
  const transitions = [];
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
export function detectDSTTransitionsForYear(timezone, year) {
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
export function detectDSTTransitionOnDate(date, timezone = 'Europe/Madrid') {
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
export function getDSTTransitionTime(date, timezone = 'Europe/Madrid') {
  const transition = detectDSTTransitionOnDate(date, timezone);
  if (!transition) return null;
  return transition.transitionTime;
}
/**
 * Checks if a time slot overlaps with a DST transition
 */
export function isSlotAffectedByDST(slot, dstBufferMinutes = 60) {
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
 */
export function validateSlotsNoOverlap(slot1, slot2) {
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
export function createSafeTimeSlot(startTime, durationMinutes, config, venue) {
  const duration = Duration.fromObject({ minutes: durationMinutes });
  const endTime = startTime.plus(duration);
  const slot = {
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
  date,
  config,
  startHour = 9,
  endHour = 18,
  venue
) {
  const slots = [];
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
export function formatTimeSlot(slot, format = 'HH:mm') {
  const start = slot.start.toFormat(format);
  const end = slot.end.toFormat(format);
  return `${start} - ${end}`;
}
/**
 * Checks if a date falls within a DST transition period
 */
export function isDSTTransitionDay(date, timezone) {
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
export function getNextSafeTime(afterTime, config) {
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
export function validateScheduleForDST(slots, config) {
  const issues = [];
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
export function validateSchedule(slots, config) {
  const issues = [];
  // Pre-compute DST transitions for all years covered by the slots to avoid repeated calculations
  const yearsToCheck = new Set();
  for (const slot of slots) {
    yearsToCheck.add(slot.start.year);
    yearsToCheck.add(slot.end.year);
  }
  const allTransitions = [];
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
export function getActualDuration(start, end) {
  return Interval.fromDateTimes(start, end).toDuration();
}
/**
 * Checks if a given time exists (not skipped due to DST spring forward)
 */
export function timeExists(dateTime) {
  return dateTime.isValid && !dateTime.invalidReason;
}
/**
 * Adjusts a time if it falls in a DST gap (spring forward)
 */
export function adjustForDSTGap(dateTime) {
  if (timeExists(dateTime)) {
    return dateTime;
  }
  // If the time doesn't exist due to DST, move it forward to the next valid time
  return dateTime.plus({ hours: 1 });
}
/**
 * Creates a TimeSlot from ISO strings or DateTime objects
 */
export function createTimeSlot(start, end, timezone = 'Europe/Madrid', venue) {
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
export function timeSlotToISO(slot) {
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
  slot1,
  slot2,
  timezone = 'Europe/Madrid'
) {
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
  slot,
  timezone,
  transitions
) {
  const start = slot.start.setZone(timezone);
  const end = slot.end.setZone(timezone);
  const issues = [];
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
 */
export function validateSlotDuringDST(slot, timezone = 'Europe/Madrid') {
  const start = slot.start.setZone(timezone);
  const end = slot.end.setZone(timezone);
  // Get DST transitions for the years covered by this slot
  const startYear = start.year;
  const endYear = end.year;
  const transitions = [];
  for (let year = startYear; year <= endYear; year++) {
    transitions.push(...detectDSTTransitionsForYear(timezone, year));
  }
  return validateSlotDuringDSTWithTransitions(slot, timezone, transitions);
}
/**
 * Adjusts a time slot to avoid DST transition issues
 */
export function adjustSlotForDST(slot, timezone = 'Europe/Madrid') {
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
//# sourceMappingURL=date.js.map
