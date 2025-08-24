export * from './types';
import type { MatchStatus, Tournament, Match } from './types';
export * as GraphQL from './generated';
export {
  ClerkClientUtils,
  AuthenticationError,
  AuthorizationError,
  type UserContext,
} from './auth/clerkClient';
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';
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
