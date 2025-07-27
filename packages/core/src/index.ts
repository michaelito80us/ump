// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform

// Export all canonical types
export * from './types';

// Export GraphQL generated types and hooks (with namespace to avoid conflicts)
export * as GraphQL from './generated';

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
} from './types';

// Export error classes as values (not types)
export {
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
} from './types';
