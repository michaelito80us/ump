// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform

// Import types for internal use in utility functions
import type { MatchStatus, Tournament, Match } from './types';

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
