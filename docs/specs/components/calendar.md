# Calendar

| Field | Value |
|---|---|
| Selector | `zm-calendar` |
| Library path | `frontend/projects/components/src/lib/calendar/` |
| Status | planned |
| Traces to | L2-056, L2-057, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`calendar.html`](../../design-system/components/calendar.html) |
| Source mocks | [`pages/availability/default`](../../mocks/pages/availability/default.html), [`pages/availability/selected`](../../mocks/pages/availability/selected.html), [`pages/availability/loading`](../../mocks/pages/availability/loading.html), [`pages/availability/empty`](../../mocks/pages/availability/empty.html), [`dialogs/block-dates/default`](../../mocks/dialogs/block-dates/default.html), [`dialogs/weekly-default/default`](../../mocks/dialogs/weekly-default/default.html), [`dialogs/calendar-feed/default`](../../mocks/dialogs/calendar-feed/default.html), [`notifications/availability-toast/info`](../../mocks/notifications/availability-toast/info.html), and every other screen in Usage |
| Rendering | [`calendar.html`](calendar.html) |

## Purpose and scope

The calendar is the artist's tour-dates sheet at `/artist/calendar`: one month
at a time across the next 18 months, each day marked Free, Unavailable,
Requested (with a count) or Booked (L2-056). The artist selects Free,
Unavailable and Requested days and changes them together from the page's bulk
bar. Booked days stay visible and say why they cannot change (L2-057). One
rendered month is the "availability calendar month" perf-test composite
(AGENTS.md).

`zm-calendar` is presentational. It renders the month it is given, reports
selection, month changes and day activations, and owns the grid's keyboard
model. It never loads or saves availability.

Use something else when:

- one date is chosen in a form (the event date, the start and end of a blocked
  range in `dialogs/block-dates`) → [date picker](date-picker.md);
- the artist's next dates are listed read-only, as on the profile or the "In
  November" list under the calendar → [tour dates](tour-dates.md).

Out of scope:

- The bulk bar (`.bulk-bar`, `.bulk-bar--sticky`), its count "2 days selected ·
  Sat 28 – Sun 29 Nov" and its "Mark unavailable", "Mark free" and "Clear"
  actions. The page renders it after the calendar from the `selected` dates; the
  bar is specified with the [table](table.md).
- Loading, saving and undoing availability, the L2-057 warning about open
  requests, and the toasts shown when a day is activated. The page and the
  [dialog](dialog.md) and [toast](toast.md) components own them.
