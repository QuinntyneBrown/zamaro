# ADR-0002: Docker Compose dev environment; outside vendors behind ports with fakes

**Date:** 2026-10-09
**Category:** infrastructure
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

The backend is Laravel on PHP 8.3, but the development machine (Windows) has neither PHP nor Composer.
The designs name more than a dozen outside services (routing, geocoding, payments, email, malware scan,
video transcoding, bot challenge, CDN purge, error tracking) and every vendor is still `<TO SUPPLY>`.

## Decision

1. Local development and tests run in Docker Compose: Postgres 16, Redis 7, and the `zamaro-api` image
   running as API, Horizon worker and scheduler. Composer and artisan run inside the container.
   (Amended 2026-10-09: the e2e API service `api-e2e` was removed; Playwright mocks the backend with a
   stub API, as AGENTS.md requires.) Compose files live at the repository root; Docker assets for the backend live
   in `backend/docker/`.
2. Each outside vendor is a port in `backend/app/Contracts` with a deterministic fake in
   `backend/app/Integrations/{Area}/Fake*`. Tests and local development bind the fakes. A fake bound in
   production throws at boot. Real adapters arrive in M10, one ADR per vendor choice.
3. Ports planned: `RoutingProvider` (a matrix call: one origin, many destinations), `Geocoder`,
   `PaymentGateway`, `MediaScanner`, `VideoTranscoder`, `BotChallenge`, `CdnPurger`, `ErrorReporter`.
4. Object storage (S3-compatible) is deferred to S6, when media first needs it. MinIO's images are no
   longer pullable (`minio/minio` is withdrawn from Docker Hub and the `quay.io` tag returns 401); RustFS,
   SeaweedFS and Garage all pull and are the candidates.

## Options Considered

### Option 1: Install PHP and Composer on Windows
- **Pros:** Fast artisan commands.
- **Cons:** Differs from the production image; every contributor repeats the setup.

### Option 2: Docker Compose (chosen)
- **Pros:** Matches the production container; nothing installed on the host.
- **Cons:** Bind mounts are slow on Windows (mitigated by a named volume for `vendor/`).

## Consequences

### Positive
- Features can be built and tested end to end before any vendor is chosen.
- Acceptance tests are deterministic.

### Negative
- Each fake must be kept faithful to its port's contract.

### Risks
- A real vendor may not fit the port; the port is revisited in the adapter's ADR.

## Implementation Notes

On Windows set `MSYS_NO_PATHCONV=1` when mounting paths from Git Bash. Add `docker-compose.yml` and
`backend/docker/` to the AGENTS.md tree.

## References

- `docs/detailed-designs/operations/back-up-deploy-and-host`
