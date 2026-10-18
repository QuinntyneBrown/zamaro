# Journeys 1 and 2 close-out: Find an artist, Choose an artist

**Status: Done (2026-10-18).** Branch `claude/journeys-1-2-close-out`.

Milestone 1 built both journeys (`m1-foundations-and-browse.md`), and the Laravel backend was then ported
to Next.js (ADR-0027). The estimates and the journey table still read 0%. This run audited every L2
criterion of both journeys against the tests, closed the gaps with new tests, aligned the designs with the
Node implementation, and set the estimates to the evidence.

## Result

- Journey 1 (L2-002 to L2-011, L2-097, L2-106): 59 criteria. Before: 44 covered, 15 partial, 0 uncovered.
  After: every criterion has a passing test except the three notes below.
- Journey 2 (L2-012 to L2-021, L2-044, L2-060, L2-083, L2-089, L2-098, L2-107, L2-112, L2-113):
  58 criteria. Before: 47 covered, 9 partial, 2 uncovered. After: every criterion has a passing test
  except L2-044 and the two notes below.
- No production code changed. Every new test passed the first time it ran, so the behaviour was already
  right and only its proof was missing.

## What was added

| Criterion | Test |
|---|---|
| L2-005.2 accepted booking keeps an artist | `backend/tests/feature/discovery/search-available-artists.test.ts` |
| L2-005.4 deleted artist left out (an application that is pending or rejected has no artist row; `ArtistStatus` is approved, suspended or deleted) | same file |
| L2-006.6 tie on rating and distance goes to the lower artist ID | `backend/tests/feature/discovery/headliner.test.ts` |
| L2-004.4 date over 18 months refused in the form | `e2e/specs/discovery/search-available-artists.spec.ts` |
| L2-006.1 "New" on an unreviewed artist's ticket | same file |
| L2-007.4 sort keeps location, radius and filters | `e2e/specs/discovery/sort-and-filter-results.spec.ts` |
| L2-009.4 a typed street address stays out of the URL | same file |
| L2-097.1 to .4, L2-098.2, L2-012.1 layout at xs, sm, md, lg, xl | `e2e/specs/discovery/responsive-layout.spec.ts` |
| L2-021.2 deleted artist reads as missing | `backend/tests/feature/artist-profiles/resolve-missing-artist.test.ts` |
| L2-083.3 no guest endpoint carries a booker email, church street address or postal code | `backend/tests/feature/artist-profiles/guest-privacy.test.ts` |
| Mock `discover/invalid.html` (field errors) | route state `discover-invalid` in `e2e/routes.manifest.ts`, with visual and a11y checks |
| Mock `artist/booked-date.html` | route state `artist-booked-date`, with visual and a11y checks |

The `L2-005.4` label in `verify-vulnerable-sector-check.mutation.spec.ts` named the wrong criterion (the
test proves L2-005.5) and was corrected.

## Decisions

1. **L2-044 is deferred to M5 and M6.** The payment form, the confirmation email and the booking page do
   not exist yet. The stub's short form is proven as L2-019.6.
2. **L2-060.3 is deferred to M7.** A hidden review leaves the rating through `recalculateArtistRating`
   (`backend/src/server/services/reviews/recalculate-artist-rating.ts`), which is tested. The trigger and
   the BullMQ job arrive with moderation.
3. **L2-089.2 rests on `s-maxage=60`** until a CDN exists. See ADR-0029.

## Left as it was

- L2-002.3: the fallback distance's "about" label in the UI and its 2 second timeout have no test of their
  own. The ×1.3 fallback and its warning are tested in `distance-calculation.test.ts`.
- L2-006.2: the headliner's primary photo is not asserted (the poster keeps its placeholder until M4).
- L2-006.7: one result shows the headliner and no tickets. This is proven on the API only. No seeded place
  has exactly one artist in range, and the e2e suite avoids mutating the seeded cast.
- The visual and a11y run of the new `discover-invalid` state failed once on dark at xs during the first
  combined run. It could not be reproduced in 13 further runs, and the cause was not found.

## Checks at the last commit

Run on 2026-10-18 against the Compose e2e stack on Node 24.

- `backend/`: `lint`, `format:check`, `typecheck` and `openapi:check` exit 0. The discovery,
  artist-profiles and reviews test folders pass (16 files, 104 tests). The whole backend suite was not run;
  no production code changed.
- `frontend/`: `lint` and `format:check` exit 0.
- Playwright (Chromium): `specs/discovery`, `specs/artist-profiles`, `specs/reviews` and
  `specs/accounts/save-artist.spec.ts` pass (103 tests). The a11y, visual and perf checks for the discover
  and artist states pass (90 tests), light and dark, with win32 baselines from the host and linux baselines
  from `npm run test:docker` for the two new states.
