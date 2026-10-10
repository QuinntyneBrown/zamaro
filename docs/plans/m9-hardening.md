# Milestone 9 plan: hardening

**Status:** Not started. Depends on M2 (accounts, sessions, CSRF, encrypted fields, consent, email,
background jobs), M3 (admin app, audit log, upload scanning), M4 (object storage, media), M5 (booking
requests and messages), M6 (payments, refunds, payouts), M7 (reviews) and M8 (admin support). It can
start once M8 is merged; S1–S5 and S11–S12 only need M2 and can run earlier if capacity allows.

## Context

By the end of M8 the product is feature-complete against fakes: every page in `docs/mocks/pages`
exists, every vendor sits behind a port in `backend/app/Contracts` with a fake (ADR-0002), and the
ATDD suites cover each feature's L2 criteria. What is still missing is the cross-cutting layer that
makes the product safe to put in front of the public:

- **Privacy rights:** no one can delete their account (L2-082) or download their data (L2-081).
- **Public exposure:** M1 allowlisted the profile and lineup fields. Since then M2–M8 have added more
  public routes, such as tour dates and reviews, and there is no sentinel-data test across all of them
  (L2-083).
- **Transport and headers:** the SSR server sends no CSP, and the API sends no HSTS (L2-070, L2-071).
- **Accessibility:** the axe suite covers the four route states that M1 left in `routes.manifest.ts`.
  The 100+ states added by M2–M8, the dark theme and the signed-in and admin routes are not covered
  (L2-100–L2-103).
- **Offline:** there is no `/offline` page, no connection banner and no service worker (L2-114).
- **Secrets and supply chain:** there is no production-safety boot check, no secret scan, no
  dependency gate in CI and no SAST (L2-078). ADR-0004 knowingly ignores seven Laravel 11 advisories.

**Goal:** close those gaps with the same loop as M1. Each slice uses the `implementing-incrementally`
skill: Given-When-Then criteria, then a red acceptance test, then the build, then the regression set.
Page objects own every selector, every new `zm-*` component gets a perf scenario, and there are no
architecture tests. M9 deploys nothing. Edge-only behaviour (the real load balancer and the real TLS
policy) is proven against a local edge container here, and against staging in M10.

## Entry criteria and dependencies

- M2–M8 are merged. Their acceptance suites and the perf test are green on `main`.
- These exist and are reused, not rebuilt:
  - `SessionRegistry::endAll` (M2)
  - `FieldEncrypter`/`EncryptedField` (M2) and its `encryptStream` for VSC documents (M3)
  - `RedactSensitiveData` and `LogRequest` (M2)
  - `ToastService`, `AnnouncerService` and `zm-system-banner` (M2)
  - `BookingStateMachine` (M5)
  - `AlertAdministrators` and `OnCallAlerter` with its fake (M2/M3)
  - the `ObjectStorage` port and the local S3-compatible store (M4)
  - `RecordAuditEntry` (M3)
- `e2e/routes.manifest.ts` lists every M1–M8 route state.
- The visual and axe suites run in the Playwright Docker image with Bebas Neue self-hosted, as the M1
  risks say.
- The M1 open items are closed, or carried forward with an owner: CORS tightened in M2, and L2-009.2
  scroll restoration.

## Decisions to make or confirm

Where a design is silent, the recommended default is shown. **Needs your OK** marks the items the
project owner must confirm before the slice that uses them starts.

