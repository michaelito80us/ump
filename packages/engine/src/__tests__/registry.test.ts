/**
 * Tests for Plugin Registry Module (T-2.1)
 * Covers validation, duplicate detection, and integration scenarios
 */

import {
  PluginRegistry,
  registerPlugin,
  getPlugin,
  hasPlugin,
  listPlugins,
  SportPlugin,
  PhasePlugin,
} from '../registry';
import {
  PluginValidationError,
  PluginNotFoundError,
  DuplicatePluginError,
  VersionConflictError,
} from '../errors';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('Plugin Registration', () => {
    it('should register a valid plugin', () => {
      const mockSportPlugin: SportPlugin = {
        id: 'test-sport',
        name: 'Test Sport',
        version: '1.0.0',
        i18n: { en: { name: 'Test Sport' } },
        statSchema: ['points', 'assists'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      expect(() => registry.register('sports', mockSportPlugin)).not.toThrow();
      expect(registry.has('sports', 'test-sport')).toBe(true);
    });

    it('should throw ValidationError for duplicate ID', () => {
      const plugin1: SportPlugin = {
        id: 'duplicate-id',
        name: 'Plugin 1',
        i18n: { en: { name: 'Plugin 1' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      const plugin2: SportPlugin = {
        id: 'duplicate-id',
        name: 'Plugin 2',
        i18n: { en: { name: 'Plugin 2' } },
        statSchema: ['goals'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      registry.register('sports', plugin1);
      expect(() => registry.register('sports', plugin2)).toThrow(
        DuplicatePluginError
      );
    });

    it('should throw ValidationError for invalid plugin ID', () => {
      const invalidPlugin: SportPlugin = {
        id: 'invalid id with spaces!',
        name: 'Invalid Plugin',
        i18n: { en: { name: 'Invalid' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      expect(() => registry.register('sports', invalidPlugin)).toThrow(
        PluginValidationError
      );
    });

    it('should throw ValidationError for missing i18n bundle', () => {
      const invalidPlugin: any = {
        id: 'no-i18n',
        name: 'No i18n Plugin',
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      expect(() => registry.register('sports', invalidPlugin)).toThrow(
        PluginValidationError
      );
    });

    it('should throw VersionConflictError for same ID with different versions', () => {
      const plugin1: SportPlugin = {
        id: 'versioned-plugin',
        name: 'Versioned Plugin',
        version: '1.0.0',
        i18n: { en: { name: 'V1' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      const plugin2: SportPlugin = {
        id: 'versioned-plugin',
        name: 'Versioned Plugin',
        version: '2.0.0',
        i18n: { en: { name: 'V2' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      registry.register('sports', plugin1);
      expect(() => registry.register('sports', plugin2)).toThrow(
        VersionConflictError
      );
    });
  });

  describe('Plugin Retrieval', () => {
    it('should retrieve registered plugin', () => {
      const mockPlugin: SportPlugin = {
        id: 'retrievable',
        name: 'Retrievable Plugin',
        i18n: { en: { name: 'Retrievable' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      registry.register('sports', mockPlugin);
      const retrieved = registry.get<SportPlugin>('sports', 'retrievable');

      expect(retrieved).toBe(mockPlugin);
      expect(retrieved.name).toBe('Retrievable Plugin');
    });

    it('should throw PluginNotFoundError for unknown plugin', () => {
      expect(() => registry.get('sports', 'unknown-plugin')).toThrow(
        PluginNotFoundError
      );
    });

    it('should list all plugins in category', () => {
      const plugin1: SportPlugin = {
        id: 'sport1',
        name: 'Sport 1',
        i18n: { en: { name: 'Sport 1' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      const plugin2: SportPlugin = {
        id: 'sport2',
        name: 'Sport 2',
        i18n: { en: { name: 'Sport 2' } },
        statSchema: ['goals'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      registry.register('sports', plugin1);
      registry.register('sports', plugin2);

      const plugins = registry.list('sports');
      expect(plugins).toHaveLength(2);
      expect(plugins.map((p) => p.id)).toContain('sport1');
      expect(plugins.map((p) => p.id)).toContain('sport2');
    });
  });

  describe('Integration with Sample Plugins', () => {
    it('should work with sample sport and phase plugins', () => {
      const rugbyPlugin: SportPlugin = {
        id: 'rugby',
        name: 'Rugby',
        version: '1.0.0',
        description: 'Rugby scoring system',
        author: 'UMP Team',
        supportedLanguages: ['en', 'es'],
        i18n: {
          en: { name: 'Rugby', tries: 'Tries', conversions: 'Conversions' },
          es: { name: 'Rugby', tries: 'Ensayos', conversions: 'Conversiones' },
        },
        capabilities: ['statTier:3'],
        statSchema: ['tries', 'conversions', 'penalties', 'dropGoals'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: (breakdown) => {
          return (breakdown.tries || 0) * 5 + (breakdown.conversions || 0) * 2;
        },
        validateScore: (breakdown) => {
          if (breakdown.tries < 0) return 'Tries cannot be negative';
          if (breakdown.conversions > breakdown.tries)
            return 'Cannot have more conversions than tries';
          return null;
        },
      };

      const roundRobinPlugin: PhasePlugin = {
        id: 'round-robin',
        name: 'Round Robin',
        version: '1.0.0',
        i18n: { en: { name: 'Round Robin' } },
        generateSchedule: (_teams) => [],
        getNextMatches: () => [],
        renderBracketUI: () => null as any,
        renderStandings: () => null as any,
      };

      // Register plugins
      expect(() => registry.register('sports', rugbyPlugin)).not.toThrow();
      expect(() => registry.register('phases', roundRobinPlugin)).not.toThrow();

      // Retrieve and validate
      const retrievedRugby = registry.get<SportPlugin>('sports', 'rugby');
      const retrievedRoundRobin = registry.get<PhasePlugin>(
        'phases',
        'round-robin'
      );

      expect(
        retrievedRugby.calculateTotalScore({ tries: 2, conversions: 1 })
      ).toBe(12);
      expect(retrievedRugby.validateScore({ tries: -1 })).toBe(
        'Tries cannot be negative'
      );
      expect(retrievedRoundRobin.name).toBe('Round Robin');

      // Check stats
      const stats = registry.getStats();
      expect(stats.sports).toBe(1);
      expect(stats.phases).toBe(1);
      expect(stats.seeding).toBe(0);
    });
  });

  describe('Global Registry Functions', () => {
    it('should work with global convenience functions', () => {
      const testPlugin: SportPlugin = {
        id: 'global-test',
        name: 'Global Test',
        i18n: { en: { name: 'Global Test' } },
        statSchema: ['points'],
        renderScoreEntry: () => null as any,
        renderScore: () => null as any,
        calculateTotalScore: () => 0,
        validateScore: () => null,
      };

      registerPlugin('sports', testPlugin);
      expect(hasPlugin('sports', 'global-test')).toBe(true);

      const retrieved = getPlugin<SportPlugin>('sports', 'global-test');
      expect(retrieved.name).toBe('Global Test');

      const allSports = listPlugins('sports');
      expect(allSports).toHaveLength(1);
    });
  });
});
