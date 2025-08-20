import type { SchedulingPlugin } from '@ump/engine/registry';
import type { Match, SchedulingConstraints, Slot } from '@ump/core';
import { DateTime } from '@ump/core/utils/date';
import { PluginExecutionError } from '@ump/engine';
import { GreedyScheduler } from '../greedy';

/**
 * Day Bucket Scheduler Plugin - T-9.3
 *
 * Implements a day-based scheduling strategy that groups matches by day
 * and then applies the greedy scheduler within each day bucket.
 * This approach balances match distribution across days while maintaining
 * efficient allocation within each day.
 *
 * Algorithm:
 * 1. Parse input constraints and available time slots
 * 2. Group available slots by day
 * 3. Distribute matches evenly across available days
 * 4. For each day bucket, use greedy scheduler to assign specific times
 * 5. Combine results from all day buckets
 */
export const DayBucketScheduler: SchedulingPlugin = {
  // Plugin metadata
  id: 'day_bucket',
  name: 'Day Bucket Scheduler',
  version: '1.0.0',
  description:
    'Groups matches by day then applies greedy scheduling within each day',
  author: 'UMP Core Team',
  supportedLanguages: ['en', 'es'],
  capabilities: ['matches:unlimited'],
  i18n: {
    en: {
      name: 'Day Bucket Scheduler',
      description:
        'Balances match distribution across days with efficient daily scheduling',
    },
    es: {
      name: 'Programador de Cubetas por Día',
      description:
        'Equilibra la distribución de partidos por días con programación diaria eficiente',
    },
  },

  /**
   * Main scheduling method - implements day-based bucketing with greedy allocation
   * @param matches Array of matches to schedule (without time/venue assignments)
   * @param config Configuration object containing constraints and settings
   * @returns Array of matches with scheduledTime and venue assigned
   */
  scheduleMatches(matches: Match[], config: any): Match[] {
    // Validate input
    if (!matches || !Array.isArray(matches)) {
      throw new PluginExecutionError(
        'Invalid matches input: expected array',
        'INVALID_INPUT'
      );
    }

    if (matches.length === 0) {
      return [];
    }

    // Parse constraints
    const constraints = parseConstraints(config);

    if (
      !constraints.availableSlots ||
      constraints.availableSlots.length === 0
    ) {
      throw new PluginExecutionError(
        'No available time slots provided',
        'NO_SLOTS'
      );
    }

    try {
      // Group available slots by day
      const slotsByDay = groupSlotsByDay(constraints.availableSlots);

      if (slotsByDay.size === 0) {
        throw new PluginExecutionError(
          'No valid days found in available slots',
          'NO_VALID_DAYS'
        );
      }

      // Distribute matches across days
      const matchesByDay = distributeMatchesAcrossDays(matches, slotsByDay);

      // Schedule matches for each day using greedy scheduler
      const scheduledMatches: Match[] = [];
      const unscheduledMatches: Match[] = [];

      for (const [day, dayMatches] of matchesByDay) {
        const daySlots = slotsByDay.get(day) || [];

        // Create day-specific constraints
        const dayConstraints = {
          ...constraints,
          availableSlots: daySlots,
        };

        try {
          // Use greedy scheduler for this day's matches
          const dayResults = GreedyScheduler.scheduleMatches(
            dayMatches,
            dayConstraints
          );

          // Separate scheduled and unscheduled matches
          for (const match of dayResults) {
            if (match.scheduledTime && match.venue) {
              scheduledMatches.push(match);
            } else {
              unscheduledMatches.push(match);
            }
          }
        } catch (_error) {
          // If greedy scheduler fails for this day, mark all matches as unscheduled
          unscheduledMatches.push(...dayMatches);
        }
      }

      // Return all matches (scheduled ones will have time/venue, unscheduled won't)
      return [...scheduledMatches, ...unscheduledMatches];
    } catch (error) {
      if (error instanceof PluginExecutionError) {
        throw error;
      }
      throw new PluginExecutionError(
        `Day bucket scheduling failed: ${error instanceof Error ? error.message : String(error)}`,
        'SCHEDULING_FAILED'
      );
    }
  },
};

