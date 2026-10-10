# Milestone 7 plan: reviews and notifications

**Status:** Not started. Depends on M1–M6.

## Context

**What exists before M7:**
- **M1:** the read side of reviews.
  - Tables: `reviews` (with `hidden_at`, `hidden_reason`, `hidden_by`), `review_replies` and `artist_ratings`.
  - API and job: `GET /api/v1/artists/{slug}/reviews`, `ListArtistReviews`, and the `RecalculateArtistRating` job.
  - Components: `zm-review` and `zm-rating`.
  - The rating is the mean of visible stars, rounded to 1 dp; the count is of distinct churches; hidden reviews are excluded.
  - Abigail is seeded at 4.9 from 38 churches. The other artists' ratings are written straight into `artist_ratings` by `CastSeeder`, with no reviews behind them.
- **M2:**
  - Sign-in, sessions and CSRF, plus the write rate limiter.
  - The account settings page at `/account`, with its save bar and the marketing consent from `privacy/record-consent`.
  - The email foundation: Mailpit, `TransactionalNotification`, `email_messages` and `i18n:check`.
  - Horizon jobs.
- **M3:**
  - The separate `admin` app, with TOTP, `/admin` 404s for non-administrators, and the admin top bar.
  - `RecordAuditEntry` and the audit log.
- **M4:** the artist workspace, including the dashboard's Reviews panel. Profile cache invalidation has its own ADR.
- **M5:**
  - `/bookings/:number` and `/artist/bookings/:number`, both with a `#messages` thread and contact details.
  - `run-booking-lifecycle`, which writes the Completed transition 24 hours after the event start.
  - Booking emails.
- **M6:** payments, receipts and cancellation, which sets Cancelled.

**Goal:** close the review loop and add the scheduled emails.
- **Reviews:**
  - A booker reviews a Completed booking and can edit it for 7 days.
  - Prompts and one reminder invite the review.
  - The artist replies from `/artist/reviews`.
  - Any signed-in user can report a review.
  - An administrator hides it with a reason, or dismisses the reports, at `/admin/reviews`.
  - The rating recalculates after each publish, edit and hide.
- **Notifications:**
  - Both parties of a Confirmed booking get reminders 7 days and 1 day before the event.
  - Users turn reminders and review prompts off in `/account#preferences`, or with a one-click unsubscribe.

**Work rules (AGENTS.md):**
- One ATDD loop per slice: Given-When-Then criteria, then a failing test, then the code, then the regression set. This is the same loop as M1.
- Page objects own every selector.
- Every new `zm-*` component gets a perf scenario.
- No inline forms: every edit opens a CDK dialog.
- No architecture tests.
- ADRs are named by topic and numbered when they are written. M1 still reserves 0009 (hls.js) and 0010 (slug history).

## Entry criteria and dependencies

- **M1 S13 is merged.** That means `ListArtistReviews`, `RecalculateArtistRating`, `zm-review` and the review replies.
- **M1's open S13 item is done:** Abigail has 38 seeded distinct-church reviews whose mean rounds to 4.9 (see "Seed data additions").
- **M2:**
  - The `auth:sanctum` default, the write limiter, Mailpit in the dev compose stack, and the e2e stub-API sign-in fixtures.
  - `TransactionalNotification`, with `category()` defaulting to `Transactional`, and `email_messages` with a `Suppressed` status.
  - The `/account` save bar, with the `submitting`, `success` and `failed` states.
- **M3:**
  - The admin Playwright project with TOTP sign-in for Priya Nair.
  - `RecordAuditEntry`.
  - The admin nav counts (Applications and Bookings already carry badges).
- **M4:**
  - The `/api/v1/artist` route group, which returns 404 to anyone who isn't an artist.
  - The artist forbidden state.
  - The dashboard Reviews panel, with its link "All reviews".
  - Profile cache invalidation.
- **M5 and M6:**
  - `BookingResource`, the `booking-detail.page.ts` page object, and the Completed and Cancelled statuses.
  - The Completed row in `booking_transitions`.
  - **A way for e2e to show ZAM-0114 after its event.** The `completed` and `balance-due` mocks need a stub-API scenario with ZAM-0114 Completed and the M5 clock fixture set after Sun 15 Nov 2026. If M5 or M6 has not added the scenario, S0 adds it (see Risks).
- **Admin and booking support (M8)** is not needed.

## Decisions to make or confirm

