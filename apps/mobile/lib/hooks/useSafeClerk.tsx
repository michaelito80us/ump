// lib/hooks/useSafeClerk.ts
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
// Define the user type to be compatible with Clerk's UserResource
type ClerkUser = {
  id?: string;
  emailAddresses?: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  [key: string]: unknown;
} | null;

interface SafeClerkData {
  user: ClerkUser;
  isLoaded: boolean;
  isClerkAvailable: boolean;
  authStatus: string;
}

// Create a context to track if Clerk is available
const ClerkAvailabilityContext = createContext<boolean>(false);

export function ClerkAvailabilityProvider({
  children,
  isAvailable,
}: {
  children: ReactNode;
  isAvailable: boolean;
}) {
  return (
    <ClerkAvailabilityContext.Provider value={isAvailable}>
      {children}
    </ClerkAvailabilityContext.Provider>
  );
}

/**
 * A safe wrapper around Clerk's useUser hook that handles cases
 * where ClerkProvider is not available (e.g., in test environments)
 */
export function useSafeClerk(): SafeClerkData {
  const isClerkAvailable = useContext(ClerkAvailabilityContext);

  // Default values for when Clerk is not available
  let user = null;
  let isLoaded = true;
  let authStatus = 'Clerk not available (test mode)';

  // Only use Clerk hooks if we know Clerk is available
  if (isClerkAvailable) {
    try {
      const clerkData = useUser();
      user = clerkData.user;
      isLoaded = clerkData.isLoaded;
      authStatus = isLoaded
        ? user
          ? 'Authenticated'
          : 'Not authenticated'
        : 'Loading...';
    } catch (error) {
      // Fallback if Clerk hooks fail
      console.warn('Clerk hooks failed:', error);
      authStatus = 'Clerk error';
    }
  }

  return {
    user: (user as ClerkUser) ?? null,
    isLoaded,
    isClerkAvailable,
    authStatus,
  };
}
