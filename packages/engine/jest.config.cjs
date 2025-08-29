/** @type {import('jest').Config} */
module.exports = {
  // Force exit to prevent hanging due to OpenTelemetry connections
  forceExit: true,
  // Separate configuration for integration tests
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: [
        '.*\\.integration\\.test\\.ts$',
        '<rootDir>/dist/',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/__tests__/**',
        '!src/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/../../coverage/engine',
      transform: {
        '^.+.ts$': [
          'ts-jest',
          {
            useESM: false,
            tsconfig: {
              types: ['jest', 'node'],
              module: 'CommonJS',
              target: 'ES2022',
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@ump/core$': '<rootDir>/../core/src/index.ts',
        '^@ump/core/errors$': '<rootDir>/../core/src/errors.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/dist/'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      transform: {
        '^.+.ts$': [
          'ts-jest',
          {
            useESM: false,
            tsconfig: {
              types: ['jest', 'node'],
              module: 'CommonJS',
              target: 'ES2022',
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@ump/core$': '<rootDir>/../core/src/index.ts',
        '^@ump/core/errors$': '<rootDir>/../core/src/errors.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      // Detect open handles for integration tests to help with debugging
      detectOpenHandles: false,
    },
  ],
  // Global configuration
  collectCoverage: true,
  testTimeout: 10000,
};
