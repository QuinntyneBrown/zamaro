# Milestone 8 plan: admin support

**Status:** Not started.
**Depends on:** M3 (admin app, audit log, read-only Artists screens, `admin-mutations` project), M5 (booking lifecycle and messages), M6 (payments, refunds, holds, payouts) and M7 (the Reviews section of the admin shell). M4 supplies profile cache invalidation.

## Context

**What exists before M8:**
- **From M3:** the separate admin app behind the `/admin` 404 gate, with TOTP sign-in, the idle warning and the shell (Applications, Artists, Audit log); `RecordAuditEntry`, `AuditAdminRequests` and the audit viewer; a read-only `/admin/artists` list and `/admin/artists/:id` page (Details, Upcoming bookings, a Standing panel with no action), per M3 decision D18; `tests/Feature/Security/AdminRoutesConcealedTest`; and the serial `admin-mutations` Playwright project, which reseeds on teardown.
- **From M5:** `BookingStateMachine` (L2-029) and `booking_transitions`; `ZAM-` numbers; the request-declined email with up to 3 similar artists; message threads with `MessageThreadComponent`; and possibly `GET /api/v1/admin/bookings/{number}/messages` (`bookings/exchange-booking-messages`).
- **From M6:** `payments`, `refunds`, `payouts`, `problem_reports` and `bookings.held_at`; `ChargeBookingBalance` and the payout job; `Contracts/PaymentGateway` with a fake that refunds; `RefundReceiptNotification`; refund webhook reconciliation; and `AuditPaymentEvents` (`payout.sent`, and refunds without `issued_by`).
- **From M7:** the Reviews section and its count in the admin shell.
- **From M4:** the profile cache invalidation ADR and the `CdnPurger` port with its fake.

**Goal:** administrators support churches and artists. They find any booking and see its status and payment history, read its thread without being able to write to it, refund money within what is refundable, resolve held bookings, and suspend and reinstate artists. Every action is audited.

**M3 screens and audit events this milestone extends:**
- **The admin shell** gains the Bookings section with its "1 held" count, and `GET /api/v1/admin/overview` returns `heldBookings`.
- **`/admin/artists`** gains the status counts ("8 artists · 8 approved · 0 suspended") and the Suspended badge.
- **`/admin/artists/:id`** gains the Standing actions (Suspend…, Reinstate…), "Bookings to resolve" and "Suspension history".
- **The audit viewer's Action filter** and `AuditAction` gain `booking.messages.viewed`, `refund.issued` (issued by an administrator), `booking_hold.resolved`, `artist.suspended` and `artist.reinstated`. Targets render as "Booking · ZAM-0097 · $237.50" and "Artist · Marcus Bell Trio".
- **`AdminRoutesConcealedTest`** gains every new admin route.

## Entry criteria and dependencies
- M3, M5, M6 and M7 are merged.
- The M6 fakes can:
  - make a refund fail (`failNextWith(declined)`)
  - deliver a refund webhook
  - pause and resume a balance charge and a payout
- Decisions E1, E4, E5 and E6 are answered before S5. E1, E2 and E6 are needed before S8.
- Branch `feat/m8-admin-support` off `main`, following the M1 slice loop. The regression set includes `npx ng build admin` and every Playwright project.

## Decisions to make or confirm
Each decision gives a recommended default. **Needs your OK** marks the ones that wait for you.

1. **E1 Decline email for requests closed by a suspension.** Whether it lists similar free artists is `<TO SUPPLY>`.
   - **Recommended:** reuse M5's request-declined email with up to 3 similar artists free on the date (as L2-030.2 does), with the neutral reason "The artist can no longer take this booking."
   - The suspension reason never leaves Zamaro. The dialog says "Churches never see it."
   - **Needs your OK.**
2. **E2 Email the suspended artist?** The specs are silent (`<TO SUPPLY>`). Recommended: no; the Zamaro team contacts the artist directly. **Needs your OK.**
3. **E3 Text-search index** (`<TO SUPPLY>`). Use B-tree indexes:
   - `lower(artists.display_name) text_pattern_ops` and `lower(churches.name) text_pattern_ops` for the prefix matches
   - exact matches on `bookings.number` and `lower(users.email)`
   - No `pg_trgm`, because the design asks only for prefix and exact matching.
