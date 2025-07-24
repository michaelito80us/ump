// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform

// Export all canonical types
export * from './types';

// Export core utilities and interfaces
export interface BaseConfig {
  version: string;
}

export const CORE_VERSION = '0.1.0';

// Re-export commonly used types for convenience
export type {
  Team,
  Player,
  Match,
  Phase,
  Tournament,
  MatchStatus,
  AuditLog,
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
} from './types';
