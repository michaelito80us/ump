/** @type {import('jest').Config} */
module.exports = {
  displayName: '@ump/core',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/dist-esm/'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest-setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**', '!src/**/*.d.ts'],
  coverageDirectory: '<rootDir>/../../coverage/core',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};
