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

  // Coverage collection patterns
  collectCoverageFrom: [
    './__tests__/**/*.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
