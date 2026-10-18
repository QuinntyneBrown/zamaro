import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { profile } from '../../support/profiles';

const PROFILE = { method: 'get', path: '/artists/{slug}' };
const TOUR_DATES = { method: 'get', path: '/artists/{slug}/tour-dates' };

/** Naomi's search, carried from Discover: Burlington, Sat 14 Nov, worship night, 120 km. */
const BURLINGTON = '?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120';

interface Missing {
  type: string;
  title: string;
  status: number;
  similarArtists: {
    date: string;
    radiusKm: number;
    items: { slug: string; distance: { km: number } }[];
  };
}

/**
 * L2-021 (and L2-055.3): an address that leads to no viewable artist is one 404 problem with up to
 * 3 similar artists free on the carried date, whether the slug never existed or the artist is hidden;
 * a retired slug answers 301 to the current one. The cast seeds Selah Brooks, a suspended solo
 * vocalist, and Abigail's retired address `abigail-sings`.
 */
describe('resolving a missing artist', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('suggests the nearest artists free on the carried date for a slug that never existed', async () => {
    const response = await profile('nobody-at-all', BURLINGTON);

    // Any style: the three nearest of the seven free that night (Hamilton 14, Mississauga 32, Brampton 44).
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    const body = (await response.json()) as Missing;
    expect(body.title).toBe('This artist isn’t on Zamaro');
    expect(body.status).toBe(404);
    expect(body.type.endsWith('/artist-not-found')).toBe(true);
    expect(body.similarArtists.date).toBe('2026-11-14');
    expect(body.similarArtists.radiusKm).toBe(120);
    expect(body.similarArtists.items.map((item) => item.slug)).toEqual([
      'marcus-bell-trio',
      'hosanna-collective',
      'abigail-mensah',
    ]);
    expect(body.similarArtists.items[2]?.distance.km).toBe(44);
    expectContract(response, PROFILE, body);
  });

  it('gives a suspended artist the same problem with free artists of their primary style', async () => {
    const response = await profile('selah-brooks', BURLINGTON);

    // Solo vocalists, nearest first; Miriam drives only 40 km and Burlington is 48 away.
    expect(response.status).toBe(404);
    const body = (await response.json()) as Missing;
    expect(body.title).toBe('This artist isn’t on Zamaro');
    expect(body.similarArtists.items.map((item) => item.slug)).toEqual([
      'abigail-mensah',
      'elijah-park',
    ]);
    expect(body.similarArtists.items[0]?.distance.km).toBe(44);
    expect(body.similarArtists.items[1]?.distance.km).toBe(74);
    const unknown = (await (await profile('nobody-at-all', BURLINGTON)).json()) as object;
    expect(Object.keys(body)).toEqual(Object.keys(unknown));
    expectContract(response, PROFILE, body);
  });

  it('reveals nothing of a hidden artist', async () => {
    const text = await (await profile('selah-brooks', BURLINGTON)).text();

    expect(text.toLowerCase()).not.toContain('selah');
    expect(text).not.toContain('Brooks');
    expect(text).not.toContain('ACT-0044');
  });

  it('treats a deleted artist as missing like any other', async () => {
    await db().update(artists).set({ status: 'deleted' }).where(eq(artists.slug, 'elijah-park'));

    const response = await profile('elijah-park', BURLINGTON);

    expect(response.status).toBe(404);
    const body = (await response.json()) as Missing;
    expect(body.title).toBe('This artist isn’t on Zamaro');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('elijah');
  });

  it('treats an unpublished artist as missing like any other', async () => {
    await db().update(artists).set({ publishedAt: null }).where(eq(artists.slug, 'elijah-park'));

    const response = await profile('elijah-park', BURLINGTON);

    expect(response.status).toBe(404);
    const body = (await response.json()) as Missing;
    expect(body.title).toBe('This artist isn’t on Zamaro');
    expect(body.similarArtists.items.map((item) => item.slug)).toEqual(['abigail-mensah']);
  });

  it('measures the suggestions from Toronto without a carried location', async () => {
    const body = (await (await profile('selah-brooks', '?date=2026-11-14')).json()) as Missing;

    // From City Hall within 120 km: Etobicoke, then Markham, then Brampton.
    expect(body.similarArtists.date).toBe('2026-11-14');
    expect(body.similarArtists.radiusKm).toBe(120);
    expect(body.similarArtists.items.map((item) => item.slug)).toEqual([
      'miriam-haile',
      'elijah-park',
      'abigail-mensah',
    ]);
  });

  it('suggests artists free on the first bookable day without a usable date', async () => {
    // Mon 12 Oct is three days away; Abigail never works Mondays.
    for (const query of ['', '?date=2026-10-10', '?date=2028-10-10']) {
      const body = (await (await profile('selah-brooks', query)).json()) as Missing;

      expect(body.similarArtists.date, query).toBe('2026-10-12');
      expect(body.similarArtists.items[0]?.slug, query).toBe('miriam-haile');
      expect(body.similarArtists.items[1]?.slug, query).toBe('elijah-park');
    }
  });

  it('answers 301 to the current slug for a retired one and keeps the query string', async () => {
    const response = await profile('abigail-sings', '?date=2026-11-14');

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/api/v1/artists/abigail-mensah?date=2026-11-14');
  });

  it("follows a retired slug on the profile's other addresses too", async () => {
    const dates = await api('/api/v1/artists/abigail-sings/tour-dates?from=2026-11-14');
    expect(dates.status).toBe(301);
    expect(dates.headers.get('location')).toBe(
      '/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14',
    );

    const check = await api('/api/v1/artists/abigail-sings/availability?date=2026-11-14');
    expect(check.status).toBe(301);
    expect(check.headers.get('location')).toBe(
      '/api/v1/artists/abigail-mensah/availability?date=2026-11-14',
    );

    const reviews = await api('/api/v1/artists/abigail-sings/reviews');
    expect(reviews.status).toBe(301);
    expect(reviews.headers.get('location')).toBe('/api/v1/artists/abigail-mensah/reviews');
  });

  it('treats a retired slug of a hidden artist as missing, not moved', async () => {
    await db()
      .update(artists)
      .set({ payoutReady: false })
      .where(eq(artists.slug, 'abigail-mensah'));

    const response = await profile('abigail-sings', BURLINGTON);

    expect(response.status).toBe(404);
    const text = await response.text();
    expect((JSON.parse(text) as Missing).similarArtists.items.map((item) => item.slug)).toEqual([
      'elijah-park',
    ]);
    expect(text).not.toContain('abigail');
  });

  it("treats the profile's other addresses as missing for a hidden artist", async () => {
    const response = await api('/api/v1/artists/selah-brooks/tour-dates');

    expect(response.status).toBe(404);
    const body = (await response.json()) as { title: string };
    expect(body.title).toBe('This artist isn’t on Zamaro');
    expectContract(response, TOUR_DATES, body);
  });

  it('ignores the carried search on a found profile', async () => {
    const response = await profile('abigail-mensah', BURLINGTON);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { slug: string } };
    expect(body.data.slug).toBe('abigail-mensah');
    expectContract(response, PROFILE, body);
  });
});
