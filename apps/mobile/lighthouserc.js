module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/en/test-pwa'],
      startServerCommand: 'pnpm start',
      numberOfRuns: 3,
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        // PWA audits have been deprecated in Lighthouse v12+
        // 'categories:pwa': ['warn', { minScore: 0.3 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
  },
};
