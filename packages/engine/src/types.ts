// Engine Types - Plugin execution and registry interfaces

import { BasePluginMeta, AnyPlugin, PluginCategory } from './registry';

export interface PluginContext {
  version: string;
  eventBus: EventBus;
  shared: SharedStore;
  // Additional context will be added in future tasks
}

export interface EventBus {
  publish(event: string, data: any): void;
  subscribe(event: string, handler: (data: any) => void): void;
  unsubscribe(event: string, handler: (data: any) => void): void;
}

export interface SharedStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}

// Re-export registry types for convenience
export type { BasePluginMeta, AnyPlugin, PluginCategory };
export type {
  SportPlugin,
  PhasePlugin,
  SeedingPlugin,
  SchedulingPlugin,
  TournamentPlugin,
  SportVariantDefinition,
} from './registry';

// PluginRegistry class is exported from './registry'
export interface PluginRegistry {
  // Placeholder for plugin registry interface
  plugins: Map<string, unknown>;
}
