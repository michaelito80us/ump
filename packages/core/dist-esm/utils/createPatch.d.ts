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
export declare function createPatch(
  oldMatch: Match,
  newMatch: Match
): MatchPatch | null;
/**
 * Applies a patch to a Match object, returning a new Match with updated fields
 *
 * @param match - Original match object
 * @param patch - Patch to apply
 * @returns New match object with patch applied
 */
export declare function applyPatch(match: Match, patch: MatchPatch): Match;
/**
 * Utility function to merge multiple patches in chronological order
 * Useful for applying a series of updates efficiently
 *
 * @param patches - Array of patches in chronological order
 * @returns Single merged patch
 */
export declare function mergePatches(patches: MatchPatch[]): MatchPatch | null;
//# sourceMappingURL=createPatch.d.ts.map
