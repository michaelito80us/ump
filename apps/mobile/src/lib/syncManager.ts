'use client';

import { offlineStorage, PendingAction } from './offlineStorage';
import { requestBackgroundSync } from '../components/ServiceWorkerRegistration';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingActionsCount: number;
  failedActionsCount: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

class SyncManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private lastSyncTime: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
      this.startPeriodicSync();
      this.setupServiceWorkerSync();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Sync when app becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETED') {
          this.handleServiceWorkerSyncCompleted(event.data);
        }
      });
    }
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  public addListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public async getStatus(): Promise<SyncStatus> {
    const pendingActions = await offlineStorage.getPendingActions();
    const failedActions = pendingActions.filter(
      (action) => action.retryCount > 0
    );

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingActionsCount: pendingActions.length,
      failedActionsCount: failedActions.length,
    };
  }

  public async syncPendingActions(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Not online or already syncing'],
      };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      const result: SyncResult = {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [],
      };

      // Sort by timestamp to maintain order
      const sortedActions = pendingActions.sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const action of sortedActions) {
        try {
          await this.syncSingleAction(action);
          await offlineStorage.removePendingAction(action.id);
          result.syncedCount++;
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          result.failedCount++;
          result.errors.push(
            `Failed to sync ${action.type} ${action.entity}: ${error}`
          );

          // Increment retry count
          action.retryCount++;

          // Remove action if it has failed too many times
          if (action.retryCount >= 5) {
            await offlineStorage.removePendingAction(action.id);
            console.warn('Removing action after 5 failed attempts:', action);
          } else {
            await offlineStorage.save('pendingActions', action);
        }
      }
    }

    this.lastSyncTime = Date.now();
    
    // Notify service worker of sync completion
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_STATUS_UPDATE',
        data: {
          syncedCount: result.syncedCount,
          failedCount: result.failedCount,
          timestamp: this.lastSyncTime
        }
      });
    }
    
    return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [String(error)],
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public async forcSync(): Promise<SyncResult> {
    return this.syncPendingActions();
  }

  private setupServiceWorkerSync(): void {
    // Register for background sync when actions are added
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('[SyncManager] Service worker background sync available');
    } else {
      console.log('[SyncManager] Background sync not supported, using fallback');
    }
  }

  private handleServiceWorkerSyncCompleted(data: any): void {
    console.log('[SyncManager] Service worker sync completed:', data);
    this.lastSyncTime = Date.now();
    this.notifyListeners();
  }

  public async requestBackgroundSync(): Promise<void> {
    try {
      // Request background sync through service worker
      requestBackgroundSync('background-sync');
      console.log('[SyncManager] Background sync requested');
    } catch (error) {
      console.error('[SyncManager] Failed to request background sync:', error);
      // Fallback to immediate sync if background sync fails
      this.syncPendingActions();
    }
  }

  private async syncSingleAction(action: PendingAction): Promise<void> {
    // This would normally make API calls to your backend
    // For now, we'll simulate the API calls

    const apiEndpoint = this.getApiEndpoint(action.entity);
    const method = this.getHttpMethod(action.type);

    const response = await fetch(apiEndpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here
      },
      body: action.type !== 'DELETE' ? JSON.stringify(action.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local storage with server response if needed
    if (action.type === 'CREATE' || action.type === 'UPDATE') {
      const updatedData = await response.json();
      await this.updateLocalStorage(action.entity, updatedData);
    }
  }

  private getApiEndpoint(entity: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    switch (entity) {
      case 'tournament':
        return `${baseUrl}/tournaments`;
      case 'match':
        return `${baseUrl}/matches`;
      case 'team':
        return `${baseUrl}/teams`;
      case 'player':
        return `${baseUrl}/players`;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private getHttpMethod(actionType: string): string {
    switch (actionType) {
      case 'CREATE':
        return 'POST';
      case 'UPDATE':
        return 'PUT';
      case 'DELETE':
        return 'DELETE';
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  private async updateLocalStorage(entity: string, data: any): Promise<void> {
    switch (entity) {
      case 'tournament':
        await offlineStorage.saveTournament(data);
        break;
      case 'match':
        await offlineStorage.saveMatch(data);
        break;
      case 'team':
      case 'player':
        await offlineStorage.save(`${entity}s`, data);
        break;
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();
