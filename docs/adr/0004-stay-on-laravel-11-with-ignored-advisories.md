# ADR-0004: Stay on Laravel 11 and ignore its seven blocking advisories by ID

**Date:** 2026-10-09
**Category:** backend
**Status:** Accepted
**Deciders:** Project owner

## Context

AGENTS.md specifies Laravel 11 on PHP 8.3. Composer 2.10 refuses to resolve every `laravel/framework` 11.x
release (v11.31 through v11.57) because each is affected by seven security advisories
(PKSA-d5tc-s1qs-h781, PKSA-m5cs-t1y6-qpcs, PKSA-3r5d-mb8f-1qw9, PKSA-mdq4-51ck-6kdq, PKSA-8qx3-n5y5-vvnd,
PKSA-q46n-4fdk-zjr4, PKSA-qzrn-rnz3-85w1). L2-078 requires the build to fail on high or critical
dependency vulnerabilities.

## Decision

Stay on Laravel 11 as specified. The seven advisories are ignored by ID in `backend/composer.json`
(`config.audit.ignore`), so any other advisory against any package still fails the build. This is a
knowing, recorded exception to L2-078.

## Options Considered

### Option 1: Move to the current Laravel release
- **Pros:** No known advisories; supported.
- **Cons:** Departs from AGENTS.md and every design that names Laravel 11.

### Option 2: Stay on Laravel 11, ignore by ID (chosen)
- **Pros:** Matches the documented stack.
- **Cons:** Ships known vulnerabilities in the framework.

## Consequences

### Positive
- The documented stack is respected.

### Negative
- The framework carries known advisories until upgraded.

### Risks
- The advisories may be reachable in this application. Review each one and decide on an upgrade before
  any production deployment (M10).

## Implementation Notes

Revisit this ADR at the start of M10 and at every Laravel security release. The CI audit step must use the
same ignore list, not disable auditing.

## References

- L2-078; https://packagist.org/security-advisories/
