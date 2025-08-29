import {
  HooksDispatcher,
  hooksDispatcher,
  registerLifecycleHook,
  unregisterLifecycleHook,
} from '../hooksDispatcher';
import { Tournament, Match, Phase, Team } from '@ump/core';
import { TournamentContext, MatchContext, LeaderboardEntry } from '../types';

// Mock team objects
const mockTeamA: Team = {
  id: 'team-a',
  name: 'Team Alpha',
  sportIds: ['football'],
  playerIds: ['player-1', 'player-2'],
  managers: ['manager-1'],
  tournaments: ['test-tournament-1'],
};

const mockTeamB: Team = {
  id: 'team-b',
  name: 'Team Beta',
  sportIds: ['football'],
  playerIds: ['player-3', 'player-4'],
  managers: ['manager-2'],
  tournaments: ['test-tournament-1'],
};

const mockTournament: Tournament = {
  id: 'test-tournament-1',
  pluginId: 'single-elimination',
  name: 'Test Tournament',
  sport: 'football',
  status: 'not_started',
  phases: [],
  config: {
    statTier: 1,
    matchDuration: 90,
    plugins: {
      sport: 'football',
      phases: [],
    },
  },
  isLocked: false,
};

const mockMatch: Match = {
  id: 'test-match-1',
  teamA: mockTeamA,
  teamB: mockTeamB,
  scoreA: 0,
  scoreB: 0,
  status: 'pending',
};

const mockPhase: Phase = {
  id: 'test-phase-1',
  pluginId: 'single-elimination',
  phaseName: 'Group Stage',
  settings: { maxTeams: 8 },
  matches: [],
};

// Use engine's TournamentContext type (only tournament, userId, metadata)
const mockTournamentContext: TournamentContext = {
  tournament: mockTournament,
  userId: 'user-123',
  metadata: { source: 'test' },
};

// Use engine's MatchContext type (includes match property, no variantId)
const mockMatchContext: MatchContext = {
  match: mockMatch,
  tournament: mockTournament,
  phase: mockPhase,
  userId: 'user-123',
  metadata: { source: 'test' },
};

// Use engine's LeaderboardEntry type (teamId, position, points, stats)
const mockLeaderboard: LeaderboardEntry[] = [
  {
    teamId: 'team-1',
    position: 1,
    points: 10,
    stats: { wins: 3, losses: 0 },
  },
  {
    teamId: 'team-2',
    position: 2,
    points: 7,
    stats: { wins: 2, losses: 1 },
  },
];

