// Jest global types to override Cypress conflicts
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Override Cypress Chai types with Jest types
declare global {
  namespace Chai {
    interface Assertion {
      toBeInTheDocument(): Assertion;
      toBeVisible(): Assertion;
      toBeNull(): Assertion;
      toEqual(expected: any): Assertion;
      toBe(expected: any): Assertion;
      toHaveBeenCalled(): Assertion;
      toHaveBeenCalledWith(...args: any[]): Assertion;
      toHaveBeenCalledTimes(expected: number): Assertion;
      toThrow(expected?: any): Assertion;
      toContain(expected: any): Assertion;
      toHaveLength(expected: number): Assertion;
      toMatchSnapshot(): Assertion;
    }
  }

  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeNull(): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toThrow(expected?: any): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toMatchSnapshot(): R;
    }
  }
}

export {};
