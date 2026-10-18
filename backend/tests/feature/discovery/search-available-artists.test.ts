import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import {
  artists,
  availabilityOverrides,
  bookings,
  vulnerableSectorChecks,
} from '@/server/db/schema';
import { anchor } from '@/server/integrations/routing/cast-routes';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { artistId, lineup, lineupNames, routing, search } from '../../support/discovery';

const SEARCH = { method: 'get', path: '/search' };

/**
 * L2-002.1, L2-003, L2-005: who is free on a date and within driving range.
 * The cast is the one in docs/mocks/README.md; today is Fri 9 Oct 2026.
 */
describe('searching for available artists', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    // Each test starts from the seeded cast; the seed restores what earlier tests changed.
    await freshDatabase();
  });

  it('lists the seven free artists for a worship night in Burlington, closest first', async () => {
    const response = await search();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Awaited<ReturnType<typeof lineup>>;
    expect(body.meta.total).toBe(7);
    expect(body.headliner?.name).toBe('Abigail Mensah');
    expect(body.headliner?.distance.km).toBe(44);
    expect(body.data.map((card) => card.name)).toEqual([
      'Marcus Bell Trio',
      'Hosanna Collective',
      'Luz Viva',
      'Elijah Park',
      'Grace Tabernacle Mass Choir',
      'Daniel & Ruth Okonkwo',
    ]);
    expect(body.data.map((card) => card.distance.km)).toEqual([14, 32, 63, 74, 81, 97]);
    expect(body.data[0]).toEqual({
      id: await artistId('marcus-bell-trio'),
      slug: 'marcus-bell-trio',
      pronoun: 'they',
      name: 'Marcus Bell Trio',
      actType: 'band',
      styles: ['band', 'acoustic', 'hymns'],
      city: 'Hamilton',
      distance: { km: 14, driveMinutes: 10, approximate: false },
      rating: 4.6,
      reviewCount: 17,
      fromPrice: { cents: 95000, currency: 'CAD' },
    });
    expectContract(response, SEARCH, body);
  });

  // L2-003: the travel rule.

  it('leaves Abigail, 44 km away, out of a 40 km radius', async () => {
    expect(lineupNames(await lineup({ radius: 40 }))).toEqual([
      'Marcus Bell Trio',
      'Hosanna Collective',
    ]);
  });

  it('leaves out an artist whose own limit is shorter than the drive', async () => {
    await db()
      .update(artists)
      .set({ maxDriveKm: 60 })
      .where(eq(artists.slug, 'daniel-and-ruth-okonkwo'));

    expect(lineupNames(await lineup())).not.toContain('Daniel & Ruth Okonkwo');
  });

  it('includes an artist exactly at both limits', async () => {
    routing().override(anchor('Burlington'), anchor('Ajax'), 120);

    const page = await lineup();

    expect(page.data[5]?.name).toBe('Daniel & Ruth Okonkwo');
    expect(page.data[5]?.distance.km).toBe(120);
  });

  // L2-005: free on the date.

  it('leaves out an artist with a confirmed booking on the date', async () => {
    const page = await lineup({ date: '2026-11-15', kind: 'sunday-service' });

    expect(page.meta.total).toBe(6);
    expect(lineupNames(page)).not.toContain('Abigail Mensah');
  });

  it('keeps an artist with only a requested booking on the date', async () => {
    expect(lineupNames(await lineup())).toContain('Abigail Mensah');
  });

  it('keeps an artist with only an accepted booking on the date', async () => {
    await db()
      .insert(bookings)
      .values({
        number: 'ZM-ACCEPTED-1',
        artistId: await artistId('abigail-mensah'),
        status: 'accepted',
        eventDate: '2026-12-05',
        kind: 'sunday-service',
        churchName: 'Harvest Point',
        churchCity: 'Milton',
      });

    expect(lineupNames(await lineup({ date: '2026-12-05' }))).toContain('Abigail Mensah');
  });

  it('leaves out an artist on a date they marked unavailable', async () => {
    expect(lineupNames(await lineup({ date: '2026-11-26' }))).not.toContain('Abigail Mensah');
  });

  it('leaves out an artist on their weekly day off unless that date is marked free', async () => {
    expect(lineupNames(await lineup({ date: '2026-11-16' }))).not.toContain('Abigail Mensah');

    await db()
      .insert(availabilityOverrides)
      .values({ artistId: await artistId('abigail-mensah'), date: '2026-11-16', state: 'free' });

    expect(lineupNames(await lineup({ date: '2026-11-16' }))).toContain('Abigail Mensah');
  });

  it('leaves out suspended, unpublished and payout-pending artists', async () => {
    await db()
      .update(artists)
      .set({ status: 'suspended' })
      .where(eq(artists.slug, 'marcus-bell-trio'));
    await db()
      .update(artists)
      .set({ publishedAt: null })
      .where(eq(artists.slug, 'hosanna-collective'));
    await db().update(artists).set({ payoutReady: false }).where(eq(artists.slug, 'luz-viva'));

    expect(lineupNames(await lineup())).toEqual([
      'Abigail Mensah',
      'Elijah Park',
      'Grace Tabernacle Mass Choir',
      'Daniel & Ruth Okonkwo',
    ]);
  });

  it('leaves out a deleted artist', async () => {
    await db()
      .update(artists)
      .set({ status: 'deleted' })
      .where(eq(artists.slug, 'marcus-bell-trio'));

    expect(lineupNames(await lineup())).not.toContain('Marcus Bell Trio');
  });

  it('needs a verified check still valid on the event date for a youth event', async () => {
    const [elijah] = await db()
      .select({ userId: artists.userId })
      .from(artists)
      .where(eq(artists.slug, 'elijah-park'));
    const [grace] = await db()
      .select({ userId: artists.userId })
      .from(artists)
      .where(eq(artists.slug, 'grace-tabernacle-mass-choir'));
    await db()
      .insert(vulnerableSectorChecks)
      .values([
        {
          userId: elijah?.userId ?? 0,
          issuedOn: '2023-11-01',
          expiresOn: '2026-11-01',
          status: 'verified',
        },
        {
          userId: grace?.userId ?? 0,
          issuedOn: '2026-09-30',
          expiresOn: '2029-09-30',
          status: 'pending',
        },
      ]);

    // Abigail (verified until 2028) and Daniel & Ruth (verified until Mon 30 Nov, still good on the 14th).
    expect(lineupNames(await lineup({ kind: 'youth-event' }))).toEqual([
      'Abigail Mensah',
      'Daniel & Ruth Okonkwo',
    ]);
  });
});
