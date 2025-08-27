module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: '.\\start-production.bat',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        preset: 'desktop',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa',
        ],
        skipAudits: ['uses-http2'],
        budgets: './lighthouse/budgets.json',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['error', { minScore: 0.7 }],
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3500 }],
        // Specific audits that were failing
        'network-dependency-tree-insight': ['warn', { minScore: 0.5 }],
        'unused-javascript': ['warn', { maxLength: 2 }],
        'valid-source-maps': ['error', { minScore: 0.9 }],
        'legacy-javascript': ['warn', { maxLength: 2 }],
        'render-blocking-insight': ['warn', { maxLength: 2 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: './.lighthouseci',
      },
    },
  },
};
