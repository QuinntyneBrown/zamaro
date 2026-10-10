# Table

| Field | Value |
|---|---|
| Selector | `zm-table`, `zm-bulk-bar` |
| Library path | `frontend/projects/components/src/lib/table/` |
| Status | planned |
| Traces to | L2-048, L2-049, L2-056, L2-067, L2-068, L2-069, L2-086, L2-087, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`table.html`](../../design-system/components/table.html) |
| Source mocks | [`pages/admin-applications/default`](../../mocks/pages/admin-applications/default.html), [`pages/admin-applications/loading`](../../mocks/pages/admin-applications/loading.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/admin-bookings/default`](../../mocks/pages/admin-bookings/default.html), [`pages/admin-bookings/held`](../../mocks/pages/admin-bookings/held.html), [`pages/admin-booking/default`](../../mocks/pages/admin-booking/default.html), [`pages/admin-booking/held`](../../mocks/pages/admin-booking/held.html), [`pages/admin-audit/default`](../../mocks/pages/admin-audit/default.html), [`pages/admin-checks/default`](../../mocks/pages/admin-checks/default.html), [`pages/admin-checks/verified`](../../mocks/pages/admin-checks/verified.html), [`pages/availability/selected`](../../mocks/pages/availability/selected.html), and their loading states |
| Rendering | [`table.html`](table.html) |

## Purpose and scope

A table lines up records so someone can compare them: applications waiting for
review, artists, bookings that match "Riverside", a booking's charges and
payouts, the audit log, checks waiting for verification. Each row is one record
and each column one fact. `zm-table` renders the wrapper, caption, headers,
sorting, selection, loading rows and the cells, with templates for rich cells.

`zm-bulk-bar` is the inverse bar that says how many items are selected and holds
the bulk actions, above a selectable table or over the availability calendar.

Use something else when:

- each record is read on its own with two or three facts → [list](list.md);
- it is the facts of one record → [description list](description-list.md);
- it is bookings or requests for bookers and artists → [booking list](booking-list.md);
- people choose who to book → [ticket](ticket.md).

Out of scope:

- Fetching, searching and paging: the page sorts or asks the API to, passes
  `rows`, and renders [pagination](pagination.md) under the table.
- Empty, no-results and error states: the page replaces the whole table with an
  [empty state](empty-state.md) or a danger [alert](alert.md).
- Bulk actions themselves and what they do; the page projects the buttons.
- Converting a short table to a [list](list.md) on phones; the page decides per
  screen.
- The height of a scrolling table (sticky header): the page sets it.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/admin-applications/default` "Submitted, oldest first" | row header link, actions column with hidden header | "Ebenezer Brass Band" link, "Band", "Oshawa, ON", "Tue 6 Oct, 4:20 p.m."; sm "Review" named "Review Ebenezer Brass Band's application" | default, row hover | table surface |
| `pages/admin-artists/default` "All artists, A to Z" | rating cell, status badge, actions | "★ 4.9" named "Rated 4.9 out of 5"; "Approved"; "Open" named "Open Abigail Mensah" | default, hover | table surface |
| `pages/admin-bookings/default`, `held` | static sort on "Event date" (descending, no button), two numeric columns, stamp cell | "ZAM-0088" link, "Accepted" flat stamp, "$237.50"; held: stamp + "Held" badge in one cell | default | table surface |
| `pages/admin-booking/*`, `dialogs/issue-refund`, `dialogs/resolve-hold` | `dense`, caption visually hidden, numeric last column | "Tue 29 Sep, 8:02 a.m." row header, "Deposit charge", "Visa ending 4242", "Succeeded", "$237.50" | default | table surface, behind a dialog |
| `pages/admin-audit/default` "Thu 1 Oct to Fri 9 Oct 2026, newest first" | `dense`, static sort on "When", two-line actor cell, `<code>` action | "Priya Nair" / "priya@zamaro.ca · Administrator", `auth.sign_in_failed`, "Failed" | default | table surface |
| `pages/admin-checks/default`, `verified` | actions cell with two buttons in a cluster | "View document" (secondary, hidden suffix), "Verify" (primary link); badge "Verified" in a sentence cell | default | table surface |
| All admin loading states (`pages/admin-*/loading`) | `loading`, 2–4 skeleton rows, `control` skeleton in the actions column | — | loading | table surface |
| `notifications/session-toast` over the admin pages | as the page | as the page | inert | table surface |
| `pages/availability/selected` | `zm-bulk-bar`, sticky, `label` "Selected days" | count "2 days selected · Sat 28 – Sun 29 Nov"; sm primary "Mark unavailable", sm "Clear" | default | inverse bar over the calendar |
| Design system only | sortable headers, selectable rows with header checkbox (indeterminate), `zm-bulk-bar` above the table, sticky header, sticky first column | "Naomi's bookings"; "2 requests selected" | sorted ascending/descending, selected, hover, focus | table surface |

## Anatomy

### `zm-table`

1. **Wrapper** — `.table-wrap`: paper surface, `--border-width-thick`
   `--color-border-strong` rule, scrolls sideways. A named, focusable region.
2. **Table** — `<table class="table">` (`.table--dense`, `.table--sticky`).
3. **Caption** — `<caption>`: `--text-h4`, uppercase, thick rule below. Names
   the table; may be visually hidden.
4. **Column header** — `<th scope="col">`: sunken fill, overline, thick rule
   below, no wrap. `.table__num` right-aligns; `.table__actions` for the actions
   column (visually hidden label "Actions").
5. **Sort button** — `.table__sort` inside a sortable header: the header text
   and an arrow icon, faint when unsorted, full strength and turned for
   descending. `aria-sort` sits on the `<th>`.
6. **Select column (optional)** — a `zm-checkbox variant="check"` per row and in the header; the header box is `indeterminate` when some rows are selected and `aria-controls` the row boxes.
7. **Row header** — `<th scope="row">`: the record's name, often a link.
8. **Cell** — `<td>`; `.table__num` right-aligned with tabular figures;
   `.table__actions` right-aligned, no wrap, holding one sm button or a
   `.cluster` of two.
9. **Sticky first column (optional)** — `.table__first` on the row headers.

### `zm-bulk-bar`

1. **Bar** — `.bulk-bar` (`.bulk-bar--sticky`): inverse fill, flex wrap,
   space-between, `role="region"` with a name.
2. **Count** — `.bulk-bar__count`, `role="status"`: "2 days selected · Sat 28 –
   Sun 29 Nov".
3. **Actions** — `.bulk-bar__actions`: projected sm buttons, re-skinned for the
   inverse bar by the [button](button.md)'s `.bulk-bar` mapping.

Hosts: `zm-table` is `display: block` and renders the wrapper; `zm-bulk-bar` is
the bar itself (`display: flex`).

## API

### `zm-table` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `caption` | `string` | — | yes | "Submitted, oldest first". Names the table and the wrapper region. |
| `captionHidden` | `boolean` (attribute) | `false` | no | Caption becomes `.visually-hidden` (a panel heading already says it). |
| `columns` | `readonly TableColumn[]` | — | yes | In display order. See below. |
| `rows` | `readonly T[]` | — | yes | Already in display order. |
| `rowKey` | `string` | `'id'` | no | The row field used to track rows and selection. |
| `rowHeader` | `string` | the first column's `key` | no | That column renders `<th scope="row">`. |
| `sort` | `{ key: string; direction: 'ascending' \| 'descending' } \| null` | `null` | no | Puts `aria-sort` on that column's `<th>`, whether or not it is sortable (a fixed order, such as "newest first"). |
| `dense` | `boolean` (attribute) | `false` | no | `.table--dense`. Text and badges only: no buttons, no checkboxes (dev-mode error otherwise). |
| `stickyHeader` | `boolean` (attribute) | `false` | no | `.table--sticky`. The page gives the host a `max-height`. |
| `selectable` | `boolean` (attribute) | `false` | no | Adds the checkbox column. Not with a `sticky` column (dev-mode error). |
| `selected` | `ReadonlySet<string>` | empty | no | Row keys that are selected: `aria-selected="true"` on the `<tr>` and a checked box. |
| `selectAllLabel` | `string` | `''` | with `selectable` | "Select all open requests". |
| `selectRowLabel` | `(row: T) => string` | — | with `selectable` | "Select Abigail Mensah, Sat 14 Nov". |
| `loading` | `boolean` (attribute) | `false` | no | Real caption and headers, `loadingRows` skeleton rows, `aria-busy="true"` on the `<table>`. |
| `loadingRows` | `number` | `3` | no | Skeleton rows. |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden caption suffix "(loading)". |

`TableColumn`:

| Field | Type | Rule |
|---|---|---|
| `key` | `string` | Row field shown as text when no cell template matches; also the sort key and the cell template key. |
| `header` | `string` | Header text, one or two nouns. |
| `headerHidden` | `boolean?` | The header text is visually hidden ("Actions"). |
| `align` | `'start' \| 'end'?` | `end` adds `.table__num` to the header and cells (money, counts). |
| `actions` | `boolean?` | Adds `.table__actions` to the header and cells. |
| `sortable` | `boolean?` | The header holds a `.table__sort` button. |
| `sticky` | `boolean?` | `.table__first` on the header and row headers. Only on the row-header column. |
| `skeleton` | `'short' \| 'medium' \| 'long' \| 'control'?` | The loading placeholder for the column; default `medium`. `control` is a `zm-skeleton shape="control-sm"`. |

### `zm-table` outputs

| Output | Payload | Emitted when |
|---|---|---|
| `sortChange` | `{ key: string; direction: 'ascending' \| 'descending' }` | A sort button is activated: a new column sorts ascending; the sorted column reverses. The page re-sorts `rows` and passes the new `sort`. |
| `selectionChange` | `ReadonlySet<string>` | A row or the header checkbox changes. The header selects or clears every row in `rows`. |

### `zm-table` content templates

| Template | Context | Rule |
|---|---|---|
| `<ng-template zmTableCell="status" let-row>` | `T` | Replaces the text of that column's cells: links, `zm-badge`, `zm-stamp`, `zm-rating`, `<code>`, two lines with a `.text-caption`, buttons in a `.cluster`. |

Templates are collected once with `contentChildren`; there is no `ng-content`.

### `zm-bulk-bar`

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `count` | `string` | — | yes | The status text: "2 requests selected", "2 days selected · Sat 28 – Sun 29 Nov". |
| `label` | `string` | — | yes | The region's name: "Selected days". |
| `sticky` | `boolean` (attribute) | `false` | no | `.bulk-bar--sticky`: sticks to the bottom of the scrolling area, yellow rule and `--shadow-2`. |

| Slot | Accepts | Rule |
|---|---|---|
| default | `zm-button size="sm"` (one may be primary) | Rendered in `.bulk-bar__actions`. |

No outputs; buttons emit their own clicks.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | `.table` | Admin lists with a row action. |
| Sortable | `.table__sort` in headers | A list longer than a screen. |
| Selectable | checkbox column, `tr[aria-selected]`, `zm-bulk-bar` | Only when a bulk action exists. |
| Sticky header | `.table--sticky` | A table scrolling inside a fixed height (admin view, dialog). |
| Sticky first column | `.table__first` | A wide table on phones; never with selection. |

| Size | Modifier | Cell padding | Use for |
|---|---|---|---|
| Default | — | `--space-3` × `--space-4` | Rows with a 36 px small button. |
| Dense | `.table--dense` | `--space-2` × `--space-3` | Long read-only tables: audit log, payment lines. |

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper rows, hairline dividers | Table with caption, headers tied to cells |
| Row hover | `tr:hover` | `--color-bg-subtle` across the row; a reading aid, not a link | — |
| Selected | key in `selected` | `--color-accent-subtle` across the row; checkbox checked | The checkbox's checked state; `aria-selected` drives the tint |
| Some selected | some but not all keys | Header checkbox indeterminate | "mixed" |
| Sort hover / focus | button states | Underline-free; shared ring on focus | — |
| Sorted | `sort` matches | Arrow full strength; turned for descending | `aria-sort` on the `<th>` |
| Unsorted sortable | sortable, not sorted | Faint arrow (`opacity: 0.4`) | — |
| Loading | `loading` | Real caption and headers; skeleton rows per column | `aria-busy="true"`; caption ends "(loading)" |
| Scrolled sideways | narrow viewport | Wrapper scrolls; sticky first column stays | Region focusable with arrow keys |
| Inert | page `inert` behind a dialog | — | Not reachable |

## Markup

Rendered by `zm-table`:

```html
<zm-table>
  <div class="table-wrap" role="region" tabindex="0" aria-labelledby="zm-table-3-caption">
    <table class="table">
      <caption id="zm-table-3-caption">Submitted, oldest first</caption>
      <thead><tr>
        <th scope="col">Applicant</th><th scope="col">Act</th><th scope="col">Base city</th><th scope="col">Submitted</th>
        <th scope="col" class="table__actions"><span class="visually-hidden">Actions</span></th>
      </tr></thead>
      <tbody>
        <tr><th scope="row"><a href="/admin/applications/A-0219">Ebenezer Brass Band</a></th><td>Band</td><td>Oshawa, ON</td><td>Tue 6 Oct, 4:20 p.m.</td>
          <td class="table__actions"><zm-button-link size="sm" …><a class="btn btn--sm" href="…" aria-label="Review Ebenezer Brass Band's application">Review</a></zm-button-link></td></tr>
      </tbody>
    </table>
  </div>
</zm-table>
```

Sortable header and fixed order:

```html
<th scope="col" aria-sort="ascending"><button class="table__sort" type="button">Date <zm-icon name="arrow-up" aria-hidden="true">…</zm-icon></button></th>
<th scope="col" aria-sort="descending">When</th>
<th scope="col" class="table__num">Fee</th>
```

Selectable row:

```html
<tr aria-selected="true">
  <td><zm-checkbox variant="check"><label class="check"><input type="checkbox" id="zm-table-4-select-ZAM-0114" checked aria-label="Select Abigail Mensah, Sat 14 Nov"><span class="check__box">…</span></label></zm-checkbox></td>
  <th scope="row">Abigail Mensah</th>…
</tr>
```

Inside the table's own template, the header and row boxes are:

```html
<zm-checkbox variant="check" [label]="selectAllLabel()" [indeterminate]="someSelected()" [controls]="rowCheckboxIds()" [formControl]="allControl" (change)="toggleAll()" />
<zm-checkbox variant="check" [id]="rowCheckboxId(row)" [label]="selectRowLabel()(row)" [formControl]="rowControl(row)" (change)="toggleRow(row)" />
```

Loading:

```html
<table class="table" aria-busy="true">
  <caption id="…">Submitted, oldest first<span class="visually-hidden"> (loading)</span></caption>
  <thead>…</thead>
  <tbody><tr><td><zm-skeleton class="skeleton skeleton--text skeleton--long" aria-hidden="true"></zm-skeleton></td>…<td><zm-skeleton class="skeleton skeleton--control-sm" aria-hidden="true"></zm-skeleton></td></tr></tbody>
</table>
```

Dense adds `.table--dense`; sticky header `.table--sticky`; the sticky column
`.table__first` on its `<th>`s.

Rendered by `zm-bulk-bar`:

```html
<zm-bulk-bar class="bulk-bar bulk-bar--sticky" role="region" aria-label="Selected days">
  <span class="bulk-bar__count" role="status">2 days selected · Sat 28 – Sun 29 Nov</span>
  <div class="bulk-bar__actions"><zm-button variant="primary" size="sm">Mark unavailable</zm-button><zm-button size="sm">Clear</zm-button></div>
</zm-bulk-bar>
```

Consumer templates:

```html
<zm-table [caption]="'admin.artists.caption' | transloco" [columns]="columns" [rows]="artists()" rowHeader="name" [loading]="loading()" [loadingLabel]="'common.loadingSuffix' | transloco">
  <ng-template zmTableCell="name" let-a><a [routerLink]="['/admin/artists', a.id]">{{ a.name }}</a></ng-template>
  <ng-template zmTableCell="rating" let-a><zm-rating [score]="a.rating" [label]="a.ratingLabel" [newText]="'rating.none' | transloco" /></ng-template>
  <ng-template zmTableCell="status" let-a><zm-badge [variant]="a.suspended ? 'danger' : 'success'">{{ a.statusText }}</zm-badge></ng-template>
  <ng-template zmTableCell="actions" let-a><zm-button-link size="sm" [link]="['/admin/artists', a.id]" [label]="a.openLabel">{{ 'admin.open' | transloco }}</zm-button-link></ng-template>
</zm-table>

<zm-bulk-bar sticky [label]="'availability.selected.label' | transloco" [count]="selectionSummary()">
  <zm-button variant="primary" size="sm" (click)="markUnavailable()">{{ 'availability.markUnavailable' | transloco }}</zm-button>
  <zm-button size="sm" (click)="clearSelection()">{{ 'availability.clear' | transloco }}</zm-button>
</zm-bulk-bar>
```

The `.table*` and `.bulk-bar*` classes, `scope` attributes, `aria-sort` and the
action names are the contract: e2e page objects find a row by its row header and
act on its named action.

## Design

- `.table-wrap`: `overflow-x: auto`, `position: relative`, rule
  `--border-width-thick` `--color-border-strong`, fill `--color-bg-surface`.
- `.table`: full width, collapsed borders, `--text-body-sm`, tabular figures.
- Caption: left, padding `--space-3` `--space-4`, `--text-h4`, uppercase,
  `caption-side: top`, thick rule below.
- Cells: padding `--space-3` `--space-4` (dense `--space-2` `--space-3`), left,
  `vertical-align: middle`, hairline `--color-border-default` below; none under
  the last row.
- Headers: `--text-overline`, `--letter-spacing-stamp`, uppercase,
  `--color-fg-default` on `--color-bg-surface-sunken`, thick rule below,
  `white-space: nowrap`.
- Sort button: inline flex, gap `--space-1`, `min-height: --target-min`, no
  border or fill, inherits font; icon 0.875 rem at opacity 0.4, 1 when sorted,
  `rotate: 180deg` descending.
- Sticky header: `position: sticky; top: 0; z-index: --z-raised`. Sticky
  column: `position: sticky; left: 0;` fill `--color-bg-surface`.
- Bulk bar: flex wrap, space-between, gap `--space-3`, padding `--space-3`
  `--space-4`, `--color-bg-inverse` / `--color-fg-inverse`; count
  `--text-stub`, uppercase, `--letter-spacing-wide`; actions flex wrap gap
  `--space-2`; sticky: `bottom: --space-4`, `z-index: --z-sticky`, thick
  `--color-accent` rule, `--shadow-2`; focus outlines inside use
  `--color-accent`.
- No motion: sorting re-orders rows instantly.

No component tokens; the bulk bar re-skins buttons through the button's own
`.bulk-bar` mapping.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Wrapper fill / rule | `--color-bg-surface` / `--color-border-strong` | `--palette-paper-bright` / `--palette-ink-700` | `--palette-ink-850` / `--palette-ink-300` |
| Header fill | `--color-bg-surface-sunken` | `--palette-paper-warm` | `--palette-ink-950` |
| Text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Row divider | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Row hover | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Selected row | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Bulk bar | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Cell text |
| `--color-fg-default` | `--color-bg-surface-sunken` | 4.5:1 | Header text |
| `--color-fg-default` | `--color-bg-subtle` | 4.5:1 | Hovered row |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Selected row |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Bulk bar |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Wrapper rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Sort button and row action focus |

Row dividers are decorative and exempt from WCAG 1.4.11.

## Responsive behaviour

- Columns are never squeezed below their content; `.table-wrap` scrolls
  sideways so the page never scrolls horizontally at 320 px (WCAG 1.4.10
  exempts data tables).
- Headers do not wrap; body cells wrap, except actions.
- A `sticky` row-header column keeps the record's name in view while the other
  columns scroll on phones.
- The bulk bar wraps: the count first, actions below it on narrow screens.
- Under a coarse pointer, sm row buttons grow to 44 px (button CRD); checkboxes
  are 24 px boxes inside 44 px-plus rows; sort buttons are at least
  `--target-min` tall.
- At 200 % zoom the wrapper scrolls and every control stays reachable.

## Accessibility

### Role and pattern

A native `<table>` with `<caption>`, `<th scope="col">` and `<th scope="row">`,
following the [APG Table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
and its sortable table example. Not a grid: cells are not focusable and arrow
keys do nothing special. The wrapper is `role="region"`, named by the caption,
with `tabindex="0"` so keyboard users can scroll it. The bulk bar is a named
region whose count is a `role="status"`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | The wrapper region, then sort buttons, then each row's checkbox, links and actions in reading order. |
| Arrow keys | On the focused wrapper: scroll it. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On a sort button: sort by that column, or reverse it. |
| <kbd>Space</kbd> | On a checkbox: select or clear the row; on the header checkbox, every row. |
| <kbd>Enter</kbd> | On a row link or action: open it. |

### Focus

The shared ring on the wrapper, sort buttons, checkboxes and row actions; inside
the bulk bar the ring is `--color-accent`. After sorting, focus stays on the
same sort button. After a bulk action the page moves focus to the status text or
the first remaining row.

### Labelling

- The caption names the table and the wrapper region.
- `aria-sort` sits only on the sorted `<th>`, never on the button, and on one
  column at a time.
- Row checkboxes are named "Select {row}"; the header box "Select all {set}".
- Row actions repeat the visible verb first ("Review Ebenezer Brass Band's
  application", "View document of Elijah Park's check (opens in a new tab)").
- An actions column with no visible header has a visually hidden "Actions".

### Announcements

The bulk bar's count is a status: "2 requests selected" is announced when it
changes. Loading is in the caption ("(loading)"); the page's own status line
says "Loading applications".

### Motion

Only the skeleton shimmer while loading, which stops under
`prefers-reduced-motion`.

## Content and internationalisation

- Caption: whose records and which set, in sentence case: "Submitted, oldest
  first", "6 bookings match “Riverside”, latest event first".
- Headers: one or two nouns; units in the header ("Deposit 25%").
- Dates "Sat 14 Nov", with the year when the table spans years ("Sat 5 Dec
  2026"); times "4:20 p.m."; money "$1,800" or "$237.50", right-aligned
  (L2-110).
- Status is one badge or stamp word.
- One row action, or two in a cluster; more go in a [menu](menu.md).
- Bulk counts name the thing: "2 requests selected".
- Every caption, header and label comes from the catalogue (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs, `@for … track row[rowKey]`; the
  template map and header state from `computed`. No `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Table.ts`
  renders "All artists, A to Z" with the seven cast artists (row header link,
  rating, badge, Open). `TableSelectable.ts` renders "Open requests" with three
  selectable rows and a sortable Date column. `BulkBar.ts` renders "2 days
  selected · Sat 28 – Sun 29 Nov" with two buttons. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Layout stability: loading keeps the real caption and headers and fills the
  body with skeletons sized per column (L2-105).
- Weight: the table is imported only by the admin application's routes and the
  artist availability page, never by Discover, so the booker's bundle does not
  carry it (L2-087). Imports: Angular core, `NgTemplateOutlet`, `zm-checkbox`,
  `zm-icon`, `zm-skeleton`.

## Acceptance criteria

### Rendering

- **AC-1** Given the applications waiting for review, when the table renders, then it is a `.table-wrap` holding one `<table class="table">` with the caption "Submitted, oldest first", `<th scope="col">` headers, and each row's applicant as a `<th scope="row">` link. (L2-048)
- **AC-2** Given the actions column with `headerHidden`, when it renders, then its header holds a visually hidden "Actions" and each cell has `.table__actions` with one sm "Review" named "Review Ebenezer Brass Band's application". (L2-048)
- **AC-3** Given "All artists, A to Z", when the rating and status templates render, then Abigail Mensah's row shows "★ 4.9" named "Rated 4.9 out of 5" and a success badge "Approved", and the action "Open" is named "Open Abigail Mensah". (L2-067)
- **AC-4** Given the bookings matching "Riverside", when the table renders with `sort` `{ key: 'eventDate', direction: 'descending' }` and no sort buttons, then the "Event date" `<th>` has `aria-sort="descending"` and the Paid and Refunded columns are right-aligned with `.table__num`. (L2-068)
- **AC-5** Given the held booking ZAM-0104, when its status cell renders, then it holds the flat "Completed" stamp followed by a warning badge "Held". (L2-068)
- **AC-6** Given ZAM-0097's payment lines, when the `dense` table renders with `captionHidden`, then the caption "Charges, refunds and payouts for ZAM-0097, oldest first" is visually hidden, cells use `--space-2` × `--space-3`, and "$237.50" is right-aligned. (L2-068)
- **AC-7** Given the audit log, when it renders, then the Fri 9 Oct, 3:12 a.m. row shows "Unknown" over "tried admin@riversidecc.ca", the action `auth.sign_in_failed` in `<code>`, and a danger badge "Failed". (L2-069)
- **AC-8** Given checks waiting for verification, when a row renders, then its actions cell holds "View document" and "Verify" in a `.cluster`, named "View document of Elijah Park's check (opens in a new tab)" and "Verify Elijah Park's check". (L2-049)

### Sorting and selection

- **AC-9** Given a sortable "Date" column sorted ascending, when its sort button is activated, then `sortChange` emits `{ key: 'date', direction: 'descending' }`; activating the unsorted "Fee" emits `{ key: 'fee', direction: 'ascending' }`, and focus stays on the activated button. (L2-101)
- **AC-10** Given `sort` on "Date", when the headers render, then only the Date `<th>` carries `aria-sort`, its arrow is full strength, and the other sort arrows are faint. (L2-102)
- **AC-11** Given a selectable table with two of three rows selected, when it renders, then those `<tr>`s have `aria-selected="true"` and the selected tint, their checkboxes are checked, and the header `zm-checkbox variant="check"` labelled "Select all open requests" is `indeterminate` with `aria-controls` listing the three row boxes' IDs. (L2-102)
- **AC-12** Given the header checkbox is activated with some rows selected, when it changes, then `selectionChange` emits every row key; activating it again emits an empty set. (L2-101)
- **AC-13** Given two days selected on the availability calendar, when `zm-bulk-bar sticky` renders with `count` "2 days selected · Sat 28 – Sun 29 Nov", then it is a region named "Selected days" whose count is a `role="status"`, with "Mark unavailable" and "Clear" in `.bulk-bar__actions`. (L2-056)

### States

- **AC-14** Given `loading` with `loadingLabel` "(loading)", when the applications table renders, then the caption and headers are real, three skeleton rows follow with a `control-sm` skeleton in the actions column, the `<table>` has `aria-busy="true"`, and the caption ends with visually hidden "(loading)". (L2-105)
- **AC-15** Given the rows load, when they replace the skeletons, then the cumulative layout shift is 0.05 or less. (L2-105)
- **AC-16** Given a pointer over a row, when it hovers, then every cell in the row fills `--color-bg-subtle` and the row is not made focusable or clickable. (L2-103)

### Keyboard and focus

- **AC-17** Given a table wider than its wrapper at 360 px, when the wrapper is focused with Tab, then it shows the focus ring and the arrow keys scroll it sideways. (L2-101)

### Screen readers

- **AC-18** Given the artists table, when a screen reader moves to the Status cell of Luz Viva's row, then it announces the column header "Status" and the row header "Luz Viva" with the cell. (L2-102)
- **AC-19** Given every variant and state in both themes, when axe-core runs, then there are zero serious or critical violations, including scrollable-region-focusable. (L2-100)

### Theming

- **AC-20** Given the dark theme, when the table renders, then the wrapper is charcoal with a light rule, the header fill `--color-bg-surface-sunken`, and selected rows deep amber with full-contrast text. (L2-104)
- **AC-21** Given both themes, when contrast is measured, then cell, header, hovered-row and selected-row text are at least 4.5:1, bulk bar text at least 4.5:1, and the wrapper rule at least 3:1. (L2-103)

### Responsive

- **AC-22** Given a 320 px viewport and the audit log, when it renders, then the wrapper scrolls sideways, headers stay on one line, and the page itself does not scroll horizontally. (L2-096)
- **AC-23** Given a `sticky` row-header column at 360 px, when the wrapper scrolls sideways, then the artist names stay visible on the left over a surface fill. (L2-096)

### Formatting and content

- **AC-24** Given money formatted by the API library's formatting service, when the bookings table renders 237.5, 0 and 650, then the cells read "$237.50", "$0" and "$650", right-aligned with tabular figures. (L2-110)
- **AC-25** Given the French catalogue, when the caption, headers and action names change, then they come from the inputs with no code change and headers still do not wrap. (L2-111)

### Performance

- **AC-26** Given a production build, when a booker loads Discover, then no table or bulk-bar code is in the downloaded chunks. (L2-087)
- **AC-27** Given the `Table`, `TableSelectable` and `BulkBar` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build it as:

- Folder `frontend/projects/components/src/lib/table/`: `table.ts` (`Table`,
  selector `zm-table`), `table-cell.ts` (`TableCell` directive,
  `ng-template[zmTableCell]`, input the column key) and `bulk-bar.ts`
  (`BulkBar`, selector `zm-bulk-bar`); export `TableColumn`, `TableSort`.
- The caption ID comes from a per-instance counter (`zm-table-{n}-caption`),
  stable between server and client render.
- Move the `.table*`, `.bulk-bar*` rules from `components.css` into the two
  stylesheets.
- Composes [`zm-checkbox`](checkbox.md) with `variant="check"`, `[label]`
  as its `aria-label` and nothing projected. It is a ControlValueAccessor with
  no `checked` input or change output: the table keeps one
  `FormControl<boolean>` per row (keyed by `rowKey`, reset from `selected`),
  binds it with `[formControl]`, and emits `selectionChange` from the native
  `change` event. The header box binds its own control, sets
  `[indeterminate]` from the selection and `[controls]` to the row boxes'
  IDs (`zm-table-{n}-select-{key}`). Also composes `zm-icon` (arrow) and
  `zm-skeleton`. Cell templates compose `zm-badge`, `zm-stamp`, `zm-rating` and
  the button family.
- Dev-mode console errors: `dense` with buttons or `selectable`; `selectable`
  with a `sticky` column; `selectable` without `selectRowLabel`.
- Add the `Table`, `TableSelectable` and `BulkBar` scenarios and export them
  from `scenarios/index.ts`.

## Decisions

- **D-1** *Data-driven columns or a projected native table?* Data-driven, with cell templates. Component selectors must be elements (`eslint.config.js`), so the component cannot be the `<table>` or a `<tr>`, and owning the markup is what guarantees `scope`, `aria-sort`, the caption and the loading rows on every admin page.
- **D-2** *Who owns `zm-bulk-bar`?* This CRD. The design system documents `.bulk-bar` only on the table page; `pages/availability/selected` reuses it over the calendar, which references this CRD.
- **D-3** *Which bulk-bar markup, the design system's `<p role="status"><b>` or the mock's `.bulk-bar__count`?* The mock's `.bulk-bar__count` and `.bulk-bar__actions`, which `components.css` styles; the region name comes from the mock's `role="region" aria-label`.
- **D-4** *Is the wrapper focusable?* Yes: `role="region"`, `tabindex="0"`, named by the caption. A table with no links (the dense payment lines) still scrolls sideways at 320 px, and a scroll container keyboard users cannot reach fails WCAG 2.1.1 and axe's scrollable-region-focusable rule.
- **D-5** *Loading: the mocks hide the table (`aria-hidden`, no caption) while the design system keeps the caption and sets `aria-busy`. Which?* The design system's. A real caption with "(loading)" tells screen-reader users what is coming, and the skeletons are hidden anyway.
- **D-6** *Can `aria-sort` mark a column that is not sortable?* Yes. The audit log and bookings mocks mark "When" and "Event date" as the fixed order with no button; `sort` sets `aria-sort` whether or not the column is `sortable`.
- **D-7** *Does the table sort its rows itself?* No. It emits `sortChange`; the page sorts or asks the API, as with paging, so server-sorted admin lists and local sorts share one API.
