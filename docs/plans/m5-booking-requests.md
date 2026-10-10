# Milestone 5 plan: booking requests

**Status:** Not started. Depends on M1 (all of S0–S15; S16 if its toasts were built), M2, M3 and M4.

## Context

**What exists when M5 starts:**
- **From M1, as built:**
  - `bookings` has only `number` (unique), `artist_id`, `status`, `event_date`, `kind`, `church_name`, `church_city` and timestamps. Status values are the lowercase `BookingStatus` cases (`requested` … `cancelled`). The partial unique index is called `bookings_one_confirmed_per_date`.
  - `booking_transitions` has `from_status`, `to_status`, `actor_kind`, `actor_id`, `reason` and `occurred_at`. The headliner counts the transitions to `confirmed`.
  - From S4, S14 and S15: `AvailabilityService::isFree()`, `ListTourDates`, the `CancellationPolicy` value object and `SimilarArtistFinder`.
  - The profile stub (S14) validates the date, but its submit sits behind the `bookingRequests` flag, which is off (a user decision). There is no `/artists/:slug/book` route.
  - Test setup: `FakeRoutingProvider` (km only); the e2e API frozen at Fri 9 Oct 2026 10:00 through `ZAMARO_FROZEN_NOW`; a `routes.manifest.ts` whose `RouteState` has only `path`, `app` and `mock`.
- **From M2:**
  - Sign-in, sessions, CSRF and `auth:sanctum` on `routes/api.php`.
  - The Booker role, and `EnsureEmailIsVerified` (403 `email-not-verified`).
  - Church profile and the add-church dialog (L2-024), and the artist contact phone in account settings (L2-025.4).
  - Encrypted fields and the rate-limiter plumbing.
  - The email foundation: `TransactionalNotification`, `EmailMessage`, Mailpit and `i18n:check`.
  - Horizon with a `notifications` queue.
- **From M3:** administrators (Priya Nair) and `RecordAuditEntry`.
- **From M4:**
  - `EnsureArtistRole`, the artist shell and the dashboard at `/artist`, whose "Needs your reply" rows read seeded Requested bookings.
  - The availability calendar with Requested counts (L2-056).

**Goal:** a booker can send a request from a profile, follow it on `/bookings` and `/bookings/:number`, message the artist and withdraw it. The artist can answer it from `/artist/requests` and `/artist/bookings/:number`. Unanswered requests expire, and finished Confirmed bookings complete, on schedule. Every transition emails the right party.

The submit flag turns **on**, and no money moves in M5. The Pay deposit button stays behind a new `payments` flag until M6. Each slice follows the M1 loop: Given-When-Then criteria, a red acceptance test, the build, the regression set, then a commit.

## Entry criteria and dependencies
- **M1:**
  - S14 is merged: the stub, tour dates, `CancellationPolicy` and the off `bookingRequests` flag.
  - S15 is merged: `SimilarArtistFinder` and the `zm-error-page` not-found state.
  - Miriam's seeded ticket is ACT-0154.
- **M2:**
  - `POST /api/v1/auth/*`, `GET /api/v1/me`, and the church endpoints with the add-church dialog.
  - The `email-not-verified` problem and its Resend action.
  - e2e storage states for Naomi Fraser, Abigail Mensah, Miriam Haile, Grace Ampofo (a second booker) and Priya Nair.
  - Mailpit running in compose, with an HTTP API on :8025.
- **M3:** administrator accounts exist, so `AlertAdministrators` has recipients.
- **M4:**
  - `artists.contact_phone` (encrypted) and `EnsureArtistRole`.
  - The dashboard reads `bookings` by status.
  - If M4 built a request row for the dashboard, M5 S9 promotes it to `zm-request-row` rather than building a second one.
- **Tooling:** the perf runner's baseline is `main` after M4. Run `npm run tokens:sync` if tokens changed.

## Decisions to make or confirm
"OK" marks the decisions that need the user's sign-off before their slice starts. Money rules always need it.

