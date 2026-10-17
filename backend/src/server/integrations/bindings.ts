import { config } from '@config/zamaro';
import type { BotChallenge } from '@/server/contracts/bot-challenge';
import type { BreachedPasswordChecker } from '@/server/contracts/breached-password-checker';
import type { Cache } from '@/server/contracts/cache';
import type { ErrorReporter } from '@/server/contracts/error-reporter';
import type { JobQueue } from '@/server/contracts/job-queue';
import type { OnCallAlerter } from '@/server/contracts/on-call-alerter';
import type { Mailer } from '@/server/contracts/mailer';
import type { MediaScanner } from '@/server/contracts/media-scanner';
import type { VideoTranscoder } from '@/server/contracts/video-transcoder';
import type { RateLimiter } from '@/server/contracts/rate-limiter';
import type { Geocoder } from '@/server/contracts/geocoder';
import type { IpLocator } from '@/server/contracts/ip-locator';
import type { RoutingProvider } from '@/server/contracts/routing-provider';
import type { SessionStore } from '@/server/contracts/session-store';
import { FakeOnCallAlerter } from './alerting/fake-on-call-alerter';
import { FakeBotChallenge } from './bot-challenge/fake-bot-challenge';
import { FakeErrorReporter } from './error-tracking/fake-error-reporter';
import { BullMqJobQueue } from './queue/bullmq-job-queue';
import { InMemoryJobQueue } from './queue/in-memory-job-queue';
import { FakeBreachedPasswordChecker } from './breached-passwords/fake-breached-password-checker';
import { InMemoryCache } from './cache/in-memory-cache';
import { FakeMailer } from './mail/fake-mailer';
import { RedisCache } from './cache/redis-cache';
import { FakeGeocoder } from './geocoding/fake-geocoder';
import { FakeIpLocator } from './ip-location/fake-ip-locator';
import { InMemoryRateLimiter } from './rate-limiting/in-memory-rate-limiter';
import { RedisRateLimiter } from './rate-limiting/redis-rate-limiter';
import { InMemorySessionStore } from './sessions/in-memory-session-store';
import { RedisSessionStore } from './sessions/redis-session-store';
import { FakeRoutingProvider } from './routing/fake-routing-provider';
import { FakeMediaScanner } from './scanning/fake-media-scanner';
import { FakeVideoTranscoder } from './video/fake-video-transcoder';

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
let mailerInstance: Mailer | undefined;
let botChallengeInstance: BotChallenge | undefined;
let breachedPasswordsInstance: BreachedPasswordChecker | undefined;
let jobQueueInstance: JobQueue | undefined;
let errorReporterInstance: ErrorReporter | undefined;
let onCallAlerterInstance: OnCallAlerter | undefined;
let mediaScannerInstance: MediaScanner | undefined;
let videoTranscoderInstance: VideoTranscoder | undefined;

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

export function mailer(): Mailer {
  mailerInstance ??= fake('Mailer', () => new FakeMailer());
  return mailerInstance;
}

export function useMailer(next: Mailer | undefined): void {
  mailerInstance = next;
}

export function botChallenge(): BotChallenge {
  botChallengeInstance ??= fake('BotChallenge', () => new FakeBotChallenge());
  return botChallengeInstance;
}

export function useBotChallenge(next: BotChallenge | undefined): void {
  botChallengeInstance = next;
}

export function breachedPasswordChecker(): BreachedPasswordChecker {
  breachedPasswordsInstance ??= fake(
    'BreachedPasswordChecker',
    () => new FakeBreachedPasswordChecker(),
  );
  return breachedPasswordsInstance;
}

export function useBreachedPasswordChecker(next: BreachedPasswordChecker | undefined): void {
  breachedPasswordsInstance = next;
}

export function jobQueue(): JobQueue {
  jobQueueInstance ??= config().env === 'test' ? new InMemoryJobQueue() : new BullMqJobQueue();
  return jobQueueInstance;
}

export function useJobQueue(next: JobQueue | undefined): void {
  jobQueueInstance = next;
}

export function errorReporter(): ErrorReporter {
  errorReporterInstance ??= fake('ErrorReporter', () => new FakeErrorReporter());
  return errorReporterInstance;
}

export function useErrorReporter(next: ErrorReporter | undefined): void {
  errorReporterInstance = next;
}

export function onCallAlerter(): OnCallAlerter {
  onCallAlerterInstance ??= fake('OnCallAlerter', () => new FakeOnCallAlerter());
  return onCallAlerterInstance;
}

export function useOnCallAlerter(next: OnCallAlerter | undefined): void {
  onCallAlerterInstance = next;
}

export function mediaScanner(): MediaScanner {
  mediaScannerInstance ??= fake('MediaScanner', () => new FakeMediaScanner());
  return mediaScannerInstance;
}

export function useMediaScanner(next: MediaScanner | undefined): void {
  mediaScannerInstance = next;
}

export function videoTranscoder(): VideoTranscoder {
  videoTranscoderInstance ??= fake('VideoTranscoder', () => new FakeVideoTranscoder());
  return videoTranscoderInstance;
}

export function useVideoTranscoder(next: VideoTranscoder | undefined): void {
  videoTranscoderInstance = next;
}

/** Forgets every bound adapter, so the next access makes a fresh one (tests, per database). */
export function resetBindings(): void {
  videoTranscoderInstance = undefined;
  mediaScannerInstance = undefined;
  jobQueueInstance = undefined;
  errorReporterInstance = undefined;
  onCallAlerterInstance = undefined;
  mailerInstance = undefined;
  botChallengeInstance = undefined;
  breachedPasswordsInstance = undefined;
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
