# ADR-0028: Backend tests run in-process on PGlite with in-memory fakes

**Date:** 2026-10-16
**Category:** backend
**Status:** Accepted (amends [ADR-0027](0027-nextjs-backend.md): the testing row and backend checks; amends [ADR-0002](0002-compose-dev-environment-and-vendor-ports.md): tests no longer run in Compose)
**Deciders:** Project owner

## Context

ADR-0027 made the backend's tests Vitest integration tests that call a running API over HTTP against a
real Postgres and Redis, run from inside the `api` container. The first slices of the Node port were
built that way: a harness that reset the test database, built the API, started it as a process and
spawned another instance for every test that needed a different environment. Each run took a build and
several process starts, needed Docker, and shared one database between test files.

The project owner decided that backend tests must use mocks: no Postgres and no Redis in the test run.

## Decision

1. **Tests run the route handlers in-process.** A test router in `tests/support/app.ts` maps a path to
   the `route.ts` module as Next.js would (static segments first, then `[param]`, then `[...rest]`),
   builds a `NextRequest`, and calls the exported method through the request pipeline. Nothing is
   spawned or built; `next build` is CI's job.
2. **The database is PGlite**, an in-process, in-memory Postgres. Each test file migrates a fresh
   instance with the real SQL migrations in `database/migrations`, so enums, partial unique indexes,
   check constraints, the append-only triggers and the retention role behave as in production, and seeds
   it with `db:seed` when it needs the cast. `src/server/db/client.ts` exposes `useDatabase()` so the
   test binds the PGlite provider; the application binds postgres.js. Raw reads go through `rows()`,
   which normalises the two drivers' result shapes.
3. **Everything Redis held goes behind a port with an in-memory fake**: sessions, the CSRF token store,
   rate limiters, the cache and the job queue each get a contract in `src/server/contracts/`, a Redis
   adapter in `src/server/integrations/` and an in-memory fake in `src/server/integrations/*/fake-*.ts`
   that tests bind. Readiness checks are a port too (`HealthCheck`): tests bind checks that pass or fail
   by name; the Postgres and Redis pings are thin adapters exercised by the deployed health probe.
4. **Outside vendors stay deterministic fakes** (ADR-0002), bound by tests through the same
   `use*()` seams as the application's composition root.
5. **The OpenAPI contract is built in-process** from the same operation list the `openapi:export`
   script writes, and every test that reads a documented response checks it (L2-095.3).
6. **Test environment** comes from `tests/setup/env.ts`, a Vitest setup file: the frozen clock, the
   suite's own field key, the cast password, a temporary storage root per test file and dummy
   connection strings. A test that needs a different setting changes `process.env` and calls
   `reloadConfig()`.
7. **Backend checks** are `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` and
   `npm run openapi:check`, all inside `backend/` and without Docker. Compose keeps Postgres, Redis and
   the API for running the application and the e2e suite.

## Options Considered

### Option 1: Integration tests against the running API with real Postgres and Redis (ADR-0027)
- **Pros:** Proves the whole stack, including the driver and the server.
- **Cons:** Needs Docker, a build and process starts per run; one shared database; the project owner
  ruled it out.

### Option 2: Hand-written in-memory repositories behind ports
- **Pros:** No database engine in tests at all.
- **Cons:** Every constraint the schema enforces would be re-implemented in the fakes, and every query
  written twice. The largest rewrite, and the fakes drift from the SQL.

### Option 3: PGlite in-process with ports for Redis-backed concerns (chosen)
- **Pros:** The real migrations and SQL run; tests are isolated per file and need no infrastructure;
  the ports for Redis-backed concerns are the same seams the vendor fakes already use.
- **Cons:** The postgres.js and ioredis adapters are exercised only by running the application; a
  behaviour that differs between PGlite and a Postgres server would pass the suite.

## Consequences

### Positive
- `npm test` runs anywhere Node runs, in seconds, with one fresh database per file.
- Rate-limit, session and queue tests no longer need their own API processes or Redis keyspaces.

### Negative
- Every Redis-backed service and vendor needs its fake kept faithful to the port.
- The deployed readiness probe is the only check of the real database and Redis pings.

### Risks
- PGlite follows Postgres closely but not completely; a migration that PGlite cannot run fails the
  suite and must be written another way or proven in CI's migration job.

## Implementation Notes

- The committed integration tests of the port's first slices (health, API conventions, database
  scripts, the seed, `cast:booker`) are converted in the same change.
- `tests/feature/{subsystem}/` keeps the subsystem layout; `tests/support/` holds the router, the
  database, the log capture and the contract check.

## References

- ADR-0002, ADR-0006, ADR-0027; AGENTS.md; `.claude/references/definition-of-done.md`
- https://pglite.dev, https://orm.drizzle.team/docs/connect-pglite
