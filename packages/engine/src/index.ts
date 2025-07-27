// @ump/engine - Plugin Runtime Engine
// Main exports for the engine package

export * from './types';
export * from './registry';
export * from './errors';
export * from './semverLite';

// Export sandbox executor
export { SandboxExecutor } from './sandbox';
export type {
  SandboxOptions,
  SandboxContext,
  SandboxExecutionResult,
  PluginExecutionContext,
} from './sandbox/types';

// Engine version
export const ENGINE_VERSION = '0.1.0';

// Main registry instance
export { pluginRegistry } from './registry';
