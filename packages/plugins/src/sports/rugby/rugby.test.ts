/// <reference types="jest" />
import { testPluginConformance } from '@ump/engine';
import { RugbyPlugin, rugbyVariants } from './index';
import type { RugbyScoreBreakdown } from './index';

describe('Rugby Plugin Tests', () => {
  describe('Conformance Tests', () => {
    it('should pass all conformance tests', async () => {
      const results = await testPluginConformance(RugbyPlugin, 'sport');

      expect(results.metadata.passed).toBe(true);
      expect(results.lifecycle.passed).toBe(true);
      expect(results.ui.passed).toBe(true);
      expect(results.ssr.passed).toBe(true);

      // Log any errors for debugging
      if (!results.metadata.passed) {
        console.log('Metadata errors:', results.metadata.errors);
      }
      if (!results.lifecycle.passed) {
        console.log('Lifecycle errors:', results.lifecycle.errors);
      }
      if (!results.ui.passed) {
        console.log('UI errors:', results.ui.errors);
      }
      if (!results.ssr.passed) {
        console.log('SSR errors:', results.ssr.errors);
      }
    });
  });

  describe('Score Calculation', () => {
    it('should calculate total score correctly', () => {
      const breakdown: RugbyScoreBreakdown = {
        tries: 3,
        conversions: 2,
        penalties: 1,
        dropGoals: 1,
      };

      const total = RugbyPlugin.calculateTotalScore(breakdown);
      // 3 tries (15) + 2 conversions (4) + 1 penalty (3) + 1 drop goal (3) = 25
      expect(total).toBe(25);
    });

    it('should handle zero scores', () => {
      const breakdown: RugbyScoreBreakdown = {
        tries: 0,
        conversions: 0,
        penalties: 0,
        dropGoals: 0,
      };

      expect(RugbyPlugin.calculateTotalScore(breakdown)).toBe(0);
    });
  });

  describe('Score Validation', () => {
    it('should validate correct scores', () => {
      const validBreakdown: RugbyScoreBreakdown = {
        tries: 2,
        conversions: 1,
        penalties: 1,
        dropGoals: 0,
      };

      expect(RugbyPlugin.validateScore(validBreakdown)).toBeNull();
    });

    it('should reject negative values', () => {
      expect(
        RugbyPlugin.validateScore({
          tries: -1,
          conversions: 0,
          penalties: 0,
          dropGoals: 0,
        })
      ).toBe('Tries cannot be negative');

      expect(
        RugbyPlugin.validateScore({
          tries: 0,
          conversions: -1,
          penalties: 0,
          dropGoals: 0,
        })
      ).toBe('Conversions cannot be negative');
    });

    it('should reject more conversions than tries', () => {
      const invalidBreakdown: RugbyScoreBreakdown = {
        tries: 1,
        conversions: 2,
        penalties: 0,
        dropGoals: 0,
      };

      expect(RugbyPlugin.validateScore(invalidBreakdown)).toBe(
        'Cannot have more conversions than tries'
      );
    });
  });

  describe('Rugby Variants', () => {
    it('should have correct variant definitions', () => {
      expect(rugbyVariants).toHaveLength(2);

      const rugby15s = rugbyVariants.find((v) => v.id === 'rugby-15s');
      const rugby7s = rugbyVariants.find((v) => v.id === 'rugby-7s');

      expect(rugby15s).toBeDefined();
      expect(rugby7s).toBeDefined();

      expect(rugby15s?.settings.teamSize).toBe(15);
      expect(rugby7s?.settings.teamSize).toBe(7);
    });
  });
});
