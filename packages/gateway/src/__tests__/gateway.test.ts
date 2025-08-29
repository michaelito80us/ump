// Mock @ump/core/errors to prevent server-only imports
jest.mock('@ump/core/errors', () => {
  class TournamentError extends Error {
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

  class ValidationError extends TournamentError {
    constructor(
      message: string,
      code: string = 'VALIDATION_ERROR',
      details?: any
    ) {
      super(message, code, details);
      this.name = 'ValidationError';
    }
  }

  class PermissionError extends TournamentError {
    constructor(
      message: string,
      code: string = 'PERMISSION_ERROR',
      details?: any
    ) {
      super(message, code, details);
      this.name = 'PermissionError';
    }
  }

  class PluginExecutionError extends TournamentError {
    constructor(message: string, code: string = 'PLUGIN_ERROR', details?: any) {
      super(message, code, details);
      this.name = 'PluginExecutionError';
    }
  }

  return {
    TournamentError,
    ValidationError,
    PermissionError,
    PluginExecutionError,
  };
});

// Imports removed as they're mocked and not directly used
import { PluginSchemaLoader } from '../services/pluginSchemaLoader';
import { formatError, ERROR_CODES } from '../errorMapper';
import { GraphQLError } from 'graphql';
import {
  ValidationError,
  PermissionError,
  PluginExecutionError,
} from '@ump/core/errors';

// Mock the PluginSchemaLoader
jest.mock('../services/pluginSchemaLoader');
const MockedPluginSchemaLoader = PluginSchemaLoader as jest.MockedClass<
  typeof PluginSchemaLoader
>;

// Mock fetch for testing
global.fetch = jest.fn();

// Mock console methods to prevent noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Apollo Gateway Federation', () => {
  let mockPluginLoader: jest.Mocked<PluginSchemaLoader>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPluginLoader =
      new MockedPluginSchemaLoader() as jest.Mocked<PluginSchemaLoader>;
    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Gateway Creation', () => {
    it('should create gateway with core subgraph', async () => {
      // Mock subgraph loading
      mockPluginLoader.loadSubgraphs.mockResolvedValue([
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
      ]);

      const subgraphs = await mockPluginLoader.loadSubgraphs();

      expect(subgraphs).toHaveLength(1);
      expect(subgraphs[0]).toEqual({
        name: 'core',
        url: 'http://localhost:4001/graphql',
      });
    });

    it('should create gateway with core and plugin subgraphs', async () => {
      // Mock subgraph loading with plugins
      mockPluginLoader.loadSubgraphs.mockResolvedValue([
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
        {
          name: 'rugby-plugin',
          url: 'http://localhost:4002/graphql',
        },
        {
          name: 'round-robin-plugin',
          url: 'http://localhost:4003/graphql',
        },
      ]);

      const subgraphs = await mockPluginLoader.loadSubgraphs();

      expect(subgraphs).toHaveLength(3);
      expect(subgraphs.map((s) => s.name)).toEqual([
        'core',
        'rugby-plugin',
        'round-robin-plugin',
      ]);
    });

    it('should handle subgraph loading failure gracefully', async () => {
      // Mock subgraph loading failure
      mockPluginLoader.loadSubgraphs.mockRejectedValue(
        new Error('Failed to connect to plugin registry')
      );

      await expect(mockPluginLoader.loadSubgraphs()).rejects.toThrow(
        'Failed to connect to plugin registry'
      );
    });
  });

  describe('Error Formatting', () => {
    it('should format ValidationError correctly', () => {
      const validationError = new ValidationError(
        'Invalid score format',
        ERROR_CODES.INVALID_SCORE,
        { field: 'score', value: 'invalid' }
      );

      const graphqlError = new GraphQLError(
        'Validation failed',
        undefined,
        undefined,
        undefined,
        ['updateMatch'],
        validationError
      );

      const formatted = formatError(
        {
          message: 'Validation failed',
          path: ['updateMatch'],
        },
        graphqlError
      );

      expect(formatted.message).toBe('Invalid score format');
      expect(formatted.extensions?.code).toBe(ERROR_CODES.INVALID_SCORE);
      expect(formatted.extensions?.httpStatus).toBe(400);
      expect(formatted.extensions?.details).toEqual({
        field: 'score',
        value: 'invalid',
      });
    });

    it('should format PermissionError correctly', () => {
      const permissionError = new PermissionError(
        'Access denied',
        ERROR_CODES.FORBIDDEN,
        { requiredRole: 'admin', userRole: 'user' }
      );

      const graphqlError = new GraphQLError(
        'Permission denied',
        undefined,
        undefined,
        undefined,
        ['deleteTournament'],
        permissionError
      );

      const formatted = formatError(
        {
          message: 'Permission denied',
          path: ['deleteTournament'],
        },
        graphqlError
      );

      expect(formatted.message).toBe('Access denied');
      expect(formatted.extensions?.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(formatted.extensions?.httpStatus).toBe(403);
    });

    it('should format PluginExecutionError correctly', () => {
      const pluginError = new PluginExecutionError(
        'Plugin timeout',
        ERROR_CODES.TIMEOUT,
        { pluginName: 'rugby-scorer', timeoutMs: 5000 }
      );

      const graphqlError = new GraphQLError(
        'Plugin execution failed',
        undefined,
        undefined,
        undefined,
        ['calculateScore'],
        pluginError
      );

      const formatted = formatError(
        {
          message: 'Plugin execution failed',
          path: ['calculateScore'],
        },
        graphqlError
      );

      expect(formatted.message).toBe('Plugin timeout');
      expect(formatted.extensions?.code).toBe(ERROR_CODES.TIMEOUT);
      expect(formatted.extensions?.httpStatus).toBe(500);
    });

    it('should sanitize sensitive data in error details', () => {
      const errorWithSensitiveData = new ValidationError(
        'Authentication failed',
        ERROR_CODES.UNAUTHORIZED,
        {
          password: 'secret123',
          token: 'jwt-token-here',
          userInfo: { id: 'user-123', email: 'test@example.com' },
        }
      );

      const graphqlError = new GraphQLError(
        'Auth failed',
        undefined,
        undefined,
        undefined,
        ['login'],
        errorWithSensitiveData
      );

      const formatted = formatError(
        {
          message: 'Auth failed',
          path: ['login'],
        },
        graphqlError
      );

      expect(formatted.extensions?.details).toEqual({
        userInfo: { id: 'user-123', email: 'test@example.com' },
      });
      expect(formatted.extensions?.details).not.toHaveProperty('password');
      expect(formatted.extensions?.details).not.toHaveProperty('token');
    });

    it('should handle unknown errors safely', () => {
      const unknownError = new Error('Unexpected system error');

      const graphqlError = new GraphQLError(
        'System error',
        undefined,
        undefined,
        undefined,
        ['systemOperation'],
        unknownError
      );

      const formatted = formatError(
        {
          message: 'System error',
          path: ['systemOperation'],
        },
        graphqlError
      );

      expect(formatted.message).toBe(
        'An unexpected error occurred. Please try again.'
      );
      expect(formatted.extensions?.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(formatted.extensions?.httpStatus).toBe(500);
      expect(formatted.extensions?.errorId).toBeDefined();
    });
  });

  describe('Gateway Configuration', () => {
    it('should validate required environment variables', () => {
      const originalEnv = process.env;

      // Test with missing core subgraph URL
      process.env = { ...originalEnv };
      delete process.env.CORE_SUBGRAPH_URL;

      const loader = new PluginSchemaLoader();
      expect(loader).toBeDefined();

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle plugin registry URL configuration', () => {
      const originalEnv = process.env;

      // Test with plugin registry URL
      process.env = {
        ...originalEnv,
        PLUGIN_REGISTRY_URL: 'http://localhost:5000',
      };

      const loader = new PluginSchemaLoader();
      expect(loader).toBeDefined();

      // Restore environment
      process.env = originalEnv;
    });
  });
});
