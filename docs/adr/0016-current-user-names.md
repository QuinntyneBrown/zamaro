# ADR-0016: One name each for the current user: `AuthService`, `CurrentUserResource`, `MeController`

**Date:** 2026-10-10
**Category:** general
**Status:** Accepted
**Deciders:** Claude (M2 S1, sign in)

## Context

Signing in (M2 S1) introduces the signed-in person to both applications, and five detailed designs
describe them with different names:

- `accounts/sign-in-and-recover-access`, `privacy/record-consent` and
  `accounts/manage-church-profile` name the response `CurrentUserResource`.
- `user-experience/switch-theme` and `user-experience/adapt-layout-to-screens` name it `MeResource`,
  served by `MeController`, and keep the person in the frontend in a `CurrentUserStore`, fed by
  `AuthService`.
- `security/manage-sessions-and-csrf` and the sign-in design keep the person in `AuthService` as a
  signal.
- `notifications/send-transactional-emails` extends "the existing `GET /api/v1/me` resource" through
  `MeController`.

Two names for one response, and two frontend holders for one signal, would leave every later slice
(the header, the footer, the theme, the terms gate, the church profile) choosing between them.

## Decision

1. **Backend.** `GET /api/v1/me` is `App\Http\Controllers\Api\V1\Accounts\MeController@show`, and
   `PATCH /api/v1/me/preferences` will be `MeController@updatePreferences` (S18). Both, and the
   sign-in answer from `POST /api/v1/session` (`SessionController@store`), return
   `App\Http\Resources\Accounts\CurrentUserResource`. `MeResource` does not exist.
2. **Frontend.** `AuthService` in the `api` library (`lib/auth/auth.service.ts`) holds the person as
   the `currentUser` signal and is the only holder. `CurrentUserStore` does not exist; the header,
   footer, theme and guards read `AuthService.currentUser()`.
3. **The model** is `CurrentUser` in `api/lib/models/accounts.ts`, mirroring `CurrentUserResource`:
   `id`, `name`, `email`, `initials`, `roles`, `emailVerified`, `themePreference` and
   `termsAcceptanceRequired`. Later slices add fields (the church, the saved count) to both.
4. **Designs.** `user-experience/switch-theme` and `user-experience/adapt-layout-to-screens` are
   updated in the same change to use these names.

## Options Considered

### Option 1: `CurrentUserResource`, `MeController`, `AuthService` (chosen)
- **Pros:** the names the sign-in, sessions and consent designs already use; the controller is named
  for its route (`/me`) and the resource for what it holds; one frontend holder means one signal to
  reconcile with the theme and the terms gate.
- **Cons:** two designs change their wording.

### Option 2: `MeResource` and a separate `CurrentUserStore`
- **Pros:** matches the layout and theme designs.
- **Cons:** a store that only mirrors a service's signal adds a layer with no behaviour; three other
  designs would change instead.

## Consequences

### Positive
- Every slice that needs the signed-in person reads one signal and extends one resource.

### Negative
- None beyond the two design edits.

### Risks
- A later design that says `MeResource` or `CurrentUserStore` must be read as these names. The
  rendered diagrams of `switch-theme`, `adapt-layout-to-screens` and `view-artist-dashboard` still
  draw the old names; their text is updated, and the diagrams change when those designs are next
  re-rendered.

## Implementation Notes

- `CurrentUserResource` returns `themePreference: null` until the account can store a theme (S18)
  and `termsAcceptanceRequired: false` until terms versions exist (S14).
- `AuthService` loads `/api/v1/me` in the browser only (S2); server rendering forwards no cookies
  (ADR-0015).

## References

- `docs/plans/m2-accounts-and-sessions.md`, "Design conflicts and their resolutions" and S1
- `docs/detailed-designs/accounts/sign-in-and-recover-access/README.md`
- `docs/detailed-designs/user-experience/switch-theme/README.md`
- `docs/detailed-designs/user-experience/adapt-layout-to-screens/README.md`
- ADR-0007 (frontend layout), ADR-0015 (same-origin cookie sessions)
