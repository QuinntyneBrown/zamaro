# View the booker's bookings

## Overview

Zamaro lets churches in and around Toronto book Christian praise and worship
artists. A booker may hold several bookings at once, each at a different point in
its life: one waiting for an artist's answer, one waiting for a deposit, one
confirmed for next month, and older ones that are finished. The bookings page gives
the booker one place to see all of them and to take the next step on each.

This feature covers two routes. `/bookings` lists the booker's bookings on two
tabs, Upcoming and Past. `/bookings/:number` shows one booking in full and is the
host page for actions owned by sibling slices:

- Pay deposit dialog — `payments/pay-deposit`
- Withdraw — `bookings/withdraw-booking-request`
- Cancel and the free-cancellation line — `bookings/cancel-booking`
- Message thread and contact details — `bookings/exchange-booking-messages`
- History timeline — `bookings/run-booking-lifecycle`
- Leave a review — `reviews/leave-review`

The artist's own view of a booking (`/artist/bookings/:number`) reads the same
detail endpoint and is described where its actions live.

Terms used in this design:

- **upcoming booking** — booking in status Requested, Accepted or Confirmed
- **past booking** — booking in status Completed, Declined, Withdrawn, Expired or Cancelled
- **amount paid** — sum of the booking's succeeded payments minus its succeeded refunds, in integer cents
- **next action** — single most useful step the booker can take on a booking from the list: Pay deposit, Message or Leave a review; Withdraw and Cancel are offered on the booking page only
- **status filter** — select on each tab that narrows the list to one status of that tab
- **booking detail** — full representation of one booking returned to one of its parties

## Description

The slice runs from the bookings pages in Zamaro Web through the booker bookings
endpoints of the Zamaro API to the Zamaro database. It reads only; it writes
nothing.

**Frontend (Zamaro Web, `features/bookings`)**

- **`BookingsPage`** — routed page component for `/bookings`, behind the Booker role
  guard. Its header names the church, counts the upcoming bookings and names the
  most urgent deposit deadline, with a "Find who's free" action. It renders a
  design-system tab list with two tabs, Upcoming (soonest first) and Past (most
  recent first), each with a count badge, its own list and its own "Show more"
  control. Each tab carries a status filter: Requested, Accepted and Confirmed on
  Upcoming; Completed, Declined, Withdrawn, Expired and Cancelled on Past.
  - **Empty** — a booker with no bookings sees "No bookings yet" and "When you ask
    an artist to lead worship, the request and every step after it lives here:
    their reply, your deposit and the night itself.", with one "Find who's free"
    action. The tabs and filter appear with the first booking.
  - **No results** — a filter that matches nothing keeps the filter visible, says
    so (for example "No expired bookings") and offers "Clear status filter".
  - **Loading and error** — skeleton rows hold the list's shape while loading; a
    failed load keeps the heading and offers Try again and Back to Discover
    (L2-105).
- **`BookingListItemComponent`** — presentational row showing the short date, the
  artist name linked to the booking, booking number, kind of gathering, start
  time, the artist's town and distance, amount paid, a status stamp
  (`BookingStatusStampComponent`) and one next-action button (L2-033). "Pay
  ${deposit} deposit" opens `/bookings/:number`, where the Pay deposit dialog of
  `payments/pay-deposit` is the panel's primary action; Message opens
  `/bookings/:number#messages`; Leave a review opens the form of
  `reviews/leave-review`. A row with no action shows a short caption instead, such
  as "Nothing charged" or "Reviewed" with the stars given.
- **`BookingsStore`** — signal-based store holding both groups with their cursors,
  status filters and a status per group. It loads Upcoming first, then Past.
- **`BookingDetailPage`** — routed page component for `/bookings/:number`. It renders
  the booking summary (artist, date, start time, kind of gathering, church,
  quoted price, amount paid, status), then the components of sibling slices
  according to `allowedActions`. A 404 renders the not-found state, worded like a
  mistyped link so it never confirms that the booking exists (L2-033).
- **`BookingDetailStore`** — signal-based store for one booking, reloaded after any
  action or conflict.
- **`BookingsApi`** — typed client with `list(group, cursor?)` and `get(number)`.

Layout follows L2-096 and the design system's booking list
(`docs/design-system/components/booking-list.html`). Below MD each row has two
columns: the date block on the left, the artist and meta line stacked on the right,
and a full-width status line underneath with the stamp on the left and the next
action on the right; the amount column is hidden because the meta line already says
"Paid {amount}". From MD the row has four columns: date, artist and meta, amount and
status, with the status right-aligned.

**Backend (Zamaro API)**

- **Routes** — behind `auth:sanctum`:
  - `GET /api/v1/bookings?group=upcoming|past&status=&cursor=` — Booker role;
    optional status from the group's statuses; cursor pagination (L2-095). Page
    size is `<TO SUPPLY>`.
  - `GET /api/v1/bookings/{number}` — the booker or the artist of the booking.
- **`BookingsController`** — `index` validates `ListBookingsRequest` (group from the
  two values, optional status, cursor) and calls `ListBookerBookings`; `show` returns
  `BookingResource`.
