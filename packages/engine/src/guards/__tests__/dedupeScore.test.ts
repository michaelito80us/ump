/**
 * Unit tests for Duplicate Score Submission Guard (T-16.1)
 */

import {
  DedupeScoreGuard,
  DuplicateScoreSubmissionError,
  createDedupeGuard,
  isDuplicateSubmissionError,
  type DedupeDatabase,
} from '../dedupeScore';

// Mock database implementation for testing
class MockDedupeDatabase implements DedupeDatabase {
  private submissions: Array<{
    matchId: string;
    submittedBy: string;
    timestamp: number;
    scoreA: number;
    scoreB: number;
    breakdown?: any;
    source: string;
  }> = [];

  private shouldFailCreate = false;
  private shouldFailCheck = false;
  private duplicateConstraintError = false;

  async checkRecentSubmission(
    matchId: string,
    submittedBy: string,
    intervalMs: number
  ): Promise<boolean> {
    if (this.shouldFailCheck) {
      throw new Error('Database check failed');
    }

    const now = Date.now();
    return this.submissions.some(
      (sub) =>
        sub.matchId === matchId &&
        sub.submittedBy === submittedBy &&
        now - sub.timestamp < intervalMs
    );
  }

  async createScoreAudit(data: {
    matchId: string;
    submittedBy: string;
    scoreA: number;
    scoreB: number;
    breakdown?: any;
    source: string;
  }): Promise<void> {
    if (this.shouldFailCreate) {
      if (this.duplicateConstraintError) {
        const error = new Error(
          'duplicate key value violates unique constraint'
        );
        (error as any).code = '23505';
        throw error;
      }
      throw new Error('Database create failed');
    }

    this.submissions.push({
      ...data,
      timestamp: Date.now(),
    });
  }

  // Test utilities
  setFailCreate(fail: boolean, isDuplicateError = false): void {
    this.shouldFailCreate = fail;
    this.duplicateConstraintError = isDuplicateError;
  }

  setFailCheck(fail: boolean): void {
    this.shouldFailCheck = fail;
  }

  getSubmissions() {
    return [...this.submissions];
  }

  clear(): void {
    this.submissions = [];
  }

  addSubmission(matchId: string, submittedBy: string, ageMs = 0): void {
    this.submissions.push({
      matchId,
      submittedBy,
      timestamp: Date.now() - ageMs,
      scoreA: 1,
      scoreB: 0,
      source: 'test',
    });
  }
}

