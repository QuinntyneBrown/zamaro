# Milestone 2 plan: accounts and sessions

**Status:** Not started. Depends on M1 (`feat/m1-foundations-and-browse`) being merged to `main`.

## Context

**What M1 leaves behind.**
- **API.** Laravel 11. `routes/api.php` is still empty, beside `api_public.php` and `health.php`. It has problem
  details (`NotFound`, `ValidationFailed`, `TooManyRequests`, `ServerError`), request IDs, JSON request logs,
  Scramble with `AssertsOpenApiContract`, and one `search` limiter.
- **Data.** Laravel's default `users`, `sessions` and `password_reset_tokens` tables, with no roles.
  - Cast accounts are `{slug}@cast.zamaro.test` with random passwords, so nobody can sign in.
  - There is no `churches` table: bookings store `church_name` and `church_city`.
- **Services and ports.** `ServiceArea` and `DistanceService` (Discovery), `AvailabilityService`, and
  `Contracts/{Geocoder, RoutingProvider}` with fakes. Sanctum and Mailpit are not set up.
- **Angular.**
  - `ThemeService` stores the theme on the device only, and `LastSearch` lives in memory.
  - There are two pages (`discover/`, `artist/`) and the `menu` dialog.
  - The `api` library has no `auth/` folder.
  - Each of the 25 `zm-*` components has a perf scenario. There is no `zm-toast`, because M1's S16 was optional.
- **e2e.** Read-only. The database is seeded once and the clock is frozen at Fri 9 Oct 2026 10:00. The routes
  manifest lists 4 states, all signed out.

**Deferred from M1 to M2:**
- `auth:sanctum` by default
- `EnsureJsonRequest` (415)
- log redaction
- tighter CORS
- no transfer-caching of personal data
- the profile Save toggle
- the signed-in top-bar mask

**Goal.** Guests become bookers who can:
- register and verify an email address
- sign in and recover access
- keep a church profile
- manage the account and two-step sign-in
- accept new terms
- save artists and see the shortlist

Underneath, M2 lays the foundations M3–M10 reuse: sessions, CSRF, authorisation, validation, rate limits,
field encryption, email and background jobs.

**Designs in scope:**
- `accounts/*`
- `security/manage-sessions-and-csrf` and `security/authorise-and-validate-requests`
- `security/limit-request-rates`: per-account limits and the bot challenge
- `security/protect-secrets-and-data`: encrypted fields and log redaction
- `privacy/record-consent`
- `notifications/send-transactional-emails`: the foundation only
- `operations/run-background-jobs`
- `user-experience/switch-theme`: the account preference

**Out of scope:**

| Item | Milestone |
|---|---|
| Booking emails, `email_messages`, bounces and the undeliverable banner (L2-063, L2-065.4) | M5 |
| The verified-email booking gate (L2-022.4) | M5 |
| `add-church` and the address snapshot (L2-024.1, .3) | M5 |
| The daily booking allowance (L2-077.3) | M5 |
| Admin MFA, the admin idle limit and the audit viewer | M3 |
| Reminder and review preferences | M7 |
| Data export and account deletion | M9 |
| DNS checks, the secrets manager, CI scans and real vendor adapters | M10 |

## Entry criteria and dependencies

- **M1 is complete.** S12–S16 are merged, and the `e2e/visual` and `e2e/a11y` suites exist. If those suites don't
  exist yet, build them first, as test-only work.
- **Branch.** Work on `feat/m2-accounts-and-sessions`, cut from `main`, with one commit per slice or smaller.
- **Slice loop.** Each slice follows M1's loop:
  1. Write the criteria.
  2. Write a red test.
  3. Build.
  4. Run the regression set. Add the perf test with `--fail-on-regression` whenever a `zm-*` component changes.
- **e2e now writes.** Visual and read-only specs use the seeded Naomi, Abigail and Tomi. Specs that change data
  use fresh bookers (D19).

## Decisions to make or confirm

Decisions marked "OK" need the user's approval before their slice starts. The others go ahead with the default
shown and are recorded in the slice's ADR or the design.

