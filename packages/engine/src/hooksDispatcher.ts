/**
 * Lifecycle Hooks Dispatcher - Invoke plugin hooks in deterministic order with isolation
 * Implements T-2.5 requirements for plugin lifecycle management
 */

import {
  LifecycleHooks,
  TournamentContext,
  MatchContext,
  LeaderboardEntry,
} from './types';
import { Match, Phase } from '@ump/core/types';
import { PluginExecutionError } from './errors';

export type HookName = keyof LifecycleHooks;

export interface HookRegistration {
  pluginId: string;
  hook: Function;
  priority?: number; // Lower numbers execute first (default: 100)
}

export interface HookExecutionResult {
  pluginId: string;
  success: boolean;
  error?: Error;
  executionTime: number;
}

export interface HookExecutionSummary {
  hookName: HookName;
  totalExecutionTime: number;
  successCount: number;
  errorCount: number;
  results: HookExecutionResult[];
}

/**
 * Manages and executes plugin lifecycle hooks with error isolation
 */
export class HooksDispatcher {
  private hooks = new Map<HookName, HookRegistration[]>();
  private logger?: (message: string, data?: any) => void;

  constructor(logger?: (message: string, data?: any) => void) {
    this.logger = logger;
  }

  /**
   * Register a lifecycle hook for a plugin
   */
  registerHook<K extends HookName>(
    hookName: K,
    pluginId: string,
    hook: NonNullable<LifecycleHooks[K]>,
    priority = 100
  ): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const registrations = this.hooks.get(hookName)!;

    // Check for duplicate registration
    const existingIndex = registrations.findIndex(
      (reg) => reg.pluginId === pluginId
    );
    if (existingIndex !== -1) {
      // Replace existing registration
      registrations[existingIndex] = { pluginId, hook, priority };
    } else {
      // Add new registration
      registrations.push({ pluginId, hook, priority });
    }

    // Sort by priority (lower numbers first)
    registrations.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  /**
   * Unregister a hook for a specific plugin
   */
  unregisterHook(hookName: HookName, pluginId: string): boolean {
    const registrations = this.hooks.get(hookName);
    if (!registrations) return false;

    const initialLength = registrations.length;
    const filtered = registrations.filter((reg) => reg.pluginId !== pluginId);

    if (filtered.length !== initialLength) {
      this.hooks.set(hookName, filtered);
      return true;
    }

    return false;
  }

  /**
   * Unregister all hooks for a plugin
   */
  unregisterAllHooks(pluginId: string): number {
    let removedCount = 0;

    for (const [hookName, registrations] of this.hooks.entries()) {
      const initialLength = registrations.length;
      const filtered = registrations.filter((reg) => reg.pluginId !== pluginId);

      if (filtered.length !== initialLength) {
        this.hooks.set(hookName, filtered);
        removedCount += initialLength - filtered.length;
      }
    }

    return removedCount;
  }

  /**
   * Execute onTournamentStart hooks
   */
  async executeTournamentStart(
    ctx: TournamentContext
  ): Promise<HookExecutionSummary> {
    return this.executeHooks('onTournamentStart', [ctx]);
  }

  /**
   * Execute onTournamentEnd hooks
   */
  async executeTournamentEnd(
    ctx: TournamentContext
  ): Promise<HookExecutionSummary> {
    return this.executeHooks('onTournamentEnd', [ctx]);
  }

  /**
   * Execute onMatchStart hooks
   */
  async executeMatchStart(
    match: Match,
    ctx: MatchContext
  ): Promise<HookExecutionSummary> {
    return this.executeHooks('onMatchStart', [match, ctx]);
  }

  /**
   * Execute onMatchFinal hooks
   */
  async executeMatchFinal(
    match: Match,
    ctx: MatchContext
  ): Promise<HookExecutionSummary> {
    return this.executeHooks('onMatchFinal', [match, ctx]);
  }