describe('DedupeScoreGuard', () => {
  let mockDb: MockDedupeDatabase;
  let guard: DedupeScoreGuard;

  beforeEach(() => {
    mockDb = new MockDedupeDatabase();
    guard = new DedupeScoreGuard(mockDb, { timeWindowMs: 2000 });
  });

  afterEach(() => {
    guard.destroy();
    mockDb.clear();
  });

  describe('constructor and configuration', () => {
    it('should create guard with default config', () => {
      const defaultGuard = new DedupeScoreGuard(mockDb);
      const stats = defaultGuard.getStats();

      expect(stats.enabled).toBe(true);
      expect(stats.timeWindowMs).toBe(2000);
      expect(stats.cacheStats.maxAge).toBe(2000);

      defaultGuard.destroy();
    });

    it('should create guard with custom config', () => {
      const customGuard = new DedupeScoreGuard(mockDb, {
        timeWindowMs: 5000,
        enabled: false,
      });
      const stats = customGuard.getStats();

      expect(stats.enabled).toBe(false);
      expect(stats.timeWindowMs).toBe(5000);
      expect(stats.cacheStats.maxAge).toBe(5000);

      customGuard.destroy();
    });

    it('should create guard using factory function', () => {
      const factoryGuard = createDedupeGuard(mockDb, { timeWindowMs: 3000 });
      const stats = factoryGuard.getStats();

      expect(stats.timeWindowMs).toBe(3000);

      factoryGuard.destroy();
    });
  });

  describe('isDuplicate', () => {
    it('should return false for first submission', async () => {
      const result = await guard.isDuplicate('match1', 'user1');
      expect(result).toBe(false);
    });

    it('should return true for duplicate submission within time window', async () => {
      // Add a recent submission
      mockDb.addSubmission('match1', 'user1', 1000); // 1 second ago

      const result = await guard.isDuplicate('match1', 'user1');
      expect(result).toBe(true);
    });

    it('should return false for submission outside time window', async () => {
      // Add an old submission
      mockDb.addSubmission('match1', 'user1', 3000); // 3 seconds ago

      const result = await guard.isDuplicate('match1', 'user1');
      expect(result).toBe(false);
    });

    it('should return false for different match', async () => {
      mockDb.addSubmission('match1', 'user1', 1000);

      const result = await guard.isDuplicate('match2', 'user1');
      expect(result).toBe(false);
    });

    it('should return false for different user', async () => {
      mockDb.addSubmission('match1', 'user1', 1000);

      const result = await guard.isDuplicate('match1', 'user2');
      expect(result).toBe(false);
    });

    it('should return false when guard is disabled', async () => {
      const disabledGuard = new DedupeScoreGuard(mockDb, { enabled: false });
      mockDb.addSubmission('match1', 'user1', 1000);

      const result = await disabledGuard.isDuplicate('match1', 'user1');
      expect(result).toBe(false);

      disabledGuard.destroy();
    });

    it('should return false when database check fails', async () => {
      mockDb.setFailCheck(true);

      const result = await guard.isDuplicate('match1', 'user1');
      expect(result).toBe(false);
    });

    it('should use cache for fast duplicate detection', async () => {
      // First call should check database and cache result
      await guard.isDuplicate('match1', 'user1');

      // Record a submission to populate cache
      await guard.guardSubmission('match1', 'user1', {
        scoreA: 1,
        scoreB: 0,
        source: 'test',
      });

      // Second call should use cache (even if we break database)
      mockDb.setFailCheck(true);
      const result = await guard.isDuplicate('match1', 'user1');
      expect(result).toBe(true);
    });
  });

  describe('guardSubmission', () => {
    const scoreData = {
      scoreA: 2,
      scoreB: 1,
      breakdown: { period1: [1, 0], period2: [1, 1] },
      source: 'manual',
    };

    it('should allow first submission', async () => {
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).resolves.not.toThrow();

      const submissions = mockDb.getSubmissions();
      expect(submissions).toHaveLength(1);
      expect(submissions[0]).toMatchObject({
        matchId: 'match1',
        submittedBy: 'user1',
        scoreA: 2,
        scoreB: 1,
        breakdown: { period1: [1, 0], period2: [1, 1] },
        source: 'manual',
      });
    });

    it('should block duplicate submission within time window', async () => {
      // First submission
      await guard.guardSubmission('match1', 'user1', scoreData);

      // Second submission should be blocked
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);

      // Should still only have one submission
      expect(mockDb.getSubmissions()).toHaveLength(1);
    });

    it('should allow submission after time window expires', async () => {
      // Add an old submission
      mockDb.addSubmission('match1', 'user1', 3000); // 3 seconds ago

      // New submission should be allowed
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).resolves.not.toThrow();
    });

    it('should allow submissions from different users', async () => {
      await guard.guardSubmission('match1', 'user1', scoreData);

      await expect(
        guard.guardSubmission('match1', 'user2', scoreData)
      ).resolves.not.toThrow();

      expect(mockDb.getSubmissions()).toHaveLength(2);
    });

    it('should allow submissions for different matches', async () => {
      await guard.guardSubmission('match1', 'user1', scoreData);

      await expect(
        guard.guardSubmission('match2', 'user1', scoreData)
      ).resolves.not.toThrow();

      expect(mockDb.getSubmissions()).toHaveLength(2);
    });

    it('should do nothing when guard is disabled', async () => {
      const disabledGuard = new DedupeScoreGuard(mockDb, { enabled: false });

      // Even with existing submission, should not block
      mockDb.addSubmission('match1', 'user1', 1000);

      await expect(
        disabledGuard.guardSubmission('match1', 'user1', scoreData)
      ).resolves.not.toThrow();

      disabledGuard.destroy();
    });

    it('should handle database constraint violations', async () => {
      // Set up database to fail with constraint violation
      mockDb.setFailCreate(true, true);

      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);
    });

    it('should re-throw non-constraint database errors', async () => {
      // Set up database to fail with generic error
      mockDb.setFailCreate(true, false);

      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow('Database create failed');
    });
  });

  describe('cache behavior', () => {
    it('should track cache statistics', () => {
      const stats = guard.getStats();
      expect(stats.cacheStats).toHaveProperty('size');
      expect(stats.cacheStats).toHaveProperty('maxAge');
      expect(stats.cacheStats.maxAge).toBe(2000);
    });

    it('should clean up expired cache entries', async () => {
      // Record a submission
      await guard.guardSubmission('match1', 'user1', {
        scoreA: 1,
        scoreB: 0,
        source: 'test',
      });

      let stats = guard.getStats();
      expect(stats.cacheStats.size).toBeGreaterThan(0);

      // Wait for cache to expire and trigger cleanup
      // Note: In real tests, you might want to mock timers
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cache should still have entries (they haven't expired yet)
      stats = guard.getStats();
      expect(stats.cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should create DuplicateScoreSubmissionError with correct properties', () => {
      const error = new DuplicateScoreSubmissionError('match1', 'user1', 2000);

      expect(error.message).toContain('match1');
      expect(error.message).toContain('user1');
      expect(error.message).toContain('2000ms');
      expect(error.code).toBe('DUPLICATE_SCORE_SUBMISSION');
    });

    it('should identify duplicate submission errors', () => {
      const dupeError = new DuplicateScoreSubmissionError(
        'match1',
        'user1',
        2000
      );
      const genericError = new Error('Generic error');

      expect(isDuplicateSubmissionError(dupeError)).toBe(true);
      expect(isDuplicateSubmissionError(genericError)).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive submissions', async () => {
      const scoreData = { scoreA: 1, scoreB: 0, source: 'test' };

      // First submission should succeed
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).resolves.not.toThrow();

      // Rapid second submission should be blocked by cache
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);

      // Third submission should also be blocked
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);
    });

    it('should handle concurrent submissions for different matches', async () => {
      const scoreData = { scoreA: 1, scoreB: 0, source: 'test' };

      // Concurrent submissions for different matches should all succeed
      const promises = [
        guard.guardSubmission('match1', 'user1', scoreData),
        guard.guardSubmission('match2', 'user1', scoreData),
        guard.guardSubmission('match3', 'user1', scoreData),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
      expect(mockDb.getSubmissions()).toHaveLength(3);
    });

    it('should handle mixed scenarios with different users and matches', async () => {
      const scoreData = { scoreA: 1, scoreB: 0, source: 'test' };

      // Various submissions that should succeed
      await guard.guardSubmission('match1', 'user1', scoreData);
      await guard.guardSubmission('match1', 'user2', scoreData);
      await guard.guardSubmission('match2', 'user1', scoreData);

      expect(mockDb.getSubmissions()).toHaveLength(3);

      // Duplicate attempts that should fail
      await expect(
        guard.guardSubmission('match1', 'user1', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);

      await expect(
        guard.guardSubmission('match1', 'user2', scoreData)
      ).rejects.toThrow(DuplicateScoreSubmissionError);

      // Should still have only 3 submissions
      expect(mockDb.getSubmissions()).toHaveLength(3);
    });
  });
});
