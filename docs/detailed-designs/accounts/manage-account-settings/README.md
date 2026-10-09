# Manage account settings

## Overview

Bookers and artists keep their own sign-in details current from one settings page.
This feature covers the three changes L2-025 names: changing the account email,
changing the password while signed in, and reviewing and ending the sessions listed
under "Signed-in devices".

The slice runs from the account settings page in Zamaro Web to the account endpoints
in the Zamaro API. It builds on `accounts/sign-in-and-recover-access`, which defines
`PasswordPolicy` and `SessionRegistry`. The same page also hosts entry points owned
by other slices: two-factor setup (`accounts/sign-in-and-recover-access`), "Download
my data" (`privacy/export-personal-data`) and "Delete my account"
(`privacy/delete-account`).

Terms used in this design:

- **account email** — verified address used for sign-in and all notifications
- **pending email** — new address that has been requested but not yet verified; the account email stays unchanged until it is
- **email change link** — single-use emailed link sent to the pending email that completes the change
- **re-authentication** — confirmation of the current password before a sensitive change
- **signed-in device** — one active session, described by device, approximate city and last-active time
- **current session** — the session making the request; it survives a password change while every other session ends

The email address only changes once the new address is proven (L2-025). A password
change ends every other session, so a device left signed in elsewhere is signed out.

## Description

**Frontend (Zamaro Web, `features/account`)**

- **`AccountSettingsPage`** — routed page for `/account/settings` with sections for
  email, password, signed-in devices and privacy links. It uses the design-system
  description list, form fields and dialog.
- **`ChangeEmailFormComponent`** — new email and current password. On success it
  shows that a link was sent to the new address and that the account email stays the
  same until the link is opened.
- **`ChangePasswordFormComponent`** — current password, new password and
  confirmation. It shows `PasswordPolicy` reasons inline (L2-072) and, on success, a
  toast stating that other devices were signed out.
- **`SignedInDevicesComponent`** — list of sessions with device label, approximate
  city and last-active time formatted through `FormatService` (L2-110). The current
  session is marked "This device". Every other row has an End session button that
  asks for confirmation in a dialog.
- **`ConfirmEmailChangePage`** — routed page for `/account/email/confirm` that posts
  the token from the email change link and shows the result.
- **`AccountApi`** — typed client for the account endpoints below.

**Backend (Zamaro API)**

- **`AccountEmailController`** — `PUT /api/v1/account/email` to request a change and
  `POST /api/v1/account/email/confirm` to complete it.
- **`ChangeEmailRequest`** — FormRequest that validates the new email format and
  checks `current_password` against the stored hash.
- **`RequestEmailChange`** — action that stores `pending_email` and a hashed
  `EmailChangeToken`, queues `ConfirmNewEmailNotification` to the new address, and
  queues `EmailChangeRequestedNotification` to the current address (L2-025). If the
  new address already belongs to another account, the response is unchanged and no
  link is sent, so the form does not reveal registered addresses.
- **`ConfirmEmailChange`** — action that consumes the token once, re-checks that the
  pending address is still free, moves `pending_email` into `email`, sets
  `email_verified_at`, and writes an audit entry.
- **`AccountPasswordController`** — `PUT /api/v1/account/password`.
- **`ChangePasswordRequest`** — FormRequest that checks `current_password` and applies
  `PasswordPolicy` to the new password (L2-072).
- **`ChangePassword`** — action that stores the new Argon2id hash, calls
  `SessionRegistry::endAllExcept` with the current session, regenerates the current
  session ID, and records the password change through `RecordAuditEntry` (L2-069).
- **`AccountSessionController`** — `GET /api/v1/account/sessions` and
  `DELETE /api/v1/account/sessions/{id}`. A session ID belonging to another user
  returns 404 (L2-074).
- **`EndSession`** — action that destroys the session payload in Redis and deletes
  its `user_sessions` row.
- **`SessionResource`** — serialises `id`, `deviceLabel`, `approximateCity`,
  `lastActiveAt` and `isCurrent`. It never exposes the session ID itself or the full
  IP address.
- **`TrackSessionActivity`** — middleware that updates `user_sessions.last_active_at`
  at most once per `<TO SUPPLY>` minutes, so activity tracking does not write on
  every request.

**Data**

- `users` — `email`, `pending_email`, `password`.
- `email_change_tokens` — `user_id`, `token_hash`, `new_email`, `expires_at`,
  `used_at`.
- `user_sessions` — defined in `accounts/sign-in-and-recover-access`.

The device label is derived from the user-agent string. The approximate city comes
from an IP geolocation lookup whose source is `<TO SUPPLY>`. The lifetime of an email
change link is `<TO SUPPLY>`.

## Requirements

The feature realises the following level-2 (L2) requirement, quoted from
`docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-025` | `L1-004` | **Account settings.**<br>Acceptance criteria:<br>1. Given a signed-in user changes their email, when they confirm with their current password, then a verification link goes to the new address and the email changes only after it is verified; the old address receives a notice.<br>2. Given a signed-in user changes their password, when they provide the correct current password, then the password is updated and all other sessions end.<br>3. Given a signed-in user, when they open "Signed-in devices", then they see each active session's device, approximate city and last-active time and can end any of them. |

## Diagrams

### System context

A booker or artist changes sign-in details in Zamaro. Zamaro checks new passwords
against the breached-password service and sends the email change link and notice
through the email delivery service.

![C4 system context for managing account settings](diagrams/c4-context.png)

### Containers

The settings page in Zamaro Web calls the account endpoints in the Zamaro API. The
API updates the database, ends sessions in Redis, and queues emails for the Zamaro
Worker.

![C4 container view for managing account settings](diagrams/c4-container.png)

### Components

Three controllers front four actions. `ChangePassword` and `EndSession` both work
through `SessionRegistry`.

![C4 component view for managing account settings](diagrams/c4-component.png)

### Class structure

A `User` owns `EmailChangeToken` rows and `UserSession` rows. `SessionResource`
presents each `UserSession` without exposing the session identifier.

![Class diagram for managing account settings](diagrams/class-structure.png)

### Behaviour — change the email address

The change is confirmed with the current password, and the account email changes
only when the link sent to the new address is opened. The old address receives a
notice.

![Sequence diagram for changing the email address](diagrams/sequence-change-email.png)

### Behaviour — change the password and end sessions

A password change with the correct current password ends every other session. A
single session can also be ended from the signed-in devices list.

![Sequence diagram for changing the password and ending sessions](diagrams/sequence-change-password-and-sessions.png)
