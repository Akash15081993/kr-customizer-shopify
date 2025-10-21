// eslint.config.js
import js from '@eslint/js';
import next from 'eslint-config-next';

export default [
  js.configs.recommended,
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];