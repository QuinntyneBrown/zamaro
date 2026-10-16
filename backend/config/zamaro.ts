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
  // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
  problemsBaseUri: string;
}

let cached: ZamaroConfig | undefined;

export function config(): ZamaroConfig {
  cached ??= load();
  return cached;
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
    problemsBaseUri: `${appUrl}/problems`,
  };
}
