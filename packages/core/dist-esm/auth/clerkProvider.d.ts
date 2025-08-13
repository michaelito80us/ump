import { User } from '@clerk/nextjs/server';
/**
 * Server-side authentication utilities for Clerk integration
 */
export declare class ClerkAuthProvider {
  /**
   * Get the current authenticated user from Clerk
   * @returns Promise<User | null>
   */
  static getCurrentUser(): Promise<User | null>;
  /**
   * Get the current user's authentication state
   * @returns Promise<{ userId: string | null; sessionId: string | null }>
   */
  static getAuth(): Promise<{
    userId: string | null;
    sessionId: string | null;
  }>;
  /**
   * Check if the current user is authenticated
   * @returns Promise<boolean>
   */
  static isAuthenticated(): Promise<boolean>;
  /**
   * Get user context for GraphQL resolvers
   * @returns Promise<UserContext | null>
   */
  static getUserContext(): Promise<UserContext | null>;
  /**
   * Extract JWT token from request headers
   * @param authHeader - Authorization header value
   * @returns string | null
   */
  static extractTokenFromHeader(authHeader?: string): string | null;
}
/**
 * User context interface for GraphQL resolvers
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
 * Client-side authentication hook utilities
 */
export declare const ClerkClientUtils: {
  /**
   * Set Clerk token in window for Apollo Client
   * @param token - JWT token from Clerk
   */
  setTokenInWindow: (token: string | null) => void;
  /**
   * Get Clerk token from window
   * @returns string | null
   */
  getTokenFromWindow: () => string | null;
  /**
   * Clear Clerk token from window
   */
  clearTokenFromWindow: () => void;
};
/**
 * Error types for authentication
 */
export declare class AuthenticationError extends Error {
  constructor(message: string);
}
export declare class AuthorizationError extends Error {
  constructor(message: string);
}
//# sourceMappingURL=clerkProvider.d.ts.map
