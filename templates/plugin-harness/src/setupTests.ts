/* eslint-disable no-undef */
import '@testing-library/jest-dom';

// Type declarations
declare global {
  namespace _NodeJS {
    interface _Global {
      mockCreateRoot: {
        render: jest.Mock;
        unmount: jest.Mock;
      };
    }
  }
}

// Mock React 18 createRoot for SSR tests
const mockCreateRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => mockCreateRoot),
}));

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
(global as any).mockCreateRoot = mockCreateRoot;
