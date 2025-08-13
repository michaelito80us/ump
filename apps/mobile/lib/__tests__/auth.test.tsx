import { render, screen } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
// Using mocked ClerkClientUtils from jest.mock('@ump/core') below

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    getToken: jest.fn().mockResolvedValue('test-jwt-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
  }),
}));

// Mock Clerk server functions
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

// Mock @ump/core to avoid server-side imports in tests
let mockToken: string | null = null;

jest.mock('@ump/core', () => ({
  ClerkClientUtils: {
    setTokenInWindow: jest.fn((token: string | null) => {
      mockToken = token;
    }),
    getTokenFromWindow: jest.fn(() => mockToken),
    clearTokenFromWindow: jest.fn(() => {
      mockToken = null;
    }),
  },
  ClerkAuthProvider: {
    extractTokenFromHeader: jest.fn(),
    createUserContext: jest.fn(),
  },
}));

// Get the mocked ClerkClientUtils

const { ClerkClientUtils } = jest.requireMock('@ump/core');

describe('Clerk Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken = null; // Reset mock token state
    // Clear any existing tokens

    ClerkClientUtils.clearTokenFromWindow();
  });

  afterEach(() => {
    // Clean up after each test

    ClerkClientUtils.clearTokenFromWindow();
  });

  it('should set and get token from window', () => {
    const testToken = 'test-jwt-token';

    // Set token

    ClerkClientUtils.setTokenInWindow(testToken);

    // Get token

    const retrievedToken = ClerkClientUtils.getTokenFromWindow();

    expect(retrievedToken).toBe(testToken);
  });

  it('should clear token from window', () => {
    const testToken = 'test-jwt-token';

    // Set token

    ClerkClientUtils.setTokenInWindow(testToken);

    expect(ClerkClientUtils.getTokenFromWindow()).toBe(testToken);

    // Clear token

    ClerkClientUtils.clearTokenFromWindow();

    expect(ClerkClientUtils.getTokenFromWindow()).toBeNull();
  });

  it('should handle null token gracefully', () => {
    ClerkClientUtils.setTokenInWindow(null);

    expect(ClerkClientUtils.getTokenFromWindow()).toBeNull();
  });

  it('should render ClerkProvider', () => {
    render(
      <ClerkProvider publishableKey="test-key">
        <div>Test Content</div>
      </ClerkProvider>
    );

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
