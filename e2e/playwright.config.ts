import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 4000;

// Chromium only (AGENTS.md). One Playwright project per application; the admin
// project is added with the admin slice.
export default defineConfig({
  testDir: '.',
  testMatch: ['specs/**/*.spec.ts', 'visual/**/*.spec.ts', 'a11y/**/*.spec.ts', 'perf/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './fixtures/global-setup.ts',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'zamaro', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node ../frontend/dist/zamaro/server/server.mjs',
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: !process.env['CI'],
    env: {
      PORT: String(WEB_PORT),
      API_ORIGIN: 'http://localhost:8001',
      ZAMARO_FROZEN_NOW: '2026-10-09T10:00:00-04:00',
    },
  },
});
