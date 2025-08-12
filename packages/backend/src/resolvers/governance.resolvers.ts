import { db } from '../services/database';
import { GraphQLError } from 'graphql';
import { randomBytes } from 'crypto';

export const governanceResolvers = {
  Query: {
    invitations: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.invitation.findMany({
        where: {
          OR: [
            { senderUserId: context.user.id },
            { recipientUserId: context.user.id },
            { recipientEmail: context.user.email },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    joinRequests: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Get team IDs where user is a manager
      const managedTeams = await db.team.findMany({
        where: {
          managers: {
            some: { id: context.user.id },
          },
        },
        select: { id: true },
      });

      const managedTeamIds = managedTeams.map(
        (team: { id: string }) => team.id
      );

      return await db.joinRequest.findMany({
        where: {
          OR: [
            { requesterUserId: context.user.id },
            // User can see join requests for tournaments they created
            {
              tournament: {
                creatorId: context.user.id,
              },
            },
            // User can see join requests for teams they manage
            {
              targetEntity: 'TEAM',
              entityId: {
                in: managedTeamIds,
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    auditLogs: async (
      _: any,
      { tournamentId }: { tournamentId?: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const where: any = {
        actorId: context.user.id,
      };

      if (tournamentId) {
        // Verify user has access to this tournament
        const tournament = await db.tournament.findFirst({
          where: {
            id: tournamentId,
            OR: [
              { creatorId: context.user.id },
              {
                teams: {
                  some: {
                    managers: {
                      some: { id: context.user.id },
                    },
                  },
                },
              },
            ],
          },
        });

        if (!tournament) {
          throw new GraphQLError(
            'Not authorized to view audit logs for this tournament'
          );
        }

        where.tournamentId = tournamentId;
      }

      return await db.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100, // Limit to recent logs
      });
    },
  },

  Mutation: {
    sendInvitation: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      // Generate unique token
      const token = randomBytes(32).toString('hex');

      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return await db.invitation.create({
        data: {
          ...input,
          senderUserId: context.user.id,
          token,
          expiresAt,
          status: 'PENDING',
        },
      });
    },

    acceptInvitation: async (
      _: any,
      { token }: { token: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const invitation = await db.invitation.findUnique({
        where: { token },
      });

      if (!invitation) {
        throw new GraphQLError('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new GraphQLError('Invitation is no longer valid');
      }

      if (invitation.expiresAt < new Date()) {
        await db.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new GraphQLError('Invitation has expired');
      }

      // Verify the invitation is for this user
      if (
        invitation.recipientUserId &&
        invitation.recipientUserId !== context.user.id
      ) {
        throw new GraphQLError('This invitation is not for you');
      }

      if (
        invitation.recipientEmail &&
        invitation.recipientEmail !== context.user.email
      ) {
        throw new GraphQLError('This invitation is not for you');
      }

      // Process the invitation based on type
      switch (invitation.type) {
        case 'TEAM_PLAYER':
          if (invitation.teamId) {
            // Create or find player record
            let player = await db.player.findFirst({
              where: { userId: context.user.id },
            });

            if (!player) {
              player = await db.player.create({
                data: {
                  userId: context.user.id,
                  sports: '',
                },
              });
            }

            // Add player to team
            await db.team.update({
              where: { id: invitation.teamId },
              data: {
                players: {
                  connect: { id: player.id },
                },
              },
            });
          }
          break;

        case 'TOURNAMENT_TEAM':
          if (invitation.tournamentId && invitation.teamId) {
            // Add team to tournament
            await db.tournament.update({
              where: { id: invitation.tournamentId },
              data: {
                teams: {
                  connect: { id: invitation.teamId },
                },
              },
            });
          }
          break;

        // Add other invitation types as needed
      }

      // Mark invitation as accepted
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return true;
    },

    rejectInvitation: async (
      _: any,
      { token }: { token: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const invitation = await db.invitation.findUnique({
        where: { token },
      });

      if (!invitation) {
        throw new GraphQLError('Invitation not found');
      }

      // Verify the invitation is for this user
      if (
        invitation.recipientUserId &&
        invitation.recipientUserId !== context.user.id
      ) {
        throw new GraphQLError('This invitation is not for you');
      }

      if (
        invitation.recipientEmail &&
        invitation.recipientEmail !== context.user.email
      ) {
        throw new GraphQLError('This invitation is not for you');
      }

      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'REVOKED' },
      });

      return true;
    },

    createJoinRequest: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      return await db.joinRequest.create({
        data: {
          ...input,
          requesterUserId: context.user.id,
          status: 'PENDING',
        },
      });
    },

    approveJoinRequest: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const joinRequest = await db.joinRequest.findUnique({
        where: { id },
        include: {
          tournament: true,
        },
      });

      if (!joinRequest) {
        throw new GraphQLError('Join request not found');
      }

      // Check authorization based on target entity
      let authorized = false;

      if (joinRequest.targetEntity === 'TOURNAMENT' && joinRequest.tournament) {
        authorized = joinRequest.tournament.creatorId === context.user.id;
      } else if (joinRequest.targetEntity === 'TEAM') {
        const team = await db.team.findFirst({
          where: {
            id: joinRequest.entityId,
            managers: {
              some: { id: context.user.id },
            },
          },
        });
        authorized = !!team;
      }

      if (!authorized) {
        throw new GraphQLError('Not authorized to approve this join request');
      }

      await db.joinRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      return true;
    },

    rejectJoinRequest: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }

      const joinRequest = await db.joinRequest.findUnique({
        where: { id },
        include: {
          tournament: true,
        },
      });

      if (!joinRequest) {
        throw new GraphQLError('Join request not found');
      }

      // Check authorization (same logic as approve)
      let authorized = false;

      if (joinRequest.targetEntity === 'TOURNAMENT' && joinRequest.tournament) {
        authorized = joinRequest.tournament.creatorId === context.user.id;
      } else if (joinRequest.targetEntity === 'TEAM') {
        const team = await db.team.findFirst({
          where: {
            id: joinRequest.entityId,
            managers: {
              some: { id: context.user.id },
            },
          },
        });
        authorized = !!team;
      }

      if (!authorized) {
        throw new GraphQLError('Not authorized to reject this join request');
      }

      await db.joinRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      return true;
    },
  },

  Subscription: {
    invitationReceived: {
      // Will implement with subscription server later
      subscribe: () => {
        throw new GraphQLError('Subscriptions not implemented yet');
      },
    },

    joinRequestReceived: {
      // Will implement with subscription server later
      subscribe: () => {
        throw new GraphQLError('Subscriptions not implemented yet');
      },
    },
  },

  Invitation: {
    sender: async (parent: any) => {
      return await db.user.findUnique({
        where: { id: parent.senderUserId },
      });
    },

    tournament: async (parent: any) => {
      if (!parent.tournamentId) return null;
      return await db.tournament.findUnique({
        where: { id: parent.tournamentId },
      });
    },
  },

  JoinRequest: {
    requester: async (parent: any) => {
      return await db.user.findUnique({
        where: { id: parent.requesterUserId },
      });
    },

    tournament: async (parent: any) => {
      if (parent.targetEntity !== 'TOURNAMENT') return null;
      return await db.tournament.findUnique({
        where: { id: parent.entityId },
      });
    },
  },

  AuditLog: {
    actor: async (parent: any) => {
      return await db.user.findUnique({
        where: { id: parent.actorId },
      });
    },

    tournament: async (parent: any) => {
      if (!parent.tournamentId) return null;
      return await db.tournament.findUnique({
        where: { id: parent.tournamentId },
      });
    },
  },
};
