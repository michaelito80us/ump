import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
/**
 * Server-side authentication utilities for Clerk integration
 * This module should only be used in server components
 */
export class ClerkAuthProvider {
  /**
   * Get the current authenticated user from Clerk
   * @returns Promise<User | null>
   */
  static async getCurrentUser() {
    try {
      return await currentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  /**
   * Get the current user's authentication state
   * @returns Promise<{ userId: string | null; sessionId: string | null }>
   */
  static async getAuth() {
    try {
      const { userId, sessionId } = await auth();
      return { userId, sessionId };
    } catch (error) {
      console.error('Error getting auth state:', error);
      return { userId: null, sessionId: null };
    }
  }
  /**
   * Check if the current user is authenticated
   * @returns Promise<boolean>
   */
  static async isAuthenticated() {
    const { userId } = await this.getAuth();
    return !!userId;
  }
  /**
   * Get user context for GraphQL resolvers
   * @returns Promise<UserContext | null>
   */
  static async getUserContext() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        clerkId: user.id,
        role: user.publicMetadata?.role || 'user',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }
  /**
   * Extract JWT token from request headers
   * @param authHeader - Authorization header value
   * @returns string | null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
// Client-side utilities and error classes are now in clerkClient.ts
// Import them from there to avoid server-only imports in client components
//# sourceMappingURL=clerkProvider.js.map
