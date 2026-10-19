import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 4000;

// Chromium only (AGENTS.md). One Playwright project per application: `zamaro` for the public site
// and `admin` for the admin application, whose specs sign Priya in with a code (M3 S3). The admin
// specs that change the seed (`*.mutation.spec.ts`) run one at a time in `admin-mutations` and
// `zamaro-mutations`, after the read-only suites, and their teardown resets the database (M3 S8).
export default defineConfig({
  testDir: '.',
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
  projects: [
    {
      name: 'zamaro',
      testMatch: [
        'specs/!(administration)/**/*.spec.ts',
        'visual/visual.spec.ts',
        'a11y/a11y.spec.ts',
        'perf/**/*.spec.ts',
      ],
      // A subsystem's admin screens sit under specs/{subsystem}/admin/ and run in the admin project.
      testIgnore: 'specs/*/admin/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: [
        'specs/administration/**/*.spec.ts',
        'specs/*/admin/**/*.spec.ts',
        'visual/admin.spec.ts',
        'a11y/admin.spec.ts',
      ],
      testIgnore: '**/*.mutation.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${WEB_PORT}/admin/`,
      },
    },
    {
      name: 'admin-mutations',
      testMatch: 'specs/*/admin/**/*.mutation.spec.ts',
      dependencies: ['admin'],
      teardown: 'reseed',
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${WEB_PORT}/admin/`,
      },
    },
    // The public site's specs that change the seed (an artist's availability) run one at a time
    // after every read-only project, so nothing reads a changed calendar; the same teardown resets
    // the database afterwards.
    {
      name: 'zamaro-mutations',
      testMatch: 'specs/!(administration)/**/*.mutation.spec.ts',
      testIgnore: 'specs/*/admin/**',
      dependencies: ['zamaro', 'admin-mutations'],
      teardown: 'reseed',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reseed',
      testMatch: 'fixtures/reseed.teardown.ts',
    },
  ],
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
