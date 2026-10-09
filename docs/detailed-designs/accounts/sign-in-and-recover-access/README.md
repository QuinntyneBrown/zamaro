# Sign in and recover access

## Overview

Bookers, artists and administrators reach their private areas of Zamaro through one
sign-in. This feature covers starting and ending a session, recovering access with a
password reset, and the account protections that sit around those steps: the
password policy, password hashing, lockout after repeated failures, and optional
time-based one-time password (TOTP) multi-factor authentication.

The slice runs from the sign-in, reset and two-step sign-in pages in Zamaro Web to the
session, password and two-factor endpoints in the Zamaro API, with session state in
Redis and accounts in the Zamaro database. Registration is a sibling slice
(`accounts/register-booker`) that applies the same `PasswordPolicy`. Changing a
password while signed in, changing email and the "Signed-in devices" list live in
`accounts/manage-account-settings`, which reuses the `SessionRegistry` defined here.
Acceptance of updated terms at sign-in belongs to `privacy/record-consent`.

Terms used in this design:

- **session** — server-side record in Redis, identified by an `HttpOnly` cookie, that keeps a user signed in
- **session registry** — per-user index of active sessions, used to end every session but one
- **lockout** — 15-minute block on sign-in for one account after 5 failed attempts within 15 minutes
- **password reset link** — single-use emailed link that lets the owner set a new password, valid for 60 minutes
- **breached password** — password that appears in the breached-password service's corpus
- **k-anonymity range query** — lookup that sends only the first 5 hex characters of the password's SHA-1 hash and compares the returned suffixes locally
- **TOTP** — time-based one-time password from an authenticator app, as defined in RFC 6238
- **recovery code** — single-use code, issued in a set of 10, that substitutes for a TOTP code when the authenticator is lost
- **return URL** — path of the page the user was on before signing in

Sign-in never says which of email or password was wrong (L2-023). Password reset
never says whether an email has an account. A successful reset ends every other
session, so a stolen session cannot outlive a recovered account.

## Description

**Frontend (Zamaro Web, `features/account`)**

- **`SignInPage`** — routed page for `/sign-in`. It holds email and password fields,
  reads the `returnUrl` query parameter set by `authGuard`, and on success navigates
  back to it (L2-023). It shows "Email or password is incorrect." for any credential
  failure. When sign-in is blocked it shows "Sign-in is paused for 15 minutes" with
  the time it ends and a link to reset the password, in the same words whether or not
  the email has an account. When `SessionExpiredInterceptor`
  (`security/manage-sessions-and-csrf`) sends the user here it shows "Your session
  ended" above the form.
- **`MfaChallengePage`** — routed page for `/account/sign-in/verify`, shared with
  administrators (`administration/secure-admin-access`). It accepts a 6-digit TOTP
  code or, after "Use a recovery code instead", a recovery code.
- **`ForgotPasswordPage`** — routed page for `/forgot-password` with an email field
  and the bot challenge widget (L2-077). It always shows "If that email has an
  account, we've sent a reset link."
- **`ResetPasswordPage`** — routed page for `/reset-password/:token` that checks the
  token through the check endpoint (showing a skeleton form meanwhile), then asks for
  the new password twice; a used or expired token shows "This link has expired" with
  Send a new link. On success the person is signed in on
  this device only, and every other session has ended (L2-023).
- **Two-step sign-in section** — section `#two-step` of `AccountSettingsPage`
  (`accounts/manage-account-settings`). It shows whether two-step sign-in is on. When
  off, its Turn on button navigates to `MfaEnrolmentPage`; when on, it offers Turn off
  and New recovery codes, and each opens `TwoStepCodeDialogComponent` (L2-072).
- **`TwoStepCodeDialogComponent`** — CDK dialog that asks for a current TOTP code or
  an unused recovery code before turning two-step sign-in off or issuing new
  recovery codes. Turning off is a destructive dialog with "Keep it on" first; new
  codes are shown once in the dialog with copy and download actions, and replace
  every earlier code (L2-072). A wrong code is shown inline and counts toward the
  lockout like a wrong code at sign-in.
