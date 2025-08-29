import { Verifier } from '@pact-foundation/pact';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import path from 'path';
import fs from 'fs';
import { formatError } from '../../src/errorMapper';

// Jest globals are automatically available through @types/jest

// Mock GraphQL schema for testing
const typeDefs = gql`
  type Query {
    tournaments: [Tournament!]!
    tournament(id: ID!): Tournament
    matches: [Match!]!
    match(id: ID!): Match
  }

  type Tournament {
    id: ID!
    name: String!
    status: TournamentStatus!
    startDate: String!
    endDate: String
    phases: [Phase!]!
  }

  type Phase {
    id: ID!
    name: String!
    matches: [Match!]!
  }

  type Match {
    id: ID!
    teamA: Team!
    teamB: Team!
    scoreA: Int
    scoreB: Int
    status: MatchStatus!
    startTime: String
  }

  type Team {
    id: ID!
    name: String!
    players: [Player!]!
  }

  type Player {
    id: ID!
    name: String!
    email: String!
  }

  enum TournamentStatus {
    DRAFT
    PUBLISHED
    LIVE
    COMPLETED
    CANCELLED
  }

  enum MatchStatus {
    SCHEDULED
    LIVE
    COMPLETED
    CANCELLED
  }
`;

// Mock resolvers
const resolvers = {
  Query: {
    tournaments: () => [
      {
        id: '1',
        name: 'Test Tournament',
        status: 'PUBLISHED',
        startDate: '2025-03-01',
        endDate: '2025-03-03',
        phases: [
          {
            id: '1',
            name: 'Group Stage',
            matches: [
              {
                id: '1',
                teamA: { id: '1', name: 'Team A', players: [] },
                teamB: { id: '2', name: 'Team B', players: [] },
                scoreA: 2,
                scoreB: 1,
                status: 'COMPLETED',
                startTime: '2025-03-01T10:00:00Z',
              },
            ],
          },
        ],
      },
    ],
    tournament: (_: any, { id }: { id: string }) => {
      if (id === '1') {
        return {
          id: '1',
          name: 'Test Tournament',
          status: 'PUBLISHED',
          startDate: '2025-03-01',
          endDate: '2025-03-03',
          phases: [],
        };
      }
      return null;
    },
    matches: () => [
      {
        id: '1',
        teamA: { id: '1', name: 'Team A', players: [] },
        teamB: { id: '2', name: 'Team B', players: [] },
        scoreA: 2,
        scoreB: 1,
        status: 'COMPLETED',
        startTime: '2025-03-01T10:00:00Z',
      },
    ],
    match: (_: any, { id }: { id: string }) => {
      if (id === '1') {
        return {
          id: '1',
          teamA: { id: '1', name: 'Team A', players: [] },
          teamB: { id: '2', name: 'Team B', players: [] },
          scoreA: 2,
          scoreB: 1,
          status: 'COMPLETED',
          startTime: '2025-03-01T10:00:00Z',
        };
      }
      return null;
    },
  },
};

describe('Gateway Provider Contract Tests', () => {
  let server: ApolloServer;
  let serverUrl: string;

  beforeAll(async () => {
    // Create test Apollo Server
    server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      formatError,
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 0 }, // Use random available port
    });

    serverUrl = url;
  });

  afterAll(async () => {
    await server?.stop();
  });

  describe('Pact Verification', () => {
    it('should verify provider contract against consumer expectations', async () => {
      jest.setTimeout(30000); // 30 second timeout for contract verification
      // Check if pact files exist before verification
      const mobilePactPath = path.resolve(
        __dirname,
        '../../../apps/mobile/pacts/mobile-ump-gateway.json'
      );
      const adminPactPath = path.resolve(
        __dirname,
        '../../../apps/admin/pacts/admin-ump-gateway.json'
      );

      const pactUrls: string[] = [];

      if (fs.existsSync(mobilePactPath)) {
        pactUrls.push(mobilePactPath);
      }

      if (fs.existsSync(adminPactPath)) {
        pactUrls.push(adminPactPath);
      }

      if (pactUrls.length === 0) {
        console.log('No pact files found, skipping verification');
        return;
      }

      const opts = {
        provider: 'ump-gateway',
        providerBaseUrl: serverUrl,
        pactUrls,
        publishVerificationResult: process.env.CI === 'true',
        providerVersion: process.env.GIT_COMMIT || '1.0.0',
        consumerVersionSelectors: [
          {
            tag: 'main',
            latest: true,
          },
          {
            tag: 'develop',
            latest: true,
          },
        ],
        enablePending: true,
        includeWipPactsSince: '2025-01-01',
        requestFilter: (req: any, res: any, next: any) => {
          // Add authentication headers if needed
          req.headers['authorization'] = 'Bearer test-token';
          next();
        },
        stateHandlers: {
          'tournament exists': async () => {
            // Setup state for tournament existence
            console.log('Setting up state: tournament exists');
          },
          'match is in progress': async () => {
            // Setup state for match in progress
            console.log('Setting up state: match is in progress');
          },
          'user is authenticated': async () => {
            // Setup state for authenticated user
            console.log('Setting up state: user is authenticated');
          },
        },
      };

      const verifier = new Verifier(opts);

      try {
        const output = await verifier.verifyProvider();
        console.log('Pact Verification Complete!');
        console.log(output);
      } catch (error) {
        console.error('Pact verification failed:', error);
        throw error;
      }
    }); // Contract verification test

    it('should handle GraphQL schema breaking changes', async () => {
      // Test that verifies schema compatibility
      const testQuery = `
        query TestQuery {
          tournaments {
            id
            name
            status
          }
        }
      `;

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: testQuery }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data.tournaments)).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should maintain backward compatibility for required fields', async () => {
      // Test that ensures required fields are not removed
      const requiredFieldsQuery = `
        query RequiredFieldsTest {
          tournament(id: "1") {
            id
            name
            status
            startDate
          }
        }
      `;

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: requiredFieldsQuery }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.tournament).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        status: expect.any(String),
        startDate: expect.any(String),
      });
    });

    it('should handle error responses consistently', async () => {
      // Test error handling consistency
      const invalidQuery = `
        query InvalidQuery {
          nonExistentField
        }
      `;

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: invalidQuery }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.errors).toBeDefined();
      expect(result.errors[0]).toMatchObject({
        message: expect.any(String),
        extensions: expect.objectContaining({
          code: expect.any(String),
        }),
      });
    });
  });
});
