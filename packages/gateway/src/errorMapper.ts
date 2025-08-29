import { GraphQLError, GraphQLFormattedError } from 'graphql';
import {
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
} from '@ump/core/errors';
import { logger } from './utils/logger';

// Type guard to check if error has code property
function hasCodeProperty(error: any): error is { code: string } {
  return error && typeof error.code === 'string';
}

// Type guard to check if error has details property
function hasDetailsProperty(error: any): error is { details: any } {
  return error && error.details !== undefined;
}

/**
 * Error code mappings for consistent client-side error handling
 */
export const ERROR_CODES = {
  // Validation errors
  INVALID_SCORE: 'INVALID_SCORE',
  SCHEMA_MISMATCH: 'SCHEMA_MISMATCH',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',

  // Permission errors
  ROLE_DENIED: 'ROLE_DENIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Plugin execution errors
  TIMEOUT: 'TIMEOUT',
  UNSAFE_IMPORT: 'UNSAFE_IMPORT',
  UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
} as const;

/**
 * Maps application errors to GraphQL extensions with consistent error codes
 * Logs stack traces internally but excludes them from client responses
 */
export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  // Extract the original GraphQL error if available
  const graphqlError = error instanceof GraphQLError ? error : null;
  const originalError = graphqlError?.originalError;

  // Generate a unique error ID for tracking
  const errorId = generateErrorId();

  // Log the full error details internally (including stack trace)
  logger.error('GraphQL Error', {
    errorId,
    message: formattedError.message,
    code:
      originalError &&
      originalError instanceof TournamentError &&
      hasCodeProperty(originalError)
        ? originalError.code
        : 'UNKNOWN',
    path: formattedError.path,
    locations: formattedError.locations,
    stack: graphqlError?.stack,
    originalError: originalError
      ? {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack,
          details:
            originalError instanceof TournamentError &&
            hasDetailsProperty(originalError)
              ? originalError.details
              : undefined,
        }
      : undefined,
  });

  // Determine error code and user-facing message
  let code: string;
  let userMessage: string;
  let httpStatus: number;

  if (originalError && originalError instanceof ValidationError) {
    code = hasCodeProperty(originalError)
      ? originalError.code || ERROR_CODES.INVALID_INPUT
      : ERROR_CODES.INVALID_INPUT;
    userMessage = originalError.message;
    httpStatus = 400;
  } else if (originalError && originalError instanceof PermissionError) {
    code = hasCodeProperty(originalError)
      ? originalError.code || ERROR_CODES.UNAUTHORIZED
      : ERROR_CODES.UNAUTHORIZED;
    userMessage = originalError.message;
    httpStatus =
      hasCodeProperty(originalError) &&
      originalError.code === ERROR_CODES.FORBIDDEN
        ? 403
        : 401;
  } else if (originalError && originalError instanceof PluginExecutionError) {
    code = hasCodeProperty(originalError)
      ? originalError.code
      : ERROR_CODES.INTERNAL_ERROR;
    userMessage = originalError.message;
    httpStatus = 500;
  } else if (originalError && originalError instanceof TournamentError) {
    code = hasCodeProperty(originalError)
      ? originalError.code || ERROR_CODES.INTERNAL_ERROR
      : ERROR_CODES.INTERNAL_ERROR;
    userMessage = originalError.message;
    httpStatus = 500;
  } else {
    // Unknown error - don't expose internal details
    code = ERROR_CODES.INTERNAL_ERROR;
    userMessage = 'An unexpected error occurred. Please try again.';
    httpStatus = 500;
  }

  // Return formatted error with extensions but no stack trace
  return {
    message: userMessage,
    locations: formattedError.locations,
    path: formattedError.path,
    extensions: {
      code,
      errorId,
      httpStatus,
      timestamp: new Date().toISOString(),
      // Include sanitized details for known error types
      ...(originalError &&
      originalError instanceof TournamentError &&
      hasDetailsProperty(originalError)
        ? {
            details: sanitizeErrorDetails(originalError.details),
          }
        : {}),
    },
  };
}

/**
 * Sanitizes error details to remove sensitive information
 */
function sanitizeErrorDetails(details: any): any {
  if (!details || typeof details !== 'object') {
    return details;
  }

  const sanitized = { ...details };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
  ];
  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeErrorDetails(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Generates a unique error ID for tracking and correlation
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to create standardized ValidationError instances
 */
export function createValidationError(
  message: string,
  code: string = ERROR_CODES.INVALID_INPUT,
  details?: any
): ValidationError {
  return new ValidationError(message, code, details);
}

/**
 * Helper function to create standardized PermissionError instances
 */
export function createPermissionError(
  message: string,
  code: string = ERROR_CODES.UNAUTHORIZED,
  details?: any
): PermissionError {
  return new PermissionError(message, code, details);
}

/**
 * Helper function to create standardized PluginExecutionError instances
 */
export function createPluginExecutionError(
  message: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  details?: any
): PluginExecutionError {
  return new PluginExecutionError(message, code, details);
}
