# Manage the availability calendar

## Overview

Search on Zamaro only lists artists who are free on the chosen date (L2-005). An
artist controls part of that answer: the days they choose not to work. This feature
is the artist's calendar at `/artist/calendar`, where they see the next 18 months,
set a weekly default such as "unavailable every Monday", and mark single dates or
ranges unavailable or free.

The calendar also shows what bookings have done to each day. A Confirmed booking
locks its date as Booked. Open requests show as Requested with a count. Marking a
requested date unavailable declines those requests after a warning, so the calendar
and the bookings never disagree (L1-012).

The slice sits in the artist-availability subsystem. The secret iCalendar feed of
Confirmed bookings is the sibling `artist-availability/publish-calendar-feed`. Search
(`discovery/search-available-artists`) and the public profile read the same
availability through the shared `AvailabilityService`.

Terms used in this design:

- **weekly default** — set of weekdays on which an artist is unavailable unless a date override says otherwise
- **date override** — artist's explicit choice for one date, either Free or Unavailable, that takes precedence over the weekly default
- **open request** — booking for the artist with status Requested or Accepted
- **day status** — calendar label for one date: Free, Unavailable, Requested (with count) or Booked
- **calendar window** — the next 18 months from today in `America/Toronto`

Each day's status is derived on read, never stored. The derivation applies, in
order: Booked when a Confirmed booking exists; Unavailable when a date override or
the weekly default says so; Requested with a count when open requests exist; and Free
otherwise (L2-056, L2-057). A new artist with no rules and no overrides therefore sees
every date as Free (L2-056). A Cancelled booking drops out of the derivation, so its
date returns to its prior Free or default state (L2-057).

## Description

The slice runs from the artist workspace in Zamaro Web to the calendar and
availability endpoints in the Zamaro API and the Zamaro database. The Zamaro Worker
sends emails for any requests declined on the way.

**Frontend (Zamaro Web, `features/artist-workspace/calendar`)**

- **`ArtistCalendarPage`** — routed page for `/artist/calendar`. It shows a legend,
  the weekly default form and 18 month panels. It offers "Mark unavailable" and "Mark
  free" for the selected range. Booked days are not selectable.
- **`CalendarMonthComponent`** — presentational month grid built on the
  design-system calendar styles (`calendar__day` with `data-status` of `free`,
  `blocked`, `requested`, `booked` or `past`). Each day has an accessible name that
  includes its status and request count, for example "Saturday 14 November 2026,
  Requested, 2 churches". It emits a date range from a start and end selection.
- **`WeeklyDefaultFormComponent`** — seven switches, one per weekday, with Save.
- **`ConfirmDeclineDialogComponent`** — design-system dialog that shows "{n} churches
  have asked about this date. They'll be told you're not available." with Confirm and
  Cancel (L2-057). It traps focus and returns it to the triggering control (L2-101).
- **`AvailabilityStore`** — signal-based store holding the months, the weekly
  default and any pending confirmation. It reloads the calendar after each save and
  raises a success toast (L2-109).
- **`AvailabilityApi`** — typed client for the three endpoints below.

**Backend (Zamaro API)**

- **`ArtistCalendarController`** — exposes `GET /api/v1/artist/calendar`. It requires
  the Artist role, scopes to the caller's own artist (L2-074), calls
  `BuildArtistCalendar` and returns `CalendarResource` with
  `Cache-Control: private, no-store`.
- **`BuildArtistCalendar`** — action that loads the weekly rules, the date overrides
  and the bookings with status Requested, Accepted or Confirmed in the calendar
  window in three queries. It derives a `CalendarDay` per date with `status`,
  `requestCount` and `editable` (false for Booked).
- **`ArtistAvailabilityController`** — exposes:
  - `PUT /api/v1/artist/availability/weekly` with `{ "unavailableWeekdays": [1] }`
    (ISO weekdays, 1 is Monday)
  - `PUT /api/v1/artist/availability/dates` with
    `{ "from", "to", "state": "Unavailable"|"Free", "confirm": false|true }`
- **`SetDateAvailabilityRequest`** — FormRequest that requires `from` on or before
  `to`, both inside the calendar window, and a valid state (L2-075).
- **`SetWeeklyAvailability`** — action that replaces the artist's
  `availability_rules` in one transaction and dispatches `ArtistAvailabilityChanged`.
  Whether a new weekly default that covers dates with open requests also warns and
  declines them, as a range change does, is `<TO SUPPLY>`.
- **`SetDateAvailability`** — action that runs inside `DB::transaction` with the
  artist row locked, so a concurrent request or confirmation sees a consistent state.
  For an Unavailable change it counts open requests in the range. Without `confirm`
  and with a non-zero count it rolls back and returns 409 problem details carrying
  `affectedRequests`. With `confirm` it re-reads the open requests, skips dates that
  hold a Confirmed booking, upserts the overrides, and moves each open request to
  Declined through `BookingStateMachine`. It returns a `RangeResult` with the changed
  days, skipped Booked dates and declined count. The decline reason shown to bookers
  is `<TO SUPPLY>`.
