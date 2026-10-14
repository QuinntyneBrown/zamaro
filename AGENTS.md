## Project overview

Zamaro is a full-stack platform for booking Christian praise and worship artists in Toronto and the surrounding area (within reasonable driving distance). Artists have profiles with bios, images, and videos.

- **Backend:** Next.js (TypeScript on Node.js) — owns booking, persistence, and authentication; serves the API only (ADR-0027)
- **Frontend:** Angular — provides the app
- **E2E:** Playwright — covers behavior and visual parity with the design reference

## Repository layout

- `docs/specs/` — requirements (`L1.md` high-level, `L2.md` detailed with acceptance criteria)
- `docs/specs/components/` — component requirements documents (CRDs): `<component>.md` and
  `<component>.html` per `zm-*` component, tracing to L2; see `docs/specs/components/README.md`
- `docs/detailed-designs/` — one detailed design per feature, grouped by subsystem; see `docs/detailed-designs/README.md`
- `docs/mocks/` — static design reference (every page and state, light and dark); see `docs/mocks/README.md`
- `docs/design-system/` — tokens, foundations, components, and patterns extracted from the mocks
- `docs/adr/` — architecture decisions; read relevant ADRs before changing the areas they cover
- `.claude/skills/` and `.agents/skills/` — the skills this repository expects agents to follow

### Target folder structure

This is the layout the repository grows into once the whole solution is built. Folders appear slice by
slice as features land; create new code where this tree says it belongs. The three runtime containers
from the detailed designs map to two applications: `backend/` builds the `zamaro-api` image, which runs
as both the Zamaro API and the Zamaro Worker (BullMQ workers and the scheduler), and `frontend/` is an Angular
workspace that builds the `zamaro-web` image. The workspace holds two applications (`zamaro` and
`admin`), two libraries they share (`components` and `api`), and the `perf-test` scenario application.
Keeping `admin` a separate application keeps administrator code out of the public bundle; the
`administration/secure-admin-access` design describes `/admin` as a lazy route, so record the split in
an ADR and update that design when the admin slice starts. Subsystem names below match `docs/detailed-designs/`. If a change
needs a different layout, record the decision in `docs/adr/` and update this tree in the same change.

