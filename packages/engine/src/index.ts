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

// Conditionally import and re-export SandboxExecutor
let SandboxExecutor: any;
try {
  if (typeof window === 'undefined') {
    // Node.js environment
    SandboxExecutor = require('./sandbox').SandboxExecutor;
  } else {
    // Browser environment
    SandboxExecutor = null;
  }
} catch {
  // Fallback for any import issues
  SandboxExecutor = null;
}
export { SandboxExecutor };

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

// Conditionally import and re-export remote bundle functionality
let RemoteBundleFetcher: any;
let fetchRemoteBundle: any;

// Import types directly to avoid ESLint unused variable warnings
import type {
  RemoteBundleConfig,
  BundleResult,
} from './remote/fetchRemoteBundle';

try {
  if (typeof window === 'undefined') {
    // Node.js environment
    const remoteBundleModule = require('./remote/fetchRemoteBundle');
    RemoteBundleFetcher = remoteBundleModule.RemoteBundleFetcher;
    fetchRemoteBundle = remoteBundleModule.fetchRemoteBundle;
  } else {
    // Browser environment
    RemoteBundleFetcher = null;
    fetchRemoteBundle = null;
  }
} catch {
  // Fallback for any import issues
  RemoteBundleFetcher = null;
  fetchRemoteBundle = null;
}

export { RemoteBundleFetcher, fetchRemoteBundle };
export type { RemoteBundleConfig, BundleResult };

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
