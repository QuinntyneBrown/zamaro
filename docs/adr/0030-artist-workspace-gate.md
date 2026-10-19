# ADR-0030: The artist workspace explains itself to church accounts instead of redirecting

**Date:** 2026-10-19
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner

## Context

`/artist` is the artist's workspace: dashboard, requests, availability, earnings and profile. A church
account, a guest and an artist all can type that address. L2-074 says another account's artist area is
never exposed: the artist API answers a non-artist with the same 404 as an unknown address. The page
itself needs a decision for each visitor, because a redirect away from `/artist` hides why the person
could not stay, and the mocks (`docs/mocks/pages/dashboard/forbidden.html`) show an explanation.

## Decision

1. **One parent route `artist`** guards its children with `signedInGuard` and `termsGuard`. A guest goes
   to sign in and returns to the address they asked for.
2. **A `Workspace` layout component** decides on the signed-in person's roles. An artist gets the
   routed child. Anyone else gets "This page is for artists" inside the church's own header and
   footer, with a way back to Discover and to applying. There is no redirect and no new status code in
   the browser; the API's 404 stays the authority.
3. **The header follows the role.** The shell switches the top bar to its workspace variant (role tag
   "Artists", five workspace links, no Saved link) when an artist is on an `/artist` address. A church
   account keeps the public bar.
4. **`/artist/**` renders in the browser only**, like the other private pages (ADR-0017): the server
   never holds the person's cookies.
5. **`/artist` redirects to the calendar** once the calendar page exists. The redirect is declared with
   that page, not before: Angular applies `redirectTo` while matching, before any guard runs, so a
   redirect to a missing child sends everyone to the not-found page.

## Consequences

- Church accounts learn why they cannot use the page; nothing about artists leaks, because the page is
  static and the data calls are never made.
- Each workspace screen is a child route and inherits the gate; none repeats a role check.
- The workspace bar links to screens that arrive in later slices; until then they show the not-found page.