4. **E4 How one refund splits across charges** (`<TO SUPPLY>`), and its effect on payouts.
   - **Recommended:** allocate the refund to the newest succeeded charge first. Write one `Refund` row per charge, each with the idempotency key `refund:{booking}:{refund}:{payment}` (L2-041.3).
   - Payouts are computed on what was collected net of refunds, less the 8% fee.
   - **Needs your OK.**
5. **E5 A partial refund on a hold** (`<TO SUPPLY>`). The mock limits it to "Up to $200 · what Grace has paid so far".
   - **Recommended:** refund that amount from what has been paid, cancel the paused balance charge, and pay the artist the remainder less 8%. For ZAM-0104, refunding $50 pays Hosanna Collective $138.
   - **Needs your OK.**
6. **E6 Resolving the Confirmed bookings a suspension leaves.** The design says "cancel or keep", but no mock or endpoint cancels.
   - **Recommended:** a full refund issued on a Confirmed booking of a suspended artist also does the following:
     - moves it to Cancelled, with Priya as the actor
     - frees the date and cancels the scheduled balance charge and payout
     - sends M6's booking-cancelled email
   - **To keep a booking,** Priya does nothing. It proceeds normally and stays in "Bookings to resolve" until it is no longer Confirmed.
   - **Needs your OK.**
7. **E7 Contents of the payment history.** The design builds it from `Payment` and `Refund` rows, but the mocks also show the scheduled balance charge ("Scheduled", "Paused") and the payout ("Payout to Hosanna Collective · Bank account · Paused · $736").
   - **Recommended:** `PaymentHistory` merges payments, refunds, payouts and the scheduled balance charge. Update support-bookings-and-payments to match.
8. **E8 The admin thread endpoint.** If M5 built `GET /api/v1/admin/bookings/{number}/messages`, reuse it. Otherwise S2 builds it.

## Design conflicts and resolutions
- **`features/admin`:** maps to the admin app (ADR-0001, ADR-0007):
  - pages `projects/admin/src/app/pages/{bookings,booking}/`, with `pages/artist/` (from M3) extended
  - dialogs `dialogs/{issue-refund,resolve-hold,suspend-artist,reinstate-artist}/`
  - `BookingsToResolveComponent` becomes page markup over `zm-tour-dates` (M1 S14)
  - API clients in `projects/api/src/lib/services/admin/{bookings,artists}/`, with models in `models/admin/`
