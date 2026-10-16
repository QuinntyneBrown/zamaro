import { freeArtistIds } from '@/server/services/artist-availability/availability';
import { measuredCandidates } from '@/server/services/discovery/candidate-finder';
import { pickHeadliner, quoteFor } from '@/server/services/discovery/headliner-picker';
import {
  PER_PAGE,
  travels,
  type Lineup,
  type LineupCard,
  type SearchCriteria,
} from '@/server/services/discovery/lineup';
import { compareKeys, sortCards, sortKey } from '@/server/services/discovery/lineup-sorter';
import { encodeCursor } from '@/server/services/discovery/page-cursor';
import { seasonOf } from '@/server/services/discovery/season';
import { now } from '@/server/support/clock';

/**
 * Who is free on the date and within range (L2-003, L2-005): the headliner first (L2-006), then the
 * tickets closest first; ties go to the higher rating, then the lower artist id. `after` is the sort
 * key to continue after, from a decoded page cursor.
 */
export async function searchAvailableArtists(
  criteria: SearchCriteria,
  after: number[] | null = null,
): Promise<Lineup> {
  const today = now();
  const cards = await matches(criteria);
  const headliner = await pickHeadliner(cards, today);
  let tickets = sortCards(
    cards.filter((card) => card !== headliner),
    criteria.sort,
  );

  // The first page holds the headliner and 23 tickets; later pages hold 24 tickets.
  const firstPage = after === null;
  if (after !== null) {
    tickets = tickets.filter((card) => compareKeys(sortKey(card, criteria.sort), after) > 0);
  }
  const size = firstPage && headliner !== null ? PER_PAGE - 1 : PER_PAGE;
  const page = tickets.slice(0, size);
  const last = page.at(-1);

  return {
    headliner: firstPage ? headliner : null,
    quote: firstPage && headliner !== null ? await quoteFor(headliner) : null,
    season: seasonOf(today),
    tickets: page,
    total: cards.length,
    nextCursor:
      tickets.length > size && last !== undefined
        ? encodeCursor(criteria.sort, sortKey(last, criteria.sort))
        : null,
  };
}

async function matches(criteria: SearchCriteria): Promise<LineupCard[]> {
  const candidates = await measuredCandidates(criteria, criteria.radiusKm);
  const free = new Set(
    await freeArtistIds([...candidates.keys()], criteria.eventDate, criteria.kind),
  );
  return [...candidates.values()].filter(
    (card) => free.has(card.artist.row.id) && travels(card, criteria.radiusKm),
  );
}
