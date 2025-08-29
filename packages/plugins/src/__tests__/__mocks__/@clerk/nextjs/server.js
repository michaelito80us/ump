// Mock implementation for @clerk/nextjs/server
module.exports = {
  auth: jest.fn(() => ({ userId: 'test-user' })),
  currentUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
  User: jest.fn(),
};
