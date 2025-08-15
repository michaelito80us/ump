import { describe, it, expect, beforeEach, jest } from '@jest/globals';
// LogService import removed as it's not used in tests

// Mock the LogService - must be defined before jest.mock
const mockLogService = {
  log: jest.fn() as jest.MockedFunction<any>,
  logMatchEvent: jest.fn() as jest.MockedFunction<any>,
  logScoreSubmission: jest.fn() as jest.MockedFunction<any>,
  logConstraintViolation: jest.fn() as jest.MockedFunction<any>,
  logPlayerMovement: jest.fn() as jest.MockedFunction<any>,
  logManualOverride: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@ump/engine', () => ({
  LogService: jest.fn().mockImplementation(() => mockLogService),
  getLogService: jest.fn(() => mockLogService),
  configureLogService: jest.fn(),
}));

import { auditLogger, createAuditContext } from '../auditLogIntegration';

describe('AuditLogIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditContext', () => {
    it('should create audit context with required fields', () => {
      const context = createAuditContext({ id: 'user-123' }, undefined, 'test');

      expect(context).toEqual({
        actorId: 'user-123',
        actorType: 'user',
        source: 'test',
      });
    });

    it('should create audit context with optional fields', () => {
      const context = createAuditContext(
        { id: 'user-123' },
        'tournament-456',
        'test'
      );

      expect(context).toEqual({
        actorId: 'user-123',
        actorType: 'user',
        tournamentId: 'tournament-456',
        source: 'test',
      });
    });
  });

  describe('AuditLogger', () => {
    describe('logUserOperation', () => {
      it('should log user CREATE operation', async () => {
        const context = createAuditContext(
          { id: 'admin-123' },
          undefined,
          'admin_panel'
        );

        const mockUser = {
          id: 'user-456',
          email: 'test@example.com',
          name: 'Test User',
          clerkId: 'clerk-123',
          avatar: null,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await auditLogger.logUserOperation('create', mockUser.id, context, {
          email: 'test@example.com',
        });

        expect(mockLogService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'MANUAL_OVERRIDE',
            timestamp: expect.any(Date),
            actorId: 'admin-123',
            actorType: 'user',
            field: 'user_create',
            originalValue: null,
            newValue: { email: 'test@example.com' },
            affectedEntity: 'TOURNAMENT',
            entityId: 'user-456',
            context: 'User create: user-456',
          }),
          {
            actorId: 'admin-123',
            actorType: 'user',
            tournamentId: undefined,
          }
        );
      });

      it('should log user UPDATE operation', async () => {
        const context = createAuditContext(
          { id: 'user-123' },
          undefined,
          'profile_update'
        );

        const mockUser = {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Updated User',
          clerkId: 'clerk-456',
          avatar: null,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await auditLogger.logUserOperation('update', mockUser.id, context, {
          updatedFields: ['name', 'email'],
        });

        expect(mockLogService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'MANUAL_OVERRIDE',
            timestamp: expect.any(Date),
            actorId: 'user-123',
            actorType: 'user',
            field: 'user_update',
            originalValue: null,
            newValue: { updatedFields: ['name', 'email'] },
            affectedEntity: 'TOURNAMENT',
            entityId: 'user-123',
            context: 'User update: user-123',
          }),
          {
            actorId: 'user-123',
            actorType: 'user',
            tournamentId: undefined,
          }
        );
      });
    });

    describe('logMatchOperation', () => {
      it('should log match CREATE operation', async () => {
        const context = createAuditContext(
          { id: 'admin-123' },
          'tournament-456',
          'tournament_setup'
        );

        const mockMatch = {
          id: 'match-789',
          teamAId: 'team-1',
          teamBId: 'team-2',
          scoreA: 0,
          scoreB: 0,
          breakdown: null,
          scheduledTime: null,
          status: 'SCHEDULED',
          venue: 'Court 1',
          phaseId: 'phase-123',
        };

        await auditLogger.logMatchOperation('create', mockMatch, context, {
          teamAId: 'team-1',
          teamBId: 'team-2',
        });

        expect(mockLogService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'MATCH_EVENT',
            timestamp: expect.any(Date),
            actorId: 'admin-123',
            actorType: 'user',
            matchId: 'match-789',
            change: expect.objectContaining({
              operation: 'create',
              scoreA: 0,
              scoreB: 0,
              status: 'SCHEDULED',
              venue: 'Court 1',
              teamAId: 'team-1',
              teamBId: 'team-2',
            }),
          }),
          {
            actorId: 'admin-123',
            actorType: 'user',
            tournamentId: 'tournament-456',
            matchId: 'match-789',
          }
        );
      });
    });

    describe('logScoreSubmission', () => {
      it('should log score submission', async () => {
        const context = createAuditContext(
          { id: 'user-123' },
          undefined,
          'mobile_app'
        );

        const mockMatch = {
          id: 'match-789',
          teamAId: 'team-1',
          teamBId: 'team-2',
          scoreA: 21,
          scoreB: 19,
          breakdown: null,
          scheduledTime: null,
          status: 'COMPLETED',
          venue: 'Court 1',
          phaseId: 'phase-123',
        };

        await auditLogger.logScoreSubmission(mockMatch, context, {
          newScoreA: 21,
          newScoreB: 19,
          breakdown: { set1: '21-19' },
        });

        expect(mockLogService.logScoreSubmission).toHaveBeenCalledWith(
          'match-789',
          'user-123',
          21,
          19,
          { set1: '21-19' },
          'manual',
          {
            actorId: 'user-123',
            actorType: 'user',
            matchId: 'match-789',
            tournamentId: undefined,
          }
        );
      });
    });

    describe('logTeamOperation', () => {
      it('should log team UPDATE operation', async () => {
        const context = createAuditContext(
          { id: 'manager-123' },
          undefined,
          'team_management'
        );

        const mockTeam = {
          id: 'team-456',
          name: 'Updated Team Name',
          description: 'Team description',
          sportIds: 'sport-1',
          seed: null,
          metadata: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await auditLogger.logTeamOperation('update', mockTeam.id, context, {
          name: 'Updated Team Name',
        });

        expect(mockLogService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'MANUAL_OVERRIDE',
            timestamp: expect.any(Date),
            actorId: 'manager-123',
            actorType: 'user',
            field: 'team_update',
            originalValue: null,
            newValue: { name: 'Updated Team Name' },
            affectedEntity: 'TEAM',
            entityId: 'team-456',
            context: 'Team update: team-456',
          }),
          {
            actorId: 'manager-123',
            actorType: 'user',
            teamId: 'team-456',
            tournamentId: undefined,
          }
        );
      });
    });

    describe('logTournamentOperation', () => {
      it('should log tournament UPDATE operation', async () => {
        const context = createAuditContext(
          { id: 'organizer-123' },
          undefined,
          'tournament_admin'
        );

        const mockTournament = {
          id: 'tournament-456',
          name: 'Test Tournament',
          description: 'Tournament description',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(),
          maxTeams: 16,
          isPublic: true,
          creatorId: 'creator-123',
          metadata: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          pluginId: 'test-plugin',
          sport: 'test-sport',
          config: '{}',
          isLocked: false,
        };

        await auditLogger.logTournamentOperation(
          'update',
          mockTournament.id,
          context,
          {
            status: 'ACTIVE',
          }
        );

        expect(mockLogService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            type: 'MANUAL_OVERRIDE',
            timestamp: expect.any(Date),
            actorId: 'organizer-123',
            actorType: 'user',
            field: 'tournament_update',
            originalValue: null,
            newValue: {
              status: 'ACTIVE',
            },
            affectedEntity: 'TOURNAMENT',
            entityId: 'tournament-456',
            context: 'Tournament update: tournament-456',
          }),
          {
            actorId: 'organizer-123',
            actorType: 'user',
            tournamentId: 'tournament-456',
          }
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should handle logging errors gracefully', async () => {
      mockLogService.logPlayerMovement.mockRejectedValue(
        new Error('Database connection failed')
      );

      const context = createAuditContext({ id: 'user-123' }, undefined, 'test');

      const mockUser = {
        id: 'user-456',
        email: 'test@example.com',
        name: 'Test User',
        clerkId: 'clerk-123',
        avatar: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should not throw even if logging fails
      await expect(
        auditLogger.logUserOperation('create', mockUser.id, context, {})
      ).resolves.not.toThrow();

      expect(mockLogService.log).toHaveBeenCalled();
    });
  });
});
