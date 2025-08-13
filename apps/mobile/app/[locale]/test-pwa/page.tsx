'use client';

import { useState, useEffect } from 'react';
import { useOffline } from '../../../src/hooks/useOffline';
import {
  useServiceWorker,
  getServiceWorkerVersion,
} from '../../../src/components/ServiceWorkerRegistration';
import { Tournament } from '../../../lib/types';

export default function TestPWAPage() {
  const {
    isOnline,
    isSyncing,
    syncStatus,
    saveTournamentOffline,
    getAllTournaments,
    forceSync,
    clearOfflineData,
  } = useOffline();

  const { status: swStatus, updateServiceWorker } = useServiceWorker();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [swVersion, setSwVersion] = useState<string | null>(null);

  useEffect(() => {
    // Get service worker version
    getServiceWorkerVersion().then(setSwVersion);
  }, []);

  const handleCreateTestTournament = async () => {
    try {
      const testTournament: Tournament = {
        id: `test-${Date.now()}`,
        pluginId: 'single-elimination',
        name: `Test Tournament ${new Date().toLocaleTimeString()}`,
        status: 'NOT_STARTED',
        sport: 'rugby',
        phases: [],
        config: {
          statTier: 1,
          plugins: {
            sport: 'rugby',
            phases: [
              {
                pluginId: 'single-elimination',
                phaseName: 'Main Tournament',
                settings: {
                  allowThirdPlace: false,
                },
              },
            ],
          },
        },
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          clerkId: 'test-clerk-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        teams: [],
      };

      await saveTournamentOffline(testTournament);
      setTestMessage('Tournament saved offline successfully!');
      loadTournaments();
    } catch (error) {
      setTestMessage(`Error: ${error}`);
    }
  };

  const loadTournaments = async () => {
    try {
      const allTournaments = await getAllTournaments();
      setTournaments(allTournaments);
    } catch (error) {
      setTestMessage(`Error loading tournaments: ${error}`);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
      setTestMessage('Sync completed!');
    } catch (error) {
      setTestMessage(`Sync error: ${error}`);
    }
  };

  const handleClearData = async () => {
    try {
      await clearOfflineData();
      setTournaments([]);
      setTestMessage('Offline data cleared!');
    } catch (error) {
      setTestMessage(`Clear error: ${error}`);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">PWA Test Page</h1>

      {/* Status Display */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Network Status</h2>
        <p>Online: {isOnline ? '✅' : '❌'}</p>
        <p>Syncing: {isSyncing ? '🔄' : '✅'}</p>
        <p>Pending Actions: {syncStatus?.pendingActionsCount || 0}</p>
        <p>Failed Actions: {syncStatus?.failedActionsCount || 0}</p>
      </div>

      {/* Service Worker Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">Service Worker Status</h2>
        <p>Supported: {swStatus.isSupported ? '✅' : '❌'}</p>
        <p>Registered: {swStatus.isRegistered ? '✅' : '❌'}</p>
        <p>Update Available: {swStatus.isUpdateAvailable ? '🔄' : '✅'}</p>
        <p>Version: {swVersion || 'Unknown'}</p>
        {swStatus.isUpdateAvailable && (
          <button
            onClick={updateServiceWorker}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Update Service Worker
          </button>
        )}
      </div>

      {/* Test Message */}
      {testMessage && (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          <p className="text-sm">{testMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 mb-4">
        <button
          onClick={handleCreateTestTournament}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Test Tournament
        </button>

        <button
          onClick={loadTournaments}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Load Tournaments
        </button>

        <button
          onClick={handleForceSync}
          className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          disabled={!isOnline || isSyncing}
        >
          Force Sync
        </button>

        <button
          onClick={handleClearData}
          className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Offline Data
        </button>
      </div>

      {/* Tournaments List */}
      <div>
        <h2 className="font-semibold mb-2">
          Stored Tournaments ({tournaments.length})
        </h2>
        <div className="space-y-2">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="p-2 bg-gray-50 rounded text-sm">
              <p className="font-medium">{tournament.name}</p>
              <p className="text-gray-600">Sport: {tournament.sport}</p>
              <p className="text-xs text-gray-500">ID: {tournament.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
