import {
  createValidationError,
  createPermissionError,
  createPluginExecutionError,
  ERROR_CODES,
} from './errorMapper';

// Test resolvers that can be added to a subgraph for testing
export const testErrorResolvers = {
  Query: {
    // Test validation errors
    testValidationError: () => {
      throw createValidationError(
        'Invalid tournament format provided',
        ERROR_CODES.INVALID_INPUT,
        {
          field: 'format',
          value: 'invalid_format',
          allowedValues: ['single_elimination', 'round_robin'],
        }
      );
    },

    // Test permission errors
    testPermissionError: () => {
      throw createPermissionError(
        'You do not have permission to access this tournament',
        ERROR_CODES.FORBIDDEN,
        { requiredRole: 'admin', userRole: 'user', tournamentId: 'test-123' }
      );
    },

    // Test plugin execution errors
    testPluginError: () => {
      throw createPluginExecutionError(
        'Plugin execution timed out',
        ERROR_CODES.TIMEOUT,
        { pluginName: 'bracket-generator', timeoutMs: 5000 }
      );
    },

    // Test unknown errors
    testUnknownError: () => {
      throw new Error('This is an unexpected system error');
    },

    // Test errors with sensitive data (to test sanitization)
    testSensitiveDataError: () => {
      throw createValidationError(
        'Authentication failed',
        ERROR_CODES.UNAUTHORIZED,
        {
          password: 'secret123',
          token: 'jwt-token-here',
          userInfo: { id: 'user-123', email: 'test@example.com' },
        }
      );
    },
  },
};
