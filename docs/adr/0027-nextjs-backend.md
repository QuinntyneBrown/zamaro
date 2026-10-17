# ADR-0027: The backend is a Next.js application on Node.js

**Date:** 2026-10-14
**Category:** backend
**Status:** Accepted (supersedes [ADR-0009](0009-upgrade-to-laravel-13.md); amends ADR-0002, 0005, 0006, 0011, 0012,
0013, 0015, 0018, 0019, 0020, 0021, 0022, 0023, 0024 and 0026 as described below; its testing row and backend
checks are amended by [ADR-0028](0028-backend-tests-in-process-on-pglite.md))
**Deciders:** Project owner

## Context

The Laravel API, worker and scheduler were removed from `backend/` on 2026-10-13. What remains are the
translation catalogues, the seed media and the Postgres init script, which do not depend on the backend's
language. The project owner has decided that the backend is implemented with Next.js, so the whole stack is
TypeScript: the Angular frontend, the Playwright suite and the backend share one language, one package
manager and one set of lint and format tools.

The requirements (L1, L2) are technology-neutral, apart from L2-078 naming Composer and `APP_DEBUG`. The
detailed designs, the AGENTS.md folder tree and twelve ADRs name Laravel mechanisms: Eloquent, FormRequests,
API resources, Sanctum, Horizon, the scheduler, Larastan, Scramble and others. Each needs a Node.js
counterpart that keeps the behaviour the designs describe.

## Decision

`backend/` is one **Next.js 16** application (App Router) in **TypeScript 5 (strict)** on **Node.js 24 LTS**.
It serves only **route handlers** (`route.ts`); it renders no pages, so Zamaro Web stays the Angular
application. It builds the `zamaro-api` image, which runs as three processes, as before:

| Container | Command | Role |
|---|---|---|
| Zamaro API | `node server.js` (Next.js standalone output) | REST API under `/api/v1`, health, media links |
| Zamaro Worker | `node dist/worker.js` | BullMQ workers for the `high`, `notifications` and `default` queues |
| Zamaro Scheduler | `node dist/scheduler.js` | Registers BullMQ job schedulers; the Worker runs the jobs |

Business rules stay out of the HTTP layer: route handlers validate, call one action, and return a resource.
Actions, domain services, jobs, policies and value objects keep the names the designs give them, as
TypeScript classes.

### How each Laravel mechanism maps

