// Re-export all generated GraphQL types and hooks
// Note: This will be populated after running `pnpm codegen`
export * from './graphql';

// Placeholder exports until codegen runs
export type GraphQLTournament = any;
export type GraphQLMatch = any;
export type GraphQLTeam = any;
export type GraphQLPlayer = any;
export type GraphQLPhase = any;

// Export commonly used types for convenience
export type {
  Tournament,
  Match,
  Team,
  Player,
  Phase,
  TournamentStatus,
  MatchStatus,
  PhaseStatus,
  PlayerRole,
  LeaderboardEntry,
} from './graphql';
