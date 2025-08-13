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
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useAuth } from '@clerk/nextjs';

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
            const token = window.__CLERK_TOKEN__;
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
  if (typeof window !== 'undefined' && window.__CLERK_TOKEN__) {
    const token = window.__CLERK_TOKEN__;
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
let apolloClient: ApolloClient<any> | null = null;

export function getApolloClient() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

// Hook to get Apollo Client with auth context
export function useApolloClient() {
  const { getToken } = useAuth();
  const [client, setClient] = React.useState<ApolloClient<any> | null>(null);

  React.useEffect(() => {
    // Only initialize client on the client side
    if (typeof window !== 'undefined') {
      const apolloClientInstance = getApolloClient();
      setClient(apolloClientInstance);

      // Update the global token reference for WebSocket connections
      getToken().then((token) => {
        (window as any).__CLERK_TOKEN__ = token;
      });
    }
  }, [getToken]);

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
