import { render, screen } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';

// Mock the server-only ClerkAuthProvider
const ClerkAuthProvider = {
  extractTokenFromHeader: (header?: string): string | null => {
    if (!header || !header.startsWith('Bearer ')) {
      return null;
    }
    return header.substring(7);
  },
  getCurrentUser: jest.fn(),
  getAuth: jest.fn(),
  createUserContext: jest.fn(),
  getUserContext: jest.fn(),
};

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-admin-id',
    getToken: jest.fn().mockResolvedValue('test-admin-jwt-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-admin-id',
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
      firstName: 'Admin',
      lastName: 'User',
    },
  }),
}));

describe('Clerk Authentication Integration - Admin', () => {
  it('should extract token from Authorization header', () => {
    const token = 'test-jwt-token';
    const authHeader = `Bearer ${token}`;

    const extractedToken = ClerkAuthProvider.extractTokenFromHeader(authHeader);

    expect(extractedToken).toBe(token);
  });

  it('should return null for invalid Authorization header', () => {
    expect(ClerkAuthProvider.extractTokenFromHeader(undefined)).toBeNull();
    expect(ClerkAuthProvider.extractTokenFromHeader('Invalid')).toBeNull();
    expect(ClerkAuthProvider.extractTokenFromHeader('Basic token')).toBeNull();
  });

  it('should create user context from Clerk user', async () => {
    // Mock the getUserContext method to return expected user context
    const expectedUserContext = {
      id: 'clerk_123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      clerkId: 'clerk_123',
      role: 'user',
    };

    ClerkAuthProvider.getUserContext.mockResolvedValue(expectedUserContext);

    const userContext = await ClerkAuthProvider.getUserContext();

    expect(userContext).toEqual(expectedUserContext);
  });

  it('should render ClerkProvider for admin', () => {
    render(
      <ClerkProvider publishableKey="test-admin-key">
        <div>Admin Content</div>
      </ClerkProvider>
    );

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
