import type { SchedulingPlugin } from '@ump/engine/registry';
import type { Match, SchedulingConstraints, Slot } from '@ump/core';

/**
 * Greedy Scheduler Plugin - T-9.1
 *
 * Implements a fast earliest-slot first-fit scheduling algorithm.
 * This is the baseline scheduler that prioritizes speed over optimality.
 *
 * Algorithm:
 * 1. Parse input constraints (venues, time slots, rest periods)
 * 2. Sort matches by priority (if any)
 * 3. For each match, find the earliest available slot that satisfies constraints
 * 4. Assign time and venue, mark slot as occupied
 * 5. Validate final schedule against all constraints
 */
export const GreedyScheduler: SchedulingPlugin = {
  // Plugin metadata
  id: 'greedy',
  name: 'Greedy Scheduler',
  version: '1.0.0',
  description: 'Fast earliest-slot first-fit scheduling algorithm',
  author: 'UMP Core Team',
  supportedLanguages: ['en', 'es'],
  capabilities: ['matches:unlimited'],
  i18n: {
    en: {
      name: 'Greedy Scheduler',
      description: 'Fast earliest-slot first-fit scheduling',
    },
    es: {
      name: 'Programador Codicioso',
      description: 'Programación rápida de primera coincidencia',
    },
  },

  /**
   * Main scheduling method - implements the greedy algorithm
   * @param matches Array of matches to schedule (without time/venue assignments)
   * @param config Configuration object containing constraints and settings
   * @returns Array of matches with scheduledTime and venue assigned
   */
  scheduleMatches(matches: Match[], config: any): Match[] {
    // Parse configuration and constraints
    const constraints = parseConstraints(config);

    // Validate input
    if (!matches || !Array.isArray(matches)) {
      throw new Error('Invalid matches input: expected array');
    }

    if (
      !constraints.availableSlots ||
      constraints.availableSlots.length === 0
    ) {
      throw new Error('No available time slots provided');
    }

    // Create a copy of matches to avoid mutating the original array
    const scheduledMatches = matches.map((match) => ({ ...match }));

    // Track occupied slots to prevent double-booking
    const occupiedSlots = new Set<string>();

    // Track team schedules for rest period validation
    const teamSchedules = new Map<string, Date[]>();

    // Sort matches by priority (pending matches first, then by ID for consistency)
    const sortedMatches = scheduledMatches
      .filter((match) => match.status === 'pending') // Only schedule pending matches
      .sort((a, b) => a.id.localeCompare(b.id));

    // Process each match using greedy algorithm
    for (const match of sortedMatches) {
      const assignment = findEarliestSlot(
        match,
        constraints,
        occupiedSlots,
        teamSchedules
      );

      if (assignment) {
        // Assign the time and venue
        match.scheduledTime = assignment.time;
        match.venue = assignment.venue;

        // Mark slot as occupied
        const slotKey = `${assignment.venue}-${assignment.time}`;
        occupiedSlots.add(slotKey);

        // Update team schedules for rest period tracking
        const matchTime = new Date(assignment.time);
        updateTeamSchedule(teamSchedules, match.teamA.id, matchTime);
        updateTeamSchedule(teamSchedules, match.teamB.id, matchTime);
      }
      // If no slot found, leave match unscheduled (scheduledTime and venue remain undefined)
    }

    // Validate the final schedule (only check for double bookings, not unscheduled matches)
    const scheduledOnly = scheduledMatches.filter(
      (m) => m.scheduledTime && m.venue
    );
    validateSchedule(scheduledOnly, constraints);

    return scheduledMatches;
  },
};

/**
 * Parse and validate configuration constraints
 */
function parseConstraints(config: any): SchedulingConstraints {
  const defaultConstraints: SchedulingConstraints = {
    maxMatchesPerDay: 10,
    minRestMinutes: 60,
    availableSlots: [],
    blackoutHours: [],
  };

  if (!config) {
    return defaultConstraints;
  }

  return {
    maxMatchesPerDay:
      config.maxMatchesPerDay || defaultConstraints.maxMatchesPerDay,
    minRestMinutes: config.minRestMinutes || defaultConstraints.minRestMinutes,
    availableSlots: config.availableSlots || defaultConstraints.availableSlots,
    blackoutHours: config.blackoutHours || defaultConstraints.blackoutHours,
  };
}

/**
 * Find the earliest available slot for a match that satisfies all constraints
 */
