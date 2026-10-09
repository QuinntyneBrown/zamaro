# Search available artists

## Overview

Zamaro is a marketplace where churches in and around Toronto book Christian praise
and worship artists. The Discover page (route `/`) is its front door. A church
planning an event states a date, the kind of gathering and where the church is, and
Zamaro answers with the *lineup*: every artist who is free that day and willing to
drive that far.

This feature is the search itself, from the form on Discover to the ordered lineup
of ticket cards. It is open to guests and to signed-in bookers. Sorting, filtering
and URL state are a separate slice (`discovery/sort-and-filter-results`), as is the
"Sold out" state shown when nobody matches (`discovery/suggest-alternatives-when-sold-out`).

Terms used in this design:

- **booker** — signed-in church representative who requests bookings
- **guest** — visitor who is not signed in
- **free** — state of an artist who is approved, not suspended, has not marked the date unavailable and has no Confirmed booking on that date
- **travel match** — condition that the road distance is within both the search radius and the artist's own maximum driving distance
- **lineup** — ordered list of artists who are free and travel-matched for one search
- **ticket card** — design-system card that presents one lineup entry with a perforated price stub
- **headliner card** — larger ticket card used for the first result in the default sort
- **Vulnerable Sector Check (VSC)** — police record check required for artists who lead youth events

Two rules decide who appears. The availability rule (L2-005) removes anyone not free
on the date, and for youth events anyone without a current verified VSC. The travel
rule (L2-003) removes anyone too far away for either party. Distance is road distance
from a routing provider, cached for 30 days and estimated from a straight line when
the provider is down (L2-002).

## Description

The slice runs from the Discover page in Zamaro Web to the search endpoint in the
Zamaro API, the Zamaro database and the routing provider.

**Frontend (Zamaro Web, `features/discover`)**

- **`DiscoverPage`** — routed page component for `/`. It hosts the poster headline,
  the search form and the lineup region. It pre-fills the church location and the
  120 km radius for a booker with a saved church, and leaves location and date empty
  for a guest (L2-004).
- **`SearchFormComponent`** — reactive form with event date, kind of gathering,
  church location (address search or one of 11 quick-pick city chips) and radius
  (40, 80, 120 or 200 km). It enforces the 3-day minimum and 18-month maximum,
  marks each empty required field and moves focus to the first invalid one.
- **`SearchStore`** — signal-based store holding the criteria, the current
  `Lineup`, a status (`idle`, `loading`, `loaded`, `error`) and a consecutive-failure
  count. It sets `aria-busy` and shows skeletons when a search takes longer than
  300 ms.
- **`SearchApi`** — typed client for `GET /api/v1/search`. It passes the cursor for
  the next page of 24.
- **`LineupComponent`**, **`HeadlinerCardComponent`**, **`TicketCardComponent`** —
  presentational components from the design system. They render position, name,
  act type and style, base city, distance, rating or "New", "From" price, and for the
  headliner the primary photo, the latest 5-star quote and "Free {date}" (L2-006).
  Each card links to `/artists/{slug}` with the search date carried forward.
- **`SearchErrorComponent`** — the "We lost the signal" state with Try again, the
  team email link and, after the third consecutive failure, the status-page link
  (L2-106).

Layout follows L2-097: one column at XS with stubs beneath card bodies, two-column
form at SM and MD with stubs to the right, and poster beside form with two cards per
row from LG.

**Backend (Zamaro API)**

- **`SearchController`** — invokable controller for `GET /api/v1/search`, behind the
  search rate limiter (L2-077).
- **`SearchArtistsRequest`** — FormRequest that validates the date window, the
  `GatheringKind`, coordinates inside the service area, the radius from the allowed
  set, and the cursor. It produces a `SearchCriteria` value object.
- **`SearchAvailableArtists`** — action that runs the search. It pre-filters approved,
  published, payout-ready artists whose base lies within a bounding box of the radius,
  asks `AvailabilityService` which are free, measures each with `DistanceService`,
  applies the travel match, orders by distance then rating then artist ID, and returns
  the first 24 as a `Lineup` with a cursor.
- **`AvailabilityService`** — domain service shared with profiles and bookings. It
  applies weekly rules, date overrides and Confirmed bookings, and for
  `GatheringKind::YouthEvent` requires a verified VSC issued within the last 3 years.
