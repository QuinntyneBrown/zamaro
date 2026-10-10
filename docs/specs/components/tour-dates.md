# Tour dates

| Field | Value |
|---|---|
| Selector | `zm-tour-dates` |
| Library path | `frontend/projects/components/src/lib/tour-dates/` |
| Status | planned |
| Traces to | L2-017, L2-019, L2-054, L2-056, L2-067, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`tour-dates.html`](../../design-system/components/tour-dates.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/booked-date`](../../mocks/pages/artist/booked-date.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/loading`](../../mocks/pages/dashboard/loading.html), [`pages/availability/default`](../../mocks/pages/availability/default.html), [`pages/request-detail/default`](../../mocks/pages/request-detail/default.html), [`pages/admin-artist/default`](../../mocks/pages/admin-artist/default.html), [`pages/booking-detail/declined`](../../mocks/pages/booking-detail/declined.html), [`pages/booking-detail/artist-cancelled`](../../mocks/pages/booking-detail/artist-cancelled.html), [`dialogs/suspend-artist/busy`](../../mocks/dialogs/suspend-artist/busy.html), [`dialogs/reinstate-artist/busy`](../../mocks/dialogs/reinstate-artist/busy.html) |
| Rendering | [`tour-dates.html`](tour-dates.html) |

## Purpose and scope

Tour dates list days the way a gig poster lists its dates: a day stamp, a short
note and a status. On an artist's public profile they are "Upcoming dates": the
next six free or booked days from the booker's date, with the booker's own date
stamped yellow and a small "Pick" button on every other free day that moves the
booking to it (L2-017). The same rows serve private schedules (the artist's
"Coming up" and "In November", a request's "That weekend", the admin's
"Upcoming bookings"), where each row names the church, and the "Other artists
free that night" list after a declined or cancelled booking.

It is a short list, not a calendar. For choosing any date, use the
[date picker](date-picker.md); for a month, the [calendar](calendar.md).

Out of scope:

- Choosing the six days, skipping unavailable days and starting from the search
  date or 3 days from today (L2-017). The API returns the rows.
- What a pick does: updating the booking stub, the "Book for Fri 20 Nov" label,
  the status message "Date changed to Fri 20 Nov", moving focus to the stub's
  date field, and the "was just booked" inline message. The page and the
  [booking form](booking-form.md) own them.
