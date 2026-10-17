import { config } from '@config/zamaro';
import type { Cache } from '@/server/contracts/cache';
import type { RateLimiter } from '@/server/contracts/rate-limiter';
import type { Geocoder } from '@/server/contracts/geocoder';
import type { IpLocator } from '@/server/contracts/ip-locator';
import type { RoutingProvider } from '@/server/contracts/routing-provider';
import type { SessionStore } from '@/server/contracts/session-store';
import { InMemoryCache } from './cache/in-memory-cache';
import { RedisCache } from './cache/redis-cache';
import { FakeGeocoder } from './geocoding/fake-geocoder';
import { FakeIpLocator } from './ip-location/fake-ip-locator';
import { InMemoryRateLimiter } from './rate-limiting/in-memory-rate-limiter';
import { RedisRateLimiter } from './rate-limiting/redis-rate-limiter';
import { InMemorySessionStore } from './sessions/in-memory-session-store';
import { RedisSessionStore } from './sessions/redis-session-store';
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
let rateLimiterInstance: RateLimiter | undefined;
let sessionStoreInstance: SessionStore | undefined;
let ipLocatorInstance: IpLocator | undefined;

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

export function rateLimiter(): RateLimiter {
  rateLimiterInstance ??=
    config().env === 'test' ? new InMemoryRateLimiter() : new RedisRateLimiter();
  return rateLimiterInstance;
}

export function useRateLimiter(next: RateLimiter | undefined): void {
  rateLimiterInstance = next;
}

export function sessionStore(): SessionStore {
  sessionStoreInstance ??=
    config().env === 'test' ? new InMemorySessionStore() : new RedisSessionStore();
  return sessionStoreInstance;
}

export function useSessionStore(next: SessionStore | undefined): void {
  sessionStoreInstance = next;
}

export function ipLocator(): IpLocator {
  ipLocatorInstance ??= fake('IpLocator', () => new FakeIpLocator());
  return ipLocatorInstance;
}

export function useIpLocator(next: IpLocator | undefined): void {
  ipLocatorInstance = next;
}

/** Forgets every bound adapter, so the next access makes a fresh one (tests, per database). */
export function resetBindings(): void {
  geocoderInstance = undefined;
  routingInstance = undefined;
  cacheInstance = undefined;
  rateLimiterInstance = undefined;
  sessionStoreInstance = undefined;
  ipLocatorInstance = undefined;
}

function fake<T>(port: string, make: () => T): T {
  if (config().env === 'production') {
    throw new Error(`No ${port} adapter is bound; a fake never runs in production (ADR-0002).`);
  }
  return make();
}
