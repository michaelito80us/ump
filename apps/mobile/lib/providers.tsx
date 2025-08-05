// lib/providers.tsx
'use client';

import { ApolloProvider } from '@apollo/client';
import { ClerkProvider } from '@clerk/nextjs';
import { useApolloClient } from './apolloClient';

interface ProvidersProps {
  children: React.ReactNode;
}

function ApolloWrapper({ children }: ProvidersProps) {
  const client = useApolloClient();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
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
  );
}
