import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { artists, artistVideos } from '@/server/db/schema';
import { disk } from '@/server/integrations/storage/disks';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase } from '../../support/database';
import { profile, profileData } from '../../support/profiles';

const PROFILE = { method: 'get', path: '/artists/{slug}' };

/**
 * L2-014, L2-015 and L2-020.3: the profile's photos and live videos, public fields only. In M1 the
 * media disk is the API's local disk, served under /media (no object storage until M4).
 */
describe('profile media', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  it('lists photos in order with alt text and responsive renditions', async () => {
    const response = await profile('abigail-mensah');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Awaited<ReturnType<typeof profileData>> };
    expect(body.data.photos).toHaveLength(4);
    expect(body.data.photos.map((photo) => photo.alt)).toEqual([
      'Abigail at the microphone during a Sunday service',
      'Abigail rehearsing with a church volunteer band',
      'Portrait of Abigail smiling in a kente scarf',
      'Abigail leading a youth night from the floor, not the stage',
    ]);
    const photo = body.data.photos[0];
    expect(Object.keys(photo ?? {})).toEqual([
      'id',
      'alt',
      'src',
      'width',
      'height',
      'srcset',
      'avifSrcset',
    ]);
    expect([photo?.width, photo?.height]).toEqual([800, 600]);
    expect(photo?.src).toMatch(/^\/media\/artists\/abigail-mensah\/photos\/1-800\.webp$/);
    for (const width of [400, 800, 1200, 1600]) {
      expect(photo?.srcset).toContain(
        `/media/artists/abigail-mensah/photos/1-${String(width)}.webp ${String(width)}w`,
      );
      expect(photo?.avifSrcset).toContain(
        `/media/artists/abigail-mensah/photos/1-${String(width)}.avif ${String(width)}w`,
      );
    }
    expectContract(response, PROFILE, body);
  });

  it('lists live videos with poster, stream and captions and hides processing ones', async () => {
    const response = await profile('abigail-mensah');

    const body = (await response.json()) as { data: Awaited<ReturnType<typeof profileData>> };
    expect(body.data.videos.map((video) => video.title)).toEqual([
      'Way Maker — live at Bethel Pentecostal, Hamilton',
      'Great Is Thy Faithfulness — acoustic',
      'Twi praise medley — Harvest Sunday 2025',
      'Goodness of God — women’s retreat, Muskoka',
    ]);
    expect(body.data.videos.map((video) => video.durationSeconds)).toEqual([372, 280, 485, 330]);
    expect(body.data.videos[0]?.captions?.lang).toBe('en');
    // The artist supplied no captions for the acoustic set.
    expect(body.data.videos[1]?.captions).toBeNull();
    const video = body.data.videos[0];
    expect(Object.keys(video ?? {})).toEqual([
      'id',
      'title',
      'durationSeconds',
      'poster',
      'stream',
      'captions',
    ]);
    expect(video?.stream.startsWith('/media/')).toBe(true);
    expect(video?.stream.endsWith('.m3u8')).toBe(true);
    expect(video?.captions?.src.endsWith('.vtt')).toBe(true);
    expect(Object.keys(video?.poster ?? {})).toEqual(['src', 'width', 'height']);
    expect(JSON.stringify(body.data.videos)).not.toContain('Jireh');
    const stored = await db()
      .select({ id: artistVideos.id })
      .from(artistVideos)
      .innerJoin(artists, eq(artists.id, artistVideos.artistId))
      .where(eq(artists.slug, 'abigail-mensah'));
    expect(stored).toHaveLength(5);
    expectContract(response, PROFILE, body);
  });

  it('gives an artist without media empty lists', async () => {
    const miriam = await profileData('miriam-haile');
    expect(miriam.photos).toHaveLength(2);
    expect(miriam.videos).toEqual([]);

    const marcus = await profileData('marcus-bell-trio');
    expect(marcus.photos).toEqual([]);
    expect(marcus.videos).toEqual([]);
  });

  it('serves the local media disk under /media', async () => {
    await disk('media').put('samples/video/test-stream.m3u8', '#EXTM3U\n');

    const found = await api('/media/samples/video/test-stream.m3u8');
    expect(found.status).toBe(200);
    expect(await found.text()).toBe('#EXTM3U\n');
    expect(found.headers.get('content-type')).toContain('mpegurl');
    expect((await api('/media/samples/video/missing.m3u8')).status).toBe(404);
    expect((await api('/media/..%2F.env')).status).toBe(404);
  });
});
