# @ump/core

Core package containing canonical types, GraphQL generated types, and shared utilities for the Unified Management Platform.

## Features

- **Canonical Types**: Domain entities (Tournament, Match, Team, Player, etc.)
- **GraphQL Code Generation**: Fully-typed GraphQL operations and React Query hooks
- **Shared Utilities**: Common interfaces and error types

## GraphQL Code Generation

This package includes automatically generated TypeScript types and React Query hooks from the GraphQL schema.

### Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Generate types**:

   ```bash
   pnpm codegen
   ```

3. **Watch mode** (for development):
   ```bash
   pnpm codegen:watch
   ```

### Usage

```typescript
import {
  Tournament,
  Match,
  useTournamentsQuery,
  useMatchUpdatedSubscription
} from '@ump/core/generated';

// Use generated types
const tournament: Tournament = {
  id: '1',
  name: 'Rugby Championship',
  sport: 'rugby',
  // ... other fields
};

// Use generated hooks in React components
function TournamentList() {
  const { data, loading, error } = useTournamentsQuery();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.tournaments.map(tournament => (
        <li key={tournament.id}>{tournament.name}</li>
      ))}
    </ul>
  );
}
```

### Generated Files

- `src/generated/graphql.ts` - TypeScript types and React Query hooks
- `src/generated/introspection.json` - Schema introspection for tooling
- `src/generated/index.ts` - Re-exports for convenience

### Configuration

The GraphQL code generation is configured in the root `codegen.yml` file with:

- **TypeScript types** for all GraphQL schema types
- **React Query hooks** for queries, mutations, and subscriptions
- **Introspection data** for development tools
- **Automatic formatting** with Prettier

### Development

The generated files are automatically created during the build process and should not be manually edited. They are excluded from version control but included in the build output.

To update the generated types:

1. Modify the GraphQL schema in `schema.graphql`
2. Run `pnpm codegen` to regenerate types
3. The new types will be available for import

## Build Process

The package build process:

1. Runs GraphQL code generation
2. Compiles TypeScript to JavaScript
3. Generates type declarations

This ensures that generated GraphQL types are always up-to-date with the schema.
