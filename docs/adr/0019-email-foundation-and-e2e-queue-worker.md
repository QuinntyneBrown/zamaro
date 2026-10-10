# ADR-0019: Email foundation: catalogue-built Markdown mail on one base class, and an e2e queue worker

**Date:** 2026-10-10
**Category:** integration
**Status:** Accepted
**Deciders:** Claude (M2 S5, register a booker with consent)

## Context

Registration is Zamaro's first email (L2-022): a verification link for a new booker, and "Someone
tried to sign up with your email" for an address that already has an account. Every later email in
`notifications/send-transactional-emails` (booking changes, receipts, reminders) follows the same
rules, so the first one sets them:

- L2-063.2 asks for HTML and plain-text parts, and L2-111.1 for every user-facing word to come from
  the translation catalogue.
- The design queues each email on `notifications` (D18) and sends it only once the change it describes
  has committed.
- D16 settles the sender as `Zamaro <hello@zamaro.ca>`; the email vendor and DNS wait for M10.
- An email has no request, so it cannot take the site's address from one (ADR-0013 does that for
  crawler URLs).

S0 added Mailpit for local mail and gave `api-e2e` its own Redis prefix, but no worker reads that
prefix: the dev `worker` (Horizon) runs on the dev keys and database. So mail queued by the e2e API
was never sent, and the e2e mailbox fixture could not see it. M4 D6 (Processing states) and M7
(reminders, rating recalculation) need the e2e queue to run too.

## Decision

1. **`App\Notifications\TransactionalNotification`** is the base class of every Zamaro email. It
   implements `ShouldQueue`, uses the `mail` channel on the `notifications` queue with
   `afterCommit()`, and builds each email with `email($subject, $view, $data)`: a Markdown view in
   `resources/views/emails/` rendered through Laravel's mail components, which produce the HTML and
   text parts. Retries and failure reporting join it in M2 S6.
2. **Every word comes from `resources/i18n/en/emails.json`**, formatted as ICU messages by
   `Catalogue::message()`; views print variables only (the brand comes from `APP_NAME`). The same
   catalogue is served to the frontend at `/api/v1/i18n/{locale}`.
3. **The sender** is `MAIL_FROM_ADDRESS=hello@zamaro.ca` and `MAIL_FROM_NAME=Zamaro` (D16). **Links**
   use `zamaro.web_url` (`ZAMARO_WEB_URL`): `http://localhost:4200` in dev, `http://localhost:4000`
   for e2e, the public origin in production (M10).
4. **Mail goes over SMTP to Mailpit** locally and in e2e (ADR-0015 host ports); tests use the `array`
   mailer and read the sent MIME messages. The vendor adapter replaces the transport in M10 without
   touching a notification.
5. **`worker-e2e`** is a compose service in the `e2e` profile that runs
   `php artisan queue:work --queue=high,notifications,default` with the same environment as `api-e2e`
   (one `x-e2e-environment` anchor: database, cache and Redis prefixes, frozen clock, raised limits,
   web URL). Specs wait for mail with `waitForEmail()`, filtered by recipient. Like `api-e2e`, it
   keeps the code it started with, so restart both after a PHP change.

## Options Considered

### Option 1: a `worker-e2e` service (chosen)
- **Pros:** e2e runs the queue as production does, after commit and in its own process; the frozen
  clock and the e2e database apply to jobs too; M4 D6 and M7 reuse it.
- **Cons:** one more container to start with `--profile e2e`, and to restart after PHP changes.

### Option 2: `QUEUE_CONNECTION=sync` on `api-e2e`
- **Pros:** nothing extra to run; mail is sent before the response.
- **Cons:** every request waits for SMTP; `afterCommit` and queue names go untested; delayed and
  retried jobs (S6, M7) cannot work.

### Option 3: Horizon for e2e
- **Pros:** the same supervisor as dev.
- **Cons:** Horizon's own keys use `HORIZON_PREFIX`, not `REDIS_PREFIX`, so a second Horizon would meet
  the dev one's supervisors and metrics in the shared Redis; nothing in e2e needs its dashboard.

### Option 4: build emails in PHP or Blade text
- **Pros:** fewer files.
- **Cons:** words outside the catalogue break L2-111.1, and S6's `i18n:check` would flag them.

## Consequences

### Positive
- A new email is a subclass, a Markdown view and catalogue keys; HTML and text parts, the queue, the
  sender and the after-commit rule come with the base class.
- e2e can assert real mail end to end: subject, sender, both parts and the link.

### Negative
- Copy for emails lives in the same catalogue the frontend downloads, which grows it slightly.
- The frozen clock in `worker-e2e` means a delayed job never becomes due in e2e; backoff is proven in
  the backend tests (S6).

### Risks
- A long-running worker with stale code can pass or fail e2e for the wrong reason; the compose comment
  and this ADR say to restart it with `api-e2e`.

## Implementation Notes

- `docker compose --profile e2e up -d` starts `api-e2e` and `worker-e2e`; Playwright's global setup
  reseeds the database and clears Mailpit.
- Models of timestamptz columns written by the application (`ConsentRecord`,
  `EmailVerificationToken`) set `$dateFormat = 'Y-m-d H:i:sO'`, so Toronto times are stored with their
  offset rather than read back as UTC.

## References

- `docs/detailed-designs/notifications/send-transactional-emails/README.md`
- `docs/detailed-designs/accounts/register-booker/README.md`
- ADR-0002 (compose and fakes), ADR-0013 (origins), ADR-0015 (sessions, Mailpit ports)
- M2 plan D16, D18; M4 plan D6
