/**
 * Plugin Registry Module - Central registry for loading & resolving plugins
 * Implements T-2.1 requirements with validation and version management
 */

import React from 'react';
import { Match, Phase, Team, MatchContext } from '@ump/core/types';
import { LifecycleHooks } from './types';
import { satisfies } from './semverLite';
import {
  PluginValidationError,
  PluginNotFoundError,
  DuplicatePluginError,
  VersionConflictError,
} from './errors';

// Plugin metadata interfaces based on unified spec
export interface BasePluginMeta {
  id: string; // registry key, e.g. "rugby-7s"
  name: string; // human-readable label
  version?: string; // semver; required once persisted
  description?: string;
  author?: string;
  supportedLanguages?: string[]; // e.g. ["en", "es"]
  i18n: Record<string, Record<string, string>>; // translations bundle
  capabilities?: string[]; // feature flags – e.g. ["statTier:3"]
  lifecycleHooks?: Partial<LifecycleHooks>; // optional lifecycle hooks
}

export interface SportVariantDefinition {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, unknown>;
}

export interface SportPlugin extends BasePluginMeta {
  statSchema: string[]; // canonical stat keys
  variants?: SportVariantDefinition[]; // Rugby 7s, U10, etc.
  renderScoreEntry(): React.ReactNode; // React 18 + TSX
  renderScore(match: Match): React.ReactNode; // readonly render
  calculateTotalScore(breakdown: any, ctx?: MatchContext): number;
  validateScore(breakdown: any): string | null; // returns error message
}

export interface PhasePlugin extends BasePluginMeta {
  generateSchedule(seedings: Team[], settings: any): Match[];
  getNextMatches?(phase: Phase): Match[];
  renderBracketUI(phase: Phase): React.ReactElement;
  renderStandings?(phase: Phase): React.ReactElement;
  calculateStandings?: (phase: Phase, settings?: any) => any[];
  getHeadToHeadRecord?: (phase: Phase, teamAId: string, teamBId: string) => any;
  meta?: any;
}

export interface SeedingPlugin extends BasePluginMeta {
  seedTeams(teams: Team[], options?: any): Team[];
}

export interface SchedulingPlugin extends BasePluginMeta {
  scheduleMatches(matches: Match[], config: any): Match[];
}

export interface TournamentPlugin extends BasePluginMeta {
  sport: string; // pluginId of the SportPlugin
  phases: { pluginId: string; phaseName: string; settings: any }[];
  scoringRules: Record<string, number>; // e.g. { try:5, conversion:2 }
  tiebreakerRules: string[]; // ordered list of keys
  validateMatchResult?(match: Match): string | null;
}

export type AnyPlugin =
  | SportPlugin
  | PhasePlugin
  | SeedingPlugin
  | SchedulingPlugin
  | TournamentPlugin;

export type PluginCategory =
  | 'sports'
  | 'phases'
  | 'seeding'
  | 'scheduling'
  | 'tournaments';

// Registry implementation
export class PluginRegistry {
  private sports = new Map<string, SportPlugin>();
  private phases = new Map<string, PhasePlugin>();
  private seeding = new Map<string, SeedingPlugin>();
  private scheduling = new Map<string, SchedulingPlugin>();
  private tournaments = new Map<string, TournamentPlugin>();

  /**
   * Register a plugin in the appropriate category
   */
  register<T extends AnyPlugin>(category: PluginCategory, plugin: T): void {
    this.validatePlugin(plugin);

    const registry = this.getRegistryForCategory(category);

    // Check for duplicate ID
    if (registry.has(plugin.id)) {
      const existing = registry.get(plugin.id)!;

      // If both have versions, check for conflicts
      if (existing.version && plugin.version) {
        if (existing.version !== plugin.version) {
          throw new VersionConflictError(
            plugin.id,
            existing.version,
            plugin.version
          );
        }
      }

      throw new DuplicatePluginError(plugin.id, category);
    }

    registry.set(plugin.id, plugin as any);
  }

  /**
   * Get a plugin by ID from the specified category
   */
  get<T extends AnyPlugin>(category: PluginCategory, pluginId: string): T {
    const registry = this.getRegistryForCategory(category);
    const plugin = registry.get(pluginId);

    if (!plugin) {
      throw new PluginNotFoundError(pluginId, category);
    }

    return plugin as T;
  }

  /**
   * Get a plugin with version compatibility check
   */
  getWithVersion<T extends AnyPlugin>(
    category: PluginCategory,
    pluginId: string,
    versionRange?: string
  ): T {
    const plugin = this.get<T>(category, pluginId);

    if (versionRange && plugin.version) {
      if (!satisfies(plugin.version, versionRange)) {
        throw new PluginValidationError(
          `Plugin '${pluginId}' version ${plugin.version} does not satisfy range ${versionRange}`
        );
      }
    }

    return plugin;
  }

  /**
   * List all plugins in a category
   */
  list(category: PluginCategory): AnyPlugin[] {
    const registry = this.getRegistryForCategory(category);
    return Array.from(registry.values());
  }

  /**
   * Check if a plugin exists
   */
  has(category: PluginCategory, pluginId: string): boolean {
    const registry = this.getRegistryForCategory(category);
    return registry.has(pluginId);
  }

