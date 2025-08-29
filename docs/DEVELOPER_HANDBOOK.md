# Developer Handbook

Welcome to the Unified Management Platform (UMP) development team! This
handbook provides everything you need to get started contributing to our
mobile-first tournament management platform.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** ≥18.0.0 ([Download](https://nodejs.org/))
- **pnpm** ≥8.0.0 ([Installation Guide](https://pnpm.io/installation))
- **Docker** & **Docker Compose** (for local development environment)
- **Git** (latest version)

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd unified-management-platform
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy environment templates
   cp apps/mobile/.env.example apps/mobile/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   cp packages/backend/.env.example packages/backend/.env
   cp packages/gateway/.env.example packages/gateway/.env
   ```

4. **Start the development environment**

   ```bash
   # Start database and Redis
   pnpm docker:up

   # Start all development servers
   pnpm dev
   ```

5. **Verify setup**
   - Mobile PWA: <http://localhost:3001>
   - Admin Console: <http://localhost:3000>
   - Storybook: <http://localhost:6006>
   - GraphQL Playground: <http://localhost:4000/graphql>

## 📁 Project Architecture

### Monorepo Structure

```text
root/
├── apps/
│   ├── mobile/          # Next.js 14 PWA (players, coaches, spectators)
│   └── admin/           # Management console (organizers)
├── packages/
│   ├── core/            # Canonical types, shared utilities
│   ├── engine/          # Plugin runtime and execution environment
│   ├── ui/              # shadcn/ui components and design system
│   ├── plugins/         # First-party plugin bundles
│   ├── backend/         # GraphQL API server
│   ├── gateway/         # Apollo Federation gateway
│   ├── realtime/        # WebSocket service
│   └── infra-scripts/   # Infrastructure utilities
├── templates/           # Tournament setup templates
├── infra/               # Infrastructure as code
│   ├── k8s/             # Kubernetes manifests
│   ├── monitoring/      # Grafana & Prometheus configs
│   └── sql/             # Database migrations
└── .github/             # CI/CD workflows
```

### Key Technologies

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | Next.js 14, React 18, TypeScript |
| UI       | Tailwind CSS, shadcn/ui          |
| State    | Apollo Client, GraphQL           |
| Backend  | Apollo Server, Federation        |
| Database | PostgreSQL, Redis                |
| Auth     | Clerk                            |
| Build    | TurboRepo, pnpm                  |
| Deploy   | Docker, Kubernetes               |

## 🛠️ Development Workflow

### Available Scripts

```bash
# Development
pnpm dev                    # Start all development servers
pnpm dev:federation        # Start only backend + gateway
pnpm storybook             # Start Storybook component library

# Building
pnpm build                 # Build all packages
pnpm type-check           # TypeScript type checking
pnpm codegen              # Generate GraphQL types

# Testing
pnpm test                 # Run all tests
pnpm test:coverage        # Run tests with coverage
pnpm test:contract        # Run contract tests
pnpm lint                 # Lint all code

# Docker
pnpm docker:up            # Start local services (DB, Redis)
pnpm docker:down          # Stop local services
pnpm docker:reset         # Reset and rebuild containers

# Utilities
pnpm format               # Format code with Prettier
pnpm clean                # Clean build artifacts
```

### Adding New Packages

1. **Create package directory**

   ```bash
   mkdir packages/my-package
   cd packages/my-package
   ```

2. **Initialize package.json**

   ```json
   {
     "name": "@ump/my-package",
     "version": "0.1.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch",
       "lint": "eslint src/",
       "test": "jest"
     }
   }
   ```

3. **Add TypeScript configuration**

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"],
     "exclude": ["dist", "node_modules"]
   }
   ```

4. **Update workspace references**
   - Add to root `tsconfig.json` references
   - Update path mappings in `tsconfig.base.json` if needed

## 📝 Coding Standards

### TypeScript Guidelines

- **Strict mode enabled** - All TypeScript strict checks are enforced
- **Explicit types** - Prefer explicit type annotations for public APIs
- **Interface over type** - Use `interface` for object shapes, `type`
  for unions/intersections
- **Consistent naming**:
  - `PascalCase` for types, interfaces, classes, components
  - `camelCase` for variables, functions, methods
  - `SCREAMING_SNAKE_CASE` for constants
  - `kebab-case` for file names

```typescript
// ✅ Good
interface TournamentConfig {
  readonly id: string;
  name: string;
  startDate: Date;
}

const MAX_PARTICIPANTS = 64;

function createTournament(config: TournamentConfig): Tournament {
  // Implementation
}

// ❌ Avoid
type tournamentconfig = {
  id: any;
  name: any;
};
```

### React Component Guidelines

- **Functional components** with hooks (no class components)
- **TypeScript interfaces** for props
- **Default exports** for components
- **Named exports** for utilities and hooks

```typescript
// ✅ Good
interface TournamentCardProps {
  tournament: Tournament;
  onSelect?: (tournament: Tournament) => void;
}

export default function TournamentCard({
  tournament,
  onSelect
}: TournamentCardProps) {
  return (
    <Card onClick={() => onSelect?.(tournament)}>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
      </CardHeader>
    </Card>
  );
}

// Named export for utilities
export function formatTournamentDate(date: Date): string {
  return date.toLocaleDateString();
}
```

### Code Formatting

**Prettier Configuration:**

- Semi-colons: Required
- Quotes: Single quotes
- Trailing commas: ES5 style
- Print width: 80 characters
- Tab width: 2 spaces
- No tabs (spaces only)

**ESLint Rules:**

- TypeScript recommended rules
- React hooks rules
- Import/export ordering
- No unused variables
- Consistent return types

### File Organization

```text
packages/my-package/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Pure utility functions
│   ├── types/           # Type definitions
│   ├── constants/       # Application constants
│   └── index.ts         # Package entry point
├── __tests__/           # Test files
├── package.json
└── tsconfig.json
```

### Import/Export Conventions

```typescript
// ✅ Preferred import order
// 1. Node modules
import React from 'react';
import { NextPage } from 'next';

// 2. Internal packages
import { Tournament } from '@ump/core';
import { Button } from '@ump/ui';

// 3. Relative imports
import { formatDate } from '../utils/date';
import TournamentCard from './TournamentCard';

// ✅ Barrel exports in index.ts
export { default as TournamentCard } from './components/TournamentCard';
export { useTournament } from './hooks/useTournament';
export type { Tournament, TournamentConfig } from './types';
```

## 🧪 Testing Standards

### Test Structure

- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `*.e2e.test.ts`
- **Test location**: Co-located with source files or in `__tests__/` directory

### Testing Guidelines

```typescript
// ✅ Good test structure
describe('TournamentCard', () => {
  const mockTournament: Tournament = {
    id: '1',
    name: 'Test Tournament',
    startDate: new Date('2024-01-01'),
  };

  it('should render tournament name', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<TournamentCard tournament={mockTournament} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockTournament);
  });
});
```

## 🔄 Git Workflow

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**

```text
feat(mobile): add tournament registration flow
fix(engine): resolve plugin context injection issue
docs: update developer handbook setup instructions
test(ui): add accessibility tests for Button component
```

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `fix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Implement changes** following coding standards
3. **Write/update tests** with good coverage
4. **Run quality checks**:

   ```bash
   pnpm lint
   pnpm test
   pnpm type-check
   pnpm format:check
   ```

5. **Create pull request** with descriptive title and description
6. **Request review** from team members
7. **Address feedback** and ensure CI passes
8. **Merge** after approval

## 🔧 Development Tools

### Recommended VS Code Extensions

- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - Real-time linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class suggestions
- **GraphQL** - GraphQL syntax highlighting
- **Jest** - Test runner integration
- **GitLens** - Enhanced Git capabilities

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

## 🚀 Deployment

### Local Development

```bash
# Start full development environment
pnpm docker:up && pnpm dev
```

### Production Build

```bash
# Build all packages
pnpm build

# Test production build locally
pnpm docker:build
pnpm docker:up
```

### Environment Variables

Each application requires specific environment variables. See `.env.example`
files in:

- `apps/mobile/.env.example`
- `apps/admin/.env.example`
- `packages/backend/.env.example`
- `packages/gateway/.env.example`

## 📚 Additional Resources

- [Implementation Task List](./implementation-task-list.md) - Detailed
  development roadmap
- [Unified Specification](./unified-spec-document.md) - Complete system specification
- [Architecture Decision Records](../adr/) - Key technical decisions
- [Plugin Authoring Guide](./PLUGIN_GUIDE.md) - How to create plugins

## 🆘 Getting Help

- **Documentation Issues**: Create an issue with the `documentation` label
- **Setup Problems**: Check existing issues or create a new one
- **Code Questions**: Use team communication channels
- **Bug Reports**: Follow the issue template in `.github/ISSUE_TEMPLATE/`

## 🤝 Contributing

We welcome contributions! Please:

1. Read this handbook thoroughly
2. Follow our coding standards and conventions
3. Write tests for new functionality
4. Update documentation as needed
5. Be respectful and collaborative

Thank you for contributing to the Unified Management Platform! 🎉
