import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists, savedArtists } from '@/server/db/schema';
import { ArtistStatus } from '@/server/enums';
import { now } from '@/server/support/clock';
import { ABIGAIL, Browser, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const LIST = { method: 'get', path: '/saved-artists' };

interface Card {
  id: number;
  slug: string;
  pronoun: string;
  name: string;
  actType: string;
  styles: string[];
  city: string;
  distance: { km: number; driveMinutes: number; approximate: boolean } | null;
  rating: number | null;
  reviewCount: number;
  fromPrice: { cents: number; currency: string };
  savedAt: string;
  availability: 'free' | 'booked' | null;
}

interface List {
  data: { artists: Card[]; total: number; date: string | null };
}

/**
 * L2-027 (accounts/view-saved-artists): a booker's saved artists, newest save first, each free or
 * booked on the date asked for. Artists no longer visible are left out and not counted.
 */
describe('viewing saved artists', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('shows Naomi her saved artists newest first, free on her date', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/saved-artists?date=2026-11-14', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as List;
    expect(body.data.total).toBe(3);
    expect(body.data.date).toBe('2026-11-14');
    expect(body.data.artists.map((card) => card.slug)).toEqual([
      'abigail-mensah',
      'hosanna-collective',
      'luz-viva',
    ]);
    expect(body.data.artists.map((card) => card.availability)).toEqual(['free', 'free', 'free']);
    expect(body.data.artists.map((card) => card.distance?.km)).toEqual([44, 32, 63]);
    const abigail = body.data.artists[0];
    expect(Object.keys(abigail ?? {})).toEqual([
      'id',
      'slug',
      'pronoun',
      'name',
      'actType',
      'styles',
      'city',
      'distance',
      'rating',
      'reviewCount',
      'fromPrice',
      'savedAt',
      'availability',
    ]);
    expect(abigail?.name).toBe('Abigail Mensah');
    expect(abigail?.city).toBe('Brampton');
    expect(abigail?.fromPrice).toEqual({ cents: 65000, currency: 'CAD' });
    expect(new Date(abigail?.savedAt ?? 0).toISOString()).toBe('2026-10-08T00:14:00.000Z');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, LIST, body);
  });

  it('rechecks every artist for another date', async () => {
    const naomi = await signedIn(NAOMI);

    const body = (await (
      await naomi.json('/api/v1/saved-artists?date=2026-11-15', 'GET')
    ).json()) as List;

    expect(body.data.date).toBe('2026-11-15');
    expect(body.data.artists.map((card) => card.availability)).toEqual(['booked', 'free', 'free']);
  });

  it('marks no artist without a date', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/saved-artists', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as List;
    expect(body.data.date).toBeNull();
    expect(body.data.artists.map((card) => card.availability)).toEqual([null, null, null]);
    expectContract(response, LIST, body);
  });

  it('leaves a suspended artist out and uncounted, but keeps them saved', async () => {
    const [naomiRow] = await query<{ id: number }>(
      sql`select id from users where email = ${NAOMI}`,
    );
    const [selah] = await db()
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.slug, 'selah-brooks'));
    await db()
      .insert(savedArtists)
      .values({ userId: naomiRow?.id ?? 0, artistId: selah?.id ?? 0, createdAt: now().toJSDate() });
    const naomi = await signedIn(NAOMI);

    const hidden = (await (
      await naomi.json('/api/v1/saved-artists?date=2026-11-14', 'GET')
    ).json()) as List;
    expect(hidden.data.total).toBe(3);
    expect(hidden.data.artists.map((card) => card.slug)).toEqual([
      'abigail-mensah',
      'hosanna-collective',
      'luz-viva',
    ]);

    await db()
      .update(artists)
      .set({ status: ArtistStatus.Approved })
      .where(eq(artists.id, selah?.id ?? 0));
    const shown = (await (await naomi.json('/api/v1/saved-artists', 'GET')).json()) as List;
    expect(shown.data.total).toBe(4);
    expect(shown.data.artists[0]?.slug).toBe('selah-brooks');
  });

  it('gives a new booker none, and a booker without a church no distance', async () => {
    const ruth = await signedIn(await freshBooker());

    const empty = await ruth.json('/api/v1/saved-artists?date=2026-11-14', 'GET');
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ data: { artists: [], total: 0, date: '2026-11-14' } });

    const [elijah] = await db()
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.slug, 'elijah-park'));
    expect(
      (await ruth.json(`/api/v1/saved-artists/${String(elijah?.id ?? 0)}`, 'PUT')).status,
    ).toBe(200);
    const body = (await (await ruth.json('/api/v1/saved-artists', 'GET')).json()) as List;
    expect(body.data.artists[0]?.distance).toBeNull();
  });

  it('refuses a date that is not a calendar date', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/saved-artists?date=14-11-2026', 'GET');

    expect(response.status).toBe(422);
    expect(((await response.json()) as { errors: object }).errors).toHaveProperty('date');
  });

  it('gives only a signed-in booker a list', async () => {
    expect((await new Browser().json('/api/v1/saved-artists', 'GET')).status).toBe(401);

    const abigail = await signedIn(ABIGAIL);
    expect((await abigail.json('/api/v1/saved-artists', 'GET')).status).toBe(404);
  });
});
