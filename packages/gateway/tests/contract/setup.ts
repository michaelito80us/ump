/* eslint-env jest */
import path from 'path';
import fs from 'fs';

// Jest globals are automatically available in the test environment
// Types are defined in tsconfig.test.json

// Ensure required directories exist
beforeAll(() => {
  const logsDir = path.resolve(process.cwd(), 'logs');
  const pactsDir = path.resolve(process.cwd(), 'pacts');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  if (!fs.existsSync(pactsDir)) {
    fs.mkdirSync(pactsDir, { recursive: true });
  }
});

// Clean up after all tests
afterAll(() => {
  // Any cleanup logic if needed
});

// Set test timeout for contract tests
jest.setTimeout(30000);

// Mock console.log to reduce noise during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = (...args: any[]) => {
    // Only log if it's not a pact-related log
    if (!args.some((arg) => typeof arg === 'string' && arg.includes('pact'))) {
      originalConsoleLog(...args);
    }
  };
});

afterAll(() => {
  console.log = originalConsoleLog;
});
