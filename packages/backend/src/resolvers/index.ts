import { userResolvers } from './user.resolvers';
import { tournamentResolvers } from './tournament.resolvers';
import { teamResolvers } from './team.resolvers';
import { matchResolvers } from './match.resolvers';
import { governanceResolvers } from './governance.resolvers';
import { scalarResolvers } from './scalar.resolvers';

export const resolvers = {
  ...scalarResolvers,
  Query: {
    ...userResolvers.Query,
    ...tournamentResolvers.Query,
    ...teamResolvers.Query,
    ...matchResolvers.Query,
    ...governanceResolvers.Query,
    health: () => 'OK',
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...tournamentResolvers.Mutation,
    ...teamResolvers.Mutation,
    ...matchResolvers.Mutation,
    ...governanceResolvers.Mutation,
  },
  Subscription: {
    ...tournamentResolvers.Subscription,
    ...matchResolvers.Subscription,
    ...governanceResolvers.Subscription,
  },
  // Type resolvers
  User: userResolvers.User,
  Tournament: tournamentResolvers.Tournament,
  Team: teamResolvers.Team,
  Match: matchResolvers.Match,
  Phase: tournamentResolvers.Phase,
  Player: userResolvers.Player,
  PlayerStats: userResolvers.PlayerStats,
  Invitation: governanceResolvers.Invitation,
  JoinRequest: governanceResolvers.JoinRequest,
  AuditLog: governanceResolvers.AuditLog,
};
