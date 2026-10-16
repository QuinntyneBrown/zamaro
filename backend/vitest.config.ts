import { defineConfig } from 'vitest/config';

// Integration tests against the running test API over HTTP (ADR-0027).
export default defineConfig({
  test: {
    include: ['tests/feature/**/*.test.ts'],
    globalSetup: ['tests/setup/global.ts'],
    testTimeout: 15_000,
    hookTimeout: 60_000,
    passWithNoTests: true,
  },
});