function findEarliestSlot(
  match: Match,
  constraints: SchedulingConstraints,
  occupiedSlots: Set<string>,
  teamSchedules: Map<string, Date[]>
): { time: string; venue: string } | null {
  // Sort slots by start time to implement "earliest-fit"
  const sortedSlots = [...constraints.availableSlots].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  for (const slot of sortedSlots) {
    const slotKey = `${slot.field}-${slot.start}`;

    // Skip if slot is already occupied
    if (occupiedSlots.has(slotKey)) {
      continue;
    }

    // Check if slot is in blackout hours
    if (isInBlackoutHours(slot, constraints.blackoutHours)) {
      continue;
    }

    // Check rest period constraints for both teams
    const slotTime = new Date(slot.start);
    if (
      !satisfiesRestPeriod(
        match.teamA.id,
        slotTime,
        constraints.minRestMinutes,
        teamSchedules
      ) ||
      !satisfiesRestPeriod(
        match.teamB.id,
        slotTime,
        constraints.minRestMinutes,
        teamSchedules
      )
    ) {
      continue;
    }

    // Check daily match limit
    if (!satisfiesDailyLimit(slot, constraints, occupiedSlots)) {
      continue;
    }

    // Found a suitable slot
    return {
      time: slot.start,
      venue: slot.field,
    };
  }

  return null; // No suitable slot found
}

/**
 * Check if a slot falls within blackout hours
 */
function isInBlackoutHours(slot: Slot, blackoutHours?: Slot[]): boolean {
  if (!blackoutHours || blackoutHours.length === 0) {
    return false;
  }

  const slotStart = new Date(slot.start);
  const slotEnd = new Date(slot.end);

  return blackoutHours.some((blackout) => {
    const blackoutStart = new Date(blackout.start);
    const blackoutEnd = new Date(blackout.end);

    // Check for any overlap between slot and blackout period
    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

/**
 * Check if scheduling a match at this time satisfies rest period constraints
 */
function satisfiesRestPeriod(
  teamId: string,
  proposedTime: Date,
  minRestMinutes: number,
  teamSchedules: Map<string, Date[]>
): boolean {
  const teamTimes = teamSchedules.get(teamId);
  if (!teamTimes || teamTimes.length === 0) {
    return true; // No previous matches, rest period satisfied
  }

  const minRestMs = minRestMinutes * 60 * 1000;

  return teamTimes.every((previousTime) => {
    const timeDiff = Math.abs(proposedTime.getTime() - previousTime.getTime());
    return timeDiff >= minRestMs;
  });
}

/**
 * Check if scheduling this slot would exceed the daily match limit
 */
function satisfiesDailyLimit(
  slot: Slot,
  constraints: SchedulingConstraints,
  occupiedSlots: Set<string>
): boolean {
  const slotDate = new Date(slot.start).toDateString();

  // Count matches already scheduled for this date
  let matchesOnDate = 0;
  for (const occupiedSlot of occupiedSlots) {
    const [, timeStr] = occupiedSlot.split('-');
    const occupiedDate = new Date(timeStr).toDateString();
    if (occupiedDate === slotDate) {
      matchesOnDate++;
    }
  }

  return matchesOnDate < constraints.maxMatchesPerDay;
}

/**
 * Update team schedule tracking
 */
function updateTeamSchedule(
  teamSchedules: Map<string, Date[]>,
  teamId: string,
  matchTime: Date
): void {
  const existing = teamSchedules.get(teamId) || [];
  existing.push(matchTime);
  teamSchedules.set(teamId, existing);
}

/**
 * Validate the final schedule against all constraints
 */
function validateSchedule(
  matches: Match[],
  constraints: SchedulingConstraints
): void {
  const errors: string[] = [];

  // Check for double-booked venues
  const venueBookings = new Map<string, string[]>();

  for (const match of matches) {
    if (match.scheduledTime && match.venue) {
      const key = `${match.venue}-${match.scheduledTime}`;
      const existing = venueBookings.get(key) || [];
      existing.push(match.id);
      venueBookings.set(key, existing);

      if (existing.length > 1) {
        errors.push(
          `Double booking detected: ${match.venue} at ${match.scheduledTime} ` +
            `(matches: ${existing.join(', ')})`
        );
      }
    }
  }

  // Check rest periods
  const teamSchedules = new Map<string, { matchId: string; time: Date }[]>();

  for (const match of matches) {
    if (match.scheduledTime) {
      const time = new Date(match.scheduledTime);

      // Track both teams
      for (const team of [match.teamA, match.teamB]) {
        const existing = teamSchedules.get(team.id) || [];
        existing.push({ matchId: match.id, time });
        teamSchedules.set(team.id, existing);
      }
    }
  }

  // Validate rest periods
  const minRestMs = constraints.minRestMinutes * 60 * 1000;

  for (const [teamId, schedule] of teamSchedules) {
    const sortedSchedule = schedule.sort(
      (a, b) => a.time.getTime() - b.time.getTime()
    );

    for (let i = 1; i < sortedSchedule.length; i++) {
      const timeDiff =
        sortedSchedule[i].time.getTime() - sortedSchedule[i - 1].time.getTime();
      if (timeDiff < minRestMs) {
        errors.push(
          `Rest period violation for team ${teamId}: ` +
            `${timeDiff / (60 * 1000)} minutes between matches ` +
            `${sortedSchedule[i - 1].matchId} and ${sortedSchedule[i].matchId} ` +
            `(minimum: ${constraints.minRestMinutes} minutes)`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Schedule validation failed:\n${errors.join('\n')}`);
  }
}

export default GreedyScheduler;
