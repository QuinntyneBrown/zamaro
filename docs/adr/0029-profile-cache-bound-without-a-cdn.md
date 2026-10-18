# ADR-0029: The 60-second profile freshness bound rests on `s-maxage` until a CDN exists

**Date:** 2026-10-18
**Category:** backend
**Status:** Accepted

## Context

L2-089.2 says that when an artist edits their profile, cached copies are invalidated within 60 seconds.
The design for `artist-profiles/index-and-share-profile` meets it with two parts: a short `s-maxage` on the
cached responses, and a `PurgeProfileCache` job that asks the CDN to drop a profile when it changes, behind
a `CdnPurger` port with one adapter for the CDN vendor.

No CDN is in the stack. Profile editing is not built (M4). The three profile routes already answer
through `cachedJson` (`backend/src/server/http/caching.ts`) with a strong SHA-256 ETag and
`Cache-Control: public, max-age=0, s-maxage=60`, and `backend/tests/feature/artist-profiles/index-and-share-profile.test.ts`
proves the ETag changes with an edit and that `If-None-Match` returns 304.

## Decision

1. The 60-second bound is met by `s-maxage=60` alone. A shared cache can hold a profile for at most 60
   seconds, and a browser always revalidates (`max-age=0`) against the ETag.
2. `PurgeProfileCache`, the `CdnPurger` port and the `ArtistProfileUpdated` event are not built. They are
   deferred until a CDN is chosen (M10) and profile editing exists (M4).
3. The routing vendor behind `RoutingProvider` stays the in-memory `FakeRoutingProvider` (ADR-0002) until
   a vendor is chosen. That choice is open and is not made here.

## Options considered

- **Build the purge now against a fake CDN.** It proves nothing a real CDN would, and it adds a port, a job
  and an event with no caller until M4.
- **Lower `s-maxage` to 0.** It would meet the bound with no CDN at all, but it gives up the edge caching
  that L2-089 exists to allow.

## Consequences

- L2-089.2 holds in the worst case at exactly the bound, with no margin for a failed purge to hide in.
- When a CDN arrives, the purge is an addition behind a port. No route changes.

## References

- L2-089, L2-092; `docs/detailed-designs/artist-profiles/index-and-share-profile/README.md`
- [ADR-0002](0002-compose-dev-environment-and-vendor-ports.md), [ADR-0027](0027-nextjs-backend.md)
