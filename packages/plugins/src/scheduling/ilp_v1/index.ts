import type { SchedulingPlugin } from '@ump/engine/registry';
import type { Match, SchedulingConstraints, Slot } from '@ump/core';
import { DateTime, TimeSlot } from '@ump/core/utils/date';
import { PluginExecutionError } from '@ump/engine';

// Import the ILP solver
import { solve } from 'yalps';

/**
 * ILP Scheduler Plugin - T-9.2
 *
 * Implements optimal match scheduling using Integer Linear Programming.
 * This scheduler finds the mathematically optimal solution for match allocation
 * considering all constraints simultaneously.
 *
 * Algorithm:
 * 1. Model variables: binary variables for each match-slot assignment
 * 2. Define objective function: minimize total scheduling cost/conflicts
 * 3. Add constraints: rest periods, venue conflicts, blackout hours
 * 4. Solve with timeout guard to prevent infinite solving
 * 5. Extract solution and assign matches to optimal slots
 */
export const ILPScheduler: SchedulingPlugin = {
  // Plugin metadata
  id: 'ilp_v1',
  name: 'ILP Optimizer',
  version: '1.0.0',
  description: 'Integer Linear Programming for optimal scheduling',
  author: 'UMP Core Team',
  supportedLanguages: ['en', 'es'],
  capabilities: ['matches:200'], // Limited due to computational complexity
  i18n: {
    en: {
      name: 'ILP Optimizer',
      description: 'Optimal scheduling using Integer Linear Programming',
    },
    es: {
      name: 'Optimizador ILP',
      description: 'Programación óptima usando Programación Lineal Entera',
    },
  },

  /**
   * Main scheduling method - implements the ILP optimization
   * @param matches Array of matches to schedule (without time/venue assignments)
   * @param config Configuration object containing constraints and settings
   * @returns Array of matches with optimal scheduledTime and venue assigned
   */
  scheduleMatches(matches: Match[], config: any): Match[] {
    // Parse configuration and constraints
    const constraints = parseConstraints(config);
    const timeoutMs = config.timeoutMs || 30000; // Default 30 second timeout

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

    if (matches.length > 200) {
      throw new PluginExecutionError(
        `Too many matches for ILP solver: ${matches.length} > 200`,
        'CAPACITY_EXCEEDED'
      );
    }

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
      // Solve the ILP problem with timeout
      const solution = solveILPWithTimeout(matches, constraints, timeoutMs);

      // Convert Slot[] to TimeSlot[] for processing
      const timeSlots = constraints.availableSlots.map((slot) => ({
        start: DateTime.fromISO(slot.start),
        end: DateTime.fromISO(slot.end),
        duration: Math.round(
          DateTime.fromISO(slot.end).diff(
            DateTime.fromISO(slot.start),
            'minutes'
          ).minutes
        ),
        timezone: 'UTC',
        venue: slot.field,
      }));

      // Extract scheduled matches from solution
      return extractScheduledMatches(matches, timeSlots, solution);
    } catch (error) {
      if (error instanceof PluginExecutionError) {
        throw error;
      }
      throw new PluginExecutionError(
        `ILP solving failed: ${error instanceof Error ? error.message : String(error)}`,
        'SOLVER_ERROR',
        { originalError: error }
      );
    }
  },
};

/**
 * Parse configuration into structured constraints
 */
function parseConstraints(config: any): SchedulingConstraints {
  return {
    maxMatchesPerDay: config.maxMatchesPerDay || 10,
    minRestMinutes: config.minRestMinutes || 60,
    availableSlots: config.availableSlots || [],
    blackoutHours: config.blackoutHours || [],
  };
}

/**
 * Solve the ILP problem with timeout protection
 */
function solveILPWithTimeout(
  matches: Match[],
  constraints: SchedulingConstraints,
  timeoutMs: number
): any {
  // Build the ILP model
  const model = buildILPModel(matches, constraints);

  const startTime = Date.now();

  try {
    const result = solve(model);

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > timeoutMs) {
      throw new PluginExecutionError(
        `ILP solver timeout after ${elapsedTime}ms`,
        'TIMEOUT'
      );
    }

    if (!result || result.status !== 'optimal') {
      throw new PluginExecutionError(
        'No feasible solution found',
        'INFEASIBLE'
      );
    }

    return result.variables;
  } catch (error) {
    if (error instanceof PluginExecutionError) {
      throw error;
    }
    throw new PluginExecutionError(
      `ILP solver error: ${error instanceof Error ? error.message : String(error)}`,
      'SOLVER_ERROR',
      { originalError: error }
    );
  }
}

