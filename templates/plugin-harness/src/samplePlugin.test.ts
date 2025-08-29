import React from 'react';
import {
  testPluginConformance,
  expectPluginToBeConformant,
} from '@ump/engine/harness';
import type { SportPlugin, PhasePlugin } from '@ump/engine';
import type { Team, Match } from '@ump/core';

// Sample Sport Plugin for testing
const SampleRugbyPlugin: SportPlugin = {
  id: 'sample-rugby',
  name: 'Sample Rugby Plugin',
  description: 'A sample rugby plugin for testing',
  author: 'Test Author',
  version: '1.0.0',
  supportedLanguages: ['en'],
  i18n: {
    en: {
      tries: 'Tries',
      conversions: 'Conversions',
      penalties: 'Penalties',
      dropGoals: 'Drop Goals',
    },
  },
  statSchema: ['tries', 'conversions', 'penalties', 'dropGoals'],

  calculateTotalScore(breakdown: any): number {
    const tries = breakdown.tries || 0;
    const conversions = breakdown.conversions || 0;
    const penalties = breakdown.penalties || 0;
    const dropGoals = breakdown.dropGoals || 0;

    return tries * 5 + conversions * 2 + penalties * 3 + dropGoals * 3;
  },

  validateScore(breakdown: any): string | null {
    if (breakdown.tries < 0) return 'Tries cannot be negative';
    if (breakdown.conversions < 0) return 'Conversions cannot be negative';
    if (breakdown.penalties < 0) return 'Penalties cannot be negative';
    if (breakdown.dropGoals < 0) return 'Drop goals cannot be negative';
    if (breakdown.conversions > breakdown.tries)
      return 'Cannot have more conversions than tries';

    return null;
  },

  renderScoreEntry() {
    return React.createElement('div', { 'data-testid': 'rugby-score-entry' }, [
      React.createElement('input', {
        key: 'tries',
        type: 'number',
        placeholder: 'Tries',
        'data-testid': 'tries-input',
      }),
      React.createElement('input', {
        key: 'conversions',
        type: 'number',
        placeholder: 'Conversions',
        'data-testid': 'conversions-input',
      }),
    ]);
  },

  renderScore(match: any) {
    return React.createElement(
      'div',
      { 'data-testid': 'rugby-score-display' },
      `${match.teamA?.name || 'Team A'}: ${match.scoreA || 0} - ${match.teamB?.name || 'Team B'}: ${match.scoreB || 0}`
    );
  },
};

// Sample Phase Plugin for testing
const SampleRoundRobinPlugin: PhasePlugin = {
  id: 'sample-round-robin',
  name: 'Sample Round Robin',
  description: 'A sample round robin phase plugin',
  author: 'Test Author',
  version: '1.0.0',
  supportedLanguages: ['en'],
  i18n: {
    en: {
      roundRobin: 'Round Robin',
      standings: 'Standings',
    },
  },

  generateSchedule(teams: Team[], _settings: any) {
    const matches: Match[] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: `match-${i}-${j}`,
          teamA: teams[i],
          teamB: teams[j],
          scoreA: 0,
          scoreB: 0,
          status: 'pending',
        });
      }
    }
    return matches;
  },

  getNextMatches(_phase: any) {
    return (
      _phase.matches?.filter((match: any) => match.status === 'scheduled') || []
    );
  },

  renderBracketUI(_phase: any) {
    return React.createElement(
      'div',
      { 'data-testid': 'round-robin-bracket' },
      `Round Robin: ${_phase.matches?.length || 0} matches`
    );
  },

  renderStandings(_phase: any) {
    return React.createElement(
      'div',
      { 'data-testid': 'round-robin-standings' },
      'Standings will be displayed here'
    );
  },
};

