'use client';

import React from 'react';

export default function MobilePage() {
  return (
    <main className="flex-1 space-y-6 p-4 pb-safe">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">UMP Mobile</h1>
        <p className="text-muted-foreground">
          Tournament management at your fingertips
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Quick Actions
            </h3>
            <p className="text-sm text-muted-foreground">
              Get started with tournament management
            </p>
          </div>
          <div className="p-6 pt-0 grid gap-3">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 w-full justify-start">
              <span className="text-lg mr-2">➕</span>
              Create Tournament
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-4 py-2 w-full justify-start">
              <span className="text-lg mr-2">📊</span>
              Live Scoring
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-4 py-2 w-full justify-start">
              <span className="text-lg mr-2">📋</span>
              View Tournaments
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <span className="text-2xl">📱</span>
              App Status
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PWA Ready</span>
              <span className="text-sm font-medium text-green-600">
                ✓ Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Offline Support
              </span>
              <span className="text-sm font-medium text-green-600">
                ✓ Enabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Real-time Updates
              </span>
              <span className="text-sm font-medium text-yellow-600">
                ⚠ Pending
              </span>
            </div>
          </div>
        </div>

        {/* Development Info */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              Development
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-2">
            <p className="text-sm text-muted-foreground">
              Next.js 15 App Router with Tailwind CSS
            </p>
            <p className="text-sm text-muted-foreground">
              React 19 with mobile-first responsive design
            </p>
            <p className="text-sm text-muted-foreground">
              PWA capabilities enabled
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
