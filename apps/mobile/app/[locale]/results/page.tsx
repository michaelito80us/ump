'use client';

import { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  points: number;
}

interface Tournament {
  name: string;
  status: 'COMPLETED';
  champion: string;
}

export default function ResultsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock tournament results data
    const mockTournament: Tournament = {
      name: 'Summer Basketball Championship',
      status: 'COMPLETED',
      champion: 'team-2'
    };

    const mockTeams: Team[] = [
      { id: 'team-2', name: 'Fire Dragons', wins: 5, losses: 0, points: 15 },
      { id: 'team-1', name: 'Thunder Bolts', wins: 4, losses: 1, points: 12 },
      { id: 'team-4', name: 'Storm Eagles', wins: 3, losses: 2, points: 9 },
      { id: 'team-3', name: 'Lightning Wolves', wins: 2, losses: 3, points: 6 },
      { id: 'team-5', name: 'Lightning Hawks', wins: 1, losses: 4, points: 3 },
      { id: 'team-6', name: 'Wind Runners', wins: 0, losses: 5, points: 0 }
    ];
    
    setTimeout(() => {
      setTournament(mockTournament);
      setTeams(mockTeams);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Loading Results...</h1>
      </div>
    );
  }

  const championTeam = teams.find(team => team.id === tournament?.champion);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tournament Results</h1>
      
      {tournament && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{tournament.name}</h2>
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-medium text-green-800 mb-1">
                  Tournament Complete
                </div>
                {championTeam && (
                  <div className="text-2xl font-bold text-green-900" data-testid="champion-display">
                    🏆 {championTeam.name} - Champion
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Final Standings</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Team</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Wins</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Losses</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teams.map((team, index) => (
                <tr 
                  key={team.id}
                  className={`hover:bg-gray-50 ${
                    team.id === tournament?.champion ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium">{index + 1}</span>
                      {team.id === tournament?.champion && (
                        <span className="ml-2 text-yellow-500">👑</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {team.name}
                    {team.id === tournament?.champion && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Champion
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{team.wins}</td>
                  <td className="px-4 py-3 text-sm text-center">{team.losses}</td>
                  <td className="px-4 py-3 text-sm text-center font-semibold">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Download Full Report
        </button>
      </div>
    </div>
  );
}