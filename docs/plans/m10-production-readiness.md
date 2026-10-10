# Milestone 10 plan: production readiness

**Status:** Not started. Depends on M9, which includes the Laravel decision D18 and the header scan.
S1–S4 depend only on M2 and are recommended to move forward (see "Staging earlier").

## Context

After M9 the product is complete and hardened, but it has never left Docker Compose:

- **Fakes:** every outside vendor is still a fake behind a port. In `backend/app/Contracts`, M1 has
  `RoutingProvider` and `Geocoder`, and M2–M8 add the rest. A fake bound in production throws at boot
  (ADR-0002).
- **Backend image:** `backend/Dockerfile` is a dev image (`php:8.3-cli`, `artisan serve`).
- **Frontend image:** `frontend/` has no `Dockerfile`.
- **CI:** `.ci/` holds `lint.sh`, `backend-test.sh` and `build.sh`, plus the e2e, perf-test,
  header-scan and scan jobs added in M1–M9. Nothing builds images, migrates, deploys or rolls back.
- **Readiness:** readiness checks have no per-check timeout. A hung Redis took about 6 s (ADR-0005,
  deferred to M10).
- **Nothing measured yet:**
  - no load test
  - no gzip bundle gate
  - no Lighthouse run
  - no RUM
  - no error tracking
  - no alerting
  - no backups

**Goal:** run Zamaro in a Canadian region with zero-downtime, readiness-gated deploys. That means:
- migrations run explicitly, never on startup;
- rollback within 15 minutes, PITR to 15 minutes and a recorded restore drill;
- every vendor port backed by a real adapter, each chosen in its own ADR, with the fakes kept for tests;
- every pipeline stage in AGENTS.md running from `.ci/`;
- budgets proven: API p95 by load test, page speed by Lighthouse and RUM, bundle size by gzip check.

## Staging earlier: recommendation

**Recommendation: yes, bring S1–S4 forward to just after M2, as a short "M2.5 staging" milestone.**

**Reasons:**
- M9's header scan (L2-071.2) and this milestone's Lighthouse run (L2-086.2) both need a deployed preview.
- M3 uploads and M4 object storage benefit from a real S3 bucket and a real scanner early.
- Deploy mechanics (migrations run explicitly, readiness-gated rollout, secrets from a secrets manager)
  are cheapest to fix while the schema is small.

**What it means in practice:**
- Staging runs `APP_ENV=staging`, which may bind fakes. Only `production` refuses them.
- Production, backups, real vendor adapters and the load test stay in M10.

**Cost:**
- The hosting decisions (H1–H4 below) are needed about eight milestones sooner.
- There is a monthly staging bill from M3 onwards.

**If you decline:** S1–S4 run here as written, and M9's scan keeps using the local edge until S3.

## Entry criteria and dependencies

- M9 is merged. The ADR that supersedes ADR-0004 (Laravel version) is accepted, or the user has
  explicitly accepted the risk for production.
- The hosting, domain and vendor decisions marked **Needs your OK** below are confirmed. Each adapter
  slice needs only its own vendor's decision.
- Accounts exist with the hosting provider and each chosen vendor, with sandbox or test credentials.
- The production domain is registered, and so is the separate media domain (V8).

## Decisions to make or confirm

