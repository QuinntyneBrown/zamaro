import { SearchSort } from '@/server/enums';
import type { LineupCard } from './lineup';

/**
 * Orders the tickets below the headliner (L2-007). Artist id closes every order, so paging is
 * stable. A card's key is its position in the sort: smaller keys come first; the paging cursor
 * stores it.
 */
export function sortKey(card: LineupCard, sort: SearchSort): number[] {
  const rating = card.artist.rating;
  const id = card.artist.row.id;
  switch (sort) {
    case SearchSort.HighestRated:
      return [
        rating?.rating === null || rating?.rating === undefined ? 1 : 0,
        -(rating?.rating ?? 0),
        -(rating?.reviewCount ?? 0),
        card.distance.km,
        id,
      ];
    case SearchSort.PriceLowToHigh:
      return [card.artist.row.fromPriceCents, card.distance.km, id];
    default:
      return [card.distance.km, -(rating?.rating ?? 0), id];
  }
}

export function sortCards(cards: LineupCard[], sort: SearchSort): LineupCard[] {
  return [...cards].sort((a, b) => compareKeys(sortKey(a, sort), sortKey(b, sort)));
}

export function compareKeys(a: number[], b: number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
