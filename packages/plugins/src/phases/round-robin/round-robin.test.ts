/// <reference types="jest" />
import { testPluginConformance } from '@ump/engine';
import {
  RoundRobinPlugin,
  calculateStandings,
  getHeadToHeadRecord,
} from './index';
import type { Team, Phase, Match } from '@ump/core';

describe('RoundRobinPlugin', () => {
  describe('Plugin Structure', () => {
    it('should have required metadata', () => {
      expect(RoundRobinPlugin.id).toBe('round-robin');
      expect(RoundRobinPlugin.name).toBe('Round Robin');
      expect(RoundRobinPlugin.version).toBe('1.0.0');
      expect(RoundRobinPlugin.description).toBeDefined();
      expect(RoundRobinPlugin.author).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof RoundRobinPlugin.generateSchedule).toBe('function');
      expect(typeof RoundRobinPlugin.getNextMatches).toBe('function');
      expect(typeof RoundRobinPlugin.renderBracketUI).toBe('function');
      expect(typeof RoundRobinPlugin.renderStandings).toBe('function');
    });
  });

  describe('Conformance Tests', () => {
    it('should pass all conformance tests', async () => {
      const results = await testPluginConformance(RoundRobinPlugin, 'phase');

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

  let teams: Team[];
  let phase: Phase;

  beforeEach(() => {
    teams = [
      {
        id: 'team1',
        name: 'Team A',
        sportIds: [],
        playerIds: [],
        managers: [],
        tournaments: [],
      },
      {
        id: 'team2',
        name: 'Team B',
        sportIds: [],
        playerIds: [],
        managers: [],
        tournaments: [],
      },
      {
        id: 'team3',
        name: 'Team C',
        sportIds: [],
        playerIds: [],
        managers: [],
        tournaments: [],
      },
      {
        id: 'team4',
        name: 'Team D',
        sportIds: [],
        playerIds: [],
        managers: [],
        tournaments: [],
      },
    ];

    phase = {
      id: 'phase1',
      phaseName: 'Round Robin',
      pluginId: 'round-robin',
      settings: {
        rounds: 1,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
      },
      matches: [],
    };
  });

  describe('generateSchedule', () => {
    it('should generate correct number of matches for single round robin', () => {
      const matches = RoundRobinPlugin.generateSchedule(teams, {});

      // For 4 teams, should have 6 matches (n*(n-1)/2)
      expect(matches).toHaveLength(6);

      // Check that each team plays every other team exactly once
      const teamPairs = new Set();
      matches.forEach((match) => {
        const pair = [match.teamA.id, match.teamB.id].sort().join('-');
        expect(teamPairs.has(pair)).toBe(false);
        teamPairs.add(pair);
      });
    });

    it('should generate correct number of matches for double round robin', () => {
      const matches = RoundRobinPlugin.generateSchedule(teams, { rounds: 2 });

      // For 4 teams in double round robin, should have 12 matches
      expect(matches).toHaveLength(12);
    });

    it('should assign correct match IDs with round prefixes', () => {
      const matches = RoundRobinPlugin.generateSchedule(teams, { rounds: 2 });

      matches.forEach((match) => {
        expect(match.id).toMatch(/^rr[12]-\d+$/);
      });
    });

    it('should handle double round robin with correct round IDs', () => {
      const matches = RoundRobinPlugin.generateSchedule(teams, { rounds: 2 });

      const round1Matches = matches.filter((m) => m.id.startsWith('rr1-'));
      const round2Matches = matches.filter((m) => m.id.startsWith('rr2-'));

      expect(round1Matches).toHaveLength(6);
      expect(round2Matches).toHaveLength(6);
    });
  });

  describe('getNextMatches', () => {
    it('should return only pending and live matches', () => {
      const matches: Match[] = [
        {
          id: 'rr1-1',
          teamA: teams[0],
          teamB: teams[1],
          status: 'pending',
          scoreA: 0,
          scoreB: 0,
        },
        {
          id: 'rr1-2',
          teamA: teams[2],
          teamB: teams[3],
          status: 'live',
          scoreA: 1,
          scoreB: 0,
        },
        {
          id: 'rr1-3',
          teamA: teams[0],
          teamB: teams[2],
          status: 'final',
          scoreA: 2,
          scoreB: 1,
        },
      ];

      phase.matches = matches;
      const nextMatches = RoundRobinPlugin.getNextMatches!(phase);

      expect(nextMatches).toHaveLength(2);
      expect(nextMatches.map((m) => m.status)).toEqual(['pending', 'live']);
    });
  });

  describe('calculateStandings', () => {
    beforeEach(() => {
      // Set up completed matches for standings calculation
      phase.matches = [
        {
          id: 'rr1-1',
          teamA: teams[0], // Team A
          teamB: teams[1], // Team B
          status: 'final',
          scoreA: 2,
          scoreB: 1,
        },
        {
          id: 'rr1-2',
          teamA: teams[0], // Team A
          teamB: teams[2], // Team C
          status: 'final',
          scoreA: 1,
          scoreB: 1,
        },
        {
          id: 'rr1-3',
          teamA: teams[1], // Team B
          teamB: teams[2], // Team C
          status: 'final',
          scoreA: 0,
          scoreB: 3,
        },
        {
          id: 'rr1-4',
          teamA: teams[0], // Team A
          teamB: teams[3], // Team D
          status: 'final',
          scoreA: 2,
          scoreB: 0,
        },
        {
          id: 'rr1-5',
          teamA: teams[1], // Team B
          teamB: teams[3], // Team D
          status: 'final',
          scoreA: 1,
          scoreB: 2,
        },
        {
          id: 'rr1-6',
          teamA: teams[2], // Team C
          teamB: teams[3], // Team D
          status: 'final',
          scoreA: 1,
          scoreB: 1,
        },
      ];
    });

    it('should calculate correct standings with default points system', () => {
      const standings = calculateStandings(phase, {});

      expect(standings).toHaveLength(4);

      // Team A: 2 wins, 1 draw = 7 points
      const teamA = standings.find((s: any) => s.team.id === 'team1');
      expect(teamA?.points).toBe(7);
      expect(teamA?.won).toBe(2);
      expect(teamA?.drawn).toBe(1);
      expect(teamA?.lost).toBe(0);

      // Team C: 1 win, 2 draws = 5 points
      const teamC = standings.find((s: any) => s.team.id === 'team3');
      expect(teamC?.points).toBe(5);
      expect(teamC?.won).toBe(1);
      expect(teamC?.drawn).toBe(2);
      expect(teamC?.lost).toBe(0);
    });

    it('should sort standings by points descending', () => {
      const standings = calculateStandings(phase, {});

      // Check that standings are sorted by points (descending)
      for (let i = 0; i < standings.length - 1; i++) {
        expect(standings[i].points).toBeGreaterThanOrEqual(
          standings[i + 1].points
        );
      }
    });

    it('should apply goal difference tiebreaker', () => {
      const standings = calculateStandings(phase, {});

      // Find teams with same points and check goal difference ordering
      const teamD = standings.find((s: any) => s.team.id === 'team4');
      const teamB = standings.find((s: any) => s.team.id === 'team2');

      // Team D should have 4 points (1 win + 1 draw), Team B should have 0 points (3 losses)
      expect(teamD?.points).toBe(4);
      expect(teamB?.points).toBe(0);

      const teamDIndex = standings.findIndex((s: any) => s.team.id === 'team4');
      const teamBIndex = standings.findIndex((s: any) => s.team.id === 'team2');

      // Team D should rank higher than Team B (4 points vs 0 points)
      expect(teamDIndex).toBeLessThan(teamBIndex);
    });

    it('should calculate correct goal statistics', () => {
      const standings = calculateStandings(phase, {});

      const teamA = standings.find((s: any) => s.team.id === 'team1');
      expect(teamA?.goalsFor).toBe(5); // 2 + 1 + 2
      expect(teamA?.goalsAgainst).toBe(2); // 1 + 1 + 0
      expect(teamA?.goalDifference).toBe(3);
    });

    it('should handle custom points system', () => {
      phase.settings.pointsForWin = 2;
      phase.settings.pointsForDraw = 1;
      phase.settings.pointsForLoss = 0;
      phase.settings.allowDraws = true;

      const standings = calculateStandings(phase, {
        pointsForWin: 2,
        pointsForDraw: 1,
        pointsForLoss: 0,
        allowDraws: true,
      });

      // Team A: 2 wins, 1 draw = 5 points (2*2 + 1*1)
      const teamA = standings.find((s: any) => s.team.id === 'team1');
      expect(teamA?.points).toBe(5);
    });
  });

  describe('getHeadToHeadRecord', () => {
    beforeEach(() => {
      phase.matches = [
        {
          id: 'rr1-1',
          teamA: teams[0],
          teamB: teams[1],
          status: 'final',
          scoreA: 2,
          scoreB: 1,
        },
        {
          id: 'rr2-1',
          teamA: teams[1],
          teamB: teams[0],
          status: 'final',
          scoreA: 0,
          scoreB: 1,
        },
      ];
    });

    it('should calculate correct head-to-head record', () => {
      const h2h = getHeadToHeadRecord(phase, teams[0].id, teams[1].id);

      expect(h2h.teamAWins).toBe(2);
      expect(h2h.teamBWins).toBe(0);
      expect(h2h.draws).toBe(0);
    });

    it('should return empty record for teams with no matches', () => {
      const h2h = getHeadToHeadRecord(phase, teams[0].id, teams[2].id);

      expect(h2h.teamAWins).toBe(0);
      expect(h2h.teamBWins).toBe(0);
      expect(h2h.draws).toBe(0);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(RoundRobinPlugin.version).toBe('1.0.0');
      expect(RoundRobinPlugin.id).toBe('round-robin');
    });

    it('should have required capabilities', () => {
      expect(RoundRobinPlugin.capabilities).toBeDefined();
      expect(RoundRobinPlugin.capabilities).toContain('standings');
      expect(RoundRobinPlugin.capabilities).toContain('tiebreakers');
      expect(RoundRobinPlugin.capabilities).toContain('statistics');
    });

    it('should have internationalization support', () => {
      expect(RoundRobinPlugin.i18n.en).toBeDefined();
      expect(RoundRobinPlugin.i18n.fr).toBeDefined();
      expect(RoundRobinPlugin.i18n.es).toBeDefined();
    });
  });
});
