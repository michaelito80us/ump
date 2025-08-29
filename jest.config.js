/** @type {import('jest').Config} */
module.exports = {
  // Root configuration for workspace-wide Jest settings
  projects: [
    {
      displayName: 'root',
      testMatch: ['<rootDir>/__tests__/**/*.test.js'],
      testEnvironment: 'node',
      transform: {
        '^.+\.js$': [
          'babel-jest',
          {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
          },
        ],
      },
    },
  ],

  // Global settings
  testPathIgnorePatterns: [
    '<rootDir>/**/dist/',
    '<rootDir>/**/dist-esm/',
    '<rootDir>/node_modules/',
  ],

  // Global coverage settings
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Global test settings
  verbose: true,

  // Module name mapping to resolve workspace packages to source files
  moduleNameMapper: {
    '^@ump/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@ump/core$': '<rootDir>/packages/core/src/index.ts',
    '^@ump/engine/(.*)$': '<rootDir>/packages/engine/src/$1',
    '^@ump/engine$': '<rootDir>/packages/engine/src/index.ts',
    '^@ump/plugins/(.*)$': '<rootDir>/packages/plugins/src/$1',
    '^@ump/plugins$': '<rootDir>/packages/plugins/src/index.ts',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],

  // Coverage collection patterns - only collect from root tests
  // Package-specific coverage is handled by individual package configs
  collectCoverageFrom: [
    './__tests__/**/*.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__mocks__/**',
  ],
};