- Building the copy: the month heading, the day labels ("Sat 14 Nov, Requested ·
  1, Riverside Community Church"), the arrow labels and the event lines arrive
  formatted and translated (L2-110, L2-111).
- The page heading, the weekly-default line, the error alert that replaces the
  calendar ([alert](alert.md)) and the empty-state panel above it
  ([empty state](empty-state.md)).
- Making the calendar inert behind an open dialog. The CDK dialog does that to
  the page.

## Usage

The mocks render the calendar on 22 screens, always Abigail Mensah's November
2026 except the empty state. Each row is one distinct configuration; the API
below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/availability/default` | `month` "2026-11", heading "November 2026" (`h2`), label "Calendar, next 18 months", 30 days: booked 1, 15, 21 Nov ("Harvest Point", "Lakeshore", "Kingdom Life"); unavailable every Monday ("Weekly") and 26–27 Nov ("Studio"); requested 14 and 22 Nov ("Requested · 1"); the rest Free; 5 outside days 1–5 Dec | note slot: "Your calendar runs 18 months ahead, to Sun 9 Apr 2028, the last date churches can ask for." | default; roving stop on Tue 3 Nov (first Free day) | canvas |
| `pages/availability/selected` | as default, `selected` 28 and 29 Nov | note slot; the page's sticky bulk bar follows the calendar | selected; roving stop on Sat 28 Nov | canvas |
| `pages/availability/loading` | `loading`, `month` "2026-11", heading, arrows and legend rendered | note slot | loading: in-month days are `skeleton--day` blocks, outside days kept, grid `aria-hidden`; `main` has `aria-busy="true"` | canvas |
| `pages/availability/empty` | Miriam Haile's month: every day Free, no event lines | note slot; the page's empty panel "Every date is Free" sits above | default (all Free) | canvas |
| `pages/availability/error` | not rendered: the page shows the "We couldn't load your calendar" alert instead | — | — | — |
| `dialogs/block-dates/*` (default, busy, invalid, failed, warning) | as default but 26–27 Nov Free (before they are marked) | note slot | inert behind the dialog | canvas |
| `dialogs/weekly-default/*`, `dialogs/calendar-feed/*` (8 screens) | as default | note slot | inert behind the dialog | canvas |
| `notifications/availability-toast/info` | as default; activating Sun 15 Nov (Booked) emitted `dayActivate`, the page shows "Sun 15 Nov is Booked" | note slot | booked day activated, selection unchanged | canvas, toast above |
| `notifications/availability-toast/with-action` | as default; activating Sat 14 Nov (Requested) emitted `dayActivate`, the page shows "Sat 14 Nov · Requested · 1" with "Open request" | note slot | requested day activated | canvas |
| `notifications/availability-toast/success`, `danger` | after (or failing) the save of 26–27 Nov: "Studio" days, or still Free | note slot | days re-rendered with new statuses | canvas |
| `notifications/availability-toast/warning` | 19–20 Nov now Unavailable ("Family"), 21 Nov still Booked | note slot | days re-rendered | canvas |
| Design system only | October 2026 with today Fri 9 Oct: past days 1–8 Oct, today underlined; a selected Free day | — | past, today, selected | surface |
| Cast, December 2026 and April 2028 | requested 5 Dec, booked 13 and 20 Dec, unavailable 24–26 Dec ("Family") and 31 Dec; April 2028 ends the window on Sun 9 Apr | — | first month (Previous disabled), last month (Next disabled, days after 9 Apr outside) | canvas |

## Anatomy

1. **Frame** — `<section class="calendar">` labelled by `label`. Head, grid and
   note, `--space-4` apart.
2. **Head** — `.calendar__head`: the month heading `.calendar__month`, then a
   `.cluster` with the Previous and Next `zm-button`s (secondary, icon-only) and
   the legend.
3. **Legend** — `ul.calendar__legend` labelled "Legend": one `li` per status
   with a `.calendar__swatch` (`data-status` as a day) and the status word, in
   the order Free, Requested, Booked, Unavailable.
4. **Grid** — `.calendar__grid`, `role="grid"`, `aria-multiselectable="true"`,
   `aria-labelledby` the heading. Seven equal columns with 2 px ink lines.
5. **Row** — `.calendar__row`, `role="row"`, `display: contents`.
6. **Weekday header** — `.calendar__weekday`, `role="columnheader"`: the short
   name `aria-hidden`, the long name in `.visually-hidden`. Stage strip.
7. **Cell** — `.calendar__cell`, `role="gridcell"`, carries `aria-selected` on
   selectable and booked days.
8. **Day** — `.calendar__day` with `data-status`: a `<button>` for in-window
   days, a `<span aria-hidden="true">` for outside and past days.
9. **Number** — `.calendar__num`, `aria-hidden="true"` on buttons. Underlined
   when the day is today (`aria-current="date"` on the day).
10. **Event line** — `.calendar__event`: "Requested · 1", "Harvest Point",
    "Weekly", "Studio". Shown from MD.
11. **Dot** — `.calendar__dot`, `aria-hidden="true"`: a square marking a day that
    has an event line. Shown below MD.
12. **Note (optional)** — the projected caption under the grid.

Host: `zm-calendar` is `display: block` and renders the `<section>`; it carries no
class or role of its own, so the section is the landmark-free labelled group the
mocks use.

## API

### Types

```ts
export type CalendarDayStatus = 'free' | 'blocked' | 'requested' | 'booked' | 'past' | 'outside';

export interface CalendarDay {
  date: string;              // ISO date, '2026-11-14'
  status: CalendarDayStatus;
  label: string;             // accessible name: 'Sat 14 Nov, Requested · 1, Riverside Community Church'
  event?: string;            // event line: 'Requested · 1', 'Harvest Point', 'Weekly', 'Studio'
  current?: boolean;         // today: sets aria-current="date"
}

export interface CalendarWeekday { short: string; long: string; }   // { short: 'Sun', long: 'Sunday' }

export interface CalendarLegend { free: string; requested: string; booked: string; blocked: string; }

export interface CalendarDayActivation { date: string; status: CalendarDayStatus; }
```

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `month` | `string` | — | yes | ISO year-month, "2026-11". The calendar derives the weeks from it: Sunday-first rows from the week holding the 1st to the week holding the last day, 5 or 6 rows. Leading and trailing cells are outside days with the adjacent month's numbers. |
| `days` | `readonly CalendarDay[]` | `[]` | unless `loading` | One entry per date of `month`, in order. Dates before today are `past`; dates after the window's last day are `outside`. In dev mode a length that does not match the month logs a console error naming the component. |
| `selected` | `readonly string[]` | `[]` | no | Selected ISO dates; may include dates of other months. Drives `aria-selected` on matching cells. |
| `loading` | `boolean` (attribute) | `false` | no | Renders the loading grid (see States). `days` is ignored. |
| `heading` | `string` | — | yes | The month heading: "November 2026". |
| `headingLevel` | `2 \| 3` | `2` | no | The heading's level. |
| `label` | `string` | — | yes | The section's `aria-label`: "Calendar, next 18 months". |
| `weekdays` | `readonly CalendarWeekday[]` | — | yes | Seven names, Sunday first. In dev mode any other length logs a console error. |
| `legendLabel` | `string` | — | yes | The legend's `aria-label`: "Legend". |
| `legend` | `CalendarLegend` | — | yes | The status words: "Free", "Requested", "Booked", "Unavailable" (L2-056). |
| `previousLabel` | `string` | — | yes | "Previous month, October 2026". |
| `nextLabel` | `string` | — | yes | "Next month, December 2026". |
| `canGoPrevious` | `boolean` | `true` | no | `false` on the window's first month: the Previous button is `disabled` and Page Up and edge-crossing arrows do nothing. |
| `canGoNext` | `boolean` | `true` | no | `false` on the window's last month, as above for Next. |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `monthChange` | `string`, the target "YYYY-MM" | Previous or Next is activated, Page Up or Page Down is pressed, or an arrow key leaves the month. Never emitted past `canGoPrevious` / `canGoNext`. |
| `selectedChange` | `string[]`, the whole new selection, sorted ascending | A day is toggled, a range is extended, or Escape clears the selection. Booked, past and outside dates are never added. |
| `dayActivate` | `CalendarDayActivation` | Any day button is clicked or receives Enter or Space, including a Booked day. Emitted after `selectedChange` when both fire. |

The calendar is controlled: it never changes `selected` itself. It keeps only the
range anchor (the last day toggled) and the focused date.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `[slot=note]` | one `<p class="text-caption">` | Rendered after the grid inside the section. Its wrapper is hidden with `:empty`. Declared once. |

## Variants and sizes

The calendar has one variant, a month grid. The day statuses are its data:

| `data-status` | Word (L2-056) | Look | Element | Selectable |
|---|---|---|---|---|
| `free` | Free | Paper | button | yes |
| `blocked` | Unavailable | Hatched sunken paper, muted number | button | yes, to make it Free again |
| `requested` | Requested · n | Yellow, inner ink rule | button | yes; the page warns before marking it unavailable (L2-057) |
| `booked` | Booked | Ink fill, paper number | button, `aria-disabled="true"` | no (L2-057) |
| `past` | — | Sunken, disabled number | span, `aria-hidden` | no |
| `outside` | — | Sunken, disabled number | span, `aria-hidden` | no |

One size: the calendar fills its container in seven `minmax(0, 1fr)` columns.
Days are at least `--layout-calendar-cell` (44 px) tall, and
`--layout-calendar-cell` × 1.75 (77 px) from MD.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Status fills; the legend beside the heading | Grid labelled "November 2026"; one day in the tab order |
| Hover | `:hover` on a day | Free and Unavailable take `--color-accent-subtle`; Requested takes `--color-accent-hover`; Booked does not change | — |
| Focus | `:focus-visible` on a day | Two-tone ring inset into the day (`outline-offset` minus `--focus-ring-offset`, plus an inset `--color-focus-ring-offset` band), day raised to `--z-raised` | Name read: "Tue 3 Nov, Free" |
| Selected | date in `selected` | `aria-selected="true"` on the cell draws `--shadow-focus` on the day, raised; a Requested day keeps its inner rule under the ring | "selected" |
| Today | `current: true` | Number underlined with `--border-width-thick` | `aria-current="date"` |
| Booked | `status: 'booked'` | Ink fill; no hover change; `cursor: default` | `aria-disabled="true"`; name ends "Booked dates can't be changed" |
| Past / outside | `status` or derived padding | Sunken, `--color-fg-disabled` number, not interactive | Hidden |
| First / last month | `canGoPrevious` / `canGoNext` false | That arrow button is disabled | Arrow out of the tab order |
| Loading | `loading` | Head, legend and weekday strip render; each in-month day is a `.skeleton.skeleton--text.skeleton--day`; outside days keep their numbers | Grid `aria-hidden="true"` with no grid roles; the page sets `aria-busy` |
| Empty (all Free) | every day `free` | A sheet of paper days with no event lines | Every day reads "…, Free" |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

Error is not a calendar state: the page replaces the calendar with an alert.

## Markup

Rendered by `zm-calendar`, head and first week:

```html
<zm-calendar>
  <section class="calendar" aria-label="Calendar, next 18 months">
    <div class="calendar__head">
      <h2 id="zm-calendar-1-month" class="calendar__month" aria-live="polite">November 2026</h2>
      <div class="cluster">
        <div class="cluster">
          <zm-button iconOnly …><button class="btn btn--icon" type="button" aria-label="Previous month, October 2026">…</button></zm-button>
          <zm-button iconOnly …><button class="btn btn--icon" type="button" aria-label="Next month, December 2026">…</button></zm-button>
        </div>
        <ul class="calendar__legend" aria-label="Legend">
          <li><span class="calendar__swatch" aria-hidden="true"></span>Free</li>
          <li><span class="calendar__swatch" data-status="requested" aria-hidden="true"></span>Requested</li>
          <li><span class="calendar__swatch" data-status="booked" aria-hidden="true"></span>Booked</li>
          <li><span class="calendar__swatch" data-status="blocked" aria-hidden="true"></span>Unavailable</li>
        </ul>
      </div>
    </div>
    <div class="calendar__grid" role="grid" aria-labelledby="zm-calendar-1-month" aria-multiselectable="true">
      <div class="calendar__row" role="row">
        <div class="calendar__weekday" role="columnheader"><span aria-hidden="true">Sun</span><span class="visually-hidden">Sunday</span></div>
        …
      </div>
      <div class="calendar__row" role="row">
        <div class="calendar__cell" role="gridcell" aria-selected="false"><button class="calendar__day" type="button" data-status="booked" tabindex="-1" aria-disabled="true" aria-label="Sun 1 Nov, Booked, Harvest Point Church. Booked dates can’t be changed"><span class="calendar__num" aria-hidden="true">1</span><span class="calendar__event">Harvest Point</span><span class="calendar__dot" aria-hidden="true"></span></button></div>
        <div class="calendar__cell" role="gridcell" aria-selected="false"><button class="calendar__day" type="button" data-status="blocked" tabindex="-1" aria-label="Mon 2 Nov, Unavailable, weekly default"><span class="calendar__num" aria-hidden="true">2</span><span class="calendar__event">Weekly</span><span class="calendar__dot" aria-hidden="true"></span></button></div>
        <div class="calendar__cell" role="gridcell" aria-selected="false"><button class="calendar__day" type="button" data-status="free" tabindex="0" aria-label="Tue 3 Nov, Free"><span class="calendar__num" aria-hidden="true">3</span></button></div>
        …
      </div>
      …
    </div>
    <div class="calendar__note"><p class="text-caption">Your calendar runs 18 months ahead, to Sun 9 Apr 2028, the last date churches can ask for.</p></div>
  </section>
</zm-calendar>
```

A Free day has no event line and no dot. Requested and Unavailable days have
both; their cells carry `aria-selected`. Selected, today, outside and past:

```html
<div class="calendar__cell" role="gridcell" aria-selected="true"><button class="calendar__day" type="button" data-status="free" tabindex="0" aria-label="Sat 28 Nov, Free"><span class="calendar__num" aria-hidden="true">28</span></button></div>
<div class="calendar__cell" role="gridcell" aria-selected="false"><button class="calendar__day" type="button" data-status="free" tabindex="0" aria-current="date" aria-label="Fri 9 Oct, Free"><span class="calendar__num" aria-hidden="true">9</span></button></div>
<div class="calendar__cell" role="gridcell"><span class="calendar__day" data-status="outside" aria-hidden="true"><span class="calendar__num">1</span></span></div>
<div class="calendar__cell" role="gridcell"><span class="calendar__day" data-status="past" aria-hidden="true"><span class="calendar__num">8</span></span></div>
```

Loading (the head is unchanged; the grid loses its roles):

```html
<div class="calendar__grid" aria-hidden="true">
  <div class="calendar__row"><div class="calendar__weekday"><span aria-hidden="true">Sun</span><span class="visually-hidden">Sunday</span></div>…</div>
  <div class="calendar__row">
    <div class="calendar__cell"><span class="calendar__day"><span class="skeleton skeleton--text skeleton--day"></span></span></div>
    …
    <div class="calendar__cell"><span class="calendar__day" data-status="outside" aria-hidden="true"><span class="calendar__num">1</span></span></div>
  </div>
</div>
```

Consumer template on `/artist/calendar`:

```html
<zm-calendar
  [month]="store.month()" [days]="store.days()" [selected]="store.selected()" [loading]="store.loading()"
  [heading]="store.monthHeading()" [label]="'calendar.label' | transloco"
  [weekdays]="weekdays()" [legendLabel]="'calendar.legend' | transloco" [legend]="legend()"
  [previousLabel]="store.previousLabel()" [nextLabel]="store.nextLabel()"
  [canGoPrevious]="store.canGoPrevious()" [canGoNext]="store.canGoNext()"
  (monthChange)="store.showMonth($event)" (selectedChange)="store.select($event)" (dayActivate)="onDay($event)">
  <p slot="note" class="text-caption">{{ 'calendar.window' | transloco: { last: store.lastDate() } }}</p>
</zm-calendar>
@if (store.selected().length) {
  <div class="bulk-bar bulk-bar--sticky" role="region" [attr.aria-label]="'calendar.selection' | transloco">…</div>
}
```

The `.calendar*` classes, `data-status`, the grid roles, `aria-selected` and the
day names are a contract: the e2e page object finds a day by its accessible
name and reads its status from `data-status`. The heading's `id` is generated per
instance and is free to change; the arrow buttons' inner markup belongs to
[button](button.md).

## Design

- Frame: grid, gap `--space-4`. Head: wrapping flex row, `space-between`, gap
  `--space-3`; the inner cluster wraps with a row gap of `--space-3` and a column
  gap of `--space-6`.
- Month heading `--text-h2`, uppercase.
- Legend: wrapping flex list, gap `--space-3` `--space-5`, `--text-stub`,
  uppercase; items gap `--space-2`; swatch 1 rem square, `--border-width-hairline`
  `--color-border-strong` rule, filled as the matching status.
- Grid: `repeat(7, minmax(0, 1fr))`, gap and padding `--border-width-thick`, on a
  `--color-border-strong` background, so the lines are the background showing
  through.
- Weekday strip: padding `--space-2` 0, `--color-bg-stage` with
  `--color-fg-on-stage`, `--text-overline`, `--letter-spacing-wide`, uppercase,
  centred.
- Day: column flex, start-aligned, gap `--space-1`, padding `--space-1`
  `--space-2`, full cell width and height, minimum height
  `--layout-calendar-cell` (× 1.75 from MD). Number in `--font-family-display` at
  `--font-size-xl`, `--font-weight-regular`, line height 1.
- Event line `--text-caption` at `--line-height-snug`, one line, ellipsis.
- Dot 0.4 rem square in `currentColor`.
- Unavailable hatch: 135° stripes of `--color-bg-surface-sunken` every
  `--size-offset-2`, with `--border-width-thick` lines of `--color-border-default`.
- Requested inner rule: `--border-width-thick` inset in `--color-fg-on-accent`.
- Selection `--shadow-focus`; focus ring `--focus-ring-width` in
  `--color-focus-ring`, inset by `--focus-ring-offset`, over an inset band of
  `--color-focus-ring-offset`. Both raise the day to `--z-raised`.
- No transitions: hover and selection change at once.

The calendar declares no component tokens: each status reads semantic tokens
directly, as the design system specifies. It has no public `--zm-` knob.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Free day | `--color-bg-surface` / `--color-fg-default` | `--palette-paper-bright` / `--palette-ink-750` | `--palette-ink-850` / `--palette-ink-100` |
| Unavailable day | `--color-bg-surface-sunken`, hatch `--color-border-default`, number `--color-fg-muted` | `--palette-paper-warm`, `--palette-ink-200`, `--palette-ink-600` | `--palette-ink-950`, `--palette-ink-700`, `--palette-ink-300` |
| Requested day | `--color-accent` / `--color-fg-on-accent` | `--palette-signal-500` / `--palette-ink-750` | `--palette-signal-500` / `--palette-ink-750` |
| Requested hover | `--color-accent-hover` | `--palette-signal-300` | `--palette-signal-300` |
| Booked day | fill `--color-fg-default`, number `--color-bg-canvas` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-900` |
| Past and outside | `--color-bg-surface-sunken` / `--color-fg-disabled` | `--palette-paper-warm` / `--palette-ink-400` | `--palette-ink-950` / `--palette-ink-600` |
| Free and Unavailable hover | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Grid lines | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Weekday strip | `--color-bg-stage` / `--color-fg-on-stage` | `--palette-ink-850` / `--palette-ink-100` | `--palette-ink-950` / `--palette-ink-100` |
| Focus ring and band | `--color-focus-ring` / `--color-focus-ring-offset` | `--palette-ink-750` / `--palette-signal-500` | `--palette-signal-500` / `--palette-ink-900` |

In the dark theme Booked becomes a paper day on the charcoal sheet; Requested
stays yellow.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Free day number |
| `--color-fg-muted` | `--color-bg-surface-sunken` | 4.5:1 | Unavailable day number |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Requested day number and event |
| `--color-bg-canvas` | `--color-fg-default` | 4.5:1 | Booked day number and event |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Weekday strip |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Grid lines against a Free day |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus and selection ring on a Free day |

Outside and past days are inert and hidden from assistive technology, so WCAG
1.4.3 does not apply to their `--color-fg-disabled` numbers. The hatch is
decoration over a measured background. Under forced colours the grid lines take
`CanvasText` and the focus ring `Highlight` (tokens); the status fills are lost,
so the day names, the event line from MD and the dot below MD carry the status,
and the dot and swatches set `forced-color-adjust: none` with a `CanvasText`
fill so they stay visible (D-9).

## Responsive behaviour

- Seven equal columns at every width; the grid never scrolls sideways.
- **Below MD (< 768 px)**: days are `--layout-calendar-cell` tall and show the
  number and, when the day has an event line, the dot. The event text is hidden
  and stays in the name.
- **MD and up (≥ 768 px)**: days are 1.75 × `--layout-calendar-cell` tall and show
  the event line, truncated with an ellipsis; the dot is hidden. Truncation is
  allowed only here, because the full text is in the day's name and in the "In
  November" list.
- The head wraps: the heading and the arrows stay together and the legend drops
  to its own line on phones.
- From 360 px each day is at least 44 × 44 CSS px. At 320 px the seven columns
  leave about 39 px of width per day at the full 44 px height (D-8).
- At 320 px and at 200 % zoom nothing overflows the page: the legend wraps, the
  heading wraps, and the days grow taller.

## Accessibility

### Role and pattern

An [APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) with
`aria-multiselectable="true"`, labelled by the month heading, following the
[APG date picker grid](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
keys. Rows are `row`, weekday headers `columnheader`, days `gridcell` holding a
native `<button>`. Outside and past days are not buttons and are hidden. Booked
days stay buttons with `aria-disabled="true"`, so they are discoverable and say why
they cannot change.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Enters the grid on its one tab stop and leaves it. The stop is the first selected day of the month, else today, else the first Free day, else the first day button. The Previous and Next buttons come before the grid. |
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / next day. Leaving the month emits `monthChange` and focuses that date once the month renders. Past and outside days are skipped. |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Same weekday, previous / next week, with the same month rule. |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / last day button of the focused week. |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd> | Previous / next month, same day number (clamped to the month's last day). Nothing happens past the window. |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Toggles the focused day's selection and emits `dayActivate`. On a Booked day only `dayActivate` is emitted. |
| <kbd>Shift</kbd>+arrow | Moves focus and selects every selectable day from the anchor to the new day. Booked days in the range stay unselected. |
| <kbd>Escape</kbd> | Clears the selection (`selectedChange` with `[]`); focus stays. |

### Focus

Exactly one day has `tabindex="0"`; the rest have `-1`, and focus moves with the
roving stop. The ring is inset into the day, so the grid lines never clip it, and
the day is raised above its neighbours. When `days` change (after a save, an undo
or a failed save) the focused date keeps focus, because days are tracked by date.
When a key moves to another month, the calendar holds the target date and focuses
it when that month's days render. Activating Previous or Next keeps focus on the
button.

### Labelling

- Each day button's name is its `label`: the short date, the status word and the
  detail — "Sat 14 Nov, Requested · 1, Riverside Community Church", "Mon 16 Nov,
  Unavailable, weekly default", "Sun 15 Nov, Booked, Lakeshore Alliance Church.
  Booked dates can't be changed". The visible number and the dot are
  `aria-hidden`; the event line is part of the button's text but the `aria-label`
  replaces it.
- Weekday headers read the long name ("Sunday").
- The legend is a labelled list, so status never rests on colour or pattern
  alone.
- The arrow buttons name where they go: "Previous month, October 2026".

### Announcements

The month heading is `aria-live="polite"`, so a month change from the arrow
buttons announces "December 2026". Selection changes are announced by the
page's bulk-bar count (`role="status"`); the calendar adds `aria-selected`.

### Motion

None: hover and selection change colour only, and a month change swaps the grid
without sliding. Under `prefers-reduced-motion: reduce` the loading skeletons
stop shimmering ([skeleton](skeleton.md)).

## Content and internationalisation

- The four status words are fixed by L2-056: Free, Unavailable, Requested,
  Booked. Requested always carries its count: "Requested · 2".
- Event line: the shortest useful name. The church's first words for Booked
  ("Harvest Point"), the artist's own note for Unavailable ("Studio", "Family"),
  "Weekly" for the weekly default, "Requested · n" for requests.
- Day names use the L2-110 short date ("Sat 14 Nov"), with the year outside the
  current year ("Fri 31 Dec 2027"). The heading uses month and year ("November
  2026").
- The calendar has no copy of its own. Every string — heading, labels, weekday
  names, legend words, arrow names, the note — comes from the catalogue or the
  API library's format service through the page (L2-111). Names, churches and
  notes are data.
- French runs about 30 % longer: legend words and the heading wrap; event lines
  truncate from MD and are complete in the name.

## Performance

- Change detection: `OnPush`, signal inputs. One `computed` builds the weeks from
  `month`, `days` and `selected` (a `Set` of selected dates); the template only
  reads it. Days are tracked by date. One host keydown listener on the grid; no
  listener per day, no `effect` except the one that applies a pending focus.
- Perf-test scenario `frontend/projects/perf-test/src/scenarios/Calendar.ts`
  renders Abigail Mensah's November 2026: booked 1, 15, 21 Nov, unavailable every
  Monday and 26–27 Nov ("Studio"), requested 14 and 22 Nov ("Requested · 1"), the
  rest Free, with the legend and the note. It is the "availability calendar
  month" composite (AGENTS.md). Export it from `scenarios/index.ts`.
- `CalendarLoading.ts` renders the same month with `loading`.
- Iterations for both are tuned in `e2e/perf-test/config/scenario-iterations.mjs`
  so each renders in roughly 100–300 ms.
- Regression rule: a change to the template, inputs, styles or change detection
  is measured against the base branch with `--fail-on-regression` before it is
  pushed.
- Layout stability: the loading grid has the same weeks, rows and day heights as
  the loaded month, so the swap does not shift the page (L2-105).
- Imports: `zm-button` and `zm-icon` for the arrows, nothing else. No date library: weeks are computed from the ISO month with the
  platform `Date` in UTC.

## Acceptance criteria

### Rendering

- **AC-1** Given Abigail Mensah's November 2026 (`month` "2026-11"), when the calendar renders, then it is a `section.calendar` named "Calendar, next 18 months" with the heading "November 2026", a `role="grid"` with `aria-multiselectable="true"` labelled by that heading, seven column headers Sun to Sat whose names are Sunday to Saturday, 5 week rows, 30 day buttons and 5 outside days numbered 1 to 5. (L2-056)
- **AC-2** Given that month, when it renders, then Sun 1 Nov has `data-status="booked"` and the event line "Harvest Point", Mon 2 Nov `blocked` with "Weekly", Sat 14 Nov `requested` with "Requested · 1", Thu 26 Nov `blocked` with "Studio", and Tue 3 Nov `free` with no event line or dot. (L2-056)
- **AC-3** Given the legend, when it renders, then it is a list named "Legend" with the words "Free", "Requested", "Booked" and "Unavailable", each beside a swatch with the matching status fill. (L2-056)
- **AC-4** Given Miriam Haile, who has set no availability, when her November 2026 renders, then all 30 days are `free` buttons with no event lines. (L2-056)
- **AC-5** Given October 2026 with today Fri 9 Oct, when it renders, then 1 to 8 Oct are `data-status="past"` spans hidden from assistive technology and not buttons, and Fri 9 Oct is a button with `aria-current="date"` and an underlined number. (L2-056)
- **AC-6** Given November 2026, when Next is activated, then `monthChange` emits "2026-12"; when the page passes December, then the heading reads "December 2026", Previous is named "Previous month, November 2026" and Sat 5 Dec is `requested`. (L2-056)
- **AC-7** Given October 2026 with `canGoPrevious` false, when it renders, then Previous is disabled and Page Up does nothing; given April 2028 with `canGoNext` false, then Next is disabled and the days after Sun 9 Apr 2028 are outside days. (L2-056)
- **AC-8** Given Sun 15 Nov is Booked, when it is clicked, then it has `aria-disabled="true"`, `selectedChange` does not emit, and `dayActivate` emits `{ date: '2026-11-15', status: 'booked' }`. (L2-057)
- **AC-9** Given Lakeshore Alliance's booking on Sun 15 Nov is cancelled, when the page passes that day as `free`, then it renders as a Free button without `aria-disabled` and can be selected. (L2-057)

### Selection

- **AC-10** Given no selection, when Sat 28 Nov and then Sun 29 Nov are clicked, then `selectedChange` emits `['2026-11-28']` and then `['2026-11-28', '2026-11-29']`; when the page passes them back, then both cells have `aria-selected="true"` and their days show `--shadow-focus`. (L2-056)
- **AC-11** Given Sat 28 Nov is selected, when it is clicked again, then `selectedChange` emits a selection without "2026-11-28". (L2-056)
- **AC-12** Given Thu 26 Nov (Unavailable, "Studio") and Sat 14 Nov (Requested), when each is clicked, then each is added to the selection, and the selected Requested day keeps its inner `--color-fg-on-accent` rule under the selection ring. (L2-057)
- **AC-13** Given Sat 14 Nov (Requested) is clicked, when the events fire, then `selectedChange` emits first and `dayActivate` then emits `{ date: '2026-11-14', status: 'requested' }`, so the page can show the "Open request" toast. (L2-057)

### States

- **AC-14** Given `loading` for November 2026, when it renders, then the heading, arrows and legend are shown, the grid has `aria-hidden="true"` and no grid, row or cell roles, each of the 30 in-month days holds one `.skeleton.skeleton--day`, and the outside days 1 to 5 Dec keep their numbers. (L2-105)
- **AC-15** Given the loading month replaced by Abigail's loaded November, when the swap is measured, then the grid has the same rows and height and the cumulative layout shift from the swap is 0.05 or less. (L2-105)
- **AC-16** Given focus on Thu 26 Nov, when the page saves 26–27 Nov as Unavailable and passes the new days, then Thu 26 Nov shows `blocked` with "Studio" and keeps focus. (L2-101)

### Keyboard and focus

- **AC-17** Given November 2026 with no selection and today outside the month, when Tab moves into the grid, then focus lands on Tue 3 Nov, the only day with `tabindex="0"`; given 28 and 29 Nov selected, then it lands on Sat 28 Nov. (L2-101)
- **AC-18** Given focus on Tue 3 Nov, when → is pressed, then Wed 4 Nov is focused; ↓ from there focuses Wed 11 Nov; Home focuses Sun 8 Nov; End focuses Sat 14 Nov. (L2-101)
- **AC-19** Given focus on Mon 30 Nov, when → is pressed, then `monthChange` emits "2026-12", and when December renders, Tue 1 Dec has focus. (L2-101)
- **AC-20** Given focus on Sat 14 Nov, when Page Down is pressed, then `monthChange` emits "2026-12" and Mon 14 Dec is focused once December renders; given April 2028 with `canGoNext` false, when Page Down is pressed, then nothing happens. (L2-101)
- **AC-21** Given focus on Tue 17 Nov, when Space is pressed, then the day is selected and `dayActivate` emits; when Enter is pressed, then it is deselected. (L2-101)
- **AC-22** Given Fri 20 Nov was the last day toggled, when Shift+→ is pressed twice, then `selectedChange` emits 20 and 22 Nov and focus is on Sun 22 Nov, and Sat 21 Nov (Booked) is not in the selection. (L2-101)
- **AC-23** Given 28 and 29 Nov selected, when Escape is pressed in the grid, then `selectedChange` emits `[]` and focus stays on the same day. (L2-101)
- **AC-24** Given keyboard focus on a day, when it is focused, then the two-tone ring is drawn inside the day's edges, is not covered by the grid lines or a neighbouring day, and the day is raised to `--z-raised`. (L2-101)

### Screen readers

- **AC-25** Given November 2026, when the days are read by a screen reader, then Sat 14 Nov is "Sat 14 Nov, Requested · 1, Riverside Community Church", Sun 15 Nov is "Sun 15 Nov, Booked, Lakeshore Alliance Church. Booked dates can't be changed", dimmed (disabled), and no day number or dot is read on its own. (L2-102)
- **AC-26** Given focus on the Next button, when it is activated, then the screen reader announces "December 2026" from the heading's polite live region. (L2-102)
- **AC-27** Given the selected days 28 and 29 Nov, when a screen reader reads them, then each is announced as selected. (L2-102)
- **AC-28** Given the default, selected, loading and all-Free months in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)
- **AC-29** Given a 360 px viewport where event lines are hidden, when the month renders, then every Requested, Unavailable and Booked day shows the dot, and the legend lists each status word, so no status relies on colour alone. (L2-100)

### Theming

- **AC-30** Given the dark theme, when November 2026 renders, then Booked days are filled with `--color-fg-default` (paper) with `--color-bg-canvas` numbers, Requested days stay `--color-accent`, and Free days are `--color-bg-surface` charcoal. (L2-104)
- **AC-31** Given both themes, when contrast is measured, then the number on every status (Free, Unavailable, Requested, Booked) and the weekday strip text are at least 4.5:1 against their fills, and the grid lines and focus ring at least 3:1 against a Free day. (L2-103)

### Responsive

- **AC-32** Given a 360 px viewport, when November 2026 renders, then there are seven columns, every day button is at least 44 × 44 CSS px, event lines are hidden and the page does not scroll horizontally. (L2-096)
- **AC-33** Given a 768 px viewport, when it renders, then days are at least 77 px tall, Booked days show "Harvest Point", "Lakeshore" and "Kingdom Life", a longer event line ends in an ellipsis inside the day, and no dot is shown. (L2-096)
- **AC-34** Given a 320 px viewport with text zoomed to 200 %, when it renders, then the legend and heading wrap, every day stays at least 44 px tall, nothing is clipped outside the calendar, and the page does not scroll horizontally. (L2-096)

### Motion

- **AC-35** Given `prefers-reduced-motion: reduce`, when the loading month renders and when the month changes, then the skeletons do not animate and the grid swaps without a transition. (L2-103)

### Content

- **AC-36** Given December 2027 with the label "Fri 31 Dec 2027, Unavailable" passed for 31 Dec, when it renders, then that day's name is exactly the passed label and the calendar adds no date formatting of its own. (L2-110)
- **AC-37** Given the French catalogue, when the legend words, weekday names and heading are about 30 % longer, then they come only from the inputs, the legend wraps without clipping, and no English string remains in the calendar. (L2-111)

### Performance

- **AC-38** Given the `Calendar` and `CalendarLoading` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The component is planned. To build it:

- Folder `frontend/projects/components/src/lib/calendar/`: `calendar.ts`
  (class `Calendar`, selector `zm-calendar`), `calendar.html`, `calendar.scss`,
  and `calendar.types.ts` for `CalendarDay`, `CalendarDayStatus`,
  `CalendarWeekday`, `CalendarLegend` and `CalendarDayActivation`. Export all
  from `public-api.ts`.
- Composes `zm-button` (secondary, `iconOnly`, `label`, `disabled`) and `zm-icon`
  (chevron left and right) for the arrows. No CDK primitive: the grid's roving
  focus is small and specific (arrows across months, Shift ranges, skipping
  hidden days), and the CDK's list key manager does not model a two-dimensional
  grid.
- Port the `.calendar*` rules from `components.css` into `calendar.scss`, using
  only the cell rule for selection (`.calendar__cell[aria-selected="true"]
  .calendar__day`) and dropping the stale `.calendar__day[aria-selected]` rule the
  design system lists as drift. Add the `.calendar__note:empty` rule, the
  forced-colours rule for the dot and swatches, and `cursor: default` on Booked.
- Build the weeks in a pure function (`buildWeeks(month, days)`) covered by the
  component's acceptance tests through the rendered grid, not by a unit test of
  the shape.
- Pending focus: store the target ISO date when a key leaves the month; an
  `effect` focuses that date's button after the matching `month` and `days`
  render, then clears it.
- Guard activation on Booked days: no `selectedChange`, still `dayActivate`.
- Add `Calendar.ts` and `CalendarLoading.ts` to
  `frontend/projects/perf-test/src/scenarios/`, export both from `index.ts`, and
  tune their iterations.

## Decisions

- **D-1** *Does the calendar own the bulk bar?* No. The mocks render the bar after the `section.calendar`, not inside it, and the design system documents `.bulk-bar` with the table, where it serves request lists too. The calendar exposes `selected` and `selectedChange`; the page renders the bar from them, so the bar's copy and save actions stay with the page that saves.
- **D-2** *Does the calendar emit a date range or a set of dates?* A sorted list of dates. The detailed design (`manage-availability-calendar`) says it "emits a date range from a start and end selection", but the design system specifies multi-select with Space per day and Shift for ranges, and `pages/availability/selected` selects days one by one. A list covers both a contiguous range and separate days; the page derives the range text for the bulk bar.
- **D-3** *What happens when a Booked or Requested day is activated?* Both emit `dayActivate`. Booked days never join the selection (L2-057, design system), and the detailed design has the page show the "Sun 15 Nov is Booked" info toast. Requested days join the selection, as the design system's status table says, and also emit `dayActivate` so the page can show the "Open request" toast of `notifications/availability-toast/with-action`. One event serves both pages' needs without the calendar knowing about toasts.
- **D-4** *Who builds the weeks?* The calendar, from `month`. The loading mock keeps the outside days and the 5-row shape before any data arrives, so the layout cannot depend on `days`. Day content (status, label, event) comes from the page, because it needs translated, formatted copy.
- **D-5** *Which day is the tab stop?* The first selected day in the month, else today, else the first Free day, else the first day button. This matches the design system's rule and both mocks (Tue 3 Nov by default, Sat 28 Nov when 28–29 Nov are selected), with a final fallback for a month with no Free days.
- **D-6** *Does the selection survive a month change?* Yes. `selected` is owned by the page and may hold dates from other months, so a Shift range can cross a month edge and the bulk bar keeps counting. Clearing it is the page's or Escape's job.
- **D-7** *How is a month change announced when focus stays on the Next button?* The heading is a polite live region. The button's own name changes too, but screen readers do not re-read a focused button's name; the heading names the month the grid now shows. Keyboard month changes need no announcement beyond the focused day's name, which includes the date.
- **D-8** *L2-096 asks for 44 × 44 px targets, but seven columns cannot be 44 px wide at 320 px.* The calendar keeps the design system's seven columns: from 360 px every day is at least 44 × 44 px, and at 320 px each day is 44 px tall and about 39 px wide, separated by 2 px, which still exceeds WCAG 2.5.8's 24 px minimum. Collapsing the month into a list at 320 px would change the design system's layout and the e2e contract. This needs product confirmation, because it reads L2-096's touch-target criterion as met from 360 px.
- **D-9** *How does status survive forced colours, where fills are removed?* Through the day names, the event line from MD and the dot below MD; the dot and legend swatches opt out with `forced-color-adjust: none` and a `CanvasText` fill so the shapes stay visible. The design system does not cover forced colours for the calendar, and the legend-plus-words rule is its own "never colour alone" requirement.
- **D-10** *Does a month change ever show the loading grid?* No. The availability store holds the whole 18-month window (detailed design), so `loading` applies to the first load only and a pending keyboard focus target always finds its day on the next render.
- **D-11** *Which weekday starts the week?* Sunday, as in every mock and the en-CA convention the product formats to (L2-110). A French catalogue changes the names, not the order, so no code changes (L2-111).
- **D-12** *Where does "Your calendar runs 18 months ahead…" go?* In a `[slot=note]` inside the section, as in the mocks, so it stays part of the labelled calendar and the page keeps the copy.
