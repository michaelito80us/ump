// Sandbox Types - VM2 execution context and security interfaces

export interface SandboxOptions {
  timeout?: number; // Execution timeout in milliseconds (default: 5000)
  memoryLimit?: number; // Memory limit in MB (default: 64)
  allowAsync?: boolean; // Allow async/await and Promises (default: false)
  allowedModules?: string[]; // Whitelisted Node.js modules (default: [])
}

export interface SandboxContext {
  // Safe context exposed to plugins
  eventBus: {
    publish: (event: string, data: any) => void;
    subscribe: (event: string, handler: (data: any) => void) => void;
    unsubscribe: (event: string, handler: (data: any) => void) => void;
  };
  shared: {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => void;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
  };
  // CRUD proxies will be added in future tasks
  console: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
  // Restricted global objects
  Math: typeof Math;
  Date: typeof Date;
  JSON: typeof JSON;
  Object: typeof Object;
  Array: typeof Array;
  String: typeof String;
  Number: typeof Number;
  Boolean: typeof Boolean;

  // Plugin context information
  __pluginId: string;
  __version: string;
  __permissions: string[];
}

export interface SandboxExecutionResult<T = any> {
  success: boolean;
  result?: T;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  executionTime: number; // in milliseconds
  memoryUsed?: number; // in bytes
}

export interface PluginExecutionContext {
  pluginId: string;
  version: string;
  permissions: string[];
  eventBus: any; // Will be properly typed when eventBus is implemented
  shared: any; // Will be properly typed when sharedStore is implemented
}
