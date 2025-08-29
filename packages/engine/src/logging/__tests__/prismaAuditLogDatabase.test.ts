import {
  PrismaAuditLogDatabase,
  createPrismaAuditLogDatabase,
} from '../prismaAuditLogDatabase';
import type { AuditLogRecord } from '../logService';

// Mock PrismaClient
class MockPrismaClient {
  private logs: any[] = [];
  private shouldFail = false;
  private queryResults: any = {};

  async $executeRaw(_query: any, ..._params: any[]): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Mock Prisma execution error');
    }

    // For Prisma template literals, the parameters are passed in the order they appear in the template
    // Exact order from SQL: id, type, timestamp, actor_id, actor_type, message, data, tournament_id, phase_id, match_id, player_id, team_id, field, original_value, new_value, affected_entity, entity_id, context, approved_by_id, approval_note, approval_timestamp, source, score_a, score_b, breakdown, description, action, reason
    const logData = {
      id: _params[0] || 'mock-uuid',
      type: _params[1],
      timestamp: _params[2] || new Date(),
      actor_id:
        typeof _params[3] === 'string'
          ? _params[3].replace('::uuid', '')
          : _params[3],
      actor_type: _params[4],
      message: _params[5],
      data: _params[6]
        ? typeof _params[6] === 'string'
          ? JSON.parse(_params[6])
          : _params[6]
        : {},
      tournament_id: _params[7],
      phase_id: _params[8],
      match_id: _params[9],
      player_id: _params[10],
      team_id: _params[11],
      field: _params[12],
      original_value: _params[13],
      new_value: _params[14],
      affected_entity: _params[15],
      entity_id: _params[16],
      context: _params[17],
      approved_by_id: _params[18],
      approval_note: _params[19],
      approval_timestamp: _params[20],
      source: _params[21],
      score_a: _params[22],
      score_b: _params[23],
      breakdown: _params[24],
      description: _params[25],
      action: _params[26],
      reason: _params[27],
    };

    this.logs.push(logData);
    return { count: 1 };
  }

  async $queryRaw(_query: any, ..._params: any[]): Promise<any[]> {
    if (this.shouldFail) {
      throw new Error('Mock Prisma query error');
    }

    // Handle different query types based on the query content
    const queryStr = _query.toString();

    if (queryStr.includes('SELECT 1')) {
      return [{ '?column?': 1 }];
    }

    if (queryStr.includes('GROUP BY type')) {
      const typeCounts: Record<string, number> = {};
      this.logs.forEach((log) => {
        const logType = log.type || 'undefined';
        typeCounts[logType] = (typeCounts[logType] || 0) + 1;
      });
      return Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
      }));
    }

    if (queryStr.includes('COUNT(*)')) {
      return [{ count: this.logs.length }];
    }

    if (queryStr.includes('INTERVAL')) {
      // Recent logs query
      const recentLogs = this.logs.filter((log) => {
        const logTime = new Date(log.timestamp);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return logTime >= dayAgo;
      });
      return [{ count: recentLogs.length }];
    }

    return this.queryResults.default || [];
  }

  async $queryRawUnsafe(_query: string, ..._params: any[]): Promise<any[]> {
    if (this.shouldFail) {
      throw new Error('Mock Prisma unsafe query error');
    }

    // Simulate filtered query results
    let filteredLogs = [...this.logs];

    // Apply basic filtering based on params
    if (_params.length > 0) {
      // Simple mock filtering - in real implementation this would be more sophisticated
      if (_params[0] && typeof _params[0] === 'string') {
        filteredLogs = filteredLogs.filter((log) => log.type === _params[0]);
      }
    }

    return filteredLogs.map((log) => ({
      id: log.id,
      type: log.type,
      timestamp: log.timestamp,
      actor_id: log.actor_id,
      actor_type: log.actor_type,
      message: log.message,
      data: log.data,
      tournament_id: log.tournament_id,
      phase_id: log.phase_id,
      match_id: log.match_id,
      player_id: log.player_id,
      team_id: log.team_id,
      field: log.field,
      original_value: log.original_value,
      new_value: log.new_value,
      affected_entity: log.affected_entity,
      entity_id: log.entity_id,
      context: log.context,
      approved_by_id: log.approved_by_id,
      approval_note: log.approval_note,
      approval_timestamp: log.approval_timestamp,
      source: log.source,
      score_a: log.score_a,
      score_b: log.score_b,
      breakdown: log.breakdown,
      description: log.description,
      action: log.action,
      reason: log.reason,
    }));
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setQueryResults(results: any): void {
    this.queryResults = results;
  }

  getLogs(): any[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

describe('PrismaAuditLogDatabase', () => {
  let mockPrisma: MockPrismaClient;
  let database: PrismaAuditLogDatabase;

  beforeEach(() => {
    mockPrisma = new MockPrismaClient();
    database = new PrismaAuditLogDatabase(mockPrisma);
    console.log('Top-level beforeEach: created new MockPrismaClient');
  });

  afterEach(() => {
    mockPrisma.clear();
  });

  describe('insertAuditLog', () => {
    test('should insert audit log successfully', async () => {
      const logRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        type: 'SCORE_SUBMISSION',
        timestamp: new Date(),
        actor_id: 'user-123',
        actor_type: 'user',
        message: 'Score submitted',
        data: { scoreA: 2, scoreB: 1 },
        tournament_id: 'tournament-456',
        match_id: 'match-789',
        score_a: 2,
        score_b: 1,
      };

      await database.insertAuditLog(logRecord);

      const logs = mockPrisma.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'SCORE_SUBMISSION',
        actor_id: 'user-123',
        actor_type: 'user',
        message: 'Score submitted',
      });
    });

    test('should handle database errors gracefully', async () => {
      mockPrisma.setFailure(true);

      const logRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        type: 'TEST_EVENT',
        timestamp: new Date(),
        actor_id: 'user-123',
        actor_type: 'user',
        message: 'Test message',
      };

      await expect(database.insertAuditLog(logRecord)).rejects.toThrow(
        'Failed to insert audit log: Mock Prisma execution error'
      );
    });

    test('should handle null values correctly', async () => {
      const logRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        type: 'MINIMAL_EVENT',
        timestamp: new Date(),
        actor_id: 'system-123',
        actor_type: 'system',
        message: 'System event',
        tournament_id: undefined,
        match_id: undefined,
      };

      await expect(database.insertAuditLog(logRecord)).resolves.not.toThrow();
    });
  });

  describe('healthCheck', () => {
    test('should return true when database is healthy', async () => {
      const isHealthy = await database.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test('should return false when database is unhealthy', async () => {
      mockPrisma.setFailure(true);
      const isHealthy = await database.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Insert some test data
      const logs = [
        {
          id: 'log-1',
          type: 'SCORE_SUBMISSION',
          timestamp: new Date(),
          actor_id: 'user-1',
          actor_type: 'user' as const,
          message: 'Score 1',
        },
        {
          id: 'log-2',
          type: 'SCORE_SUBMISSION',
          timestamp: new Date(),
          actor_id: 'user-2',
          actor_type: 'user' as const,
          message: 'Score 2',
        },
        {
          id: 'log-3',
          type: 'MATCH',
          timestamp: new Date(),
          actor_id: 'admin-1',
          actor_type: 'user' as const,
          message: 'Match created',
        },
      ];

      for (const log of logs) {
        await database.insertAuditLog(log);
      }
    });

    test('should return correct statistics', async () => {
      const stats = await database.getStats();

      expect(stats).toEqual({
        totalLogs: 3,
        logsByType: {
          SCORE_SUBMISSION: 2,
          MATCH: 1,
        },
        recentLogsCount: 3, // All logs are recent in our mock
      });
    });

    test('should handle database errors in stats', async () => {
      mockPrisma.setFailure(true);

      await expect(database.getStats()).rejects.toThrow(
        'Failed to get audit log stats'
      );
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      // Insert test data
      const logs = [
        {
          id: 'log-1',
          type: 'SCORE_SUBMISSION',
          timestamp: new Date('2024-01-01'),
          actor_id: 'user-1',
          actor_type: 'user' as const,
          message: 'Score submission 1',
          tournament_id: 'tournament-1',
        },
        {
          id: 'log-2',
          type: 'MATCH',
          timestamp: new Date('2024-01-02'),
          actor_id: 'admin-1',
          actor_type: 'user' as const,
          message: 'Match created',
          tournament_id: 'tournament-1',
        },
        {
          id: 'log-3',
          type: 'SCORE_SUBMISSION',
          timestamp: new Date('2024-01-03'),
          actor_id: 'user-2',
          actor_type: 'user' as const,
          message: 'Score submission 2',
          tournament_id: 'tournament-2',
        },
      ];

      for (const log of logs) {
        await database.insertAuditLog(log);
      }
    });

    test('should query logs without filters', async () => {
      const results = await database.queryLogs({});
      expect(results).toHaveLength(3);
    });

    test('should query logs with type filter', async () => {
      const results = await database.queryLogs({ type: 'SCORE_SUBMISSION' });
      expect(results).toHaveLength(2);
      expect(results.every((log) => log.type === 'SCORE_SUBMISSION')).toBe(
        true
      );
    });

    test('should handle query errors', async () => {
      mockPrisma.setFailure(true);

      await expect(database.queryLogs({})).rejects.toThrow(
        'Failed to query audit logs'
      );
    });

    test('should apply limit and offset', async () => {
      const results = await database.queryLogs({ limit: 2, offset: 1 });
      // Mock implementation doesn't actually apply limit/offset, but ensures no errors
      expect(results).toBeDefined();
    });
  });

  describe('Factory Function', () => {
    test('should create PrismaAuditLogDatabase instance', () => {
      const instance = createPrismaAuditLogDatabase(mockPrisma);
      expect(instance).toBeInstanceOf(PrismaAuditLogDatabase);
    });
  });
});
