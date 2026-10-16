import type { Coordinates } from '@/server/services/discovery/coordinates';

export interface RouteLeg {
  metres: number;
  seconds: number;
}

/** The vendor failed or took longer than 2 seconds; the search falls back to an estimate (L2-002.3). */
export class RoutingUnavailable extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'RoutingUnavailable';
  }
}

/**
 * Driving distances from a routing vendor (L2-002). One matrix call covers every destination of a
 * search. The vendor is chosen in M10; until then the fake router is bound (ADR-0002).
 */
export interface RoutingProvider {
  /** One leg per destination, in the same order. @throws RoutingUnavailable */
  matrix(origin: Coordinates, destinations: Coordinates[]): Promise<RouteLeg[]>;
}
