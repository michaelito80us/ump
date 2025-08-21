/**
 * Duplicate Score Submission Guard (T-16.1)
 *
 * This module provides service-level protection against duplicate score submissions
 * within a 2-second window. It works in conjunction with the database constraints
 * defined in 002_dedupe_scores.sql.
 */

import { ValidationError } from '@ump/core/errors';

/**
 * Error thrown when a duplicate score submission is detected
 */
export class DuplicateScoreSubmissionError extends ValidationError {
  constructor(matchId: string, submittedBy: string, timeWindow: number) {
    super(
      `Duplicate score submission detected for match ${matchId} by user ${submittedBy} within ${timeWindow}ms`,
      'DUPLICATE_SCORE_SUBMISSION'
    );
  }
}

/**
 * Interface for database operations needed by the dedupe guard
 */
export interface DedupeDatabase {
  /**
   * Check if there's a recent score submission for the given match and user
   */
  checkRecentSubmission(
    matchId: string,
    submittedBy: string,
    intervalMs: number
  ): Promise<boolean>;

  /**
   * Create a score audit record
   */
  createScoreAudit(data: {
    matchId: string;
    submittedBy: string;
    scoreA: number;
    scoreB: number;
    breakdown?: any;
    source: string;
  }): Promise<void>;
}

/**
 * Configuration for the duplicate score guard
 */
export interface DedupeConfig {
  /** Time window in milliseconds to check for duplicates (default: 2000ms) */
  timeWindowMs?: number;
  /** Whether to enable the guard (default: true) */
  enabled?: boolean;
}

/**
 * In-memory cache to track recent submissions for additional protection
 * This provides faster checks before hitting the database
 */
class SubmissionCache {
  private cache = new Map<string, number>();
  private readonly maxAge: number;

  constructor(maxAgeMs: number = 2000) {
    this.maxAge = maxAgeMs;
  }

  /**
   * Generate cache key for a submission
   */
  private getCacheKey(matchId: string, submittedBy: string): string {
    return `${matchId}:${submittedBy}`;
  }

  /**
   * Check if a submission is recent in the cache
   */
  isRecent(matchId: string, submittedBy: string): boolean {
    const key = this.getCacheKey(matchId, submittedBy);
    const timestamp = this.cache.get(key);

    if (!timestamp) {
      return false;
    }

    const now = Date.now();
    const age = now - timestamp;

    // Clean up expired entries
    if (age > this.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Record a new submission in the cache
   */
  recordSubmission(matchId: string, submittedBy: string): void {
    const key = this.getCacheKey(matchId, submittedBy);
    this.cache.set(key, Date.now());
  }

  /**
   * Atomically check if recent and record if not
   * Returns true if was recent (duplicate), false if recorded successfully
   */
  checkAndRecord(matchId: string, submittedBy: string): boolean {
    const key = this.getCacheKey(matchId, submittedBy);
    const timestamp = this.cache.get(key);
    const now = Date.now();

    if (timestamp) {
      const age = now - timestamp;
      // Clean up expired entries
      if (age > this.maxAge) {
        this.cache.delete(key);
      } else {
        return true; // Recent submission found
      }
    }

    // No recent submission, record this one
    this.cache.set(key, now);
    return false;
  }

  /**
   * Clean up expired entries from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxAge: this.maxAge,
    };
  }

  /**
   * Clear all entries from the cache
   * Useful for testing or manual cache reset
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Duplicate Score Submission Guard
 *
 * Provides multi-layered protection against duplicate score submissions:
 * 1. In-memory cache for fast initial checks
 * 2. Database query for persistent validation
 * 3. Database constraints as final enforcement
 */
export class DedupeScoreGuard {
  private readonly config: Required<DedupeConfig>;
  private readonly cache: SubmissionCache;
  private readonly db: DedupeDatabase;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(db: DedupeDatabase, config: DedupeConfig = {}) {
    this.config = {
      timeWindowMs: config.timeWindowMs ?? 2000,
      enabled: config.enabled ?? true,
    };
    this.db = db;
    this.cache = new SubmissionCache(this.config.timeWindowMs);

    // Start periodic cache cleanup
    this.startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    // Clean up every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cache.cleanup();
    }, 30000);
  }

  /**
   * Stop the cache cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Check if a score submission would be a duplicate
   *
   * @param matchId - The match ID
   * @param submittedBy - The user ID submitting the score
   * @returns Promise<boolean> - true if duplicate, false if allowed
   */
  async isDuplicate(matchId: string, submittedBy: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    // Fast check: in-memory cache
    if (this.cache.isRecent(matchId, submittedBy)) {
      return true;
    }

    // Slower check: database query
    try {
      const hasRecent = await this.db.checkRecentSubmission(
        matchId,
        submittedBy,
        this.config.timeWindowMs
      );

      return hasRecent;
    } catch (error) {
      // If database check fails, err on the side of caution and allow the submission
      // The database constraints will still catch actual duplicates
      console.error('Failed to check for duplicate submissions:', error);
      return false;
    }
  }

  /**
   * Guard a score submission against duplicates
   *
   * @param matchId - The match ID
   * @param submittedBy - The user ID submitting the score
   * @param scoreData - The score data being submitted
   * @throws DuplicateScoreSubmissionError if duplicate detected
   */
  async guardSubmission(
    matchId: string,
    submittedBy: string,
    scoreData: {
      scoreA: number;
      scoreB: number;
      breakdown?: any;
      source: string;
    }
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Atomically check for duplicates and record submission to prevent race conditions
    const isRecentInCache = this.cache.checkAndRecord(matchId, submittedBy);
    if (isRecentInCache) {
      throw new DuplicateScoreSubmissionError(
        matchId,
        submittedBy,
        this.config.timeWindowMs
      );
    }

    // Also check database for submissions that might not be in cache
    try {
      const hasRecent = await this.db.checkRecentSubmission(
        matchId,
        submittedBy,
        this.config.timeWindowMs
      );

      if (hasRecent) {
        throw new DuplicateScoreSubmissionError(
          matchId,
          submittedBy,
          this.config.timeWindowMs
        );
      }
    } catch (error) {
      // If database check fails, continue with cache protection
      console.error('Failed to check for duplicate submissions:', error);
    }

    // Attempt to create the audit record
    // This will trigger database constraints if there's still a race condition
    try {
      await this.db.createScoreAudit({
        matchId,
        submittedBy,
        scoreA: scoreData.scoreA,
        scoreB: scoreData.scoreB,
        breakdown: scoreData.breakdown,
        source: scoreData.source,
      });
    } catch (error: any) {
      // Check if this is a unique constraint violation
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throw new DuplicateScoreSubmissionError(
          matchId,
          submittedBy,
          this.config.timeWindowMs
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get guard statistics for monitoring
   */
  getStats(): {
    enabled: boolean;
    timeWindowMs: number;
    cacheStats: { size: number; maxAge: number };
  } {
    return {
      enabled: this.config.enabled,
      timeWindowMs: this.config.timeWindowMs,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Clear the submission cache
   * Useful for testing or manual cache reset
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Factory function to create a dedupe guard with default configuration
 */
export function createDedupeGuard(
  db: DedupeDatabase,
  config?: DedupeConfig
): DedupeScoreGuard {
  return new DedupeScoreGuard(db, config);
}

/**
 * Utility function to extract duplicate submission info from error
 */
export function isDuplicateSubmissionError(
  error: any
): error is DuplicateScoreSubmissionError {
  return error instanceof DuplicateScoreSubmissionError;
}
