module.exports = {
  auth: jest.fn(() =>
    Promise.resolve({ userId: 'test-user', sessionId: 'test-session' })
  ),
  currentUser: jest.fn(() =>
    Promise.resolve({
      id: 'test-user',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    })
  ),
  clerkMiddleware: jest.fn((handler) => handler),
  createRouteMatcher: jest.fn(() => jest.fn(() => false)),
};
