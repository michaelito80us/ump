// @ump/core/backend - Backend-specific exports without Next.js dependencies
// This module excludes server-only imports that are incompatible with standalone Node.js
// Export all canonical types
export * from './types';
// Export GraphQL generated types and hooks (with namespace to avoid conflicts)
export * as GraphQL from './generated';
// Export client-side authentication utilities (safe for backend)
export {
  ClerkClientUtils,
  AuthenticationError,
  AuthorizationError,
} from './auth/clerkClient';
// Export utilities
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';
export const CORE_VERSION = '0.1.0';
//# sourceMappingURL=backend.js.map