/**
 * Build the ILP mathematical model
 */
function buildILPModel(matches: Match[], constraints: SchedulingConstraints) {
  const variables: Record<string, any> = {};
  const constraints_obj: Record<string, any> = {};

  // Create binary variables for each match-slot combination
  // Variable name format: m{matchIndex}_s{slotIndex}
  for (let m = 0; m < matches.length; m++) {
    for (let s = 0; s < constraints.availableSlots.length; s++) {
      const varName = `m${m}_s${s}`;
      variables[varName] = {
        // Objective: minimize scheduling conflicts and prefer earlier slots
        cost: calculateSlotCost(matches[m], constraints.availableSlots[s], s),
        // Binary variable (0 or 1)
        min: 0,
        max: 1,
        type: 'integer',
      };
    }
  }

  // Constraint 1: Each match must be assigned to exactly one slot
  for (let m = 0; m < matches.length; m++) {
    const constraintName = `match_${m}_assignment`;
    constraints_obj[constraintName] = {
      equal: 1,
    };

    for (let s = 0; s < constraints.availableSlots.length; s++) {
      const varName = `m${m}_s${s}`;
      constraints_obj[constraintName][varName] = 1;
    }
  }

  // Constraint 2: No two matches can use the same slot
  for (let s = 0; s < constraints.availableSlots.length; s++) {
    const constraintName = `slot_${s}_capacity`;
    constraints_obj[constraintName] = {
      max: 1,
    };

    for (let m = 0; m < matches.length; m++) {
      const varName = `m${m}_s${s}`;
      constraints_obj[constraintName][varName] = 1;
    }
  }

  // Constraint 3: Rest period constraints
  addRestPeriodConstraints(matches, constraints, constraints_obj);

  // Constraint 4: Blackout hours constraints
  addBlackoutConstraints(matches, constraints, constraints_obj);

  // Convert to YALPS format
  const yalpsVariables: Record<string, Record<string, number>> = {};

  for (const [varName, varData] of Object.entries(variables)) {
    yalpsVariables[varName] = {
      cost: varData.cost,
      ...Object.keys(constraints_obj).reduce(
        (constraintCoeffs, constraintName) => {
          // Find coefficient for this variable in this constraint
          const coeff = constraints_obj[constraintName][varName] || 0;
          constraintCoeffs[constraintName] = coeff;
          return constraintCoeffs;
        },
        {} as Record<string, number>
      ),
    };
  }

  const yalpsConstraints: Record<
    string,
    { max?: number; min?: number; equal?: number }
  > = {};
  for (const [name, constraint] of Object.entries(constraints_obj)) {
    // Extract only the bounds (max, min, equal), not variable coefficients
    const bounds: { max?: number; min?: number; equal?: number } = {};
    if ('max' in constraint) bounds.max = constraint.max;
    if ('min' in constraint) bounds.min = constraint.min;
    if ('equal' in constraint) bounds.equal = constraint.equal;
    yalpsConstraints[name] = bounds;
  }

  return {
    direction: 'minimize' as const,
    objective: 'cost',
    constraints: yalpsConstraints,
    variables: yalpsVariables,
    binaries: true, // All variables are binary
  };
}

/**
 * Calculate the cost of assigning a match to a specific slot
 */
function calculateSlotCost(
  match: Match,
  slot: Slot,
  slotIndex: number
): number {
  let cost = slotIndex; // Prefer earlier slots

  // Add penalty for less desirable time slots
  const slotTime = DateTime.fromISO(slot.start);
  const hour = slotTime.hour;

  // Penalty for very early or very late hours
  if (hour < 8 || hour > 20) {
    cost += 10;
  }

  // Penalty for lunch hours
  if (hour >= 12 && hour <= 13) {
    cost += 5;
  }

  return cost;
}

/**
 * Add rest period constraints to the ILP model
 */
