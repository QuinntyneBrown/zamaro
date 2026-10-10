# ADR-0009: Upgrade to Laravel 13 and drop the ignored advisories

**Date:** 2026-10-10
**Category:** backend
**Status:** Accepted (supersedes [ADR-0004](0004-stay-on-laravel-11-with-ignored-advisories.md))
**Deciders:** Project owner

## Context

ADR-0004 kept Laravel 11 because AGENTS.md named it, and ignored seven framework advisories by ID to do so,
a recorded exception to L2-078. Laravel 11's security fixes ended in March 2026 (M9 plan, D18). The supported
major is now Laravel 13, which still runs on PHP 8.3. The codebase is at its smallest now, with M1's API and 70
Feature tests, so upgrading now costs less than at any later milestone.

## Decision

Move the API to `laravel/framework` ^13.0 on PHP 8.3, with `laravel/tinker` ^3.0 and `phpunit/phpunit` ^12.0.
Remove the seven advisory IDs from `backend/composer.json` (`config.audit.ignore` and
`config.policy.advisories.ignore-id`), so `composer audit` fails on any advisory again, as L2-078 requires.

## Options Considered

### Option 1: Stay on Laravel 11 until M9
- **Pros:** No change now.
- **Cons:** Eight milestones would be built on an unsupported framework with known advisories. The upgrade
  would grow with every milestone.

### Option 2: Upgrade now, before M2 (chosen)
- **Pros:** Supported framework, a clean audit, and every later milestone builds on it.
- **Cons:** Departs from the stack AGENTS.md and the designs name, so they are updated.

## Consequences

### Positive
- `composer audit` reports no advisories, with no ignore list.
- No application code needed to change: the `bootstrap/app.php` middleware order, the problem-details
  renderer, Scramble and Horizon behave as before.

### Negative
- Designs that say "Laravel 11" are now out of date. Read them as "the supported Laravel major".

### Risks
- Packages added in later milestones must support Laravel 13. Check this before adding one.

## Implementation Notes

- Done with `composer update -W` inside the `api` container. All 70 backend Feature tests and their OpenAPI
  contract assertions pass, `scramble:export --fail-on-unknown` succeeds, and the 39 Playwright tests pass.
- AGENTS.md and README.md now name Laravel 13.
- ADR-0004's note to keep the CI audit using its ignore list no longer applies: the audit runs with no ignores.

## References

- L2-078; M9 plan D18; https://laravel.com/docs/releases