| # | Decision | Recommended default | OK |
|---|---|---|---|
| D1 | When the request flow goes live | `bookingRequests` turns on in dev and e2e in S2. Production keeps it off until M6 can take deposits, and M10 supplies the real payment adapter, because production refuses to boot with fakes. | **Yes** |
| D2 | Pay deposit while M6 is not built | A new `payments` flag (off) hides the Pay button on `/bookings/:number`. The `/bookings` "Pay $225 deposit" next action still links to the booking page. | **Yes** |
| D3 | Deposit and balance shown on the request page and the booking page | Deposit = 25% of the quoted price + 25% of the HST, each rounded half-up to the cent. Balance = total − deposit. $650 gives $162.50 / $487.50; $650 + 13% HST ($84.50) gives $183.63 / $550.87. | **Yes** |
| D4 | Platform fee and payout shown to the artist | 8% of the quoted price before HST, rounded half-up. The payout is the total minus the fee: $650 gives a $52 fee and a $598 payout. Whether the fee also applies to HST is settled in M6 D3, and both milestones use the same rule. | **Yes** |
| D5 | Where an artist's HST number lives | No design captures it. Add a nullable `artists.hst_number` (S1) with no editing UI. The cast has none ("Abigail has no HST number"), and tests set it through factories. A design and mock are needed before any UI. | **Yes** |
| D6 | Price figures on the request page before a booking exists | New public `GET /api/v1/artists/{slug}/price-breakdown` returning `PriceBreakdownResource` (quoted, hst, deposit, balance). This keeps rounding on the server only. It fills a gap in `send-booking-request`, so update that design. | No |
| D7 | Response-deadline boundary | `respond_by` = created + 24 h when `event_starts_at − now < 7 × 24 h`, otherwise + 72 h. Both are computed in `America/Toronto` wall-clock time, so a request on Fri 30 Oct 10:15 a.m. is due Mon 2 Nov 10:15 a.m. across the DST change. | No |
| D8 | Deposit deadline stored on accept | `deposit_due_by` = the earlier of `accepted_at + 48 h` and `event_starts_at − 12 h` (`pay-deposit`), stored in S11 | No |
| D9 | Booking number sequence | A Postgres sequence `booking_number_seq` with `ZAM-` and at least 4 digits. The generator skips numbers already taken. `CastSeeder` restarts the sequence at 114, so the first request in a fresh e2e database is ZAM-0114. | No |
| D10 | Daily request limit counting (L2-077.3) | Count bookings the booker *created* in a rolling 24 h (from `bookings.created_at`), so 409s and 422s don't use up the allowance. The 11th is refused with 429 `booking-request-limit`. One administrator alert per booker per Toronto day. | **Yes** |
| D11 | List page size and tab counts | 20 per page for `/bookings` and `/artist/requests`. Each list returns `meta.counts` per tab, because the mocks show "Upcoming 3", "Past 3" and "New 3" (a gap against "no totals unless asked"). | No |
| D12 | Time-left wording | Round up to the hour. "{d} days {h} hr left" or "{d} day left" when the hours are 0; "{h} hr {m} min left" under a day; "{m} min left" under an hour. Refresh every minute. This reproduces the mocks at Fri 9 Oct 3:15 p.m. | No |
| D13 | Similar-artist rule (`<TO SUPPLY>`) | Free on the date, travels to the church, and shares at least one style. Order by shared styles, then rating, then distance; take 3. The cast styles must yield Hosanna Collective, Elijah Park and Daniel & Ruth Okonkwo for Riverside on Sat 14 Nov, as the declined mock shows. | **Yes** |
| D14 | 409 conflict problem type (`<TO SUPPLY>`) | `{base}/booking-transition-not-allowed`, with `currentStatus` and `bookingNumber` | No |
| D15 | 409 conflict toast copy (`<TO SUPPLY>`) | Danger toast titled "This booking just changed" with the body "It’s now {status}. We’ve reloaded it so you see the latest." It stays until dismissed. | **Yes** |
| D16 | Copy for a network failure on submit (not mocked) | The `book/error` alert pattern titled "Your request wasn’t sent", with "We couldn’t reach Zamaro. Nothing was sent, and everything you typed is still here." and Try again | **Yes** |
| D17 | Idempotency record retention (`<TO SUPPLY>`) | 7 days, pruned daily by `idempotency:prune`. The `bookings` unique index keeps protecting the booking after that. | No |
| D18 | Message polling interval (`<TO SUPPLY>`) | 30 s while the thread is visible, paused when the tab is hidden, and once immediately on focus | No |
| D19 | Obfuscated contacts (`<TO SUPPLY>`) | Redact "name at example dot com" and digit runs of 10 or more broken by spaces, dots or dashes. Never redact prices, times or dates; a test corpus lists both kinds. | **Yes** |
| D20 | Administrator's read-only thread (L2-045.4) | Move it to M8 with the admin booking page (`administration/support-bookings-and-payments`). Whether the admin sees the original or the recipient view is decided there. | **Yes** |
| D21 | In-app "new request" and "accepted" toasts (no push channel is designed) | M5 shows toasts only for the person's own actions, plus the time-based reply-by and deposit-due warnings drawn from data already on the page (S15). Event toasts for the other party wait for a notice-feed design. | **Yes** |
| D22 | Job and email backoff (`<TO SUPPLY>`) | `$tries = 5`, `backoff = [10, 30, 90, 270, 810]` seconds, on every lifecycle job and `TransactionalNotification` | No |
| D23 | Sending domain (`<TO SUPPLY>`) | `zamaro.ca`, from "Zamaro <bookings@zamaro.ca>", with replies to hello@zamaro.ca as in the mocks | **Yes** |
| D24 | Retention (`<TO SUPPLY>`) | `booking_transitions` kept for the life of the booking plus 7 years (the CRA records period); `email_messages` kept 13 months | **Yes** |
| D25 | 2-minute email alert threshold (`<TO SUPPLY>`) | Record the queued-to-sent gap now. The M10 alert fires when p95 is over 90 s for 10 minutes. | No |
| D26 | Drive time on the artist booking page ("about 35 min from Brampton") | `RoutingProvider` returns minutes as well as km. The fake uses the `CastRoutes` minutes, or `round(km × 0.8)` for unknown pairs. | No |
| D27 | e2e scenarios and clock travel | e2e-only routes `POST /__e2e/scenario`, `POST /__e2e/clock` and `POST /__e2e/artisan` (an allowlist of commands). They are registered only when `APP_ENV=e2e`, and boot fails if they are enabled in production. | **Yes** |

## Design conflicts

| # | Conflict | Resolution |
|---|---|---|
| C1 | **Idempotency is designed twice.** `send-booking-request` puts the key on `bookings` (`idempotency_key`, `request_fingerprint`), replays inside the action, sends `Idempotency-Replayed`, and answers a concurrent duplicate with the first booking. `show-loading-and-feedback` uses an `EnsureIdempotency` middleware with an `idempotency_keys` table and `Idempotent-Replayed`, and answers a concurrent duplicate with 409. | Use one mechanism: the middleware and table for bookings and payments, and the header `Idempotent-Replayed: true`. A concurrent attempt gets 409 `idempotency-request-in-progress`, which keeps the key so the retry replays. Keep `bookings.idempotency_key` with the unique index `(booker_id, idempotency_key)` as the database guard. Update both designs (S4 ADR). |
| C2 | The middleware stores every non-5xx response. That would replay `church-required` (409) after the booker adds a church, although the design resubmits with the same key. | Store only 2xx responses. Run again on any 4xx; `idempotency-key-reused` (422) is never stored. Update `show-loading-and-feedback`. |
| C3 | The key store's rules differ: "discard on any 4xx except 409 and 429" against "discard on success or field change". | Keep after a network error, 5xx, 409 or 429. Discard after 2xx, after any other 4xx, and whenever a field changes. |
| C4 | The designs use `gathering_kind`, capitalised statuses (`WHERE status IN ('Requested','Accepted')`) and the index name `bookings_one_confirmed_per_artist_date`. M1 built `kind`, lowercase values and `bookings_one_confirmed_per_date`. | Keep M1's names. Partial indexes use the lowercase values. Add a `CHECK` on the eight values (S1 ADR), and update `run-booking-lifecycle`, `send-booking-request` and `pay-deposit`. |
| C5 | The designs place pages in `features/bookings`, `features/artist-workspace` and `features/artist-profile`, with shared parts in `shared/booking` and `shared/feedback`. | ADR-0007 applies: `pages/{book,bookings,booking-detail,requests,request-detail}`, `dialogs/{withdraw-request,accept-request,decline-request}`, every presentational component as a `zm-*` in the components library, and the API clients in `api/lib/services/bookings`. |
| C6 | `AcceptBooking` refuses an already-booked date "without changing the booking", but the conflict mock says Living Waters' request "becomes Declined with the reason “Booked by another church”" and Pastor Femi sees 3 similar artists. | In one transaction, apply Requested → Declined (system actor, reason `booked-by-another-church`), then return 409 `already-booked`. M6's `DeclineCompetingRequests` normally prevents this state. Update `respond-to-booking-request`. |
| C7 | The booker's declined page shows a "Free on Sat 14 Nov" list of 3 similar artists, but `BookingResource` has no member for it (it was email-only). | Add `similarArtists` to `BookingResource` for Declined, computed by `SimilarArtistFinder` on read. M6 reuses it for artist cancellations. |
| C8 | `/bookings` shows amount paid from `payments` and `refunds`, but those tables belong to M6's designs. The mocks show ZAM-0097 "Paid $237.50" and ZAM-0061 "Paid $650". | S5 creates both tables with the `pay-deposit` schema and no writers, and seeds the cast's succeeded payments. |
| C9 | `AlertAdministrators` is designed in `collect-balance` (M6), but L2-077.3 needs it in M5. | Build it in S3 (`Actions/Admin/AlertAdministrators`, `admin_alerts`, `AdministratorAlertNotification`, kind `BookingRequestLimit`). M6 adds kinds. |
| C10 | The frozen e2e clock is Fri 9 Oct 10:00. The mocks have Naomi request at 10:15 a.m. and show time left as of about 3:15 p.m. | Scenarios set the API and browser clock per test: 10:15 for sending, 15:15 for the inbox states (D12). |
| C11 | Base seed versus mock numbers: every booking-detail mock reuses ZAM-0114, but the send flow must create it. ZAM-0121 is seeded in the cast but must not appear in the default inbox ("3 new"). | The base seed leaves both out. Named scenarios create ZAM-0114 in each state and ZAM-0121 for the conflict, and the D9 sequence makes a sent request ZAM-0114. |
| C12 | The composer help copy differs: the design says "{first name} gets an email at most every 15 minutes." The artist mock says "Plain text, 1 to 2,000 characters. Phone numbers and emails stay hidden until the booking is Confirmed." | Use the mock copy per page: the booker page keeps the 15-minute line, and the artist page shows the redaction line. |
| C13 | `SubmitButtonComponent` is designed as its own component; M1 has `zm-button`. | Add `busy` and `busyLabel` inputs to `zm-button` (`aria-busy`, `aria-disabled`, spinner). Re-run its perf scenario. |

