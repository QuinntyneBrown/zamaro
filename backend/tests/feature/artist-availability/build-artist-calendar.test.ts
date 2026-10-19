import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists, availabilityOverrides, bookings } from '@/server/db/schema';
import { ABIGAIL, Browser, MIRIAM, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';

const CALENDAR = { method: 'get', path: '/artist/calendar' };

interface Day {
  date: string;
  status: 'free' | 'unavailable' | 'requested' | 'booked';
  requestCount: number;
  editable: boolean;
  church: string | null;
  kind: string | null;
  city: string | null;
  cause: 'weekly-default' | 'chosen' | null;
  note: string | null;
}

interface CalendarBody {
  data: { month: string; days: Day[] };
  meta: { window: { from: string; to: string } };
}

/**
 * L2-056.1, L2-056.2, L2-056.4, L2-057.1, L2-057.3, L2-074 (manage-availability-calendar): the
 * artist's own calendar, one month at a time inside the 18-month window, each day Booked,
 * Unavailable, Requested (with a count) or Free, derived on read.
 */
describe('reading the artist calendar', () => {
  let abigail: Browser;

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    abigail = await signedIn(ABIGAIL);
  });

  afterAll(() => closeDatabase());

  it('marks every day of Abigail’s November 2026 with its status', async () => {
    const response = await calendar(abigail, '2026-11');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = (await response.json()) as CalendarBody;
    expectContract(response, CALENDAR, body);
    expect(body.data.month).toBe('2026-11');
    expect(body.data.days).toHaveLength(30);
    expect(day(body, '2026-11-01')).toMatchObject({ status: 'booked', editable: false });
    expect(day(body, '2026-11-03')).toMatchObject({
      status: 'free',
      requestCount: 0,
      editable: true,
      church: null,
    });
    expect(day(body, '2026-11-14')).toMatchObject({
      status: 'requested',
      requestCount: 1,
      editable: true,
      church: 'Riverside Community Church',
    });
    expect(day(body, '2026-11-15')).toMatchObject({
      status: 'booked',
      editable: false,
      church: 'Lakeshore Alliance Church',
      kind: 'sunday-service',
      city: 'Oakville',
    });
    expect(day(body, '2026-11-14')).toMatchObject({ kind: 'worship-night', city: 'Burlington' });
    expect(day(body, '2026-11-22')).toMatchObject({
      status: 'requested',
      requestCount: 1,
      church: 'St. Brendan�s Anglican',
      kind: 'sunday-service',
      city: 'Oshawa',
    });
    expect(day(body, '2026-11-26')).toMatchObject({
      status: 'unavailable',
      editable: true,
      cause: 'chosen',
      note: 'Studio',
    });
    expect(day(body, '2026-11-02')).toMatchObject({
      status: 'unavailable',
      cause: 'weekly-default',
      note: null,
    });
    expect(day(body, '2026-11-27').status).toBe('unavailable');
  });

  it('answers the window and, without a month, the current one', async () => {
    const body = (await (await calendar(abigail)).json()) as CalendarBody;

    expect(body.data.month).toBe('2026-10');
    expect(body.meta.window).toEqual({ from: '2026-10', to: '2028-04' });
  });

  it('shows every date Free for an artist who has set nothing (L2-056.4)', async () => {
    const miriam = await signedIn(MIRIAM);

    const body = (await (await calendar(miriam, '2026-11')).json()) as CalendarBody;

    expect(body.data.days.every((d) => d.status === 'free' && d.requestCount === 0)).toBe(true);
  });

  it('greys the weekdays of Abigail�s Monday default unless a date is overridden Free (L2-056.2)', async () => {
    await db()
      .insert(availabilityOverrides)
      .values({ artistId: await abigailsId(), date: '2026-11-09', state: 'free' });

    const body = (await (await calendar(abigail, '2026-11')).json()) as CalendarBody;

    expect(day(body, '2026-11-02').status).toBe('unavailable');
    expect(day(body, '2026-11-09').status).toBe('free');
    expect(day(body, '2026-11-16').status).toBe('unavailable');
  });

  it('keeps a Confirmed date Booked even when it is marked unavailable (L2-057.1)', async () => {
    await db()
      .insert(availabilityOverrides)
      .values({ artistId: await abigailsId(), date: '2026-11-15', state: 'unavailable' });

    const body = (await (await calendar(abigail, '2026-11')).json()) as CalendarBody;

    expect(day(body, '2026-11-15')).toMatchObject({ status: 'booked', editable: false });
  });

  it('returns a Cancelled booking’s date to Free (L2-057.3)', async () => {
    await db().update(bookings).set({ status: 'cancelled' }).where(eq(bookings.number, 'ZAM-0114'));

    const body = (await (await calendar(abigail, '2026-11')).json()) as CalendarBody;

    expect(day(body, '2026-11-14')).toMatchObject({ status: 'free', requestCount: 0 });
  });

  it('refuses a month outside the calendar window or not a month', async () => {
    for (const month of ['2026-09', '2028-05', '2026-13', 'november']) {
      const response = await calendar(abigail, month);

      expect(response.status, month).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(Object.keys(body.errors)).toEqual(['month']);
    }
  });

  it('is for artists only: a booker gets the unknown-address 404 (L2-074)', async () => {
    const naomi = await signedIn(NAOMI);

    expect((await calendar(naomi, '2026-11')).status).toBe(404);
  });
});

function calendar(browser: Browser, month?: string): Promise<Response> {
  const query = month === undefined ? '' : `?month=${month}`;
  return browser.json(`/api/v1/artist/calendar${query}`, 'GET');
}

function day(body: CalendarBody, date: string): Day {
  const found = body.data.days.find((d) => d.date === date);
  if (found === undefined) throw new Error(`No ${date} in the month.`);
  return found;
}

async function abigailsId(): Promise<number> {
  const [artist] = await db()
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.slug, 'abigail-mensah'));
  if (artist === undefined) throw new Error('Abigail is not seeded.');
  return artist.id;
}
