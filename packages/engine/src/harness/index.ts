// Import plugin interfaces from registry.ts, not @ump/core
import type {
  SportPlugin,
  PhasePlugin,
  SeedingPlugin,
  SchedulingPlugin,
  TournamentPlugin,
  BasePluginMeta,
} from '../registry';

// Import core types from @ump/core
import type { Match, Team, Phase, MatchStatus } from '@ump/core';

export interface ConformanceTestResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConformanceTestSuite {
  metadata: ConformanceTestResult;
  lifecycle: ConformanceTestResult;
  ui: ConformanceTestResult;
  ssr: ConformanceTestResult;
}

/**
 * Conformance harness for validating UMP plugins
 * Provides automated QA suite for plugin authors
 */
export class PluginConformanceHarness {
  /**
   * Run full conformance test suite on a plugin
   */
  async runFullSuite(
    plugin: any,
    type: 'sport' | 'phase' | 'seeding' | 'scheduling' | 'tournament'
  ): Promise<ConformanceTestSuite> {
    const results: ConformanceTestSuite = {
      metadata: await this.testMetadata(plugin),
      lifecycle: await this.testLifecycle(plugin, type),
      ui: await this.testUI(plugin, type),
      ssr: await this.testSSR(plugin, type),
    };

    return results;
  }

