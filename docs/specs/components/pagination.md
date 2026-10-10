# Pagination

| Field | Value |
|---|---|
| Selector | `zm-pagination` |
| Library path | `frontend/projects/components/src/lib/pagination/` |
| Status | planned |
| Traces to | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-110, L2-111 |
| Design system | [`pagination.html`](../../design-system/components/pagination.html) |
| Source mocks | None yet. The design system names the lists it is ready for: [`pages/admin-bookings/default`](../../mocks/pages/admin-bookings/default.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/bookings/past`](../../mocks/pages/bookings/past.html), [`pages/requests/default`](../../mocks/pages/requests/default.html) |
| Rendering | [`pagination.html`](pagination.html) |

## Purpose and scope

Pagination splits a long list of records into pages of 20 that people scan,
compare and come back to: Priya Nair's bookings and artists tables, Naomi
Fraser's past bookings, Abigail Mensah's past requests. Each page has its own
URL (`?page=4`), so the back button and shared links work. It sits under the
list: a status line ("Showing 61–80 of 140 bookings") and a row of page links.

Two variants: **numbered** (previous, page numbers with gaps, next) and
**sequential** (two text buttons such as "Newer" and "Older", for short dated
sets where the page number means little).

Use something else when:

- the list is browsed once, top to bottom: load more in place, as the lineup's
  "Show more artists" (L2-010), profile reviews' "Show 10 more" (L2-018) and the
  audit log's "Show older entries" do, with a [button](button.md);
- the views are siblings rather than slices of one list → [tabs](tabs.md).

Never use infinite scroll.

Out of scope:

- Fetching the page, the page size (20, from the data tables and lists
  pattern) and counting the total. The page reads `?page` from the route and
  passes `page`, `pageCount` and the formatted status.
- The loading state of the list. After a page link is followed, the list region
  takes `aria-busy="true"` and shows skeleton rows; the pagination does not
  change until the new page arrives.
- Moving focus after the new page loads. The page moves focus to the list's
  heading or first row.
- Clamping an out-of-range `?page`. The page redirects `?page=99` to the last
  page before rendering.

## Usage

No mock renders pagination yet, and no L2 requirement pages a list yet; every
mocked record list fits on one screen. The API below covers every
configuration on the design-system page so that the lists that grow need no
change to it.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Design system: administrator's bookings table (`pages/admin-bookings`), 63 bookings | numbered, label "Booking pages", page 1 of 4 | status "Showing 1–20 of 63" | previous disabled, page 1 current | canvas |
| Design system: all bookings, 140 bookings | numbered, label "All booking pages", page 4 of 7 | status "Showing 61–80 of 140 bookings" | gaps either side, page 4 current | canvas |
| Design system: Abigail's past bookings in the dashboard | sequential, label "Past booking pages", page 2 of 3 | status "Page 2 of 3", buttons "Newer" / "Older" | both enabled; at the ends one is disabled | canvas |
| Design system: both themes | numbered, page 2 of 4 | status "Showing 8–14 of 23" | hover on page 3 | canvas, light and dark |
| Planned: `pages/admin-artists`, `pages/bookings/past`, past requests on `pages/requests` | numbered, label "Artist pages", "Past booking pages", "Request pages" | status with the list's noun | any page, with the list's filters kept in the URL | canvas |

## Anatomy

1. **Landmark** — the `zm-pagination` host renders `<nav class="pagination">`
   with a specific `aria-label`. Status and list sit on one row, space between,
   and wrap.
2. **Status** — `.pagination__status`: muted mono stub type, "Showing 1–20 of
   63". A polite live region.
3. **List** — `ul.pagination__list`: the row of squares, `--space-1` apart.
4. **Previous / next** — `a.pagination__link` with a chevron
   (`aria-hidden`), named "Previous page" / "Next page". At the ends:
   `aria-disabled="true"` and no `href`.
5. **Page link** — `a.pagination__link`: 44 px square, 2 px frame, numeral in
   the display face at `--font-size-xl`, `aria-label` "Page 2".
6. **Current page** — the same link with `aria-current="page"`: solid ink.
7. **Gap** — `span.pagination__gap`, "…", `aria-hidden`.
8. **Sequential buttons** — in the sequential variant, the list holds two
   `zm-button-link` small buttons with a leading or trailing chevron.

Host: `zm-pagination` is `display: block` and renders exactly one `<nav>`. It
renders nothing when `pageCount` is 1 or less.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The `<nav>`'s `aria-label`, specific to the list: "Booking pages". Never "Pagination" alone, because a page may hold two. |
| `page` | `number` | — | yes | The current page, 1-based, already clamped by the page to 1…`pageCount`. |
| `pageCount` | `number` | — | yes | Total pages. At 1 or less the component renders nothing. |
| `status` | `string` | `''` | no | The formatted status line: "Showing 61–80 of 140 bookings", "Page 2 of 3". Empty renders no status element. |
| `variant` | `'numbered' \| 'sequential'` | `'numbered'` | no | Sequential renders only the two text buttons. |
| `link` | `string \| unknown[]` | `[]` | no | `routerLink` of the list page; `[]` keeps the current route (relative to the injected `ActivatedRoute`). |
| `pageParam` | `string` | `'page'` | no | The query parameter that carries the page number. |
| `queryParams` | `Record<string, string>` | `{}` | no | Extra parameters to set on every page link. The current query string is merged (`queryParamsHandling: 'merge'`), so search terms and filters such as `?status=expired` survive (a design-system rule, D-7). |
| `pageLabel` | `(page: number) => string` | — | yes | Accessible name of a page link, from the catalogue: `(n) => 'Page ' + n`. |
| `previousLabel` | `string` | — | yes | "Previous page" (numbered) or the visible text "Newer" (sequential). |
| `nextLabel` | `string` | — | yes | "Next page" (numbered) or "Older" (sequential). |

### Outputs

None. Every item is a router link; the page reacts to the route's `page`
parameter. Consumers never handle clicks.

### Content slots

None. All copy arrives through inputs (L2-111); the chevrons are `zm-icon`s
the component renders.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Numbered | — | Record lists people compare and return to: admin tables, past bookings, past requests. The default. |
| Sequential | — (the list holds `zm-button-link`s) | Short ordered sets where the number means little: "Newer" / "Older" past bookings in the dashboard. |

Pagination has one size: 44 px squares, which meet the comfortable target on
every screen. The status takes its natural width; the list wraps under it when
the row does not fit.

### Which page numbers show

The same set at every width from SM (≥ 576 px):

- `pageCount` ≤ 5: every page.
- Otherwise: page 1, the last page, and the current page with one page either
  side. Wherever consecutive shown numbers are more than one apart, one gap
  ("…") stands for the missing pages. Page 4 of 7: `1 … 3 4 5 … 7`. Page 1
  of 7: `1 2 … 7`.

Below 576 px (XS) the list shows at most five squares: previous, the current
page and one page either side, and next. Page 1, the last page and the gaps
hide unless they are the current page or its neighbour. Page 4 of 7 at 320 px:
`‹ 3 4 5 ›`.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | `--color-bg-surface` square, `--color-border-strong` frame, `--color-fg-default` numeral | "Page 2, link" |
| Hover | `:hover` | `--color-accent-subtle` fill; no lift | — |
| Focus | `:focus-visible` | Two-tone ring around the square | — |
| Current | `aria-current="page"` | `--color-bg-inverse` fill and frame, `--color-fg-inverse` numeral. Still a link, so it reloads the page. | "Page 4, current page, link" |
| Current, focus | both | Inverse square with the ring outside it | — |
| Disabled previous / next | first or last page | `--color-fg-disabled` chevron and frame on `--color-bg-subtle`, `pointer-events: none`; kept in place so the row does not jump | `aria-disabled="true"`, no `href`: not focusable, announced as unavailable when reached by reading |
| Gap | a run of hidden pages | "…" in `--color-fg-muted`, `--target-min` wide | Hidden (`aria-hidden`) |
| Sequential, disabled end | page 1 ("Newer") or last ("Older") | `zm-button-link` disabled look | As the button CRD's disabled link |
| Single page | `pageCount` ≤ 1 | Nothing rendered | No landmark |
| Loading next page | the page sets `aria-busy` on its list | Pagination unchanged | — |

Page links are never disabled. Pagination appears only on paper, never on the
stage, so it has no surface re-skins.

## Markup

Numbered, page 1 of 4:

```html
<zm-pagination>
  <nav class="pagination" aria-label="Booking pages">
    <p class="pagination__status" role="status">Showing 1–20 of 63</p>
    <ul class="pagination__list">
      <li><a class="pagination__link" aria-disabled="true" aria-label="Previous page"><zm-icon name="chevron-left" aria-hidden="true">…</zm-icon></a></li>
      <li><a class="pagination__link" href="/admin/bookings?page=1" aria-current="page" aria-label="Page 1">1</a></li>
      <li><a class="pagination__link" href="/admin/bookings?page=2" aria-label="Page 2">2</a></li>
      <li><a class="pagination__link" href="/admin/bookings?page=3" aria-label="Page 3">3</a></li>
      <li><a class="pagination__link" href="/admin/bookings?page=4" aria-label="Page 4">4</a></li>
      <li><a class="pagination__link" href="/admin/bookings?page=2" aria-label="Next page"><zm-icon name="chevron-right" aria-hidden="true">…</zm-icon></a></li>
    </ul>
  </nav>
</zm-pagination>
```

With gaps, page 4 of 7. Items that hide below 576 px carry
`.pagination__item--wide` on their `<li>`:

```html
<ul class="pagination__list">
  <li><a class="pagination__link" href="?page=3" aria-label="Previous page">…</a></li>
  <li class="pagination__item--wide"><a class="pagination__link" href="?page=1" aria-label="Page 1">1</a></li>
  <li class="pagination__item--wide"><span class="pagination__gap" aria-hidden="true">…</span></li>
  <li><a class="pagination__link" href="?page=3" aria-label="Page 3">3</a></li>
  <li><a class="pagination__link" href="?page=4" aria-current="page" aria-label="Page 4">4</a></li>
  <li><a class="pagination__link" href="?page=5" aria-label="Page 5">5</a></li>
  <li class="pagination__item--wide"><span class="pagination__gap" aria-hidden="true">…</span></li>
  <li class="pagination__item--wide"><a class="pagination__link" href="?page=7" aria-label="Page 7">7</a></li>
  <li><a class="pagination__link" href="?page=5" aria-label="Next page">…</a></li>
</ul>
```

Sequential, page 2 of 3:

```html
<nav class="pagination" aria-label="Past booking pages">
  <p class="pagination__status" role="status">Page 2 of 3</p>
  <ul class="pagination__list">
    <li><zm-button-link size="sm"><a class="btn btn--sm" href="?page=1"><zm-icon name="chevron-left" />Newer</a></zm-button-link></li>
    <li><zm-button-link size="sm"><a class="btn btn--sm" href="?page=3">Older<zm-icon name="chevron-right" /></a></zm-button-link></li>
  </ul>
</nav>
```

At an end the button is `<a class="btn btn--sm" aria-disabled="true"
tabindex="-1">Older…</a>` (the [button](button.md) CRD's disabled link).

Consumer templates:

```html
<zm-pagination
  [label]="'admin.bookings.pages' | transloco"
  [page]="page()"
  [pageCount]="pageCount()"
  [status]="'admin.bookings.showing' | transloco: { from: from(), to: to(), total: total() }"
  [pageLabel]="pageLabel"
  [previousLabel]="'common.pagination.previous' | transloco"
  [nextLabel]="'common.pagination.next' | transloco"
/>
```

```html
<zm-pagination variant="sequential" [label]="'dashboard.past.pages' | transloco" [page]="page()" [pageCount]="3"
  [status]="'common.pagination.pageOf' | transloco: { page: page(), count: 3 }" [pageLabel]="pageLabel"
  [previousLabel]="'dashboard.past.newer' | transloco" [nextLabel]="'dashboard.past.older' | transloco" />
```

The `.pagination*` classes, `aria-current` and the link names are a contract:
e2e page objects find a page link by its name ("Page 4") and the status by
class. `.pagination__item--wide` is part of the contract for the responsive
visual test.

## Design

- `<nav>`: `display: flex`, `flex-wrap: wrap`, `align-items: center`,
  `justify-content: space-between`, gap `--space-4`.
- List: `display: flex`, `flex-wrap: wrap`, gap `--space-1`, no bullets.
- Square: `min-width` and `min-height` `--target-comfortable`, padding `0
  --space-2` (three-digit pages grow wider), `--text-figure` at
  `--font-size-xl`, no underline, `--border-width-thick` frame, square corners.
- Gap: `min-width: --target-min`, centred, `--color-fg-muted`; under a coarse
  pointer its row height is `--target-comfortable` (it is not a target).
- Status: `--text-stub`, uppercase, `--color-fg-muted`.
- Chevrons: `zm-icon` `chevron-left` / `chevron-right` at the default size.
- No transitions: the hover fill changes instantly.
- Below 576 px: `.pagination__item--wide { display: none }`.

There are no component tokens; the squares read semantic tokens directly.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Square fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Square frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Numeral | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Hover fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Current fill and frame / numeral | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Disabled chevron and frame / fill | `--color-fg-disabled` / `--color-bg-subtle` | `--palette-ink-400` / `--palette-ink-100` | `--palette-ink-600` / `--palette-ink-700` |
| Status, gap | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Focus ring | `--color-focus-ring` | per theme | per theme |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Page numeral |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Current page |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Hovered page |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Status |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Square frame |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring |

Disabled items are exempt from contrast minimums (WCAG 1.4.3) and are also
out of the tab order. The current page is never marked by yellow text: yellow
is a fill on paper, and the current square is inverse. Under forced colours
the frames use `CanvasText` and the current page keeps its border, so it stays
distinct from the others.

## Responsive behaviour

- **XS (< 576 px)**: at most five squares (previous, current ± 1, next); the
  status sits on its own row above the list. At 320 px with the 20 px page
  margin the five squares take 236 px of the 280 px available.
- **SM and up**: status left, list right on one row when they fit; otherwise
  the list wraps under the status. The full set of numbers and gaps shows.
- The pagination never scrolls sideways and the squares never shrink below
  44 px. Four-digit page numbers widen their square through its padding.
- At 200 % zoom the row wraps and every link stays reachable.

## Accessibility

### Role and pattern

A `<nav>` landmark with a specific label and a list of links. There is no APG
widget for pagination; it is plain links with no arrow-key handling. The
current page has `aria-current="page"`. A disabled previous or next is an `<a>`
without `href` plus `aria-disabled="true"`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through previous, the page numbers and next. Disabled ends, gaps and items hidden below 576 px are skipped. |
| <kbd>Enter</kbd> | Follows the link and loads that page (client-side navigation). |

### Focus

The shared two-tone ring around the square. Following a link does not keep
focus on the pagination: the page moves focus to the list's heading or first
row once the new page has loaded (out of scope here).

### Labelling

- Page links are named by `pageLabel`: "Page 2". The visible numeral is
  contained in the name (WCAG 2.5.3).
- Previous and next are icon-only, named "Previous page" and "Next page";
  their chevrons are `aria-hidden`.
- Gaps are `aria-hidden`.
- In the sequential variant the visible text ("Newer", "Older") is the name.

### Announcements

The status paragraph is `role="status"`. It is silent on the first render and
announces politely when its text changes after a client-side page change
("Showing 21–40 of 63").

### Motion

Nothing animates. Scrolling to the results after a page change is the page's
and follows its reduced-motion rule.

## Content and internationalisation

- Status: the range and the total with an en dash, numbers with thousands
  separators: "Showing 1–20 of 63", "Showing 1,001–1,020 of 1,240 bookings"
  (L2-110). Add the noun when the list is not obvious. Sequential: "Page 2 of
  3".
- Plain numerals in the squares; never "Page" in the square.
- Sequential labels name the direction in the list's own terms: "Newer",
  "Older" for dated lists.
- Translatable inputs: `label`, `status`, `pageLabel`, `previousLabel`,
  `nextLabel`. Data values: `page`, `pageCount`. Numerals in squares render
  with the active locale's digits.
- French runs about 30 % longer ("Affichage de 61 à 80 sur 140 réservations");
  the status wraps and the list moves under it.

## Performance

- Change detection: `OnPush`, signal inputs. The list of items (number, gap,
  wide flag) is one `computed` from `page` and `pageCount`; no subscriptions
  except the router's own.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Pagination.ts`
  renders Priya Nair's all-bookings pagination: label "All booking pages",
  page 4 of 7, status "Showing 61–80 of 140 bookings". Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: none.
- Layout stability: the disabled previous or next stays in place, and the
  pagination does not change while the next page loads, so the row never jumps
  (L2-086).
- Imports: `RouterLink`, `zm-icon`, `zm-button-link`. Nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given 63 bookings on page 1 of 4 with label "Booking pages", when the pagination renders, then a `<nav class="pagination">` named "Booking pages" shows "Showing 1–20 of 63", a disabled "Previous page", pages 1–4 with page 1 current, and "Next page" linking to `?page=2`. (L2-100)
- **AC-2** Given page 4 of 7, when it renders at 1280 px, then the list reads previous, 1, gap, 3, 4, 5, gap, 7, next, with page 4 `aria-current="page"`. (L2-096)
- **AC-3** Given page 1 of 7, when it renders, then the list reads previous (disabled), 1, 2, gap, 7, next; given page 7 of 7, then previous, 1, gap, 6, 7, next (disabled). (L2-096)
- **AC-4** Given 5 or fewer pages, when it renders, then every page number shows and there is no gap. (L2-096)
- **AC-5** Given `pageCount` 1, when the list fits on one page, then the component renders nothing and adds no landmark. (L2-102)
- **AC-6** Given the sequential variant on page 2 of 3 with "Newer" and "Older", when it renders, then two small `zm-button-link`s link to `?page=1` and `?page=3` and the status reads "Page 2 of 3"; on page 3, "Older" is a disabled link without `href`. (L2-101)

### States

- **AC-7** Given page 1, when "Previous page" is rendered, then it is an `<a>` with `aria-disabled="true"`, no `href`, the `--color-fg-disabled` look, and it keeps its place in the row. (L2-101)
- **AC-8** Given a pointer over "Page 3", when it hovers, then its square fills with `--color-accent-subtle` and nothing moves. (L2-101)
- **AC-9** Given the current page, when it renders, then its square has the `--color-bg-inverse` fill and `--color-fg-inverse` numeral, and it is still a working link. (L2-100)

### Keyboard and focus

- **AC-10** Given page 1 of 4, when the person tabs through the pagination, then focus visits pages 1, 2, 3, 4 and "Next page", skipping the disabled previous, and each stop shows the two-tone ring. (L2-101)
- **AC-11** Given page 4 of 7, when the person tabs through it, then the gaps are never focused. (L2-101)

### Screen readers

- **AC-12** Given page 4 of 7, when it is read by a screen reader, then the links are announced as "Previous page", "Page 1", "Page 3", "Page 4, current page", "Page 5", "Page 7", "Next page", and the gaps are not announced. (L2-102)
- **AC-13** Given a client-side change from page 1 to page 2, when the status text becomes "Showing 21–40 of 63", then it is announced politely once; on the first render nothing is announced. (L2-102)
- **AC-14** Given a page with the pagination in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-15** Given the dark theme, when the pagination renders, then the frames are `--color-border-strong` (light on charcoal), the current square is paper-light `--color-bg-inverse` with charcoal numerals, and hover is the dim amber `--color-accent-subtle`. (L2-104)
- **AC-16** Given both themes, when contrast is measured, then numerals, the current page, the hovered page and the status are at least 4.5:1, and the frames and focus ring at least 3:1 against the page. (L2-103)

### Responsive

- **AC-17** Given a 320 px viewport on page 4 of 7, when it renders, then the list shows only previous, 3, 4, 5 and next on one row, the status sits above it, and the page does not scroll horizontally. (L2-096)
- **AC-18** Given a touch device, when any page link or previous/next is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-19** Given the French catalogue, when the status is about 30 % longer, then it wraps and the list moves under it without clipping. (L2-111)

### Formatting

- **AC-20** Given 1,240 records on page 51, when the page passes the formatted status, then it reads "Showing 1,001–1,020 of 1,240" with thousands separators and an en dash. (L2-110)

### Motion

- **AC-21** Given `prefers-reduced-motion: reduce`, when a page link is hovered or focused, then the fill and ring appear with no transition. (L2-103)

### Performance

- **AC-22** Given the `Pagination` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/pagination/`, `pagination.ts`,
  class `Pagination`, selector `zm-pagination`, exported from `public-api.ts`.
- A pure function `paginationItems(page, pageCount)` returns `{ kind: 'page' |
  'gap', page?, wide }[]` per the "Which page numbers show" rules; the template
  renders it with one `@for`. Unit-level behaviour is proved through the
  acceptance tests above.
- Page links use `RouterLink` with `[queryParams]="{ ...queryParams(), [pageParam()]: n }"`
  and `queryParamsHandling="merge"`; disabled ends render an `<a>` with no
  `routerLink`.
- Move `.pagination*` from `docs/design-system/assets/components.css` into the
  component stylesheet, and add `.pagination__item--wide` hidden below
  `36rem` (D-2). Add the class to `components.css` too so the design-system
  page and mocks can show it.
- Composes `zm-icon` (`chevron-left`, `chevron-right`; add them to the
  [icon](icon.md) set if missing) and `zm-button-link` with `size="sm"` and
  `disabled` for the sequential variant.
- Add the `Pagination.ts` perf-test scenario and export it from
  `scenarios/index.ts`.

## Decisions

- **D-1** *Which page numbers show at SM and up?* First, last, and current ± 1, with one gap for each skipped run; all pages when there are five or fewer. This reproduces the design system's page-4-of-7 example (`1 … 3 4 5 … 7`) exactly and caps the row at seven squares.
- **D-2** *The design system says that below 576 px "first, current, the pages either side, and last, with gaps" show, and that "seven squares plus previous and next fit in 320 px". Measured, that row is about 388 px (seven 44 px squares, two 24 px gaps, eight 4 px spaces) against 280 px of content width at 320 px, so it wraps. What shows at XS?* Previous, current ± 1 and next: at most five squares, 236 px, on one row. The status line above already says where in the list the person is. The XS set is a subset of the SM set, so the component renders one list and hides first, last and the gaps with `.pagination__item--wide` below 576 px; server and client render the same markup.
- **D-3** *Does a single page render anything?* No. Pagination exists only when the list is longer than one page; the list's own heading carries its count.
- **D-4** *Who computes the status text?* The page, through the catalogue, because it knows the noun and the range. The component only places it and makes it a polite status region, which the design system asks for when pages load without a full reload.
- **D-5** *Does page 1 carry `?page=1`?* Yes, as in the design system's markup. Every page link has the same shape, and the page treats a missing parameter as page 1.
- **D-6** *How are page-link names translated?* Through a `pageLabel` function, because the name embeds a number and the component may not hard-code "Page" (L2-111). The page passes a function that calls its translation service with the number.
- **D-7** *Do filters survive a page change?* Yes: links merge the current query string, so `?status=expired` and a search term stay while `page` changes. Changing a filter resetting to page 1 is the page's job.