### Hosting, environments and operations
| # | Decision (source) | Recommended default | Needs your OK |
|---|---|---|---|
| H1 | Hosting provider and Canadian region (`back-up-deploy-and-host`, L2-084) | AWS `ca-central-1` (Montreal). The `ObjectStorage` port and the video multipart design are S3-shaped. The alternative is Azure Canada Central (Toronto). | **Yes** |
| H2 | Container platform | ECS on Fargate behind an Application Load Balancer. One service each for `zamaro-web`, `zamaro-api` and `zamaro-worker`; one scheduler task (desired count 1); a one-off ECS task for `migrate`. | **Yes** |
| H3 | Environments | `staging` deploys on every merge to `main`. `production` is promoted automatically after staging's smoke test. `perf` is staging scaled to production size for load runs only. | **Yes** (cost) |
| H4 | Infrastructure as code (designs silent; not in the AGENTS.md tree) | OpenTofu in `infra/` (modules `network`, `data`, `compute`, `edge`, `observability`), state in an encrypted S3 backend in `ca-central-1`. Add `infra/` to the tree. | **Yes** |
| H5 | Domains | `zamaro.ca` (the mocks use `hello@zamaro.ca`), `staging.zamaro.ca`, and a separate registrable media domain (V8). | **Yes** |
| H6 | Edge TLS policy, ciphers and CA (`enforce-transport-and-headers`) | ALB policy `ELBSecurityPolicy-TLS13-1-2-2021-06`, an ACM certificate, and an HTTP listener that only answers 301. | No |
| H7 | Secrets manager and platform mechanism (`protect-secrets-and-data`) | AWS Secrets Manager. Secret sets `zamaro/staging` and `zamaro/production` are injected through ECS task `secrets`. CI deploys through GitHub OIDC, with no long-lived keys. | **Yes** |
| H8 | PHP runtime model (`meet-response-time-budgets`) | FrankenPHP in classic (non-worker) mode with OPcache, one process per container. Switch to Octane worker mode only if S9 misses a budget. | No |
| H9 | WAL archive interval and RPO (`back-up-deploy-and-host`) | RDS PostgreSQL 16 automated backups with 14-day retention. Transaction logs ship every 5 minutes, within the 15-minute limit. | No |
| H10 | Object storage versioning and retention | S3 versioning on media and documents, with noncurrent versions expiring after 14 days. That matches PITR, so erased media also leaves backups within 14 days (M9). | **Yes** |
| H11 | Restore drill runbook and where the record is kept (design `ops/restore-drill`) | `docs/runbooks/restore-drill.md`, plus a `RestoreDrillRecord` row appended to `docs/runbooks/restore-drill-log.md` per drill. | No |
| H12 | Log retention (`monitor-health-and-errors`) | CloudWatch Logs in `ca-central-1`: 30 days for application logs, 1 year for the `security` channel. | **Yes** |
| H13 | Readiness per-check timeout and probe settings (ADR-0005) | 1 s connect and read timeout per check, 3 s probe timeout, 10 s interval, 3 failures to unhealthy. | No |
| H14 | Uptime targets, interval and the booking API target | 1-minute probes of `/`, `/artists/abigail-mensah` and an unauthenticated booking read (`GET /api/v1/artists/abigail-mensah/tour-dates`). No synthetic account holds production credentials. | **Yes** |
| H15 | On-call rota and escalation | The owner alone at launch. Alerts reach the owner by SMS and email; there is no escalation tier. | **Yes** |
| H16 | Load-test tool, mix, duration and schedule | k6 scripts in `backend/tests/load/`. 50 req/s for 10 minutes after a 2-minute ramp. Mix: 50% profile reads, 30% searches, 20% writes. Runs nightly on `perf` and before each release tag. | No |
| H17 | Performance environment sizing | Same task sizes and database class as production, scaled up only for the run. | **Yes** (cost) |
| H18 | Profile cache TTL and ETag hash | 1-hour Redis TTL; it is invalidated on change anyway. Strong ETag from `xxh128` of the body. | No |
| H19 | Lighthouse runs per page | 3 runs, median score, against staging. | No |
| H20 | Bebas Neue fallback metrics | `size-adjust`, `ascent-override` and `descent-override` computed once with Capsize metrics and committed to `typography.scss`. | No |
| H21 | VSC "vendor" | The VSC design names no outside service: an administrator verifies the uploaded document. So there is no port and no adapter. Add one only if you want a background-check provider, and that needs a new requirement. | **Yes** |

