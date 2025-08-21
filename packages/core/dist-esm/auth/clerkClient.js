'use client';
/**
 * Client-side utilities for managing authentication tokens
 */
export const ClerkClientUtils = {
  /**
   * Store authentication token in browser storage
   */
  setTokenInWindow: (token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('clerk_token', token || '');
    }
  },
  /**
   * Retrieve authentication token from browser storage
   */
  getTokenFromWindow: () => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('clerk_token');
    }
    return null;
  },
  /**
   * Clear authentication token from browser storage
   */
  clearTokenFromWindow: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('clerk_token');
    }
  },
};
/**
 * Authentication error classes
 */
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
//# sourceMappingURL=clerkClient.js.map
