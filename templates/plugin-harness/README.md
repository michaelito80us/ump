# UMP Plugin Conformance Harness

This template provides a comprehensive testing framework for UMP (Unified Management Platform) plugins. It includes automated conformance tests, React 18 SSR compatibility checks, and lifecycle validation.

## Quick Start

1. Copy this template to your plugin project directory
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the sample tests:
   ```bash
   pnpm test
   ```

## What's Included

### Conformance Testing Framework

- **Metadata validation**: Ensures your plugin has all required fields and proper i18n structure
- **Lifecycle testing**: Validates that all required methods are implemented and work correctly
- **UI component testing**: Tests React components for proper rendering and SSR compatibility
- **SSR smoke tests**: Ensures your plugin works with React 18 server-side rendering

### Sample Plugin Tests

The `src/samplePlugin.test.ts` file demonstrates:

- A complete SportPlugin implementation (Rugby)
- A complete PhasePlugin implementation (Round Robin)
- Comprehensive test coverage for all plugin aspects
- Examples of both passing and failing conformance tests

## Testing Your Plugin

### 1. Basic Conformance Test

```typescript
import { testPluginConformance } from '@ump/engine/harness';
import { MyCustomPlugin } from './MyCustomPlugin';

describe('My Custom Plugin', () => {
  it('should pass all conformance tests', async () => {
    const results = await testPluginConformance(MyCustomPlugin, 'sport');

    expect(results.metadata.passed).toBe(true);
    expect(results.lifecycle.passed).toBe(true);
    expect(results.ui.passed).toBe(true);
    expect(results.ssr.passed).toBe(true);
  });
});
```

### 2. Individual Test Categories

```typescript
import { PluginConformanceHarness } from '@ump/engine/harness';

const harness = new PluginConformanceHarness();

// Test only metadata
const metadataResult = await harness.testMetadata(MyPlugin);

// Test only lifecycle methods
const lifecycleResult = await harness.testLifecycle(MyPlugin, 'sport');

// Test only UI components
const uiResult = await harness.testUI(MyPlugin, 'sport');

// Test only SSR compatibility
const ssrResult = await harness.testSSR(MyPlugin, 'sport');
```

## Plugin Types Supported

### SportPlugin

Required methods:

- `calculateTotalScore(breakdown: any): number`
- `validateScore(breakdown: any): string | null`
- `renderScoreEntry(): React.ReactNode`
- `renderScore(match: Match): React.ReactNode`

Required metadata:

- `statSchema: string[]`

### PhasePlugin

Required methods:

- `generateSchedule(teams: Team[], settings: any): Match[]`
- `getNextMatches(phase: Phase): Match[]`
- `renderBracketUI(phase: Phase): React.ReactNode`

Optional methods:

- `renderStandings(phase: Phase): React.ReactNode`

### SeedingPlugin

Required methods:

- `seedTeams(teams: Team[], options?: any): Team[]`

### SchedulingPlugin

Required methods:

- `scheduleMatches(matches: Match[], config: any): Match[]`

### TournamentPlugin

Required metadata:

- `sport: string` (plugin ID)
- `phases: Array<{pluginId: string, phaseName: string, settings: any}>`

Optional metadata:

- `scoringRules: Record<string, number>`
- `tiebreakerRules: string[]`

## Common Test Failures

### Missing validateScore Method