### Vendors (one ADR each)
| # | Port | Recommended vendor | Needs your OK |
|---|---|---|---|
| V1 | `RoutingProvider` (matrix) | Self-hosted OSRM, car profile, Ontario and Quebec extract, running as an ECS service in `ca-central-1`. Church coordinates never leave Canada, and there is no per-call fee. The existing ×1.3 fallback covers outages. | **Yes** |
| V2 | `Geocoder` and the address type-ahead (`manage-church-profile`) | Canada Post AddressComplete for address search and geocoding. Mapbox (permanent geocoding) is the fallback. Avoid Google: its terms limit storing coordinates. | **Yes** |
| V3 | Mail transport and bounce webhook (`send-transactional-emails`) | Amazon SES in `ca-central-1`, with bounces through SNS to `/api/v1/webhooks/email`. The sending domain is `zamaro.ca`, with SPF, DKIM and DMARC `quarantine`. | **Yes** |
| V4 | `PaymentGateway` (deposits, balances, refunds, webhooks, payouts) | Stripe: Payment Element hosted fields, Connect Express for artist payouts, and idempotency keys passed through. | **Yes** |
| V5 | `MediaScanner` | ClamAV `clamd` as an internal ECS service, streamed with `INSTREAM`. Above its stream limit, GuardDuty Malware Protection for S3 handles videos up to 1 GB; confirm the limits in the ADR. | **Yes** |
| V6 | `ObjectStorage` | S3 `ca-central-1`: SSE (AES-256), Block Public Access on `quarantine/` and `documents/`, and a lifecycle rule that deletes quarantine objects after 24 h. | **Yes** (with H1) |
| V7 | `VideoTranscoder` | AWS Elemental MediaConvert in `ca-central-1`: HLS (ADR-0009, hls.js), 4-second segments at 360p, 720p and 1080p, with completion through EventBridge to a webhook. | **Yes** |
| V8 | CDN and `CdnPurger` | CloudFront for web assets (per-release prefix) and for the media domain, with purges through `CreateInvalidation`. The 60 s `s-maxage` is the guarantee; purges only shorten staleness. | **Yes** |
| V9 | `BotChallenge` | Cloudflare Turnstile (privacy-respecting, L2-077.4). When the provider is unreachable, fail closed with the 422 copy and alert. | **Yes** |
| V10 | `BreachedPasswordChecker` | HIBP Pwned Passwords range API. Only a 5-character SHA-1 prefix leaves Zamaro. | **Yes** |
| V11 | IP geolocation for the session list (`manage-account-settings`) | MaxMind GeoLite2 City database bundled in the image, so nothing leaves Zamaro. | **Yes** |
| V12 | `ErrorReporter`, plus the frontend SDK | Sentry SaaS with `sendDefaultPii=false`, IPs scrubbed, the shared redaction list in `beforeSend`, and only a pseudonymous user ID. The alternative is self-hosted GlitchTip in `ca-central-1` if no personal data may leave Canada. | **Yes** |
| V13 | `MetricsRecorder` and alert rules | CloudWatch Embedded Metric Format written to stdout (no agent), with alarms defined in `infra/observability`. | **Yes** |
| V14 | `OnCallAlerter` | SNS topic to SMS and email (H15). PagerDuty Events v2 can replace it later behind the same port. | **Yes** |
| V15 | Uptime monitor and public status page (L2-090, L2-106) | Better Stack. It receives no personal data. Its status page URL replaces the placeholder that M1 S7 links after 3 failed searches. | **Yes** |
| V16 | RUM (`deliver-fast-pages`) | A first-party beacon: `POST /api/v1/vitals` (public, throttled, no cookies needed) records through `MetricsRecorder`, with a 100% sample at launch. It adds no third-party script to the CSP, and the data stays in Canada. The design is updated. | **Yes** |
| V17 | CSP reporting (M9 D14) | Keep the first-party `/api/v1/csp-reports`, and forward it to the error tracker. | No |

## Design conflicts and resolutions

1. **"Unit tests: Laravel and Angular unit suites"** (`back-up-deploy-and-host`) clashes with AGENTS.md,
   which has backend Feature tests and frontend Playwright tests. **Resolution:** the `tests` stage runs
   `php artisan test` and the Playwright suites. There is no Angular unit suite. Update the design's
   stage table.
2. **The stage lists differ.** The design has lint, unit, acceptance, security scans, budgets, contract,
   migration compatibility, build, migrate and rollout. AGENTS.md adds the **perf test**. **Resolution:**
   the stages, in order, are:
   1. `lint`
   2. `tests` (Feature and e2e, with visual and a11y)
   3. `scans`
   4. `budgets`
   5. `perf-test` (pull requests touching `frontend/` or `e2e/perf-test/`)
   6. `contract` (OpenAPI export, contract assertions and `MigrationCompatibilityCheck`)
   7. `build`
   8. `migrate`
   9. `rollout`

   Update both documents.
3. **The design deploys a merge to production directly; the roadmap names a staging environment.**
   **Resolution (H3):** main deploys to staging, then the smoke test, header scan and Lighthouse run,
   then production is promoted automatically. This still satisfies L2-094.1, with no manual step.
4. **Paths outside the AGENTS.md tree:** the design's `ops/restore-drill` and the IaC. **Resolution:**
   - runbooks go in `docs/runbooks/`;
   - IaC goes in `infra/` (H4);
   - the hosting ADR updates the tree and the design.
5. **Port names and locations.** The designs put interfaces in `App\Services\*` (`MalwareScanner`,
   `BotChallengeVerifier`, `PaymentGateway`). ADR-0002 and AGENTS.md put them in `app/Contracts`
   (`MediaScanner`, `BotChallenge`). **Resolution:** each adapter ADR names the port exactly as M2–M8
   built it in `app/Contracts`, and fixes the design.
   - `OnCallAlerter`, `MetricsRecorder` and `CdnPurger` are not in ADR-0002's list. If M2–M8 have not
     added them, they join `Contracts/` with fakes.
6. **`check-bundle-budgets` asserts that no `/artist` or `/admin` chunk is reachable from the Discover
   entry graph.** That is a structure assertion. **Resolution:**
   - prove L2-087.2 by behaviour: a Playwright spec records the network while a booker loads Discover,
     and finds no artist-area chunk;
   - the script keeps only the gzip size budgets;
   - `/admin` is a separate application (ADR-0001), so the design's `canMatch` on `/admin/*` does not
     apply; update that line.
