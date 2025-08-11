/** @type {import('jest').Config} */
module.exports = {
  displayName: '@ump/admin',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@ump/core$': '<rootDir>/../../packages/core/src',
    '^@ump/ui$': '<rootDir>/../../packages/ui/src',
    '^@fullcalendar/daygrid$': '<rootDir>/__mocks__/@fullcalendar/daygrid.js',
    '^@fullcalendar/interaction$':
      '<rootDir>/__mocks__/@fullcalendar/interaction.js',
    '^@fullcalendar/core$': '<rootDir>/__mocks__/@fullcalendar/core.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@fullcalendar)/)'],
  testMatch: [
    '<rootDir>/components/**/__tests__/**/*.test.(ts|tsx)',
    '<rootDir>/app/**/__tests__/**/*.test.(ts|tsx)',
    '<rootDir>/**/*.(test|spec).(ts|tsx)',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'components/**/*.(ts|tsx)',
    'app/**/*.(ts|tsx)',
    '!**/*.stories.(ts|tsx)',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};
