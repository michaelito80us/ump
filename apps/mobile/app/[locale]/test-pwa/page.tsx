'use client';

import { useState } from 'react';
import { useOffline } from '../../../src/hooks/useOffline';
import { Tournament } from '@ump/core';

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

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [testMessage, setTestMessage] = useState('');

  const handleCreateTestTournament = async () => {
    try {
      const testTournament: Tournament = {
        id: `test-${Date.now()}`,
        name: `Test Tournament ${new Date().toLocaleTimeString()}`,
        description: 'Test tournament for PWA functionality',
        status: 'draft',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        sport: 'rugby',
        variant: '15s',
        teams: [],
        matches: [],
        phases: [],
        config: {
          maxTeams: 16,
          allowLateRegistration: true,
          registrationDeadline: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        <h2 className="font-semibold mb-2">Status</h2>
        <p>Online: {isOnline ? '✅' : '❌'}</p>
        <p>Syncing: {isSyncing ? '🔄' : '✅'}</p>
        <p>Pending Actions: {syncStatus?.pendingActionsCount || 0}</p>
        <p>Failed Actions: {syncStatus?.failedActionsCount || 0}</p>
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
              <p className="text-gray-600">{tournament.description}</p>
              <p className="text-xs text-gray-500">ID: {tournament.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
