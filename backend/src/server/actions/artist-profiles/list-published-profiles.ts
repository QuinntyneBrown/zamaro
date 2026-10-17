import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists } from '@/server/db/schema';

/**
 * Every profile the public can open, for the sitemap (L2-112.3). Suspended, unpublished and deleted
 * artists fall outside the visible scope, as they do for the profile itself.
 */
export function listPublishedProfiles(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db()
    .select({ slug: artists.slug, updatedAt: artists.updatedAt })
    .from(artists)
    .where(
      and(
        eq(artists.status, 'approved'),
        eq(artists.payoutReady, true),
        isNotNull(artists.publishedAt),
      ),
    )
    .orderBy(asc(artists.slug));
}
