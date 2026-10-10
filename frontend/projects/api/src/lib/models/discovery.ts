/** The kinds of gathering a booker searches for (L2-004); values are the API's slugs. */
export const GATHERING_KINDS = [
  'sunday-service',
  'worship-night',
  'youth-event',
  'conference-or-retreat',
  'wedding',
  'funeral-or-memorial',
] as const;
export type GatheringKind = (typeof GATHERING_KINDS)[number];

/** Driving radii in kilometres. */
export const RADII_KM = [40, 80, 120, 200] as const;
export type RadiusKm = (typeof RADII_KM)[number];

export type ActType = 'solo' | 'duo' | 'band' | 'choir';

/** The style chips, in their order on Discover (L2-008). */
export const STYLES = [
  'band',
  'solo-vocalist',
  'gospel-choir',
  'acoustic',
  'hymns',
  'spanish',
] as const;
export type Style = (typeof STYLES)[number];

/** How the tickets are ordered (L2-007). */
export const SEARCH_SORTS = ['closest', 'rating', 'price'] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

/** `GET /api/v1/search` query. */
export interface SearchQuery {
  /** `YYYY-MM-DD`. */
  date: string;
  kind: GatheringKind;
  lat: number;
  lng: number;
  radius: RadiusKm;
  sort: SearchSort;
  /** Any selected style matches. */
  styles: Style[];
  /** Only artists whose From price is below $800. */
  under800: boolean;
  /** The previous page's `nextCursor`; absent for the first page. */
  cursor?: string;
}

export interface Distance {
  km: number;
  driveMinutes: number;
  /** Estimated because routing was unavailable; shown as "about". */
  approximate: boolean;
}

export interface Money {
  cents: number;
  currency: 'CAD';
}

export interface LineupCard {
  slug: string;
  name: string;
  actType: ActType;
  styles: Style[];
  city: string;
  distance: Distance;
  rating: number | null;
  reviewCount: number;
  fromPrice: Money;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** The most booked artist this season, featured first (L2-006). */
export interface HeadlinerCard extends LineupCard {
  season: Season;
  /** The newest visible 5-star review, at most 160 characters; null when there is none. */
  quote: { text: string; reviewerName: string; city: string } | null;
}

export interface SearchResult {
  headliner: HeadlinerCard | null;
  /** The other artists, closest first. */
  cards: LineupCard[];
  /** Everyone free, the headliner included. */
  total: number;
  /** Pass as `cursor` for the next page; null on the last page (L2-010). */
  nextCursor: string | null;
}

/** Ways forward when nobody is free (L2-011). */
export interface SearchAlternatives {
  /** Up to three dates within 7 days either side, closest first. */
  nearbyDates: { date: string; count: number }[];
  /** The smallest wider radius with someone free, or null. */
  widerRadius: { km: RadiusKm; count: number } | null;
  /** Whether style or price filters narrowed the search. */
  filtersApplied: boolean;
}

/** A town's centre point from `GET /api/v1/places`. */
export interface Place {
  /** As the location field shows it: "Burlington, ON". */
  label: string;
  city: string;
  lat: number;
  lng: number;
}
