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
      testPathIgnorePatterns: ['.*\\.integration\\.test\\.ts$'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      collectCoverage: true,
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
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@ump/core$': '<rootDir>/../core/src/index.ts',
        '^@ump/core/errors$': '<rootDir>/../core/src/errors.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testTimeout: 10000,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      transform: {
        '^.+.ts$': [
          'ts-jest',
          {
            useESM: false,
            tsconfig: {
              types: ['jest', 'node'],
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@ump/core$': '<rootDir>/../core/src/index.ts',
        '^@ump/core/errors$': '<rootDir>/../core/src/errors.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testTimeout: 30000,
      // Force exit for integration tests to prevent hanging
      forceExit: true,
      detectOpenHandles: false,
    },
  ],
};
