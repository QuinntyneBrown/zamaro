# Pick a date and start booking

## Overview

An artist profile ends in a call to action: book this artist for a date. Two regions
of the profile serve that call. The "On tour" list shows the artist's next free and
booked dates, so a church can see at a glance when the artist is open. The booking
stub is a ticket-styled form that checks the chosen date, states the price and the
cancellation terms, and collects the details of the request.

This feature covers both regions up to the moment the request is submitted.
Submission, sign-in for guests, and the resulting booking belong to
`bookings/send-booking-request`. The page around these regions, including the header
Book button and the carried date, belongs to `artist-profiles/view-artist-profile`.

Terms used in this design:

- **booking stub** — ticket-styled request form on each profile, with price, date check and request fields
- **On tour list** — profile section headed "Upcoming dates" that lists the artist's next 6 free or booked dates
- **free** — state of an artist who is approved, not suspended, has not marked the date unavailable and has no Confirmed booking on that date
- **booked date** — date on which the artist has a Confirmed booking
- **date check** — query that tells whether the artist is free on one date
- **start date** — first date the On tour list considers: the carried search date, or 3 days from today in `America/Toronto` when none is set
- **Pick** — action on a free row of the On tour list that moves its date into the booking stub
- **free-cancellation date** — last date on which a booker can cancel a Confirmed booking without losing the deposit, 14 days before the event

A date that is neither free nor booked, such as a date the artist marked unavailable,
does not appear in the On tour list. A booked row names only the kind of gathering
and the church's city, never the church's name or address (L2-017, L2-083). Pending
Requested or Accepted bookings leave a date free.

## Description

The slice adds two read endpoints to the Zamaro API and two components to the
profile page in Zamaro Web. It also introduces the cancellation-policy value object
that the stub, the payment form, the confirmation email and the booker's booking page
share.

**Frontend (Zamaro Web, `features/artist-profile`)**

- **`TourDatesComponent`** — renders the design-system tour-dates list under "On tour"
  and "Upcoming dates". Each row shows the short date and either "Free · Open all day"
  with a Pick button, or "Booked" with "{gathering kind}, {city}". The row for the
  carried date is labelled "Your date" (L2-017). Pick calls
  `ArtistProfileStore.selectDate()`.
- **`BookingStubComponent`** — the design-system booking form in ticket style. It shows
  "Book {first name}", "No. {ticket number}", "From ${price}" and "per service · travel
  included". Its fields are event date, kind of gathering, church and an optional
  message (L2-019). It binds the event date to the store's `selectedDate` and the
  message to `messageDraft`. Under the date field, an inline message reads "✓ {first
  name} is free {date}" or "{first name} is booked {date}. Try another date.". The
  submit button, "Request to book · {short date}" ("Request to book" before a date is
  chosen), is disabled while the date is not free. Beneath it, the stub reads "Nothing is charged until {first name} accepts.
  Cancel free up to 14 days before." The words "Cancel free up to 14 days before" link
  to the full cancellation policy, the "Cancellation policy" list in the "How booking
  works" section of Discover (`/#how`), the same target as every "Cancellation policy"
  link.
- **Stub placement** — from LG, the stub sits in the right-hand column with
  `position: sticky`, so it stays pinned while the profile scrolls. Below LG it follows
  the reviews section. The header Book button and "Check dates" both call
  `BookingStubComponent.focusDate()`, which scrolls the stub into view and focuses the
  date field (L2-019, L2-012).
- **`ArtistProfileStore`** (extended) — adds `tourDates`, `selectedDate`, and
  `dateCheck` (`unknown`, `checking`, `free`, `booked`). `selectDate()` sets the date.
  When the date comes from a free On tour row, the store marks it free with no request.
  Otherwise it calls the date check. The header Book label follows `selectedDate`, so
  Pick on Fri 20 Nov makes it read "Book for Fri 20 Nov" (L2-017).
- **`AvailabilityApi`** — typed client for the date check and the On tour list.
- On submit, the stub hands the form value to `bookings/send-booking-request`.

**Backend (Zamaro API)**

- **`ArtistAvailabilityController`** — two actions on public, unauthenticated routes,
  each resolving the slug through `ResolveArtistSlug`:
  - `check()` for `GET /api/v1/artists/{slug}/availability?date=YYYY-MM-DD`, returning
    `{ date, free }` from `AvailabilityService::isFree()`.
  - `tourDates()` for `GET /api/v1/artists/{slug}/tour-dates?from=YYYY-MM-DD`, returning
    up to 6 `TourDate` rows.
- **`ListTourDates`** — action that walks forward from the start date to the end of the
  18-month booking window. It classifies each date as free, booked or neither, and
  stops after 6 free or booked dates. It reads weekly rules, overrides and Confirmed
  bookings for the window in one query per table rather than one query per date.
- **`TourDateResource`** — serialises the date, the status and, for a booked date, the
  `GatheringKind` label and the church city taken from the booking's address snapshot.
  It never includes the church name, address or booker (L2-017, L2-083).
