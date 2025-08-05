// app/page.tsx
import { ApolloTestComponent } from '../lib/test-apollo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">UMP Mobile</h1>

        <p className="text-center text-gray-600 mb-8">
          Unified Management Platform - Mobile Tournament Management
        </p>

        <div className="max-w-md mx-auto">
          <ApolloTestComponent />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>GraphQL Client Setup Complete ✅</p>
          <p>Apollo Client with Clerk Auth Integration</p>
        </div>
      </div>
    </main>
  );
}