## The booking state machine (M5)
`BookingStateMachine` is the only writer of `bookings.status`. Any pair not in this table gives 409 (D14) and leaves the status unchanged (L2-029.1).

| From | To | Actor | Trigger | Slice |
|---|---|---|---|---|
| — | Requested | Booker | `SendBookingRequest` (`start()`, from-status null) | S1 |
| Requested | Accepted | Artist | `AcceptBooking` | S11 |
| Requested | Declined | Artist | `DeclineBooking`, with a reason | S12 |
| Requested | Declined | System | Accept attempted on an already-booked date (C6), reason `booked-by-another-church` | S11 |
| Requested, Accepted | Withdrawn | Booker | `WithdrawBooking` | S8 |
| Requested | Expired | System | `ExpireBookingRequest` once `respond_by` passes | S13 |
| Confirmed | Completed | System | `CompleteBooking` 24 h after `event_starts_at` | S14 |
| Accepted | Confirmed, Expired, Declined | — | Allowed in the table but unused until M6 (deposit, deposit expiry, competing requests) | M6 |
| Confirmed | Cancelled | — | Allowed in the table but unused until M6 | M6 |

Terminal statuses: Completed, Declined, Withdrawn, Expired and Cancelled.

## Slices

#### S0 — e2e scenarios, clock travel and mailbox (test-only, outside ATDD)
- **API (`api-e2e` only):**
  - `routes/e2e.php` (D27) adds:
    - `POST /__e2e/scenario {name}`: truncates bookings, messages, idempotency, alerts and email rows, reseeds the base cast, then loads a named scenario class from `database/seeders/Scenarios/`;
    - `POST /__e2e/clock {now}`;
    - `POST /__e2e/artisan {command}`, allowlisted to `bookings:expire-requests` and `bookings:complete`.
  - The clock reads a Redis override before `ZAMARO_FROZEN_NOW`.
  - `api-e2e` runs `QUEUE_CONNECTION=sync` with mail going to Mailpit.
- **Scenarios** (also `php artisan zamaro:scenario {name}` for dev): `base`, `zam-0114-requested`, `zam-0114-accepted`, `zam-0114-declined`, `zam-0114-withdrawn`, `zam-0114-expired`, `zam-0121-already-booked`, `abigail-no-contact-phone`, `naomi-unverified`, `naomi-no-church`, `naomi-ten-requests-today`, `naomi-no-bookings`.
- **e2e:**
  - `fixtures/{scenario,mailbox,auth}.ts`, where the mailbox reads Mailpit's API.
  - A second Playwright project, `zamaro-bookings` (`specs/bookings/**`, `workers: 1`).
  - `RouteState` gains `as?: CastMember`, `scenario?: string` and `now?: string`.
- **ADR:** e2e scenarios, clock travel and mailbox.
- **Verify:** `npx playwright test --list` shows both projects. A scenario reset twice leaves the same row counts.

#### S1 — Send a request (API)
- **L2:** 028.1, 028.5, 029.3, 030 (response deadline), 063.1 (request created → artist), 063.2, 074.2, 075.
- **Behaviour:**
  - At Fri 9 Oct 10:15, Naomi (verified, Riverside) posts `{artist: "abigail-mensah", eventDate: "2026-11-14", gatheringKind: "worship-night", startTime: "19:00", message: "We’re hosting a worship night … call me on 905-555-0123."}`. The API answers 201 with:
    - `number: "ZAM-0114"` and `status: "requested"`;
    - `quotedPriceCents: 65000` and `hstCents: null`;
    - `respondBy: 2026-10-12T10:15:00-04:00`;
    - `eventStartsAt: 2026-11-14T19:00:00-05:00`.
  - One history row (null → requested, actor Booker Naomi). No `payments` row.
  - Abigail gets one email with HTML and text parts, "ZAM-0114" and a link to `/artist/bookings/ZAM-0114`, and no card fields.
  - Raising Abigail's From price to $700 afterwards leaves $650 on ZAM-0114 (L2-050). Editing Riverside's address keeps the snapshot (L2-024.3).
  - An event 5 days away gives `respondBy` = created + 24 h. A request on Fri 30 Oct 10:15 is due Mon 2 Nov 10:15 −05:00 (D7).
  - `eventDate` 2026-10-11 gives 422 `errors.eventDate`. A 2,001-character message gives 422 `errors.message`.
  - A guest gets 401. Abigail (artist role) gets 404.
- **Tests first:**
  - `tests/Feature/Bookings/SendBookingRequestTest.php`
  - `tests/Feature/Bookings/ResponseDeadlinesTest.php`
  - `tests/Feature/Notifications/BookingRequestedEmailTest.php`
  - `tests/Feature/Security/BookingRouteOwnershipTest.php`: the route-ownership fixture registry that every later slice appends to (L2-074.3).
