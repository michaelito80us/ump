// Jest setup file
const { configureLogService } = require('@ump/engine');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./prisma/test.db';

// Configure LogService for tests
configureLogService({
  level: 'error', // Minimize log output during tests
  format: 'simple',
  outputs: [],
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);