- **`BookingStateMachine`** — shared domain service that allows Requested → Declined
  and Accepted → Declined and records a `BookingTransition` with from-status,
  to-status, actor and timestamp (L2-029).
- **`AvailabilityService`** — shared domain service. Search calls
  `isFree(artist, date)`; this slice adds `isUnavailableByChoice(artist, date)` for
  the override-then-weekly-default rule.
- **Events and listeners** — `BookingDeclined` notifies each booker within 2 minutes
  (L2-063) through the booking notifications. `ArtistAvailabilityChanged` triggers
  `InvalidateArtistProfileCache`, which purges cached profile copies within 60 seconds
  (L2-089).

Search reads availability straight from committed rows, with no availability cache,
so a saved range is excluded from the next search, well inside the 60 seconds of
L2-056. Any future availability cache shall expire within 60 seconds.

**Data**

- `availability_rules` — `id`, `artist_id`, `weekday` (1–7), `unavailable`; unique on
  `(artist_id, weekday)`.
- `availability_overrides` — `id`, `artist_id`, `date`, `state` (`Free`,
  `Unavailable`); unique on `(artist_id, date)`.
- `bookings` — read for statuses Requested, Accepted and Confirmed in the window; the
  partial unique index on `(artist_id, event_date)` where `status = 'Confirmed'`
  (L2-032) keeps Booked days single.
- `booking_transitions` — written for each declined request.

## Requirements

The feature realises the following level-2 (L2) requirements, quoted from
`docs/specs/L2.md` with the level-1 (L1) requirement each one refines.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-056` | `L1-012` | **Availability calendar.**<br>Acceptance criteria:<br>1. Given an artist on `/artist/calendar`, when it renders, then it shows the next 18 months by month with each day marked Free, Unavailable, Requested (with count) or Booked.<br>2. Given an artist sets a weekly default (for example unavailable every Monday), when they save, then every future date matching it is unavailable unless the artist overrides that date.<br>3. Given an artist marks a range of dates unavailable, when they save, then searches for those dates exclude them within 60 seconds.<br>4. Given a new artist, when no availability has been set, then every date is Free. |
| `L2-057` | `L1-012` | **Availability and bookings stay consistent.**<br>Acceptance criteria:<br>1. Given a booking becomes Confirmed, when the calendar renders, then that date shows Booked and cannot be changed by the artist.<br>2. Given a date with Requested or Accepted bookings, when the artist marks it unavailable, then they are warned "{n} churches have asked about this date. They'll be told you're not available." and on confirmation those bookings become Declined.<br>3. Given a booking is Cancelled, when the calendar renders, then that date returns to its prior Free or default state. |

## Diagrams

### System context

An artist manages availability in Zamaro, and bookers see the result in search.
Zamaro emails bookers whose open requests are declined by an availability change.

![C4 system context for managing the availability calendar](diagrams/c4-context.png)

### Containers

The calendar page in Zamaro Web reads and saves availability through the Zamaro API.
The Zamaro Worker sends declined-request emails and invalidates cached profiles.

![C4 container view for managing the availability calendar](diagrams/c4-container.png)

### Components

`BuildArtistCalendar` derives day statuses through `AvailabilityService`.
`SetDateAvailability` writes overrides and declines open requests through
`BookingStateMachine`.

![C4 component view for managing the availability calendar](diagrams/c4-component.png)

### Class structure

`AvailabilityRule` and `AvailabilityOverride` hold the artist's choices. `Booking`
rows supply Requested and Booked days, and `CalendarDay` carries the derived
`DayStatus` to the page.

![Class diagram for managing the availability calendar](diagrams/class-structure.png)

### Behaviour — view the calendar

The action loads rules, overrides and bookings once and derives each day's status in
order of precedence. Cancelled bookings play no part, so their dates fall back to the
artist's own settings.

![Sequence diagram for viewing the availability calendar](diagrams/sequence-view-calendar.png)

### Behaviour — mark dates unavailable

A first save that would affect open requests returns 409 with the count, and the page
shows the warning dialog. The confirmed save writes the overrides, skips Booked dates
and declines the open requests in one transaction.

![Sequence diagram for marking dates unavailable](diagrams/sequence-mark-dates-unavailable.png)

### Behaviour — set the weekly default

Saving the weekly default replaces the artist's rules in one transaction. Every
matching future date then shows Unavailable unless a date override says Free.

![Sequence diagram for setting the weekly default](diagrams/sequence-set-weekly-default.png)
