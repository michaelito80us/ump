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
beforeAll(async () => {
  // Temporarily enable debug logs to troubleshoot Redis issues
  // if (!process.env.DEBUG_TESTS) {
  //   console.log = jest.fn();
  //   console.error = jest.fn();
  //   console.warn = jest.fn();
  // }
});

beforeEach(async () => {
  // Reset mock Redis instances before each test but keep existing connections
  MockRedis.resetInstances();
  // Small delay to ensure cleanup is complete
  await new Promise((resolve) => setTimeout(resolve, 10));
});

afterEach(async () => {
  // Reset instances instead of clearing to maintain connections
  MockRedis.resetInstances();
  // Small delay to ensure cleanup is complete
  await new Promise((resolve) => setTimeout(resolve, 10));
});

afterAll(async () => {
  // Only clear instances after all tests are done
  MockRedis.clearInstances();
});

// Increase timeout for load tests
jest.setTimeout(15000);
