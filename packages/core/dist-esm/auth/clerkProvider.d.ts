import 'server-only';
import { User } from '@clerk/nextjs/server';
import { UserContext } from './clerkClient';
/**
 * Server-side authentication utilities for Clerk integration
 * This module should only be used in server components
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
//# sourceMappingURL=clerkProvider.d.ts.map
