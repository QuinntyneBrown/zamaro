# Milestone 1 plan and status: foundations and public browse

This is the working plan for building Zamaro, with Milestone 1 in detail. The current status comes
first; the full plan follows, including the notes on what changed while implementing. Later
milestones get their own plan in this folder when they start.

## Current status (2026-10-09)

**Branch:** `feat/m1-foundations-and-browse`, opened as a pull request against `main`. M1 is about
two-thirds done: S0–S11 are built; S12–S16 remain.

| Slice | Scope | Status | Commits |
|---|---|---|---|
| S0 | Scaffolding: compose, Laravel 11, Angular workspace, Playwright, perf runner, ADR 0001–0004, CI | Done | 5 scaffolding commits |
| S1 | Health checks, request IDs, problem details, JSON logs | Done | `dcd237a` (ADR-0005) |
| S2 | i18n catalogue, SSR shell, transfer cache, no-hardcoded-text lint | Done | ADR-0006, ADR-0007 |
| S3 | Compact header, menu dialog, theme | Done | |
| S4 | Search API (who is free and within range) | Done | `a3cd3cc`–`78b53e0` |
| S5 | Discover page: search form and lineup, place lookup | Done | `511605f`, `8d52f17`, `bea3437` |
| S6 | Headliner | Done | `0416465`, `eb7043f` |
| S7 | Discover loading, error and rate limit | Done | `32ce03b`, `4b2e02d`, `ae17ec5` |
| S8 | Sort, filter, URL state | Done | `36319e0`, `4856755` |
| S9 | Result paging | Done | `c8dbd7e`, `4e8ccf2` |
| S10 | Sold-out alternatives | Done | `929af7f`, `c6adc9a`, `b8a3ad1` |
| S11 | Artist profile: header, About, setlist, loading and error | Done | `31dcbf4`, `9e7f58f`, `f48451c`, `a10df34` (ADR-0008) |
| — | e2e API gets its own database, clock, limits and cache keys | Done | `331a03f` |
| S12 | Photos and videos (local disk, no object storage in M1) | **Next** | ADR-0009 (hls.js) |
| S13 | Reviews on the profile | To do | |
| S14 | Tour dates, booking stub, "How booking works" (submit hidden until M5) | To do | |
| S15 | Missing artist, renamed slug, generic 404 | To do | ADR-0010 |
| S16 | Index and share (optional, last) | To do | |

**Checks at the last commit:**
- Backend: 70 Feature tests pass, with OpenAPI contract assertions.
- Frontend: lint and `format:check` are clean.
- e2e: 39 Playwright tests pass in Chromium against a freshly seeded e2e database. Since 2026-10-09 e2e mocks the backend with a stub API (`e2e/fixtures/stub-api/`) and needs no Docker or database.
- Perf: `--fail-on-regression` against the base build flags no rows. `Breadcrumb` and `Setlist` are new scenarios.

**Open items carried forward:**
- **L2-009.2:** Back restores the Discover results but not the scroll position yet.
- **S12:** serve the seeded photos and videos from the API's local disk; object storage waits for M4 (user decision).
- **S13:** seed 38 distinct-church reviews for Abigail, or the rating recalculation will change her 4.9/38.
- **S14:**
  - Miriam's seeded ticket number is ACT-0041; the mocks say ACT-0154.
  - The book submit stays behind the off `bookingRequests` flag (user decision).
- **S15:** settle `ArtistSlugResolver` (change-profile-address) against `ResolveArtistSlug` (view-artist-profile).
- **Not started yet:** the visual-parity (`e2e/visual/`) and axe (`e2e/a11y/`) suites over `routes.manifest.ts`. The manifest already lists four route states.
- **M2:** CORS is still Laravel's default `*` and must be tightened.

---

## The plan: roadmap and Milestone 1

### Context
The repository has finished specs (25 L1 and 114 L2 requirements), 68 detailed designs, mocks covering every page and state, and a design system. There is no product code yet:
- `frontend/` is an empty Angular 22.2 workspace (`zamaro` with SSR, `admin`, `perf-test`, plus the `components` and `api` libraries).
- `backend/`, `e2e/`, `.ci/` and `docs/adr/` don't exist.
- PHP and Composer aren't installed on this machine. Node 22 and Docker 29 are.

**Goal:** build the product in dependency-ordered milestones, following AGENTS.md: ATDD, thin slices using the `implementing-incrementally` skill, a page object model with no selectors in tests, a perf scenario for every `zm-*` component, and no architecture tests. Milestone 1 is detailed below. Each later milestone gets its own detailed plan when it starts.

