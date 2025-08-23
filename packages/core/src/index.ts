// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform

// Export all canonical types
export * from './types';

// Import types and constants for internal use in utility functions
import type { MatchStatus, Tournament, Match } from './types';
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
  type UserContext,
} from './auth/clerkClient';

// Export server-side authentication provider
export { ClerkAuthProvider } from './auth/clerkProvider';

// Export utilities (excluding MatchPatch to avoid conflict with types.ts)
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';

// Export core utilities and interfaces
export interface BaseConfig {
  version: string;
}

export const CORE_VERSION = '0.1.0';

// Re-export commonly used types for convenience (using original types, not GraphQL)
export type {
  Team,
  Player,
  Match,
  Phase,
  Tournament,
  MatchStatus,
  AuditLog,
  TournamentConfig,
  MatchContext,
  TournamentContext,
  LeaderboardEntry,
  Invitation,
  JoinRequest,
  PlayerOverride,
  SchedulingConstraints,
  Slot,
} from './types';

// Error classes and constants are exported via 'export * from './types' above

// Package metadata
export const PACKAGE_NAME = '@ump/core';
export const PACKAGE_VERSION = '0.1.0';

// Utility type guards
export function isValidMatchStatus(status: string): status is MatchStatus {
  return MATCH_STATUSES.includes(status as any);
}

export function isValidTournamentStatus(
  status: string
): status is Tournament['status'] {
  return TOURNAMENT_STATUSES.includes(status as any);
}

// Type assertion helpers
export function assertMatch(obj: unknown): asserts obj is Match {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Invalid match object');
  }
  const match = obj as any;
  if (
    !match.id ||
    !match.teamA ||
    !match.teamB ||
    !isValidMatchStatus(match.status)
  ) {
    throw new ValidationError('Invalid match structure');
  }
}

export function assertTournament(obj: unknown): asserts obj is Tournament {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Invalid tournament object');
  }
  const tournament = obj as any;
  if (
    !tournament.id ||
    !tournament.name ||
    !isValidTournamentStatus(tournament.status)
  ) {
    throw new ValidationError('Invalid tournament structure');
  }
}
