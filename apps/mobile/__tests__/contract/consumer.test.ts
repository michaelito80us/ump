import { Pact, Interaction, Matchers } from '@pact-foundation/pact';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} from '@apollo/client';
import path from 'path';
import '@testing-library/jest-dom';

// Store original fetch to restore it
const originalFetch = global.fetch;

// Polyfill fetch for Node.js environment
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

const { like, eachLike, term } = Matchers;

// GraphQL queries that the mobile app uses
const GET_TOURNAMENTS = gql`
  query GetTournaments {
    tournaments {
      id
      name
      status
      startDate
      endDate
    }
  }
`;

const GET_TOURNAMENT = gql`
  query GetTournament($id: ID!) {
    tournament(id: $id) {
      id
      name
      status
      startDate
      endDate
      phases {
        id
        name
        matches {
          id
          teamA {
            id
            name
          }
          teamB {
            id
            name
          }
          scoreA
          scoreB
          status
          startTime
        }
      }
    }
  }
`;

const GET_MATCHES = gql`
  query GetMatches {
    matches {
      id
      teamA {
        id
        name
      }
      teamB {
        id
        name
      }
      scoreA
      scoreB
      status
      startTime
    }
  }
`;

describe('Mobile App Consumer Contract Tests', () => {
  const provider = new Pact({
    consumer: 'mobile-app',
    provider: 'ump-gateway',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  let apolloClient: ApolloClient<any>;

  beforeAll(async () => {
    // Restore real fetch for Pact to work
    global.fetch = require('node-fetch');

    await provider.setup();

    // Create Apollo Client pointing to Pact mock server
    apolloClient = new ApolloClient({
      link: createHttpLink({
        uri: 'http://localhost:1234/graphql',
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
      },
    });
  });

  afterAll(async () => {
    await provider.finalize();
    // Restore original fetch mock
    global.fetch = originalFetch;
  });

  afterEach(async () => {
    await provider.verify();
    await provider.removeInteractions();
  });

  describe('Tournament Queries', () => {
    it('should get list of tournaments', async () => {
      // Define the expected interaction
      const interaction = new Interaction()
        .given('tournaments exist')
        .uponReceiving('a request for tournaments list')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            operationName: 'GetTournaments',
            query: GET_TOURNAMENTS.loc?.source.body || '',
            variables: {},
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              tournaments: eachLike({
                id: like('1'),
                name: like('Test Tournament'),
                status: term({
                  matcher: 'DRAFT|PUBLISHED|LIVE|COMPLETED|CANCELLED',
                  generate: 'PUBLISHED',
                }),
                startDate: like('2025-03-01'),
                endDate: like('2025-03-03'),
              }),
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Execute the query
      const result = await apolloClient.query({
        query: GET_TOURNAMENTS,
      });

      expect(result.data.tournaments).toBeDefined();
      expect(result.data.tournaments.length).toBeGreaterThan(0);
      expect(result.data.tournaments[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        status: expect.stringMatching(
          /^(DRAFT|PUBLISHED|LIVE|COMPLETED|CANCELLED)$/
        ),
        startDate: expect.any(String),
      });
    });

    it('should get tournament by ID', async () => {
      const interaction = new Interaction()
        .given('tournament with ID 1 exists')
        .uponReceiving('a request for tournament with ID 1')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            operationName: 'GetTournament',
            query: GET_TOURNAMENT.loc?.source.body || '',
            variables: { id: '1' },
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              tournament: {
                id: like('1'),
                name: like('Test Tournament'),
                status: term({
                  matcher: 'DRAFT|PUBLISHED|LIVE|COMPLETED|CANCELLED',
                  generate: 'PUBLISHED',
                }),
                startDate: like('2025-03-01'),
                endDate: like('2025-03-03'),
                phases: eachLike({
                  id: like('1'),
                  name: like('Group Stage'),
                  matches: eachLike({
                    id: like('1'),
                    teamA: {
                      id: like('1'),
                      name: like('Team A'),
                    },
                    teamB: {
                      id: like('2'),
                      name: like('Team B'),
                    },
                    scoreA: like(2),
                    scoreB: like(1),
                    status: term({
                      matcher: 'SCHEDULED|LIVE|COMPLETED|CANCELLED',
                      generate: 'COMPLETED',
                    }),
                    startTime: like('2025-03-01T10:00:00Z'),
                  }),
                }),
              },
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await apolloClient.query({
        query: GET_TOURNAMENT,
        variables: { id: '1' },
      });

      expect(result.data.tournament).toBeDefined();
      expect(result.data.tournament.id).toBe('1');
      expect(result.data.tournament.phases).toBeDefined();
      expect(result.data.tournament.phases.length).toBeGreaterThan(0);
    });
  });

  describe('Match Queries', () => {
    it('should get list of matches', async () => {
      const interaction = new Interaction()
        .given('matches exist')
        .uponReceiving('a request for matches list')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            operationName: 'GetMatches',
            query: GET_MATCHES.loc?.source.body || '',
            variables: {},
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              matches: eachLike({
                id: like('1'),
                teamA: {
                  id: like('1'),
                  name: like('Team A'),
                },
                teamB: {
                  id: like('2'),
                  name: like('Team B'),
                },
                scoreA: like(2),
                scoreB: like(1),
                status: term({
                  matcher: 'SCHEDULED|LIVE|COMPLETED|CANCELLED',
                  generate: 'COMPLETED',
                }),
                startTime: like('2025-03-01T10:00:00Z'),
              }),
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await apolloClient.query({
        query: GET_MATCHES,
      });

      expect(result.data.matches).toBeDefined();
      expect(result.data.matches.length).toBeGreaterThan(0);
      expect(result.data.matches[0]).toMatchObject({
        id: expect.any(String),
        teamA: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        teamB: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
        status: expect.stringMatching(/^(SCHEDULED|LIVE|COMPLETED|CANCELLED)$/),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL errors consistently', async () => {
      const interaction = new Interaction()
        .given('tournament does not exist')
        .uponReceiving('a request for non-existent tournament')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            operationName: 'GetTournament',
            query: GET_TOURNAMENT.loc?.source.body || '',
            variables: { id: 'non-existent' },
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              tournament: null,
            },
            errors: eachLike({
              message: like('Tournament not found'),
              extensions: {
                code: like('NOT_FOUND'),
                httpStatus: like(404),
              },
            }),
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await apolloClient.query({
        query: GET_TOURNAMENT,
        variables: { id: 'non-existent' },
        errorPolicy: 'all',
      });

      expect(result.data.tournament).toBeNull();
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toMatchObject({
        message: expect.any(String),
        extensions: expect.objectContaining({
          code: expect.any(String),
        }),
      });
    });
  });

  describe('Authentication', () => {
    it('should handle authenticated requests', async () => {
      const interaction = new Interaction()
        .given('user is authenticated')
        .uponReceiving('an authenticated request for tournaments')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer jwt-token'),
          },
          body: like({
            operationName: 'GetTournaments',
            query: GET_TOURNAMENTS.loc?.source.body || '',
            variables: {},
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              tournaments: eachLike({
                id: like('1'),
                name: like('Test Tournament'),
                status: like('PUBLISHED'),
                startDate: like('2025-03-01'),
                endDate: like('2025-03-03'),
              }),
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create authenticated Apollo Client
      const authenticatedClient = new ApolloClient({
        link: createHttpLink({
          uri: 'http://localhost:1234/graphql',
          headers: {
            authorization: 'Bearer jwt-token',
          },
        }),
        cache: new InMemoryCache(),
      });

      const result = await authenticatedClient.query({
        query: GET_TOURNAMENTS,
      });

      expect(result.data.tournaments).toBeDefined();
      expect(result.data.tournaments.length).toBeGreaterThan(0);
    });
  });
});