| Laravel (as the designs used it) | Next.js backend |
|---|---|
| Laravel 13 on PHP 8.3 | Next.js 16 on Node.js 24 LTS, TypeScript strict |
| `routes/api.php`, `api_public.php`, `health.php`, `media.php` | Route handlers under `src/app/api/v1/**/route.ts`, `src/app/health/{live,ready}/route.ts`, `src/app/documents/**/route.ts` and `src/app/media/**/route.ts` on the media host |
| Controller method (`BookingsController@store`) | Exported HTTP-method function of a route handler (`POST` in `src/app/api/v1/bookings/route.ts`) |
| Middleware and its order in `bootstrap/app.php` | The request pipeline, `src/server/http/pipeline.ts`: each route declares its steps with `route({ auth, verified, roles, rateLimit, csrf }, handler)`. Fixed order: request ID → request logging → problem-details error handling → security headers → session → CSRF → authentication → role and verified checks → rate limit → validation. Logging wraps error handling, so handled statuses are logged (AGENTS.md). |
| `auth:sanctum` by default, anonymous routes opt out | `route()` requires a session unless the route passes `auth: 'anonymous'`; anonymous routes are listed in `src/app/api/v1/public.ts` |
| FormRequest | A Zod schema in `src/server/http/requests/{subsystem}/` with the same name (`CreateBookingRequest`); invalid input → 422 problem with per-field `errors` |
| API resource (`JsonResource`) | A resource function in `src/server/http/resources/{subsystem}/` (`toBookingResource(booking)`) |
| Eloquent model | A Drizzle ORM table in `src/server/db/schema/` plus its inferred row type (`Booking`); stereotype `<<Drizzle table>>` in class diagrams |
| Eloquent casts, `encrypted` casts | Drizzle custom column types; `encryptedText` uses `FieldCipher` (ADR-0020) |
| `DB::transaction`, `lockForUpdate` | `db.transaction(async (tx) => …)`, `.for('update')` |
| Migrations (`php artisan migrate`) | Drizzle Kit SQL migrations in `database/migrations/`, applied by `npm run db:migrate`; expand–contract only, never on startup |
| Seeders | `npm run db:seed` (`database/seeders/*.ts`), idempotent |
| Events and listeners, `ShouldDispatchAfterCommit` | `EventBus` in `src/server/events/`; `dispatchAfterCommit` runs listeners once the transaction commits, and queued listeners become BullMQ jobs |
| Queued jobs, Horizon supervisors | BullMQ queues `high`, `notifications`, `default` on Redis, processed by the Worker; Bull Board, behind the administrator gate, replaces the Horizon dashboard |
| Scheduler (`routes/console.php`, `schedule:run`) | BullMQ job schedulers registered by `src/scheduler.ts`; each job selects everything that became due, so a missed run is caught up (L2-086) |
| Policies, Gates | Policy classes in `src/server/policies/` (`BookingPolicy.view(user, booking)`), called by actions and route handlers; a denial answers 404 or 403 as each design says |
| Rate limiters (`RateLimiter::for`) | `rate-limiter-flexible` on Redis, named limiters in `src/server/http/rate-limits.ts` |
| Sanctum SPA mode, Redis sessions (ADR-0015) | `SessionStore` on Redis with the `zamaro_session` cookie (`HttpOnly`, `Secure`, `SameSite=Lax`), rotated at sign-in, 7-day idle and 30-day absolute limits; no bearer tokens |
| `/sanctum/csrf-cookie`, `VerifyCsrfToken` (ADR-0018) | `GET /api/v1/csrf-cookie` writes `XSRF-TOKEN`; the pipeline checks `X-XSRF-TOKEN` on every state-changing request and answers 419 |
| `Hash` (Argon2id) | `@node-rs/argon2` (Argon2id, same cost) |
| `Crypt`, `Illuminate\Encryption\Encrypter` | `FieldCipher`: Node `crypto`, AES-256-GCM, versioned keys not tied to any app key (ADR-0020, ADR-0025) |
| google2fa (ADR-0021) | `otplib` for TOTP and `qrcode` for the QR image the API returns |
| Notifications, Mailables, Blade Markdown mail (ADR-0019) | `TransactionalNotification` base class built from the catalogue, rendered to HTML and text, sent by `nodemailer` from a `notifications` job; Mailpit in development |
| Filesystem disks, Flysystem (ADR-0024) | `Storage` contract with a local-disk adapter now and an S3-compatible adapter later |
| `URL::signedRoute` | `SignedUrl` (HMAC-SHA256 with expiry) in `src/server/support/` |
| Carbon, `CarbonImmutable` | Luxon `DateTime` in `America/Toronto` |
| PHP enums | String-literal unions exported as `as const` objects in `src/server/enums/`, stored as Postgres enums |
| Laravel HTTP client | `fetch` with timeouts and retries inside `src/server/integrations/` adapters |
| `Log`, Context | `pino` JSON logs with the request ID in `AsyncLocalStorage`; jobs carry the request ID in their data |
| `spatie/icalendar-generator` | `ical-generator` |
| Image handling (Imagick) | `sharp` |
| `php artisan …` commands | `npm run …` scripts backed by `src/cli/*.ts` (`i18n:check`, `db:migrate`, `db:seed`, `db:reset` to drop, migrate and seed the e2e database, `cast:booker`) |
| Scramble OpenAPI, opis contract checks (ADR-0006) | `@asteasolutions/zod-to-openapi` builds OpenAPI 3.1 from the Zod schemas; integration tests validate responses with `ajv` against it |
| PHPUnit Feature tests | Vitest integration tests in `tests/feature/{subsystem}/` that call the running API over HTTP against a real Postgres and Redis |
| Pint, Larastan with the raw-SQL rule (L2-075.2) | Prettier, ESLint with `typescript-eslint` strict type-checked rules, `tsc --noEmit`, and the `zamaro/no-raw-sql` rule in `tools/eslint/` against non-literal `sql.raw` and string-built SQL |
| `composer audit` (L2-078.2) | `npm audit --audit-level=high` in `backend/`, `frontend/` and `e2e/` |
| `APP_DEBUG=false` (L2-078.3) | `NODE_ENV=production` and `ZAMARO_DEBUG` unset: problem responses never carry stack traces |

### Backend folder layout

