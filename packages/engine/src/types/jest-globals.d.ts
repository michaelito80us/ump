/// <reference types="jest" />

declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const expect: jest.Expect;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;

  namespace jest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toThrow(expected?: string | RegExp | jest.Constructable | Error): R;
    }
  }
}

export {};
