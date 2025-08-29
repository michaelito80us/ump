import { db } from '../services/database';
import { GraphQLError } from 'graphql';

export const tournamentResolvers = {
  Query: {
    tournament: async (_: any, { id }: { id: string }) => {
      return await db.tournament.findUnique({
        where: { id },
      });
    },

    tournaments: async () => {
      return await db.tournament.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    myTournaments: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }
      return await db.tournament.findMany({
        where: { creatorId: context.user.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    createTournament: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.tournament.create({
        data: {
          ...input,
          creatorId: context.user.id,
          status: 'NOT_STARTED',
        },
      });
    },

    updateTournament: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Check if user owns the tournament
      const tournament = await db.tournament.findUnique({
        where: { id },
      });

      if (!tournament || tournament.creatorId !== context.user.id) {
        throw new GraphQLError('Not authorized to update this tournament');
      }

      return await db.tournament.update({
        where: { id },
        data: input,
      });
    },

    deleteTournament: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const tournament = await db.tournament.findUnique({
        where: { id },
      });

      if (!tournament || tournament.creatorId !== context.user.id) {
        throw new GraphQLError('Not authorized to delete this tournament');
      }

      await db.tournament.delete({
        where: { id },
      });

      return true;
    },

    startTournament: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.tournament.update({
        where: { id },
        data: { status: 'LIVE' },
      });
    },

    completeTournament: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.tournament.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
    },
  },

  Subscription: {
    tournamentUpdated: {
      // Will implement with subscription server later
      subscribe: () => {
        throw new GraphQLError('Subscriptions not implemented yet');
      },
    },
  },

  Tournament: {
    creator: async (parent: any) => {
      return await db.user.findUnique({
        where: { id: parent.creatorId },
      });
    },

    teams: async (parent: any) => {
      return await db.team.findMany({
        where: {
          tournaments: {
            some: { id: parent.id },
          },
        },
      });
    },

    phases: async (parent: any) => {
      return await db.phase.findMany({
        where: { tournamentId: parent.id },
      });
    },

    playerStats: async (parent: any) => {
      return await db.playerStats.findMany({
        where: { tournamentId: parent.id },
      });
    },

    invitations: async (parent: any) => {
      return await db.invitation.findMany({
        where: { tournamentId: parent.id },
      });
    },

    joinRequests: async (parent: any) => {
      return await db.joinRequest.findMany({
        where: { entityId: parent.id, targetEntity: 'TOURNAMENT' },
      });
    },

    leaderboard: async (_parent: any) => {
      // This will be a computed field - we'll implement the logic later
      // For now, return empty array
      return [];
    },
  },

  Phase: {
    tournament: async (parent: any) => {
      return await db.tournament.findUnique({
        where: { id: parent.tournamentId },
      });
    },

    matches: async (parent: any) => {
      return await db.match.findMany({
        where: { phaseId: parent.id },
      });
    },
  },
};
