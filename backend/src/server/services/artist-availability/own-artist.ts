import { eq } from 'drizzle-orm';
import { db, type Database, type Transaction } from '@/server/db/client';
import { artists } from '@/server/db/schema';
import { HttpProblem, ProblemType } from '@/server/support/problems';

/** The artist the signed-in user is; anyone else has no artist workspace and gets the 404 (L2-074). */
export async function ownArtistId(
  userId: number,
  database: Database | Transaction = db(),
): Promise<number> {
  const [artist] = await database
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.userId, userId));
  if (artist === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  return artist.id;
}
