import { DayBucketScheduler, validateDayBucketDistribution } from '../index';
import { GreedyScheduler } from '../../greedy';
import type { Match, Team, Slot } from '@ump/core';
import { PluginExecutionError } from '@ump/engine';

// Mock the GreedyScheduler to control its behavior in tests
jest.mock('../../greedy', () => ({
  GreedyScheduler: {
    scheduleMatches: jest.fn(),
  },
}));

const mockGreedyScheduler = GreedyScheduler as jest.Mocked<
  typeof GreedyScheduler
>;

describe('DayBucketScheduler Plugin - T-9.3', () => {
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

  const mockTeamD: Team = {
    id: 'team-d',
    name: 'Team D',
    sportIds: ['rugby'],
    playerIds: ['player-7', 'player-8'],
    managers: ['manager-4'],
    tournaments: ['tournament-1'],
  };

  // Helper function to create mock matches
  const createMockMatch = (id: string, teamA: Team, teamB: Team): Match => ({
    id,
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    status: 'pending',
  });

  // Mock matches for testing
  const mockMatches = [
    createMockMatch('match-1', mockTeamA, mockTeamB),
    createMockMatch('match-2', mockTeamB, mockTeamC),
    createMockMatch('match-3', mockTeamA, mockTeamC),
    createMockMatch('match-4', mockTeamC, mockTeamD),
    createMockMatch('match-5', mockTeamA, mockTeamD),
    createMockMatch('match-6', mockTeamB, mockTeamD),
  ];

  // Mock slots spanning multiple days
  const mockSlotsMultipleDays: Slot[] = [
    // Day 1 (2024-01-15)
    {
      field: 'Field 1',
      start: '2024-01-15T09:00:00Z',
      end: '2024-01-15T10:00:00Z',
    },
    {
      field: 'Field 1',
      start: '2024-01-15T11:00:00Z',
      end: '2024-01-15T12:00:00Z',
    },
    {
      field: 'Field 2',
      start: '2024-01-15T09:00:00Z',
      end: '2024-01-15T10:00:00Z',
    },
    // Day 2 (2024-01-16)
    {
      field: 'Field 1',
      start: '2024-01-16T09:00:00Z',
      end: '2024-01-16T10:00:00Z',
    },
    {
      field: 'Field 1',
      start: '2024-01-16T11:00:00Z',
      end: '2024-01-16T12:00:00Z',
    },
    {
      field: 'Field 2',
      start: '2024-01-16T09:00:00Z',
      end: '2024-01-16T10:00:00Z',
    },
    // Day 3 (2024-01-17)
    {
      field: 'Field 1',
      start: '2024-01-17T09:00:00Z',
      end: '2024-01-17T10:00:00Z',
    },
    {
      field: 'Field 2',
      start: '2024-01-17T11:00:00Z',
      end: '2024-01-17T12:00:00Z',
    },
  ];

  const mockConfig = {
    maxMatchesPerDay: 5,
    minRestMinutes: 60,
    availableSlots: mockSlotsMultipleDays,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation: return matches with scheduled times
    mockGreedyScheduler.scheduleMatches.mockImplementation(
      (matches, config) => {
        return matches.map((match, index) => {
          const slots = config.availableSlots || [];
          if (index < slots.length) {
            return {
              ...match,
              scheduledTime: slots[index].start,
              venue: slots[index].field,
            };
          }
          return match; // Unscheduled
        });
      }
    );
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(DayBucketScheduler.id).toBe('day_bucket');
      expect(DayBucketScheduler.name).toBe('Day Bucket Scheduler');
      expect(DayBucketScheduler.version).toBe('1.0.0');
      expect(DayBucketScheduler.description).toBe(
        'Groups matches by day then applies greedy scheduling within each day'
      );
      expect(DayBucketScheduler.author).toBe('UMP Core Team');
      expect(DayBucketScheduler.supportedLanguages).toEqual(['en', 'es']);
      expect(DayBucketScheduler.capabilities).toEqual(['matches:unlimited']);
    });

    it('should have internationalization support', () => {
      expect(DayBucketScheduler.i18n.en.name).toBe('Day Bucket Scheduler');
      expect(DayBucketScheduler.i18n.es.name).toBe(
        'Programador de Cubetas por Día'
      );
      expect(DayBucketScheduler.i18n.en.description).toBe(
        'Balances match distribution across days with efficient daily scheduling'
      );
      expect(DayBucketScheduler.i18n.es.description).toBe(
        'Equilibra la distribución de partidos por días con programación diaria eficiente'
      );
    });
  });

  describe('scheduleMatches Method', () => {
    it('should implement scheduleMatches method', () => {
      expect(typeof DayBucketScheduler.scheduleMatches).toBe('function');
    });

    it('should return an array of matches', () => {
      const result = DayBucketScheduler.scheduleMatches(
        mockMatches,
        mockConfig
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(mockMatches.length);
    });

    it('should distribute matches across multiple days', () => {
      const _result = DayBucketScheduler.scheduleMatches(
        mockMatches,
        mockConfig
      );

      // Verify that greedy scheduler was called multiple times (once per day)
      expect(mockGreedyScheduler.scheduleMatches).toHaveBeenCalledTimes(3); // 3 days

      // Verify that matches were distributed across days
      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;
      const totalMatchesInCalls = calls.reduce(
        (sum, call) => sum + call[0].length,
        0
      );
      expect(totalMatchesInCalls).toBe(mockMatches.length);
    });

    it('should call greedy scheduler with day-specific slots', () => {
      DayBucketScheduler.scheduleMatches(mockMatches, mockConfig);

      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;

      // Each call should have slots from only one day
      calls.forEach((call) => {
        const [, config] = call;
        const slots = config.availableSlots;

        // All slots in a call should be from the same day
        const days = new Set(
          slots.map((slot: Slot) => slot.start.split('T')[0])
        );
        expect(days.size).toBe(1);
      });
    });

    it('should handle empty matches array', () => {
      const result = DayBucketScheduler.scheduleMatches([], mockConfig);
      expect(result).toEqual([]);
      expect(mockGreedyScheduler.scheduleMatches).not.toHaveBeenCalled();
    });

    it('should distribute matches evenly using round-robin', () => {
      const sixMatches = mockMatches; // 6 matches
      DayBucketScheduler.scheduleMatches(sixMatches, mockConfig);

      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;
      expect(calls).toHaveLength(3); // 3 days

      // Each day should get 2 matches (6 matches / 3 days = 2)
      calls.forEach((call) => {
        const [matches] = call;
        expect(matches).toHaveLength(2);
      });
    });

    it('should handle uneven distribution gracefully', () => {
      const fiveMatches = mockMatches.slice(0, 5); // 5 matches
      DayBucketScheduler.scheduleMatches(fiveMatches, mockConfig);

      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;
      const matchCounts = calls.map((call) => call[0].length);

      // Should distribute as evenly as possible: [2, 2, 1] or similar
      expect(matchCounts.reduce((sum, count) => sum + count, 0)).toBe(5);
      expect(
        Math.max(...matchCounts) - Math.min(...matchCounts)
      ).toBeLessThanOrEqual(1);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for invalid matches input', () => {
      expect(() => {
        DayBucketScheduler.scheduleMatches(null as any, mockConfig);
      }).toThrow(PluginExecutionError);
      expect(() => {
        DayBucketScheduler.scheduleMatches(null as any, mockConfig);
      }).toThrow('Invalid matches input: expected array');

      expect(() => {
        DayBucketScheduler.scheduleMatches('invalid' as any, mockConfig);
      }).toThrow(PluginExecutionError);
    });

    it('should throw error when no available slots provided', () => {
      const configWithoutSlots = {
        ...mockConfig,
        availableSlots: [],
      };

      expect(() => {
        DayBucketScheduler.scheduleMatches(mockMatches, configWithoutSlots);
      }).toThrow(PluginExecutionError);
      expect(() => {
        DayBucketScheduler.scheduleMatches(mockMatches, configWithoutSlots);
      }).toThrow('No available time slots provided');
    });

    it('should throw error when availableSlots is not an array', () => {
      const configWithInvalidSlots = {
        ...mockConfig,
        availableSlots: 'invalid',
      };

      expect(() => {
        DayBucketScheduler.scheduleMatches(mockMatches, configWithInvalidSlots);
      }).toThrow(PluginExecutionError);
      expect(() => {
        DayBucketScheduler.scheduleMatches(mockMatches, configWithInvalidSlots);
      }).toThrow('availableSlots must be an array');
    });

    it('should handle slots with invalid dates gracefully', () => {
      const configWithInvalidDates = {
        ...mockConfig,
        availableSlots: [
          {
            field: 'Field 1',
            start: 'invalid-date',
            end: '2024-01-15T10:00:00Z',
          },
          ...mockSlotsMultipleDays.slice(0, 2), // Include some valid slots
        ],
      };

      // Should not throw, should skip invalid slots
      expect(() => {
        DayBucketScheduler.scheduleMatches(
          [mockMatches[0]],
          configWithInvalidDates
        );
      }).not.toThrow();
    });
  });

  describe('Day Grouping Logic', () => {
    it('should group slots by day correctly', () => {
      DayBucketScheduler.scheduleMatches(mockMatches, mockConfig);

      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;
      expect(calls).toHaveLength(3); // 3 different days

      // Verify each call has slots from the correct day
      const expectedDays = ['2024-01-15', '2024-01-16', '2024-01-17'];
      calls.forEach((call, index) => {
        const [, config] = call;
        const slots = config.availableSlots;
        const dayFromSlots = slots[0].start.split('T')[0];
        expect(dayFromSlots).toBe(expectedDays[index]);
      });
    });

    it('should sort slots within each day by start time', () => {
      // Create slots in random order
      const unsortedSlots = [
        {
          field: 'Field 2',
          start: '2024-01-15T11:00:00Z',
          end: '2024-01-15T12:00:00Z',
        },
        {
          field: 'Field 1',
          start: '2024-01-15T09:00:00Z',
          end: '2024-01-15T10:00:00Z',
        },
        {
          field: 'Field 1',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T11:00:00Z',
        },
      ];

      const configWithUnsortedSlots = {
        ...mockConfig,
        availableSlots: unsortedSlots,
      };

      DayBucketScheduler.scheduleMatches(
        [mockMatches[0]],
        configWithUnsortedSlots
      );

      const call = mockGreedyScheduler.scheduleMatches.mock.calls[0];
      const [, config] = call;
      const slots = config.availableSlots;

      // Verify slots are sorted by start time
      for (let i = 1; i < slots.length; i++) {
        const prevTime = new Date(slots[i - 1].start).getTime();
        const currTime = new Date(slots[i].start).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle greedy scheduler failures gracefully', () => {
      // Mock greedy scheduler to throw an error
      mockGreedyScheduler.scheduleMatches.mockImplementation(() => {
        throw new Error('Greedy scheduler failed');
      });

      const result = DayBucketScheduler.scheduleMatches(
        mockMatches,
        mockConfig
      );

      // Should return unscheduled matches instead of throwing
      expect(result).toHaveLength(mockMatches.length);
      result.forEach((match) => {
        expect(match.scheduledTime).toBeUndefined();
        expect(match.venue).toBeUndefined();
      });
    });

    it('should handle partial scheduling failures', () => {
      // Mock greedy scheduler to succeed for first call, fail for second
      let callCount = 0;
      mockGreedyScheduler.scheduleMatches.mockImplementation((matches) => {
        callCount++;
        if (callCount === 1) {
          // First day succeeds
          return matches.map((match, index) => ({
            ...match,
            scheduledTime: `2024-01-15T${9 + index}:00:00Z`,
            venue: 'Field 1',
          }));
        } else {
          // Other days fail
          throw new Error('Scheduling failed');
        }
      });

      const result = DayBucketScheduler.scheduleMatches(
        mockMatches,
        mockConfig
      );

      // Should have some scheduled and some unscheduled matches
      const scheduledCount = result.filter(
        (m) => m.scheduledTime && m.venue
      ).length;
      const unscheduledCount = result.filter(
        (m) => !m.scheduledTime || !m.venue
      ).length;

      expect(scheduledCount).toBeGreaterThan(0);
      expect(unscheduledCount).toBeGreaterThan(0);
      expect(scheduledCount + unscheduledCount).toBe(mockMatches.length);
    });

    it('should throw PluginExecutionError for unexpected errors', () => {
      const configWithInvalidConstraints = {
        availableSlots: 'invalid', // This will cause parseConstraints to fail
      };

      expect(() => {
        DayBucketScheduler.scheduleMatches(
          mockMatches,
          configWithInvalidConstraints
        );
      }).toThrow(PluginExecutionError);
    });
  });

  describe('Integration with Greedy Scheduler', () => {
    it('should pass correct constraints to greedy scheduler', () => {
      const customConfig = {
        ...mockConfig,
        maxMatchesPerDay: 10,
        minRestMinutes: 120,
        blackoutHours: [
          {
            start: '2024-01-15T12:00:00Z',
            end: '2024-01-15T13:00:00Z',
          },
        ],
      };

      DayBucketScheduler.scheduleMatches(mockMatches, customConfig);

      const calls = mockGreedyScheduler.scheduleMatches.mock.calls;

      calls.forEach((call) => {
        const [, config] = call;
        expect(config.maxMatchesPerDay).toBe(10);
        expect(config.minRestMinutes).toBe(120);
        expect(config.blackoutHours).toEqual(customConfig.blackoutHours);
        expect(config.availableSlots).toBeDefined();
      });
    });

    it('should combine results from all days correctly', () => {
      // Mock different results for different days
      let callCount = 0;
      mockGreedyScheduler.scheduleMatches.mockImplementation((matches) => {
        callCount++;
        return matches.map((match, index) => ({
          ...match,
          scheduledTime: `2024-01-${14 + callCount}T${9 + index}:00:00Z`,
          venue: `Field ${callCount}`,
        }));
      });

      const result = DayBucketScheduler.scheduleMatches(
        mockMatches,
        mockConfig
      );

      // All matches should be scheduled
      expect(result).toHaveLength(mockMatches.length);
      result.forEach((match) => {
        expect(match.scheduledTime).toBeDefined();
        expect(match.venue).toBeDefined();
      });

      // Verify matches are from different days/venues
      const venues = new Set(result.map((m) => m.venue));
      expect(venues.size).toBeGreaterThan(1);
    });
  });

  describe('Performance', () => {
    it('should handle large number of matches efficiently', () => {
      // Create 100 matches
      const manyMatches = Array.from({ length: 100 }, (_, i) =>
        createMockMatch(`match-${i}`, mockTeamA, mockTeamB)
      );

      // Create slots for 10 days
      const manySlots = Array.from({ length: 100 }, (_, i) => {
        const day = Math.floor(i / 10) + 15; // 10 slots per day
        const hour = 9 + (i % 10);
        return {
          field: `Field ${(i % 5) + 1}`,
          start: `2024-01-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:00:00Z`,
          end: `2024-01-${day.toString().padStart(2, '0')}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`,
        };
      });

      const largeConfig = {
        ...mockConfig,
        availableSlots: manySlots,
      };

      const startTime = Date.now();
      const result = DayBucketScheduler.scheduleMatches(
        manyMatches,
        largeConfig
      );
      const endTime = Date.now();

      expect(result).toHaveLength(manyMatches.length);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});

describe('validateDayBucketDistribution Helper', () => {
  const _mockSlots = new Map([
    [
      '2024-01-15',
      [
        {
          field: 'Field 1',
          start: '2024-01-15T09:00:00Z',
          end: '2024-01-15T10:00:00Z',
        },
        {
          field: 'Field 1',
          start: '2024-01-15T11:00:00Z',
          end: '2024-01-15T12:00:00Z',
        },
      ],
    ],
    [
      '2024-01-16',
      [
        {
          field: 'Field 1',
          start: '2024-01-16T09:00:00Z',
          end: '2024-01-16T10:00:00Z',
        },
      ],
    ],
  ]);

  const _mockMatches = [{ id: 'match-1' } as Match, { id: 'match-2' } as Match];

  it('should validate successful distribution', () => {
    const result = validateDayBucketDistribution(_mockMatches, _mockSlots);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle empty matches', () => {
    const result = validateDayBucketDistribution([], _mockSlots);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect insufficient slots', () => {
    const tooManyMatches = Array.from(
      { length: 10 },
      (_, i) => ({ id: `match-${i}` }) as Match
    );
    const result = validateDayBucketDistribution(tooManyMatches, _mockSlots);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((error) => error.includes('Insufficient slots'))
    ).toBe(true);
  });

  it('should detect no available days', () => {
    const emptySlots = new Map();
    const result = validateDayBucketDistribution(_mockMatches, emptySlots);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((error) => error.includes('No available days'))
    ).toBe(true);
  });

  it('should detect insufficient total slots', () => {
    const unbalancedSlots = new Map([
      [
        '2024-01-15',
        [
          {
            field: 'Field 1',
            start: '2024-01-15T09:00:00Z',
            end: '2024-01-15T10:00:00Z',
          },
        ],
      ],
      [
        '2024-01-16',
        [
          {
            field: 'Field 1',
            start: '2024-01-16T09:00:00Z',
            end: '2024-01-16T10:00:00Z',
          },
        ],
      ],
    ]);

    const manyMatches = Array.from(
      { length: 4 },
      (_, i) => ({ id: `match-${i}` }) as Match
    );
    const result = validateDayBucketDistribution(manyMatches, unbalancedSlots);

    // Should be invalid due to insufficient total slots (2 slots for 4 matches)
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((error) => error.includes('Insufficient slots'))
    ).toBe(true);
  });
});