- **`CancellationPolicy`** — value object holding the 14-day free-cancellation window.
  `freeCancellationUntil(eventDate)` returns the event date minus 14 days in
  `America/Toronto`. The booker's booking page at `/bookings/:number` shows that date
  on a Confirmed booking as "Free cancellation until {short date}" (L2-044).
  `bookings/view-booker-bookings` renders it there.
- The catalogue key `cancellation.policy.short` holds "Cancel free up to 14 days before
  your event." The payment form and the confirmation email reuse it with the same policy
  link (L2-044). The stub carries the short form, "Cancel free up to 14 days before",
  with the same link (L2-019).

**As built in M1 (S14)**

- **Layout (ADR-0007):** both regions are sections of `pages/artist/ArtistPage`, not separate page
  components. The list is the library's `zm-tour-dates` and the stub is `zm-booking-form
  variant="stub"` with `zm-form-field`s and a `zm-inline-message`. The date state lives in
  `BookingDateStore` beside `ArtistProfileStore` (as S13 put reviews in `ProfileReviewsStore`), with
  `tourDates`, `selectedDate` and a computed `status` (`none`, `checking`, `free`, `booked`,
  `refused`). `ArtistAvailabilityApi` sits behind `ARTIST_AVAILABILITY_API` in the `api` library.
- **Endpoints:** as designed, on public routes, with the slug resolved by `ResolveArtistSlug` since
  S15 (ADR-0011: a retired slug answers 301, a hidden artist the `artist-not-found` problem). The date check returns `{ date, free, freeCancellationUntil }`:
  `freeCancellationUntil` is the `CancellationPolicy` date for a free date and null otherwise, so the
  policy is exercised through the API from M1 (Sat 14 Nov → Sat 31 Oct). Dates outside 3 days to 18
  months are a 422 with the search form's copy ("Pick a date at least 3 days away."); the stub shows
  it as the date's error. `tour-dates?from=` starts at 3 days from today when `from` is sooner, and a
  `from` that is not a date is a 422. Rows are `{ date, status, kind, city }`.
- **Availability:** `AvailabilityService` gains `isFree(Artist, date)` (no kind, so no youth-event
  rule) and `days(Artist, from, until)`, a generator that reads rules, overrides and Confirmed
  bookings once each; `ListTourDates` takes the first 6. A Confirmed booking shows as booked even on a
  day the artist blocked. `BookingWindow` holds the 3-day and 18-month bounds for the new code.
- **"Your date" follows the stub:** the current row is the stub's date, carried, picked or typed, as
  the tour-dates CRD (AC-12) says. The [booked-date mock](../../../mocks/pages/artist/booked-date.html)
  keeps Sat 14 Nov stamped after Sun 15 Nov is typed; the build stamps Sun 15 Nov ("Your date ·
  Sunday service, Oakville") and gives Sat 14 Nov a Pick.
- **Pick:** sets the stub's date without a request (the row says it is free) and moves focus to the
  stub's date field, which also scrolls the stub into view below LG. There is no busy Pick and no
  "Date changed to …" status line; the date's inline message is a live region and announces "Abigail
  is free Fri 20 Nov".
- **Date check:** a date the list shows needs no request; any other complete date is checked. While a
  check runs the stub shows nothing under the date (no busy "Checking Abigail's calendar…": there is
  no `zm-spinner` yet). A failed check leaves the date unchecked and silent, as Discover does. A
  booked or refused date is the field's error with `aria-invalid`, announced through the field's live
  region.
- **The note beside "Upcoming dates":** "Pick a free date to book it instead." when the list has a
  booked row; otherwise "{first name}'s calendar is wide open this {season}.", the season of the first
  listed date (L2-006's months), as on Miriam's mock.
- **Submit behind a flag (user decision, ADR-0012):** "Request to book · {date}" renders only when
  `bookingRequests` is on, and is disabled for a booked or refused date. The flag is off, so M1 shows
  no submit, and there is no `/artists/:slug/book` route. Submitting with the flag on does nothing
  until M5 hands over to the request page.
- **Kind of gathering:** carried from the remembered search when its date is the carried date
  ("Worship night" from Naomi's search), otherwise "Sunday service". Church starts empty for guests;
  the saved church arrives with sign-in (M2).
- **Empty states point at the stub (L2-020):** "Ask {first name} for a recording" writes "Could you
  send a recording of a recent set?" into the message and focuses it; "Be {pronoun} first booking"
  focuses the date.
- **Policy link:** "Cancel free up to 14 days before" links to `/#how`, Discover's "How booking
  works" section, which ends with the "Cancellation policy" list (`#policy`).
- **Loading and errors:** while the list loads it shows four skeleton rows ("Loading dates"). A failed
  list renders no rows and the stub checks every date itself. An artist with no free or booked date
  in the window shows the heading and an empty list (no mock covers it).
- **Seed:** Miriam's ticket number is ACT-0154, as the mocks show.

**Mocks**

