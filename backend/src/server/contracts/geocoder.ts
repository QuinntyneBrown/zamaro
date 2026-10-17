import type { Coordinates } from '@/server/services/discovery/coordinates';

export interface GeocodedAddress {
  /** As the location field shows it, e.g. "Burlington, ON". */
  normalisedAddress: string;
  city: string;
  point: Coordinates;
}

/**
 * Turns an address or town into coordinates. The vendor is chosen in M10; until then the fake
 * geocoder is bound (ADR-0002).
 */
export interface Geocoder {
  /** Null when the place cannot be resolved. */
  geocode(address: string): Promise<GeocodedAddress | null>;
}
