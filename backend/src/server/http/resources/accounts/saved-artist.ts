import { DateTime } from 'luxon';
import { z } from 'zod';
import type {
  SavedArtistCard,
  SavedArtistList,
} from '@/server/actions/accounts/list-saved-artists';
import type { SavedArtistState } from '@/server/actions/accounts/save-artist';
import { ActType, Pronoun, Style, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/**
 * Where a saved artist stands after a save or removal, with the server's count so the header always
 * matches it (accounts/save-artist).
 */
export const SavedArtistStateResource = z.object({
  data: z.object({
    artistId: z.number().int(),
    saved: z.boolean(),
    /** The booker's saved artists now. */
    savedCount: z.number().int(),
    /** The booker's first save ever: "Saved artists are private" shows once. */
    firstSave: z.boolean(),
  }),
});

export const SavedArtistIdsResource = z.object({
  data: z.object({ artistIds: z.array(z.number().int()), count: z.number().int() }),
});

/** One saved artist's ticket (L2-027): the lineup card's public fields, when it was saved and whether free. */
export const SavedArtistCardResource = z.object({
  id: z.number().int(),
  slug: z.string(),
  pronoun: z.enum(valuesOf(Pronoun)),
  name: z.string(),
  actType: z.enum(valuesOf(ActType)),
  styles: z.array(z.enum(valuesOf(Style))),
  city: z.string(),
  /** From the booker's church; null until they have one. */
  distance: z
    .object({ km: z.number().int(), driveMinutes: z.number().int(), approximate: z.boolean() })
    .nullable(),
  /** Mean over distinct churches, one decimal; null until the first review. */
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  fromPrice: z.object({ cents: z.number().int(), currency: z.literal('CAD') }),
  /** When the booker saved the artist. */
  savedAt: z.string(),
  /** On the date asked for; null when no date was given. */
  availability: z.enum(['free', 'booked']).nullable(),
});

export const SavedArtistListResource = z.object({
  data: z.object({
    artists: z.array(SavedArtistCardResource),
    /** Visible saved artists; a suspended one is not counted. */
    total: z.number().int(),
    /** The date the artists were checked against, or null. */
    date: z.iso.date().nullable(),
  }),
});

export function toSavedArtistStateResource(
  state: SavedArtistState,
): z.infer<typeof SavedArtistStateResource> {
  return { data: state };
}

export function toSavedArtistCardResource(
  card: SavedArtistCard,
): z.infer<typeof SavedArtistCardResource> {
  const { row, styles, rating } = card.artist;
  return {
    id: row.id,
    slug: row.slug,
    pronoun: row.pronoun,
    name: row.displayName,
    actType: row.actType,
    styles,
    city: row.baseCity,
    distance: card.distance,
    rating: rating?.rating ?? null,
    reviewCount: rating?.reviewCount ?? 0,
    fromPrice: { cents: row.fromPriceCents, currency: 'CAD' },
    savedAt: DateTime.fromJSDate(card.savedAt, { zone: ZONE }).toISO() ?? '',
    availability: card.free === null ? null : card.free ? 'free' : 'booked',
  };
}

export function toSavedArtistListResource(
  list: SavedArtistList,
): z.infer<typeof SavedArtistListResource> {
  return {
    data: {
      artists: list.cards.map(toSavedArtistCardResource),
      total: list.cards.length,
      date: list.date?.toISODate() ?? null,
    },
  };
}
