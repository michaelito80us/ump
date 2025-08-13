'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Match, createPatch, applyPatch, MatchPatch } from '../../lib/types';

export interface UseMatchDiffOptions {
  /**
   * Maximum number of patches to keep in history
   * @default 10
   */
  maxPatchHistory?: number;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Callback fired when a patch is applied
   */
  onPatchApplied?: (patch: MatchPatch, newMatch: Match) => void;
}

export interface UseMatchDiffReturn {
  /**
   * Current match state
   */
  match: Match | null;

  /**
   * Whether the match data has been updated since last render
   */
  hasUpdated: boolean;

  /**
   * Array of recent patches applied (for debugging)
   */
  patchHistory: MatchPatch[];

  /**
   * Update the match with a new version, automatically diffing
   */
  updateMatch: (newMatch: Match) => void;

  /**
   * Apply a patch directly (useful for WebSocket updates)
   */
  applyMatchPatch: (patch: MatchPatch) => void;

  /**
   * Reset the match state
   */
  resetMatch: () => void;

  /**
   * Get the number of updates since initialization
   */
  updateCount: number;
}

/**
 * Hook for efficient Match object updates using diff/patch strategy
 *
 * This hook minimizes re-renders by only updating when actual changes occur
 * and provides patch history for debugging real-time updates
 *
 * @param initialMatch - Initial match state
 * @param options - Configuration options
 * @returns Object with match state and update functions
 */
export function useMatchDiff(
  initialMatch: Match | null = null,
  options: UseMatchDiffOptions = {}
): UseMatchDiffReturn {
  const { maxPatchHistory = 10, debug = false, onPatchApplied } = options;

  // State
  const [match, setMatch] = useState<Match | null>(initialMatch);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [patchHistory, setPatchHistory] = useState<MatchPatch[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  // Refs to avoid stale closures
  const currentMatchRef = useRef<Match | null>(initialMatch);
  const debugRef = useRef(debug);

  // Update refs when values change
  useEffect(() => {
    currentMatchRef.current = match;
  }, [match]);

  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  // Reset hasUpdated flag after each render cycle
  useEffect(() => {
    if (hasUpdated) {
      const timer = setTimeout(() => setHasUpdated(false), 0);
      return () => clearTimeout(timer);
    }
  }, [hasUpdated]);

  /**
   * Add a patch to history, maintaining max size
   */
  const addPatchToHistory = useCallback(
    (patch: MatchPatch) => {
      setPatchHistory((prev) => {
        const newHistory = [...prev, patch];
        if (newHistory.length > maxPatchHistory) {
          return newHistory.slice(-maxPatchHistory);
        }
        return newHistory;
      });
    },
    [maxPatchHistory]
  );

  /**
   * Log debug information if debug mode is enabled
   */
  const debugLog = useCallback((message: string, data?: any) => {
    if (debugRef.current) {
      console.log(`[useMatchDiff] ${message}`, data);
    }
  }, []);

  /**
   * Update match with automatic diffing
   */
  const updateMatch = useCallback(
    (newMatch: Match) => {
      const currentMatch = currentMatchRef.current;

      if (!currentMatch) {
        // First time setting match
        setMatch(newMatch);
        setHasUpdated(true);
        setUpdateCount((prev) => prev + 1);
        debugLog('Initial match set', { matchId: newMatch.id });
        return;
      }

      if (currentMatch.id !== newMatch.id) {
        // Different match entirely
        setMatch(newMatch);
        setHasUpdated(true);
        setUpdateCount((prev) => prev + 1);
        setPatchHistory([]); // Clear history for new match
        debugLog('Match changed', {
          oldId: currentMatch.id,
          newId: newMatch.id,
        });
        return;
      }

      // Create patch for same match
      const patch = createPatch(currentMatch, newMatch);

      if (!patch) {
        // No changes detected
        debugLog('No changes detected', { matchId: newMatch.id });
        return;
      }

      // Apply patch and update state
      const updatedMatch = applyPatch(currentMatch, patch);
      setMatch(updatedMatch);
      setHasUpdated(true);
      setUpdateCount((prev) => prev + 1);
      addPatchToHistory(patch);

      debugLog('Patch applied', {
        matchId: patch.id,
        changes: patch.changes,
        timestamp: patch.timestamp,
      });

      // Fire callback if provided
      if (onPatchApplied) {
        onPatchApplied(patch, updatedMatch);
      }
    },
    [addPatchToHistory, debugLog, onPatchApplied]
  );

  /**
   * Apply a patch directly (useful for WebSocket updates)
   */
  const applyMatchPatch = useCallback(
    (patch: MatchPatch) => {
      const currentMatch = currentMatchRef.current;

      if (!currentMatch) {
        debugLog('Cannot apply patch: no current match', { patch });
        return;
      }

      if (currentMatch.id !== patch.id) {
        debugLog('Cannot apply patch: ID mismatch', {
          currentId: currentMatch.id,
          patchId: patch.id,
        });
        return;
      }

      try {
        const updatedMatch = applyPatch(currentMatch, patch);
        setMatch(updatedMatch);
        setHasUpdated(true);
        setUpdateCount((prev) => prev + 1);
        addPatchToHistory(patch);

        debugLog('Direct patch applied', {
          matchId: patch.id,
          changes: patch.changes,
          timestamp: patch.timestamp,
        });

        // Fire callback if provided
        if (onPatchApplied) {
          onPatchApplied(patch, updatedMatch);
        }
      } catch (error) {
        debugLog('Error applying patch', { patch, error });
      }
    },
    [addPatchToHistory, debugLog, onPatchApplied]
  );

  /**
   * Reset match state
   */
  const resetMatch = useCallback(() => {
    setMatch(null);
    setHasUpdated(false);
    setPatchHistory([]);
    setUpdateCount(0);
    debugLog('Match state reset');
  }, [debugLog]);

  return {
    match,
    hasUpdated,
    patchHistory,
    updateMatch,
    applyMatchPatch,
    resetMatch,
    updateCount,
  };
}

/**
 * Utility hook for tracking match updates with minimal re-renders
 *
 * This is a simpler version that only tracks if the match has changed
 * without maintaining patch history
 */
export function useMatchUpdates(match: Match | null) {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const previousMatchRef = useRef<Match | null>(match);

  useEffect(() => {
    if (!match || !previousMatchRef.current) {
      previousMatchRef.current = match;
      return;
    }

    if (match.id !== previousMatchRef.current.id) {
      // Different match
      setLastUpdateTime(Date.now());
      previousMatchRef.current = match;
      return;
    }

    // Check if match has actually changed
    const patch = createPatch(previousMatchRef.current, match);
    if (patch) {
      setLastUpdateTime(Date.now());
      previousMatchRef.current = match;
    }
  }, [match]);

  return {
    lastUpdateTime,
    hasRecentUpdate: Date.now() - lastUpdateTime < 1000, // Within last second
  };
}
