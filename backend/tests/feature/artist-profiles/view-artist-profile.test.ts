import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { profile, profileData } from '../../support/profiles';

const PROFILE = { method: 'get', path: '/artists/{slug}' };

/** Every field the public profile may carry; anything else must stay server-side (L2-083). */
const PUBLIC_FIELDS = [
  'id',
  'slug',
  'displayName',
  'firstName',
  'pronoun',
  'actType',
  'headline',
  'aboutHeading',
  'bio',
  'baseCity',
  'maxDriveKm',
  'fromPrice',
  'ticketNumber',
  'rating',
  'reviewCount',
  'styles',
  'setlist',
  'photos',
  'videos',
  'reviews',
];

/**
 * L2-012, L2-013, L2-016 and L2-083.1: the public profile, public fields only.
 */
describe('viewing an artist profile', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it("shows Abigail's public profile to a guest", async () => {
    const response = await profile('abigail-mensah');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Awaited<ReturnType<typeof profileData>> };
    expect(body.data).toMatchObject({
      displayName: 'Abigail Mensah',
      firstName: 'Abigail',
      pronoun: 'she',
      headline: 'Gospel & contemporary vocalist',
      aboutHeading: 'Raised in the choir loft',
      baseCity: 'Brampton',
      maxDriveKm: 120,
      rating: 4.9,
      reviewCount: 38,
      styles: ['solo-vocalist', 'hymns'],
    });
    expect(body.data.setlist[0]).toEqual({
      position: 1,
      title: 'Way Maker',
      writer: 'Sinach',
      key: 'E',
    });
    expect(body.data.setlist[3]?.key).toBe('B-flat');
    expect(body.data.setlist).toHaveLength(8);
    expect(body.data.bio).toContain('nine years.\n\nI lead in English and Twi');
    expect(response.headers.get('cache-control')).toContain('public');
    expectContract(response, PROFILE, body);
  });

  it('lets only public fields leave the server', async () => {
    const data = await profileData('abigail-mensah');

    expect(Object.keys(data).sort()).toEqual([...PUBLIC_FIELDS].sort());
    expect(JSON.stringify(data)).not.toContain('@');
  });

  it('gives a new artist no rating and calls a group by its name', async () => {
    const miriam = await profileData('miriam-haile');
    expect(miriam.rating).toBeNull();
    expect(miriam.reviewCount).toBe(0);

    const marcus = await profileData('marcus-bell-trio');
    expect(marcus.firstName).toBe('Marcus Bell Trio');
    expect(marcus.aboutHeading).toBeNull();
  });

  it('returns markup in a bio as the text it is', async () => {
    await db()
      .update(artists)
      .set({ bio: '<script>alert(1)</script> Hello.' })
      .where(eq(artists.slug, 'miriam-haile'));

    expect((await profileData('miriam-haile')).bio).toBe('<script>alert(1)</script> Hello.');
  });

  it('does not find a suspended or unknown artist', async () => {
    await db()
      .update(artists)
      .set({ status: 'suspended' })
      .where(eq(artists.slug, 'marcus-bell-trio'));

    const suspended = await profile('marcus-bell-trio');
    expect(suspended.status).toBe(404);
    expect(suspended.headers.get('content-type')).toBe('application/problem+json');
    const unknown = await profile('nobody-at-all');
    expect(unknown.status).toBe(404);
    expectContract(unknown, PROFILE, await unknown.json());
  });
});
