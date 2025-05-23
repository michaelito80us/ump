# Unified Management Platform

A mobile-first tournament management platform with plugin extensibility, real-time updates, and offline support.

## 🏗️ Architecture

- **Mobile-first PWA** - Next.js 14 with service worker caching
- **Plugin extensibility** - Sports, phases, schedulers as installable plugins
- **Real-time updates** - WebSocket fan-out with <200ms latency
- **Offline tolerance** - Caches fixtures, scores, and assets
- **Full auditability** - Immutable log trail for all mutations

## 📁 Project Structure

```
root/
├── apps/
│   ├── mobile/          # Next.js 14 PWA for players, coaches, spectators
│   └── admin/           # Management console for organizers
├── packages/
│   ├── core/            # Canonical types, shared utilities
│   ├── engine/          # Plugin runtime and execution environment
│   ├── ui/              # shadcn/ui components and design system
│   ├── plugins/         # First-party plugin bundles
│   └── infra-scripts/   # Infrastructure utilities
├── templates/           # Tournament setup templates
├── infra/               # Infrastructure as code
│   └── k8s/             # Kubernetes manifests
└── .github/             # CI/CD workflows
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥18.0.0
- pnpm ≥8.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Lint codebase
pnpm lint
```

## 🔧 Development

### Adding a New Package

1. Create directory under `packages/` or `apps/`
2. Add `package.json` with appropriate scripts
3. Update workspace references as needed

### Code Quality

- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with consistent config
- **Git Hooks**: Pre-commit validation via Husky
- **Type Safety**: Strict TypeScript across all packages

### Commit Convention

Follow conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `chore:` - Maintenance tasks

## 📚 Documentation

- [Implementation Task List](./docs/implementation-task-list.md) - Detailed development roadmap
- [Unified Specification](./docs/unified-spec-document.md) - Complete system specification
- [Architecture Decision Records](./adr/) - Key technical decisions

## 🧩 Plugin System

The platform is built around a plugin architecture supporting:

- **SportPlugins** - Scoring logic and UI components
- **PhasePlugins** - Tournament bracket generation
- **SchedulingPlugins** - Time/venue allocation algorithms
- **TournamentPlugins** - Complete tournament templates

## 🛠️ Tech Stack

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

## 📄 License

Private - All rights reserved

## 🤝 Contributing

See development guidelines in `docs/` for contribution workflow.
