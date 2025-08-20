'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { OfflineIndicator } from '../../../components/OfflineIndicator';
import Link from 'next/link';

interface TournamentFormData {
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
}

export default function SetupPage() {
  const t = useTranslations('setup');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    sport: 'rugby',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    minPlayersPerTeam: 15,
    maxPlayersPerTeam: 23
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleInputChange = (field: keyof TournamentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Simulate tournament creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPublishSuccess(true);
    setIsPublishing(false);
  };

  if (publishSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('tournamentCreated', { default: 'Tournament created successfully!' })}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('tournamentPublished', { default: 'Your tournament has been published and is ready for team registration.' })}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('backToHome', { default: 'Back to Home' })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('title', { default: 'Create New Tournament' })}
            </h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('backToHome', { default: '← Back to Home' })}
            </Link>
          </div>
          <p className="text-gray-600">
            {t('subtitle', { default: 'Set up your tournament step by step' })}
          </p>
          
          {/* Progress indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Step {currentStep} of 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% complete</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('step1Title', { default: 'Tournament Basics' })}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tournamentName', { default: 'Tournament Name' })}
                  </label>
                  <input
                    type="text"
                    data-testid="tournament-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tournament name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sport', { default: 'Sport' })}
                  </label>
                  <select
                    data-testid="sport-select"
                    value={formData.sport}
                    onChange={(e) => handleInputChange('sport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rugby">Rugby</option>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('startDate', { default: 'Start Date' })}
                    </label>
                    <input
                      type="date"
                      data-testid="start-date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('endDate', { default: 'End Date' })}
                    </label>
                    <input
                      type="date"
                      data-testid="end-date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('step2Title', { default: 'Teams & Players' })}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('maxTeams', { default: 'Maximum Teams' })}
                  </label>
                  <input
                    type="number"
                    data-testid="max-teams"
                    value={formData.maxTeams}
                    onChange={(e) => handleInputChange('maxTeams', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2"
                    max="32"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('minPlayers', { default: 'Min Players per Team' })}
                    </label>
                    <input
                      type="number"
                      data-testid="min-players"
                      value={formData.minPlayersPerTeam}
                      onChange={(e) => handleInputChange('minPlayersPerTeam', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('maxPlayers', { default: 'Max Players per Team' })}
                    </label>
                    <input
                      type="number"
                      data-testid="max-players"
                      value={formData.maxPlayersPerTeam}
                      onChange={(e) => handleInputChange('maxPlayersPerTeam', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('step3Title', { default: 'Tournament Format' })}
              </h2>
              <p className="text-gray-600">
                {t('formatDescription', { default: 'Round-robin format with knockout finals will be used.' })}
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('step4Title', { default: 'Plugins & Settings' })}
              </h2>
              <p className="text-gray-600">
                {t('pluginsDescription', { default: 'Default rugby scoring and scheduling plugins will be used.' })}
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('step5Title', { default: 'Review & Publish' })}
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  {t('tournamentSummary', { default: 'Tournament Summary' })}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('name', { default: 'Name' })}:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('sport', { default: 'Sport' })}:</dt>
                    <dd className="font-medium">{formData.sport}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('dates', { default: 'Dates' })}:</dt>
                    <dd className="font-medium">{formData.startDate} - {formData.endDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('teams', { default: 'Max Teams' })}:</dt>
                    <dd className="font-medium">{formData.maxTeams}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('previous', { default: 'Previous' })}
            </button>
            
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                data-testid="next-button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('next', { default: 'Next' })}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                data-testid="publish-tournament"
                disabled={isPublishing}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isPublishing ? t('publishing', { default: 'Publishing...' }) : t('publish', { default: 'Publish Tournament' })}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}