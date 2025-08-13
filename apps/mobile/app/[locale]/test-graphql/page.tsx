'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Dynamically import ApolloTestComponent with SSR disabled to prevent hydration issues
const ApolloTestComponent = dynamic(
  () =>
    import('../../../lib/test-apollo').then((mod) => ({
      default: mod.ApolloTestComponent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">GraphQL Client Test</h3>
        <div className="space-y-2">
          <div>
            <strong>Auth Status:</strong> Loading...
          </div>
          <div>
            <strong>GraphQL Status:</strong> Initializing...
          </div>
        </div>
      </div>
    ),
  }
);

export default function TestGraphQLPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          🔗 GraphQL Client Test
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Testing Apollo Client integration with Clerk authentication
        </p>
        <p className="text-sm text-blue-600">
          This page verifies that the GraphQL client can connect to the gateway
        </p>
      </div>

      <div className="mb-8">
        <ApolloTestComponent />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          📋 Test Checklist
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            Apollo Client configuration
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            HTTP Link for queries/mutations
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            WebSocket Link for subscriptions
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            Clerk JWT authentication
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            Error handling
          </li>
          <li className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            Cache configuration
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">
          ⚠️ Expected Behavior
        </h3>
        <div className="text-sm space-y-2">
          <p>
            <strong>If Gateway is Running:</strong> Should show "Connected"
            status with typename
          </p>
          <p>
            <strong>If Gateway is Down:</strong> Should show "Error" status with
            connection error
          </p>
          <p>
            <strong>Authentication:</strong> Should show current Clerk auth
            status
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← {t('back')} to Home
        </Link>
        <Link
          href={`/${locale}/test`}
          className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          📋 i18n Test Page
        </Link>
      </div>
    </div>
  );
}
