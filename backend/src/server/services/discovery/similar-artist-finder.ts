import type { DateTime } from 'luxon';
import { SearchSort, type Style } from '@/server/enums';
import { freeArtistIds } from '@/server/services/artist-availability/availability';
import { measuredCandidates } from './candidate-finder';
import { travels, type LineupCard, type SearchCriteria } from './lineup';
import { sortCards } from './lineup-sorter';

/** Artists free on `date` within `radiusKm` of the search location, nearest first. */
export interface SimilarArtists {
  date: DateTime;
  radiusKm: number;
  cards: LineupCard[];
}

export const SIMILAR_LIMIT = 3;

/**
 * Viewable artists to offer instead of one who cannot be booked: they share the style, are free on
 * the search date and pass the travel rule from the search location, nearest first as on Discover
 * (L2-021.1). `style` is null when the missing artist never existed: any style matches.
 */
export async function similarArtists(
  style: Style | null,
  search: SearchCriteria,
  limit = SIMILAR_LIMIT,
): Promise<SimilarArtists> {
  const criteria: SearchCriteria = {
    ...search,
    sort: SearchSort.Closest,
    filter: { styles: style === null ? [] : [style], under800: false },
  };
  const candidates = await measuredCandidates(criteria, criteria.radiusKm);
  const free = new Set(
    await freeArtistIds([...candidates.keys()], criteria.eventDate, criteria.kind),
  );
  const matches = [...candidates.values()].filter(
    (card) => free.has(card.artist.row.id) && travels(card, criteria.radiusKm),
  );
  return {
    date: criteria.eventDate,
    radiusKm: criteria.radiusKm,
    cards: sortCards(matches, SearchSort.Closest).slice(0, limit),
  };
}
