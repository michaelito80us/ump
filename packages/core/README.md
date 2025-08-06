# @ump/core

Core types and utilities for the Unified Management Platform (UMP).

## Overview

This package provides the canonical TypeScript definitions and shared utilities that form the foundation of the UMP tournament management system. It serves as the single source of truth for all domain entities and their relationships.

## Installation

```bash
pnpm add @ump/core
```

## Usage

### Basic Types

```typescript
import { Tournament, Match, Team, Player } from '@ump/core';

// Use the canonical types in your application
const tournament: Tournament = {
  id: 'tournament-1',
  name: 'Summer Championship',
  sport: 'rugby',
  status: 'not_started',
  phases: [],
  config: {
    statTier: 2,
    plugins: {
      sport: 'rugby-7s',
      phases: [],
    },
  },
  isLocked: false,
};
```

### Error Handling

```typescript
import { ValidationError, TournamentError } from '@ump/core';

try {
  // Tournament operations
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof TournamentError) {
    console.error('Tournament error:', error.message);
  }
}
```

### Type Guards

```typescript
import { isValidMatchStatus, assertMatch } from '@ump/core';

// Type guard
if (isValidMatchStatus(status)) {
  // status is now typed as MatchStatus
}

// Type assertion
try {
  assertMatch(unknownObject);
  // unknownObject is now typed as Match
} catch (error) {
  // Handle invalid match
}
```

### GraphQL Integration

```typescript
import { GraphQL } from '@ump/core';

// Access generated GraphQL types and hooks
const { useTournamentQuery } = GraphQL;
```

## Exports

- **Main exports** (`@ump/core`): All canonical types, error classes, constants, and utilities
- **Generated GraphQL** (`@ump/core/generated`): Auto-generated GraphQL types and React Query hooks
- **Types only** (`@ump/core/types`): Just the type definitions without utilities

## Type Safety

All types are strictly typed with TypeScript and include:

- Frozen enums and string unions to prevent runtime modification
- Comprehensive error hierarchy with structured error codes
- Type guards and assertion helpers for runtime validation
- Full JSDoc documentation for better IDE support

## Dependencies

- `@tanstack/react-query`: For GraphQL hooks (peer dependency)
- `graphql`: For GraphQL type definitions

## Development

```bash
# Build the package
pnpm build

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Generate GraphQL types
pnpm codegen
```

## License

Private - Part of the Unified Management Platform

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
