import { Pact, Interaction, Matchers } from '@pact-foundation/pact';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import path from 'path';
import '@testing-library/jest-dom';

// Jest types are provided by ts-jest preset
// expect is available globally in Jest environment

// Polyfill fetch for Node.js environment
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

const { like, eachLike, term } = Matchers;

// GraphQL queries and mutations that the admin app uses
const CREATE_TOURNAMENT = gql`
  mutation CreateTournamentAdminTest($input: CreateTournamentInput!) {
    createTournament(input: $input) {
      id
      name
      status
      startDate
      endDate
    }
  }
`;

const UPDATE_TOURNAMENT = gql`
  mutation UpdateTournament($id: ID!, $input: UpdateTournamentInput!) {
    updateTournament(id: $id, input: $input) {
      id
      name
      status
      startDate
      endDate
    }
  }
`;

const DELETE_TOURNAMENT = gql`
  mutation DeleteTournament($id: ID!) {
    deleteTournament(id: $id)
  }
`;

const GET_TOURNAMENT_DETAILS = gql`
  query GetTournamentDetails($id: ID!) {
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
          startedAt
          venue
        }
      }
      settings
    }
  }
`;

// UPDATE_MATCH_SCHEDULE removed - not available in schema

// GET_AUDIT_LOGS removed - not available in schema

describe('Admin App Consumer Contract Tests', () => {
  const provider = new Pact({
    consumer: 'admin-app',
    provider: 'ump-gateway',
    port: 1235,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(async () => {
    await provider.setup();
  });

  const createApolloClient = () => {
    const httpLink = createHttpLink({
      uri: 'http://localhost:1235/graphql',
    });

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: 'Bearer test-token',
        },
      };
    });

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
    await provider.removeInteractions();
  });

  describe('Tournament Management', () => {
    it('should create a new tournament', async () => {
      const interaction = new Interaction()
        .given('user has admin permissions')
        .uponReceiving('a request to create a tournament')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-jwt-token'),
          },
          body: like({
            operationName: 'CreateTournament',
            query: CREATE_TOURNAMENT.loc?.source.body || '',
            variables: like({
              input: like({
                name: 'New Tournament',
                startDate: '2025-04-01',
                endDate: '2025-04-03',
                sport: 'rugby',
              }),
            }),
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              createTournament: {
                id: like('new-tournament-id'),
                name: like('New Tournament'),
                status: like('DRAFT'),
                startDate: like('2025-04-01'),
                endDate: like('2025-04-03'),
              },
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const apolloClient = createApolloClient();
      const result = await apolloClient.mutate({
        mutation: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'New Tournament',
            startDate: '2025-04-01',
            endDate: '2025-04-03',
            sport: 'rugby',
          },
        },
      });

      expect(result.data.createTournament).toBeDefined();
      expect(result.data.createTournament.name).toBe('New Tournament');
      expect(result.data.createTournament.status).toBe('DRAFT');
    });

    it('should update an existing tournament', async () => {
      const interaction = new Interaction()
        .given('tournament with ID 1 exists and user has admin permissions')
        .uponReceiving('a request to update tournament')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-jwt-token'),
          },
          body: like({
            operationName: 'UpdateTournament',
            query: UPDATE_TOURNAMENT.loc?.source.body || '',
            variables: like({
              id: '1',
              input: like({
                name: 'Updated Tournament',
                status: 'PUBLISHED',
              }),
            }),
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              updateTournament: {
                id: like('1'),
                name: like('Updated Tournament Name'),
                status: like('PUBLISHED'),
                startDate: like('2025-04-01'),
                endDate: like('2025-04-03'),
              },
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const apolloClient = createApolloClient();
      const result = await apolloClient.mutate({
        mutation: UPDATE_TOURNAMENT,
        variables: {
          id: '1',
          input: {
            name: 'Updated Tournament Name',
            status: 'PUBLISHED',
          },
        },
      });

      expect(result.data.updateTournament).toBeDefined();
      expect(result.data.updateTournament.name).toBe('Updated Tournament Name');
      expect(result.data.updateTournament.status).toBe('PUBLISHED');
    });

    it('should delete a tournament', async () => {
      const interaction = new Interaction()
        .given('tournament with ID 1 exists and user has admin permissions')
        .uponReceiving('a request to delete tournament')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-jwt-token'),
          },
          body: like({
            operationName: 'DeleteTournament',
            query: DELETE_TOURNAMENT.loc?.source.body || '',
            variables: like({
              id: '1',
            }),
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              deleteTournament: like(true),
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const apolloClient = createApolloClient();
      const result = await apolloClient.mutate({
        mutation: DELETE_TOURNAMENT,
        variables: {
          id: '1',
        },
      });

      expect(result.data.deleteTournament).toBe(true);
    });

    it('should get detailed tournament information', async () => {
      const interaction = new Interaction()
        .given('tournament with ID 1 exists with full details')
        .uponReceiving('a request for detailed tournament information')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer admin-jwt-token'),
          },
          body: like({
            operationName: 'GetTournamentDetails',
            query: GET_TOURNAMENT_DETAILS.loc?.source.body || '',
            variables: like({ id: '1' }),
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
                startDate: like('2025-04-01'),
                endDate: like('2025-04-03'),
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
                      generate: 'SCHEDULED',
                    }),
                    startTime: like('2025-04-01T10:00:00Z'),
                    venue: like('Field A'),
                  }),
                }),
                settings: {
                  maxTeams: like(16),
                  registrationDeadline: like('2025-03-25'),
                  allowLateRegistration: like(false),
                },
              },
            },
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const apolloClient = createApolloClient();
      const result = await apolloClient.query({
        query: GET_TOURNAMENT_DETAILS,
        variables: { id: '1' },
      });

      expect(result.data.tournament).toBeDefined();
      expect(result.data.tournament.settings).toBeDefined();
      expect(result.data.tournament.phases).toBeDefined();
      expect(result.data.tournament.phases.length).toBeGreaterThan(0);
    });
  });

  // describe('Schedule Management', () => {
  //   // Test commented out - UpdateMatchSchedule operation not available in schema
  // });

  // describe('Audit Logs', () => {
  //   // Test commented out - GetAuditLogs operation not available in schema
  // });

  describe('Permission Errors', () => {
    it('should handle permission denied errors', async () => {
      const interaction = new Interaction()
        .given('user does not have admin permissions')
        .uponReceiving('a request to create tournament without permissions')
        .withRequest({
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
            Authorization: like('Bearer user-jwt-token'),
          },
          body: like({
            operationName: 'CreateTournament',
            query: CREATE_TOURNAMENT.loc?.source.body || '',
            variables: like({
              input: like({
                name: 'Unauthorized Tournament',
                startDate: '2025-04-01',
                endDate: '2025-04-03',
                sport: 'rugby',
              }),
            }),
          }),
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: null,
            errors: eachLike({
              message: like('Access denied'),
              extensions: {
                code: like('FORBIDDEN'),
                httpStatus: like(403),
              },
            }),
          },
        });

      await provider.addInteraction(interaction);

      // Add a small delay to ensure the mock server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const apolloClient = createApolloClient();
      const result = await apolloClient.mutate({
        mutation: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Unauthorized Tournament',
            startDate: '2025-04-01',
            endDate: '2025-04-03',
            sport: 'rugby',
          },
        },
        errorPolicy: 'all',
      });

      expect(result.data).toBeNull();
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toMatchObject({
        message: (expect as any).any(String),
        extensions: (expect as any).objectContaining({
          code: 'FORBIDDEN',
          httpStatus: 403,
        }),
      });
    });
  });
});
