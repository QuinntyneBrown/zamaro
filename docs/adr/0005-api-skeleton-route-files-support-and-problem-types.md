# ADR-0005: API skeleton: route files, `app/Support`, problem types and health responses

**Date:** 2026-10-09
**Category:** backend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

Milestone 1, slice S1 builds the API foundation from `operations/monitor-health-and-errors` and
`operations/apply-api-conventions`. Those designs leave several choices open (`<TO SUPPLY>`): property
casing, the problem type URI base, the health response keys and readiness timeouts. AGENTS.md also names
only three route files and has no home for code that belongs to no subsystem, such as the RFC 9457
problem details classes.

## Decision

1. **Route files.** `routes/api.php` holds signed-in `/api/v1` routes (`apiPrefix: 'api/v1'`) and
   `routes/api_public.php` holds intentionally anonymous ones under the same prefix and `api` group. A
   fourth file, `routes/health.php`, holds `/health/live` and `/health/ready` with no middleware group, so
   the probes skip session, CSRF and rate limits. `routes/web.php` and Laravel's `/up` route are removed:
   the backend serves no web pages.
2. **`app/Support/`** holds cross-cutting code that belongs to no subsystem, starting with
   `Support/Problems/{ProblemType, ProblemDetails, ProblemDetailsRenderer}`.
3. **Readiness checks** live in `app/Services/Operations/Readiness`. `DatabaseCheck` runs `SELECT 1`;
   one `RedisCheck` class covers both the `cache` and `queue` checks, which differ only in the connection
   they PING.
4. **Problem details.** Every exception renders as `application/problem+json`, whatever the `Accept`
   header. Type URIs are `{config('zamaro.problems.base_uri')}/{slug}`, defaulting to
   `{APP_URL}/problems`. HTTP errors with no Zamaro meaning (405 and similar) use `about:blank` and the
   HTTP reason phrase as title. A 500 never carries the exception message or trace, even with
   `APP_DEBUG=true`. `ProblemType` gains a case only when a test needs it.
5. **JSON properties are camelCase.** Health responses are `{"status":"ready"}` or
   `{"status":"not ready","failed":[...]}`.
6. **Request logs** keep Monolog's `JsonFormatter` shape on the `stderr` channel: fields under `context`,
   and `request_id` under `extra`, where Laravel's `Context` puts it on every log line and queued job.

## Options Considered

### Option 1: Health routes in `bootstrap/app.php` or the `api` group
- **Pros:** No new route file.
- **Cons:** Inline closures in bootstrap hide routes; the `api` group would bring the `/api/v1` prefix
  and future rate limits.

### Option 2: A dedicated `routes/health.php` with no group (chosen)
- **Pros:** The probes are easy to find and keep only the global middleware (request ID, request log).
- **Cons:** One more route file than AGENTS.md listed; the tree is updated.

## Consequences

### Positive
- Every response, including errors, carries `X-Request-Id`, and the same ID appears in the problem body
  and in the JSON log line.
- The compose `api` healthcheck (`/health/ready`) now passes.

### Negative
- A hung (rather than refused) Redis or Postgres can hold `/health/ready` for several seconds: no
  per-check timeout is set yet. With Redis stopped, a probe took about 6 s locally.

### Risks
- `CORS` uses Laravel's default (`*` on `api/*`); it must be tightened when session cookies arrive in M2.

## Implementation Notes

Scope moved out of S1 because no S1 endpoint can prove it: OpenAPI generation and
`AssertsOpenApiContract` (S2), the 422 `errors` object (S4), `CursorPaginatedResource` (S9),
`auth:sanctum` on `routes/api.php`, `EnsureJsonRequest` (415) and log redaction (M2). Readiness
timeouts are set with the hosting platform's probe settings (M10).

## References

- `docs/detailed-designs/operations/monitor-health-and-errors`
- `docs/detailed-designs/operations/apply-api-conventions`
- RFC 9457, Problem Details for HTTP APIs
