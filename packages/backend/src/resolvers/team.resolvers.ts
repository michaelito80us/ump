import { db } from '../services/database';
import { GraphQLError } from 'graphql';

export const teamResolvers = {
  Query: {
    team: async (_: any, { id }: { id: string }) => {
      return await db.team.findUnique({
        where: { id },
      });
    },

    teams: async () => {
      return await db.team.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    myTeams: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.team.findMany({
        where: {
          OR: [
            {
              managers: {
                some: { id: context.user.id },
              },
            },
            {
              players: {
                some: { userId: context.user.id },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    createTeam: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.team.create({
        data: {
          ...input,
          managers: {
            connect: { id: context.user.id },
          },
        },
      });
    },

    updateTeam: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Check if user is a manager of the team
      const team = await db.team.findFirst({
        where: {
          id,
          managers: {
            some: { id: context.user.id },
          },
        },
      });

      if (!team) {
        throw new GraphQLError('Not authorized to update this team');
      }

      return await db.team.update({
        where: { id },
        data: input,
      });
    },

    deleteTeam: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const team = await db.team.findFirst({
        where: {
          id,
          managers: {
            some: { id: context.user.id },
          },
        },
      });

      if (!team) {
        throw new GraphQLError('Not authorized to delete this team');
      }

      await db.team.delete({
        where: { id },
      });

      return true;
    },

    joinTeam: async (_: any, { teamId }: { teamId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Check if user already has a player record
      let player = await db.player.findFirst({
        where: { userId: context.user.id },
      });

      if (!player) {
        // Create player record if it doesn't exist
        player = await db.player.create({
          data: {
            userId: context.user.id,
            sports: [], // Will be updated based on team sports
          },
        });
      }

      // Add player to team
      return await db.team.update({
        where: { id: teamId },
        data: {
          players: {
            connect: { id: player.id },
          },
        },
      });
    },

    leaveTeam: async (_: any, { teamId }: { teamId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const player = await db.player.findFirst({
        where: { userId: context.user.id },
      });

      if (!player) {
        throw new GraphQLError('Player record not found');
      }

      await db.team.update({
        where: { id: teamId },
        data: {
          players: {
            disconnect: { id: player.id },
          },
        },
      });

      return true;
    },
  },

  Team: {
    players: async (parent: any) => {
      return await db.player.findMany({
        where: {
          teams: {
            some: { id: parent.id },
          },
        },
      });
    },

    managers: async (parent: any) => {
      return await db.user.findMany({
        where: {
          teams: {
            some: { id: parent.id },
          },
        },
      });
    },

    tournaments: async (parent: any) => {
      return await db.tournament.findMany({
        where: {
          teams: {
            some: { id: parent.id },
          },
        },
      });
    },

    matches: async (parent: any) => {
      return await db.match.findMany({
        where: {
          OR: [{ teamAId: parent.id }, { teamBId: parent.id }],
        },
      });
    },
  },
};
