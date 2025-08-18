// lib/apolloClient.ts
'use client';

// Extend Window interface for Clerk token
declare global {
  interface Window {
    __CLERK_TOKEN__?: string;
  }
}

import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  from,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useAuth } from '@clerk/nextjs';
import { useSafeClerk } from './hooks/useSafeClerk';

// Client-side token management utilities
const ClerkClientUtils = {
  setTokenInWindow: (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        window.__CLERK_TOKEN__ = token;
      } else {
        delete window.__CLERK_TOKEN__;
      }
    }
  },
  getTokenFromWindow: (): string | null => {
    if (typeof window !== 'undefined') {
      return window.__CLERK_TOKEN__ || null;
    }
    return null;
  },
  clearTokenFromWindow: () => {
    if (typeof window !== 'undefined') {
      delete window.__CLERK_TOKEN__;
    }
  },
};

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri:
    process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || 'http://localhost:4001/graphql',
});

// WebSocket Link for subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url:
            process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
            'ws://localhost:4001/graphql',
          connectionParams: () => {
            // Get token from Clerk - this will be called for each connection
            const token = ClerkClientUtils.getTokenFromWindow();
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        })
      )
    : null;

// Auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Only try to get token if Clerk is configured
  const token = ClerkClientUtils.getTokenFromWindow();
  if (token) {
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  }

  // Return headers without auth if Clerk is not configured
  return {
    headers: {
      ...headers,
    },
  };
});

// Split link to route queries/mutations to HTTP and subscriptions to WebSocket
const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        from([authLink, httpLink])
      )
    : from([authLink, httpLink]);

// Create Apollo Client instance
export function createApolloClient() {
  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Match: {
          fields: {
            // Enable real-time updates for match scores
            scoreA: {
              merge: true,
            },
            scoreB: {
              merge: true,
            },
            status: {
              merge: true,
            },
          },
        },
        Tournament: {
          fields: {
            matches: {
              merge: false, // Replace array completely on updates
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
      },
      query: {
        errorPolicy: 'all',
      },
    },
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
}

// Singleton Apollo Client instance
let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

// Hook to get Apollo Client with auth context
export function useApolloClient() {
  const { isClerkAvailable } = useSafeClerk();
  const [client, setClient] =
    React.useState<ApolloClient<NormalizedCacheObject> | null>(null);

  // Only use Clerk's useAuth if Clerk is available
  let getToken: (() => Promise<string | null>) | null = null;
  if (isClerkAvailable) {
    try {
      const auth = useAuth();
      getToken = auth.getToken;
    } catch (error) {
      console.warn('Failed to get Clerk auth:', error);
    }
  }

  React.useEffect(() => {
    // Only initialize client on the client side
    if (typeof window !== 'undefined') {
      const apolloClientInstance = getApolloClient();
      setClient(apolloClientInstance);

      // Update the global token reference for WebSocket connections
      if (getToken) {
        getToken()
          .then((token) => {
            ClerkClientUtils.setTokenInWindow(token);
          })
          .catch((error) => {
            console.warn('Failed to get token:', error);
            ClerkClientUtils.setTokenInWindow(null);
          });
      } else {
        // No Clerk available, clear any existing token
        ClerkClientUtils.setTokenInWindow(null);
      }
    }
  }, [getToken, isClerkAvailable]);

  // Return a minimal client for SSR that won't cause hydration issues
  if (typeof window === 'undefined' || !client) {
    return new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
      ssrMode: true,
    });
  }

  return client;
}

// Export the Apollo Client instance for testing
export const testApolloClient = getApolloClient();