7. **The health routes are "blocked at the CDN", but the edge routes `/health/*` to the API.**
   **Resolution:** the ALB target-group probes call the origin directly. CloudFront and the ALB listener
   return 404 for `/health/*` from the internet. The uptime monitor probes pages, not health routes.
8. **HSTS `includeSubDomains` and the media domain.** A `media.zamaro.ca` subdomain is the same site, and
   HSTS would cover it. **Resolution:** use a separate registrable domain for media (V8/H5), as
   `scan-and-serve-uploads` intends: no shared cookies, different site.
9. **RUM vendor (V16).** The design assumes a third-party RUM service. **Resolution:** if V16 is approved,
   the first-party beacon replaces it, and the design gains the `/api/v1/vitals` endpoint.

## Slices

Slices follow M1's loop. Infrastructure slices use verification steps instead of acceptance tests, as M1's
S0 did. Every adapter keeps its fake bound in `testing` and `local`. Each adapter gets Feature tests of
the port contract against recorded vendor responses (`Http::fake` fixtures in
`tests/Feature/Integrations/{Vendor}/`), plus a `@group sandbox` smoke run against the vendor's test
mode on staging, outside the default CI path.

### S1 — Hosting foundation and staging (infrastructure)
- **L2:** 084.1, 079.1 (at-rest settings).
- **Build:**
  - `infra/` modules: VPC with private subnets, RDS PostgreSQL 16 (encrypted, 14-day PITR), ElastiCache
    Redis (encrypted in transit and at rest), S3 buckets, ALB, ECS cluster, CloudWatch log groups and
    Secrets Manager, all in `ca-central-1`.
  - `.ci/residency-check.sh` queries every resource's region and encryption flag and fails on any
    resource outside Canada or unencrypted.
- **Verify:** `tofu plan` is clean; `bash .ci/residency-check.sh staging` exits 0.
- **ADR:** hosting provider, region and infrastructure as code (H1, H2, H4); it updates the AGENTS.md
  tree.

### S2 — Production images and secrets at start-up
- **L2:** 078.3, 090.2.
- **Behaviour:**
  - `zamaro-api` starts with no `.env`.
  - With a secret removed from `zamaro/staging`, the task fails readiness and receives no traffic
    (M9 S4 `ProductionSafetyServiceProvider`).
  - The same image runs as the API, `horizon` (worker) and `schedule:work` (scheduler).
  - `zamaro-web` serves `zamaro` with SSR and `admin` under `/admin`, with M9's headers.
- **Verification:**
  - `docker build` both images.
  - `docker run` the API image with `APP_ENV=production` and `APP_DEBUG=true`: it exits non-zero.
  - Run the image with no `.env` and confirm the image holds no secrets (`gitleaks` over the image
    filesystem).
- **Build:**
  - Multi-stage `backend/Dockerfile`: a `dev` target keeps the compose setup; `prod` is FrankenPHP
    classic, `composer install --no-dev`, OPcache, a non-root user, and the GeoLite2 database (V11).
  - `frontend/Dockerfile`: Node 22 slim, SSR server, browser assets.
  - Compose uses `target: dev`.
- **ADR:** PHP runtime model (H8).

### S3 — Pipeline: build, migrate, readiness-gated rollout, smoke, auto-rollback
- **L2:** 094.1–2.
- **Behaviour:**
  - A merge to `main` builds both images tagged with the release version and writes
    `release-manifest.json` (version, commit, image digests, asset prefix, migrations).
  - The pipeline uploads the hashed assets under `/{release}/` and keeps the previous prefix.
  - It runs `php artisan migrate --force` as a one-off task. The API never migrates on boot.
  - It rolls out the API, then Web, then the Worker (`horizon:terminate`), each instance joining the
    load balancer only after `/health/ready` returns 200.
  - It runs the smoke test (`/`, a profile and the booking read).
  - A failing smoke test triggers rollback automatically.
  - A migration that drops a column fails `MigrationCompatibilityCheck`, which applies the candidate's
    migrations and then runs the previous release's Feature suite.
  - A k6 probe at 5 req/s during the rollout sees no 5xx and no failed connection, proving zero downtime.
- **Tests first / verification:**
  - `.ci/migration-compat.sh`, with a deliberately dropping migration on a scratch branch.
  - `backend/tests/load/rollout-probe.js`.
  - Deploy one release to staging and record the probe result.
- **Build:**
  - `.ci/{build-images,migrate,rollout,smoke,migration-compat}.sh`.
  - `.github/workflows/deploy.yml` (environments `staging` and `production`, OIDC).
  - `ReleaseManifest` as a pipeline artifact.
  - A `ContractMigration` naming rule in `docs/runbooks/migrations.md`.
