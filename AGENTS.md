## Project overview

Zamaro is a full-stack platform for booking Christian praise and worship artists in Toronto and the surrounding area (within reasonable driving distance). Artists have profiles with bios, images, and videos.

- **Backend:** PHP / Laravel — owns booking, persistence, and authentication
- **Frontend:** Angular — provides the app
- **E2E:** Playwright — covers behavior and visual parity with the design reference

## Repository layout

- `docs/specs/` — requirements (`L1.md` high-level, `L2.md` detailed with acceptance criteria)
- `docs/mocks/` — static design reference (every page and state, light and dark); see `docs/mocks/README.md`
- `docs/adr/` — architecture decisions; read relevant ADRs before changing the areas they cover
- `.claude/skills/` and `.agents/skills/` — the skills this repository expects agents to follow

## Backend conventions

- Business rules live in domain services, actions, and jobs — not controllers.
- The API does **not** run database migrations on startup. Run them explicitly.
- Seed data is idempotent and safe to re-run.
- Endpoints require authentication by default. Preserve intentional anonymous access and middleware ordering when changing API auth.
- Keep request logging outside the exception-handling middleware so handled response statuses are logged correctly.
- User-owned data must remain scoped to the current user; resources belonging to other users or artists should never be exposed.

### Tests

Back end tests are integration tests against the API. Follow the existing test patterns when adding coverage.

## Frontend conventions

- Prettier owns formatting and angular-eslint owns lint; CI fails on either. Run `npm run lint` and `npm run format:check` in the frontend workspace. The husky pre-commit hook fixes staged frontend files.
- Component selectors use `zm-*`; TypeScript class, file, and folder names omit the `Zm` prefix.
- Components should preserve the mock design's BEM classes and accessible state semantics; e2e locators depend on that parity.
- Keep component styles encapsulated and global styles limited to shared foundations and utilities.
- **Read design tokens by role, never by value.** Use the CSS custom properties from the design system (`var(--color-fg-default)` for text, `--color-accent` for fills, `--color-border-strong` for borders, `--space-*` for spacing), never hex values or magic numbers. Component-scoped knobs keep the `--zm-` prefix.
- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches; slots repeated per `@if` branch project into one branch only. On the consumer side, a `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011) — one `@if` per node.
- API services have a contract and injection token; app pages depend on the token, not the concrete implementation.
- **No inline forms in pages.** Button-triggered editing always opens a CDK Dialog or navigates to a screen.
- Use Angular CDK Dialog/Overlay for modal behavior; don't hand-roll modals.

## E2E architecture (Playwright)

- Run the relevant Playwright tests for UI changes; update visual baselines only for intentional design changes.
- Run frontend tests in Chromium only. Do not configure or run Firefox, WebKit, or any other browser for frontend testing.

## Incremental Implementation and ATDD - mandatory

Mocks and the design system are design artifacts. ATDD does not apply to their
development. Do not write tests for mocks or the design system.

Every new feature or change to production behavior MUST have a requirement, a
detailed design, and a mock before implementation begins. This includes
behavioral changes to existing features, such as changing how a page behaves.
This requirement applies to production-code changes only; documentation-only,
design-system-only, mock-only, and test-only changes are out of scope unless
they are part of implementing a production behavior change.

Every production behavior implementation MUST invoke and follow the
`implementing-incrementally` skill (`.claude/skills/implementing-incrementally`
and `.agents/skills/implementing-incrementally`) before any code is written,
combined with acceptance test-driven development (ATDD). Plan small,
reviewable slices, then complete one slice at a time: write Given-When-Then
acceptance criteria, write the acceptance test, and run it to prove it fails for
the expected reason BEFORE writing production code. Implement only what satisfies
that slice, refactor with tests green, and run the relevant regression checks.
Do not move to the next slice until those checks pass. No bulk implementation,
no tests added afterward, and no weakening tests to manufacture a pass. Keep
the requirement, detailed design, mock, criteria, tests, and implementation
aligned until the entire feature or behavior change is complete.

Back end: integration tests against the API. Front end: Playwright, using the
Page Object Model - one page object per screen, owning the selectors and the
interactions. Tests state intent; page objects know the DOM. Never put a
selector in a test.

### Never write architecture tests

Never add a test that asserts the shape of the codebase rather than its behavior:
no structure, layout, or naming tests; no banned-API scans; no traceability tests
that parse the specifications. Those constraints belong to the compiler, the
formatter, and review. A test suite exists to prove behavior.
