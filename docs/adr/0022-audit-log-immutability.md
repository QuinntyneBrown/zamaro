# ADR-0022: The audit log is append-only in the model, in a trigger, and through one retention role

**Date:** 2026-10-13
**Category:** security
**Status:** Accepted
**Deciders:** Claude (M3 S1, audit entries: record them, refuse changes)

## Context

L2-069.2 says no operation in the application changes or deletes an audit entry, for anyone, and
L2-069.3 says entries are deleted after 2 years by a scheduled job. M2 (D22) created `audit_entries`
with a trigger that refuses every `UPDATE` and `DELETE`, so the retention job could not run at all.
`administration/record-audit-log` asks for a model guard, a trigger with one exception, and a
`zamaro_audit_retention` role. The M3 plan put that role in the Postgres init script, which runs only
when a data volume is first created; databases made before M3 would never get it.

The design also asks for the client's address "through the trusted-proxy configuration". Nothing
trusted a proxy, and the web app's SSR server did not forward the browser's address.

## Decision

1. **The model refuses.** `AuditEntry` throws `ImmutableAuditEntry` from its `updating` and `deleting`
   events. No route, controller or action changes or deletes an entry.
2. **The database refuses.** The `audit_entries_append_only` trigger refuses every `UPDATE`, and every
   `DELETE` unless `current_user` is `zamaro_audit_retention`.
3. **The retention role is made by a migration**, not the init script: `CREATE ROLE ... NOLOGIN` when
   it does not exist, then `GRANT SELECT, DELETE ON audit_entries`. It has no `UPDATE` privilege, so it
   cannot change an entry even before the trigger runs. `audit:prune` (M3 S5) switches to it with
   `SET LOCAL ROLE` inside its transaction; no second password or connection is needed while the
   application connects as the database owner.
4. **Context is redacted** by the same `RedactSensitiveData` that cleans log lines, so a `password` or
   a token in an entry's context is stored as `[REDACTED]`.
5. **Addresses come through trusted proxies.** `TRUSTED_PROXIES` (IPs or CIDR ranges) feeds Laravel's
   `TrustProxies`; empty trusts no one. Compose trusts Docker's network for the e2e API, `.env.example`
   does the same for dev, and phpunit trusts `10.0.0.0/8`. The SSR server's `/api` proxy sends
   `X-Forwarded-For` (`xfwd`).
6. **The code step is its own entry.** A code sign-in writes `auth.mfa_challenge` and then
   `auth.sign_in`; a wrong code writes `auth.mfa_challenge` with outcome `failed` (it was
   `auth.sign_in_failed`). Role grants go through `GrantRole`, which writes `user.role_changed`, with no
   actor when the system grants it.

## Options Considered

### Option 1: model guard, trigger with one role, role made by a migration (chosen)
- **Pros:** works on every existing database; the guarantee holds even for raw SQL; the role can delete
  but never update.
- **Cons:** while the application connects as the owner (a superuser locally), it could itself
  `SET ROLE` and delete. The trigger is a guard against mistakes, not against a compromised app.

### Option 2: a separate login role and connection for retention
- **Pros:** the application role could be denied `DELETE` entirely.
- **Cons:** needs a second secret and owner/runtime role split in every environment; that split is
  M10's (production readiness).

### Option 3: the init script (the plan's)
- **Cons:** never runs on an existing volume, so dev and CI databases would differ.

## Consequences

### Positive
- `audit:prune` can be built in S5 without touching the trigger again.
- Admin sign-ins in the log show the person's address, not the SSR server's.
- Anonymous rate limits now count each browser behind the SSR server separately.

### Negative
- M10 must split the owner and runtime roles and grant `zamaro_audit_retention` to the runtime role for
  the guarantee to hold against the application itself.
- The action names keep M2's `auth.two_factor_enabled` and `auth.two_factor_disabled`, not the design's
  `auth.mfa_enabled` and `auth.mfa_disabled`.

## References

- `docs/detailed-designs/administration/record-audit-log/README.md`
- M2 plan D22; M3 plan S1; ADR-0021