- [Artist profile · default](../../../mocks/pages/artist/default.html) — Abigail's
  On tour list from her carried date, Sat 14 Nov (Monday is her weekly day off, so it
  skips Mon 16 Nov), and her stub with "No. ACT-0027", the free-date message and the
  policy link.
- [Artist profile · empty](../../../mocks/pages/artist/empty.html) — Miriam's profile
  opened without a search date: six free dates from Mon 12 Oct, 3 days from today, and
  her stub with an empty date field, "No. ACT-0154", "From $300" and "Request to book".
- [Artist profile · booked date](../../../mocks/pages/artist/booked-date.html) — Sun 15 Nov
  typed into Abigail's stub: "Abigail is booked Sun 15 Nov. Try another date.", Request
  to book disabled, and the header button reading "Book for Sun 15 Nov".
- [Request to book · default](../../../mocks/pages/book/default.html) — where the stub
  hands over on submit (`bookings/send-booking-request`).

**Data**

Both endpoints read `availability_rules`, `availability_overrides` and `bookings`
(status `Confirmed` only, with `gathering_kind` and the address-snapshot city).
Responses contain no personal data.

## Requirements

The feature realises the following level-2 (L2) requirements. Each refines the
level-1 (L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-017` | `L1-003` | **Upcoming dates.** The "On tour" section lists the artist's next 6 dates that are either free or booked, starting from the search date if one is set, otherwise from 3 days from today.<br>Acceptance criteria:<br>1. Given a Confirmed booking on Sun 15 Nov for a Sunday service in Oakville, when the list renders, then that row shows "Booked" with "Sunday service, Oakville" and never the church's name or address.<br>2. Given a free date, when the list renders, then that row shows "Free · Open all day" and a "Pick" action.<br>3. Given a visitor activates "Pick" on Fri 20 Nov, when it completes, then the booking stub date changes to Fri 20 Nov and the Book button reads "Book for Fri 20 Nov".<br>4. Given a search date is set, when the list renders, then that date's row is labelled "Your date". |
| `L2-019` | `L1-003` | **Booking stub.** The booking stub is the ticket-styled request form on each profile.<br>Acceptance criteria:<br>1. Given a profile, when the stub renders, then it shows "Book {first name}", the artist's ticket number (for example "No. ACT-0027"; artist ticket numbers use the `ACT-` prefix so they never read like a `ZAM-` booking number), "From ${price}", "per service · travel included", and fields for event date, kind of gathering, church and message (optional).<br>2. Given a date on which the artist is free, when it is chosen, then the stub shows "✓ {first name} is free {date}".<br>3. Given a date on which the artist is not free, when it is chosen, then the stub shows "{first name} is booked {date}. Try another date." and the submit button is disabled.<br>4. Given a viewport at LG or wider, when the profile scrolls, then the stub stays pinned in the right-hand column.<br>5. Given a viewport narrower than LG, when the profile renders, then the stub follows the reviews section and the header Book button scrolls to it and focuses its date field.<br>6. Given the stub, when it renders, then beneath the submit button it reads "Nothing is charged until {first name} accepts. Cancel free up to 14 days before.", and "Cancel free up to 14 days before" links to the full cancellation policy (the stub's short form of the L2-044 sentence). |
| `L2-044` | `L1-008` | **Cancellation policy visibility.**<br>Acceptance criteria:<br>1. Given the payment form and the confirmation email, when they render, then each states "Cancel free up to 14 days before your event." with a link to the full policy; the booking stub carries the short form with the same link (L2-019).<br>2. Given the booker's booking page, when the booking is Confirmed, then it shows the last date for a free cancellation (for example "Free cancellation until Sat 31 Oct"). |

## Diagrams

### System context

Guests and bookers check dates and start a request on a profile in Zamaro. No
external system takes part in this slice.

![C4 system context for picking a date and starting a booking](diagrams/c4-context.png)

### Containers

Zamaro Web calls the date-check and tour-dates endpoints in the Zamaro API, which
reads availability and Confirmed bookings from the database.

![C4 container view for picking a date and starting a booking](diagrams/c4-container.png)

### Components

`TourDatesComponent` and `BookingStubComponent` share `ArtistProfileStore`. On the
backend, `ArtistAvailabilityController` uses `AvailabilityService` for one date and
`ListTourDates` for the list.

![C4 component view for picking a date and starting a booking](diagrams/c4-component.png)

### Class structure

`TourDate` carries a status and, only when booked, a gathering kind and city.
`CancellationPolicy` computes the free-cancellation date that the bookings slice
displays.

![Class diagram for picking a date and starting a booking](diagrams/class-structure.png)

### Behaviour — list upcoming dates and pick one

The On tour list loads from the start date. Pick on a free row moves that date into
the stub and the header Book button without another request.

![Sequence diagram for listing upcoming dates and picking one](diagrams/sequence-pick-tour-date.png)

### Behaviour — check a date in the stub

A date typed or chosen in the stub triggers a date check. A free date enables
submission, and a booked date disables it and suggests another date.

![Sequence diagram for checking a date in the booking stub](diagrams/sequence-check-date.png)