- **`MfaEnrolmentPage`** — routed page for `/account/security/mfa`, also used to
  enrol administrators. It starts enrolment, shows the QR code and secret, confirms
  with a code, and shows the 10 recovery codes once with copy and download actions
  (L2-072).
- **`AuthService`** — shared service holding `currentUser` as a signal. It exposes
  `signIn`, `signOut` and `refresh`. After sign-out the header shows Sign in.
- **`authGuard`** — route guard for private routes that redirects a guest to
  `/sign-in?returnUrl=…`.
- **`AuthApi`** — typed client for the session, password and two-factor endpoints.
  It calls `GET /sanctum/csrf-cookie` before the first state-changing request.

**Mock screens** — sign-in is
[`pages/sign-in`](../../../mocks/pages/sign-in/default.html) in states default,
[`invalid`](../../../mocks/pages/sign-in/invalid.html), submitting, error,
[`expired`](../../../mocks/pages/sign-in/expired.html) (session ended) and
[`locked`](../../../mocks/pages/sign-in/locked.html). The code step is
[`pages/mfa-challenge`](../../../mocks/pages/mfa-challenge/default.html) in states
default, [`recovery`](../../../mocks/pages/mfa-challenge/recovery.html), invalid,
submitting, error and [`locked`](../../../mocks/pages/mfa-challenge/locked.html), the
same pause as the password step. Recovery is
[`pages/forgot-password`](../../../mocks/pages/forgot-password/default.html) and
[`pages/reset-password`](../../../mocks/pages/reset-password/default.html), including
its [`loading`](../../../mocks/pages/reset-password/loading.html) (token check),
[`expired`](../../../mocks/pages/reset-password/expired.html) and
[`success`](../../../mocks/pages/reset-password/success.html) states. Enrolment is
[`pages/mfa-setup`](../../../mocks/pages/mfa-setup/default.html) in states default,
loading, [`invalid`](../../../mocks/pages/mfa-setup/invalid.html), submitting, error
and [`codes`](../../../mocks/pages/mfa-setup/codes.html), opened from the
[two-step section of account settings](../../../mocks/pages/account/default.html), for
artists [the same section](../../../mocks/pages/account/artist.html). Once it is on, the
section is [`pages/account/two-step-on`](../../../mocks/pages/account/two-step-on.html),
and Turn off and New recovery codes open
[`dialogs/two-step-code`](../../../mocks/dialogs/two-step-code/default.html) in states
default (turn off), [`invalid`](../../../mocks/dialogs/two-step-code/invalid.html), busy,
[`failed`](../../../mocks/dialogs/two-step-code/failed.html),
[`new-codes`](../../../mocks/dialogs/two-step-code/new-codes.html) and
[`codes`](../../../mocks/dialogs/two-step-code/codes.html).

**Backend (Zamaro API)**

- **`SessionController`** — `POST /api/v1/session` (sign in),
  `POST /api/v1/session/two-factor` (complete a challenge) and
  `DELETE /api/v1/session` (sign out).
- **`SignInRequest`** — FormRequest that validates email and password presence.
- **`AttemptSignIn`** — action that asks `SignInThrottle` whether the account is
  locked, checks the password with `Hash::check` (against a dummy hash when no user
  matches, so timing does not reveal existence), and on success either starts the
  session or, when `mfaEnabled` is true or the user is an administrator (for whom
  MFA is mandatory), stores a pending-challenge marker and returns
  `two_factor_required`. Each outcome writes an audit entry through
  `RecordAuditEntry` (L2-069).
