import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'dist-e2e/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.ts'],
    plugins: { '@stylistic': stylistic },
    rules: {
      complexity: ['warn', 8],
      'max-depth': ['warn', 3],
      'max-lines-per-function': ['warn', { max: 10, skipBlankLines: true, skipComments: true }],
      '@stylistic/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'switch', 'try', 'return'] },
        { blankLine: 'always', prev: ['block-like', 'function'], next: '*' },
        { blankLine: 'always', prev: '*', next: 'function' },
      ],
      '@stylistic/lines-between-class-members': ['warn', 'always', { exceptAfterSingleLine: true }],
    },
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['playwright.config.ts', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: { '@typescript-eslint/no-non-null-assertion': 'error' },
  },
);
