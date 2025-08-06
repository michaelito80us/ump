import type { MatchStatus, Tournament, Match } from './types';
import {
  ValidationError,
  TournamentError,
  PermissionError,
  PluginExecutionError,
} from './types';
export * from './types';
export * as GraphQL from './generated';
export interface BaseConfig {
  version: string;
}
export declare const CORE_VERSION = '0.1.0';
export type {
  Team,
  Player,
  Match,
  Phase,
  Tournament,
  MatchStatus,
  AuditLog,
  TournamentConfig,
  MatchContext,
  TournamentContext,
  LeaderboardEntry,
  Invitation,
  JoinRequest,
  PlayerOverride,
  SchedulingConstraints,
  Slot,
} from './types';
export {
  TournamentError,
  ValidationError,
  PermissionError,
  PluginExecutionError,
};
export {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  INVITATION_TYPES,
  INVITATION_STATUSES,
  JOIN_REQUEST_STATUSES,
  ACTOR_TYPES,
  LOG_TYPES,
  LEADERBOARD_ENTITIES,
  TARGET_ENTITIES,
  PLAYER_ACTIONS,
  AFFECTED_ENTITIES,
  SCORE_SOURCES,
} from './types';
export declare const PACKAGE_NAME = '@ump/core';
export declare const PACKAGE_VERSION = '0.1.0';
export declare function isValidMatchStatus(
  status: string
): status is MatchStatus;
export declare function isValidTournamentStatus(
  status: string
): status is Tournament['status'];
export declare function assertMatch(obj: unknown): asserts obj is Match;
export declare function assertTournament(
  obj: unknown
): asserts obj is Tournament;
//# sourceMappingURL=index.d.ts.map
