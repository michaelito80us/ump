// lib/providers.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // During build time, if no valid Clerk key is provided, render children directly
  if (
    !publishableKey ||
    publishableKey.includes('placeholder') ||
    publishableKey.includes('Y2xlcmstdGVzdC1rZXk')
  ) {
    return <>{children}</>;
  }

  return (
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
      {children}
    </ClerkProvider>
  );
}