- **`SignInThrottle`** — Redis counter keyed on the normalised email address, so an
  address without an account is paused the same way and the response reveals
  nothing. The fifth failure within 15 minutes sets a 15-minute block. The next
  attempt is refused and, when the address has an account, queues
  `AccountLockedNotification` to the owner, once per block (L2-072).
- **`CompleteTwoFactorChallenge`** — action that verifies a TOTP code with
  `TotpVerifier` or consumes one hashed recovery code, then starts the session. A
  wrong code is recorded as a failed sign-in in `SignInThrottle`, so wrong codes and
  wrong passwords share the 5-in-15-minutes lockout, and a blocked account's
  challenge is refused like its password step (L2-072).
- **`StartSession`** — regenerates the session ID (L2-073), registers it in
  `SessionRegistry`, and returns `CurrentUserResource`.
- **`SignOut`** — action that invalidates the session in Redis, removes it from
  `SessionRegistry` and rotates the CSRF token (L2-023).
- **`PasswordResetController`** — `POST /api/v1/password/forgot`, behind the bot
  challenge (`security/limit-request-rates`); `POST /api/v1/password/reset/check`,
  which tells `ResetPasswordPage` whether a token is still usable without consuming
  it; and `POST /api/v1/password/reset`. All three are rate-limited.
- **`SendPasswordResetLink`** — action that, when the email matches a user, stores a
  SHA-256 hash of a random token with a 60-minute expiry in `password_reset_tokens`
  and queues `ResetPasswordNotification`. The response is identical either way.
- **`ResetPassword`** — action that consumes the token once, applies
  `PasswordPolicy`, stores the new hash, ends every session through
  `SessionRegistry::endAll`, writes an audit entry and queues
  `PasswordChangedNotification` to the account email. It then starts a fresh session
  for this browser through `StartSession`, or the two-factor challenge when MFA is
  enabled.
- **`PasswordPolicy`** — validation rule shared with registration and account
  settings. It enforces 12–128 characters and asks `BreachedPasswordChecker` whether
  the password is breached, returning the reason for any rejection (L2-072).
- **`BreachedPasswordChecker`** — interface with one adapter for the
  breached-password service using a k-anonymity range query.
- **`SessionRegistry`** — service backed by the `user_sessions` table. It records
  each session's device, approximate city and last-active time, and ends one, all, or
  all but the current session.
- **`TwoFactorController`** — `POST /api/v1/account/two-factor` (begin),
  `POST /api/v1/account/two-factor/confirm`, `DELETE /api/v1/account/two-factor`
  (turn off) and `POST /api/v1/account/two-factor/recovery-codes` (new codes).
- **`EnableTwoFactor`** — action that generates a TOTP secret, stores it encrypted,
  and returns an `otpauth://` URI. **`ConfirmTwoFactor`** verifies the first code,
  sets `mfaEnabled`, generates 10 recovery codes, stores their hashes and returns the
  plain codes once. **`DisableTwoFactor`** and **`RegenerateRecoveryCodes`** first
  verify a current TOTP code or consume an unused recovery code; the first clears the
  secret and every recovery code and is refused for administrators, and the second
  replaces all 10 codes and returns the new ones once (L2-072). Each writes an audit
  entry for the MFA change.

Passwords are hashed with Argon2id through Laravel's hasher (L2-072). Password
fields are excluded from request logging by the log redaction rules (L2-079). Lockout
emails and reset emails are queued notifications processed by the Zamaro Worker.

**Data**

- `users` — `password`, `mfa_enabled`, `two_factor_secret` (encrypted),
  `two_factor_confirmed_at`.
- `recovery_codes` — `user_id`, `code_hash`, `used_at`.
- `password_reset_tokens` — `user_id`, `token_hash`, `expires_at`, `used_at`.
- `user_sessions` — `id` (hash of the session ID), `user_id`, `device_label`,
  `approximate_city`, `ip_address`, `last_active_at`.
- Redis — session payloads and `SignInThrottle` counters.

