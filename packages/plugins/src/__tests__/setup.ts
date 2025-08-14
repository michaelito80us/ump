/// <reference types="jest" />

// Mock Clerk dependencies before any imports
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test-user' })),
  currentUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
  User: jest.fn(),
}));

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(),
}));

// Mock the entire @ump/core module to avoid Clerk imports
jest.mock('@ump/core', () => ({
  // Mock basic types and interfaces
  MatchStatus: {
    PENDING: 'pending',
    LIVE: 'live',
    FINAL: 'final',
    NEEDS_APPROVAL: 'needs_approval',
  },
  // Mock other exports as needed
  ClerkProvider: ({ children }: { children: any }) => children,
}));

import '@testing-library/jest-dom';

// Mock React createElement for testing
global.React = require('react');
