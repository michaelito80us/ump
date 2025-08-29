// lib/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { WebSocketProvider } from './websocket-provider';

interface ProvidersProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Check if we have a valid Clerk key (not placeholder or test key)
  const hasValidClerkKey =
    publishableKey &&
    !publishableKey.includes('placeholder') &&
    !publishableKey.includes(
      'Y2xlcmstdGVzdC1rZXktZm9yLWJ1aWxkLXB1cnBvc2VzLW9ubHk'
    );

  if (!hasValidClerkKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>{children}</WebSocketProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>{children}</WebSocketProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
