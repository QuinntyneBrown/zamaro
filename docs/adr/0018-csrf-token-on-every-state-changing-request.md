# ADR-0018: Every state-changing request carries the CSRF token, same-origin or not

**Date:** 2026-10-10
**Category:** security
**Status:** Accepted; amended by [ADR-0027](0027-nextjs-backend.md), which replaces the Laravel mechanisms named here
**Deciders:** Claude (M2 S3, CSRF and session limits)

## Context

L2-073.2: "Given a state-changing request without a valid CSRF token, when it arrives, then it is
rejected with 419 and nothing changes." `security/manage-sessions-and-csrf` has `ValidateCsrfToken`
compare `X-XSRF-TOKEN` with the session's token on every method but `GET`, `HEAD` and `OPTIONS`, and
ADR-0015 hands the token to Zamaro Web through the `XSRF-TOKEN` cookie.

Laravel 13 replaced `VerifyCsrfToken` with `PreventRequestForgery`, which also accepts a request whose
`Sec-Fetch-Site` header is `same-origin`, with no token at all. Browsers set that header themselves and
a page cannot forge it, so cross-site forgery is still stopped. But a same-origin request without a
token is accepted, which L2-073.2 forbids, and S3 found it in e2e: a spoiled token never produced a
419 from Chromium, so the recovery path could not happen in a modern browser.

## Decision

1. `App\Http\Middleware\ValidateCsrfToken` extends `PreventRequestForgery` and answers `false` from
   `hasValidOrigin()`: the token is checked on every state-changing request. `config/sanctum.php`
   names it as `validate_csrf_token`, so Sanctum's stateful stack runs it for Zamaro Web's origins.
2. A refused token renders as the `csrf-token-mismatch` problem (419, M2 D10), documented on every
   `POST`, `PUT`, `PATCH` and `DELETE` operation by `App\Support\OpenApi\CsrfMismatchResponses`.
3. Zamaro Web recovers once: `csrfRecoveryInterceptor` fetches `/sanctum/csrf-cookie` and repeats the
   request with the new token; a second 419 shows the D8 toast.
4. The feature tests switch Laravel's unit-test bypass off for the CSRF suite (`EnforcesCsrf`) and
   prove that a request marked `Sec-Fetch-Site: same-origin` without a token gets 419.

## Options Considered

### Option 1: token on every state-changing request (chosen)
- **Pros:** what L2-073.2 and the design say; one rule for every browser, including those that send no
  `Sec-Fetch-Site`; the recovery path is real and tested.
- **Cons:** a small subclass to keep in step with the framework's middleware.

### Option 2: Laravel 13's origin-aware default
- **Pros:** no code; same-origin requests never see a 419.
- **Cons:** contradicts L2-073.2; the token and the 419 recovery would only matter in browsers without
  `Sec-Fetch-Site`, so they would go untested in practice.

### Option 3: origin only (`useOriginOnly`)
- **Pros:** no token cookie at all.
- **Cons:** rejects browsers that send no `Sec-Fetch-Site`, and drops the token the design and
  ADR-0015 rely on.

## Consequences

### Positive
- Every state-changing call is checked the same way, whatever the browser.

### Negative
- A framework upgrade that changes `PreventRequestForgery` must be checked against this subclass; the
  CSRF suite fails if the bypass returns.
