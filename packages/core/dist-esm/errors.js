/**
 * Error classes for the core package
 * This module contains only error definitions and can be safely imported in any environment
 */
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
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
//# sourceMappingURL=errors.js.map