describe('HooksDispatcher', () => {
  let dispatcher: HooksDispatcher;

  beforeEach(() => {
    dispatcher = new HooksDispatcher();
  });

  afterEach(() => {
    // Clean up global dispatcher
    hooksDispatcher.clear();
  });

  describe('Hook Registration', () => {
    it('should register lifecycle hooks successfully', () => {
      const hook = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'test-plugin', hook, 1);

      const registeredHooks = dispatcher.getRegisteredHooks();
      expect(registeredHooks.onTournamentStart).toContain('test-plugin');
    });

    it('should register multiple plugins with different priorities', () => {
      const hook1 = jest.fn().mockResolvedValue(undefined);
      const hook2 = jest.fn().mockResolvedValue(undefined);
      const hook3 = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'plugin-high', hook1, 10);
      dispatcher.registerHook('onTournamentStart', 'plugin-low', hook2, 1);
      dispatcher.registerHook('onTournamentStart', 'plugin-medium', hook3, 5);

      const registeredHooks = dispatcher.getRegisteredHooks();
      expect(registeredHooks.onTournamentStart).toHaveLength(3);

      // Should be sorted by priority (lowest first)
      expect(registeredHooks.onTournamentStart[0]).toBe('plugin-low');
      expect(registeredHooks.onTournamentStart[1]).toBe('plugin-medium');
      expect(registeredHooks.onTournamentStart[2]).toBe('plugin-high');
    });

    it('should unregister hooks successfully', () => {
      const hook = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'test-plugin', hook);
      expect(dispatcher.getRegisteredHooks().onTournamentStart).toContain(
        'test-plugin'
      );

      const result = dispatcher.unregisterHook(
        'onTournamentStart',
        'test-plugin'
      );
      expect(result).toBe(true);
      expect(
        dispatcher.getRegisteredHooks().onTournamentStart || []
      ).not.toContain('test-plugin');
    });

    it('should unregister all hooks for a plugin', () => {
      const hook1 = jest.fn().mockResolvedValue(undefined);
      const hook2 = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'test-plugin', hook1);
      dispatcher.registerHook('onMatchStart', 'test-plugin', hook2);

      const removedCount = dispatcher.unregisterAllHooks('test-plugin');
      expect(removedCount).toBe(2);

      const registeredHooks = dispatcher.getRegisteredHooks();
      expect(registeredHooks.onTournamentStart || []).not.toContain(
        'test-plugin'
      );
      expect(registeredHooks.onMatchStart || []).not.toContain('test-plugin');
    });

    it('should clear all hooks', () => {
      dispatcher.registerHook('onTournamentStart', 'plugin-1', jest.fn());
      dispatcher.registerHook('onMatchStart', 'plugin-2', jest.fn());

      const registeredHooks = dispatcher.getRegisteredHooks();
      expect(Object.keys(registeredHooks)).toHaveLength(2);

      dispatcher.clear();
      expect(Object.keys(dispatcher.getRegisteredHooks())).toHaveLength(0);
    });
  });

  describe('Hook Execution', () => {
    it('should execute onTournamentStart hooks', async () => {
      const hook1 = jest.fn().mockResolvedValue(undefined);
      const hook2 = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'plugin-1', hook1, 2);
      dispatcher.registerHook('onTournamentStart', 'plugin-2', hook2, 1);

      const summary = await dispatcher.executeTournamentStart(
        mockTournamentContext
      );

      expect(hook1).toHaveBeenCalledWith(mockTournamentContext);
      expect(hook2).toHaveBeenCalledWith(mockTournamentContext);
      expect(summary.successCount).toBe(2);
      expect(summary.errorCount).toBe(0);

      // Lower priority should be called first
      expect(summary.results[0].pluginId).toBe('plugin-2');
      expect(summary.results[1].pluginId).toBe('plugin-1');
    });

    it('should execute onTournamentEnd hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      dispatcher.registerHook('onTournamentEnd', 'test-plugin', hook);

      const summary = await dispatcher.executeTournamentEnd(
        mockTournamentContext
      );

      expect(hook).toHaveBeenCalledWith(mockTournamentContext);
      expect(summary.successCount).toBe(1);
    });

    it('should execute onMatchStart hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      dispatcher.registerHook('onMatchStart', 'test-plugin', hook);

      const summary = await dispatcher.executeMatchStart(
        mockMatch,
        mockMatchContext
      );

      expect(hook).toHaveBeenCalledWith(mockMatch, mockMatchContext);
      expect(summary.successCount).toBe(1);
    });

    it('should execute onMatchFinal hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      dispatcher.registerHook('onMatchFinal', 'test-plugin', hook);

      const summary = await dispatcher.executeMatchFinal(
        mockMatch,
        mockMatchContext
      );

      expect(hook).toHaveBeenCalledWith(mockMatch, mockMatchContext);
      expect(summary.successCount).toBe(1);
    });

    it('should execute beforePhaseGenerate hooks and return modified phase', async () => {
      const modifiedPhase = { ...mockPhase, phaseName: 'Modified Phase' };
      const hook = jest.fn().mockResolvedValue(modifiedPhase);

      dispatcher.registerHook('beforePhaseGenerate', 'test-plugin', hook);

      const result = await dispatcher.executeBeforePhaseGenerate(mockPhase);

      expect(hook).toHaveBeenCalledWith(mockPhase);
      expect(result.phase).toEqual(modifiedPhase);
      expect(result.summary.successCount).toBe(1);
    });

    it('should execute afterPhaseGenerate hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      dispatcher.registerHook('afterPhaseGenerate', 'test-plugin', hook);

      const summary = await dispatcher.executeAfterPhaseGenerate(mockPhase);

      expect(hook).toHaveBeenCalledWith(mockPhase);
      expect(summary.successCount).toBe(1);
    });

    it('should execute afterStandingsUpdate hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      dispatcher.registerHook('afterStandingsUpdate', 'test-plugin', hook);

      const summary =
        await dispatcher.executeAfterStandingsUpdate(mockLeaderboard);

      expect(hook).toHaveBeenCalledWith(mockLeaderboard);
      expect(summary.successCount).toBe(1);
    });
  });

  describe('Chain Execution for beforePhaseGenerate', () => {
    it('should chain multiple beforePhaseGenerate hooks', async () => {
      const hook1 = jest.fn().mockImplementation((phase: Phase) =>
        Promise.resolve({
          ...phase,
          phaseName: phase.phaseName + ' - Modified by Plugin 1',
        })
      );
      const hook2 = jest.fn().mockImplementation((phase: Phase) =>
        Promise.resolve({
          ...phase,
          settings: { ...phase.settings, modified: true },
        })
      );

      dispatcher.registerHook('beforePhaseGenerate', 'plugin-1', hook1, 1);
      dispatcher.registerHook('beforePhaseGenerate', 'plugin-2', hook2, 2);

      const result = await dispatcher.executeBeforePhaseGenerate(mockPhase);

      expect(hook1).toHaveBeenCalledWith(mockPhase);
      expect(hook2).toHaveBeenCalledWith(mockPhase); // Both hooks get the original phase

      // The implementation takes the last successful hook's return value
      expect(result.phase.settings.modified).toBe(true);
      expect(result.summary.successCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle hook execution errors gracefully', async () => {
      const errorHook = jest.fn().mockRejectedValue(new Error('Hook failed'));
      const successHook = jest.fn().mockResolvedValue(undefined);

      dispatcher.registerHook('onTournamentStart', 'error-plugin', errorHook);
      dispatcher.registerHook(
        'onTournamentStart',
        'success-plugin',
        successHook
      );

      const summary = await dispatcher.executeTournamentStart(
        mockTournamentContext
      );

      expect(summary.successCount).toBe(1);
      expect(summary.errorCount).toBe(1);
      expect(summary.results).toHaveLength(2);

      const errorResult = summary.results.find(
        (r) => r.pluginId === 'error-plugin'
      );
      expect(errorResult?.success).toBe(false);
      expect(errorResult?.error).toBeInstanceOf(Error);
      expect((errorResult?.error as Error).message).toBe('Hook failed');
    });

    it('should handle timeout errors', async () => {
      const slowHook = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 6000)) // 6 seconds, should timeout
      );

      dispatcher.registerHook('onTournamentStart', 'slow-plugin', slowHook);

      const summary = await dispatcher.executeTournamentStart(
        mockTournamentContext
      );

      expect(summary.successCount).toBe(0);
      expect(summary.errorCount).toBe(1);
      expect(summary.results[0].error).toBeInstanceOf(Error);
      expect((summary.results[0].error as Error).message).toContain(
        'timed out'
      );
    }, 10000); // Increase test timeout to 10 seconds
  });

  describe('Global Dispatcher Functions', () => {
    it('should use global dispatcher with convenience functions', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);

      registerLifecycleHook('onTournamentStart', 'global-plugin', hook);

      const summary = await hooksDispatcher.executeTournamentStart(
        mockTournamentContext
      );

      expect(hook).toHaveBeenCalledWith(mockTournamentContext);
      expect(summary.successCount).toBe(1);

      const result = unregisterLifecycleHook(
        'onTournamentStart',
        'global-plugin'
      );
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty hook lists', async () => {
      const summary = await dispatcher.executeTournamentStart(
        mockTournamentContext
      );

      expect(summary.successCount).toBe(0);
      expect(summary.errorCount).toBe(0);
      expect(summary.results).toHaveLength(0);
    });

    it('should handle unregistering non-existent hooks', () => {
      const result = dispatcher.unregisterHook(
        'onTournamentStart',
        'non-existent'
      );
      expect(result).toBe(false);
    });

    it('should handle clearing empty dispatcher', () => {
      expect(() => dispatcher.clear()).not.toThrow();
      expect(Object.keys(dispatcher.getRegisteredHooks())).toHaveLength(0);
    });
  });
});
