'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface TournamentArchive {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: 'COMPLETED';
  totalTeams: number;
  totalMatches: number;
  champion: string;
  runnerUp: string;
  topScorer?: string;
  totalGoals?: number;
}

interface ArchiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  round: string;
}

export default function TournamentArchivePage() {
  const params = useParams();
  const [tournament, setTournament] = useState<TournamentArchive | null>(null);
  const [matches, setMatches] = useState<ArchiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock tournament archive data
    const mockTournament: TournamentArchive = {
      id: '1',
      name: 'Rugby Championship 2024',
      sport: 'Basketball',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      status: 'COMPLETED',
      totalTeams: 6,
      totalMatches: 15,
      champion: 'Thunder Bolts',
      runnerUp: 'Fire Dragons',
      topScorer: 'John Smith (Thunder Bolts)',
      totalGoals: 45,
    };

    const mockMatches: ArchiveMatch[] = [
      {
        id: '1',
        homeTeam: 'Thunder Bolts',
        awayTeam: 'Fire Dragons',
        homeScore: 25,
        awayScore: 18,
        date: '2024-01-15',
        round: 'Final',
      },
      {
        id: '2',
        homeTeam: 'Ice Wolves',
        awayTeam: 'Storm Eagles',
        homeScore: 15,
        awayScore: 22,
        date: '2024-01-14',
        round: 'Semi-Final',
      },
      {
        id: '3',
        homeTeam: 'Thunder Bolts',
        awayTeam: 'Lightning Hawks',
        homeScore: 30,
        awayScore: 12,
        date: '2024-01-14',
        round: 'Semi-Final',
      },
    ];

    setTimeout(() => {
      setTournament(mockTournament);
      setMatches(mockMatches);
      setLoading(false);
    }, 500);
  }, [params.slug]);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">
          Loading Tournament Archive...
        </h1>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tournament Archive</h1>

      {/* Tournament Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{tournament.name}</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Sport:</span>
            <div className="font-medium">{tournament.sport}</div>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <div className="font-medium">
              {new Date(tournament.startDate).toLocaleDateString()} -{' '}
              {new Date(tournament.endDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Teams:</span>
            <div className="font-medium">{tournament.totalTeams}</div>
          </div>
          <div>
            <span className="text-gray-600">Matches:</span>
            <div className="font-medium">{tournament.totalMatches}</div>
          </div>
        </div>
      </div>

      {/* Championship Results */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Championship Results</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-lg font-bold text-yellow-800">Champion</div>
            <div className="text-xl font-semibold">{tournament.champion}</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl mb-2">🥈</div>
            <div className="text-lg font-bold text-gray-700">Runner-up</div>
            <div className="text-xl font-semibold">{tournament.runnerUp}</div>
          </div>
        </div>

        {tournament.topScorer && (
          <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-800">Top Scorer</div>
            <div className="text-xl font-semibold">{tournament.topScorer}</div>
            <div className="text-sm text-blue-600">
              {tournament.totalGoals} points
            </div>
          </div>
        )}
      </div>

      {/* Match Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Match Results</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {matches.map((match) => (
            <div key={match.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600 min-w-[80px]">
                    {match.round}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{match.homeTeam}</span>
                    <span className="text-lg font-bold text-blue-600">
                      {match.homeScore}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-lg font-bold text-blue-600">
                      {match.awayScore}
                    </span>
                    <span className="font-medium">{match.awayTeam}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(match.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-3">
          Download Tournament Report
        </button>
        <button className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Share Archive
        </button>
      </div>
    </div>
  );
}
