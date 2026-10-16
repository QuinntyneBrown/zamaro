import { RoutingUnavailable } from '@/server/contracts/routing-provider';
import { cache, routingProvider } from '@/server/integrations/bindings';
import { logger } from '@/server/support/logger';
import type { Coordinates } from './coordinates';
import { distanceFromRoute, type Distance } from './distance';

/**
 * Driving distances between an event location and artists' bases (L2-002). Road distances are cached
 * per pair of coordinates rounded to 4 decimal places for 30 days. When routing is unavailable the
 * straight line x 1.3 stands in, marked approximate and never cached.
 */
const CACHE_SECONDS = 30 * 24 * 60 * 60;
const STRAIGHT_LINE_FACTOR = 1.3;
/** Average speed for an estimated drive time, matching the radius labels ("120 km · 1.5 hr"). */
const ESTIMATE_KM_PER_HOUR = 80;

interface CachedDistance {
  km: number;
  driveMinutes: number;
}

/** One distance per destination, in the same order. */
export async function distancesFromOrigin(
  origin: Coordinates,
  destinations: Coordinates[],
): Promise<Distance[]> {
  const distances: (Distance | undefined)[] = [];
  const misses: number[] = [];
  for (const [index, destination] of destinations.entries()) {
    const cached = await cache().get<CachedDistance>(cacheKey(origin, destination));
    distances[index] =
      cached === undefined
        ? undefined
        : { km: cached.km, driveMinutes: cached.driveMinutes, approximate: false };
    if (cached === undefined) misses.push(index);
  }

  if (misses.length > 0) {
    const routed = await route(
      origin,
      misses.map((index) => destinations[index] as Coordinates),
    );
    for (const [position, index] of misses.entries()) {
      distances[index] = routed[position];
    }
  }
  return distances.map((distance) => distance ?? { km: 0, driveMinutes: 0, approximate: true });
}

async function route(origin: Coordinates, destinations: Coordinates[]): Promise<Distance[]> {
  let legs;
  try {
    legs = await routingProvider().matrix(origin, destinations);
  } catch (error) {
    if (!(error instanceof RoutingUnavailable)) throw error;
    logger().warn(
      { reason: error.message, destinations: destinations.length },
      'routing.unavailable',
    );
    return destinations.map((destination) => estimate(origin, destination));
  }

  const distances: Distance[] = [];
  for (const [index, destination] of destinations.entries()) {
    const leg = legs[index];
    const distance =
      leg === undefined
        ? estimate(origin, destination)
        : distanceFromRoute(leg.metres, leg.seconds);
    if (!distance.approximate) {
      await cache().put(
        cacheKey(origin, destination),
        { km: distance.km, driveMinutes: distance.driveMinutes } satisfies CachedDistance,
        CACHE_SECONDS,
      );
    }
    distances.push(distance);
  }
  return distances;
}

function estimate(origin: Coordinates, destination: Coordinates): Distance {
  const km = origin.straightLineKmTo(destination) * STRAIGHT_LINE_FACTOR;
  return distanceFromRoute(
    Math.round(km * 1000),
    Math.round((km / ESTIMATE_KM_PER_HOUR) * 3600),
    true,
  );
}

/** The same key whichever way round the pair is asked. */
function cacheKey(a: Coordinates, b: Coordinates): string {
  return `distance:${[a.key(), b.key()].sort().join('|')}`;
}
