# Tabs

| Field | Value |
|---|---|
| Selector | `zm-tabs`, `zm-tab` |
| Library path | `frontend/projects/components/src/lib/tabs/` |
| Status | planned |
| Traces to | L2-033, L2-034, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`tabs.html`](../../design-system/components/tabs.html) |
| Source mocks | [`pages/bookings/default`](../../mocks/pages/bookings/default.html), [`pages/bookings/past`](../../mocks/pages/bookings/past.html), [`pages/bookings/loading`](../../mocks/pages/bookings/loading.html), [`pages/bookings/no-results`](../../mocks/pages/bookings/no-results.html), [`pages/requests/default`](../../mocks/pages/requests/default.html), [`pages/requests/empty`](../../mocks/pages/requests/empty.html), [`pages/requests/loading`](../../mocks/pages/requests/loading.html), [`pages/requests/no-results`](../../mocks/pages/requests/no-results.html), [`notifications/request-toast/*`](../../mocks/notifications/request-toast/info.html) |
| Rendering | [`tabs.html`](tabs.html) |

## Purpose and scope

Tabs show one of a few sibling views of the same thing, one at a time, without
leaving the page: Naomi Fraser's bookings split into "Upcoming" and "Past",
Abigail Mensah's requests into "New", "Accepted", "Confirmed" and "Past". The
counts in the tabs say how much each view holds. `zm-tabs` renders the tab list
and owns selection and the keyboard; each `zm-tab` child is one panel and
carries its tab's label and count.

Use something else when:

- the views are separate pages with their own URL path → [sidebar navigation](sidebar-navigation.md) or the [top bar](top-bar.md);
- the control filters a list and several can be on at once → [chip](chip.md);
- the steps must be done in order → [steps](steps.md);
- the list is long and split into numbered pages → [pagination](pagination.md).

Out of scope:

- What each panel holds (the booking list, empty states, filters, the
  visually hidden panel heading). The page projects it into the `zm-tab`.
- Which bookings or requests fall under which tab, and their order (L2-033,
  L2-034). The page fetches and sorts; the tabs only show the result.
- Keeping the selected tab in the URL (`?view=past`). The page binds
  `selected` to its own state and router if it wants that.
- Loading a panel on demand. With `activation="manual"` the page loads when
  `selected` changes and marks the panel `busy`.
- The toast that announces a new request (L2-109). The page updates the count.

## Usage

