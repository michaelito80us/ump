// @ump/core - Canonical types and shared utilities
// This is the foundational package for the unified management platform

export * from './types';

// Export core utilities and interfaces
export interface BaseConfig {
  version: string;
}

export const CORE_VERSION = '0.1.0';
