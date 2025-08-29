/**
 * Integration test for T-16.1: Duplicate Score Submission Guard
 *
 * This test verifies that the system returns a 409 status code when
 * duplicate score submissions are attempted within the 2-second window.
 */

import { GraphQLError } from 'graphql';
import { ValidationError } from '@ump/core/backend';
import { matchService } from '../../services/match.service';
import { db } from '../../services/database';
import { matchResolvers } from '../../resolvers/match.resolvers';

// Jest assertions are available globally in the test environment

// Mock context for GraphQL resolvers
const createMockContext = (userId: string) => ({
  user: { id: userId },
});

// Test data
const testData = {
  tournament: {
    id: 'test-tournament-1',
    name: 'Test Tournament',
    creatorId: 'user-1',
    pluginId: 'test-plugin',
    sport: 'test-sport',
    config: '{}',
  },
  phase: {
    id: 'test-phase-1',
    tournamentId: 'test-tournament-1',
    pluginId: 'test-plugin',
    phaseName: 'Test Phase',
    settings: '{}',
  },
  teams: [
    { id: 'team-a', name: 'Team A', sportIds: 'test-sport' },
    { id: 'team-b', name: 'Team B', sportIds: 'test-sport' },
  ],
  match: {
    id: 'test-match-1',
    phaseId: 'test-phase-1',
    teamAId: 'team-a',
    teamBId: 'team-b',
    scoreA: 0,
    scoreB: 0,
    status: 'PENDING',
  },
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
};

