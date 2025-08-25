/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Extend Jest's ExpectStatic interface to include missing matchers
declare global {
  namespace jest {
    interface ExpectStatic {
      any: jest.AsymmetricMatcher;
      anything(): jest.AsymmetricMatcher;
      arrayContaining(sample: any[]): jest.AsymmetricMatcher;
      objectContaining(sample: Record<string, any>): jest.AsymmetricMatcher;
      stringContaining(expected: string): jest.AsymmetricMatcher;
      stringMatching(expected: string | RegExp): jest.AsymmetricMatcher;
    }

    interface Matchers<R> {
      toBe(expected: any): R;
      toBeNull(): R;
      toBeDefined(): R;
      toBeInstanceOf(expected: any): R;
      toEqual(expected: any): R;
      toStrictEqual(expected: any): R;
      toHaveLength(expected: number): R;
      toBeGreaterThan(expected: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toBeInTheDocument(): R;
      toHaveTextContent(expected: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveNoViolations(): R;
    }
  }
}

// Ensure this file is treated as a module
export {};