- The section heading ("Upcoming dates") and its note ("Pick a free date to book
  it instead."). The page labels the list with the heading.
- Empty and error states. The page shows an [empty state](empty-state.md) or a
  compact [alert](alert.md) in place of the list.
- The trailing status stamp of a private row ([status stamp](stamp.md)) and
  any link or button in it; the consumer projects them.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default` "Upcoming dates" | `public`; row 1 `current` free; booked row; four free rows | notes "Your date", "Sunday service, Oakville", "Open all day"; badges; "Pick" named "Pick Tue 17 Nov" | current, free, booked, Pick default/hover/focus/busy | canvas, beside the sticky stub |
| `pages/artist/booked-date` | `public`, current row booked | "Your date · Worship night, Scarborough", "Booked" | current booked | canvas |
| `pages/artist/empty` | `public`, no search date (no current row), six free rows | "Open all day", Pick | free | canvas |
| `pages/profile-preview/*` | `public`, `pickDisabled` | Pick disabled | disabled | canvas |
| Dialogs over the profile (`dialogs/photo-viewer`, `dialogs/report-review`, `notifications/share-toast`) | `public` | as the profile | inert | canvas |
| `pages/dashboard/default` "Coming up" | `schedule`, no trail | "Living Waters Fellowship" / "Sunday service, Brampton" | default | panel |
| `pages/dashboard/loading` | `loading` | — | loading | panel |
| `pages/availability/default` "In November", `dialogs/block-dates`, `dialogs/calendar-feed`, `dialogs/weekly-default` | `schedule`; title linked for requested days | stamp "Confirmed" / "Requested"; neutral badge "Unavailable" for "Studio · Through Fri 27 Nov" | default | canvas |
| `pages/request-detail/*` "That weekend", `dialogs/accept-request`, `dialogs/decline-request` | `schedule`; first row empty trail | "Riverside, Burlington" / "This request", "Free again", "Played", "Withdrawn by Riverside"; stamp "Confirmed" | default | canvas, dialog |
| `pages/admin-artist/default` "Upcoming bookings", `dialogs/suspend-artist`, `dialogs/reinstate-artist` | `schedule` | "ZAM-0097 · Riverside Community Church" / "Burlington · Sunday service"; stamps; sm primary "Resolve" named "Resolve ZAM-0097" | default | panel, dialog |
| `pages/booking-detail/declined`, `artist-cancelled` "Other artists free that night" | `schedule`, day column "From" over "$1,800", custom body | artist name link + "Band · Mississauga, 32 km · ★ 4.8"; Free badge | default | canvas |

## Anatomy

1. **List** — `<ul class="tour-dates" role="list">`.
2. **Row** — `<li>`: three-column grid (6.5 rem · flexible · auto),
   `--space-4` block padding and gap, hairline below. `aria-current="date"` on
   the booker's date.
3. **Day stamp** — `.tour-dates__day`: a `<small>` overline ("Sat", or "From")
   over the figure ("14 Nov", or "$1,800"). Yellow with ink text on the current
   row.
4. **Body** — the middle column.
   - Public: `<span class="cluster">` holding the Free badge (free rows that are
     not current) and `.tour-dates__note`.
   - Schedule: `<span>` holding `<strong>` (the title, optionally a link), a
     `<br>` and `.tour-dates__note`.
   - Custom: the consumer's body template.
5. **Note** — `.tour-dates__note`: muted `--text-body-sm`.
6. **Trail** — the third column, always rendered (`<span>`, empty when there is
   nothing).
   - Public: a Free or Booked [badge](badge.md) on current and booked rows, the
     Pick button on other free rows.
   - Schedule: the consumer's trail template (stamp, badge, button) or nothing.
7. **Pick** — `zm-button`, secondary, `size="sm"`, visible text "Pick", named
   "Pick {date}".

Host: `zm-tour-dates` is `display: block` and renders the `<ul>`; the page owns
the section and heading.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `dates` | `readonly TourDate[]` | — | yes | In date order. See `TourDate` below. Tracked by `id`. |
| `variant` | `'public' \| 'schedule'` | `'public'` | no | Public: cluster body and built-in status trail. Schedule: title and note body, trail from the template. |
| `labelledBy` | `string` | — | no | `aria-labelledby` on the `<ul>`. |
| `label` | `string` | — | no | `aria-label` when there is no heading; ignored with `labelledBy`. |
| `freeText` | `string` | `''` | with `public` | "Free". |
| `bookedText` | `string` | `''` | with `public` | "Booked". |
| `pickText` | `string` | `''` | with `public` | "Pick". |
| `pickingId` | `string \| null` | `null` | no | The row whose Pick is busy (`aria-busy`, spinner) while the stub checks the date. Other Picks stay enabled. |
| `pickDisabled` | `boolean` (attribute) | `false` | no | Disables every Pick (profile preview, L2-054). |
| `loading` | `boolean` (attribute) | `false` | no | Renders `loadingCount` skeleton rows. |
| `loadingCount` | `number` | `4` | no | Skeleton rows while loading. |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden "Loading dates". |

`TourDate`:

| Field | Type | Rule |
|---|---|---|
| `id` | `string` | ISO date (`2026-11-20`) or booking number; emitted by `picked`. |
| `dayLabel` | `string` | The `<small>` line: weekday "Fri", or "From". |
| `dayValue` | `string` | The figure: "20 Nov", or "$1,800". Formatted by the API library's formatting service. |
| `current` | `boolean?` | Adds `aria-current="date"`. At most one row. |
| `status` | `'free' \| 'booked' \| null?` | Public only: drives the badge and Pick. |
| `note` | `string?` | "Open all day", "Your date", "Sunday service, Oakville". Omitted renders no note. |
| `title` | `string?` | Schedule only: the bold first line, "Harvest Point Church". |
| `titleLink` | `string \| unknown[]?` | Schedule only: makes the title a `routerLink`. |
| `pickLabel` | `string?` | Public free rows: the Pick's accessible name, "Pick Fri 20 Nov". Required when the row shows Pick. |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `picked` | `string` (the row's `id`) | A Pick is activated. Not emitted while that row is busy or Picks are disabled. |

### Content templates

| Template | Context | Rule |
|---|---|---|
| `<ng-template zmTourDateBody let-date>` | `TourDate` | Replaces the body for every row (alternative artists: a name link and a note with an inline [rating](rating.md)). Rendered inside `<span class="stack stack--sm">`. |
| `<ng-template zmTourDateTrail let-date>` | `TourDate` | Schedule trail per row: a `zm-stamp`, `zm-badge` or a small `zm-button-link`. Rendered inside the trail `<span>`. Ignored in `public`. |

Each template is queried once with `contentChild`; there is no `ng-content`.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Public | — | The artist profile and its preview: free and booked days, Pick. Booked rows name the gathering and town, never the church (L2-017, L2-083). |
| Schedule | `.tour-dates--schedule` | Private views (artist dashboard, availability, request detail, admin): the church named in bold, a status stamp or badge, or nothing. |

The variant changes the body and trail markup; schedule also adds
`.tour-dates--schedule` for its phone layout (see Responsive behaviour). One size; Pick is always `size="sm"` and the row gives it a
44 px-plus target.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Free | `status: 'free'`, not current | Free badge beside the note; Pick in the trail | "Fri 20 Nov Free Open all day, Pick Fri 20 Nov, button" |
| Booked | `status: 'booked'` | Note "Sunday service, Oakville"; Booked badge (muted, struck) in the trail; no Pick | "Booked" read as a word |
| Current, free | `current` + free | Yellow day stamp (`--color-accent`, `--color-fg-on-accent`), note "Your date", Free badge in the trail, no Pick | "current date" |
| Current, booked | `current` + booked | Yellow stamp, note "Your date · Worship night, Scarborough", Booked badge | "current date" |
| Picking | `pickingId === id` | That Pick busy: spinner, `aria-busy`, `aria-disabled` | Busy; focus kept |
| Pick hover / focus | button states | As [button](button.md) secondary sm | — |
| Picks disabled | `pickDisabled` | Every Pick disabled | Out of the Tab order |
| Schedule row | `variant="schedule"` | Bold title over the note; trail template or empty | Title, note, then trail text |
| Loading | `loading` | `loadingCount` rows: day `zm-skeleton` `text short` + `title long`; body `text` + `text medium`; empty trail | `loadingLabel` visually hidden; skeletons hidden |
| Inert | page `inert` behind a dialog | — | Not reachable |

## Markup

Public, rendered by `zm-tour-dates`:

```html
<ul class="tour-dates" role="list" aria-labelledby="dates-title">
  <li aria-current="date"><span class="tour-dates__day"><small>Sat</small>14 Nov</span><span class="cluster"><span class="tour-dates__note">Your date</span></span><zm-badge variant="free"><span class="badge badge--free">Free</span></zm-badge></li>
  <li><span class="tour-dates__day"><small>Sun</small>15 Nov</span><span class="cluster"><span class="tour-dates__note">Sunday service, Oakville</span></span><zm-badge variant="booked"><span class="badge badge--booked">Booked</span></zm-badge></li>
  <li><span class="tour-dates__day"><small>Fri</small>20 Nov</span><span class="cluster"><zm-badge variant="free"><span class="badge badge--free">Free</span></zm-badge><span class="tour-dates__note">Open all day</span></span><zm-button size="sm"><button class="btn btn--sm" type="button" aria-label="Pick Fri 20 Nov">Pick</button></zm-button></li>
</ul>
```

Schedule:

```html
<ul class="tour-dates" role="list" aria-labelledby="month-title">
  <li><span class="tour-dates__day"><small>Sun</small>1 Nov</span><span><strong>Harvest Point Church</strong><br><span class="tour-dates__note">Sunday service, Milton</span></span><span><zm-stamp class="stamp stamp--confirmed">Confirmed</zm-stamp></span></li>
  <li><span class="tour-dates__day"><small>Sat</small>14 Nov</span><span><strong><a href="/artist/requests/ZAM-0114">Riverside Community Church</a></strong><br><span class="tour-dates__note">Requested · 1 · Worship night · reply by Mon 12 Oct</span></span><span>…</span></li>
  <li><span class="tour-dates__day"><small>Sun</small>18 Oct</span><span><strong>Living Waters Fellowship</strong><br><span class="tour-dates__note">Sunday service, Brampton</span></span><span></span></li>
</ul>
```

Custom body (alternative artists):

```html
<li><span class="tour-dates__day"><small>From</small>$1,800</span><span class="stack stack--sm"><a href="/artists/hosanna-collective?date=2026-11-14">Hosanna Collective</a><span class="tour-dates__note">Band · Mississauga, 32 km · <zm-rating>…★ 4.8…</zm-rating></span></span><span><zm-badge variant="free">…Free…</zm-badge></span></li>
```

Consumer templates:

```html
<zm-tour-dates labelledBy="dates-title" [dates]="dates()" [freeText]="'dates.free' | transloco" [bookedText]="'dates.booked' | transloco"
  [pickText]="'dates.pick' | transloco" [pickingId]="picking()" (picked)="stub.pickDate($event)" />

<zm-tour-dates variant="schedule" labelledBy="open-title" [dates]="bookings()">
  <ng-template zmTourDateTrail let-row><zm-stamp [status]="row.bookingStatus">{{ 'booking.status.' + row.bookingStatus | transloco }}</zm-stamp></ng-template>
</zm-tour-dates>
```

The `.tour-dates` classes, `aria-current="date"` and the Pick names are the
contract: e2e page objects find the booker's date by `aria-current` and pick a
day by the button named "Pick Fri 20 Nov".

## Design

- `.tour-dates`: no list style or padding.
- Row: `grid-template-columns: 6.5rem minmax(0, 1fr) auto`, `align-items:
  center`, gap `--space-4`, `padding-block: --space-4`, bottom rule
  `--border-width-hairline` `--color-border-default`.
- Day: `--text-figure`, `--line-height-tight`, uppercase, `white-space: nowrap`;
  `<small>` `display: block`, `--text-overline`, `--letter-spacing-wide`,
  `--color-fg-muted`.
- Current day: `background: --color-accent`, `color: --color-fg-on-accent`
  (both lines), padding `--space-1`.
- Note `--text-body-sm`, `--color-fg-muted`. Schedule title `--text-label`
  weight via `<strong>`.
- Pick: `zm-button` secondary sm (`--control-height-sm`).
- No motion: moving the current date is instant; rows never slide.

No component tokens; badges and buttons bring theirs.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Date figure, title | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Weekday, note | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Current stamp fill / text | `--color-accent` / `--color-fg-on-accent` | `--palette-signal-500` / `--palette-ink-750` | `--palette-signal-500` / `--palette-ink-750` |
| Row rule | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Pick rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Date on the page |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Weekday and note |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Note in a panel |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Current day stamp |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Pick rule |
| `--color-accent` | `--color-bg-canvas` | 3:1 | Current stamp edge in dark |

## Responsive behaviour

- **Schedule below SM (< 576 px)**: a row with trail content becomes two
  columns, `6.5rem minmax(0, 1fr)`, with grid areas `day body` / `day trail`; the
  stamp, badge or button sits under the body, aligned to its start, with
  `--space-2` above it. From SM the trail returns to the third column. Empty
  trails take no row.
- The three-column row works from 320 px for the public variant: the day column is fixed at 6.5 rem,
  the trail is as wide as its badge or button, and the body takes the rest.
- On free rows the badge sits in the body cluster, which wraps the note under
  the badge on phones instead of squeezing the date.
- Pick never wraps or truncates; notes wrap. Notes stay under about 35
  characters so a row is two lines at 360 px.
- On desktop the list sits in the profile's main column beside the sticky stub,
  so a pick updates the stub without scrolling.
- Pick is 36 px tall inside a row with `--space-4` above and below; under a
  coarse pointer it grows to `--target-comfortable` (44 px), and neighbouring
  Picks are at least 32 px apart.
- At 200 % zoom rows grow taller and every Pick stays reachable.

## Accessibility

### Role and pattern

A native `<ul role="list">` of days labelled by its heading. The booker's date
carries `aria-current="date"`. Pick is an APG Button. Not a grid: no arrow-key
navigation.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves between Pick buttons (and schedule title links and trail buttons), top to bottom. Current and booked public rows have no stop. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On Pick: emits `picked`. |

### Focus

The shared ring on Pick. While picking, focus stays on the busy Pick. When the
page then makes that row current, its Pick disappears and the page moves focus
to the booking stub's date field, so focus never drops to `<body>`.

### Labelling

- Each Pick is named "Pick {date}": the visible word first (WCAG 2.5.3).
- Rows read weekday, date, note and status: "Sat 14 Nov Your date Free, current
  date".
- Badge words carry the status; the yellow stamp and the strike are extras.

### Announcements

None. The page's status region says "Date changed to Fri 20 Nov" after a pick.

### Motion

The Pick's own hover lift and busy spinner follow the button and stop under
`prefers-reduced-motion`. Nothing else moves.

## Content and internationalisation

- Weekday as three letters over the date, no year: "Sat" over "14 Nov"
  (L2-110).
- The booker's date says "Your date", then what is happening if it is booked:
  "Your date · Worship night, Scarborough" (L2-017).
- Free rows read "Open all day" with a Free badge ("Free · Open all day",
  L2-017).
- Public booked notes name the kind of gathering and the town only, "Sunday
  service, Oakville", never the church or address (L2-017, L2-083). Private
  schedule rows name the church.
- The button is always "Pick", its name "Pick {date}".
- All copy arrives translated through the inputs (L2-111); dates and money
  formatted by the API library's formatting service (L2-110).

## Performance

- Change detection: `OnPush`, signal inputs, `@for … track date.id`; the row
  kind (current, free, booked) from a `computed` map. No `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/TourDates.ts`
  renders Abigail Mensah's six upcoming dates from Sat 14 Nov (current free,
  booked Sun 15 Nov, four free with Pick). Add `TourDatesSchedule.ts`, which
  renders her "In November" schedule with stamps. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Layout stability: loading rows keep the three-column grid and a two-line
  height, so the swap does not shift the page (L2-105). Becoming busy never
  changes the Pick's width.
- Imports: Angular core, `RouterLink`, `NgTemplateOutlet`, `zm-badge`,
  `zm-button`, `zm-skeleton`.

## Acceptance criteria

### Rendering

- **AC-1** Given a Confirmed booking on Sun 15 Nov for a Sunday service in Oakville, when Abigail Mensah's public list renders, then that row shows the note "Sunday service, Oakville" and a "Booked" badge, and nowhere names Lakeshore Alliance Church or its address. (L2-017)
- **AC-2** Given a free Fri 20 Nov, when the public list renders, then that row shows a Free badge beside "Open all day" and a "Pick" button named "Pick Fri 20 Nov". (L2-017)
- **AC-3** Given the search date Sat 14 Nov, when the list renders, then that row has `aria-current="date"`, a yellow day stamp, the note "Your date", a Free badge in the trail and no Pick. (L2-017)
- **AC-4** Given Grace Tabernacle Mass Choir booked on the booker's date Thu 24 Dec, when the list renders, then the current row reads "Your date · Worship night, Scarborough" with a Booked badge and no Pick. (L2-017)
- **AC-5** Given the profile opened with no search date, when the list renders, then no row has `aria-current`. (L2-017)
- **AC-6** Given the profile preview with `pickDisabled`, when Abigail views it, then every Pick is disabled and Tab skips them. (L2-054)
- **AC-7** Given `variant="schedule"` for Abigail's November, when it renders, then each row shows the church in bold over the note ("Harvest Point Church" / "Sunday service, Milton") and the trail template's stamp, and "Studio · Through Fri 27 Nov" shows a neutral "Unavailable" badge. (L2-056)
- **AC-8** Given the admin "Upcoming bookings" for Marcus Bell Trio, when it renders, then the rows read "ZAM-0097 · Riverside Community Church", "ZAM-0109 · St. Brendan's Anglican" and "ZAM-0112 · Lakeshore Alliance Church" with their stamps, and a trail "Resolve" button named "Resolve ZAM-0097" when suspending. (L2-067)
- **AC-9** Given a schedule row with no trail template content, when it renders, then the trail `<span>` exists and is empty, and the body keeps its width. (L2-056)

### Picking

- **AC-10** Given Naomi activates "Pick Fri 20 Nov", when the event fires, then `picked` emits `'2026-11-20'` once. (L2-017)
- **AC-11** Given `pickingId` is `'2026-11-20'`, when the row renders, then its Pick has `aria-busy="true"` and `aria-disabled="true"`, keeps focus, and a second press emits nothing. (L2-101)
- **AC-12** Given the page then makes Fri 20 Nov current, when the list re-renders, then that row shows "Your date" with no Pick, Sat 14 Nov gets a Pick named "Pick Sat 14 Nov", and the booking stub reads "Book for Fri 20 Nov". (L2-019)

### States

- **AC-13** Given `loading` with `loadingLabel` "Loading dates", when it renders, then four skeleton rows hold the three-column grid, the skeletons are `aria-hidden` and "Loading dates" is visually hidden text. (L2-105)
- **AC-14** Given the dates load, when they replace the skeletons, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Keyboard and focus

- **AC-15** Given Abigail's public list, when Naomi tabs through it, then focus visits the four Picks top to bottom, skips the current and booked rows, and each Pick shows the two-tone ring. (L2-101)

### Screen readers

- **AC-16** Given the current row, when a screen reader reads it, then it announces "Sat 14 Nov Your date Free" and "current date". (L2-102)
- **AC-17** Given the buttons are listed by a screen reader, when the list renders, then the four Picks are "Pick Tue 17 Nov", "Pick Wed 18 Nov", "Pick Thu 19 Nov" and "Pick Fri 20 Nov", each beginning with the visible "Pick". (L2-100)
- **AC-18** Given the public and schedule lists in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme, when the public list renders, then the current stamp stays `--color-accent` with `--color-fg-on-accent` text and the Pick is a `--color-bg-surface` charcoal with a light outline. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then dates are at least 4.5:1, weekdays and notes at least 4.5:1, the current stamp at least 4.5:1 and the Pick rule at least 3:1. (L2-103)

### Responsive

- **AC-21** Given a 320 px viewport, when Abigail's list renders, then the day column is 6.5 rem, the note wraps under the Free badge, Pick stays on one line, and the page does not scroll horizontally. (L2-096)
- **AC-22** Given a coarse pointer, when a Pick is measured, then its target is at least 44 × 44 CSS px and neighbouring Picks are at least 32 px apart. (L2-096)
- **AC-23** Given a 360 px viewport and Abigail's "In November" schedule, when the Sat 14 Nov row renders with a "Requested" stamp, then the stamp sits under the body, "Riverside Community Church" wraps at word boundaries in a body column at least 12 rem wide, and from 576 px the stamp returns to the third column. (L2-096)

### Content and formatting

- **AC-24** Given the alternatives after a declined booking, when the custom body renders Hosanna Collective, then the day column reads "From" over "$1,800" and the body is the artist link with "Band · Mississauga, 32 km · ★ 4.8". (L2-110)
- **AC-25** Given the French catalogue, when "Pick", "Free", "Booked" and the notes are about 30 % longer, then they come from the inputs with no code change and nothing clips at 360 px. (L2-111)

### Performance

- **AC-26** Given the `TourDates` and `TourDatesSchedule` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build it as:

- Folder `frontend/projects/components/src/lib/tour-dates/`: `tour-dates.ts`
  (`TourDates`, selector `zm-tour-dates`) and `tour-date-templates.ts` with the
  `TourDateBody` (`ng-template[zmTourDateBody]`) and `TourDateTrail`
  (`ng-template[zmTourDateTrail]`) directives; export the `TourDate` type.
- Add `.tour-dates--schedule` with the phone grid areas (D-7); it is not in
  `components.css` yet.
- Move the `.tour-dates*` rules, `li[aria-current="date"]` and
  `.tour-dates__day { white-space: nowrap }` from `components.css` into the
  component stylesheet.
- Composes `zm-badge` (free, booked), `zm-button` (secondary, sm, `label`,
  `busy`, `disabled`) and `zm-skeleton`; the trail template composes
  `zm-stamp`, `zm-badge` or `zm-button-link`.
- Dev-mode console error when a public free row lacks `pickLabel`, or when more
  than one row is `current`.
- Add the `TourDates` and `TourDatesSchedule` scenarios and export them from
  `scenarios/index.ts`.

## Decisions

- **D-1** *One component for the public list and the private schedules?* Yes, with `variant`. The design system documents both as tour dates with the same `.tour-dates` row; only the body and trail differ.
- **D-2** *Rows as data or projected `<li>`s?* Data with two optional templates. A component cannot be the `<li>` (element selectors only, `eslint.config.js`), and an extra host between `<ul>` and `<li>` breaks list semantics; the setlist and menu already render their rows from data.
- **D-3** *Does the component update the current row after a pick?* No. It emits `picked` and shows `pickingId` as busy; the page confirms the date with the stub, then passes new `dates`. That keeps a date that was "just booked" from ever looking picked.
- **D-4** *Is a busy Pick the only busy one?* Yes. Other Picks stay enabled; activating another while one is busy is the page's call (it may cancel the first check). The design system shows a single busy Pick.
- **D-5** *Where do the "other artists free that night" rows fit?* The custom body template. The design system lists them as a source of tour dates with the price in the day column, and a template avoids a third variant for one screen.
- **D-6** *How many loading rows?* Four by default, as the design system says; `pages/dashboard/loading` uses the same row shape, and `loadingCount` covers panels that show fewer.
- **D-7** *What happens to a schedule row on a phone?* The trail drops under the body below SM. The 360 px rendering shows a stamp such as "Requested" leaving the body about 4 rem, so "Riverside Community Church" breaks one word per line and the note runs to seven lines, against the design system's two-line rule. The public variant is unaffected because its trail is a short badge or Pick. The design-system page should catch up with `.tour-dates--schedule`.
