import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { profileData } from '../../support/profiles';

const TOUR_DATES = { method: 'get', path: '/artists/{slug}/tour-dates' };
const AVAILABILITY = { method: 'get', path: '/artists/{slug}/availability' };

interface TourDates {
  data: { date: string; status: string; kind: string | null; city: string | null }[];
}

/**
 * L2-017 and L2-019: the "On tour" list and the booking stub's date check, with the cancellation
 * window a booking on that date would have (L2-044). Today is Fri 9 Oct 2026.
 */
describe('picking a date', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it("lists Abigail's next six dates from the search date, skipping her Monday off", async () => {
    const response = await api('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14');

    // Sat 14 Nov has only a Requested booking, so it stays free; Mon 16 Nov is her weekly day off.
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({
      data: [
        { date: '2026-11-14', status: 'free', kind: null, city: null },
        { date: '2026-11-15', status: 'booked', kind: 'sunday-service', city: 'Oakville' },
        { date: '2026-11-17', status: 'free', kind: null, city: null },
        { date: '2026-11-18', status: 'free', kind: null, city: null },
        { date: '2026-11-19', status: 'free', kind: null, city: null },
        { date: '2026-11-20', status: 'free', kind: null, city: null },
      ],
    });
    expect(response.headers.get('cache-control')).toContain('public');
    expectContract(response, TOUR_DATES, body);
  });

  it('never names the church or its booking on a booked date', async () => {
    const text = await (
      await api('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14')
    ).text();

    expect(text).not.toContain('Lakeshore');
    expect(text).not.toContain('ZAM-');
  });

  it('leaves out dates the artist marked unavailable', async () => {
    // Thu 26 and Fri 27 Nov are blocked, Mon 30 Nov is her day off.
    const body = (await (
      await api('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-24')
    ).json()) as TourDates;

    expect(body.data.map((row) => row.date)).toEqual([
      '2026-11-24',
      '2026-11-25',
      '2026-11-28',
      '2026-11-29',
      '2026-12-01',
      '2026-12-02',
    ]);
  });

  it('starts the list three days from today without a search date', async () => {
    const response = await api('/api/v1/artists/miriam-haile/tour-dates');

    expect(response.status).toBe(200);
    const body = (await response.json()) as TourDates;
    expect(body.data.map((row) => row.date)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ]);
    expect([...new Set(body.data.map((row) => row.status))]).toEqual(['free']);
    expectContract(response, TOUR_DATES, body);
  });

  it('starts the list at three days for a search date sooner than that', async () => {
    const body = (await (
      await api('/api/v1/artists/miriam-haile/tour-dates?from=2026-10-10')
    ).json()) as TourDates;

    expect(body.data[0]?.date).toBe('2026-10-12');
  });

  it('rejects a from date that is not a date', async () => {
    const response = await api('/api/v1/artists/miriam-haile/tour-dates?from=next-week');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(Object.keys(body.errors)).toEqual(['from']);
    expectContract(response, TOUR_DATES, body);
  });

  it('says Abigail is booked on Sun 15 Nov', async () => {
    const response = await api('/api/v1/artists/abigail-mensah/availability?date=2026-11-15');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { date: string; free: boolean } };
    expect(body.data.date).toBe('2026-11-15');
    expect(body.data.free).toBe(false);
    expectContract(response, AVAILABILITY, body);
  });

  it('says Abigail is free on Sat 14 Nov and until when it cancels free', async () => {
    const response = await api('/api/v1/artists/abigail-mensah/availability?date=2026-11-14');

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({
      data: { date: '2026-11-14', free: true, freeCancellationUntil: '2026-10-31' },
    });
    expectContract(response, AVAILABILITY, body);
  });

  it('counts a weekly day off as not free', async () => {
    const body = (await (
      await api('/api/v1/artists/abigail-mensah/availability?date=2026-11-16')
    ).json()) as { data: { free: boolean } };

    expect(body.data.free).toBe(false);
  });

  it('takes dates from three days to eighteen months ahead for the check', async () => {
    const soon = await api('/api/v1/artists/abigail-mensah/availability?date=2026-10-10');
    expect(soon.status).toBe(422);
    const soonBody = (await soon.json()) as { errors: Record<string, string[]> };
    expect(soonBody.errors.date?.[0]).toBe('Pick a date at least 3 days away.');
    expectContract(soon, AVAILABILITY, soonBody);

    const far = (await (
      await api('/api/v1/artists/abigail-mensah/availability?date=2028-05-01')
    ).json()) as { errors: Record<string, string[]> };
    expect(far.errors.date?.[0]).toBe('We take bookings up to 18 months ahead.');
    const missing = (await (await api('/api/v1/artists/abigail-mensah/availability')).json()) as {
      errors: Record<string, string[]>;
    };
    expect(missing.errors.date?.[0]).toBe('Pick your event date.');
  });

  it('has no dates for a suspended or unknown artist', async () => {
    await db().update(artists).set({ status: 'suspended' }).where(eq(artists.slug, 'miriam-haile'));

    expect((await api('/api/v1/artists/miriam-haile/tour-dates')).status).toBe(404);
    expect((await api('/api/v1/artists/miriam-haile/availability?date=2026-11-14')).status).toBe(
      404,
    );
    const response = await api('/api/v1/artists/nobody/tour-dates');
    expect(response.status).toBe(404);
    expectContract(response, TOUR_DATES, await response.json());
  });

  it('gives Miriam the ticket number the mocks show', async () => {
    expect((await profileData('miriam-haile')).ticketNumber).toBe('ACT-0154');
  });
});
