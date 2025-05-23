// @ump/engine - Plugin runtime and execution environment
import type { Tournament } from '@ump/core';

export interface PluginEngine {
  version: string;
  loadPlugin(id: string): Promise<void>;
}

export class TournamentEngine implements PluginEngine {
  version = '0.1.0';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loadPlugin(id: string): Promise<void> {
    // Plugin loading implementation will be added in T-2.1
    console.log('Plugin loading will be implemented in T-2.1');
  }

  processTournament(tournament: Tournament): void {
    console.log(`Processing tournament: ${tournament.name}`);
  }
}

export type { Tournament } from '@ump/core';