function addRestPeriodConstraints(
  matches: Match[],
  constraints: SchedulingConstraints,
  constraints_obj: Record<string, any>
): void {
  const minRestMinutes = constraints.minRestMinutes;

  for (let m1 = 0; m1 < matches.length; m1++) {
    for (let m2 = m1 + 1; m2 < matches.length; m2++) {
      const match1 = matches[m1];
      const match2 = matches[m2];

      // Check if matches share teams
      const sharedTeams = getSharedTeams(match1, match2);
      if (sharedTeams.length === 0) continue;

      // Add constraints for each pair of slots that violate rest period
      for (let s1 = 0; s1 < constraints.availableSlots.length; s1++) {
        for (let s2 = 0; s2 < constraints.availableSlots.length; s2++) {
          if (s1 === s2) continue;

          const slot1 = constraints.availableSlots[s1];
          const slot2 = constraints.availableSlots[s2];

          if (violatesRestPeriod(slot1, slot2, minRestMinutes)) {
            const constraintName = `rest_m${m1}_s${s1}_m${m2}_s${s2}`;
            constraints_obj[constraintName] = {
              max: 1,
            };
            constraints_obj[constraintName][`m${m1}_s${s1}`] = 1;
            constraints_obj[constraintName][`m${m2}_s${s2}`] = 1;
          }
        }
      }
    }
  }
}

/**
 * Add blackout hours constraints to the ILP model
 */
function addBlackoutConstraints(
  matches: Match[],
  constraints: SchedulingConstraints,
  constraints_obj: Record<string, any>
): void {
  if (!constraints.blackoutHours || constraints.blackoutHours.length === 0) {
    return;
  }

  for (let s = 0; s < constraints.availableSlots.length; s++) {
    const slot = constraints.availableSlots[s];

    if (isInBlackoutHours(slot, constraints.blackoutHours)) {
      // This slot is in blackout hours - no matches can be assigned
      const constraintName = `blackout_slot_${s}`;
      constraints_obj[constraintName] = {
        max: 0,
      };

      for (let m = 0; m < matches.length; m++) {
        const varName = `m${m}_s${s}`;
        constraints_obj[constraintName][varName] = 1;
      }
    }
  }
}

/**
 * Extract scheduled matches from the ILP solution
 */
function extractScheduledMatches(
  matches: Match[],
  slots: TimeSlot[],
  solution: any
): Match[] {
  const scheduledMatches = matches.map((match) => ({ ...match }));

  // YALPS returns variables as array of [name, value] pairs
  const solutionMap: Record<string, number> = {};
  if (Array.isArray(solution)) {
    for (const [varName, value] of solution) {
      solutionMap[varName] = value;
    }
  } else {
    // Fallback for object format
    Object.assign(solutionMap, solution);
  }

  // Parse solution to find match-slot assignments
  for (const [varName, value] of Object.entries(solutionMap)) {
    if (typeof value === 'number' && value > 0.5) {
      // Binary variable is 1
      const match = varName.match(/^m(\d+)_s(\d+)$/);
      if (match) {
        const matchIndex = parseInt(match[1]);
        const slotIndex = parseInt(match[2]);

        if (matchIndex < scheduledMatches.length && slotIndex < slots.length) {
          const slot = slots[slotIndex];
          scheduledMatches[matchIndex] = {
            ...scheduledMatches[matchIndex],
            scheduledTime: slot.start.toUTC().toISO() || undefined,
            venue: slot.venue,
          };
        }
      }
    }
  }

  return scheduledMatches;
}

/**
 * Helper functions
 */
function getSharedTeams(match1: Match, match2: Match): string[] {
  const teams1 = [match1.teamA.id, match1.teamB.id];
  const teams2 = [match2.teamA.id, match2.teamB.id];
  return teams1.filter((team) => teams2.includes(team));
}

function violatesRestPeriod(
  slot1: Slot,
  slot2: Slot,
  minRestMinutes: number
): boolean {
  const time1 = DateTime.fromISO(slot1.start);
  const time2 = DateTime.fromISO(slot2.start);
  const diffMinutes = Math.abs(time1.diff(time2, 'minutes').minutes);
  return diffMinutes < minRestMinutes;
}

function isInBlackoutHours(slot: Slot, blackoutHours: Slot[]): boolean {
  const slotStart = DateTime.fromISO(slot.start);
  const slotEnd = DateTime.fromISO(slot.end);

  return blackoutHours.some((blackout) => {
    const blackoutStart = DateTime.fromISO(blackout.start);
    const blackoutEnd = DateTime.fromISO(blackout.end);

    // Check if slot overlaps with blackout period
    return slotStart < blackoutEnd && slotEnd > blackoutStart;
  });
}

export default ILPScheduler;
