import type { AuditLog } from '@ump/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database interface for audit log persistence
 * This will be implemented by the consuming application
 */
export interface AuditLogDatabase {
  /**
   * Insert an audit log record into the database
   * @param log The audit log record to insert
   * @returns Promise that resolves when the log is persisted
   */
  insertAuditLog(log: AuditLogRecord): Promise<void>;
}

/**
 * Database record structure for audit logs
 * Maps to the audit_logs table schema
 */
export interface AuditLogRecord {
  id: string;
  type: string;
  timestamp: Date;
  actor_id: string;
  actor_type: 'user' | 'system' | 'plugin';
  message: string;
  data?: Record<string, any>;
  tournament_id?: string;
  phase_id?: string;
  match_id?: string;
  player_id?: string;
  team_id?: string;
  field?: string;
  original_value?: string;
  new_value?: string;
  affected_entity?: string;
  entity_id?: string;
  context?: string;
  approved_by_id?: string;
  approval_note?: string;
  approval_timestamp?: Date;
  source?: string;
  score_a?: number;
  score_b?: number;
  breakdown?: Record<string, any>;
  description?: string;
  action?: string;
  reason?: string;
}

/**
 * Configuration for the log service
 */
export interface LogServiceConfig {
  /** Database implementation for audit log persistence */
  database: AuditLogDatabase;
  /** Whether logging is enabled (default: true) */
  enabled?: boolean;
  /** Maximum number of retry attempts for failed logs (default: 3) */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Number of retry attempts (alias for maxRetries for backward compatibility) */
  retryAttempts?: number;
}

/**
 * Context information for audit logging
 */
export interface LogContext {
  /** ID of the user or system performing the action */
  actorId: string;
  /** Type of actor performing the action */
  actorType: 'user' | 'system' | 'plugin';
  /** Optional tournament context */
  tournamentId?: string;
  /** Optional phase context */
  phaseId?: string;
  /** Optional match context */
  matchId?: string;
  /** Optional team context */
  teamId?: string;
  /** Optional player context */
  playerId?: string;
}

/**
 * Immutable Write API - Log Service
 *
 * This service provides a centralized logging mechanism for all mutations
 * in the UMP system. It ensures that every change is recorded in an
 * immutable audit log for compliance and debugging purposes.
 */
export class LogService {
  private config: Required<LogServiceConfig>;
  private retryQueue: Map<string, { attempts: number; lastAttempt: Date }> =
    new Map();

  constructor(config: LogServiceConfig) {
    this.config = {
      database: config.database,
      enabled: config.enabled ?? true,
      maxRetries: config.retryAttempts ?? config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      retryAttempts: config.retryAttempts ?? config.maxRetries ?? 3,
    } as Required<LogServiceConfig>;
  }

