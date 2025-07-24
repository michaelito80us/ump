// TypeScript compilation test - verifies all types can be imported and used
import {
  MatchStatus,
  Team,
  Player,
  Match,
  Tournament,
  Phase,
  MatchBreakdown,
  TournamentConfig,
  AuditLog,
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  CORE_VERSION,
} from '../index';

// Test that MatchStatus union works correctly
const _testStatus: MatchStatus = 'pending';
const _allStatuses: MatchStatus[] = [
  'pending',
  'live',
  'final',
  'needs_approval',
];

// Test that we can create instances of all core interfaces
const _testTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  sportIds: ['rugby'],
  playerIds: ['player-1'],
  managers: ['manager-1'],
  tournaments: ['tournament-1'],
};

const _testPlayer: Player = {
  id: 'player-1',
  userId: 'user-1',
  sports: ['rugby'],
  teamIds: ['team-1'],
  stats: {
    'tournament-1': {
      playerId: 'player-1',
      sport: 'rugby',
      tournamentId: 'tournament-1',
      stats: { tries: 5, conversions: 3 },
    },
  },
};

const _testBreakdown: MatchBreakdown = {
  teamA: { tries: 3, conversions: 2 },
  teamB: { tries: 2, conversions: 1 },
};

const _testMatch: Match = {
  id: 'match-1',
  teamA: _testTeam,
  teamB: { ..._testTeam, id: 'team-2', name: 'Team 2' },
  scoreA: 17,
  scoreB: 12,
  breakdown: _testBreakdown,
  status: 'final',
  scheduledTime: '2024-01-01T10:00:00Z',
  venue: 'Field A',
};

const _testPhase: Phase = {
  id: 'phase-1',
  pluginId: 'single-elimination',
  phaseName: 'Finals',
  settings: { maxTeams: 8 },
  matches: [_testMatch],
};

const _testConfig: TournamentConfig = {
  statTier: 2,
  matchDuration: 80,
  plugins: {
    sport: 'rugby',
    phases: [
      {
        pluginId: 'single-elimination',
        phaseName: 'Finals',
        settings: { maxTeams: 8 },
      },
    ],
  },
};

const _testTournament: Tournament = {
  id: 'tournament-1',
  pluginId: 'rugby-tournament',
  name: 'Test Tournament',
  sport: 'rugby',
  status: 'live',
  phases: [_testPhase],
  config: _testConfig,
  isLocked: false,
};

// Test error classes
const _tournamentError = new TournamentError('Test error');
const _validationError = new ValidationError('Validation failed');
const _permissionError = new PermissionError('Access denied');
const _pluginError = new PluginExecutionError('Plugin failed');

// Test that constants are properly typed
const _matchStatuses: readonly string[] = MATCH_STATUSES;
const _tournamentStatuses: readonly string[] = TOURNAMENT_STATUSES;
const _version: string = CORE_VERSION;

// Test that AuditLog union type works
const _testAuditLog: AuditLog = {
  id: 'log-1',
  type: 'MATCH_EVENT',
  timestamp: new Date(),
  actorId: 'user-1',
  actorType: 'user',
  matchId: 'match-1',
  change: { status: 'final' },
};

// Export a function that confirms compilation succeeded
export function confirmTypesCompile(): boolean {
  return true;
}

console.log('✅ TypeScript compilation test passed - all types are valid');