| # | Question (source) | Recommended default | OK |
|---|---|---|---|
| D1 | Argon2id memory and iterations (register-booker) | Laravel defaults (65,536 KiB, 4 passes, 1 thread); minimum cost in `testing` | |
| D2 | Bot challenge vendor (register-booker, limit-request-rates) | `Contracts/BotChallenge` with a fake until M10 | |
| D3 | Bot provider unreachable (limit-request-rates) | Fail closed, with the usual challenge message | OK |
| D4 | Breached-password vendor (sign-in-and-recover-access) | `Contracts/BreachedPasswordChecker`; the fake rejects a configured list; the HIBP range adapter in M10 | |
| D5 | TOTP library (sign-in-and-recover-access) | `pragmarx/google2fa` with `bacon/bacon-qr-code` (SVG), behind `Services/Accounts/TotpVerifier` | |
| D6 | Limits on register, resend, forgot and reset (the designs only say "rate-limited") | Register 10/h per IP; resend 3/15 min per user; forgot 5/h per IP and per email; reset 30/min per IP | OK |
| D7 | Signed-in `api` limit (limit-request-rates) | 300/min per user; anonymous stays at 120/min per IP | |
| D8 | Toast after a second 419 (manage-sessions-and-csrf; no mock) | "That didn't go through. Reload the page and try again." Error toast, stays until dismissed | OK |
| D9 | "Your session ended" line before drafts exist (M5) | "Sign in again to carry on. Nothing you typed is lost." | OK |
| D10 | Problem types for 401, 419 and the new cases | `unauthenticated`, `csrf-token-mismatch`, `link-expired` (410), `payload-too-large`, `unsupported-media-type`, `saved-artist-limit`, `terms-acceptance-required`, `sign-in-paused` (429). Bad credentials: 422 with `errors.credentials` | |
| D11 | Email-change link lifetime (manage-account-settings) | 24 hours, like the verification link | OK |
| D12 | `TrackSessionActivity` interval (manage-account-settings) | 5 minutes | |
| D13 | Source of the approximate city (manage-account-settings) | `Contracts/IpLocator` with a fake table; unknown IPs show no city | |
| D14 | Most recent search date: per browser or per account (view-saved-artists) | Per browser: `LastSearch` writes `localStorage['zamaro.lastSearchDate']` | OK |
| D15 | Does a new privacy-policy version trigger the terms gate? (record-consent) | No. Only Terms do (L2-080.3); the privacy version is recorded at registration | OK |
| D16 | Sending domain and From address (send-transactional-emails) | `Zamaro <hello@zamaro.ca>` on `zamaro.ca`; DNS in M10 | OK |
| D17 | Backoff intervals (email and jobs designs) | `tries = 6`; delays of 10, 30, 90, 270 and 810 s, ±10% jitter | |
| D18 | Queue names and process counts (run-background-jobs) | `high`, `notifications`, `default`; one process each locally | |
| D19 | How e2e specs that change data get users | `cast:booker {email} [--church] [--saved=…] [--terms=…]`: refused in production, run through `docker compose exec`. Registration is still tested through the UI | |
| D20 | Toast when saving the theme fails (switch-theme) | None. The device keeps the choice, and the next toggle reconciles | |
| D21 | Email on two-step changes (mocks say "We emailed…"; the design is silent) | Add `TwoStepSignInChangedNotification` for on, off and new codes; update the design | OK |
| D22 | M2 actions call `RecordAuditEntry`, which is M3 | Add the append-only `audit_entries` table and the action in S1; the viewer stays in M3 | OK |
| D23 | Mock parts that belong to later screens | Hide `#data` and `#delete` (M9), the reminder and review boxes (M7), "Your bookings" (M5), and the artist's Dashboard item and request count (M4/M5). Visual tests mask them | OK |
| D24 | The saved card's "Request" link (`/book` is M5) | Until M5 it links to `/artists/{slug}?date=…` | OK |
| D25 | Street-address type-ahead source (manage-church-profile) | A plain field until the geocoder vendor (M10) | |
| D26 | Cross-user suite fails on a route with no fixture (L2-074.3), against "no architecture tests" | Keep it: L2-074.3 and the AGENTS.md tree both name it, and every case asserts behaviour | OK |
| D27 | Raw-SQL lint tool (authorise-and-validate) | Larastan with a custom PHPStan rule against non-literal `DB::raw`, `select`, `statement` and `*Raw` | |
| D28 | Cast sign-in password | `ZAMARO_CAST_PASSWORD` for Naomi, Abigail and Tomi, seeded only in `local`, `testing` and `e2e` | |

## Design conflicts and their resolutions

- **Folders (ADR-0007).** The designs' `features/account`, `features/saved` and `shared/saved` map to:
  - pages: `sign-in`, `sign-up`, `verify-email`, `forgot-password`, `reset-password`, `account`, `confirm-email`,
    `accept-terms`, `mfa-setup`, `mfa-challenge`, `saved`
  - dialogs: `account-menu`, `two-step-code`
  - `api/lib/auth/`: auth, guards, interceptors and the pending intent
  - `app/shared/`: `SavedArtistsStore`

  Routes keep the designs' paths. S10, S12 and S14 add their new page folders to the AGENTS.md tree.
- **Class names.** `RegisterPage` becomes `SignUp`, `SignInPage` becomes `SignIn`, and
  `TwoStepCodeDialogComponent` becomes `TwoStepCode`.
- **Current user.** The designs use both `AuthService` and `CurrentUserStore`, and three resource and controller
  names (`CurrentUserResource`, `MeResource`, `MeController`). The plan keeps one of each:
  - `AuthService`
  - `CurrentUserResource`
  - `Api\V1\Accounts\MeController`, serving `GET /api/v1/me` and `PATCH /api/v1/me/preferences`

  S1 records this in an ADR on current-user names and updates the three designs that use the other names.
- **Ports in `app/Contracts` (ADR-0002).** `BotChallengeVerifier` moves out of `App\Services\Security` and becomes
  `Contracts/BotChallenge`. `BreachedPasswordChecker`, `IpLocator`, `OnCallAlerter` and `ErrorReporter` live in
  `Contracts` too.
- **Namespace.** `App\Actions\Account\SaveChurch` becomes `Actions\Accounts\SaveChurch`.
- **Default tables.** Laravel's `password_reset_tokens` and `sessions` tables are unused, so S0 drops them.
  - S8 recreates `password_reset_tokens(user_id, token_hash, expires_at, used_at)`.
  - Sessions live in Redis plus `user_sessions`.
- **Retries.** The email design says `tries = 5`, but L2-065.2 and L2-092.1 mean one attempt plus 5 retries.
  Use `tries = 6` through `RetriesWithBackoff`, and fix the email design.
- **403 or 404.** manage-account-settings returns 403 to a booker on `PUT /account/contact-phone`, but L2-074.1
  requires 404. Use `role:artist`, which returns 404, and fix the design.
- **Saved date.** view-saved-artists reads the date from a localStorage `SearchStore`. M1's `LastSearch` holds
  it in memory, so `LastSearch` persists it (D14).
- **Existing services.** `ServiceArea` and `DistanceService` already exist; `SaveChurch` reuses them.
- **Mock times the frozen clock can't produce.** "after 10:57 a.m.", "until 11:31 a.m.", "Last active 2 hours ago"
  and "Saved 2 min ago". Specs assert the computed values; visual tests mask these spans.
