// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'zm',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'zm',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  // User-facing text comes from the translation catalogue (L2-111.1). Perf-test scenarios render
  // fixed mock copy on purpose and are not user-facing; index.html is the static host page whose
  // <title> the title strategy replaces.
  {
    files: ['projects/{zamaro,admin,components}/**/*.html'],
    ignores: ['**/index.html'],
    plugins: {
      zamaro: { rules: { 'no-hardcoded-text': require('./tools/eslint/no-hardcoded-text') } },
    },
    rules: { 'zamaro/no-hardcoded-text': 'error' },
  },
  // Prettier owns formatting: turn off every lint rule that would fight it.
  prettier,
]);
