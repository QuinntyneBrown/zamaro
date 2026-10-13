# Milestone 6 plan: payments and cancellations

**Status:** Not started. Depends on M5, and through it on M1–M4. M3's audit log and administrators are used directly.

## Context

**What exists when M6 starts:**
- **From M5:**
  - `BookingStateMachine`, with every L2-029 pair allowed. Accepted → Confirmed, Accepted → Expired and Confirmed → Cancelled are unused so far.
  - `bookings.deposit_due_by`, set on accept.
  - The `payments` and `refunds` tables (pay-deposit schema), holding only seeded rows.
  - `PriceBreakdown`: quote, HST, deposit, balance, fee and payout (M5 D3/D4).
  - `EnsureIdempotency` with `idempotency_keys`, `AlertAdministrators` with `admin_alerts`, and `SimilarArtistFinder::freeOn()`.
  - `BookingCompleted`, with no listener yet.
  - The booking pages, both inboxes, the thread and the contact card.
  - The `payments` flag (off), which hides "Pay $162.50 deposit". `allowedActions` already lists `cancel` on Confirmed bookings, but nothing renders it.
  - e2e scenarios, clock travel and the Mailpit mailbox (M5 S0).
- **From M1:** `CancellationPolicy`, a value object with `freeCancellationUntil()` used by the stub.
- **From M3:** `RecordAuditEntry`, and the profile-publication rule on approval.
- **From M4:** the dashboard and `/artist/*` shell. Its Earnings link and the "Fees and payouts are on Earnings" caption are deferred, because `/artist/earnings` does not exist yet.

**Goal:** money moves.
- A booker pays the 25% deposit through processor-hosted card fields, and the booking becomes Confirmed. Exactly one church wins a date.
- Unpaid deposits expire, and receipts are emailed and downloadable.
- Either party can cancel a Confirmed booking under the 14-day policy.
- The balance is charged 48 hours after the event, with retries, a payment link and a problem-report hold.
- Artists onboard to payouts and are paid within 2 business days; `/artist/earnings` shows each booking.
- Processor webhooks are verified and deduplicated, and every day is reconciled.

Every processor call goes through the `PaymentGateway` port and its deterministic fake; the real adapter is M10. Slices follow the M1 loop: criteria, a red test, the build, regression checks, then a commit.

## Entry criteria and dependencies
- **M5:**
  - Complete, with the `payments` flag still off.
  - `zam-0114-accepted` and the other M5 scenarios work.
  - `Security/BookingRouteOwnershipTest` is in place for new routes to join.
- **M5 decisions confirmed by the user:** D3 (deposit), D4 (fee) and D13 (similar artists). M6 extends them.
- **M3:** administrators exist to receive alerts, and `RecordAuditEntry` is available for payouts (L2-069).
- **M2:**
  - Secrets come from the environment, adding `ZAMARO_PAYMENT_WEBHOOK_SECRET`.
  - The `security` log channel exists (or is added in S3).
  - Mail goes to Mailpit.
- **Frontend:** the perf baseline is `main` after M5. The CDK Dialog is already lazy.

## Decisions to make or confirm
"OK" marks the decisions that need the user's sign-off before their slice starts. Money rules always need it.

| # | Decision | Recommended default | OK |
|---|---|---|---|
| D1 | Payment processor (`<TO SUPPLY>`) | Stripe: PaymentIntents with Payment Element (hosted fields, 3-D Secure), Connect Express connected accounts and separate transfers, in CAD. M6 shapes the port to it; the adapter is M10. | **Yes** |
| D2 | Go-live | `payments` turns on in dev and e2e in S1. Production keeps `bookingRequests` and `payments` off until the M10 Stripe adapter passes its contract tests (production refuses fakes). | **Yes** |
| D3 | Fee base when HST applies (`<TO SUPPLY>`) | 8% of the pre-HST quoted price. HST passes to the artist in full. For $650 + $84.50 HST: fee $52, payout $682.50. The literal alternative, 8% of the total collected, gives a $58.76 fee. | **Yes** |
| D4 | Late booker cancellation compensation (L2-042.2) | The deposit minus 8% of it, half-up: $162.50 gives $149.50 to the artist and $13.00 to Zamaro. With HST, apply the D3 rule to the deposit's pre-HST part. | **Yes** |
| D5 | Payout due date and holidays (`<TO SUPPLY>`) | `due_by` is 2 business days after the balance is collected (Mon 16 Nov → Wed 18 Nov). Business days exclude weekends and Ontario statutory holidays, including the observed weekday when one falls on a weekend: New Year's Day, Family Day, Good Friday, Victoria Day, Canada Day, Labour Day, Thanksgiving, Christmas and Boxing Day. `payments:send-due-payouts` runs hourly, 09:00–17:00 on business days. | **Yes** |
| D6 | When a late-cancellation payout is due | 2 business days after the cancellation, through the same payout run | **Yes** |
| D7 | Balance retry offsets (`<TO SUPPLY>`) | Count from the first failure, at the same time of day: +1, +3 and +7 days, so Tue 17, Thu 19 and Mon 23 Nov at 7:00 p.m. for ZAM-0114. The final failure alerts. | **Yes** |
| D8 | What the balance charge uses (`<TO SUPPLY>`) | Store the processor payment-method ID from the deposit on the booking (`balance_payment_method_id`) and charge it off-session. Don't rely on the customer's default card. A Pay-balance success replaces it. | No |
| D9 | Decline wording (`<TO SUPPLY>`, beyond insufficient funds) | Heading "Your bank declined the card". `insufficient_funds`: "The bank said there isn’t enough credit on it." `card_not_supported` or `do_not_honor`: "The bank said the card is blocked for online payments." `expired_card`: "The card has expired." `incorrect_cvc`: "The security code didn’t match." `authentication_required`: "The bank couldn’t confirm it was you." Anything else: "The bank didn’t say why. Try another card or call your bank." | **Yes** |
| D10 | "In flight" window for competing requests (`<TO SUPPLY>`) | A competing Accepted booking with a `Pending` deposit payment created in the last 15 minutes is left for its own confirmation to resolve as a lost race | No |
| D11 | Late problem reports (`<TO SUPPLY>`) | Keep the design: 422, with copy pointing to hello@zamaro.ca. Nothing reaches an administrator automatically. | **Yes** |
| D12 | Artist loses payout capability (`<TO SUPPLY>`) | The profile stays published. New payouts stay `Scheduled`, and the earnings page shows "Set up payouts" again. | **Yes** |
| D13 | Payout gate on publication (L2-039.1) | Publishing checks `payout_ready`. M3's approval now leaves the profile unpublished until ready. Seeded cast artists are payout ready, except Tobi Adeyemi. | **Yes** |
| D14 | Receipt number format (`<TO SUPPLY>`) | The booking number plus a per-booking sequence: `ZAM-0114-1` (deposit), `ZAM-0114-2` (balance or refund) | **Yes** |
| D15 | Business number (`<TO SUPPLY>`) | The user supplies Zamaro's CRA business number for `zamaro.business_number`. Dev and e2e use `000000000RT0001`, and boot fails in production if it is unset. | **Yes** |
| D16 | Several receipts on one booking (`<TO SUPPLY>`) | "Download receipts" saves one PDF per receipt, in turn, as `receipt-ZAM-0114-1.pdf` and `receipt-ZAM-0114-2.pdf` (L2-040.2 "a PDF receipt for each payment") | **Yes** |
| D17 | PDF library (`<TO SUPPLY>`) | `dompdf/dompdf`: pure PHP, no browser in the API image, with fonts embedded from the design system | No |
| D18 | HST on Zamaro's own fee and Zamaro's tax registration | Out of M6 scope. Receipts show only the artist's HST line. Flag it for an accountant before launch. | **Yes** |
| D19 | Disputes and chargebacks (not designed) | The router records dispute events and calls `AlertAdministrators` (kind `PaymentDisputed`). No status change; handling is M8. | **Yes** |
| D20 | Webhook timestamp tolerance (`<TO SUPPLY>`) | 300 seconds | No |
| D21 | Reconciliation time and report page (`<TO SUPPLY>`) | 04:00 America/Toronto for the previous day; alerts only, with no report page | No |
| D22 | `processor_events` retention (`<TO SUPPLY>`) | 13 months, pruned monthly. Payloads never hold card data. | **Yes** |
| D23 | Payout setup prompt on the dashboard (`<TO SUPPLY>`) | No. The mock has none, and the prompt lives on Earnings. | No |
| D24 | 3-D Secure and test cards in the fake | Stripe's numbers: 4242 4242 4242 4242 succeeds; 4000 0000 0000 9995 is `insufficient_funds`; 4000 0000 0000 0069 is `expired_card`; 4000 0027 6000 3184 asks for 3-D Secure; 4000 0000 0000 0002 is a generic decline. Off-session balance failures on the saved Visa 4242 come from `failNext`. | No |

