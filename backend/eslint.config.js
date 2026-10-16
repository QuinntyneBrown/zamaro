import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import noRawSql from './tools/eslint/no-raw-sql.js';

// Lint owns correctness; Prettier owns formatting (AGENTS.md). Rules are typescript-eslint's strict
// type-checked set (ADR-0027) plus Zamaro's own raw-SQL rule (L2-075.2).
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'next-env.d.ts',
      'database/seeders/media/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: { zamaro: { rules: { 'no-raw-sql': noRawSql } } },
    rules: { 'zamaro/no-raw-sql': 'error' },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
