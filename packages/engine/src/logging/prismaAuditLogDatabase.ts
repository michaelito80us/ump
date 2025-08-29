import { AuditLogDatabase, AuditLogRecord } from './logService';

/**
 * Prisma-based implementation of AuditLogDatabase
 *
 * This adapter integrates with the existing Prisma database service
 * to persist audit logs to the PostgreSQL audit_logs table.
 */
export class PrismaAuditLogDatabase implements AuditLogDatabase {
  private db: any; // PrismaClient instance

  constructor(prismaClient: any) {
    this.db = prismaClient;
  }

  /**
   * Insert an audit log record into the database
   * Uses raw SQL to insert into the partitioned audit_logs table
   */
  async insertAuditLog(log: AuditLogRecord): Promise<void> {
    try {
      // Use raw SQL to insert into the partitioned table
      // This ensures compatibility with the partition trigger system
      await this.db.$executeRaw`
        INSERT INTO audit_logs (
          id, type, timestamp, actor_id, actor_type, message, data,
          tournament_id, phase_id, match_id, player_id, team_id,
          field, original_value, new_value, affected_entity, entity_id,
          context, approved_by_id, approval_note, approval_timestamp,
          source, score_a, score_b, breakdown, description, action, reason
        ) VALUES (
          ${log.id}::uuid,
          ${log.type},
          ${log.timestamp},
          ${log.actor_id ? log.actor_id + '::uuid' : null},
          ${log.actor_type},
          ${log.message},
          ${log.data ? JSON.stringify(log.data) : '{}'}::jsonb,
          ${log.tournament_id ? log.tournament_id + '::uuid' : null},
          ${log.phase_id ? log.phase_id + '::uuid' : null},
          ${log.match_id ? log.match_id + '::uuid' : null},
          ${log.player_id ? log.player_id + '::uuid' : null},
          ${log.team_id ? log.team_id + '::uuid' : null},
          ${log.field},
          ${log.original_value},
          ${log.new_value},
          ${log.affected_entity},
          ${log.entity_id ? log.entity_id + '::uuid' : null},
          ${log.context},
          ${log.approved_by_id ? log.approved_by_id + '::uuid' : null},
          ${log.approval_note},
          ${log.approval_timestamp},
          ${log.source},
          ${log.score_a},
          ${log.score_b},
          ${log.breakdown ? JSON.stringify(log.breakdown) : null}::jsonb,
          ${log.description},
          ${log.action},
          ${log.reason}
        )
      `;
    } catch (error) {
      // Enhanced error handling with context
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to insert audit log: ${errorMessage}`);
    }
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(): Promise<{
    totalLogs: number;
    logsByType: Record<string, number>;
    recentLogsCount: number;
  }> {
    try {
      // Get total count
      const totalResult = await this.db.$queryRaw`
        SELECT COUNT(*) as count FROM audit_logs
      `;
      const totalLogs = Number(totalResult[0]?.count || 0);

      // Get logs by type
      const typeResults = await this.db.$queryRaw`
        SELECT type, COUNT(*) as count 
        FROM audit_logs 
        GROUP BY type
      `;
      const logsByType: Record<string, number> = {};
      for (const result of typeResults) {
        logsByType[result.type] = Number(result.count);
      }

      // Get recent logs count (last 24 hours)
      const recentResult = await this.db.$queryRaw`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `;
      const recentLogsCount = Number(recentResult[0]?.count || 0);

      return {
        totalLogs,
        logsByType,
        recentLogsCount,
      };
    } catch (error) {
      throw new Error(`Failed to get audit log stats: ${error}`);
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async queryLogs(options: {
    type?: string;
    actorId?: string;
    tournamentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (options.type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(options.type);
        paramIndex++;
      }

      if (options.actorId) {
        whereClause += ` AND actor_id = $${paramIndex}::uuid`;
        params.push(options.actorId);
        paramIndex++;
      }

      if (options.tournamentId) {
        whereClause += ` AND tournament_id = $${paramIndex}::uuid`;
        params.push(options.tournamentId);
        paramIndex++;
      }

      if (options.startDate) {
        whereClause += ` AND timestamp >= $${paramIndex}`;
        params.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        whereClause += ` AND timestamp <= $${paramIndex}`;
        params.push(options.endDate);
        paramIndex++;
      }

      const limit = options.limit || 100;
      const offset = options.offset || 0;

      const query = `
        SELECT * FROM audit_logs 
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const results = await this.db.$queryRawUnsafe(query, ...params);

      return results.map((row: any) => ({
        id: row.id,
        type: row.type,
        timestamp: row.timestamp,
        actor_id: row.actor_id,
        actor_type: row.actor_type,
        message: row.message,
        data: row.data,
        tournament_id: row.tournament_id,
        phase_id: row.phase_id,
        match_id: row.match_id,
        player_id: row.player_id,
        team_id: row.team_id,
        field: row.field,
        original_value: row.original_value,
        new_value: row.new_value,
        affected_entity: row.affected_entity,
        entity_id: row.entity_id,
        context: row.context,
        approved_by_id: row.approved_by_id,
        approval_note: row.approval_note,
        approval_timestamp: row.approval_timestamp,
        source: row.source,
        score_a: row.score_a,
        score_b: row.score_b,
        breakdown: row.breakdown,
        description: row.description,
        action: row.action,
        reason: row.reason,
      }));
    } catch (error) {
      throw new Error(`Failed to query audit logs: ${error}`);
    }
  }
}

/**
 * Factory function to create a PrismaAuditLogDatabase instance
 */
export function createPrismaAuditLogDatabase(
  prismaClient: any
): PrismaAuditLogDatabase {
  return new PrismaAuditLogDatabase(prismaClient);
}