```text
backend/
├── src/
│   ├── app/                       # Next.js routing: route handlers only, no pages
│   │   ├── api/v1/                # /api/v1/**/route.ts, authenticated by default
│   │   ├── health/                # live/route.ts, ready/route.ts (ADR-0005)
│   │   ├── documents/             # signed links to private documents (ADR-0024)
│   │   └── media/                 # public media files on the media host
│   ├── server/
│   │   ├── actions/{subsystem}/   # one use case per class
│   │   ├── services/{subsystem}/  # domain services
│   │   ├── jobs/{subsystem}/      # BullMQ job handlers
│   │   ├── events/  listeners/
│   │   ├── db/                    # client.ts, schema/ (Drizzle tables)
│   │   ├── enums/  contracts/  integrations/  policies/  notifications/  rules/
│   │   ├── support/               # problems/ (RFC 9457), SignedUrl, FieldCipher
│   │   └── http/                  # pipeline.ts, rate-limits.ts, requests/{subsystem}/, resources/{subsystem}/
│   ├── cli/                       # npm run scripts (i18n:check, db:seed)
│   ├── worker.ts  scheduler.ts
│   └── instrumentation.ts         # boot-time checks (config, keys), error tracking
├── config/                        # zamaro.ts, security.ts: typed, validated environment
├── database/  migrations/  seeders/  seeders/media/
├── resources/  i18n/{locale}/  emails/
├── tests/  feature/{subsystem}/  feature/security/  load/
├── tools/eslint/                  # no-raw-sql rule (L2-075.2)
├── docker/
├── next.config.ts  drizzle.config.ts  vitest.config.ts  eslint.config.js  tsconfig.json  package.json
└── Dockerfile                     # zamaro-api image (API, Worker, Scheduler)
```

### What carries over unchanged

The decisions in ADR-0005 (route groups, problem types, health responses), 0011, 0012, 0013, 0015
(same-origin cookies in Redis, no bearer tokens), 0018 (CSRF on every state-changing request), 0019 (one
email base class, catalogue-built copy, an e2e queue worker), 0020, 0022 (append-only audit log in the model,
a trigger and a retention role), 0023, 0024, 0025 and 0026 stand. Only the Laravel mechanism each names is replaced
by the row above. ADR-0002's Compose services keep their roles: `api`, `api-e2e`, `worker`, `worker-e2e` and
`scheduler` run the Node.js image.

## Options Considered

### Option 1: Restore Laravel
- **Pros:** The designs and ADRs already describe it; M1–M3 had been built on it.
- **Cons:** Not what the project owner wants. Keeps two languages and two toolchains.

### Option 2: Next.js route handlers as the API, Angular stays the frontend (chosen)
- **Pros:** One language across the repository; shared tooling (npm, ESLint, Prettier, Vitest-style tests);
  the Angular application, its SSR proxy and the Playwright suite are untouched; Next.js standalone output
  gives a small image.
- **Cons:** Next.js brings no ORM, queue, mailer or session layer, so each is a chosen library recorded above.
  Long-running work cannot run inside route handlers, so the Worker and Scheduler are separate entry points
  in the same image.

### Option 3: Move the frontend into Next.js as well
- **Pros:** One framework end to end.
- **Cons:** Discards the Angular workspace, the components library, CRDs and visual baselines. Out of scope:
  the decision covers the backend only.

## Consequences

### Positive
- One language and one dependency audit for the whole repository.
- The request pipeline makes middleware order explicit per route and testable.

### Negative
- Every detailed design, the AGENTS.md tree and the README are updated to the new names in this change.
- The frontend's session code, the SSR proxy, `proxy.conf.json` and the e2e fixtures no longer name
  `/sanctum/csrf-cookie` or `php artisan` (moved 2026-10-16); they call `/api/v1/csrf-cookie` and the
  `npm run` scripts above. Their acceptance tests run again once the accounts slices are rebuilt.
- The milestone plans record Laravel work that has to be redone; each plan is re-read against this ADR when
  its milestone restarts.

### Risks
- Next.js upgrades can change routing or caching defaults. Route handlers opt out of caching
  (`dynamic = 'force-dynamic'`) and the Dockerfile pins the Next.js version.

## Implementation Notes

- `next.config.ts` sets `output: 'standalone'`; no `pages/` or React components exist in `backend/`.
- Every route handler file sets `export const runtime = 'nodejs'`; the Edge runtime is not used.
- Backend checks are `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` and
  `npm run openapi:check`, all inside `backend/`.

## References

- L1-026, L2-115, L2-073, L2-075, L2-078, L2-086; AGENTS.md; `docs/detailed-designs/README.md`
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- https://orm.drizzle.team, https://docs.bullmq.io
