'use client';

import { useEffect, useState, useCallback } from 'react';
import { syncManager, SyncStatus } from '../lib/syncManager';
import { offlineStorage } from '../lib/offlineStorage';
import { Tournament, Match, Team, Player } from '@ump/core';

export interface OfflineHookReturn {
  // Status
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus | null;

  // Data operations
  saveTournamentOffline: (tournament: Tournament) => Promise<void>;
  saveMatchOffline: (match: Match) => Promise<void>;
  saveTeamOffline: (team: Team) => Promise<void>;
  savePlayerOffline: (player: Player) => Promise<void>;

  // Retrieval operations
  getTournament: (id: string) => Promise<Tournament | null>;
  getAllTournaments: () => Promise<Tournament[]>;
  getMatchesByTournament: (tournamentId: string) => Promise<Match[]>;

  // Sync operations
  forceSync: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

export function useOffline(): OfflineHookReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncManager.addListener((status) => {
      setSyncStatus(status);
    });

    // Get initial status
    syncManager.getStatus().then(setSyncStatus);

    return unsubscribe;
  }, []);

  // Data saving operations with offline support
  const saveTournamentOffline = useCallback(
    async (tournament: Tournament) => {
      try {
        // Save to local storage immediately
        await offlineStorage.saveTournament(tournament);

        // Add to sync queue if online, otherwise it will sync when connection is restored
        await offlineStorage.addPendingAction({
          type: tournament.id ? 'UPDATE' : 'CREATE',
          entity: 'tournament',
          data: tournament,
        });

        // Trigger immediate sync if online
        if (syncStatus?.isOnline && !syncStatus.isSyncing) {
          syncManager.syncPendingActions();
        }
      } catch (error) {
        console.error('Failed to save tournament offline:', error);
        throw error;
      }
    },
    [syncStatus]
  );

  const saveMatchOffline = useCallback(
    async (match: Match) => {
      try {
        await offlineStorage.saveMatch(match);

        await offlineStorage.addPendingAction({
          type: match.id ? 'UPDATE' : 'CREATE',
          entity: 'match',
          data: match,
        });

        if (syncStatus?.isOnline && !syncStatus.isSyncing) {
          syncManager.syncPendingActions();
        }
      } catch (error) {
        console.error('Failed to save match offline:', error);
        throw error;
      }
    },
    [syncStatus]
  );

  const saveTeamOffline = useCallback(
    async (team: Team) => {
      try {
        await offlineStorage.save('teams', team);

        await offlineStorage.addPendingAction({
          type: team.id ? 'UPDATE' : 'CREATE',
          entity: 'team',
          data: team,
        });

        if (syncStatus?.isOnline && !syncStatus.isSyncing) {
          syncManager.syncPendingActions();
        }
      } catch (error) {
        console.error('Failed to save team offline:', error);
        throw error;
      }
    },
    [syncStatus]
  );

  const savePlayerOffline = useCallback(
    async (player: Player) => {
      try {
        await offlineStorage.save('players', player);

        await offlineStorage.addPendingAction({
          type: player.id ? 'UPDATE' : 'CREATE',
          entity: 'player',
          data: player,
        });

        if (syncStatus?.isOnline && !syncStatus.isSyncing) {
          syncManager.syncPendingActions();
        }
      } catch (error) {
        console.error('Failed to save player offline:', error);
        throw error;
      }
    },
    [syncStatus]
  );

  // Data retrieval operations
  const getTournament = useCallback(
    async (id: string): Promise<Tournament | null> => {
      try {
        return await offlineStorage.getTournament(id);
      } catch (error) {
        console.error('Failed to get tournament:', error);
        return null;
      }
    },
    []
  );

  const getAllTournaments = useCallback(async (): Promise<Tournament[]> => {
    try {
      return await offlineStorage.getAllTournaments();
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      return [];
    }
  }, []);

  const getMatchesByTournament = useCallback(
    async (tournamentId: string): Promise<Match[]> => {
      try {
        return await offlineStorage.getMatchesByTournament(tournamentId);
      } catch (error) {
        console.error('Failed to get matches:', error);
        return [];
      }
    },
    []
  );

  // Sync operations
  const forceSync = useCallback(async () => {
    try {
      await syncManager.forcSync();
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  }, []);

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineStorage.clearAllData();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  return {
    // Status
    isOnline: syncStatus?.isOnline ?? true,
    isSyncing: syncStatus?.isSyncing ?? false,
    syncStatus,

    // Data operations
    saveTournamentOffline,
    saveMatchOffline,
    saveTeamOffline,
    savePlayerOffline,

    // Retrieval operations
    getTournament,
    getAllTournaments,
    getMatchesByTournament,

    // Sync operations
    forceSync,
    clearOfflineData,
  };
}
