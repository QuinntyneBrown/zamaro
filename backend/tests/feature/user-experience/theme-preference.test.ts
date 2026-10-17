import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Browser, NAOMI, signedIn, TOMI } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const PREFERENCES = { method: 'patch', path: '/me/preferences' };

/**
 * L2-104.2 (user-experience/switch-theme): a signed-in person's theme is saved to their account and
 * read back through `/me`, so every device they sign in on follows the latest choice.
 */
describe('the theme preference', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('gives an account no theme until one is chosen', async () => {
    const naomi = await signedIn(NAOMI);

    const me = (await (await naomi.json('/api/v1/me', 'GET')).json()) as {
      data: { themePreference: string | null };
    };

    expect(me.data.themePreference).toBeNull();
  });

  it('saves dark to the account and reads it back through me', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/me/preferences', 'PATCH', {
      themePreference: 'dark',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { themePreference: string; email: string } };
    expect(body.data.themePreference).toBe('dark');
    expect(body.data.email).toBe(NAOMI);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, PREFERENCES, body);
    expect(await storedTheme()).toBe('dark');
    const me = (await (await naomi.json('/api/v1/me', 'GET')).json()) as {
      data: { themePreference: string | null };
    };
    expect(me.data.themePreference).toBe('dark');
  });

  it('lets light replace dark, and null follow the device again', async () => {
    const naomi = await signedIn(NAOMI);
    expect(
      (await naomi.json('/api/v1/me/preferences', 'PATCH', { themePreference: 'dark' })).status,
    ).toBe(200);

    const light = await naomi.json('/api/v1/me/preferences', 'PATCH', { themePreference: 'light' });
    expect(light.status).toBe(200);
    expect(
      ((await light.json()) as { data: { themePreference: string } }).data.themePreference,
    ).toBe('light');
    const none = await naomi.json('/api/v1/me/preferences', 'PATCH', { themePreference: null });
    expect(none.status).toBe(200);
    expect(
      ((await none.json()) as { data: { themePreference: null } }).data.themePreference,
    ).toBeNull();

    expect(await storedTheme()).toBeNull();
  });

  it('refuses a theme that is not light or dark', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/me/preferences', 'PATCH', {
      themePreference: 'blue',
    });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: object };
    expect(body.errors).toHaveProperty('themePreference');
    expectContract(response, PREFERENCES, body);
    expect(await storedTheme()).toBeNull();
  });

  it('lets a booker who must accept new terms still save a theme', async () => {
    const tomi = await signedIn(TOMI);
    expect((await tomi.json('/api/v1/account/church', 'GET')).status).toBe(409);

    const response = await tomi.json('/api/v1/me/preferences', 'PATCH', {
      themePreference: 'dark',
    });

    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { data: { themePreference: string } }).data.themePreference,
    ).toBe('dark');
  });

  it('gives a guest no preferences to save', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    expect(
      (await guest.json('/api/v1/me/preferences', 'PATCH', { themePreference: 'dark' })).status,
    ).toBe(401);
  });

  async function storedTheme(): Promise<string | null> {
    const [row] = await query<{ theme_preference: string | null }>(
      sql`select theme_preference::text as theme_preference from users where email = ${NAOMI}`,
    );
    return row?.theme_preference ?? null;
  }
});