| # | Open point (source) | Recommended default | Needs your OK |
|---|---|---|---|
| D1 | When the 60-day review window closes (leave-review) | It closes at the end of the 60th day after the event date, America/Toronto. For ZAM-0114 that is 23:59 on Wed 13 Jan 2027, matching "until Wed 13 Jan 2027". | No |
| D2 | Edit window rules (leave-review, L2-059.3) | The window runs from `created_at` plus 7 days, on the Toronto wall clock, to the minute: Tue 17 Nov 8:15 p.m. to Tue 24 Nov 8:15 p.m. It is independent of the 60-day window. An edit keeps any artist reply. A hidden review cannot be edited (403). | No |
| D3 | Prompt cadence: "hourly (exact cadence `<TO SUPPLY>`)" (leave-review) | `reviews:send-prompts` runs hourly, with `withoutOverlapping()->onOneServer()`. | Yes |
| D4 | What happens when a missed run makes the prompt and the reminder due together | Send the prompt only and stamp both columns, so the booker gets one email. | Yes |
| D5 | Which bookings get prompts | Only bookings that are Completed, inside the 60-day window, with no review, whose booker account is active and whose gate allows it. Skip held bookings (L2-038). | Yes |
| D6 | Whether the booker is emailed when the artist replies (`<TO SUPPLY>`, reply-to-review) | No email in M7. L2-063 doesn't list one. | Yes |
| D7 | Restoring a hidden review (`<TO SUPPLY>`, report-and-moderate) | Not in M7. Hiding is final in the app; the row stays in the database. | Yes |
| D8 | Report thresholds | There is no auto-hide at any count. Each user's first report on a review emails every administrator, one email per report, with no digest. A repeat from the same user returns the existing report. After a dismissal, only new reporters reopen the queue. | Yes |
| D9 | How the profile hides Report on the user's own review: the public `ReviewResource` may not expose booker IDs (L2-083), and the designs say nothing | The profile stays public and cacheable. After hydration, a signed-in browser calls a private `GET /api/v1/account/reviews?artist={slug}` (`no-store`) that returns the caller's own review IDs. Self-reporting through the API returns 403. | Yes (new endpoint, design update) |
| D10 | Alert for rating-queue lag (`<TO SUPPLY>`, show-reviews) | Defer it to M10's alerting. Use 30 s lag on the `high` queue, against the 60 s budget in L2-060.3. | Yes |
| D11 | Late or combined event reminders (`<TO SUPPLY>`, send-event-reminders) | Send a late 7-day reminder while the event is still more than 24 h away. When both are due together, send only the 1-day reminder and insert the `SevenDays` dispatch with `skipped_at`. The copy states the date, never "in 7 days". | Yes |
| D12 | One-click unsubscribe (`<TO SUPPLY>`, manage-email-preferences) | Optional emails carry `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058), pointing at an anonymous `POST`. The body link stays `/account#preferences`. A browser landing page is not built, because it would need an L2 criterion and a mock first. | Yes |
| D13 | The unsubscribe token | An HMAC-SHA256 of `user_id` and `category`, keyed by a dedicated `ZAMARO_UNSUBSCRIBE_KEY` so that rotating `APP_KEY` doesn't break old emails. It never expires and is idempotent. A `transactional` category is never signed. | Yes |
| D14 | Copy for the 5 new emails (emails aren't mocked) | Draft the review prompt, review reminder, review hidden, review reported and event reminder emails in `resources/i18n/en/emails.json`. Use the en-CA formats (L2-110). The user reviews them in S2's pull request. | Yes |
| D15 | Toast after posting or saving a review (not mocked) | "Review posted" and "Review saved", mirroring the mocked "Reply posted". | Yes (mock update) |
| D16 | Booking page after reviewing, when locked, and when hidden (not mocked; only "Review locked" is named, in a mock note) | Add `booking-detail` mock states before S3: `reviewed` ("Edit your review" and "You can edit your review until Tue 24 Nov, 8:15 p.m.") and `review-locked`. The hidden state shows the same as locked. | Yes (mock change) |
| D17 | What the admin sees after Hide or Dismiss (not mocked) | The panel leaves the queue, the count line and the nav badge update, and focus moves to the next panel's heading or the empty state. The live region announces "Review hidden" or "Reports dismissed". There is no new visual. | Yes |
| D18 | Whether an artist can turn on review prompts | Not offered (manage-email-preferences). The PUT rejects `review_prompts` from an artist with 422. | No |
| D19 | Status code for hiding an already-hidden review | 409, with the existing problem type. | No |

## Design conflicts and resolutions

1. **Frontend paths (designs `features/*`, against AGENTS.md and ADR-0007).** Use these paths:
   - In the zamaro app:
     - `pages/booking-detail` gets the review stub.
     - `pages/artist-reviews/` is new; it matches the mock folder, which AGENTS.md's tree lacks, so add it to the tree.
     - `pages/account/preferences/`.
     - `dialogs/{write-review,reply-review,report-review}/`.
   - In the admin app: `pages/reviews/` and `dialogs/hide-review/`.
   - API clients go in `api/lib/services/{reviews,notifications}` and `api/lib/models/admin/`.
2. **The name `ArtistReviewsController` is used twice:** for the public list in show-reviews (M1) and for the workspace list in reply-to-review. Clients and resources collide the same way:
   - `ArtistReviewsApi` is used twice.
   - leave-review's `ReviewResource` carries `editableUntil`, while the public one must expose no booking data (L2-083).
   - The same split applies to `ReviewReplyResource`.

   **Resolution:** follow ADR-0008's split of public and editor names.
   - The public names stay.
   - The workspace gets `ArtistWorkspace\WorkspaceReviewsController`, `WorkspaceReviewResource` and `WorkspaceReviewsApi`.
   - The booker's own review gets `BookingReviewResource`.
   - Record this in an ADR on review resource names, and update the reply-to-review and leave-review designs.
3. **403 or 404 for a review on someone else's booking (L2-059.2 against L2-074.2 and L2-033).** Resolve the booking within the caller's own bookings first:
   - Someone else's number returns 404.
   - Your own booking that is not Completed, or is outside the window, returns 403.
4. **The rating formula.** M1's plan says "mean of distinct churches". show-reviews and L2-060.1 say the mean over visible reviews, with the count of distinct churches. **Resolution:** follow the design (`AVG(stars)`). Seed one review per church per artist, so the two formulas agree for the cast.
5. **`hidden_reason` is `varchar(255)` in M1's migration**, but `HideReviewRequest` allows 500 characters. **Resolution:** an expand migration in S9 widens it to `varchar(500)`.
6. **The distinct-church count needs `bookings.church_id`.** M1's bookings carry only `church_name` and `church_city`; M2 or M5 adds `church_id`. **Resolution:** S0 checks that every seeded Completed booking has `church_id`; otherwise each NULL counts as no church.
7. **"Recalculate after reply" in the brief.** A reply changes no rating. show-reviews dispatches only on `ReviewPublished`, `ReviewEdited` and `ReviewHidden`. **Resolution:** reply events run `ForgetArtistProfileCache` only (S6).
8. **The prompt's timing in two places:**
   - The account mock says "Two days after an event".
   - L2-059.4 says 1 day after Completed, and Completed is event + 24 h.

   These agree, so nothing changes. Tests use event + 48 h: Mon 16 Nov 7:00 p.m. for ZAM-0114.
9. **The booking-detail mock has no state after the review.** See D16; the mock is added before S3, as AGENTS.md requires.

## Slices

Every slice follows M1's loop and regression set. It also adds new authenticated routes to the `tests/Feature/Security/` route-ownership fixtures (L2-074.3) and its route states to `e2e/routes.manifest.ts`. Times are America/Toronto.

#### S0 — Preparation (seed, test harness and docs; outside ATDD)
- **Seed:**
  - Add the review sets in "Seed data additions".
  - `CastSeeder` stops writing `artist_ratings` directly. Instead it runs `RecalculateArtistRating` synchronously for every artist after seeding.
  - M1's existing Discover and profile tests then prove there is no drift: "4.9 · 38 churches", "Rated 4.6 out of 5 by 17 churches", and the "Highest rated" order.
- **e2e harness:**
  - Confirm, or add, the post-event stub-API scenario for ZAM-0114 (Completed, with the mock's timestamps) and its clock.
  - e2e has no queue or scheduler. What `RecalculateArtistRating`, the review prompts and the reminders change is a switch to the next scenario; the jobs themselves are proven in Feature tests with `travelTo`.
  - **ADR:** e2e clock travel and job outcomes on the stub API, only if M5 or M6 did not already decide it.
- **Docs:**
  - Add the D16 mocks and the D15 toast copy.
  - Update the designs for conflicts 1, 2 and 3.
  - Add `pages/artist-reviews/` to the AGENTS.md tree.

#### S1 — Email preferences in account settings
- **L2:** 065.3, 089.3, 108.1, 095.
- **Behaviour:**
  - Naomi opens `/account#preferences` and sees "Email me about":
    - "Bookings and payments", ticked and disabled, with "Always on: these are about your dates and your money."
    - "Event reminders", with "A week and a day before each event."
    - "Review prompts", with "Two days after an event, so other churches hear how it went."
    - M2's "New artists near my church".
  - Unticking Review prompts and pressing "Save changes" makes the button busy, then shows "Saved just now".
  - Abigail sees only "Requests, bookings and payouts" and "Event reminders".
  - A PUT that turns off `transactional` returns a 422 field error. So does an artist's PUT of `review_prompts` (D18).
  - A failed save shows "We couldn’t save your changes" and keeps every choice.
  - Responses carry `private, no-store`.
- **Tests first:**
  - `tests/Feature/Notifications/ManageEmailPreferencesTest.php`. Its cross-user case: Naomi's PUT leaves Abigail's rows untouched, and there is no user ID in any route.
  - `e2e/specs/notifications/manage-email-preferences.spec.ts`.
  - Page object: `e2e/pages/account.page.ts`, extended with `emailPreferences()`, `setPreference(category, on)` and `save()`.
- **Build:**
  - Backend:
    - Migration `create_notification_preferences_table`, unique on (`user_id`, `category`).
    - `Enums/NotificationCategory` (`Transactional`, `Reminders`, `ReviewPrompts`; `isOptional()`).
    - `Services/Notifications/NotificationPreferenceGate` (`allows`, `forUser`; a missing row means on).
    - `Actions/Notifications/UpdateNotificationPreferences`.
    - `Api/V1/Notifications/NotificationPreferencesController` (`GET` and `PUT /api/v1/account/notification-preferences`).
    - `Requests/Notifications/UpdateNotificationPreferencesRequest`.
    - `Resources/Notifications/NotificationPreferenceResource` (`category`, `enabled`, `locked`).
    - `TransactionalNotification::shouldSend()` asks the gate for optional categories and records `Suppressed`.
  - Frontend:
    - `api/lib/services/notifications`: `NotificationPreferencesApi` contract, the `NOTIFICATION_PREFERENCES_API` token, the HTTP implementation and an in-memory fake.
    - `pages/account/preferences/` joins the page's save bar.
- **Components:** reuse `zm-checkbox`. Add it, with a `Checkbox` scenario, only if M2 did not.
- **Route states:**
  - `/account#preferences` in the `default`, `artist`, `submitting`, `success` and `failed` states.

#### S2 — Leave a review
- **L2:** 059.1–2, 060.1–2, 101.4, 108, 109.
- **Behaviour:** the clock is Tue 17 Nov 2026, 8:00 p.m.
  - On `/bookings/ZAM-0114` (Completed), Naomi sees "Leave a review" and "You can leave a review until Wed 13 Jan 2027, 60 days after the event."
  - The dialog has the kicker "ZAM-0114 · Completed · Sat 14 Nov", the title "Review Abigail’s worship night" and "Other churches read reviews before they book. You can edit yours for 7 days."
  - The star choices run from "Unforgettable" to "Poor". The text help reads "20 to 1,000 characters. Shown on Abigail’s profile with your name and church."
  - "Post review" shows "Posting…" and then the toast "Review posted" (D15).
  - An 8-character text shows "Write at least 20 characters; you have 8." with the count "8 / 1,000", and focus moves to the field.
  - A server failure shows "Your review wasn’t posted" and "Try again", and keeps every value.
  - Abigail stays at "4.9 · 38 churches": Riverside already reviewed in June. This proves the distinct-church count. The new review leads "What churches say".
- **API:**
  - A second POST returns 409.
  - Naomi on ZAM-0097 (Confirmed) gets 403.
  - Naomi on ZAM-0061 (event 14 Jun, more than 60 days ago) gets 403.
  - Naomi on Femi Adebayo's ZAM-0052 gets 404.
  - Bad input returns 422 keyed by `stars` or `text`.
- **Tests first:**
  - `tests/Feature/Reviews/LeaveReviewTest.php` and `tests/Feature/Reviews/RecalculateArtistRatingTest.php`. The second covers the publish path, with 4.86 shown as 4.9 and hidden reviews excluded.
  - `e2e/specs/reviews/leave-review.spec.ts`.
  - Page objects: `e2e/pages/booking-detail.page.ts` (extended) and `e2e/pages/write-review.dialog.ts`.
- **Build:**
  - Backend:
    - `Services/Reviews/ReviewEligibility` (`canCreate`, `canEdit`, `editableUntil`, `reviewableUntil`).
    - `Policies/ReviewPolicy::create`.
    - `Requests/Reviews/StoreReviewRequest` (trimmed text).
    - `Actions/Reviews/LeaveReview` and `Events/ReviewPublished`.
    - `Listeners/Reviews/QueueRatingRecalculation`.
    - `RecalculateArtistRating` becomes `ShouldBeUnique` per artist on the `high` queue and forgets the profile and search caches.
    - `Api/V1/Reviews/BookingReviewController@store` (`POST /api/v1/bookings/{number}/review`, write limiter).
    - `Resources/Reviews/BookingReviewResource`.
    - `BookingResource` embeds `review`.
  - Frontend:
    - `dialogs/write-review/`, `BookingReviewStore`, and the stub button on `pages/booking-detail`.
    - `api/lib/services/reviews`: `ReviewsApi`, the `REVIEWS_API` token, the HTTP implementation and a fake.
- **ADR:** review resource names (conflict 2).
- **Components:**
  - The `stub` variant of `zm-radio-group` for the star choices, with a `RadioGroupStub` scenario.
  - `zm-textarea` with a live counter, with a `Textarea` scenario, if M5 did not add it.
- **Route states:**
  - `/bookings/ZAM-0114` in the `completed` state.
  - The `write-review` dialog in its `default`, `busy`, `invalid` and `failed` states.

#### S3 — Edit a review, then the lock
- **L2:** 059.3, 060.1.
- **Behaviour:**
  - After posting, the stub reads "Edit your review", with the D16 fine print.
  - The dialog's edit mode shows "Edit your review of Abigail" and "You can change it until Tue 24 Nov, 8:15 p.m. After that it’s locked.", with "Save changes" becoming "Saving…".
  - Changing 5 stars to 4 rewrites the review, stamps `edited_at` and recalculates the rating.
  - At Tue 24 Nov 8:16 p.m., the PATCH returns 403, the stub reads "Review locked" and no dialog opens.
  - Patching another booker's review returns 404.
  - Editing a hidden review returns 403 (D2).
- **Tests first:**
  - `tests/Feature/Reviews/EditReviewTest.php`.
  - New cases in `leave-review.spec.ts`, using the same page objects as S2.
- **Build:**
  - `ReviewPolicy::update`.
  - `Requests/Reviews/UpdateReviewRequest`.
  - `Actions/Reviews/EditReview` and `Events/ReviewEdited`.
  - `BookingReviewController@update` (`PATCH /api/v1/reviews/{review}`).
  - The dialog's edit mode.
- **Route states:**
  - `/bookings/ZAM-0114` in the `reviewed` and `review-locked` states.
  - The `write-review` dialog in its `edit` state.

#### S4 — Review prompts and the reminder
- **L2:** 059.4, 063.2, 065.3, 092.2–3.
- **Behaviour:** ZAM-0114 was Completed on Sun 15 Nov at 7:00 p.m.
  - The run at Mon 16 Nov 8:00 p.m. emails `naomi.fraser@riversidecc.ca` a prompt, with HTML and plain-text parts and a link to `/bookings/ZAM-0114#review`. Running again sends nothing.
  - If Naomi has no review by Sun 22 Nov 8:00 p.m., she gets one reminder. With a review, she gets none.
  - With Review prompts off (S1), the send is recorded as `Suppressed`.
  - A first run on Mon 23 Nov sends one email (D4).
  - In the browser, opening `/bookings/ZAM-0114#review` opens the write-review dialog.
- **Tests first:**
  - `tests/Feature/Reviews/SendReviewPromptsTest.php`, using `Notification::fake()` and `Carbon::setTestNow`.
  - A new case in `leave-review.spec.ts` for the fragment.
- **Build:**
  - Migration `add_review_prompt_columns_to_bookings` (`review_prompted_at`, `review_reminded_at`).
  - `Actions/Reviews/SendReviewPrompts`.
  - `Console/Commands/SendReviewPromptsCommand` (`reviews:send-prompts`), registered hourly in `routes/console.php`.
  - `Notifications/ReviewPromptNotification` and `ReviewReminderNotification`, both with category `ReviewPrompts`.
  - `emails.reviewPrompt.*` catalogue keys (D14).

#### S5 — The artist's reviews page (read)
- **L2:** 018.1–2 (workspace view), 061 (setup), 074.1, 105.
- **Behaviour:** Abigail opens `/artist/reviews`, from the dashboard's "All reviews".
  - The page shows "Reviews" and "★ 4.9 · 38 churches · 2 without a reply".
  - Janet, Tomi, Naomi and Femi are listed newest first.
  - The replies read "Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m." and "Reply from Abigail Mensah · Tue 16 Jun · locked Tue 23 Jun", with "Reply locked".
  - "Show 10 more" sits beside "Showing 4 of 38, newest first".
  - Miriam sees "No reviews yet", "Churches can review you for 60 days after a completed booking. Their reviews land here, and you can reply to each one." and "Mark your free dates".
  - On error, the page shows "We couldn’t load your reviews".
  - Hidden reviews are excluded.
  - The dashboard reads "Rev. Janet Clarke’s September review and one other have no reply yet." from the same `withoutReply` count.
  - Naomi's `GET /api/v1/artist/reviews` returns 404. Miriam's returns only her own (none).
- **Tests first:**
  - `tests/Feature/Reviews/WorkspaceReviewsTest.php`.
  - `e2e/specs/reviews/reply-to-review.spec.ts`, read cases first.
  - Page object: `e2e/pages/artist-reviews.page.ts`.
- **Build:**
  - `ArtistWorkspace\WorkspaceReviewsController@index` (cursor, 10 per page, `meta.total` and `meta.withoutReply`).
  - `WorkspaceReviewResource` (`canReply`, reply `editableUntil`).
  - `pages/artist-reviews/` with its store.
  - `WorkspaceReviewsApi`, with its token and fake.
- **Components:**
  - `zm-review` gains an actions slot and the reply meta line. Its `Review` scenario is updated, and the change is measured.
  - A new composite scenario, `ArtistReviewsList` (14 reviews with replies and actions).
- **Route states:**
  - `/artist/reviews` in the `default`, `loading`, `empty` (Miriam) and `error` states.

#### S6 — Reply to a review
- **L2:** 061.1, 018.3, 089.2.
- **Behaviour:**
  - "Reply" on Janet's review opens a dialog with:
    - the kicker "Rev. Janet Clarke · St. Brendan’s Anglican, Oshawa · September 2026"
    - the title "Reply to Janet’s review"
    - "Your reply is public, under the review on your profile. You can edit it for 7 days."
    - the help "1 to 500 characters. Shown under the review as “Reply from Abigail Mensah”."
  - Spaces alone show "Write at least 1 character. Spaces alone don’t count."
  - "Post reply" shows "Posting…" and then the toast "Reply posted". The reply shows under the review on both the page and the profile ("Reply from Abigail Mensah · October 2026").
  - Edit mode on Tomi's review shows "Edit your reply to Tomi", "You can edit it until Thu 15 Oct, 11:20 a.m. After that it’s locked." and "Save reply".
  - A server failure shows "Your reply wasn’t posted".
- **API:**
  - Patching Naomi's June reply returns 403.
  - A second reply returns 409.
  - Miriam or Naomi replying to Abigail's review gets 404, and so does a reply to a hidden review.
- **Tests first:**
  - `tests/Feature/Reviews/ReplyToReviewTest.php`.
  - `reply-to-review.spec.ts`.
  - Page objects: `e2e/pages/reply-review.dialog.ts` and `artist-profile.page.ts` (extended).
- **Build:**
  - `review_replies.edited_at`, if M1 omitted it.
  - `Policies/ReviewReplyPolicy`.
  - `Requests/Reviews/{StoreReviewReplyRequest,UpdateReviewReplyRequest}`.
  - `Actions/Reviews/{ReplyToReview,EditReviewReply}` and the `ReviewReplyPosted` and `ReviewReplyEdited` events.
  - `Listeners/Reviews/ForgetArtistProfileCache`, which uses M4's invalidation.
  - `ArtistWorkspace\ArtistReviewReplyController` (`POST` and `PATCH /api/v1/artist/reviews/{review}/reply`).
  - `dialogs/reply-review/`.
- **Route states:** the `reply-review` dialog in its `default`, `edit`, `busy`, `invalid` and `failed` states.

#### S7 — Report a review, with no delete
- **L2:** 062.1, 062.3, 077.
- **Behaviour:**
  - Signed in on `/artists/abigail-mensah`, Naomi sees Report on Janet's, Tomi's and Femi's reviews but not on her own (D9). Guests see no Report link.
  - The dialog has the kicker "Review of Abigail Mensah · Pastor Femi Adebayo", the title "Report this review" and "The Zamaro team reads every report. The review stays up until they decide."
  - It asks "Why are you reporting it?", offering Offensive, Not about this artist, Personal information and Other. The note's help reads "Only the Zamaro team reads this."
  - Sending without a reason shows "Choose one reason."
  - Busy shows "Sending…"; a failure shows "Your report wasn’t sent".
  - Success closes the dialog, returns focus to Report and shows "Report sent. The Zamaro team will take a look."
  - Priya is emailed, with a link to `/admin/reviews`. A repeat by Naomi sends no second email.
  - Abigail can report from `/artist/reviews`.
  - `DELETE /api/v1/reviews/{id}` from Abigail, Naomi or Priya returns 404, and the review stays.
  - Reporting a hidden review, or your own, returns 404 or 403.
- **Tests first:**
  - `tests/Feature/Reviews/ReportReviewTest.php` and `tests/Feature/Reviews/NoReviewDeletionTest.php`.
  - `e2e/specs/reviews/report-and-moderate-review.spec.ts`.
  - Page object: `e2e/pages/report-review.dialog.ts`.
- **Build:**
  - Migration `create_review_reports_table` (unique `(review_id, reporter_id)`, plus a partial index on open reports).
  - `Enums/ReviewReportReason`.
  - `Requests/Reviews/ReportReviewRequest`.
  - `Actions/Reviews/ReportReview` and `Events/ReviewReported`.
  - `Listeners/Reviews/NotifyAdministratorsOfReport` and `Notifications/ReviewReportedNotification`.
  - `Api/V1/Reviews/ReviewReportsController@store`.
  - The D9 own-reviews endpoint.
  - `dialogs/report-review/`, plus the Report action in `zm-review`.
- **Route states:**
  - `/artists/abigail-mensah` in the `signed-in` state.
  - The `report-review` dialog in its `default`, `busy`, `invalid` and `failed` states.

#### S8 — The moderation queue (admin)
- **L2:** 062, 066.1, 105.
- **Behaviour:** Priya opens `/admin/reviews`.
  - The header shows "Admin · Moderation", "Reported reviews" and "2 reviews with open reports · oldest report first".
  - "Review of Hosanna Collective" carries "2 reports". Its rows are "Not about this artist" from Hosanna Collective, Tue 6 Oct, 8:15 p.m. ("“The complaint is about a sound company we don’t work with.”"), and from Tomi Oduya, Wed 7 Oct, 10:02 a.m.
  - "Review of Elijah Park" carries "1 report": "Personal information" from Elijah Park, Thu 8 Oct, 4:51 p.m.
  - Each panel offers "Hide review…" and "Dismiss reports" or "Dismiss report". The nav reads "Reviews 2".
  - The empty state shows "No reported reviews"; the error state shows "We couldn’t load the reported reviews".
  - Naomi gets 404 on both the page and `GET /api/v1/admin/review-reports`.
- **Tests first:**
  - `tests/Feature/Reviews/ModerateReviewTest.php` (index).
  - `e2e/specs/reviews/moderate-review.admin.spec.ts`, in the admin project.
  - Page object: `e2e/pages/admin/reviews.page.ts`.
- **Build:**
  - `Api/V1/Admin/ReviewModerationController@index`, `Actions/Reviews/ListOpenReviewReports` and `Resources/Admin/ReviewReportGroupResource`.
  - The admin nav count `reviewReports`.
  - `admin/src/app/pages/reviews/`.
  - `AdminReviewsApi` in `api/lib/services`, with its token and fake, and models in `models/admin/`.
- **Components:** a `ModerationQueue` composite scenario (panels using `zm-review` and `zm-badge`).
- **Route states:** `/admin/reviews` in the `default`, `loading`, `empty` and `error` states, in the admin manifest.

#### S9 — Hide a review
- **L2:** 062.2, 060.3, 069.1, 063.2.
- **Behaviour:**
  - "Hide review…" on Grace Ampofo's review opens a dialog with:
    - the kicker "Reported 1 time · Personal information"
    - the title "Hide this review of Elijah Park?"
    - "It leaves the profile and the rating. Grace Ampofo is emailed your reason."
    - the help "Emailed to Grace Ampofo and kept in the audit log."
  - An empty reason shows "A reason is required."
  - Busy shows "Hiding…"; a failure shows "The review wasn’t hidden".
  - Priya hides it with the reason "It shares a private phone number. Reviews can’t include anyone’s personal contact details." The API returns 204 and the queue shows 1 review (D17).
  - Within 60 s, Elijah's profile drops the review and his rating goes from "4.7 · 9 churches" to "5.0 · 8 churches".
  - Grace is emailed the artist, the booking number and the reason.
  - The audit log records `review.hidden` by Priya, with the IP address and "Succeeded".
  - Any reply is hidden with the review.
  - Hiding the review again returns 409 (D19).
- **Tests first:**
  - `ModerateReviewTest.php` (hide).
  - The hide path in `RecalculateArtistRatingTest.php`.
  - New cases in `moderate-review.admin.spec.ts` and `report-and-moderate-review.spec.ts` (the profile after hiding).
  - Page object: `e2e/pages/admin/hide-review.dialog.ts`.
- **Build:**
  - Migration `widen_reviews_hidden_reason` to `varchar(500)`.
  - `Requests/Admin/HideReviewRequest`.
  - `Actions/Reviews/HideReview`, which calls `RecordAuditEntry` in the same transaction, and `Events/ReviewHidden` after commit.
  - `Notifications/ReviewHiddenNotification`.
  - The `QueueRatingRecalculation` listener handles `ReviewHidden` on `high`.
  - `admin/src/app/dialogs/hide-review/`.
- **Route states:** the `hide-review` dialog in its `default`, `busy`, `invalid` and `failed` states.

#### S10 — Dismiss reports
- **L2:** 062, 069.1.
- **Behaviour:**
  - "Dismiss reports" on Hosanna's panel resolves both reports as `Dismissed`.
  - The review stays on Hosanna's profile at "4.8 · 21 churches", and nobody is emailed.
  - The audit log records `review_report.dismissed`.
  - After S9 and S10, the queue shows "No reported reviews" and "No open reports", and the nav badge disappears.
- **Tests first:**
  - `ModerateReviewTest.php` (dismiss; non-administrators get 404).
  - A new case in `moderate-review.admin.spec.ts`.
- **Build:**
  - `Actions/Reviews/DismissReviewReports`.
  - `ReviewModerationController@dismiss` (`POST /api/v1/admin/reviews/{review}/reports/dismiss`).

#### S11 — Event reminders (scheduled, backend only)
- **L2:** 064.1–2, 065.3, 092.2–3, 110.4.
- **Behaviour:** ZAM-0114 is Confirmed, with the event on Sat 14 Nov at 7:00 p.m.
  - The 7-day reminder is due Sat 7 Nov at 7:00 p.m. and goes out by 7:15 p.m. The 1-day reminder is due Fri 13 Nov at 7:00 p.m.
  - Both Naomi and Abigail get each one. The email shows:
    - "Saturday 14 November 2026" and "7:00 p.m."
    - "2150 Lakeshore Road, Burlington ON L7R 1A3"
    - Riverside's 905-555-0123, and Abigail's 905-555-0148 and abigail@abigailmensah.ca
    - the links `/bookings/ZAM-0114#messages` and `/artist/bookings/ZAM-0114#messages`
  - A booking cancelled before the due time gets no reminder. One cancelled after dispatch but before the send is refused by `shouldSend()`.
  - With Abigail's reminders off, her send is `Suppressed` and Naomi still gets hers.
  - Running twice leaves one dispatch row per kind.
  - If the scheduler is down from Sat 7 Nov 6:00 p.m. to Sun 8 Nov, the next run sends the 7-day reminder.
  - D11 cases are covered.
  - For an event on Sun 8 Nov at 10:00 a.m., the 7-day reminder is due Sun 1 Nov at 10:00 a.m. EST, after the time change.
- **Tests first:** `tests/Feature/Notifications/SendEventRemindersTest.php`. There is no new e2e: the links land on M5's pages, which are already covered.
- **Build:**
  - Migration `create_reminder_dispatches_table`: unique (`booking_id`, `kind`), `skipped_at`, and an index on `bookings (status, event_date)`.
  - `Enums/ReminderKind`.
  - `Services/Notifications/FindDueReminders`.
  - `Actions/Notifications/DispatchEventReminder` (`INSERT … ON CONFLICT DO NOTHING`).
  - `Notifications/EventReminderNotification` (category `Reminders`).
  - `Console/Commands/SendEventRemindersCommand` (`notifications:send-event-reminders`), registered `everyFifteenMinutes()->withoutOverlapping()->onOneServer()` in `routes/console.php`.

#### S12 — One-click unsubscribe
- **L2:** 065.3, 077.1.
- **Behaviour:**
  - The review prompt, the review reminder and the event reminder carry the D12 headers and a body link to `/account#preferences`.
  - A `POST` to the header URL with Naomi's `reminders` token turns her Event reminders off and returns 204. Repeating it returns 204.
  - The next reminder is `Suppressed`, and `/account#preferences` shows it unticked.
  - A tampered token, or one signed for another user, returns 403 and changes nothing.
  - There is no token for `transactional`.
  - Anonymous traffic is limited to 120 a minute.
- **Tests first:** `tests/Feature/Notifications/OneClickUnsubscribeTest.php`.
- **Build:**
  - `routes/api_public.php`: `POST /api/v1/email-preferences/unsubscribe`.
  - `Api/V1/Notifications/UnsubscribeController`.
  - `Support/Notifications/UnsubscribeToken`.
  - `Actions/Notifications/UnsubscribeFromCategory`, which reuses `UpdateNotificationPreferences`.
  - The headers are added in `TransactionalNotification::toMail()` for optional categories.
- **ADR:** one-click unsubscribe tokens (D12, D13).

## Seed data additions

All seeders upsert on natural keys and stay idempotent.

**Abigail:**
- 38 visible reviews from 38 distinct churches, summing to 186 (4.89, shown as "4.9"). They are the 4 mock reviews plus 34 older supporting reviews: 31 of 5 stars and 3 of 4 stars.
- All 34 supporting reviews are dated before Tue 12 May, so Janet, Tomi, Naomi and Femi stay the 4 newest.
- Fix the shortened seed texts to the mock copy:
  - Naomi: "… She gave both, and somehow it felt like one service."
  - Femi: "… Gracious about our tiny sound desk."
- Replies:
  - To Tomi, created Thu 8 Oct at 11:20 a.m.: "Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov."
  - To Naomi, created Tue 16 Jun: "Riverside, you sang the roof off. Thank you for having me."

**Hosanna Collective:**
- 21 reviews from 21 churches, summing to 100 ("4.8"). They include Pastor Dave Mwangi's 2-star review from Lakeshore Alliance (September 2026), "The band was great, but the sound company we hired double-charged us and never answered our emails. Avoid them."
- Open reports:
  - From Hosanna Collective, Tue 6 Oct at 8:15 p.m., with the note.
  - From Tomi Oduya, Wed 7 Oct at 10:02 a.m.

**Elijah Park:**
- 9 reviews summing to 42 ("4.7"). They include Grace Ampofo's 2-star review from Kingdom Life Centre (September 2026), "Elijah was 40 minutes late and blamed our directions. If you book him, call his manager Kevin first on 416-555-0188."
- This needs a new Completed booking number that M1–M6 have not used.
- Open report: from Elijah Park, Thu 8 Oct at 4:51 p.m., "That’s my manager’s personal cell number."

**Luz Viva:** 6 reviews at 5.0, one with a report dismissed on Thu 8 Oct at 4:48 p.m. by Priya. M3's audit seed holds the matching `review_report.dismissed` entry.

**Grace Tabernacle, Daniel & Ruth, Marcus Bell, the choirs and the Barrie cast:** each gets generated reviews whose recalculated rating equals the number it has today: 4.8/26, 4.9/14, 4.6/17, and so on.

**Preferences:** none are seeded, so everything is on. Naomi's Event reminders and Review prompts show ticked, as in the mock.

## Known risks

- **Rating drift.**
  - Today only Abigail has reviews behind her rating. The first recalculation for any other artist would collapse it; for example, Elijah would show 2.0 from 1 church.
  - S0 makes every seeded rating derived from reviews, and lets M1's Discover and profile tests prove parity.
  - Also check each artist's 38/21/9 counts against `church_id` (conflict 6).
- **The frozen clock.**
  - e2e answers from stub-API scenarios, so each spec applies its own state and clock. M5's specs keep ZAM-0114 Requested at Fri 9 Oct, while the post-event review specs apply a scenario with ZAM-0114 Completed and the mock's timestamps, at Tue 17 Nov.
  - S2 and S3 are blocked until this scenario exists.
  - Reply, report and moderation specs run at Fri 9 Oct, which matches their mocks: Tomi's reply is editable until Thu 15 Oct, and the reports date from Tue 6 Oct to Thu 8 Oct.
- **Scheduler time zones.**
  - The scheduler cadence doesn't depend on the time zone, but the due times must use `America/Toronto` wall-clock `subDays()` and `addDays()`. Subtracting hours in UTC would be wrong.
  - Daylight saving ends on Sun 1 Nov 2026, between Abigail's Sun 25 Oct and Sun 1 Nov bookings.
  - The edit windows (D2) and the end of the review window (D1) also use wall-clock time.
- **Job clock and queue.** `shouldSend()` and `ReviewEligibility` read the clock, so their Feature tests set it with `travelTo`. e2e runs no queue: the "within 60 s" rating change is a scenario switch there, and the real queue lag is measured on the dev worker (D10 alerts on it in production).
- **The `#review` fragment through sign-in.** The server never sees fragments, so a signed-out link loses `#review` unless M2's client-side `returnUrl` keeps it. Add a test in S4.
- **Caching.** The public profile is cached at `s-maxage=60`. Hidden reviews and new replies rely on M4's cache invalidation. The Report visibility must stay client-side (D9) so personal state is never transfer-cached.
- **Emails.** e2e reads no email. The prompts, reminders and the hidden-review email are asserted in Feature tests with `Notification::fake`, and checked by hand in the dev stack's Mailpit.
- **Perf.** The new slot and reply line in `zm-review` touch the `Lineup` and profile paths. Run `--fail-on-regression` before pushing S5 and S7.

## Verification at the end of M7

1. `docker compose up -d --wait`, then `docker compose exec api php artisan test`. All Feature tests are green, including the contract assertions and the `Security/` cross-user suite with the new routes.
2. `docker compose exec api php artisan db:seed` twice: the row counts are unchanged, and the ratings are unchanged (4.9/38, 4.8/21, 4.7/9, 4.6/17).
3. `docker compose exec api php artisan schedule:list` lists `reviews:send-prompts` (hourly) and `notifications:send-event-reminders` (every 15 minutes).
4. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && npx ng build admin && NG_BUILD_MANGLE=0 npx ng build perf-test`.
5. `cd e2e && npx playwright test`, with no API, database or Docker running. The zamaro and admin projects pass, along with `visual/`, `a11y/` (light and dark) and `perf/` over the new manifest states.
6. `npm run perf-test -- --baseline <main dist> --fail-on-regression` flags no rows. `ArtistReviewsList`, `ModerationQueue` and `RadioGroupStub` are new and have no baseline.
7. **Manual walkthrough** (Mailpit at :8025):
   1. As Naomi:
      - In `/account#preferences`, untick Review prompts, save, and tick it again.
      - On the post-event `/bookings/ZAM-0114`, post a 5-star review, edit it, and check the profile still shows "4.9 · 38 churches".
      - Run `reviews:send-prompts` and check that no prompt is sent, because the review already exists.
      - On Abigail's profile, report Femi's review.
   2. As Abigail:
      - On `/artist/reviews`, reply to Janet, see "Reply posted", and find the reply on the profile.
      - Confirm that Naomi's reply shows "Reply locked".
   3. As Priya at `/admin/reviews`:
      - Confirm the badge and the three panels.
      - Hide Grace's review with a reason. Elijah shows "5.0 · 8 churches", and Grace's email arrives.
      - Dismiss Hosanna's reports and see "No reported reviews".
      - Check both audit entries.
   4. The dev stack has no clock override, so `SendEventRemindersTest` runs `notifications:send-event-reminders` at Sat 7 Nov 7:00 p.m. with `travelTo` and checks the two reminders, the `/artist/bookings/{number}#messages` link and the `List-Unsubscribe` `POST`.
   5. Repeat steps 1–3 at 320 px and in the dark theme.
