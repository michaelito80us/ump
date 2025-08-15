module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/contract'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage/contract',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/contract/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  // Module name mapping for workspace packages
  moduleNameMapper: {
    '^@ump/core$': '<rootDir>/../core/src/index.ts',
  },
  // Ensure pact files are generated in the correct location
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
