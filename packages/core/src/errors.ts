/**
 * Error classes for the core package
 * This module contains only error definitions and can be safely imported in any environment
 */

export class TournamentError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'TOURNAMENT_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'TournamentError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends TournamentError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    details?: any
  ) {
    super(message, code, details);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends TournamentError {
  constructor(
    message: string,
    code: string = 'PERMISSION_ERROR',
    details?: any
  ) {
    super(message, code, details);
    this.name = 'PermissionError';
  }
}

export class PluginExecutionError extends TournamentError {
  constructor(message: string, code: string = 'PLUGIN_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'PluginExecutionError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