- **Build:**
  - Migration `expand_bookings_for_requests`:
    - columns `booker_id`, `church_id`, `church_address`, `church_lat`, `church_lng`, `start_time`, `event_starts_at`, `quoted_price_cents`, `hst_cents`, `respond_by`, `deposit_due_by`, `accepted_at`, `decline_reason`, `decline_note`, `idempotency_key`, `request_fingerprint`;
    - a status `CHECK`;
    - the indexes `bookings_one_open_request` (partial unique on `booker_id, artist_id, event_date` where status in `requested` or `accepted`), `bookings_booker_idempotency_unique`, `bookings_requested_respond_by_idx`, `bookings_confirmed_event_start_idx`, `bookings_booker_event_date_idx` and `bookings_artist_requested_idx`;
    - `booking_number_seq`;
    - `artists.hst_number` (D5).
  - Enums: `ActorKind`, `DeclineReason`.
  - `Services/Bookings/{BookingStateMachine, TransitionActor, BookingDeadlines, BookingNumberGenerator}`.
  - `Services/Payments/PriceBreakdown`: quoted price and HST in this slice; deposit, balance, fee and payout in S2 and S9.
  - `Exceptions/InvalidBookingTransition`, rendered as the D14 problem.
  - `Actions/Bookings/SendBookingRequest`, `Requests/Bookings/CreateBookingRequest`, `Api/V1/Bookings/BookingsController@store`, `Resources/Bookings/BookingResource`.
  - `Policies/BookingPolicy::create`.
  - `Events/BookingRequested` (`ShouldDispatchAfterCommit`), `Listeners/Notifications/SendBookingEmails`, `Notifications/BookingRequestedNotification`, `Support/Mail/BookingEmailData`.
- **ADR:** booking schema on M1's names (C4), numbers (D9) and the state machine.
- **Components:** none.

#### S2 — Request to book page, with the flag on
- **L2:** 019.6, 028.1–2, 036.1 (summary figures), 044.1, 102.1, 105.1, 108.1, 109.1, 110.
- **Behaviour:**
  - On `/artists/abigail-mensah?date=2026-11-14`, "Request to book · Sat 14 Nov" now shows. It opens `/artists/abigail-mensah/book` carrying the date, kind and message draft.
  - The page reads "Request to book Abigail", "$650 · travel included · replies in 72 hours" and "✓ Abigail is free Sat 14 Nov".
  - Church: Riverside Community Church, 2150 Lakeshore Rd, Burlington ON, 905-555-0123, "Naomi Fraser, worship coordinator".
  - Summary (D6): "Quoted price, locked when you send" $650, deposit $162.50, balance $487.50, "Due today" $0, with "Nothing is charged until Abigail accepts and you pay the deposit. Cancel free up to 14 days before your event." and "Cancellation policy".
  - "Send request to Abigail" turns into "Sending request…" with `aria-busy`, and the fields become read-only.
  - The success view shows "Booking ZAM-0114", a Requested stamp, "Request sent to Abigail" and "Nothing has been charged. Abigail has until Mon 12 Oct, 10:15 a.m. to reply.". Its timeline reads "Requested", then "Abigail replies", then "Pay the $162.50 deposit", then "Worship night". It links "View booking ZAM-0114".
  - The success toast "Request sent to Abigail" reads "Booking ZAM-0114. Nothing is charged; she has until Mon 12 Oct, 10:15 a.m. to reply." and is announced.
  - Skeletons appear after 300 ms. A failed calendar load shows "We couldn’t open the booking form" with "Abigail’s calendar didn’t load, so we can’t check Sat 14 Nov yet. Nothing was sent.", Try again, and a way back.
  - A guest is sent to sign in and returns to the page.
- **Tests first:**
  - `tests/Feature/Bookings/PriceBreakdownTest.php`: $650 → 16250/48750; $650 + HST → 18363/55087.
  - `e2e/specs/bookings/send-booking-request.spec.ts`.
  - Page objects `pages/book.page.ts` (form and sent states) and `pages/toasts.ts` (the shared toast region, like `shell.ts`).
- **Build:**
  - `GET /api/v1/artists/{slug}/price-breakdown` (public, in `api_public.php`).
  - `pages/book/` (`BookRequestPage`, `RequestSentComponent`, `BookingRequestStore`), and the `artists/:slug/book` route behind the booker guard.
  - `api/lib/services/bookings` (`BookingsApi` contract, `BOOKINGS_API` token, `HttpBookingsApi`, `InMemoryBookingsApi`) and `api/lib/models/booking.ts`.
  - `ToastService` and `ToastRegionComponent`, if M1 S16 did not build them.
  - The `bookingRequests` flag on in dev and e2e (D1).
- **Components and scenarios:** `zm-stamp`, `zm-timeline`, `zm-receipt`, `zm-toast` and `zm-toast-region` (if new), and `zm-button` busy (C13). Scenarios `Stamp`, `Timeline`, `Receipt`, `Toast`, `ToastRegion`; re-measure `Button`.
- **Route states:**
  - `/artists/abigail-mensah/book?date=2026-11-14&kind=worship-night` (as Naomi, `base`, now 10:15) → `book/default.html`.
  - The same with a delayed calendar → `book/loading.html`.
  - The visual spec drives `book/submitting.html`, `book/success.html` and `book/error.html`.

#### S3 — Refused requests: duplicate, just booked, unverified, no church, daily limit
- **L2:** 022.4, 024.1, 028.3, 028.4, 077.3, 108.3.
- **Behaviour:**
  - **Duplicate** (`zam-0114-requested`): sending again gives 409 `already-requested`. The alert reads "You’ve already asked Abigail about this date." with "Your request ZAM-0114 for Sat 14 Nov is waiting for her reply until Mon 12 Oct, 10:15 a.m. Nothing new was sent." and "View booking ZAM-0114". The values are kept.
  - **Just booked:** after the page loads, a scenario confirms another church on Sat 14 Nov. Sending gives 409 `artist-not-free` with `nextFreeDates`.
    - The error summary reads "Your request wasn’t sent", and the field error "Abigail was just booked for Sat 14 Nov. Pick one of her next free dates.".
    - The chips are Tue 17 Nov, Wed 18 Nov and Thu 19 Nov. Sun 15 Nov is booked and Mon 16 Nov is her day off.
    - Choosing Tue 17 Nov shows "✓ Abigail is free Tue 17 Nov".
  - **Unverified** (`naomi-unverified`): 403. The alert reads "Verify your email to send this request" with "We sent a link to naomi.fraser@riversidecc.ca. Open it, then send again. Nothing was sent to Abigail, and everything you typed is still here." and Resend email. No booking row is created.
  - **No church** (`naomi-no-church`): 409 `church-required` opens the M2 add-church dialog. Saving resubmits with the same key and gives 201.
  - **Limit** (`naomi-ten-requests-today`): the 11th request gives 429 with "You’ve sent a lot of requests today. Try again tomorrow." and "Nothing was sent to Abigail. Everything you typed is still here, so you can send it once the day has passed.". Priya receives one alert email (D10).
- **Tests first:**
  - `tests/Feature/Bookings/RefusedBookingRequestsTest.php`
  - `tests/Feature/Security/BookingRequestLimitTest.php`
  - New cases in `send-booking-request.spec.ts`
