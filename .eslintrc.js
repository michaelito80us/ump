module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: ['dist', 'build', '.next', 'node_modules', '*.config.js'],
};
