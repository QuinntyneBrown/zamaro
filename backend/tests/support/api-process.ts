import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

export interface ApiProcess {
  url: string;
  logFile: string;
  stop: () => Promise<void>;
}

const backend = new URL('../../', import.meta.url);
const nextCli = fileURLToPath(new URL('node_modules/next/dist/bin/next', backend));

/** The environment the test API runs with: its own database, Redis keys, origins and release. */
export function testEnvironment(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  const databaseUrl = new URL(required('DATABASE_URL'));
  databaseUrl.pathname = '/zamaro_test';
  return {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    ZAMARO_ENV: 'test',
    ZAMARO_DEBUG: '',
    APP_RELEASE: 'test-release',
    DATABASE_URL: databaseUrl.toString(),
    REDIS_URL: required('REDIS_URL'),
    REDIS_CACHE_URL: '',
    REDIS_QUEUE_URL: '',
    REDIS_PREFIX: 'zamaro-test-',
    ZAMARO_WEB_ORIGINS: 'http://localhost:4200',
    ZAMARO_WEB_URL: 'http://localhost:4200',
    ZAMARO_FROZEN_NOW: '2026-10-09T10:00:00-04:00',
    ZAMARO_STORAGE_ROOT: fileURLToPath(new URL('storage/test', backend)),
    ZAMARO_CAST_PASSWORD: 'hosanna-in-the-highest',
    // The suite's own field key (ADR-0020), never a real one.
    FIELD_ENCRYPTION_KEY_VERSION: 'v1',
    FIELD_ENCRYPTION_KEY: 'base64:dGVzdC1maWVsZC1rZXktZm9yLXphbWFyby1zdWl0ZSE=',
    FIELD_ENCRYPTION_PREVIOUS_KEYS: '',
    ...overrides,
  };
}

/** Builds the API once; later starts reuse the build. */
export function buildApi(): void {
  if (process.env.ZAMARO_TEST_SKIP_BUILD) return;
  const result = spawnSync(process.execPath, [nextCli, 'build'], {
    cwd: backend,
    env: testEnvironment(),
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`next build exited with ${String(result.status)}`);
}

/** Starts a built API on a free port with the test environment and the given overrides. */
export async function startApi(
  overrides: Record<string, string> = {},
  name = 'api',
): Promise<ApiProcess> {
  const port = await freePort();
  const env = testEnvironment({ APP_URL: `http://localhost:${String(port)}`, ...overrides });
  mkdirSync(new URL('storage/', backend), { recursive: true });
  const logFile = fileURLToPath(new URL(`storage/test-${name}-${String(port)}.log`, backend));
  const log = createWriteStream(logFile, { flags: 'w' });
  const child: ChildProcess = spawn(
    process.execPath,
    [nextCli, 'start', '--port', String(port), '--hostname', '127.0.0.1'],
    { cwd: backend, env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  child.stdout?.pipe(log, { end: false });
  child.stderr?.pipe(log, { end: false });
  const url = `http://127.0.0.1:${String(port)}`;
  await waitForAnyAnswer(url, child);
  return {
    url,
    logFile,
    stop: async () => {
      if (process.platform === 'win32' && child.pid !== undefined) {
        spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
      await sleep(200);
      log.end();
    },
  };
}

async function waitForAnyAnswer(url: string, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`the API exited with ${String(child.exitCode)}`);
    try {
      await fetch(`${url}/health/live`);
      return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error('the API did not answer within 60 s');
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => {
        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to run the backend tests`);
  return value;
}