- **Footer.** When signed in, the footer replaces "Your account" with "Naomi Fraser", her church and "Saved
  artists (3)".

## Slices

### S0 — Groundwork (infra and test-only, outside ATDD)
- **Build:**
  - **Sanctum.** Install `laravel/sanctum` ^4 with `statefulApi()`; read the stateful domains from
    `ZAMARO_WEB_ORIGINS`.
  - **Sessions.** Driver `redis`, cookie `zamaro_session`, `http_only`, `same_site=lax`, `secure` from env,
    `lifetime=10080`.
  - **Old tables.** Drop the default `sessions` and `password_reset_tokens`.
  - **Horizon.** Add supervisors for `high`, `notifications` and `default`.
  - **Mail.** Add a pinned `mailpit` service (SMTP :1025, API :8025). `api`, `api-e2e` and `worker` send mail over
    `smtp`.
  - **Redis.** Give `api-e2e` its own Redis prefix.
  - **Proxy.** Proxy `/sanctum` alongside `/api` in `proxy.conf.json` and in the SSR server.
  - **e2e fixtures.** Add `mailbox.ts` (Mailpit), `accounts.ts` (API sign-in to a `storageState`, plus unique
    addresses) and `totp.ts`. `RouteState` gains `signedInAs?`, and global setup clears Mailpit.
- **Verify:** the M1 suites stay green, and `:8025/api/v1/info` answers.
- **ADR: same-origin cookie sessions.** It covers Sanctum SPA mode, Redis sessions, the cookie names, the
  dropped tables, and why there are no bearer tokens.

### S1 — Sign in
- **L2:** 023.1, 023.2, 072.2, 073.1, 089.3, 108.1/.3.
- **Behaviour:**
  - Naomi opens `/sign-in?returnUrl=…abigail-mensah…`, enters `naomi.fraser@riversidecc.ca` and her password, and
    lands back on Abigail's profile.
  - `GET /api/v1/me` returns `initials: "NF"`, `roles: ["booker"]`, `emailVerified: true`, `themePreference: null`
    and `termsAcceptanceRequired: false`, with `Cache-Control: private, no-store`.
  - A wrong password and an unknown email get the same 422. The page shows "Couldn’t sign you in" and "Email or
    password is incorrect.", and clears the password. An unknown email is checked against a dummy hash, so both
    take the same time.
  - While the request is pending the button reads "Signing in…". A 500 shows "We couldn’t sign you in".
  - `zamaro_session` is `HttpOnly`, `Secure` and `SameSite=Lax`, and its ID changes at sign-in. Passwords are hashed
    with Argon2id.
- **Tests first:**
  - `tests/Feature/Accounts/{SignInTest, CurrentUserTest}.php`
  - `e2e/specs/accounts/sign-in-and-recover-access.spec.ts`
  - `e2e/pages/sign-in.page.ts`
- **Build:**
  - **Backend.**
    - Migrations: `roles` and `role_user` (`Role` enum), and `audit_entries` (D22).
    - `SessionController@store` and `MeController@show`, with `SignInRequest`.
    - Actions `AttemptSignIn`, `StartSession` and `Audit/RecordAuditEntry`.
    - `CurrentUserResource`.
    - `SetCachePolicy`, which sends `private, no-store` on the `api.php` group.
  - **Frontend.**
    - `api/lib/auth/{auth.service, auth-api, provide-auth}.ts`, with the `AUTH_API` token and
      `withXsrfConfiguration`.
    - An in-memory fake.
    - `pages/sign-in/`.
- **ADR:** current-user names.
- **Components:**
  - `zm-auth-card` (the "Admit one" card on 9 pages) → `AuthCard.ts`
  - `zm-error-summary` → `ErrorSummary.ts`
- **Route states:** `/sign-in` → `sign-in/default.html`.

### S2 — Signed-in header, account menu and sign-out
- **L2:** 023.5, 024.2 (initials and name), 099, 101.
- **Behaviour:**
  - After hydration the header shows "NF", named "Account menu for Naomi Fraser".
  - The menu lists "Naomi Fraser", her email, Account settings and Sign out. "Your bookings" is hidden (D23).
  - Tab moves through the menu. Escape returns focus to the avatar.
  - Sign out ends the session on the server: the old cookie gets 401 from `/me`. The header shows "Sign up" again.
  - The server-rendered HTML never contains "Naomi Fraser".
- **Tests first:**
  - `Accounts/SignOutTest.php`
  - the sign-in spec
  - `e2e/pages/account-menu.dialog.ts`, plus a `shell.ts` update
- **Build:**
  - **Backend.** `SessionController@destroy` with `SignOut`, which invalidates the session and rotates the token.
  - **Shell.** The shell reads `AuthService.currentUser()`, which loads `/me` in the browser only.
  - **Menu.** `dialogs/account-menu/` uses CDK Overlay.
  - **Footer.** The footer column switches to the signed-in user.
  - **Rendering.** Private routes use `RenderMode.Client`.
  - **Transfer cache.** It skips `/api/v1/me`, `/api/v1/account/**` and `/api/v1/saved-artists/**`.
- **ADR: server rendering and personal data.** SSR forwards no cookies, and nothing personal is transfer-cached.
- **Components:**
  - `zm-avatar` → `Avatar.ts`.
  - The `zm-top-bar` account slot → a new `TopBarSignedIn.ts`.
  - The `zm-menu` `menu__who` header → re-measure `Menu`.
- **Route states:** both Discover states, signed in as `naomi`. Remove the M1 mask.

