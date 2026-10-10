# Booking list

| Field | Value |
|---|---|
| Selector | `zm-booking-list`, `zm-booking-list-row`, `zm-booking-list-row-skeleton` |
| Library path | `frontend/projects/components/src/lib/booking-list/` |
| Status | planned |
| Traces to | L2-033, L2-034, L2-039, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`booking-list.html`](../../design-system/components/booking-list.html) |
| Source mocks | [`pages/bookings/default`](../../mocks/pages/bookings/default.html), [`pages/bookings/past`](../../mocks/pages/bookings/past.html), [`pages/bookings/loading`](../../mocks/pages/bookings/loading.html), [`pages/requests/default`](../../mocks/pages/requests/default.html), [`pages/requests/loading`](../../mocks/pages/requests/loading.html), [`pages/requests/no-results`](../../mocks/pages/requests/no-results.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/loading`](../../mocks/pages/dashboard/loading.html), [`pages/earnings/default`](../../mocks/pages/earnings/default.html), [`pages/earnings/loading`](../../mocks/pages/earnings/loading.html), `notifications/request-toast/*` |
| Rendering | [`booking-list.html`](booking-list.html) |

## Purpose and scope

The booking list is the tour book: one framed row per booking or request, the
event date set big on the left, who and what in the middle, the money and the
status stamp on the right, and the one next action beside the stamp. It shows
one person's own bookings in date or deadline order so they can see what is
coming and act on the one that needs them: Naomi's Your bookings (L2-033),
Abigail's Requests inbox (L2-034), "Needs your reply" on the artist dashboard
and the Upcoming and Paid out lists on Earnings (L2-039).

The whole row opens the booking or request: the name link stretches over the
row. The action button sits above the link and stays separately clickable.

The family has three components:

- `zm-booking-list` renders the list (`<ol>` or `<ul>`) and its label.
- `zm-booking-list-row` renders one row inside an `<li>` of that list.
- `zm-booking-list-row-skeleton` renders a loading row of the same shape.

Use something else when:

- it lists artists in search results → [ticket card](ticket.md);
- people compare many columns or select rows (admin queues) → [table](table.md);
- it is a short list of an artist's dates on a profile, calendar or admin page →
  [tour dates](tour-dates.md);
- it is one booking's summary on its own page → [card](card.md) panel.

Out of scope:

- Ordering, grouping into Upcoming and Past, tabs and filters (L2-033, L2-034).
  The page sorts and passes rows in order; [tabs](tabs.md) own the panels.
- Empty, no-results and error states. The page leaves the list out and shows an
  [empty state](empty-state.md) or an [alert](alert.md) instead.
- Formatting dates, money, distance, time left and the message preview. The
  page passes formatted strings (L2-110).
- The status word and the action's behaviour. The page projects a
  [stamp](stamp.md) or [badge](badge.md) and a [button](button.md) into the row.
- The loading status line ("Loading your bookings") and `aria-busy` on the
  region; the page owns both.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/bookings/default` Upcoming | `ordered`, label "Upcoming bookings"; rows `h2`, one meta line, amount "Paid $237.50" | stamp "Confirmed" + sm "Message"; stamp "Requested" + "Message"; stamp "Accepted" + sm primary "Pay $225 deposit" | default, hover, focus within | canvas |
| `pages/bookings/past` | `ordered`, label "Past bookings"; as above | stamp "Withdrawn" + caption "Nothing charged"; "Declined" + "Message"; "Completed" + caption "Reviewed ★★★★★" named "You reviewed it: 5 out of 5" | default | canvas |
| `pages/bookings/loading` | `ordered`, label "Upcoming bookings"; 3 skeleton rows with amount and stamp | — | loading | canvas |
| `pages/requests/default` New tab | unordered, labelled by the panel's visually hidden `h2` "New requests, soonest deadline first"; rows `h3`, three meta lines (event, money, `<q>` message), no amount | stamp "Requested" + caption "**1 day left** · reply by Sat 10 Oct, 3:15 p.m." | default | canvas |
| `pages/requests/default` Confirmed and Past tabs, `requests/no-results` | unordered; two meta lines | stamp "Confirmed" alone; "Declined" ("You declined: too far to travel"); "Completed" ("$650 · you were paid $598 on Tue 15 Sep") | default | canvas |
| `pages/requests/loading`, `dashboard/loading`, `earnings/loading` | skeleton rows, two meta lines, badge-shaped status plus a caption, no amount | — | loading | canvas, inside an `aria-hidden` page body |
| `pages/dashboard/default` "Needs your reply" | as the New tab, `h3` | stamp + reply caption | default | canvas |
| `pages/earnings/default` Upcoming, Paid out | unordered, `h3`, two meta lines ("Sunday service, Brampton" / "Total $650 · Zamaro fee $52 · payout $598") | [badge](badge.md) `variant="neutral"` "Deposit held"; neutral badge "Paid Tue 15 Sep" | default | canvas |
| `notifications/request-toast/*` | the requests page behind a toast | as requests | inert behind nothing (toasts do not make the page inert) | canvas |
| Long names | "Grace Tabernacle Mass Choir", "Riverside Community Church", "St. Brendan’s Anglican" | — | wraps | canvas |

## Anatomy

1. **List** — `.booking-list`, an `<ol>` or `<ul>` with `role="list"` and a
   label. `--space-4` between rows.
2. **Row** — `.booking-list__row`: the framed paper card, a grid with areas
   `date`, `who`, `meta`, `amount`, `status`. Lifts on hover and focus within.
3. **Date** — `.booking-list__date`: a `<p>` with the weekday in a `<small>`
   overline over the date in the display face. Always the event date.
4. **Who** — `.booking-list__who`: an `h2` or `h3` holding the link to the
   booking; the link's `::after` covers the whole row.
5. **Meta** — `.booking-list__meta`: one to three muted lines separated by
   `<br>`; an optional message preview in a `<q>` on the last line.
6. **Amount (optional)** — `.booking-list__amount`: `<small>` label over the
   figure, shown from MD, `aria-hidden="true"` because the meta says it.
7. **Status** — `.booking-list__status`: the projected stamp or badge, then at
   most one action or caption.

Hosts: `zm-booking-list` is `display: block` and renders the native list inside
it; the page puts each row in an `<li>` it writes. `zm-booking-list-row` is the
row itself: the host carries `.booking-list__row`, is the grid and the
positioning context of the stretched link, and fills its `<li>`. The skeleton's
host carries `.booking-list__row` too.

## API

### `zm-booking-list` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `ordered` | `boolean` (attribute) | `false` | no | `true` renders `<ol>` (date order carries meaning, as on Your bookings); otherwise `<ul>`. |
| `label` | `string` | — | one of `label` or `labelledBy` | Sets `aria-label` on the list ("Upcoming bookings", "Past bookings"). |
| `labelledBy` | `string` | — | one of `label` or `labelledBy` | Sets `aria-labelledby`, for a list under its own heading ("New requests, soonest deadline first"). |
| `busy` | `boolean` | `false` | no | Adds `.booking-list--loading`, which turns off the lift. Set it while the list holds skeleton rows. |

### `zm-booking-list-row` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `weekday` | `string` | — | yes | "Sun". Rendered in the date's `<small>`. |
| `date` | `string` | — | yes | "25 Oct", or "25 Oct 2027" outside the current year (L2-110). |
| `name` | `string` | — | yes | The other party: the artist for a booker, the church for an artist. The link text. |
| `headingLevel` | `2 \| 3` | `2` | no | The name's heading level: 2 on Your bookings, 3 under a section or tab heading. |
| `link` | `string \| unknown[]` | — | yes | `routerLink` to the booking or request: `/bookings/ZAM-0097`, `/artist/bookings/ZAM-0114`. |
| `meta` | `readonly string[]` | — | yes | One to three lines, each already joined with " · ". Lines render separated by `<br>`. |
| `message` | `string \| null` | `null` | no | The start of the church's message, already truncated with "…". Rendered as a `<q>` on its own last line of the meta. |
| `amount` | `string \| null` | `null` | no | "$237.50". With `amountLabel`, renders `.booking-list__amount`; `null` leaves the element out and the status takes its column from MD. |
| `amountLabel` | `string` | `''` | when `amount` is set | "Paid". |

### `zm-booking-list-row-skeleton` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `amount` | `boolean` (attribute) | `false` | no | Adds the amount block (Your bookings). |
| `metaLines` | `1 \| 2` | `1` | no | One long text line, or a long and a short line (artist lists). |
| `status` | `'stamp' \| 'badge'` | `'stamp'` | no | The status block's shape; `badge` adds a medium text line after it, for the reply caption or payout badge. |

### Outputs

None. Navigation is the name link; actions belong to the projected buttons.

### Content slots

| Component | Slot | Accepts | Rule |
|---|---|---|---|
| `zm-booking-list` | default | `<li>` elements, each holding one `zm-booking-list-row` or `zm-booking-list-row-skeleton` | Declared once, inside the list element (an `ng-template` rendered by `ngTemplateOutlet` in the `<ol>` and `<ul>` branches). |
| `zm-booking-list-row` | default | in order: one `zm-stamp` or `zm-badge`, then at most one `zm-button` / `zm-button-link` with `size="sm"` or one caption (`<span class="text-caption">`, optionally with a `<strong>` lead or `role="img"` and an `aria-label`) | Rendered in `.booking-list__status`. Buttons raise themselves above the stretched link (button CRD); stamps, badges and captions do not (D-5). |

Every string arrives as an input or in the slot, already translated (L2-111).

## Variants and sizes

| Variant | Configuration | Use for |
|---|---|---|
| Bookings (booker) | `ordered`, rows `h2`, one meta line, `amount`, stamp + action or caption | Your bookings, Upcoming and Past (L2-033). |
| Requests (artist) | unordered, rows `h3`, three meta lines with `message`, no amount, stamp + time-left caption | Requests inbox New tab, dashboard "Needs your reply" (L2-034). |
| Compact (artist) | unordered, rows `h3`, two meta lines, no amount, stamp alone or badge | Requests Confirmed and Past tabs; Earnings Upcoming and Paid out with a payout badge (L2-039). |
| Loading | `busy` list of `zm-booking-list-row-skeleton` | Any of the above while it loads (L2-105). |

The list has one size. Rows fill their container; the date column is 5.5 rem
below MD and 6.5 rem from MD.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper row, `--border-width-thick` `--color-border-strong` frame | List item: heading with a link, meta text, status, action |
| Hover | `:host(:hover)` on the row | Lifts by `--transform-lift` over `--shadow-1` | — |
| Focus within | `:host(:focus-within)` | The focused link or button shows its two-tone ring; the row lifts as on hover | — |
| Action busy | the projected button's `busy` | The button's own busy state; the row is unchanged | As the button |
| Loading | `busy` list with skeleton rows | Same frame and grid; skeleton blocks in every area; no lift | Rows `aria-hidden="true"`; the page's region is `aria-busy` with a visually hidden status ("Loading your bookings") |
| Long content | long name or meta, a date with a year | Wraps inside its column; a year goes to its own line under the date | — |
| Inert | an open dialog makes the page `inert` | No lift | Not reachable |

Empty, no results and error are not states of the list: the page leaves it out
(`bookings/empty`, `requests/no-results`, `bookings/error`).

## Markup

Rendered, Your bookings:

```html
<zm-booking-list>
  <ol class="booking-list" role="list" aria-label="Upcoming bookings">
    <li>
      <zm-booking-list-row class="booking-list__row">
        <p class="booking-list__date"><small>Sun</small>25 Oct</p>
        <h2 class="booking-list__who"><a href="/bookings/ZAM-0097">Marcus Bell Trio</a></h2>
        <p class="booking-list__meta">ZAM-0097 · Sunday service · 10:30 a.m. · Hamilton, 14 km · Paid $237.50</p>
        <p class="booking-list__amount" aria-hidden="true"><small>Paid</small>$237.50</p>
        <div class="booking-list__status">
          <zm-stamp class="stamp stamp--confirmed">Confirmed</zm-stamp>
          <zm-button-link size="sm"><a class="btn btn--sm" href="/bookings/ZAM-0097#messages">Message</a></zm-button-link>
        </div>
      </zm-booking-list-row>
    </li>
  </ol>
</zm-booking-list>
```

A request row: three meta lines, no amount, a caption instead of a button:

```html
<zm-booking-list-row class="booking-list__row">
  <p class="booking-list__date"><small>Sat</small>5 Dec</p>
  <h3 class="booking-list__who"><a href="/artist/bookings/ZAM-0123">Harvest Point Church</a></h3>
  <p class="booking-list__meta">Worship night · 7:00 p.m. · Milton, 31 km<br>$650 quoted · you get $598<br><q>We need a soloist for three carols and one of your own songs. Could you also…</q></p>
  <div class="booking-list__status">
    <zm-stamp class="stamp stamp--requested">Requested</zm-stamp>
    <span class="text-caption"><strong>1 day left</strong> · reply by Sat 10 Oct, 3:15 p.m.</span>
  </div>
</zm-booking-list-row>
```

Loading:

```html
<ol class="booking-list booking-list--loading" role="list" aria-label="Upcoming bookings">
  <li>
    <zm-booking-list-row-skeleton class="booking-list__row" aria-hidden="true">
      <zm-skeleton class="booking-list__date skeleton skeleton--date" />
      <zm-skeleton class="booking-list__who skeleton skeleton--title skeleton--medium" />
      <span class="booking-list__meta"><zm-skeleton class="skeleton skeleton--text skeleton--long" /></span>
      <zm-skeleton class="booking-list__amount skeleton skeleton--amount" />
      <span class="booking-list__status"><zm-skeleton class="skeleton skeleton--stamp" /></span>
    </zm-booking-list-row-skeleton>
  </li>
</ol>
```

With `metaLines="2"` the meta holds a second `skeleton--text skeleton--short`
line; with `status="badge"` the status holds `skeleton--badge` and a
`skeleton--text skeleton--medium` line; without `amount` the amount block is
left out.

Consumer templates:

```html
<zm-booking-list ordered [label]="'bookings.upcoming.label' | transloco">
  @for (b of upcoming(); track b.number) {
    <li>
      <zm-booking-list-row [weekday]="b.weekday" [date]="b.date" [name]="b.artistName" [link]="['/bookings', b.number]"
        [meta]="[b.metaLine]" [amount]="b.paid" [amountLabel]="'bookings.paid' | transloco">
        <zm-stamp [status]="b.status">{{ 'booking.status.' + b.status | transloco }}</zm-stamp>
        <zm-button-link size="sm" [variant]="b.action.primary ? 'primary' : 'secondary'" [link]="['/bookings', b.number]" [fragment]="b.action.fragment">{{ b.action.label }}</zm-button-link>
      </zm-booking-list-row>
    </li>
  }
</zm-booking-list>
```

```html
<zm-booking-list labelledBy="new-title">
  @for (r of requests(); track r.number) {
    <li>
      <zm-booking-list-row [weekday]="r.weekday" [date]="r.date" [name]="r.churchName" [headingLevel]="3"
        [link]="['/artist/bookings', r.number]" [meta]="[r.eventLine, r.moneyLine]" [message]="r.messagePreview">
        <zm-stamp status="requested">{{ 'booking.status.requested' | transloco }}</zm-stamp>
        <span class="text-caption"><strong>{{ r.timeLeft }}</strong> · {{ r.replyBy }}</span>
      </zm-booking-list-row>
    </li>
  }
</zm-booking-list>
```

The `.booking-list*` classes, the heading and the single row link are a
contract: the e2e page objects find a row by its heading, read the meta, amount
and stamp by class, and press the action by role and name.

## Design

- List: `list-style: none`, no margin or padding, `display: grid`, gap
  `--space-4`.
- Row: `position: relative`; padding `--space-4` block, `--space-5` inline;
  gap `--space-2` rows by `--space-4` columns; fill `--color-bg-surface`; frame
  `--border-width-thick` solid `--color-border-strong`; square corners.
- Below MD: columns `5.5rem minmax(0, 1fr)`, areas `"date who" "date meta"
  "status status"`; the amount is hidden.
- From MD (768 px): columns `6.5rem minmax(0, 1fr) auto auto`, areas `"date who
  amount status" "date meta amount status"`, `align-items: center`, column gap
  `--space-6`; the amount shows and the status aligns to the end.
- Date: `--font-weight-regular` `--font-size-2xl` / 0.95
  `--font-family-display`, uppercase; its `<small>` is block `--text-overline`
  with `--letter-spacing-wide` in `--color-fg-muted`. The day and month are
  joined by a no-break space.
- Who: `--text-h4`, uppercase, margin 0; the link inherits colour, has no
  underline and no hover background; its `::after` is `position: absolute;
  inset: 0`. `overflow-wrap: anywhere` so one long word cannot overflow.
- Meta: `--text-body-sm`, `--color-fg-muted`, margin 0. The `<q>` uses the
  language's quotation marks.
- Amount: `--font-size-2xl` display face, `font-variant-numeric: tabular-nums`,
  right-aligned; its `<small>` is block `--text-overline` in `--color-fg-muted`.
- Status: `display: flex`, `flex-wrap: wrap`, `align-items: center`,
  `justify-content: space-between` (`flex-end` from MD), gap `--space-3`.
- Hover and focus within: `transform: var(--transform-lift)`, `box-shadow:
  var(--shadow-1)`, transitions on transform and box-shadow over
  `--duration-base` with `--ease-standard`. `.booking-list--loading` rows never
  lift.
- Layers: the stretched link covers the row; the action button sits above it at
  `--z-raised` (the button's own `:host-context(.booking-list)` rule).

The booking list declares no component tokens. The row never sets `overflow:
hidden`, so focus rings and the stamp's outline are never clipped.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Row fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Row frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Date, name, amount | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Weekday, meta, amount label | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Hover shadow | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Name, date, amount |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Weekday, meta, amount label, captions |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Row frame against the page |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Row frame against the row |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on the name link |

Under forced colours the frame uses `CanvasText`, the lift shadow disappears,
and the focus ring follows `Highlight`.

## Responsive behaviour

- **Below MD (< 768 px):** two columns. The date spans the first two lines on
  the left; who and meta stack on the right; the status line (stamp left, action
  right) runs the full width underneath. The amount is hidden (the meta says
  it).
- **MD and up (≥ 768 px):** four columns, date · who and meta · amount ·
  status, vertically centred. Without an amount, the status takes its column.
- Names and meta wrap inside their column and never truncate: "Grace Tabernacle
  Mass Choir" takes two lines at 320 px. A single word wider than the column
  breaks inside the word. The day and month never break apart (a no-break space
  joins them); a year, shown only outside the current year, takes its own line in
  the date column (D-9).
- When the stamp and the action do not fit on one line (French, 200 % zoom), the
  action wraps under the stamp; neither shrinks.
- At 320 px nothing overflows the row or the page. At 200 % zoom the row grows
  taller and every part stays reachable.
- The whole row is the booking's tap target; the small action button grows to
  44 px on touch devices (button CRD) and sits at least `--space-3` from the
  stamp.

## Accessibility

### Role and pattern

A native list with `role="list"` (Safari drops list semantics after
`list-style: none`) and an accessible name: `<ol>` when the order carries
meaning (date or deadline), `<ul>` otherwise. Each row starts its content with a
heading at the page's level, so heading keys jump row to row. The row is not a
link and is never wrapped in an `<a>`; a button inside a link is invalid.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to the row's name link, then its action button, then the next row's name. Stamps, badges and captions are skipped. |
| <kbd>Enter</kbd> | On the name link: opens the booking or request. On the button: does the action. |
| <kbd>Space</kbd> | On the button: does the action. |

### Focus

The ring is drawn on the focused link or button (two-tone, `--focus-ring-offset`).
`:focus-within` lifts the row so the active row is clear at a glance. The ring is
never clipped and never hidden under the sticky header (the page reserves
`scroll-padding`).

### Labelling

- The link text is the other party's name, so a list of links reads as a list of
  names.
- The row reads in source order: date, name, meta, stamp, action. The weekday and
  date are read as "Sun 25 Oct".
- The amount is in the meta ("Paid $237.50"); the big `.booking-list__amount` is
  `aria-hidden="true"` so it is not read twice.
- Buttons name the object only when needed: "Pay $225 deposit" stands alone;
  several "Message" buttons are disambiguated by the heading before them.
- A caption that uses symbols carries a name: "Reviewed ★★★★★" is `role="img"`
  with `aria-label="You reviewed it: 5 out of 5"`.

### Announcements

None from the list. The page announces loading and results in its status region.

### Motion

The lift takes `--duration-base`. Under `prefers-reduced-motion: reduce` the
duration drops to near zero, so the row changes state without moving. Skeletons
stop shimmering (skeleton CRD).

## Content and internationalisation

- **Date:** the short day over the date in the L2-110 pattern ("Sat" over "14
  Nov"); the year is added outside the current year ("14 Nov 2027").
- **Name:** the other party as they name themselves: "Abigail Mensah", "Harvest
  Point Church", "St. Brendan’s Anglican".
- **Meta, booker:** booking number · kind of gathering · start time · place,
  distance · amount: "ZAM-0097 · Sunday service · 10:30 a.m. · Hamilton, 14 km ·
  Paid $237.50" (L2-033). Kinds use the L2-004 names only.
- **Meta, artist inbox:** "Worship night · 7:00 p.m. · Milton, 31 km", then "$650
  quoted · you get $598", then the message's first words in `<q>` (L2-034).
- **Meta, earnings:** "Sunday service, Brampton", then "Total $650 · Zamaro fee
  $52 · payout $598" (L2-039).
- **Action:** one verb phrase, with the amount when money moves: "Pay $225
  deposit", "Message", "Leave a review". **Time left** leads with the number: "1
  day left · reply by Sat 10 Oct, 3:15 p.m.".
- Data values (names, numbers, dates, amounts, distances, message) come from the
  API formatted by the API library's formatting service; copy ("Paid", "quoted",
  "you get", "left", "reply by", the list labels) comes from the catalogue
  through the page (L2-111). French runs about 30 % longer; meta and captions
  wrap.

## Performance

- Change detection: `OnPush`, signal inputs on all three components. The row's
  only computed values are the heading tag and whether the amount renders. No
  subscriptions, no `effect`.
- Perf-test scenarios:
  - `frontend/projects/perf-test/src/scenarios/BookingList.ts` renders Naomi's
    three upcoming bookings (Marcus Bell Trio Confirmed + "Message", Abigail
    Mensah Requested + "Message", Luz Viva Accepted + "Pay $225 deposit").
  - `RequestsInboxRow.ts`, the "requests inbox row" composite from AGENTS.md,
    renders one row of Abigail's inbox: Harvest Point Church, Sat 5 Dec, three
    meta lines with the message preview, "Requested" stamp and "1 day left ·
    reply by Sat 10 Oct, 3:15 p.m.".
  - `BookingListSkeleton.ts` renders three skeleton rows of Your bookings.
  - All are tuned in `e2e/perf-test/config/scenario-iterations.mjs` to roughly
    100–300 ms; `DarkTheme.ts` includes the list.
- Regression rule: a change to the template, inputs, styles or change detection
  runs the perf test against the base branch with `--fail-on-regression` before
  it is pushed.
- Layout stability: the skeleton row has the same frame, grid, padding and
  heights as a loaded row of the same variant (date block 48 px, title, text
  lines, amount 96 × 32 px, stamp 96 × 24 px), so the swap shifts nothing
  (L2-105).
- Imports: `RouterLink`, `NgTemplateOutlet`, `zm-skeleton`. Stamps, badges and
  buttons arrive through the slot.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi's upcoming bookings, when the list renders, then it is an `<ol class="booking-list" role="list">` named "Upcoming bookings" with one row per booking, and Marcus Bell Trio's row shows "Sun" over "25 Oct", the `h2` link "Marcus Bell Trio", the meta "ZAM-0097 · Sunday service · 10:30 a.m. · Hamilton, 14 km · Paid $237.50", the stamp "Confirmed" and a "Message" button. (L2-033)
- **AC-2** Given Luz Viva's Accepted booking, when its row renders, then the status line holds the "Accepted" stamp and one small primary "Pay $225 deposit" button, and no other action. (L2-033)
- **AC-3** Given a row linked to `/bookings/ZAM-0097`, when the booker activates anywhere on the row outside the action button, then they open `/bookings/ZAM-0097`; activating "Message" opens `/bookings/ZAM-0097#messages` instead. (L2-033)
- **AC-4** Given Abigail's New requests, when Harvest Point Church's row renders, then it shows the `h3` "Harvest Point Church", the meta lines "Worship night · 7:00 p.m. · Milton, 31 km" and "$650 quoted · you get $598", the message preview in a `<q>`, the "Requested" stamp and "1 day left · reply by Sat 10 Oct, 3:15 p.m.", and no amount element. (L2-034)
- **AC-5** Given Abigail's Paid out list, when St. Brendan's Anglican's row renders, then the meta reads "Sunday service, Oshawa" and "Total $650 · Zamaro fee $52 · payout $598" and the status holds the badge "Paid Tue 15 Sep". (L2-039)
- **AC-6** Given a row with `amount` "$237.50" and `amountLabel` "Paid" at MD, when it renders, then `.booking-list__amount` shows "Paid" over "$237.50" in tabular figures and is `aria-hidden="true"`; with `amount` null the element is absent. (L2-033)
- **AC-7** Given Naomi's past bookings, when Abigail Mensah's Completed row renders with the caption "Reviewed ★★★★★", then the caption is an image named "You reviewed it: 5 out of 5". (L2-102)

### States

- **AC-8** Given a pointer over a row, when it hovers, then the row lifts by `--transform-lift` with `--shadow-1`. (L2-033)
- **AC-9** Given Your bookings while loading, when the list renders, then it has `.booking-list--loading`, holds three `aria-hidden` skeleton rows with date, title, text, amount and stamp blocks, and the rows do not lift on hover. (L2-105)
- **AC-10** Given three skeleton rows replaced by Naomi's three bookings at 360 px and 1280 px, when the swap is measured, then the cumulative layout shift is 0.05 or less. (L2-105)
- **AC-11** Given the requests inbox while loading, when the skeleton rows render with `metaLines` 2 and `status` "badge", then each has two meta lines, a badge block and a caption line, and no amount block. (L2-105)

### Keyboard and focus

- **AC-12** Given Naomi's upcoming list, when she tabs from the first row, then focus moves to "Marcus Bell Trio", then "Message", then "Abigail Mensah", and never to a stamp. (L2-101)
- **AC-13** Given focus on a row's name link, when it is focused, then the link shows the two-tone focus ring and the row lifts as on hover, and the ring is not clipped. (L2-101)

### Screen readers

- **AC-14** Given Your bookings, when it is read by a screen reader, then each row is read as date, name, meta, status and action, the amount is read once (from the meta), and the list is announced as a list of 3 items named "Upcoming bookings". (L2-102)
- **AC-15** Given a page of rows, when a screen reader lists headings, then each row contributes one heading at its `headingLevel`, named after the other party. (L2-102)
- **AC-16** Given Your bookings and the requests inbox in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the dark theme, when a row renders, then it is `--color-bg-surface` charcoal with a `--color-border-strong` paper frame, and its hover shadow is yellow (`--color-shadow`). (L2-104)
- **AC-18** Given both themes, when contrast is measured, then name, date and amount are at least 4.5:1 on the row, meta and weekday at least 4.5:1, and the frame at least 3:1 against the row and the page. (L2-103)

### Responsive

- **AC-19** Given a 360 px viewport, when Marcus Bell Trio's row renders, then the date spans the first two lines on the left, the name and meta stack on the right, the amount is hidden, and the status line runs full width with the stamp left and "Message" right. (L2-096)
- **AC-20** Given a 768 px viewport, when the row renders, then it shows four columns (date, who and meta, amount, status) with the status aligned to the end; a request row without an amount shows three. (L2-096)
- **AC-21** Given a 320 px viewport and "Grace Tabernacle Mass Choir", when the row renders, then the name wraps inside its column, nothing is clipped or truncated, and the page does not scroll horizontally. (L2-096)
- **AC-22** Given the French catalogue, when a row's stamp and action are about 30 % longer at 360 px, then the action wraps under the stamp and nothing overlaps. (L2-111)

### Motion

- **AC-23** Given `prefers-reduced-motion: reduce`, when a row is hovered or focused, then it moves to its lifted position without a transition. (L2-103)

### Formatting

- **AC-24** Given a booking on Sun 25 Oct 2027 shown on Fri 9 Oct 2026, when its row renders with the formatted date at 320 px, then the date reads "25 Oct 2027" under "Sun", "25 Oct" stays together on one line and the year takes the next line, inside the date column. (L2-110)

### Performance

- **AC-25** Given the `BookingList`, `RequestsInboxRow` and `BookingListSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The booking list is planned. To build it:

- Folder `frontend/projects/components/src/lib/booking-list/`; files
  `booking-list.ts` (`BookingList`, `zm-booking-list`), `booking-list-row.ts`
  (`BookingListRow`, `zm-booking-list-row`) and `booking-list-row-skeleton.ts`
  (`BookingListRowSkeleton`, `zm-booking-list-row-skeleton`); export all three.
- `zm-booking-list`: one `<ng-template #items><ng-content /></ng-template>`
  rendered with `ngTemplateOutlet` inside `@if (ordered()) { <ol …> } @else {
  <ul …> }`, so the slot is declared once. The list styles (`.booking-list`)
  sit in this component; `li` gets `display: block`.
- `zm-booking-list-row`: host class `booking-list__row` and the row grid,
  frame and lift in `:host` styles; the name with one `@switch` on 2 and 3,
  the link inside each branch with no `ng-content`; meta lines with `@for` and
  `<br>` between them; the status `<div>` holds the only `ng-content`.
- The stretched link: `.booking-list__who a::after { position: absolute; inset:
  0 }` on the host's positioning context. Do not set `overflow: hidden`.
- The skeleton composes `zm-skeleton` with the skeleton CRD's `date`, `title`,
  `text`, `amount`, `stamp` and `badge` shapes and its width modifiers; its host
  is `aria-hidden="true"` and carries `booking-list__row`. Drop the mocks'
  inline `margin-top` spacing in favour of the meta's own line gap.
- Add the perf-test scenarios `BookingList.ts`, `RequestsInboxRow.ts` and
  `BookingListSkeleton.ts`, export them from `scenarios/index.ts`, and add the
  list to `DarkTheme.ts`.

## Decisions

- **D-1** *Does the list render its own `<li>` elements?* No. The page writes each `<li>` and puts a row in it, as the [ticket](ticket.md) does in the lineup, so the page owns iteration and tracking. The list component still renders the `<ol>`/`<ul>`, its role and name, because those belong to the design-system block `.booking-list`.
- **D-2** *Where do the row's classes go?* On the row host inside a plain `<li>`, as the ticket does. The design-system markup puts `.booking-list__row` on the `<li>`; keeping it on the host lets the host be the grid and the stretched link's positioning context.
- **D-3** *How do the different status lines fit one API?* One slot. Bookings need a stamp plus a button or caption, requests a stamp plus a caption, earnings a badge alone; a slot covers all of them without a variant per screen, and the design system limits it to one action.
- **D-4** *How is the meta passed?* As an array of formatted lines plus an optional `message`. The mocks show one to three lines and the message needs a `<q>`; strings keep the API free of HTML and every value translatable.
- **D-5** *Are the stamp and caption raised above the stretched link, as the design-system CSS raises `.booking-list .stamp`?* No. Only interactive parts need to sit above the link; a raised stamp or caption is a spot where a click does nothing. The button raises itself (button CRD). See the stamp CRD, D-4.
- **D-6** *One skeleton shape or several?* One component with three inputs. The mocks draw two loading shapes (Your bookings with an amount and a stamp; artist lists with two meta lines, a badge-shaped block and a caption line); `amount`, `metaLines` and `status` build both, and each matches its loaded variant so the swap does not shift (L2-105).
- **D-7** *Which heading level by default?* 2, as on Your bookings, where the rows sit directly under the page `h1`. Artist lists sit under a tab panel or section heading and pass 3.
- **D-8** *Must the list have a name?* Yes, `label` or `labelledBy`. The requests mock names its lists only by the visually hidden heading before them; `labelledBy` points the list at that heading, so every list on the product has a name.
- **D-9** *What happens to a date with a year in the 5.5 rem column?* The year wraps onto its own line under "25 Oct". The 320 px rendering shows "25 Oct 2027" in the display face does not fit the column on one line; widening the column for a rare case would squeeze every name, so the day and month are kept together with a no-break space and the year wraps (the page formats the string with that space).
