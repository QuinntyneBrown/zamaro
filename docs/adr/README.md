# Architecture decision records

One decision per file, numbered in the order they are made: `NNNN-kebab-case-title.md`. Each follows the
template used in [0001](0001-admin-as-separate-application.md): context, decision, options, consequences,
implementation notes, references.

Read the ADRs that cover an area before changing it. When a change needs a different layout or reverses a
decision, write a new ADR that supersedes the old one and update the affected designs in the same change.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-admin-as-separate-application.md) | Administrator area is a separate Angular application | Accepted |
| [0002](0002-compose-dev-environment-and-vendor-ports.md) | Docker Compose dev environment; outside vendors behind ports with fakes | Accepted |
| [0003](0003-design-tokens-copied-into-components-library.md) | Design tokens are copied into the components library | Accepted |
| [0004](0004-stay-on-laravel-11-with-ignored-advisories.md) | Stay on Laravel 11 and ignore its seven blocking advisories by ID | Accepted |
| [0005](0005-api-skeleton-route-files-support-and-problem-types.md) | API skeleton: route files, `app/Support`, problem types and health responses | Accepted |
| [0006](0006-openapi-from-code-with-scramble-and-opis.md) | OpenAPI 3.1 generated from code with Scramble; contract tests validate with opis | Accepted |
