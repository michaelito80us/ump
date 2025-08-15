// Base service and types
export { BaseService } from './base.service';
export type { PaginatedResult, ListOptions } from './base.service';

// Database service
export { db } from './database';
export type { DatabaseTransaction } from './database';

// User service
export { UserService, userService } from './user.service';
export type {
  CreateUserInput,
  UpdateUserInput,
  UserWithRelations,
} from './user.service';

// Tournament service
export { TournamentService, tournamentService } from './tournament.service';
export type {
  CreateTournamentInput,
  UpdateTournamentInput,
  TournamentWithRelations,
} from './tournament.service';

// Team service
export { TeamService, teamService } from './team.service';
export type {
  CreateTeamInput,
  UpdateTeamInput,
  TeamWithRelations,
} from './team.service';

// Match service
export { MatchService, matchService } from './match.service';
export type {
  CreateMatchInput,
  UpdateMatchInput,
  MatchWithRelations,
} from './match.service';

// Audit logging integration
export * from './auditLogIntegration';
