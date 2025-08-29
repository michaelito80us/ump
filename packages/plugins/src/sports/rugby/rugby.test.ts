/// <reference types="jest" />
import { RugbyPlugin, rugbyVariants } from './index';
import type { RugbyScoreBreakdown } from './index';

describe('Rugby Plugin Tests', () => {
  describe('Plugin Structure', () => {
    it('should have required metadata', () => {
      expect(RugbyPlugin.id).toBe('rugby');
      expect(RugbyPlugin.name).toBe('Rugby Union');
      expect(RugbyPlugin.version).toBe('1.0.0');
      expect(RugbyPlugin.description).toBeDefined();
      expect(RugbyPlugin.author).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof RugbyPlugin.calculateTotalScore).toBe('function');
      expect(typeof RugbyPlugin.validateScore).toBe('function');
      expect(typeof RugbyPlugin.renderScoreEntry).toBe('function');
      expect(typeof RugbyPlugin.renderScore).toBe('function');
    });

    it('should have stat schema', () => {
      expect(Array.isArray(RugbyPlugin.statSchema)).toBe(true);
      expect(RugbyPlugin.statSchema).toContain('tries');
      expect(RugbyPlugin.statSchema).toContain('conversions');
      expect(RugbyPlugin.statSchema).toContain('penalties');
      expect(RugbyPlugin.statSchema).toContain('dropGoals');
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