- **ADR:** release pipeline and expand–contract migrations.

### S4 — Rollback within 15 minutes
- **L2:** 094.3.
- **Behaviour:** `gh workflow run rollback.yml -f environment=staging` redeploys the previous manifest's
  digests through the same readiness-gated steps and runs no down-migrations. The workflow records the
  minutes from trigger to the previous release serving. It must be 15 or less, and a slower rollback
  fails the job.
- **Verification:** deploy release N+1 to staging, roll back, and record the time in the job summary.
- **Build:** `.github/workflows/rollback.yml` and `.ci/rollback.sh`.

### S5 — Backups, PITR and the restore drill
- **L2:** 091.1–2, 084.1.
- **Behaviour:** the drill restores staging, and then production, to a chosen moment within the last 14
  days into a fresh environment (`infra` workspace `drill-YYYYQN`). It deploys the current release, checks
  readiness and runs the smoke test. The whole drill takes 4 hours or less, and the outcome is appended to
  the drill log.
- **Verification:**
  - Run the drill on staging.
  - Confirm the latest restorable time in RDS is less than 5 minutes behind.
  - Confirm S3 versioning and the noncurrent expiry (H10).
- **Build:**
  - `docs/runbooks/restore-drill.md` and `restore-drill-log.md`.
  - `.ci/restore-drill.sh`.
  - A scheduled reminder issue each quarter.
- **ADR:** backup policy and recovery targets (H9–H11).

### S6 — Readiness timeouts and platform probes
- **L2:** 090.2.
- **Behaviour:** with the cache Redis host pointed at a black-hole address, `/health/ready` returns 503
  `{"status":"not ready","failed":["cache"]}` within 2 s, not 6 s. `/health/live` stays 200. On staging,
  the ALB removes an instance that fails readiness, and ECS restarts one that fails liveness.
- **Tests first:** `tests/Feature/Operations/ReadinessTimeoutTest.php`.
- **Build:**
  - per-check timeouts in `Services/Operations/Readiness` (PDO `ATTR_TIMEOUT`, Redis `timeout` and
    `read_timeout`) from `config/zamaro.php`;
  - probe settings in `infra/compute` (H13).
- **ADR:** none. Amend ADR-0005's "deferred" note with a follow-up line, per the ADR README.

### S7 — Error tracking and the reference on error pages
- **L2:** 093.1–2.
- **Behaviour:**
  - An unhandled API exception is reported with `requestId`, `release` (`APP_RELEASE`) and the user ID,
    with no request body.
  - The `/server-error` page shows "Dead air", a "Reference" row with the request ID and a "When" row
    with the Toronto time ("Fri 9 Oct, 10:42 a.m."). "Email us the reference" opens a `mailto:` link
    whose subject is the ID.
  - A browser exception and an SSR exception are each reported with the last request ID and the
    release.
  - The SSR server forwards its own request ID to the API, so one render and its API calls share one ID.
- **Tests first:**
  - `tests/Feature/Operations/ErrorReportingTest.php` (with `FakeErrorReporter`)
  - `tests/Feature/Integrations/Sentry/SentryErrorReporterTest.php`
  - `e2e/specs/operations/monitor-health-and-errors.spec.ts`, with `pages/server-error.page.ts`
- **Build:**
  - the `SentryErrorReporter` adapter;
  - `ErrorTrackingErrorHandler`, `RequestIdInterceptor` and `RequestIdTracker` in
    `api/lib/http`;
  - request IDs in the SSR server's JSON logs;
  - `pages/server-error/` (if no earlier milestone built it).
- **ADR:** error tracking vendor (V12).
- **Components and scenarios:** if `ErrorReferenceComponent` goes in the library as
  `zm-error-reference`, add the `ErrorReference` scenario.
- **Route states:** `/server-error` (mock `server-error/default.html`).

### S8 — Metrics, alerts, on-call and uptime
- **L2:** 093.3, 090.1, 106 (status link target).
- **Behaviour:**
  - `MeasureQueueLag` emits `queue_lag_seconds` per queue every minute.
  - Three consecutive payment webhook failures call `OnCallAlerter` once.
  - On staging, a forced 5xx burst above 1% for 5 minutes fires the alarm to the on-call SMS.
  - Uptime checks run on `/`, the profile and the booking read, and monthly availability shows on the
    status page.
- **Tests first:**
  - `tests/Feature/Operations/{QueueLagTest,PaymentWebhookAlertTest}.php`, if M6 has not already covered
    them
  - `tests/Feature/Integrations/Sns/SnsOnCallAlerterTest.php`
  - `CloudWatchMetricsRecorderTest.php` (EMF JSON shape on stdout)
