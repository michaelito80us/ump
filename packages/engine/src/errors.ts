/**
 * Engine-specific error types for plugin registry and execution
 */

import { TournamentError } from '@ump/core';

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
