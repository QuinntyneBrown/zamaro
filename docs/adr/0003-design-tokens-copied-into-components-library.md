# ADR-0003: Design tokens are copied into the components library

**Date:** 2026-10-09
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

`docs/design-system/tokens/tokens.css` is the single source of truth for design tokens. Angular
applications must not import from `docs/`, and AGENTS.md limits global styles to foundations living in the
`components` library (`projects/components/src/styles`).

## Decision

The library holds a verbatim copy at `frontend/projects/components/src/styles/tokens.css`. The command
`npm run tokens:sync` (in `frontend/`) overwrites the copy from the docs file. Every application lists the
copy and `styles/index.scss` (reset and utilities) first in its `angular.json` `styles`.

## Options Considered

### Option 1: Import from `docs/` by relative path
- **Pros:** No copy.
- **Cons:** Applications and docs become coupled by path; library packaging breaks.

### Option 2: Verbatim copy with a sync script (chosen)
- **Pros:** Self-contained workspace; a one-line sync.
- **Cons:** The copy can go stale.

## Consequences

### Positive
- Components read tokens by role from a file inside the workspace.

### Negative
- Someone must run `tokens:sync` after changing the design system.

### Risks
- A stale copy; reviewers should check that `tokens.css` is unchanged when only docs tokens move.

## References

- AGENTS.md, frontend conventions