- **`ListBookerBookings`** — query action scoped to `booker_id = auth()->id()`:
  - Upcoming: status in Requested, Accepted, Confirmed, ordered by `event_date`
    ascending then `id` (L2-033).
  - Past: every other status, ordered by `event_date` descending then `id`
    descending (L2-033).

  It eager-loads the artist's display name, slug, primary photo and home town, takes
  the road distance from `DistanceService::between(artist base, church snapshot)`,
  and computes amount paid with `withSum` subqueries over `payments` and `refunds`,
  so the list runs in a fixed number of queries.
- **`BookingNextAction`** — domain service that picks the next action for one
  booking and party:
  - Accepted with no succeeded deposit → Pay deposit;
  - Requested, Confirmed or Declined → Message;
  - Completed and eligible under `reviews/leave-review` (L2-059) → Leave a review;
  - any other case → none.

  Withdraw (Requested, Accepted) and Cancel (Confirmed) are never list actions; the
  booking page offers them through `allowedActions`.
- **Ownership** — route binding resolves `{booking:number}` through
  `Booking::visibleTo($user)`, which matches the booker or the artist of the
  booking. Any other user receives 404 with no data, never 403 (L2-033, L2-074).
- **`BookingSummaryResource`** — list item: `number`, `artist` (name, slug, photo,
  town), `distanceKm`, `eventDate`, `startTime`, `gatheringKind`, `status`,
  `amountPaidCents`, `nextAction`.
- **`BookingResource`** — detail: the summary fields plus the church
  snapshot, `message`, `quotedPriceCents`, `hstCents`, `respondBy`, `depositDueBy`,
  `allowedActions`, and the members supplied by sibling slices: `history`
  (`bookings/run-booking-lifecycle`), `freeCancellationUntil`
  (`bookings/cancel-booking`) and `contacts` (`bookings/exchange-booking-messages`).
  `allowedActions` combines `BookingStateMachine::allowedFrom()` with the party's
  policy abilities.

**Data (Zamaro database)**

- `bookings_booker_event_date_idx` — index on (`booker_id`, `event_date`, `id`) for
  both list orders and the status filter.
- Reads `bookings`, `artists`, `artist_photos`, `payments`, `refunds` and, for the
  review check, `reviews`.

**Mock screens** — [`pages/bookings`](../../../mocks/pages/bookings/default.html) in
its states [default](../../../mocks/pages/bookings/default.html) (Upcoming),
[past](../../../mocks/pages/bookings/past.html),
[loading](../../../mocks/pages/bookings/loading.html),
[empty](../../../mocks/pages/bookings/empty.html),
[error](../../../mocks/pages/bookings/error.html) and
[no-results](../../../mocks/pages/bookings/no-results.html);
[`pages/booking-detail`](../../../mocks/pages/booking-detail/default.html) as the host
page, with its [loading](../../../mocks/pages/booking-detail/loading.html),
[error](../../../mocks/pages/booking-detail/error.html) and
[forbidden](../../../mocks/pages/booking-detail/forbidden.html) (404) states. The
status states of the booking page (accepted, confirmed, declined, completed,
withdrawn, cancelled, expired, deposit-expired, artist-cancelled, balance-due, held,
balance-failed)
belong to the slices that own each action.

## Requirements

The feature realises the following level-2 (L2) requirement. It refines the level-1
(L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-033` | `L1-006` | **Booker bookings page.**<br>Acceptance criteria:<br>1. Given a booker, when they open `/bookings`, then they see Upcoming (Requested, Accepted, Confirmed) ordered by event date ascending, and Past (all other statuses) ordered by event date descending.<br>2. Given a booking, when it is listed, then it shows booking number, artist, date, kind of gathering, status, amount paid and the next action (Pay deposit, Message or Leave a review); Withdraw and Cancel are offered on the booking page.<br>3. Given a booker opens another booker's booking URL, when it is requested, then the response is 404. |

## Diagrams

### System context

The booker reads bookings in Zamaro. Artist photos on the list come through the CDN;
no other external system takes part.

![C4 system context for viewing the booker's bookings](diagrams/c4-context.png)

### Containers

The bookings pages in Zamaro Web call two read endpoints of the Zamaro API, which
query the Zamaro database.

![C4 container view for viewing the booker's bookings](diagrams/c4-container.png)

### Components

`BookingsController` calls `ListBookerBookings` for the list and resolves one booking
through the ownership scope for the detail. `BookingNextAction` and the two
resources shape the response.

![C4 component view for viewing the booker's bookings](diagrams/c4-component.png)

### Class structure

The store holds two `BookingGroup` lists of `BookingSummary` entries, each with its
own status filter. On the backend
`ListBookerBookings` returns `Booking` rows that the resources serialise with the
action chosen by `BookingNextAction`.

![Class diagram for viewing the booker's bookings](diagrams/class-structure.png)

### Behaviour — list bookings

The page loads Upcoming in ascending date order and Past in descending date order,
each row carrying amount paid and at most one next action.

![Sequence diagram for listing the booker's bookings](diagrams/sequence-list-bookings.png)

### Behaviour — open one booking

A party to the booking receives the full detail. Any other user, including another
booker, receives 404 and the page shows the not-found state.

![Sequence diagram for opening one booking](diagrams/sequence-open-booking.png)
