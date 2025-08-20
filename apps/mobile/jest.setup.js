/* eslint-env jest, node, browser */
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe
expect.extend(toHaveNoViolations);

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

// KeyboardEvent polyfill for Cypress tests
class KeyboardEventPolyfill extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.key = eventInitDict.key || '';
    this.code = eventInitDict.code || '';
    this.keyCode = eventInitDict.keyCode || 0;
    this.which = eventInitDict.which || this.keyCode;
    this.charCode = eventInitDict.charCode || 0;
    this.ctrlKey = eventInitDict.ctrlKey || false;
    this.shiftKey = eventInitDict.shiftKey || false;
    this.altKey = eventInitDict.altKey || false;
    this.metaKey = eventInitDict.metaKey || false;
    this.repeat = eventInitDict.repeat || false;
    this.location = eventInitDict.location || 0;
  }
  
  static DOM_KEY_LOCATION_STANDARD = 0;
  static DOM_KEY_LOCATION_LEFT = 1;
  static DOM_KEY_LOCATION_RIGHT = 2;
  static DOM_KEY_LOCATION_NUMPAD = 3;
}

// Always set the polyfill
global.KeyboardEvent = KeyboardEventPolyfill;

// Ensure KeyboardEvent is available on window object
if (typeof window !== 'undefined') {
  window.KeyboardEvent = KeyboardEventPolyfill;
}

// Also ensure it's available on globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.KeyboardEvent = KeyboardEventPolyfill;
}

// Define global Blob and FormData for fetch mock
global.Blob =
  global.Blob ||
  class Blob {
    constructor(parts = [], options = {}) {
      this.size = parts.reduce((total, part) => total + (part.length || 0), 0);
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

// Add jest-axe setup at the end of the file
try {
  if (expect && expect.extend) {
    expect.extend(toHaveNoViolations);
  }
} catch {
  // jest-axe not available, skip extension
}
