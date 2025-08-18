module.exports = {
  auth: jest.fn(() =>
    Promise.resolve({ userId: 'test-user', sessionId: 'test-session' })
  ),
  ClerkProvider: ({ children }) => children,
};
