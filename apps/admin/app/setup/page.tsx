'use client';

import React from 'react';
import { TournamentWizard } from '../../components/forms/TournamentWizard';

export default function TournamentSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Tournament
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Set up your tournament step by step. You can save as draft at any
              time.
            </p>
          </div>
          <div className="p-6">
            <TournamentWizard />
          </div>
        </div>
      </div>
    </div>
  );
}
