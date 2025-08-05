// lib/test-apollo.tsx
'use client';

import { useQuery, gql } from '@apollo/client';
import { useUser } from '@clerk/nextjs';

// Simple test query - replace with actual schema when available
const TEST_QUERY = gql`
  query TestConnection {
    __typename
  }
`;

export function ApolloTestComponent() {
  const { user, isLoaded } = useUser();
  const { data, loading, error } = useQuery(TEST_QUERY, {
    errorPolicy: 'all',
  });

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">GraphQL Client Test</h3>

      <div className="space-y-2">
        <div>
          <strong>Auth Status:</strong>{' '}
          {isLoaded
            ? user
              ? 'Authenticated'
              : 'Not authenticated'
            : 'Loading...'}
        </div>

        <div>
          <strong>GraphQL Status:</strong>{' '}
          {loading ? 'Loading...' : error ? 'Error' : 'Connected'}
        </div>

        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {data && (
          <div className="text-green-600">
            <strong>Success:</strong> GraphQL client connected (typename:{' '}
            {data.__typename})
          </div>
        )}
      </div>
    </div>
  );
}
