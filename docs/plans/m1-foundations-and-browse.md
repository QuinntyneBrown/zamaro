# Milestone 1 plan and status: foundations and public browse

This is the working plan for building Zamaro, with Milestone 1 in detail. The current status comes
first; the full plan follows, including the notes on what changed while implementing. Later
milestones get their own plan in this folder when they start.

## Node.js port (2026-10-17)

The backend this plan built in Laravel was ported to Next.js on Node.js (ADR-0027) on branch
`claude/nextjs-backend-port`. Every M1 behaviour below now lives in `backend/src/`: route handlers under
`src/app/api/v1`, actions and services under `src/server/`, Drizzle migrations under
`database/migrations`, the cast seeder under `database/seeders`, and the catalogues under
`resources/i18n`. The Feature suite became Vitest tests in `backend/tests/feature`, run in-process on
PGlite with in-memory fakes (ADR-0028); the console commands became npm scripts (`db:migrate`,
`db:seed`, `db:reset`, `cast:booker`, `openapi:export`, `openapi:check`). Wherever the text below
names `php artisan`, Pint, Larastan, Scramble, Sanctum or Horizon, read the Node.js equivalent from
ADR-0027's table; the behaviour, the acceptance criteria and the route contracts are unchanged.

Journeys 1 and 2 were audited against every L2 criterion on 2026-10-18; see
[journeys-1-2-close-out.md](journeys-1-2-close-out.md).

## Current status (2026-10-10)

**Status: Done (2026-10-10).** Branch `feat/m1-foundations-and-browse`, opened as a pull request
against `main`. S0–S16 are built, then the close: L2-009.2 scroll restoration, the visual-parity and
axe suites (ADR-0014), Pint, and the end-of-M1 verification below.

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
| S12 | Photos and videos (local disk, no object storage in M1) | Done | `37d8f6c`, `263ee86`, `9c56457` (ADR-0010) |
| S13 | Reviews on the profile | Done | `eb1853c`, `7724bea`, `d9ed059` |
| S14 | Tour dates, booking stub, "How booking works" (submit hidden until M5) | Done | `b1e73c7`, `0dccb9e`, `ce741f7` (ADR-0012) |
| S15 | Missing artist, renamed slug, generic 404 | Done | `511efcb`, `bf69dd7`, `f87ceb4` (ADR-0011) |
| S16 | Index and share: page heads, ETags, robots and sitemap, Share and toasts | Done | `8fe4033`, `f4c2106`, `c963eb9` (ADR-0013) |
| Close | L2-009.2 scroll restoration | Done | `e9546a6` red test, `5a54fed` |
| Close | Visual-parity and axe suites, Bebas Neue self-hosted, parity fixes | Done | `f5b3c0f`, `9e14329`, `956564e` (ADR-0014) |
| Close | Pint on the five flagged files (formatting only) | Done | `1fb681d` |

**Checks at the last commit (the end-of-M1 verification, 2026-10-10):**
1. `docker compose --profile e2e up -d --wait`, then `php artisan test`: **119 Feature tests pass** (916 assertions) with the OpenAPI contract assertions; `scramble:export --fail-on-unknown` is clean; Pint passes on all 160 files.
2. `php artisan db:seed` twice on the dev database: the row count of every table is the same after both runs (43 artists, 38 reviews, 48 bookings, 81 users, 44 slug histories, 6 photos, 5 videos, …).
3. Frontend: `lint` and `format:check` are clean; `ng build zamaro` and `NG_BUILD_MANGLE=0 ng build perf-test` succeed.
4. `npx playwright test`: **170 tests pass** in Chromium against a freshly seeded e2e database: 92 specs and `perf/`, 26 `visual/` tests (130 captures) and 52 `a11y/` tests. The visual suite also passed twice more with `--repeat-each=2`, and `npm run test:docker -- visual` and `-- a11y` pass in the Playwright image.
5. Perf against the build of `7fbfee6` (the state before S12, built in a temporary worktree, since removed): the first run flagged **Artwork** (88.0 → 108.1 ms); the single permitted re-run did not flag it (89.3 → 112.1 ms, runs overlapping), and no other row was flagged. Skeleton (104.6 → 107.6) and Button (108.8 → 114.4) are unflagged after this close's changes. The Artwork cost is consistent at about +20 ms, so it is carried forward below rather than called noise. Fifteen scenarios are new since that base.
6. Manual check, driven by a script against `npm start` and the compose `api`: the Burlington chip with Sat 14 Nov shows "Sat 14 Nov · 7 free · within 120 km"; Abigail's profile opens from the headliner; Pick sets the stub's date to 2026-11-14; the header toggle paints the dark theme; at 320 px the page does not scroll sideways; no console errors.