  /**
   * Log a mutation event to the audit log
   *
   * @param log The audit log data conforming to the AuditLog union type
   * @param context Additional context information
   * @returns Promise that resolves when the log is persisted
   */
  async log(log: AuditLog, context: LogContext): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const record = this.mapToRecord(log, context);
    await this.persistWithRetry(record);
  }

  /**
   * Log a match event
   */
  async logMatchEvent(
    matchId: string,
    change: any,
    context: LogContext
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      type: 'MATCH_EVENT',
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      matchId,
      change,
    };

    await this.log(log, context);
  }

  /**
   * Log a score submission
   */
  async logScoreSubmission(
    matchId: string,
    submittedBy: string,
    scoreA: number,
    scoreB: number,
    breakdown: any,
    source: 'manual' | 'plugin' | 'admin_override',
    context: LogContext
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      type: 'SCORE_SUBMISSION',
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      matchId,
      submittedBy,
      scoreA,
      scoreB,
      breakdown,
      source,
    };

    await this.log(log, context);
  }

  /**
   * Log a constraint violation
   */
  async logConstraintViolation(
    phaseId: string,
    description: string,
    context: LogContext
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      type: 'CONSTRAINT_VIOLATION',
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      phaseId,
      description,
    };

    await this.log(log, context);
  }

  /**
   * Log a player movement event
   */
  async logPlayerMovement(
    playerId: string,
    teamId: string,
    action: 'JOINED' | 'LEFT',
    tournamentId: string,
    reason: string | undefined,
    context: LogContext
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      type: 'PLAYER_MOVEMENT',
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      playerId,
      teamId,
      action,
      tournamentId,
      reason,
    };

    await this.log(log, context);
  }

  /**
   * Log a manual override event
   */
  async logManualOverride(
    field: string,
    originalValue: unknown,
    newValue: unknown,
    affectedEntity: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'PHASE',
    entityId: string,
    context: string,
    logContext: LogContext,
    approvedById?: string,
    approvalNote?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      type: 'MANUAL_OVERRIDE',
      timestamp: new Date(),
      actorId: logContext.actorId,
      actorType: logContext.actorType,
      field,
      originalValue,
      newValue,
      affectedEntity,
      entityId,
      context,
      approvedById,
      approvalNote,
      approvalTimestamp: approvedById ? new Date() : undefined,
    };

    await this.log(log, logContext);
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStats(): { totalRetries: number; failedLogs: number } {
    let totalRetries = 0;
    let failedLogs = 0;

    for (const retry of this.retryQueue.values()) {
      totalRetries += retry.attempts;
      if (retry.attempts >= this.config.maxRetries) {
        failedLogs++;
      }
    }

    return { totalRetries, failedLogs };
  }

  /**
   * Clear the retry queue (useful for testing)
   */
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  /**
   * Check if the log service is healthy
   * @returns Promise that resolves to true if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Test database connectivity by attempting a simple operation
      const testLog: AuditLogRecord = {
        id: 'health-check-' + Date.now(),
        type: 'HEALTH_CHECK',
        timestamp: new Date(),
        actor_id: 'system',
        actor_type: 'system',
        message: 'Health check test log',
      };

      // This will throw if the database is not accessible
      await this.config.database.insertAuditLog(testLog);
      return true;
    } catch (error) {
      console.error('LogService health check failed:', error);
      return false;
    }
  }

  /**
   * Map an AuditLog to a database record
   */
  private mapToRecord(log: AuditLog, context: LogContext): AuditLogRecord {
    const baseRecord: AuditLogRecord = {
      id: log.id,
      type: log.type,
      timestamp: log.timestamp,
      actor_id: log.actorId,
      actor_type: log.actorType,
      message: log.message || '',
      tournament_id: context.tournamentId,
      phase_id: context.phaseId,
      match_id: context.matchId,
      team_id: context.teamId,
      player_id: context.playerId,
    };

    // Map type-specific fields
    switch (log.type) {
      case 'MATCH_EVENT':
        return {
          ...baseRecord,
          match_id: log.matchId,
          data: log.change,
        };

      case 'SCORE_SUBMISSION':
        return {
          ...baseRecord,
          match_id: log.matchId,
          score_a: log.scoreA,
          score_b: log.scoreB,
          breakdown: log.breakdown,
          source: log.source,
          data: { submittedBy: log.submittedBy },
        };

      case 'CONSTRAINT_VIOLATION':
        return {
          ...baseRecord,
          phase_id: log.phaseId,
          description: log.description,
        };

      case 'PLAYER_MOVEMENT':
        return {
          ...baseRecord,
          player_id: log.playerId,
          team_id: log.teamId,
          tournament_id: log.tournamentId,
          action: log.action,
          reason: log.reason,
        };

      case 'MANUAL_OVERRIDE':
        return {
          ...baseRecord,
          field: log.field,
          original_value: JSON.stringify(log.originalValue),
          new_value: JSON.stringify(log.newValue),
          affected_entity: log.affectedEntity,
          entity_id: log.entityId,
          context: log.context,
          approved_by_id: log.approvedById,
          approval_note: log.approvalNote,
          approval_timestamp: log.approvalTimestamp,
        };

      default:
        return baseRecord;
    }
  }

  /**
   * Persist a log record with retry logic
   */
  private async persistWithRetry(record: AuditLogRecord): Promise<void> {
    const retryKey = record.id;
    const retryInfo = this.retryQueue.get(retryKey) || {
      attempts: 0,
      lastAttempt: new Date(),
    };

    try {
      await this.config.database.insertAuditLog(record);
      // Success - remove from retry queue
      this.retryQueue.delete(retryKey);
    } catch (error) {
      retryInfo.attempts++;
      retryInfo.lastAttempt = new Date();
      this.retryQueue.set(retryKey, retryInfo);

      if (retryInfo.attempts < this.config.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          this.persistWithRetry(record).catch(() => {
            // Final retry failed - log will remain in retry queue
          });
        }, this.config.retryDelay * retryInfo.attempts);
      } else {
        // Max retries exceeded - log error but don't throw
        console.error(
          `Failed to persist audit log after ${this.config.maxRetries} attempts:`,
          {
            logId: record.id,
            type: record.type,
            error: error instanceof Error ? error.message : String(error),
          }
        );
      }

      // Don't throw on first attempt to avoid blocking the main operation
      if (retryInfo.attempts === 1) {
        return;
      }

      throw error;
    }
  }
}

/**
 * Default log service instance
 * This will be configured by the consuming application
 */
let defaultLogService: LogService | null = null;

/**
 * Configure the default log service
 */
export function configureLogService(config: LogServiceConfig): void {
  defaultLogService = new LogService(config);
}

/**
 * Get the default log service instance
 */
export function getLogService(): LogService {
  if (!defaultLogService) {
    throw new Error(
      'LogService not configured. Call configureLogService() first.'
    );
  }
  return defaultLogService;
}

/**
 * Convenience function to log using the default service
 */
export async function log(
  auditLog: AuditLog,
  context: LogContext
): Promise<void> {
  const service = getLogService();
  await service.log(auditLog, context);
}
