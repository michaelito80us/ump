import { ILPScheduler } from '../index';
import { GreedyScheduler } from '../../greedy/index';
import type { Match, Team, Slot } from '@ump/core';
import { PluginExecutionError } from '@ump/engine';

// Mock teams for testing
const createMockTeam = (id: string, name: string): Team => ({
  id,
  name,
  sportIds: [],
  playerIds: [],
  managers: [],
  tournaments: [],
});

const teamA = createMockTeam('team-a', 'Team A');
const teamB = createMockTeam('team-b', 'Team B');
const teamC = createMockTeam('team-c', 'Team C');
const teamD = createMockTeam('team-d', 'Team D');

// Mock matches for testing
const createMockMatch = (id: string, teamA: Team, teamB: Team): Match => ({
  id,
  teamA,
  teamB,
  scoreA: 0,
  scoreB: 0,
  scheduledTime: undefined,
  venue: undefined,
  status: 'pending',
});

// Mock time slots
const createTimeSlots = (count: number, startHour: number = 9): Slot[] => {
  const slots: Slot[] = [];
  const baseDate = '2024-01-15';

  for (let i = 0; i < count; i++) {
    const hour = startHour + i;
    slots.push({
      field: `Field ${i + 1}`,
      start: `${baseDate}T${hour.toString().padStart(2, '0')}:00:00.000Z`,
      end: `${baseDate}T${(hour + 1).toString().padStart(2, '0')}:00:00.000Z`,
    });
  }

  return slots;
};

