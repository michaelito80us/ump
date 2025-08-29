// TypeScript compilation test - verifies all types can be imported and used
import {
  MatchStatus,
  Team,
  Player,
  Match,
  MatchBreakdown,
  AuditLog,
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  CORE_VERSION,
} from '../index';

describe('TypeScript Compilation Tests', () => {
  test('MatchStatus union works correctly', () => {
    const testStatus: MatchStatus = 'pending';
    const allStatuses: MatchStatus[] = [
      'pending',
      'live',
      'final',
      'needs_approval',
    ];

    expect(testStatus).toBe('pending');
    expect(allStatuses).toHaveLength(4);
  });

  test('can create instances of all core interfaces', () => {
    const testTeam: Team = {
      id: 'team-1',
      name: 'Test Team',
      sportIds: ['rugby'],
      playerIds: ['player-1'],
      managers: ['manager-1'],
      tournaments: ['tournament-1'],
    };

    const testPlayer: Player = {
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

    const testBreakdown: MatchBreakdown = {
      teamA: { tries: 3, conversions: 2 },
      teamB: { tries: 2, conversions: 1 },
    };

    const testMatch: Match = {
      id: 'match-1',
      teamA: testTeam,
      teamB: { ...testTeam, id: 'team-2', name: 'Team 2' },
      scoreA: 17,
      scoreB: 12,
      breakdown: testBreakdown,
      status: 'final',
      scheduledTime: '2024-01-01T10:00:00Z',
      venue: 'Field A',
    };

    expect(testTeam.id).toBe('team-1');
    expect(testPlayer.id).toBe('player-1');
    expect(testMatch.status).toBe('final');
  });

  test('error classes work correctly', () => {
    const tournamentError = new TournamentError('Test error');
    const validationError = new ValidationError('Validation failed');
    const permissionError = new PermissionError('Access denied');
    const pluginError = new PluginExecutionError('Plugin failed');

    expect(tournamentError.message).toBe('Test error');
    expect(validationError.message).toBe('Validation failed');
    expect(permissionError.message).toBe('Access denied');
    expect(pluginError.message).toBe('Plugin failed');
  });

  test('constants are properly typed', () => {
    expect(Array.isArray(MATCH_STATUSES)).toBe(true);
    expect(Array.isArray(TOURNAMENT_STATUSES)).toBe(true);
    expect(typeof CORE_VERSION).toBe('string');
  });

  test('AuditLog union type works', () => {
    const testAuditLog: AuditLog = {
      id: 'log-1',
      type: 'MATCH_EVENT',
      timestamp: new Date(),
      actorId: 'user-1',
      actorType: 'user',
      matchId: 'match-1',
      change: { status: 'final' },
    };

    expect(testAuditLog.type).toBe('MATCH_EVENT');
    expect(testAuditLog.actorType).toBe('user');
  });
});

// Export a function that confirms compilation succeeded
export function confirmTypesCompile(): boolean {
  return true;
}

console.log('✅ TypeScript compilation test passed - all types are valid');
