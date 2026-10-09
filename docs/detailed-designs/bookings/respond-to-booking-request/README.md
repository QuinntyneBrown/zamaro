# Respond to a booking request

## Overview

Zamaro lets churches in and around Toronto book Christian praise and worship
artists. A booker starts a booking by sending a request (`bookings/send-booking-request`).
The artist then decides: accept, which asks the booker to pay a deposit, or
decline, which ends the booking and points the booker to other artists.

This feature is the artist's side of that decision. It covers the requests inbox
at `/artist/requests`, the artist's booking page at `/artist/bookings/:number` where
each request is read and answered, the Accept dialog and the Decline dialog with its
optional reason and note. A request the artist never answers expires on schedule; that transition is
owned by `bookings/run-booking-lifecycle`. The deposit that follows acceptance is
`payments/pay-deposit`.

Terms used in this design:

- **requests inbox** — artist workspace page at `/artist/requests` whose New tab lists the artist's bookings in status Requested, soonest deadline first
- **artist booking page** — artist workspace page at `/artist/bookings/:number` showing one booking from the artist's side, with Accept and Decline while it is Requested
- **response deadline** — instant by which the artist answers: 72 hours after the request, or 24 hours when the event is fewer than 7 days away (L2-030)
- **time left** — interval between now and the response deadline, shown on each request
- **platform fee** — 8 % of the total that Zamaro keeps from each booking (L2-039)
- **payout** — amount the artist receives after the event: total collected minus the platform fee
- **similar artist** — another artist free on the same date who travels to the church, chosen by `SimilarArtistFinder`, the service shared with the missing-artist page (L2-021) and artist cancellations (L2-043); its similarity rule is `<TO SUPPLY>`
- **decline reason** — optional choice the artist gives with a decline: "I'm not free that day", "It's too far to travel", "It's not the right fit" or "Another reason"
- **decline note** — optional plain-text note to the church of up to 500 characters, sent with the decline reason

## Description

The slice runs from the artist workspace in Zamaro Web through the artist requests
endpoints of the Zamaro API to the Zamaro database. Emails to the booker are queued
and sent by the Zamaro Worker.

**Frontend (Zamaro Web, `features/artist-workspace`)**

