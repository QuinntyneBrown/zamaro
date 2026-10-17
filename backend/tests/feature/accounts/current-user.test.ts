import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const ME = { method: 'get', path: '/me' };

/**
 * GET /api/v1/me: the signed-in person as the app needs them (current-user names, ADR-0016).
 * L2-089.3: personal data is private and never stored by a cache.
 */
describe('the current user', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  it('gives Naomi, signed in, her name, initials, roles and preferences', async () => {
    const browser = await signedIn(NAOMI);

    const response = await browser.json('/api/v1/me', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      name: 'Naomi Fraser',
      email: NAOMI,
      initials: 'NF',
      roles: ['booker'],
      emailVerified: true,
      themePreference: null,
      termsAcceptanceRequired: false,
    });
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, ME, body);
  });

  it('knows Abigail is an artist', async () => {
    const browser = await signedIn(ABIGAIL);

    const body = (await (await browser.json('/api/v1/me', 'GET')).json()) as {
      data: Record<string, unknown>;
    };

    expect(body.data.initials).toBe('AM');
    expect(body.data.roles).toEqual(['artist']);
  });

  it('gives a guest a 401 problem', async () => {
    const response = await new Browser().json('/api/v1/me', 'GET');

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as { type: string; status: number };
    expect(body.type).toBe(`${config().problemsBaseUri}/unauthenticated`);
    expect(body.status).toBe(401);
    expectContract(response, ME, body);
  });

  it('gives a guest without an accept header the same 401 problem', async () => {
    const response = await api('/api/v1/me');

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
  });
});