/**
 * Parse and validate scheduling constraints
 */
function parseConstraints(config: any): SchedulingConstraints {
  const constraints: SchedulingConstraints = {
    availableSlots: config.availableSlots || [],
    maxMatchesPerDay: config.maxMatchesPerDay,
    minRestMinutes: config.minRestMinutes,
    blackoutHours: config.blackoutHours,
  };

  // Validate required fields
  if (!Array.isArray(constraints.availableSlots)) {
    throw new PluginExecutionError(
      'availableSlots must be an array',
      'INVALID_SLOTS'
    );
  }

  return constraints;
}

/**
 * Group available time slots by day
 * @param slots Array of available time slots
 * @returns Map of day string to slots for that day
 */
function groupSlotsByDay(slots: Slot[]): Map<string, Slot[]> {
  const slotsByDay = new Map<string, Slot[]>();

  for (const slot of slots) {
    try {
      const startTime = DateTime.fromISO(slot.start);
      const dayKey = startTime.toISODate(); // YYYY-MM-DD format

      if (!dayKey) {
        continue; // Skip invalid dates
      }

      if (!slotsByDay.has(dayKey)) {
        slotsByDay.set(dayKey, []);
      }

      slotsByDay.get(dayKey)!.push(slot);
    } catch (_error) {
      // Skip slots with invalid dates
      continue;
    }
  }

  // Sort slots within each day by start time
  for (const [_day, daySlots] of slotsByDay) {
    daySlots.sort((a, b) => {
      const timeA = DateTime.fromISO(a.start);
      const timeB = DateTime.fromISO(b.start);
      return timeA.toMillis() - timeB.toMillis();
    });
  }

  return slotsByDay;
}

/**
 * Distribute matches evenly across available days
 * @param matches Array of matches to distribute
 * @param slotsByDay Map of available slots grouped by day
 * @returns Map of day string to matches assigned to that day
 */
function distributeMatchesAcrossDays(
  matches: Match[],
  slotsByDay: Map<string, Slot[]>
): Map<string, Match[]> {
  const matchesByDay = new Map<string, Match[]>();
  const availableDays = Array.from(slotsByDay.keys()).sort();

  if (availableDays.length === 0) {
    return matchesByDay;
  }

  // Initialize empty arrays for each day
  for (const day of availableDays) {
    matchesByDay.set(day, []);
  }

  // Distribute matches using round-robin approach
  let dayIndex = 0;
  for (const match of matches) {
    const currentDay = availableDays[dayIndex];
    matchesByDay.get(currentDay)!.push(match);

    // Move to next day, wrapping around
    dayIndex = (dayIndex + 1) % availableDays.length;
  }

  return matchesByDay;
}

/**
 * Helper function to validate day bucket distribution
 * Used for testing and debugging
 */
export function validateDayBucketDistribution(
  matches: Match[],
  slotsByDay: Map<string, Slot[]>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (matches.length === 0) {
    return { isValid: true, errors: [] };
  }

  if (slotsByDay.size === 0) {
    errors.push('No available days for scheduling');
    return { isValid: false, errors };
  }

  // Check if we have enough total slots
  const totalSlots = Array.from(slotsByDay.values()).reduce(
    (sum, daySlots) => sum + daySlots.length,
    0
  );

  if (totalSlots < matches.length) {
    errors.push(
      `Insufficient slots: ${totalSlots} slots for ${matches.length} matches`
    );
  }

  // Check for reasonable distribution - only warn if a day has significantly fewer slots
  const averageMatchesPerDay = matches.length / slotsByDay.size;
  const minRecommendedPerDay = Math.max(
    1,
    Math.floor(averageMatchesPerDay * 0.5)
  );

  for (const [day, daySlots] of slotsByDay) {
    if (
      daySlots.length < minRecommendedPerDay &&
      matches.length > slotsByDay.size
    ) {
      errors.push(
        `Day ${day} may have insufficient slots for balanced distribution`
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}
