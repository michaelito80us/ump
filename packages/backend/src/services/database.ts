import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Supabase-optimized connection configuration
const getDatabaseConfig = (): Prisma.PrismaClientOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: isProduction
      ? [{ emit: 'stdout', level: 'error' }]
      : [
          { emit: 'stdout', level: 'query' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ],
    errorFormat: 'pretty',
  };
};

// Extend PrismaClient with custom methods if needed
class DatabaseService extends PrismaClient {
  private connectionRetries = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    super(getDatabaseConfig());

    // Note: Prisma client event handlers are automatically managed
  }

  async connect(): Promise<void> {
    while (this.connectionRetries < this.maxRetries) {
      try {
        await this.$connect();
        logger.info('Database connected successfully to Supabase');
        this.connectionRetries = 0; // Reset on successful connection
        return;
      } catch (error) {
        this.connectionRetries++;
        logger.warn(
          `Database connection attempt ${this.connectionRetries} failed:`,
          error
        );

        if (this.connectionRetries >= this.maxRetries) {
          logger.error(
            'Max connection retries reached. Failed to connect to Supabase database:',
            error
          );
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * this.connectionRetries)
        );
      }
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

  // Supabase-specific connection monitoring
  async getConnectionInfo(): Promise<{
    isConnected: boolean;
    poolSize?: number;
    activeConnections?: number;
  }> {
    try {
      // Check basic connectivity
      const isConnected = await this.healthCheck();

      if (!isConnected) {
        return { isConnected: false };
      }

      // Get connection pool information (Supabase specific)
      const poolInfo = (await this.$queryRaw`
        SELECT 
          count(*) as active_connections,
          current_setting('max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `) as Array<{ active_connections: bigint; max_connections: string }>;

      return {
        isConnected: true,
        activeConnections: Number(poolInfo[0]?.active_connections || 0),
        poolSize: parseInt(poolInfo[0]?.max_connections || '0', 10),
      };
    } catch (error) {
      logger.error('Failed to get connection info:', error);
      return { isConnected: false };
    }
  }

  // Transaction helper
  async withTransaction<T>(
    fn: (
      tx: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
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