### S3 — CSRF and session limits
- **L2:** 073.2, 073.3, 109.2.
- **Behaviour:**
  - `DELETE /api/v1/session` without `X-XSRF-TOKEN` gets 419 `csrf-token-mismatch`, and Naomi stays signed in. The
    same holds for every mutating `/api/v1` call.
  - After a 419 the app fetches `/sanctum/csrf-cookie` and retries once. A second 419 shows the D8 toast.
  - A session idle for 7 days, or open for 30, gets 401. The app goes to `/sign-in?returnUrl=…&ended=1`, which
    shows "Your session ended" (D9).
- **Tests first:**
  - `Security/{CsrfProtectionTest, SessionLifetimeTest}.php`, using time travel
  - `e2e/specs/security/manage-sessions-and-csrf.spec.ts`, which clears the session cookie
- **Build:**
  - **Backend.** `EnforceAbsoluteSessionLifetime`, `SessionLifetimePolicy`, and `auth.started_at` stored at sign-in.
  - **Frontend.** The `csrf-recovery` and `session-expired` interceptors in `api/lib/auth`, and `ToastService` in
    `app/shared`.
- **Components:**
  - `zm-toast` → `Toast.ts`
  - `zm-toast-region` (at most 3, newest first) → `ToastRegion.ts`
- **Route states:** `/sign-in?ended=1` → `sign-in/expired.html`, with the draft line masked.

### S4 — The request gate
- **L2:** 074.1, 074.3, 075.1, 075.2, 075.4, 077.1, 077.2 (per account), 079.3, 095.2.
- **Behaviour:**
  - `api.php` routes require `auth:sanctum` by default.
  - A booker on a `role:artist` route gets 404.
  - A body of 1,048,577 bytes gets 413; a `text/plain` body gets 415.
  - The 121st anonymous request in a minute from one IP gets 429 with `Retry-After`.
  - A signed-in booker's 31st search in a minute gets 429 from any IP.
  - CORS allows only `ZAMARO_WEB_ORIGINS`, with credentials.
  - Logs show `password`, `current_password`, `challengeToken` and `x-xsrf-token` as `[REDACTED]`.
- **Tests first:**
  - `Security/{CrossUserAccessTest, RequestValidationTest, AnonymousRateLimitTest}.php`, with
    `route-ownership-fixtures.php` (D26)
  - `Operations/LogRedactionTest.php`
  - new cases in `ApiConventionsTest` and `SearchRateLimitTest`
- **Build:**
  - Middleware: `EnsureJsonRequest`, `LimitRequestBodySize` and `EnsureUserHasRole`.
  - The `api` limiter and the per-user search limit; the e2e API raises the limit.
  - `config/cors.php`.
  - `Logging/{RedactSensitiveData, ApplyRedaction}`.
  - CI: Larastan with the raw-SQL rule (D27), and an ESLint ban on `bypassSecurityTrust*` and `[innerHTML]`.

### S5 — Register a booker, with consent
- **L2:** 022.1, 022.2, 072.1, 077.4, 080.1, 080.2, 108.
- **Behaviour:**
  - A guest fills in Full name, Email and Password, then ticks "I accept Zamaro’s terms of use and privacy policy".
    They leave "Email me about new artists near my church" unticked.
  - "Create account" changes to "Creating account…", then the page shows "Check your email to finish signing up".
  - Mailpit holds the verification email, with HTML and text parts.
  - Three consent rows are written: Terms 2026-10, PrivacyPolicy 2026-10 and MarketingEmail false. Each records
    the time, IP and user agent.
  - Registering `naomi.fraser@riversidecc.ca` again shows the same page and changes nothing. Naomi gets "Someone
    tried to sign up with your email".
  - Field errors:
    - "This one has 9 characters. Use at least 12."
    - "Accept the terms and privacy policy to create an account."
    - The summary reads "Fix 2 things to continue".
  - A failed challenge shows "We couldn’t check that you’re a person" and keeps every value.
  - Stale document versions get 409.
- **Tests first:**
  - `Accounts/RegisterBookerTest.php`, `Privacy/RecordConsentTest.php` and `Security/BotChallengeTest.php`.
  - `e2e/specs/accounts/register-booker.spec.ts`. The page object forces a `fail` token through `page.route`.
  - `e2e/pages/sign-up.page.ts`.
- **Build:**
  - **Migrations.** `email_verification_tokens`, `legal_documents` and `consent_records` (append-only).
  - **Registration.** `RegistrationController` (returns 202), `RegisterBookerRequest`, `Rules/PasswordPolicy` and
    `RegisterBooker`.
  - **Consent.** `RecordConsent`, `LegalDocumentRegistry`, and a public `LegalDocumentController`.
  - **Bot challenge.** `VerifyBotChallenge` middleware, with the `BotChallenge` and `BreachedPasswordChecker`
    ports and their fakes.
  - **Email.** The `TransactionalNotification` base class with `VerifyEmailNotification` and
    `DuplicateSignUpNotification`. Views sit in `resources/views/emails/` and copy in `resources/i18n/en/emails.json`.
  - **Frontend.** `pages/sign-up/`, the `consent` service, and `api/lib/auth/bot-challenge.ts`, whose fake
    resolves `pass`.
- **ADR: email foundation.** It covers Mailpit, Markdown mail built from the catalogue, the base class and the From
  address (D16).
- **Components:** `zm-checkbox` (`.choice`) → `Checkbox.ts`.
- **Route states:** `/sign-up` → `sign-up/default.html`.

### S6 — Email delivery rules and failed jobs
- **L2:** 063.2 (both parts, no card data), 065.2, 092.1, 111.1 (emails).
- **Behaviour:**
  - If the mail transport throws, `VerifyEmailNotification` retries on `notifications` after about 10, 30, 90, 270
    and 810 s.
  - After the 6th failed attempt the job is in `failed_jobs`, and `ReportFailedJob` calls `ErrorReporter` and
    `OnCallAlerter` with the job name and request ID.
  - `php artisan i18n:check` fails on a literal "Welcome" in an email view, or on a missing key, and names the file
    and line.
