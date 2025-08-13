// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  ValidationError,
  TournamentError,
  PermissionError,
  PluginExecutionError,
} from './types';
// Export all canonical types
export * from './types';
// Export GraphQL generated types and hooks (with namespace to avoid conflicts)
export * as GraphQL from './generated';
// Export authentication utilities
export {
  ClerkAuthProvider,
  ClerkClientUtils,
  AuthenticationError,
  AuthorizationError,
} from './auth/clerkProvider';
// Export utilities (excluding MatchPatch to avoid conflict with types.ts)
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';
export const CORE_VERSION = '0.1.0';
// Export error classes as values (not types) - already imported above
export {
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
};
// Export frozen constants - already imported above
export {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  INVITATION_TYPES,
  INVITATION_STATUSES,
  JOIN_REQUEST_STATUSES,
  ACTOR_TYPES,
  LOG_TYPES,
  LEADERBOARD_ENTITIES,
  TARGET_ENTITIES,
  PLAYER_ACTIONS,
  AFFECTED_ENTITIES,
  SCORE_SOURCES,
} from './types';
// Package metadata
export const PACKAGE_NAME = '@ump/core';
export const PACKAGE_VERSION = '0.1.0';
// Utility type guards
export function isValidMatchStatus(status) {
  return MATCH_STATUSES.includes(status);
}
export function isValidTournamentStatus(status) {
  return TOURNAMENT_STATUSES.includes(status);
}
// Type assertion helpers
export function assertMatch(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Invalid match object');
  }
  const match = obj;
  if (
    !match.id ||
    !match.teamA ||
    !match.teamB ||
    !isValidMatchStatus(match.status)
  ) {
    throw new ValidationError('Invalid match structure');
  }
}
export function assertTournament(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Invalid tournament object');
  }
  const tournament = obj;
  if (
    !tournament.id ||
    !tournament.name ||
    !isValidTournamentStatus(tournament.status)
  ) {
    throw new ValidationError('Invalid tournament structure');
  }
}
//# sourceMappingURL=index.js.map
