import { db } from '../services/database';
import { GraphQLError } from 'graphql';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }
      return await db.user.findUnique({
        where: { id: context.user.id },
      });
    },

    user: async (_: any, { id }: { id: string }) => {
      return await db.user.findUnique({
        where: { id },
      });
    },

    users: async () => {
      return await db.user.findMany();
    },
  },

  Mutation: {
    // User mutations will be added later
  },

  User: {
    players: async (parent: any) => {
      return await db.player.findMany({
        where: { userId: parent.id },
      });
    },

    teams: async (parent: any) => {
      return await db.team.findMany({
        where: {
          managers: {
            some: { id: parent.id },
          },
        },
      });
    },

    tournaments: async (parent: any) => {
      return await db.tournament.findMany({
        where: { creatorId: parent.id },
      });
    },

    invitations: async (parent: any) => {
      return await db.invitation.findMany({
        where: { senderUserId: parent.id },
      });
    },

    joinRequests: async (parent: any) => {
      return await db.joinRequest.findMany({
        where: { requesterUserId: parent.id },
      });
    },
  },

  Player: {
    user: async (parent: any) => {
      return await db.user.findUnique({
        where: { id: parent.userId },
      });
    },

    teams: async (parent: any) => {
      return await db.team.findMany({
        where: {
          players: {
            some: { id: parent.id },
          },
        },
      });
    },

    stats: async (parent: any) => {
      return await db.playerStats.findMany({
        where: { playerId: parent.id },
      });
    },
  },

  PlayerStats: {
    player: async (parent: any) => {
      return await db.player.findUnique({
        where: { id: parent.playerId },
      });
    },

    tournament: async (parent: any) => {
      return await db.tournament.findUnique({
        where: { id: parent.tournamentId },
      });
    },
  },
};
