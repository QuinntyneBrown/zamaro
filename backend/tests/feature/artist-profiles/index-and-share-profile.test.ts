import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import { torontoTime } from '@/server/support/clock';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { profile } from '../../support/profiles';

const PROFILE = { method: 'get', path: '/artists/{slug}' };
const SITEMAP = { method: 'get', path: '/sitemap' };

/**
 * L2-089.1 and L2-112.3: public profile responses revalidate with a strong ETag and are shared for at
 * most 60 seconds; the sitemap lists every published profile and nothing else.
 */
describe('indexing and sharing a profile', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
  });

  it('carries a strong etag on the profile and shares it for 60 seconds', async () => {
    const response = await profile('abigail-mensah');

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toMatch(/^"[a-f0-9]{64}"$/);
    expect(cacheControl(response)).toEqual(['max-age=0', 'public', 's-maxage=60']);
    expectContract(response, PROFILE, await response.json());
  });

  it('answers a matching if-none-match with 304 and no body', async () => {
    const etag = (await profile('abigail-mensah')).headers.get('etag') ?? '';

    const response = await api('/api/v1/artists/abigail-mensah', {
      headers: { 'If-None-Match': etag },
    });

    expect(response.status).toBe(304);
    expect(await response.text()).toBe('');
    expect(response.headers.get('etag')).toBe(etag);
  });

  it('gives an edited profile a new etag so the old copy is not reused', async () => {
    const etag = (await profile('abigail-mensah')).headers.get('etag') ?? '';
    await db()
      .update(artists)
      .set({ headline: 'Gospel, hymns and contemporary' })
      .where(eq(artists.slug, 'abigail-mensah'));

    const response = await api('/api/v1/artists/abigail-mensah', {
      headers: { 'If-None-Match': etag },
    });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { headline: string } }).data.headline).toBe(
      'Gospel, hymns and contemporary',
    );
    expect(response.headers.get('etag')).not.toBe(etag);
  });

  it('revalidates the tour dates and the date check with their etags', async () => {
    for (const [url, operation] of [
      [
        '/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14',
        { method: 'get', path: '/artists/{slug}/tour-dates' },
      ],
      [
        '/api/v1/artists/abigail-mensah/availability?date=2026-11-14',
        { method: 'get', path: '/artists/{slug}/availability' },
      ],
    ] as const) {
      const first = await api(url);
      const etag = first.headers.get('etag') ?? '';
      expect(etag, url).toMatch(/^"[a-f0-9]{64}"$/);
      expectContract(first, operation, await first.json());

      expect((await api(url, { headers: { 'If-None-Match': etag } })).status).toBe(304);
    }
  });

  it('carries no etag on a missing artist or a renamed address', async () => {
    const missing = await profile('selah-brooks');
    expect(missing.status).toBe(404);
    expect(missing.headers.get('etag')).toBeNull();

    const moved = await profile('abigail-sings');
    expect(moved.status).toBe(301);
    expect(moved.headers.get('etag')).toBeNull();
  });

  it('lists every published profile with its last change in the sitemap', async () => {
    await db()
      .update(artists)
      .set({ updatedAt: torontoTime('2026-10-01 12:00:00') })
      .where(eq(artists.slug, 'abigail-mensah'));

    const response = await api('/api/v1/sitemap');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { slug: string; lastModified: string }[] };
    expect(body.data).toHaveLength(42);
    expect(body.data).toContainEqual({ slug: 'abigail-mensah', lastModified: '2026-10-01' });
    expect(body.data.map((entry) => entry.slug)).toContain('miriam-haile');
    expect(response.headers.get('cache-control')).toContain('public');
    expectContract(response, SITEMAP, body);
  });

  it('leaves suspended, unpublished and deleted artists out of the sitemap', async () => {
    await db().update(artists).set({ publishedAt: null }).where(eq(artists.slug, 'miriam-haile'));
    await db()
      .update(artists)
      .set({ status: 'deleted' })
      .where(eq(artists.slug, 'marcus-bell-trio'));

    const body = (await (await api('/api/v1/sitemap')).json()) as { data: { slug: string }[] };
    const slugs = body.data.map((entry) => entry.slug);

    expect(slugs).toContain('abigail-mensah');
    expect(slugs).not.toContain('selah-brooks');
    expect(slugs).not.toContain('miriam-haile');
    expect(slugs).not.toContain('marcus-bell-trio');
  });
});

function cacheControl(response: Response): string[] {
  return (response.headers.get('cache-control') ?? '')
    .split(',')
    .map((part) => part.trim())
    .sort();
}
