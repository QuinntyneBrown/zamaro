import type { TestProject } from 'vitest/node';
import { buildApi, startApi, testEnvironment } from '../support/api-process';
import { cli } from '../support/cli';

declare module 'vitest' {
  export interface ProvidedContext {
    apiUrl: string;
    apiLogFile: string;
    databaseUrl: string;
  }
}

// One fresh, seeded test database and one built API for the run (ADR-0027). Tests that need an API
// with a different environment start their own with startApi().
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  // ZAMARO_TEST_SKIP_RESET=1 reuses the database as the last run left it, for quick reruns.
  if (!process.env.ZAMARO_TEST_SKIP_RESET) {
    const reset = cli('db-reset');
    if (reset.status !== 0) throw new Error(`db:reset failed:\n${reset.stderr}`);
  }
  buildApi();
  const api = await startApi();
  project.provide('apiUrl', api.url);
  project.provide('apiLogFile', api.logFile);
  project.provide('databaseUrl', testEnvironment().DATABASE_URL ?? '');
  return api.stop;
}
