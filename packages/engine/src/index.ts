// @ump/engine - Plugin Runtime Engine
// Main exports for the engine package

// Core engine exports
export * from './types';
export * from './registry';
export { EventBus } from './eventBus';
export { SharedStore } from './sharedStore';
export * from './hooksDispatcher';
export * from './errors';
export * from './semverLite';

// Sandbox exports
export type {
  SandboxContext,
  SandboxOptions,
  SandboxExecutionResult,
  PluginExecutionContext,
} from './sandbox/types';
export { SandboxExecutor } from './sandbox';

// Engine version
export const ENGINE_VERSION = '0.1.0';

// Main registry instance (convenience re-export)
export { pluginRegistry } from './registry';

// Main hooks dispatcher instance (convenience re-export)
export { hooksDispatcher } from './hooksDispatcher';
export * from './harness';

// RBAC exports
export * from './rbac';

// Logging exports
export * from './logging';

// Privacy exports
export * from './privacy';

// Guards exports
export * from './guards/dedupeScore';

// Remote bundle fetching
export {
  RemoteBundleFetcher,
  fetchRemoteBundle,
  type RemoteBundleConfig,
  type BundleResult,
} from './remote/fetchRemoteBundle';

// Updated error exports
export {
  PluginRegistryError,
  PluginValidationError,
  PluginNotFoundError,
  DuplicatePluginError,
  VersionConflictError,
  PluginExecutionError,
  RemoteBundleError,
  BundleVerificationError,
  BundleDownloadError,
  BundleCacheError,
} from './errors';
