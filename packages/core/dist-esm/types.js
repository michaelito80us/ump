// 📦 Canonical Type Definitions for Tournament Plugin System
// This file contains the single source of truth for all domain entities
// ❌ Error Types
export class TournamentError extends Error {
  code;
  details;
  constructor(message, code = 'TOURNAMENT_ERROR', details) {
    super(message);
    this.name = 'TournamentError';
    this.code = code;
    this.details = details;
  }
}
export class ValidationError extends TournamentError {
  constructor(message, code = 'VALIDATION_ERROR', details) {
    super(message, code, details);
    this.name = 'ValidationError';
  }
}
export class PermissionError extends TournamentError {
  constructor(message, code = 'PERMISSION_ERROR', details) {
    super(message, code, details);
    this.name = 'PermissionError';
  }
}
export class PluginExecutionError extends TournamentError {
  constructor(message, code = 'PLUGIN_ERROR', details) {
    super(message, code, details);
    this.name = 'PluginExecutionError';
  }
}
// Frozen constants for string unions to prevent runtime modification
export const MATCH_STATUSES = ['pending', 'live', 'final', 'needs_approval'];
export const TOURNAMENT_STATUSES = ['not_started', 'live', 'completed'];
export const INVITATION_TYPES = [
  'TEAM_PLAYER',
  'TOURNAMENT_TEAM',
  'TOURNAMENT_USER',
  'ORG_USER',
];
export const INVITATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED',
];
export const JOIN_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
export const ACTOR_TYPES = ['user', 'system', 'plugin'];
export const LOG_TYPES = [
  'MATCH_EVENT',
  'SCORE_SUBMISSION',
  'CONSTRAINT_VIOLATION',
  'PLAYER_MOVEMENT',
  'MANUAL_OVERRIDE',
];
export const LEADERBOARD_ENTITIES = ['player', 'team'];
export const TARGET_ENTITIES = ['TEAM', 'TOURNAMENT'];
export const PLAYER_ACTIONS = ['JOINED', 'LEFT'];
export const AFFECTED_ENTITIES = ['MATCH', 'TEAM', 'TOURNAMENT', 'PHASE'];
export const SCORE_SOURCES = ['manual', 'plugin', 'admin_override'];
//# sourceMappingURL=types.js.map
