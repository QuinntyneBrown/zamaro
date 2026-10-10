# Suggest alternatives when sold out

## Overview

Some searches on Discover return nobody. Christmas Eve is the busiest night of the
year for worship artists, and a 40 km radius around a small town may hold no gospel
choir at all. An empty list with no next step would end the visit. This feature
replaces the empty lineup with a "Sold out" state that explains why and offers
concrete ways forward: a nearby date, a wider radius, or all styles.

The feature sits at the end of the search flow. The search itself belongs to
`discovery/search-available-artists`. The sort order, filters and URL state belong
to `discovery/sort-and-filter-results`. This slice adds the state shown when the
filtered total is zero and the backend query that finds the alternatives.

Terms used in this design:

- **sold-out state** — lineup-area panel shown when a search has zero matches
- **date description** — phrase naming the searched date in the headline, either a named day such as "Christmas Eve" or the short date such as "Sat 14 Nov"
- **nearby date** — date within 7 days either side of the searched date on which at least one artist is free under the current filters
- **wider radius** — radius option from the set 40, 80, 120 and 200 km that is larger than the current one
- **alternatives** — nearby dates, smallest wider radius with matches, and whether filters are applied, computed for one zero-match search

Each alternative keeps every other input as entered. Nearby-date counts use the
current gathering kind, location, radius and filter set, and a date with a count of 0
is omitted (L2-011). The wider-radius button names the smallest wider radius that has
matches and its count. "Show all styles" appears only when a filter is applied.

## Description

The slice adds the sold-out panel to the Discover lineup region and an alternatives
endpoint to the Zamaro API. The main search stays unchanged, so its response time
target of a 500 ms 95th percentile (L2-085) is not spent on alternatives that most
searches never need.

**Frontend (Zamaro Web, `pages/discover`; locations per ADR-0007)**

- **`SoldOut`** (`pages/discover/sold-out`) — the lineup area's sold-out panel, built from the
  library's `zm-empty-state` and `zm-date-swap`. It shows the "Sold out" stamp, the headline
  "Nobody's free {date description} within {radius} km", the explanation sentence, the
  nearby dates with their counts, the "Search within {radius} km · {n} free" button and, when
  filters are applied, the "Show all styles" button. Its `pickDate()`, `widen()` and
  `showAllStyles()` each change one part of the search through `SearchStore.navigate()`.
- **`SearchStore`** (extended) — when a search returns a total of 0, it calls
  `DiscoveryApi.alternatives()` with the same criteria and stores the result in an
  `alternatives` signal. `navigate()` writes the changed search to the address bar through
  the search query codec. The URL change re-runs the search, so the date field and the
  poster headline follow the new date (L2-011).
- **`DiscoveryApi`** (extended) — adds `alternatives(query)` for
  `GET /api/v1/search/alternatives`.
- **`FormatService.dateDescription()`** — turns a date into its date description through
  the translation catalogue. The named days are the catalogue keys
  `common.namedDay.{MM-DD}`:
  - Christmas Eve (12-24)
  - Christmas Day (12-25)
  - New Year's Eve (12-31)
  - New Year's Day (01-01)

  Every other date uses the short date.

**Backend (Zamaro API)**

- **`SearchAlternativesController`** — invokable controller for
  `GET /api/v1/search/alternatives`, behind the same search rate limiter (L2-077). It
  reuses `SearchArtistsRequest` for validation, ignoring the cursor.
- **`FindSearchAlternatives`** — action that computes the alternatives in one pass.
  1. `CandidateFinder::measured()` loads the filtered candidates inside the bounding box of
     the largest wider radius, or of the current radius when no wider one exists, and
     measures each one once with `DistanceService`. Distance does not depend on the date, so
     the measurements serve every date and radius below.
  2. It walks the dates from 1 to 7 days either side of the searched date, closest first and
     the earlier of two dates the same number of days away first. Dates outside the bookable
     window of 3 days to 18 months from today are skipped (L2-004).
  3. For each date it asks `AvailabilityService::freeArtistIds()` which candidates are free
     and counts those that pass the travel match at the current radius
     (`CandidateFinder::travels()`). It keeps dates with a count above 0 and stops at 3.
  5. For each wider radius in ascending order it counts candidates that pass the
     travel match on the searched date, and returns the first radius with a count above 0.
- **`AvailabilityService`** — unchanged: `freeArtistIds(ids, date, kind)` reads rules,
  overrides, Confirmed bookings and, for Youth events, VSC records for one date, and the action
  calls it once per date, at most 14 times.