Tabs appear on 26 screens; all of them are one of two sets. The DS page adds the
stamp and small variants, a disabled tab and manual activation, which no mock
uses yet; they are in the API now so card and dashboard tabs need no change.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/bookings/default`, `past`, `no-results` | underline, md, automatic, `flow`, label "Bookings" | "Upcoming" count 3, "Past" count 3; panel holds status filter, `zm-booking-list` or empty state | Upcoming selected; Past selected | canvas, in `.page-body` |
| `pages/bookings/loading` | as above | "Upcoming", "Past" with no counts (`count` null); Upcoming panel `busy` with skeleton rows | loading | canvas |
| `pages/requests/default`, `no-results` | underline, md, automatic, `flow`, label "Request status" | "New" count 3 (hidden noun " new"), "Accepted", "Confirmed", "Past" with no count | New selected; list scrolls sideways at XS | canvas |
| `pages/requests/empty` (Miriam Haile) | as above | "New" with no count | New selected, empty panel | canvas |
| `pages/requests/loading` | as above, counts null, New panel `busy` | skeleton rows | loading | canvas |
| `notifications/request-toast/*` (6 states) | as `requests/default`, behind a toast | "New 3" | unchanged under the toast | canvas |
| Design system: payouts by period | stamp, md, manual, label "Payouts by period" | "September", "June", "All of 2026" | selected, focus moves without selecting | surface or canvas |
| Design system: tabs in a card | underline, sm | "Details", "Messages" count 3 | selected | card surface |
| Design system: disabled tab | underline, md | "Reviews" count 0, `disabled` | disabled | canvas |

## Anatomy

1. **Wrapper** — the `zm-tabs` host, class `.tabs` plus `.tabs--stamp` or
   `.tabs--sm`. With `flow` it has `display: contents`, so the list and the
   panels become items of the parent's stack.
2. **Tab list** — `.tabs__list`, `role="tablist"`, named by `label`. A 2 px
   `--color-border-strong` rule underneath (none for stamp). Scrolls sideways,
   never wraps.
3. **Tab** — `button.tabs__tab`, `role="tab"`: bold uppercase label, 44 px
   tall (36 px small). Unselected tabs are muted.
4. **Count (optional)** — `.tabs__count`: mono overline on a subtle chip;
   yellow with ink text on the selected tab. May end with a visually hidden noun.
5. **Selected marker** — a 4 px `--color-accent` underline over the list rule;
   for stamp, the ink fill.
6. **Panel** — the `zm-tab` host, `role="tabpanel"`, class `.tabs__panel`
   (24 px above its content) unless `flow` is set. Only the selected one is
   shown; the rest have `hidden`.

Host: `zm-tabs` is the wrapper and renders the tab list followed by its
projected `zm-tab` children. Each `zm-tab` host is itself the panel element; it
renders no wrapper of its own.

## API

### `zm-tabs` inputs and model

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The tab list's `aria-label`: "Bookings", "Request status", "Payouts by period". |
| `selected` | `model<string \| undefined>` | `undefined` | no | The selected tab's `value`. Two-way: `[(selected)]`. If it is unset, unknown or names a disabled tab, the first enabled tab shows, without writing the model. |
| `activation` | `'automatic' \| 'manual'` | `'automatic'` | no | Automatic: arrow keys move focus and select. Manual: arrow keys only move focus; Enter, Space or a click selects. |
| `variant` | `'underline' \| 'stamp'` | `'underline'` | no | Stamp adds `.tabs--stamp`. |
| `size` | `'md' \| 'sm'` | `'md'` | no | Small adds `.tabs--sm`. |
| `flow` | `boolean` (attribute) | `false` | no | Host becomes `display: contents` and panels drop `.tabs__panel`, so the list and panel take the spacing of the parent stack (`.page-body`), as the mocks lay them out. |
| `idPrefix` | `string` | a unique `zm-tabs-{n}` | no | Prefix for the generated IDs: `{idPrefix}-tab-{value}` and `{idPrefix}-panel-{value}`. |

### `zm-tab` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `value` | `string` | — | yes | Unique within its `zm-tabs`; what `selected` holds: `'upcoming'`, `'past'`, `'new'`. |
| `label` | `string` | — | yes | The visible tab text: "Upcoming". Translated by the page. |
| `count` | `number \| null` | `null` | no | `null` renders no count (no number yet, or a set that shows none). A number renders `.tabs__count`, including 0, formatted with the active locale's digit grouping. |
| `countLabel` | `string` | `''` | no | Visually hidden words after the number, starting with a space: " new". Use it when the number alone is ambiguous. |
| `disabled` | `boolean` (attribute) | `false` | no | Native `disabled` on the tab. Skipped by arrow keys and never selected. |
| `busy` | `boolean` (attribute) | `false` | no | Sets `aria-busy="true"` on the panel while its content loads. |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `selectedChange` (from the `selected` model) | the new `value` | The person selects a different tab by click, arrow key (automatic) or Enter/Space (manual). Never on first render or when an input changes. |

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-tabs` default | `zm-tab` elements only | Declared once. Order in the template is the tab order. A `@for` or a single `@if` around one `zm-tab` is allowed. |
| `zm-tab` default | the panel's content | Declared once. Rendered whether or not the panel is selected; hidden panels carry `hidden`. |

All copy (`label`, tab `label`, `countLabel`) arrives as inputs from the
translation catalogue (L2-111).

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Underline | — | Page-level views: bookings, requests. The default. |
| Stamp | `.tabs--stamp` | A short set (two to four) inside a card or dashboard panel; each tab is framed and the selected one is solid ink. |

| Size | Modifier | Height | Padding | Type |
|---|---|---|---|---|
| Medium | — | `--target-comfortable` (44 px) | `--space-4` | `--text-label` |
| Small | `.tabs--sm` | `--control-height-sm` (36 px; `--target-comfortable` under a coarse pointer) | `--space-3` | `--text-label` at `--font-size-xs` |

Medium is the only size for page-level tabs. Width: each tab is as wide as its
label and count; the list takes the full width of its container.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | `--tab-fg` `--color-fg-muted`, transparent | "Past 3, tab, 2 of 2" |
| Hover | `:hover` | `--tab-fg` `--color-fg-default`, `--color-bg-subtle` fill, no lift | — |
| Focus | `:focus-visible` | Two-tone ring drawn inside the tab (negative offset) so the scrolling list never clips it | — |
| Selected | `aria-selected="true"` | Full-strength label, 4 px `--color-accent` underline; count turns `--color-accent` with `--color-fg-on-accent`. Stamp: `--color-bg-inverse` fill, `--color-fg-inverse` label | "selected"; `tabindex="0"` |
| Selected, focus | both | Selected look plus the inner ring | — |
| Disabled | `disabled` | `--color-fg-disabled` label, no hover fill, `cursor: not-allowed` | Dimmed; skipped by arrows and Tab |
| No count | `count` null | Label only | Name is the label |
| Loading | `count` null on every tab; the selected `zm-tab` `busy` | Tabs stay as they are; the panel shows the page's skeleton | Panel `aria-busy="true"` |
| Overflow | tabs wider than the list | List scrolls sideways inside itself (thin scrollbar); the selected tab is scrolled into view | — |
| Hidden panel | not selected | `hidden` | Not in the accessibility tree |
| Inert | an open dialog or drawer makes the page `inert` | No hover response | Not reachable |

## Markup

Rendered by `zm-tabs` with two `zm-tab` children (Naomi's bookings, default
mode):

```html
<zm-tabs class="tabs">
  <div class="tabs__list" role="tablist" aria-label="Bookings">
    <button class="tabs__tab" type="button" role="tab" id="bookings-tab-upcoming" aria-selected="true" aria-controls="bookings-panel-upcoming" tabindex="0">Upcoming <span class="tabs__count">3</span></button>
    <button class="tabs__tab" type="button" role="tab" id="bookings-tab-past" aria-selected="false" aria-controls="bookings-panel-past" tabindex="-1">Past <span class="tabs__count">3</span></button>
  </div>
  <zm-tab class="tabs__panel" role="tabpanel" id="bookings-panel-upcoming" aria-labelledby="bookings-tab-upcoming" tabindex="0">…</zm-tab>
  <zm-tab class="tabs__panel" role="tabpanel" id="bookings-panel-past" aria-labelledby="bookings-tab-past" tabindex="0" hidden>…</zm-tab>
</zm-tabs>
```

`flow`: the host keeps `.tabs` but is `display: contents`, and the panels have
no `.tabs__panel` class:

```html
<zm-tabs class="tabs" style="display: contents">
  <div class="tabs__list" role="tablist" aria-label="Request status">
    <button class="tabs__tab" type="button" role="tab" id="requests-tab-new" aria-selected="true" aria-controls="requests-panel-new" tabindex="0">New <span class="tabs__count">3<span class="visually-hidden"> new</span></span></button>
    <button class="tabs__tab" type="button" role="tab" id="requests-tab-accepted" aria-selected="false" aria-controls="requests-panel-accepted" tabindex="-1">Accepted</button>
    …Confirmed, Past
  </div>
  <zm-tab role="tabpanel" id="requests-panel-new" aria-labelledby="requests-tab-new" tabindex="0">…</zm-tab>
  …
</zm-tabs>
```

(`display: contents` comes from the component's `:host` style, not an inline
style; the inline style above only shows the effect.)

Loading, disabled, stamp and small:

```html
<zm-tab role="tabpanel" … aria-busy="true">…skeleton rows…</zm-tab>
<button class="tabs__tab" type="button" role="tab" … aria-selected="false" tabindex="-1" disabled>Reviews <span class="tabs__count">0</span></button>
<zm-tabs class="tabs tabs--stamp">…</zm-tabs>
<zm-tabs class="tabs tabs--sm">…</zm-tabs>
```

Consumer templates:

```html
<zm-tabs flow [label]="'bookings.tabs.label' | transloco" idPrefix="bookings" [(selected)]="view">
  <zm-tab value="upcoming" [label]="'bookings.tabs.upcoming' | transloco" [count]="upcomingCount()" [busy]="loading()">
    <!-- status filter, zm-booking-list or empty state -->
  </zm-tab>
  <zm-tab value="past" [label]="'bookings.tabs.past' | transloco" [count]="pastCount()" [busy]="loading()">…</zm-tab>
</zm-tabs>
```

```html
<zm-tabs variant="stamp" activation="manual" [label]="'earnings.periods.label' | transloco" [(selected)]="period">
  @for (p of periods(); track p.value) {
    <zm-tab [value]="p.value" [label]="p.label" [busy]="p.loading">
      @if (period() === p.value) {
        <zm-booking-list ordered [label]="p.listLabel">
          @for (b of payouts(); track b.number) {
            <li><zm-booking-list-row …>…stamp + action…</zm-booking-list-row></li>
          }
        </zm-booking-list>
      }
    </zm-tab>
  }
</zm-tabs>
```

The `.tabs*` classes, the roles and `aria-selected` are a contract: the e2e
page objects find a tab by role and name and read its count by
`.tabs__count`. The generated IDs are free to change; page objects never use
them.

## Design

- List: `display: flex`, gap `--space-1` (`--space-2` for stamp),
  `overflow-x: auto`, `scrollbar-width: thin`, bottom rule
  `--border-width-thick` solid `--color-border-strong` (none for stamp).
- Tab: `min-height: --target-comfortable`, padding `0 --space-4`, gap
  `--space-2` before the count, `--text-label`, `--letter-spacing-wide`,
  uppercase, `white-space: nowrap`, `flex: none`. Bottom border
  `--border-width-poster` transparent, pulled down by `--border-width-thick`
  so the selected underline covers the list rule.
- Stamp tab: `--border-width-thick` frame in `--color-border-strong`, no
  negative margin.
- Count: `--text-overline`, padding `0 --space-1`, `--color-bg-subtle` fill,
  `--color-fg-default` text.
- Panel (`.tabs__panel`): `padding-top: --space-6`. With `flow`, the parent's
  gap applies (`.page-body` uses `--space-8`).
- Focus: `outline-offset: calc(--focus-ring-width * -1)` and an inset
  `--color-focus-ring-offset` shadow, so the ring sits inside.
- No transitions: the underline, fill and panel switch instantly.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--tab-fg` | `--color-fg-muted` | hover and selected → `--color-fg-default`; disabled → `--color-fg-disabled`; selected stamp → `--color-fg-inverse` |

The styles are the design system's `.tabs*` rules, moved into the component's
stylesheet (the tab list is in `zm-tabs`, the panel class on the `zm-tab`
host).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Unselected label | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Selected or hovered label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Selected underline, selected count | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Selected count text | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| List rule, stamp frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Hover fill, count chip | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Selected stamp | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Disabled label | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |
| Focus ring | `--color-focus-ring` | per theme | per theme |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Unselected label |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Unselected label on the page |
| `--color-fg-default` | `--color-bg-subtle` | 4.5:1 | Hovered label; count chip |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Selected stamp |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Selected count |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | List rule, stamp frame |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring |

On the light theme the yellow underline is under 3:1 against paper, so it is
decoration: the selected state is also carried by the full-strength label, the
yellow count and `aria-selected`, never by the underline alone. On the dark
theme the underline clears 3:1 against the canvas. Disabled labels are exempt
(WCAG 1.4.3). Under forced colours the list rule and stamp frame use
`CanvasText` through `--color-border-strong`, and the selected tab keeps a
visible underline because it is a border, not a background.

## Responsive behaviour

- Tabs never wrap onto two rows. When the set is wider than its container the
  list scrolls sideways inside itself and the page does not. At 360 px
  Abigail's "New 3 · Accepted · Confirmed · Past" overflows by about one tab and
  scrolls; Naomi's "Upcoming 3 · Past 3" fits at 320 px.
- When the selected tab is outside the visible part of the list on first render
  or after `selected` changes, the list scrolls horizontally to show it. Only
  the list's `scrollLeft` changes; the page never scrolls vertically.
- The stamp keeps `--space-2` between frames at every width; panels take the
  full width under the list.
- Under a coarse pointer, small tabs grow to `--target-comfortable`; medium
  tabs are already 44 px tall and at least 64 px wide.
- At 320 px nothing outside the list scrolls horizontally and no label is
  clipped (the list scrolls instead). At 200 % zoom the list scrolls and every
  tab stays reachable by keyboard and swipe.

## Accessibility

### Role and pattern

[APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
`role="tablist"` with `aria-label`, `<button role="tab">` with
`aria-selected` and `aria-controls`, and `role="tabpanel"` with
`aria-labelledby`. Hidden panels use the `hidden` attribute. Activation is
automatic for page tabs whose lists arrive with the page (bookings, requests);
manual when a panel loads on demand (payouts by period), so moving across three
tabs does not fire three requests.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Into the list onto the selected tab; the next Tab goes to the selected panel. |
| <kbd>Shift</kbd>+<kbd>Tab</kbd> | From the panel back to the selected tab, then out of the list. |
| <kbd>→</kbd> / <kbd>←</kbd> | Next or previous enabled tab, wrapping at the ends. Automatic: also selects it. |
| <kbd>Home</kbd> / <kbd>End</kbd> | First or last enabled tab. Automatic: also selects it. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Selects the focused tab (manual; harmless in automatic). |

### Focus

Roving tabindex: the tab that last had focus in the list has `tabindex="0"`,
every other tab `-1`. When focus leaves the list, the roving stop returns to
the selected tab, so Tab always re-enters on the selected one. Each panel has
`tabindex="0"`, so a panel with no focusable content (an empty state) is still
reachable. Selecting a tab never moves focus into the panel. The ring is
inside the tab and never clipped by the scrolling list.

### Labelling

The list is named by `label`. A tab's name is its label plus its count
("Upcoming 3", "New 3 new" with `countLabel`); the count is never `aria-label`
on a span. Each panel is labelled by its tab, so screen readers announce
"Upcoming 3, tab panel". Tab position ("1 of 2") comes from the role.

### Announcements

None. Count changes are not live; the page's toast announces the event behind
them (a new request, L2-109). A busy panel exposes `aria-busy`; the page's own
status line ("Loading your bookings") says what is loading.

### Motion

Nothing animates. Under `prefers-reduced-motion` there is nothing to reduce,
and the horizontal scroll to the selected tab is instant (no smooth scrolling).

## Content and internationalisation

- One or two words per tab, nouns for what the panel holds: "Upcoming", "Past",
  "New", "Accepted", "Confirmed". Sentence case in the source; CSS uppercases.
- The most-used view comes first and is selected by default: "Upcoming" for
  bookers, "New" for artists.
- Counts are plain numbers with digit grouping ("3", "1,240"). Two to five tabs.
- French labels run about 30 % longer ("À venir", "Confirmées"); the list
  scrolls rather than wraps or clips.
- Translatable inputs: `label`, tab `label`, `countLabel`. Data values: `count`.

## Performance

- Change detection: `OnPush`, signal inputs, `contentChildren(Tab)` read as a
  signal. The effective selection, IDs and tabindex are `computed`. One
  `keydown` listener on the list; no per-tab subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Tabs.ts` renders
  Naomi Fraser's bookings tabs: label "Bookings", "Upcoming" count 3 selected,
  "Past" count 3, each panel holding one line of text ("Marcus Bell Trio · Sun
  25 Oct · Confirmed"). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: none; the requests inbox row scenario renders the rows,
  not the tabs.
- Layout stability: loading renders the same tab list as the loaded page, with
  counts added later inside the same row height (L2-105); the selected panel's
  skeleton matches its final list.
- Weight: imports Angular core and `DecimalPipe`; no CDK. Does not import the
  booking list or any panel content.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi's bookings tabs with "Upcoming" count 3 and "Past" count 3 and no `selected`, when they render, then the list has `role="tablist"` named "Bookings", "Upcoming 3" is selected with `tabindex="0"`, "Past 3" has `tabindex="-1"`, and only the Upcoming panel is visible. (L2-033)
- **AC-2** Given `selected` is `'past'`, when the bookings tabs render, then "Past" is selected, its panel shows the past bookings, and the Upcoming panel has `hidden`. (L2-033)
- **AC-3** Given Abigail's requests tabs "New" count 3, "Accepted", "Confirmed" and "Past", when they render, then "New" is selected and shows `.tabs__count` "3", and the other three tabs show no count element. (L2-034)
- **AC-4** Given a tab with `count` 0, when it renders, then the tab shows "0"; given `count` null, then it shows no `.tabs__count`. (L2-034)
- **AC-5** Given `flow`, when the bookings tabs sit in `.page-body`, then the host generates no box, the panels have no `.tabs__panel` class, and the gap between list and panel equals the page body's gap. (L2-033)
- **AC-6** Given `variant="stamp"` and `size="sm"`, when each renders, then the host has `.tabs--stamp` or `.tabs--sm`, a small tab is 36 px tall, and the selected stamp has the `--color-bg-inverse` fill. (L2-096)

### States

- **AC-7** Given the person clicks "Past", when it is selected, then `selectedChange` emits `'past'` once, "Past" gets `aria-selected="true"` and the 4 px `--color-accent` underline, and its count turns yellow with `--color-fg-on-accent` text. (L2-033)
- **AC-8** Given a disabled "Reviews 0" tab, when it renders, then it has native `disabled`, a `--color-fg-disabled` label, and clicking it changes nothing. (L2-101)
- **AC-9** Given `selected` names a disabled or unknown tab, when the tabs render, then the first enabled tab shows and `selectedChange` does not emit. (L2-101)
- **AC-10** Given the bookings page is loading, when the tabs render with `count` null and the Upcoming panel `busy`, then the tab row has the same height as when loaded, the panel has `aria-busy="true"`, and when the counts arrive they appear inside the existing tabs with a layout shift of 0.05 or less. (L2-105)
- **AC-11** Given a pointer over an unselected tab, when it hovers, then its label turns `--color-fg-default` on a `--color-bg-subtle` fill and nothing moves. (L2-101)

### Keyboard and focus

- **AC-12** Given focus on "New" in automatic mode, when → is pressed three times, then focus and selection move to "Accepted", "Confirmed" and "Past", and the next → wraps to "New". (L2-101)
- **AC-13** Given focus on "New", when End then Home is pressed, then focus moves to "Past" then back to "New", selecting each in automatic mode. (L2-101)
- **AC-14** Given a disabled tab between two enabled ones, when the arrow keys cross it, then focus skips it. (L2-101)
- **AC-15** Given the payouts tabs in manual mode with "September" selected, when → is pressed, then focus moves to "June" without selecting it and `selectedChange` does not emit; when Enter or Space is pressed, then "June" is selected and `selectedChange` emits `'june'`. (L2-101)
- **AC-16** Given focus moved to "June" in manual mode without selecting it, when the person tabs out and back into the list, then focus lands on the selected "September". (L2-101)
- **AC-17** Given focus on the selected tab, when Tab is pressed, then focus moves to its panel (`tabindex="0"`), even when the panel holds only an empty state. (L2-101)
- **AC-18** Given keyboard focus on a tab, when it is focused, then the two-tone ring is drawn inside the tab and is fully visible within the scrolling list. (L2-101)

### Screen readers

- **AC-19** Given "New" with count 3 and `countLabel` " new", when it is read by a screen reader, then it is announced as "New 3 new, tab, selected, 1 of 4", and its panel as "New 3 new, tab panel". (L2-102)
- **AC-20** Given the bookings and requests pages with tabs in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when the tabs render, then the unselected label is `--color-fg-muted`, the underline stays `--color-accent`, and the selected stamp is a paper-light `--color-bg-inverse` with `--color-fg-inverse` text. (L2-104)
- **AC-22** Given both themes, when contrast is measured, then unselected labels, hovered labels, the selected count and the selected stamp are at least 4.5:1, and the list rule and focus ring at least 3:1 against the page. (L2-103)

### Responsive

- **AC-23** Given a 360 px viewport and Abigail's four request tabs, when the page renders, then the tabs stay on one row, the tab list scrolls sideways inside itself, and the page does not scroll horizontally. (L2-096)
- **AC-24** Given "Past" is selected and lies outside the visible part of the list, when the tabs render, then the list's horizontal scroll shows "Past" fully and the page's vertical scroll position does not change. (L2-096)
- **AC-25** Given a coarse pointer, when a small tab is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given the French catalogue with labels about 30 % longer, when the requests tabs render at 360 px, then no label is clipped or wrapped and the list scrolls. (L2-111)

### Motion

- **AC-27** Given `prefers-reduced-motion: reduce`, when the selected tab is scrolled into view, then the scroll is instant and nothing animates. (L2-103)

### Performance

- **AC-28** Given the `Tabs` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/tabs/` with `tabs.ts` (`Tabs`,
  selector `zm-tabs`) and `tab.ts` (`Tab`, selector `zm-tab`), both exported
  from `public-api.ts`.
- `Tab` host bindings: `role="tabpanel"`, `[id]`, `[attr.aria-labelledby]`,
  `tabindex="0"`, `[hidden]`, `[attr.aria-busy]`, and `[class.tabs__panel]`
  unless the parent is `flow`. `Tab` injects `Tabs` to read its prefix, flow
  and the effective selection. Its template is a single `<ng-content />`.
- `Tabs` reads `contentChildren(Tab)`, renders the list with one `@for`, and
  binds `[class.tabs--stamp]`, `[class.tabs--sm]` and `:host` `display:
  contents` for `flow`. The keydown handler implements the Keyboard table; a
  `focusout` from the list resets the roving stop to the selected tab.
- Move the `.tabs*` rules from `docs/design-system/assets/components.css` into
  the component stylesheets; the tab-list rules live in `tabs.ts`, the
  `.tabs__panel` rule in `tab.ts` (`:host(.tabs__panel)`).
- Scroll the selected tab into view by setting the list's `scrollLeft` in an
  `afterRenderEffect`, never `scrollIntoView` (D-6).
- Unique default `idPrefix` from a module-level counter, stable between server
  and client render because the order of creation is the same.
- Add the `Tabs.ts` perf-test scenario and export it from `scenarios/index.ts`.

## Decisions

- **D-1** *Who renders the panels?* Each `zm-tab` host is its own panel and projects its content through one `ng-content`. A list of tab objects plus `<ng-template>` panels would need a template outlet per panel; child components keep the panel content where the page writes it and keep each slot declared once (AGENTS.md).
- **D-2** *The mocks put the tab list straight in `.page-body` with no `.tabs` wrapper or `.tabs__panel`, so list and panel are spaced by the body's gap. Which spacing wins?* Both are supported: `flow` reproduces the mocks (host `display: contents`, no panel class) for visual parity; the default keeps the design system's wrapper and 24 px panel offset for tabs anywhere else.
- **D-3** *`pages/requests/loading` renders inert `<span class="tabs__tab">` copies inside an `aria-hidden` region, while `pages/bookings/loading` renders the real, working tabs without counts. Which is right?* The real tabs, as on bookings/loading, for both pages. Hiding the tab list while loading removes a working control and would make the loaded page's tab list appear from nothing; the requests/loading spans are treated as mock drift. While loading, `count` is null and the selected panel is `busy`.
- **D-4** *The design system says "show 0 rather than hiding the count", but `pages/requests/empty` shows "New" without a count, and Accepted, Confirmed and Past never show one. Which rule does the component follow?* The component renders exactly what it is given: a number, including 0, or nothing for null. The rule about which tabs count is page copy: bookings counts every view (and passes 0); the requests inbox counts only New, as an attention count, and passes null when nothing is new, matching its mock.
- **D-5** *Does the selected tab live in the URL?* Not in the component. `selected` is a two-way model, so a page can bind it to a query parameter if it chooses; the design system says switching tabs does not change the page.
- **D-6** *How is an off-screen selected tab revealed?* By setting the list's `scrollLeft`, not `scrollIntoView`. `scrollIntoView` can also scroll the page vertically on load, which would move the person away from the top of the page.
- **D-7** *Are hidden panels rendered?* Yes, eagerly, as the mocks' lists arrive with the page and the counts need them. A page that loads a panel on demand (manual activation) renders that panel's content conditionally itself; the component does not lazily instantiate content.
- **D-8** *Where does the roving tabindex go in manual mode while focus is on an unselected tab?* On the focused tab while focus stays in the list, then back to the selected tab when focus leaves, so Tab always re-enters on the selected one (APG).
- **D-9** *How is a large count formatted?* With the active locale's digit grouping (`DecimalPipe`), so "1,240" matches L2-110's thousands separators without the page formatting every count.