describe('ILP Scheduler', () => {
  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(ILPScheduler.id).toBe('ilp_v1');
      expect(ILPScheduler.name).toBe('ILP Optimizer');
      expect(ILPScheduler.version).toBe('1.0.0');
      expect(ILPScheduler.description).toBe(
        'Integer Linear Programming for optimal scheduling'
      );
      expect(ILPScheduler.author).toBe('UMP Core Team');
      expect(ILPScheduler.supportedLanguages).toEqual(['en', 'es']);
      expect(ILPScheduler.capabilities).toEqual(['matches:200']);
    });

    it('should have i18n translations', () => {
      expect(ILPScheduler.i18n.en.name).toBe('ILP Optimizer');
      expect(ILPScheduler.i18n.es.name).toBe('Optimizador ILP');
      expect(ILPScheduler.i18n.en.description).toBe(
        'Optimal scheduling using Integer Linear Programming'
      );
      expect(ILPScheduler.i18n.es.description).toBe(
        'Programación óptima usando Programación Lineal Entera'
      );
    });
  });

  describe('Input Validation', () => {
    it('should handle empty matches array', () => {
      const result = ILPScheduler.scheduleMatches([], {
        availableSlots: createTimeSlots(2),
      });
      expect(result).toEqual([]);
    });

    it('should throw error for invalid matches input', () => {
      expect(() => {
        ILPScheduler.scheduleMatches(null as any, {});
      }).toThrow(PluginExecutionError);

      expect(() => {
        ILPScheduler.scheduleMatches('invalid' as any, {});
      }).toThrow(PluginExecutionError);
    });

    it('should throw error for too many matches', () => {
      const manyMatches = Array.from({ length: 201 }, (_, i) =>
        createMockMatch(`match-${i}`, teamA, teamB)
      );

      expect(() => {
        ILPScheduler.scheduleMatches(manyMatches, {
          availableSlots: createTimeSlots(201),
        });
      }).toThrow(PluginExecutionError);
    });

    it('should throw error for no available slots', () => {
      const matches = [createMockMatch('match-1', teamA, teamB)];

      expect(() => {
        ILPScheduler.scheduleMatches(matches, {
          availableSlots: [],
        });
      }).toThrow(PluginExecutionError);

      expect(() => {
        ILPScheduler.scheduleMatches(matches, {});
      }).toThrow(PluginExecutionError);
    });
  });

  describe('Basic Scheduling', () => {
    it('should schedule a single match', () => {
      const matches = [createMockMatch('match-1', teamA, teamB)];
      const slots = createTimeSlots(1);

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
      });

      expect(result).toHaveLength(1);
      expect(result[0].scheduledTime).toBe(slots[0].start);
      expect(result[0].venue).toBe(slots[0].field);
    });

    it('should schedule multiple matches to different slots', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamC, teamD),
      ];
      const slots = createTimeSlots(2);

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
      });

      expect(result).toHaveLength(2);

      // All matches should be scheduled
      result.forEach((match) => {
        expect(match.scheduledTime).toBeDefined();
        expect(match.venue).toBeDefined();
      });

      // No two matches should have the same slot
      const scheduledSlots = result.map((m) => `${m.scheduledTime}-${m.venue}`);
      expect(new Set(scheduledSlots).size).toBe(scheduledSlots.length);
    });
  });

  describe('Constraint Handling', () => {
    it('should respect rest period constraints', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamA, teamC), // teamA plays in both
      ];
      const slots = createTimeSlots(3); // 3 slots, 1 hour apart

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        minRestMinutes: 90, // Require 90 minutes rest
      });

      expect(result).toHaveLength(2);

      // Find the two matches with teamA
      const match1 = result.find((m) => m.id === 'match-1')!;
      const match2 = result.find((m) => m.id === 'match-2')!;

      expect(match1.scheduledTime).toBeDefined();
      expect(match2.scheduledTime).toBeDefined();

      // Calculate time difference
      const time1 = new Date(match1.scheduledTime!).getTime();
      const time2 = new Date(match2.scheduledTime!).getTime();
      const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);

      expect(diffMinutes).toBeGreaterThanOrEqual(90);
    });

    it('should respect blackout hours', () => {
      const matches = [createMockMatch('match-1', teamA, teamB)];
      const slots = createTimeSlots(3, 12); // Slots at 12:00, 13:00, 14:00

      const blackoutHours = [
        {
          field: 'any',
          start: '2024-01-15T12:00:00.000Z',
          end: '2024-01-15T13:30:00.000Z',
        },
      ];

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        blackoutHours,
      });

      expect(result).toHaveLength(1);
      expect(result[0].scheduledTime).toBe('2024-01-15T14:00:00.000Z'); // Should use 14:00 slot
    });

    it('should handle infeasible constraints gracefully', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamA, teamC),
      ];
      const slots = createTimeSlots(2, 9); // Only 2 slots, 1 hour apart

      expect(() => {
        ILPScheduler.scheduleMatches(matches, {
          availableSlots: slots,
          minRestMinutes: 120, // Impossible with 1-hour slots
        });
      }).toThrow(PluginExecutionError);
    });
  });

  describe('Timeout Handling', () => {
    it('should respect timeout configuration', () => {
      const matches = Array.from({ length: 50 }, (_, i) =>
        createMockMatch(`match-${i}`, teamA, teamB)
      );
      const slots = createTimeSlots(50);

      // This should complete within timeout
      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        timeoutMs: 10000, // 10 seconds
      });

      expect(result).toHaveLength(50);
    });

    it('should use default timeout when not specified', () => {
      const matches = [createMockMatch('match-1', teamA, teamB)];
      const slots = createTimeSlots(1);

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        // No timeoutMs specified - should use default 30000ms
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('Comparison with Greedy Scheduler', () => {
    it('should produce valid schedules like greedy scheduler', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamC, teamD),
        createMockMatch('match-3', teamA, teamC),
        createMockMatch('match-4', teamB, teamD),
      ];
      const slots = createTimeSlots(4);
      const config = {
        availableSlots: slots,
        minRestMinutes: 60,
      };

      const ilpResult = ILPScheduler.scheduleMatches(matches, config);
      const greedyResult = GreedyScheduler.scheduleMatches(matches, config);

      // Both should schedule all matches
      expect(ilpResult).toHaveLength(4);
      expect(greedyResult).toHaveLength(4);

      // All matches should be scheduled in both results
      ilpResult.forEach((match) => {
        expect(match.scheduledTime).toBeDefined();
        expect(match.venue).toBeDefined();
      });

      greedyResult.forEach((match) => {
        expect(match.scheduledTime).toBeDefined();
        expect(match.venue).toBeDefined();
      });
    });

    it('should potentially find better solutions than greedy for complex scenarios', () => {
      // Create a scenario where greedy might not find optimal solution
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamA, teamC),
        createMockMatch('match-3', teamB, teamD),
        createMockMatch('match-4', teamC, teamD),
      ];
      const slots = createTimeSlots(6); // More slots than matches
      const config = {
        availableSlots: slots,
        minRestMinutes: 120, // Tight constraints
      };

      const ilpResult = ILPScheduler.scheduleMatches(matches, config);
      const greedyResult = GreedyScheduler.scheduleMatches(matches, config);

      // Both should find valid solutions
      expect(ilpResult).toHaveLength(4);
      expect(greedyResult).toHaveLength(4);

      // ILP should find a solution (optimality comparison would require more complex metrics)
      ilpResult.forEach((match) => {
        expect(match.scheduledTime).toBeDefined();
        expect(match.venue).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle matches with same teams', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamA, teamB), // Same teams
      ];
      const slots = createTimeSlots(3);

      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        minRestMinutes: 60,
      });

      expect(result).toHaveLength(2);

      // Should schedule both matches with proper rest period
      const time1 = new Date(result[0].scheduledTime!).getTime();
      const time2 = new Date(result[1].scheduledTime!).getTime();
      const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);

      expect(diffMinutes).toBeGreaterThanOrEqual(60);
    });

    it('should handle complex constraint combinations', () => {
      const matches = [
        createMockMatch('match-1', teamA, teamB),
        createMockMatch('match-2', teamA, teamC),
        createMockMatch('match-3', teamB, teamD),
      ];
      const slots = createTimeSlots(5, 8); // 8:00 to 12:00

      const config = {
        availableSlots: slots,
        minRestMinutes: 90,
        maxMatchesPerDay: 5,
        blackoutHours: [
          {
            field: 'any',
            start: '2024-01-15T10:00:00.000Z',
            end: '2024-01-15T11:00:00.000Z',
          },
        ],
      };

      const result = ILPScheduler.scheduleMatches(matches, config);
      expect(result).toHaveLength(3);

      // Verify no matches scheduled during blackout
      result.forEach((match) => {
        const matchTime = new Date(match.scheduledTime!);
        const blackoutStart = new Date('2024-01-15T10:00:00.000Z');
        const blackoutEnd = new Date('2024-01-15T11:00:00.000Z');

        expect(matchTime < blackoutStart || matchTime >= blackoutEnd).toBe(
          true
        );
      });
    });
  });

  describe('Performance', () => {
    it('should complete scheduling within reasonable time for moderate load', () => {
      const matches = Array.from({ length: 20 }, (_, i) => {
        const teamAIndex = i % 4;
        const teamBIndex = (i + 1) % 4;
        const teams = [teamA, teamB, teamC, teamD];
        return createMockMatch(
          `match-${i}`,
          teams[teamAIndex],
          teams[teamBIndex]
        );
      });
      const slots = createTimeSlots(25);

      const startTime = Date.now();
      const result = ILPScheduler.scheduleMatches(matches, {
        availableSlots: slots,
        minRestMinutes: 60,
      });
      const endTime = Date.now();

      expect(result).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
