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
      toBeDefined(): Assertion;
      toEqual(expected: any): Assertion;
      toBe(expected: any): Assertion;
      toHaveBeenCalled(): Assertion;
      toHaveBeenCalledWith(...args: any[]): Assertion;
      toHaveBeenCalledTimes(expected: number): Assertion;
      toThrow(expected?: any): Assertion;
      toContain(expected: any): Assertion;
      toHaveLength(expected: number): Assertion;
      toMatchSnapshot(): Assertion;
      toMatchObject(expected: any): Assertion;
      toBeGreaterThan(expected: number): Assertion;
      greaterThan(expected: number): Assertion;
    }
  }

  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeNull(): R;
      toBeDefined(): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toMatchObject(expected: any): R;
      toBeGreaterThan(expected: number): R;
      greaterThan(expected: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toThrow(expected?: any): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toMatchSnapshot(): R;
    }
  }

  interface ExpectStatic {
    any(constructor: any): any;
    anything(): any;
    arrayContaining(array: any[]): any;
    objectContaining(object: any): any;
    stringContaining(string: string): any;
    stringMatching(regexp: string | RegExp): any;
    not: {
      arrayContaining(array: any[]): any;
      objectContaining(object: any): any;
      stringContaining(string: string): any;
      stringMatching(regexp: string | RegExp): any;
    };
  }

  const expect: ExpectStatic & ((actual: any) => jest.Matchers<any>);
}

export {};
