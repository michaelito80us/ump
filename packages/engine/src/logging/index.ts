/**
 * Logging Module - Immutable Write API
 *
 * This module provides centralized audit logging for all mutations
 * in the UMP system, ensuring compliance and debugging capabilities.
 */

export {
  LogService,
  configureLogService,
  getLogService,
  log,
  type AuditLogDatabase,
  type AuditLogRecord,
  type LogServiceConfig,
  type LogContext,
} from './logService';

export {
  PrismaAuditLogDatabase,
  createPrismaAuditLogDatabase,
} from './prismaAuditLogDatabase';

/**
 * Re-export AuditLog types from core for convenience
 */
export type {
  AuditLog,
  MatchLog,
  ScoreSubmissionLog,
  ConstraintViolationLog,
  PlayerMovementLog,
  ManualOverrideLog,
} from '@ump/core/types';
