'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      setErrors((prev) => [...prev, args.join(' ')]);
      originalError(...args);
    };

    console.warn = (...args) => {
      setWarnings((prev) => [...prev, args.join(' ')]);
      originalWarn(...args);
    };

    // Listen for unhandled errors
    const handleError = (event: Event) => {
      const errorEvent = event as unknown as {
        message: string;
        filename: string;
        lineno: number;
      };
      console.error('Global error caught:', {
        message: errorEvent.message,
        filename: errorEvent.filename,
        lineno: errorEvent.lineno,
        timestamp: new Date().toISOString(),
      });
    };

    const handleUnhandledRejection = (event: Event) => {
      const rejectionEvent = event as unknown as { reason: unknown };
      console.error('Unhandled promise rejection:', {
        reason: rejectionEvent.reason,
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Runtime Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 p-4 rounded border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Errors ({errors.length})
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {errors.length === 0 ? (
              <p className="text-green-600">No errors detected</p>
            ) : (
              errors.map((error, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 bg-red-100 rounded text-sm"
                >
                  {error}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Warnings ({warnings.length})
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {warnings.length === 0 ? (
              <p className="text-green-600">No warnings detected</p>
            ) : (
              warnings.map((warning, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 bg-yellow-100 rounded text-sm"
                >
                  {warning}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Environment Info
        </h2>
        <div className="text-sm space-y-1">
          <p>
            <strong>User Agent:</strong>{' '}
            {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}
          </p>
          <p>
            <strong>Window defined:</strong>{' '}
            {typeof window !== 'undefined' ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Document defined:</strong>{' '}
            {typeof document !== 'undefined' ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Navigator online:</strong>{' '}
            {typeof navigator !== 'undefined' ? navigator.onLine : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            setErrors([]);
            setWarnings([]);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