```text
zamaro/
├── AGENTS.md                      # single source of agent guidance (CLAUDE.md, GEMINI.md point here)
├── CLAUDE.md
├── GEMINI.md
├── .agents/skills/                # agent skills (mirrored in .claude/skills/)
├── .claude/skills/
├── .ci/                           # pipeline: lint, tests, scans, budgets, perf test, contract, build,
│                                  # migrate, rollout
├── .github/
│   └── copilot-instructions.md
├── .husky/                        # pre-commit hook that fixes staged frontend files
├── docs/
│   ├── adr/                       # architecture decision records (NNNN-title.md)
│   ├── design-system/             # tokens/, foundations/, components/, patterns/, assets/
│   ├── detailed-designs/          # {subsystem}/{feature}/README.md + diagrams/
│   ├── mocks/                     # pages/, dialogs/, notifications/, assets/
│   ├── plans/                     # milestone plans with their current status
│   └── specs/                     # L1.md, L2.md
│       └── components/            # CRDs: <component>.md + <component>.html, trace to L2
├── docker-compose.yml             # local dev: postgres, redis, mailpit, api, api-e2e, worker-e2e, worker,
│                                  # scheduler (ADR-0002, ADR-0019)
├── backend/                       # Next.js 16 on Node.js 24, TypeScript — Zamaro API and Zamaro Worker (ADR-0027)
│   ├── src/
│   │   ├── app/                   # Next.js routing: route handlers only, no pages
│   │   │   ├── api/v1/            # /api/v1/**/route.ts: thin — validate, call an action, return a resource;
│   │   │   │                      # authenticated by default, anonymous routes listed in public.ts
│   │   │   ├── health/            # live/route.ts and ready/route.ts, outside /api/v1 (ADR-0005)
│   │   │   └── media/             # signed links to private documents, on the media host (ADR-0024)
│   │   ├── server/
│   │   │   ├── actions/{subsystem}/   # one use case per class; business rules live here
│   │   │   ├── services/{subsystem}/  # domain services (AvailabilityService, DistanceService, ...)
│   │   │   ├── jobs/{subsystem}/      # BullMQ jobs (expiry, reminders, payouts, rating recalculation)
│   │   │   ├── events/  listeners/    # EventBus; listeners run after commit
│   │   │   ├── db/                # client.ts and schema/: Drizzle tables (Booking, Artist, Church, Review, ...)
│   │   │   ├── enums/             # BookingStatus and other closed vocabularies
│   │   │   ├── contracts/         # ports for outside services (PaymentGateway, MediaScanner, ...)
│   │   │   ├── integrations/      # adapters that implement contracts/
│   │   │   ├── policies/          # ownership and role authorisation
│   │   │   ├── notifications/     # transactional email (TransactionalNotification, ADR-0019)
│   │   │   ├── rules/             # validation rules shared by request schemas (PasswordPolicy)
│   │   │   ├── support/           # cross-cutting code with no subsystem (problems/ for RFC 9457)
│   │   │   └── http/
│   │   │       ├── pipeline.ts    # request pipeline: the middleware order for every route
│   │   │       ├── rate-limits.ts # named rate limiters
│   │   │       ├── requests/{subsystem}/   # Zod request schemas
│   │   │       └── resources/{subsystem}/  # JSON response shapes
│   │   ├── cli/                   # npm run scripts (i18n:check, db:seed, ...)
│   │   ├── worker.ts              # Zamaro Worker: BullMQ queues high, notifications, default
│   │   ├── scheduler.ts           # registers the BullMQ job schedulers
│   │   └── instrumentation.ts     # boot-time configuration checks and error tracking
│   ├── config/                    # zamaro.ts and security.ts: typed, validated environment
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/            # Drizzle Kit SQL; expand–contract only; never run on startup
│   │   └── seeders/               # idempotent, safe to re-run
│   │       └── media/             # sample files the media seeder copies to the media disk (M1 has no uploads)
│   ├── resources/
│   │   ├── i18n/{locale}/         # translation catalogues served at /api/v1/i18n/{locale}
│   │   └── emails/
│   ├── tests/
│   │   ├── feature/{subsystem}/   # Vitest integration tests against the running API
│   │   ├── feature/security/      # cross-user access suite and route-ownership fixtures
│   │   └── load/                  # load scenarios for the response-time budgets
│   ├── tools/eslint/              # Zamaro's own ESLint rules (no-raw-sql, L2-075.2)
│   ├── next.config.ts  drizzle.config.ts  vitest.config.ts  eslint.config.js  tsconfig.json  package.json
│   ├── docker/                    # backend container assets (postgres init script); see ADR-0002
│   └── Dockerfile                 # zamaro-api image (API, Worker and Scheduler)
├── frontend/                      # Angular workspace — Zamaro Web; angular.json declares every project
│   ├── angular.json  package.json  tsconfig.json  eslint.config.js  .prettierrc
│   ├── projects/
│   │   ├── zamaro/                # application: public site, booker and artist areas, with SSR
│   │   │   ├── public/            # static files copied as-is (favicon, robots.txt)
│   │   │   └── src/
│   │   │       ├── app/
│   │   │       │   ├── shell/     # header, footer, navigation menu, theme switch
│   │   │       │   ├── pages/     # routed screens, one folder per docs/mocks/pages entry
│   │   │       │   │   ├── discover/  artist/  book/  saved/  bookings/  booking-detail/
│   │   │       │   │   ├── sign-in/  sign-up/  verify-email/  forgot-password/  reset-password/  account/
│   │   │       │   │   ├── confirm-email/  mfa-setup/  mfa-challenge/  accept-terms/
│   │   │       │   │   ├── apply/  dashboard/  requests/  request-detail/  availability/
│   │   │       │   │   ├── edit-profile/  earnings/
│   │   │       │   │   └── not-found/  server-error/  offline/
│   │   │       │   ├── dialogs/   # CDK Dialog components, one folder per docs/mocks/dialogs entry
│   │   │       │   ├── shared/    # app-only helpers that are not components
│   │   │       │   └── app.config.ts  app.config.server.ts  app.routes.ts   # composition root binds API tokens
│   │   │       └── main.ts  main.server.ts  server.ts  index.html  styles.scss
│   │   ├── admin/                 # application: administrator area under /admin
│   │   │   ├── public/
│   │   │   └── src/app/           # shell/, pages/ (applications, artists, bookings, reviews, audit log),
│   │   │                          # dialogs/, app.config.ts, app.routes.ts
│   │   ├── components/            # library: every zm-* component, shared by both applications
│   │   │   └── src/
│   │   │       ├── lib/{component}/   # one folder per component (button, ticket, stub, toast, rating, ...)
│   │   │       ├── styles/        # global foundations: tokens, reset, utilities only
│   │   │       └── public-api.ts
│   │   ├── api/                   # library: HTTP access and the contracts pages depend on
│   │   │   └── src/
│   │   │       ├── lib/services/  # per subsystem: contract, injection token, HTTP implementation
│   │   │       ├── lib/http/      # HTTP plumbing: the SSR API-origin backend (ADR-0007)
│   │   │       ├── lib/models/    # request and response types (models/admin/ for admin endpoints)
│   │   │       ├── lib/auth/      # session, CSRF, interceptors, and route guards for both applications
│   │   │       ├── lib/theme/     # the light/dark theme service both applications bind (ADR-0023)
│   │   │       ├── lib/i18n/      # translation catalogues; date, money, and distance formatting
│   │   │       ├── lib/testing/   # in-memory fakes of each contract
│   │   │       └── public-api.ts
│   │   └── perf-test/             # application: renders component scenarios many times under the profiler
│   │       ├── README.md          # how to add a scenario, run it, and read the report
│   │       └── src/
│   │           ├── scenarios/     # one file per scenario; index.ts exports each
│   │           ├── renderer.ts    # reads ?scenario=&iterations=&renderType=, measures the render
│   │           └── main.ts
│   └── Dockerfile                 # zamaro-web image: serves zamaro (SSR) and admin under /admin
└── e2e/                           # Playwright, Chromium only; one Playwright project per application
    ├── playwright.config.ts
    ├── run-in-docker.mjs          # npm run test:docker: Playwright in the official Linux image (ADR-0014)
    ├── routes.manifest.ts         # every route in every state, shared by visual, a11y, and perf
    ├── pages/                     # page objects, one per screen; they own every selector
    │   └── admin/                 # page objects for the admin application
    ├── fixtures/                  # seeded data and test helpers
    ├── specs/{subsystem}/         # acceptance tests for the L2 criteria; no selectors
    ├── visual/                    # visual parity with docs/mocks at every breakpoint, light and dark
    ├── a11y/                      # axe WCAG 2.2 AA checks per route and theme
    ├── perf/                      # page-level layout-shift and loading-state checks
    ├── perf-test/                 # component perf-test runner for frontend/projects/perf-test
    │   ├── perf-test.mjs          # serves the build(s), profiles each scenario, writes the report
    │   ├── config/                # iterations, render types, runs, thresholds, excluded scenarios
    │   └── logfiles/              # perf-test.md, results.json, .cpuprofile files (git-ignored)
    └── package.json
```

