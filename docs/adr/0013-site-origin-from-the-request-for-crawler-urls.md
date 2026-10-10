# ADR-0013: Absolute URLs for crawlers and link previews use the origin the request arrived at

**Date:** 2026-10-10
**Category:** frontend
**Status:** Accepted
**Deciders:** Claude (M1 S16, index-and-share-profile)

## Context

Indexing and sharing a profile (L2-112, L2-113) needs absolute URLs in several places: the canonical
link, `og:url`, `og:image` and `twitter:image`, the JSON-LD `url` and `image`, the address Share sends
or copies, every `<loc>` in `/sitemap.xml`, and the `Sitemap:` line in `/robots.txt`. The design
writes the canonical URL as `https://zamaro.ca/artists/{slug}`, but nothing in the repository
configures the public site address, and the same build runs on `localhost:4000` in dev and e2e, on
staging later (M10), and on `zamaro.ca` in production.

The API cannot build these URLs either: it does not know where the web app is served, and the media
URLs it returns are relative (`/media/...`) until object storage arrives in M4. The pages are rendered
by the Angular SSR server, which receives every request; the browser renders client-side navigations
and must produce the same head as the server so a hydrated page does not change its canonical link.

Angular's SSR engine already refuses requests whose `Host` is not in `security.allowedHosts`
(`angular.json`, `["localhost"]` today), which is what keeps a forged `Host` header out of rendered
URLs.

## Decision

- The site origin is the origin of the request. On the server, `PageMeta` reads it from Angular's
  `REQUEST` token; in the browser, from `document.location`. `PageMeta.url(path)` turns a path, or a
  relative media URL, into an absolute URL with it. The Express routes for `/robots.txt` and
  `/sitemap.xml` use `req.protocol` and the `Host` header the same way.
- The sitemap's data comes from the API as JSON: `GET /api/v1/sitemap` returns each published
  profile's `slug` and `lastModified`, contract-tested like every other endpoint. The SSR server turns
  it into XML with the site's own addresses, adding `/` for Discover.
- No `SITE_ORIGIN` setting is introduced. Deployment (M10) lists the public host names in
  `allowedHosts` and makes the SSR server see the public scheme and host behind the load balancer.

## Options Considered

### Option 1: The request's origin (chosen)
- **Pros:** One build works on every host with no configuration; server and browser agree; e2e can
  assert real, fetchable URLs (`http://localhost:4000/...`).
- **Cons:** A site reachable at several hosts (`www.`) gets a canonical per host until the extra
  hosts redirect; correctness depends on `allowedHosts` and proxy headers being set at deploy time.

### Option 2: A configured `SITE_ORIGIN` environment variable
- **Pros:** One canonical host regardless of how the request arrived.
- **Cons:** A second source of truth that must reach both the server and the browser (transfer state
  or a build-time constant); dev and e2e would publish canonical URLs pointing at production, which
  tests could not follow.

### Option 3: The API returns absolute URLs and the sitemap as XML
- **Pros:** The SSR server would only proxy `/sitemap.xml`.
- **Cons:** The API would need to know the web app's public address (the same configuration problem
  as Option 2), and an XML body sits outside the OpenAPI contract tests.

## Consequences

### Positive
- Canonical links, previews, Share, the sitemap and robots.txt are all correct on localhost, staging
  and production from the same image.
- The sitemap's data is contract-tested; its XML is tested end to end.

### Negative
- Production must redirect secondary hosts (`www.zamaro.ca`) to the primary one, or each gets its
  own canonical URL.

### Risks
- If `allowedHosts` is widened carelessly (`*`), a forged `Host` header could appear in rendered
  canonical and Open Graph URLs that a CDN then caches. M10 must keep the list to the real hosts and
  configure trusted proxy headers.

## Implementation Notes

- `frontend/projects/zamaro/src/app/shared/page-meta.ts` (`PageMeta.origin`, `url`, `set`).
- `frontend/projects/zamaro/src/crawler-files.ts` (`robotsTxt`, `sitemapXml`) and the two routes in
  `server.ts`.
- `backend/app/Http/Controllers/Api/V1/ArtistProfiles/SitemapController.php` and
  `Actions/ArtistProfiles/ListPublishedProfiles`.

## References

- `docs/detailed-designs/artist-profiles/index-and-share-profile/README.md`
- L2-112, L2-113; ADR-0007 (frontend layout)