- **Build:**
  - adapters `CloudWatchMetricsRecorder` and `SnsOnCallAlerter`;
  - alarms in `infra/observability`;
  - Better Stack monitors (documented in the runbook);
  - `config('zamaro.status_page_url')`.
- **ADR:** metrics and alerting (V13, V14); uptime monitor and status page (V15).

### S9 — Response-time budgets under load
- **L2:** 085.1–4, 089.1.
- **Behaviour:**
  - On `perf`, with 5,000 artists, 20,000 bookers and 200,000 bookings, a sustained 50 req/s gives:
    - p95 server time for profile reads of 300 ms or less;
    - p95 for searches of 500 ms or less;
    - p95 for writes without the processor of 800 ms or less;
    - an error rate below 0.1%.
  - Every API response carries `Server-Timing` with its request class.
  - The load generator's CIDR is exempt from the L2-077 limits only when `ZAMARO_RATE_LIMIT_EXEMPT_CIDRS`
    is set. Production refuses to boot with it set.
- **Tests first:**
  - `tests/Feature/Operations/{ServerTimingTest,RateLimitExemptionTest}.php`
  - `backend/tests/load/{profile-read,search,write,mixed}.js` with k6 thresholds; their failure is the
    red run
- **Build:**
  - `RecordServerTiming` with the `RequestClass` enum.
  - The `PerformanceDatasetSeeder`: idempotent on natural keys, chunked inserts, under 10 minutes.
  - Any index or query fixes the run reveals.
  - `.ci/load-test.sh`, and the nightly `load.yml` workflow.

### S10 — Fast pages: bundle gate, Lighthouse, RUM
- **L2:** 086.1–2, 087.1–2, 088.1.
- **Behaviour:**
  - `check-bundle-budgets` fails the build when initial JS exceeds 250 KB gzipped or any lazy chunk
    exceeds 150 KB, for both `zamaro` and `admin`.
  - A booker loading Discover downloads no artist-area chunk.
  - Lighthouse (mobile, slow 4G, median of 3) scores 90 or more on `/` and `/artists/abigail-mensah` on
    staging.
  - The profile hero is preloaded with `fetchpriority="high"`. Other images are lazy, served as AVIF or
    WebP with `srcset`, width and height.
  - LCP, INP and CLS beacons reach `/api/v1/vitals` tagged with the route template, release and device
    class.
- **Tests first:**
  - `e2e/perf/bundle-isolation.spec.ts` (network recording, conflict 6) with `pages/discover.page.ts`
  - `e2e/perf/media-delivery.spec.ts`
  - `tests/Feature/Operations/WebVitalsBeaconTest.php`
- **Build:**
  - `.ci/check-bundle-budgets.mjs`, reading the esbuild metafile;
  - `.lighthouserc.json` and `.ci/lighthouse.sh`;
  - `WebVitalsReporter` with `web-vitals`;
  - the `/api/v1/vitals` endpoint (V16);
  - the LCP preload in SSR;
  - Bebas Neue fallback metrics (H20).
- **ADR:** real-user monitoring (V16).

### S11 — Adapters A: routing, geocoding, bot challenge, breached passwords, IP geolocation
- **L2:** 002.3 (road distance), 004.5 (place lookup), 024 (church address), 072 (breached passwords),
  077.4.
- **Behaviour:**
  - On staging, Burlington to Brampton returns a road distance from OSRM, and a timeout still falls back
    to ×1.3, marked "approximate".
  - "2150 Lakeshore" resolves through AddressComplete to Burlington ON L7R 1A3 with coordinates.
  - A Turnstile test token passes, and the "always fails" test key returns the 422 copy.
  - "password1" is reported as breached.
  - A Toronto IP shows "Toronto, ON" in the session list.
- **Tests first:** `tests/Feature/Integrations/{Osrm,AddressComplete,Turnstile,Hibp,MaxMind}/*Test.php`
  against recorded responses.
- **Build:**
  - Adapters in `app/Integrations/{Routing,Geocoding,BotChallenge,Passwords,Geolocation}/`.
  - Bindings chosen per environment in `config/zamaro.php` `adapters.*`.
  - The OSRM service in `infra/compute`.
  - CSP origins for Turnstile (`script-src` and `frame-src`).
- **ADRs:** routing provider (V1); geocoding and address search (V2); bot challenge (V9); breached-password
  check (V10); IP geolocation (V11).

