import { GreedyScheduler } from './index';
import type { Match, Team } from '@ump/core';

describe('GreedyScheduler Plugin - T-9.1', () => {
  // Mock teams for testing
  const mockTeamA: Team = {
    id: 'team-a',
    name: 'Team A',
    sportIds: ['rugby'],
    playerIds: ['player-1', 'player-2'],
    managers: ['manager-1'],
    tournaments: ['tournament-1'],
  };

  const mockTeamB: Team = {
    id: 'team-b',
    name: 'Team B',
    sportIds: ['rugby'],
    playerIds: ['player-3', 'player-4'],
    managers: ['manager-2'],
    tournaments: ['tournament-1'],
  };

  const mockTeamC: Team = {
    id: 'team-c',
    name: 'Team C',
    sportIds: ['rugby'],
    playerIds: ['player-5', 'player-6'],
    managers: ['manager-3'],
    tournaments: ['tournament-1'],
  };

  // Mock matches
  const createMockMatch = (id: string, teamA: Team, teamB: Team): Match => ({
    id,
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    status: 'pending',
  });

  const mockMatches = [
    createMockMatch('match-1', mockTeamA, mockTeamB),
    createMockMatch('match-2', mockTeamB, mockTeamC),
    createMockMatch('match-3', mockTeamA, mockTeamC),
  ];

  // Mock scheduling configuration
  const mockConfig = {
    maxMatchesPerDay: 5,
    minRestMinutes: 60,
    availableSlots: [
      {
        field: 'Field 1',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T10:00:00Z',
      },
      {
        field: 'Field 1',
        start: '2024-01-15T10:30:00Z',
        end: '2024-01-15T11:30:00Z',
      },
      {
        field: 'Field 2',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T10:00:00Z',
      },
      {
        field: 'Field 2',
        start: '2024-01-15T11:00:00Z',
        end: '2024-01-15T12:00:00Z',
      },
    ],
  };

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(GreedyScheduler.id).toBe('greedy');
      expect(GreedyScheduler.name).toBe('Greedy Scheduler');
      expect(GreedyScheduler.version).toBe('1.0.0');
      expect(GreedyScheduler.author).toBe('UMP Core Team');
      expect(GreedyScheduler.supportedLanguages).toEqual(['en', 'es']);
      expect(GreedyScheduler.capabilities).toEqual(['matches:unlimited']);
    });

    it('should have internationalization support', () => {
      expect(GreedyScheduler.i18n.en.name).toBe('Greedy Scheduler');
      expect(GreedyScheduler.i18n.es.name).toBe('Programador Codicioso');
    });
  });

  describe('scheduleMatches Method', () => {
    it('should implement scheduleMatches method', () => {
      expect(typeof GreedyScheduler.scheduleMatches).toBe('function');
    });

    it('should return an array of matches', () => {
      const result = GreedyScheduler.scheduleMatches(mockMatches, mockConfig);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(mockMatches.length);
    });

    it('should assign scheduledTime and venue to matches when possible', () => {
      const result = GreedyScheduler.scheduleMatches(mockMatches, mockConfig);

      // At least some matches should be scheduled
      const scheduledMatches = result.filter((m) => m.scheduledTime && m.venue);
      expect(scheduledMatches.length).toBeGreaterThan(0);

      scheduledMatches.forEach((match) => {
        expect(typeof match.scheduledTime).toBe('string');
        expect(typeof match.venue).toBe('string');
      });
    });

    it('should use earliest-fit algorithm (earliest match ID gets earliest slot)', () => {
      const result = GreedyScheduler.scheduleMatches(mockMatches, mockConfig);

      // Find the match with the earliest ID that was scheduled
      const scheduledMatches = result.filter((m) => m.scheduledTime && m.venue);
      const earliestMatch = scheduledMatches.find((m) => m.id === 'match-1');

      // The match with ID 'match-1' should get the earliest available slot
      expect(earliestMatch).toBeDefined();
      expect(earliestMatch?.scheduledTime).toBe('2024-01-15T09:00:00Z');
    });

    it('should not double-book venues at the same time', () => {
      const result = GreedyScheduler.scheduleMatches(mockMatches, mockConfig);

      const bookings = new Set<string>();
      result.forEach((match) => {
        const booking = `${match.venue}-${match.scheduledTime}`;
        expect(bookings.has(booking)).toBe(false);
        bookings.add(booking);
      });
    });

    it('should handle empty matches array', () => {
      const result = GreedyScheduler.scheduleMatches([], mockConfig);
      expect(result).toEqual([]);
    });

    it('should only schedule pending matches', () => {
      const mixedMatches = [
        { ...mockMatches[0], status: 'pending' as const },
        { ...mockMatches[1], status: 'final' as const },
        { ...mockMatches[2], status: 'live' as const },
      ];

      const result = GreedyScheduler.scheduleMatches(mixedMatches, mockConfig);

      // Only the pending match should be scheduled
      const scheduledCount = result.filter(
        (m) => m.scheduledTime && m.venue
      ).length;
      expect(scheduledCount).toBeLessThanOrEqual(1); // At most 1 should be scheduled
    });
  });

  describe('Constraint Validation', () => {
    it('should throw error when no available slots provided', () => {
      const configWithoutSlots = {
        ...mockConfig,
        availableSlots: [],
      };

      expect(() => {
        GreedyScheduler.scheduleMatches(mockMatches, configWithoutSlots);
      }).toThrow('No available time slots provided');
    });

    it('should throw error for invalid matches input', () => {
      expect(() => {
        GreedyScheduler.scheduleMatches(null as any, mockConfig);
      }).toThrow('Invalid matches input: expected array');

      expect(() => {
        GreedyScheduler.scheduleMatches('invalid' as any, mockConfig);
      }).toThrow('Invalid matches input: expected array');
    });

    it('should respect rest period constraints', () => {
      const configWithShortRest = {
        ...mockConfig,
        minRestMinutes: 120, // 2 hours
        availableSlots: [
          {
            field: 'Field 1',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T10:00:00Z',
          },
          {
            field: 'Field 1',
            start: '2024-01-15T10:30:00Z', // Only 1.5 hours later
            end: '2024-01-15T11:30:00Z',
          },
        ],
      };

      // Create matches where same team plays twice
      const sameTeamMatches = [
        createMockMatch('match-1', mockTeamA, mockTeamB),
        createMockMatch('match-2', mockTeamA, mockTeamC), // Team A plays again
      ];

      const result = GreedyScheduler.scheduleMatches(
        sameTeamMatches,
        configWithShortRest
      );

      // Should not be able to schedule both matches due to rest period constraint
      const scheduledCount = result.filter(
        (m) => m.scheduledTime && m.venue
      ).length;
      expect(scheduledCount).toBeLessThan(sameTeamMatches.length);
    });

    it('should respect blackout hours', () => {
      const configWithBlackout = {
        ...mockConfig,
        blackoutHours: [
          {
            field: 'Field 1',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T11:00:00Z',
          },
        ],
      };

      const result = GreedyScheduler.scheduleMatches(
        [mockMatches[0]],
        configWithBlackout
      );

      // Should not schedule during blackout hours
      expect(result[0].venue).not.toBe('Field 1');
      expect(result[0].scheduledTime).not.toBe('2024-01-15T09:00:00Z');
    });

    it('should respect daily match limits', () => {
      const configWithLowLimit = {
        maxMatchesPerDay: 1,
        minRestMinutes: 60,
        availableSlots: [
          {
            field: 'Field 1',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T10:00:00Z',
          },
          {
            field: 'Field 2',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T10:00:00Z',
          },
        ],
      };

      const result = GreedyScheduler.scheduleMatches(
        mockMatches,
        configWithLowLimit
      );

      // Should not be able to schedule more than 1 match due to daily limit
      const scheduledCount = result.filter(
        (m) => m.scheduledTime && m.venue
      ).length;
      expect(scheduledCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Schedule Validation', () => {
    it('should validate final schedule for double bookings', () => {
      // This test ensures the validation catches any bugs in the scheduling logic
      const result = GreedyScheduler.scheduleMatches(mockMatches, mockConfig);

      // If we get here without throwing, the validation passed
      expect(result).toBeDefined();

      // Manually verify no double bookings
      const bookings = new Map<string, string[]>();
      result.forEach((match) => {
        if (match.scheduledTime && match.venue) {
          const key = `${match.venue}-${match.scheduledTime}`;
          const existing = bookings.get(key) || [];
          existing.push(match.id);
          bookings.set(key, existing);

          expect(existing.length).toBe(1); // No double bookings
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', () => {
      expect(() => {
        GreedyScheduler.scheduleMatches(mockMatches, { availableSlots: [] });
      }).toThrow(/No available time slots/);
    });

    it('should handle configuration with missing properties gracefully', () => {
      const minimalConfig = {
        availableSlots: mockConfig.availableSlots,
      };

      // Should not throw, should use defaults
      expect(() => {
        GreedyScheduler.scheduleMatches([mockMatches[0]], minimalConfig);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle reasonable number of matches efficiently', () => {
      // Create 50 matches
      const manyMatches = Array.from({ length: 50 }, (_, i) =>
        createMockMatch(`match-${i}`, mockTeamA, mockTeamB)
      );

      // Create enough slots (10 fields, 6 slots each = 60 total slots)
      const manySlots = Array.from({ length: 60 }, (_, i) => {
        const fieldNum = Math.floor(i / 6) + 1;
        const slotNum = i % 6;
        const startHour = 9 + slotNum * 2; // 2-hour slots starting at 9am
        return {
          field: `Field ${fieldNum}`,
          start: new Date(2024, 0, 15, startHour, 0).toISOString(),
          end: new Date(2024, 0, 15, startHour + 1, 30).toISOString(), // 1.5 hour matches
        };
      });

      const largeConfig = {
        ...mockConfig,
        availableSlots: manySlots,
        maxMatchesPerDay: 100,
      };

      const startTime = Date.now();
      const result = GreedyScheduler.scheduleMatches(manyMatches, largeConfig);
      const endTime = Date.now();

      expect(result).toHaveLength(manyMatches.length);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
