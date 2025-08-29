'use client';

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
export const ClerkClientUtils = {
  /**
   * Store authentication token in browser storage
   */
  setTokenInWindow: (token: string | null) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('clerk_token', token || '');
    }
  },

  /**
   * Retrieve authentication token from browser storage
   */
  getTokenFromWindow: (): string | null => {
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
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
