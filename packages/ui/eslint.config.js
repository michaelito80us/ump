// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import sharedConfig from '../../eslint.config.shared.js';

export default [
  ...sharedConfig,
  {
    files: ['**/*.stories.@(js|jsx|ts|tsx)'],
    plugins: {
      storybook,
    },
    rules: {
      ...storybook.configs.recommended.rules,
    },
  },
];