## Design conflicts

| # | Conflict | Resolution |
|---|---|---|
| C1 | The designs put `PaymentGateway` in `App\Services\Payments`, and `PriceBreakdown` and `IdempotencyKey` in `App\Support`. AGENTS.md puts ports in `Contracts/`, adapters in `Integrations/`, and keeps `Support/` for code with no subsystem. | `app/Contracts/PaymentGateway.php` and `app/Integrations/Payments/{FakePaymentGateway, FakeProcessorLedger}`. `PriceBreakdown` stays in `Services/Payments` (where M5 put it), joined by `IdempotencyKey` and `PaymentOperation`. Update the five payments designs (S1 ADR). |
| C2 | Refund keys are named three ways: `deposit-refund:{bookingId}` (pay-deposit), `cancel-refund:{bookingId}:{paymentId}` (cancel-booking) and `refund:{refundId}` (reconcile). | Every refund writes a pending `refunds` row first, and its key is `refund:{refundId}`. The charge keys stay `deposit:{bookingId}`, `balance:{bookingId}:{attempt}`, `balance:{bookingId}:link` and `payout:{bookingId}`. |
| C3 | `cancel-booking` queues `ArtistCancellationReviewAlert`, while every other alert goes through `AlertAdministrators`. | `AlertAdministrators` with kind `ArtistCancellationReview`. |
| C4 | `CancellationPolicy` is a value object in M1 (pick-a-date) and a domain service with `forBooker()` and `forArtist()` in cancel-booking. | One class, `Services/Bookings/CancellationPolicy`, keeping `freeCancellationUntil()` and adding the quote methods. Update `pick-a-date-and-start-booking`. |
| C5 | M4 deferred a "dashboard earnings card", but neither the design nor the mock has one: "The dashboard shows no money totals… totals stay on Earnings", and the mock note says "No money totals here". | M6 enables the Earnings nav link and the "Coming up" caption link "Fees and payouts are on Earnings". It adds no card. If the user wants a card, it needs a requirement, design and mock first (AGENTS.md). |
| C6 | The earnings design places a "payout account panel" in every state, but the default mock has only the line "Payouts go to your bank account ending 4417 within 2 business days of the balance being collected. Zamaro holds each deposit until then." | Follow the mock: the panel appears only in the setup state. |
| C7 | `PriceBreakdown::platformFeeCents(collectedCents)` charges the fee on everything collected, while the inbox payout (M5) uses the quote. | Both follow D3. `CreatePayout` computes the fee on the pre-HST part of what was collected. |
| C8 | The booker's page has three Expired variants (no reply, deposit unpaid, lost race) but `BookingResource` carries no reason. | Add `endedReason` from the last transition's reason: `no-reply`, `deposit-unpaid`, `booked-by-another-church`. |
| C9 | The pages show deposit, balance, refunds, retry and hold details that `BookingResource` lacks. | Add `payments[]` (kind, status, amount, brand, last4, paid date), `refunds[]`, `balanceDueAt`, `nextBalanceRetryAt`, `heldAt`, `receipts[]` and `cancellation` (who, refund, compensation). |
| C10 | The pay-balance mock shows Zamaro-styled card inputs with inline errors ("Enter all 16 digits; this number has 15."), but L2-035 requires processor-hosted fields. | `CardFieldsService` renders the processor's fields. Their validation events feed Zamaro's error summary and inline errors. The fake SDK mimics both, and card data never reaches the API (S2 test). |
| C11 | A problem report holds the booking until "an administrator resolves it" (L2-068), which is M8. | M6 sets and respects `held_at` only. Held bookings stay held until M8, and the alert email links to the reserved `/admin/bookings/{number}`. |
| C12 | The completed and balance-due mocks show "Leave a review", which is M7. | The button is hidden until M7, behind the `reviews` flag. |
| C13 | M3 publishes approved artists, but L2-039.1 now requires payout readiness. | D13, with the publication check updated in `review-artist-application`. |

