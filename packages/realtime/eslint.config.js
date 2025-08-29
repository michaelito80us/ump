import sharedConfig from '../../eslint.config.shared.js';

export default [
  ...sharedConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        NodeJS: 'readonly',
      },
    },
    rules: {
      // Add any realtime-specific ESLint rules here
    },
  },
];
