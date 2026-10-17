import { asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  artistPhotos,
  artistRatings,
  artistStyles,
  artistVideos,
  setlistSongs,
} from '@/server/db/schema';
import { Style, valuesOf } from '@/server/enums';
import {
  resolveArtistSlug,
  type ArtistRow,
} from '@/server/services/artist-profiles/resolve-artist-slug';

export interface ArtistProfile {
  artist: ArtistRow;
  styles: Style[];
  rating: typeof artistRatings.$inferSelect | null;
  setlist: (typeof setlistSongs.$inferSelect)[];
  photos: (typeof artistPhotos.$inferSelect)[];
  /** Live videos only, in the artist's order (L2-014.3). */
  videos: (typeof artistVideos.$inferSelect)[];
}

/**
 * A visible artist's public profile (L2-012): styles, rating, setlist, photos and live videos.
 * It reads no bookings, churches or account records. Throws ArtistMoved or ArtistNotFound.
 */
export async function showArtistProfile(slug: string): Promise<ArtistProfile> {
  const artist = await resolveArtistSlug(slug);
  return loadProfile(artist);
}

export async function loadProfile(artist: ArtistRow): Promise<ArtistProfile> {
  const order = valuesOf(Style);
  const [styleRows, [rating], setlist, photos, videos] = await Promise.all([
    db()
      .select({ style: artistStyles.style })
      .from(artistStyles)
      .where(eq(artistStyles.artistId, artist.id)),
    db().select().from(artistRatings).where(eq(artistRatings.artistId, artist.id)),
    db()
      .select()
      .from(setlistSongs)
      .where(eq(setlistSongs.artistId, artist.id))
      .orderBy(asc(setlistSongs.position)),
    db()
      .select()
      .from(artistPhotos)
      .where(eq(artistPhotos.artistId, artist.id))
      .orderBy(asc(artistPhotos.position)),
    db()
      .select()
      .from(artistVideos)
      .where(eq(artistVideos.artistId, artist.id))
      .orderBy(asc(artistVideos.position)),
  ]);
  return {
    artist,
    styles: styleRows.map((row) => row.style).sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    rating: rating ?? null,
    setlist,
    photos,
    videos: videos.filter((video) => video.status === 'live'),
  };
}
