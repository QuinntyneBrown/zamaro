import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 4000;
const STUB_API_PORT = 8001;

// Chromium only (AGENTS.md). One Playwright project per application; the admin
// project is added with the admin slice.
export default defineConfig({
  testDir: ".",
  testMatch: [
    "specs/**/*.spec.ts",
    "visual/**/*.spec.ts",
    "a11y/**/*.spec.ts",
    "perf/**/*.spec.ts",
  ],
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: "en-CA",
    timezoneId: "America/Toronto",
    trace: "on-first-retry",
  },
  projects: [{ name: "zamaro", use: { ...devices["Desktop Chrome"] } }],
  // The backend is mocked (AGENTS.md): the stub API stands in for it, and the SSR server reaches it
  // through API_ORIGIN for its own fetches and for the browser's proxied /api calls.
  webServer: [
    {
      command: "node fixtures/stub-api/server.mjs",
      url: `http://localhost:${STUB_API_PORT}/api/v1/i18n/en`,
      reuseExistingServer: !process.env["CI"],
      env: { STUB_API_PORT: String(STUB_API_PORT) },
    },
    {
      command: "node ../frontend/dist/zamaro/server/server.mjs",
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env["CI"],
      env: {
        PORT: String(WEB_PORT),
        API_ORIGIN: `http://localhost:${STUB_API_PORT}`,
      },
    },
  ],
});
