# Milestone 3 plan: artist onboarding and admin app

**Status:** Not started.
**Depends on:** M1 (all slices, S12 and S15 in particular) and M2 (accounts, sessions, CSRF, auth, BotChallenge, encrypted fields, email, background jobs).
**Unblocks:** M4 (the artist workspace hosts the VSC section), M6 (payout setup publishes approved artists), M7 (review moderation joins the admin app), M8 (admin support).

## Context

**What exists before M3:**
- `artists` already has `status` (`ArtistStatus`: Approved, Suspended, Deleted), `payout_ready` and `published_at`. `Artist::scopePubliclyVisible()` (Approved, payout-ready, published) drives search and the profile, so L2-048.3 needs proof, not code.
- `vulnerable_sector_checks` exists with only the youth-rule columns: `issued_on`, `expires_on` (NOT NULL), `status` (`VscStatus`: Scanning, Pending, Verified, Blocked) and `verified_at`. The seed holds Abigail's verified check (issued 3 Mar 2025, until 3 Mar 2028).
- `Services/Discovery/ServiceArea::contains()`, `Contracts/{Geocoder,RoutingProvider}` and their fakes.
- From M1 S12: `artist_videos`, `zm-video-card`, `zm-video-player` and hls.js. From S15: the not-found page with its real 404 status, `ResolveArtistSlug` and `slug_histories`.
- `frontend/projects/admin` is the empty Angular 22 scaffold. `e2e/playwright.config.ts` has only the `zamaro` project. `RouteState.app` already allows `'admin'`.
- **From M2 (assumed; confirm at entry):** roles (`Role::Booker`, `Artist`, `Administrator`) and a `RoleChanged` event; sessions, CSRF and `auth:sanctum` by default; `LogRedactor`; `VerifyBotChallenge` with `Contracts/BotChallenge` and a fake; encrypted casts with a key held outside the database; Markdown mail through Mailpit; Horizon job conventions (idempotent, `tries = 5`); and, from `accounts/sign-in-and-recover-access`, `AttemptSignIn`, `CompleteTwoFactorChallenge`, `TotpVerifier`, `/account/sign-in/verify` (the mfa-challenge mock) and `/account/security/mfa`.

**Goal:** anyone can apply to join as an artist. Priya Nair vets applications in a separate admin application that requires TOTP and ends idle sessions. An approval creates an artist who stays hidden until payout setup (M6). Artists can upload a Vulnerable Sector Check through the API, and Priya verifies it. Every administrator action and sign-in is written to an append-only audit log. Every upload is typed by content, scanned, stored under a random name and served from a separate host.

## Entry criteria and dependencies
- M1 is merged. S12 (video tables and player) and S15 (404 page and status) are required; S16 (`zm-toast`) is optional, and S4 below builds the toast if S16 has not.
- M2 is merged, with the items above. If M2 did not ship `TotpVerifier` or MFA sign-in, S2 builds them from `accounts/sign-in-and-recover-access` and records the TOTP library ADR.
- Decisions D1–D6 are answered before S3 starts. D1 and D2 are needed before S6.
- Branch `feat/m3-artist-onboarding-and-admin` off `main`, with one commit per slice or smaller, and the M1 slice loop (criteria → red test → build → regression set → commit).
- The regression set adds `npx ng build admin` and the `admin` Playwright project.

## Decisions to make or confirm
Each decision gives a recommended default. **Needs your OK** marks the ones that wait for you.

1. **D1 Storage for M3 uploads.** M1 serves media from local disk, and object storage arrives in M4.
   - **Recommended:** keep local disk behind Laravel's filesystem disks, which already act as the storage port: `quarantine`, `documents` and `originals` on the `local` driver in dev, `Storage::fake()` in tests, and every file read and written through `Storage::disk(...)` only. Private documents are streamed by the API (S7), not through pre-signed bucket URLs, so moving to S3 in M4 is a config change.
   - **Rejected:** bringing object storage forward. ADR-0002 notes MinIO is no longer pullable, and the replacement choice belongs with M4's ADR.
   - **ADR:** upload storage on local disks until object storage. **Needs your OK.**
2. **D2 Where artists upload a check.** The VSC section and `dialogs/upload-check` live on `/artist/profile` (`pages/edit-profile`), which is M4.
   - **Recommended:** M3 ships the API (upload, current check, document link), admin verification and reminders. S6 proves L2-049.1 with Feature tests. The `#check` section and the upload dialog ship with M4's edit-profile page, with their e2e tests. **Needs your OK.**