- **`ArtistRequestsPage`** — routed page component for `/artist/requests`, behind
  the Artist role guard. Its header counts the new requests ("3 new · answer within
  72 hours"). A design-system tab list holds four tabs: New (Requested, soonest
  deadline first), Accepted (waiting for the church's deposit), Confirmed and Past.
  A search box matches church, city and kind of gathering within the current tab.
  Each tab renders one `RequestRowComponent` per booking, in the order the API
  returns. Under 576 px (XS) the tabs scroll sideways inside the tab list.
  - **Empty** — an artist with no requests sees "No requests yet" and "When a church
    asks for one of your Free dates, it lands here and we email you. You have 72
    hours to reply, so keep your calendar current.", with one "Check your
    availability" action.
  - **No results** — a search that matches nothing in the tab says so, points to the
    tab that does hold the church when there is one, and offers "Clear search".
  - **Loading and error** — skeleton rows hold the tabs' shape while loading; a failed
    load says every request is also in email and that reply-by times still apply,
    and offers Try again and Back to dashboard (L2-105).
- **`RequestRowComponent`** — presentational row linking to the artist booking page.
  On the New tab it shows short date, church name, kind of gathering, start time,
  city and distance, quoted price and payout after the fee ("$650 quoted · you get
  $598"), a preview of the request message as the artist sees it, a Requested stamp
  and the time left with the reply-by time (L2-034). Time left refreshes each minute
  from `respondBy`. Money, dates, times and distance use `FormatService` (L2-110).
  Rows carry no Accept or Decline buttons.
- **`ArtistBookingPage`** — routed page component for `/artist/bookings/:number`,
  behind the Artist role guard. It reads `GET /api/v1/bookings/{number}` from
  `bookings/view-booker-bookings`. The header names the church, the kind of
  gathering, date, start time and when the booking was requested, with a status
  stamp. The main column holds the message thread of
  `bookings/exchange-booking-messages` (`#messages`), the event details (date,
  start time, kind of gathering, church, distance and drive time from the artist's
  base, contact) and the artist's other bookings that weekend.
  The side panel follows the status:
  - **Requested** — "Your fee": quoted price, Zamaro 8 %, "You receive", the line
    "You'll be paid ${payout} after the event.", the reply-by time with time left,
    and the Accept and Decline buttons (L2-034);
  - **Accepted** — "Waiting for the deposit" with the church's deposit deadline;
  - **Declined** — "You declined" with the time and the reason;
  - **Expired** — "Request expired" with the missed reply-by time and "Nothing was
    charged".
  - **Withdrawn** — "{church} withdrew" with the time the booker withdrew, "Nothing
    was charged" and a way back to the requests; the request now sits under Past
    (L2-031, `bookings/withdraw-booking-request`).

  The Confirmed, Completed and Cancelled panels belong to `bookings/cancel-booking`
  and `payments/pay-out-artists`.
- **`AcceptRequestDialogComponent`** — design-system dialog that repeats the fee
  receipt and "You'll be paid ${payout} after the event.", states the church's
  deposit deadline ("Riverside then has 48 hours, until Sun 11 Oct, 2:40 p.m., to
  pay the $162.50 deposit."), and says the price was locked when the church asked.
  Focus starts on the confirm button, which reads "Accept request". While pending
  the confirm button is busy ("Accepting…") and Cancel is disabled (L2-108). A failed send shows an alert that
  nothing reached the church and offers Try again. A 409 `already-booked` turns it
  into the conflict state, titled "You're already booked on {date}", which explains
  that another church's booking was confirmed for that date and that this request
  becomes Declined with "Booked by another church", with Back to requests and Close
  (L2-030, L2-032). A 409 `contact-phone-missing` turns it into the no-phone state,
  titled "Add your contact phone before you accept", which explains that the church
  sees the artist's contact phone and email once the booking is Confirmed (L2-046),
  that the phone is never on the public profile, and that the request stays open until
  its reply-by time; it offers Not now and "Add contact phone", a link to the Contact
  section of account settings (`/account#contact`, L2-025, L2-030).
- **`DeclineRequestDialogComponent`** — design-system danger dialog titled "Decline
  this request". It says the church will be shown 3 similar artists free that date,
  that nothing is charged and that the decline can't be undone. It holds an optional
  radio group "Why are you declining?" with the four decline reasons (the
  too-far option names the distance) and an optional "Note to {church contact}"
  textarea with a live count against 500 characters. Focus starts on the first
  reason, never on Decline. A note over 500 characters shows an error summary and
  an inline error ("Keep your note to 500 characters; it's 526 now.").
- **`ArtistBookingStore`** — signal-based store for one booking and the pending
  accept or decline. After a successful accept or decline it reloads the booking,
  closes the dialog and announces the result through `LiveAnnouncer` and a toast
  (L2-109). A 409 reloads the booking.
- **`ArtistRequestsStore`** — signal-based store holding the tab, the search query,
  the list and the cursor.
- **`ArtistRequestsApi`** — typed client for the endpoints below. Accept and Decline
  confirm buttons show a busy state and block a second submission while pending
  (L2-108).

**Backend (Zamaro API)**

- **Routes** — all under the Artist role. A booker calling them receives 404
  (L2-074). A request that belongs to another artist also returns 404, because
  route binding scopes `{booking:number}` to the signed-in artist.
  - `GET /api/v1/artist/requests?tab=new|accepted|confirmed|past&q=&cursor=`
    returns one tab of the inbox with cursor pagination (L2-095). `q` matches
    church name, city and kind of gathering.
  - `POST /api/v1/artist/requests/{number}/accept` accepts.
  - `POST /api/v1/artist/requests/{number}/decline` declines.
- **`ArtistRequestsController`** — thin controller with `index`, `accept` and
  `decline`, each authorised by `BookingPolicy::respond`.
- **`ListArtistRequests`** — query action. For the New tab it selects the artist's
  Requested bookings ordered by `respond_by`, then `id` (L2-034). Accepted is ordered
  by `deposit_due_by`, Confirmed by event date ascending and Past (Completed,
  Declined, Withdrawn, Expired, Cancelled) by event date descending. For each booking
  it builds an `ArtistRequestResource`:
  - distance from `DistanceService::between(artist base, church snapshot)`
    (L2-002);
  - payout from `PriceBreakdown::forBooking(booking)->artistPayoutCents`, the total
    minus the 8 % fee (for a $650 quote, $598.00);
  - the request message in the recipient view stored by
    `bookings/exchange-booking-messages`, with contact details replaced (L2-046);
  - `respondBy`, from which Zamaro Web computes time left.
- **`AcceptBookingRequest`** — FormRequest with no body fields; it exists for the
  authorisation hook.
- **`AcceptBooking`** — action run inside `DB::transaction`:
  1. locks the artist row with `SELECT ... FOR UPDATE`, the same lock
     `payments/pay-deposit` takes when it confirms;
  2. checks that the artist has a contact phone saved in account settings
     (`artists.contact_phone`, L2-025), and otherwise fails with 409
     `contact-phone-missing` and the copy "Add your contact phone before you
     accept." without changing the booking (L2-030);
  3. checks that the artist has no Confirmed booking on the date, and otherwise
     fails with 409 `already-booked` and the copy "You're already booked on {date}."
     (L2-030);
  4. applies Requested → Accepted through `BookingStateMachine` with the artist as
     actor; a request that already expired or was withdrawn fails with 409
     (L2-029);
  5. stores `accepted_at` and `deposit_due_by`, using the deposit deadline rule of
     `payments/pay-deposit` (L2-037).

  After commit, `RequestAccepted` emails the booker with the deposit link and
  deadline (L2-063). The booker's next action on `/bookings` becomes Pay deposit.
- **`DeclineBookingRequest`** — FormRequest validating `reason` as an optional
  `DeclineReason` case (`NotFree`, `TooFar`, `NotRightFit`, `Other`) and `note` as
  optional plain text of at most 500 characters (L2-030, L2-075).
- **`DeclineBooking`** — action that applies Requested → Declined with the artist as
  actor, stores the reason on the transition and as `bookings.decline_reason`, and
  the note as `bookings.decline_note`. A note is also posted to the booking thread
  through `SendBookingMessage`, marked as the decline, so the booker reads it beside
  the earlier messages and the contact-detail rule of L2-046 applies. After commit,
  `RequestDeclined` queues the booker email with the reason and note (L2-030,
  L2-063).
- **`SimilarArtistFinder`** — domain service shared with discovery and
  cancellation. `freeOn(artist, date, church, limit: 3)` returns up to three other
  artists who are free on the date and travel to the church. The decline email
  lists them with links to their profiles carrying the date. The listener runs in
  the Zamaro Worker, so the search does not delay the artist's response.
- **Expiry** — `bookings/run-booking-lifecycle` expires Requested bookings when
  `respond_by` passes and emails both parties (L2-030). An Accept that arrives after
  expiry fails with 409, and the reloaded page shows the Expired panel.

**Data (Zamaro database)**

- `bookings` — reads `respond_by`, church snapshot, `quoted_price_cents`,
  `hst_cents`; writes `status`, `accepted_at`, `deposit_due_by`, `decline_reason`,
  `decline_note`.
- `bookings_artist_requested_idx` — partial index on (`artist_id`, `respond_by`)
  `WHERE status = 'Requested'` for the inbox query.
- `booking_transitions` — one row per accept or decline, with the reason for a
  decline.

**Mock screens** — [`pages/requests`](../../../mocks/pages/requests/default.html) in
its states [default](../../../mocks/pages/requests/default.html),
[loading](../../../mocks/pages/requests/loading.html),
[empty](../../../mocks/pages/requests/empty.html),
[error](../../../mocks/pages/requests/error.html) and
[no-results](../../../mocks/pages/requests/no-results.html);
[`pages/request-detail`](../../../mocks/pages/request-detail/default.html) (the artist
booking page) in its states [default](../../../mocks/pages/request-detail/default.html)
(Requested), [loading](../../../mocks/pages/request-detail/loading.html),
[error](../../../mocks/pages/request-detail/error.html),
[accepted](../../../mocks/pages/request-detail/accepted.html),
[declined](../../../mocks/pages/request-detail/declined.html),
[expired](../../../mocks/pages/request-detail/expired.html) and
[withdrawn](../../../mocks/pages/request-detail/withdrawn.html);
[`dialogs/accept-request`](../../../mocks/dialogs/accept-request/default.html)
(default, busy, failed, [conflict](../../../mocks/dialogs/accept-request/conflict.html),
[no-phone](../../../mocks/dialogs/accept-request/no-phone.html));
[`dialogs/decline-request`](../../../mocks/dialogs/decline-request/default.html)
(default, busy, [invalid](../../../mocks/dialogs/decline-request/invalid.html),
failed); [`notifications/request-toast`](../../../mocks/notifications/request-toast/info.html)
for the new-request, reply-by (in-app only, once a request has less than 24 hours
left; there is no reminder email), accepted and failed toasts. The booker's view of a
decline is [`pages/booking-detail` declined](../../../mocks/pages/booking-detail/declined.html).

## Requirements

The feature realises the following level-2 (L2) requirements. Each refines the
level-1 (L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-030` | `L1-006` | **Artist accepts or declines.**<br>Acceptance criteria:<br>1. Given a Requested booking, when the artist accepts, then it becomes Accepted and the booker is asked to pay the deposit (L2-037).<br>2. Given a Requested booking, when the artist declines with an optional reason (I'm not free that day, It's too far to travel, It's not the right fit or Another reason) and an optional note of up to 500 characters, then it becomes Declined and the booker is notified with the reason, the note and 3 similar artists free on that date.<br>3. Given a Requested booking with no response for 72 hours, or 24 hours when the event is fewer than 7 days away, when the deadline passes, then it becomes Expired and both parties are notified.<br>4. Given an artist tries to accept a request for a date that already has a Confirmed booking, when they accept, then it is rejected with "You're already booked on {date}."<br>5. Given an artist with no contact phone in account settings (L2-025), when they try to accept a request, then it is rejected with "Add your contact phone before you accept." and a link to account settings, and the booking stays Requested with its response deadline unchanged. |
| `L2-034` | `L1-006` | **Artist requests inbox.**<br>Acceptance criteria:<br>1. Given an artist, when they open `/artist/requests`, then they see Requested bookings ordered by response deadline, each showing church name, city, distance, date, kind of gathering, start time, message, quoted price, their payout after the fee and the time left to respond.<br>2. Given a Requested booking, when it is viewed, then Accept and Decline actions are available and Accept states "You'll be paid ${payout} after the event." |

## Diagrams

### System context

The artist answers requests in Zamaro. Zamaro asks the routing provider for the
distance to each church and emails the booker the outcome.

![C4 system context for responding to a booking request](diagrams/c4-context.png)

### Containers

The artist workspace in Zamaro Web calls the artist requests endpoints of the Zamaro
API. The API writes the decision; the Zamaro Worker finds similar artists and sends
the booker email.

![C4 container view for responding to a booking request](diagrams/c4-container.png)

### Components

`ArtistRequestsController` delegates to `ListArtistRequests`, `AcceptBooking` and
`DeclineBooking`. Both decisions pass through `BookingStateMachine`, and the decline
email uses `SimilarArtistFinder`.

![C4 component view for responding to a booking request](diagrams/c4-component.png)

### Class structure

The inbox store holds `ArtistRequest` entries built by `ListArtistRequests`; the
artist booking page opens the accept and decline dialogs. The accept and decline
actions change a `Booking` through the state machine.

![Class diagram for responding to a booking request](diagrams/class-structure.png)

### Behaviour — open the requests inbox

The New tab lists Requested bookings by response deadline, each with distance,
payout after the fee and time left. Each row opens the artist booking page, where
Accept and Decline live.

![Sequence diagram for opening the requests inbox](diagrams/sequence-open-inbox.png)

### Behaviour — accept a request

The Accept dialog shows the payout and the deposit deadline. Acceptance locks the
artist row, refuses an artist with no contact phone with the dialog's no-phone state
and a date that is already Confirmed with its conflict state, and moves the booking to Accepted. The booker is emailed the deposit link and deadline.

![Sequence diagram for accepting a booking request](diagrams/sequence-accept-request.png)

### Behaviour — decline a request

The artist may choose a reason and write a note. The booking becomes Declined, and
the booker email carries the reason, the note and up to three similar artists free
that date.

![Sequence diagram for declining a booking request](diagrams/sequence-decline-request.png)
