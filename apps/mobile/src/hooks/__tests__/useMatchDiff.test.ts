import { renderHook, act } from '@testing-library/react';
import { useMatchDiff, useMatchUpdates } from '../useMatchDiff';
import type { Match, MatchPatch } from '@ump/core';

// Mock match data
const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  teamA: { id: 'team-a', name: 'Team A', players: [] },
  teamB: { id: 'team-b', name: 'Team B', players: [] },
  scoreA: 0,
  scoreB: 0,
  status: 'scheduled',
  scheduledTime: '2024-01-01T10:00:00Z',
  venue: 'Stadium A',
  breakdown: {
    teamA: { tries: 0, conversions: 0, penalties: 0 },
    teamB: { tries: 0, conversions: 0, penalties: 0 },
  },
  ...overrides,
});

describe('useMatchDiff', () => {
  it('should initialize with the provided match', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() => useMatchDiff(initialMatch));

    expect(result.current.match).toEqual(initialMatch);
    expect(result.current.patchHistory).toEqual([]);
    expect(result.current.hasUpdated).toBe(false);
    expect(result.current.updateCount).toBe(0);
  });

  it('should update match and create patch', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() => useMatchDiff(initialMatch));

    const updatedMatch = createMockMatch({ scoreA: 5 });

    act(() => {
      result.current.updateMatch(updatedMatch);
    });

    expect(result.current.match?.scoreA).toBe(5);
    expect(result.current.patchHistory).toHaveLength(1);
    expect(result.current.patchHistory[0].changes).toEqual({ scoreA: 5 });
    expect(result.current.hasUpdated).toBe(true);
    expect(result.current.updateCount).toBe(1);
  });

  it('should apply patch correctly', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() => useMatchDiff(initialMatch));

    const patch: MatchPatch = {
      id: 'match-1',
      changes: { scoreA: 3, scoreB: 2 },
      timestamp: Date.now(),
    };

    act(() => {
      result.current.applyMatchPatch(patch);
    });

    expect(result.current.match?.scoreA).toBe(3);
    expect(result.current.match?.scoreB).toBe(2);
    expect(result.current.patchHistory).toHaveLength(1);
    expect(result.current.hasUpdated).toBe(true);
  });

  it('should reset match to initial state', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() => useMatchDiff(initialMatch));

    // Update match
    act(() => {
      result.current.updateMatch(createMockMatch({ scoreA: 5 }));
    });

    // Reset
    act(() => {
      result.current.resetMatch();
    });

    expect(result.current.match).toBeNull();
    expect(result.current.patchHistory).toEqual([]);
    expect(result.current.hasUpdated).toBe(false);
    expect(result.current.updateCount).toBe(0);
  });

  it('should manage patch history with maxPatchHistory option', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() =>
      useMatchDiff(initialMatch, { maxPatchHistory: 2 })
    );

    // Add 3 patches
    act(() => {
      result.current.updateMatch(createMockMatch({ scoreA: 1 }));
    });
    act(() => {
      result.current.updateMatch(createMockMatch({ scoreA: 2 }));
    });
    act(() => {
      result.current.updateMatch(createMockMatch({ scoreA: 3 }));
    });

    // Should only keep last 2 patches
    expect(result.current.patchHistory).toHaveLength(2);
    expect(result.current.patchHistory[0].changes.scoreA).toBe(2);
    expect(result.current.patchHistory[1].changes.scoreA).toBe(3);
  });

  it('should call onPatchApplied callback when match updates', () => {
    const initialMatch = createMockMatch();
    const onPatchApplied = jest.fn();
    const { result } = renderHook(() =>
      useMatchDiff(initialMatch, { onPatchApplied })
    );

    const updatedMatch = createMockMatch({ scoreA: 5 });

    act(() => {
      result.current.updateMatch(updatedMatch);
    });

    expect(onPatchApplied).toHaveBeenCalledWith(
      expect.objectContaining({ changes: { scoreA: 5 } }),
      expect.objectContaining({ scoreA: 5 })
    );
  });

  it('should handle debug mode', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const initialMatch = createMockMatch();
    const { result } = renderHook(() =>
      useMatchDiff(initialMatch, { debug: true })
    );

    act(() => {
      result.current.updateMatch(createMockMatch({ scoreA: 5 }));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('useMatchUpdates', () => {
  it('should track match changes', () => {
    const initialMatch = createMockMatch();
    const { result } = renderHook(() => useMatchUpdates(initialMatch));

    expect(result.current.lastUpdateTime).toBe(0);
    expect(result.current.hasRecentUpdate).toBe(false);
  });

  it('should detect changes when match updates', () => {
    const initialMatch = createMockMatch();
    const { result, rerender } = renderHook(
      ({ match }) => useMatchUpdates(match),
      { initialProps: { match: initialMatch } }
    );

    const updatedMatch = createMockMatch({ scoreA: 5 });

    act(() => {
      rerender({ match: updatedMatch });
    });

    expect(result.current.lastUpdateTime).toBeGreaterThan(0);
    expect(result.current.hasRecentUpdate).toBe(true);
  });
});
