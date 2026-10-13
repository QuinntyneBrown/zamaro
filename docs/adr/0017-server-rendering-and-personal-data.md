# ADR-0017: The server renders every page signed out; personal data reaches the page only in the browser

**Date:** 2026-10-10
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M2 S2, signed-in header)

## Context

Zamaro Web renders pages on the server (Angular SSR) and replays the GET responses it fetched there in
the browser through the hydration transfer cache. Until M2 every response was public. From S2 the
header names the signed-in person, and later slices add the church, the saved artists and account
settings.

Two ways a private response could leak:

- **Cookie forwarding.** If SSR forwarded the browser's `zamaro_session` cookie to the API, the server
  HTML would carry the person's name. Any cache between the site and the browser (a CDN, a shared
  proxy) could then serve one person's page to another.
- **The transfer cache.** A personal response fetched on the server is serialised into the page's
  HTML as JSON. Even without a shared cache, it ties personal data to markup that is meant to be
  public and cacheable.

`security/manage-sessions-and-csrf` already states the rule ("server rendering forwards no browser
cookies to the API. Public pages render in their signed-out form and the header switches to the
signed-in state after hydration"); the M2 plan asks for it to be recorded with the transfer-cache
filter.

## Decision

1. **No cookies on the server.** The SSR app's `HttpClient` calls the API with no browser cookies, so
   every server-rendered page is the signed-out page. Its header shows "Sign in" and its footer the
   "Your account" column.
2. **The person is loaded in the browser.** The shell calls `AuthService.load()` in `afterNextRender`,
   which runs only in the browser, after hydration. `GET /api/v1/me` answers the person (or 401 for a
   guest), and the header and footer switch to them. A sign-in or sign-out that happens while `/me` is
   in flight wins over its answer.
3. **Nothing personal is transfer-cached.** `withHttpTransferCacheOptions({ filter:
   isTransferCacheable })` leaves out `/api/v1/me`, `/api/v1/account/**` and
   `/api/v1/saved-artists/**`. `isTransferCacheable` lives in `api/lib/auth/provide-auth.ts`; a slice
   that adds a personal endpoint outside those paths adds it there.
4. **Private routes render in the browser.** A route that only a signed-in person can see (the
   account settings, the saved list) uses `RenderMode.Client` in `app.routes.server.ts` when it lands
   (S9, S17), so the server sends the shell and the browser renders the page once the person is known.
5. **A guard in the suite.** The sign-in spec fetches the server HTML of Discover with Naomi's session
   cookie and asserts that it contains neither her name nor her email.

## Options Considered

### Option 1: signed-out SSR, personal data in the browser (chosen)
- **Pros:** server HTML stays public and safe to cache; no personal JSON in any page; one rule for
  every route.
- **Cons:** a signed-in person sees "Sign in" in the header until `/me` answers, then the avatar.

### Option 2: forward the session cookie and render signed in
- **Pros:** no switch after load.
- **Cons:** every page becomes private (`Cache-Control: private`), so pages cannot be cached at the
  edge; one mistake in a cache key leaks a person's page; the SSR server would hold session cookies.

### Option 3: a "maybe signed in" hint cookie that renders a skeleton in place of the account link
- **Pros:** no "Sign in" flash for returning people.
- **Cons:** another cookie to keep in step with the session; guests with a stale hint see a skeleton
  instead of "Sign in". Revisit if the switch proves distracting (the top-bar CRD's `account="loading"`
  state is ready for it).

## Consequences

### Positive
- No page the server renders can name anyone.
- Later slices add personal endpoints without touching SSR, as long as they sit under the filtered
  paths.

### Negative
- The header changes once after load for a signed-in person.
- Every page load in a browser asks `/me`; a guest's answer is a 401.
