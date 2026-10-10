# ADR-0006: OpenAPI 3.1 generated from code with Scramble; contract tests validate with opis

**Date:** 2026-10-09
**Category:** backend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

L2-095.3 requires an OpenAPI 3.1 document generated in CI and contract tests confirming that responses
match it. `operations/apply-api-conventions` names an `AssertsOpenApiContract` trait used by every API
feature test, but leaves the generator and the validator library `<TO SUPPLY>`. The first documented route
is `GET /api/v1/i18n/{locale}` (M1, slice S2).

## Decision

1. **Generator: `dedoc/scramble` (^0.13).** It infers the document from routes, FormRequests, resources
   and return statements, with no annotations to keep in sync, and emits OpenAPI 3.1. It is a runtime
   dependency, because `App\Support\OpenApi\ProblemDetailsResponses` extends it. Its `/docs/api` UI stays
   behind Scramble's default gate (local environment only).
2. **`api_path` is `api/v1`.** Paths are documented as `/i18n/{locale}` under the server `/api/v1`.
3. **Errors are documented as problem details.** `ProblemDetailsResponses` replaces Scramble's
   `{message}` error bodies with the `application/problem+json` shape that `ProblemDetailsRenderer`
   returns (ADR-0005).
4. **Validator: `opis/json-schema` (^2.6, dev).** OpenAPI 3.1 schemas are JSON Schema 2020-12, which opis
   supports. `tests/Concerns/AssertsOpenApiContract::assertMatchesContract($response)` generates the
   document once per test run. It checks that the operation, status and content type are documented,
   then validates the body against the documented schema, resolving `$ref`s inside the document.
5. **CI** runs `php artisan scramble:export --fail-on-unknown` after the tests, so an undocumented
   (`UnknownType`) schema fails the build. The exported file is `backend/storage/app/openapi.json`, which
   is git-ignored.

## Options Considered

### Option 1: Hand-written `openapi.yaml` with `league/openapi-psr7-validator`
- **Pros:** Design-first.
- **Cons:** It drifts from the code, and the validator supports only OpenAPI 3.0.

### Option 2: Scramble and opis (chosen)
- **Pros:** The document follows the code, and the contract tests catch inference mistakes. The first run
  caught `messages` documented as an array instead of a map.
- **Cons:** Inference sometimes needs a hint. Map-shaped values need an `@var array<string, T>`
  docblock on the array item.

## Consequences

### Positive
- Every API feature test can assert the contract with one call.

### Negative
- Scramble is a 0.x package, so minor versions may change the document shape. It is pinned to ^0.13.

### Risks
- Statuses with no body (304) are not documented by Scramble, so contract assertions apply only to
  documented statuses.

## Implementation Notes

Generating the Angular types from the document remains `<TO SUPPLY>`. Until then, the `api` library's
models are written by hand.

## References

- `docs/detailed-designs/operations/apply-api-conventions`
- ADR-0005