- **`PaymentGateway` in `App\Services\Payments\`:** the port is M6's `App\Contracts\PaymentGateway`.
- **Controller namespaces:** the design's `Admin\…` controllers live in `Http/Controllers/Api/V1/Administration/`.
- **Seed versus mocks:** M3 already gave Marcus Bell Trio the mock's email and approval date (2 Mar 2026). M8's seed adds his bookings exactly as the mocks show them. Suspending Marcus changes Discover's Burlington lineup, so those specs run only in `admin-mutations`.
- **Frozen clock:** the API clock is Fri 9 Oct 10:00, while the mocks say "Suspended Fri 9 Oct, 2:30 p.m.". Specs assert the frozen time, and the visual suite masks it.

## Milestone 8 — slices
Each slice follows the M1 loop. Every new admin route joins `AdminRoutesConcealedTest`, and each mutating spec runs in `admin-mutations`.

#### S1 — Search bookings
- **L2:** 068.1, 095.1, 105, 110.
- **Behaviour:**
  - `/admin/bookings` shows "Bookings" and "Find a booking, check what was paid and return money where the rules allow."
  - Searching "Riverside" gives "6 bookings match "Riverside", latest event first":
    - ZAM-0088 Luz Viva, Sat 5 Dec 2026, Accepted, $0
    - ZAM-0114, ZAM-0097 (Confirmed, Paid $237.50, Refunded $0), ZAM-0080 and ZAM-0075
    - ZAM-0061 Abigail Mensah, Completed, $650
  - Exact matches work for "ZAM-0097" and "naomi.fraser@riversidecc.ca". Prefix matches work for "Marc" (artist) and "Riv" (church).
  - "Held only" gives "1 held booking": ZAM-0104, Hosanna Collective, Kingdom Life Centre, Completed with a Held badge, $200.
  - Results page by cursor. The page has no-results, loading and error states.
  - The shell shows "Bookings 1".
- **Tests first:**
  - `tests/Feature/Administration/SearchBookingsForSupportTest.php`
  - `e2e/specs/administration/support-bookings-and-payments.spec.ts`
  - `e2e/pages/admin/bookings.page.ts`
- **Build:**
  - `Api/V1/Administration/BookingsController@index`, `Requests/Administration/SearchBookingsRequest`, `Actions/Administration/SearchBookingsForSupport` and `Resources/Administration/AdminBookingRowResource`.
  - The E3 indexes, and `heldBookings` in the overview.
  - Frontend: admin `pages/bookings/` and `api/lib/services/admin/bookings/`, with its token and fake.
- **Components and perf:** `zm-stamp` with the flat variant, unless M5 built it, plus a composite `AdminBookingsTable` scenario with 25 rows.
- **Route states:** `/admin/bookings?q=Riverside` and `/admin/bookings?held=1` as Priya.

#### S2 — Booking detail and the read-only thread
- **L2:** 045.3, 045.4, 068.1, 069.1, 079.3, 089.
- **Behaviour:**
  - `/admin/bookings/ZAM-0097` shows:
    - the header "Booking ZAM-0097", "Marcus Bell Trio at Riverside Community Church", "Sun 25 Oct 2026 · 10:30 a.m. · Sunday service · Burlington"
    - Booking: Naomi Fraser · naomi.fraser@riversidecc.ca, "$950, locked Mon 28 Sep"
    - Status history
    - Payment history:
      - "Tue 29 Sep, 8:02 a.m. · Deposit charge · Visa ending 4242 · Succeeded · $237.50"
      - "Tue 27 Oct, 10:30 a.m. · Balance charge · Scheduled · $712.50"
    - Money: Quoted price $950, Charged $237.50, Refunded $0, Refundable now $237.50
    - "Messages · Read only · opening the thread is recorded in the audit log", with no composer
  - Loading the thread records `booking.messages.viewed`. Posting to the thread as Priya gets 405 or 404.
  - Only the card brand and last 4 digits appear.
  - The response is `private, no-store`. An unknown number gets 404.
- **Tests first:**
  - `tests/Feature/Administration/ViewBookingForSupportTest.php`
  - `tests/Feature/Security/AdminBookingThreadReadOnlyTest.php`
  - `e2e/pages/admin/booking.page.ts`
- **Build:**
  - `BookingsController@show`, `Resources/Administration/AdminBookingResource`, `Services/Administration/{PaymentHistory,RefundableAmount}` (E7) and the thread endpoint (E8).
  - Frontend: admin `pages/booking/`, reusing `MessageThreadComponent` with `readOnly`.
- **Route states:** `/admin/bookings/ZAM-0097` (default) and `/admin/bookings/ZAM-0104` (held).

#### S3 — Issue a refund
- **L2:** 040.1, 041.3, 068.2, 069.1, 101, 108, 110.
- **Behaviour:**
  - "Issue refund…" opens "Issue a refund", with the kicker "ZAM-0097 · Confirmed · Sun 25 Oct" and "Refunds go back to Visa ending 4242." The hint reads "Up to $237.50 · the deposit Naomi paid Tue 29 Sep".
  - $300 with no reason gives "Fix 2 things to continue": "That's more than is refundable. Enter $237.50 or less." and "A reason is required."
  - Continue opens the confirmation "Refund $237.50 to Naomi Fraser?" (Refund "$237.50 to Visa ending 4242", "Still refundable after $0"). Focus starts on "Go back".
  - "Refund $237.50" shows "Refunding…". The refund then reaches the fake processor as Succeeded and is recorded as `refund.issued` with the outcome. Naomi gets a receipt.
  - The Money panel reads Refunded $237.50, Refundable now $0. A second submit sends nothing.
- **Tests first:**
  - `tests/Feature/Administration/IssueRefundTest.php`
  - new cases in `support-bookings-and-payments.spec.ts`
  - `e2e/pages/admin/issue-refund.dialog.ts`
- **Build:**
  - `Api/V1/Administration/RefundsController@store`, `Requests/Administration/IssueRefundRequest` and `Actions/Administration/IssueRefund`:
    - the pending refund is committed under a row lock
    - `PaymentGateway::refund` is called after commit
    - the allocation follows E4
  - Admin `dialogs/issue-refund/`, with money parsed to integer cents through `FormatService`.
- **Components and perf:** `zm-money-field` (the `$` input group), with a scenario.

#### S4 — Refund failures and races
- **L2:** 041.2, 068.2, 069.1, 108.3.
- **Behaviour:**
  - When the fake processor declines, the dialog shows "The refund didn't go through" and "The payment processor didn't accept it, so nothing was sent. The attempt is in the audit log. Try again, or check the processor's dashboard." The amount and reason are kept. The refund is `Failed`, and `refund.issued` is recorded Failed.
  - Two concurrent $200 refunds on $237.50: one succeeds and the other gets 422 on `amountCents`.
  - A refund webhook delivered twice changes nothing.
- **Tests first:** new cases in `IssueRefundTest.php` and the spec.
- **Build:** the failure branch of `IssueRefund`, and reconciliation with M6's webhook handler.

#### S5 — Resolve a hold: release the balance
- **L2:** 038.2, 063, 068.3, 069.1.
- **Behaviour:**
  - ZAM-0104 shows "Held: balance and payout paused" and Grace's report from Mon 5 Oct, 4:12 p.m. The payment history shows the $600 balance and the $736 payout as Paused, and Refundable now is $200.
  - "Resolve hold…" opens "Resolve the hold on ZAM-0104" ("Choose one outcome. Grace Ampofo and Hosanna Collective are emailed.").
  - "Release the balance" ("Charge Grace's $600 balance now and pay Hosanna Collective $736.") with a reason, then "Resolving…":
    - the hold clears and `ChargeBookingBalance` runs
    - `booking_hold.resolved` is recorded
    - both parties get `HeldBookingResolvedNotification`
  - Resolving again gets 409. With no outcome or reason the dialog shows the invalid state.
- **Tests first:**
  - `tests/Feature/Administration/ResolveHeldBookingTest.php`
  - `e2e/specs/administration/resolve-held-booking.spec.ts`
  - `e2e/pages/admin/resolve-hold.dialog.ts`
- **Build:**
  - `Api/V1/Administration/HeldBookingsController@resolve`, `Requests/Administration/ResolveHeldBookingRequest`, `Enums/HoldResolution` and `Actions/Administration/ResolveHeldBooking`.
  - `Notifications/HeldBookingResolvedNotification`.
  - Admin `dialogs/resolve-hold/`.
- **Components and perf:** `zm-radio-group` gains a revealed-field slot. Run the perf test.

#### S6 — Resolve a hold: partial or full refund
- **L2:** 068.3, 039.2, 069.1.
- **Behaviour:**
  - "Partial refund" reveals "Amount to refund", hinted "Up to $200 · what Grace has paid so far". $250 gives "Enter an amount up to $200.". $50 refunds $50 and settles per E5.
  - "Full refund" ("Refund the $200 deposit, cancel the $600 balance charge and the payout.") refunds $200 and cancels the paused charge and payout.
  - If the processor fails: "The hold wasn't resolved" and "The refund didn't reach the payment processor, so the booking is still held and nothing was emailed."
- **Tests first:** new cases in `ResolveHeldBookingTest.php` and `resolve-held-booking.spec.ts`.
- **Build:** the refund paths in `ResolveHeldBooking` reuse `IssueRefund`, and M6's payout and charge cancellation.

#### S7 — Suspend an artist
- **L2:** 005.4, 021.2, 029.1, 063, 067.2, 069.1, 088, 089.
- **Behaviour:**
  - `/admin/artists/{marcus}` shows Standing: "Suspending hides the profile and the search listing at once, declines 2 open requests and lists 1 confirmed booking for you to resolve."
  - "Suspend…" opens "Suspend Marcus Bell Trio?" ("This takes effect at once. You can reinstate them later."). It lists:
    - "The profile at zamaro.ca/artists/marcus-bell-trio shows not found."
    - the 2 open requests ZAM-0109 and ZAM-0112
    - ZAM-0097, Sun 25 Oct
  - The reason is required, with a "0 / 500" counter. An empty reason gives "Give a reason to suspend" and "A reason is required."
  - "Suspend artist" shows "Suspending…", then:
    - "Marcus Bell Trio is suspended"
    - ZAM-0109 and ZAM-0112 are Declined, with Priya as the actor, and both churches are emailed (E1)
    - "Bookings to resolve" lists "ZAM-0097 · Riverside Community Church" with Resolve
    - the history reads "Suspended Fri 9 Oct, 10:00 a.m. by Priya Nair" with the reason
    - `artist.suspended` is recorded
  - `/artists/marcus-bell-trio` returns 404, and the Burlington lineup drops him.
  - Suspending again gets 409. On failure: "The suspension wasn't saved" and "Marcus Bell Trio is still Approved and no booking changed."
- **Tests first:**
  - `tests/Feature/Administration/SuspendArtistTest.php`
  - `e2e/specs/administration/suspend-and-reinstate-artists.spec.ts`
  - `e2e/pages/admin/{suspend-artist.dialog.ts,artist.page.ts}` (the latter extended)
- **Build:**
  - Migration `create_artist_suspensions_table`.
  - `Models/ArtistSuspension`.
  - `Api/V1/Administration/ArtistSuspensionsController@store`, `Requests/Administration/SuspendArtistRequest` and `Actions/Administration/SuspendArtist`, which returns a `SuspensionOutcome`.
  - `Resources/Administration/SuspensionOutcomeResource`.
  - `Events/ArtistSuspended` and `Listeners/PurgeArtistVisibility` (cache forget, plus `CdnPurger` for the profile URL).
  - Admin `dialogs/suspend-artist/`.
- **Route states:** `/admin/artists/{marcus}` suspended, captured in the spec. The default state was listed in M3.

#### S8 — Reinstate, and the bookings left to resolve
- **L2:** 067.3, 069.1, 042.4.
- **Behaviour:**
  - "Reinstate…" opens "Reinstate Marcus Bell Trio?", which shows the suspension on record and "ZAM-0109 and ZAM-0112 stay Declined; those churches would send new requests."
  - "Reinstate artist" shows "Reinstating…". The artist is Approved again, the suspension row is closed, and `artist.reinstated` is recorded. The profile and the search listing return, and both requests stay Declined.
  - On failure: "Marcus Bell Trio wasn't reinstated" and "They are still suspended."
  - Resolve on ZAM-0097 opens the booking. A full refund of $237.50 ("Marcus Bell Trio is suspended. Riverside needs another artist for Sun 25 Oct.") cancels it per E6, and it leaves "Bookings to resolve".
  - The list shows "8 approved · 1 suspended" while Marcus is suspended.
- **Tests first:** `tests/Feature/Administration/{ReinstateArtistTest,ResolveSuspendedBookingsTest}.php`, new spec cases, and `e2e/pages/admin/reinstate-artist.dialog.ts`.
- **Build:**
  - `ArtistSuspensionsController@destroy`, `Actions/Administration/ReinstateArtist` and `Events/ArtistReinstated`.
  - The E6 branch in `IssueRefund`, through `BookingStateMachine`.
  - Admin `dialogs/reinstate-artist/`.

## Vendor ports and fakes (real adapters in M10)
- **`Contracts/PaymentGateway` (M6 fake):** `refund()` with the hooks `failNextWith(declined|error)` and `refunds()`, and webhook replay for `refund.succeeded`.
- **`Contracts/CdnPurger` (M4 fake):** records the purged URLs, so S7 and S8 can assert `/artists/marcus-bell-trio`.
- **Email:** Mailpit, through M2's notification foundation.

## Seed data additions (mock cast, idempotent)
- **Marcus Bell Trio:**
  - ZAM-0109: St. Brendan's Anglican, Sat 7 Nov, Requested, reply due Sun 11 Oct.
  - ZAM-0112: Lakeshore Alliance Church, Sun 29 Nov, Accepted, deposit due Sat 10 Oct.
  - ZAM-0097: Riverside, Sun 25 Oct 10:30 a.m., Sunday service, $950 locked Mon 28 Sep; deposit $237.50 Succeeded Tue 29 Sep 8:02 a.m. on Visa 4242; balance $712.50 scheduled Tue 27 Oct 10:30 a.m.; the two messages from the mock.
- **ZAM-0104,** Hosanna Collective at Kingdom Life Centre:
  - the booker Grace Ampofo (grace.ampofo@kingdomlife.ca); Sun 4 Oct 10:00 a.m.; $800 locked Tue 1 Sep
  - deposit $200 on Mastercard 8810, Wed 2 Sep 4:18 p.m.
  - Completed Mon 5 Oct 10:00 a.m.
  - a problem report Mon 5 Oct 4:12 p.m. with the mock's text; `held_at` set
  - balance $600 and payout $736 Paused
  - the four messages from the mock
- **Naomi's other Riverside bookings,** if M5 and M6 did not seed them: ZAM-0088, ZAM-0114, ZAM-0080, ZAM-0075 and ZAM-0061 ($650 paid).
- **ZAM-0090,** with its $75 refund failed and then succeeded on Thu 8 Oct, so the audit rows M3 seeded resolve to a real booking.

## Known risks
- **Shared state:** suspending Marcus, refunding ZAM-0097 and resolving ZAM-0104 all mutate data that the Discover and booking specs read. Keep them in `admin-mutations`, which reseeds on teardown, and never in parallel projects.
- **Money correctness:** E4 and E5 change what artists are paid. Write the payout arithmetic as table-driven Feature tests ($950: $237.50 deposit; $800: $736 payout; $50 partial: $138) before any UI.
- **Commit, then call:** a crash between the pending refund's commit and the processor call leaves a `Pending` refund. M6's reconciliation must settle it, and S4 covers it.
- **Cache purge lag:** "The profile and search listing come back within a minute" depends on M4's cache TTLs. Assert the 404 and the search exclusion right after the action, not through the CDN.
- **Masking:** the mocks show 2:30 p.m. and dates from late September. The visual suite masks timestamps on admin pages.

## Verification (end of M8)
1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Every test passes, including `AdminRoutesConcealedTest` with the new routes and the OpenAPI contract assertions.
2. Run `docker compose exec api php artisan db:seed` twice. Row counts are unchanged.
3. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build admin && NG_BUILD_MANGLE=0 npx ng build perf-test`.
4. `cd e2e && npx playwright test`, all projects including `admin-mutations`. This covers the specs, `visual/`, `a11y/` (light and dark) and `perf/`.
5. Run `npm run perf-test -- --baseline <main dist> --fail-on-regression`. No row is flagged.
6. Manual walkthrough as Priya:
   - Search "Riverside", open ZAM-0097, read the thread, and see `booking.messages.viewed` in the audit log.
   - Try a $300 refund and see the error.
   - Filter "Held only", open ZAM-0104 and release the balance. Check Mailpit for both emails.
   - Suspend Marcus Bell Trio. Confirm his profile is 404, he is gone from the Burlington lineup and ZAM-0109 and ZAM-0112 are Declined.
   - Resolve ZAM-0097 with a full refund.
   - Reinstate Marcus and confirm the profile returns.
   - Check the screens at 375 px and in dark theme.
