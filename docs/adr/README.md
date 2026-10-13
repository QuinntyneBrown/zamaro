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
| [0004](0004-stay-on-laravel-11-with-ignored-advisories.md) | Stay on Laravel 11 and ignore its seven blocking advisories by ID | Superseded by 0009 |
| [0005](0005-api-skeleton-route-files-support-and-problem-types.md) | API skeleton: route files, `app/Support`, problem types and health responses | Accepted |
| [0006](0006-openapi-from-code-with-scramble-and-opis.md) | OpenAPI 3.1 generated from code with Scramble; contract tests validate with opis | Accepted |
| [0007](0007-frontend-layout-pages-shell-and-libraries.md) | Frontend layout: AGENTS.md pages, shell and libraries replace the designs' core, features and shared | Accepted |
| [0008](0008-artist-profile-names-public-and-editor.md) | Artist profile names: one public profile, a separate editor, and the designs' shared enums | Accepted |
| [0009](0009-upgrade-to-laravel-13.md) | Upgrade to Laravel 13 and drop the ignored advisories | Accepted |
| [0010](0010-hls-js-for-adaptive-video.md) | hls.js plays adaptive video where the browser cannot, loaded on demand | Accepted |
| [0011](0011-slug-history-and-artist-slug-resolution.md) | Slug history and one slug resolver for every artist address | Accepted |
| [0012](0012-feature-flags-from-api-configuration.md) | Feature flags live in the API's configuration and reach the frontend through one endpoint | Accepted |
| [0013](0013-site-origin-from-the-request-for-crawler-urls.md) | Absolute URLs for crawlers and link previews use the origin the request arrived at | Accepted |
| [0014](0014-deterministic-visual-parity-baselines.md) | Visual parity runs on a self-hosted display face with one baseline set per platform | Accepted |
| [0015](0015-same-origin-cookie-sessions.md) | Same-origin cookie sessions with Sanctum's SPA mode and Redis, no bearer tokens | Accepted |
| [0016](0016-current-user-names.md) | One name each for the current user: `AuthService`, `CurrentUserResource`, `MeController` | Accepted |
| [0017](0017-server-rendering-and-personal-data.md) | The server renders every page signed out; personal data reaches the page only in the browser | Accepted |
| [0018](0018-csrf-token-on-every-state-changing-request.md) | Every state-changing request carries the CSRF token, same-origin or not | Accepted |
| [0019](0019-email-foundation-and-e2e-queue-worker.md) | Email foundation: catalogue-built Markdown mail on one base class, and an e2e queue worker | Accepted |
| [0020](0020-field-encryption-keys.md) | Field encryption with a versioned key that is not APP_KEY | Accepted |
| [0021](0021-totp-library.md) | TOTP two-step sign-in with google2fa, and the QR code as an image from the API | Accepted |
| [0022](0022-audit-log-immutability.md) | The audit log is append-only in the model, in a trigger, and through one retention role | Accepted |
| [0023](0023-admin-application-served-behind-a-server-side-404-gate.md) | The admin application is served behind a server-side 404 gate, and the two applications share their session services | Accepted |
| [0024](0024-upload-storage-on-local-disks-until-object-storage.md) | Upload storage on local disks behind Laravel's filesystem ports until object storage | Accepted |
| [0025](0025-private-document-envelope-encryption.md) | Private documents are encrypted per file with a wrapped data key | Accepted |