## Backend conventions

- The backend is a Next.js application of route handlers only; it renders no pages (ADR-0027). Use the
  libraries ADR-0027 names (Drizzle, Zod, BullMQ, and the rest) rather than adding alternatives.
- Business rules live in domain services, actions, and jobs — not route handlers.
- The API does **not** run database migrations on startup. Run them explicitly.
- Seed data is idempotent and safe to re-run.
- Endpoints require authentication by default. Preserve intentional anonymous access and the request pipeline's step order when changing API auth.
- Keep request logging outside the pipeline's error-handling step so handled response statuses are logged correctly.
- User-owned data must remain scoped to the current user; resources belonging to other users or artists should never be exposed.

### Tests

Back end tests are Vitest integration tests against the running API, with real Postgres and Redis. Follow
the existing test patterns when adding coverage. Run `npm run lint`, `npm run format:check`,
`npm run typecheck` and `npm test` in `backend/`.

## Frontend conventions

- Prettier owns formatting and angular-eslint owns lint; CI fails on either. Run `npm run lint` and `npm run format:check` in the frontend workspace. The husky pre-commit hook fixes staged frontend files.
- Component selectors use `zm-*`; TypeScript class, file, and folder names omit the `Zm` prefix.
- Components should preserve the mock design's BEM classes and accessible state semantics; e2e locators depend on that parity.
- Keep component styles encapsulated and global styles limited to shared foundations and utilities.
- **Read design tokens by role, never by value.** Use the CSS custom properties from the design system (`var(--color-fg-default)` for text, `--color-accent` for fills, `--color-border-strong` for borders, `--space-*` for spacing), never hex values or magic numbers. Component-scoped knobs keep the `--zm-` prefix.
- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches; slots repeated per `@if` branch project into one branch only. On the consumer side, a `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011) — one `@if` per node.
- Every reusable `zm-*` component lives in the `components` library; the applications import it and never copy it.
- API services live in the `api` library with a contract and injection token; each application binds the tokens in its `app.config.ts`, and pages depend on the token, not the concrete implementation.
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

A component in the `components` library also MUST have a component requirements
document (CRD) in `docs/specs/components/` before it is built or changed. Write
it with the `writing-component-requirements-documents` skill
(`.claude/skills/writing-component-requirements-documents` and
`.agents/skills/writing-component-requirements-documents`), and only after L1/L2
and the design system or mocks exist. The CRD is complete enough to build the
whole component without later API changes, and its Given-When-Then criteria
are the slices' acceptance criteria. If a component's behaviour has to change,
the CRD changes first.

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

Back end: Vitest integration tests against the API. Front end: Playwright, using the
Page Object Model - one page object per screen, owning the selectors and the
interactions. Tests state intent; page objects know the DOM. Never put a
selector in a test.

### Never write architecture tests

Never add a test that asserts the shape of the codebase rather than its behavior:
no structure, layout, or naming tests; no banned-API scans; no traceability tests
that parse the specifications. Those constraints belong to the compiler, the
formatter, and review. A test suite exists to prove behavior.

## Component perf tests - mandatory

`frontend/projects/perf-test` and its runner in `e2e/perf-test/` measure what each
`zm-*` component costs to render. They follow Fluent UI's `apps/perf-test` and the
Saturdaze port of it: the scenario app renders a component many times in Chromium
with the V8 CPU profiler running, and the runner compares the change against its
base branch.

- **Every component has a scenario.** A change that adds a component to the
  `components` library MUST add `frontend/projects/perf-test/src/scenarios/<Name>.ts`
  in the same change and export it from `src/scenarios/index.ts`. The scenario's
  default export is a standalone component that renders one realistic instance,
  using the cast and copy from `docs/mocks/README.md`.
- **Composites have scenarios too.** The repeated, render-heavy compositions get
  their own scenario: an artist ticket in the Discover results, the profile
  setlist, the availability calendar month, the requests inbox row, and the
  dark theme (`data-theme="dark"`) wrapper. Add one whenever a new composition repeats on a screen.
- **Measure before you push.** A change to a component's template, inputs,
  styles, or change detection MUST run the perf test locally against the base
  branch with `--fail-on-regression`, and pass, before it is pushed.
- **Keep scenarios honest.** Tune a scenario's iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` so it renders in roughly
  100–300 ms. Never delete, exclude, or shrink a scenario, lower its iterations,
  or loosen a threshold in `e2e/perf-test/config/` to clear a flag.
