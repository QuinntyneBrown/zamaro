import type { GeocodedAddress, Geocoder } from '@/server/contracts/geocoder';
import { anchor, TOWNS } from '@/server/integrations/routing/cast-routes';

/**
 * Deterministic geocoder for development and tests (ADR-0002): resolves the towns in cast-routes,
 * ignoring case and a trailing ", ON", to the same anchors the fake router uses, and the cast's
 * church addresses ("2150 Lakeshore Road, Burlington, ON L7R 1A3") to their towns. Any other street
 * address cannot be found.
 */
export class FakeGeocoder implements Geocoder {
  /** "street, town" in lower case => the town's anchor. */
  static readonly STREETS: Record<string, string> = {
    '2150 lakeshore road, burlington': 'Burlington',
    '180 elgin street, ottawa': 'Ottawa',
    '8150 main street east, milton': 'Milton',
  };

  geocode(address: string): Promise<GeocodedAddress | null> {
    const squished = address.trim().replace(/\s+/g, ' ');
    const lower = squished.toLowerCase();
    for (const [street, town] of Object.entries(FakeGeocoder.STREETS)) {
      if (lower.startsWith(street)) {
        return Promise.resolve({ normalisedAddress: squished, city: town, point: anchor(town) });
      }
    }

    const town = squished
      .replace(/(,\s*|\s+)(ON|Ontario)$/i, '')
      .trim()
      .toLowerCase();
    for (const [name, place] of Object.entries(TOWNS)) {
      if (name.toLowerCase() === town) {
        return Promise.resolve({
          normalisedAddress: `${name}, ON`,
          city: name,
          point: anchor(place),
        });
      }
    }
    return Promise.resolve(null);
  }
}
