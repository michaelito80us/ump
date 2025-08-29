'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleCalendar } from '../../components/ScheduleCalendar';
import type { Match, Team } from '@ump/core';
import {
  useMatchesSubscription,
  useRealtimeConnection,
} from '../../hooks/use-realtime';
import { ConnectionStatus } from '../../components/connection-status';

// Mock data for testing
const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Dragons',
    sportIds: ['rugby'],
    playerIds: [],
    managers: [],
    tournaments: ['tournament-1'],
  },
  {
    id: 'team-2',
    name: 'Lions',
    sportIds: ['rugby'],
    playerIds: [],
    managers: [],
    tournaments: ['tournament-1'],
  },
  {
    id: 'team-3',
    name: 'Eagles',
    sportIds: ['rugby'],
    playerIds: [],
    managers: [],
    tournaments: ['tournament-1'],
  },
  {
    id: 'team-4',
    name: 'Wolves',
    sportIds: ['rugby'],
    playerIds: [],
    managers: [],
    tournaments: ['tournament-1'],
  },
];

const generateMockMatches = (): Match[] => {
  const now = new Date();
  const matches: Match[] = [];

  // Generate matches for the next 7 days
  for (let day = 0; day < 7; day++) {
    for (let matchIndex = 0; matchIndex < 3; matchIndex++) {
      const matchDate = new Date(now);
      matchDate.setDate(now.getDate() + day);
      matchDate.setHours(10 + matchIndex * 3, 0, 0, 0); // 10am, 1pm, 4pm

      const teamAIndex = (day * 3 + matchIndex) % mockTeams.length;
      const teamBIndex = (teamAIndex + 1) % mockTeams.length;

      const statuses: Array<'pending' | 'live' | 'final' | 'needs_approval'> = [
        'pending',
        'live',
        'final',
        'needs_approval',
      ];

      const venues = ['Field A', 'Field B', 'Court 1', 'Court 2'];

      matches.push({
        id: `match-${day}-${matchIndex}`,
        teamA: mockTeams[teamAIndex],
        teamB: mockTeams[teamBIndex],
        scoreA: Math.floor(Math.random() * 30),
        scoreB: Math.floor(Math.random() * 30),
        scheduledTime: matchDate.toISOString(),
        venue: venues[matchIndex % venues.length],
        status: statuses[matchIndex % statuses.length],
      });
    }
  }

  return matches;
};

export default function ScheduleTestPage() {
  const [matches, setMatches] = useState<Match[]>(generateMockMatches());
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const { isConnected } = useRealtimeConnection();

  // Subscribe to real-time updates for all matches
  const matchIds = matches.map((m) => m.id);
  const { matchesData: realtimeMatches, lastUpdate } =
    useMatchesSubscription(matchIds);

  const venues = ['Field A', 'Field B', 'Court 1', 'Court 2'];

  // Update local matches when real-time data changes
  useEffect(() => {
    if (lastUpdate && realtimeMatches[lastUpdate.entityId]) {
      setMatches((prev) =>
        prev.map((match) => {
          if (match.id === lastUpdate.entityId) {
            const realtimeData = realtimeMatches[lastUpdate.entityId];
            return {
              ...match,
              ...realtimeData,
              // Map real-time fields to local match structure
              scoreA: realtimeData.scoreA ?? match.scoreA,
              scoreB: realtimeData.scoreB ?? match.scoreB,
              status: realtimeData.status || match.status,
              scheduledTime: realtimeData.scheduledTime || match.scheduledTime,
              venue: realtimeData.venue || match.venue,
            };
          }
          return match;
        })
      );
    }
  }, [lastUpdate, realtimeMatches]);

  const handleMatchUpdate = async (
    matchId: string,
    updates: Partial<Match>
  ) => {
    console.log('Updating match:', matchId, updates);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setMatches((prevMatches) =>
      prevMatches.map((match) =>
        match.id === matchId ? { ...match, ...updates } : match
      )
    );

    console.log('Match updated successfully!');
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
  };

  const regenerateMatches = () => {
    setMatches(generateMockMatches());
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Schedule Calendar Test
            </h1>
            <ConnectionStatus compact />
          </div>
          <p className="text-gray-600">
            Testing T-5.4 Schedule Calendar with Drag-Drop functionality
            {isConnected && (
              <span className="ml-2 text-green-600 text-sm">
                • Live match updates enabled
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isReadOnly}
              onChange={(e) => setIsReadOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Read-only mode</span>
          </label>

          <button
            onClick={regenerateMatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Regenerate Matches
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {matches.length}
          </div>
          <div className="text-sm text-gray-600">Total Matches</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {matches.filter((m) => m.status === 'final').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 relative">
          <div className="text-2xl font-bold text-orange-600">
            {matches.filter((m) => m.status === 'live').length}
          </div>
          <div className="text-sm text-gray-600">Live</div>
          {matches.some((m) => m.status === 'live') && isConnected && (
            <div
              className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title="Live updates active"
            />
          )}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {matches.filter((m) => m.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Calendar Component */}
      <ScheduleCalendar
        matches={matches}
        onMatchUpdate={handleMatchUpdate}
        onMatchClick={handleMatchClick}
        venues={venues}
        isReadOnly={isReadOnly}
      />

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Match Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <strong>Teams:</strong> {selectedMatch.teamA.name} vs{' '}
                {selectedMatch.teamB.name}
              </div>
              <div>
                <strong>Score:</strong> {selectedMatch.scoreA} -{' '}
                {selectedMatch.scoreB}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className="capitalize">
                  {selectedMatch.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <strong>Venue:</strong> {selectedMatch.venue || 'TBD'}
              </div>
              <div>
                <strong>Scheduled:</strong>{' '}
                {selectedMatch.scheduledTime
                  ? new Date(selectedMatch.scheduledTime).toLocaleString()
                  : 'Not scheduled'}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Test Instructions:</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>
            • Drag and drop matches to reschedule them (when not in read-only
            mode)
          </li>
          <li>• Click on matches to view details</li>
          <li>• Use the venue filter to show matches for specific venues</li>
          <li>
            • Locked matches (live/final) cannot be moved and show a lock icon
          </li>
          <li>• Toggle read-only mode to disable drag-drop functionality</li>
          <li>
            • Use different calendar views (month/week/day) from the header
          </li>
        </ul>
      </div>
    </div>
  );
}