| # | Decision (source) | Recommended default | Needs your OK |
|---|---|---|---|
| D1 | Grace period before erasure (`delete-account`, up to 30 days) | `erase_after = disabled_at + 1 day`. No restore path is designed or mocked, so a longer grace only holds personal data longer. The other 29 days absorb job retries. | **Yes** (privacy policy wording) |
| D2 | Message bodies on retained bookings (`delete-account`) | Follow the mock ("…messages are erased"). Delete the message rows the erased person wrote; the other party keeps their own messages. | **Yes** |
| D3 | Church address snapshot on retained bookings (`delete-account`) | Null the street and postal code. Keep the city and province, which are needed for HST jurisdiction on retained records. | **Yes** |
| D4 | Consent record retention after deletion (`record-consent`) | Keep them, linked to the de-identified user row, for 2 years after erasure (same as the audit log), then purge them in `accounts:erase-due`. | **Yes** |
| D5 | Audit entries of deleted accounts (`record-audit-log`) | Keep `actor_id` pointing at the de-identified user row and remove the entries only through the 2-year retention. Record in the privacy policy that IP addresses in audit entries stay for 2 years for security. | **Yes** |
| D6 | Retired slugs after an artist deletes their account (`change-profile-address`) | Keep them reserved for 12 months, so old links reach the 404 rather than another artist, then release them. | No |
| D7 | Export JSON schema (`export-personal-data`) | One versioned object, `{schemaVersion:"1", generatedAt, profile, church, savedArtists, bookings[{…, payments[{brand,last4,amount,status}]}], messages, reviews, consentRecords}`. Documented as `export-schema.json` beside the design. | No |
| D8 | Export request limit (`export-personal-data`) | Follow the mock: one export at a time, and a new one only after the latest has expired or failed. No separate daily limit. | No |
| D9 | Other party's message bodies in the export (`export-personal-data`) | Include the full thread of each booking the user takes part in. M5 already masks contact details in message bodies. | **Yes** |
| D10 | Signed storage URL lifetime for the export (`export-personal-data`) | 5 minutes, the same as private documents (L2-076). | No |
| D11 | Export deadline alert threshold (`export-personal-data`) | Alert when an export is not `Ready` 12 hours after the request. | No |
| D12 | Artist base coordinates could be triangulated from search distances (`minimise-public-exposure`) | Coarsen the stored artist base coordinates to 2 dp (about 1.1 km) on save, and keep whole-km distances. `FakeRoutingProvider` snaps to anchors within 2 km, so the seeded numbers do not change. | **Yes** |
| D13 | CSP `style-src` and third-party origins (`enforce-transport-and-headers`) | `style-src 'self' 'nonce-{n}'` plus `style-src-attr 'unsafe-inline'`: SSR emits `[style.x]` bindings as attributes, and L2-071 restricts scripts only. Third-party origins come from config (`security.csp.*`), empty under fakes and filled by M10's adapters. | No |
| D14 | CSP report endpoint (design gap) | `report-to` a first-party `POST /api/v1/csp-reports`. It is in `api_public.php`, throttled, and logs to the `security` channel. M10 may repoint it at the error tracker. The design is updated in the same change. | No |
| D15 | HSTS preload submission | Do not submit at launch, because preload is hard to undo. Revisit after 3 months of clean HTTPS on every subdomain. | **Yes** |
| D16 | Header scan tool | `.ci/header-scan.mjs` (Node, `undici`) plus `openssl s_client -tls1`/`-tls1_1`, reading `.ci/security/expected-headers.json`. | No |
| D17 | Secret scanner, SAST tool and threshold, Composer severity filter (`protect-secrets-and-data`) | gitleaks on pushed commits; Semgrep CE over PHP and TypeScript, failing on `ERROR` (CodeQL has no PHP support); `composer audit --locked --format=json` filtered to high and critical by a small wrapper, keeping ADR-0004's ignore list; `npm audit --audit-level=high` in `frontend/` and `e2e/`. | No |
| D18 | Laravel 11 (ADR-0004) | Laravel 11 security fixes ended in March 2026. Upgrade to the current supported Laravel major before M10 deploys anything, in a new ADR that supersedes 0004, and update AGENTS.md. | **Yes** (changes the documented stack) |
| D19 | Field-key rotation procedure (`protect-secrets-and-data`) | `security:rotate-field-key` re-encrypts the `EncryptedField` columns and VSC objects in id-ordered batches. Older keys stay in `FIELD_ENCRYPTION_PREVIOUS_KEYS` until the command reports zero rows on the old version. | No |
| D20 | Service worker library | `@angular/service-worker` with `navigationRequestStrategy: "freshness"`, so navigations still get SSR HTML when online. `index.csr.html` serves as the cached shell. No `dataGroups`. | No |
| D21 | Accessibility issue tracker and release gate (`meet-accessibility-standards`) | GitHub issues labelled `a11y`. The release workflow step (M10) fails while any open issue carries `a11y` and `wcag-aa`. The checklist lives in `docs/runbooks/a11y-release-audit.md`. | No |
| D22 | Visual diff threshold, and whether every capture runs in both themes (`adapt-layout-to-screens`) | `maxDiffPixelRatio: 0.001`, light and dark, unless M1 already fixed a value. | No |

