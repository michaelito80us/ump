// Jest global types to override Cypress conflicts
/// <reference types="jest" />

// Override Cypress Chai types with Jest types
import '@testing-library/jest-dom';
import 'jest-axe';

declare module '@jest/expect' {
  interface ExpectStatic {
    any(constructor: any): any;
    anything(): any;
    arrayContaining(array: any[]): any;
    objectContaining(object: any): any;
    stringContaining(string: string): any;
    stringMatching(regexp: string | RegExp): any;
    extend(matchers: any): void;
    not: {
      arrayContaining(array: any[]): any;
      objectContaining(object: any): any;
      stringContaining(string: string): any;
      stringMatching(regexp: string | RegExp): any;
    };
  }
}

declare global {
  namespace Chai {
    interface Assertion {
      toBeInTheDocument(): Assertion;
      toBeVisible(): Assertion;
      toBeNull(): Assertion;
      toBeDefined(): Assertion;
      toBeUndefined(): Assertion;
      toBeTruthy(): Assertion;
      toBeFalsy(): Assertion;
      toEqual(expected: any): Assertion;
      toBe(expected: any): Assertion;
      toHaveBeenCalled(): Assertion;
      toHaveBeenCalledWith(...args: any[]): Assertion;
      toHaveBeenCalledTimes(expected: number): Assertion;
      toMatchObject(expected: any): Assertion;
      toBeGreaterThan(expected: number): Assertion;
      toStrictEqual(expected: any): Assertion;
      toBeInstanceOf(expected: any): Assertion;
      toHaveProperty(property: string, value?: any): Assertion;
      toBeGreaterThanOrEqual(expected: number): Assertion;
      toBeLessThan(expected: number): Assertion;
      toBeLessThanOrEqual(expected: number): Assertion;
      toThrow(expected?: any): Assertion;
      toContain(expected: any): Assertion;
      toHaveLength(expected: number): Assertion;
      toMatchSnapshot(): Assertion;
      // jest-axe matchers
      toHaveNoViolations(): Assertion;
      // @testing-library/jest-dom matchers
      toHaveTextContent(text?: string | RegExp): Assertion;
      toHaveAttribute(attr: string, value?: string): Assertion;
    }
  }

  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeNull(): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toMatchObject(expected: any): R;
      toBeGreaterThan(expected: number): R;
      toStrictEqual(expected: any): R;
      toBeInstanceOf(expected: any): R;
      toHaveProperty(property: string, value?: any): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toThrow(expected?: any): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toMatchSnapshot(): R;
      // jest-axe matchers
      toHaveNoViolations(): R;
      // @testing-library/jest-dom matchers
      toHaveTextContent(text?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}

export {};
