/* eslint-env jest, node, browser */
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Global test setup

// Global DOM types for Jest environment - must be defined before fetch mock
// Define global DOM event types for WebSocket and other tests
global.CloseEvent =
  global.CloseEvent ||
  class CloseEvent extends Event {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.code = eventInitDict.code || 0;
      this.reason = eventInitDict.reason || '';
      this.wasClean = eventInitDict.wasClean || false;
    }
  };

global.MessageEvent =
  global.MessageEvent ||
  class MessageEvent extends Event {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.data = eventInitDict.data;
      this.origin = eventInitDict.origin || '';
      this.lastEventId = eventInitDict.lastEventId || '';
      this.source = eventInitDict.source || null;
      this.ports = eventInitDict.ports || [];
    }
  };

global.EventListener = global.EventListener || function () {};

// Define global Blob and FormData for fetch mock
global.Blob =
  global.Blob ||
  class Blob {
    constructor(_parts = [], options = {}) {
      this.size = 0;
      this.type = options.type || '';
    }
  };

global.FormData =
  global.FormData ||
  class FormData {
    constructor() {
      this._data = new Map();
    }
    append(name, value) {
      this._data.set(name, value);
    }
    get(name) {
      return this._data.get(name);
    }
  };

// Mock fetch for Apollo Client HTTP link
const mockFetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new global.Blob()),
    formData: () => Promise.resolve(new global.FormData()),
  })
);

global.fetch = mockFetch;

// Ensure fetch is available during module loading
if (typeof globalThis !== 'undefined') {
  globalThis.fetch = mockFetch;
}
if (typeof window !== 'undefined') {
  window.fetch = mockFetch;
}