3. **D3 Applicants who are not signed in** (`<TO SUPPLY>` in apply-as-artist and review-artist-application).
   - **Recommended:** on approval, find the user by `lower(email)`. If there is none, create one with no usable password and include a set-password link (M2's reset token) in the approval email.
   - `artist_applications.user_id` stays as designed: set when the applicant applies while signed in. **Needs your OK.**
4. **D4 Slug and publishing at approval.** The designs disagree:
   - `change-profile-address` says approval publishes the profile and generates its slug.
   - `review-artist-application` keeps `published_at` null until payout setup.
   - `artists.slug` is NOT NULL.
   - **Recommended:** approval runs `GenerateArtistSlug` (base, base-2, …, with reserved words such as `apply`) and leaves `published_at` null and `payout_ready` false.
   - M6's `SyncConnectedAccount` calls `PublishArtistProfile` on the first payout-ready result, which stamps `published_at`.
   - Update both designs. **Needs your OK.**
5. **D5 The 404 for `/admin` pages.** ADR-0001 makes admin a client-rendered app, so no SSR can set the status.
   - **Recommended:** the `zamaro` SSR server (`server.ts`) gates `/admin/**` by calling `GET {API_ORIGIN}/api/v1/admin/overview` with the browser's cookie. On 200 it serves `dist/admin/browser` with `Cache-Control: private, no-store`; otherwise it renders the S15 not-found page with HTTP 404. `adminGuard` stays as defence in depth.
   - **ADR:** serving the admin application behind a server-side 404 gate. **Needs your OK.**
6. **D6 Making administrators and enrolling their TOTP.** The design sends an un-enrolled administrator to `/account/security/mfa`, but `TwoFactorRequired` cannot say "enrol first", and no flow creates administrators.
   - **Recommended:** `php artisan zamaro:admin:grant {email}` grants the role and records `user.role_changed` with a null (System) actor.
   - `AttemptSignIn` then answers `TwoFactorEnrolmentRequired` for an administrator without a confirmed secret. That pending session may call only the M2 enrol and confirm endpoints, and confirming completes sign-in with `mfa_verified_at` set.
   - Update secure-admin-access. **Needs your OK.**
7. **D7 Chunked upload protocol and how long unattached videos are kept** (both `<TO SUPPLY>`).
   - **Recommended protocol,** a small tus-style one: `POST …/videos` with `Upload-Length`, file name and title returns 201, `Location` and an upload token; `PATCH …/videos/{upload}` takes `Upload-Offset` and 8 MB `application/offset+octet-stream` chunks; `HEAD` returns the current offset, for resuming after a drop.
   - **Recommended retention:** unattached videos are deleted after 24 hours by a daily `uploads:prune-unattached`.
   - **ADR:** resumable upload protocol.
8. **D8 TOTP library** (`<TO SUPPLY>`). Use `pragmarx/google2fa` behind `Contracts/TotpVerifier`, with a window of 1 step. It is a local library rather than a vendor, so it needs no fake in the backend; e2e computes codes from the fixture secret that the stub API checks, at the frozen clock. An ADR is needed only if M2 has not chosen one.
9. **D9 Polling endpoints exempt from idle stamping** (`<TO SUPPLY>`). M3 admin pages do not poll, so the list is empty. Counts refresh on navigation.
10. **D10 Media domain host** (`<TO SUPPLY>`). Use `media.localhost` on the API's port in dev, and the same host in the stub API's responses in e2e (Chromium resolves `*.localhost`; Zamaro cookies are host-only, so none are sent). The production host name and the CDN `/documents/*` rule (`<TO SUPPLY>`) move to M10.
11. **D11 Copy the designs leave open:**
    - Refusing a check issued more than 3 years ago (`<TO SUPPLY>`): "This check was issued more than 3 years ago. Ask the artist for a newer one."
    - Wrong file type: "This file isn't a PDF, JPEG or PNG. Choose a scan of the whole check."
    - The subjects and bodies of the application received, approved and rejected emails, and of the VSC renewal reminder, drafted from the mocks. The approval email links to `/artist/earnings`, which arrives in M6.
    - **Needs your OK.**
12. **D12 Rejecting a legible but unacceptable check** (`<TO SUPPLY>`; L2-049 is silent and no mock exists). Leave it out of M3. It needs a requirement and a mock first. **Needs your OK.**
13. **D13 Is opening the audit log itself audited?** (`<TO SUPPLY>`). No. The mock's newest rows show no such entries. Opening application reviews, VSC documents and booking threads is still audited, as designed. **Needs your OK.**
14. **D14 Schedules and batch sizes** (`<TO SUPPLY>`). `vsc:send-renewal-reminders` runs daily at 09:00 America/Toronto. `audit:prune` runs daily at 03:30 in batches of 1,000.
15. **D15 Audit entries after account deletion** (`<TO SUPPLY>`). Defer to M9 (`privacy/delete-account`). M3 keeps `actor_id` with no cascade.
16. **D16 Alert routing for security events** (`<TO SUPPLY>`). M3 writes only to the `security` log channel (JSON to stderr). Routing comes with M10's alerts.
17. **D17 Admin sections before their screens exist.** The mock nav shows Bookings "1 held" and Reviews "2 reported".
    - **Recommended:** the shell lists only built sections: Applications, Artists, Audit log. Counts come from `GET /api/v1/admin/overview` (applications waiting, checks waiting), which fills a gap in secure-admin-access. M7 and M8 add their sections and counts.
18. **D18 An Artists list in M3.** The VSC queue is "reached from the Artists section", but the Artists screens belong to suspend-and-reinstate (M8).
    - **Recommended:** M3 builds a read-only `/admin/artists` list, with search and the "Vulnerable Sector Checks · {n} waiting" link, plus a read-only `/admin/artists/:id` (Details, Upcoming bookings, Standing with no action).
    - M8 adds Suspend, Reinstate and the suspension history. **Needs your OK.**
19. **D19 Numbers and holidays.**
    - Application numbers come from a Postgres sequence formatted `A-%04d`; the seed puts the queue at A-0217 to A-0219.
    - Ticket numbers come from a sequence set above the seeded maximum (ACT-1030). The design's example ACT-0027 is Abigail's.
    - `BusinessDayCalendar` skips weekends and Ontario's nine ESA public holidays, so Fri 9 Oct gives Thu 15 Oct, because Mon 12 Oct is Thanksgiving.

## Design conflicts and resolutions
- **`features/`, `core/` and lazy `/admin`:** read the designs' paths through the ADR-0007 mapping.
  - **Zamaro app:** `ApplyPage` goes to `projects/zamaro/src/app/pages/apply/`.
  - **Admin app:** pages go to `projects/admin/src/app/pages/`, named after the mock without the `admin-` prefix: `applications/`, `application/`, `checks/`, `artists/`, `artist/`, `audit-log/`. Dialogs go to `dialogs/reject-application/` and shared pieces to `shell/`.
  - **Guard:** `adminGuard` lives in `projects/api/src/lib/auth/`.
  - "The admin area is a lazy route" (review-artist-application, secure-admin-access) is superseded by ADR-0001 and D5. Update those designs, plus record-audit-log and verify-vulnerable-sector-check, in the slices that implement them.
- **Port locations:**
  - The designs put `Geocoder`, `BotChallengeVerifier`, `MalwareScanner` and `TotpVerifier` in `App\Services\…`. ADR-0002 puts vendor ports in `App\Contracts` with fakes in `App\Integrations`.
  - Use `Contracts/MediaScanner`, ADR-0002's name, for the design's `MalwareScanner`.
  - Back-end namespaces follow the subsystem names: `Actions/Administration/RecordAuditEntry` (the design says `Actions\Audit`), and `Actions/Security/{ReceiveUpload,PromoteUpload,RejectInfectedUpload}` and `Services/Security/ContentTypeDetector` (the design says `Uploads`).
- **Two VSC upload endpoints:**
  - scan-and-serve-uploads names `POST /api/v1/artist/vsc` (`VscDocumentController`). verify-vulnerable-sector-check names `POST /api/v1/artist/vulnerable-sector-checks` (`VulnerableSectorChecksController`).
  - Keep the latter, which calls `ReceiveUpload`. The VSC status follows the upload (Quarantined → Clean | Rejected becomes Scanning → Pending | Blocked) through `vulnerable_sector_checks.upload_id`.
- **Two encryption stories for VSC files:** "the field key" in scan-and-serve-uploads versus `DocumentVault` with a wrapped data key per file in verify-VSC. Use `DocumentVault` (envelope encryption, AES-256-GCM), with the key-encryption key read from M2's key holder. **ADR:** private document envelope encryption.
- **M1 schema:** `vulnerable_sector_checks.expires_on` is NOT NULL, but a pending check has no expiry. An expand-only migration makes it nullable and adds `upload_id`, `storage_key`, `wrapped_data_key`, `mime_type`, `size_bytes`, `verified_by` and `renewal_reminder_sent_at`.
- **`ServiceArea`:** the design's `ServiceArea::locate()` (geocode, then measure) versus M1's `contains()`. Reuse `locate()` if M2's church slice added it; otherwise add it beside `contains()`.
- **Seed versus mocks:**
  - Cast accounts are `{slug}@cast.zamaro.test`, but the admin pages show `marcus@marcusbelltrio.ca` and `tobi@tobiadeyemi.ca`.
  - Marcus Bell Trio is published 2024-09-02, but the mock says "approved Mon 2 Mar 2026".
  - S8's seed moves the eight mock artists to their mock emails and adds `artists.approved_at` (not in any design; record it in review-artist-application).
- **Frozen clock:** the e2e stub API answers as of Fri 9 Oct 10:00, while the admin mocks show 10:42 a.m., 11:41 a.m., 1:50 p.m. and 2:10 p.m. Specs assert the clock's times, and the visual suite masks timestamps on admin pages.

## Milestone 3 — slices
Every slice follows the M1 loop and adds its route states. To carry a signed-in state, `RouteState` gains `as?: 'guest' | 'naomi' | 'priya'`.

#### S1 — Audit entries: record them, refuse changes (backend)
- **L2:** 069.1 (sign-in, failed sign-in, password, MFA and role changes), 069.2, 079.3.
- **Behaviour:**
  - Priya signs in with password and code. This writes `auth.sign_in` and `auth.mfa_challenge`, both Succeeded, actor Priya, IP 99.230.14.8 taken from `X-Forwarded-For` through the trusted proxies.
  - A wrong password for admin@riversidecc.ca, an unknown email, writes `auth.sign_in_failed` with no actor and `context.attempted_email`.
  - A `password` key in the context never reaches the row.
  - `AuditEntry::update()` and `delete()` throw `ImmutableAuditEntry`.
  - A raw `UPDATE` is refused by the trigger, and so is a `DELETE` from any role but `zamaro_audit_retention`.
  - An entry written in a transaction that rolls back disappears with it.
- **Tests first:** `tests/Feature/Administration/{RecordAuditLogTest,AuditLogImmutabilityTest}.php`.
- **Build:**
  - Migration `create_audit_entries_table`: the design's columns, `bigint` identity, `inet`, `jsonb`, four indexes, and the trigger `reject_audit_entry_changes()`.
  - The postgres init script in `backend/docker/` creates the role `zamaro_audit_retention`.
  - `Models/AuditEntry` and `Enums/{AuditAction,AuditOutcome}`. Enum cases are added as each slice uses them.
  - `Actions/Administration/RecordAuditEntry`, with timestamps from the database clock and context passed through `LogRedactor`.
  - `Listeners/AuditAuthenticationEvents`, subscribed to `Login`, `Failed`, `PasswordChanged`, `MfaEnabled`, `MfaDisabled` and `RoleChanged`. Raise any of these that M2 does not.
- **ADR:** audit log immutability (model guard, trigger, retention role). Splitting the owner and runtime database roles waits for M10.

#### S2 — Admin API: concealed, MFA-only, idle after 30 minutes (backend)
- **L2:** 066.1 (API), 066.2, 069.1 (failed administrator requests), 074.1.
- **Behaviour:**
  - A guest, Naomi and Abigail each get the same 404 problem body from `GET /api/v1/admin/overview` and from `GET /api/v1/admin/artist-applications/999999`.
  - Priya after the password only gets `TwoFactorRequired`, and the admin API answers 404. After the code she gets 200 with `{applicationsWaiting:3, checksWaiting:2}`.
  - Idle for 29 minutes: 200, and `last_activity_at` is restamped. Idle for 31 minutes: 401, and the session is gone.
  - `zamaro:admin:grant priya@zamaro.ca` records `user.role_changed`.
  - A failed state-changing admin request is recorded as `Failed` or `Denied` under its route name.
- **Tests first:**
  - `tests/Feature/Administration/SecureAdminAccessTest.php`
  - `tests/Feature/Security/AdminRoutesConcealedTest.php`: every route named `admin.*`, as a guest, Naomi, Abigail and a half-signed-in Priya, returns 404. Each later admin route joins its fixture list.
- **Build:**
  - `Http/Middleware/{EnsureAdministrator,EnsureMfaVerified,EnforceAdminIdleTimeout,AuditAdminRequests}`.
  - The `/api/v1/admin` group in `routes/api.php`, in that order, with `EnsureAdministrator` ahead of route-model binding.
  - `AttemptSignIn` returns `TwoFactorRequired` or `TwoFactorEnrolmentRequired` (D6) for administrators. `CompleteTwoFactorChallenge` sets `mfa_verified_at` and `last_activity_at`.
  - `admin.idle_timeout_minutes` in `config/zamaro.php`.
  - `Api/V1/Administration/AdminOverviewController`.
  - `Console/Commands/GrantAdministrator`.
- **ADR:** TOTP library, only if M2 has none (D8).

#### S3 — Admin application shell and the `/admin` 404
- **L2:** 066.1 (web), 066.2, 087, 099, 101, 104.
- **Behaviour:**
  - Naomi signed in opens `/admin/applications` and gets HTTP 404 with the shared not-found page.
  - Priya signs in at `/account/sign-in?returnUrl=/admin/applications`. "Enter your code" reads "Signing in as priya@zamaro.ca.", and "Verify and continue" does a full navigation into the admin app.
  - The admin app shows the workspace top bar with the "Admin" tag, "Applications 3", "Artists", "Audit log", the avatar "PN", and footer columns Admin, Records and "Priya Nair · Zamaro team".
  - Below 1200 px the sections move into the admin menu drawer, and Escape returns focus to "Open menu".
  - The zamaro build contains no admin code.
- **Tests first:**
  - `e2e/specs/administration/secure-admin-access.spec.ts`
  - page objects `e2e/pages/admin/{admin-shell.ts,admin-menu.dialog.ts}`, extending M2's `e2e/pages/{sign-in.page.ts,mfa-challenge.page.ts}`
  - `e2e/fixtures/admin-session.ts`, which signs Priya in on the stub API with a code from her fixture secret (npm `otpauth`)
  - Playwright project `admin`: base URL `/admin/`, fully parallel. Specs that approve, verify or tick set up the stub state they need per test, so they run alongside the read-only specs
- **Build:**
  - The D5 gate in `projects/zamaro/src/server.ts`.
  - Admin app:
    - `app.config.ts` binds the api tokens, the CSRF and session interceptors, and `provideI18n()` with an `admin` namespace (`resources/i18n/en/admin.json`).
    - `shell/` holds `Shell`, the nav with counts from `AdminOverviewApi`, the footer and the theme.
    - `app.routes.ts` puts `adminGuard` on the root and has its own wildcard not-found.
  - `api/lib/auth/admin.guard.ts`, `api/lib/services/admin/overview/` (contract, `ADMIN_OVERVIEW_API` token, HTTP implementation) and the in-memory fake in `api/lib/testing/`.
  - Budgets for the admin app in `angular.json`. The Dockerfile copies `dist/admin/browser`.
- **ADR:** the D5 gate.
- **Components and perf:**
  - `zm-top-bar` gains the workspace variant with the role tag and section counts. Add a new `TopBarWorkspace` scenario; the existing `TopBar` scenario is untouched.
  - `zm-badge` gains the count variant, and `zm-menu` the admin items.
  - Run the perf test with `--fail-on-regression`.
- **Route states:** `/admin/applications` as Naomi against `not-found/default.html` (status 404).

#### S4 — Idle warning toast
- **L2:** 066.3, 109.4.
- **Behaviour:**
  - After 28 minutes with no admin request (`page.clock`), a toast appears: "Heads up", "You'll be signed out in 2 minutes.", "Admin sessions end after 30 minutes without activity." It has a "Stay signed in" button and does not dismiss itself.
  - "Stay signed in" calls `GET /api/v1/admin/overview`, which stamps activity, and the toast closes.
  - At 30 minutes the next request gets 401, and the app sends Priya to `/account/sign-in?returnUrl=…` with a full navigation.
- **Tests first:** `e2e/specs/administration/admin-idle-timeout.spec.ts` and `e2e/pages/admin/session-toast.ts`.
- **Build:**
  - `shell/idle-session.ts`: a timer reset by an activity interceptor on admin API responses.
  - An admin variant of M2's `SessionExpiredInterceptor` that navigates outside the app.
- **Components and perf:** `zm-toast` and `zm-toast-region`, if M1 S16 has not built them, with a `persistent` input. Scenarios `Toast` and `ToastRegion`.

#### S5 — Audit log viewer and retention
- **L2:** 069.2, 069.3, 095.1, 105.
- **Behaviour:**
  - `/admin/audit` shows "Audit log", the subtitle "Every sign-in, credential change, refund, payout and administrator action. Entries can't be changed and are deleted after 2 years." and filters: Actor email, Action, Target, Outcome ("Any outcome"), From and To.
  - The table caption reads "Thu 1 Oct to Fri 9 Oct 2026, newest first". A row reads "Fri 9 Oct, 11:41 a.m. · Priya Nair, priya@zamaro.ca · Administrator · auth.mfa_challenge · User · Priya Nair · 99.230.14.8 · Succeeded". "Show older entries" pages by cursor.
  - Loading, error and no-results states.
  - There are no edit or delete controls. `PATCH` and `DELETE` on `/api/v1/admin/audit-entries/{entry}` return 405 and the entry is unchanged.
  - `audit:prune` on Fri 9 Oct 2026 deletes an entry from 8 Oct 2024 and keeps one from 10 Oct 2024. A second run deletes nothing.
- **Tests first:**
  - `tests/Feature/Administration/{ViewAuditLogTest,PruneAuditEntriesTest}.php`
  - `e2e/specs/administration/record-audit-log.spec.ts`
  - `e2e/pages/admin/audit-log.page.ts`
- **Build:**
  - Backend:
    - `Api/V1/Administration/AuditEntriesController@index`, `Requests/Administration/ListAuditEntriesRequest` and `Resources/Administration/AuditEntryResource` (actor name, email and role, plus a target label).
    - `audit:prune` → `Jobs/Administration/PruneAuditEntries` on a `pgsql_audit_retention` connection, scheduled in `routes/console.php`.
  - Frontend:
    - admin `pages/audit-log/`
    - `api/lib/services/admin/audit/` and `models/admin/audit-entry.ts`, with a fake
- **Components and perf:** `zm-table` and `zm-select` (unless M2 built it), plus a composite `AuditLogTable` scenario with 50 rows.
- **Route states:** `/admin/audit` as Priya against `admin-audit/default.html`, with timestamps masked.

#### S6 — Upload intake, scan and encrypted storage (VSC upload API)
- **L2:** 049.1, 075.4, 076.1, 076.2, 079.2, 092.
- **Behaviour:**
  - Abigail posts `check.pdf` (2 MB) issued 2026-10-05. The response is 202 with the check `Scanning`.
  - The worker finds the file clean. The check becomes `Pending`, and the ciphertext sits at `documents/{32 hex}` with no quarantine copy left.
  - A PDF named `.png` is stored as `application/pdf`.
  - An SVG or HTML file named `check.pdf` gets 422 on `file` with D11's copy.
  - A 14 MB file gets "This file is 14 MB. Choose a PDF, JPEG or PNG up to 10 MB."
  - A missing date gets "Enter the issue date printed on the check.", and a future date is also a 422.
  - An EICAR file is deleted. The upload becomes `Rejected (malware)`, the check `Blocked`, and the `security` log gets an event with the scanner signature. Abigail's earlier verified check still counts.
  - A scanner error retries up to 5 times and leaves the file quarantined.
  - Naomi gets 404, because the endpoint is for artists only.
- **Tests first:**
  - `tests/Feature/ArtistOnboarding/UploadVulnerableSectorCheckTest.php`
  - `tests/Feature/Security/ScanAndServeUploadsTest.php`
- **Build:**
  - Migrations `create_uploads_table` and `expand_vulnerable_sector_checks_for_documents`.
  - `Enums/{UploadPurpose,UploadStatus,ScanVerdict}`.
  - `Services/Security/ContentTypeDetector` (finfo; refuses XML and HTML in any form).
  - `Actions/Security/{ReceiveUpload,PromoteUpload,RejectInfectedUpload,RecordSecurityEvent}` and `Jobs/Security/ScanUpload` on the `uploads` queue.
  - `Contracts/MediaScanner` and `Integrations/Scanning/FakeMediaScanner`.
  - `Services/ArtistOnboarding/DocumentVault`.
  - `Actions/ArtistOnboarding/UploadVulnerableSectorCheck`, `Requests/ArtistOnboarding/UploadVulnerableSectorCheckRequest`, and `Api/V1/ArtistOnboarding/VulnerableSectorChecksController` (`store`, `current`).
  - An `uploads` middleware group that lifts the 1 MB body limit and caps uploads at 10 MB.
  - The disks from D1 and the `security` log channel.
- **ADRs:** upload storage on local disks (D1); private document envelope encryption.

#### S7 — Signed links to private documents
- **L2:** 049.4, 074.2, 076.3, 089.
- **Behaviour:**
  - Abigail and Priya get `{url, expiresAt}` for Abigail's pending check. The URL is on `media.localhost` and lasts 5 minutes. Priya's request records `vsc_document.viewed`.
  - Elijah and Naomi get 404, and so does any ID that does not exist.
  - The URL streams the PDF with these headers:
    - `Content-Disposition: attachment; filename="vulnerable-sector-check.pdf"`
    - `Cache-Control: private, no-store`
    - `X-Content-Type-Options: nosniff`
    - `Content-Security-Policy: default-src 'none'; sandbox`
  - An altered signature gets 404, and so does a URL after 5 minutes. The same path on the API host is 404.
- **Tests first:** `tests/Feature/ArtistOnboarding/VscDocumentLinkTest.php` and `tests/Feature/Security/VscDocumentAccessTest.php`, the cross-user suite.
- **Build:**
  - `Policies/VulnerableSectorCheckPolicy` (`denyAsNotFound`).
  - `Api/V1/ArtistOnboarding/DocumentLinksController` and `Support/PrivateDocumentUrl`.
  - `Http/Controllers/Media/PrivateDocumentController` in a new `routes/media.php` bound with `Route::domain(config('zamaro.media_host'))`. Add the file to the AGENTS.md tree.

#### S8 — Admin VSC queue, verification and the Artists list
- **L2:** 049.2, 067 (list entry, D18), 069.1, 105.
- **Behaviour:**
  - `/admin/artists` reads "Artists", "8 artists · 8 approved · 0 suspended", and has a "Search artists" field and the link "Vulnerable Sector Checks · 2 waiting". The table is "All artists, A to Z".
  - Searching "Tobi" shows the no-results state: "Only approved and suspended artists are listed here. Tobi Adeyemi is still an application."
  - `/admin/vulnerable-sector-checks` reads "2 waiting · a verified check counts for 3 years from its issue date", with the caption "Waiting for verification, oldest first". Its rows:
    - Elijah Park, issued Fri 25 Sep 2026, uploaded Wed 7 Oct, 4:10 p.m., "First check"
    - Abigail Mensah, "Replaces the check verified until Fri 3 Mar 2028"
  - View document opens the signed link in a new tab.
  - Verify on Elijah sets "Verified until Tue 25 Sep 2029 · by Priya Nair" and records `vsc.verified`. Elijah then appears in a Youth event search on 14 Nov.
  - A check issued 1 Oct 2023 gets 422 with D11's copy. Verifying twice gets 409.
  - Empty state "Nothing waiting" with "Open artists"; loading and error ("We couldn't load the checks", "Try again").
- **Tests first:**
  - `tests/Feature/ArtistOnboarding/VerifyVulnerableSectorCheckTest.php` and `tests/Feature/Administration/ListAdminArtistsTest.php`
  - `e2e/specs/artist-onboarding/verify-vulnerable-sector-check.spec.ts`, with Verify's before and after states set up through stub-API fixtures
  - page objects `e2e/pages/admin/{checks.page.ts,artists.page.ts,artist.page.ts}`
- **Build:**
  - `Api/V1/Administration/AdminVulnerableSectorChecksController` and `Actions/ArtistOnboarding/VerifyVulnerableSectorCheck`.
  - `VulnerableSectorCheck::isCurrentOn()`, with `AvailabilityService::hasCurrentVsc()` comparing the event date.
  - `Api/V1/Administration/AdminArtistsController` (`index`, `show`) and the `artists.approved_at` migration.
  - Frontend: admin `pages/{checks,artists,artist}/`, `api/lib/services/admin/{vulnerable-sector-checks,artists}/` with fakes, and a shared `VscDocumentLink` button in `shell/`.
- **Route states:** `/admin/artists`, `/admin/vulnerable-sector-checks` and `/admin/artists/{marcus-id}` (Standing panel without actions) as Priya.

#### S9 — VSC renewal reminders
- **L2:** 049.3, 063, 092.
- **Behaviour:**
  - Seed a verified check for Daniel & Ruth Okonkwo expiring Mon 30 Nov 2026, 52 days away. The daily run emails "Renew by Mon 30 Nov" with a link to `/artist/profile#check` and stamps `renewal_reminder_sent_at`.
  - A second run sends nothing. A check with a newer verified one sends nothing. A day missed is caught on the next run.
- **Tests first:** `tests/Feature/ArtistOnboarding/VscRenewalRemindersTest.php`, asserting the mail through `Notification::fake()`.
- **Build:** `Console/Commands/SendVscRenewalReminders` (`vsc:send-renewal-reminders`, 09:00) and `Notifications/VscRenewalReminderNotification`, with plain text and HTML.

#### S10 — Application video upload
- **L2:** 047.1 (videos), 052.1, 052.2, 052.5, 076.1, 092.
- **Behaviour:**
  - A guest starts `way-maker.mp4` (60 MB) titled "Way Maker — live at Cornerstone" and gets a token. Chunks are appended.
  - When the connection drops at 24 MB, `HEAD` returns 24 MB and the upload resumes from there. The row shows a percentage, then "Processing", then "Live", with a 5:48 poster.
  - A title of 4 characters gets 422. A 16-minute file fails with its reason. A WebM named `.mp4` is typed `video/webm`, and an HTML file is refused.
  - A token never attached to an application is deleted after 24 hours.
- **Tests first:** `tests/Feature/ArtistOnboarding/ApplicationVideoUploadTest.php`.
- **Build:**
  - `Api/V1/ArtistOnboarding/ApplicationVideoUploadsController` (`store`, `append`, `offset`, `show`) in `routes/api_public.php`, inside the `uploads` group.
  - `artist_videos.artist_application_id` (nullable) and `upload_token`.
  - `Jobs/ArtistOnboarding/ProcessApplicationVideo`, which calls the S6 pipeline and then `Contracts/VideoTranscoder`.
  - `Integrations/Video/FakeVideoTranscoder`.
  - `uploads:prune-unattached`.
- **ADR:** resumable upload protocol (D7).

#### S11 — Apply as an artist: the form and a sent application
- **L2:** 047.1, 047.4, 077.4, 087, 101, 102, 108.
- **Behaviour:** on `/artists/apply`, "Apply as an artist" with the subtitle "About 10 minutes · We reply within 3 business days", Tobi fills four steps:
  1. **"About you":** Full name, Email, Base city "Scarborough", Act type "Solo".
  2. **"Your music":** Solo vocalist, Acoustic and Hymns; a 336-character bio ("100 to 1,500 characters. 336 so far."); the Way Maker video.
  3. **"Price and travel":** $400 and 80 km.
  4. **"References and review":** Pastor Samuel Osei and Ruth Kim, then the summary with Edit links.
  - Completed steps are links back.
  - "Send application" turns busy ("Sending…"), and the page becomes "Application received" and "Thanks, Tobi", with Application A-0219, Status Submitted, Sent Fri 9 Oct, 10:00 a.m. (frozen clock), Reply by Thu 15 Oct, and "Browse the lineup". All four steps are marked done without links, and focus moves to the heading.
  - The confirmation email is sent within the job run.
  - `/artists/apply` never resolves as an artist slug, and Discover's bundle does not load the apply code.
- **Tests first:**
  - `tests/Feature/ArtistOnboarding/SubmitArtistApplicationTest.php` (happy path, the reply-by date over Thanksgiving, a resource with no reference contacts)
  - `e2e/specs/artist-onboarding/apply-as-artist.spec.ts` and `e2e/pages/apply.page.ts`
  - The e2e spec's stub fixture answers Tobi's submission with A-0219 and the duplicate case with its own state. The visual suite masks the number and time.
- **Build:**
  - Migrations `create_artist_applications_table` (with the partial unique index on `lower(email)` where Submitted) and `create_application_references_table` (contacts encrypted).
  - `Enums/ApplicationStatus`, `Models/{ArtistApplication,ApplicationReference}`, `Services/ArtistOnboarding/BusinessDayCalendar` and `Actions/ArtistOnboarding/SubmitArtistApplication`.
  - `Requests/ArtistOnboarding/SubmitArtistApplicationRequest`, behind `VerifyBotChallenge`, and `Resources/ArtistOnboarding/ArtistApplicationResource`.
  - `Events/ArtistApplicationSubmitted`, `Listeners/SendApplicationReceivedEmail` and `Notifications/ApplicationReceivedNotification`.
  - Frontend:
    - `pages/apply/`: steps, `ReferenceFieldset`, `VideoUpload` and `application.store.ts` (the draft kept in `sessionStorage`, and an `Idempotency-Key` minted once)
    - `api/lib/services/artist-onboarding/` with the `ARTIST_APPLICATIONS_API` token and a fake
    - a lazy route declared before `/artists/:slug`, with `apply` added to the reserved slugs
- **Components and perf:** `zm-stepper` (the stepper variant in the design system's Steps), `zm-radio-group`, `zm-checkbox`, `zm-progress-bar`, `zm-upload-progress` and `zm-error-summary` (unless M2 built it), each with a scenario. `zm-description-list` gets a receipt variant.
- **Route states:** `/artists/apply` (`apply/default.html`).

#### S12 — Apply: refusals and retries
- **L2:** 001.3, 001.4, 047.2, 047.3, 047.5, 075.1, 108.3.
- **Behaviour:**
  - A missing contact for reference 1 and Tobi's own email as reference 2 give "Fix 2 things to continue", with "Add a phone number or email so we can reach Pastor Osei." and "References must be someone other than you." The server repeats the email check, ignoring case.
  - Base city "Ottawa" returns to "About you" with "Fix 1 thing to continue" and "Zamaro serves churches within 200 km of Toronto.", with every answer kept.
  - An address that cannot be geocoded gets "We couldn't find that address. Check the street and postal code."
  - tobi@tobiadeyemi.ca, who has A-0219 pending, gets the alert "You already have an application in review." and "We're reviewing the one you sent from tobi@tobiadeyemi.ca and will reply there. Your answers here are kept."
  - A retry with the same `Idempotency-Key` gets 200 with the same application, and only one is created. That check runs before the duplicate check.
  - Two concurrent sends from one email create one application, enforced by the partial unique index.
- **Tests first:** `tests/Feature/ArtistOnboarding/SubmitArtistApplicationTest.php` (new cases) and new cases in `apply-as-artist.spec.ts`.
- **Build:** the 422 field-to-step mapping in `application.store.ts`, and the `FakeGeocoder` anchors Oshawa, Pickering and Ottawa.

#### S13 — Application queue, review screen and reference verification
- **L2:** 048.1 (verification), 066, 067.1, 069.1, 079.2, 089.
- **Behaviour:**
  - `/admin/applications` shows "Applications", "3 waiting · we reply within 3 business days" and "Submitted, oldest first": Ebenezer Brass Band (Band, Oshawa, ON, Tue 6 Oct, 4:20 p.m.), Kezia & Mark Thompson, then Tobi Adeyemi. Each has a Review button.
  - Tobi's review screen shows the header "Application A-0219", "Tobi Adeyemi", "Solo vocalist · Acoustic, Hymns · Scarborough, ON · submitted Fri 9 Oct, 10:42 a.m." with a Submitted badge; the Applicant panel; the Bio ("336 characters"); the video "Way Maker — live at Cornerstone"; "Church references" with "0 of 2 verified" and decrypted contacts; "No Vulnerable Sector Check uploaded."; and, under Decision, "Verify both references before you approve." with "Approve Tobi" disabled.
  - Ticking a reference saves at once and shows "Verified by Priya Nair, Fri 9 Oct, 10:00 a.m." It records `application_reference.verified`, and the counter reads "1 of 2 verified". Unticking clears it.
  - Opening the screen records `application.viewed`. The response carries `private, no-store`.
  - Empty, loading and error states.
- **Tests first:**
  - `tests/Feature/ArtistOnboarding/ReviewArtistApplicationTest.php`
  - `e2e/specs/artist-onboarding/review-artist-application.spec.ts`
  - `e2e/pages/admin/{applications.page.ts,application.page.ts}`
- **Build:**
  - `Api/V1/Administration/{AdminArtistApplicationsController,AdminApplicationReferencesController}`, `Policies/ArtistApplicationPolicy`, `Actions/ArtistOnboarding/SetReferenceVerification` and `Resources/Administration/AdminArtistApplicationResource`.
  - Frontend: admin `pages/{applications,application}/` with `application-review.store.ts` (`canApprove`), and `api/lib/services/admin/artist-applications/` with models in `models/admin/`.
- **Route states:** `/admin/applications` and `/admin/applications/{tobi-id}` (default) as Priya.

#### S14 — Approve or reject
- **L2:** 048.1, 048.2, 048.3, 063, 069.1, 101, 108.
- **Behaviour:**
  - **Approve.** With both references verified, "Approve Tobi" shows "Approving…", then:
    - the alert "Tobi Adeyemi is approved" and "We emailed tobi@tobiadeyemi.ca the next step: set up payouts. The profile stays out of search and off its address until payouts are set up."
    - the Decision panel: "Approved Fri 9 Oct, 10:00 a.m. by Priya Nair", Artist role "Granted", Public profile "Hidden until payout setup"
  - Tobi's user gains the Artist role (D3). The artist row is Approved with `payout_ready` false, `published_at` null, a slug and the next ACT number. The video moves to the artist.
  - The approval records `application.approved` and `user.role_changed`.
  - A Youth or worship-night search on Tobi's free date leaves him out, and `/artists/tobi-adeyemi` returns 404.
  - The API answers 422 "Verify both references before you approve." when a reference is unverified, and 409 on a second approval.
  - **Reject.** "Reject…" opens "Reject Tobi Adeyemi's application?" with the kicker "A-0219 · Submitted · Fri 9 Oct".
    - Sending with no reason gives "Choose a reason first" and "Choose a reason from the list."
    - The note counter runs to "0 / 1,000".
    - "Reject application" stores the reason and note, sends the email with both, and records `application.rejected`.
    - Focus returns to "Reject…" when the dialog closes. The busy and failed states keep the values.
- **Tests first:**
  - `tests/Feature/ArtistOnboarding/{ApproveArtistApplicationTest,RejectArtistApplicationTest}.php`
  - new cases in `review-artist-application.spec.ts`, each setting up its stub state per test
  - `e2e/pages/admin/reject-application.dialog.ts`
- **Build:**
  - `Actions/ArtistOnboarding/{ApproveArtistApplication,RejectArtistApplication}`.
  - `GenerateArtistSlug` with a `SlugRegistry` (D4), sharing S15's `slug_histories` check.
  - `Requests/Administration/RejectArtistApplicationRequest` and `Enums/ApplicationRejectionReason`.
  - `Events/{ArtistApplicationApproved,ArtistApplicationRejected}`, `Listeners/SendApplicationDecisionEmail` and `Notifications/{ApplicationApprovedNotification,ApplicationRejectedNotification}`.
  - Admin `dialogs/reject-application/` (CDK Dialog).
- **Components and perf:** `zm-dialog` gains the danger variant, and `zm-form-field` gains a character counter. Run the perf test on both.
- **Route states:** none new. Approved and rejected are mutations, captured in the spec.

## Vendor ports and fakes (real adapters in M10)
- **`Contracts/MediaScanner` → `Integrations/Scanning/FakeMediaScanner`:**
  - Returns `Infected('EICAR-Test-File')` when the bytes hold the EICAR string, and `Clean` otherwise.
  - `failNextWith(ScanVerdict::Error)` and `scanned()` are test hooks.
  - Tests build the EICAR string at runtime, never as a committed file, so Windows Defender does not quarantine the repository.
- **`Contracts/VideoTranscoder` → `Integrations/Video/FakeVideoTranscoder`:** `probe()` reads durations from a fixture table (`way-maker.mp4` 348 s, `long-set.mp4` 960 s). `transcode()` records 360p, 720p and 1080p renditions and a poster that point at S12's sample HLS stream.
- **`Contracts/BotChallenge` (M2):** reused. The apply form sends the fake's passing token in dev and e2e.
- **`Contracts/Geocoder` and `Contracts/RoutingProvider` (M1):** add anchors for Oshawa, Pickering and Ottawa (450 km, out of area), plus one ungeocodable place.
- **Key-encryption key for `DocumentVault`:** read through M2's key holder from `ZAMARO_DOCUMENT_KEK`. The secrets-manager adapter comes in M10.
- **`Contracts/TotpVerifier`:** the real `pragmarx/google2fa` library (D8), with no fake.

## Seed data additions (idempotent, natural keys; `CastSeeder`)
- **Administrator.** Priya Nair, priya@zamaro.ca, with the Administrator role and a documented dev-only TOTP secret and password. The seeder refuses to run in production.
- **Applications:**
  - A-0217 Ebenezer Brass Band (Band, Oshawa, Tue 6 Oct 4:20 p.m.)
  - A-0218 Kezia & Mark Thompson (Duo, Pickering, Thu 8 Oct 9:05 p.m.)
  - A-0219 Tobi Adeyemi: tobi@tobiadeyemi.ca, Scarborough, Solo, Fri 9 Oct 10:42 a.m.; Solo vocalist, Acoustic and Hymns; $400; 80 km; the 336-character bio from the mock; the Way Maker video, Live, 5:48; references Pastor Samuel Osei (Cornerstone Baptist, Scarborough, samuel.osei@cornerstonebaptist.ca) and Ruth Kim (Agincourt Community Church, 647 555 0192), both unverified.
- **Checks:**
  - Elijah's first check: issued 25 Sep 2026, uploaded Wed 7 Oct 4:10 p.m., Pending.
  - Abigail's newer check: issued 5 Oct 2026, uploaded Fri 9 Oct 9:52 a.m., Pending.
  - Each stores a one-page sample PDF through `DocumentVault`.
  - Daniel & Ruth's verified check expiring 30 Nov 2026, for S9.
- **Mock emails and approval dates** for the eight mock artists (for example marcus@marcusbelltrio.ca, approved 2 Mar 2026).
- **Audit rows from `admin-audit/default.html`**, inserted only when absent. Upserts would hit the trigger. Their targets carry a `context.target_label`, such as "Booking · ZAM-0090 · $75", because the bookings arrive later.
- **Row counts** must be unchanged after a second `db:seed`.

## Known risks
- **Stateful admin specs:** approvals, verification and reference ticks change what later requests return. Each e2e spec sets up the before and after stub states it needs through fixtures, so no spec sees another's changes; the real state changes are proven in backend Feature tests.
- **The `/admin` gate:** it adds an API round trip to every admin page load. Cache nothing. A gate bug that serves `index.html` to a non-admin leaks only the bundle, never data, because the API stays authoritative (L2-066).
- **Database roles:** the trigger is not a real control while the app connects as the table owner. Record this in the ADR; M10 splits the roles.
- **Clock and mocks:** the frozen 10:00 clock differs from the admin mocks' times, so mask timestamps in the visual suite. Mock-only rows, such as the Bookings and Reviews nav counts, are masked until M7 and M8.
- **Large uploads on Windows bind mounts:** chunked writes to `storage/app` are slow. Keep the upload disks in a named volume.
- **Approved artists stay invisible until M6:** demos need a seeded published artist, and nothing else in M3 publishes one.

## Verification (end of M3)
1. `docker compose up -d --wait`, then `docker compose exec api php artisan test`. Every Feature test passes, including `tests/Feature/Security/*` and the OpenAPI contract assertions.
2. Run `docker compose exec api php artisan db:seed` twice. Row counts are unchanged.
3. Run `audit:prune`, `vsc:send-renewal-reminders` and `uploads:prune-unattached` twice each through `docker compose exec api php artisan`. The second runs change nothing.
4. In `psql` as the app role, `UPDATE audit_entries SET outcome = 'Failed'` and `DELETE FROM audit_entries` both fail.
5. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build admin && NG_BUILD_MANGLE=0 npx ng build perf-test`. The zamaro stats contain no admin chunk, and its initial bundle stays within budget.
6. Run `cd e2e && npx playwright test --project=zamaro --project=admin`, with no API, database or Docker running. This covers the specs, `visual/`, `a11y/` (light and dark) and `perf/`.
7. Run `npm run perf-test -- --baseline <main dist> --fail-on-regression`. No row is flagged, and every new scenario renders.
8. Manual walkthrough:
   - As a guest, apply as a new artist through all four steps and see the confirmation and the Mailpit email.
   - Retry with tobi@tobiadeyemi.ca and see "You already have an application in review."
   - Open `/admin` signed out and as Naomi: both give 404.
   - Sign in as Priya with a TOTP code. Tick both of Tobi's references and approve. Confirm that `/artists/tobi-adeyemi` is 404 and that Tobi is absent from search.
   - Verify Elijah's check from Artists → Vulnerable Sector Checks, opening the document first, and confirm the link dies after 5 minutes.
   - Read the new entries in the audit log.
   - Leave the admin app idle and see the warning at 28 minutes and sign-in at 30.
   - Check the admin app at 375 px and in dark theme.
