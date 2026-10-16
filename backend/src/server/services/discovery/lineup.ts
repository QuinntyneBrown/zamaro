import type { DateTime } from 'luxon';
import type { artistRatings, artists } from '@/server/db/schema';
import type { GatheringKind, SearchSort, Style } from '@/server/enums';
import type { Coordinates } from './coordinates';
import type { Distance } from './distance';
import type { Season } from './season';

/** An artist as the lineup shows them: the row, their styles in the chips' order and their rating. */
export interface LineupArtist {
  row: typeof artists.$inferSelect;
  styles: Style[];
  rating: typeof artistRatings.$inferSelect | null;
}

/** One artist in the lineup with their distance from the event. */
export interface LineupCard {
  artist: LineupArtist;
  distance: Distance;
}

/** The style chips (any selected style matches) and the Under $800 chip, which applies on top (L2-008). */
export interface LineupFilter {
  styles: Style[];
  under800: boolean;
}

export const UNDER_PRICE_CENTS = 80000;

/** A validated search: who is free on `eventDate` within `radiusKm` of the event location. */
export interface SearchCriteria {
  eventDate: DateTime;
  kind: GatheringKind;
  location: Coordinates;
  radiusKm: number;
  sort: SearchSort;
  filter: LineupFilter;
}

/** The headliner's most recent visible 5-star review, cut to 160 characters at a word boundary. */
export interface HeadlinerQuote {
  text: string;
  reviewerName: string;
  city: string;
}

export const PER_PAGE = 24;

/**
 * One page of a search result (L2-006, L2-010): on the first page the headliner, then the tickets;
 * later pages hold tickets alone. `total` counts every artist free and in range, the headliner
 * included; `nextCursor` is null on the last page.
 */
export interface Lineup {
  headliner: LineupCard | null;
  quote: HeadlinerQuote | null;
  season: Season;
  tickets: LineupCard[];
  total: number;
  nextCursor: string | null;
}

/** The travel rule (L2-003): within both the radius and the artist's own limit. */
export function travels(card: LineupCard, radiusKm: number): boolean {
  return card.distance.km <= radiusKm && card.distance.km <= card.artist.row.maxDriveKm;
}
