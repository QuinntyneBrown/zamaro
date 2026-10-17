import type {
  RouteLeg,
  RoutingProvider,
  RoutingUnavailable,
} from '@/server/contracts/routing-provider';
import { Coordinates } from '@/server/services/discovery/coordinates';
import { anchor, ANCHORS, ROAD_KM } from './cast-routes';

/**
 * Deterministic router for development and tests (ADR-0002). A point within 2 km of a cast anchor
 * snaps to it; known anchor pairs use the mock's road distance, anything else straight-line
 * distance x 1.25. Drive time assumes 80 km/h, matching the radius labels ("120 km · 1.5 hr").
 */
const SNAP_KM = 2;
const ROAD_FACTOR = 1.25;
const KM_PER_HOUR = 80;

export class FakeRoutingProvider implements RoutingProvider {
  private readonly overrides = new Map<string, number>();
  private failure: RoutingUnavailable | undefined;
  private callCount = 0;

  matrix(origin: Coordinates, destinations: Coordinates[]): Promise<RouteLeg[]> {
    this.callCount++;
    if (this.failure !== undefined) return Promise.reject(this.failure);
    return Promise.resolve(
      destinations.map((destination) => {
        const km = this.roadKm(origin, destination);
        return {
          metres: Math.round(km * 1000),
          seconds: Math.round((km / KM_PER_HOUR) * 3600),
        };
      }),
    );
  }

  /** Test hook: the road distance between two points, whichever way round they are asked. */
  override(from: Coordinates, to: Coordinates, km: number): void {
    this.overrides.set(pairKey(from, to), km);
  }

  /** Test hook: every call fails until recover() (as the vendor timing out). */
  failWith(failure: RoutingUnavailable): void {
    this.failure = failure;
  }

  recover(): void {
    this.failure = undefined;
  }

  /** Test hook: how many matrix calls were made. */
  calls(): number {
    return this.callCount;
  }

  private roadKm(from: Coordinates, to: Coordinates): number {
    const overridden = this.overrides.get(pairKey(from, to));
    if (overridden !== undefined) return overridden;
    const a = snap(from);
    const b = snap(to);
    if (a !== undefined && b !== undefined) {
      for (const [x, y, km] of ROAD_KM) {
        if ((x === a && y === b) || (x === b && y === a)) return km;
      }
    }
    return from.straightLineKmTo(to) * ROAD_FACTOR;
  }
}

function snap(point: Coordinates): string | undefined {
  return Object.keys(ANCHORS).find((place) => point.straightLineKmTo(anchor(place)) <= SNAP_KM);
}

function pairKey(a: Coordinates, b: Coordinates): string {
  return [a.key(), b.key()].sort().join('|');
}
