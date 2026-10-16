import { config } from '@config/zamaro';
import type { Cache } from '@/server/contracts/cache';
import type { Geocoder } from '@/server/contracts/geocoder';
import type { RoutingProvider } from '@/server/contracts/routing-provider';
import { InMemoryCache } from './cache/in-memory-cache';
import { RedisCache } from './cache/redis-cache';
import { FakeGeocoder } from './geocoding/fake-geocoder';
import { FakeRoutingProvider } from './routing/fake-routing-provider';

/**
 * The composition root (ADR-0002, ADR-0028): each port resolves to its adapter. Outside vendors are
 * deterministic fakes until the vendor arrives in M10, and production refuses a fake. Redis-backed
 * services use Redis in the application and memory in tests, which bind their own through the
 * `use*()` seams and read a fake's hooks through the same accessors.
 */
let geocoderInstance: Geocoder | undefined;
let routingInstance: RoutingProvider | undefined;
let cacheInstance: Cache | undefined;

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

export function cache(): Cache {
  cacheInstance ??= config().env === 'test' ? new InMemoryCache() : new RedisCache();
  return cacheInstance;
}

export function useCache(next: Cache | undefined): void {
  cacheInstance = next;
}

/** Forgets every bound adapter, so the next access makes a fresh one (tests, per database). */
export function resetBindings(): void {
  geocoderInstance = undefined;
  routingInstance = undefined;
  cacheInstance = undefined;
}

function fake<T>(port: string, make: () => T): T {
  if (config().env === 'production') {
    throw new Error(`No ${port} adapter is bound; a fake never runs in production (ADR-0002).`);
  }
  return make();
}