**Decisions made:**
- Local runtime is **Docker Compose**: PHP 8.3 / Laravel 11 API, worker (Horizon), scheduler, Postgres 16, Redis 7, MinIO. Composer and artisan run inside the container.
- Every outside vendor is a **port in `backend/app/Contracts` with a deterministic fake in `app/Integrations`**. Real adapters land in M10, one ADR per vendor. Binding a fake in production throws at boot.
- **Conflicts between the designs and AGENTS.md are resolved per slice.** AGENTS.md wins on layout. The design is updated and an ADR written in the same change.

### Roadmap (dependency order)
| # | Milestone | Features (detailed-design folders) |
|---|---|---|
| M1 | Foundations and public browse | discovery/* · artist-profiles/* · reviews/show-reviews-and-rating (read side) · operations/apply-api-conventions and health/request IDs · user-experience: i18n, theme (on the device), skeletons, layout, a11y basics · search rate limit · public field allowlists |
| M2 | Accounts and sessions | accounts/* (register, sign-in/recover, church, settings, save, saved list) · sessions and CSRF · authorise-and-validate · rate limits and the BotChallenge port · encrypted fields · record-consent · email foundation (Mailpit, `i18n:check`) · run-background-jobs · theme saved to the account |
| M3 | Artist onboarding and admin app | apply-as-artist · review-artist-application · verify-vulnerable-sector-check · secure-admin-access (separate admin app with TOTP) · record-audit-log · scan-and-serve-uploads |
| M4 | Artist workspace and availability | dashboard · edit-profile-details · change-profile-address · manage-setlist · upload-photos · upload-videos · availability calendar · calendar feed · one ADR for profile cache invalidation |
| M5 | Booking requests | send, respond, withdraw, messages, booker bookings, run-booking-lifecycle (expiry and completion jobs) · booking emails · idempotency and toasts |
| M6 | Payments and cancellations | pay-deposit · collect-balance · pay-out-artists · issue-receipts · reconcile-payment-events (PaymentGateway fake and webhooks) · cancel-booking |
| M7 | Reviews and notifications | leave, reply, report and moderate reviews · rating recalculation · event reminders · email preferences |
| M8 | Admin support | suspend and reinstate artists · support bookings and payments |
| M9 | Hardening | delete-account · data export · transport and headers (CSP, HSTS) · accessibility audit · offline page and service worker |
| M10 | Production readiness | back-up, deploy and host · fast pages and budgets · load tests · error tracking and alerts · real vendor adapters |

Option: bring `back-up-deploy-and-host` (staging) forward to just after M2.

**Git:** work on a `feat/m1-foundations-and-browse` branch off `main`, with one commit per slice (or smaller). The branch was pushed and opened as a pull request at the end of S11, at the user's request.

### Milestone 1 — slices
**Every slice** follows the same loop:
1. Write the Given-When-Then criteria.
2. Write the acceptance test and run it red for the expected reason.
3. Implement, refactor while green, then run the regression set:
   - `docker compose exec api php artisan test`
   - `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build perf-test`
   - `cd e2e && npx playwright test`
   - perf test with `--fail-on-regression` whenever a `zm-*` component changes
4. Commit.

Each slice also adds its route states to `e2e/routes.manifest.ts`.

**Test conventions:**
- Backend tests are Feature tests against `/api/v1`, using an `AssertsOpenApiContract` trait.
- e2e runs against an SSR build and a stub API that Playwright starts (`e2e/fixtures/stub-api/`), which answers from the seeded cast with today frozen at Fri 9 Oct 2026 10:00; the browser clock is frozen with `page.clock`. (Until 2026-10-09 it ran against the `api-e2e` compose service and a seeded database.)
- The seed data uses the mock cast.

#### S0 — Scaffolding (infra and test-only, outside ATDD)
- **Root `docker-compose.yml`:** postgres:16 (init script creates the `zamaro`, `zamaro_test` and `zamaro_e2e` databases), redis:7, minio and minio-init (`zamaro-media` and `zamaro-quarantine` buckets), `api` on :8000, `api-e2e` on :8001 (profile `e2e`, frozen clock), `worker` (Horizon), `scheduler`.
- **`backend/`:** Laravel 11, created with the `composer:2` container (`MSYS_NO_PATHCONV=1`).
  - Dockerfile: PHP 8.3 with pdo_pgsql, redis, intl, gd, pcntl, bcmath, zip.
  - Horizon installed.
  - phpunit runs against `zamaro_test`.
  - Skeleton `config/zamaro.php`.
  - `vendor/` in a named volume.
  - `.gitattributes` with `eol=lf`.
  - Example tests removed.
- **`e2e/`:**
  - Playwright and `@axe-core/playwright`.
  - `playwright.config.ts`: Chromium only, a `zamaro` project, `webServer` running the SSR build with `API_ORIGIN=:8001`.
  - `routes.manifest.ts`.
  - `fixtures/{global-setup,clock,cast}.ts`, where global setup runs `migrate:fresh --seed`.
  - `perf-test/perf-test.mjs` (CDP CPU profiling; `--baseline`, `--fail-on-regression`, `--scenarios`), plus its `config/*.mjs` and a git-ignored `logfiles/`.
- **`frontend/`:**
  - `npm i @angular/cdk@^22.2`.
  - Repoint the tsconfig paths from `dist/*` to the libraries' `src/public-api.ts`.
  - `projects/components/src/styles/{tokens.css (copied from docs/design-system/tokens/tokens.css), reset.scss, utilities.scss, index.scss}`, added to the styles of all three apps.
  - perf-test: `README.md`, `renderer.ts`, `scenarios/index.ts`, `main.ts`.
  - `proxy.conf.json` sends `/api` to :8000.
  - `app.routes.server.ts` changes `Prerender '**'` to `RenderMode.Server`.
- **Docs:**
  - `docs/adr/README.md`.
  - ADR 0001: admin is a separate application. Also update `administration/secure-admin-access`.
  - ADR 0002: compose dev environment and vendor ports with fakes. Add `backend/docker/` to the AGENTS.md tree.
  - ADR 0003: tokens copied into the components library, synced by `npm run tokens:sync`.
  - Create the missing `.claude/references/definition-of-done.md`.
- **CI:** `.ci/{lint,backend-test,build}.sh` and `.github/workflows/ci.yml`. The e2e and perf jobs are added once they have content.
- **Verify:**
  - `docker compose up -d --wait && docker compose exec api php artisan --version`
  - frontend lint and builds
  - `npx playwright test --list`

#### Changes made while implementing (2026-10-09)
- **S1 is done** (commit `dcd237a`, ADR-0005). ADR-0004 was already taken by the Laravel 11 advisories, so every later ADR shifts by +1: the OpenAPI tooling ADR is now **0006** (S2), and S2's layout ADR becomes 0007, S5's 0008, S11's 0009, S12's 0010 and S15's 0011.
- **Moved out of S1**, because no S1 endpoint could prove them:
  - Scramble, `AssertsOpenApiContract` and opis (095.3) → **S2**
  - the 422 `errors` object → **S4**
  - `CursorPaginatedResource` → **S9**
  - `auth:sanctum` on `routes/api.php`, `EnsureJsonRequest` (415) and log redaction → **M2**
- **Built differently from the S1 notes below:**
  - Health responses are `{"status":"ready"}` and `{"status":"not ready","failed":[...]}`, served from `routes/health.php`.
  - Readiness checks live in `Services/Operations/Readiness`.
  - Readiness timeouts are deferred (M10).
  - CORS is still Laravel's default `*` and must be tightened in M2.
- **S2a (backend catalogue) is done** (ADR-0006).
  - Scramble is a runtime dependency, because the `ProblemDetailsResponses` extension extends it.
  - Each API test calls `assertMatchesContract($response)`.
  - The catalogue returns `{data:{locale,messages}}` with flat `{namespace}.{key}` keys.
  - The catalogue files live in `resources/i18n/en/common.json`.
- **S2b (shell) is done** (ADR-0007, the layout mapping).
  - The SSR transfer cache is proven by an e2e test. The server rewrites the API origin in `ApiOriginBackend`, below the interceptors.
  - The components are `zm-skip-link`, `zm-top-bar`, `zm-footer` and `zm-icon`. `zm-button` moves to S3.
  - The footer links only to screens that exist; later slices add theirs.
  - `frontend/` and `e2e/` now use `eol=lf`.
  - Prettier ignores `tokens.css`.
  - The SSR Express server doesn't proxy `/api` yet; add that in S5, when the browser first calls the API.
  - The `no-hardcoded-text` ESLint rule is S2c, the next step.
- **S2c is done:** the `zamaro/no-hardcoded-text` lint rule covers templates. Its call-site checks come later, with the toast, announcer and title services.
- **S3 is done.**
  - Components added: `zm-button` (button only; the link form comes when a screen needs it), `zm-dialog`, `zm-menu` and the `DarkTheme` composite.
  - There is no `zm-theme-toggle`: the top bar's inputs and a `zm-menu` toggle item cover both forms.
  - `BreakpointService` was deferred, because CSS is enough so far.
  - `ThemeService` lives in `app/shell`.
  - TopBar's perf cost rose from 202 to 318 ms (not flagged, and intended).
- **S4 is done** (commits a3cd3cc through 78b53e0).
  - The search contract is `GET /api/v1/search?date&kind&lat&lng&radius`, returning `{data:[card],meta:{total}}`.
  - 422 errors are keyed by `date`, `kind`, `location` and `radius`, with the form's copy.
  - Routing fallback is ×1.3, so Abigail shows as about 59 km.
  - The phpunit env is forced: until this fix, tests had been using the dev database and Redis.
  - S5 needs `ZAMARO_FROZEN_NOW` honoured by the API (not yet done) and an `/api` proxy in the SSR server.
- **S5 is done** (511605f places, 8d52f17 frontend, bea3437 frozen clock).
  - The `zm` pipes come only when a template needs them, so there is no pipe-prefix ADR. The design notes the prefix instead, which shifts the later ADR numbers down by one: S11 → 0008, S12 → 0009, S15 → 0010.
  - The SSR server proxies `/api` when `API_ORIGIN` is set.
  - The menu dialog loads lazily, keeping the initial bundle at 494.8 kB, under budget.
  - Tickets start at No. 01 until S6.
  - The routes manifest still has only `/`. URL state is S8.
- **S6 is done** (0416465, eb7043f).
  - The headliner counts transitions to Confirmed since the start of the season.
  - Photos, MinIO and `artist_photos` move to **S12**: no store is chosen yet, and the mocks show artwork placeholders.
  - `review_replies` moves to S13.
  - The seed has Abigail's 4 profile reviews, but her rating stays seeded at 4.9/38. S13's recalculation needs 38 distinct-church reviews seeded, or it will change the numbers.
  - `zm-button-link` was split from `zm-button` after a perf flag.
- **S7 is done** (32ce03b, 4b2e02d, ae17ec5).
  - The perf runner timed the PR build with the profiler on and the base without it. That bias is fixed: both are untimed-profiled equally.
  - Button components are now three (`zm-button`, `zm-button-link`, `zm-button-anchor`), so none needs a conditional slot.
  - The `zmBusyRegion` directive is deferred until the profile becomes a second busy region (S11).
- **S8 is done** (36319e0, 4856755).
  - The wire format is `styles` as a comma list.
  - Chip and sort changes use `replaceUrl`.
  - The SSR prefills the form without searching.
  - The CDK dialog is lazy, with the menu; the initial bundle is 446 kB.
  - Under "Highest rated", Grace comes before Hosanna on review count.
- **S9 is done** (c8dbd7e, 4e8ccf2): the cursor is the sort plus the last sort key; 30 Barrie artists.
- **S10 is done** (929af7f, c6adc9a).
  - The sold-out explanation is built on the frontend from the catalogue.
  - ICU select keys cannot contain hyphens.
  - Four Christmas choirs join the seed.
  - `CandidateFinder` is shared by search and alternatives.
- **S11 is done** (31dcbf4 API, 9e7f58f red tests, f48451c page, a10df34 ADR-0008 and docs).
  - **ADR-0008** settles the names:
    - The public `ArtistProfileController` and `ArtistProfileResource`.
    - The editor's `ProfileDetailsController` and `ProfileDetailsResource`.
    - `Pronoun` is `she`, `he` or `they`; the setlist field is `writer`.
  - **ADR numbering** therefore moves to S12 → 0009 (hls.js) and S15 → 0010. `ArtistSlugResolver` versus `ResolveArtistSlug` is S15's to settle.
  - **Save and Share are not rendered** rather than flagged: Save comes with sign-in (M2), Share with S16. Book is a button that focuses `#book-date`, which S14 adds.
  - **`LastSearch` (root)** holds the last lineup's params, date and headliner slug. It drives Back, "Back to the lineup" and the "Headliner ·" kicker.
  - **Profile responses** carry `public, max-age=0, s-maxage=60`, so the transfer cache replays the SSR fetch.
  - **No artist-header perf scenario:** the header is page markup, not a library component.
  - **Still open, L2-009.2 scroll restoration:** Back restores the results but not the scroll position.
  - **Fixed alongside (331a03f):** `api-e2e` now runs `artisan serve --no-reload`.
    - Before this, its PHP workers dropped `DB_DATABASE`, `ZAMARO_FROZEN_NOW` and the 600/min limit, so e2e used the dev DB on the real clock with a 30/min limit.
    - It also has its own `CACHE_PREFIX` now.
  - **For S14:** Miriam's seeded ticket number is ACT-0041, but the mocks say ACT-0154.
- **Decided by the user (2026-10-09):**
  - **No object storage in M1.** S12 serves the seeded photos and videos from the API's local disk in dev and e2e. Object storage arrives with uploads in M4, with its own ADR.
  - **The S14 book button stays hidden until M5.** The stub and date picking ship; the submit sits behind a `bookingRequests` flag that is off. There is no placeholder route.
- **ADR renumbering (current):** 0008 went to S11, as S5 needed no ADR. S12 takes 0009 and S15 takes 0010.

#### S1 — API foundation
- **L2:** 090.2, 093.1, 095.1–3.
- **Behaviour:**
  - `/health/live` returns 200.
  - `/health/ready` returns 503 and `{"failed":["cache"]}` when Redis is down.
  - Unknown routes and exceptions return an RFC 9457 `application/problem+json` body carrying `requestId`, which matches the `X-Request-Id` header.
  - JSON request logs.
- **Tests first:** `tests/Feature/Operations/{HealthChecksTest,ApiConventionsTest}.php`.
- **Build:**
  - `bootstrap/app.php`: `/api/v1` prefix, `routes/api.php` authenticated by default, `routes/api_public.php`, and middleware order with `AssignRequestId` first and `LogRequest` outside the exception handler.
  - `Controllers/Health/HealthController`.
  - `Services/Operations/ReadinessChecker`.
  - `Support/Problems/*`.
  - `CursorPaginatedResource`.
  - Scramble (OpenAPI 3.1) and opis/json-schema.
- **ADR 0004:** the `app/Support` namespace and the OpenAPI tooling.

#### S2 — Walking skeleton (SSR shell and i18n)
- **L2:** 096.1, 101.1, 102.1, 111.2.
- **Behaviour:**
  - `GET /api/v1/i18n/en` returns 200 with an ETag, and 304 on a matching `If-None-Match`; `fr` falls back to `en`.
  - `/` is server-rendered with a header ("Discover", "How booking works", "For artists"), one `main` and a footer, and the browser does not fetch the catalogue a second time.
  - Pressing Tab first reaches "Skip to content".
- **Tests first:**
  - `tests/Feature/UserExperience/TranslationCatalogueTest.php`
  - `e2e/specs/user-experience/adapt-layout-to-screens.spec.ts`, with `pages/discover.page.ts` and `pages/shell.ts`
- **Build:**
  - Catalogue controller and service, `resources/i18n/en/*.json`.
  - `api/lib/i18n` (Transloco loader).
  - A server-only `api-origin.interceptor`.
  - `withHttpTransferCacheOptions`.
  - `shell/`, `pages/discover/`.
  - ESLint rule `no-hardcoded-text`.
- **Risk-first:** prove the SSR transfer-cache key matches between server and browser here.
- **ADR 0005:** AGENTS.md's `pages/dialogs/shell` and library layout replaces the designs' `features/core/shared`.
- **Components and scenarios:** `zm-skip-link`, `zm-top-bar`, `zm-footer`, `zm-icon`, `zm-button`. This is also the first real perf-test run.

#### S3 — Compact header, menu, theme
- **L2:** 099.1, 101.4, 103.1, 104.1–3 (device part only).
- **Behaviour:**
  - At 375 px, a CDK Dialog drawer shows the links and a theme switch; Escape returns focus to the button that opened it.
  - Stored `dark` sets `data-theme` before first paint; with nothing stored, the page follows the OS.
- **Tests first:** `e2e/specs/user-experience/switch-theme.spec.ts` and `pages/menu.dialog.ts`.
- **Build:** inline theme-boot script in `index.html`, `dialogs/menu/`, `ThemeService`, `BreakpointService`.
- **Components and scenarios:** `zm-theme-toggle`, `zm-dialog`, `zm-menu`, and the `DarkTheme` composite scenario.

#### S4 — Search API (who is free and within range)
- **L2:** 001.2, 002.1–4, 003, 004.3–4, 005, 095.2.
- **Behaviour** (search: Burlington, 14 Nov, worship night, 120 km):
  - 7 cards in Closest-first order: Marcus Bell 14 km first, Abigail 44 km.
  - When routing times out: about 52 km, flagged approximate.
  - Radius 40 excludes Abigail. A Confirmed booking excludes her; a Requested booking doesn't.
  - Youth events require a verified VSC less than 3 years old.
  - A date less than 3 days away returns 422 "Pick a date at least 3 days away."
  - Ottawa returns 422 for the 200 km limit.
  - Repeat searches hit the distance cache.
- **Tests first:** `tests/Feature/Discovery/{SearchAvailableArtistsTest,DistanceCalculationTest}.php`.
- **Build:**
  - Migrations: users additions, styles, artists, artist_styles, availability rules and overrides, churches, bookings (adds `church_city`), booking_transitions, vulnerable_sector_checks, artist_ratings.
  - Idempotent `StyleSeeder` and `CastSeeder` that upsert on natural keys.
  - Search code:
    - `Api/V1/Discovery/SearchController`
    - `SearchArtistsRequest`
    - `Actions/Discovery/SearchAvailableArtists`
    - `Services/Discovery/{DistanceService,ServiceArea,SearchCriteria}`
    - `Services/ArtistAvailability/AvailabilityService`
    - `Contracts/RoutingProvider` (a matrix call)
    - `Integrations/Routing/{FakeRoutingProvider,CastRoutes}`
    - `LineupResource`
  - Distance cache in Redis: 30 days, coordinates rounded to 4 dp, approximate results never cached.

#### S5 — Discover page (search form and lineup)
- **L2:** 004.2, 004.5–7, 006.1, 006.3, 097.1–3, 102.4, 110.1/3/5.
- **Behaviour:**
  - Empty form with the radius showing "120 km · 1.5 hr".
  - The Burlington chip and "Show the lineup" update the page without a reload; the poster shows "Sat 14 Nov"; tickets read "Hamilton · 14 km from you", "From $950", "Rated 4.6 out of 5 by 17 churches".
  - Submitting empty shows inline errors and focuses the date.
  - A typed town resolves through `GET /api/v1/places?q=`. This fills a design gap; the design is updated.
- **Tests first:** `e2e/specs/discovery/search-available-artists.spec.ts` and `tests/Feature/Discovery/PlaceLookupTest.php`.
- **Build:**
  - `Contracts/Geocoder` and `FakeGeocoder`.
  - `pages/discover/{search-form,lineup}`, `search.store.ts`.
  - `api/lib/services/discovery` (contract, token, HTTP implementation, in-memory fake).
  - `FormatService` and `zmShortDate`/`zmMoney`/`zmDistance` pipes.
- **ADR 0006:** `zm` prefix for directives and pipes (ESLint already enforces it).
- **Components and scenarios:** `zm-poster`, `zm-booking-form` (bar), `zm-form-field`, `zm-chip`, `zm-ticket`, `zm-rating`, `zm-artwork`, `zm-marquee`, and the `Lineup` composite scenario (24 tickets).

#### S6 — Headliner
- **L2:** 006.2, 006.5–7.
- **Behaviour:**
  - Abigail is "No. 01 · Most booked this autumn", with Rev. Janet Clarke's quote and "Free Sat 14 Nov"; the others start at No. 02.
  - Ties: rating, then distance, then ID.
  - With a single result, only the headliner shows.
- **Tests first:** `tests/Feature/Discovery/HeadlinerTest.php` and a new e2e case.
- **Build:**
  - `HeadlinerPicker`, `Season`.
  - Migrations for reviews, review_replies, artist_photos.
  - The seeder writes WebP renditions to MinIO.
  - `MediaUrlSigner`.
- **Components:** `zm-headliner`, `zm-badge`.

#### S7 — Discover loading, error and rate limit
- **L2:** 077.2, 105.1–2, 106.1–3.
- **Behaviour:**
  - Skeletons after 300 ms, with `aria-busy`.
  - On error: "We lost the signal", inputs kept, Try again; the status link appears after 3 failures.
  - The 31st search in a minute returns 429 with `Retry-After`.
  - Layout shift from the skeleton swap ≤ 0.05.
- **Tests first:** `SearchRateLimitTest.php`, new e2e cases, `e2e/perf/cls.spec.ts`.
- **Build:** `zmBusyRegion` directive, `api-problem.interceptor`, the search limiter.
- **Components:** `zm-skeleton`, `zm-alert`.

#### S8 — Sort, filter, URL state
- **L2:** 007, 008, 009.1/3/4, 097.4, 102.2.
- **Behaviour:**
  - Sorting by price keeps Abigail at No. 01 and orders the rest Elijah $350 → … → Grace $2,400.
  - Style chips combine with OR, and the summary line is announced.
  - An invalid `radius` in the URL falls back to 120.
  - The URL never contains a street address.
- **Tests first:** `SortAndFilterResultsTest.php` and `e2e/specs/discovery/sort-and-filter-results.spec.ts`.
- **Build:** `search-query-codec.ts`, sort, filter and summary components, `SearchSort`, `LineupFilter`, `LineupSorter`.

#### S9 — Result paging
- **L2:** 010, 095.1.
- **Behaviour:**
  - 24 cards per page; "Show more artists" adds the rest and moves focus to the first new card.
  - The cursor stays stable under every sort.
  - Uses a supporting cast near Barrie.
- **Tests first:** `ResultPagingTest.php` and a new e2e case.

#### S10 — Sold-out alternatives
- **L2:** 011.
- **Behaviour:**
  - Christmas Eve, gospel choir, within 40 km: nearby dates with counts, "Search within 120 km · 2 free", and "Show all styles".
  - Picking a nearby date updates the date field and the poster.
- **Tests first:** `SearchAlternativesTest.php` and `e2e/specs/discovery/suggest-alternatives-when-sold-out.spec.ts`.
- **Build:** `GET /api/v1/search/alternatives`, `FindSearchAlternatives`, `SoldOutExplainer`, `pages/discover/sold-out/`.
- **Components:** `zm-empty-state`.

#### S11 — Artist profile (header, About, setlist, loading and error)
- **L2:** 009.2, 012.1–3 (Save is behind a flag until M2), 013, 016, 083.1, 098, 105, 107.
- **Behaviour:**
  - `/artists/abigail-mensah?date=2026-11-14` shows the header, rating, a 5-song strip and "Book for Sat 14 Nov".
  - Back returns to the same Discover results.
  - A `<script>` in the bio renders as text.
  - A 500 shows the profile error page.
  - The API returns allowlisted fields only.
- **Tests first:** `tests/Feature/ArtistProfiles/ViewArtistProfileTest.php`, `e2e/specs/artist-profiles/view-artist-profile.spec.ts`, `pages/artist-profile.page.ts`.
- **ADR 0007:**
  - The public `ArtistProfileController` keeps its name; the editor becomes `ArtistWorkspace\ProfileDetailsController`.
  - The slug resolver is `ResolveArtistSlug`.
  - Update the affected designs.
- **Components:** `zm-breadcrumb`, `zm-setlist` (also the composite "profile setlist" scenario), and an artist-header scenario for `zm-poster`.

#### S12 — Photos and videos
- **L2:** 014, 015, 020.3.
- **Behaviour:**
  - Gallery is 2 columns at XS and 4 from MD.
  - The CDK photo viewer returns focus when closed.
  - "Watch her lead": no autoplay, captions included.
  - Processing videos are hidden.
  - An artist with no photos gets the act-type illustration.
- **Tests first:** `ProfileMediaTest.php`, e2e cases, `pages/photo-viewer.dialog.ts`.
- **Build:** artist_videos migration; the seeder adds a sample HLS stream with VTT captions.
- **ADR 0008:** hls.js as the player.
- **Components:** `zm-video-card`, `zm-video-player`.

#### S13 — Reviews on the profile
- **L2:** 018, 020.2, 060.1–2, 083.2.
- **Behaviour:**
  - "4.9 · 38 churches", the 4 newest reviews and artist replies.
  - "Show all" adds 10 at a time.
  - Miriam shows the empty state.
  - The rating is a mean of distinct churches, rounded to 1 dp; hidden reviews are excluded.
- **Tests first:** `tests/Feature/Reviews/ShowReviewsAndRatingTest.php` and `e2e/specs/reviews/show-reviews-and-rating.spec.ts`.
- **Build:** `GET /api/v1/artists/{slug}/reviews`, `ListArtistReviews`, the `RecalculateArtistRating` job.
- **Components:** `zm-review`.

#### S14 — Tour dates, booking stub, "How booking works"
- **L2:** 012.3, 017, 019, 020.1, 044.1.
- **Behaviour:**
  - Tour dates show "Your date". Booked rows show only the gathering type and city. Weekly days off are skipped.
  - "Pick" updates the stub and the header CTA.
  - A booked date typed in the stub shows an inline message and disables submit.
  - The stub is sticky from LG; below LG the header button scrolls to it.
- **Tests first:** `PickADateTest.php` and `e2e/specs/artist-profiles/pick-a-date-and-start-booking.spec.ts`.
- **Build:**
  - `ArtistAvailabilityController`, `ListTourDates`, `CancellationPolicy`.
  - `/#how` and `/#join` sections.
  - A `/artists/:slug/book` placeholder behind the `bookingRequests` flag. **Needs your OK**, because no mock covers it.
- **Components:** `zm-tour-dates`, `zm-inline-message`, `zm-steps`, `zm-description-list`, `zm-band`, and a stub scenario for `zm-booking-form`.

#### S15 — Missing artist, renamed slug, generic 404
- **L2:** 021, real status codes.
- **Behaviour:**
  - Hidden and nonexistent artists get the same 404 page with similar artists.
  - Old slugs redirect 301 and keep the query string.
  - `/no-such-page` shows the generic 404.
- **Tests first:** `ResolveMissingArtistTest.php` and `e2e/specs/artist-profiles/resolve-missing-artist.spec.ts` (asserts the HTTP status).
- **Build:** `ResolveArtistSlug`, `ArtistNotFound` problem, `SimilarArtistFinder`, slug_histories, `pages/not-found/`, SSR `RESPONSE_INIT`.
- **ADR 0009:** slug_histories uses the change-profile-address columns `(slug, retired_at)`.
- **Components:** `zm-error-page`.

#### S16 — Index and share (optional, last)
- **L2:** 089.1/3, 112, 113.
- **Behaviour:**
  - SSR adds the title, canonical link, Open Graph tags and JSON-LD `Person` with `aggregateRating`.
  - ETag and 304, `s-maxage=60`.
  - Share falls back to copying the link and shows a "Link copied" toast.
- **Components:** `zm-toast`, `zm-toast-region`.

### Fake routing (deterministic, keeps mock numbers exact)
- `FakeRoutingProvider` snaps each point to the nearest anchor in `CastRoutes` (within 2 km) and looks up a symmetric table:

  | From Burlington to | km |
  |---|---|
  | Hamilton | 14 |
  | Mississauga | 32 |
  | Brampton | 44 |
  | Etobicoke | 48 (Miriam has a 40 km drive limit, so she is excluded) |
  | North York | 63 |
  | Markham | 74 |
  | Scarborough | 81 |
  | Ajax | 97 |

  City Hall ↔ Burlington is 55 km and City Hall ↔ Ottawa is 450 km.
- Unknown pairs use haversine × 1.25.
- Test hooks: `override()`, `failNextWith(timeout)`, `calls()`.
- `FakeGeocoder` uses the same anchors.
- A supporting cast for the sold-out, not-found and paging cases (Barrie artists, choirs near Burlington, a suspended vocalist) is documented in `CastSeeder`.

### Known risks and open items
- **SSR transfer cache:** proved in S2. Responses with personal data must not be transfer-cached from M2 on.
- **Visual parity:**
  - Run the visual and axe suites in the Playwright Docker image, with Bebas Neue self-hosted.
  - Mask the signed-in top bar until M2.
  - Mock-only copy (for example Miriam's "filming her first live set") will cause diffs: update those mocks or mask them.
- **Windows:** `MSYS_NO_PATHCONV=1`, LF line endings, `vendor/` in a volume, `PHP_CLI_SERVER_WORKERS` for e2e.
- **Perf runner:** brand-new scenarios have no baseline and must not be flagged. CI builds the base branch from S2 on.
- **PostGIS:** not needed for M1 (bounding box plus B-tree).
- **Agents never add the `perf-regression-accepted` label.**

### Verification (end of M1)
1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Every Feature test is green, including the OpenAPI contract assertions.
2. `docker compose exec api php artisan db:seed` twice: row counts are unchanged.
3. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && NG_BUILD_MANGLE=0 npx ng build perf-test`.
4. `cd e2e && npx playwright test` passes all of these in Chromium: specs, `visual/`, `a11y/` (axe in light and dark), `perf/`.
5. `npm run perf-test -- --baseline <main dist> --fail-on-regression` produces no flagged rows.
6. Manual check: `npm start` and the compose `api`. Search Burlington / 14 Nov, open Abigail's profile, pick a date, switch the theme, and view at 320 px.