- **Build:**
  - `AvailabilityService::nextFreeDates()`.
  - Problem types `already-requested`, `artist-not-free`, `church-required` and `booking-request-limit`.
  - The limiter (D10).
  - `Actions/Admin/AlertAdministrators`, the `admin_alerts` migration and `Notifications/AdministratorAlertNotification` (C9).
  - Frontend: the next-free-dates chips in `pages/book/`, and `FormErrorMapper` in `api/lib/http`.
- **Components and scenarios:** `zm-error-summary` (if absent) and `zm-date-swap`, with scenarios `ErrorSummary` and `DateSwap`.
- **Route states:** none (post-submit states run in the visual spec: `book/duplicate`, `book/invalid`, `book/unverified`, `book/limit`).

#### S4 — Safe retries
- **L2:** 108.1–3, 095.2.
- **Behaviour:**
  - A double click sends one POST.
  - The response is lost after the server commits (Playwright fetches, then aborts). The page shows the D16 alert. Try again resends the same `Idempotency-Key`, the API answers 200 with `Idempotent-Replayed: true`, and the success view shows ZAM-0114. There is exactly one booking.
  - The same key with a different message gives 422 `idempotency-key-reused`.
  - Two concurrent requests with one key give 201 and 409 `idempotency-request-in-progress` (C1).
  - A missing key gives 422 `errors.idempotencyKey`.
  - `idempotency:prune` deletes records older than 7 days (D17).
- **Tests first:** `tests/Feature/Bookings/IdempotentBookingRequestTest.php`, `tests/Feature/Operations/IdempotencyRecordPruningTest.php`, and an e2e case "Try again after a lost response sends one request".
- **Build:**
  - `Middleware/EnsureIdempotency` and `Models/IdempotencyRecord` (`idempotency_keys`).
  - `idempotency:prune` scheduled daily in `routes/console.php`.
  - `api/lib/http/idempotency-key.store.ts` and `app/shared/form-submitter.ts` (`exhaustMap`).
- **ADR:** idempotency keys for booking and payment submissions (C1–C3).

#### S5 — Your bookings
- **L2:** 033.1–2, 095.1, 105.1, 110.
- **Behaviour:**
  - Naomi on `/bookings` sees "Riverside Community Church", "Your bookings" and "3 upcoming · Luz Viva deposit due Sat 10 Oct, 4:00 p.m.".
  - **Upcoming** (soonest first):
    - ZAM-0097, Marcus Bell Trio, Sun 25 Oct, "Paid $237.50", Confirmed, with Message;
    - ZAM-0114, Abigail Mensah, "Brampton, 44 km · Paid $0", Requested, with Message;
    - ZAM-0088, Luz Viva, Accepted, with "Pay $225 deposit".
  - **Past** (latest first):
    - ZAM-0080, Elijah Park, Withdrawn, "Nothing charged";
    - ZAM-0075, Grace Tabernacle, Declined, with Message;
    - ZAM-0061, Abigail, Completed, "Paid $650", "Reviewed ★★★★★".
  - The Expired filter on Past shows "No expired bookings" and "Clear status filter".
  - `naomi-no-bookings` shows "No bookings yet", "When you ask an artist to lead worship, the request and every step after it lives here: their reply, your deposit and the night itself." and "Find who’s free".
  - Grace Ampofo's list holds none of Naomi's bookings. Abigail calling `GET /api/v1/bookings` gets 404.
- **Tests first:** `tests/Feature/Bookings/ListBookerBookingsTest.php` (orders, filter, cursor, `meta.counts`, amount paid as payments minus refunds, next action, other booker, artist role); `e2e/specs/bookings/view-booker-bookings.spec.ts`; `pages/bookings.page.ts`.
- **Build:**
  - Migrations `payments` and `refunds` (C8).
  - `GET /api/v1/bookings`, `ListBookingsRequest`, `ListBookerBookings`, `Services/Bookings/BookingNextAction` (Leave a review returns none until M7) and `BookingSummaryResource`.
  - `pages/bookings/` (`BookingsPage`, `BookingsStore`), with "Your bookings" linked from the footer and the account menu.
- **Components and scenarios:** `zm-tabs` and `zm-booking-list-item`; scenarios `Tabs`, `BookingListItem` and the composite `BookingsList` (20 rows).
- **Route states:** `/bookings` (Naomi, `zam-0114-requested`) → `bookings/default.html`; `?tab=past` → `bookings/past.html`; `?tab=past&status=expired` → `bookings/no-results.html`; `naomi-no-bookings` → `bookings/empty.html`.

#### S6 — The booking page
- **L2:** 029.3, 033.3, 044.1, 046.2, 074.2, 105.1.
- **Behaviour:**
  - `/bookings/ZAM-0114` reads "Booking ZAM-0114", "Worship night with Abigail Mensah" and "Sat 14 Nov 2026 · 7:00 p.m. · Burlington".
  - "Where it stands" shows Requested "Fri 9 Oct at 10:15 a.m.", then "Waiting for Abigail. She replies by Mon 12 Oct, 10:15 a.m.".
  - The request list shows "$650, locked Fri 9 Oct". The payment panel shows "Paid so far" $0.
  - ZAM-0097 (Confirmed) shows the contact card with Marcus Bell Trio's phone and email. ZAM-0114 has none.
  - ZAM-0088 shows "Pay $225 by Sat 10 Oct, 4:00 p.m. or the request expires.". The Pay button stays hidden (D2).
  - Grace opening `/bookings/ZAM-0114` gets the not-found state, worded like a mistyped link, and the API returns 404.
- **Tests first:** `tests/Feature/Bookings/ViewBookingTest.php` (history, `allowedActions` per status and party, `contacts` only while Confirmed or Completed, stranger 404); new cases in `view-booker-bookings.spec.ts`; `pages/booking-detail.page.ts`.
- **Build:**
  - `GET /api/v1/bookings/{number}`, with `Booking::visibleTo($user)` route binding.
  - `BookingResource` gains `history`, `allowedActions` (`BookingStateMachine::allowedFrom()` plus policy), `freeCancellationUntil` and `contacts`.
  - `pages/booking-detail/` (`BookingDetailPage`, `BookingDetailStore`) and the `payments` flag (D2).
- **Components and scenarios:** `zm-contact-card`, with scenario `ContactCard`.
- **Route states:** `/bookings/ZAM-0114` (Naomi, `zam-0114-requested`) → `booking-detail/default.html`; as Grace → `booking-detail/forbidden.html`; `/bookings/ZAM-0088` → `booking-detail/accepted.html` (Luz Viva variant, masked); loading and error by interception.

