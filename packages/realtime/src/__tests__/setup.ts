import { MockRedis } from './mocks/redis-mock';

// Ensure Jest types are available
/// <reference types="jest" />

// Mock ioredis with our custom mock
jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: MockRedis,
  };
});

// Global test setup
beforeAll(() => {
  // Suppress console logs during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

beforeEach(() => {
  // Clear mock Redis instances before each test
  MockRedis.clearInstances();
});

afterEach(() => {
  // Clean up after each test
  MockRedis.clearInstances();
});

// Increase timeout for load tests
jest.setTimeout(15000);
