// lib/test-apollo.tsx
'use client';

import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Providers } from './providers';
import { useSafeClerk } from './hooks/useSafeClerk';

// Simple test query - replace with actual schema when available
const TEST_QUERY = gql`
  query TestConnection {
    __typename
  }
`;

function ApolloTestComponentInner() {
  const { user, isLoaded, isClerkAvailable, authStatus } = useSafeClerk();
  const { data, loading, error } = useQuery(TEST_QUERY, {
    errorPolicy: 'all',
  });

  return (
    <div
      className="p-4 border rounded-lg bg-gray-50"
      data-testid="apollo-test-component"
    >
      <h3 className="text-lg font-semibold mb-2">GraphQL Client Test</h3>

      <div className="space-y-2">
        <div data-testid="auth-status">
          <strong>Auth Status:</strong> {authStatus}
        </div>

        <div data-testid="clerk-info">
          <strong>Clerk Available:</strong> {isClerkAvailable ? 'Yes' : 'No'}
        </div>

        <div data-testid="user-info">
          <strong>User:</strong>{' '}
          {isLoaded
            ? user
              ? `Logged in (${user.id})`
              : 'Not logged in'
            : 'Loading...'}
        </div>

        <div data-testid="graphql-status">
          <strong>GraphQL Status:</strong>{' '}
          {loading ? 'Loading...' : error ? 'Error' : 'Connected'}
        </div>

        {error && (
          <div className="text-red-800" data-testid="graphql-error">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {data && (
          <div className="text-green-800" data-testid="graphql-success">
            <strong>Success:</strong> GraphQL client connected (typename:{' '}
            {data.__typename})
          </div>
        )}
      </div>
    </div>
  );
}

export function ApolloTestComponent() {
  return (
    <Providers>
      <ApolloTestComponentInner />
    </Providers>
  );
}
