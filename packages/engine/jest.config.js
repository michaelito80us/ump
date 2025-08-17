/** @type {import('jest').Config} */
module.exports = {
  displayName: '@ump/engine',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**', '!src/**/*.d.ts'],
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
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};
