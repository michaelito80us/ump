// @ump/plugins - Plugin Collection
// Placeholder file - implementation pending

// Placeholder export to prevent empty module
export const PLUGINS_VERSION = '0.1.0';

// Export Rugby Plugin (T-10.1)
export { RugbyPlugin, rugbyVariants } from './sports/rugby/index.js';
export type { RugbyScoreBreakdown } from './sports/rugby/index.js';

// Export Single Elimination Plugin
export { SingleEliminationPlugin } from './phases/single-elimination';
export type {
  SingleEliminationSettings,
  BracketPosition,
} from './phases/single-elimination';

// Export Round Robin Plugin (T-10.2)
export { RoundRobinPlugin } from './phases/round-robin';
export type { RoundRobinSettings, StandingsEntry } from './phases/round-robin';
export { getHeadToHeadRecord } from './phases/round-robin';

// Export Greedy Scheduler Plugin (T-9.1)
export { GreedyScheduler } from './scheduling/greedy';

// Export ILP Scheduler Plugin (T-9.2)
export { ILPScheduler } from './scheduling/ilp_v1';

// Export Day Bucket Scheduler Plugin (T-9.3)
export { DayBucketScheduler } from './scheduling/dayBucket';
