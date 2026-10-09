# ADR-0001: Administrator area is a separate Angular application

**Date:** 2026-10-09
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

`docs/detailed-designs/administration/secure-admin-access` describes `/admin` as a lazy route inside the
public application, guarded by `adminGuard`. L2-087 requires that administrator code is never loaded on
Discover and caps the initial bundle at 250 KB gzipped. The Angular workspace already declares an `admin`
application beside `zamaro`, and AGENTS.md's target tree builds both into the one `zamaro-web` image.

## Decision

The administrator area is its own Angular application (`frontend/projects/admin`), client-rendered with base
href `/admin/`. It shares the `components` and `api` libraries. The `zamaro-web` server serves its static
build under `/admin`, so the browser still sees one origin. The route guard stays as defence in depth; the
API remains the authority (non-administrators get 404, L2-066).

## Options Considered

### Option 1: Lazy `/admin` route in the public application
- **Pros:** One build and one set of providers.
- **Cons:** Administrator code ships in the same artefact and counts against the public bundle analysis;
  the budget depends on lazy-loading discipline rather than structure.

### Option 2: Separate `admin` application (chosen)
- **Pros:** Administrator code cannot reach the public bundle; the admin app needs no SSR; separate
  budgets.
- **Cons:** A second build target and a second `app.config.ts` binding the API tokens.

## Consequences

### Positive
- The public bundle budget is protected by structure.

### Negative
- Two applications to build, lint and test.

### Risks
- Shell chrome could drift between the applications; shared pieces live in `components`.

## Implementation Notes

The admin slice (M3) creates the shell, guard and pages. Until then the `admin` project stays empty and the
server does not serve it. Update `secure-admin-access` when that slice starts.

## References

- AGENTS.md, target folder structure
- L2-066, L2-087
