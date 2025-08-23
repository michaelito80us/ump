import { LogService, getLogService } from '@ump/engine';
import { Match } from '@prisma/client';

/**
 * Integration layer for adding audit logging to service operations
 * This module provides decorators and utilities to automatically log CRUD operations
 */

export interface AuditContext {
  actorId: string;
  actorType: 'user' | 'system' | 'plugin';
  tournamentId?: string;
  source?: string;
}

/**
 * Decorator to add audit logging to service methods
 */
export function withAuditLogging<_T extends (...args: any[]) => Promise<any>>(
  operation: string,
  entityType: string,
  logService?: LogService
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = extractAuditContext(args);
      const _startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        // Log successful operation
        const auditLog = {
          id: require('uuid').v4(),
          type: 'MANUAL_OVERRIDE' as const,
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          field: `${entityType}_${operation}`,
          originalValue: null,
          newValue: result,
          affectedEntity: entityType.toUpperCase() as any,
          entityId: result?.id || 'unknown',
          context: `${operation} ${entityType} completed successfully`,
        };

        const logContext = {
          actorId: context.actorId,
          actorType: context.actorType,
          tournamentId: context.tournamentId,
        };

        const actualLogService = logService || getLogService();
        await actualLogService.log(auditLog, logContext);

        return result;
      } catch (error) {
        // Log failed operation
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        const errorLog = {
          id: require('uuid').v4(),
          type: 'MANUAL_OVERRIDE' as const,
          timestamp: new Date(),
          actorId: context.actorId,
          actorType: context.actorType,
          field: `${entityType}_${operation}_error`,
          originalValue: null,
          newValue: { error: errorMessage, stack: errorStack },
          affectedEntity: entityType.toUpperCase() as any,
          entityId: 'error',
          context: `${operation} ${entityType} failed: ${errorMessage}`,
        };

        const logContext = {
          actorId: context.actorId,
          actorType: context.actorType,
          tournamentId: context.tournamentId,
        };

        const actualLogService = logService || getLogService();
        await actualLogService.log(errorLog, logContext);

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Extract audit context from method arguments
 */
function extractAuditContext(args: any[]): AuditContext {
  // Look for context in the last argument or specific patterns
  const lastArg = args[args.length - 1];

  if (lastArg && typeof lastArg === 'object' && lastArg.auditContext) {
    return lastArg.auditContext;
  }

  // Default context for system operations
  return {
    actorId: 'system',
    actorType: 'system',
    source: 'service',
  };
}

/**
 * Utility functions for specific entity logging
 */
export class AuditLogger {
  private logService?: LogService;

  constructor(logService?: LogService) {
    this.logService = logService;
  }

  private getLogService(): LogService {
    return this.logService || getLogService();
  }

  /**
   * Log user operations
   */
  async logUserOperation(
    operation: 'create' | 'update' | 'delete',
    userId: string,
    context: AuditContext,
    additionalData?: any
  ): Promise<void> {
    const auditLog = {
      id: require('uuid').v4(),
      type: 'MANUAL_OVERRIDE' as const,
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      field: `user_${operation}`,
      originalValue: null,
      newValue: additionalData,
      affectedEntity: 'TOURNAMENT' as const,
      entityId: userId,
      context: `User ${operation}: ${userId}`,
    };

    const logContext = {
      actorId: context.actorId,
      actorType: context.actorType,
      tournamentId: context.tournamentId,
    };

    await this.getLogService().log(auditLog, logContext);
  }

  /**
   * Log tournament operations
   */
  async logTournamentOperation(
    operation: 'create' | 'update' | 'delete',
    tournamentId: string,
    context: AuditContext,
    additionalData?: any
  ): Promise<void> {
    const auditLog = {
      id: require('uuid').v4(),
      type: 'MANUAL_OVERRIDE' as const,
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      field: `tournament_${operation}`,
      originalValue: null,
      newValue: additionalData,
      affectedEntity: 'TOURNAMENT' as const,
      entityId: tournamentId,
      context: `Tournament ${operation}: ${tournamentId}`,
    };

    const logContext = {
      actorId: context.actorId,
      actorType: context.actorType,
      tournamentId: context.tournamentId,
    };

    await this.getLogService().log(auditLog, logContext);
  }

  /**
   * Log team operations
   */
  async logTeamOperation(
    operation: 'create' | 'update' | 'delete',
    teamId: string,
    context: AuditContext,
    additionalData?: any
  ): Promise<void> {
    const auditLog = {
      id: require('uuid').v4(),
      type: 'MANUAL_OVERRIDE' as const,
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      field: `team_${operation}`,
      originalValue: null,
      newValue: additionalData,
      affectedEntity: 'TOURNAMENT' as const,
      entityId: teamId,
      context: `Team ${operation}: ${teamId}`,
    };

    const logContext = {
      actorId: context.actorId,
      actorType: context.actorType,
      tournamentId: context.tournamentId,
    };

    await this.getLogService().log(auditLog, logContext);
  }

  /**
   * Log match operations
   */
  async logMatchOperation(
    operation: 'create' | 'update' | 'delete',
    match: Match,
    context: AuditContext,
    additionalData?: any
  ): Promise<void> {
    const auditLog = {
      id: require('uuid').v4(),
      type: 'MATCH_EVENT' as const,
      timestamp: new Date(),
      actorId: context.actorId,
      actorType: context.actorType,
      matchId: match.id,
      change: {
        operation,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        status: match.status,
        venue: match.venue,
        ...additionalData,
      },
    };

    const logContext = {
      actorId: context.actorId,
      actorType: context.actorType,
      tournamentId: context.tournamentId,
      matchId: match.id,
    };

    await this.getLogService().log(auditLog, logContext);
  }

  /**
   * Log score submission specifically (as required by T-11.2)
   */
  async logScoreSubmission(
    match: Match,
    context: AuditContext,
    scoreData: {
      previousScoreA?: number;
      previousScoreB?: number;
      newScoreA: number;
      newScoreB: number;
      breakdown?: any;
    }
  ): Promise<void> {
    const logContext = {
      actorId: context.actorId,
      actorType: context.actorType,
      tournamentId: context.tournamentId,
      matchId: match.id,
    };

    await this.getLogService().logScoreSubmission(
      match.id,
      context.actorId,
      scoreData.newScoreA,
      scoreData.newScoreB,
      scoreData.breakdown || {},
      'manual',
      logContext
    );
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

/**
 * Helper function to create audit context from GraphQL context
 */
export function createAuditContext(
  user: { id: string } | null,
  tournamentId?: string,
  source?: string
): AuditContext {
  return {
    actorId: user?.id || 'system',
    actorType: user ? 'user' : 'system',
    tournamentId,
    source: source || 'graphql',
  };
}
