import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests run the route handlers in-process on an in-memory PGlite database (ADR-0028): one fresh
// database per test file, no Docker, no Postgres, no Redis.
export default defineConfig({
  resolve: {
    alias: {
      '@config': fileURLToPath(new URL('./config', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/feature/**/*.test.ts'],
    setupFiles: ['tests/setup/env.ts'],
    testTimeout: 15_000,
    hookTimeout: 60_000,
    passWithNoTests: true,
  },
});
