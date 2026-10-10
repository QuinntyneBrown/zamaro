# ADR-0007: Frontend layout: AGENTS.md pages, shell and libraries replace the designs' core, features and shared

**Date:** 2026-10-09
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

The detailed designs place Zamaro Web code in `core/{a11y,i18n,layout,...}`, `features/{area}` and
`shared/`, and name classes with an Angular `Component` suffix (`AppShellComponent`). AGENTS.md defines a
different layout:
- an application with `shell/`, `pages/` and `dialogs/`
- a `components` library for every reusable `zm-*` component
- an `api` library for HTTP access, i18n and auth

AGENTS.md also says class names omit the `Zm` prefix. Slice S2 is the first frontend code, so the mapping
has to be settled now.

## Decision

AGENTS.md wins on layout. When a design names a frontend location or class, read it through this mapping:

| Design says | Code lives in |
|---|---|
| `core/layout`: `AppShellComponent` | `projects/zamaro/src/app/shell/` (`Shell`, `zm-shell`) |
| `core/a11y`: `SkipLinkComponent`; design-system `TopBarComponent`, `FooterComponent` | `projects/components/src/lib/{skip-link,top-bar,footer}` (`SkipLink`, `TopBar`, `Footer`) |
| `core/i18n`: `CatalogueLoader`, Transloco setup | `projects/api/src/lib/i18n/` (`CatalogueLoader`, `provideI18n()`) |
| `features/{area}` screens | `projects/zamaro/src/app/pages/{mock page name}/` |
| `features/{area}` dialogs | `projects/zamaro/src/app/dialogs/{mock dialog name}/` |
| `shared/` presentational pieces | the `components` library; app-only helpers in `app/shared/` |
| services, contracts, models | `projects/api/src/lib/{services,models,auth,i18n,http,testing}/` |

Further rules:

1. **Class names drop the `Component` suffix** (Angular's current style guide) as well as the `Zm`
   prefix: `AppShellComponent` becomes `Shell`.
2. **Library components take text, not keys.** The `components` library knows no translation catalogue.
   Pages and the shell translate and pass strings as inputs, or project content.
3. **`api/src/lib/http/`** is added to the AGENTS.md tree for HTTP plumbing that is neither auth nor a
   subsystem service. Its first member is `ApiOriginBackend`. On the server it rewrites `/api/...` to
   `API_ORIGIN` *below* the interceptor chain, so the HTTP transfer cache keys requests by the same
   relative URL as the browser. An interceptor would run before Angular's transfer-cache interceptor and
   break that match; S2 proved this with an e2e test.
4. **`<main id="main" tabindex="-1">`.** The design system and `meet-accessibility-standards` require the
   `tabindex`. The mocks omit it, and the code follows the design.

## Options Considered

### Option 1: Follow the designs' `core/features/shared`
- **Pros:** Matches 48 designs word for word.
- **Cons:** Contradicts AGENTS.md, the e2e page-object layout and the perf-test scenario paths.

### Option 2: AGENTS.md layout plus this mapping (chosen)
- **Pros:** One layout for agents and people; the designs stay readable.
- **Cons:** The designs' paths are stale until each feature lands.

## Consequences

### Positive
- Administrator code stays out of the public bundle, and shared components have one home.

### Negative
- Each slice updates the locations in the designs it implements. The designs index points here.

### Risks
- Someone may read a design's path literally; the index note reduces that risk.

## Implementation Notes

S2 updated `meet-accessibility-standards`, `adapt-layout-to-screens` and `localise-formats-and-text`.
`zm-button` moved to S3, which first renders a button.

## References

- AGENTS.md, "Target folder structure"
- ADR-0001 (admin is a separate application)
