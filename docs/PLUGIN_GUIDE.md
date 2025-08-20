# UMP Plugin Authoring Guide

Welcome to the Unified Management Platform (UMP) Plugin Development Guide!
This comprehensive guide will teach you how to create, test, and publish
plugins for the UMP ecosystem.

## Table of Contents

- [Overview](#overview)
- [Plugin Types](#plugin-types)
- [Getting Started](#getting-started)
- [Plugin Structure](#plugin-structure)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Development Workflow](#development-workflow)
- [Testing with Conformance Harness](#testing-with-conformance-harness)
- [Best Practices](#best-practices)
- [Example Implementations](#example-implementations)
- [Publishing Guidelines](#publishing-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

UMP plugins extend the platform's functionality by providing sport-specific
logic, tournament phases, scheduling algorithms, and more. The plugin system
is built on TypeScript and React, ensuring type safety and modern development
practices.

### Key Features

- **Type-safe**: Full TypeScript support with comprehensive interfaces
- **React 18 compatible**: Modern React with SSR support
- **Lifecycle hooks**: Event-driven architecture for plugin integration
- **Internationalization**: Built-in i18n support for multiple languages
- **Conformance testing**: Automated QA suite for plugin validation
- **Secure execution**: VM2 sandbox for safe third-party code execution

## Plugin Types

UMP supports five types of plugins:

### 1. Sport Plugins

Define sport-specific scoring rules, validation, and UI components.

**Required Methods:**

- `calculateTotalScore(breakdown, ctx?)` - Calculate total score from breakdown
- `validateScore(breakdown)` - Validate score data
- `renderScoreEntry()` - React component for score input
- `renderScore(match)` - React component for score display

**Required Metadata:**

- `statSchema: string[]` - Array of stat field names

### 2. Phase Plugins

Implement tournament phase logic (brackets, round-robin, etc.).

**Required Methods:**

- `generateSchedule(teams, settings)` - Generate match schedule
- `renderBracketUI(phase)` - React component for bracket visualization

**Optional Methods:**

- `getNextMatches(phase)` - Get upcoming matches
- `renderStandings(phase)` - React component for standings
- `calculateStandings(phase, settings)` - Calculate team standings
- `getHeadToHeadRecord(phase, teamAId, teamBId)` - H2H statistics

### 3. Seeding Plugins

Determine initial team seeding for tournaments.

**Required Methods:**

- `seedTeams(teams, options?)` - Return seeded team array

### 4. Scheduling Plugins

Optimize match scheduling based on constraints.

**Required Methods:**

- `scheduleMatches(matches, config)` - Return scheduled matches

### 5. Tournament Plugins

Define complete tournament formats combining multiple phases.

**Required Metadata:**

- `sport: string` - Sport plugin ID
- `phases: Array` - Phase configuration
- `scoringRules: Record<string, number>` - Scoring rules
- `tiebreakerRules: string[]` - Tiebreaker order

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- TypeScript 5+
- React 18+

### Setup Development Environment

1. **Clone the UMP repository:**

   ```bash
   git clone https://github.com/your-org/ump.git
   cd ump
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Copy the plugin harness template:**

   ```bash
   cp -r templates/plugin-harness my-plugin
   cd my-plugin
   pnpm install
   ```

4. **Run sample tests:**

   ```bash
   pnpm test
   ```

## Plugin Structure

### Basic Plugin Interface

All plugins must implement the `BasePluginMeta` interface:

```typescript
export interface BasePluginMeta {
  id: string; // Unique identifier (e.g., "rugby-7s")
  name: string; // Human-readable name
  version?: string; // Semantic version
  description?: string; // Plugin description
  author?: string; // Author name
  supportedLanguages?: string[]; // Supported locales
  i18n: Record<string, Record<string, string>>; // Translations
  capabilities?: string[]; // Feature flags
  lifecycleHooks?: Partial<LifecycleHooks>; // Event hooks
}
```

### File Organization

```text
my-plugin/
├── src/
│   ├── index.ts          # Main plugin export
│   ├── types.ts          # Plugin-specific types
│   ├── components/       # React components
│   │   ├── ScoreEntry.tsx
│   │   └── ScoreDisplay.tsx
│   └── utils/            # Helper functions
│       └── calculations.ts
├── __tests__/
│   ├── plugin.test.ts    # Conformance tests
│   └── components.test.tsx
├── package.json
├── tsconfig.json
└── README.md
```

### Internationalization

Plugins must provide translations for all user-facing text:

```typescript
const plugin: SportPlugin = {
  id: 'rugby-union',
  name: 'Rugby Union',
  supportedLanguages: ['en', 'es', 'fr'],
  i18n: {
    en: {
      tries: 'Tries',
      conversions: 'Conversions',
      penalties: 'Penalties',
      dropGoals: 'Drop Goals',
    },
    es: {
      tries: 'Ensayos',
      conversions: 'Conversiones',
      penalties: 'Penales',
      dropGoals: 'Drop Goals',
    },
    fr: {
      tries: 'Essais',
      conversions: 'Transformations',
      penalties: 'Pénalités',
      dropGoals: 'Drops',
    },
  },
  // ... rest of plugin
};
```

## Lifecycle Hooks

Lifecycle hooks allow plugins to respond to tournament events:

### Available Hooks

```typescript
export interface LifecycleHooks {
  onTournamentStart?: (ctx: TournamentContext) => Promise<void>;
  onTournamentEnd?: (ctx: TournamentContext) => Promise<void>;
  onMatchStart?: (match: Match, ctx: MatchContext) => Promise<void>;
  onMatchFinal?: (match: Match, ctx: MatchContext) => Promise<void>;
  beforePhaseGenerate?: (phase: Phase) => Promise<Phase>;
  afterPhaseGenerate?: (phase: Phase) => Promise<void>;
  afterStandingsUpdate?: (leaderboard: LeaderboardEntry[]) => Promise<void>;
}
```

### Hook Usage Example

```typescript
const plugin: SportPlugin = {
  id: 'my-sport',
  name: 'My Sport',
  // ... other properties

  lifecycleHooks: {
    onTournamentStart: async (ctx) => {
      console.log(`Tournament ${ctx.tournament.name} starting!`);
      // Initialize plugin state
    },

    onMatchFinal: async (match, ctx) => {
      // Update statistics after match completion
      await updatePlayerStats(match, ctx.tournament);
    },

    afterStandingsUpdate: async (leaderboard) => {
      // React to standings changes
      const leader = leaderboard[0];
      console.log(`New leader: Team ${leader.teamId}`);
    },
  },
};
```

### Hook Execution Order

Hooks are executed with priority-based ordering:

- Lower priority numbers execute first (default: 100)
- Hooks run serially with error isolation
- Failed hooks don't prevent other hooks from executing
- 5-second timeout per hook to prevent hanging

## Development Workflow

### 1. Create Plugin Structure

```typescript
// src/index.ts
import type { SportPlugin } from '@ump/engine';
import { ScoreEntry } from './components/ScoreEntry';
import { ScoreDisplay } from './components/ScoreDisplay';

export const MyPlugin: SportPlugin = {
  id: 'my-sport',
  name: 'My Sport',
  version: '1.0.0',
  description: 'A custom sport plugin',
  author: 'Your Name',
  supportedLanguages: ['en'],
  i18n: {
    en: {
      // translations
    }
  },
  statSchema: ['goals', 'assists'],

  calculateTotalScore(breakdown) {
    return (breakdown.goals || 0) * 2 + (breakdown.assists || 0);
  },

  validateScore(breakdown) {
    if (breakdown.goals < 0) return 'Goals cannot be negative';
    if (breakdown.assists < 0) return 'Assists cannot be negative';
    return null;
  },

  renderScoreEntry() {
    return <ScoreEntry />;
  },

  renderScore(match) {
    return <ScoreDisplay match={match} />;
  }
};

export default MyPlugin;
```

### 2. Implement React Components

```typescript
// src/components/ScoreEntry.tsx
import React, { useState } from 'react';

export function ScoreEntry() {
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);

  return (
    <div className="score-entry">
      <label>
        Goals:
        <input
          type="number"
          value={goals}
          onChange={(e) => setGoals(Number(e.target.value))}
          min="0"
          data-testid="goals-input"
        />
      </label>
      <label>
        Assists:
        <input
          type="number"
          value={assists}
          onChange={(e) => setAssists(Number(e.target.value))}
          min="0"
          data-testid="assists-input"
        />
      </label>
    </div>
  );
}
```

### 3. Add Type Definitions

```typescript
// src/types.ts
export interface MyScoreBreakdown {
  goals: number;
  assists: number;
}

export interface MyPluginSettings {
  goalValue: number;
  assistValue: number;
  enableOvertime: boolean;
}
```

## Testing with Conformance Harness

The conformance harness validates your plugin against UMP standards:

### Basic Conformance Test

```typescript
// __tests__/plugin.test.ts
import { testPluginConformance } from '@ump/engine/harness';
import { MyPlugin } from '../src';

describe('My Plugin Conformance', () => {
  it('should pass all conformance tests', async () => {
    const results = await testPluginConformance(MyPlugin, 'sport');

    expect(results.metadata.passed).toBe(true);
    expect(results.lifecycle.passed).toBe(true);
    expect(results.ui.passed).toBe(true);
    expect(results.ssr.passed).toBe(true);

    // Check for any errors
    expect(results.metadata.errors).toHaveLength(0);
    expect(results.lifecycle.errors).toHaveLength(0);
    expect(results.ui.errors).toHaveLength(0);
    expect(results.ssr.errors).toHaveLength(0);
  });
});
```

### Individual Test Categories

```typescript
import { PluginConformanceHarness } from '@ump/engine/harness';

const harness = new PluginConformanceHarness();

// Test metadata only
const metadataResult = await harness.testMetadata(MyPlugin);

// Test lifecycle methods
const lifecycleResult = await harness.testLifecycle(MyPlugin, 'sport');

// Test UI components
const uiResult = await harness.testUI(MyPlugin, 'sport');

// Test SSR compatibility
const ssrResult = await harness.testSSR(MyPlugin, 'sport');
```

### Custom Test Matcher

```typescript
import { expectPluginToBeConformant } from '@ump/engine/harness';

// Custom matcher for cleaner tests
expect(MyPlugin).toPassConformance('sport');
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test plugin.test.ts

# Watch mode for development
pnpm test --watch
```

## Best Practices

### Code Quality

1. **Use TypeScript strictly**:

   - Enable all strict mode options
   - Provide explicit type annotations for public APIs
   - Use interfaces for object shapes, types for unions

2. **Follow naming conventions**:

   - `PascalCase` for types, interfaces, classes, components
   - `camelCase` for variables, functions, methods
   - `SCREAMING_SNAKE_CASE` for constants
   - `kebab-case` for plugin IDs and file names

3. **Error handling**:
   - Always validate input parameters
   - Return descriptive error messages
   - Use null/undefined for "no error" states
   - Handle edge cases gracefully

### Performance

1. **Optimize calculations**:

   - Cache expensive computations
   - Use memoization for React components
   - Avoid unnecessary re-renders

2. **Memory management**:
   - Clean up event listeners in lifecycle hooks
   - Avoid memory leaks in long-running processes
   - Use WeakMap/WeakSet for temporary references

### Security

1. **Input validation**:

   - Sanitize all user inputs
   - Validate score breakdowns thoroughly
   - Check for injection attacks

2. **Safe rendering**:
   - Escape user-generated content
   - Use React's built-in XSS protection
   - Validate props before rendering

### Accessibility

1. **WCAG compliance**:

   - Provide proper ARIA labels
   - Ensure keyboard navigation
   - Maintain color contrast ratios
   - Support screen readers

2. **Testing**:
   - Use `@testing-library/jest-dom` for a11y tests
   - Run axe-core checks in your tests
   - Test with actual assistive technologies

## Example Implementations

### Complete Sport Plugin Example

```typescript
// Basketball plugin implementation
import React from 'react';
import type { SportPlugin, Match, MatchContext } from '@ump/engine';

export interface BasketballScore {
  fieldGoals: number;
  threePointers: number;
  freeThrows: number;
}

export const BasketballPlugin: SportPlugin = {
  id: 'basketball',
  name: 'Basketball',
  version: '1.0.0',
  description: 'Standard basketball scoring',
  author: 'UMP Team',
  supportedLanguages: ['en', 'es'],
  i18n: {
    en: {
      fieldGoals: 'Field Goals',
      threePointers: '3-Pointers',
      freeThrows: 'Free Throws',
      points: 'Points'
    },
    es: {
      fieldGoals: 'Canastas de Campo',
      threePointers: 'Triples',
      freeThrows: 'Tiros Libres',
      points: 'Puntos'
    }
  },
  statSchema: ['fieldGoals', 'threePointers', 'freeThrows'],

  calculateTotalScore(breakdown: BasketballScore): number {
    const { fieldGoals = 0, threePointers = 0, freeThrows = 0 } = breakdown;
    return fieldGoals * 2 + threePointers * 3 + freeThrows * 1;
  },

  validateScore(breakdown: BasketballScore): string | null {
    const { fieldGoals, threePointers, freeThrows } = breakdown;

    if (fieldGoals < 0) return 'Field goals cannot be negative';
    if (threePointers < 0) return 'Three-pointers cannot be negative';
    if (freeThrows < 0) return 'Free throws cannot be negative';

    // Business rule: reasonable limits
    if (fieldGoals > 100) return 'Field goals seem unreasonably high';
    if (threePointers > 50) return 'Three-pointers seem unreasonably high';
    if (freeThrows > 50) return 'Free throws seem unreasonably high';

    return null;
  },

  renderScoreEntry() {
    return (
      <div className="basketball-score-entry">
        <div className="score-field">
          <label htmlFor="field-goals">Field Goals (2pts)</label>
          <input
            id="field-goals"
            type="number"
            min="0"
            placeholder="0"
            data-testid="field-goals-input"
          />
        </div>
        <div className="score-field">
          <label htmlFor="three-pointers">3-Pointers</label>
          <input
            id="three-pointers"
            type="number"
            min="0"
            placeholder="0"
            data-testid="three-pointers-input"
          />
        </div>
        <div className="score-field">
          <label htmlFor="free-throws">Free Throws</label>
          <input
            id="free-throws"
            type="number"
            min="0"
            placeholder="0"
            data-testid="free-throws-input"
          />
        </div>
      </div>
    );
  },

  renderScore(match: Match) {
    const teamAScore = this.calculateTotalScore(match.scoreBreakdownA || {});
    const teamBScore = this.calculateTotalScore(match.scoreBreakdownB || {});

    return (
      <div className="basketball-score-display" data-testid="score-display">
        <div className="team-score">
          <span className="team-name">{match.teamA?.name || 'Team A'}</span>
          <span className="score">{teamAScore}</span>
        </div>
        <div className="score-separator">-</div>
        <div className="team-score">
          <span className="team-name">{match.teamB?.name || 'Team B'}</span>
          <span className="score">{teamBScore}</span>
        </div>
      </div>
    );
  },

  lifecycleHooks: {
    onMatchFinal: async (match: Match, ctx: MatchContext) => {
      // Log final score for analytics
      const teamAScore = this.calculateTotalScore(match.scoreBreakdownA || {});
      const teamBScore = this.calculateTotalScore(match.scoreBreakdownB || {});

      console.log(`Basketball match completed: ${teamAScore}-${teamBScore}`);
    }
  }
};

export default BasketballPlugin;
```

### Phase Plugin Example

```typescript
// Single elimination bracket plugin
import React from 'react';
import type { PhasePlugin, Team, Match, Phase } from '@ump/engine';

export const SingleEliminationPlugin: PhasePlugin = {
  id: 'single-elimination',
  name: 'Single Elimination',
  version: '1.0.0',
  description: 'Single elimination tournament bracket',
  author: 'UMP Team',
  supportedLanguages: ['en'],
  i18n: {
    en: {
      bracket: 'Bracket',
      round: 'Round',
      final: 'Final',
      semifinal: 'Semifinal',
      quarterfinal: 'Quarterfinal'
    }
  },

  generateSchedule(teams: Team[], settings: any): Match[] {
    const matches: Match[] = [];
    const numTeams = teams.length;

    // Ensure power of 2 teams (pad with byes if needed)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const paddedTeams = [...teams];

    while (paddedTeams.length < bracketSize) {
      paddedTeams.push(null); // Bye
    }

    // Generate first round matches
    for (let i = 0; i < paddedTeams.length; i += 2) {
      const teamA = paddedTeams[i];
      const teamB = paddedTeams[i + 1];

      if (teamA && teamB) {
        matches.push({
          id: `match-r1-${i / 2}`,
          teamA,
          teamB,
          scoreA: 0,
          scoreB: 0,
          status: 'pending',
          round: 1
        });
      }
    }

    // Generate subsequent rounds (placeholders)
    let currentRound = 2;
    let matchesInRound = matches.length / 2;

    while (matchesInRound >= 1) {
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          id: `match-r${currentRound}-${i}`,
          teamA: null, // TBD from previous round
          teamB: null, // TBD from previous round
          scoreA: 0,
          scoreB: 0,
          status: 'pending',
          round: currentRound
        });
      }

      currentRound++;
      matchesInRound = Math.floor(matchesInRound / 2);
    }

    return matches;
  },

  getNextMatches(phase: Phase): Match[] {
    return phase.matches?.filter(match =>
      match.status === 'scheduled' &&
      match.teamA &&
      match.teamB
    ) || [];
  },

  renderBracketUI(phase: Phase) {
    const matches = phase.matches || [];
    const rounds = matches.reduce((acc, match) => {
      const round = match.round || 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    return (
      <div className="single-elimination-bracket" data-testid="bracket">
        {Object.entries(rounds).map(([roundNum, roundMatches]) => (
          <div key={roundNum} className="bracket-round">
            <h3>Round {roundNum}</h3>
            <div className="round-matches">
              {roundMatches.map(match => (
                <div key={match.id} className="bracket-match">
                  <div className="match-team">
                    {match.teamA?.name || 'TBD'}
                  </div>
                  <div className="match-vs">vs</div>
                  <div className="match-team">
                    {match.teamB?.name || 'TBD'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default SingleEliminationPlugin;
```

## Publishing Guidelines

### Package Configuration

```json
{
  "name": "@your-org/ump-plugin-basketball",
  "version": "1.0.0",
  "description": "Basketball plugin for UMP",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": ["ump", "plugin", "basketball", "sport", "tournament"],
  "peerDependencies": {
    "@ump/core": "^1.0.0",
    "@ump/engine": "^1.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@ump/engine": "^1.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

### Build Configuration

```json
// tsconfig.json
{
  "extends": "@ump/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx"]
}
```

### Documentation Requirements

1. **README.md** with:

   - Plugin description and features
   - Installation instructions
   - Usage examples
   - API documentation
   - Contributing guidelines

2. **CHANGELOG.md** following semantic versioning

3. **LICENSE** file (MIT recommended)

### Quality Gates

1. **All conformance tests must pass**
2. **Code coverage ≥ 80%**
3. **No TypeScript errors**
4. **ESLint compliance**
5. **Accessibility tests pass**

## Troubleshooting

### Common Issues

#### Plugin Not Loading

```typescript
// Check plugin registration
import { pluginRegistry } from '@ump/engine';

try {
  pluginRegistry.register('sport', MyPlugin);
  console.log('Plugin registered successfully');
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

#### React Component Errors

```typescript
// Ensure proper React imports
import React from 'react';

// Use data-testid for testing
<input data-testid="score-input" />

// Handle missing props gracefully
const teamName = match.teamA?.name || 'Unknown Team';
```

#### TypeScript Errors

```typescript
// Import types correctly
import type { SportPlugin, Match } from '@ump/engine';

// Use proper type assertions
const breakdown = match.scoreBreakdownA as BasketballScore;

// Provide default values
const { goals = 0, assists = 0 } = breakdown || {};
```

#### Conformance Test Failures

```bash
# Run tests with verbose output
pnpm test --verbose

# Check specific test category
pnpm test -- --testNamePattern="metadata"

# Debug SSR issues
pnpm test -- --testNamePattern="ssr"
```

### Getting Help

1. **Check the documentation**: Start with this guide and the API docs
2. **Review examples**: Look at existing plugins in the repository
3. **Run conformance tests**: Use the harness to identify issues
4. **Join the community**: Discord/Slack channels for plugin developers
5. **Open an issue**: GitHub issues for bugs and feature requests

### Performance Debugging

```typescript
// Add performance monitoring
const start = performance.now();
const result = calculateTotalScore(breakdown);
const end = performance.now();
console.log(`Score calculation took ${end - start}ms`);

// Use React DevTools Profiler
// Wrap components in React.memo for optimization
const ScoreDisplay = React.memo(({ match }) => {
  // Component implementation
});
```

---

## Conclusion

You now have all the tools and knowledge needed to create powerful UMP
plugins! Remember to:

- Follow TypeScript best practices
- Test thoroughly with the conformance harness
- Provide comprehensive internationalization
- Document your plugin well
- Engage with the UMP community

Happy plugin development! 🚀

---

**Need help?** Join our developer community:

- 📚 [API Documentation](../README.md)
- 💬 [Discord Community](https://discord.gg/ump)
- 🐛 [Report Issues](https://github.com/your-org/ump/issues)
- 📧 [Email Support](mailto:plugins@ump.dev)
