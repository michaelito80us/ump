// Mock implementation for @clerk/backend
module.exports = {
  ClerkBackendApi: jest.fn(),
  createClerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
    },
  })),
};
