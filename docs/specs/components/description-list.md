# Description list

| Field | Value |
|---|---|
| Selector | `zm-description-list` |
| Library path | `frontend/projects/components/src/lib/description-list/` |
| Status | planned |
| Traces to | L2-034, L2-037, L2-039, L2-044, L2-046, L2-047, L2-067, L2-068, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`description-list.html`](../../design-system/components/description-list.html) |
| Source mocks | [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html) and every booking status, [`pages/request-detail/default`](../../mocks/pages/request-detail/default.html) and its states, [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/apply/success`](../../mocks/pages/apply/success.html), [`pages/server-error/default`](../../mocks/pages/server-error/default.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/admin-artist/default`](../../mocks/pages/admin-artist/default.html), [`pages/admin-reviews/default`](../../mocks/pages/admin-reviews/default.html), [`dialogs/accept-request/default`](../../mocks/dialogs/accept-request/default.html), [`dialogs/cancel-booking/default`](../../mocks/dialogs/cancel-booking/default.html), [`dialogs/pay-deposit/default`](../../mocks/dialogs/pay-deposit/default.html), [`dialogs/issue-refund/default`](../../mocks/dialogs/issue-refund/default.html), [`dialogs/hide-review/default`](../../mocks/dialogs/hide-review/default.html) |
| Rendering | [`description-list.html`](description-list.html) |

## Purpose and scope

A description list pairs a label with a value for one record. It is how a
booking reads: date, start time, gathering, church, artist, quoted price; and
how its money reads, printed like a till receipt: "Quoted price, locked $650 ·
Deposit after she accepts (25%) $162.50 · Paid so far $0". One component renders
the four looks the design system documents: the stacked `.dl`, the ruled
`.dl--horizontal`, the record-details `.definition` grid and the money
`.receipt`.

Use something else when:

- several records are compared → [table](table.md);
- items have no labels → [list](list.md);
- it is a booking row in a list → [booking list](booking-list.md).

Out of scope:

- The heading and the region around the list ("The request", "Payment"). The
  page or the [card](card.md) panel owns them, including the panel head with
  the booking code.
- Computing money: the API returns the deposit, balance, fee and payout; the
  API library's formatting service formats them (L2-110).
- Masking contact details before confirmation (L2-046): the API returns the
  values the viewer may see.
