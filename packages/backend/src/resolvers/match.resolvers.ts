import { db } from '../services/database';
import { GraphQLError } from 'graphql';
import { ValidationError } from '@ump/core';

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

      try {
        // Update match score using service (includes deduplication guard)
        const { matchService } = await import('../services');
        const updatedMatch = await matchService.updateScore(
          id,
          input.scoreA,
          input.scoreB,
          input.breakdown,
          context.user.id
        );

        // Update other match properties if needed
        if (input.status) {
          return await matchService.update(
            id,
            { status: input.status },
            {
              actorId: context.user.id,
              actorType: 'user',
              tournamentId: match.phase.tournament.id,
              source: 'graphql_score_update',
            }
          );
        }

        return updatedMatch;
      } catch (error: any) {
        // Handle duplicate submission errors with proper HTTP status
        if (
          error instanceof ValidationError &&
          error.code === 'DUPLICATE_SCORE_SUBMISSION'
        ) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: 'DUPLICATE_SCORE_SUBMISSION',
              http: { status: 409 },
            },
          });
        }
        throw error;
      }
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
