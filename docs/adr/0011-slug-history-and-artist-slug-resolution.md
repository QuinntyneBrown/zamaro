# ADR-0011: Slug history and one slug resolver for every artist address

**Date:** 2026-10-10
**Category:** backend
**Status:** Accepted; amended by [ADR-0027](0027-nextjs-backend.md), which replaces the Laravel mechanisms named here
**Deciders:** Project owner (open plan items accepted with their recommended defaults, 2026-10-10), Claude

## Context

L2-021 asks that a missing, suspended or deleted artist's address answer 404 with similar artists,
and that a renamed address answer 301 to the current one. L2-055.3 adds that a retired slug is never
given to another artist. Two designs describe the same lookup in different words:

- `artist-profiles/resolve-missing-artist` names an action `ResolveArtistSlug` returning Found, Moved
  or Missing, over `slug_histories (old_slug, artist_id, replaced_at)`, holding retired slugs only.
- `artist-workspace/change-profile-address` names a domain service `ArtistSlugResolver` over
  `slug_histories (artist_id, slug unique, retired_at)`, holding every slug an artist has held, the
  current one with no `retired_at`, so one unique index enforces the never-reassigned rule and M3's
  `SlugRegistry` can check one column.

The M1 plan asks S15 to settle the name and to use the change-profile-address columns. Two further
questions were left `<TO SUPPLY>` in resolve-missing-artist: what to suggest for a slug that never
existed, and where to measure from when no search is carried. And the server-rendered page has to
send real statuses (L2-112): 404 for the missing artist and for any unknown address, 301 for a move.

## Decision

- **One resolver, `App\Actions\ArtistProfiles\ResolveArtistSlug`.** `ArtistSlugResolver` is retired
  as a name. Every route under `/api/v1/artists/{slug}` (profile, reviews, availability, tour dates)
  calls `handle($slug)`, which returns the viewable artist or throws:
  - `ArtistMoved($currentSlug)` when the slug is a retired one in `slug_histories` and its artist is
    viewable. `ProblemDetailsRenderer` answers a bodiless **301** with a relative `Location`: the same
    route under the current slug, query string kept. A retired slug points at its artist, not the next
    slug, so a chain of renames is one hop.
  - `ArtistNotFound($primaryStyle)` (a `NotFoundHttpException`) for a slug that never existed, a
    hidden artist (not Approved, no payout or unpublished), or a hidden artist's retired slug. It is
    rendered as the `artist-not-found` problem, "This artist isn’t on Zamaro". The only thing it keeps
    of a hidden artist is the primary style, which never reaches the body.
  Exceptions rather than a returned union keep the four controllers to one call each and the HTTP
  mapping in one place, where the other problems are rendered.
- **`slug_histories (id, artist_id, slug unique, retired_at, timestamps)`**, the change-profile-address
  columns. It holds every current and retired slug; the migration backfills the current ones and the
  seed upserts them. Rows are never deleted.
