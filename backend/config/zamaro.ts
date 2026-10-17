import { resolve } from 'node:path';
import { z } from 'zod';

// The API's configuration, read from the environment once and validated (ADR-0027). Read it inside
// handlers and services, never at module scope: `next build` evaluates modules with no environment.

const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optional = z.preprocess(blankToUndefined, z.string().optional());
const list = z.preprocess(
  blankToUndefined,
  z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''),
    ),
);

const schema = z.object({
  // One of local, test, e2e or production. Production refuses fake adapters and frozen clocks.
  ZAMARO_ENV: z.preprocess(
    blankToUndefined,
    z.enum(['local', 'test', 'e2e', 'production']).default('local'),
  ),
  ZAMARO_DEBUG: optional,
  APP_URL: z.preprocess(blankToUndefined, z.string().default('http://localhost:8000')),
  // Release version written to every log line (L2-093).
  APP_RELEASE: z.preprocess(blankToUndefined, z.string().default('dev')),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_CACHE_URL: optional,
  REDIS_QUEUE_URL: optional,
  REDIS_PREFIX: z.preprocess(blankToUndefined, z.string().default('zamaro-')),
  // Origins that serve Zamaro Web; only they get a session cookie and CORS credentials (ADR-0015).
  ZAMARO_WEB_ORIGINS: list,
  ZAMARO_WEB_URL: z.preprocess(blankToUndefined, z.string().default('http://localhost:4200')),
  ZAMARO_FROZEN_NOW: optional,
  TRUSTED_PROXIES: list,
  // Folder holding the media, quarantine, documents and originals disks (ADR-0024).
  ZAMARO_STORAGE_ROOT: z.preprocess(blankToUndefined, z.string().default('storage/app')),
  // The password Naomi, Abigail and Tomi sign in with (M2 D28), outside production only.
  ZAMARO_CAST_PASSWORD: optional,
  // Sessions (ADR-0015): minutes without a request before a session ends (the idle limit), and whether
  // the cookies carry Secure (off only for plain-HTTP tooling). The e2e API raises the lifetime.
  SESSION_LIFETIME: z.coerce.number().int().positive().default(10080),
  SESSION_SECURE_COOKIE: z.preprocess(
    blankToUndefined,
    z.enum(['true', 'false', '1', '0']).default('true'),
  ),
  // Where the media disk is served from: /media on the API until object storage (ADR-0024).
  ZAMARO_MEDIA_URL: z.preprocess(blankToUndefined, z.string().default('/media')),
  // The media host serves signed links to private documents (L2-076.3, M3 D10); nothing else does.
  ZAMARO_MEDIA_ORIGIN: z.preprocess(blankToUndefined, z.string().default('http://media.localhost')),
  // One directory per locale, one JSON file per namespace (L2-111).
  ZAMARO_I18N_PATH: z.preprocess(blankToUndefined, z.string().default('resources/i18n')),
  // L2-077: requests a minute per address (and per account once signed in), searches a minute, and
  // the account flows' limits (M2 D6). The e2e API raises them: every browser in the suite shares one address.
  ZAMARO_API_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  ZAMARO_API_SIGNED_IN_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
  ZAMARO_SEARCH_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  ZAMARO_REGISTER_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(10),
  APP_NAME: z.preprocess(blankToUndefined, z.string().default('Zamaro')),
  // An administrator's session ends after this long without a request (L2-066.2).
  ZAMARO_ADMIN_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
  // Every email is from Zamaro <hello@zamaro.ca> (M2 D16).
  MAIL_FROM_NAME: z.preprocess(blankToUndefined, z.string().default('Zamaro')),
  MAIL_FROM_ADDRESS: z.preprocess(blankToUndefined, z.string().default('hello@zamaro.ca')),
  // The fake breach checker's list (ADR-0002): comma-separated.
  ZAMARO_FAKE_BREACHED_PASSWORDS: z.preprocess(
    blankToUndefined,
    z.string().default('password1234,Password12345,qwertyuiop123'),
  ),
  ZAMARO_RESEND_VERIFICATION_LIMIT: z.coerce.number().int().positive().default(3),
  ZAMARO_FORGOT_PASSWORD_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(5),
  ZAMARO_PASSWORD_RESET_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  // Unfinished features, off unless the environment turns them on (ADR-0012).
  ZAMARO_FEATURE_BOOKING_REQUESTS: z.preprocess(
    blankToUndefined,
    z.enum(['true', 'false', '1', '0']).default('false'),
  ),
});

