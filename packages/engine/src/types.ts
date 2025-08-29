// Engine Types - Plugin execution and registry interfaces

import { BasePluginMeta, AnyPlugin, PluginCategory } from './registry';
import { Tournament, Match, Phase } from '@ump/core/types';

export interface PluginContext {
  version: string;
  eventBus: EventBus;
  shared: SharedStore;
  // Additional context will be added in future tasks
}

export interface TournamentContext {
  tournament: Tournament;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface MatchContext {
  match: Match;
  tournament: Tournament;
  phase: Phase;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  teamId: string;
  position: number;
  points: number;
  stats: Record<string, number>;
}

export interface LifecycleHooks {
  onTournamentStart?: (ctx: TournamentContext) => Promise<void>;
  onTournamentEnd?: (ctx: TournamentContext) => Promise<void>;
  onMatchStart?: (match: Match, ctx: MatchContext) => Promise<void>;
  onMatchFinal?: (match: Match, ctx: MatchContext) => Promise<void>;
  beforePhaseGenerate?: (phase: Phase) => Promise<Phase>;
  afterPhaseGenerate?: (phase: Phase) => Promise<void>;
  afterStandingsUpdate?: (leaderboard: LeaderboardEntry[]) => Promise<void>;
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

// Note: PluginRegistry class is exported from './registry'
// No need to duplicate the interface here since the actual implementation exists
