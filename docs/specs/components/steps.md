# Steps

| Field | Value |
|---|---|
| Selector | `zm-steps`, `zm-stepper`, `zm-timeline`, `zm-timeline-skeleton` |
| Library path | `frontend/projects/components/src/lib/steps/` |
| Status | planned |
| Traces to | L2-001, L2-029, L2-047, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111, L2-112 |
| Design system | [`steps.html`](../../design-system/components/steps.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/apply/step-2`](../../mocks/pages/apply/step-2.html), [`pages/apply/invalid`](../../mocks/pages/apply/invalid.html), [`pages/apply/outside-area`](../../mocks/pages/apply/outside-area.html), [`pages/apply/success`](../../mocks/pages/apply/success.html), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html), [`pages/booking-detail/declined`](../../mocks/pages/booking-detail/declined.html), [`pages/booking-detail/loading`](../../mocks/pages/booking-detail/loading.html), [`pages/request-detail/accepted`](../../mocks/pages/request-detail/accepted.html), [`pages/admin-booking/default`](../../mocks/pages/admin-booking/default.html), [`pages/book/success`](../../mocks/pages/book/success.html), [`pages/earnings/setup`](../../mocks/pages/earnings/setup.html), [`dialogs/cancel-booking/default`](../../mocks/dialogs/cancel-booking/default.html) |
| Rendering | [`steps.html`](steps.html) |

## Purpose and scope

The steps page defines three numbered sequences that read like the running
order on a set list. **Steps** (`zm-steps`) are three to five framed panels:
on Discover they explain how booking works ("Pick your date", "Send a request",
"Lock it in"); as a progress list they say how far one request has got, with
"Done", "Now" and "Next" in words. The **stepper** (`zm-stepper`) is the row of
numbered stubs at the top of the four-page artist application ("About you",
"Your music", "Price and travel", "References and review"). The **timeline**
(`zm-timeline`) is the vertical itinerary of one booking or application:
numbered stops joined by a dashed line, each with a title and a dated meta line.
`zm-timeline-skeleton` holds a timeline's place while the booking loads.

None of the three is navigation, except that the stepper's completed and
invalid steps link back to their page. Use something else when:

- the stages must be switched between freely → [tabs](tabs.md);
- the progress is time-based or a percentage → [progress bar](progress-bar.md);
- a long or branching form needs sections → [form layout](form-layout.md);
- the item is the status of one booking in a list → [badge](badge.md) or [stamp](stamp.md).

Out of scope:

- The section, panel or dialog around them, and its heading ("How booking
  works", "Where it stands", "Status history", "After you apply"). The page
  owns it and gives the timeline the heading's ID to be labelled by.
- Deciding the stops, their states and their copy. The booking or application
  page maps the booking history (L2-029) to stops and passes formatted strings.
- Formatting dates, times and money. The page passes "Fri 9 Oct at 10:15 a.m."
  and "$162.50" already formatted.
- The apply form's validation and error summary. The page decides which step is
  invalid; the stepper only shows it.
- The page-level loading status line ("Loading booking ZAM-0114") and
  `aria-busy` on the region.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/*` (default, loading, empty, error, invalid, limited) "How booking works", and behind `dialogs/menu`, `dialogs/account-menu`, `notifications/saved-toast`, `notifications/system-banner` | `zm-steps`, 3 items, `h3` titles, no status | "Pick your date" / "You only see artists who are free that day and will drive to you."; "Send a request" / "Tell them about your church and the songs you love. Nothing is charged yet."; "Lock it in" / "When they accept, pay a 25% deposit. The rest is due after the event." | upcoming (all) | canvas section, panels on surface |
| Design system, progress | `zm-steps`, 3 items with status, `label` "Your request to Abigail Mensah" | "Done" / "Pick your date" / "Sat 14 Nov, Worship night at Riverside Community Church."; "Now" / "Send a request"; "Next" / "Lock it in" / "When she accepts, pay the 25% deposit: $162.50." | complete, current, upcoming | canvas |
| Design system, narrow column or dialog | `zm-steps` `vertical` | short descriptions | any | canvas, sidebar |
| `pages/apply/default` | `zm-stepper`, `label` "Application steps", step 1 current | four titles, no links | current, upcoming | canvas |
| `pages/apply/step-2`, `step-3`, `step-4`, `submitting`, `error` | earlier steps done and linked back | "About you" → link named "About you, done" | done (link), current, upcoming | canvas |
| `pages/apply/invalid` | steps 1–3 done and linked; step 4 current and invalid | "References and review" | done, current + invalid | canvas |
| `pages/apply/outside-area` | step 1 current and invalid; steps 2–4 done and linked | "About you" | current + invalid, done | canvas |
| Design system, invalid not current | done, invalid (linked "Your music, needs fixing"), done, current | — | invalid link | canvas |
| `pages/apply/success` | every step done, none linked, visually hidden ", done" | — | done (static) | canvas |
| `pages/booking-detail/default`, `accepted`, `confirmed`, `balance-due`, `completed` (booker, ZAM-0114) | `zm-timeline` in the "Where it stands" panel, 5 stops | "Requested" / "Fri 9 Oct at 10:15 a.m.", "Accepted" / "Waiting for Abigail. She replies by Mon 12 Oct, 10:15 a.m.", "Confirmed" / "When you pay the $162.50 deposit", "Event", "Completed" | done, current, upcoming | panel (surface) |
| `pages/booking-detail/declined`, `withdrawn`, `expired`, `deposit-expired`, `cancelled`, `artist-cancelled`, `held`, `balance-failed` | `zm-timeline` with one danger stop; later stops upcoming, some with no meta | "Declined" / "Fri 9 Oct at 1:40 p.m. Her reason: I'm not free that day."; "Completed" (no meta) | done, danger, upcoming | panel |
| `pages/booking-detail/loading` | `zm-timeline-skeleton` in the panel | — | loading | panel |
| `pages/request-detail/*` (artist, ZAM-0114) | `zm-timeline`, up to 6 stops | "Request sent", "You accepted", "Deposit $162.50" / "Due by Sun 11 Oct, 2:40 p.m.", "Worship night", "Balance $487.50", "Payout $598"; "Riverside cancelled" (danger) | done, current, danger, upcoming | panel |
| `pages/admin-booking/default`, `held` ("Status history", ZAM-0097, ZAM-0104) | `zm-timeline`, 4–5 stops | "Deposit $237.50 paid Tue 29 Sep, Visa ending 4242"; "Held" | done, current, danger | panel |
| `pages/book/success` ("Request sent to Abigail") | `zm-timeline`, 4 stops | "Requested" / "Today, Fri 9 Oct at 10:15 a.m.", "Abigail replies", "Pay the $162.50 deposit", "Worship night" | done, current, upcoming | raised panel |
| `pages/apply/default`, `step-2` ("After you apply") | `zm-timeline`, 4 stops, all upcoming | "We check your references" / "Two short calls to people who've seen you lead." | upcoming (all) | canvas |
| `pages/apply/success` ("What happens next") | `zm-timeline`, 4 stops | "Submitted" / "Confirmation emailed to tobi@tobiadeyemi.ca." | done, current, upcoming | panel |
| `pages/earnings/setup` ("Set up payouts") | `zm-timeline`, 3 stops | "Application approved", "Set up payouts", "Profile goes live" | done, current, upcoming | panel |
| Dialogs over a booking: `cancel-booking` (default, late, busy…), `artist-cancel-booking`, `pay-deposit`, `pay-balance`, `withdraw-request`, `report-problem`, `write-review`, `issue-refund`, `resolve-hold`; `notifications/booking-toast` | the page's timeline, inert behind the dialog or toast | as the booking state | as above, inert | panel behind a scrim |

## Anatomy

**Steps** (`zm-steps`)

1. **List** — `ol.steps`: one 2 px `--color-border-strong` frame, CSS counter `step`.
2. **Panel** — `ol.steps > li`: paper surface, padding `--space-8`, a two-column grid (number, text) with gap `--space-5`.
3. **Number** — `li::before`: `counter(step, decimal-leading-zero)` ("01"), `--text-figure-lg` on a yellow block with a 2 px `--color-border-on-accent` rule. Never typed into the copy.
4. **Text** — `li > div`: holds the status overline, the title and the description.
5. **Status (optional)** — `p.overline` ("Done", "Now", "Next"); `.text-muted` unless the step is current.
6. **Title** — an `h3` (or `headingLevel`) in `--text-h4`, uppercase.
7. **Description (optional)** — a `p` in body text.
8. **Divider** — 2 px rule between panels: on top when stacked, on the left when side by side.
9. **Current bar** — `li[aria-current="step"]`: an inset 4 px `--color-accent` bar along the panel's bottom.

**Stepper** (`zm-stepper`)

1. **List** — `ol.stepper[aria-label]`: a one-line flex row, gap `--space-2`, counter `st`, scrolls horizontally inside itself with no visible scrollbar.
2. **Step** — `li.stepper__step`: a stub with a 2 px frame, `--target-comfortable` high, `--text-stub` uppercase, never wraps.
3. **Number** — `::before`: the counter in the display face, or "✓" when done.
4. **Link (optional)** — `.stepper__step > a`: done and invalid steps that are not current link back to their page.
5. **Status text** — `.visually-hidden` ", done" or ", needs fixing" when the step is not a link; the link's `aria-label` when it is.

**Timeline** (`zm-timeline`)

1. **List** — `ol.timeline`: one column, counter `stop`.
2. **Stop** — `ol.timeline > li`: grid of a 2.25 rem number column and the text, gap `--space-3`, block padding `--space-3`; muted text unless done or current.
3. **Number** — `li::before`: a 2.25 rem square with the counter in the display face and a 2 px frame.
4. **Connector** — `li::after`: a 2 px dashed `--color-border-default` line from this number to the next; none after the last stop.
5. **Status text** — `.visually-hidden` prefix inside the title for done and danger stops.
6. **Title** — `p.timeline__title`: `--text-h4`, uppercase.
7. **Meta (optional)** — `p.timeline__meta`: `--text-body-sm`; not rendered when the stop has none.

Hosts: each host (`zm-steps`, `zm-stepper`, `zm-timeline`,
`zm-timeline-skeleton`) is `display: block` and renders its `<ol>` inside, so
list semantics stay on a native list. The `.steps`, `.stepper` and `.timeline`
classes go on the `<ol>`, not on the host.

## API

### Types

```ts
export type StepStatus = 'upcoming' | 'current' | 'complete';
export interface StepItem {
  title: string;          // "Pick your date"
  description?: string;   // "You only see artists who are free that day…"
  status?: StepStatus;    // default 'upcoming'
  statusLabel?: string;   // "Done" | "Now" | "Next", translated by the page
}

export interface StepperStep {
  title: string;                  // "About you"
  done?: boolean;                 // data-state="done"
  invalid?: boolean;              // data-state="invalid"; wins over done
  current?: boolean;              // aria-current="step"; at most one
  link?: string | unknown[];      // routerLink back to the step's page
}

export type TimelineState = 'upcoming' | 'done' | 'current' | 'danger';
export interface TimelineStop {
  title: string;          // "Requested"
  meta?: string;          // "Fri 9 Oct at 10:15 a.m.", already formatted
  state?: TimelineState;  // default 'upcoming'
}
```

### `zm-steps` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `items` | `StepItem[]` | — | yes | 3 to 5 items. One `li` per item, in order. |
| `vertical` | `boolean` (attribute) | `false` | no | Adds `.steps--vertical`: always stacked. |
| `label` | `string` | — | for a progress list | Sets `aria-label` on the `<ol>` ("Your request to Abigail Mensah"). Omitted for the explainer, which the section heading names. |
| `headingLevel` | `2 \| 3 \| 4` | `3` | no | The title's heading level, one below the section heading. |

Status rules: `complete` writes `data-status="complete"`; `current` writes
`aria-current="step"` on at most one item (the first one marked current; in dev
mode a second logs a console error naming the component). `statusLabel`
renders `<p class="overline">` before the title, with `.text-muted` unless the
item is current. When any item has a `status` other than `upcoming`, every item
must have a `statusLabel` (dev-mode console error otherwise), because the
number colour alone does not say which steps are done.

### `zm-stepper` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `steps` | `StepperStep[]` | — | yes | 2 to 6 steps (four on the application). |
| `label` | `string` | — | yes | `aria-label` on the `<ol>`: "Application steps". |
| `doneSuffix` | `string` | — | when a step is done | ", done": appended to the link's `aria-label`, or rendered visually hidden when the step has no link. |
| `invalidSuffix` | `string` | — | when a step is invalid | ", needs fixing": as `doneSuffix`. |

A step renders a link only when it has a `link` and is not `current`. An
`invalid` step writes `data-state="invalid"` even when it is also `current`;
otherwise a `done` step writes `data-state="done"`.

### `zm-timeline` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `stops` | `TimelineStop[]` | — | yes | 2 to 8 stops. One `li` per stop. |
| `labelledBy` | `string` | — | no | `aria-labelledby` on the `<ol>`: the ID of the panel or section heading ("progress-title" for "Where it stands"). |
| `doneLabel` | `string` | — | when a stop is done | Visually hidden prefix for done stops: "Done: ". |
| `dangerLabel` | `string` | — | when a stop is danger | Visually hidden prefix for danger stops: "Problem: ". |

`current` writes `aria-current="step"` on at most one stop; `done` and
`danger` write `data-state`. A stop without `meta` renders no
`.timeline__meta` element.

### `zm-timeline-skeleton` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `stops` | `number` | `5` | no | How many skeleton stops to draw; the page passes the stop count it expects (5 for a booker's booking, 6 for an artist's). |

### Outputs

None. Steps and timeline stops are not interactive; the stepper's links
navigate through `routerLink`.

### Content slots

None. Every string arrives in the item arrays, so each list renders from data
and SSR emits the whole list (L2-112). Each item's text is plain text; no
markup is projected into a step.

## Variants and sizes

| Variant | Selector and modifier | Use for |
|---|---|---|
| Explainer | `zm-steps`, `ol.steps` | A fixed, static sequence: "How booking works". |
| Progress | `zm-steps` with statuses and `label` | Where one request stands, with "Done", "Now", "Next". |
| Vertical | `.steps--vertical` | Steps in a narrow column (profile sidebar, dialog). |
| Stepper | `zm-stepper`, `ol.stepper` | Position in a multi-page form. |
| Timeline | `zm-timeline`, `ol.timeline` | The dated itinerary of a booking or application. |
| Timeline loading | `zm-timeline-skeleton` | A timeline that is still loading. |

Each has one size. Steps: panel padding `--space-8` and a `--text-figure-lg`
number; use `vertical`, never a smaller size, in narrow places. Stepper: steps
are `--target-comfortable` high and size to their text. Timeline: a 2.25 rem
number column; the list fills its panel.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Step upcoming | `status` `upcoming` | Yellow number block; "Next" muted when given | List item; "Next" read |
| Step current | `aria-current="step"` | 4 px yellow bar along the panel bottom; "Now" in default colour | "current step" |
| Step complete | `data-status="complete"` | Number block inverse (`--color-bg-inverse` / `--color-fg-inverse`) | Not announced; the visible "Done" says it |
| Stepper upcoming | — | Surface fill, muted label, ink number | List item |
| Stepper current | `aria-current="step"` | Yellow fill, ink label and frame | "current step" |
| Stepper done | `data-state="done"` | Ink fill (`--color-fg-default`), canvas label, "✓" | Link "About you, done", or text with hidden ", done" |
| Stepper invalid | `data-state="invalid"` | `--color-danger-border` frame, `--color-danger-fg` label | Link "Your music, needs fixing" |
| Stepper current and invalid | both | Yellow fill and ink label kept; danger frame | "About you, needs fixing, current step" |
| Stepper link hover | `:hover` on the link | Underline-free; the step keeps its colours and the cursor is a pointer | — |
| Stepper link focus | `:focus-visible` | Two-tone ring around the whole step | — |
| Stepper overflow | content wider than the row | Scrolls horizontally inside the `<ol>`, no visible scrollbar; current step in view | Every step still in the list |
| Timeline upcoming | — | Surface number, muted title and meta | List item |
| Timeline done | `data-state="done"` | Ink number (`--color-fg-default`) with canvas digits; default-colour text | "Done: Requested, Fri 9 Oct at 10:15 a.m." |
| Timeline current | `aria-current="step"` | Yellow number with ink rule; default-colour text | "current step" |
| Timeline danger | `data-state="danger"` | Default-colour title and meta; number in `--color-danger-bg` / `--color-danger-fg` with `--color-danger-border` | "Problem: Declined, …" |
| Timeline no meta | `meta` absent | Title only; the stop is shorter | — |
| Timeline loading | `zm-timeline-skeleton` | Same column, number squares and line heights as skeletons | `aria-hidden="true"`; the page announces the wait |
| Inert | an open dialog or toast region makes the page `inert` | Unchanged | Not reachable |

No step, stepper step or stop has a disabled or busy state; the explainer has
no loading or error state (static copy).

## Markup

Explainer (Discover):

```html
<zm-steps>
  <ol class="steps">
    <li><div><h3>Pick your date</h3><p>You only see artists who are free that day and will drive to you.</p></div></li>
    <li><div><h3>Send a request</h3><p>Tell them about your church and the songs you love. Nothing is charged yet.</p></div></li>
    <li><div><h3>Lock it in</h3><p>When they accept, pay a 25% deposit. The rest is due after the event.</p></div></li>
  </ol>
</zm-steps>
```

Progress (vertical adds `steps--vertical` to the `<ol>`):

```html
<zm-steps>
  <ol class="steps" aria-label="Your request to Abigail Mensah">
    <li data-status="complete"><div><p class="overline text-muted">Done</p><h3>Pick your date</h3><p>Sat 14 Nov, Worship night at Riverside Community Church.</p></div></li>
    <li aria-current="step"><div><p class="overline">Now</p><h3>Send a request</h3><p>Abigail has your request. She usually replies within 2 days.</p></div></li>
    <li><div><p class="overline text-muted">Next</p><h3>Lock it in</h3><p>When she accepts, pay the 25% deposit: $162.50.</p></div></li>
  </ol>
</zm-steps>
```

Stepper on `pages/apply/outside-area`:

```html
<zm-stepper>
  <ol class="stepper" aria-label="Application steps">
    <li class="stepper__step" aria-current="step" data-state="invalid">About you<span class="visually-hidden">, needs fixing</span></li>
    <li class="stepper__step" data-state="done"><a href="/artists/apply/music" aria-label="Your music, done">Your music</a></li>
    <li class="stepper__step" data-state="done"><a href="/artists/apply/price" aria-label="Price and travel, done">Price and travel</a></li>
    <li class="stepper__step" data-state="done"><a href="/artists/apply/references" aria-label="References and review, done">References and review</a></li>
  </ol>
</zm-stepper>
```

Done without a link (`pages/apply/success`):

```html
<li class="stepper__step" data-state="done">About you<span class="visually-hidden">, done</span></li>
```

Timeline (`pages/booking-detail/declined`):

```html
<zm-timeline>
  <ol class="timeline" aria-labelledby="progress-title">
    <li data-state="done"><div><p class="timeline__title"><span class="visually-hidden">Done: </span>Requested</p><p class="timeline__meta">Fri 9 Oct at 10:15 a.m.</p></div></li>
    <li data-state="danger"><div><p class="timeline__title"><span class="visually-hidden">Problem: </span>Declined</p><p class="timeline__meta">Fri 9 Oct at 1:40 p.m. Her reason: I’m not free that day.</p></div></li>
    <li><div><p class="timeline__title">Confirmed</p></div></li>
    <li><div><p class="timeline__title">Event</p><p class="timeline__meta">Sat 14 Nov at 7:00 p.m.</p></div></li>
    <li><div><p class="timeline__title">Completed</p></div></li>
  </ol>
</zm-timeline>
```

A current stop writes `aria-current="step"` on its `li` and no prefix.

Timeline loading:

```html
<zm-timeline-skeleton aria-hidden="true">
  <ol class="timeline timeline--loading">
    <li><div><span class="skeleton skeleton--text skeleton--short"></span><span class="skeleton skeleton--text skeleton--medium"></span></div></li>
    …one li per stop…
  </ol>
</zm-timeline-skeleton>
```

`.timeline--loading` is the one new modifier: its `li::before` takes the
skeleton fill with no counter text and no frame colour, so each skeleton stop
has the final stop's number square, padding and two-line height.

Consumer templates:

```html
<section id="how" class="section" aria-labelledby="how-title">
  …<h2 id="how-title">{{ 'discover.how.title' | transloco }}</h2>…
  <zm-steps [items]="howSteps()" />
</section>
```

```html
<zm-stepper [steps]="applySteps()" [label]="'apply.steps.label' | transloco"
  [doneSuffix]="'apply.steps.done' | transloco" [invalidSuffix]="'apply.steps.invalid' | transloco" />
```

```html
<section class="panel" aria-labelledby="progress-title">
  <div class="panel__head"><h2 id="progress-title" class="panel__title">{{ 'booking.progress.title' | transloco }}</h2>…</div>
  @if (booking(); as b) {
    <zm-timeline [stops]="b.stops" labelledBy="progress-title"
      [doneLabel]="'timeline.done' | transloco" [dangerLabel]="'timeline.problem' | transloco" />
  } @else {
    <zm-timeline-skeleton [stops]="5" />
  }
</section>
```

The `.steps`, `.stepper`, `.stepper__step`, `.timeline`, `.timeline__title` and
`.timeline__meta` classes and the `aria-current`, `data-status` and
`data-state` attributes are a contract: the e2e page objects find the current
step by `aria-current="step"` and read stops by class. The inner `<div>` of a
step or stop is structural and may not be removed.

## Design

Steps:

- `ol.steps`: grid, gap 0, frame `--border-width-thick` solid `--color-border-strong`.
- Panel: padding `--space-8` (`--space-5` under SM, D-13), `--color-bg-surface`, columns `auto minmax(0, 1fr)`, gap `--space-5`.
- Divider: `--border-width-thick` solid `--color-border-strong`, top when stacked, left from LG.
- Number: `--text-figure-lg`, `--line-height-tight`, padding `--space-1` `--space-2`, `--color-accent` fill, `--color-fg-on-accent` digits, `--border-width-thick` `--color-border-on-accent` rule, aligned to the top.
- Title: `--text-h4`, uppercase, margin below `--space-2`. Status overline: `--text-overline`.
- Current bar: inset box shadow of `--border-width-poster` in `--color-accent`.
- Complete number: `--color-bg-inverse` fill, `--color-fg-inverse` digits, `--color-bg-inverse` rule.

Stepper:

- Row: flex, gap `--space-2`, `overflow-x: auto`, `scrollbar-width: none`.
- Step: padding `--space-2` `--space-3`, gap `--space-2`, min height `--target-comfortable`, `--color-bg-surface`, `--color-fg-muted`, frame `--border-width-thick` `--color-border-strong`, `--text-stub`, uppercase, `white-space: nowrap`.
- Number: display face at `--font-size-xl`, `--color-fg-default`.
- Current: `--color-accent` fill, `--color-fg-on-accent` text and frame. Done: `--color-fg-default` fill and frame, `--color-bg-canvas` text, "✓". Invalid: `--color-danger-border` frame, `--color-danger-fg` text; when also current, the text stays `--color-fg-on-accent` (D-6).
- Link: inherits colour, no underline; its `::after` covers the whole step (`position: absolute; inset: 0` on a `position: relative` step), so the target is the step (D-5).
- Host: `display: block; min-width: 0; max-width: 100%`, so the row scrolls inside a flex or grid parent instead of widening it (D-14).

Timeline:

- Stop: grid `2.25rem minmax(0, 1fr)`, gap `--space-3`, padding-block `--space-3`, `--color-fg-muted`.
- Number: 2.25 rem square, display face `--font-size-xl`, `--color-bg-surface` fill, `--color-fg-default` digits, `--border-width-thick` `--color-border-strong` frame.
- Connector: `--border-width-thick` dashed `--color-border-default`.
- Done: text `--color-fg-default`; number `--color-fg-default` fill and frame, `--color-bg-canvas` digits.
- Current: text `--color-fg-default`; number `--color-accent` fill, `--color-fg-on-accent` digits and frame.
- Danger: text `--color-fg-default` (D-12); number `--color-danger-bg` fill, `--color-danger-fg` digits, `--color-danger-border` frame.
- Title `--text-h4` uppercase; meta `--text-body-sm`.

No motion anywhere. No component tokens: the three blocks read semantic tokens
directly, and a surface re-skins them by overriding semantic tokens on an
ancestor (steps design-system page, Theming).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Steps panel, stepper and timeline number fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Frames and dividers | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Number block, current bar, current step and stop | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Digits and text on yellow | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Number rule on yellow | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Complete step number | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Done stepper step and timeline stop | `--color-fg-default` / `--color-bg-canvas` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-900` |
| Titles, descriptions | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| "Done", "Next", upcoming stepper and stop text | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Connector | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Invalid step, danger stop | `--color-danger-fg` / `--color-danger-border` / `--color-danger-bg` | `--palette-red-700` / `--palette-red-600` / `--palette-red-50` | `--palette-red-300` / `--palette-red-300` / `--palette-red-950` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Step number, current stepper label, current stop digits |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Complete step number |
| `--color-bg-canvas` | `--color-fg-default` | 4.5:1 | Done stepper label, done stop digits |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Titles, descriptions, upcoming numbers |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | "Done", "Next", upcoming stepper labels |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Upcoming stop title and meta on the canvas |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Invalid stepper label |
| `--color-danger-fg` | `--color-danger-bg` | 4.5:1 | Danger stop digits |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Frames, dividers, stop numbers |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Ring on a stepper step |

The yellow current bar is about 1.4:1 against paper, so it is emphasis only:
"Now" and `aria-current` carry the meaning (steps design-system page). The
dashed connector is decorative and exempt. In forced colours the frames and
connector follow `CanvasText`, and the current step keeps its `aria-current`
and "Now" text.

## Responsive behaviour

- **Steps, XS (< 576 px)**: panels stack and their padding drops to `--space-5`, so at 320 px the description column keeps about 175 px instead of 151 px (D-13).
- **Steps, SM–MD (576–991 px)**: panels stack full width with horizontal rules between them.
- **Steps, LG and up (≥ 992 px)**: three equal columns (`repeat(3, minmax(0, 1fr))`) with vertical rules. Four or five steps also share the row (D-8).
- `vertical` ignores the breakpoint and always stacks. The number stays left of the text at every width.
- **Stepper**: one line at every width. When the steps are wider than the row it scrolls horizontally inside the `<ol>` with no visible scrollbar, and on render the current step is scrolled into view inside the row, never scrolling the page (D-7). At 360 px "References and review" is partly off the row and reachable by swipe or by Tab.
- **Timeline**: one column at every width; long meta lines wrap under their title.
- Titles and descriptions wrap and never truncate. At 320 px nothing scrolls the page horizontally or clips; at 200 % zoom every step and stop stays readable and the stepper still scrolls.
- Stepper steps are at least 44 px high and their link covers the whole step, so every target is at least 44 × 44 CSS px.

## Accessibility

### Role and pattern

Native `<ol>` lists: screen readers announce "list, 3 items" and each position,
so the CSS number adds nothing for them. Steps titles are headings one level
below the section heading. The progress list and the stepper carry an
`aria-label`; the timeline is labelled by its panel heading through
`aria-labelledby`. `aria-current="step"` marks the one current step or stop.
No APG widget pattern applies: the lists are static content, and the stepper's
links are ordinary links.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Skips steps and the timeline. In the stepper, stops only on linked (done or invalid) steps, in order; focusing a step outside the visible row scrolls it into view. |
| <kbd>Enter</kbd> | On a stepper link: goes back to that step's page. |

### Focus

Steps and the timeline are never focusable. A stepper link shows the two-tone
ring (`--focus-ring-width`, `--focus-ring-offset`) around the whole step; the
row's `overflow-x: auto` must not clip it, so the row has block padding of at
least the ring width plus offset.

### Labelling

- Progress steps show "Done", "Now" or "Next" as text because `data-status` is
  not exposed; "Now" matches the announced "current step".
- Stepper links are named "{title}, done" or "{title}, needs fixing". The name
  starts with the visible title (WCAG 2.5.3). A step without a link carries the
  same suffix as visually hidden text.
- Timeline done and danger stops start their title with the visually hidden
  `doneLabel` ("Done: ") or `dangerLabel` ("Problem: "), because their colour
  is not announced (D-3).

### Announcements

None. When a booking moves to its next status the page re-renders the timeline;
the page's own toast or status message announces the change.

### Motion

Nothing animates. Scrolling the current stepper step into view is instant at
every motion preference; the current bar never slides between steps.

## Content and internationalisation

- **Steps titles**: two or three words, imperative, in the booker's voice: "Pick your date", "Send a request", "Lock it in". Never "Step 1:"; the list numbers itself.
- **Descriptions**: one or two short sentences with the reassuring detail: "Nothing is charged yet.". In progress, this booking's facts: "Sat 14 Nov, Worship night at Riverside Community Church.", "pay the 25% deposit: $162.50".
- **Status words**: "Done", "Now", "Next".
- **Stepper**: the page titles of the application: "About you", "Your music", "Price and travel", "References and review"; suffixes ", done" and ", needs fixing".
- **Timeline titles**: the status or the event, one to four words: "Requested", "Accepted", "Confirmed", "Declined", "Deposit $162.50", "Worship night", "Riverside cancelled". **Meta**: the date and time or deadline, in L2-110 formats: "Fri 9 Oct at 10:15 a.m.", "Due by Sun 11 Oct, 2:40 p.m.", "$487.50 balance charged Mon 16 Nov, 7:00 p.m.".
- Translatable inputs: `label`, `doneSuffix`, `invalidSuffix`, `doneLabel`, `dangerLabel`, and every `title`, `description`, `statusLabel` and `meta` the page builds from the catalogue (L2-111). Data values inside them (names, dates, amounts, card endings) are formatted by the API library's format service before they reach the component.
- French runs about 30 % longer: steps titles and stop meta wrap; stepper labels stay on one line and the row scrolls.

## Performance

- Change detection: `OnPush`, signal inputs. `computed` holds the current index, the stepper's link decision per step and the class and attribute maps; templates call no methods. `@for` tracks by index (the lists are fixed and short).
- The stepper's scroll-into-view runs once in `afterNextRender` and only in the browser; SSR renders the plain list.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Steps.ts` renders "How booking works" (three items, as on Discover); `Stepper.ts` renders `pages/apply/outside-area` (About you current and invalid, three done links); `Timeline.ts` renders ZAM-0114's declined timeline (five stops, one danger, two without meta). Add `TimelineSkeleton.ts` with five stops. Export each from `scenarios/index.ts` and tune iterations in `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios: `DarkTheme` gains a timeline once the booking screens exist.
- Layout stability: `zm-timeline-skeleton` draws the same number column, padding and two-line stop height as a stop with meta, so the swap shifts nothing (L2-105). Steps and the stepper are static and server-rendered.
- Imports: `RouterLink` in `zm-stepper`, `zm-skeleton` in `zm-timeline-skeleton`; nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given the "How booking works" items "Pick your date", "Send a request" and "Lock it in" with their descriptions, when `zm-steps` renders, then it is an `ol.steps` of three `li`, each with an `h3` title and a description, numbered "01", "02" and "03" by the CSS counter, with no status overline and no `aria-current`, and a screen reader announces a list of three items. (L2-102)
- **AC-2** Given Discover requested by a crawler, when the server response arrives, then the three step titles and descriptions are in the server-rendered HTML. (L2-112)
- **AC-3** Given a progress list labelled "Your request to Abigail Mensah" with statuses complete, current and upcoming and labels "Done", "Now" and "Next", when it renders, then the first `li` has `data-status="complete"` and an inverse number, the second has `aria-current="step"` and the yellow bar, each shows its status word as an overline, and the `<ol>` is named "Your request to Abigail Mensah". (L2-102)
- **AC-4** Given `headingLevel` 4, when steps render, then each title is an `h4`; with the default, an `h3`. (L2-102)
- **AC-5** Given `pages/apply/step-2`, when the stepper renders with "About you" done and linked and "Your music" current, then the list is named "Application steps", "About you" is a link named "About you, done" with `data-state="done"` and a "✓", "Your music" has `aria-current="step"` and no link, and the last two steps are plain upcoming text. (L2-047)
- **AC-6** Given `pages/apply/success` with every step done and none linked, when the stepper renders, then each step has `data-state="done"`, contains no link, and its text reads "{title}, done" with ", done" visually hidden. (L2-047)
- **AC-7** Given a submit rejected with "References must be someone other than you.", when the stepper renders "References and review" as current and invalid, then that step has `aria-current="step"` and `data-state="invalid"`, keeps the yellow fill with an ink label and a `--color-danger-border` frame, and reads "References and review, needs fixing". (L2-047)
- **AC-8** Given an applicant whose base city is outside the service area, when the stepper renders "About you" invalid and current and the later steps done, then "About you" reads "About you, needs fixing" and each done step links back with the name "{title}, done". (L2-001)
- **AC-9** Given a step that is invalid but not current, when the stepper renders, then it links to its page with the name "Your music, needs fixing" and shows the danger frame and label. (L2-047)
- **AC-10** Given ZAM-0114 waiting for Abigail, when the timeline renders "Requested" done, "Accepted" current with "Waiting for Abigail. She replies by Mon 12 Oct, 10:15 a.m." and three upcoming stops, then the first `li` has `data-state="done"`, the second `aria-current="step"`, the rest neither, and each stop shows its title and meta. (L2-029)
- **AC-11** Given a declined booking, when the timeline renders, then the "Declined" stop has `data-state="danger"` and the danger number colours, and the later stops "Confirmed" and "Completed", which have no meta, render a title and no `.timeline__meta` element. (L2-029)
- **AC-31** Given the "declined" and "artist-cancelled" timelines, when they render, then the "Declined" and "Cancelled" stops' titles and meta are `--color-fg-default`, as for done stops, and only the number square uses the danger colours. (L2-029)
- **AC-12** Given meta already formatted as "Sat 14 Nov at 7:00 p.m." and "Pay $162.50 by Sun 11 Oct, 2:40 p.m. or the request expires.", when the timeline renders, then the text appears exactly as passed. (L2-110)

### States

- **AC-13** Given two items marked current, when steps or a timeline render, then only the first carries `aria-current="step"` and a dev-mode console error names the component. (L2-102)
- **AC-14** Given `pages/booking-detail/loading`, when `zm-timeline-skeleton` with five stops is replaced by the five-stop timeline, then the cumulative layout shift from the swap is 0.05 or less and the skeleton is `aria-hidden="true"`. (L2-105)

### Keyboard and focus

- **AC-15** Given the stepper on `pages/apply/outside-area`, when the applicant tabs through it, then focus stops on "Your music", "Price and travel" and "References and review" only, each shows the two-tone ring around the whole step without clipping, and Enter opens that step's page. (L2-101)
- **AC-16** Given steps and a timeline, when the person tabs through the page, then no step, panel or stop receives focus. (L2-101)

### Screen readers

- **AC-17** Given the declined timeline labelled by "Where it stands", when a screen reader reads it, then it announces the list as "Where it stands", the first stop as "Done: Requested, Fri 9 Oct at 10:15 a.m." and the second as "Problem: Declined, …". (L2-102)
- **AC-18** Given every route that renders steps, a stepper or a timeline, in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme, when steps, the stepper and a timeline render, then step numbers stay yellow with ink digits, a complete step number is paper on charcoal (`--color-bg-inverse`), and a done stop and done stepper step use `--color-fg-default` with `--color-bg-canvas` text. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then step numbers, titles, descriptions, status words, stepper labels in every state and stop digits are at least 4.5:1, and frames, dividers and the stepper focus ring at least 3:1. (L2-103)

### Responsive

- **AC-21** Given an MD viewport (768 px), when the explainer renders, then the three panels stack with horizontal rules; at LG (992 px) and wider they sit in three equal columns with vertical rules. (L2-096)
- **AC-22** Given `vertical` steps at 1280 px, when they render, then they stay stacked. (L2-096)
- **AC-23** Given a 360 px viewport on `pages/apply/step-4`, when the stepper renders, then it stays on one line, scrolls inside itself with no page-level horizontal scroll, and "References and review" (current) is fully inside the visible row. (L2-096)
- **AC-24** Given a 320 px viewport, when the explainer and the "artist-cancelled" timeline render, then descriptions and the meta "Abigail cancelled Fri 9 Oct at 4:30 p.m. Everything you paid is refunded." wrap within their columns, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-25** Given a touch device, when a linked stepper step is measured, then its target is the whole step and at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given text zoomed to 200 %, when steps, the stepper and a timeline render, then every title, description and meta stays readable and every stepper link stays reachable. (L2-096)
- **AC-27** Given the French catalogue, when titles and meta are about 30 % longer, then step titles and stop meta wrap without clipping and stepper labels stay on one line with the row scrolling. (L2-111)
- **AC-30** Given a 320 px viewport, when the "How booking works" explainer renders, then each panel's padding is `--space-5` (`--space-8` from SM), and "Tell them about your church and the songs you love." wraps in a description column of about 175 px rather than 151 px. (L2-096)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce` and a current step outside the stepper row, when the stepper renders, then the row jumps to the current step with no smooth scroll and nothing else animates. (L2-103)

### Performance

- **AC-29** Given the `Steps`, `Stepper`, `Timeline` and `TimelineSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build in `frontend/projects/components/src/lib/steps/`:

- `steps.ts` (`zm-steps`, class `Steps`), `stepper.ts` (`zm-stepper`, `Stepper`), `timeline.ts` (`zm-timeline`, `Timeline`), `timeline-skeleton.ts` (`zm-timeline-skeleton`, `TimelineSkeleton`), and `steps.types.ts` with `StepItem`, `StepStatus`, `StepperStep`, `TimelineStop` and `TimelineState`. Export all from `public-api.ts`.
- Port the `.steps`, `.stepper` and `.timeline` rules from `components.css` into each component's encapsulated styles; the classes stay on the `<ol>` and `li` for BEM parity.
- The steps title renders with one `@switch` on `headingLevel` (2, 3, 4); no `ng-content` is involved.
- Design-system CSS additions: `.timeline li[data-state="danger"] { color: var(--color-fg-default) }` (D-12), `@media (max-width: 35.99rem) { .steps > li { padding: var(--space-5) } }` (D-13), and for the stepper (D-5, D-6): `.stepper__step { position: relative }`, `.stepper__step a::after { content: ""; position: absolute; inset: 0 }`, `.stepper__step[aria-current="step"][data-state="invalid"] { color: var(--color-fg-on-accent) }`, and block padding on `.stepper` so focus rings are not clipped.
- Stepper scroll: in `afterNextRender`, set the row's `scrollLeft` so the current step's box is inside the row (no `scrollIntoView`, which can scroll the page). Also scroll a linked step into view on `focusin`.
- `.timeline--loading` (D-9) is new: add it to the design-system CSS when the skeleton lands.
- Composes `zm-skeleton` (skeleton CRD) for the timeline skeleton. Uses no CDK primitive.
- Add the four perf-test scenarios and export them from `scenarios/index.ts`.

## Decisions

- **D-1** *One component or three?* Three selectors in one folder (`zm-steps`, `zm-stepper`, `zm-timeline`) plus a skeleton. The design system documents them on one page because they share the counter and the "where am I" idea, but their markup, states and placement differ, and one input switching between them would leave most inputs unused per variant.
- **D-2** *Items array or child components per step?* Items arrays. Every step is plain text, the lists are short and fixed, and an array lets SSR render the whole list in one template (L2-112) and keeps one `@for` per list. Child components would add a host element inside each `li` and break the `ol > li` structure the CSS counter needs.
- **D-3** *How are done and danger timeline stops exposed to assistive technology?* A visually hidden prefix inside the title, from the component-level `doneLabel` ("Done: ") and `dangerLabel` ("Problem: ") inputs. `data-state` is not announced, the mocks carry no text for it, and the design system already requires words for the same reason on steps ("Done", "Next") and the stepper (", done"). Current stops rely on `aria-current="step"`, which is announced. Upcoming stops get no prefix. One label per state, set once per page, keeps each stop's data free of copy.
- **D-4** *Who sets the explainer's headings and the progress overline?* The page, through `items` and `headingLevel`. The explainer's titles are `h3` under the section `h2` ("How booking works") by default; the progress words "Done", "Now", "Next" are `statusLabel` strings from the catalogue, required whenever any step has a status, because the number colour alone does not say which steps are done.
- **D-5** *A stepper link is only as big as its text; is that enough?* No. The link's `::after` covers the whole step, so the target is the full 44 px stub (L2-096) and the ring wraps the step. The mocks put a bare `<a>` inside the `li`, which is about 20 px high; the rendering's forced focus shows the ring hugging only the text. The step is `position: relative` for a second reason the 360 px rendering proved: without it the visually hidden ", done" text is positioned against the page, not the scrolling row, and widens the page to about 500 px.
- **D-6** *Current and invalid together: yellow or danger?* Yellow fill with the ink label and the danger frame. The mock (`apply/outside-area`, `apply/invalid`) sets both attributes, and the existing CSS would draw `--color-danger-fg` text on yellow, which in the dark theme (`--palette-red-300` on `--palette-signal-500`) is far below 4.5:1 (L2-103). Keeping the ink label holds contrast; the danger frame, the hidden ", needs fixing" and the page's error summary carry the problem.
- **D-7** *How is the current step kept in view on phones?* The component sets the row's `scrollLeft` after the first render in the browser, instantly, so the page never scrolls and reduced motion is respected. The design system says "the current step is scrolled into view" without saying how; `scrollIntoView` would also scroll the page vertically.
- **D-8** *Four or five steps at LG?* They share the row in equal columns (`repeat(n, minmax(0, 1fr))`), as the design system says; the component sets the column count from `items.length`, so the CSS does not hard-code three.
- **D-9** *What does a loading timeline look like?* `zm-timeline-skeleton`: the real `.timeline` grid with skeleton number squares and two skeleton lines per stop. The `booking-detail/loading` mock draws the panel with plain `skeleton--control-sm` bars, whose height differs from a stop's, so the swap would shift the page (L2-105). The skeleton keeps the mock's idea (one bar group per stop) at the stop's real size.
- **D-10** *Is the timeline labelled?* Yes, by the panel heading through `labelledBy`. The mocks leave it unlabelled; a labelled list tells a screen reader user which itinerary they are in when a dialog over the booking quotes it, at no visual cost.
- **D-11** *Steps loading or error states?* None. The explainer is static copy rendered on the server. A progress list renders only once its data has loaded; until then the page shows its card skeleton (steps design-system page, States).
- **D-12** *What colour is a danger stop's text?* `--color-fg-default`, as for done and current stops. The danger stop happened ("Declined", "Cancelled", "On hold"), and the existing CSS leaves it in `--color-fg-muted` like an upcoming stop, which the rendering shows reads as "not yet". The red number marks the problem; the title says which (AC-31).
- **D-13** *Steps padding on a phone?* `--space-5` under SM instead of `--space-8`. At 320 px the full padding leaves the description about 151 px, so "Tell them about your church and the songs you love." breaks into six ragged lines (320 px rendering). `--space-5` is the padding the design system already uses for steps in its states matrix (AC-30).
- **D-14** *How does the stepper scroll inside a flex or grid parent?* The host is `display: block` with `min-width: 0` and `max-width: 100%`. A flex or grid item defaults to `min-width: auto` and would grow to the row's full content width, moving the overflow to the page.
