// @ump/plugins - Plugin Collection
// Placeholder file - implementation pending

// Placeholder export to prevent empty module
export const PLUGINS_VERSION = '0.1.0';

// Export Rugby Plugin (T-10.1)
export { RugbyPlugin, rugbyVariants } from './sports/rugby';
export type { RugbyScoreBreakdown } from './sports/rugby';

// Export Single Elimination Plugin (T-10.2)
export { SingleEliminationPlugin } from './phases/single-elimination';
export type {
  SingleEliminationSettings,
  BracketPosition,
} from './phases/single-elimination';