  /**
   * Remove a plugin (for testing/development)
   */
  unregister(category: PluginCategory, pluginId: string): boolean {
    const registry = this.getRegistryForCategory(category);
    return registry.delete(pluginId);
  }

  /**
   * Clear all plugins in a category (for testing)
   */
  clear(category?: PluginCategory): void {
    if (category) {
      this.getRegistryForCategory(category).clear();
    } else {
      this.sports.clear();
      this.phases.clear();
      this.seeding.clear();
      this.scheduling.clear();
      this.tournaments.clear();
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): Record<PluginCategory, number> {
    return {
      sports: this.sports.size,
      phases: this.phases.size,
      seeding: this.seeding.size,
      scheduling: this.scheduling.size,
      tournaments: this.tournaments.size,
    };
  }

  /**
   * Get all plugins with lifecycle hooks
   */
  getPluginsWithHooks(): Array<{
    category: PluginCategory;
    plugin: AnyPlugin;
  }> {
    const pluginsWithHooks: Array<{
      category: PluginCategory;
      plugin: AnyPlugin;
    }> = [];

    const categories: PluginCategory[] = [
      'sports',
      'phases',
      'seeding',
      'scheduling',
      'tournaments',
    ];

    for (const category of categories) {
      const plugins = this.list(category);
      for (const plugin of plugins) {
        if (
          plugin.lifecycleHooks &&
          Object.keys(plugin.lifecycleHooks).length > 0
        ) {
          pluginsWithHooks.push({ category, plugin });
        }
      }
    }

    return pluginsWithHooks;
  }

  private getRegistryForCategory(category: PluginCategory): Map<string, any> {
    switch (category) {
      case 'sports':
        return this.sports;
      case 'phases':
        return this.phases;
      case 'seeding':
        return this.seeding;
      case 'scheduling':
        return this.scheduling;
      case 'tournaments':
        return this.tournaments;
      default:
        throw new PluginValidationError(`Unknown plugin category: ${category}`);
    }
  }

  private validatePlugin(plugin: AnyPlugin): void {
    // Validate required fields
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new PluginValidationError('Plugin must have a valid string ID');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new PluginValidationError('Plugin must have a valid string name');
    }

    // Validate ID format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.id)) {
      throw new PluginValidationError(
        'Plugin ID must contain only alphanumeric characters, hyphens, and underscores'
      );
    }

    // Validate version format if provided
    if (plugin.version) {
      try {
        // This will throw if version format is invalid
        const versionParts = plugin.version.split('.');
        if (
          versionParts.length !== 3 ||
          versionParts.some((part) => !/^\d+$/.test(part))
        ) {
          throw new Error('Invalid format');
        }
      } catch {
        throw new PluginValidationError(
          `Invalid version format: ${plugin.version}`
        );
      }
    }

    // Validate i18n bundle
    if (!plugin.i18n || typeof plugin.i18n !== 'object') {
      throw new PluginValidationError(
        'Plugin must provide an i18n translations bundle'
      );
    }

    // Ensure at least one language is provided
    if (Object.keys(plugin.i18n).length === 0) {
      throw new PluginValidationError(
        'Plugin must provide at least one language in i18n bundle'
      );
    }

    // Validate supported languages match i18n keys
    if (plugin.supportedLanguages) {
      const missingLanguages = plugin.supportedLanguages.filter(
        (lang) => !plugin.i18n[lang]
      );
      if (missingLanguages.length > 0) {
        throw new PluginValidationError(
          `Plugin declares support for languages not in i18n bundle: ${missingLanguages.join(', ')}`
        );
      }
    }

    // Validate lifecycle hooks if provided
    if (plugin.lifecycleHooks) {
      this.validateLifecycleHooks(plugin.lifecycleHooks);
    }
  }

  private validateLifecycleHooks(hooks: Partial<LifecycleHooks>): void {
    const validHookNames = [
      'onTournamentStart',
      'onTournamentEnd',
      'onMatchStart',
      'onMatchFinal',
      'beforePhaseGenerate',
      'afterPhaseGenerate',
      'afterStandingsUpdate',
    ];

    for (const [hookName, hookFn] of Object.entries(hooks)) {
      if (!validHookNames.includes(hookName)) {
        throw new PluginValidationError(
          `Invalid lifecycle hook name: ${hookName}. Valid hooks are: ${validHookNames.join(', ')}`
        );
      }

      if (typeof hookFn !== 'function') {
        throw new PluginValidationError(
          `Lifecycle hook '${hookName}' must be a function`
        );
      }
    }
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry();

// Convenience functions
export function registerPlugin<T extends AnyPlugin>(
  category: PluginCategory,
  plugin: T
): void {
  pluginRegistry.register(category, plugin);
}

export function getPlugin<T extends AnyPlugin>(
  category: PluginCategory,
  pluginId: string
): T {
  return pluginRegistry.get<T>(category, pluginId);
}

export function hasPlugin(category: PluginCategory, pluginId: string): boolean {
  return pluginRegistry.has(category, pluginId);
}

export function listPlugins(category: PluginCategory): AnyPlugin[] {
  return pluginRegistry.list(category);
}