### S12 — Adapters B: mail, object storage, CDN and the media domain
- **L2:** 063, 065, 076.3, 084.1, 088.1, 089.2.
- **Behaviour:**
  - A booking email from staging arrives through SES within 2 minutes, with HTML and text parts.
  - A simulated hard bounce at `bounce@simulator.amazonses.com` sets `email_undeliverable_at`.
  - `email:check-dns` passes for `zamaro.ca`.
  - Photos upload to S3 and are served from the media domain through CloudFront.
  - A private VSC document opens only through a 5-minute signed URL.
  - A profile edit purges `/artists/{slug}` and `/api/v1/artists/{slug}`, and a fresh copy is served
    within 60 s.
- **Tests first:** `tests/Feature/Integrations/{Ses,S3,CloudFront}/*Test.php` (SNS signature
  verification, presigned multipart shape, invalidation call).
- **Build:**
  - the SES transport and the SNS bounce handler behind `EmailWebhookController`;
  - `S3ObjectStorage` (production) beside the local S3-compatible store;
  - `CloudFrontCdnPurger`;
  - CloudFront distributions in `infra/edge`;
  - media and CDN origins added to the CSP `img-src` and `media-src`.
- **ADRs:** email delivery (V3); object storage (V6); CDN and media domain (V8).

### S13 — Adapters C: payments, malware scanning, transcoding
- **L2:** 035–041 (deposit, balance, payouts, receipts), 076.1–2, 052, 088.2.
- **Behaviour (staging, vendor test modes):**
  - The Stripe test card 4242 pays the $162.50 deposit on ZAM-0114 (Abigail, $650) through the Payment
    Element.
  - A retry with the same idempotency key creates one charge.
  - `card_declined` shows the M6 copy.
  - The webhook updates the booking, and an invalid signature returns 400 with a security event.
  - A Connect Express test account becomes payout-ready and receives a payout.
  - The EICAR test file is rejected with a logged security event; a clean JPEG is promoted.
  - A 720p MP4 is transcoded to HLS, and on a 10 Mbps profile playback starts within 2 s.
- **Tests first:** `tests/Feature/Integrations/{Stripe,ClamAv,MediaConvert}/*Test.php` (recorded events,
  signature checks, idempotency headers), with the sandbox group run on staging.
- **Build:**
  - `StripePaymentGateway` and the Stripe webhook verifier;
  - `ClamAvMediaScanner` and the `clamd` service;
  - `MediaConvertVideoTranscoder` and the EventBridge completion webhook;
  - CSP origins for Stripe (`script-src`, `frame-src` and `connect-src`).
- **ADRs:** payment processor (V4); malware scanning (V5); video transcoding (V7).

### S14 — CI pipeline complete and first production release
- **L2:** 094.1, 100.2 (release gate), 071.2 and 086.2 (on staging).
- **Behaviour:**
  - A pull request runs `lint`, `tests` (sharded e2e with visual and a11y), `scans`, `budgets` (bundle),
    `perf-test` (when frontend or perf-test paths change), `contract` and `build`.
  - A merge to `main` adds `migrate` and `rollout` to staging, then the header scan, Lighthouse, the
    smoke test and the M9 release gate.
  - Production is then promoted with the same manifest.
  - Branch protection makes every PR stage required.
  - The first production deploy uses an empty, seeded-styles-only database: `StyleSeeder` runs, and
    `CastSeeder` never runs in production.
  - The `production` boot refuses every fake.
- **Verification:** walk one change from pull request to production, record the stage timings, then roll
  back and roll forward.
- **Build:**
  - `.ci/{lint,backend-test,e2e,scans,budgets,perf-test,contract,build-images,migrate,rollout,smoke,header-scan,lighthouse,release-gate}.sh`;
  - `ci.yml` and `deploy.yml` calling only those scripts;
  - `docs/runbooks/{deploy,rollback,incident,go-live}.md`.

## Vendor adapter table