- **Explanation sentence** — built by `SoldOut` from catalogue templates; there is no
  `SoldOutExplainer` class. It uses the gathering kind, the filter set, the location label
  and the best alternative, as in "Every gospel choir near Burlington is booked for Christmas Eve. Try a nearby
  date, or widen the radius: 2 choirs are free within 120 km."
  - **Built on the frontend:** in M1 the API returns only the structured
    `{nearbyDates:[{date,count}], widerRadius:{km,count}|null, filtersApplied}`. The sold-out
    panel (`pages/discover/sold-out`) builds the sentence from catalogue templates, so the API
    returns no prose and a new locale needs no code.
  - **Why:** `discover.soldOut.whyStyle` when exactly one style chip is pressed ("Every
    gospel choir near …"); `whyAnyone` otherwise.
  - **Next step:** `nextBoth`, `nextDates`, `nextRadius` or `nextNone`, depending on which ways
    forward exist.
  - **Counts:** `who` and `dateCount` count in the pressed style's noun ("2 choirs") or
    "artists".
  - **ICU:** `select` keys cannot contain hyphens in `@messageformat`, so styles are passed as
    `gospel_choir` and the like.
  - **Fixtures:** `CastSeeder::christmasChoirs()` holds the mock's fixtures. Each choir is free
    only on its listed dates.
- **Response** — `SearchAlternativesController` returns
  `{"data":{"nearbyDates":[{date,count}],"widerRadius":{km,count}|null,"filtersApplied":bool}}`
  straight from the `SearchAlternatives` value object; there is no resource class and no
  `explanation`.

**Mocks**

- [Discover · empty](../../../mocks/pages/discover/empty.html) — "Nobody's free
  Christmas Eve within 40 km" for gospel choirs near Burlington: Wed 23 Dec, Sun 27 Dec
  and Sun 20 Dec closest first, "Search within 120 km · 2 free" and "Show all styles".

**Data**

The action reads the same tables as the search: `artists`, `artist_styles`,
`availability_rules`, `availability_overrides`, `bookings` (status `Confirmed`) and
`vulnerable_sector_checks`. Distances come from the Redis distance cache.

## Requirements

The feature realises the following level-2 (L2) requirement. It refines the level-1
(L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-011` | `L1-002` | **No results.** When nobody matches, the lineup area shows a "Sold out" state with ways forward.<br>Acceptance criteria:<br>1. Given zero matches, when results return, then the state reads "Nobody's free {date description} within {radius} km" with a sentence explaining why.<br>2. Given zero matches, when results return, then up to 3 nearby dates within 7 days either side are listed, closest first, each with the count of artists free that day under the current filters, and dates with a count of 0 are omitted.<br>3. Given a wider radius option would return results, when results return, then a button "Search within {radius} km · {n} free" is shown for the smallest wider radius that has matches.<br>4. Given filters are applied, when results return, then a "Show all styles" button clears the filters and re-runs the search.<br>5. Given a nearby date is activated, when the search re-runs, then the date field and poster headline update to that date. |

## Diagrams

### System context

Guests and bookers who find nobody free receive alternatives from Zamaro. The
routing provider supplies any distances not yet cached.

![C4 system context for suggesting alternatives when sold out](diagrams/c4-context.png)

### Containers

Zamaro Web calls the alternatives endpoint only after a zero-match search. The
Zamaro API reads availability for 15 dates from the database and distances from Redis.

![C4 container view for suggesting alternatives when sold out](diagrams/c4-container.png)

### Components

`FindSearchAlternatives` measures distances once through `CandidateFinder` and
`DistanceService`, and asks `AvailabilityService` about each date in the range. `SoldOut`
then words the explanation on the frontend.

![C4 component view for suggesting alternatives when sold out](diagrams/c4-component.png)

### Class structure

`SearchAlternatives` holds up to 3 nearby dates (date and count), an optional wider
radius (km and count) and whether filters applied. On the frontend, `SoldOut` renders it
and `SearchStore.navigate()` turns each choice into a new search state.

![Class diagram for suggesting alternatives when sold out](diagrams/class-structure.png)

### Behaviour — show the sold-out state

A zero total triggers the alternatives request. The action counts free,
travel-matched artists for each nearby date and each wider radius, and the panel
lists only non-zero options.

![Sequence diagram for showing the sold-out state](diagrams/sequence-show-sold-out.png)

### Behaviour — take an alternative

Each way forward changes one input and navigates. The URL change re-runs the
search, so the date field, poster headline and lineup all follow.

![Sequence diagram for taking an alternative](diagrams/sequence-take-alternative.png)
