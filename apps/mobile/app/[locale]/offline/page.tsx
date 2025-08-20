'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Offline Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            {isOnline ? (
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Status Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isOnline ? 'Back Online!' : "You're Offline"}
        </h1>

        <p className="text-gray-600 mb-6">
          {isOnline
            ? 'Your connection has been restored. You can now access all features.'
            : 'No internet connection detected. Some features may be limited, but you can still view cached tournaments and matches.'}
        </p>

        {/* Connection Status */}
        <div
          data-testid="offline-indicator"
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6 ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          {isOnline ? 'Connected' : 'Disconnected'}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
            >
              Waiting for Connection...
            </button>
          )}

          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Home
          </Link>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Available Offline:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View cached tournaments</li>
              <li>• Browse saved matches</li>
              <li>• Create new tournaments (will sync later)</li>
              <li>• Update match scores (will sync later)</li>
            </ul>
          </div>
        )}

        {/* Auto-retry indicator */}
        {!isOnline && (
          <div className="mt-4 text-xs text-gray-500">
            Checking connection automatically...
          </div>
        )}
      </div>
    </div>
  );
}
