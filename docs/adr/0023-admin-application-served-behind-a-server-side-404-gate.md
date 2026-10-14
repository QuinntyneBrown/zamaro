# ADR-0023: The admin application is served behind a server-side 404 gate, and the two applications share their session services

**Date:** 2026-10-13
**Category:** frontend
**Status:** Accepted; amended by [ADR-0027](0027-nextjs-backend.md), which replaces the Laravel mechanisms named here
**Deciders:** Claude (M3 S3, admin application shell and the `/admin` 404), with the user's OK on M3 D5

## Context

L2-066.1 says anyone without the Administrator role who requests any `/admin` page gets 404. ADR-0001
made the admin area a separate, client-rendered Angular application with base href `/admin/`, so no
server rendering can set that status for it, and `secure-admin-access` still described `adminGuard`
on a lazy route of the public application as the thing that renders the not-found page.

The admin application also needs what the public one already has: the theme (L2-104), the current
user (`AuthService`) and the CSRF plumbing. `ThemeService` lived in the public application's shell,
where the admin application could not reach it, and AGENTS.md forbids copying.

## Decision

1. **The `zamaro-web` server gates `/admin/**`** (`projects/zamaro/src/server.ts`). For every request
   under `/admin` it calls `GET {API_ORIGIN}/api/v1/admin/overview` with the browser's cookies, a
   `Referer` of the site's own origin (so Sanctum starts the cookie session, ADR-0015) and the
   browser's address in `X-Forwarded-For`. On 200 it serves the admin build (`dist/admin/browser`,
   or `ADMIN_DIST`) with `Cache-Control: private, no-store`: the page for a route, the file for an
   asset. On any other answer the request falls through to the public application, whose wildcard
   renders the shared not-found page with a real 404. A guest, a booker, an artist and an
   administrator who has given only their password therefore all see the same page, with the same
   status, as for an address that does not exist.
2. **`adminGuard` stays as defence in depth** (`api/lib/auth/admin.guard.ts`): the admin
   application's root route matches only for a signed-in administrator; anyone else reaches its own
   not-found route. It never decides the HTTP status.
3. **The code step continues with a full navigation.** The admin application is a different build, so
   after a sign-in whose `returnUrl` is under `/admin` (`isAdminUrl`), the sign-in and code-step pages
   leave through `location.assign` instead of the router. Signing out of the admin application leaves
   for the public site the same way.
4. **Shared session services live in the `api` library.** `ThemeService` moves to
   `api/lib/theme/`, beside the auth, i18n and HTTP plumbing both applications bind in their
   `app.config.ts`. The admin application binds `AUTH_API`, `PREFERENCES_API` and
   `ADMIN_OVERVIEW_API`, and uses the shared CSRF recovery interceptor; it has no hydration, transfer
   cache or server config.
5. **The admin application gets its own `admin` Playwright project**, with `specs/administration`,
   `specs/artist-onboarding`, `visual/admin.spec.ts` and `a11y/admin.spec.ts`; the visual and a11y
   loops are shared functions that take the application. Its route states carry `app: 'admin'`.

## Options Considered

### Option 1: the server-side gate with a fall-through to the public 404 (chosen)
- **Pros:** one real 404, identical for everyone the API refuses; admin code (even its JavaScript)
  never reaches a non-administrator; one place to reason about.
- **Cons:** one extra API call per admin page load, which also counts as administrator activity
  (acceptable: a page load is activity).

### Option 2: serve the admin build to everyone and let `adminGuard` render a 404 page
- **Cons:** the status would be 200; the admin bundle would be downloadable by anyone; L2-066.1 asks
  for 404.

### Option 3: render `/admin` through the public application's SSR (a lazy route)
- **Cons:** superseded by ADR-0001; admin code would join the public artefact.

## Consequences

### Positive
- The admin application reveals nothing to anyone the API has not admitted.
- Both applications read one theme, one current user and one CSRF story.

### Negative
- Local and e2e runs need both builds and the API reachable from the web server.
- `api/lib/theme/` joins the AGENTS.md tree.

## Links
- ADR-0001 (admin as a separate application), ADR-0015 (same-origin cookie sessions),
  ADR-0017 (server rendering and personal data)
- `docs/detailed-designs/administration/secure-admin-access/README.md`
- `docs/plans/m3-artist-onboarding-and-admin.md` (S3, D5)
