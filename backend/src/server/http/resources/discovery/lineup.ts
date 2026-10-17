import { z } from 'zod';
import { ActType, Pronoun, SearchSort, Style, valuesOf } from '@/server/enums';
import type { Lineup, LineupCard } from '@/server/services/discovery/lineup';
import { UNDER_800 } from '../../requests/discovery/search-artists';

/** One ticket in the lineup (L2-006): public fields only. */
export const LineupCardResource = z.object({
  /** For the save toggle (accounts/save-artist). */
  id: z.number().int(),
  slug: z.string(),
  pronoun: z.enum(valuesOf(Pronoun)),
  name: z.string(),
  actType: z.enum(valuesOf(ActType)),
  styles: z.array(z.enum(valuesOf(Style))),
  city: z.string(),
  distance: z.object({
    /** Whole kilometres by road. */
    km: z.number().int(),
    /** Rounded to 5 minutes. */
    driveMinutes: z.number().int(),
    /** Estimated from the straight line because routing was unavailable; show "about". */
    approximate: z.boolean(),
  }),
  /** Mean over distinct churches, one decimal; null until the first review. */
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  fromPrice: z.object({ cents: z.number().int(), currency: z.literal('CAD') }),
});

/** The headliner (L2-006.2): a lineup card plus the season it leads and its quote. */
export const HeadlinerResource = LineupCardResource.extend({
  /** "Most booked this autumn". */
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  /** The most recent visible 5-star review, at most 160 characters; null when there is none. */
  quote: z.object({ text: z.string(), reviewerName: z.string(), city: z.string() }).nullable(),
});

export const LineupResource = z.object({
  data: z.array(LineupCardResource),
  /** The first page only. */
  headliner: HeadlinerResource.nullable(),
  meta: z.object({
    /** How many artists are free and pass the filters, the headliner included. */
    total: z.number().int(),
    /** Cards per page, the headliner included on the first. */
    perPage: z.number().int(),
    /** Pass as `cursor` for the next page; null on the last page. */
    nextCursor: z.string().nullable(),
    sort: z.enum(valuesOf(SearchSort)),
    styles: z.array(z.enum(valuesOf(Style))),
    /** `under-800` when the price chip is on. */
    price: z.literal(UNDER_800).nullable(),
  }),
});

export type LineupCardResource = z.infer<typeof LineupCardResource>;
export type LineupResource = z.infer<typeof LineupResource>;

export function toLineupCardResource(card: LineupCard): LineupCardResource {
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
  };
}

export function toLineupResource(
  lineup: Lineup,
  criteria: { sort: SearchSort; filter: { styles: Style[]; under800: boolean } },
): LineupResource {
  return {
    data: lineup.tickets.map(toLineupCardResource),
    headliner:
      lineup.headliner === null
        ? null
        : { ...toLineupCardResource(lineup.headliner), season: lineup.season, quote: lineup.quote },
    meta: {
      total: lineup.total,
      perPage: 24,
      nextCursor: lineup.nextCursor,
      sort: criteria.sort,
      styles: criteria.filter.styles,
      price: criteria.filter.under800 ? UNDER_800 : null,
    },
  };
}
