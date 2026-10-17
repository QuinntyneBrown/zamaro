import { and, asc, eq, isNull, lt } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artistVideos, uploads } from '@/server/db/schema';
import { deleteParts, PART_PREFIX } from '@/server/actions/artist-onboarding/application-videos';
import { disk } from '@/server/integrations/storage/disks';
import { now } from '@/server/support/clock';
import { run } from './run';

/**
 * `npm run uploads:prune-unattached`: an applicant's video that no application claimed within 24
 * hours goes, with its parts, its original, its renditions and its upload row (apply-as-artist, M3
 * D7).
 *
 * @returns how many videos went
 */
export const KEEP_HOURS = 24;

export async function pruneUnattachedUploads(): Promise<number> {
  const stale = await db()
    .select()
    .from(artistVideos)
    .where(
      and(
        isNull(artistVideos.artistId),
        isNull(artistVideos.artistApplicationId),
        lt(artistVideos.createdAt, now().minus({ hours: KEEP_HOURS }).toJSDate()),
      ),
    )
    .orderBy(asc(artistVideos.createdAt));
  for (const video of stale) {
    await deleteParts(await disk('quarantine').list(`${PART_PREFIX}/${video.uploadToken ?? ''}`));
    const [upload] =
      video.uploadId === null
        ? []
        : await db().select().from(uploads).where(eq(uploads.id, video.uploadId));
    if (upload?.quarantineKey != null) await disk('quarantine').delete(upload.quarantineKey);
    if (upload?.objectKey != null) await disk('originals').delete(upload.objectKey);
    if (video.manifestKey !== null) {
      const folder = video.manifestKey.slice(0, video.manifestKey.lastIndexOf('/'));
      for (const key of await disk('media').list(folder)) await disk('media').delete(key);
    }
    await db().delete(artistVideos).where(eq(artistVideos.id, video.id));
    if (upload !== undefined) await db().delete(uploads).where(eq(uploads.id, upload.id));
  }
  return stale.length;
}

if (process.argv[1]?.endsWith('uploads-prune-unattached.ts') === true) {
  run(async () => {
    const deleted = await pruneUnattachedUploads();
    console.log(`Deleted ${String(deleted)} unattached video${deleted === 1 ? '' : 's'}.`);
  });
}