describe('Plugin Conformance Tests', () => {
  describe('Sample Rugby Plugin', () => {
    it('should pass all conformance tests', async () => {
      const results = await testPluginConformance(SampleRugbyPlugin, 'sport');

      expect(results.metadata.passed).toBe(true);
      expect(results.lifecycle.passed).toBe(true);
      expect(results.ui.passed).toBe(true);
      expect(results.ssr.passed).toBe(true);

      // Check that no critical errors occurred
      expect(results.metadata.errors).toHaveLength(0);
      expect(results.lifecycle.errors).toHaveLength(0);
      expect(results.ui.errors).toHaveLength(0);
      expect(results.ssr.errors).toHaveLength(0);
    });

    it('should validate scores correctly', () => {
      // Valid score
      expect(
        SampleRugbyPlugin.validateScore({ tries: 2, conversions: 1 })
      ).toBeNull();

      // Invalid scores
      expect(SampleRugbyPlugin.validateScore({ tries: -1 })).toBe(
        'Tries cannot be negative'
      );
      expect(
        SampleRugbyPlugin.validateScore({ tries: 1, conversions: 2 })
      ).toBe('Cannot have more conversions than tries');
    });

    it('should calculate total score correctly', () => {
      const score = SampleRugbyPlugin.calculateTotalScore({
        tries: 2,
        conversions: 1,
        penalties: 1,
        dropGoals: 0,
      });

      // 2 tries (10) + 1 conversion (2) + 1 penalty (3) = 15
      expect(score).toBe(15);
    });
  });

  describe('Sample Round Robin Plugin', () => {
    it('should pass all conformance tests', async () => {
      const results = await testPluginConformance(
        SampleRoundRobinPlugin,
        'phase'
      );

      expect(results.metadata.passed).toBe(true);
      expect(results.lifecycle.passed).toBe(true);
      expect(results.ui.passed).toBe(true);
      expect(results.ssr.passed).toBe(true);
    });

    it('should generate correct number of matches', () => {
      const teams = [
        {
          id: 'team-1',
          name: 'Team 1',
          playerIds: [],
          sportIds: [], // Add this
          managers: [], // Add this
          tournaments: [], // Add this
        },
        {
          id: 'team-2',
          name: 'Team 2',
          playerIds: [],
          sportIds: [], // Add this
          managers: [], // Add this
          tournaments: [], // Add this
        },
        {
          id: 'team-3',
          name: 'Team 3',
          playerIds: [],
          sportIds: [], // Add this
          managers: [], // Add this
          tournaments: [], // Add this
        },
      ];

      const matches = SampleRoundRobinPlugin.generateSchedule(teams, {});

      // 3 teams should generate 3 matches (each team plays each other once)
      expect(matches).toHaveLength(3);
      expect(matches[0].teamA).toBe(teams[0]);
      expect(matches[0].teamB).toBe(teams[1]);
    });
  });

  describe('Plugin with Missing validateScore', () => {
    it('should fail conformance test', async () => {
      const invalidPlugin = {
        ...SampleRugbyPlugin,
        validateScore: undefined,
      };

      const results = await testPluginConformance(invalidPlugin, 'sport');

      expect(results.lifecycle.passed).toBe(false);
      expect(results.lifecycle.errors).toContain(
        'SportPlugin must implement validateScore method'
      );
    });
  });

  describe('Plugin with Invalid i18n', () => {
    it('should fail metadata conformance test', async () => {
      const invalidPlugin = {
        ...SampleRugbyPlugin,
        i18n: {},
      };

      const results = await testPluginConformance(invalidPlugin, 'sport');

      expect(results.metadata.passed).toBe(false);
      expect(results.metadata.errors).toContain(
        'Plugin i18n must contain at least one language'
      );
    });
  });
});

// Example of how to use the expectPluginToBeConformant matcher
describe('Custom Matcher Examples', () => {
  it('should use custom matcher for conformance testing', async () => {
    // This would be used in actual plugin tests
    // expect(MyCustomPlugin).toPassConformance('sport');

    // For now, just test that the matcher works
    const matcher = expectPluginToBeConformant(SampleRugbyPlugin, 'sport');
    const result = await matcher.toPassConformance();

    expect(result.pass).toBe(true);
  });
});