## The booking state machine (M6 additions)
Statuses and pairs are unchanged from L2-029. M6 starts using the pairs that M5 left idle and attaches money to them.

| From | To | Actor | Trigger | Slice |
|---|---|---|---|---|
| Accepted | Confirmed | Booker (confirm endpoint) or System (webhook) | `ConfirmDepositPayment`, under the artist row lock | S1, S3 |
| Accepted | Expired | System | Lost race: the date is already Confirmed; the deposit is refunded in full; reason `booked-by-another-church` | S4 |
| Requested, Accepted | Declined | System | `DeclineCompetingRequests` after a Confirmed commit; reason "Booked by another church" | S4 |
| Accepted | Expired | System | `bookings:expire-unpaid-deposits` once `deposit_due_by` passes; reason `deposit-unpaid` | S5 |
| Confirmed | Cancelled | Booker | `CancelBookingAsBooker`: early refund or late compensation | S7 |
| Confirmed | Cancelled | Artist | `CancelBookingAsArtist`: full refund and a required reason | S8 |
| Confirmed | Completed | System | M5's `bookings:complete`. `BookingCompleted` now schedules the balance for event start + 48 h. | S9 |

States that are not booking statuses:
- **Payment** status: `Pending`, `Succeeded`, `Failed`.
- **Refund** status: `Pending`, `Succeeded`, `Failed`.
- **Payout** status: `Scheduled`, `Sent`, `Paid`, `Failed`.
- **`bookings.held_at`.**

The booking-detail states balance-due, held and balance-failed are Completed bookings told apart by these fields.

## Slices

#### S0 — Fake processor harness and scenarios (test-only, outside ATDD)
- **e2e allowlist:** `/__e2e/artisan` gains `bookings:expire-unpaid-deposits`, `payments:charge-due-balances`, `payments:send-due-payouts` and `payments:reconcile`.
- **New route** `POST /__e2e/processor` with three operations:
  - `deliverPending`: sends the fake ledger's queued webhooks;
  - `failNext {operation, code}`;
  - `drift {bookingNumber}`: makes a ledger record disagree.
- **New scenarios:** `zam-0114-confirmed`, `zam-0114-late` (clock Thu 5 Nov), `zam-0114-completed-balance-due` (clock Sun 15 Nov 8:00 p.m.), `zam-0114-held`, `zam-0114-balance-failed`, `zam-0114-cancelled`, `zam-0114-artist-cancelled`, `zam-0114-competing` (Harvest Point Accepted on Sat 14 Nov), `tobi-payouts-not-set-up`.
- **Fixture:** `e2e/fixtures/processor.ts`.
- **Verify:** each scenario loads twice to the same state.

#### S1 — Pay the deposit
- **L2:** 035.1–2, 036.1, 037.1, 044.1, 063.1 (deposit paid and confirmed, both parties), 108.1–2.
- **Behaviour:**
  - Naomi opens ZAM-0114 (`zam-0114-accepted`, clock Fri 9 Oct 3:05 p.m.). With the flag on, "Pay $162.50 deposit" opens the dialog:
    - "ZAM-0114 · Accepted · Sat 14 Nov", "Pay the $162.50 deposit" and "Due by Sun 11 Oct, 2:40 p.m. Paying confirms Sat 14 Nov with Abigail.";
    - the summary: $650, "Deposit due now (25%)" $162.50, "Balance after the event" $487.50, "Pay now" $162.50;
    - "These fields are hosted by our payment processor. Your card number goes straight to them; Zamaro never sees or stores it.";
    - the consent box "Save this card for the $487.50 balance" with "Charged 48 hours after the event, Mon 16 Nov at 7:00 p.m., unless you report a problem first.";
    - "Cancel free up to 14 days before your event." with "Cancellation policy".
  - Paying with 4242 shows "Paying $162.50…". The booking becomes Confirmed.
  - The page then shows:
    - "Deposit $162.50 paid Fri 9 Oct, Visa ending 4242";
    - "Free cancellation until Sat 31 Oct. Your card ending 4242 is saved for the balance.";
    - the contact card: Abigail 905-555-0148, abigail@abigailmensah.ca.
  - Both parties get the confirmation email, which includes the policy partial (L2-044.1).
  - Abigail's page shows "You’re booked" with "Riverside paid the deposit on Fri 9 Oct at 3:05 p.m. Zamaro holds it until the event, and Sat 14 Nov is Booked on your calendar.". Her calendar shows Booked.
  - `payments` holds the processor IDs, brand, last4, expiry month and year, and nothing else (L2-035.2).
  - A network retry with the same key reaches the same intent, and there is one charge.
- **Tests first:**
  - `tests/Feature/Payments/PayDepositTest.php`: summary, start, confirm, re-confirm (no second transition), stranger 404, Abigail 404 on the booker endpoints.
  - `tests/Feature/Payments/CardDataNeverStoredTest.php`: request logs and tables hold no PAN or CVC pattern.
  - `tests/Feature/Notifications/BookingConfirmedEmailTest.php`.
  - `e2e/specs/payments/pay-deposit.spec.ts`, with `pages/pay-deposit.dialog.ts`.