#### S7 — Booking messages
- **L2:** 045.1–3, 046.1–2, 063.1 (new messages), 109.4.
- **Behaviour:**
  - The request message is the first message.
  - Naomi sees "905-555-0123" and the note "Abigail sees “[contact details shared after booking]” in place of your phone number until the booking is confirmed.". Abigail sees the redacted text.
  - Naomi sends "Can you arrive by 6 for a sound check?". The info toast "Message sent to Abigail" reads "It’s on ZAM-0114. She gets an email about new messages at most every 15 minutes.", and Abigail gets one email.
  - A second message 5 minutes later sends no email until the 15-minute window closes, then one digest listing both. A message read before the job runs is not emailed.
  - A 2,001-character message gives 422. Grace gets 404 on the messages endpoints.
  - On ZAM-0097 (Confirmed), a phone number is not redacted.
- **Tests first:** `tests/Feature/Bookings/BookingMessagesTest.php`, `tests/Feature/Bookings/ContactRedactionTest.php` (the D19 corpus, including "$650", "7:00 p.m." and "250 people" left alone), `tests/Feature/Notifications/UnreadMessagesDigestTest.php`, `e2e/specs/bookings/exchange-booking-messages.spec.ts`, and the component object `pages/message-thread.ts` used by both booking page objects.
- **Build:**
  - Migrations `messages` and `message_digests`.
  - `Actions/Bookings/SendBookingMessage`, `Services/Bookings/ContactRedactor` (`giggsey/libphonenumber-for-php`, region CA), `SendMessageRequest`, `BookingMessagesController` (`index`, `store`, `markRead`), `MessageResource`, `BookingMessageSent`.
  - `Listeners/Bookings/ScheduleUnreadDigest`, `Jobs/Bookings/SendUnreadMessagesDigest`, `NewBookingMessagesNotification`.
  - `SendBookingRequest` now stores the message through `SendBookingMessage`.
  - Frontend `MessagesStore` (D18) and `api/lib/services/messages`.
- **ADR:** contact-detail redaction, fixed at send time (D19).
- **Components and scenarios:** `zm-message-thread` and `zm-message-composer`; scenarios for both, plus the composite `MessageThread` (40 messages).

#### S8 — Withdraw a request
- **L2:** 029.1, 031.1–2, 063.1 (withdrawn), 108.1.
- **Behaviour:**
  - On ZAM-0114, "Withdraw request" opens the dialog: "ZAM-0114 · Requested · Sat 14 Nov", "Withdraw your request to Abigail?", "Nothing has been charged and nothing will be.", and "Charged $0".
  - Focus starts on "Keep request". The confirm button busies to "Withdrawing…", and Close and Escape are off while it is busy.
  - The withdrawn page shows "You withdrew it Fri 9 Oct at 4:30 p.m., before Abigail replied. Nothing was charged." and "Find who’s free Sat 14 Nov". Abigail is emailed.
  - On failure: "Your request wasn’t withdrawn", and the confirm button becomes Try again.
  - ZAM-0088 (Accepted) can be withdrawn too.
  - ZAM-0097 (Confirmed) offers no Withdraw; its `allowedActions` holds `cancel`, shown in M6. A stale withdraw on a terminal booking gives 409 and the D15 toast.
- **Tests first:** `tests/Feature/Bookings/WithdrawBookingRequestTest.php`, `e2e/specs/bookings/withdraw-booking-request.spec.ts`, `pages/withdraw-request.dialog.ts`.
- **Build:** `POST /api/v1/bookings/{number}/withdraw`, `BookingWithdrawalController`, `WithdrawBooking`, `BookingPolicy::withdraw`, `RequestWithdrawn` with `RequestWithdrawnNotification`, and `dialogs/withdraw-request/`.
- **Route states:** `/bookings/ZAM-0114` (`zam-0114-withdrawn`) → `booking-detail/withdrawn.html`.

#### S9 — The requests inbox
- **L2:** 034.1, 074.1, 095.1, 105.1, 110.
- **Behaviour** (Abigail, `zam-0114-requested`, now Fri 9 Oct 3:15 p.m.):
  - The page reads "Requests" and "3 new · answer within 72 hours".
  - The New tab:
    - Harvest Point Church, "Worship night · 7:00 p.m. · Milton, 31 km", "$650 quoted · you get $598", message preview, "1 day left · reply by Sat 10 Oct, 3:15 p.m.";
    - St. Brendan’s Anglican, "1 day 18 hr left · reply by Sun 11 Oct, 9:00 a.m.";
    - Riverside Community Church, "Burlington, 44 km", "2 days 19 hr left · reply by Mon 12 Oct, 10:15 a.m.".
  - Searching "kitchener" on New finds nothing, points to Past (Trinity Lutheran, Declined) and offers "Clear search".
  - Miriam sees "No requests yet" and "Check your availability". The error state reads "We couldn’t load your requests".
  - Naomi calling `GET /api/v1/artist/requests` gets 404.
