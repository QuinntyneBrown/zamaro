import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { testEnvironment } from '../../support/api-process';
import { cli } from '../../support/cli';
import { testDb } from '../../support/db';

/**
 * The cast from docs/mocks/README.md, seeded by `db:seed` (AGENTS.md: idempotent, safe to re-run).
 * Today is Fri 9 Oct 2026. The numbers are the ones the mocks and the M1 plan fix.
 */
describe('the seeded cast', () => {
  it('has the artists the mocks show, with their ratings', async () => {
    const artists = await testDb()`
      SELECT a.slug, a.ticket_number, a.base_city, a.max_drive_km, a.from_price_cents, r.rating, r.review_count
      FROM artists a JOIN artist_ratings r ON r.artist_id = a.id
      WHERE a.slug IN ('abigail-mensah', 'miriam-haile', 'marcus-bell-trio')
      ORDER BY a.slug`;

    expect(artists.map((row) => ({ ...row }))).toEqual([
      {
        slug: 'abigail-mensah',
        ticket_number: 'ACT-0027',
        base_city: 'Brampton',
        max_drive_km: 120,
        from_price_cents: 65000,
        rating: 4.9,
        review_count: 38,
      },
      {
        slug: 'marcus-bell-trio',
        ticket_number: 'ACT-0012',
        base_city: 'Hamilton',
        max_drive_km: 120,
        from_price_cents: 95000,
        rating: 4.6,
        review_count: 17,
      },
      {
        slug: 'miriam-haile',
        ticket_number: 'ACT-0154',
        base_city: 'Etobicoke',
        max_drive_km: 40,
        from_price_cents: 30000,
        rating: null,
        review_count: 0,
      },
    ]);
  });

  it('counts 43 artists: the eight, thirty around Barrie, four choirs and one suspended', async () => {
    const [visible] =
      await testDb()`SELECT count(*)::int AS n FROM artists WHERE status = 'approved' AND payout_ready AND published_at IS NOT NULL`;
    const [suspended] =
      await testDb()`SELECT count(*)::int AS n FROM artists WHERE status = 'suspended'`;

    expect(visible?.n).toBe(42);
    expect(suspended?.n).toBe(1);
  });

  it("gives Abigail 38 reviews from 38 churches summing to 185 stars, with Tomi's and Naomi's replies", async () => {
    const [summary] = await testDb()`
      SELECT count(*)::int AS reviews, sum(r.stars)::int AS stars,
             count(DISTINCT (b.church_name, b.church_city))::int AS churches
      FROM reviews r JOIN bookings b ON b.id = r.booking_id JOIN artists a ON a.id = r.artist_id
      WHERE a.slug = 'abigail-mensah' AND r.hidden_at IS NULL`;
    const replies = await testDb()`
      SELECT b.number FROM review_replies p JOIN reviews r ON r.id = p.review_id JOIN bookings b ON b.id = r.booking_id ORDER BY b.number`;

    expect(summary).toMatchObject({ reviews: 38, stars: 185, churches: 38 });
    expect(replies.map((row) => String(row.number))).toEqual(['ZAM-0061', 'ZAM-0078']);
  });

  it('lets Naomi, Abigail, Tomi and Priya sign in with the cast password, nobody else', async () => {
    const rows = await testDb()`
      SELECT email, email_verified_at IS NOT NULL AS verified, mfa_enabled
      FROM users WHERE email IN ('naomi.fraser@riversidecc.ca', 'abigail@abigailmensah.ca', 'tomi.oduya@harvestpointchurch.ca', 'priya@zamaro.ca')
      ORDER BY email`;
    const [priyaRoles] = await testDb()`
      SELECT array_agg(r.name ORDER BY r.name) AS roles FROM role_user ru JOIN roles r ON r.id = ru.role_id JOIN users u ON u.id = ru.user_id WHERE u.email = 'priya@zamaro.ca'`;

    expect(rows.map((row) => ({ ...row }))).toEqual([
      { email: 'abigail@abigailmensah.ca', verified: true, mfa_enabled: false },
      { email: 'naomi.fraser@riversidecc.ca', verified: true, mfa_enabled: false },
      { email: 'priya@zamaro.ca', verified: true, mfa_enabled: true },
      { email: 'tomi.oduya@harvestpointchurch.ca', verified: true, mfa_enabled: false },
    ]);
    expect(priyaRoles?.roles).toEqual(['admin']);
  });

  it("writes Abigail's photos and posters and the sample stream to the media disk", async () => {
    const [photo] = await testDb()`
      SELECT p.renditions FROM artist_photos p JOIN artists a ON a.id = p.artist_id WHERE a.slug = 'abigail-mensah' AND p.position = 1`;
    const renditions = photo?.renditions as { key: string }[];
    const media = join(testEnvironment().ZAMARO_STORAGE_ROOT ?? '', 'media');

    expect(renditions).toHaveLength(8);
    for (const rendition of renditions) {
      expect(existsSync(join(media, rendition.key)), rendition.key).toBe(true);
    }
    expect(existsSync(join(media, 'artists/abigail-mensah/videos/1-poster-800.webp'))).toBe(true);
    expect(existsSync(join(media, 'samples/video/stream.m3u8'))).toBe(true);
  });

  it('seeds the same rows again: a second db:seed changes no count and no rating', async () => {
    const counts = () => testDb()`
      SELECT (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM artists)::int AS artists,
             (SELECT count(*) FROM bookings)::int AS bookings, (SELECT count(*) FROM reviews)::int AS reviews,
             (SELECT count(*) FROM consent_records)::int AS consents, (SELECT count(*) FROM artist_photos)::int AS photos,
             (SELECT count(*) FROM artist_videos)::int AS videos, (SELECT count(*) FROM vulnerable_sector_checks)::int AS checks,
             (SELECT count(*) FROM saved_artists)::int AS saved, (SELECT count(*) FROM slug_histories)::int AS slugs`;
    const [before] = await counts();

    const result = cli('db-seed');

    expect(result.status, result.stderr).toBe(0);
    const [after] = await counts();
    expect(after).toEqual(before);
    expect(before?.artists).toBe(43);
  });
});