| Port (`app/Contracts`) | Candidate vendor | Fake kept for tests | ADR topic |
|---|---|---|---|
| `RoutingProvider` | OSRM self-hosted (`ca-central-1`) | `FakeRoutingProvider` + `CastRoutes` | Routing provider |
| `Geocoder` (place and address search) | Canada Post AddressComplete | `FakeGeocoder` | Geocoding and address search |
| Mail transport + email webhook | Amazon SES + SNS | Laravel `array` mailer / Mailpit, `Notification::fake` | Email delivery |
| `PaymentGateway` | Stripe (Payment Element, Connect Express) | `FakePaymentGateway` (M6) | Payment processor |
| `MediaScanner` | ClamAV `clamd` (+ GuardDuty S3 for large videos) | `FakeMediaScanner` (EICAR → Infected) | Malware scanning |
| `ObjectStorage` | Amazon S3 `ca-central-1` | Local S3-compatible store chosen in M4 | Object storage |
| `CdnPurger` | Amazon CloudFront | `FakeCdnPurger` (records paths) | CDN and media domain |
| `VideoTranscoder` | AWS Elemental MediaConvert | `FakeVideoTranscoder` (M4) | Video transcoding |
| `BotChallenge` | Cloudflare Turnstile | `FakeBotChallenge` (token `pass`/`fail`) | Bot challenge |
| `BreachedPasswordChecker` | HIBP Pwned Passwords | `FakeBreachedPasswordChecker` | Breached-password check |
| IP geolocation | MaxMind GeoLite2 (local DB) | `FakeIpLocator` | IP geolocation |
| `ErrorReporter` | Sentry SaaS (or GlitchTip in Canada) | `FakeErrorReporter` | Error tracking |
| `MetricsRecorder` | CloudWatch EMF | `FakeMetricsRecorder` | Metrics and alerting |
| `OnCallAlerter` | Amazon SNS (SMS + email) | `FakeOnCallAlerter` | Metrics and alerting |
| Uptime monitor and status page | Better Stack (no port; outside Zamaro) | — | Uptime monitor and status page |
| RUM | First-party `/api/v1/vitals` → `MetricsRecorder` | `FakeMetricsRecorder` | Real-user monitoring |
| Secrets manager | AWS Secrets Manager (platform injection, no port) | `.env` in compose only | Hosting provider, region and IaC |
| VSC check | None: verified by an administrator (H21) | — | — |

Fake names follow whatever M2–M8 committed; the table lists the expected ones.

## Known risks
- **The payment adapter diverges from the fake (biggest risk):** money moves here. The fake was shaped
  by M6 before Stripe was chosen. If Stripe's event names, idempotency semantics, Connect payout timing
  or Payment Element flow do not match the port, the port changes late, and M6's acceptance tests must
  stay green across that change. Start S13's payment ADR as soon as V4 is approved, and record real
  Stripe test-mode responses for the fake to replay.
- **The hosting decision gates every slice:** without H1–H4, nothing in S1–S5 can start. That is the
  main argument for staging after M2.
- **Data residency of SaaS vendors:**
  - Stripe, Sentry, Turnstile, HIBP and Better Stack are outside Canada;
  - L2-084 covers only the database, storage, backups and logs;
  - the monitoring design adds "Canada or no personal data";
  - each ADR must state which personal data, if any, leaves Canada, and the privacy policy must list them.
- **Zero downtime depends on expand–contract discipline:** one destructive migration breaks rollback.
  `MigrationCompatibilityCheck` is the guard; it must run on every pull request with migrations, not only
  on `main`.
- **Rollback in 15 minutes:** this includes image pulls and drain time. Keep the images slim and the
  connection-draining delay at 30 s or less, and measure in S4 before relying on it.
- **CloudFront invalidations** take time and cost money per path beyond the free tier. The 60 s
  `s-maxage` stays the real guarantee for L2-089.2.
- **ClamAV stream limits** fall below the 1 GB videos M4 allows. Settle the large-file path in the
  malware-scanning ADR.
- **Lighthouse variance** on shared runners: run it against staging, take the median of 3, and never
  lower the 90 threshold.
- **Email deliverability:** a new SES domain starts in the sandbox and needs production access and
  warm-up. Request it in S12, well before go-live.
- **Load dataset build time:** 200,000 bookings through factories is slow. Use chunked inserts and keep
  the seeder idempotent.
- **Agents never add the `perf-regression-accepted` label.**

## Verification (end of M10)
1. Locally: `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`.
   Every Feature test is green, including `tests/Feature/Integrations/**` against the recorded fixtures.
2. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build admin && node ../.ci/check-bundle-budgets.mjs`.
3. `cd e2e && npx playwright test`: specs, visual, a11y, perf (including `bundle-isolation`) and
   `npm run perf-test -- --baseline <main dist> --fail-on-regression`.
4. On staging:
   - `bash .ci/residency-check.sh staging`
   - `node .ci/header-scan.mjs --base https://staging.zamaro.ca --http http://staging.zamaro.ca`
   - `bash .ci/lighthouse.sh https://staging.zamaro.ca`
   - `k6 run backend/tests/load/mixed.js` on `perf`; every threshold passes.
   - `php artisan test --group=sandbox` as a one-off task.
5. In the GitHub Actions run of the first production release:
   - all stages are green;
   - the rollback drill is 15 minutes or less;
   - the restore drill is 4 hours or less and logged.
6. Manual walkthrough on production:
   - Search Burlington for 14 Nov and open Abigail's profile; in DevTools, check the CSP, the HSTS
     header and AVIF images from the media domain.
   - Sign up through Turnstile and receive the verification email.
   - On staging, pay a test deposit.
   - Force a 500 on staging and find its reference in Sentry and CloudWatch Logs.
   - Watch the uptime monitor record the check.
