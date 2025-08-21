export * from './types';
export * as GraphQL from './generated';
export {
  ClerkClientUtils,
  AuthenticationError,
  AuthorizationError,
  type UserContext,
} from './auth/clerkClient';
export {
  createPatch,
  applyPatch,
  hasBreakdownChanged,
  hasTeamBreakdownChanged,
  mergePatches,
} from './utils/createPatch';
export interface BaseConfig {
  version: string;
}
export declare const CORE_VERSION = '0.1.0';
//# sourceMappingURL=backend.d.ts.map