- **Tests first:** `Operations/BackgroundJobFailureTest.php`, `Notifications/EmailDeliveryTest.php` and
  `UserExperience/TranslationCheckTest.php`.
- **Build:**
  - `Jobs/Concerns/RetriesWithBackoff` (D17) and `ReportFailedJob`.
  - The `OnCallAlerter` and `ErrorReporter` ports with fakes.
  - `failed_jobs` with the `database-uuids` driver.
  - `CheckTranslationsCommand`, run in `.ci/lint.sh`.
  - Fix both designs to `tries = 6`. `DueWorkCommand` waits for M5.

### S7 — Verify the email address
- **L2:** 022.3. The verified-email booking gate (L2-022.4) waits for M5.
- **Behaviour:**
  - The link opens `/verify-email?token=…&returnUrl=/`. The page shows "Checking your link", then goes to
    Discover, where the banner reads "Email verified" and "Thanks, Naomi. You can send booking requests now." It
    stays for one page.
  - A used, unknown or expired token gets 410. The page shows "This link has expired" and "Send a new link".
  - Until the address is verified, every page shows a banner with no close button: "Verify your email" and "We
    sent a link to {email}. You need it to send requests.", with a Resend email action.
  - After a resend the banner reads "A new link is on its way to {email}. It works for 24 hours.", and the action
    shows "Sent" for a minute. Earlier links stop working.
- **Tests first:**
  - `Accounts/VerifyEmailTest.php`
  - the register spec
  - `e2e/pages/verify-email.page.ts`
- **Build:**
  - `EmailVerificationController`, with `VerifyEmail` and `ResendVerificationEmail`.
  - `pages/verify-email/`.
  - The shell's banner region.
- **Components:** `zm-banner` → `Banner.ts`.
- **Route states:** `/verify-email?token=e2e-unknown` → `verify-email/expired.html`.

### S8 — Lockout and password reset
- **L2:** 023.3, 023.4, 072.4, 077.4.
- **Behaviour:**
  - A 6th sign-in try within 15 minutes, for any address, shows "Sign-in is paused for 15 minutes" with the end
    time and "If this wasn’t you, the account owner has been emailed." A real owner gets one
    `AccountLockedNotification` per pause.
  - `/forgot-password` runs the bot challenge and always ends on "Check your email".
  - `/reset-password/:token` shows "Checking your reset link…", then "Choose a new password".
    - Mismatched passwords show "The two passwords don’t match. Type the new one again."
    - Saving shows "Password changed". This device is signed in, every other session ends, and the user gets
      `PasswordChangedNotification`.
    - A link more than 60 minutes old, or already used, shows "This link has expired".
- **Tests first:**
  - `Accounts/{SignInLockoutTest, PasswordResetTest}.php`
  - the sign-in spec
  - `e2e/pages/{forgot-password, reset-password}.page.ts`
