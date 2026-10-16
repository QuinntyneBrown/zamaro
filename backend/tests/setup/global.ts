import type { TestProject } from 'vitest/node';
import { buildApi, startApi } from '../support/api-process';

declare module 'vitest' {
  export interface ProvidedContext {
    apiUrl: string;
    apiLogFile: string;
  }
}

// One built API for the run, on the test database and Redis keys (ADR-0027). Tests that need an
// API with a different environment start their own with startApi().
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  buildApi();
  const api = await startApi();
  project.provide('apiUrl', api.url);
  project.provide('apiLogFile', api.logFile);
  return api.stop;
}
