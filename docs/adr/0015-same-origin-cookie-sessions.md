# ADR-0015: Same-origin cookie sessions with Sanctum's SPA mode and Redis, no bearer tokens

**Date:** 2026-10-10
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M2 S0, groundwork)

## Context

M2 gives bookers and artists accounts. L2-073 sets the session rules: the cookie is `HttpOnly`,
`Secure` and `SameSite=Lax`, its identifier changes at sign-in, a state-changing request without a
valid CSRF token gets 419 and changes nothing, and a booker or artist session ends after 7 days idle
or 30 days open. `security/manage-sessions-and-csrf` describes a cookie session rather than bearer
tokens: Zamaro Web calls `/api/*` and `/sanctum/*` with relative URLs on the same host as its pages,
and the session lives in Redis.

What M1 left behind:

- Laravel's default `sessions` and `password_reset_tokens` tables exist but nothing uses them. The
  reset design (S8) needs its own `password_reset_tokens(user_id, token_hash, expires_at, used_at)`
  shape, and sessions are meant for Redis plus a `user_sessions` registry (S8).
- The `api` group is stateless. The SSR server proxies `/api` and `/media` to the API, and the dev
  server does the same through `proxy.conf.json`.
- The dev API (`api`) and the e2e API (`api-e2e`) share one Redis.
- e2e freezes the API's clock at Fri 9 Oct 2026 10:00 (`ZAMARO_FROZEN_NOW`).

## Decision

1. **Sanctum 4 in SPA mode.** `bootstrap/app.php` calls `$middleware->statefulApi()`, so requests
   from a web origin get `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession` and CSRF
   validation on the `api` group. Sanctum decides "from a web origin" by the `Referer` or `Origin`
   header, matched against `sanctum.stateful`, which `config/sanctum.php` derives from
   `ZAMARO_WEB_ORIGINS` (a comma-separated list of origins, scheme stripped; default
   `http://localhost:4200,http://localhost:4000`). Every other caller, such as the SSR server's own
   API calls, stays stateless. Sanctum's personal access tokens are not used, and their migration is
   not published.
2. **Sessions in Redis.** `config/session.php` defaults: driver `redis`, cookie `zamaro_session`,
   `http_only` true, `same_site` `lax`, `secure` from `SESSION_SECURE_COOKIE` (default true),
   `lifetime` 10,080 minutes. Laravel refreshes the Redis key's expiry on every request, so the
   lifetime is the 7-day idle limit; the 30-day absolute limit is S3's middleware.
3. **The CSRF cookie is `XSRF-TOKEN`.** The API writes it on every stateful response (readable by
   script, `Secure`, `SameSite=Lax`), and Angular's XSRF interceptor copies it into `X-XSRF-TOKEN`
   on mutating requests to relative URLs.
4. **One origin.** The SSR server's proxy and `proxy.conf.json` forward `/sanctum` alongside `/api`,
   so the session and XSRF cookies are set on the site's own origin and the browser never makes a
   cross-origin API call. In production the load balancer routes the same prefixes.
5. **The default tables are dropped** by
   `2026_10_10_000400_drop_default_sessions_and_password_reset_tokens`; S8 recreates
   `password_reset_tokens` in the design's shape.
6. **The e2e API is isolated and its cookies outlive the frozen clock.** `api-e2e` sets its own
   `REDIS_PREFIX`, so sessions, throttles and queues never meet dev's. It also sets
   `SESSION_LIFETIME=525600`: cookie expiry dates are computed from the frozen clock, so with a 7-day
   lifetime the browser would drop the session and XSRF cookies once the real date is a week past
   9 Oct 2026. The idle and absolute limits are proven in backend tests with time travel.

## Options Considered

### Option 1: Sanctum SPA mode with same-origin cookies (chosen)
- **Pros:** the session identifier is never readable by script; CSRF protection is Laravel's own;
  sign-out and "end every other session" are server-side deletes; matches the design and L2-073.
- **Cons:** every web origin must be listed; Sanctum's stateful check depends on `Referer` or
  `Origin`, so non-browser callers (and Feature tests) must send one to get a session.

### Option 2: Bearer tokens (Sanctum personal access tokens or JWT) in browser storage
- **Pros:** no CSRF; works across origins without a proxy.
- **Cons:** any script injection can read the token; revocation and idle expiry need extra
  machinery; contradicts L2-073's cookie rules and the design.

### Option 3: Database sessions (Laravel's default table)
- **Pros:** sessions are queryable with SQL.
- **Cons:** a write per request on the primary database; the design keeps session payloads in Redis
  and the per-user registry in `user_sessions`, which S8 adds.

## Consequences

### Positive
- One session model for bookers, artists and, from M3, administrators.
- The browser holds no credential a script can read.
- Dev and e2e sessions cannot collide.

### Negative
- Feature tests that need a session must send an `Origin` or `Referer` from `ZAMARO_WEB_ORIGINS`.
- Every new host that serves Zamaro Web must be added to `ZAMARO_WEB_ORIGINS`.

### Risks
- Chromium drops `Secure` cookies on `127.0.0.1` without an error, so e2e and local development
  must use `localhost`.
- A private response in the SSR transfer cache would leak between users; S2's transfer-cache filter
  and client rendering of private routes must land before personal pages ship.

## Implementation Notes

- Mail goes to Mailpit (`axllent/mailpit:v1.27.11`) at `mailpit:1025` inside Compose. Its inbox and
  API are published on the host at `:8026` and SMTP at `:1026`, off Mailpit's default ports, which
  other local stacks often hold. e2e reads it through `e2e/fixtures/mailbox.ts`
  (`E2E_MAILPIT_URL`).
- e2e signs cast members in through the web server's proxy (`e2e/fixtures/accounts.ts`), so the
  cookies land on `http://localhost:4000`.

## References

- `docs/detailed-designs/security/manage-sessions-and-csrf/README.md`
- `docs/detailed-designs/accounts/sign-in-and-recover-access/README.md`
- `docs/plans/m2-accounts-and-sessions.md`, S0
- L2-073, L2-089.3
- ADR-0002 (Compose dev environment), ADR-0014 (visual baselines per platform)
