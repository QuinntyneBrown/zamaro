import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'vitest';

/**
 * The environment every test file runs with (ADR-0028): the test environment, the mocks' frozen clock,
 * the suite's own field key, the cast password, a storage root of its own and connection strings no
 * test opens. A test that needs a different setting changes `process.env` and calls `reloadConfig()`.
 */
const storageRoot = mkdtempSync(join(tmpdir(), 'zamaro-test-'));

Object.assign(process.env, {
  NODE_ENV: 'test',
  ZAMARO_ENV: 'test',
  ZAMARO_DEBUG: '',
  APP_URL: 'http://localhost:8000',
  APP_RELEASE: 'test-release',
  DATABASE_URL: 'postgres://zamaro:zamaro@localhost:1/zamaro_test',
  REDIS_URL: 'redis://localhost:1/0',
  REDIS_CACHE_URL: '',
  REDIS_QUEUE_URL: '',
  REDIS_PREFIX: 'zamaro-test-',
  ZAMARO_WEB_ORIGINS: 'http://localhost:4200',
  ZAMARO_WEB_URL: 'http://localhost:4200',
  ZAMARO_FROZEN_NOW: '2026-10-09T10:00:00-04:00',
  ZAMARO_STORAGE_ROOT: storageRoot,
  ZAMARO_CAST_PASSWORD: 'hosanna-in-the-highest',
  ZAMARO_I18N_PATH: 'resources/i18n',
  ZAMARO_FEATURE_BOOKING_REQUESTS: '',
  FIELD_ENCRYPTION_KEY_VERSION: 'v1',
  FIELD_ENCRYPTION_KEY: 'base64:dGVzdC1maWVsZC1rZXktZm9yLXphbWFyby1zdWl0ZSE=',
  FIELD_ENCRYPTION_PREVIOUS_KEYS: '',
});

afterAll(() => {
  rmSync(storageRoot, { recursive: true, force: true });
});
