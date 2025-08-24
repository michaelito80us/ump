/// <reference types="jest" />

// Clerk dependencies mocking is handled by moduleNameMapper in package.json

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(),
}));

// Mock the entire @ump/core module to avoid Clerk imports
jest.mock('@ump/core', () => {
  // Define error classes directly to avoid importing actual core module
  class TournamentError extends Error {
    public readonly code: string;
    public readonly details?: any;

    constructor(
      message: string,
      code: string = 'TOURNAMENT_ERROR',
      details?: any
    ) {
      super(message);
      this.name = 'TournamentError';
      this.code = code;
      this.details = details;
    }
  }

  class ValidationError extends TournamentError {
    constructor(
      message: string,
      code: string = 'VALIDATION_ERROR',
      details?: any
    ) {
      super(message, code, details);
      this.name = 'ValidationError';
    }
  }

  class PermissionError extends TournamentError {
    constructor(
      message: string,
      code: string = 'PERMISSION_ERROR',
      details?: any
    ) {
      super(message, code, details);
      this.name = 'PermissionError';
    }
  }

  return {
    // Mock basic types and interfaces
    MatchStatus: {
      PENDING: 'pending',
      LIVE: 'live',
      FINAL: 'final',
      NEEDS_APPROVAL: 'needs_approval',
    },
    // Provide error classes without importing actual core
    TournamentError,
    ValidationError,
    PermissionError,
    // Mock other exports as needed
    ClerkProvider: ({ children }: { children: any }) => children,
  };
});

import '@testing-library/jest-dom';

// Mock React createElement for testing
global.React = require('react');
