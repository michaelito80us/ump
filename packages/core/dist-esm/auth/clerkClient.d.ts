/**
 * Client-side authentication utilities for Clerk integration
 * This module can be used in client components
 */
export interface UserContext {
  id: string;
  email: string;
  clerkId: string;
  role: string;
  firstName: string;
  lastName: string;
}
/**
 * Client-side utilities for managing authentication tokens
 */
export declare const ClerkClientUtils: {
  /**
   * Store authentication token in browser storage
   */
  setTokenInWindow: (token: string | null) => void;
  /**
   * Retrieve authentication token from browser storage
   */
  getTokenFromWindow: () => string | null;
  /**
   * Clear authentication token from browser storage
   */
  clearTokenFromWindow: () => void;
};
/**
 * Authentication error classes
 */
export declare class AuthenticationError extends Error {
  constructor(message: string);
}
export declare class AuthorizationError extends Error {
  constructor(message: string);
}
//# sourceMappingURL=clerkClient.d.ts.map
