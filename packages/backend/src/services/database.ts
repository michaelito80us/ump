import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Extend PrismaClient with custom methods if needed
class DatabaseService extends PrismaClient {
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e: any) => {
        logger.debug('Database Query:', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }

    this.$on('error', (e: any) => {
      logger.error('Database Error:', e);
    });
  }

  async connect(): Promise<void> {
    try {
      await this.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Transaction helper
  async withTransaction<T>(
    fn: (
      tx: Omit<
        DatabaseService,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
      >
    ) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn);
  }
}

// Create singleton instance
export const db = new DatabaseService();

// Export types for use in other files
export type DatabaseTransaction = Parameters<typeof db.$transaction>[0];
