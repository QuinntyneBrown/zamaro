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
export type Style = 'band' | 'solo-vocalist' | 'gospel-choir' | 'acoustic' | 'hymns' | 'spanish';

/** `GET /api/v1/search` query. */
export interface SearchQuery {
  /** `YYYY-MM-DD`. */
  date: string;
  kind: GatheringKind;
  lat: number;
  lng: number;
  radius: RadiusKm;
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

export interface SearchResult {
  cards: LineupCard[];
  total: number;
}

/** A town's centre point from `GET /api/v1/places`. */
export interface Place {
  /** As the location field shows it: "Burlington, ON". */
  label: string;
  city: string;
  lat: number;
  lng: number;
}
