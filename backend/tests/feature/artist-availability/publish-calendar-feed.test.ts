import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api } from '../../support/app';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const FEED = { method: 'get', path: '/artist/calendar-feed' };
const ENABLE = { method: 'post', path: '/artist/calendar-feed' };
const REGENERATE = { method: 'post', path: '/artist/calendar-feed/regeneration' };

interface FeedBody {
  data: { url: string; enabledAt: string; regeneratedAt: string | null };
}

/**
 * L2-058 (publish-calendar-feed): an artist turns on a secret iCalendar link listing her Confirmed
 * bookings; making a new link retires the old one at once. Artists only (L2-074).
 */
describe('publishing a calendar feed', () => {
  let abigail: Browser;

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    abigail = await signedIn(ABIGAIL);
  });

  afterAll(() => closeDatabase());

  it('has no feed until the artist turns it on', async () => {
    const response = await abigail.json('/api/v1/artist/calendar-feed', 'GET');

    expect(response.status).toBe(404);
  });

  it('turning it on gives a secret link, and turning it on again gives the same link (L2-058.1)', async () => {
    const first = await abigail.json('/api/v1/artist/calendar-feed', 'POST');
    expect(first.status).toBe(201);
    await expectContract(first, ENABLE, undefined);
    const feed = ((await first.json()) as FeedBody).data;

    expect(feed.url).toMatch(/^https?:\/\/.+\/api\/v1\/calendar-feeds\/[A-Za-z0-9_-]{43}\.ics$/);
    expect(feed.enabledAt).toBe('2026-10-09T14:00:00.000Z');
    expect(feed.regeneratedAt).toBeNull();
    expect(first.headers.get('cache-control')).toBe('private, no-store');

    const again = await abigail.json('/api/v1/artist/calendar-feed', 'POST');
    expect(again.status).toBe(200);
    expect(((await again.json()) as FeedBody).data.url).toBe(feed.url);

    const shown = await abigail.json('/api/v1/artist/calendar-feed', 'GET');
    expect(shown.status).toBe(200);
    await expectContract(shown, FEED, undefined);
    expect(((await shown.json()) as FeedBody).data.url).toBe(feed.url);
  });

  it('the link lists her Confirmed and Completed bookings as calendar events, without a session (L2-058.1)', async () => {
    const url = await enabled(abigail);

    const response = await api(feedPath(url));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
    const ics = await response.text();
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:America/Toronto');
    expect(ics).toContain('UID:ZAM-0108@zamaro.ca');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261115');
    expect(ics).toContain('SUMMARY:Sunday service · Lakeshore Alliance Church');
    expect(ics).toContain('LOCATION:Lakeshore Alliance Church\\, Oakville');
    const events = ics.match(/BEGIN:VEVENT/g) ?? [];
    // Six Confirmed (ZAM-0101, 0104, 0108, 0110, 0116, 0118) and the four Completed since ZAM-0052;
    // the Requested ones and the earlier reviewed bookings before her approval are not events.
    expect(events.length).toBeGreaterThanOrEqual(10);
    expect(ics).not.toContain('ZAM-0114@');
    expect(ics).not.toContain('ZAM-0120@');
    expect(ics).toContain('UID:ZAM-0089@zamaro.ca');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('a new link works at once and the old one answers 404 (L2-058.2)', async () => {
    const old = await enabled(abigail);

    const response = await abigail.json('/api/v1/artist/calendar-feed/regeneration', 'POST');

    expect(response.status).toBe(200);
    await expectContract(response, REGENERATE, undefined);
    const feed = ((await response.json()) as FeedBody).data;
    expect(feed.url).not.toBe(old);
    expect(feed.regeneratedAt).toBe('2026-10-09T14:00:00.000Z');
    expect((await api(feedPath(old))).status).toBe(404);
    expect((await api(feedPath(feed.url))).status).toBe(200);
    expect(
      (
        (await abigail.json('/api/v1/artist/calendar-feed', 'GET')).json() as Promise<FeedBody>
      ).then((b) => b.data.url),
    ).resolves.toBe(feed.url);
  });

  it('an unknown or malformed token answers 404', async () => {
    expect((await api('/api/v1/calendar-feeds/not-a-token.ics')).status).toBe(404);
    expect((await api(`/api/v1/calendar-feeds/${'a'.repeat(43)}.ics`)).status).toBe(404);
  });

  it('a church account has no feed to manage (L2-074)', async () => {
    const naomi = await signedIn(NAOMI);

    expect((await naomi.json('/api/v1/artist/calendar-feed', 'GET')).status).toBe(404);
    expect((await naomi.json('/api/v1/artist/calendar-feed', 'POST')).status).toBe(404);
    expect((await naomi.json('/api/v1/artist/calendar-feed/regeneration', 'POST')).status).toBe(
      404,
    );
  });
});

async function enabled(artist: Browser): Promise<string> {
  const response = await artist.json('/api/v1/artist/calendar-feed', 'POST');
  return ((await response.json()) as FeedBody).data.url;
}

function feedPath(url: string): string {
  return new URL(url).pathname;
}