export interface ZamaroConfig {
  env: 'local' | 'test' | 'e2e' | 'production';
  debug: boolean;
  appUrl: string;
  release: string;
  databaseUrl: string;
  redis: { url: string; cacheUrl: string; queueUrl: string; prefix: string };
  webOrigins: string[];
  webUrl: string;
  frozenNow: string | undefined;
  trustedProxies: string[];
  storageRoot: string;
  /** Set only where the cast can sign in: local, test and e2e. */
  castPassword: string | undefined;
  i18nPath: string;
  mediaUrl: string;
  /** Where signed links to private documents point: "http://media.localhost". */
  mediaOrigin: string;
  /** Its host, which the documents route demands: "media.localhost". */
  mediaHost: string;
  sessionLifetimeMinutes: number;
  secureCookies: boolean;
  features: { bookingRequests: boolean };
  appName: string;
  admin: { idleTimeoutMinutes: number };
  mail: { fromName: string; fromAddress: string };
  /** What the vendor fakes answer (ADR-0002). */
  fakes: { breachedPasswords: string[] };
  rateLimits: {
    apiPerMinute: number;
    apiSignedInPerMinute: number;
    searchPerMinute: number;
    registerPerHour: number;
    resendVerificationPer15Minutes: number;
    forgotPasswordPerHour: number;
    passwordResetPerMinute: number;
  };
  // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
  problemsBaseUri: string;
}

let cached: ZamaroConfig | undefined;

export function config(): ZamaroConfig {
  cached ??= load();
  return cached;
}

/** Reads the environment again on the next call; tests use it after changing `process.env`. */
export function reloadConfig(): void {
  cached = undefined;
}

function load(): ZamaroConfig {
  const env = schema.parse(process.env);
  const appUrl = env.APP_URL.replace(/\/+$/, '');
  return {
    env: env.ZAMARO_ENV,
    debug: env.ZAMARO_DEBUG === '1' || env.ZAMARO_DEBUG === 'true',
    appUrl,
    release: env.APP_RELEASE,
    databaseUrl: env.DATABASE_URL,
    redis: {
      url: env.REDIS_URL,
      cacheUrl: env.REDIS_CACHE_URL ?? env.REDIS_URL,
      queueUrl: env.REDIS_QUEUE_URL ?? env.REDIS_URL,
      prefix: env.REDIS_PREFIX,
    },
    webOrigins: env.ZAMARO_WEB_ORIGINS,
    webUrl: env.ZAMARO_WEB_URL.replace(/\/+$/, ''),
    frozenNow: env.ZAMARO_FROZEN_NOW,
    trustedProxies: env.TRUSTED_PROXIES,
    storageRoot: resolve(env.ZAMARO_STORAGE_ROOT),
    castPassword: env.ZAMARO_ENV === 'production' ? undefined : env.ZAMARO_CAST_PASSWORD,
    i18nPath: resolve(env.ZAMARO_I18N_PATH),
    mediaUrl: env.ZAMARO_MEDIA_URL.replace(/\/+$/, ''),
    mediaOrigin: env.ZAMARO_MEDIA_ORIGIN.replace(/\/+$/, ''),
    mediaHost: new URL(env.ZAMARO_MEDIA_ORIGIN).host,
    sessionLifetimeMinutes: env.SESSION_LIFETIME,
    secureCookies: env.SESSION_SECURE_COOKIE === 'true' || env.SESSION_SECURE_COOKIE === '1',
    rateLimits: {
      apiPerMinute: env.ZAMARO_API_LIMIT_PER_MINUTE,
      apiSignedInPerMinute: env.ZAMARO_API_SIGNED_IN_LIMIT_PER_MINUTE,
      searchPerMinute: env.ZAMARO_SEARCH_LIMIT_PER_MINUTE,
      registerPerHour: env.ZAMARO_REGISTER_LIMIT_PER_HOUR,
      resendVerificationPer15Minutes: env.ZAMARO_RESEND_VERIFICATION_LIMIT,
      forgotPasswordPerHour: env.ZAMARO_FORGOT_PASSWORD_LIMIT_PER_HOUR,
      passwordResetPerMinute: env.ZAMARO_PASSWORD_RESET_LIMIT_PER_MINUTE,
    },
    appName: env.APP_NAME,
    admin: { idleTimeoutMinutes: env.ZAMARO_ADMIN_IDLE_TIMEOUT_MINUTES },
    mail: { fromName: env.MAIL_FROM_NAME, fromAddress: env.MAIL_FROM_ADDRESS },
    fakes: {
      breachedPasswords: env.ZAMARO_FAKE_BREACHED_PASSWORDS.split(',')
        .map((password) => password.trim())
        .filter((password) => password !== ''),
    },
    features: {
      bookingRequests:
        env.ZAMARO_FEATURE_BOOKING_REQUESTS === 'true' ||
        env.ZAMARO_FEATURE_BOOKING_REQUESTS === '1',
    },
    problemsBaseUri: `${appUrl}/problems`,
  };
}