## Design conflicts and resolutions

1. **The offline mock shows a signed-in header** (Naomi's avatar, "Saved 3", her footer column). L2-114.4
   and L2-089 forbid caching any API response, so a cold offline open cannot know who is signed in.
   **Resolution:** a cold offline open renders the signed-out header and footer. An in-app navigation
   that fails keeps the header already in memory. Update `pages/offline/default.html` and add a
   `signed-in` state; the visual suite masks the header for that route.
2. **The banner roles disagree.** The offline page mock uses `role="status"`; the system-banner danger
   mock and `show-loading-and-feedback` use `role="alert"`. **Resolution:** the connection-drop banner
   uses `role="alert"`, because L2-114.3 says it is announced. The banner on the offline page keeps
   `role="status"`, so it is not announced on top of the `h1`. Both mocks stay as they are, and the
   design is updated to say this.
3. **The delete dialog lists the bookings it will withdraw before the password is sent**, and the
   blocked state appears on open. The design has only `DELETE /api/v1/account`. **Resolution:** add
   `GET /api/v1/account/deletion-preview`, which returns `{blocking:[…], toWithdraw:[…]}` from the same
   query `RequestAccountDeletion` uses. Update the design and its sequence diagram.
4. **Frontend locations.** The designs place code in `features/account`. ADR-0007 places it in
   `pages/account`, `pages/data-export` and `dialogs/delete-account`. **Resolution:** follow ADR-0007 and
   fix the paths in the designs.
5. **Contrast check versus "no tests for the design system".** The a11y design runs `check_contrast.py`
   against `docs/design-system/tokens`. **Resolution:** do not test the design system. Prove L2-103.2 on
   the product instead:
   - axe `color-contrast` checks text on every route state in both themes;
   - the keyboard sub-suite measures the computed contrast of the focused ring and of control borders on
     real components (at least 3:1).
6. **`PublicExposureTest` enumerates the public route group, and `ResourceFieldAllowlist` fails on new
   keys.** Both are close to structure tests. **Resolution:** keep the behaviour and drop the registry:
   - the test calls every public route as a guest over sentinel data and inspects the bodies and headers;
   - field shape stays covered by the existing OpenAPI contract assertions;
   - there is no separate allowlist file.
7. **The manual audit names NVDA with Firefox and VoiceOver with Safari, but AGENTS.md is Chromium-only.**
   **Resolution:** automated suites stay Chromium-only. The manual audit is a human release check, not a
   configured test run.
8. **The header scan needs a "preview deployment", but nothing is deployed until M10.** **Resolution:**
   - add an `edge` compose service: Caddy 2, profile `edge`, `:8080` and `:8443`, TLS 1.2–1.3 only, the
     design's path routing, and an HSTS response rule;
   - pull requests run the scan against it;
   - M10 re-points the same scan at staging.
   - Add the service to the AGENTS.md compose line.
9. **`security/expected-headers.json` has no home in the AGENTS.md tree.** **Resolution:** place it at
   `.ci/security/expected-headers.json` and update the design.
10. **`FieldErrorDirective` is named `zFieldError` in the design**, but ESLint enforces the `zm` prefix.
    **Resolution:** it is `zmFieldError`; correct the design.

## Slices

**Every slice** follows M1's loop:
1. Write the Given-When-Then criteria.
2. Write the acceptance test and run it red for the expected reason.
3. Build, refactor while green, then run the regression set:
   - `docker compose exec api php artisan test`
   - frontend lint, `format:check` and builds
   - `npx playwright test`
   - the perf test with `--fail-on-regression` whenever a `zm-*` component changes
4. Commit.

Each slice also appends its route states to `e2e/routes.manifest.ts`.

**Test conventions:**
- e2e runs against the stub API with the clock frozen at Fri 9 Oct 2026 10:00. Naomi has ZAM-0097,
  Confirmed for Sun 25 Oct.
- A deletable booker, **Ruth Okafor** (St. Paul's, Burlington), is added to `CastSeeder` and to the stub
  API's cast in `e2e/fixtures/`. She has one
  Requested and one Accepted booking and a review on Abigail, so the deletion paths have data without
  disturbing Naomi.

### S1 — API security headers and HTTPS behind the edge
- **L2:** 070.3 (origin part), 071.1 (API part).
- **Behaviour:**
  - Every API response, including problem details, `/health/*` and 429s, carries:
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
  - With `X-Forwarded-Proto: https` from a trusted proxy address, `$request->secure()` is true, and
    signed URLs and email links use `https`.
- **Tests first:** `tests/Feature/Security/SecurityHeadersTest.php` and `TrustedProxyTest.php`.
- **Build:**
  - `App\Http\Middleware\SetSecurityHeaders`, appended globally in `bootstrap/app.php` after
    `AssignRequestId`.
  - `config/security.php` (`headers.*`, `trusted_proxies`).
  - `TrustProxies` reads `SECURITY_TRUSTED_PROXIES`.
  - `URL::forceScheme('https')` when `isProduction()`.
- **Confirm CORS:** production is single-origin through the edge, so the API sends no
  `Access-Control-Allow-Origin`. Add an assertion to the same test.

### S2 — Page CSP with a per-request nonce (risk-first)
- **L2:** 071.1 (page part).
- **Behaviour:**
  - Every SSR HTML response carries a CSP with `script-src 'self' 'nonce-{n}'` and no `unsafe-inline`
    or `unsafe-eval`, plus `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
    `form-action 'self'` and `worker-src 'self'`.
  - The nonce differs on every request.
  - The theme-boot script in `index.html` and the critical-CSS loader still run, so stored `dark` still
    paints before first paint.
  - Hydration completes.
  - Static assets get `nosniff` and HSTS.
- **Tests first:**
  - `e2e/specs/security/enforce-transport-and-headers.spec.ts`: page headers for `/`,
    `/artists/abigail-mensah` and `/no-such-page`; two requests get different nonces.
  - The same spec visits every `routes.manifest.ts` entry and fails on any `securitypolicyviolation`
    event. A fixture collects them into a list, and the test only states the expectation.
  - Page object: `pages/security-probe.ts`.
- **Build:**
  - `frontend/projects/zamaro/src/security-headers.ts` (`buildContentSecurityPolicy(nonce)` and the
    `securityHeaders` Express middleware), registered in `server.ts` before the Angular handler.
  - The nonce reaches Angular through `ngCspNonce` on the root element, written into the per-request
    document, and the theme-boot `<script>` gets the same nonce.
  - Origins come from the `CSP_*_ORIGINS` environment variables.
  - The admin app gets the same middleware, because it is served by the same server.
- **ADR:** CSP nonce delivery in Angular SSR (how the nonce reaches `AngularNodeAppEngine`, the
  critical-CSS loader and the inline theme script).
- **Route states:** none new.

### S3 — Local edge and the CI header scan
- **L2:** 070.1–3, 071.2.
- **Behaviour:**
  - `http://localhost:8080/artists/abigail-mensah?date=2026-11-14` returns 301 to the same path and
    query on `https://localhost:8443`.
  - TLS 1.0 and 1.1 handshakes fail.
  - HSTS is on every HTTPS response.
  - Removing `nosniff` from `SetSecurityHeaders` makes `.ci/header-scan.mjs` exit non-zero, and putting
    it back makes it pass.
- **Verification (infrastructure, outside ATDD, like M1's S0):**
  - `docker compose --profile edge up -d --wait && node .ci/header-scan.mjs --base https://localhost:8443 --http http://localhost:8080`
  - Mutate one header and confirm the exit code is 1.
- **Build:**
  - `backend/docker/edge/Caddyfile`: `/api/*`, `/sanctum/*` and `/health/*` go to `api`, and
    everything else goes to the SSR server.
  - `.ci/security/expected-headers.json`, `.ci/header-scan.mjs`, `.ci/header-scan.sh`.
  - A `security-headers` job in `.github/workflows/ci.yml`.
- **ADR:** local edge container standing in for the load balancer.

### S4 — Production safety and field-key rotation
- **L2:** 078.3, 079.2.
- **Behaviour:**
  - With `APP_ENV=production` and `APP_DEBUG=true`, or with any name in `security.required_secrets`
    empty (`APP_KEY`, `FIELD_ENCRYPTION_KEY`, `DB_PASSWORD`, the M2–M8 vendor secrets), boot throws
    `UnsafeProductionConfiguration`, so `/health/ready` never answers 200.
  - A fake vendor binding in production still throws (ADR-0002).
  - After `security:rotate-field-key`, Riverside's phone `905-555-0123` reads back unchanged, its
    ciphertext starts `v2:`, and a `v1:` value still decrypts until the run finishes.
  - The Angular browser bundles contain no server secret. The build reads only the `NG_PUBLIC_*`
    variables.
- **Tests first:** `tests/Feature/Security/{ProductionSafetyTest,FieldKeyRotationTest}.php`.
- **Build:**
  - `App\Providers\ProductionSafetyServiceProvider`, which absorbs the fake-binding guard from
    `AppServiceProvider`.
  - `security.required_secrets`.
  - `App\Console\Commands\RotateFieldKey`.
  - Key versions in `FieldEncrypter`, if M2 did not add them.

### S5 — Supply-chain scans and the Laravel decision
- **L2:** 078.1–2.
- **Verification (CI only):**
  - A commit that adds a fake AWS key to a scratch branch fails `scans`.
  - `npm audit --audit-level=high` and the Composer wrapper fail on a pinned vulnerable test package,
    then pass once it is removed.
  - Semgrep runs `p/php`, `p/typescript` and `p/secrets` and fails on `ERROR`.
- **Build:**
  - `.ci/scans.sh` (gitleaks, the Composer wrapper `.ci/composer-audit.php`, npm audit, Semgrep).
  - `.gitleaks.toml`, which allows the fake test fixtures by path.
  - A `scans` job in `ci.yml`.
- **D18:** if approved, upgrade Laravel in this slice, with the full Feature suite green, and write the
  ADR that supersedes 0004 (Laravel version and advisory policy).

### S6 — Minimal public exposure across every public route
- **L2:** 083.1–3, 089.3.
- **Behaviour:**
  - With sentinels seeded (a booker named `Sentinel Booker`, `sentinel@exposure.test`, `905-555-0199`,
    `1 Sentinel Way`, an artist contact phone and messages containing the sentinels), no guest call to
    any public API route returns a sentinel in its body or headers. Covered routes include search,
    alternatives, places, the profile, reviews, tour dates and i18n.
  - Every authenticated route returns 401 to a guest.
  - SSR HTML, JSON-LD and the transfer state for `/artists/abigail-mensah` contain no sentinel and no
    base coordinates, even when a signed-in booker renders the page.
  - Responses with personal data carry `Cache-Control: private, no-store`.
  - After D12, Abigail's stored base coordinates have 2 dp.
- **Tests first:**
  - `tests/Feature/Privacy/PublicExposureTest.php`, which iterates the routes registered from
    `api_public.php` and calls each one; it does not assert the code's shape.
  - `e2e/specs/privacy/minimise-public-exposure.spec.ts`, with `pages/artist-profile.page.ts`
    extended to read the page's JSON-LD and transfer state. A stub-API sentinel scenario puts the same
    sentinels in the signed-in booker's own responses, so the spec proves SSR doesn't carry them.
- **Build:**
  - `Database\Seeders\ExposureSentinelSeeder` (test-only, for `PublicExposureTest`).
  - Any leaks the test finds get fixed.
  - The `ArtistBaseLocation` cast rounds on write, plus a backfill migration (expand-only).

### S7 — Data export: request, build, email (API and worker)
- **L2:** 081.1.
- **Behaviour:**
  - Naomi's `POST /api/v1/account/data-exports` returns 202 with `status:"Requested"`. A second call
    returns the same export.
  - `BuildDataExport` writes `zamaro-data-naomi-fraser-2026-10-09.json` under a random key in the
    private bucket. It contains her profile, Riverside, her 3 saved artists, every booking with payments
    shown as brand and last 4 only, the messages, her June review of Abigail and her consent records,
    per D7 and D9.
  - `DataExportReadyNotification` is queued with the link `/account/data-exports/{id}` and "works until
    Fri 16 Oct, 11:24 a.m.".
  - Another user calling `GET …/{id}/download` gets 404.
  - At or after `expires_at`, the owner gets 410 and the object is gone after `data-exports:purge`.
  - A failed build retries 5 times, then becomes `Failed` and alerts.
  - An export still not `Ready` after 12 hours alerts through `OnCallAlerter`.
- **Tests first:** `tests/Feature/Privacy/{ExportPersonalDataTest,BuildDataExportTest,DataExportRetentionTest}.php`.
- **Build:**
  - `data_exports` migration and the `DataExportStatus` enum.
  - `Api/V1/Privacy/DataExportController`, plus `RequestDataExport` and `BuildDataExport`.
  - `Services/Privacy/PersonalDataExporter` and seven `ExportSection`s.
  - `DataExportReadyNotification` (HTML and text, catalogue keys).
  - Commands `data-exports:purge` (hourly) and `data-exports:check-deadline`.
  - A policy that scopes exports to their owner.

### S8 — Data export: Your data section and download page
- **L2:** 081.1.
- **Behaviour:**
  - On `/account#data`, "Download my data" turns into the requested state: the button is disabled and
    the text reads "We'll email naomi@… a link within 24 hours. It works for 7 days."
  - Once ready, the section reads "Your file is ready" with "Download your file" and the expiry date.
  - The emailed link opens `/account/data-exports/{id}`: "Your data is downloading", the file name,
    "Download again" and "This link works until Fri 16 Oct, 11:24 a.m. Only you can open it, signed in."
  - After expiry the page reads "This download has expired" and links back to `#data`.
  - A server error shows the error state and keeps the link.
  - A signed-out visit goes to sign-in and returns afterwards. Another user gets the not-found page.
- **Tests first:** `e2e/specs/privacy/export-personal-data.spec.ts`, with
  `pages/account.page.ts` (Your data section) and `pages/data-export.page.ts`.
- **Build:**
  - `api/lib/services/privacy` (contract, token, HTTP implementation, in-memory fake).
  - The `pages/account` Your data section.
  - `pages/data-export/`, behind `authGuard`.
- **Route states:**
  - `/account` export-requested and export-ready (signed in as Naomi)
  - `/account/data-exports/:id` default, expired and error

### S9 — Request account deletion
- **L2:** 082.1 (disable), 082.2.
- **Behaviour:**
  - **Naomi:** "Delete account…" opens the dialog in the blocked state, "Finish your booking first",
    with ZAM-0097 for Sun 25 Oct, Confirmed, and "Go to your bookings". `DELETE /api/v1/account` returns
    409 `future-confirmed-bookings` and changes nothing.
  - **Ruth:**
    - The dialog lists her open request and accepted booking as "withdrawn".
    - A wrong password shows the invalid state with `aria-invalid` on the password field.
    - A server failure shows the failed state: the password is kept and focus is on "Keep my account".
    - Success leaves her at `/`, signed out, with the toast "Your account is deleted" / "Your personal
      data is erased within 30 days."
    - Her other sessions end, and her next sign-in gets the generic invalid-credentials message.
    - Both bookings are Withdrawn through the state machine (the artists are emailed), and an audit entry
      is written.
  - **An artist with no future Confirmed booking:** after deletion, their slug returns the same 404 as a
    missing artist, and they are gone from search.
  - Escape closes the dialog and focus returns to "Delete account…".
- **Tests first:**
  - `tests/Feature/Privacy/DeleteAccountTest.php`
  - `e2e/specs/privacy/delete-account.spec.ts`, with `pages/delete-account.dialog.ts`
- **Build:**
  - The `users.disabled_at`, `erase_after` and `erased_at` migration.
  - `AccountController@destroy`, `DeleteAccountRequest` and `RequestAccountDeletion`.
  - `GET /api/v1/account/deletion-preview` (conflict 3).
  - `EnsureAccountActive` in `AttemptSignIn`.
  - The `Deleted` artist status in search and `ResolveArtistSlug`.
  - The `dialogs/delete-account/` CDK dialog with `FormSubmitter`.
- **Route states:** the `dialogs/delete-account` default, invalid, busy, blocked and failed states, as
  manifest entries opened by an action.
  - Blocked is Naomi.
  - The other four use Ruth, whose list differs from the mock's (Naomi's ZAM-0114 and ZAM-0088). Mask
    that list in the visual suite.

### S10 — Erasure and financial retention
- **L2:** 082.1 (erase within 30 days), 082.3, 082.4.
- **Behaviour:**
  - On Sat 10 Oct 10:00 (D1), `accounts:erase-due` erases Ruth:
    - her church, saved artists, sessions, MFA secrets, preferences and exports are deleted;
    - her message rows are deleted (D2);
    - the booking, payment, refund and payout rows keep their amounts, with `retain_until` set to
      creation plus 7 years and the name, email, phone and street nulled (D3);
    - `users.name` and `users.email` become placeholders, and `erased_at` is set.
  - Her review of Abigail now reads "A church in Burlington" on the profile, and the reply stays.
  - A second run changes nothing.
  - A run missed for 5 days catches up.
  - For an artist: photos, videos and VSC documents are removed from object storage, the profile text
    and `contact_phone` are cleared, and the retired slugs are reserved (D6).
  - `records:purge-retained`, with the clock 7 years later, deletes the retained rows.
  - Consent records are purged after 2 years (D4).
- **Tests first:**
  - `tests/Feature/Privacy/{EraseAccountPersonalDataTest,PurgeRetainedFinancialRecordsTest}.php`
  - an e2e case in `delete-account.spec.ts` for the "A church in Burlington" attribution
- **Build:**
  - `EraseDueAccounts` (daily, `onOneServer`), `EraseAccountPersonalData` (idempotent, `RetriesWithBackoff`)
    and `Services/Privacy/AccountEraser`.
  - `reviews.reviewer_display_city`, with `booker_id` made nullable.
  - `retain_until` columns.
  - `PurgeRetainedFinancialRecords`.
  - `ReviewResource` attribution for erased reviewers.

### S11 — Connection banner and offline page
- **L2:** 114.1 (in-app navigation), 114.3, 114.5.
- **Behaviour:**
  - On Discover, going offline raises, under the top bar, "You're offline" with "You can keep reading
    what's loaded. Saving artists and sending requests need a connection." It is `role="alert"`, and it
    clears itself when the connection returns.
  - Saving Abigail while offline reverts the toggle and shows the L2-026 error toast. Nothing is sent
    when the connection returns.
  - The book form keeps every value.
  - Navigating to `/bookings` while offline shows "No signal", "We can't reach Zamaro right now. Check
    your connection and try again." and "Try again". The URL stays `/bookings`.
  - "Try again" with the connection back opens `/bookings`.
- **Tests first:**
  - `e2e/specs/user-experience/work-offline.spec.ts`, using `context.setOffline()`
  - `pages/offline.page.ts` and `pages/system-banner.ts`
- **Build:**
  - `ConnectivityService` (`online`/`offline` events and status-0 failures).
  - `pages/offline/`, rendered with `skipLocationChange` from a router error handler for chunk and data
    failures while offline.
  - Updated offline mock (conflict 1).
- **Components and scenarios:** reuse `zm-system-banner` and `zm-error-page`. If `zm-system-banner` is
  not yet in the library, add it here with a `SystemBanner` scenario.
- **Route states:** `/offline`, and Discover with the offline banner (mock `notifications/system-banner/danger.html`).

### S12 — Service worker: shell only, nothing personal
- **L2:** 114.1 (cold open), 114.2, 114.4.
- **Behaviour:**
  - After one online visit, opening `/artists/abigail-mensah` offline in a new page shows the offline
    page with the signed-out header (conflict 1). "Try again" online opens the profile.
  - Cache Storage holds only hashed `*.js` and `*.css` files, fonts, icons and `index.csr.html`: no
    `/api/` URL and no SSR HTML.
  - Online navigations still return SSR HTML, so the first response contains the `h1`.
  - `/admin/**`, `/api/**`, `/health/**` and `/sanctum/**` are never served by the worker.
- **Tests first:** new cases in `work-offline.spec.ts`. The Playwright `zamaro` project blocks service
  workers by default; only this spec opts in with `serviceWorkers: 'allow'`. `pages/offline.page.ts`
  gains `cachedUrls()`.
- **Build:**
  - `@angular/service-worker` and `ngsw-config.json` (asset groups only, `navigationUrls` with the
    exclusions, freshness navigation).
  - `provideServiceWorker` with `registerWhenStable:30000`.
  - A `SwUpdate` handler for an unrecoverable state (reload).
  - `worker-src 'self'` in the CSP.
- **ADR:** service worker scope and caching (D20).

### S13 — Accessibility audit across every route, light and dark
- **L2:** 100.1, 101.1–4, 102.1–4, 103.1–2.
- **Behaviour:**
  - axe (WCAG 2.0, 2.1 and 2.2, A and AA) reports zero serious or critical violations on every manifest
    entry, in light and in dark. This covers guest, booker (Naomi), artist (Abigail) and administrator
    states, both applications and the dialog states.
  - The keyboard sub-suite checks on a sample of every page type:
    - the first Tab shows "Skip to content" and moves focus to `main`;
    - route changes focus the `h1` and update the title to `{page} · Zamaro`;
    - dialogs trap focus, close on Escape and return focus;
    - the focus ring is never under the sticky top bar, and its computed contrast is at least 3:1 in both
      themes.
  - Under `prefers-reduced-motion: reduce`, no animation runs longer than 0.01 ms and scrolling is not
    smooth.
  - Any violation found is fixed in this slice, or in a follow-up slice if it is large.
- **Tests first:**
  - `e2e/a11y/a11y.spec.ts` (manifest × theme) and `e2e/a11y/keyboard.spec.ts`
  - `fixtures/auth.ts` with a stub-API session per role
  - `RouteState` gains `as: 'guest' | 'booker' | 'artist' | 'admin'`, `theme` coverage and an optional
    `open` action for dialog states
  - an `admin` Playwright project
- **Build:** fixes only. The suites run in the Playwright Docker image (M1 risk), sharded 4 ways in CI.
- **Route states:** completes the manifest for M2–M9.

### S14 — Manual audit and release gate
- **L2:** 100.2.
- **Verification (process, outside ATDD):**
  - Run `docs/runbooks/a11y-release-audit.md` once with a keyboard, NVDA with Firefox and VoiceOver with
    Safari over the core journeys:
    - search, profile, book, pay the deposit, message, review
    - the artist responding
    - an admin approving an application
    - deleting an account and exporting data
  - File findings as `a11y` issues. Fix every WCAG 2.2 AA finding.
  - Add the release-gate query (D21) to `.ci/release-gate.sh`; M10 wires it into the rollout.

## Known risks
- **Strict CSP against SSR and hydration:** the inline theme script, the critical-CSS `onload` loader,
  CDK overlay styles and M10's third-party frames (bot challenge, payment hosted fields) can all break.
  S2 proves the nonce plumbing first; the violation sweep over every route catches regressions.
- **The service worker replaces SSR or goes stale:** the default ngsw navigation strategy serves the
  cached shell, which would drop SSR and show stale personal pages. `freshness` plus the Cache Storage
  assertion guard against this. A worker left over from an earlier build can pin old bundles; handle
  `SwUpdate.unrecoverable`.
- **Service workers make other e2e specs flaky:** block them by default and opt in per spec.
- **Erasure misses a table:** M2–M8 added many tables with personal data. S10's test seeds a row in
  every table that references `users` or `artists` and asserts each was erased or retained by rule. The
  backup window still holds erased data for 14 days (L2-091); say so in the privacy policy.
- **Laravel upgrade (D18):** a major-version upgrade late in the project can ripple through Horizon,
  Sanctum and Scramble. Do it in S5, before any other M9 backend work lands on top.
- **a11y suite runtime:** more than 150 states × 2 themes × axe. Shard the run, and keep visual and axe in
  one browser pass per state.
- **Agents never add the `perf-regression-accepted` label.**

## Verification (end of M9)
1. `docker compose --profile edge up -d --wait`, then `docker compose exec api php artisan test`:
   every Feature test is green, including `PublicExposureTest`.
2. `docker compose exec api php artisan accounts:erase-due` twice: the second run changes no rows.
   Run `db:seed` twice: the row counts are unchanged.
3. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build admin && NG_BUILD_MANGLE=0 npx ng build perf-test`.
4. `cd e2e && npx playwright test` passes `specs/`, `perf/`, `visual/` and `a11y/` in the Playwright Docker
   image, light and dark, with zero serious or critical axe violations.
5. `node .ci/header-scan.mjs --base https://localhost:8443 --http http://localhost:8080` exits 0, and
   `bash .ci/scans.sh` exits 0.
6. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows.
7. Manual walkthrough:
   - As Ruth, export your data, open the emailed link in Mailpit and download the JSON. Then delete the
     account and confirm you cannot sign in.
   - The erase job runs a day later, which the dev stack can't fast-forward: `EraseAccountPersonalDataTest`
     covers it with `travelTo`, and the e2e case shows "A church in Burlington" on Abigail's profile.
   - As Naomi, see the blocked dialog.
   - Turn the network off in DevTools: you see the banner, then reload and get the offline page. Turn it
     back on and use "Try again".
   - Check DevTools > Application > Cache Storage: no `/api/`.
   - Tab through Discover in dark mode at 320 px.
