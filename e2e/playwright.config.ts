import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 4000;

// Chromium only (AGENTS.md). One Playwright project per application; the admin
// project is added with the admin slice.
export default defineConfig({
  testDir: '.',
  testMatch: [
    'specs/**/*.spec.ts',
    'visual/**/*.spec.ts',
    'a11y/**/*.spec.ts',
    'perf/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './fixtures/global-setup.ts',
  // Visual parity (adapt-layout-to-screens): 0.1 % of the pixels may differ (M9 D22). Baselines carry
  // the platform in their name: win32 from the Windows host, linux from `npm run test:docker` (ADR-0014).
  expect: {
    // The API answers in 1-3 s under a full parallel run on a Windows host (bind-mounted PHP), so a
    // page that makes two or three calls before it settles needs more than the 5 s default.
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
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
      // run-in-docker.mjs points the container's server at the API on the host.
      API_ORIGIN: process.env['E2E_API_ORIGIN'] ?? 'http://localhost:8001',
      ZAMARO_FROZEN_NOW: '2026-10-09T10:00:00-04:00',
    },
  },
});
