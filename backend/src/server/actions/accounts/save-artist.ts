import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, savedArtists, users } from '@/server/db/schema';
import { ArtistStatus } from '@/server/enums';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';

/** Where a saved artist stands after a save or removal, with the server's count (accounts/save-artist). */
export interface SavedArtistState {
  artistId: number;
  saved: boolean;
  savedCount: number;
  firstSave: boolean;
}

export const SAVED_ARTIST_LIMIT = 200;

/**
 * Saves an artist for a booker (L2-026): only an approved, published artist, at most 200 per booker.
 * The booker's row is locked so two saves at once cannot pass the limit together; saving twice is
 * the same as once.
 *
 * @throws HttpProblem NotFound for an artist who is not approved and published
 * @throws HttpProblem SavedArtistLimit at 200
 */
export async function saveArtist(bookerId: number, artistId: number): Promise<SavedArtistState> {
  const [artist] = await db()
    .select({ id: artists.id })
    .from(artists)
    .where(
      and(
        eq(artists.id, artistId),
        eq(artists.status, ArtistStatus.Approved),
        isNotNull(artists.publishedAt),
      ),
    );
  if (artist === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }

  return db().transaction(async (tx) => {
    const [locked] = await tx
      .select({ firstSavedAt: users.firstSavedAt })
      .from(users)
      .where(eq(users.id, bookerId))
      .for('update');
    const [already] = await tx
      .select({ id: savedArtists.id })
      .from(savedArtists)
      .where(and(eq(savedArtists.userId, bookerId), eq(savedArtists.artistId, artistId)));
    if (already === undefined && (await countSaved(tx, bookerId)) >= SAVED_ARTIST_LIMIT) {
      throw new HttpProblem(ProblemType.SavedArtistLimit, {
        detail: `You can save up to ${String(SAVED_ARTIST_LIMIT)} artists.`,
      });
    }
    await tx
      .insert(savedArtists)
      .values({ userId: bookerId, artistId, createdAt: now().toJSDate() })
      .onConflictDoNothing();
    const firstSave = locked?.firstSavedAt === null;
    if (firstSave) {
      await tx.update(users).set({ firstSavedAt: now().toJSDate() }).where(eq(users.id, bookerId));
    }
    return { artistId, saved: true, savedCount: await countSaved(tx, bookerId), firstSave };
  });
}

/** Removes a saved artist (L2-026); removing one that was not saved changes nothing. */
export async function unsaveArtist(bookerId: number, artistId: number): Promise<SavedArtistState> {
  await db()
    .delete(savedArtists)
    .where(and(eq(savedArtists.userId, bookerId), eq(savedArtists.artistId, artistId)));
  return { artistId, saved: false, savedCount: await countSaved(db(), bookerId), firstSave: false };
}

/** The ids a booker saved, for the hearts on every ticket and the header's count. */
export async function savedArtistIds(bookerId: number): Promise<number[]> {
  const rows = await db()
    .select({ artistId: savedArtists.artistId })
    .from(savedArtists)
    .where(eq(savedArtists.userId, bookerId));
  return rows.map((row) => row.artistId);
}

async function countSaved(
  database: Pick<ReturnType<typeof db>, 'select'>,
  bookerId: number,
): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(savedArtists)
    .where(eq(savedArtists.userId, bookerId));
  return row?.total ?? 0;
}