- **The perf test is a required check.** The pipeline runs it on every pull
  request that touches `frontend/` or `e2e/perf-test/`: it builds this branch and
  the base branch with `NG_BUILD_MANGLE=0`, runs the runner with
  `--fail-on-regression`, publishes the comparison table in the job summary, and
  uploads the `.cpuprofile` files. A row flagged **Possible regression** (median
  render more than 10% and at least 1 ms slower, with no overlap between the
  pull request's runs and the base branch's runs) or a scenario that fails to
  render fails the check, and the pull request cannot merge.
- **Fix a flagged row; don't argue with it.** Open the scenario's profile, find
  the cost, and fix it. "Flaky" is not a diagnosis: the overlap rule already
  absorbs runner noise, so re-run the job at most once, and a second flag is real.
- **Intended cost needs a person.** When the extra render cost is the point of the
  change (a component that now renders more because the mock says so), say so in
  the pull request with the before and after numbers and what the profile shows.
  Only a maintainer may accept it, by adding the `perf-regression-accepted` label,
  which the pipeline honours for that pull request only. Agents never add that
  label.

Run it locally:

```bash
cd frontend
NG_BUILD_MANGLE=0 npx ng build perf-test
cd ../e2e
npm run perf-test -- --baseline <base-branch dist> --fail-on-regression   # --scenarios Button,Ticket to narrow
```

These are measurements, not tests: they assert no behavior, so they do not count
toward ATDD, and the "never write architecture tests" rule does not apply to them.
They do not replace the page-level checks in `e2e/perf/` or the Lighthouse and
bundle budgets in the pipeline.
