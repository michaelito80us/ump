// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform
// Export all canonical types
export * from './types';
import { MATCH_STATUSES, TOURNAMENT_STATUSES, ValidationError } from './types';
// Export GraphQL generated types and hooks (with namespace to avoid conflicts)
export * as GraphQL from './generated';
// Note: Server-side authentication utilities are exported separately in server.ts
// to avoid importing server-only code in client components
// Export client-side authentication utilities
export {
  ClerkClientUtils,
  AuthenticationError,
  AuthorizationError,
} from './auth/clerkClient';
// Note: Server-side authentication provider is exported in server.ts
// to avoid importing server-only code in client components
// Export utilities (excluding MatchPatch to avoid conflict with types.ts)
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';
export const CORE_VERSION = '0.1.0';
// Error classes and constants are exported via 'export * from './types' above
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
