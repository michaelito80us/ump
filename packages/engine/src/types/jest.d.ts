/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toContain(expected: string): R;
    }
  }
}

export {};