- **Build:**
  - `Contracts/PaymentGateway`: `ensureCustomer`, `createPaymentIntent`, `retrievePayment`, `refund`, `verifyWebhook`, `listRecords`. Later slices add `chargeSavedCard`, `createConnectedAccount`, `createOnboardingLink`, `retrieveConnectedAccount` and `createTransfer`.
  - `Integrations/Payments/FakePaymentGateway`, with a boot guard against production.
  - `Services/Payments/{IdempotencyKey, PaymentOperation}`; `Enums/{PaymentKind, PaymentStatus}`.
  - `DepositController` (`payment-summary`, `deposit`, `deposit/confirm`), `StartDepositRequest`, `ConfirmDepositRequest`, `StartDepositPayment`, `ConfirmDepositPayment`.
  - Resources: `PriceBreakdownResource`, `DepositIntentResource`, `DepositResultResource`.
  - `users.processor_customer_id` and `bookings.balance_payment_method_id` (D8).
  - Events: `BookingConfirmed`, `PaymentSucceeded`. Notifications: `BookingConfirmedNotification` and `emails.partials.cancellation-policy`.
  - Frontend:
    - `dialogs/pay-deposit/`;
    - `api/lib/services/payments` (`PaymentsApi`, `PAYMENTS_API`, HTTP implementation and fake);
    - `api/lib/payments/card-fields.ts` (`CARD_FIELDS` token), with `ProcessorCardFieldsService` as a stub that throws until M10, and `FakeCardFieldsService`;
    - `PaymentStore`;
    - the `payments` flag on (D2).