describe('T-16.1: Duplicate Score Submission Guard Integration', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();

    // Clean up service resources
    matchService.destroy();
  });

  beforeEach(async () => {
    // Clean up any score audit records between tests
    await db.matchScoreAudit.deleteMany({
      where: { matchId: testData.match.id },
    });

    // Clear the deduplication guard cache to ensure clean state
    matchService.clearDedupeCache();
  });

  describe('Service Level Tests', () => {
    it('should allow first score submission', async () => {
      const result = await matchService.updateScore(
        testData.match.id,
        2,
        1,
        { period1: [1, 0], period2: [1, 1] },
        testData.user.id
      );

      expect(result.scoreA).toBe(2);
      expect(result.scoreB).toBe(1);

      // Verify audit record was created
      const auditRecords = await db.matchScoreAudit.findMany({
        where: { matchId: testData.match.id },
      });
      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0].submittedBy).toBe(testData.user.id);
    });

    it('should block duplicate score submission within 2 seconds', async () => {
      // First submission
      await matchService.updateScore(
        testData.match.id,
        2,
        1,
        { period1: [1, 0], period2: [1, 1] },
        testData.user.id
      );

      // Second submission within 2 seconds should be blocked
      await expect(
        matchService.updateScore(
          testData.match.id,
          3,
          1,
          { period1: [2, 0], period2: [1, 1] },
          testData.user.id
        )
      ).rejects.toThrow(ValidationError);

      // Verify only one audit record exists
      const auditRecords = await db.matchScoreAudit.findMany({
        where: { matchId: testData.match.id },
      });
      expect(auditRecords).toHaveLength(1);
    });

    it('should allow score submission after 2 seconds', async () => {
      // First submission
      await matchService.updateScore(
        testData.match.id,
        2,
        1,
        undefined,
        testData.user.id
      );

      // Wait for 2.1 seconds
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Second submission should be allowed
      const result = await matchService.updateScore(
        testData.match.id,
        3,
        1,
        undefined,
        testData.user.id
      );

      expect(result.scoreA).toBe(3);
      expect(result.scoreB).toBe(1);

      // Verify two audit records exist
      const auditRecords = await db.matchScoreAudit.findMany({
        where: { matchId: testData.match.id },
      });
      expect(auditRecords).toHaveLength(2);
    }, 10000); // Increase timeout for this test

    it('should allow submissions from different users', async () => {
      // First user submission
      await matchService.updateScore(
        testData.match.id,
        2,
        1,
        undefined,
        'user-1'
      );

      // Different user submission should be allowed immediately
      const result = await matchService.updateScore(
        testData.match.id,
        2,
        2,
        undefined,
        'user-2'
      );

      expect(result.scoreA).toBe(2);
      expect(result.scoreB).toBe(2);

      // Verify two audit records exist
      const auditRecords = await db.matchScoreAudit.findMany({
        where: { matchId: testData.match.id },
      });
      expect(auditRecords).toHaveLength(2);
    });
  });

  describe('GraphQL Resolver Tests', () => {
    it('should return 409 status code for duplicate submission via GraphQL', async () => {
      const context = createMockContext(testData.user.id);
      const input = {
        scoreA: 2,
        scoreB: 1,
        breakdown: { period1: [1, 0], period2: [1, 1] },
      };

      // First submission should succeed
      const firstResult = await matchResolvers.Mutation.updateMatchScore(
        null,
        { id: testData.match.id, input },
        context
      );
      expect(firstResult.scoreA).toBe(2);
      expect(firstResult.scoreB).toBe(1);

      // Second submission should throw GraphQLError with 409 status
      try {
        await matchResolvers.Mutation.updateMatchScore(
          null,
          { id: testData.match.id, input: { ...input, scoreA: 3 } },
          context
        );
        expect(true).toBe(false); // Expected GraphQLError to be thrown
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(
          'DUPLICATE_SCORE_SUBMISSION'
        );
        expect((error as any).extensions?.http?.status).toBe(409);
        expect((error as GraphQLError).message).toContain(
          'Duplicate score submission detected'
        );
      }
    });

    it('should handle rapid successive GraphQL requests', async () => {
      const context = createMockContext(testData.user.id);
      const input = {
        scoreA: 1,
        scoreB: 0,
        breakdown: { period1: [1, 0] },
      };

      // Fire multiple requests simultaneously
      const promises = [
        matchResolvers.Mutation.updateMatchScore(
          null,
          { id: testData.match.id, input },
          context
        ),
        matchResolvers.Mutation.updateMatchScore(
          null,
          { id: testData.match.id, input: { ...input, scoreA: 2 } },
          context
        ),
        matchResolvers.Mutation.updateMatchScore(
          null,
          { id: testData.match.id, input: { ...input, scoreA: 3 } },
          context
        ),
      ];

      const results = await Promise.allSettled(promises);

      // Only one should succeed
      const successful = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);

      // Failed requests should have 409 status
      failed.forEach((result) => {
        const error = (result as PromiseRejectedResult).reason;
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.extensions?.code).toBe('DUPLICATE_SCORE_SUBMISSION');
        expect(error.extensions?.http?.status).toBe(409);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle submissions without submittedBy (no guard)', async () => {
      // Submission without submittedBy should bypass the guard
      const result1 = await matchService.updateScore(testData.match.id, 1, 0);

      const result2 = await matchService.updateScore(testData.match.id, 2, 0);

      expect(result1.scoreA).toBe(1);
      expect(result2.scoreA).toBe(2);

      // No audit records should be created
      const auditRecords = await db.matchScoreAudit.findMany({
        where: { matchId: testData.match.id },
      });
      expect(auditRecords).toHaveLength(0);
    });

    it('should handle database constraint violations gracefully', async () => {
      // This test would require setting up the actual database constraints
      // from the SQL migration file. For now, we test the service-level guard.

      // First submission
      await matchService.updateScore(
        testData.match.id,
        1,
        0,
        undefined,
        testData.user.id
      );

      // Rapid second submission should be caught by the guard
      await expect(
        matchService.updateScore(
          testData.match.id,
          2,
          0,
          undefined,
          testData.user.id
        )
      ).rejects.toThrow('Duplicate score submission detected');
    });
  });
});

/**
 * Set up test data in the database
 */
async function setupTestData() {
  // Create user
  await db.user.upsert({
    where: { id: testData.user.id },
    update: {},
    create: testData.user,
  });

  // Create tournament
  await db.tournament.upsert({
    where: { id: testData.tournament.id },
    update: {},
    create: testData.tournament,
  });

  // Create phase
  await db.phase.upsert({
    where: { id: testData.phase.id },
    update: {},
    create: testData.phase,
  });

  // Create teams
  for (const team of testData.teams) {
    await db.team.upsert({
      where: { id: team.id },
      update: {},
      create: team,
    });
  }

  // Create match
  await db.match.upsert({
    where: { id: testData.match.id },
    update: {},
    create: testData.match,
  });
}

/**
 * Clean up test data from the database
 */
async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await db.matchScoreAudit.deleteMany({
    where: { matchId: testData.match.id },
  });

  await db.match.deleteMany({
    where: { id: testData.match.id },
  });

  await db.team.deleteMany({
    where: { id: { in: testData.teams.map((t) => t.id) } },
  });

  await db.phase.deleteMany({
    where: { id: testData.phase.id },
  });

  await db.tournament.deleteMany({
    where: { id: testData.tournament.id },
  });

  await db.user.deleteMany({
    where: { id: testData.user.id },
  });
}
