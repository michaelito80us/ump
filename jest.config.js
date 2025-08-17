/** @type {import('jest').Config} */
module.exports = {
  // Root configuration for workspace-wide Jest settings
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/engine',
    {
      displayName: 'root',
      testMatch: ['<rootDir>/__tests__/**/*.test.js'],
      testEnvironment: 'node',
    },
  ],

  // Global coverage settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds - CI will fail if any package falls below 85%
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for core package
    './packages/core/src/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for engine package
    './packages/engine/src/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Global test settings
  testTimeout: 10000,
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],

  // Coverage collection patterns
  collectCoverageFrom: [
    'packages/core/src/**/*.ts',
    'packages/engine/src/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/node_modules/**',
  ],
};
