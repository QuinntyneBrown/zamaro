import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { availabilityRules } from '@/server/db/schema';
import { ownArtistId } from '@/server/services/artist-availability/own-artist';

/**
 * Replaces the artist's weekly default (L2-056.2): the ISO weekdays (1 is Monday) they are
 * unavailable unless a dated override says otherwise. One transaction, so a search never sees half
 * of it. Open requests the new default covers are not declined; they stay Requested.
 */
export async function setWeeklyAvailability(
  userId: number,
  unavailableWeekdays: number[],
): Promise<number[]> {
  const artistId = await ownArtistId(userId);
  await db().transaction(async (tx) => {
    await tx.delete(availabilityRules).where(eq(availabilityRules.artistId, artistId));
    if (unavailableWeekdays.length === 0) return;
    await tx
      .insert(availabilityRules)
      .values(unavailableWeekdays.map((weekday) => ({ artistId, weekday, unavailable: true })));
  });
  return [...unavailableWeekdays].sort((a, b) => a - b);
}
