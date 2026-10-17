import { z } from 'zod';
import type { ArtistProfile } from '@/server/actions/artist-profiles/show-artist-profile';
import { encodeReviewCursor, type ReviewPage } from '@/server/actions/reviews/list-artist-reviews';
import type { PhotoRendition } from '@/server/db/schema';
import { ActType, MusicalKey, Pronoun, Style, valuesOf } from '@/server/enums';
import { mediaUrl } from '@/server/support/media';
import { ReviewResource, toReviewResource } from '../reviews/review';

/** The photo rendition used as `src`; browsers pick from the srcsets. */
const PHOTO_SRC_WIDTH = 800;
/** Poster frames are stored as one 16:9 WebP. */
const POSTER_WIDTH = 800;
const POSTER_HEIGHT = 450;

/**
 * The public profile. Every field is listed here on purpose: coordinates, the account email, phone
 * numbers and payout data never leave the server (L2-083).
 */
export const ArtistProfileResource = z.object({
  data: z.object({
    /** For the Save button (accounts/save-artist). */
    id: z.number().int(),
    slug: z.string(),
    displayName: z.string(),
    /** A solo act's first name, or a group's whole name, for "Songs Abigail leads". */
    firstName: z.string(),
    pronoun: z.enum(valuesOf(Pronoun)),
    actType: z.enum(valuesOf(ActType)),
    headline: z.string(),
    /** Null when the artist has not set one: show "About {firstName}". */
    aboutHeading: z.string().nullable(),
    /** Plain text; paragraphs are separated by a blank line. Never render it as HTML. */
    bio: z.string(),
    /** The city only, never an address (L2-083). */
    baseCity: z.string(),
    maxDriveKm: z.number().int(),
    fromPrice: z.object({ cents: z.number().int(), currency: z.literal('CAD') }),
    ticketNumber: z.string(),
    rating: z.number().nullable(),
    reviewCount: z.number().int(),
    styles: z.array(z.enum(valuesOf(Style))),
    setlist: z.array(
      z.object({
        position: z.number().int(),
        title: z.string(),
        writer: z.string().nullable(),
        /** A key such as `B-flat` or `E-minor`, or `any`. */
        key: z.enum(valuesOf(MusicalKey)),
      }),
    ),
    /** In the artist's order. `src` is the 800 px WebP, and `width` and `height` are its size. */
    photos: z.array(
      z.object({
        id: z.string(),
        /** The artist's alt text (L2-015.1). */
        alt: z.string(),
        src: z.string(),
        width: z.number().int(),
        height: z.number().int(),
        /** WebP renditions with width descriptors (400, 800, 1200 and 1600 px). */
        srcset: z.string(),
        /** The same widths in AVIF. */
        avifSrcset: z.string(),
      }),
    ),
    /** Live videos only, in the artist's order (L2-014.3). */
    videos: z.array(
      z.object({
        id: z.string(),
        /** Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton". */
        title: z.string(),
        durationSeconds: z.number().int(),
        /** The poster frame, or null to keep the halftone placeholder. */
        poster: z
          .object({ src: z.string(), width: z.number().int(), height: z.number().int() })
          .nullable(),
        /** The HLS manifest of the adaptive renditions. */
        stream: z.string(),
        /** The artist's WebVTT captions, or null when they supplied none (L2-014.2). */
        captions: z.object({ src: z.string(), lang: z.string() }).nullable(),
      }),
    ),
    /** The newest visible reviews, so the section renders without a second request. */
    reviews: z.object({
      /** Visible reviews in all, for "Show all 38 reviews". */
      total: z.number().int(),
      /** Up to 4, newest first. */
      items: z.array(ReviewResource),
      /** Pass as `cursor` to `GET /artists/{slug}/reviews` for the rest; null when there are no more. */
      nextCursor: z.string().nullable(),
    }),
  }),
});

export type ArtistProfileResource = z.infer<typeof ArtistProfileResource>;

/** What profile copy calls the artist: a solo act's first name, a group's whole name. */
export function firstName(profile: ArtistProfile): string {
  const { displayName, actType } = profile.artist;
  return actType === ActType.Solo ? (displayName.split(' ')[0] ?? displayName) : displayName;
}

export function toArtistProfileResource(
  profile: ArtistProfile,
  reviews: { page: ReviewPage; total: number },
): ArtistProfileResource {
  const { artist } = profile;
  return {
    data: {
      id: artist.id,
      slug: artist.slug,
      displayName: artist.displayName,
      firstName: firstName(profile),
      pronoun: artist.pronoun,
      actType: artist.actType,
      headline: artist.headline,
      aboutHeading: artist.aboutHeading,
      bio: artist.bio ?? '',
      baseCity: artist.baseCity,
      maxDriveKm: artist.maxDriveKm,
      fromPrice: { cents: artist.fromPriceCents, currency: 'CAD' },
      ticketNumber: artist.ticketNumber,
      rating: profile.rating?.rating ?? null,
      reviewCount: profile.rating?.reviewCount ?? 0,
      styles: profile.styles,
      setlist: profile.setlist.map((song) => ({
        position: song.position,
        title: song.title,
        writer: song.writer,
        key: song.key,
      })),
      photos: profile.photos.map((photo) => ({
        id: photo.id,
        alt: photo.altText,
        src: mediaUrl(rendition(photo.renditions, 'webp', PHOTO_SRC_WIDTH)),
        width: PHOTO_SRC_WIDTH,
        height: Math.round((photo.height * PHOTO_SRC_WIDTH) / photo.width),
        srcset: srcset(photo.renditions, 'webp'),
        avifSrcset: srcset(photo.renditions, 'avif'),
      })),
      videos: profile.videos.map((video) => ({
        id: video.id,
        title: video.title,
        durationSeconds: video.durationSeconds ?? 0,
        poster:
          video.posterKey === null
            ? null
            : { src: mediaUrl(video.posterKey), width: POSTER_WIDTH, height: POSTER_HEIGHT },
        stream: mediaUrl(video.manifestKey ?? ''),
        captions:
          video.captionsKey === null ? null : { src: mediaUrl(video.captionsKey), lang: 'en' },
      })),
      reviews: {
        total: reviews.total,
        items: reviews.page.items.map(toReviewResource),
        nextCursor:
          reviews.page.nextCursor === null ? null : encodeReviewCursor(reviews.page.nextCursor),
      },
    },
  };
}

/** The renditions in one format, narrowest first. */
function renditionsIn(renditions: PhotoRendition[], format: string): PhotoRendition[] {
  return renditions
    .filter((candidate) => candidate.format === format)
    .sort((a, b) => a.width - b.width);
}

function srcset(renditions: PhotoRendition[], format: string): string {
  return renditionsIn(renditions, format)
    .map((candidate) => `${mediaUrl(candidate.key)} ${String(candidate.width)}w`)
    .join(', ');
}

function rendition(renditions: PhotoRendition[], format: string, width: number): string {
  return renditionsIn(renditions, format).find((candidate) => candidate.width === width)?.key ?? '';
}
