# ADR-0012: Feature flags live in the API's configuration and reach the frontend through one endpoint

**Date:** 2026-10-10
**Category:** general
**Status:** Accepted
**Deciders:** Project owner (the `bookingRequests` flag, 2026-10-09), Claude

## Context

Milestone 1 builds the booking stub on every profile (L2-019), but sending a request belongs to
`bookings/send-booking-request` in M5, and taking deposits to M6. The project owner decided that the
stub ships in M1 with its submit hidden behind a `bookingRequests` flag that is off, and that there is
no placeholder `/artists/:slug/book` route. Later plans already lean on the same mechanism: M5 turns
`bookingRequests` on in dev and e2e but keeps it off in production until M6 can take deposits, M6 adds a
`payments` flag, and M4 follows the precedent for editor features that reach into M5 and M6 data.

So the switch has to differ per environment (dev, e2e, production), be readable by the server-rendered
Angular app and the browser alike, and later be readable by the API itself when M5's endpoints need
guarding. No vendor is chosen for anything else yet, and production refuses to boot with fake
adapters (ADR-0002).

## Decision

- Flags are plain configuration in the API: `config/zamaro.php` `features`, one boolean per flag, each
  read from an environment variable and **off by default** (`booking_requests` from
  `ZAMARO_FEATURE_BOOKING_REQUESTS`).
- `GET /api/v1/features` (anonymous, `FeatureFlagsController`) returns `{ data: { bookingRequests } }`
  with `public, max-age=0, s-maxage=60`. Adding a flag adds a key to the config and to this response.
- The `api` library exposes the contract (`FeaturesApi`, `FEATURES_API`, `HttpFeaturesApi`, and
  `InMemoryFeaturesApi` for scenarios) and a root `FeatureFlags` service that fetches the flags once on
  first use and exposes `isOn(flag)`. Every flag reads as off until the response arrives and stays off
  if the request fails.
- Fetched while rendering on the server, the flags reach the browser through the HTTP transfer cache,
  so hydration never flips a flag.
- Pages ask `FeatureFlags.isOn('bookingRequests')` and render the feature or nothing. A flagged feature
  has no placeholder route or "coming soon" copy.

## Options Considered

### Option 1: API configuration and a features endpoint (chosen)
- **Pros:** One switch per environment, set where the other environment settings live; the API can
  check the same config to guard its own endpoints in M5; works for SSR and the browser without a
  rebuild; testable through the API and in e2e by intercepting one request.
- **Cons:** One small extra request on pages that use a flag (replayed from the transfer cache on the
  first page); a flag cannot differ per user.

### Option 2: Angular build-time environment files
- **Pros:** No request; tree-shakes the off branch.
- **Cons:** A different build per environment, against the single `zamaro-web` image; the API would
  need its own copy of each switch, which can drift.

### Option 3: A hosted flag service (LaunchDarkly, Unleash, ConfigCat)
- **Pros:** Per-user targeting, gradual rollouts, an admin UI.
- **Cons:** A new vendor and port before any need for targeting; more than three on/off switches
  deserve.

### Option 4: Leave the unfinished UI out and add it in M5
- **Pros:** Nothing to switch.
- **Cons:** The project owner wanted the stub and date picking shipped now; the submit's disabled
  state for a booked date is part of L2-019 and would go untested until M5.

## Consequences

### Positive
- M5 and M6 turn their features on per environment by setting one variable; no code changes to
  flip them.
- Safe by default: a missing variable, an unreachable API or a new environment leaves every flag off.

### Negative
- Flags are global per environment; per-user or percentage rollouts need a different mechanism.
- Each flag is code to delete once its feature is permanently on.

### Risks
- Turning `bookingRequests` on in production before M6 would accept requests that can never be paid
  (M5 plan, D1). Production configuration must keep it off until then.

## Implementation Notes

- Backend: `backend/config/zamaro.php` (`features`), `App\Http\Controllers\Api\V1\Operations\FeatureFlagsController`,
  route `features` in `routes/api_public.php`, test `tests/Feature/Operations/FeatureFlagsTest.php`.
- Frontend: `frontend/projects/api/src/lib/services/features.ts`; the `zamaro` app binds
  `FEATURES_API` to `HttpFeaturesApi` in `app.config.ts`.
- e2e: `ArtistProfilePage.turnOnBookingRequests()` fulfils `/api/v1/features` for requests the browser
  makes, so a spec reaches the profile by client-side navigation to see a flag on.
- To add a flag: a config key and environment variable (default off), a key in the controller's
  response and in `FeatureFlagValues` (with `false` in the defaults), and a test that it is off.
- When a feature is permanently on everywhere, remove its flag from all of these in one change.

## References

- `docs/plans/m1-foundations-and-browse.md` (S14, the user decision of 2026-10-09)
- `docs/plans/m5-booking-requests.md` (D1), `docs/plans/m6-payments-and-cancellations.md` (D2)
- `docs/detailed-designs/artist-profiles/pick-a-date-and-start-booking/README.md`
- ADR-0002 (fakes and environments), ADR-0007 (frontend layout)
