/**
 * Lightweight diff and patch utility for Match objects
 * Implements T-8.2 requirement for efficient UI updates
 *
 * This is a custom implementation optimized for flat Match objects
 * instead of using heavy libraries like jsondiffpatch
 */

import { Match } from '../types';

export interface MatchPatch {
  id: string;
  changes: Partial<Match>;
  timestamp: number;
}

/**
 * Creates a patch object representing the differences between two Match objects
 * Only includes fields that have actually changed
 *
 * @param oldMatch - Previous state of the match
 * @param newMatch - New state of the match
 * @returns MatchPatch object with only the changed fields
 */
export function createPatch(
  oldMatch: Match,
  newMatch: Match
): MatchPatch | null {
  if (oldMatch.id !== newMatch.id) {
    throw new Error('Cannot create patch for matches with different IDs');
  }

  const changes: Partial<Match> = {};
  let hasChanges = false;

  // Compare primitive fields
  if (oldMatch.scoreA !== newMatch.scoreA) {
    changes.scoreA = newMatch.scoreA;
    hasChanges = true;
  }

  if (oldMatch.scoreB !== newMatch.scoreB) {
    changes.scoreB = newMatch.scoreB;
    hasChanges = true;
  }

  if (oldMatch.status !== newMatch.status) {
    changes.status = newMatch.status;
    hasChanges = true;
  }

  if (oldMatch.scheduledTime !== newMatch.scheduledTime) {
    changes.scheduledTime = newMatch.scheduledTime;
    hasChanges = true;
  }

  if (oldMatch.venue !== newMatch.venue) {
    changes.venue = newMatch.venue;
    hasChanges = true;
  }

  // Compare breakdown object (shallow comparison for performance)
  if (hasBreakdownChanged(oldMatch.breakdown, newMatch.breakdown)) {
    changes.breakdown = newMatch.breakdown;
    hasChanges = true;
  }

  // Compare team objects (only check if team references changed)
  if (oldMatch.teamA.id !== newMatch.teamA.id) {
    changes.teamA = newMatch.teamA;
    hasChanges = true;
  }

  if (oldMatch.teamB.id !== newMatch.teamB.id) {
    changes.teamB = newMatch.teamB;
    hasChanges = true;
  }

  // Return null if no changes detected
  if (!hasChanges) {
    return null;
  }

  return {
    id: newMatch.id,
    changes,
    timestamp: Date.now(),
  };
}

/**
 * Applies a patch to a Match object, returning a new Match with updated fields
 *
 * @param match - Original match object
 * @param patch - Patch to apply
 * @returns New match object with patch applied
 */
export function applyPatch(match: Match, patch: MatchPatch): Match {
  if (match.id !== patch.id) {
    throw new Error('Cannot apply patch to match with different ID');
  }

  return {
    ...match,
    ...patch.changes,
  };
}

/**
 * Helper function to compare breakdown objects
 * Uses shallow comparison for performance on flat objects
 */
export function hasBreakdownChanged(
  oldBreakdown?: Match['breakdown'],
  newBreakdown?: Match['breakdown']
): boolean {
  // Both undefined/null
  if (!oldBreakdown && !newBreakdown) {
    return false;
  }

  // One is undefined/null, other is not
  if (!oldBreakdown || !newBreakdown) {
    return true;
  }

  // Compare teamA breakdown
  if (hasTeamBreakdownChanged(oldBreakdown.teamA, newBreakdown.teamA)) {
    return true;
  }

  // Compare teamB breakdown
  if (hasTeamBreakdownChanged(oldBreakdown.teamB, newBreakdown.teamB)) {
    return true;
  }

  return false;
}

/**
 * Helper function to compare team breakdown objects
 */
export function hasTeamBreakdownChanged(
  oldTeam: Record<string, number>,
  newTeam: Record<string, number>
): boolean {
  const oldKeys = Object.keys(oldTeam);
  const newKeys = Object.keys(newTeam);

  // Different number of keys
  if (oldKeys.length !== newKeys.length) {
    return true;
  }

  // Check if any values changed
  for (const key of oldKeys) {
    if (oldTeam[key] !== newTeam[key]) {
      return true;
    }
  }

  return false;
}

/**
 * Utility function to merge multiple patches in chronological order
 * Useful for applying a series of updates efficiently
 *
 * @param patches - Array of patches in chronological order
 * @returns Single merged patch
 */
export function mergePatches(patches: MatchPatch[]): MatchPatch | null {
  if (patches.length === 0) {
    return null;
  }

  if (patches.length === 1) {
    return patches[0];
  }

  // Ensure all patches are for the same match
  const matchId = patches[0].id;
  if (!patches.every((patch) => patch.id === matchId)) {
    throw new Error('Cannot merge patches for different matches');
  }

  // Merge changes, with later patches overriding earlier ones
  const mergedChanges: Partial<Match> = {};
  for (const patch of patches) {
    Object.assign(mergedChanges, patch.changes);
  }

  return {
    id: matchId,
    changes: mergedChanges,
    timestamp: patches[patches.length - 1].timestamp,
  };
}
