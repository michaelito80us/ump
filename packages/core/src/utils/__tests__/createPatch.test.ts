/**
 * Tests for createPatch utility
 * Implements T-8.2 test requirements
 */

import { createPatch, applyPatch, MatchPatch } from '../createPatch';
import { Match, Team } from '../../types';

// Mock data for testing
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

function createMockMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    teamA: mockTeamA,
    teamB: mockTeamB,
    scoreA: 0,
    scoreB: 0,
    status: 'pending',
    ...overrides,
  };
}

describe('createPatch', () => {
  describe('basic functionality', () => {
    it('should return null when no changes detected', () => {
      const match1 = createMockMatch();
      const match2 = createMockMatch();

      const patch = createPatch(match1, match2);

      expect(patch).toBeNull();
    });

    it('should detect score changes', () => {
      const match1 = createMockMatch({ scoreA: 0, scoreB: 0 });
      const match2 = createMockMatch({ scoreA: 5, scoreB: 3 });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.id).toBe('match-1');
      expect(patch!.changes).toEqual({
        scoreA: 5,
        scoreB: 3,
      });
      expect(patch!.timestamp).toBeGreaterThan(0);
    });

    it('should detect status changes', () => {
      const match1 = createMockMatch({ status: 'pending' });
      const match2 = createMockMatch({ status: 'live' });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes).toEqual({
        status: 'live',
      });
    });

    it('should detect venue changes', () => {
      const match1 = createMockMatch({ venue: 'Field 1' });
      const match2 = createMockMatch({ venue: 'Field 2' });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes).toEqual({
        venue: 'Field 2',
      });
    });

    it('should detect scheduled time changes', () => {
      const match1 = createMockMatch({ scheduledTime: '2024-01-01T10:00:00Z' });
      const match2 = createMockMatch({ scheduledTime: '2024-01-01T11:00:00Z' });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes).toEqual({
        scheduledTime: '2024-01-01T11:00:00Z',
      });
    });
  });

  describe('breakdown changes', () => {
    it('should detect breakdown changes', () => {
      const match1 = createMockMatch({
        breakdown: {
          teamA: { tries: 1, conversions: 1 },
          teamB: { tries: 0, conversions: 0 },
        },
      });
      const match2 = createMockMatch({
        breakdown: {
          teamA: { tries: 2, conversions: 1 },
          teamB: { tries: 1, conversions: 1 },
        },
      });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes.breakdown).toEqual({
        teamA: { tries: 2, conversions: 1 },
        teamB: { tries: 1, conversions: 1 },
      });
    });

    it('should handle undefined breakdown', () => {
      const match1 = createMockMatch({ breakdown: undefined });
      const match2 = createMockMatch({
        breakdown: {
          teamA: { tries: 1, conversions: 0 },
          teamB: { tries: 0, conversions: 0 },
        },
      });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes.breakdown).toEqual({
        teamA: { tries: 1, conversions: 0 },
        teamB: { tries: 0, conversions: 0 },
      });
    });

    it('should handle breakdown removal', () => {
      const match1 = createMockMatch({
        breakdown: {
          teamA: { tries: 1, conversions: 0 },
          teamB: { tries: 0, conversions: 0 },
        },
      });
      const match2 = createMockMatch({ breakdown: undefined });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes.breakdown).toBeUndefined();
    });
  });

  describe('team changes', () => {
    it('should detect team changes', () => {
      const newTeamA: Team = { ...mockTeamA, id: 'team-c', name: 'Team C' };
      const match1 = createMockMatch();
      const match2 = createMockMatch({ teamA: newTeamA });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes.teamA).toEqual(newTeamA);
    });

    it('should not detect team changes when only non-ID fields change', () => {
      const modifiedTeamA: Team = { ...mockTeamA, name: 'Modified Team A' };
      const match1 = createMockMatch();
      const match2 = createMockMatch({ teamA: modifiedTeamA });

      const patch = createPatch(match1, match2);

      expect(patch).toBeNull();
    });
  });

  describe('multiple changes', () => {
    it('should detect multiple changes in single patch', () => {
      const match1 = createMockMatch({
        scoreA: 0,
        scoreB: 0,
        status: 'pending',
        venue: 'Field 1',
      });
      const match2 = createMockMatch({
        scoreA: 10,
        scoreB: 5,
        status: 'live',
        venue: 'Field 2',
      });

      const patch = createPatch(match1, match2);

      expect(patch).not.toBeNull();
      expect(patch!.changes).toEqual({
        scoreA: 10,
        scoreB: 5,
        status: 'live',
        venue: 'Field 2',
      });
    });
  });
});

describe('applyPatch', () => {
  it('should apply patch correctly', () => {
    const originalMatch = createMockMatch({
      scoreA: 0,
      scoreB: 0,
      status: 'pending',
    });

    const patch: MatchPatch = {
      id: 'match-1',
      changes: { scoreA: 5, status: 'live' },
      timestamp: Date.now(),
    };

    const updatedMatch = applyPatch(originalMatch, patch);

    expect(updatedMatch.scoreA).toBe(5);
    expect(updatedMatch.status).toBe('live');
    expect(updatedMatch.scoreB).toBe(0); // unchanged
    expect(updatedMatch.teamA).toEqual(mockTeamA); // unchanged
  });

  it('should throw error for mismatched IDs', () => {
    const match = createMockMatch();
    const patch: MatchPatch = {
      id: 'different-id',
      changes: { scoreA: 5 },
      timestamp: Date.now(),
    };

    expect(() => applyPatch(match, patch)).toThrow(
      'Cannot apply patch to match with different ID'
    );
  });
});

describe('integration tests', () => {
  it('should handle complete match lifecycle', () => {
    let currentMatch = createMockMatch({
      scoreA: 0,
      scoreB: 0,
      status: 'pending',
    });

    // First update: match starts
    const updatedMatch1 = createMockMatch({
      scoreA: 0,
      scoreB: 0,
      status: 'live',
    });

    const patch1 = createPatch(currentMatch, updatedMatch1);
    expect(patch1).not.toBeNull();
    currentMatch = applyPatch(currentMatch, patch1!);

    // Second update: first score
    const updatedMatch2 = createMockMatch({
      scoreA: 5,
      scoreB: 0,
      status: 'live',
    });

    const patch2 = createPatch(currentMatch, updatedMatch2);
    expect(patch2).not.toBeNull();
    expect(patch2!.changes).toEqual({ scoreA: 5 });
    currentMatch = applyPatch(currentMatch, patch2!);

    // Third update: match ends (using 'final' instead of 'completed')
    const updatedMatch3 = createMockMatch({
      scoreA: 5,
      scoreB: 3,
      status: 'final',
    });

    const patch3 = createPatch(currentMatch, updatedMatch3);
    expect(patch3).not.toBeNull();
    expect(patch3!.changes).toEqual({
      scoreB: 3,
      status: 'final',
    });

    const finalMatch = applyPatch(currentMatch, patch3!);
    expect(finalMatch.scoreA).toBe(5);
    expect(finalMatch.scoreB).toBe(3);
    expect(finalMatch.status).toBe('final');
  });
});
