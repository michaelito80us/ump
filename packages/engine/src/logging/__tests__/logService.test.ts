import {
  LogService,
  configureLogService,
  getLogService,
  log,
} from '../logService';
import type { AuditLogDatabase, AuditLogRecord } from '../logService';

// Mock database implementation for testing
class MockAuditLogDatabase implements AuditLogDatabase {
  private logs: AuditLogRecord[] = [];
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  async insertAuditLog(log: AuditLogRecord): Promise<void> {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error('Mock database failure');
    }
    this.logs.push({ ...log });
  }

  async healthCheck(): Promise<boolean> {
    return !this.shouldFail;
  }

  getLogs(): AuditLogRecord[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.failureCount = 0;
  }

  setFailure(shouldFail: boolean, maxFailures = 1): void {
    this.shouldFail = shouldFail;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
  }
}

describe('LogService', () => {
  let mockDb: MockAuditLogDatabase;
  let logService: LogService;

  beforeEach(() => {
    mockDb = new MockAuditLogDatabase();
    logService = new LogService({
      database: mockDb,
      retryAttempts: 3,
      retryDelay: 10, // Short delay for tests
    });
  });

  afterEach(() => {
    mockDb.clear();
  });

  describe('Basic Logging Functionality', () => {
    test('should log a basic audit event', async () => {
      const context = {
        actorId: 'user-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
      };

      await logService.log(
        {
          id: 'test-log-1',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'Match created successfully',
          matchId: 'match-123',
          change: { status: 'pending' },
        },
        context
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'MATCH_EVENT',
        message: 'Match created successfully',
        actor_id: 'user-123',
        actor_type: 'user',
        tournament_id: 'tournament-456',
        match_id: 'match-123',
      });
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });

    test('should generate unique IDs for each log entry', async () => {
      const context = { actorId: 'user-123', actorType: 'user' as const };

      await logService.log(
        {
          id: 'test-log-1',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'First event',
          matchId: 'match-1',
          change: {},
        },
        context
      );
      await logService.log(
        {
          id: 'test-log-2',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'Second event',
          matchId: 'match-2',
          change: {},
        },
        context
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    test('should include all context fields in log record', async () => {
      const context = {
        actorId: 'user-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
        phaseId: 'phase-789',
        matchId: 'match-101',
        playerId: 'player-202',
        teamId: 'team-303',
        data: { custom: 'field', number: 42 },
      };

      await logService.log(
        {
          id: 'test-log-complex',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'Complex event with all fields',
          matchId: context.matchId,
          change: { status: 'live' },
        },
        context
      );

      const logs = mockDb.getLogs();
      expect(logs[0]).toMatchObject({
        type: 'MATCH_EVENT',
        message: 'Complex event with all fields',
        actor_id: 'user-123',
        actor_type: 'user',
        tournament_id: 'tournament-456',
        phase_id: 'phase-789',
        match_id: 'match-101',
        player_id: 'player-202',
        team_id: 'team-303',
      });
    });
  });

  describe('Specific Event Types', () => {
    test('should log SCORE_SUBMISSION events correctly', async () => {
      const context = {
        actorId: 'referee-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
        matchId: 'match-789',
        data: {
          scoreA: 2,
          scoreB: 1,
          submissionTime: new Date().toISOString(),
        },
      };

      await logService.logScoreSubmission(
        context.matchId,
        'referee-123',
        2,
        1,
        { teamA: { score: 2 }, teamB: { score: 1 } },
        'manual',
        context
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'SCORE_SUBMISSION',
        message: 'Score submitted for match',
        match_id: 'match-789',
        score_a: 2,
        score_b: 1,
        actor_id: 'referee-123',
        actor_type: 'user',
        tournament_id: 'tournament-456',
      });
    });

    test('should log MATCH events correctly', async () => {
      const context = {
        actorId: 'admin-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
        matchId: 'match-789',
      };

      await logService.logMatchEvent(context.matchId, 'STARTED', context);

      const logs = mockDb.getLogs();
      expect(logs[0]).toMatchObject({
        type: 'MATCH',
        message: 'Match started',
        match_id: 'match-789',
        action: 'STARTED',
      });
    });

    test('should log CONSTRAINT_VIOLATION events correctly', async () => {
      const context = {
        actorId: 'system',
        actorType: 'system' as const,
        tournamentId: 'tournament-456',
      };

      await logService.logConstraintViolation(
        'team_size_limit',
        'Team exceeds maximum size',
        context
      );

      const logs = mockDb.getLogs();
      expect(logs[0]).toMatchObject({
        type: 'CONSTRAINT_VIOLATION',
        message: 'Team size constraint violated',
        field: 'team_size_limit',
        description: 'Team exceeds maximum size',
        actor_type: 'system',
      });
    });

    test('should log PLAYER_MOVEMENT events correctly', async () => {
      const context = {
        actorId: 'admin-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
        playerId: 'player-789',
        teamId: 'team-101',
      };

      await logService.logPlayerMovement(
        context.playerId,
        context.teamId,
        'JOINED',
        context.tournamentId,
        'Transfer request',
        context
      );

      const logs = mockDb.getLogs();
      expect(logs[0]).toMatchObject({
        type: 'PLAYER_MOVEMENT',
        message: 'Player transferred to new team',
        player_id: 'player-789',
        original_value: 'team-old',
        new_value: 'team-new',
      });
    });

    test('should log MANUAL_OVERRIDE events correctly', async () => {
      const context = {
        actorId: 'admin-123',
        actorType: 'user' as const,
        tournamentId: 'tournament-456',
        approvedById: 'supervisor-456',
      };

      await logService.logManualOverride(
        'score',
        { teamA: 1, teamB: 2 },
        { teamA: 2, teamB: 1 },
        'MATCH',
        'match-123',
        'Score correction due to referee error',
        context,
        context.approvedById
      );

      const logs = mockDb.getLogs();
      expect(logs[0]).toMatchObject({
        type: 'MANUAL_OVERRIDE',
        message: 'Score manually corrected',
        action: 'score_correction',
        reason: 'Referee error correction',
        approved_by_id: 'supervisor-456',
      });
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should retry on database failures', async () => {
      mockDb.setFailure(true, 2); // Fail first 2 attempts, succeed on 3rd

      const context = { actorId: 'user-123', actorType: 'user' as const };
      await logService.log(
        {
          id: 'retry-test-1',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'Testing retry logic',
          matchId: 'match-retry',
          change: {},
        },
        context
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('MATCH_EVENT');
    });

    test('should throw error after max retry attempts', async () => {
      mockDb.setFailure(true, 5); // Fail more than max retries

      const context = { actorId: 'user-123', actorType: 'user' as const };

      await expect(
        logService.log(
          {
            id: 'fail-test-1',
            type: 'MATCH_EVENT',
            timestamp: new Date(),
            actorId: context.actorId,
            actorType: context.actorType,
            message: 'This should fail',
            matchId: 'match-fail',
            change: {},
          },
          context
        )
      ).rejects.toThrow('Failed to log audit event after 3 attempts');

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(0);
    });

    test('should handle missing optional context fields gracefully', async () => {
      const minimalContext = {
        actorId: 'user-123',
        actorType: 'user' as const,
      };

      await logService.log(
        {
          id: 'minimal-test-1',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: minimalContext.actorId,
          actorType: minimalContext.actorType,
          message: 'Minimal context test',
          matchId: 'match-minimal',
          change: {},
        },
        minimalContext
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'MATCH_EVENT',
        message: 'Minimal context test',
        actor_id: 'user-123',
        actor_type: 'user',
      });
      expect(logs[0].tournament_id).toBeUndefined();
      expect(logs[0].match_id).toBeUndefined();
    });
  });

  describe('Global Configuration', () => {
    test('should configure global log service', () => {
      const config = {
        database: mockDb,
        maxRetries: 5,
        retryDelay: 100,
      };

      configureLogService(config);
      const globalService = getLogService();

      expect(globalService).toBeInstanceOf(LogService);
    });

    test('should use global log function', async () => {
      configureLogService({ database: mockDb });

      const context = { actorId: 'user-123', actorType: 'user' as const };
      await log(
        {
          id: 'global-test-1',
          type: 'MATCH_EVENT',
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          message: 'Testing global log function',
          matchId: 'match-global',
          change: {},
        },
        context
      );

      const logs = mockDb.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('MATCH_EVENT');
    });

    test('should throw error when using global service without configuration', () => {
      // Reset global service
      configureLogService(null as any);

      expect(() => getLogService()).toThrow(
        'LogService not configured. Call configureLogService() first.'
      );
    });
  });

  describe('Health Check', () => {
    test('should return healthy status when database is available', async () => {
      const isHealthy = await logService.isHealthy();
      expect(isHealthy).toBe(true);
    });

    test('should return unhealthy status when database is unavailable', async () => {
      mockDb.setFailure(true);
      const isHealthy = await logService.isHealthy();
      expect(isHealthy).toBe(false);
    });
  });
});
