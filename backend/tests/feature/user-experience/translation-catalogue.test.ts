import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { reloadConfig } from '@config/zamaro';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';

const CATALOGUE = { method: 'get', path: '/i18n/{locale}' };

/**
 * L2-111.2: a new locale needs a catalogue, not a code change. The catalogue is cacheable (ETag / 304).
 */
describe('the translation catalogue', () => {
  afterEach(() => {
    process.env.ZAMARO_I18N_PATH = 'resources/i18n';
    reloadConfig();
  });

  it('serves the english catalogue with a strong etag', async () => {
    const response = await api('/api/v1/i18n/en');

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { locale: string; messages: Record<string, string> };
    };
    expect(body.data.locale).toBe('en');
    expect(body.data.messages['common.nav.discover']).toBe('Discover');
    expect(response.headers.get('etag')).toMatch(/^"[a-f0-9]{64}"$/);
    expect(response.headers.get('cache-control')).toContain('public');
    expectContract(response, CATALOGUE, body);
  });

  it('answers a matching if-none-match with 304 and no body', async () => {
    const etag = (await api('/api/v1/i18n/en')).headers.get('etag') ?? '';

    const response = await api('/api/v1/i18n/en', { headers: { 'If-None-Match': etag } });

    expect(response.status).toBe(304);
    expect(await response.text()).toBe('');
  });

  it('falls back to english per key for a partial french catalogue', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zamaro-i18n-'));
    mkdirSync(join(dir, 'en'));
    mkdirSync(join(dir, 'fr'));
    writeFileSync(
      join(dir, 'en', 'common.json'),
      JSON.stringify({ 'nav.discover': 'Discover', 'nav.how': 'How booking works' }),
    );
    writeFileSync(join(dir, 'fr', 'common.json'), JSON.stringify({ 'nav.discover': 'Découvrir' }));
    process.env.ZAMARO_I18N_PATH = dir;
    reloadConfig();
    try {
      const response = await api('/api/v1/i18n/fr');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: {
          locale: 'fr',
          messages: { 'common.nav.discover': 'Découvrir', 'common.nav.how': 'How booking works' },
        },
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('answers a locale without a catalogue with a 404 problem', async () => {
    const response = await api('/api/v1/i18n/xx');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    expectContract(response, CATALOGUE, await response.json());
  });
});