- **Similar artists, on the profile only.** The profile controller catches `ArtistNotFound` and adds
  `similarArtists: { date, radiusKm, items }` from `SimilarArtistFinder::forMissingArtist()`
  (`Services/Discovery`, for M5's decline and cancellation to reuse): up to 3 viewable artists free on
  the date who pass the travel rule, nearest first, items shaped as lineup tickets. The other routes
  return the same problem without the member.
  - **Primary style:** the first of the artist's styles in the chips' order (Abigail: solo vocalist).
  - **A slug that never existed** has no style, so any style matches.
  - **The carried search** is the profile request's optional `date`, `kind`, `lat`, `lng` and
    `radius` (the frontend sends the last lineup's when its date matches the profile's). Without a
    location the suggestions are measured from **Toronto City Hall**; without a radius, **120 km**;
    without a date in the booking window, the **first bookable day**. The hidden artist's own base is
    never used, so a hidden artist and an unknown slug differ only in the style filter.
- **Real statuses from the server render.** A root `HttpStatus` service sets `RESPONSE_INIT.status`
  during SSR and does nothing in the browser. The profile page sets 404 for `ArtistNotFound`; a `**`
  route renders the generic not-found page and sets 404. For a move, the API's 301 is followed by the
  HTTP client; when the profile comes back under another slug the page sets 301 and navigates with
  `replaceUrl` and the query kept, and Angular's SSR engine turns that navigation into a 301 with
  `Location: /artists/{current}?…`. In the browser the same navigation replaces the address.
- **The missing artist survives hydration.** The HTTP transfer cache keeps successes only, so
  `HttpArtistProfilesApi` puts the 404's suggestions in the transfer state on the server and the
  browser reads them instead of asking again.

## Options Considered

### Option 1: One action that throws Moved and NotFound, change-profile-address columns (chosen)
- **Pros:** One name across both designs; every artist route behaves alike in one line; one unique
  index enforces L2-055.3; the 301 and the problems render in one place.
- **Cons:** Control flow by exception for a redirect; `slug_histories` duplicates `artists.slug` for
  the current slug.

### Option 2: `ResolveArtistSlug` returning a Found/Moved/Missing union, as resolve-missing-artist drew it
- **Pros:** No exceptions; the outcome is visible in the type.
- **Cons:** Four controllers each map three outcomes to HTTP; easy to forget a branch on the next
  route under `/artists/{slug}`.

### Option 3: Retired slugs only (`old_slug`, `replaced_at`)
- **Pros:** No duplicate of the current slug.
- **Cons:** "Is this slug free?" needs two tables and two indexes, and a race between a new slug and a
  retired one is no longer caught by one unique constraint.

### Option 4: The API returns the redirect target in a 200 body and the web server issues the 301
- **Pros:** No redirect for HTTP clients to follow.
- **Cons:** Every API consumer would need to know the convention; a plain 301 is what crawlers and the
  sub-resources expect, and Angular's SSR already turns a navigation into one.

## Consequences

### Positive
- Old links on bulletins and posters keep working and crawlers update their index (301).
- A crawler or link preview gets a real 404 for a missing artist or address, not a soft 200.
- M3's `GenerateArtistSlug` and M4's `ChangeArtistSlug` write into a table that already enforces
  never-reassigned slugs.

### Negative
- The profile request now carries the search, so the CDN keys found profiles per search; they are
  only cached for 60 seconds.
- A hidden artist's suggestions are filtered by their style while an unknown slug's are not, a small
  difference an observer could notice.

### Risks
- A profile whose slug changes while the browser holds the old one moves on the next load; nothing
  else follows the change until M4 purges caches on `ArtistSlugChanged`.
- Retention of slug rows after an account is deleted is still `<TO SUPPLY>` (M9 confirms).

## Implementation Notes

- Backend: `App\Actions\ArtistProfiles\{ResolveArtistSlug,ArtistMoved,ArtistNotFound}`,
  `App\Models\SlugHistory`, migration `2026_10_10_000300_create_slug_histories_table`,
  `App\Services\Discovery\{SimilarArtistFinder,SimilarArtists}`,
  `App\Http\Requests\ArtistProfiles\ShowArtistProfileRequest`, `ProblemType::ArtistNotFound` and the
  `extensions` of `ProblemDetails`; OpenAPI documents the 301 and `similarArtists` in
  `ProblemDetailsResponses`.
- Seed: every artist's current slug, Abigail's retired `abigail-sings`, and Selah Brooks, a suspended
  solo vocalist (`CastSeeder`).
- Frontend: `shared/http-status.ts`, `ArtistProfileStore` (`missing`, the move), `pages/not-found/`
  (`NotFoundPage` on `**`, `ArtistNotFoundPage` inside the profile page), `zm-error-page`, and
  `ArtistNotFound` with the transfer state in `api/lib/services/artist-profiles.ts`.
- Tests: `tests/Feature/ArtistProfiles/ResolveMissingArtistTest.php`,
  `e2e/specs/artist-profiles/resolve-missing-artist.spec.ts`.
- M4's `ChangeArtistSlug` sets `retired_at` on the old row and inserts the new one in the same
  transaction; M3's `SlugRegistry` checks `slug_histories.slug` only.

## References

- `docs/plans/m1-foundations-and-browse.md` (S15)
- `docs/detailed-designs/artist-profiles/resolve-missing-artist/README.md`
- `docs/detailed-designs/artist-workspace/change-profile-address/README.md`
- `docs/specs/components/error-page.md`
- ADR-0005 (problem types), ADR-0008 (profile names)
