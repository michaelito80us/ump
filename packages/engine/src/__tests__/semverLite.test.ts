/**
 * Tests for lightweight semver implementation
 */

import { parseVersion, satisfies, compareVersions } from '../semverLite';

describe('SemverLite', () => {
  describe('parseVersion', () => {
    it('should parse valid semver strings', () => {
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseVersion('0.0.1')).toEqual({ major: 0, minor: 0, patch: 1 });
      expect(parseVersion('10.20.30')).toEqual({
        major: 10,
        minor: 20,
        patch: 30,
      });
    });

    it('should throw for invalid semver strings', () => {
      expect(() => parseVersion('1.2')).toThrow('Invalid semver format');
      expect(() => parseVersion('1.2.3.4')).toThrow('Invalid semver format');
      expect(() => parseVersion('v1.2.3')).toThrow('Invalid semver format');
      expect(() => parseVersion('1.2.x')).toThrow('Invalid semver format');
    });
  });

  describe('satisfies', () => {
    it('should handle exact matches', () => {
      expect(satisfies('1.2.3', '1.2.3')).toBe(true);
      expect(satisfies('1.2.3', '1.2.4')).toBe(false);
    });

    it('should handle caret ranges (^)', () => {
      expect(satisfies('1.2.3', '^1.2.3')).toBe(true);
      expect(satisfies('1.2.4', '^1.2.3')).toBe(true);
      expect(satisfies('1.3.0', '^1.2.3')).toBe(true);
      expect(satisfies('2.0.0', '^1.2.3')).toBe(false);
      expect(satisfies('1.1.9', '^1.2.3')).toBe(false);
    });

    it('should handle tilde ranges (~)', () => {
      expect(satisfies('1.2.3', '~1.2.3')).toBe(true);
      expect(satisfies('1.2.4', '~1.2.3')).toBe(true);
      expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
      expect(satisfies('1.2.2', '~1.2.3')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
      expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
      expect(compareVersions('1.2.2', '1.2.3')).toBeLessThan(0);
      expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });
  });
});
