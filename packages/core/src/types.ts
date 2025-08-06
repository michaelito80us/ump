// 📦 Canonical Type Definitions for Tournament Plugin System
// This file contains the single source of truth for all domain entities

// Frozen enums and string unions
export type MatchStatus = 'pending' | 'live' | 'final' | 'needs_approval';

export interface Team {
  id: string;
  name: string;
  sportIds: string[];
  playerIds: string[];
  managers: string[];
  tournaments: string[];
}

export interface Player {
  id: string;
  userId: string;
  sports: string[];
  teamIds: string[];
  stats: Record<string, PlayerStats>; // keyed by tournament ID
}

export interface PlayerStats {
  playerId: string;
  sport: string;
  tournamentId: string;
  stats: Record<string, number>; // metric keys: 'tries', 'assists', etc.
}

export interface MatchBreakdownTeam {
  [metric: string]: number;
}

export interface MatchBreakdown {
  teamA: MatchBreakdownTeam;
  teamB: MatchBreakdownTeam;
}

export interface MatchScoreAudit {
  id: string;
  matchId: string;
  submittedBy: string;
  submittedAt: Date;
  breakdown: MatchBreakdown;
  scoreA: number;
  scoreB: number;
  source: 'manual' | 'plugin' | 'admin_override';
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  breakdown?: MatchBreakdown;
  scheduledTime?: string;
  venue?: string;
  status: MatchStatus;
}

export interface Phase {
  id: string;
  pluginId: string;
  phaseName: string;
  settings: Record<string, unknown>;
  matches: Match[];
}

export interface Tournament {
  id: string;
  pluginId: string;
  name: string;
  sport: string;
  status: 'not_started' | 'live' | 'completed';
  phases: Phase[];
  config: TournamentConfig;
  isLocked: boolean;
}

export interface TournamentPluginReference {
  sport: string;
  phases: {
    pluginId: string;
    phaseName: string;
    settings: Record<string, unknown>;
  }[];
  scheduling?: string;
  seeding?: string;
}

export interface TournamentConfig {
  variantId?: string;
  statTier: number;
  matchDuration?: number;
  plugins: TournamentPluginReference;
}

export interface Slot {
  field: string;
  start: string; // ISO 8601 or "HH:mm"
  end: string;
}

export interface SchedulingConstraints {
  maxMatchesPerDay: number;
  minRestMinutes: number;
  availableSlots: Slot[];
  blackoutHours?: Slot[];
}

export interface MatchContext {
  tournament: Tournament;
  phase: Phase;
  variantId?: string;
}

export interface TournamentContext {
  tournament: Tournament;
  phases: Phase[];
}

export interface LeaderboardEntry {
  entity: 'player' | 'team';
  referenceId: string;
  tournamentId: string;
  metric: string;
  value: number;
  rank: number;
}

export interface Invitation {
  id: string;
  type: 'TEAM_PLAYER' | 'TOURNAMENT_TEAM' | 'TOURNAMENT_USER' | 'ORG_USER';
  senderUserId: string;
  recipientEmail?: string;
  recipientUserId?: string;
  token: string;
  role: string | string[];
  teamId?: string;
  tournamentId?: string;
  organizationId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: Date;
  expiresAt: Date;
}

export interface JoinRequest {
  id: string;
  requesterUserId: string;
  targetEntity: 'TEAM' | 'TOURNAMENT';
  entityId: string;
  roleRequested: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  createdAt: Date;
}

export interface PlayerOverride {
  id: string;
  tournamentId: string;
  playerId: string;
  approvedByUserId: string;
  reason: string;
  approvalNote?: string;
  approvalTimestamp?: Date;
  timestamp: Date;
}

// 📚 Log Types

export interface BaseLog {
  id: string;
  type: string;
  timestamp: Date;
  actorId: string;
  actorType: 'user' | 'system' | 'plugin';
  message?: string;
}

export interface MatchLog extends BaseLog {
  type: 'MATCH_EVENT';
  matchId: string;
  change: Partial<Match>;
}

export interface ScoreSubmissionLog extends BaseLog {
  type: 'SCORE_SUBMISSION';
  matchId: string;
  submittedBy: string;
  scoreA: number;
  scoreB: number;
  breakdown: MatchBreakdown;
  source: 'manual' | 'plugin' | 'admin_override';
}

export interface ConstraintViolationLog extends BaseLog {
  type: 'CONSTRAINT_VIOLATION';
  phaseId: string;
  description: string;
}

export interface PlayerMovementLog extends BaseLog {
  type: 'PLAYER_MOVEMENT';
  playerId: string;
  teamId: string;
  action: 'JOINED' | 'LEFT';
  tournamentId: string;
  reason?: string;
}

export interface ManualOverrideLog extends BaseLog {
  type: 'MANUAL_OVERRIDE';
  field: string;
  originalValue: unknown;
  newValue: unknown;
  affectedEntity: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'PHASE';
  entityId: string;
  context: string;
  approvedById?: string;
  approvalNote?: string;
  approvalTimestamp?: Date;
}

export type AuditLog =
  | MatchLog
  | ScoreSubmissionLog
  | ConstraintViolationLog
  | PlayerMovementLog
  | ManualOverrideLog;

// ❌ Error Types

export class TournamentError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'TOURNAMENT_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'TournamentError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends TournamentError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    details?: any
  ) {
    super(message, code, details);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends TournamentError {
  constructor(
    message: string,
    code: string = 'PERMISSION_ERROR',
    details?: any
  ) {
    super(message, code, details);
    this.name = 'PermissionError';
  }
}

export class PluginExecutionError extends TournamentError {
  constructor(message: string, code: string = 'PLUGIN_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'PluginExecutionError';
  }
}

// Frozen constants for string unions to prevent runtime modification
export const MATCH_STATUSES = [
  'pending',
  'live',
  'final',
  'needs_approval',
] as const;
export const TOURNAMENT_STATUSES = [
  'not_started',
  'live',
  'completed',
] as const;
export const INVITATION_TYPES = [
  'TEAM_PLAYER',
  'TOURNAMENT_TEAM',
  'TOURNAMENT_USER',
  'ORG_USER',
] as const;
export const INVITATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED',
] as const;
export const JOIN_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;
export const ACTOR_TYPES = ['user', 'system', 'plugin'] as const;
export const LOG_TYPES = [
  'MATCH_EVENT',
  'SCORE_SUBMISSION',
  'CONSTRAINT_VIOLATION',
  'PLAYER_MOVEMENT',
  'MANUAL_OVERRIDE',
] as const;
export const LEADERBOARD_ENTITIES = ['player', 'team'] as const;
export const TARGET_ENTITIES = ['TEAM', 'TOURNAMENT'] as const;
export const PLAYER_ACTIONS = ['JOINED', 'LEFT'] as const;
export const AFFECTED_ENTITIES = [
  'MATCH',
  'TEAM',
  'TOURNAMENT',
  'PHASE',
] as const;
export const SCORE_SOURCES = ['manual', 'plugin', 'admin_override'] as const;
