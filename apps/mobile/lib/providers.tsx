// lib/providers.tsx
'use client';

import { ApolloProvider } from '@apollo/client';
import { ClerkProvider } from '@clerk/nextjs';
import { useApolloClient } from './apolloClient';
import { ClerkAvailabilityProvider } from './hooks/useSafeClerk';

interface ProvidersProps {
  children: React.ReactNode;
}

function ApolloWrapper({ children }: ProvidersProps) {
  const client = useApolloClient();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Check if we have a valid Clerk key
  const hasValidClerkKey =
    publishableKey &&
    !publishableKey.includes('placeholder') &&
    !publishableKey.includes('Y2xlcmstdGVzdC1rZXk');

  // During build time or testing, if no valid Clerk key is provided, render children directly
  if (!hasValidClerkKey) {
    return (
      <ClerkAvailabilityProvider isAvailable={false}>
        <ApolloWrapper>{children}</ApolloWrapper>
      </ClerkAvailabilityProvider>
    );
  }

  return (
    <ClerkAvailabilityProvider isAvailable={true}>
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#0066EE',
            colorBackground: '#ffffff',
            colorInputBackground: '#ffffff',
            colorInputText: '#1f2937',
          },
        }}
      >
        <ApolloWrapper>{children}</ApolloWrapper>
      </ClerkProvider>
    </ClerkAvailabilityProvider>
  );
}
