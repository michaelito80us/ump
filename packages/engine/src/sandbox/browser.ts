/**
 * Browser-compatible sandbox implementation
 * This is a fallback for when isolated-vm is not available (browser environment)
 */

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
 * Browser-compatible sandbox executor
 * Note: This provides limited security compared to isolated-vm
 */
export class BrowserSandboxExecutor {
  private options: Required<SandboxOptions>;
  private eventBus: EventBus;
  private sharedStore: SharedStore;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      memoryLimit: options.memoryLimit ?? 128, // Not enforced in browser
      timeout: options.timeout ?? 5000,
      allowAsync: options.allowAsync ?? false,
      allowedModules: options.allowedModules ?? [],
    };

    this.eventBus = new EventBus();
    this.sharedStore = new SharedStore();
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getSharedStore(): SharedStore {
    return this.sharedStore;
  }

  async execute(
    code: string,
    context: PluginExecutionContext
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate code before execution
      const validation = this.validateCode(code);
      if (!validation.valid) {
        throw new PluginExecutionError(
          `Code validation failed: ${validation.errors.join(', ')}`,
          'VALIDATION_ERROR',
          { pluginId: context.pluginId, errors: validation.errors }
        );
      }

      // Create sandbox context
      const sandboxContext = this.createSandboxContext(context);

      // Create a function with the plugin code
      const wrappedCode = `
        (function() {
          'use strict';
          ${code}
        })()
      `;

      // Execute with timeout
      const result = await this.executeWithTimeout(wrappedCode, sandboxContext);

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        memoryUsed: 0, // Not available in browser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: error instanceof Error ? error.name : 'Error',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      };
    }
  }

  private async executeWithTimeout(
    code: string,
    sandboxContext: SandboxContext
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new PluginExecutionError('Execution timeout', 'TIMEOUT_ERROR'));
      }, this.options.timeout);

      try {
        // Create a new function with the sandbox context as parameters
        const func = new Function(
          '__pluginId',
          '__version',
          '__permissions',
          'console',
          'eventBus',
          'shared',
          'Math',
          'Date',
          'JSON',
          'Array',
          'Object',
          'String',
          'Number',
          'Boolean',
          code
        );

        const result = func(
          sandboxContext.__pluginId,
          sandboxContext.__version,
          sandboxContext.__permissions,
          sandboxContext.console,
          sandboxContext.eventBus,
          sandboxContext.shared,
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean
        );

        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private createSandboxContext(
    context: PluginExecutionContext
  ): SandboxContext {
    return {
      __pluginId: context.pluginId,
      __version: context.version,
      __permissions: context.permissions,
      console: {
        log: (...args: any[]) =>
          console.log(`[Plugin:${context.pluginId}]`, ...args),
        warn: (...args: any[]) =>
          console.warn(`[Plugin:${context.pluginId}]`, ...args),
        error: (...args: any[]) =>
          console.error(`[Plugin:${context.pluginId}]`, ...args),
      },
      eventBus: {
        publish: (event: string, data: any) => {
          this.eventBus.publish(`${context.pluginId}:${event}`, data);
        },
        subscribe: (event: string, handler: (data: any) => void) => {
          this.eventBus.subscribe(`${context.pluginId}:${event}`, handler);
        },
        unsubscribe: (event: string, handler: (data: any) => void) => {
          this.eventBus.unsubscribe(`${context.pluginId}:${event}`, handler);
        },
      },
      shared: {
        get: <T>(key: string) =>
          this.sharedStore.get(`${context.pluginId}:${key}`) as T,
        set: <T>(key: string, value: T) =>
          this.sharedStore.set(`${context.pluginId}:${key}`, value),
        has: (key: string) =>
          this.sharedStore.has(`${context.pluginId}:${key}`),
        delete: (key: string) =>
          this.sharedStore.delete(`${context.pluginId}:${key}`),
      },
      // Restricted global objects
      Math,
      Date,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
    };
  }

  validateCode(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const dangerousPatterns = [
      /\beval\s*\(/,
      /\bFunction\s*\(/,
      /\bsetTimeout\s*\(/,
      /\bsetInterval\s*\(/,
      /\bsetImmediate\s*\(/,
      /\bprocess\b/,
      /\brequire\s*\(/,
      /\bimport\s+/,
      /\bexport\s+/,
      /\b__dirname\b/,
      /\b__filename\b/,
      /\bglobal\b/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\blocation\b/,
      /\bnavigator\b/,
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bWebSocket\b/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { BrowserSandboxExecutor as SandboxExecutor };
export * from './types';
