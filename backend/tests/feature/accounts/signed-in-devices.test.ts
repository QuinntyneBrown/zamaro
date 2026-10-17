import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { Browser, freshBooker, NAOMI } from '../../support/accounts';
import { resetClock, travel } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const LIST = { method: 'get', path: '/account/sessions' };
const END = { method: 'delete', path: '/account/sessions/{session}' };

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const FIREFOX_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15.6; rv:143.0) Gecko/20100101 Firefox/143.0';

interface SessionItem {
  id: string;
  deviceLabel: string;
  approximateCity: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

/**
 * L2-025.3 (accounts/manage-account-settings): each signed-in session shows its device, approximate
 * city and last-active time, and any can be ended at once. L2-074.2: another person's session is a
 * 404. Raw session IDs and full IP addresses are never returned.
 */
describe('signed-in devices', () => {
  let email: string;

  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    email = await freshBooker();
  });

  it('lists this device first, then the others most recent first', async () => {
    await signInFrom(FIREFOX_MAC, '10.0.0.7');
    travel({ minutes: 60 });
    await signInFrom(SAFARI_IPHONE, '192.168.1.20');
    travel({ minutes: 60 });
    const here = await signInFrom(CHROME_WINDOWS, '127.0.0.1');

    const response = await here.json('/api/v1/account/sessions', 'GET');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const text = await response.clone().text();
    const body = (await response.json()) as { data: SessionItem[] };
    expectContract(response, LIST, body);
    expect(body.data.map((session) => session.deviceLabel)).toEqual([
      'Chrome on Windows',
      'Safari on iPhone',
      'Firefox on Mac',
    ]);
    expect(body.data.map((session) => session.isCurrent)).toEqual([true, false, false]);
    expect(body.data.map((session) => session.approximateCity)).toEqual([
      'Burlington, ON',
      'Burlington, ON',
      'Hamilton, ON',
    ]);
    expect(new Date(body.data[1]?.lastActiveAt ?? 0).toISOString()).toBe(
      '2026-10-09T15:00:00.000Z',
    );
    expect(text).not.toContain(here.cookie('zamaro_session') ?? 'the session id');
    for (const ip of ['127.0.0.1', '192.168.1.20', '10.0.0.7']) expect(text).not.toContain(ip);
  });

  it('gives an address the locator does not know no city', async () => {
    const here = await signInFrom(CHROME_WINDOWS, '203.0.113.5');

    const body = (await (await here.json('/api/v1/account/sessions', 'GET')).json()) as {
      data: SessionItem[];
    };

    expect(body.data[0]?.approximateCity).toBeNull();
  });

  it('signs a device out at once when its session is ended', async () => {
    const phone = await signInFrom(SAFARI_IPHONE, '192.168.1.20');
    const here = await signInFrom(CHROME_WINDOWS, '127.0.0.1');
    const other = (await sessions(here)).find((session) => !session.isCurrent);

    const response = await here.json(`/api/v1/account/sessions/${other?.id ?? ''}`, 'DELETE');

    expect(response.status).toBe(204);
    expectContract(response, END, null);
    expect((await phone.json('/api/v1/me', 'GET')).status).toBe(401);
    expect((await here.json('/api/v1/me', 'GET')).status).toBe(200);
    expect(await sessions(here)).toHaveLength(1);
  });

  it("gives another person's session a 404 and leaves it working", async () => {
    const theirs = await signInFrom(SAFARI_IPHONE, '192.168.1.20', NAOMI);
    const theirId = (await sessions(theirs)).find((session) => session.isCurrent)?.id ?? '';
    const here = await signInFrom(CHROME_WINDOWS, '127.0.0.1');

    const response = await here.json(`/api/v1/account/sessions/${theirId}`, 'DELETE');

    expect(response.status).toBe(404);
    expect(((await response.json()) as { type: string }).type).toBe(
      `${config().problemsBaseUri}/not-found`,
    );
    expect((await theirs.json('/api/v1/me', 'GET')).status).toBe(200);
    expect((await here.json('/api/v1/account/sessions/not-a-session', 'DELETE')).status).toBe(404);
  });

  it('records activity at most every 5 minutes', async () => {
    const here = await signInFrom(CHROME_WINDOWS, '127.0.0.1');

    travel({ minutes: 4 });
    expect((await here.json('/api/v1/me', 'GET')).status).toBe(200);
    expect(await lastActive()).toBe('2026-10-09T14:00:00.000Z');

    travel({ minutes: 2 });
    expect((await here.json('/api/v1/me', 'GET')).status).toBe(200);
    expect(await lastActive()).toBe('2026-10-09T14:06:00.000Z');
  });

  it('does not list a session idle past its lifetime', async () => {
    await signInFrom(FIREFOX_MAC, '10.0.0.7');
    travel({ minutes: config().sessionLifetimeMinutes + 1 });
    const here = await signInFrom(CHROME_WINDOWS, '127.0.0.1');

    expect((await sessions(here)).map((session) => session.deviceLabel)).toEqual([
      'Chrome on Windows',
    ]);
  });

  it('names devices by browser and system', async () => {
    const agents: [string, string][] = [
      [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
        'Edge on Windows',
      ],
      [
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
        'Chrome on Android',
      ],
      [
        'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
        'Safari on iPad',
      ],
      [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
        'Safari on Mac',
      ],
      [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
        'Chrome on Linux',
      ],
      ['curl/8.5.0', 'Unknown device'],
    ];

    for (const [agent, label] of agents) {
      const here = await signInFrom(agent, '127.0.0.1');
      expect((await sessions(here))[0]?.deviceLabel, agent).toBe(label);
    }
  });

  it('gives a guest 401', async () => {
    expect((await new Browser().json('/api/v1/account/sessions', 'GET')).status).toBe(401);
  });

  /** A browser with this user agent and address, signed in. */
  async function signInFrom(agent: string, ip: string, as: string = email): Promise<Browser> {
    const browser = new Browser();
    browser.userAgent = agent;
    browser.address = ip;
    expect((await browser.signIn(as)).status).toBe(200);
    return browser;
  }

  async function sessions(browser: Browser): Promise<SessionItem[]> {
    const response = await browser.json('/api/v1/account/sessions', 'GET');
    expect(response.status).toBe(200);
    return ((await response.json()) as { data: SessionItem[] }).data;
  }

  async function lastActive(): Promise<string> {
    const [row] = await query<{ last_active_at: string }>(
      sql`select s.last_active_at from user_sessions s join users u on u.id = s.user_id where u.email = ${email}`,
    );
    return new Date(row?.last_active_at ?? 0).toISOString();
  }
});
