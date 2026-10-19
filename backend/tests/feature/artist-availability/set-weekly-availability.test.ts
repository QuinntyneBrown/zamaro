import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { availabilityOverrides, bookings } from '@/server/db/schema';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup, lineupNames } from '../../support/discovery';

const WEEKLY = { method: 'put', path: '/artist/availability/weekly' };
const MONDAY = '2026-11-16';
const TUESDAY = '2026-11-17';

/**
 * L2-056.2, L2-056.3, L2-075 (manage-availability-calendar): the weekly default replaces the
 * artist's unavailable weekdays; every future matching date is unavailable unless a dated override
 * says Free, and a search for such a date leaves the artist out at once.
 */
describe('setting the weekly default', () => {
  let abigail: Browser;

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    abigail = await signedIn(ABIGAIL);
  });

  afterAll(() => closeDatabase());

  it('replaces Abigail’s Mondays with Tuesdays and answers the new default', async () => {
    const response = await save(abigail, [2]);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { unavailableWeekdays: number[] } };
    expectContract(response, WEEKLY, body);
    expect(body.data.unavailableWeekdays).toEqual([2]);
    const november = await month(abigail, '2026-11');
    expect(november.get('2026-11-02')).toBe('free');
    expect(november.get('2026-11-03')).toBe('unavailable');
  });

  it('leaves her out of a search for a Tuesday and back in for a Monday (L2-056.3)', async () => {
    await save(abigail, [2]);

    expect(lineupNames(await lineup({ date: TUESDAY }))).not.toContain('Abigail Mensah');
    expect(lineupNames(await lineup({ date: MONDAY }))).toContain('Abigail Mensah');
  });

  it('keeps a date she has overridden Free open (L2-056.2)', async () => {
    await db()
      .insert(availabilityOverrides)
      .values({ artistId: await artistId('abigail-mensah'), date: '2026-11-24', state: 'free' });
    await save(abigail, [2]);

    expect((await month(abigail, '2026-11')).get('2026-11-24')).toBe('free');
    expect(lineupNames(await lineup({ date: '2026-11-24' }))).toContain('Abigail Mensah');
  });

  it('clears the default with none (L2-056.4)', async () => {
    const response = await save(abigail, []);

    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { unavailableWeekdays: number[] } }).data).toEqual({
      unavailableWeekdays: [],
    });
    expect((await month(abigail, '2026-11')).get('2026-11-16')).toBe('free');
  });

  it('never declines an open request the new default covers: it stays Requested', async () => {
    await save(abigail, [7]);

    const [request] = await db()
      .select({ status: bookings.status })
      .from(bookings)
      .where(eq(bookings.number, 'ZAM-0120'));
    expect(request?.status).toBe('requested');
    expect((await month(abigail, '2026-11')).get('2026-11-22')).toBe('unavailable');
  });

  it('refuses weekdays that are not 1 to 7, repeated or not a list', async () => {
    for (const unavailableWeekdays of [[0], [8], [1, 1], ['mon'], [1.5], 3, null]) {
      const response = await abigail.json('/api/v1/artist/availability/weekly', 'PUT', {
        unavailableWeekdays,
      });

      expect(response.status, JSON.stringify(unavailableWeekdays)).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(Object.keys(body.errors)).toEqual(['unavailableWeekdays']);
    }
  });

  it('is for artists only: a booker gets the unknown-address 404 (L2-074)', async () => {
    expect((await save(await signedIn(NAOMI), [1])).status).toBe(404);
  });
});

function save(browser: Browser, unavailableWeekdays: number[]): Promise<Response> {
  return browser.json('/api/v1/artist/availability/weekly', 'PUT', { unavailableWeekdays });
}

/** The statuses of a month, by date. */
async function month(browser: Browser, value: string): Promise<Map<string, string>> {
  const response = await browser.json(`/api/v1/artist/calendar?month=${value}`, 'GET');
  const body = (await response.json()) as { data: { days: { date: string; status: string }[] } };
  return new Map(body.data.days.map((day) => [day.date, day.status]));
}