- **ADR:** the PaymentGateway port, the fake processor and the card-fields token (C1, D1, D24).
- **Components and scenarios:** `zm-payment-summary`, `zm-card-fields` (the host for the token's fields) and `zm-checkbox` (if absent), each with a scenario.
- **Route states:** `/bookings/ZAM-0114` (`zam-0114-confirmed`) → `booking-detail/confirmed.html`; `/artist/bookings/ZAM-0114` → `request-detail/confirmed.html`.

#### S2 — Consent, card errors, declines and 3-D Secure
- **L2:** 035.3, 037.3, 108.1, 108.3, 109.2.
- **Behaviour:**
  - Pressing Pay with no consent, a 15-digit number and an empty CVC shows "Fix 3 things to pay", with "Tick the box so we can charge the balance after the event." on the consent box. Nothing is sent.
  - Card 4000 0000 0000 9995 gives 402. The dialog stays open with "Your bank declined the card" and "The bank said there isn’t enough credit on it.". The card fields clear, while the name, postal code and consent stay. The button becomes "Pay with another card".
  - The danger toast "Payment failed" reads "Your bank declined the $162.50 deposit. Nothing was charged; try another card by Sun 11 Oct, 2:40 p.m." and stays until dismissed.
  - The booking stays Accepted and the `Payment` is `Failed`. A second card reuses the intent.
  - Card 4000 0027 6000 3184 shows the fake 3-D Secure challenge. "Fail" leaves the booking Accepted; "Complete" confirms it.
- **Tests first:** `tests/Feature/Payments/DepositDeclinesTest.php` (each D9 code maps to its sentence), and new cases in `pay-deposit.spec.ts`.
- **Build:** `Services/Payments/DeclineReasonTranslator`, the 402 problem `card-declined` (with `declineMessage`), and the fake SDK's challenge modal.

#### S3 — Signed webhooks, once only
- **L2:** 041.1–2, 092.1, 093 (security events).
- **Behaviour:**
  - Naomi pays, then closes the tab before `confirm` returns. `deliverPending` posts `payment_intent.succeeded`, which is signed, and ZAM-0114 becomes Confirmed through `ConfirmDepositPayment`.
  - The same event delivered again inserts nothing and changes nothing.
  - A bad signature gets 400, and the `security` channel logs the request ID, source IP and event type, with no payload.
  - A timestamp 301 s old gets 400 (D20).
  - An unknown type is recorded and ignored. A dispute event alerts administrators (D19).
  - A handler failing 5 times lands in `failed_jobs`.
- **Tests first:** `tests/Feature/Payments/PaymentWebhookTest.php` (valid, invalid signature, stale, duplicate, unknown, out-of-order after a browser confirm), and an e2e case "deposit confirmed by webhook".
- **Build:**
  - `POST /api/v1/webhooks/payments` (in `api_public.php`, outside session and CSRF, raw body), `PaymentWebhookController`.
  - `RecordProcessorEvent` (`ON CONFLICT DO NOTHING`), migration `processor_events`, `Jobs/Payments/ProcessProcessorEvent`, `Services/Payments/ProcessorEventRouter`.
  - `Support/Security/SecurityEventLogger`.
  - `processor-events:prune` (D22).
- **ADR:** payment webhook intake: raw body, signature, dedupe and routing.

#### S4 — Two churches, one date
- **L2:** 032.1–3, 040 (refund receipt in S6), 063.1 (declined).
- **Behaviour:**
  - In `zam-0114-competing`, Harvest Point's Accepted request is on Sat 14 Nov.
  - Both bookers pay at the same moment, as two parallel confirms. Exactly one booking becomes Confirmed.
  - The other is refunded $162.50 in full and becomes Expired. Its dialog reads:
    - "ZAM-0114 · Expired · Sat 14 Nov", "Sat 14 Nov is no longer free" and "Abigail was booked by another church moments ago.";
    - "Refund to Visa ending 4242" −$162.50, and "You pay" $0;
    - "Find who’s free Sat 14 Nov".
  - Once ZAM-0114 confirms, the remaining Requested bookings for Abigail on that date become Declined with "Booked by another church", and their bookers are emailed.
  - A booking whose own deposit started within 15 minutes is left Accepted (D10).
  - A direct insert of a second `confirmed` row is rejected by `bookings_one_confirmed_per_date`.
- **Tests first:** `tests/Feature/Payments/ConcurrentDepositsTest.php` (two processes, real transactions) and `tests/Feature/Bookings/DeclineCompetingRequestsTest.php`.
- **Build:** the lost-race branch in `ConfirmDepositPayment`, `Actions/Payments/RefundPayment`, `Jobs/Payments/IssueRefund` (`refund:{refundId}`, C2), `RefundSucceeded`, `Actions/Bookings/DeclineCompetingRequests` (a listener on `BookingConfirmed`), and `endedReason` (C8).

#### S5 — Unpaid deposits expire
- **L2:** 037.2, 063.1 (expired, both parties), 092.2–3.
- **Behaviour:**
  - At Sun 11 Oct 2:40 p.m., `bookings:expire-unpaid-deposits` moves ZAM-0114 (`zam-0114-accepted`) to Expired, and both parties are emailed. A second run does nothing.
  - The page reads "Expired Sun 11 Oct, 2:40 p.m.", "The $162.50 deposit wasn’t paid by Sun 11 Oct, 2:40 p.m. You were both told.", "Ask Abigail again", and "Nothing was charged. Sat 14 Nov is open on Abigail’s calendar again, so you can ask her again while she’s free.".
  - A deposit that succeeds at the processor after expiry is refunded in full (S4 path).
  - If D21 of M5 was accepted, the warning toast "Luz Viva deposit due" shows within 24 h.
- **Tests first:** `tests/Feature/Payments/ExpireUnpaidDepositsTest.php`, and an e2e case in `run-booking-lifecycle.spec.ts`.
- **Build:** `Console/Commands/ExpireUnpaidDeposits` (every minute, guarded), `Jobs/Bookings/ExpireUnpaidDeposit`, and reason `deposit-unpaid` on `RequestExpired`.
- **Route states:** `/bookings/ZAM-0114` after expiry → `booking-detail/deposit-expired.html`.

#### S6 — Receipts
- **L2:** 040.1–2, 063.2, 074.2.
- **Behaviour:**
  - After the ZAM-0114 deposit, Naomi is emailed receipt ZAM-0114-1 (D14). It shows the booking number, Abigail Mensah, Sat 14 Nov 2026, $162.50, no tax line, "Visa ending 4242" and the business number (D15).
  - The confirmed page shows "Download receipt", which saves `receipt-ZAM-0114-1.pdf`. A refund produces a refund receipt, and the button reads "Download refund receipt".
  - A repeated `PaymentSucceeded` creates no second receipt.
  - Renaming Abigail later leaves the PDF unchanged.
  - Grace and Abigail get 404 on the receipt endpoints.
- **Tests first:** `tests/Feature/Payments/ReceiptsTest.php` (the PDF's text is extracted and asserted), `tests/Feature/Notifications/ReceiptEmailTest.php`, `e2e/specs/payments/issue-receipts.spec.ts` (download events).
- **Build:** migration `receipts`, `IssueReceiptListener`, `IssueReceipt`, `ReceiptNotification`, `ReceiptController` (`index`, `pdf`), `Services/Payments/ReceiptPdfRenderer` (D17), `api/lib/services/receipts`, and the download in `BookingDetailPage` (D16).
- **ADR:** receipt PDFs rendered from frozen snapshots with dompdf.

#### S7 — The booker cancels
- **L2:** 042.1–4, 044.2, 063.1 (cancelled, both parties), 108.1.
- **Behaviour:**
  - **Early** (`zam-0114-confirmed`, Fri 9 Oct): "Cancel booking" opens "Cancel the worship night with Abigail?" with:
    - "You’re 36 days out, so you’ll get $162.50 back.";
    - "Refund to Visa ending 4242" $162.50, and Balance "Never charged".
  - "Cancel booking" leads to step two: "Last step: cancel ZAM-0114?", "You’ll get $162.50 back and Abigail’s date opens to other churches.", and "This can’t be undone. To have Abigail again you’d send a new request, and her date may be gone.". Focus starts on "Go back"; "Yes, cancel the booking" shows "Cancelling…".
  - The cancelled page reads "You cancelled Fri 9 Oct, 36 days before the event. Full refund." and "Refunds reach your card in 5 to 10 business days. Abigail’s date is free again.". Sat 14 Nov is Free in search and on her calendar.
  - The free-cancellation date counts in full: Sat 31 Oct at 11:59 p.m. is still early.
  - **Late** (`zam-0114-late`, Thu 5 Nov): "It’s 9 days to the event, inside the 14-day window. Your $162.50 deposit won’t be refunded.", with "Cancel and lose $162.50". The result is a pending $149.50 payout to Abigail (D4, D6), and the balance is never charged.
  - If midnight passes while the dialog is open, the API answers 409 `cancellation-terms-changed` with the fresh quote.
  - On failure: "Your booking wasn’t cancelled" with "We couldn’t reach the server. Abigail still has the date and no refund was started.".
  - Abigail's page shows "Riverside cancelled" with "Naomi cancelled on Fri 9 Oct at 4:30 p.m., 36 days before the event, so Riverside gets its deposit back. Sat 14 Nov is Free on your calendar again.".
- **Tests first:** `tests/Feature/Bookings/CancelBookingAsBookerTest.php` (quote boundaries in Toronto time, terms changed, stranger 404), `e2e/specs/bookings/cancel-booking.spec.ts`, `pages/cancel-booking.dialog.ts`.
- **Build:**
  - Routes `GET …/cancellation-quote` and `POST …/cancel`; `BookingCancellationController`, `CancelBookingRequest`, `CancelBookingAsBooker`.
  - `CancellationPolicy` as a service (C4), with `CancellationQuote` and `CancellationQuoteResource`.
  - Booking columns `cancelled_by`, `cancellation_reason`, `cancellation_refund_cents` and `cancellation_compensation_cents`.
  - `IssueRefund` reused; the `payouts` table is created here with the S13 schema.
  - `BookingCancelled` with `BookingCancelledNotification`, and `dialogs/cancel-booking/`.
- **Route states:** `booking-detail/cancelled.html` and `request-detail/booker-cancelled.html`.

#### S8 — The artist cancels
- **L2:** 043.1–3, 063.1 (cancelled).
- **Behaviour:**
  - On `request-detail/confirmed`, "Cancel booking" opens "Cancel the worship night on Sat 14 Nov?" with "Riverside gets back everything they paid and is shown 3 similar artists free that day. This can’t be undone.".
  - With no reason, the dialog shows "Give a reason to cancel" and "Tell Riverside why you’re cancelling. They see it with the refund.".
  - With the reason "My sister’s wedding has moved to that weekend and I have to be there. I’m so sorry, Naomi. I hope Riverside will ask me again." the booking becomes Cancelled, and every succeeded payment is refunded in full.
  - The reason appears in the thread.
  - Naomi's page reads "Abigail cancelled Fri 9 Oct at 4:30 p.m. Everything you paid is refunded.", lists Hosanna Collective, Elijah Park and Daniel & Ruth Okonkwo, and reads "Abigail cancelled, so everything you paid comes back in full. Refunds reach your card in 5 to 10 business days.".
  - Abigail's panel reads "You cancelled" and "Riverside was refunded in full and shown 3 similar artists free on Sat 14 Nov. Sat 14 Nov is Free on your calendar again.".
  - Her third artist cancellation within 12 months alerts Priya (C3).
- **Tests first:** `tests/Feature/Bookings/CancelBookingAsArtistTest.php` (the 12-month count from `booking_transitions`, Naomi 404 on the artist route), and `pages/artist-cancel-booking.dialog.ts`.
- **Build:** `POST /api/v1/artist/bookings/{number}/cancel`, `ArtistBookingCancellationController`, `ArtistCancelBookingRequest`, `CancelBookingAsArtist`, `similarArtists` reused for Cancelled-by-artist, and `dialogs/artist-cancel-booking/`.
- **Route states:** `booking-detail/artist-cancelled.html` and `request-detail/cancelled.html`.

#### S9 — Charge the balance
- **L2:** 038.1, 040.1, 063.1 (balance charged), 092.2–3.
- **Behaviour:**
  - **Before the charge** (`zam-0114-completed-balance-due`, clock Sun 15 Nov 8:00 p.m.): the page shows "Completed Sun 15 Nov", "$487.50 balance charged Mon 16 Nov, 7:00 p.m., unless you report a problem first.", "Balance on Mon 16 Nov, 7:00 p.m." $487.50, and "Report a problem".
  - **The charge:** at Mon 16 Nov 7:00 p.m., `payments:charge-due-balances` charges $487.50 to the saved card with key `balance:{id}:1`.
    - Naomi gets the balance-charged email and receipt ZAM-0114-2.
    - The page reads "Balance paid Mon 16 Nov" and offers "Download receipts".
    - Abigail's page reads "Completed" and "Payout of $598 is on its way and reaches your bank account within 2 business days, by Wed 18 Nov.".
  - **Repeats:** a repeated or late run charges nothing twice, and a run missed overnight catches up.
- **Tests first:** `tests/Feature/Payments/CollectBalanceTest.php`, and `e2e/specs/payments/collect-balance.spec.ts`.
- **Build:**
  - `Console/Commands/ChargeDueBalancesCommand` (hourly), `FindDueBalances`, `Jobs/Payments/ChargeBookingBalance`, `CollectBalance`.
  - `PaymentGateway::chargeSavedCard`.
  - `BalanceCharged` with `BalanceChargedNotification`.
  - Columns `payments.attempt`, `next_retry_at` and `failure_code`.
- **Route states:** `booking-detail/balance-due.html`, `booking-detail/completed.html` and `request-detail/completed.html`.

#### S10 — Failed balance, retries and Pay balance
- **L2:** 035.3, 038.3, 108.2–3.
- **Behaviour:**
  - With `failNext {operation: balance, code: card_declined}`, the Mon 16 Nov charge to the saved Visa 4242 fails. The page shows:
    - "The balance didn’t go through" with "Your bank declined the $487.50 balance on Visa ending 4242. Pay with another card, or we try again Tue 17 Nov at 7:00 p.m.";
    - "Pay $487.50 balance".
  - Naomi gets a payment-link email to `/bookings/ZAM-0114?pay=balance` after each failure.
  - Retries run Tue 17, Thu 19 and Mon 23 Nov (D7). The fourth failure alerts Priya (`BalanceCollectionFailed`).
  - Opening the link opens "Pay the $487.50 balance" with "The charge to Visa ending 4242 didn’t go through. Pay with another card and we stop retrying.".
    - Errors: "Fix 2 things to pay"; a blocked card: "The bank said the card is blocked for online payments. Nothing was charged; the balance is still $487.50. Try another card."
    - Success clears `next_retry_at`.
- **Tests first:** `tests/Feature/Payments/BalanceRetriesTest.php` and `tests/Feature/Payments/PayBalanceTest.php`; `pages/pay-balance.dialog.ts`.
- **Build:** `BalancePaymentFailedNotification`, `BalanceController` (`balance`, `balance/confirm`, key `balance:{id}:link`), `dialogs/pay-balance/` (reusing `PaymentStore`, `zm-payment-summary` and `zm-card-fields`), and the `?pay=balance` handling.
- **Route states:** `booking-detail/balance-failed.html` (`zam-0114-balance-failed`).

#### S11 — Report a problem and hold
- **L2:** 038.2, 039.3, 108.1.
- **Behaviour:**
  - At Mon 16 Nov 9:20 a.m., "Report a problem" opens "Report a problem with the night" with "We hold the $487.50 balance and Abigail’s payout, and the Zamaro team contacts you both.".
  - Submitting empty shows "Tell us what went wrong" and "Describe what went wrong. The team reads it before contacting you.".
  - "Report and hold the balance" shows "Sending report…". The page then reads "Balance on hold" with "Thanks for telling us. We won’t charge the $487.50 balance or pay Abigail until the Zamaro team has spoken with you both.". Priya gets a `BookingHeld` alert.
  - The 7:00 p.m. run skips the booking, and the payout run skips it later.
  - A report after the window (Mon 16 Nov 7:01 p.m.) gives 422 (D11).
  - A report racing the charge: the job locks the booking and re-checks `held_at`.
  - On failure: "Your report didn’t send".
- **Tests first:** `tests/Feature/Payments/ReportProblemTest.php` (window boundary, race, stranger 404), and `pages/report-problem.dialog.ts`.
- **Build:** `ProblemReportController`, `ReportProblemRequest`, `ReportBookingProblem`, migration `problem_reports`, `bookings.held_at`, the `BookingHeld` alert kind, and `dialogs/report-problem/`.
- **Route states:** `booking-detail/held.html` (`zam-0114-held`).

#### S12 — Payout onboarding and the publication gate
- **L2:** 039.1, 074.1.
- **Behaviour:**
  - Tobi Adeyemi (`tobi-payouts-not-set-up`) opens `/artist/earnings` and sees "Approved · set up payouts to go live" and the "Set up payouts" panel ("Your profile goes live once our payment processor can pay you…").
  - The action redirects to the fake processor's onboarding page, which returns to `/artist/earnings`. `GET …/payout-account` then syncs `payout_ready`, and his profile publishes (D13).
  - Before that, his profile returns the M1 not-found page.
  - The `account.updated` webhook with payouts disabled sets `payout_ready` false (D12).
  - Naomi calling the payout endpoints gets 404.
- **Tests first:** `tests/Feature/Payments/PayoutAccountTest.php`, `tests/Feature/ArtistOnboarding/PublicationRequiresPayoutsTest.php`, `e2e/specs/payments/pay-out-artists.spec.ts`, `pages/earnings.page.ts`.
- **Build:** `PayoutAccountController`, `StartPayoutOnboarding`, `SyncConnectedAccount`, `artists.processor_account_id`, `payout_ready` and `payout_bank_last4`, the connected-account methods on the gateway, the fake's onboarding page, and the publication check.
- **Route states:** `/artist/earnings` (Tobi) → `earnings/setup.html`.

#### S13 — Create and send payouts
- **L2:** 039.2–3, 063.1 (payout sent), 069, 092.2.
- **Behaviour:**
  - `BalanceCharged` for ZAM-0114 creates a `Scheduled` payout: collected $650, fee $52, amount $598, due Wed 18 Nov.
  - On Tue 17 Nov, `payments:send-due-payouts` transfers $598 with key `payout:{id}`, sets it `Sent`, writes an audit entry and emails Abigail.
  - The `transfer.paid` webhook sets it `Paid`.
  - Held ZAM-0114 and not-ready artists are skipped. A rejected transfer gives `Failed` and an alert.
  - A late cancellation's $149.50 payout follows the same path (D6).
  - A repeated `BalanceCharged` creates no second payout. Deposits are never paid out before the balance or a cancellation.
  - Holidays: a balance collected Thu 24 Dec is due Wed 30 Dec. Christmas (Fri 25 Dec), the weekend, and Boxing Day observed (Mon 28 Dec) are skipped.
- **Tests first:** `tests/Feature/Payments/PayoutsTest.php` and `tests/Feature/Payments/BusinessDayCalendarTest.php` (through the command).
- **Build:** `CreatePayoutListener`, `CreatePayout`, `SendDuePayoutsCommand` (hourly on business days), `SendPayout`, `Services/Payments/BusinessDayCalendar` (D5), `PayoutSent` with `PayoutSentNotification`, `Enums/PayoutStatus`, and `createTransfer` on the gateway.
- **ADR:** business days and Ontario statutory holidays for payouts.

#### S14 — Earnings page and workspace links
- **L2:** 039.4, 105.1, 110.
- **Behaviour:**
  - Abigail on `/artist/earnings` sees "Earnings" and "Paid out $1,196 in 2026 · 6 upcoming bookings · deposits held $1,037.50", with "Payouts go to your bank account ending 4417 within 2 business days of the balance being collected. Zamaro holds each deposit until then.".
  - **Upcoming:** six "Deposit held" rows, for example Sun 18 Oct Living Waters Fellowship, "Sunday service, Brampton", "Total $650 · Zamaro fee $52 · payout $598", and Sat 21 Nov Kingdom Life Centre at "Total $900 · Zamaro fee $72 · payout $828".
  - **Paid out:** St. Brendan’s Anglican "Paid Tue 15 Sep" and Riverside Community Church "Paid Tue 16 Jun".
  - Miriam sees the empty state with "See your requests". The error state reads "We couldn’t load your earnings" with "Payouts still go out on schedule; this only affects what you see here.".
  - The artist shell's Earnings link and the dashboard's "Fees and payouts are on Earnings" now work (C5).
- **Tests first:** `tests/Feature/Payments/ArtistEarningsTest.php` (totals, cursor, other artist's rows absent), and new cases in `pay-out-artists.spec.ts`.
- **Build:** `EarningsController`, `EarningsLineResource`, a summary `meta`, `pages/earnings/` (`EarningsPage`, `EarningsStore`), and `api/lib/services/payouts` (`PayoutsApi`, token, fake).
- **Components and scenarios:** earnings rows reuse `zm-booking-list-item`; add the composite `EarningsList` (24 rows).
- **Route states:** `/artist/earnings` (Abigail) → `earnings/default.html`; Miriam → `earnings/empty.html`; loading and error by interception.

#### S15 — Daily reconciliation
- **L2:** 041.3–4, 092.2.
- **Behaviour:**
  - At 04:00 on Tue 17 Nov, `payments:reconcile` compares Mon 16 Nov's fake-ledger records with Zamaro's payments, refunds and payouts.
  - With `drift ZAM-0114` it records one mismatch (the processor shows $487.00, Zamaro $487.50), and Priya gets a `PaymentMismatch` alert naming ZAM-0114.
  - Re-running the day replaces the run.
  - A test hooks the adapter and shows that every charge, refund and transfer request carries an idempotency key.
- **Tests first:** `tests/Feature/Payments/ReconcilePaymentsTest.php` and `tests/Feature/Payments/IdempotencyKeysOnProcessorCallsTest.php`.
- **Build:** `ReconcilePaymentsCommand` (D21), `PaymentReconciler`, migrations `reconciliation_runs` and `reconciliation_mismatches`, `PaymentGateway::listRecords`, and the `PaymentMismatch` alert kind.

## Vendor ports and fakes
- **`PaymentGateway`** (`app/Contracts`) is the only route to the processor. The M10 Stripe adapter implements the same methods.
- **`FakePaymentGateway`** (`app/Integrations/Payments`) is deterministic:
  - **Storage and IDs:** it keeps a ledger in Redis (dev and e2e) or in memory (phpunit). IDs are `cus_fake_{userId}`, `pi_fake_{bookingNumber}_{n}`, `re_fake_{refundId}`, `tr_fake_{bookingNumber}` and `acct_fake_{artistSlug}`.
  - **Outcomes:** the D24 test cards decide each outcome. `failNext()` injects a decline, a timeout or a 500.
  - **Idempotency:** it refuses any mutating call without an `IdempotencyKey`. A repeated key with the same parameters returns the first result; with different parameters it throws.
  - **Webhooks:** every state change queues a webhook signed with HMAC-SHA256 over `{timestamp}.{body}` (header `Zamaro-Fake-Signature: t=…,v1=…`). Webhooks are delivered on `deliverPending` (e2e) or synchronously when `zamaro.payments.fake_webhooks=sync`.
  - **Reconciliation:** `listRecords()` reads the ledger, and `drift()` falsifies one record.
- **`FakeCardFieldsService`** (frontend) renders look-alike fields inside `zm-card-fields`. Card numbers stay in the browser. It returns `pm_fake_{last4}` and runs the fake 3-D Secure modal. Production builds bind `ProcessorCardFieldsService`, which throws if the fake would be bound.
- **The fake's hosted onboarding page** is served by the API only when fakes are bound. It returns to `/artist/earnings`.

## Seed data additions (idempotent, keyed on natural keys)
- **Deposit payments** (Succeeded, Visa 4242) on Abigail's six Confirmed bookings: $162.50 each, and $225 for Kingdom Life Sat 21 Nov ($900). Together they give the "deposits held $1,037.50".
- **ZAM-0097:** its $237.50 payment gains processor IDs and a receipt.
- **ZAM-0061** (Sun 14 Jun) and **St. Brendan’s Sun 13 Sep:** deposit and balance payments, receipts, and `Paid` payouts of $598 (Tue 16 Jun and Tue 15 Sep), adding up to "Paid out $1,196 in 2026".
- **Payout accounts:** Abigail has `acct_fake_abigail-mensah`, is payout ready, and her bank ends 4417. Every other cast artist is payout ready except Tobi Adeyemi (approved, not ready).
- **ZAM-0104:** Hosanna Collective at Kingdom Life Centre, Sun 4 Oct 10:00 a.m., $800, deposit $200 paid, Completed Mon 5 Oct, problem reported Mon 5 Oct 4:12 p.m. and held, with balance $600 and payout $736 paused. It is used now and by M8.
- **Fake ledger:** reseeded to match, so reconciliation of a seeded day reports no mismatch.

## Known risks
- **Double charges:**
  - Browser retries, a confirm racing a webhook, and repeated scheduled runs must each charge at most once. The guards are processor keys derived from the booking, reuse of the intent, the partial unique index on Succeeded payments per booking and kind, and state re-checks under row locks.
  - S1, S3, S4 and S9 all include repeat and concurrency tests.
- **Lost races:** the artist-row lock and `bookings_one_confirmed_per_date` must agree. The loser's refund must survive a processor outage: `IssueRefund` retries, then alerts.
- **Money arithmetic:** use integer cents only, with half-up rounding in one place (`PriceBreakdown`). Deposit + balance = total and fee + payout = collected are asserted on every money test. HST (D3) is the most likely source of a cent drifting.
- **Time zones:** use Toronto days and DST throughout:
  - the free-cancellation boundary (end of Sat 31 Oct);
  - the collection point (event + 48 h across the 1 Nov DST change);
  - retry times;
  - business days;
  - the reconciliation day.
- **The frozen clock and jobs in e2e:** three clocks plus scheduled commands are driven through the M5 harness. Visual masks cover relative captions.
- **PCI scope:** a regression that posts card fields to the API or logs them breaks L2-035. `CardDataNeverStoredTest` scans logs and tables, and the fake keeps card numbers in the browser.
- **Webhooks:** the raw body must reach verification untouched (no JSON middleware rewriting it). Events arrive out of order, so every handler checks the current state.
- **Held bookings** wait for M8 to be resolved, and an early launch would strand money.
- **Fake versus real processor:** Stripe behaviour (async refunds, `requires_action`, payout timing) can differ from the fake. M10 runs the adapter's contract tests against Stripe test mode.
- **Publication gate:** turning it on hides any approved artist without payouts. Check the seeded catalogue before merging S12; the M1 Discover numbers must not move.

## Verification at the end of M6
1. `docker compose --profile e2e up -d --wait`, then `docker compose exec api php artisan test`. Everything is green, including `Payments/*`, the webhook signature cases, and `Security/BookingRouteOwnershipTest` covering every payment, receipt, cancellation, payout and earnings route.
2. Run `php artisan db:seed` twice with no change in counts. Then `php artisan payments:reconcile --day=2026-09-15` reports 0 mismatches. `php artisan schedule:list` shows `bookings:expire-unpaid-deposits`, `payments:charge-due-balances`, `payments:send-due-payouts`, `payments:reconcile` and `processor-events:prune`.
3. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && NG_BUILD_MANGLE=0 npx ng build perf-test`.
4. `cd e2e && npx playwright test` passes both projects: specs, `visual/` for every new route state in light and dark, `a11y/`, and the downloads in `issue-receipts.spec.ts`.
5. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows. `PaymentSummary`, `CardFields` and `EarningsList` appear.
6. **Manual walkthrough** (dev with the `payments` flag on):
   1. **Request and accept:** as Naomi, send ZAM-0114; as Abigail, accept.
   2. **Decline, then pay:** as Naomi, pay with 4000 0000 0000 9995 and see the decline; pay with 4242 and see Confirmed, the contact card and "Download receipt". Check Mailpit for both confirmation emails and the receipt.
   3. **Cancel:** cancel early and see the refund receipt and the date free on Abigail's calendar. Repeat with the clock at Thu 5 Nov and see "Cancel and lose $162.50".
   4. **Balance and payout:** reload `zam-0114-confirmed` and move the clock to Mon 16 Nov 7:00 p.m.:
      - run `payments:charge-due-balances` and see "Balance paid";
      - on Tue 17 Nov, run `payments:send-due-payouts`;
      - as Abigail, see `/artist/earnings`.
   5. **Webhook:** post a webhook with a bad signature and see 400 and a `security` log line.
   6. **Layout:** check everything at 320 px and in the dark theme.
