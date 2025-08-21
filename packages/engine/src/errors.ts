/**
 * Engine-specific error types for plugin registry and execution
 */

import { TournamentError } from '@ump/core/errors';

export class PluginRegistryError extends TournamentError {
  constructor(message: string) {
    super(message);
    this.name = 'PluginRegistryError';
  }
}

export class PluginValidationError extends PluginRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'PluginValidationError';
  }
}

export class PluginNotFoundError extends PluginRegistryError {
  constructor(pluginId: string, category: string) {
    super(`Plugin '${pluginId}' not found in category '${category}'`);
    this.name = 'PluginNotFoundError';
  }
}

export class DuplicatePluginError extends PluginRegistryError {
  constructor(pluginId: string, category: string) {
    super(`Plugin '${pluginId}' already registered in category '${category}'`);
    this.name = 'DuplicatePluginError';
  }
}

export class VersionConflictError extends PluginRegistryError {
  constructor(pluginId: string, existingVersion: string, newVersion: string) {
    super(
      `Version conflict for plugin '${pluginId}': existing ${existingVersion}, attempted ${newVersion}`
    );
    this.name = 'VersionConflictError';
  }
}

export class PluginExecutionError extends TournamentError {
  public readonly code: string;
  public readonly context: any;

  constructor(
    message: string,
    code: string = 'EXECUTION_ERROR',
    context: any = {}
  ) {
    super(message);
    this.name = 'PluginExecutionError';
    this.code = code;
    this.context = context;
  }
}

// Remote bundle error types
export class RemoteBundleError extends TournamentError {
  constructor(message: string, code: string = 'REMOTE_BUNDLE_ERROR') {
    super(message, code);
    this.name = 'RemoteBundleError';
  }
}

export class BundleVerificationError extends RemoteBundleError {
  constructor(expectedHash: string, actualHash: string) {
    super(
      `Bundle verification failed: expected ${expectedHash}, got ${actualHash}`,
      'BUNDLE_VERIFICATION_FAILED'
    );
    this.name = 'BundleVerificationError';
  }
}

export class BundleDownloadError extends RemoteBundleError {
  constructor(url: string, cause?: Error) {
    super(
      `Failed to download bundle from ${url}: ${cause?.message || 'Unknown error'}`,
      'BUNDLE_DOWNLOAD_FAILED'
    );
    this.name = 'BundleDownloadError';
    if (cause) {
      this.stack = cause.stack;
    }
  }
}

export class BundleCacheError extends RemoteBundleError {
  constructor(message: string) {
    super(message, 'BUNDLE_CACHE_ERROR');
    this.name = 'BundleCacheError';
  }
}