  /**
   * Execute beforePhaseGenerate hooks and return potentially modified phase
   */
  async executeBeforePhaseGenerate(
    phase: Phase
  ): Promise<{ phase: Phase; summary: HookExecutionSummary }> {
    const summary = await this.executeHooks('beforePhaseGenerate', [phase]);

    // For beforePhaseGenerate, we need to handle the return value
    // The last successful hook's return value becomes the final phase
    let finalPhase = phase;

    for (const result of summary.results) {
      if (result.success && 'returnValue' in result && result.returnValue) {
        finalPhase = result.returnValue as Phase;
      }
    }

    return { phase: finalPhase, summary };
  }

  /**
   * Execute afterPhaseGenerate hooks
   */
  async executeAfterPhaseGenerate(phase: Phase): Promise<HookExecutionSummary> {
    return this.executeHooks('afterPhaseGenerate', [phase]);
  }

  /**
   * Execute afterStandingsUpdate hooks
   */
  async executeAfterStandingsUpdate(
    leaderboard: LeaderboardEntry[]
  ): Promise<HookExecutionSummary> {
    return this.executeHooks('afterStandingsUpdate', [leaderboard]);
  }

  /**
   * Get all registered hooks for debugging
   */
  getRegisteredHooks(): Record<HookName, string[]> {
    const result: Partial<Record<HookName, string[]>> = {};

    for (const [hookName, registrations] of this.hooks.entries()) {
      result[hookName] = registrations.map((reg) => reg.pluginId);
    }

    return result as Record<HookName, string[]>;
  }

  /**
   * Clear all registered hooks (for testing)
   */
  clear(): void {
    this.hooks.clear();
  }

  /**
   * Core hook execution logic with error isolation
   */
  private async executeHooks(
    hookName: HookName,
    args: any[]
  ): Promise<HookExecutionSummary> {
    const startTime = Date.now();
    const registrations = this.hooks.get(hookName) || [];
    const results: HookExecutionResult[] = [];

    this.logger?.(`Executing ${registrations.length} hooks for ${hookName}`, {
      hookName,
      pluginCount: registrations.length,
    });

    for (const registration of registrations) {
      const hookStartTime = Date.now();

      try {
        this.logger?.(
          `Executing hook ${hookName} for plugin ${registration.pluginId}`
        );

        // Execute the hook with a timeout to prevent hanging
        const result = await this.executeWithTimeout(
          registration.hook,
          args,
          5000 // 5 second timeout
        );

        const executionTime = Date.now() - hookStartTime;

        results.push({
          pluginId: registration.pluginId,
          success: true,
          executionTime,
          ...(result !== undefined && { returnValue: result }),
        } as HookExecutionResult & { returnValue?: any });

        this.logger?.(
          `Hook ${hookName} completed successfully for plugin ${registration.pluginId}`,
          { executionTime }
        );
      } catch (error) {
        const executionTime = Date.now() - hookStartTime;
        const hookError =
          error instanceof Error ? error : new Error(String(error));

        results.push({
          pluginId: registration.pluginId,
          success: false,
          error: hookError,
          executionTime,
        });

        // Log error but continue with other hooks
        this.logger?.(
          `Hook ${hookName} failed for plugin ${registration.pluginId}`,
          {
            error: hookError.message,
            executionTime,
          }
        );
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    const summary: HookExecutionSummary = {
      hookName,
      totalExecutionTime,
      successCount,
      errorCount,
      results,
    };

    this.logger?.(`Completed executing hooks for ${hookName}`, summary);

    return summary;
  }

  /**
   * Execute a function with timeout protection
   */
  private async executeWithTimeout<T>(
    fn: Function,
    args: any[],
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new PluginExecutionError(
            `Hook execution timed out after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      Promise.resolve(fn(...args))
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}

// Global hooks dispatcher instance
export const hooksDispatcher = new HooksDispatcher(
  // Default logger - can be replaced in production
  (message: string, data?: any) => {
    console.log(`[HooksDispatcher] ${message}`, data || '');
  }
);

// Convenience functions
export function registerLifecycleHook<K extends HookName>(
  hookName: K,
  pluginId: string,
  hook: NonNullable<LifecycleHooks[K]>,
  priority?: number
): void {
  hooksDispatcher.registerHook(hookName, pluginId, hook, priority);
}

export function unregisterLifecycleHook(
  hookName: HookName,
  pluginId: string
): boolean {
  return hooksDispatcher.unregisterHook(hookName, pluginId);
}
