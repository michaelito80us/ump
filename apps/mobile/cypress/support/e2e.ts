// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Define KeyboardEvent polyfill globally first
class GlobalKeyboardEventPolyfill extends Event implements KeyboardEvent {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  charCode: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  location: number;
  isComposing: boolean;
  detail: number;
  view: Window | null;

  // DOM_KEY_LOCATION constants as instance properties
  readonly DOM_KEY_LOCATION_STANDARD = 0 as const;
  readonly DOM_KEY_LOCATION_LEFT = 1 as const;
  readonly DOM_KEY_LOCATION_RIGHT = 2 as const;
  readonly DOM_KEY_LOCATION_NUMPAD = 3 as const;

  constructor(type: string, eventInitDict?: KeyboardEventInit) {
    super(type, eventInitDict);
    this.key = eventInitDict?.key || '';
    this.code = eventInitDict?.code || '';
    this.keyCode = eventInitDict?.keyCode || 0;
    this.which = this.keyCode;
    this.charCode = eventInitDict?.charCode || 0;
    this.ctrlKey = eventInitDict?.ctrlKey || false;
    this.shiftKey = eventInitDict?.shiftKey || false;
    this.altKey = eventInitDict?.altKey || false;
    this.metaKey = eventInitDict?.metaKey || false;
    this.repeat = eventInitDict?.repeat || false;
    this.location = eventInitDict?.location || 0;
    this.isComposing = eventInitDict?.isComposing || false;
    this.detail = eventInitDict?.detail || 0;
    this.view = eventInitDict?.view || null;
  }

  getModifierState(key: string): boolean {
    switch (key) {
      case 'Control': return this.ctrlKey;
      case 'Shift': return this.shiftKey;
      case 'Alt': return this.altKey;
      case 'Meta': return this.metaKey;
      default: return false;
    }
  }

  initKeyboardEvent(
    type: string,
    bubbles?: boolean,
    cancelable?: boolean,
    view?: Window | null,
    key?: string,
    location?: number,
    ctrlKey?: boolean,
    altKey?: boolean,
    shiftKey?: boolean,
    metaKey?: boolean
  ): void {
    // Legacy method - just set properties
    this.key = key || '';
    this.location = location || 0;
    this.ctrlKey = ctrlKey || false;
    this.altKey = altKey || false;
    this.shiftKey = shiftKey || false;
    this.metaKey = metaKey || false;
  }

  initUIEvent(
    type: string,
    bubbles?: boolean,
    cancelable?: boolean,
    view?: Window | null,
    detail?: number
  ): void {
    this.detail = detail || 0;
    this.view = view || null;
  }
}

// Set the polyfill globally on all possible contexts immediately
if (typeof window !== 'undefined') {
  (window as Window & { KeyboardEvent?: typeof KeyboardEvent }).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
}
if (typeof global !== 'undefined') {
  (global as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
}

// Also set on Cypress global if available
if (typeof Cypress !== 'undefined') {
  (Cypress as unknown as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  
  // Set on Cypress.env for global access
  try {
    Cypress.env('KeyboardEvent', GlobalKeyboardEventPolyfill);
  } catch {
    // Ignore if Cypress.env is not available
  }
}

// Add KeyboardEvent polyfill for Cypress - ensure it's always available
Cypress.on('window:before:load', (win) => {
  // Always set the polyfill, even if KeyboardEvent exists
  win.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  
  // Also ensure it's available on the global object and globalThis
  interface WindowWithGlobal extends Window {
    global?: Record<string, unknown>;
    globalThis?: Record<string, unknown>;
  }
  const winWithGlobal = win as WindowWithGlobal;
  winWithGlobal.global = winWithGlobal.global || {};
  winWithGlobal.global.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  
  // Ensure it's on globalThis as well
  if (winWithGlobal.globalThis) {
    winWithGlobal.globalThis.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  
  // Set on the window's parent if it exists (for iframe contexts)
  try {
    if (win.parent && win.parent !== win) {
      (win.parent as Window & { KeyboardEvent?: typeof KeyboardEvent }).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
    }
  } catch {
    // Ignore cross-origin errors
  }
  
  // Override the window's KeyboardEvent constructor to ensure it's always available
  Object.defineProperty(win, 'KeyboardEvent', {
    value: GlobalKeyboardEventPolyfill,
    writable: true,
    configurable: true,
    enumerable: true
  });
});

// Hook into Cypress's internal event system to ensure polyfill is available before keyboard events
Cypress.on('test:before:run', () => {
  // Ensure the polyfill is available in all contexts before any test runs
  if (typeof window !== 'undefined') {
    window.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  if (typeof global !== 'undefined') {
    (global as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
});

// Add a beforeEach hook to ensure KeyboardEvent is always available
beforeEach(() => {
  cy.window().then((win) => {
    // Ensure KeyboardEvent is available on the window
    win.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
    
    // Also ensure it's available on the document
    if (win.document) {
      (win.document as unknown as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill;
    }
    
    // Set it on all possible global contexts within the window
    if ((win as unknown as Record<string, unknown>).global) {
      ((win as unknown as Record<string, unknown>).global as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill;
    }
    if ((win as unknown as Record<string, unknown>).globalThis) {
      ((win as unknown as Record<string, unknown>).globalThis as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill;
    }
  });
});

// Also ensure it's available immediately on all global contexts
if (typeof window !== 'undefined') {
  // Always set the polyfill on all possible global contexts
  window.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  
  // Also set on global and globalThis if they exist
  if (typeof global !== 'undefined') {
    (global as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  
  // Set on window.global if it exists
  if ((window as Window & { global?: Record<string, unknown> }).global) {
    (window as Window & { global: Record<string, unknown> }).global.KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
  }
  
  // Try to set on parent window for iframe contexts
  try {
    if (window.parent && window.parent !== window) {
      (window.parent as Window & { KeyboardEvent?: typeof KeyboardEvent }).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
    }
  } catch {
    // Ignore cross-origin errors
  }
  
  // Set on window.top for nested iframe contexts
  try {
    if (window.top && window.top !== window) {
      (window.top as Window & { KeyboardEvent?: typeof KeyboardEvent }).KeyboardEvent = GlobalKeyboardEventPolyfill as unknown as typeof KeyboardEvent;
    }
  } catch {
    // Ignore cross-origin errors
  }
}

// Alternatively you can use CommonJS syntax:
// require('./commands')
