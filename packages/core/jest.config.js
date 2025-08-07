/** @type {import('jest').Config} */
module.exports = {
  displayName: '@ump/core',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest-setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**', '!src/**/*.d.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};
