import { config } from '@config/zamaro';
import type { Geocoder } from '@/server/contracts/geocoder';
import type { RoutingProvider } from '@/server/contracts/routing-provider';
import { FakeGeocoder } from './geocoding/fake-geocoder';
import { FakeRoutingProvider } from './routing/fake-routing-provider';

/**
 * The composition root for outside vendors (ADR-0002, ADR-0028): each port resolves to its adapter,
 * a deterministic fake until the vendor arrives in M10. Production refuses a fake. Tests bind their
 * own through the `use*()` seams and read the fake's hooks through the same accessors.
 */
let geocoderInstance: Geocoder | undefined;
let routingInstance: RoutingProvider | undefined;

export function geocoder(): Geocoder {
  geocoderInstance ??= fake('Geocoder', () => new FakeGeocoder());
  return geocoderInstance;
}

export function useGeocoder(next: Geocoder | undefined): void {
  geocoderInstance = next;
}

export function routingProvider(): RoutingProvider {
  routingInstance ??= fake('RoutingProvider', () => new FakeRoutingProvider());
  return routingInstance;
}

export function useRoutingProvider(next: RoutingProvider | undefined): void {
  routingInstance = next;
}

function fake<T>(port: string, make: () => T): T {
  if (config().env === 'production') {
    throw new Error(`No ${port} adapter is bound; a fake never runs in production (ADR-0002).`);
  }
  return make();
}
