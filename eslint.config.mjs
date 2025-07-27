import prettier from 'eslint-config-prettier';

import apify from '@apify/eslint-config/ts.js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// eslint-disable-next-line import/no-default-export
export default [
  { ignores: ['**/dist', 'eslint.config.mjs'] },
  ...apify,
  prettier,
  {
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
    },
    rules: {
      'no-console': 0,
      '@typescript-eslint/no-explicit-any': 'off',
      'simple-import-sort/imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