TOTP codes from one 30-second step either side are accepted for clock drift, and MFA
is mandatory for administrators (`administration/secure-admin-access`). The TOTP
library is `<TO SUPPLY>`. The breached-password service vendor is `<TO SUPPLY>`.

## Requirements

The feature realises the following level-2 (L2) requirements, quoted from
`docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-023` | `L1-004` | **Sign-in, sign-out and password reset.**<br>Acceptance criteria:<br>1. Given valid credentials, when a user signs in, then a session starts and they return to the page they were on.<br>2. Given invalid credentials, when a user signs in, then the message is "Email or password is incorrect." regardless of which was wrong.<br>3. Given a password reset request, when it is submitted, then the response is always "If that email has an account, we've sent a reset link." and the link is single-use and expires after 60 minutes.<br>4. Given a successful password reset, when it completes, then every other session for that account is ended.<br>5. Given a signed-in user, when they sign out, then the session is invalidated server-side and the header shows Sign in. |
| `L2-072` | `L1-016` | **Passwords and multi-factor authentication.**<br>Acceptance criteria:<br>1. Given a new password, when it is set, then it must be 12–128 characters and not appear in a known-breached password list (checked by k-anonymity range query), or it is rejected with the reason.<br>2. Given a password, when it is stored, then it is hashed with Argon2id or bcrypt (cost 12 or higher) and never logged or stored in plain text.<br>3. Given any booker or artist, when they open security settings, then they can enable TOTP multi-factor authentication and receive 10 single-use recovery codes.<br>4. Given 5 failed sign-ins for one account within 15 minutes, when a sixth is attempted, then sign-in for that account is blocked for 15 minutes and the owner is emailed.<br>5. Given a booker or artist with two-step sign-in on, when they turn it off or ask for new recovery codes in security settings, then a current authenticator code or an unused recovery code is required first, and new codes replace every earlier code; administrators cannot turn it off (L2-066). |

## Diagrams

### System context

Bookers, artists and administrators sign in to Zamaro. Zamaro checks new passwords
with the breached-password service, verifies the bot challenge on reset, and emails
reset links and lockout notices.

![C4 system context for signing in and recovering access](diagrams/c4-context.png)

### Containers

Zamaro Web calls the session, password and two-factor endpoints in the Zamaro API.
The API keeps sessions and lockout counters in Redis and accounts in the database,
and the Zamaro Worker sends the emails.

![C4 container view for signing in and recovering access](diagrams/c4-container.png)

### Components

`SessionController` delegates to `AttemptSignIn`, `CompleteTwoFactorChallenge` and
`SignOut`. `PasswordResetController` delegates to `SendPasswordResetLink` and
`ResetPassword`, which share `PasswordPolicy` and `SessionRegistry`.

![C4 component view for signing in and recovering access](diagrams/c4-component.png)

### Class structure

A `User` owns its `RecoveryCode` rows, `PasswordResetToken` rows and `UserSession`
entries. `SignInResult` tells the frontend whether a session started, a two-factor
challenge is due or the account is locked.

![Class diagram for signing in and recovering access](diagrams/class-structure.png)

### Behaviour — sign in

A locked account is refused before the password is checked. Wrong credentials count
toward the lockout and return one generic message. Correct credentials either start
the session or, with MFA enabled, lead to the two-factor challenge.

![Sequence diagram for signing in](diagrams/sequence-sign-in.png)

### Behaviour — reset a forgotten password

The forgot-password response is identical for every address. A valid, unused link
younger than 60 minutes sets the new password, ends every session for the account
and signs the person in on this device only.

![Sequence diagram for resetting a forgotten password](diagrams/sequence-reset-password.png)

### Behaviour — enable multi-factor authentication

Enrolment returns a secret for the authenticator app. The first valid code turns MFA
on and returns 10 single-use recovery codes, shown once.

![Sequence diagram for enabling multi-factor authentication](diagrams/sequence-enable-mfa.png)
