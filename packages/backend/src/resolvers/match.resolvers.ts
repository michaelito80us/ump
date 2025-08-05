import { db } from '../services/database';
import { GraphQLError } from 'graphql';

export const matchResolvers = {
  Query: {
    match: async (_: any, { id }: { id: string }) => {
      return await db.match.findUnique({
        where: { id },
      });
    },

    matches: async (_: any, { tournamentId }: { tournamentId?: string }) => {
      const where = tournamentId
        ? {
            phase: {
              tournamentId,
            },
          }
        : {};

      return await db.match.findMany({
        where,
        orderBy: { scheduledTime: 'asc' },
      });
    },
  },

  Mutation: {
    createMatch: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Verify the phase exists and user has permission
      const phase = await db.phase.findUnique({
        where: { id: input.phaseId },
        include: {
          tournament: true,
        },
      });

      if (!phase) {
        throw new GraphQLError('Phase not found');
      }

      if (phase.tournament.creatorId !== context.user.id) {
        throw new GraphQLError(
          'Not authorized to create matches in this tournament'
        );
      }

      return await db.match.create({
        data: {
          ...input,
          status: 'PENDING',
        },
      });
    },

    updateMatchScore: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const match = await db.match.findUnique({
        where: { id },
        include: {
          phase: {
            include: {
              tournament: true,
            },
          },
        },
      });

      if (!match) {
        throw new GraphQLError('Match not found');
      }

      // Check if user has permission to update scores
      const canUpdate =
        match.phase.tournament.creatorId === context.user.id ||
        // Add logic for team managers/players to submit scores
        (await db.team.findFirst({
          where: {
            OR: [{ id: match.teamAId }, { id: match.teamBId }],
            managers: {
              some: { id: context.user.id },
            },
          },
        }));

      if (!canUpdate) {
        throw new GraphQLError('Not authorized to update this match score');
      }

      // Create score audit record
      await db.matchScoreAudit.create({
        data: {
          matchId: id,
          submittedBy: context.user.id,
          breakdown: input.breakdown || {},
          scoreA: input.scoreA,
          scoreB: input.scoreB,
          source: 'MANUAL',
        },
      });

      // Update match
      return await db.match.update({
        where: { id },
        data: {
          scoreA: input.scoreA,
          scoreB: input.scoreB,
          breakdown: input.breakdown,
          status: 'NEEDS_APPROVAL', // Require approval for score changes
        },
      });
    },

    approveMatch: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const match = await db.match.findUnique({
        where: { id },
        include: {
          phase: {
            include: {
              tournament: true,
            },
          },
        },
      });

      if (!match) {
        throw new GraphQLError('Match not found');
      }

      // Only tournament creator can approve matches
      if (match.phase.tournament.creatorId !== context.user.id) {
        throw new GraphQLError('Not authorized to approve this match');
      }

      return await db.match.update({
        where: { id },
        data: {
          status: 'FINAL',
        },
      });
    },
  },

  Subscription: {
    matchUpdated: {
      // Will implement with subscription server later
      subscribe: () => {
        throw new GraphQLError('Subscriptions not implemented yet');
      },
    },

    matchScoreUpdated: {
      // Will implement with subscription server later
      subscribe: () => {
        throw new GraphQLError('Subscriptions not implemented yet');
      },
    },
  },

  Match: {
    phase: async (parent: any) => {
      return await db.phase.findUnique({
        where: { id: parent.phaseId },
      });
    },

    teamA: async (parent: any) => {
      return await db.team.findUnique({
        where: { id: parent.teamAId },
      });
    },

    teamB: async (parent: any) => {
      return await db.team.findUnique({
        where: { id: parent.teamBId },
      });
    },

    scoreAudits: async (parent: any) => {
      return await db.matchScoreAudit.findMany({
        where: { matchId: parent.id },
        orderBy: { submittedAt: 'desc' },
      });
    },
  },
};