- **Tests first:** `tests/Feature/Bookings/ListArtistRequestsTest.php` (tab orders, `q`, cursor, payout, recipient-view preview, other artist's rows absent); `e2e/specs/bookings/respond-to-booking-request.spec.ts`; `pages/requests.page.ts`.
- **Build:**
  - `GET /api/v1/artist/requests`, `ArtistRequestsController@index`, `ListArtistRequests`, `ArtistRequestResource`.
  - `PriceBreakdown::artistPayoutCents` (D4).
  - `pages/requests/` (`ArtistRequestsPage`, `ArtistRequestsStore`), `api/lib/services/artist-requests`, and the `zmTimeLeft` pipe (D12).
  - The dashboard's "Needs your reply" switches to the shared row.
- **Components and scenarios:** `zm-request-row`, with the composite **requests inbox row** scenario `RequestsInboxRow` (20 rows) that AGENTS.md requires.
- **Route states:** `/artist/requests` (Abigail, 15:15) → `requests/default.html`; `?q=kitchener` → `requests/no-results.html`; as Miriam → `requests/empty.html`.

#### S10 — The artist's booking page
- **L2:** 030 (panels), 034.2, 046.1, 074.2.
- **Behaviour:**
  - `/artist/bookings/ZAM-0114` reads "Riverside Community Church" and "Worship night · Sat 14 Nov · 7:00 p.m. · requested today, 10:15 a.m.".
  - The thread is redacted. The event list includes "44 km, about 35 min from Brampton" (D26), and "That weekend" lists Sun 15 Nov Lakeshore Alliance as Confirmed.
  - "Your fee": $650, "Zamaro 8%" −$52, "You receive" $598, "You’ll be paid $598 after the event.", and "Reply by Mon 12 Oct, 10:15 a.m. · 2 days 19 hr left. Unanswered requests expire.", with Accept and Decline.
  - The withdrawn panel reads "Riverside withdrew" and "Naomi withdrew the request on Fri 9 Oct at 4:30 p.m., before you replied. Nothing was charged and there is nothing for you to do.".
  - Miriam opening it gets 404.
- **Tests first:** `tests/Feature/Bookings/ViewArtistBookingTest.php`, new cases in the respond spec, and `pages/request-detail.page.ts`.
- **Build:**
  - The artist view of `BookingResource`: `weekend` (other bookings that Saturday and Sunday) and distance with minutes.
  - `RoutingProvider` duration (D26).
  - `pages/request-detail/` (`ArtistBookingPage`, `ArtistBookingStore`).
- **Route states:** `/artist/bookings/ZAM-0114` (Abigail, 15:15) → `request-detail/default.html`; `zam-0114-withdrawn` → `request-detail/withdrawn.html`.

#### S11 — Accept a request
- **L2:** 029.1, 030.1, 030.4, 030.5, 063.1 (accepted, with the deposit link and deadline), 108.1, 109.1.
- **Behaviour:**
  - At Fri 9 Oct 2:40 p.m., Accept opens "Accept this request" with the fee receipt and "Riverside then has 48 hours, until Sun 11 Oct, 2:40 p.m., to pay the $162.50 deposit. Sat 14 Nov is Booked once they do.". Focus starts on "Accept request".
  - While busy it reads "Accepting…" and Cancel is disabled.
  - On success:
    - the toast "Request accepted" reads "The church has until Sun 11 Oct, 2:40 p.m. to pay the deposit.";
    - the panel becomes "Waiting for the deposit";
    - Naomi is emailed a link to `/bookings/ZAM-0114` with the deadline;
    - her page shows "Pay $162.50 by Sun 11 Oct, 2:40 p.m. or the request expires.".
  - **Conflict** (`zam-0121-already-booked`): "You’re already booked on Sat 21 Nov". ZAM-0121 becomes Declined with "Booked by another church", and Pastor Femi is emailed 3 similar artists (C6).
  - **No phone** (`abigail-no-contact-phone`): "Add your contact phone before you accept", with "Add contact phone" linking to `/account#contact`. The booking stays Requested and `respond_by` is unchanged.
  - Accepting after expiry gives 409, and the reload shows the Expired panel.
  - On a send failure: "Your reply didn’t send", and the danger toast "Couldn’t send your reply" reads "Nothing reached Riverside, and the request stays open until Mon 12 Oct, 10:15 a.m.".
- **Tests first:** `tests/Feature/Bookings/AcceptBookingRequestTest.php` (artist row lock, the D8 deadline including an event under 60 h away, Miriam on Abigail's booking 404, Naomi 404), and `pages/accept-request.dialog.ts`.
- **Build:** `POST /api/v1/artist/requests/{number}/accept`, `AcceptBookingRequest`, `AcceptBooking`, `BookingPolicy::respond`, `BookingDeadlines::depositDueBy()`, `RequestAccepted` with `RequestAcceptedNotification`, and `dialogs/accept-request/`.
- **Route states:** `/bookings/ZAM-0114` (`zam-0114-accepted`) → `booking-detail/accepted.html`; `/artist/bookings/ZAM-0114` → `request-detail/accepted.html`.

#### S12 — Decline a request
- **L2:** 030.2, 063.1 (declined), 075.
- **Behaviour:**
  - At 1:40 p.m., Decline opens "Decline this request" with "Riverside will be shown 3 similar artists free on Sat 14 Nov. Nothing is charged. This can’t be undone.". Focus starts on "I’m not free that day". The too-far option reads "Burlington is 44 km from Brampton".
  - Abigail adds the note "I’m so sorry, Naomi. My family moved my sister’s wedding to that weekend. I’d love to sing for Riverside another time." and the booking becomes Declined.
  - The note appears as "Abigail Mensah declined · Fri 9 Oct, 1:40 p.m.".
  - Naomi's page reads "Fri 9 Oct at 1:40 p.m. Her reason: I’m not free that day.", with "Free on Sat 14 Nov": Hosanna Collective (From $1,800), Elijah Park ($350) and Daniel & Ruth Okonkwo ($700), as in D13 and C7. Her email lists the same three, linked with `?date=2026-11-14`.
  - A 526-character note shows "Shorten your note" and "Keep your note to 500 characters; it’s 526 now.".
- **Tests first:** `tests/Feature/Bookings/DeclineBookingRequestTest.php`, `tests/Feature/Notifications/RequestDeclinedEmailTest.php`, and `pages/decline-request.dialog.ts`.
- **Build:**
  - `POST …/decline`, `DeclineBookingRequest`, `DeclineBooking` (the note goes to the thread as the decline).
  - `SimilarArtistFinder::freeOn(artist, date, church, 3)`, run in the queued listener.
  - `RequestDeclined` with `RequestDeclinedNotification`.
  - `BookingResource.similarArtists`, and `dialogs/decline-request/`.
- **Components and scenarios:** `zm-similar-artists`, with scenario `SimilarArtists`.
- **Route states:** `booking-detail/declined.html` and `request-detail/declined.html` (`zam-0114-declined`).

#### S13 — Expire unanswered requests
- **L2:** 029.1, 030.3, 063.1 (expired, both parties), 092.2–3.
- **Behaviour:**
  - With the clock at Mon 12 Oct 10:15 a.m., `bookings:expire-requests` moves ZAM-0114 to Expired, and Naomi and Abigail are each emailed once. A second run changes nothing and sends nothing.
  - After a jump to Tue 13 Oct, one run expires ZAM-0114, St. Brendan’s and Harvest Point together (catch-up).
  - Naomi's page reads "Abigail didn’t reply by Mon 12 Oct, 10:15 a.m. You were both told.", with "Ask Abigail again" (to `/artists/abigail-mensah/book?date=2026-11-14`) and "Find who’s free Sat 14 Nov".
  - Abigail's page reads "Request expired" and "There was no reply by Mon 12 Oct, 10:15 a.m. You and Riverside were both told. Nothing was charged.".
- **Tests first:** `tests/Feature/Bookings/ExpireOverdueRequestsTest.php` (artisan run, then API reads), and `e2e/specs/bookings/run-booking-lifecycle.spec.ts` (scenario, clock and artisan fixtures).
- **Build:** `Console/Commands/ExpireOverdueRequests` (`bookings:expire-requests`, every minute, `withoutOverlapping()->onOneServer()`), `Jobs/Bookings/ExpireBookingRequest` (`ShouldBeUnique`, lock and guard), and `RequestExpired` with `RequestExpiredNotification`.
- **Route states:** `booking-detail/expired.html` and `request-detail/expired.html` (`zam-0114-expired`).

#### S14 — Complete finished bookings
- **L2:** 029.2, 092.1–3.
- **Behaviour:**
  - ZAM-0097 (Marcus Bell Trio, Sun 25 Oct 10:30 a.m., Confirmed) is still Confirmed at Mon 26 Oct 10:29. At 10:30, `bookings:complete` makes it Completed, and it moves to Past.
  - `BookingCompleted` is dispatched; M6 adds the balance listener and M7 the review prompt.
  - A job forced to fail runs 5 times with the D22 backoff, lands in `failed_jobs` and calls `failed()`, which reports and alerts.
- **Tests first:** `tests/Feature/Bookings/CompleteFinishedBookingsTest.php` and `tests/Feature/Operations/BookingJobRetriesTest.php`.
- **Build:** `Console/Commands/CompleteFinishedBookings` (`bookings:complete`), `Jobs/Bookings/CompleteBooking`, `Events/BookingCompleted`, and the `Jobs/Concerns/RetriesWithBackoff` trait.

#### S15 — In-app reply-by and deposit-due warnings
- **L2:** 109.4 (only if D21 is accepted).
- **Behaviour:**
  - Abigail opening `/artist/requests` at Fri 9 Oct 3:16 p.m. sees the warning toast "Reply to Harvest Point by Sat 10 Oct", reading "Under 24 hours left: their worship night request expires Sat 10 Oct at 3:15 p.m. if you don’t reply.".
  - Naomi opening `/bookings` at Fri 9 Oct 4:01 p.m. sees "Luz Viva deposit due", reading "Pay your $225 deposit for Luz Viva by Sat 10 Oct, 4:00 p.m. or the booking expires.".
  - Each shows once per session and booking. Both leave after 5 seconds, pausing while hovered or focused.
- **Tests first:** `e2e/specs/user-experience/show-loading-and-feedback.spec.ts`, new cases.
- **Build:** `app/shared/deadline-notices.ts`, which reads the loaded lists. No new API.

## Vendor ports and fakes
- **No new vendor port.** Email goes through Laravel mail to Mailpit (M2). The provider adapter and bounce webhook stay M10 and M2 work.
- **`FakeRoutingProvider`** gains minutes per `CastRoutes` pair (Brampton ↔ Burlington 44 km / 35 min), plus `round(km × 0.8)` for other pairs. Test hooks are unchanged.
- **e2e harness (S0)** is test-only and not a vendor fake. It is registered only under `APP_ENV=e2e`.

## Seed data additions (idempotent, keyed on `bookings.number` and user email)
- **Bookers and churches** with snapshots: Naomi Fraser / Riverside (2150 Lakeshore Road, Burlington, 905-555-0123); Rev. Janet Clarke / St. Brendan's, Oshawa; Tomi Oduya / Harvest Point, Milton; Pastor Femi Adebayo / Living Waters, Brampton; Pastor Dave Mwangi / Lakeshore Alliance, Oakville; Grace Ampofo / Kingdom Life Centre, Mississauga; a contact for Trinity Lutheran, Kitchener.
- **Naomi's bookings:**
  - ZAM-0097: Marcus Bell Trio, Sun 25 Oct 10:30 a.m., Confirmed, with a $237.50 deposit payment on Visa 4242 dated Tue 29 Sep.
  - ZAM-0088: Luz Viva, Sat 5 Dec 6:30 p.m., Accepted Thu 8 Oct 4:00 p.m., deposit due Sat 10 Oct 4:00 p.m.
  - ZAM-0075: Grace Tabernacle, Sun 20 Sep, Declined.
  - ZAM-0080: Elijah Park, Sat 3 Oct, Youth event, Withdrawn.
  - ZAM-0061: Abigail, Sun 14 Jun, Completed, $650 paid, with her June review.
- **Abigail's incoming requests:**
  - Harvest Point, Sat 5 Dec, reply by Sat 10 Oct 3:15 p.m.
  - St. Brendan’s, Sun 22 Nov 10:30 a.m., reply by Sun 11 Oct 9:00 a.m.
  - Trinity Lutheran, Sun 29 Nov, Declined (too far).
  - St. Brendan’s, Sun 13 Sep, Completed.
- **Abigail's six Confirmed dates** gain booker, church and price columns. Abigail's contact phone is 905-555-0148; Miriam has none.
- **Other seeds:** `booking_number_seq` restarts at 114 (D9). ZAM-0114 and ZAM-0121 come only from scenarios (C11).
- **Check M1 numbers** after seeding: the headliner (Abigail No. 01, counting transitions to Confirmed this season), the search exclusions and Abigail's 4.9/38 must not move.

## Known risks
- **Double booking and double submit:** the middleware, the unique index and `bookings_one_open_request` must all hold under concurrency. S4 and S11 include parallel-request tests, not only sequential ones.
- **Time zones and DST:** `respond_by`, `deposit_due_by` and `event_starts_at` are stored in UTC but computed in Toronto wall-clock time. 1 Nov 2026 ends DST between ZAM-0114's request and its event. Both D7 cases are tested.
- **The clock in e2e:** three clocks must agree: the browser (`page.clock`), the API (Redis override) and the sync queue. Visual masks cover time-left captions that drift by a minute.
- **e2e isolation:** the booking specs mutate shared data and run in the serial `zamaro-bookings` project. A slow reset endpoint lengthens the suite, so keep scenarios small and measure.
- **Redaction:** false negatives leak phone numbers; false positives hide prices and times. The D19 corpus is the guard, and the redaction is fixed at send time and never re-run.
- **Emails within 2 minutes:** `api-e2e` sends synchronously, which hides queue latency. Measure the queued-to-sent gap on the dev worker.
- **Personal data and caching:** booking, message and request responses carry `Cache-Control: private, no-store`, and no booking response may enter the SSR transfer cache across users (an M1 risk).
- **Existing numbers moving:** Requested and Accepted seeds must not change search or headliner results. Re-run the M1 Discover specs in S1 and S5.
- **The flag:** a production deploy with `bookingRequests` on would accept requests that can never be paid (D1).

## Verification at the end of M5
1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Every Feature test is green, including `Security/BookingRouteOwnershipTest` covering every new authenticated route.
2. Run `docker compose exec api php artisan db:seed` twice: row counts are unchanged. `php artisan schedule:list` shows `bookings:expire-requests`, `bookings:complete` and `idempotency:prune`.
3. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && NG_BUILD_MANGLE=0 npx ng build perf-test`.
4. `cd e2e && npx playwright test` passes both projects: specs, `visual/` for every new route state in light and dark, `a11y/` and `perf/cls.spec.ts`.
5. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows. The new scenarios are listed, including `RequestsInboxRow`, `BookingsList` and `MessageThread`.
6. **Manual walkthrough** (dev seed plus `zamaro:scenario base`):
   1. As Naomi, search Burlington / Sat 14 Nov and open Abigail.
   2. "Request to book · Sat 14 Nov", send the message with the phone number, and see ZAM-0114 and the toast.
   3. In Mailpit, see Abigail's email.
   4. As Abigail, open `/artist/requests`, open Riverside, check the redacted phone, and accept.
   5. As Naomi, see Accepted with the deposit deadline and no Pay button.
   6. Message each other and watch the digest.
   7. Withdraw ZAM-0088.
   8. `zamaro:scenario zam-0114-requested`, set the clock to Mon 12 Oct 10:16, run `bookings:expire-requests`, and see Expired on both sides.
   9. Repeat at 320 px and in the dark theme.
