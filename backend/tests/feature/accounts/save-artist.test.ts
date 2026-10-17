import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { config } from '@config/zamaro';
import { db } from '@/server/db/client';
import { artists, savedArtists, users } from '@/server/db/schema';
import { ActType, ArtistStatus } from '@/server/enums';
import { now } from '@/server/support/clock';
import { ABIGAIL, Browser, freshBooker, NAOMI, signedIn } from '../../support/accounts';
import { api } from '../../support/app';
import { resetClock } from '../../support/clock';
import { expectContract } from '../../support/contract';
import { closeDatabase, freshDatabase, query } from '../../support/database';

const IDS = { method: 'get', path: '/saved-artists/ids' };
const SAVE = { method: 'put', path: '/saved-artists/{artist}' };
const UNSAVE = { method: 'delete', path: '/saved-artists/{artist}' };
const SEARCH = { method: 'get', path: '/search' };

interface SavedState {
  data: { artistId: number; saved: boolean; savedCount: number; firstSave: boolean };
}

/**
 * L2-026 (accounts/save-artist): a booker saves and unsaves artists, at most 200; the answer always
 * carries the server's count. Only approved, published artists can be saved. Bookers only (L2-074.1).
 */
describe('saving an artist', () => {
  beforeAll(async () => {
    await freshDatabase();
  });

  afterAll(closeDatabase);

  beforeEach(async () => {
    await freshDatabase();
    resetClock();
  });

  it('shows Naomi the ids she saved and their count', async () => {
    const naomi = await signedIn(NAOMI);

    const response = await naomi.json('/api/v1/saved-artists/ids', 'GET');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { artistIds: number[]; count: number } };
    expect(body.data.count).toBe(3);
    expect([...body.data.artistIds].sort((a, b) => a - b)).toEqual(
      [await idOf('abigail-mensah'), await idOf('hosanna-collective'), await idOf('luz-viva')].sort(
        (a, b) => a - b,
      ),
    );
    expect(response.headers.get('cache-control')).toContain('no-store');
    expectContract(response, IDS, body);
  });

  it('answers the new count on saving and unsaving, and repeats safely', async () => {
    const naomi = await signedIn(NAOMI);
    const elijah = await idOf('elijah-park');

    const saved = await naomi.json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT');
    expect(saved.status).toBe(200);
    const savedBody = (await saved.json()) as SavedState;
    expect(savedBody).toEqual({
      data: { artistId: elijah, saved: true, savedCount: 4, firstSave: false },
    });
    expectContract(saved, SAVE, savedBody);
    const again = (await (
      await naomi.json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')
    ).json()) as SavedState;
    expect(again.data.savedCount).toBe(4);

    const removed = await naomi.json(`/api/v1/saved-artists/${String(elijah)}`, 'DELETE');
    expect(removed.status).toBe(200);
    const removedBody = (await removed.json()) as SavedState;
    expect(removedBody).toEqual({
      data: { artistId: elijah, saved: false, savedCount: 3, firstSave: false },
    });
    expectContract(removed, UNSAVE, removedBody);
    const once = (await (
      await naomi.json(`/api/v1/saved-artists/${String(elijah)}`, 'DELETE')
    ).json()) as SavedState;
    expect(once.data.savedCount).toBe(3);
  });

  it("says so once on a booker's first ever save", async () => {
    const ruth = await signedIn(await freshBooker());
    const elijah = await idOf('elijah-park');

    const first = (await (
      await ruth.json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')
    ).json()) as SavedState;
    expect(first.data.firstSave).toBe(true);
    expect(first.data.savedCount).toBe(1);
    expect((await ruth.json(`/api/v1/saved-artists/${String(elijah)}`, 'DELETE')).status).toBe(200);
    const next = (await (
      await ruth.json(`/api/v1/saved-artists/${String(elijah)}`, 'PUT')
    ).json()) as SavedState;
    expect(next.data.firstSave).toBe(false);
  });

  it('refuses the 201st save and changes nothing', async () => {
    const email = await freshBooker();
    const [booker] = await query<{ id: number }>(sql`select id from users where email = ${email}`);
    const bookerId = booker?.id ?? 0;
    for (let i = 0; i < 200; i++) {
      const [owner] = await db()
        .insert(users)
        .values({
          name: `Artist ${String(i)}`,
          email: `artist${String(i)}@example.ca`,
          password: 'x',
        })
        .returning({ id: users.id });
      const [artist] = await db()
        .insert(artists)
        .values({
          userId: owner?.id ?? 0,
          slug: `artist-${String(i)}`,
          ticketNumber: `ACT-8${String(i)}`,
          displayName: `Artist ${String(i)}`,
          actType: ActType.Solo,
          baseCity: 'Brampton',
          baseLatitude: 43.7315,
          baseLongitude: -79.7624,
          maxDriveKm: 80,
          fromPriceCents: 50000,
          status: ArtistStatus.Approved,
          publishedAt: now().toJSDate(),
        })
        .returning({ id: artists.id });
      await db()
        .insert(savedArtists)
        .values({ userId: bookerId, artistId: artist?.id ?? 0 });
    }
    const ruth = await signedIn(email);

    const response = await ruth.json(
      `/api/v1/saved-artists/${String(await idOf('elijah-park'))}`,
      'PUT',
    );

    expect(response.status).toBe(422);
    const body = (await response.json()) as { type: string };
    expect(body.type).toBe(`${config().problemsBaseUri}/saved-artist-limit`);
    expectContract(response, SAVE, body);
    const [count] = await query<{ total: number }>(
      sql`select count(*)::int as total from saved_artists where user_id = ${bookerId}`,
    );
    expect(count?.total).toBe(200);
  });

  it('cannot save a suspended or unknown artist', async () => {
    const naomi = await signedIn(NAOMI);

    expect(
      (await naomi.json(`/api/v1/saved-artists/${String(await idOf('selah-brooks'))}`, 'PUT'))
        .status,
    ).toBe(404);
    expect((await naomi.json('/api/v1/saved-artists/999999', 'PUT')).status).toBe(404);
  });

  it('gives an artist no saved artists', async () => {
    const abigail = await signedIn(ABIGAIL);

    expect((await abigail.json('/api/v1/saved-artists/ids', 'GET')).status).toBe(404);
    expect(
      (await abigail.json(`/api/v1/saved-artists/${String(await idOf('elijah-park'))}`, 'PUT'))
        .status,
    ).toBe(404);
  });

  it('gives a guest 401', async () => {
    const guest = new Browser();
    await guest.request('/api/v1/csrf-cookie');

    expect(
      (await guest.json(`/api/v1/saved-artists/${String(await idOf('elijah-park'))}`, 'PUT'))
        .status,
    ).toBe(401);
  });

  it('carries the id and pronoun for the toggle on lineup cards and profiles', async () => {
    const profile = await api('/api/v1/artists/abigail-mensah');
    expect(profile.status).toBe(200);
    const profileBody = (await profile.json()) as { data: { id: number; pronoun: string } };
    expect(profileBody.data.id).toBe(await idOf('abigail-mensah'));
    expect(profileBody.data.pronoun).toBe('she');

    const search = await api(
      '/api/v1/search?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120',
    );
    expect(search.status).toBe(200);
    const searchBody = (await search.json()) as {
      data: { slug: string; id: number; pronoun: string }[];
    };
    const card = searchBody.data.find((item) => item.slug === 'elijah-park');
    expect(card?.id).toBe(await idOf('elijah-park'));
    expect(card?.pronoun).toBe('he');
    expectContract(search, SEARCH, searchBody);
  });

  async function idOf(slug: string): Promise<number> {
    const [row] = await query<{ id: number }>(sql`select id from artists where slug = ${slug}`);
    return row?.id ?? 0;
  }
});
