/// <reference types="jest" />

import { testPluginConformance } from '@ump/engine';
import { SingleEliminationPlugin } from './index';
import type { SingleEliminationSettings } from './index';
import type { Team, Phase } from '@ump/core';

describe('Single Elimination Plugin Tests', () => {
  const mockTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Team 1',
      playerIds: [],
      sportIds: [],
      managers: [],
      tournaments: [],
    },
    {
      id: 'team-2',
      name: 'Team 2',
      playerIds: [],
      sportIds: [],
      managers: [],
      tournaments: [],
    },
    {
      id: 'team-3',
      name: 'Team 3',
      playerIds: [],
      sportIds: [],
      managers: [],
      tournaments: [],
    },
    {
      id: 'team-4',
      name: 'Team 4',
      playerIds: [],
      sportIds: [],
      managers: [],
      tournaments: [],
    },
  ];

  describe('Conformance Tests', () => {
    it('should pass all conformance tests', async () => {
      const results = await testPluginConformance(
        SingleEliminationPlugin,
        'phase'
      );

      expect(results.metadata.passed).toBe(true);
      expect(results.lifecycle.passed).toBe(true);
      expect(results.ui.passed).toBe(true);
      expect(results.ssr.passed).toBe(true);

      // Log any errors for debugging
      if (!results.metadata.passed) {
        console.log('Metadata errors:', results.metadata.errors);
      }
      if (!results.lifecycle.passed) {
        console.log('Lifecycle errors:', results.lifecycle.errors);
      }
      if (!results.ui.passed) {
        console.log('UI errors:', results.ui.errors);
      }
      if (!results.ssr.passed) {
        console.log('SSR errors:', results.ssr.errors);
      }
    });
  });

  describe('Schedule Generation', () => {
    it('should generate correct bracket for 4 teams', () => {
      const settings: SingleEliminationSettings = {
        byeHandling: 'top_seeds',
        allowThirdPlace: false,
      };

      const matches = SingleEliminationPlugin.generateSchedule(
        mockTeams,
        settings
      );

      // 4 teams = 2 semifinals + 1 final = 3 matches
      expect(matches).toHaveLength(3);

      // Check that we have the right number of matches
      expect(matches.filter((m) => m.id.startsWith('r1-'))).toHaveLength(2); // First round
      expect(matches.filter((m) => m.id.startsWith('r2-'))).toHaveLength(1); // Final
    });

    it('should handle odd number of teams with byes', () => {
      const threeTeams = mockTeams.slice(0, 3);
      const settings: SingleEliminationSettings = {
        byeHandling: 'top_seeds',
        allowThirdPlace: false,
      };

      const matches = SingleEliminationPlugin.generateSchedule(
        threeTeams,
        settings
      );

      // 3 teams should generate matches for a 4-team bracket with byes
      expect(matches.length).toBeGreaterThanOrEqual(2);

      // Should have first round and final
      const firstRound = matches.filter((m) => m.id.startsWith('r1-'));
      const finals = matches.filter((m) => m.id.startsWith('r2-'));
      expect(firstRound.length).toBeGreaterThanOrEqual(1);
      expect(finals).toHaveLength(1);
    });

    it('should include third place match when enabled', () => {
      const settings: SingleEliminationSettings = {
        byeHandling: 'top_seeds',
        allowThirdPlace: true,
      };

      const matches = SingleEliminationPlugin.generateSchedule(
        mockTeams,
        settings
      );

      // Should include a third place match
      const thirdPlaceMatch = matches.find((m) => m.id === 'third-place');
      expect(thirdPlaceMatch).toBeDefined();
    });
  });

  describe('Next Matches Logic', () => {
    it('should return playable matches', () => {
      const mockPhase: Phase = {
        id: 'test-phase',
        pluginId: 'single-elimination',
        phaseName: 'Test Phase',
        settings: {},
        matches: [
          {
            id: 'match-1',
            teamA: mockTeams[0],
            teamB: mockTeams[1],
            scoreA: 0,
            scoreB: 0,
            status: 'pending',
          },
          {
            id: 'match-2',
            teamA: mockTeams[2],
            teamB: mockTeams[3],
            scoreA: 10,
            scoreB: 5,
            status: 'final',
          },
          {
            id: 'match-3',
            teamA: {
              id: 'tbd-1',
              name: 'TBD',
              sportIds: [],
              playerIds: [],
              managers: [],
              tournaments: [],
            },
            teamB: {
              id: 'tbd-2',
              name: 'TBD',
              sportIds: [],
              playerIds: [],
              managers: [],
              tournaments: [],
            },
            scoreA: 0,
            scoreB: 0,
            status: 'pending',
          },
        ],
      };

      const nextMatches = SingleEliminationPlugin.getNextMatches!(mockPhase);

      // Should only return match-1 (pending with real teams)
      expect(nextMatches).toHaveLength(1);
      expect(nextMatches[0].id).toBe('match-1');
    });
  });
});
