import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { availabilityOverrides, bookings, bookingTransitions } from '@/server/db/schema';
import { ABIGAIL, Browser, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup, lineupNames } from '../../support/discovery';

const DATES = { method: 'put', path: '/artist/availability/dates' };

interface RangeBody {
  data: { changedDates: string[]; skippedDates: string[]; declinedCount: number };
}

interface ConflictBody {
  status: number;
  detail: string;
  affectedRequests: { booking: string; date: string; church: string }[];
}

/**
 * L2-056.3, L2-057.1, L2-057.2, L2-075 (manage-availability-calendar): a range marked unavailable
 * or free is saved at once; marking dates with open requests warns first (409) and, once confirmed,
 * declines those requests; Confirmed dates never change.
 */
describe('setting availability for a range of dates', () => {
  let abigail: Browser;

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
    abigail = await signedIn(ABIGAIL);
  });

  afterAll(() => closeDatabase());

  it('saves a range nobody has asked about and leaves her out of a search (L2-056.3)', async () => {
    const response = await save(abigail, { from: '2026-11-18', to: '2026-11-19' });

    expect(response.status).toBe(200);
    const body = (await response.json()) as RangeBody;
    expectContract(response, DATES, body);
    expect(body.data).toEqual({
      changedDates: ['2026-11-18', '2026-11-19'],
      skippedDates: [],
      declinedCount: 0,
    });
    expect(lineupNames(await lineup({ date: '2026-11-18' }))).not.toContain('Abigail Mensah');
  });

  it('warns with the churches that asked and writes nothing until she confirms (L2-057.2)', async () => {
    const response = await save(abigail, { from: '2026-11-20', to: '2026-11-22' });

    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    const body = (await response.json()) as ConflictBody;
    expect(body.detail).toBe(
      '1 church has asked about these dates. They’ll be told you’re not available.',
    );
    expect(body.affectedRequests).toEqual([
      { booking: 'ZAM-0120', date: '2026-11-22', church: 'St. Brendan�s Anglican' },
    ]);
    expect(await overrideDates()).not.toContain('2026-11-20');
    expect(await statusOf('ZAM-0120')).toBe('requested');
  });

  it('on confirmation writes the overrides, skips the Booked day and declines the request', async () => {
    const response = await save(abigail, {
      from: '2026-11-20',
      to: '2026-11-22',
      confirm: true,
      note: 'Family visit',
    });

    expect(response.status).toBe(200);
    expect(((await response.json()) as RangeBody).data).toEqual({
      changedDates: ['2026-11-20', '2026-11-22'],
      skippedDates: ['2026-11-21'],
      declinedCount: 1,
    });
    expect(await overrideDates()).toEqual(expect.arrayContaining(['2026-11-20', '2026-11-22']));
    expect(await overrideDates()).not.toContain('2026-11-21');
    expect(await statusOf('ZAM-0120')).toBe('declined');
    const [booking] = await db()
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.number, 'ZAM-0120'));
    const transitions = await db()
      .select()
      .from(bookingTransitions)
      .where(eq(bookingTransitions.bookingId, booking?.id ?? 0));
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      fromStatus: 'requested',
      toStatus: 'declined',
      actorKind: 'artist',
      reason: 'I’m not free that day',
    });
    const november = await month(abigail);
    expect(november.get('2026-11-22')).toMatchObject({ status: 'unavailable', requestCount: 0 });
    expect(november.get('2026-11-21')).toMatchObject({ status: 'booked' });
  });

  it('declines an Accepted request the same way', async () => {
    await db().update(bookings).set({ status: 'accepted' }).where(eq(bookings.number, 'ZAM-0120'));

    const refused = await save(abigail, { from: '2026-11-22', to: '2026-11-22' });
    expect(refused.status).toBe(409);
    const confirmed = await save(abigail, { from: '2026-11-22', to: '2026-11-22', confirm: true });

    expect(confirmed.status).toBe(200);
    expect(await statusOf('ZAM-0120')).toBe('declined');
  });

  it('marks dates Free over the weekly default without any warning', async () => {
    const response = await save(abigail, { from: '2026-11-16', to: '2026-11-16', state: 'free' });

    expect(response.status).toBe(200);
    expect((await month(abigail)).get('2026-11-16')?.status).toBe('free');
    expect(lineupNames(await lineup({ date: '2026-11-16' }))).toContain('Abigail Mensah');
  });

  it('replaces an earlier choice for the same date and keeps the note private', async () => {
    await save(abigail, { from: '2026-11-18', to: '2026-11-18', note: 'Dentist' });
    await save(abigail, { from: '2026-11-18', to: '2026-11-18', state: 'free' });

    const rows = await db()
      .select()
      .from(availabilityOverrides)
      .where(eq(availabilityOverrides.date, '2026-11-18'));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe('free');
  });

  it('refuses ranges and notes the form cannot take (L2-075)', async () => {
    const cases: [Record<string, unknown>, string][] = [
      [{ from: '2026-11-19', to: '2026-11-18' }, 'to'],
      [{ from: '2026-10-08', to: '2026-10-10' }, 'from'],
      [{ from: '2028-04-09', to: '2028-04-10' }, 'to'],
      [{ from: '2026-11-18', to: '2026-11-18', state: 'busy' }, 'state'],
      [{ from: '2026-11-18', to: '2026-11-18', note: 'x'.repeat(101) }, 'note'],
      [{ from: 'soon', to: '2026-11-18' }, 'from'],
      [{ to: '2026-11-18' }, 'from'],
    ];
    for (const [input, field] of cases) {
      const response = await abigail.json('/api/v1/artist/availability/dates', 'PUT', {
        state: 'unavailable',
        ...input,
      });

      expect(response.status, JSON.stringify(input)).toBe(422);
      const body = (await response.json()) as { errors: Record<string, string[]> };
      expect(Object.keys(body.errors), JSON.stringify(input)).toEqual([field]);
    }
  });

  it('is for artists only: a booker gets the unknown-address 404 (L2-074)', async () => {
    const response = await save(await signedIn(NAOMI), { from: '2026-11-18', to: '2026-11-18' });

    expect(response.status).toBe(404);
  });

  it('leaves another artist’s requests alone', async () => {
    const before = await db().select().from(bookings);

    await save(abigail, { from: '2026-11-14', to: '2026-12-31', confirm: true });

    const abigailId = await artistId('abigail-mensah');
    const others = (await db().select().from(bookings)).filter((b) => b.artistId !== abigailId);
    expect(others).toEqual(before.filter((b) => b.artistId !== abigailId));
  });
});

function save(browser: Browser, input: Record<string, unknown>): Promise<Response> {
  return browser.json('/api/v1/artist/availability/dates', 'PUT', {
    state: 'unavailable',
    ...input,
  });
}

async function statusOf(number: string): Promise<string | undefined> {
  const [booking] = await db()
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.number, number));
  return booking?.status;
}

async function overrideDates(): Promise<string[]> {
  const rows = await db()
    .select({ date: availabilityOverrides.date })
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.artistId, await artistId('abigail-mensah')));
  return rows.map((row) => row.date);
}

async function month(
  browser: Browser,
): Promise<Map<string, { status: string; requestCount: number }>> {
  const response = await browser.json('/api/v1/artist/calendar?month=2026-11', 'GET');
  const body = (await response.json()) as {
    data: { days: { date: string; status: string; requestCount: number }[] };
  };
  return new Map(body.data.days.map((day) => [day.date, day]));
}
