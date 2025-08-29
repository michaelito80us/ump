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
  stats: Record<string, PlayerStats>;
}
export interface PlayerStats {
  playerId: string;
  sport: string;
  tournamentId: string;
  stats: Record<string, number>;
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
export interface MatchPatch {
  id: string;
  changes: Partial<Match>;
  timestamp: number;
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
  start: string;
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
  affectedEntity: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'PHASE' | 'USER';
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
export declare class TournamentError extends Error {
  readonly code: string;
  readonly details?: any;
  constructor(message: string, code?: string, details?: any);
}
export declare class ValidationError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare class PermissionError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare class PluginExecutionError extends TournamentError {
  constructor(message: string, code?: string, details?: any);
}
export declare const MATCH_STATUSES: readonly [
  'pending',
  'live',
  'final',
  'needs_approval',
];
export declare const TOURNAMENT_STATUSES: readonly [
  'not_started',
  'live',
  'completed',
];
export declare const INVITATION_TYPES: readonly [
  'TEAM_PLAYER',
  'TOURNAMENT_TEAM',
  'TOURNAMENT_USER',
  'ORG_USER',
];
export declare const INVITATION_STATUSES: readonly [
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED',
];
export declare const JOIN_REQUEST_STATUSES: readonly [
  'PENDING',
  'APPROVED',
  'REJECTED',
];
export declare const ACTOR_TYPES: readonly ['user', 'system', 'plugin'];
export declare const LOG_TYPES: readonly [
  'MATCH_EVENT',
  'SCORE_SUBMISSION',
  'CONSTRAINT_VIOLATION',
  'PLAYER_MOVEMENT',
  'MANUAL_OVERRIDE',
];
export declare const LEADERBOARD_ENTITIES: readonly ['player', 'team'];
export declare const TARGET_ENTITIES: readonly ['TEAM', 'TOURNAMENT'];
export declare const PLAYER_ACTIONS: readonly ['JOINED', 'LEFT'];
export declare const AFFECTED_ENTITIES: readonly [
  'MATCH',
  'TEAM',
  'TOURNAMENT',
  'PHASE',
];
export declare const SCORE_SOURCES: readonly [
  'manual',
  'plugin',
  'admin_override',
];
//# sourceMappingURL=types.d.ts.map
