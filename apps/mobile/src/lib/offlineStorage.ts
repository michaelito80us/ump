/// <reference lib="dom" />

import { Tournament, Match } from '../../lib/types';

// IndexedDB database name and version
const DB_NAME = 'UMPOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  TOURNAMENTS: 'tournaments',
  MATCHES: 'matches',
  TEAMS: 'teams',
  PLAYERS: 'players',
  PENDING_ACTIONS: 'pendingActions',
  SYNC_QUEUE: 'syncQueue',
} as const;

export interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'tournament' | 'match' | 'team' | 'player';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncQueueItem {
  id: string;
  action: PendingAction;
  priority: number;
  lastAttempt?: number;
}

class OfflineStorageManager {
  private db: any = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.TOURNAMENTS)) {
          const tournamentStore = db.createObjectStore(STORES.TOURNAMENTS, {
            keyPath: 'id',
          });
          tournamentStore.createIndex('status', 'status', { unique: false });
          tournamentStore.createIndex('lastModified', 'lastModified', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.MATCHES)) {
          const matchStore = db.createObjectStore(STORES.MATCHES, {
            keyPath: 'id',
          });
          matchStore.createIndex('tournamentId', 'tournamentId', {
            unique: false,
          });
          matchStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TEAMS)) {
          const teamStore = db.createObjectStore(STORES.TEAMS, {
            keyPath: 'id',
          });
          teamStore.createIndex('tournamentId', 'tournamentId', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.PLAYERS)) {
          const playerStore = db.createObjectStore(STORES.PLAYERS, {
            keyPath: 'id',
          });
          playerStore.createIndex('teamId', 'teamId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
          const actionStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
            keyPath: 'id',
          });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionStore.createIndex('entity', 'entity', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
          });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    });
  }

  // Generic CRUD operations
  async save<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Specific entity operations
  async saveTournament(tournament: Tournament): Promise<void> {
    await this.save(STORES.TOURNAMENTS, {
      ...tournament,
      lastModified: Date.now(),
    });
  }

  async getTournament(id: string): Promise<Tournament | null> {
    return this.get<Tournament>(STORES.TOURNAMENTS, id);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return this.getAll<Tournament>(STORES.TOURNAMENTS);
  }

  async saveMatch(match: Match): Promise<void> {
    await this.save(STORES.MATCHES, { ...match, lastModified: Date.now() });
  }

  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.MATCHES], 'readonly');
      const store = transaction.objectStore(STORES.MATCHES);
      const index = store.index('tournamentId');
      const request = index.getAll(tournamentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // Pending actions for offline sync
  async addPendingAction(
    action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const pendingAction: PendingAction = {
      ...action,
      id:
        typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : Math.random().toString(36),
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.save(STORES.PENDING_ACTIONS, pendingAction);
  }

  async getPendingActions(): Promise<PendingAction[]> {
    return this.getAll<PendingAction>(STORES.PENDING_ACTIONS);
  }

  async removePendingAction(id: string): Promise<void> {
    await this.delete(STORES.PENDING_ACTIONS, id);
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      // Try to initialize if not already done
      await this.init();
      if (!this.db) throw new Error('Database not initialized');
    }

    const storeNames = Object.values(STORES);
    const transaction = this.db.transaction(storeNames, 'readwrite');

    await Promise.all(
      storeNames.map((storeName) => {
        return new Promise<void>((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      })
    );
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

// Initialize on import
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
}
