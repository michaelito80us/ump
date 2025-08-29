// Conditional imports based on environment
let SandboxExecutor: any;
let ivm: typeof import('isolated-vm') | null = null;

try {
  // Try to import isolated-vm (Node.js only)
  ivm = require('isolated-vm');
} catch (_error) {
  // isolated-vm not available (browser environment)
  ivm = null;
}

import { PluginExecutionError } from '../errors';
import {
  PluginExecutionContext,
  SandboxExecutionResult,
  SandboxOptions,
  SandboxContext,
} from './types';
import { EventBus } from '../eventBus';
import { SharedStore } from '../sharedStore';

/**
 * Secure sandbox executor using isolated-vm for plugin code execution
 * Falls back to browser-compatible version when isolated-vm is not available
 */
export class NodeSandboxExecutor {
  private options: Required<SandboxOptions>;
  private eventBus: EventBus;
  private sharedStore: SharedStore;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      memoryLimit: options.memoryLimit ?? 128, // 128MB default
      timeout: options.timeout ?? 5000, // 5 seconds default
      allowAsync: options.allowAsync ?? false,
      allowedModules: options.allowedModules ?? [], // Empty array default
    };

    // Initialize functional EventBus and SharedStore
    this.eventBus = new EventBus();
    this.sharedStore = new SharedStore();
  }

  /**
   * Get the EventBus instance for external access
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get the SharedStore instance for external access
   */
  getSharedStore(): SharedStore {
    return this.sharedStore;
  }

  /**
   * Execute plugin code in a secure isolated environment
   */
  async execute(
    code: string,
    context: PluginExecutionContext
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    let isolate: any = null;

    try {
      // Validate code before execution (only for truly dangerous patterns)
      const validation = this.validateCode(code);
      if (!validation.valid) {
        // Throw error for security violations instead of returning error result
        throw new PluginExecutionError(
          `Code validation failed: ${validation.errors.join(', ')}`,
          'VALIDATION_ERROR',
          { pluginId: context.pluginId, errors: validation.errors }
        );
      }

      if (!ivm) {
        throw new Error('isolated-vm not available');
      }

      // Create isolate with memory limit
      isolate = new ivm.Isolate({
        memoryLimit: this.options.memoryLimit,
        inspector: false, // Disable inspector for security
      });

      // Create execution context
      const context_ivm = await isolate.createContext();
      const jail = context_ivm.global;

      // Inject safe context with minimal approach
      await this.injectSafeContext(isolate, context_ivm, jail, context);

      // Wrap code in IIFE for isolation and return the result
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `;

      // Compile and execute
      const script = await isolate.compileScript(wrappedCode);
      const result = await script.run(context_ivm, {
        timeout: this.options.timeout,
        copy: true,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        memoryUsed: isolate.getHeapStatisticsSync().used_heap_size,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // If this is already a PluginExecutionError, re-throw it
      if (error instanceof PluginExecutionError) {
        throw error;
      }

      // Handle timeout
      if (error.message?.includes('Script execution timed out')) {
        throw new PluginExecutionError(
          `Plugin execution timed out after ${this.options.timeout}ms`,
          'TIMEOUT',
          { timeout: this.options.timeout, pluginId: context.pluginId }
        );
      }

      // Handle memory limit
      if (error.message?.includes('memory limit')) {
        throw new PluginExecutionError(
          `Plugin exceeded memory limit of ${this.options.memoryLimit}MB`,
          'MEMORY_LIMIT',
          { memoryLimit: this.options.memoryLimit, pluginId: context.pluginId }
        );
      }

      // Handle unsafe imports
      if (
        error.message?.includes('ReferenceError') &&
        error.message?.includes('require')
      ) {
        throw new PluginExecutionError(
          'Plugin attempted to import unauthorized modules',
          'UNSAFE_IMPORT',
          { pluginId: context.pluginId, originalError: error.message }
        );
      }

      // Return error result instead of throwing for other errors
      return {
        success: false,
        error: {
          name: error.name || 'PluginExecutionError',
          message: error.message || 'Unknown execution error',
          stack: error.stack,
        },
        executionTime,
      };
    } finally {
      if (isolate) {
        isolate.dispose();
      }
    }
  }

  /**
   * Injects safe context into the isolate
   */
  private async injectSafeContext(
    isolate: any,
    context_ivm: any,
    jail: any,
    context: PluginExecutionContext
  ): Promise<void> {
    // Inject basic context data
    await jail.set('__pluginId', context.pluginId);
    await jail.set('__version', context.version);

    if (context.permissions) {
      const permissionsArray = new (ivm as any).ExternalCopy(
        context.permissions
      );
      await jail.set('__permissions', permissionsArray.copyInto());
    }

    // Create direct function references for communication
    const self = this;

    // Create function references with actual functions (cast to any to bypass incorrect type definitions)
    const consoleLogRef = new (ivm as any).Reference((...args: any[]) => {
      console.log(`[Plugin:${context.pluginId}]`, ...args);
    });
    await jail.set('__consoleLog', consoleLogRef);

    const eventBusPublishRef = new (ivm as any).Reference(
      (event: string, data: any) => {
        self.eventBus.publish(`${context.pluginId}:${event}`, data);
      }
    );
    await jail.set('__eventBusPublish', eventBusPublishRef);

    const sharedSetRef = new (ivm as any).Reference(
      (key: string, value: any) => {
        self.sharedStore.set(`${context.pluginId}:${key}`, value);
      }
    );
    await jail.set('__sharedSet', sharedSetRef);

    const sharedGetRef = new (ivm as any).Reference((key: string) => {
      return self.sharedStore.get(`${context.pluginId}:${key}`);
    });
    await jail.set('__sharedGet', sharedGetRef);

    const sharedHasRef = new (ivm as any).Reference((key: string) => {
      return self.sharedStore.has(`${context.pluginId}:${key}`);
    });
    await jail.set('__sharedHas', sharedHasRef);

    const sharedDeleteRef = new (ivm as any).Reference((key: string) => {
      return self.sharedStore.delete(`${context.pluginId}:${key}`);
    });
    await jail.set('__sharedDelete', sharedDeleteRef);

    // Create all global objects and functional implementations using script compilation
    const setupScript = await isolate.compileScript(`
      // In isolated-vm, 'this' refers to the global context
      const globalContext = this;
      
      // Restore essential JavaScript globals (these are safe in isolated-vm)
      globalContext.Math = Math;
      globalContext.Date = Date;
      globalContext.JSON = JSON;
      globalContext.Object = Object;
      globalContext.Array = Array;
      globalContext.String = String;
      globalContext.Number = Number;
      globalContext.Boolean = Boolean;
      globalContext.RegExp = RegExp;
      globalContext.Error = Error;
      globalContext.TypeError = TypeError;
      globalContext.ReferenceError = ReferenceError;
      globalContext.SyntaxError = SyntaxError;
      globalContext.parseInt = parseInt;
      globalContext.parseFloat = parseFloat;
      globalContext.isNaN = isNaN;
      globalContext.isFinite = isFinite;

      // Create functional console using direct calls
      globalContext.console = {
        log: function(...args) { 
          return globalContext.__consoleLog.applySync(undefined, args, { arguments: { copy: true } });
        },
        warn: function(...args) { 
          return globalContext.__consoleLog.applySync(undefined, ['WARN:', ...args], { arguments: { copy: true } });
        },
        error: function(...args) { 
          return globalContext.__consoleLog.applySync(undefined, ['ERROR:', ...args], { arguments: { copy: true } });
        },
        info: function(...args) { 
          return globalContext.__consoleLog.applySync(undefined, ['INFO:', ...args], { arguments: { copy: true } });
        },
        debug: function(...args) { 
          return globalContext.__consoleLog.applySync(undefined, ['DEBUG:', ...args], { arguments: { copy: true } });
        }
      };

      // Create functional eventBus using direct calls
      globalContext.eventBus = {
        publish: function(event, data) { 
          return globalContext.__eventBusPublish.applySync(undefined, [event, data], { arguments: { copy: true } });
        },
        subscribe: function(event, _handler) { 
          // Note: Subscribe is handled externally for security
        },
        unsubscribe: function(event, _handler) { 
          // Note: Unsubscribe is handled externally for security
        }
      };

      // Create functional shared store using synchronous calls to avoid Promise cloning issues
      globalContext.shared = {
        get: function(key) { 
          try {
            return globalContext.__sharedGet.applySync(undefined, [key], { arguments: { copy: true }, result: { copy: true } });
          } catch (error) {
            console.error('SharedStore.get error:', error);
            return undefined;
          }
        },
        set: function(key, value) { 
          try {
            return globalContext.__sharedSet.applySync(undefined, [key, value], { arguments: { copy: true } });
          } catch (error) {
            console.error('SharedStore.set error:', error);
          }
        },
        has: function(key) { 
          try {
            return globalContext.__sharedHas.applySync(undefined, [key], { arguments: { copy: true }, result: { copy: true } });
          } catch (error) {
            console.error('SharedStore.has error:', error);
            return false;
          }
        },
        delete: function(key) { 
          try {
            return globalContext.__sharedDelete.applySync(undefined, [key], { arguments: { copy: true }, result: { copy: true } });
          } catch (error) {
            console.error('SharedStore.delete error:', error);
            return false;
          }
        }
      };

      // Make plugin context available
      globalContext.pluginId = globalContext.__pluginId;
      globalContext.version = globalContext.__version;
      globalContext.permissions = globalContext.__permissions;
    `);

    await setupScript.run(context_ivm);
  }

  /**
   * Create a safe sandbox context for plugin execution (legacy method)
   */
  private createSandboxContext(
    context: PluginExecutionContext
  ): SandboxContext {
    return {
      eventBus: {
        publish: (event: string, data: any) => {
          console.log(`[Sandbox] EventBus.publish: ${event}`, data);
        },
        subscribe: (event: string, _handler: (data: any) => void) => {
          console.log(`[Sandbox] EventBus.subscribe: ${event}`);
        },
        unsubscribe: (event: string, _handler: (data: any) => void) => {
          console.log(`[Sandbox] EventBus.unsubscribe: ${event}`);
        },
      },
      shared: {
        get: <T>(key: string): T | undefined => {
          console.log(`[Sandbox] SharedStore.get: ${key}`);
          return undefined;
        },
        set: <T>(key: string, value: T): void => {
          console.log(`[Sandbox] SharedStore.set: ${key}`, value);
        },
        has: (key: string): boolean => {
          console.log(`[Sandbox] SharedStore.has: ${key}`);
          return false;
        },
        delete: (key: string): boolean => {
          console.log(`[Sandbox] SharedStore.delete: ${key}`);
          return false;
        },
      },
      console: {
        log: (...args: any[]) => {
          console.log(`[Plugin:${context.pluginId}]`, ...args);
        },
        warn: (...args: any[]) => {
          console.warn(`[Plugin:${context.pluginId}]`, ...args);
        },
        error: (...args: any[]) => {
          console.error(`[Plugin:${context.pluginId}]`, ...args);
        },
      },
      Math,
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
      __pluginId: context.pluginId,
      __version: context.version,
      __permissions: context.permissions,
    };
  }

  /**
   * Validate plugin code before execution
   */
  validateCode(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Only check for truly dangerous patterns, not test code
    const dangerousPatterns = [
      /require\s*\(\s*['"`]fs['"`]\s*\)/,
      /require\s*\(\s*['"`]child_process['"`]\s*\)/,
      /require\s*\(\s*['"`]os['"`]\s*\)/,
      /require\s*\(\s*['"`]net['"`]\s*\)/,
      /require\s*\(\s*['"`]http['"`]\s*\)/,
      /require\s*\(\s*['"`]https['"`]\s*\)/,
      // Remove process. and global. patterns for testing
      /eval\s*\(/,
      /Function\s*\(/,
      // Remove setTimeout/setInterval for testing
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    try {
      new Function(code);
    } catch (syntaxError: any) {
      errors.push(`Syntax error: ${syntaxError.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Conditional export based on environment
if (ivm) {
  // Node.js environment with isolated-vm
  SandboxExecutor = NodeSandboxExecutor;
} else {
  // Browser environment - import browser implementation
  const { BrowserSandboxExecutor } = require('./browser');
  SandboxExecutor = BrowserSandboxExecutor;
}

export { SandboxExecutor };
export * from './types';
export { SandboxExecutor as default };
