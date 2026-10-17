import { eq, isNotNull, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, artistStyles, slugHistories } from '@/server/db/schema';
import { Style, valuesOf } from '@/server/enums';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export type ArtistRow = typeof artists.$inferSelect;

/**
 * The address is one of a viewable artist's retired slugs (L2-021.3, L2-055.3). Rendered as a 301 to
 * the same route under the current slug, with the query string kept.
 */
export class ArtistMoved extends Error {
  constructor(readonly currentSlug: string) {
    super('The artist has a new address.');
    this.name = 'ArtistMoved';
  }
}

/**
 * No viewable artist has the address (L2-021): it never existed, or the artist is hidden. Rendered
 * as the `artist-not-found` problem; the profile adds the similar artists. It carries the hidden
 * artist's primary style and nothing else of theirs, so the body cannot tell the two cases apart.
 */
export class ArtistNotFound extends HttpProblem {
  constructor(
    readonly primaryStyle: Style | null = null,
    extensions: Record<string, unknown> = {},
  ) {
    super(ProblemType.ArtistNotFound, { detail: 'No artist has that address.', extensions });
    this.name = 'ArtistNotFound';
  }

  withSimilarArtists(similarArtists: unknown): ArtistNotFound {
    return new ArtistNotFound(this.primaryStyle, { similarArtists });
  }
}

/** Shown to the public: approved, payout set up and published (L2-005.4, L2-048.3). */
export function isVisible(artist: ArtistRow): boolean {
  return artist.status === 'approved' && artist.payoutReady && artist.publishedAt !== null;
}

/**
 * Turns `/artists/{slug}` into a viewable artist (ADR-0011), for every route under it. A retired slug
 * follows its history straight to the artist, so a chain of renames is one hop. A slug that never
 * existed and a hidden artist end alike (L2-021.2).
 */
export async function resolveArtistSlug(slug: string): Promise<ArtistRow> {
  const [current] = await db().select().from(artists).where(eq(artists.slug, slug));
  let artist = current;
  if (artist === undefined) {
    const [retired] = await db()
      .select({ artist: artists })
      .from(slugHistories)
      .innerJoin(artists, eq(artists.id, slugHistories.artistId))
      .where(and(eq(slugHistories.slug, slug), isNotNull(slugHistories.retiredAt)));
    artist = retired?.artist;
  }
  if (artist === undefined) throw new ArtistNotFound();
  if (!isVisible(artist)) throw new ArtistNotFound(await primaryStyle(artist.id));
  if (artist.slug !== slug) throw new ArtistMoved(artist.slug);
  return artist;
}

/** The first of the artist's styles in the chips' order: "solo vocalist" for Abigail (L2-021.1). */
async function primaryStyle(artistId: number): Promise<Style | null> {
  const order = valuesOf(Style);
  const rows = await db()
    .select({ style: artistStyles.style })
    .from(artistStyles)
    .where(eq(artistStyles.artistId, artistId));
  return (
    rows.map((row) => row.style).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] ?? null
  );
}
