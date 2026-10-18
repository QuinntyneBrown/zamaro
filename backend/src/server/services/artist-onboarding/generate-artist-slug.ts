import { eq } from 'drizzle-orm';
import type { Transaction } from '@/server/db/client';
import { artists, slugHistories } from '@/server/db/schema';
import { slug as slugify } from '@/server/support/strings';

/** Words an artist's address may not be: they are routes of the public site (M4 D15). */
const RESERVED = new Set(['apply', 'preview', 'new', 'edit', 'search', 'admin', 'api']);

/**
 * The address a newly approved artist gets (M3 D4): the name's slug, then `-2`, `-3` and so on when
 * an artist holds it now or held it before (ADR-0011). A name with no ASCII letters becomes
 * `artist-` and the ticket's digits, so the address is never empty.
 */
export async function generateArtistSlug(
  tx: Transaction,
  name: string,
  ticketNumber: string,
): Promise<string> {
  const base = slugify(name) || `artist-${ticketNumber.replace(/\D/g, '')}`;
  for (let attempt = 1; ; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${String(attempt)}`;
    if (RESERVED.has(candidate)) continue;
    const [current] = await tx
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.slug, candidate));
    const [retired] = await tx
      .select({ id: slugHistories.id })
      .from(slugHistories)
      .where(eq(slugHistories.slug, candidate));
    if (current === undefined && retired === undefined) return candidate;
  }
}