- **Build:**
  - Migrations: `password_reset_tokens` (the design's shape) and `user_sessions`.
  - Services: `SignInThrottle` and `SessionRegistry`. `StartSession` now registers each session.
  - `PasswordResetController` (forgot, `reset/check`, reset), with `SendPasswordResetLink` and `ResetPassword`.
  - The two pages.
- **Route states:** `/forgot-password` → `forgot-password/default.html`.

### S9 — Account settings: profile, church and contact phone
- **L2:** 001.1, 001.2, 001.4, 004.1, 024.2, 025.4, 079.2, 105, 108.
- **Behaviour:**
  - `/account` shows "Account settings" and "Naomi Fraser · Riverside Community Church", with the settings nav,
    Profile, Church, Email preferences (D23 boxes), the Two-step and Devices sections, and the save bar.
  - Saving 2150 Lakeshore Road, L7R 1A3 shows "Saved" and "Your settings are up to date. Bookings already sent keep
    the church address they were made with."
  - Rejected saves store nothing and keep every value:
    - An Ottawa address: "Zamaro serves churches within 200 km of Toronto." under the summary "Your church
      wasn’t saved".
    - An unknown address: "We couldn’t find that address. Check the street and postal code."
    - A bad postal code: "Enter a postal code like L7R 1A3, with six characters."
  - `churches.phone` is stored as `v1:` ciphertext.
  - The menu and the footer show "Riverside Community Church", and Discover pre-fills Burlington at 120 km.
  - Abigail sees Contact instead of Church: "Churches see it only once a booking is confirmed. It’s never on your
    public profile." When Naomi calls `PUT /account/contact-phone`, she gets 404.
- **Tests first:**
  - `Accounts/{ManageChurchProfileTest, AccountProfileTest, ArtistContactPhoneTest}.php`
  - `Security/FieldEncryptionTest.php`
  - `e2e/specs/accounts/{manage-church-profile, manage-account-settings}.spec.ts`
  - `e2e/pages/account.page.ts`
- **Build:**
  - **Migrations.** `churches` and `artists.contact_phone`.
  - **Encryption.** `FieldEncrypter` (aes-256-gcm, versioned keys) and the `EncryptedField` cast.
  - **Fakes and rules.** `FakeGeocoder` gains street addresses; add a `NorthAmericanPhone` rule.
  - **Controllers.** `ChurchController` (`role:booker`) with `SaveChurch` and `ChurchResource`;
    `AccountProfileController`; and `ArtistContactController` (`role:artist`).
  - **Frontend.** `pages/account/` as one reactive form, the `account` service, and the Discover pre-fill.
- **ADR: field-encryption keys.** Rotation stays `<TO SUPPLY>` until M10.
- **Components:**
  - `zm-form-section` → `FormSection.ts`
  - `zm-save-bar` → `SaveBar.ts`
  - `zm-settings-nav` → `SettingsNav.ts`
- **Route states:**
  - `/account` signed in as `naomi` → `account/default.html`
  - `/account` signed in as `abigail` → `account/artist.html`

### S10 — Change email and password
- **L2:** 025.1, 025.2.
- **Behaviour:**
  - Naomi asks for `naomi@riversidecc.ca` and confirms with her current password. Her old address gets a notice
    and the new one gets a link. Her email stays the same until she opens the link.
  - Asking for an address someone already uses looks exactly the same.
  - The link opens "Confirming your new email", then "Email changed. You now sign in with naomi@riversidecc.ca."
  - A used or expired link, or an address taken in the meantime, shows "This link has expired" and "Change email
    again".
  - A new password ends every other session and gives the current session a new ID.
- **Tests first:**
  - `Accounts/{ChangeEmailTest, ChangePasswordTest}.php`
  - the settings spec
  - `e2e/pages/confirm-email.page.ts`
- **Build:**
  - `users.pending_email` and `email_change_tokens`.
  - `AccountEmailController`, with `RequestEmailChange` and `ConfirmEmailChange`.
  - `AccountPasswordController`, with `ChangePassword`.
  - `pages/confirm-email/`.
- **Route states:** `/account/email/confirm?token=e2e-unknown` → `confirm-email/expired.html`.

### S11 — Signed-in devices
- **L2:** 025.3, 074.2.
- **Behaviour:**
  - The list starts with "Chrome on Windows · Burlington, ON · This device · active now", then other devices such as
    "Safari on iPhone".
  - "End session" signs that device out at once, with no confirmation. Its next call gets 401.
  - Another user's session ID gets 404.
  - Raw session IDs and full IP addresses are never returned.
- **Tests first:**
  - `Accounts/SignedInDevicesTest.php`, with a cross-user fixture
  - the settings spec, run in two browser contexts
- **Build:**
  - `AccountSessionController`, with `EndSession` and `SessionResource`.
  - `TrackSessionActivity` (D12).
  - The `IpLocator` port and its fake.
  - A device-label parser.
- **Components:** `zm-device-list` → `DeviceList.ts`.

### S12 — Two-step sign-in: turn on and sign in with a code
- **L2:** 072.3, 072.4.
- **Behaviour:**
  - "Turn on two-step sign-in" opens `/account/security/mfa`, which shows the QR code and the key.
  - A wrong code shows "That code didn’t match. Codes change every 30 seconds; enter the one showing now."
  - A right code shows "Save your recovery codes" (10 of them, with copy and download), sends the D21 email, and the
    section reads "On".
  - The next sign-in goes to `/account/sign-in/verify` ("Enter your code"). "Use a recovery code instead" accepts
    each code once.
  - A wrong code shows "That code is wrong or has expired. Enter the code your app shows now." It counts toward the
    5-in-15 lockout.
- **Tests first:**
  - `Accounts/{EnableTwoFactorTest, TwoFactorChallengeTest}.php`
  - `e2e/specs/accounts/two-step-sign-in.spec.ts`: the page object reads the key, and `totp.ts` computes the codes
  - `e2e/pages/{mfa-setup, mfa-challenge}.page.ts`
- **Build:**
  - Migrations: `users.{mfa_enabled, two_factor_secret (encrypted), two_factor_confirmed_at}` and `recovery_codes`.
  - `TwoFactorController` (begin, confirm).
  - `SessionController@twoFactor`, with `CompleteTwoFactorChallenge`.
  - `TotpVerifier`.
  - The two pages.
- **ADR:** TOTP library.
- **Components:** `zm-recovery-codes` → `RecoveryCodes.ts`.
- **Route states:**
  - `mfa-setup/default.html`, with the QR code and key masked
  - `mfa-challenge/default.html`

### S13 — Two-step sign-in: turn off and new recovery codes
- **L2:** 072.5.
- **Behaviour:**
  - "Turn off" opens "Turn off two-step sign-in?", with "Keep it on" first. It needs a current code or an unused
    recovery code.
  - A wrong code shows "That code is wrong or has expired. Enter the code your app shows now, or an unused recovery
    code." It counts toward the lockout.
  - "New recovery codes" opens "Get new recovery codes?", then "Save your new recovery codes". All earlier codes
    stop working.
  - Escape returns focus to the button that opened the dialog.
  - Each change emails Naomi (D21) and is audited.
- **Tests first:**
  - `Accounts/ManageTwoFactorTest.php`
  - the two-step spec
  - `e2e/pages/two-step-code.dialog.ts`
- **Build:**
  - `TwoFactorController@{destroy, recoveryCodes}`, with `DisableTwoFactor` and `RegenerateRecoveryCodes`.
  - `dialogs/two-step-code/`, built on `zm-dialog`.
- **Route states:** `/account` with two-step sign-in on → `account/two-step-on.html`.

### S14 — Accept updated terms, and the marketing choice
- **L2:** 080.3, 080.4.
- **Behaviour:**
  - Tomi Oduya last accepted Terms 2026-03. Every private page, and every API call (409
    `terms-acceptance-required`), sends him to `/account/accept-terms`.
  - The page shows "We’ve updated our terms", the three changes, and "Terms of use, version 2026-10, from Thu 8 Oct
    2026."
  - "Accept and continue" changes to "Accepting…", records the acceptance and returns him to where he was going.
    Sign out is the only other way out.
  - Accepting a stale version gets 409, and the page reloads with the new one.
  - Ticking "New artists near my church" appends a `settings` consent record and keeps the earlier ones.
- **Tests first:**
  - `Privacy/{AcceptNewTermsTest, MarketingConsentTest}.php`
  - `e2e/specs/privacy/record-consent.spec.ts`
  - `e2e/pages/accept-terms.page.ts`
- **Build:**
  - The `EnsureCurrentTermsAccepted` middleware, on every `api.php` route except sign-out, `/me`, the accept
    endpoint and the legal documents.
  - `ConsentController`, with `AcceptCurrentTerms`.
  - `terms.guard` and `terms.interceptor`.
  - `pages/accept-terms/`.
- **Route states:** `/account/accept-terms`, signed in as `tomi` → `accept-terms/default.html`.

### S15 — Save an artist
- **L2:** 006, 012.1, 026.1, 026.2, 026.4, 026.5, 109.
- **Behaviour:**
  - Luz Viva's pressed heart reads "Remove Luz Viva from your saved artists". Elijah's reads "Save Elijah Park to
    your saved artists".
  - Saving Elijah takes the count from 3 to 4 and shows "Saved Elijah Park" with "Your saved count is now 4." and
    Undo. The toast lasts 5 s and pauses on hover.
  - Unsaving shows "Removed Elijah Park" with "He’s off your saved list. Your count is now 3." The pronoun comes
    from `Pronoun`.
  - A booker's first-ever save shows "Saved artists are private".
  - At 200 saved, the toast reads "You can save up to 200 artists." and nothing changes.
  - If a save fails, the heart reverts and "Couldn’t save {name}. Try again." stays until dismissed.
  - The artist profile shows a "Save"/"Saved" button.
  - Artists don't see the toggle. Saving a suspended artist gets 404.
- **Tests first:**
  - `Accounts/SaveArtistTest.php`, with a cross-user fixture
  - `e2e/specs/accounts/save-artist.spec.ts`
  - `e2e/pages/toasts.ts`, plus `lineup.ts` and `artist-profile.page.ts` gaining the toggle
- **Build:**
  - **Migration.** `saved_artists`, unique on `(user_id, artist_id)` and indexed on `(user_id, created_at desc)`.
  - **Backend.**
    - `SavedArtistController` (`role:booker`).
    - `SaveArtist`, which locks the user row and inserts with `ON CONFLICT DO NOTHING`.
    - `UnsaveArtist`.
    - `SavedArtistStateResource`.
  - **Frontend.** `SavedArtistsStore`, the `saved-artists` service, and the header Saved link.
- **Components:**
  - `zm-save-toggle` → `SaveToggle.ts`
  - save slots on `zm-ticket` and `zm-headliner`, and the `zm-badge` count → re-measure `Ticket`, `Headliner`,
    `Lineup` and `Badge`
- **Route states:** Discover, signed in as `naomi`, now matches the mock's hearts.

### S16 — Guest save through sign-in or sign-up
- **L2:** 026.3.
- **Behaviour:**
  - A guest presses Save on Hosanna Collective and goes to `/sign-in?returnUrl=…`.
  - After signing in, or registering and verifying, the guest returns to the same lineup with Hosanna saved and the
    toast showing.
  - A newer pending save replaces an older one. It is kept in `sessionStorage` only.
- **Tests first:** guest cases in `save-artist.spec.ts`.
- **Build:** `pending-intent.service.ts`, which `AuthService` replays after sign-in and after verification.

### S17 — Saved artists list
- **L2:** 027.1–4, 105.
- **Behaviour:**
  - `/saved` shows "Saved artists" and "3 saved · free or booked on Sat 14 Nov, your last search".
  - Each card shows when it was saved, "Free Sat 14 Nov" and "Request" (D24):
    - Abigail: "Saved Wed 7 Oct"
    - Hosanna: "Saved Sun 27 Sep"
    - Luz Viva: "Saved Sat 12 Sep"
  - Picking a date under "Who’s free on" and pressing "Check date" re-checks every card. Booked artists show
    "Booked {date}" and "See free dates".
  - A suspended artist is left out of the list and the count.
  - An empty list shows "No saved artists yet" and "Find who’s free".
  - While loading, skeleton tickets show. A failed load shows "We couldn’t load your saved artists".
- **Tests first:**
  - `Accounts/ViewSavedArtistsTest.php`
  - `e2e/specs/accounts/view-saved-artists.spec.ts`
  - `e2e/pages/saved.page.ts`
- **Build:**
  - `SavedArtistController@index` with `ListSavedArtistsRequest`.
  - `ListSavedArtists`: one `freeArtistIds` call, with distances from the church.
  - The card and list resources.
  - `LastSearch` persists the date (D14).
  - `pages/saved/`.
- **Components:** `SavedLineup`, a composite of 200 tickets, tuned to render in 100–300 ms.
- **Route states:**
  - signed in as `naomi` → `saved/default.html`
  - a fresh booker → `saved/empty.html`

### S18 — Theme saved to the account
- **L2:** 104.2.
- **Behaviour:**
  - Choosing dark sends `PATCH /api/v1/me/preferences` with `dark`.
  - A second signed-in browser that is light on the device switches to dark after `/me`, and keeps dark on the
    device.
  - If the account has no theme, the device's value is saved to the account.
  - `"blue"` gets 422.
  - A guest's choice stays on the device.
- **Tests first:** `UserExperience/ThemePreferenceTest.php` and new cases in `switch-theme.spec.ts`.
- **Build:**
  - `users.theme_preference` (`varchar(5)` with a check constraint) and the `ThemePreference` enum.
  - `MeController@updatePreferences`, with `UpdatePreferencesRequest` and `UpdateUserPreferences`.
  - `ThemeService` reconciles with `AuthService`.

## Vendor ports and fakes

| Port (`app/Contracts`) | Fake | Behaviour | Real adapter |
|---|---|---|---|
| `BotChallenge` | `FakeBotChallenge` | Passes every token except `fail`; an `unreachable` switch for D3 | M10 |
| `BreachedPasswordChecker` | `FakeBreachedPasswordChecker` | Rejects the configured list | M10 (HIBP range API) |
| `Geocoder` (exists) | `FakeGeocoder`, extended | Knows Riverside and an Ottawa address; returns null for unknown addresses | M10 |
| `IpLocator` | `FakeIpLocator` | Local IPs map to "Burlington, ON" or "Hamilton, ON" | M10 |
| `OnCallAlerter`, `ErrorReporter` | Fakes | Record each call after redaction | M10 |
| Mail transport | Laravel `smtp` → Mailpit | e2e reads the Mailpit API | M10 |

In the browser, the `BOT_CHALLENGE` fake resolves `pass`. A fake bound in production throws at boot (ADR-0002).

## Seed data additions (idempotent)

- **Naomi Fraser:**
  - Booker, `naomi.fraser@riversidecc.ca`, verified, two-step sign-in off, marketing email off, no theme preference.
    She has accepted Terms 2026-10.
  - She already exists as `naomi-fraser@cast.zamaro.test`, the reviewer of ZAM-0061. The seeder matches either
    address and moves her to the real one.
- **Riverside Community Church:** 2150 Lakeshore Road, Burlington ON L7R 1A3, 905-555-0123 (encrypted),
  Non-denominational, about 350 people.
- **Naomi's saved artists:** Abigail (saved Wed 7 Oct), Hosanna Collective (Sun 27 Sep) and Luz Viva (Sat 12 Sep).
- **Abigail Mensah:** artist, signs in with `abigail@abigailmensah.ca`, contact phone 905-555-0148 (encrypted).
- **Tomi Oduya:** booker for Harvest Point Church, Milton. He has accepted Terms 2026-03 only.
- **Legal documents:**
  - Terms 2026-03.
  - Terms 2026-10, from Thu 8 Oct 2026, with the three changes listed in the accept-terms mock.
  - Privacy policy 2026-10.
- **Roles:** every church person in the cast is a Booker, and every artist user is an Artist.
- **Test sign-in:** `ZAMARO_CAST_PASSWORD` (D28) for the named cast; `cast:booker` creates fresh bookers (D19).

## Known risks

- **Sanctum behind the SSR proxy.** Sanctum treats requests as stateful by their `Origin` or `Referer`. The dev
  server, the SSR server and `api-e2e` must look same-origin and be listed in `ZAMARO_WEB_ORIGINS`. Prove this in
  S1 before building on it.
- **`Secure` cookies.** Chromium accepts `Secure` cookies on `localhost`, but on `127.0.0.1` the session is dropped
  without an error. Pin the e2e base URL to `localhost`.
- **Personal data in SSR.** A private response in the transfer cache leaks between users. S2's filter and client
  rendering must land before any personal endpoint; the "Naomi Fraser" check in server HTML guards this.
- **Shared Redis and Mailpit.** Sessions, throttles and lockouts from `api` and `api-e2e` collide unless their
  keys are prefixed. Lockout specs need a unique email per worker, and Mailpit lookups must filter by recipient.
- **Frozen clock.** e2e can't age tokens or sessions, so backend tests prove expiry and lockout end with time
  travel. e2e uses unknown tokens and cleared cookies instead.
- **Perf flags.** S2 and S15 change `zm-top-bar`, `zm-ticket` and `zm-headliner`, which sit in the hottest
  composite, `Lineup`. Measure before pushing. Only a maintainer may accept an intended cost.
- **Scope creep.** The `/account` mock carries M7 and M9 sections. Hold D23 and keep the masks narrow.
- **Hashing cost.** Argon2id slows tests and seeding, so keep the `testing` environment cheap (D1).
- **Cross-user fixtures.** From S4 on, every authenticated route ships with its fixture in the same commit.
- **Audit seam.** If D22 is declined, 8 `RecordAuditEntry` call sites need a no-op seam until M3.

## Verification at the end of M2

1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Every Feature
   test is green, including the contract assertions and `CrossUserAccessTest`.
2. `php artisan scramble:export --fail-on-unknown` and `php artisan i18n:check` pass.
3. Running `php artisan db:seed` twice leaves row counts unchanged.
4. In `frontend`: `npm run lint`, `npm run format:check`, `npx ng build zamaro`, and
   `NG_BUILD_MANGLE=0 npx ng build perf-test`.
5. `npx playwright test` passes in Chromium: specs, `visual/` (now with signed-in states), `a11y/` in both
   themes, and `perf/`.
6. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows. This milestone's new
   scenarios are AuthCard, ErrorSummary, Avatar, TopBarSignedIn, Toast, ToastRegion, Checkbox, Banner,
   FormSection, SaveBar, SettingsNav, DeviceList, RecoveryCodes, SaveToggle and SavedLineup.
7. Manual walkthrough, with `npm start`, the compose `api` and Mailpit on :8025:
   1. Register a booker and open the link from Mailpit: the "Email verified" banner shows.
   2. Sign out. Sign in as Naomi from Abigail's profile and return to it.
   3. Save and unsave Elijah, and use Undo. Check `/saved` for Sat 14 Nov.
   4. Try an Ottawa church address and see it rejected. Save Riverside, and Discover pre-fills Burlington.
   5. Change the password, and watch a second browser's session end.
   6. Turn on two-step sign-in, sign in with a code, then turn it off.
   7. Sign in as Tomi and accept the new terms.
   8. Choose dark, then reload a second browser signed in as Naomi.
   9. Stop Mailpit, send an email, and find the failed job in Horizon after 6 attempts.
   10. Check each signed-in page at 320 px.