**Open items carried forward (owner milestone):**
- **M2:** `zm-ticket-skeleton` (ticket CRD D-5) with the saved list's loading state; it replaces the Discover lineup's page skeletons, which lack the ticket frame, notches and perforation, and whose status line sits under the filters instead of above them (recorded in `adapt-layout-to-screens`).
- **M2:** CORS is still Laravel's default `*` and must be tightened.
- **M2:** `PrivateNoStore` (`Cache-Control: private, no-store`, L2-089.3) arrives with the first route that returns personal data; M1 has none. Toasts gain actions with the save toggle, and the `Toast` scenario its Undo.
- **M2:** the signed-in states join the routes manifest, the visual suite masks the signed-in top bar, and the booking form's `auth` variant is built. The browser-side move to a renamed slug is tested once the saved list links to one.
- **M3:** the Discover band ships without "Apply as an artist"; the action joins with the application page. Toasts gain `persistent`; the stepper arrives with the application.
- **M4:** object storage replaces the local `media` disk (`zamaro.media.disk`); the poster shows the primary photo; `zm-video-card` gains `manage` mode; `zm-tour-dates` gains `schedule`. `ArtistProfileUpdated`, `PurgeProfileCache` and the `CdnPurger` port (L2-089.2) arrive with profile editing; until then the 60-second `s-maxage` is the only bound, and the sitemap is not cached in Redis.
- **M4:** profile the **Artwork** scenario before `zm-artwork` changes again (+20 ms since S12's `ratio`, `photo` and `priority`; see check 5).
- **M5:** the stub's "Request to book" renders only when the `bookingRequests` flag is on (ADR-0012; off, a user decision). M5 adds the `/artists/:slug/book` route, hands the stub's values to it on submit, and turns the flag on in dev and e2e. The timeline arrives with the booking page.
- **M7:** only Abigail's rating has reviews behind it; the rest of the cast keeps seeded summaries. `QueueRatingRecalculation` and the review events arrive with leaving and moderating reviews.
- **M9:** `layout.spec.ts` from `adapt-layout-to-screens` (overflow, 44 px targets and 200 % zoom over the whole manifest); the forced-colours outline on `zm-skeleton`; `zm-error-stage`, the 500 page sending 500, and the offline page; the toast stack of three, its queue, `update()` and holding toasts behind a dialog.
- **M10:** the CI e2e job, which runs `npm run test:docker` against the `-linux` baselines; `Cache-Control` and `ETag` on the server-rendered profile HTML (with the CDN); `security.allowedHosts` and trusted proxy headers for the public hosts (ADR-0013); secondary hosts redirect to the primary.
- **With their screens (no fixed milestone):** `zm-inline-message` `busy` (needs `zm-spinner`), the other description-list variants, the `zm-form-field` split its CRD asks for, the remaining `zm-skeleton` shapes and `zm-button` surface mappings (band-on-stage ordering, D-9), and adding `ToastStack` to the `DarkTheme` composite (it raises an existing scenario's cost, so a maintainer must review it).

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
- e2e runs against an SSR build and the `api-e2e` compose service: database seeded once, clock frozen at Fri 9 Oct 2026 10:00 via `ZAMARO_FROZEN_NOW` and `page.clock`.
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
- **ADR renumbering (current):** 0008 went to S11, as S5 needed no ADR. S12 takes 0010 and S15 takes 0011 (0009 went to the Laravel 13 upgrade).
- **S12 is done** (37d8f6c API and seed, 263ee86 red tests, 9c56457 page and components, then ADR-0010 and docs).
  - **No object storage (user decision):** media keys live on a local `media` disk that Laravel serves under `/media` (`serve => true`); `App\Support\Media::url()` reads the disk from `zamaro.media.disk`, so M4 switches to object storage by config. The SSR server and the dev proxy forward `/media` like `/api`. Served files carry Laravel's `no-store` header, which is acceptable for dev and e2e only.
  - **Seed:** `CastSeeder` writes `artist_photos` and `artist_videos` rows (Abigail's four photos, four live videos and a processing "Jireh"; Miriam's two photos). `MediaSeeder` (new, run by `DatabaseSeeder`) writes GD-drawn WebP and AVIF renditions and posters and copies one committed 6-second sample HLS stream with WebVTT captions (`database/seeders/media/sample-video`, about 300 kB) that every live video plays. Existing files are skipped, so reseeding is fast and idempotent. Ratings and distances are unchanged.
  - **No `zm-video-player`:** the video card CRD makes the player part of `zm-video-card` (D-2 to D-4), so the plan's second component was not built. Only `play` mode is built; `manage` mode waits for M4.
  - **Library changes:** `zm-artwork` gained `ratio`, `photo` (with fallback to the placeholder on error) and `priority`; `zm-dialog` gained `kicker` and the `[slot=footer]`; `zm-icon` gained `arrow-left`. Not flagged by the perf test; `Artwork`'s median moved within the runner's noise (it swung 98–188 ms on the base build alone).
  - **ADR-0010 (OK, accepted default, 2026-10-10):** hls.js behind `ZM_HLS_LOADER`, lazy; native HLS first. Playwright's Chromium plays HLS natively, so a spec hides native HLS to cover the hls.js path.
  - **Drift recorded in the design:** grid photos are buttons, not the mock's links (they open a dialog and there is no photo route); the video thumbnail's label is the title, as the API has no poster description; "No videos yet" ships without "Ask {first name} for a recording", which needs the S14 stub. With no photos, the label reads "{Solo vocalist|Duo|Band|Choir} illustration: {name} hasn't added photos yet".
- **S13 is done** (eb1853c API, seed and backend tests, 7724bea red e2e tests, d9ed059 page and components, then docs).
  - **API:** the profile carries `reviews: { total, items (4), nextCursor }`; `GET /api/v1/artists/{slug}/reviews?cursor=` pages 10 at a time with Laravel's cursor over `created_at` and `id` (an undecodable cursor is a 422). Reviews carry `attribution { reviewerName, churchName, city, month }` and `reply { text, artistName, month }`; `month` is `YYYY-MM` and the page formats it (`FormatService.monthYear`). `review_replies` landed here.
  - **Rating:** `RecalculateArtistRating` is unique per artist on a new `high` queue (Horizon works it first). A church is the booking's name and city until churches have records (M2). No server cache to forget yet.
  - **Seed (the S6 open item):** Abigail now has 38 reviews from 38 churches, her four mock reviews the newest (Naomi's and Femi's texts are now the mocks' full text), plus Tomi's and Naomi's replies; 185 stars, shown as 4.9. The seeder runs the job for her, bulk-upserting the 34 older reviews so test setup stays quick. Every other artist keeps its seeded summary with no reviews behind it, so search sorting and the headliner tests are unchanged (backing them would give Marcus a headliner quote).
  - **Components:** `zm-review` (no `zm-review-skeleton` yet: its consumer is the artist's Reviews page, M7) and `zm-rating variant="summary"`. Per-review stars are drawn by `zm-review` (review CRD D-5), not a `stars` rating variant.
  - **Drift recorded in the design:** after the first page the button reads "Show 10 more" ("Show 4 more" last), taken from the artist's Reviews page mock; "Be her first booking" is a button that focuses the booking date instead of the mock's `#book-title` link; a failed page is silent, as on Discover; Report waits for sign-in.
- **S14 is done** (b1e73c7 API, flags and seed, 0dccb9e red e2e tests, ce741f7 page and components, then ADR-0012 and docs).
  - **API:** `GET /api/v1/artists/{slug}/tour-dates?from=` (`ArtistAvailabilityController::tourDates`, `ListTourDates`) returns the next 6 free or booked days as `{ date, status, kind, city }`, from 3 days ahead when `from` is missing or sooner. `GET /api/v1/artists/{slug}/availability?date=` returns `{ date, free, freeCancellationUntil }`; the last field comes from `CancellationPolicy` (`Services/Bookings`, 14 days) so the policy is tested through the API from M1. Out-of-window dates are 422 with the search form's copy. `AvailabilityService` gained `isFree()` and `days()` (three reads, then a walk); `BookingWindow` holds the 3-day and 18-month bounds for the new code (search and alternatives still compute their own).
  - **Feature flags (user decision; ADR-0012, OK, accepted default, 2026-10-10):** `config('zamaro.features.booking_requests')` from `ZAMARO_FEATURE_BOOKING_REQUESTS`, off by default, served by `GET /api/v1/features`; the frontend's root `FeatureFlags` reads it once (transfer-cached) and the stub renders "Request to book" only when it is on. No `/artists/:slug/book` route. ADR-0011 stays reserved for S15's slug history, so the flags took 0012.
  - **Seed:** Miriam's ticket number is ACT-0154 (upserted on the slug, so reseeding is idempotent). No test asserted ACT-0041.
  - **Page:** "Upcoming dates" and the stub are sections of `ArtistPage`, with `BookingDateStore` for the list, the stub's date and its check. "Your date" follows the stub's date (tour-dates CRD AC-12), so typing Sun 15 Nov stamps that row, unlike the booked-date mock. Pick needs no request and focuses the stub's date. The header's Book label follows the stub's date; the back link keeps the carried one. Kind of gathering comes from the remembered search when its date matches. The stub is sticky from LG and follows the reviews below it. "Ask {name} for a recording" writes the message into the stub and focuses it; "Be her first booking" focuses the date. The note beside the list reads "{name}'s calendar is wide open this {season}." when no listed date is booked.
  - **Discover:** `pages/discover/how-booking-works` renders `#how` (three `zm-steps` and the `#policy` list in `zm-description-list`), and `#join` is a `zm-band` without "Apply as an artist" until M3. The stub's "Cancel free up to 14 days before" links to `/#how`.
  - **Components:** `zm-tour-dates` (`public` variant, loading), `zm-inline-message` (no `busy` yet), `zm-steps` (no stepper or timeline), `zm-description-list` (`definition`), `zm-band`, and `zm-booking-form variant="stub"` (`titleId` renamed `headingId`). Also `zm-button` `size="sm"` and `block` and the band's stage skin, `zm-badge variant="booked"`, the `check` icon, and interim `zm-form-field` additions: a textarea, `placeholder`, `optionalMarker`, a live error region and `[slot=message]` named by a `messageId` input (form-field CRD D-14: a content query cost every field about 8 %). Each CRD records what is built.
  - **Perf:** no rows flagged. New scenarios `TourDates`, `InlineMessage`, `Steps`, `DescriptionList`, `Band` and `BookingStub` (150 iterations). `FormField` rose about 9 % (120 to 131 ms) and `BookingForm` about 6–13 % with the textarea, marker and live region, within the overlap rule.
  - **Tests:** `tests/Feature/ArtistProfiles/PickADateTest.php` (12), `tests/Feature/Operations/FeatureFlagsTest.php` (2) and `e2e/specs/artist-profiles/pick-a-date-and-start-booking.spec.ts` (13, including Discover's sections and the flag turned on by intercepting `/api/v1/features` after client-side navigation).
- **S15 is done** (`511efcb` API, seed and backend tests, `bf69dd7` red e2e tests, `f87ceb4` pages and component, then ADR-0011 and docs).
  - **ADR-0011 (OK, accepted default, 2026-10-10):** one resolver, `ResolveArtistSlug` (`ArtistSlugResolver` is retired as a name), used by all four `/api/v1/artists/{slug}` routes. It returns the viewable artist or throws `ArtistMoved` (rendered as a bodiless 301 to the same route under the current slug, relative `Location`, query string kept) or `ArtistNotFound` (the `artist-not-found` problem, "This artist isn’t on Zamaro"). `slug_histories` uses the change-profile-address columns `(artist_id, slug unique, retired_at)` and holds every current and retired slug; the migration backfills the current ones. Both designs and their diagrams are updated.
  - **The design's `<TO SUPPLY>` items (accepted defaults, recorded in ADR-0011):** the primary style is the first of an artist's styles in the chips' order; a slug that never existed matches any style; without a carried location the suggestions are measured from Toronto City Hall, without a radius within 120 km, without a date inside the window on the first bookable day. The hidden artist's base is never used.
  - **API:** the profile reads the carried search leniently from `date`, `kind`, `lat`, `lng`, `radius` (`ShowArtistProfileRequest`; a stale date is no error) and adds `similarArtists: { date, radiusKm, items }` (lineup tickets, up to 3, nearest first) from `SimilarArtistFinder` (`Services/Discovery`, for M5). Sub-resources return the problem without suggestions. `ProblemDetails` gained `extensions`.
  - **Seed:** every artist's current slug in `slug_histories`, Abigail's retired `abigail-sings`, and Selah Brooks (ACT-0044), a suspended solo vocalist. No existing search, headliner or count changed.
  - **SSR statuses:** a root `HttpStatus` sets `RESPONSE_INIT.status` on the server only. A missing artist sets 404; a `**` route renders `pages/not-found/not-found` and sets 404. For a move the API's 301 is followed by the fetch backend; when the profile comes back under another slug, `ArtistProfileStore` sets 301 and navigates with `replaceUrl` and the query kept, and Angular's SSR engine turns that into `301 Location: /artists/{current}?…`. The API returns the redirect itself rather than a target in a body. There is no server-error page yet, so nothing sends 500 (M9/M10 with the 500 and offline screens).
  - **Hydration:** the HTTP transfer cache keeps successes only, so `HttpArtistProfilesApi` puts a 404's suggestions in the transfer state on the server; the browser shows the server's page without asking again (tested).
  - **Carried search:** the profile request carries the last lineup's `date`, `kind`, `lat`, `lng` and `radius` when its date matches the profile's `date`, otherwise the date alone, so found profiles are cached per search for their 60 seconds. Opened without a search (any fresh load), the list reads "within 120 km of Toronto" and tickets "{city} · {km} from Toronto"; the mock's "within 120 km of Burlington" and "from you" appear after a Discover search.
  - **Component:** `zm-error-page` (all inputs and slots) and the `ErrorPage` scenario (the 500 composition). The `h1` is named by `aria-label` when `posterSuffix` is set: Chrome reads a visually hidden span as "No show : page not found" (CRD notes). `zm-error-stage` is not built; the profile error stays page markup until the 500 and offline pages.
  - **Drift recorded in the design:** the generic 404 has one action ("Your saved artists" waits for M2); suggestion tickets have no Save (M2); with no suggestions the lead keeps its first sentence and "Find who’s free" leads to Discover.
  - **Tests:** `tests/Feature/ArtistProfiles/ResolveMissingArtistTest.php` (11) and `e2e/specs/artist-profiles/resolve-missing-artist.spec.ts` (7, asserting the 404, 301 and 200 statuses through `NotFoundPage`). The Discover-search case stands in for an artist hidden after the lineup listed them by rewriting the browser's profile request. `ArtistProfilePage`'s intercepts now match the profile URL with any query string.
  - **Not covered end to end:** the browser-side move (an in-app link to a retired slug); no screen links to one until M2's saved list.
- **S16 is done** (`8fe4033` red tests, `f4c2106` API, `c963eb9` pages, server and components, then ADR-0013 and docs).
  - **API (L2-089.1, L2-112.3):** `cache.headers:etag` on the profile, tour-dates and availability routes gives a strong ETag of the body (Laravel's xxh128) and a bodiless 304 on a matching `If-None-Match`; a 404 or 301 has none. The profile keeps `public, max-age=0, s-maxage=60`; tour dates and the date check keep S14's headers rather than the design's `no-cache` (drift recorded in the design). `GET /api/v1/sitemap` (`SitemapController`, `ListPublishedProfiles`) returns `{ data: [{ slug, lastModified }] }` for the visible scope.
  - **Heads (L2-112.1–2, L2-113.1):** `PageMeta` (`app/shared`) writes the title, description, robots, canonical link, Open Graph and Twitter tags and one JSON-LD block, and replaces all of it on each call. `ProfileSeo` (`pages/artist`) builds the profile's head: "{name} · Worship artist in {city} · Zamaro"; "{headline}. {bio}" cut at a word to **160 characters (the design's `<TO SUPPLY>`; OK, accepted default, 2026-10-10, recorded in the design)**; the primary photo's 1200 px rendition; and `Person` or `MusicGroup` with `aggregateRating` when `reviewCount > 0`. Discover ("Worship artists within driving distance of Toronto · Zamaro", canonical `/`), the generic 404, the missing artist and the profile error set their own; the last three are `noindex`.
  - **ADR-0013 (OK, accepted default, 2026-10-10):** absolute URLs use the origin the request arrived at (Angular's `REQUEST` on the server, `document.location` in the browser), so e2e sees `http://localhost:4000/...`. `allowedHosts` guards it, and there is no `SITE_ORIGIN` setting.
  - **robots.txt and sitemap.xml (L2-112.3–4):** Express routes in `server.ts` (`crawler-files.ts`). robots.txt adds `Allow: /artists/`, because `Disallow: /artist` alone would hide every profile by prefix. The sitemap lists `/` and every published profile with `lastmod`.
  - **Share (L2-113.2–3):** a `zm-button` with the new `share` icon after Book, as in the mock (Save still waits for M2). `ShareLink` (`app/shared`) calls `navigator.share({ title, url })` with the page title and the canonical address. `AbortError` ends it there; any other failure, or no share sheet at all, copies the address with the CDK `Clipboard` and shows "Link copied" (kind "Shared", key `share`).
  - **Components:** `zm-toast-region`, `zm-toast` (internal) and `ToastService` in the components library, with the region last in the shell. Built: timed and danger toasts, pausing on hover, focus and a hidden tab, replacing by key, and Escape and dismiss with focus return. The CRD records what waits for later callers. Perf: no rows flagged; `Toast` and `ToastStack` are new.
  - **Lint:** `zamaro/no-hardcoded-text` now also flags string literals passed as toast text, to `Title.setTitle` and to `AnnouncerService.polite` (the call-site checks S2c deferred).
  - **Tests:** `tests/Feature/ArtistProfiles/IndexAndShareProfileTest.php` (7) and `e2e/specs/artist-profiles/index-and-share-profile.spec.ts` (18). They use the `Crawler` page object (raw HTML parsed without running script, robots, sitemap), `readHead` for the live head, toasts on `Shell`, and `startClock` and `passTime` for the toast timer. The share sheet is stubbed on `Navigator.prototype`; the fallback deletes it and grants the clipboard permissions.
  - **Not built (open items above):** `PrivateNoStore` (M2, since M1 serves no personal data), the CDN purge (M4), and cache headers on the server-rendered HTML (M10).
- **M1 close (2026-10-10).**
  - **L2-009.2** (`e9546a6` red, `5a54fed`): `LastSearch` keeps the lineup as last shown, with every loaded page and the sold-out ways forward. On a Back or Forward (`popstate`) to that search, Discover shows it without searching, and the router's `scrollPositionRestoration: 'enabled'` restores the position. Any other way to the same address searches afresh, so the cache is never stale (recorded in `sort-and-filter-results`). Search, sort, chip and sold-out navigations pass `scroll: 'manual'`; every other forward navigation starts at the top, so a profile opened from deep in the lineup opens at its top.
  - **Visual and axe suites (ADR-0014, OK, accepted default, 2026-10-10 for M9 D22):** the manifest names 13 states (the six M1 had, plus Discover loading, error, rate-limited and sold out, and the profile's loading and error). `e2e/fixtures/route-states.ts` opens each through the page objects. `visual/` captures full pages at 320, 576, 768, 992 and 1200 px in both themes with `maxDiffPixelRatio: 0.001` and masks the rate-limit countdown; `a11y/` runs axe with the WCAG 2.0, 2.1 and 2.2 A and AA tags in both themes at XS and XL and fails on any violation. It found none.
  - **Where the suites run (the risk below):** both locally on this Windows host and in `mcr.microsoft.com/playwright:v1.64.0-noble` through `npm run test:docker`, which seeds the e2e database on the host and points the container's web server at `host.docker.internal:8001`. Each platform keeps its own baselines (`-win32` and `-linux`, about 55 MB together); an intended design change regenerates both.
  - **Bebas Neue** is self-hosted from `@fontsource/bebas-neue` (an asset glob copies the `woff2` files to `/fonts` in every app; the zamaro shell preloads the Latin file).
  - **Parity bugs fixed** after reviewing the baselines against `docs/mocks/pages` (rendered with Playwright): the CDK live announcer's text printed under the footer (its visually-hidden style never reached the hydrated page; the CDK `a11y-prebuilt.css` is now global); Share on the profile's stage was a filled button instead of the paper outline (button CRD's `.on-stage` mapping); skeletons on the stage were paper-coloured (skeleton CRD AC-10); the profile's loading state lacked the video block and the stub card (new `control`, `control-lg` and `wide` shapes); the profile poster lacked the halftone corner. Perf: Skeleton and Button unflagged.
  - **Deliberate differences** from the mocks are listed in `adapt-layout-to-screens` (display face, signed-out shell, M3 and M5 actions, no carried search in the manifest, seeded photos, editorial subtitles, the Discover loading tickets).
  - **Pint** (`1fb681d`): imports instead of fully qualified names in the five files it flagged; formatting only.

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
- **Build:** artist_photos and artist_videos migrations; the seeder adds sample photos and a sample HLS stream with VTT captions on the local media disk.
- **ADR 0010:** hls.js as the player.
- **Components:** `zm-video-card` (its CRD includes the player, so there is no `zm-video-player`).

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
  - ~~A `/artists/:slug/book` placeholder behind the `bookingRequests` flag.~~ Decided by the user (2026-10-09): no placeholder route; the submit is hidden behind the off flag.
- **Components:** `zm-tour-dates`, `zm-inline-message`, `zm-steps`, `zm-description-list`, `zm-band`, and a stub scenario for `zm-booking-form`.

#### S15 — Missing artist, renamed slug, generic 404
- **L2:** 021, real status codes.
- **Behaviour:**
  - Hidden and nonexistent artists get the same 404 page with similar artists.
  - Old slugs redirect 301 and keep the query string.
  - `/no-such-page` shows the generic 404.
- **Tests first:** `ResolveMissingArtistTest.php` and `e2e/specs/artist-profiles/resolve-missing-artist.spec.ts` (asserts the HTTP status).
- **Build:** `ResolveArtistSlug`, `ArtistNotFound` problem, `SimilarArtistFinder`, slug_histories, `pages/not-found/`, SSR `RESPONSE_INIT`.
- **ADR 0011** (renumbered from 0009): slug_histories uses the change-profile-address columns `(slug, retired_at)`; the resolver is `ResolveArtistSlug`.
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
    *Resolved at the close (ADR-0014):* they run locally and in the image, with one baseline set per platform.
  - Mask the signed-in top bar until M2. *M1 renders no signed-in state, so nothing is masked yet.*
  - Mock-only copy (for example Miriam's "filming her first live set") will cause diffs: update those mocks or mask them.
    *As built:* baselines come from the app, so mock-only copy causes no diff; it is reviewed by hand and listed in `adapt-layout-to-screens`.
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