- Edit links inside a value ("Change date") and their behaviour; the consumer
  projects them through a value template.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/booking-detail/*` "The request"; `pages/request-detail/*` "The event" | `definition`, two columns | "Date · Saturday 14 November 2026", "Service start time · 7:00 p.m.", "Artist · [Abigail Mensah], Brampton · 44 km", "Abigail's phone · [905-555-0148]" once Confirmed | default | canvas |
| `pages/booking-detail/*` payment aside; dialogs `pay-deposit`, `pay-balance`, `cancel-booking`, `artist-cancel-booking`, `withdraw-request`, `report-problem`, `delete-account` | `receipt`, `label` "Payment summary for ZAM-0114" | rows + `total` "Paid so far $162.50"; a stamp value "Status · Confirmed" | default | raised panel, dialog |
| `pages/request-detail/*`, `dialogs/accept-request`, `dialogs/decline-request`, `dialogs/artist-cancel-booking` | `receipt` + `fine` | "Quoted price, locked $650 · Zamaro 8% −$52 · You receive $598"; fine "You'll be paid $598 after the event." | default | panel, dialog |
| `pages/book/default`, `pages/book/success` | `definition` two columns; `receipt` "What you would pay" | "Church · Riverside Community Church", "Contact phone · 905-555-0123"; "Due today $0" | default | stub surface |
| `pages/apply/success` | `receipt` + `fine` | "Application · A-0219", "Reply by · Thu 15 Oct"; "3 business days. Monday 12 Oct is Thanksgiving." | default | surface |
| `pages/server-error/default` | `receipt` | "Reference · 7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17", "When · Fri 9 Oct, 10:42 a.m." | default | stage |
| `pages/admin-application/*`, `pages/admin-artist/*`, `dialogs/reinstate-artist`, `dialogs/reject-application` | `definition` one or two columns | "Account email", "Rating · ★ 4.6", "Decision · Approved Fri 9 Oct, 2:10 p.m. by Priya Nair" | default | panel |
| `pages/admin-booking/*`, `dialogs/issue-refund`, `dialogs/resolve-hold` | `definition` two columns; `receipt` "Money summary for ZAM-0097" | "Booker · Naomi Fraser · naomi.fraser@riversidecc.ca"; "Refundable now $237.50" | default | panel, dialog |
| `pages/admin-reviews/*`, `dialogs/hide-review` | `definition` one column | "Personal information · Elijah Park · Thu 8 Oct, 4:51 p.m. / “That's my manager's personal cell number.”" (two lines) | default | panel |
| Loading pages (`pages/booking-detail/loading`, `pages/request-detail/loading`) | any, `loading` | real terms, skeleton values | loading | canvas, panel |
| Design system only | `stack`, `horizontal`, `stub`; values `muted` ("When Abigail accepts") and `changed` ("Sun 15 Nov") | booking summary | not set, changed | stub, card |

## Anatomy

1. **List** — `<dl>` with the variant class: `.dl`, `.dl.dl--horizontal`,
   `.definition` (`.definition--two`) or `.receipt`; `.dl--stub` adds the mono
   face to `.dl`.
2. **Group** — a `<div>` around each pair, the only wrapper HTML allows:
   plain in `.dl`, `.definition__row` in `.definition`, `.receipt__row` in
   `.receipt` (plus `.receipt__total` on the total).
3. **Term** — `<dt>`: overline, muted, uppercase (`.receipt`: stub face,
   muted, regular weight).
4. **Value** — `<dd>`: body text, full strength (`.dl--stub` and `.receipt`:
   stub face; receipt amounts right-aligned, tabular).
5. **Total (receipt)** — the last row in the display face between two thick
   rules.
6. **Fine print (receipt)** — `<p class="receipt__fine">` after the list.

Host: `zm-description-list` is `display: block`. With `label`, the host gets
`role="group"` and `aria-label`; it renders the `<dl>` and, for a receipt with
`fine`, the fine-print paragraph after it.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `items` | `readonly DescriptionItem[]` | — | yes | In reading order: who, when, what, where, how much. Tracked by `id`. |
| `variant` | `'stack' \| 'horizontal' \| 'definition' \| 'receipt'` | `'definition'` | no | The list class (see Variants). |
| `stub` | `boolean` (attribute) | `false` | no | Adds `.dl--stub` to `stack` and `horizontal`. Ignored by the others (the receipt is already stub-faced). |
| `columns` | `1 \| 2` | `1` | no | `definition` only: `2` adds `.definition--two` (two columns from SM). |
| `label` | `string` | — | no | Names the list as a group ("Payment summary for ZAM-0114"): the host gets `role="group"` and `aria-label`. Never set on the `<dl>`. |
| `fine` | `string` | `''` | no | `receipt` only: fine print after the list. |
| `loading` | `boolean` (attribute) | `false` | no | Terms stay; every value is a skeleton; `aria-busy="true"` on the `<dl>`. |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden "Loading" in each value. |

`DescriptionItem`:

| Field | Type | Rule |
|---|---|---|
| `id` | `string` | Stable key; also selects a value template. |
| `term` | `string` | "Deposit 25%", "Quoted price, locked". |
| `value` | `string?` | Plain text value: "$162.50", "Saturday 14 November 2026". Line breaks in the string (`\n`) render as `<br>`. |
| `muted` | `boolean?` | A value that does not exist yet ("When Abigail accepts"): `--color-fg-muted`. |
| `changed` | `boolean?` | Wraps the value in `<mark class="mark">` (the yellow highlighter). |
| `total` | `boolean?` | `receipt` only: adds `.receipt__total`. At most one, the last row. |

### Outputs

None. Links and buttons inside values belong to the consumer's templates.

### Content templates

| Template | Context | Rule |
|---|---|---|
| `<ng-template zmDescriptionValue="artist" let-item>` | `DescriptionItem` | Replaces the value of the item with that `id`: a link ("[Abigail Mensah], Brampton · 44 km"), a `tel:`/`mailto:` link, an inline [rating](rating.md), a [status stamp](stamp.md) or a trailing "Change date" link. Rendered inside the `<dd>`. |

Templates are collected once with `contentChildren`; there is no `ng-content`.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Stack | `.dl` | Narrow places: a card, a dialog; term over value, `--space-3` between pairs. |
| Horizontal | `.dl.dl--horizontal` | A full summary: term column (min 8 rem, one third), rule under each pair. |
| Stub | `.dl--stub` with stack or horizontal | Values in the ticket-stub face, as on the booking stub. |
| Definition | `.definition` (`.definition--two`) | Facts of one booking or record on detail pages and dialogs; the default. |
| Receipt | `.receipt` | Money and reference lists: label left, amount right, dashed rule, a total row. |

One size. Width comes from the container.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Term over (or beside) value | "description list, 6 items"; term then value |
| Not set | `muted` | Value in `--color-fg-muted`, saying when it will exist | Read as text |
| Changed | `changed` | Value inside `.mark` (`--color-accent` fill, `--color-fg-on-accent` text) | Read as text; the page's status region says what changed |
| Total | `total` | Display face between two `--border-width-thick` rules | Read as a pair |
| Rich value | value template | Link, rating, stamp in the value | Their own roles |
| Loading | `loading` | Real terms; `zm-skeleton` `text short` per value | `aria-busy="true"` on the `<dl>`; "Loading" per value |
| Inert | page `inert` behind a dialog | — | Not reachable |

## Markup

Definition, two columns:

```html
<zm-description-list>
  <dl class="definition definition--two">
    <div class="definition__row"><dt>Date</dt><dd>Saturday 14 November 2026</dd></div>
    <div class="definition__row"><dt>Artist</dt><dd><a href="/artists/abigail-mensah">Abigail Mensah</a>, Brampton · 44 km</dd></div>
  </dl>
</zm-description-list>
```

Receipt with a label, a total and fine print:

```html
<zm-description-list role="group" aria-label="Payment summary for ZAM-0114">
  <dl class="receipt">
    <div class="receipt__row"><dt>Quoted price, locked</dt><dd>$650</dd></div>
    <div class="receipt__row"><dt>Zamaro 8%</dt><dd>−$52</dd></div>
    <div class="receipt__row receipt__total"><dt>You receive</dt><dd>$598</dd></div>
  </dl>
  <p class="receipt__fine">You'll be paid $598 after the event.</p>
</zm-description-list>
```

Stack, stub, not set and changed:

```html
<dl class="dl dl--stub">
  <div><dt>Date</dt><dd><mark class="mark">Sun 15 Nov</mark></dd></div>
  <div><dt>Deposit 25%</dt><dd class="text-muted">When Abigail accepts</dd></div>
</dl>
```

Horizontal adds `.dl--horizontal`; the structure is the same.

Loading:

```html
<dl class="definition definition--two" aria-busy="true">
  <div class="definition__row"><dt>Date</dt><dd><zm-skeleton class="skeleton skeleton--text skeleton--short" aria-hidden="true"></zm-skeleton><span class="visually-hidden">Loading</span></dd></div>
</dl>
```

Consumer templates:

```html
<zm-description-list [columns]="2" [items]="requestFacts()">
  <ng-template zmDescriptionValue="artist"><a [routerLink]="['/artists', booking().artistSlug]">{{ booking().artistName }}</a>, {{ booking().artistPlace }}</ng-template>
</zm-description-list>
<zm-description-list variant="receipt" [label]="'booking.payment.label' | transloco: { number: booking().number }" [items]="paymentLines()" />
```

The `.dl`, `.definition*` and `.receipt*` classes and the `<dt>`/`<dd>` pairs are
the contract: e2e page objects read a value by its term.

## Design

- `.dl`: grid, gap `--space-3`; pair column gap `--space-0-5`; term
  `--text-overline`, `--letter-spacing-stamp`, uppercase, `--color-fg-muted`;
  value `--text-body`.
- `.dl--horizontal` pair: grid `minmax(8rem, 1fr) 2fr`, gap `--space-4`,
  `padding-block: --space-3`, bottom rule `--border-width-hairline`
  `--color-border-default`; term `padding-top: --space-1`.
- `.dl--stub` value: `--text-stub`, uppercase.
- `.definition`: grid, gap `--space-4`; row gap `--space-0-5`; term as `.dl`;
  `.definition--two` two equal columns from SM (`--layout-breakpoint-sm`,
  576 px), rows aligned to the top.
- `.receipt`: grid, `--text-stub`, uppercase. Row: flex, space-between, gap
  `--space-4`, `padding-block: --space-2`, bottom rule `--border-width-hairline`
  dashed `--color-border-strong`. Term muted, regular weight. Value right-aligned,
  tabular figures, `overflow-wrap: anywhere`, `min-width: 0`.
- `.receipt__total`: `padding-block: --space-3`, top and bottom
  `--border-width-thick` `--color-border-strong`, `--font-size-2xl` in
  `--font-family-display`; its term `--color-fg-default`.
- `.receipt__fine`: `padding-top: --space-2`, `--text-caption`, muted, no
  transform.
- No motion.

No component tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Value, total | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Term, not-set value, fine print | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Horizontal rule | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Receipt rules | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Changed highlighter | `--color-accent` / `--color-fg-on-accent` | `--palette-signal-500` / `--palette-ink-750` | `--palette-signal-500` / `--palette-ink-750` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Terms on the page (12 px) |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Terms and fine print in a panel |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Values |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Changed value |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Terms on the server-error stage |

Rules are decorative and exempt from WCAG 1.4.11.

## Responsive behaviour

- `stack` works at every width; values wrap under their term.
- `horizontal` keeps two columns down to 320 px (term min 8 rem); keep terms to
  two words.
- `definition` with two columns is one column below SM and two from SM
  (576 px); rows align to the top so a long church name does not push its
  neighbour.
- `receipt` keeps label and amount on one line; a long label wraps while the
  amount stays right; a long unbroken value (an error reference) breaks
  anywhere rather than overflowing.
- At 320 px nothing overflows; at 200 % zoom the grid falls back to the narrow
  layout and stays readable.

## Accessibility

### Role and pattern

A native `<dl>` with `<div>` groups; no APG pattern. Never a two-column table or
bold spans. A receipt that needs a name gets it from a `role="group"` host, not
from an `aria-label` on the `<dl>`, which has no role that takes a name.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the list; only links or buttons inside values receive focus. |

### Focus

None on the list. Links in values get the shared ring.

### Labelling

- Terms are visible text and label their values.
- The page introduces the list with a heading; `label` is for a receipt with no
  heading of its own, as in a dialog.
- Loading values carry "Loading" in visually hidden text; the `<dl>` has
  `aria-busy="true"`.

### Announcements

None. A changed value is announced through the page's status region ("Abigail
moved this to Sun 15 Nov"), not by the highlighter.

### Motion

None. Loading skeletons stop shimmering under `prefers-reduced-motion`
([skeleton](skeleton.md)).

## Content and internationalisation

- Terms are one or two nouns, sentence case: "Artist", "Date", "Fee",
  "Deposit 25%". Put the rule in the term: "Deposit after she accepts (25%)".
- Values are complete: "Saturday 14 November 2026", "Riverside Community
  Church, Burlington", "$650". Add the year in summaries (L2-110).
- Money: "$650", "$162.50", "−$52" (L2-110). Payouts state the fee and the
  result: "Zamaro 8% −$52 · You receive $598" (L2-039).
- A value that does not exist yet says when: "When Abigail accepts"; never
  "N/A" or an empty `<dd>`.
- Terms, labels and fine print come from the catalogue; values are formatted
  data (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs, `@for … track item.id`, the
  template map from one `computed`. No `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/DescriptionList.ts`
  renders "The request" for ZAM-0114 (six definition rows, two columns, the
  artist link template). Add `Receipt.ts`, which renders Abigail's payout
  receipt ($650, −$52, $598) with fine print. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Layout stability: loading keeps the real terms and a one-line skeleton per
  value, so the swap does not move rows (L2-105).
- Imports: Angular core, `NgTemplateOutlet`, `zm-skeleton`.

## Acceptance criteria

### Rendering

- **AC-1** Given ZAM-0114's request facts, when `variant="definition"` with `columns` 2 renders, then it is one `<dl class="definition definition--two">` of `.definition__row` groups, each with one `<dt>` and one `<dd>`, starting "Date · Saturday 14 November 2026". (L2-034)
- **AC-2** Given the artist value template, when "The request" renders, then the Artist value is a link "Abigail Mensah" followed by ", Brampton · 44 km". (L2-034)
- **AC-3** Given ZAM-0114 is Confirmed, when the booking page renders the contact rows, then "Abigail's phone" holds a `tel:` link "905-555-0148" and "Abigail's email" a `mailto:` link. (L2-046)
- **AC-4** Given Abigail's payout receipt, when `variant="receipt"` renders "Quoted price, locked $650", "Zamaro 8% −$52" and the total "You receive $598" with `fine` "You'll be paid $598 after the event.", then amounts are right-aligned in tabular figures, the total row has `.receipt__total`, and the fine print is a `.receipt__fine` paragraph after the `<dl>`. (L2-039)
- **AC-5** Given the pay-deposit dialog, when its receipt renders, then it reads "Deposit after she accepts (25%)" with "$162.50". (L2-037)
- **AC-6** Given the cancel-booking dialog, when its receipt "What cancelling refunds" renders, then each refund line and the total appear as receipt rows. (L2-044)
- **AC-7** Given the issue-refund dialog for ZAM-0097, when its receipt renders, then the total reads "Refundable now $237.50". (L2-068)
- **AC-8** Given Tobi Adeyemi's application confirmation, when the receipt renders, then it reads "Application A-0219" and "Reply by Thu 15 Oct", with fine print "3 business days. Monday 12 Oct is Thanksgiving." (L2-047)
- **AC-9** Given the admin artist record for Marcus Bell Trio, when its definition list renders a rating value template, then the Rating value is the inline rating named "Rated 4.6 out of 5". (L2-067)
- **AC-10** Given a value string with a line break ("Elijah Park · Thu 8 Oct, 4:51 p.m.\n“That's my manager's personal cell number.”"), when it renders, then the value shows two lines separated by a `<br>`. (L2-111)
- **AC-11** Given `variant="horizontal"` with `stub` at 320 px, when it renders, then the `<dl>` has `.dl.dl--horizontal.dl--stub`, terms sit in a column of at least 8 rem, values in the stub face wrap beside them, and nothing overflows. (L2-096)

### States

- **AC-12** Given the Deposit value is `muted` "When Abigail accepts", when it renders, then the value is `--color-fg-muted` and the `<dd>` is never empty. (L2-037)
- **AC-13** Given `loading`, when the list renders, then every term is real text, every value is a single-line `zm-skeleton` with visually hidden "Loading", and the `<dl>` has `aria-busy="true"`. (L2-105)
- **AC-14** Given the values load, when they replace the skeletons, then the cumulative layout shift is 0.05 or less. (L2-105)

### Screen readers

- **AC-15** Given a receipt with `label` "Payment summary for ZAM-0114", when it is read, then the host is a group named "Payment summary for ZAM-0114" and the `<dl>` has no `aria-label`. (L2-102)
- **AC-16** Given every variant and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the dark theme, when a receipt renders in a raised panel, then values use `--color-fg-default`, terms `--color-fg-muted` and the rules `--color-border-strong` on the charcoal surface. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then terms and fine print are at least 4.5:1 on the canvas and the surface, and a `changed` value, inside `<mark class="mark">`, at least 4.5:1 on yellow. (L2-103)

### Responsive

- **AC-19** Given a definition list with `columns` 2, when the viewport is 575 px, then it renders one column, and from 576 px two columns with rows aligned to the top. (L2-096)
- **AC-20** Given a 320 px viewport and the server-error reference "7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17", when the receipt renders, then the value breaks inside the string, the label stays left, and the page does not scroll horizontally. (L2-096)

### Formatting

- **AC-21** Given the money values formatted by the API library's formatting service, when the receipt renders 650, 162.5 and 1800, then they read "$650", "$162.50" and "$1,800". (L2-110)

### Performance

- **AC-22** Given the `DescriptionList` and `Receipt` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build it as:

- Folder `frontend/projects/components/src/lib/description-list/`:
  `description-list.ts` (`DescriptionList`, selector `zm-description-list`) and
  `description-value.ts` (`DescriptionValue` directive,
  `ng-template[zmDescriptionValue]`, input the item `id`); export the
  `DescriptionItem` type.
- Move the `.dl*`, `.definition*`, `.receipt*` and `.mark` rules from
  `components.css` into the component stylesheet, replacing the inline display
  shorthand on `.receipt__total` with `--font-size-2xl` and
  `--font-family-display` (already tokens).
- Split `value` on `\n` into text nodes with `<br>`, never `innerHTML`.
- Dev-mode console errors: `total` on more than one row or outside `receipt`;
  `stub` or `fine` on a variant that ignores it.
- Add the `DescriptionList` and `Receipt` scenarios and export them from
  `scenarios/index.ts`.

## Decisions

- **D-1** *One component for `.dl`, `.definition` and `.receipt`?* Yes, with `variant`. The design system documents all four on the description-list page, they share the `<dl>` and `<div>` structure, and the mocks use `.definition` and `.receipt` side by side on every booking page.
- **D-2** *Which variant is the default?* `definition`. It is the most used in the mocks (176 lists); the design system's plain `.dl` is not used by any mock yet.
- **D-3** *Where does the receipt's name go, given the mocks put `aria-label` on the `<dl>` and the design system forbids it?* On a `role="group"` host. The design system's rule is right (a `<dl>` takes no name), and the mocks' names ("Payment summary for ZAM-0114") are kept by giving them to a group.
- **D-4** *Rich values: projected content or templates?* Templates keyed by item `id`. A component cannot project into a specific `<dd>` of a data-driven list, and most values are plain strings; the template covers the links, ratings and stamps.
- **D-5** *How are two-line values written?* As `\n` in the value string, rendered as `<br>` text nodes. The admin review report rows need a line break, and allowing HTML in values would bypass output encoding (L2-075).
- **D-6** *How is a loading value announced, given `zm-skeleton` is always hidden?* With visually hidden "Loading" text in each `<dd>`, in place of the design system's `role="img"` skeleton, matching the skeleton CRD.
