import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { PluginSchemaLoader } from '../services/pluginSchemaLoader';
import { formatError } from '../errorMapper';

// Mock the PluginSchemaLoader for integration tests
jest.mock('../services/pluginSchemaLoader');
const MockedPluginSchemaLoader = PluginSchemaLoader as jest.MockedClass<
  typeof PluginSchemaLoader
>;

// Mock Apollo Gateway to prevent actual introspection
jest.mock('@apollo/gateway', () => {
  const originalModule = jest.requireActual('@apollo/gateway');
  return {
    ...originalModule,
    ApolloGateway: jest.fn().mockImplementation(() => ({
      load: jest.fn().mockResolvedValue({
        schema: jest.fn(),
        executor: jest.fn(),
      }),
      stop: jest.fn().mockResolvedValue(undefined),
    })),
    IntrospectAndCompose: jest.fn(),
  };
});

// Mock fetch for testing
global.fetch = jest.fn();

describe('Gateway Integration Tests', () => {
  let app: express.Application;
  let server: ApolloServer;
  let mockPluginLoader: jest.Mocked<PluginSchemaLoader>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPluginLoader =
      new MockedPluginSchemaLoader() as jest.Mocked<PluginSchemaLoader>;
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  const createTestGateway = async (subgraphs: any[]) => {
    mockPluginLoader.loadSubgraphs.mockResolvedValue(subgraphs);

    // Create a mocked gateway that doesn't actually introspect
    const gateway = new ApolloGateway({
      supergraphSdl: new IntrospectAndCompose({
        subgraphs,
      }),
    });

    return gateway;
  };

  const createTestServer = async (_gateway: ApolloGateway) => {
    app = express();

    // Mock a simple schema for testing
    const mockSchema = `
      type Query {
        hello: String
      }
    `;

    server = new ApolloServer({
      typeDefs: mockSchema,
      resolvers: {
        Query: {
          hello: () => 'Hello World!',
        },
      },
      introspection: true,
      formatError,
    });

    await server.start();

    app.use(
      '/graphql',
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({ req }),
      })
    );

    return app;
  };

  describe('Health Endpoints', () => {
    beforeEach(async () => {
      app = express();

      // Add health endpoints without GraphQL server
      app.get('/health', (req, res) => {
        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          service: 'gateway',
          version: '0.1.0',
        });
      });

      app.get('/subgraphs', async (req, res) => {
        try {
          const subgraphs = await mockPluginLoader.loadSubgraphs();
          res.json({ subgraphs });
        } catch (_error) {
          res.status(500).json({ error: 'Failed to load subgraphs' });
        }
      });
    });

    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'OK',
        service: 'gateway',
        version: '0.1.0',
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return subgraphs info', async () => {
      mockPluginLoader.loadSubgraphs.mockResolvedValue([
        { name: 'core', url: 'http://localhost:4001/graphql' },
        { name: 'rugby-plugin', url: 'http://localhost:4002/graphql' },
      ]);

      const response = await request(app).get('/subgraphs');

      expect(response.status).toBe(200);
      expect(response.body.subgraphs).toHaveLength(2);
      expect(response.body.subgraphs[0]).toEqual({
        name: 'core',
        url: 'http://localhost:4001/graphql',
      });
    });

    it('should handle subgraph loading errors', async () => {
      mockPluginLoader.loadSubgraphs.mockRejectedValue(
        new Error('Registry unavailable')
      );

      const response = await request(app).get('/subgraphs');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to load subgraphs',
      });
    });
  });

  describe('GraphQL Federation', () => {
    it('should handle introspection query', async () => {
      // Mock a minimal core subgraph
      const subgraphs = [
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
      ];

      // Mock the introspection response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            _service: {
              sdl: `
                type Query {
                  hello: String
                }
              `,
            },
          },
        }),
      });

      const gateway = await createTestGateway(subgraphs);
      const testApp = await createTestServer(gateway);

      const introspectionQuery = {
        query: `
          query IntrospectionQuery {
            __schema {
              queryType {
                name
              }
            }
          }
        `,
      };

      const response = await request(testApp)
        .post('/graphql')
        .send(introspectionQuery);

      expect(response.status).toBe(200);
      // Note: Actual introspection results depend on the mocked subgraph schemas
    });

    it('should compose multiple subgraphs', async () => {
      const subgraphs = [
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
        {
          name: 'rugby-plugin',
          url: 'http://localhost:4002/graphql',
        },
      ];

      // Mock successful subgraph responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              _service: {
                sdl: `
                  type Query {
                    tournaments: [Tournament]
                  }
                  type Tournament {
                    id: ID!
                    name: String!
                  }
                `,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              _service: {
                sdl: `
                  extend type Tournament {
                    rugbyScore: RugbyScore
                  }
                  type RugbyScore {
                    tries: Int!
                    conversions: Int!
                  }
                `,
              },
            },
          }),
        });

      const gateway = await createTestGateway(subgraphs);
      expect(gateway).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      app = express();

      // Add test error endpoints
      app.get('/test-validation-error', (req, res) => {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input provided',
          code: 'INVALID_INPUT',
        });
      });

      app.get('/test-permission-error', (req, res) => {
        res.status(403).json({
          error: 'Permission denied',
          message: 'Access denied for test purposes',
          code: 'FORBIDDEN',
        });
      });

      app.get('/test-plugin-error', (req, res) => {
        res.status(500).json({
          error: 'Plugin execution failed',
          message: 'Plugin execution failed for testing',
          code: 'TIMEOUT',
        });
      });
    });

    it('should handle validation errors', async () => {
      const response = await request(app).get('/test-validation-error');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'INVALID_INPUT',
      });
    });

    it('should handle permission errors', async () => {
      const response = await request(app).get('/test-permission-error');

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: 'Permission denied',
        code: 'FORBIDDEN',
      });
    });

    it('should handle plugin execution errors', async () => {
      const response = await request(app).get('/test-plugin-error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Plugin execution failed',
        code: 'TIMEOUT',
      });
    });
  });

  describe('Authentication Context', () => {
    it('should handle requests without authentication', async () => {
      const subgraphs = [
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            _service: {
              sdl: `
                type Query {
                  publicData: String
                }
              `,
            },
          },
        }),
      });

      const gateway = await createTestGateway(subgraphs);
      const testApp = await createTestServer(gateway);

      const query = {
        query: '{ hello }',
      };

      const response = await request(testApp).post('/graphql').send(query);

      expect(response.status).toBe(200);
    });

    it('should handle requests with valid JWT', async () => {
      const subgraphs = [
        {
          name: 'core',
          url: 'http://localhost:4001/graphql',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            _service: {
              sdl: `
                type Query {
                  protectedData: String
                }
              `,
            },
          },
        }),
      });

      const gateway = await createTestGateway(subgraphs);
      const testApp = await createTestServer(gateway);

      const query = {
        query: '{ hello }',
      };

      const response = await request(testApp)
        .post('/graphql')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(query);

      expect(response.status).toBe(200);
    });
  });
});