  /**
   * Test plugin metadata compliance
   */
  async testMetadata(plugin: BasePluginMeta): Promise<ConformanceTestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!plugin.id) {
      errors.push('Plugin must have an id');
    }
    if (!plugin.name) {
      errors.push('Plugin must have a name');
    }
    if (!plugin.i18n) {
      errors.push('Plugin must have i18n translations');
    } else {
      // Check i18n structure
      if (Object.keys(plugin.i18n).length === 0) {
        errors.push('Plugin i18n must contain at least one language');
      }

      for (const [lang, translations] of Object.entries(plugin.i18n)) {
        if (typeof translations !== 'object' || translations === null) {
          errors.push(`Plugin i18n[${lang}] must be an object`);
        }
      }
    }

    // Warnings for optional but recommended fields
    if (!plugin.description) {
      warnings.push('Plugin should have a description');
    }
    if (!plugin.author) {
      warnings.push('Plugin should have an author');
    }
    if (!plugin.version) {
      warnings.push('Plugin should have a version for production use');
    }

    // Validate supportedLanguages matches i18n keys
    if (plugin.supportedLanguages) {
      const i18nLangs = Object.keys(plugin.i18n || {});
      const missingLangs = plugin.supportedLanguages.filter(
        (lang: string) => !i18nLangs.includes(lang)
      );
      if (missingLangs.length > 0) {
        errors.push(
          `Plugin supportedLanguages includes languages not in i18n: ${missingLangs.join(', ')}`
        );
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test plugin lifecycle methods
   */
  async testLifecycle(
    plugin: any,
    type: string
  ): Promise<ConformanceTestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (type) {
        case 'sport':
          await this.testSportLifecycle(
            plugin as SportPlugin,
            errors,
            warnings
          );
          break;
        case 'phase':
          await this.testPhaseLifecycle(
            plugin as PhasePlugin,
            errors,
            warnings
          );
          break;
        case 'seeding':
          await this.testSeedingLifecycle(
            plugin as SeedingPlugin,
            errors,
            warnings
          );
          break;
        case 'scheduling':
          await this.testSchedulingLifecycle(
            plugin as SchedulingPlugin,
            errors,
            warnings
          );
          break;
        case 'tournament':
          await this.testTournamentLifecycle(
            plugin as TournamentPlugin,
            errors,
            warnings
          );
          break;
        default:
          errors.push(`Unknown plugin type: ${type}`);
      }
    } catch (error) {
      errors.push(
        `Lifecycle test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test UI components rendering
   */
  async testUI(plugin: any, type: string): Promise<ConformanceTestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (type) {
        case 'sport':
          await this.testSportUI(plugin as SportPlugin, errors, warnings);
          break;
        case 'phase':
          await this.testPhaseUI(plugin as PhasePlugin, errors, warnings);
          break;
        default:
          // Other plugin types may not have UI components
          warnings.push(`No UI tests defined for plugin type: ${type}`);
      }
    } catch (error) {
      errors.push(
        `UI test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test React 18 SSR compatibility
   * Note: This performs basic validation. Full SSR testing requires test environment setup.
   */
  async testSSR(plugin: any, type: string): Promise<ConformanceTestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test that UI components exist and are callable
      if (type === 'sport') {
        if (
          plugin.renderScoreEntry &&
          typeof plugin.renderScoreEntry === 'function'
        ) {
          try {
            const result = plugin.renderScoreEntry();
            if (result === null || result === undefined) {
              warnings.push(
                'renderScoreEntry returns null/undefined - may cause SSR issues'
              );
            }
          } catch (error) {
            errors.push(
              `renderScoreEntry throws error: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        if (plugin.renderScore && typeof plugin.renderScore === 'function') {
          try {
            const mockMatch: Partial<Match> = {
              id: 'test-match',
              teamA: {
                id: 'team-a',
                name: 'Team A',
                sportIds: [],
                playerIds: [],
                managers: [],
                tournaments: [],
              } as Team,
              teamB: {
                id: 'team-b',
                name: 'Team B',
                sportIds: [],
                playerIds: [],
                managers: [],
                tournaments: [],
              } as Team,
              scoreA: 0,
              scoreB: 0,
              status: 'pending' as MatchStatus,
            };
            const result = plugin.renderScore(mockMatch);
            if (result === null || result === undefined) {
              warnings.push(
                'renderScore returns null/undefined - may cause SSR issues'
              );
            }
          } catch (error) {
            errors.push(
              `renderScore throws error: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }

      if (
        type === 'phase' &&
        plugin.renderBracketUI &&
        typeof plugin.renderBracketUI === 'function'
      ) {
        try {
          const mockPhase: Partial<Phase> = {
            id: 'test-phase',
            pluginId: 'test-plugin',
            phaseName: 'Test Phase',
            matches: [],
            settings: {},
          };
          const result = plugin.renderBracketUI(mockPhase);
          if (result === null || result === undefined) {
            warnings.push(
              'renderBracketUI returns null/undefined - may cause SSR issues'
            );
          }
        } catch (error) {
          errors.push(
            `renderBracketUI throws error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      errors.push(
        `SSR test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async testSportLifecycle(
    plugin: SportPlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    // Test required methods
    if (typeof plugin.calculateTotalScore !== 'function') {
      errors.push('SportPlugin must implement calculateTotalScore method');
    } else {
      // Test with sample data
      try {
        const result = plugin.calculateTotalScore({ tries: 2, conversions: 1 });
        if (typeof result !== 'number') {
          errors.push('calculateTotalScore must return a number');
        }
      } catch (error) {
        errors.push(
          `calculateTotalScore failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (typeof plugin.validateScore !== 'function') {
      errors.push('SportPlugin must implement validateScore method');
    } else {
      // Test validation
      try {
        const validResult = plugin.validateScore({ tries: 2, conversions: 1 });
        if (validResult !== null && typeof validResult !== 'string') {
          errors.push('validateScore must return null or string');
        }

        // Test invalid score
        const invalidResult = plugin.validateScore({ tries: -1 });
        if (invalidResult === null) {
          _warnings.push('validateScore should reject negative scores');
        }
      } catch (error) {
        errors.push(
          `validateScore failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Check stat schema
    if (!plugin.statSchema || !Array.isArray(plugin.statSchema)) {
      errors.push('SportPlugin must have a statSchema array');
    } else if (plugin.statSchema.length === 0) {
      _warnings.push('SportPlugin statSchema is empty');
    }
  }

  private async testPhaseLifecycle(
    plugin: PhasePlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (typeof plugin.generateSchedule !== 'function') {
      errors.push('PhasePlugin must implement generateSchedule method');
    } else {
      try {
        const mockTeams: Team[] = [
          {
            id: 'team-1',
            name: 'Team 1',
            playerIds: [],
            sportIds: [],
            managers: [],
            tournaments: [],
          },
          {
            id: 'team-2',
            name: 'Team 2',
            playerIds: [],
            sportIds: [],
            managers: [],
            tournaments: [],
          },
        ];
        const matches = plugin.generateSchedule(mockTeams, {});
        if (!Array.isArray(matches)) {
          errors.push('generateSchedule must return an array of matches');
        }
      } catch (error) {
        errors.push(
          `generateSchedule failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (typeof plugin.getNextMatches !== 'function') {
      errors.push('PhasePlugin must implement getNextMatches method');
    }
  }

  private async testSeedingLifecycle(
    plugin: SeedingPlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (typeof plugin.seedTeams !== 'function') {
      errors.push('SeedingPlugin must implement seedTeams method');
    } else {
      try {
        const mockTeams: Team[] = [
          {
            id: 'team-1',
            name: 'Team 1',
            playerIds: [],
            sportIds: [],
            managers: [],
            tournaments: [],
          },
          {
            id: 'team-2',
            name: 'Team 2',
            playerIds: [],
            sportIds: [],
            managers: [],
            tournaments: [],
          },
        ];
        const seeded = plugin.seedTeams(mockTeams);
        if (!Array.isArray(seeded)) {
          errors.push('seedTeams must return an array of teams');
        } else if (seeded.length !== mockTeams.length) {
          errors.push('seedTeams must return same number of teams as input');
        }
      } catch (error) {
        errors.push(
          `seedTeams failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private async testSchedulingLifecycle(
    plugin: SchedulingPlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (typeof plugin.scheduleMatches !== 'function') {
      errors.push('SchedulingPlugin must implement scheduleMatches method');
    } else {
      try {
        const mockMatches: Match[] = [];
        const scheduled = plugin.scheduleMatches(mockMatches, {});
        if (!Array.isArray(scheduled)) {
          errors.push('scheduleMatches must return an array of matches');
        }
      } catch (error) {
        errors.push(
          `scheduleMatches failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private async testTournamentLifecycle(
    plugin: TournamentPlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (!plugin.sport) {
      errors.push('TournamentPlugin must specify a sport plugin ID');
    }

    if (!plugin.phases || !Array.isArray(plugin.phases)) {
      errors.push('TournamentPlugin must have a phases array');
    } else if (plugin.phases.length === 0) {
      _warnings.push('TournamentPlugin has no phases defined');
    }

    if (!plugin.scoringRules || typeof plugin.scoringRules !== 'object') {
      _warnings.push('TournamentPlugin should define scoring rules');
    }
  }

  private async testSportUI(
    plugin: SportPlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (typeof plugin.renderScoreEntry !== 'function') {
      errors.push('SportPlugin must implement renderScoreEntry method');
    }

    if (typeof plugin.renderScore !== 'function') {
      errors.push('SportPlugin must implement renderScore method');
    }
  }

  private async testPhaseUI(
    plugin: PhasePlugin,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    if (typeof plugin.renderBracketUI !== 'function') {
      errors.push('PhasePlugin must implement renderBracketUI method');
    }

    // renderStandings is optional
    if (
      plugin.renderStandings &&
      typeof plugin.renderStandings !== 'function'
    ) {
      errors.push('PhasePlugin renderStandings must be a function if provided');
    }
  }
}

/**
 * Convenience function to create and run conformance tests
 */
export async function testPluginConformance(
  plugin: any,
  type: 'sport' | 'phase' | 'seeding' | 'scheduling' | 'tournament'
): Promise<ConformanceTestSuite> {
  const harness = new PluginConformanceHarness();
  return harness.runFullSuite(plugin, type);
}

/**
 * Jest matcher for plugin conformance
 * Note: This requires Jest testing environment to be properly set up
 */
export function expectPluginToBeConformant(plugin: any, type: string) {
  return {
    async toPassConformance() {
      const results = await testPluginConformance(plugin, type as any);
      const allPassed = Object.values(results).every((result) => result.passed);

      if (allPassed) {
        return {
          message: () => 'Plugin passed all conformance tests',
          pass: true,
        };
      } else {
        const failedTests = Object.entries(results)
          .filter(([, result]) => !result.passed)
          .map(
            ([testName, result]) => `${testName}: ${result.errors.join(', ')}`
          )
          .join('\n');

        return {
          message: () => `Plugin failed conformance tests:\n${failedTests}`,
          pass: false,
        };
      }
    },
  };
}
