module.exports = {
  preset: 'ts-jest/presets/default-esm',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock the problematic ESM modules
    '^next-intl$': '<rootDir>/__mocks__/next-intl.js',
    '^next-intl/(.*)$': '<rootDir>/__mocks__/next-intl.js',
    '^@clerk/backend$': '<rootDir>/__mocks__/@clerk/backend.js',
    '^@clerk/nextjs$': '<rootDir>/__mocks__/@clerk/nextjs.js',
    '^@clerk/nextjs/server$': '<rootDir>/__mocks__/@clerk/nextjs-server.js',
    '^use-intl$': '<rootDir>/__mocks__/use-intl.js',
    '^@ump/engine$': '<rootDir>/__mocks__/@ump/engine.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  transformIgnorePatterns: ['node_modules/(?!(next-intl|@clerk|use-intl)/)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
    '^.+\\.(js|jsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'ecmascript',
            jsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
};
