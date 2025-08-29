// Mock for @clerk/nextjs/server to avoid ES module issues
module.exports = {
  auth: jest.fn(),
  currentUser: jest.fn(),
  User: jest.fn(),
};