- **`DistanceService`** — returns a `Distance` (whole km, drive time rounded to
  5 minutes, `approximate` flag). It reads the Redis cache keyed on the coordinate
  pair rounded to 4 decimal places, calls `RoutingProvider` with a 2-second timeout on
  a miss, and stores the result for 30 days. On provider failure it returns straight-line
  distance × 1.3 flagged approximate and records a warning metric. Distances below
  1 km render as "Under 1 km".
- **`RoutingProvider`** — interface with one adapter for the routing provider
  (vendor `<TO SUPPLY>`).
- **`LineupResource`** — API resource that serialises the cards, the total and the
  next cursor.

**Data**

The query reads `artists`, `artist_styles`, `availability_rules`,
`availability_overrides`, `bookings` (status `Confirmed` only),
`vulnerable_sector_checks` and an aggregate of visible `reviews`. A GiST or
latitude/longitude B-tree index on artist base location supports the bounding-box
pre-filter; the exact index choice is `<TO SUPPLY>`.

## Requirements

The feature realises the following level-2 (L2) requirements. Each refines the
level-1 (L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-002` | `L1-001` | **Distance calculation.** Distance between an artist's base location and an event location is the road (driving) distance from the configured routing provider, rounded to the nearest whole kilometre, with an estimated drive time rounded to the nearest 5 minutes. Results are cached per pair of rounded coordinates (4 decimal places) for 30 days.<br>Acceptance criteria:<br>1. Given an artist in Brampton and a church in Burlington, when the distance is calculated, then the value shown equals the routing provider's driving distance rounded to the nearest km (for example "44 km").<br>2. Given the same artist and church pair was calculated within the last 30 days, when a search runs, then the cached value is used and the routing provider is not called.<br>3. Given the routing provider is unavailable or times out after 2 seconds, when a search runs, then the system uses straight-line distance multiplied by 1.3, labels each distance "about", and records a warning metric.<br>4. Given a distance of 0.4 km, when it is displayed, then it is shown as "Under 1 km". |
| `L2-003` | `L1-001` | **Travel match rule.** An artist matches an event location only when the distance (L2-002) is less than or equal to both the booker's chosen radius and the artist's own maximum driving distance.<br>Acceptance criteria:<br>1. Given a search radius of 120 km and an artist 97 km away who drives up to 120 km, when results are returned, then the artist is included.<br>2. Given a search radius of 120 km and an artist 97 km away who drives up to 60 km, when results are returned, then the artist is excluded.<br>3. Given a search radius of 40 km and an artist 44 km away who drives up to 120 km, when results are returned, then the artist is excluded.<br>4. Given an artist exactly 120 km away with a 120 km search radius and a 120 km driving limit, when results are returned, then the artist is included. |
| `L2-004` | `L1-002` | **Search inputs.** The Discover page (route `/`) has a search form with: event date, kind of gathering (Sunday service, Worship night, Youth event, Conference or retreat, Wedding, Funeral or memorial), church location, and driving radius (40 km · 30 min, 80 km · 1 hr, 120 km · 1.5 hr, 200 km · 2.5 hr). The form is available to guests and bookers.<br>Acceptance criteria:<br>1. Given a signed-in booker with a saved church, when they open Discover, then the church location is pre-filled with their church address and the radius defaults to 120 km.<br>2. Given a guest, when they open Discover, then the church location is empty, the radius defaults to 120 km and the date is empty.<br>3. Given an event date earlier than 3 days from today, when the booker submits, then the form shows "Pick a date at least 3 days away." against the date field and no search runs.<br>4. Given an event date more than 18 months from today, when the booker submits, then the form shows "We take bookings up to 18 months ahead." and no search runs.<br>5. Given any required field is empty, when the booker submits, then each empty field shows an inline error, focus moves to the first invalid field and no search runs.<br>6. Given a guest clicks a quick-pick city chip (Toronto, Burlington, Mississauga, Brampton, Hamilton, Markham, Ajax, Oshawa, Barrie, Kitchener, Niagara), when the chip is activated, then the church location is set to that city's centre point.<br>7. Given valid inputs, when "Show the lineup" is activated, then results load without a full page reload and the poster headline shows the chosen date (for example "Sat 14 Nov"). |
| `L2-005` | `L1-002` | **Availability match.** Search results contain only artists who are free on the chosen date and match the travel rule (L2-003). For Youth events, results contain only artists with a verified Vulnerable Sector Check (L2-049).<br>Acceptance criteria:<br>1. Given an artist with a Confirmed booking on Sun 15 Nov, when a booker searches Sun 15 Nov, then that artist is excluded.<br>2. Given an artist with only pending (Requested or Accepted) requests on Sat 14 Nov, when a booker searches Sat 14 Nov, then that artist is included.<br>3. Given an artist who marked Fri 20 Nov unavailable, when a booker searches Fri 20 Nov, then that artist is excluded.<br>4. Given a suspended artist or an artist whose application is not approved, when any search runs, then that artist is excluded.<br>5. Given the kind of gathering is Youth event and an artist has no verified Vulnerable Sector Check dated within the last 3 years, when results are returned, then that artist is excluded. |
| `L2-006` | `L1-002` | **Result card content.** Each result is shown as a ticket card. The first result in the default sort is shown as the larger headliner card with one review quote.<br>Acceptance criteria:<br>1. Given a result, when it is rendered, then the card shows position number, artist name, act type and style, base city, distance from the church, average rating with review count (or "New" with no reviews), and "From" price.<br>2. Given the headliner card, when it is rendered, then it also shows the primary photo, the most recent 5-star review quote (truncated to 160 characters at a word boundary) with reviewer name and city, and "Free {date}".<br>3. Given a card, when the booker activates it, then they navigate to `/artists/{slug}` with the search date carried forward so the profile's booking stub is pre-filled.<br>4. Given a signed-in booker, when a card is rendered, then it shows a Save toggle reflecting whether the artist is saved. |
| `L2-010` | `L1-002` | **Result paging.** Results load 24 at a time.<br>Acceptance criteria:<br>1. Given 30 matching artists, when the first page loads, then 24 cards are shown with a "Show more artists" button.<br>2. Given the booker activates "Show more artists", when the next page loads, then 6 more cards are appended, focus moves to the first new card and the button is removed.<br>3. Given 24 or fewer matches, when results load, then no "Show more artists" button is shown. |
| `L2-097` | `L1-020` | **Discover layout.**<br>Acceptance criteria:<br>1. Given XS, when Discover renders, then the poster, the search form and the lineup stack in one column and ticket stubs sit beneath each card's body.<br>2. Given SM and MD, when Discover renders, then the search form uses two columns and ticket stubs sit to the right of each card's body.<br>3. Given LG and XL, when Discover renders, then the poster headline and search form sit side by side, and the lineup shows two ticket cards per row.<br>4. Given XS, when filters are shown, then the style chips scroll horizontally in a single row without causing page-level horizontal scroll. |
| `L2-106` | `L1-023` | **Search error.**<br>Acceptance criteria:<br>1. Given the search request fails, when the lineup renders, then it shows "We lost the signal" with "We couldn't load who's free on {long date}. Your date, location and filters are kept.", a Try again button and an email link to the Zamaro team, and every input remains as entered.<br>2. Given Try again is activated, when it runs, then the same search is repeated.<br>3. Given the third consecutive failure, when the error renders, then it also links to the public status page. |

## Diagrams

### System context

Guests and bookers search Zamaro, which asks the routing provider for driving
distances and serves card images through the CDN.

![C4 system context for searching available artists](diagrams/c4-context.png)

### Containers

The Discover page in Zamaro Web calls the search endpoint in the Zamaro API, which
queries the database, reads cached distances from Redis and calls the routing
provider only for uncached pairs.

![C4 container view for searching available artists](diagrams/c4-container.png)

### Components

Inside the Zamaro API, `SearchController` validates with `SearchArtistsRequest` and
calls `SearchAvailableArtists`, which combines `AvailabilityService` and
`DistanceService` to build the lineup.

![C4 component view for searching available artists](diagrams/c4-component.png)

### Class structure

The frontend store and client mirror the backend action. `SearchAvailableArtists`
turns a `SearchCriteria` into a `Lineup` of up to 24 `LineupCard` entries, each
holding an `Artist` and a `Distance`.

![Class diagram for searching available artists](diagrams/class-structure.png)

### Behaviour — run a search

The form validates the date window before any request. The action narrows candidates
by bounding box and availability, measures distances through the cache, applies the
travel rule and returns the first page ordered Closest first.

![Sequence diagram for running a search](diagrams/sequence-search.png)

### Behaviour — search fails and is retried

A failed request leaves every input in place and shows the "We lost the signal"
state. Try again repeats the same search, and the third consecutive failure adds the
status-page link.

![Sequence diagram for a failed search and retry](diagrams/sequence-search-failure.png)
