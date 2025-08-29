/**
 * Lightweight semver implementation (~40 LOC)
 * Covers ^, ~ and exact match patterns
 */

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(version: string): SemanticVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semver format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function satisfies(version: string, range: string): boolean {
  const cleanRange = range.trim();

  // Exact match
  if (!cleanRange.startsWith('^') && !cleanRange.startsWith('~')) {
    return version === cleanRange;
  }

  const rangeVersion = parseVersion(cleanRange.slice(1));
  const targetVersion = parseVersion(version);

  // Caret range (^1.2.3): compatible within same major version
  if (cleanRange.startsWith('^')) {
    return (
      targetVersion.major === rangeVersion.major &&
      (targetVersion.minor > rangeVersion.minor ||
        (targetVersion.minor === rangeVersion.minor &&
          targetVersion.patch >= rangeVersion.patch))
    );
  }

  // Tilde range (~1.2.3): compatible within same minor version
  if (cleanRange.startsWith('~')) {
    return (
      targetVersion.major === rangeVersion.major &&
      targetVersion.minor === rangeVersion.minor &&
      targetVersion.patch >= rangeVersion.patch
    );
  }

  return false;
}

export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (versionA.major !== versionB.major) return versionA.major - versionB.major;
  if (versionA.minor !== versionB.minor) return versionA.minor - versionB.minor;
  return versionA.patch - versionB.patch;
}
