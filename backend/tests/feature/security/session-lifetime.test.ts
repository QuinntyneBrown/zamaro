import { DateTime } from 'luxon';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config, reloadConfig } from '@config/zamaro';
import { ABIGAIL, Browser, NAOMI } from '../../support/accounts';
import { closeDatabase, freshDatabase } from '../../support/database';

/** 10:00 in Toronto, in UTC so that a day is 24 hours across the clocks going back on 1 Nov. */
const SIGNED_IN_AT = DateTime.fromISO('2026-10-09T14:00:00Z', { zone: 'utc' });

/**
 * L2-073.3: a booker's or artist's session ends after 7 days without a request, or 30 days after
 * signing in however active it is, and the person must sign in again (manage-sessions-and-csrf).
 */
describe('the session lifetime', () => {
  let browser: Browser;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    travelTo(SIGNED_IN_AT);
    await freshDatabase();
    browser = new Browser();
  });

  it('keeps a session used within 7 days signed in', async () => {
    await signInAs(NAOMI);

    travelTo(SIGNED_IN_AT.plus({ days: 7 }).minus({ minutes: 1 }));

    expect((await me()).status).toBe(200);
  });

  it('ends a session idle for 7 days', async () => {
    await signInAs(NAOMI);

    travelTo(SIGNED_IN_AT.plus({ days: 7, minutes: 1 }));

    expect((await me()).status).toBe(401);
  });

  it('ends a session used every 6 days 30 days after sign-in', async () => {
    await signInAs(ABIGAIL);
    await useItEvery6Days();

    travelTo(SIGNED_IN_AT.plus({ days: 30 }));

    const response = await me();
    expect(response.status).toBe(401);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/unauthenticated`,
    );
    travelTo(SIGNED_IN_AT.plus({ days: 30, minutes: 1 }));
    expect((await me()).status).toBe(401);
  });

  it('still works a minute before the 30-day limit', async () => {
    await signInAs(NAOMI);
    await useItEvery6Days();

    travelTo(SIGNED_IN_AT.plus({ days: 30 }).minus({ minutes: 1 }));

    expect((await me()).status).toBe(200);
  });

  it('answers 401 once on an anonymous route at the 30-day limit, then as a guest', async () => {
    await signInAs(NAOMI);
    await useItEvery6Days();
    travelTo(SIGNED_IN_AT.plus({ days: 30 }));

    expect((await browser.json('/api/v1/features', 'GET')).status).toBe(401);
    expect((await browser.json('/api/v1/features', 'GET')).status).toBe(200);
  });

  async function signInAs(email: string): Promise<void> {
    const response = await browser.signIn(email);
    expect(response.status).toBe(200);
  }

  async function useItEvery6Days(): Promise<void> {
    for (const day of [6, 12, 18, 24]) {
      travelTo(SIGNED_IN_AT.plus({ days: day }));
      expect((await me()).status, `day ${String(day)}`).toBe(200);
    }
  }

  /** `/me` with the cookies the browser holds; a new session cookie in the answer replaces the old one. */
  function me(): Promise<Response> {
    return browser.json('/api/v1/me', 'GET');
  }
});

function travelTo(at: DateTime): void {
  process.env.ZAMARO_FROZEN_NOW = at.toISO() ?? '';
  reloadConfig();
}
