'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TournamentData {
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tournamentData, setTournamentData] = useState<TournamentData>({
    name: '',
    sport: 'basketball',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 12,
  });

  const handleInputChange = (
    field: keyof TournamentData,
    value: string | number
  ) => {
    setTournamentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePublish = async () => {
    // Simulate tournament creation
    console.log('Creating tournament:', tournamentData);

    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect to tournament page
    router.push('/en');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Tournament
          </h1>
          <p className="text-gray-600 mb-8">
            Set up your tournament step by step
          </p>

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 1: Tournament Basics
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  data-testid="tournament-name"
                  value={tournamentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tournament name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  data-testid="sport-select"
                  value={tournamentData.sport}
                  onChange={(e) => handleInputChange('sport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basketball">Basketball</option>
                  <option value="soccer">Soccer</option>
                  <option value="tennis">Tennis</option>
                  <option value="volleyball">Volleyball</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    data-testid="start-date"
                    value={tournamentData.startDate}
                    onChange={(e) =>
                      handleInputChange('startDate', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    data-testid="end-date"
                    value={tournamentData.endDate}
                    onChange={(e) =>
                      handleInputChange('endDate', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Teams & Players */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Step 2: Teams & Players</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Teams
                </label>
                <input
                  type="number"
                  data-testid="max-teams"
                  value={tournamentData.maxTeams}
                  onChange={(e) =>
                    handleInputChange('maxTeams', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2"
                  max="32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Players per Team
                  </label>
                  <input
                    type="number"
                    data-testid="min-players"
                    value={tournamentData.minPlayersPerTeam}
                    onChange={(e) =>
                      handleInputChange(
                        'minPlayersPerTeam',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Players per Team
                  </label>
                  <input
                    type="number"
                    data-testid="max-players"
                    value={tournamentData.maxPlayersPerTeam}
                    onChange={(e) =>
                      handleInputChange(
                        'maxPlayersPerTeam',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Format */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 3: Tournament Format
              </h2>
              <p className="text-gray-600">
                Tournament format configuration will be implemented here.
              </p>
            </div>
          )}

          {/* Step 4: Plugins */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 4: Plugins & Features
              </h2>
              <p className="text-gray-600">
                Plugin configuration will be implemented here.
              </p>
            </div>
          )}

          {/* Step 5: Rules */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 5: Rules & Settings
              </h2>
              <p className="text-gray-600">
                Tournament rules configuration will be implemented here.
              </p>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">
                  Tournament Summary
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>Name:</strong> {tournamentData.name}
                  </li>
                  <li>
                    <strong>Sport:</strong> {tournamentData.sport}
                  </li>
                  <li>
                    <strong>Dates:</strong> {tournamentData.startDate} to{' '}
                    {tournamentData.endDate}
                  </li>
                  <li>
                    <strong>Teams:</strong> Up to {tournamentData.maxTeams}
                  </li>
                  <li>
                    <strong>Players:</strong> {tournamentData.minPlayersPerTeam}
                    -{tournamentData.maxPlayersPerTeam} per team
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Previous
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                data-testid="next-button"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handlePublish}
                data-testid="publish-tournament"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Publish Tournament
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-3 h-3 rounded-full ${
                    stepNum === step
                      ? 'bg-blue-600'
                      : stepNum < step
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
