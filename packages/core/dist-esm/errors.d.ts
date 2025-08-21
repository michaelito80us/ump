/**
 * Error classes for the core package
 * This module contains only error definitions and can be safely imported in any environment
 */
export declare class TournamentError extends Error {
  readonly code: string;
  readonly details?: any;
  constructor(message: string, code?: string, details?: any);
}
export declare class ValidationError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare class PermissionError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare class PluginExecutionError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare class AuthenticationError extends Error {
  constructor(message: string);
}
export declare class AuthorizationError extends Error {
  constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map
