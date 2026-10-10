# Empty state

| Field | Value |
|---|---|
| Selector | `zm-empty-state`, `zm-date-swap` |
| Library path | `frontend/projects/components/src/lib/empty-state/`, `frontend/projects/components/src/lib/date-swap/` |
| Status | built (`zm-empty-state`); planned (`zm-date-swap`) |
| Traces to | L2-011, L2-020, L2-027, L2-033, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`empty-state.html`](../../design-system/components/empty-state.html) |
| Source mocks | [`pages/discover/empty`](../../mocks/pages/discover/empty.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/saved/empty`](../../mocks/pages/saved/empty.html), [`pages/bookings/empty`](../../mocks/pages/bookings/empty.html), [`pages/bookings/no-results`](../../mocks/pages/bookings/no-results.html), [`pages/booking-detail/forbidden`](../../mocks/pages/booking-detail/forbidden.html), [`pages/dashboard/forbidden`](../../mocks/pages/dashboard/forbidden.html), [`pages/book/invalid`](../../mocks/pages/book/invalid.html), and every other `empty` and `no-results` state (see Usage) |
| Rendering | [`empty-state.html`](empty-state.html) |

## Purpose and scope

An empty state is a dashed, blank ticket with a rubber stamp across it: "Sold
out", "Fresh on the bill". It replaces a list or section that came back with
nothing, says why in plain words, and gives one good next move. It covers four
situations: no results (a search found nobody, L2-011), filtered out, first run
(no bookings, no saved artists, L2-027) and nothing yet (a new artist's empty
profile section, L2-020). The same frame also carries the in-shell "you can't
open this" states (a mistyped or someone else's booking link, a church opening
the artist area).

`zm-date-swap` is the grid of nearby-date buttons ("Wed 23 Dec · 1 choir
free") an empty state offers after a search, and that the request form offers
under a date error. It is specified here because the design system defines it
on the empty-state page.

Use something else when:

- the content failed to load → an [alert](alert.md) for a section, the
  [error page](error-page.md) for a whole page;
- it is still loading → a [skeleton](skeleton.md);
- the gallery has no photos → the act-type [artwork](artwork.md) placeholder
  (L2-020.3), not an empty state.

Out of scope:

- Deciding the copy, counts and alternatives (the nearby dates, the smallest
  wider radius with matches, the filters to clear). The page computes them
  (L2-011) and passes formatted strings.
- Re-running the search when a date swap or action is pressed, and putting the
  lineup back into its loading state. The page owns it.
- The buttons and links in the actions slot: [button](button.md) and
  [link](link.md) own them.
- The surrounding section and its heading ("The lineup", "Watch her lead").

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/empty` lineup | full, `live`, stamp "Sold out", h3 "Nobody’s free Christmas Eve within 40 km" | sentence; `zm-date-swap` heading "Nearby dates with choirs free" (h4), Wed 23 Dec 1 choir free, Sun 27 Dec 3 choirs free, Sun 20 Dec 2 choirs free; actions: primary "Search within 120 km · 2 free" + arrow, secondary "Show all styles" | appearing after a search; date swap hover, focus, busy "Checking…"; button busy "Checking calendars…" | canvas |
| `pages/saved/empty` | full, `live`, stamp "Empty house", h2 "No saved artists yet" | sentence; action: primary link "Find who’s free" + arrow | first run | canvas |
| `pages/bookings/empty` | full, stamp "Admit one", h2 "No bookings yet" | sentence; action: primary lg link "Find who’s free" + arrow | first run, at page load | canvas |
| `pages/bookings/no-results` | quiet, `live`, stamp "No shows", h2 "No expired bookings" | sentence; action: secondary "Clear status filter" with icon | filtered out | canvas |
| `pages/artist/empty`, `pages/artist/no-photos` videos | quiet, stamp "Fresh on the bill", h3 "No videos yet" | sentence; action: secondary link "Ask Miriam for a recording" | nothing yet | canvas, inside a profile section |
| `pages/artist/empty`, `pages/artist/no-photos` reviews | quiet, stamp "Opening night", h3 "No church reviews yet" | sentence; action: primary link "Be her first booking" | nothing yet | canvas |
| `pages/profile-preview/empty` | as the two above | actions disabled (preview) | disabled actions | canvas |
| `pages/edit-profile/empty` videos | quiet, stamp "Fresh on the bill", h3 "No videos yet" | sentence; action: secondary "Add a video" with icon | nothing yet | surface |
| `pages/dashboard/empty`, `pages/requests/empty`, `pages/earnings/empty`, `pages/artist-reviews/empty` | full, `landmark`, stamps "Quiet week", "Nothing yet", "$0 so far", "Opening night"; h2 | sentence; one primary link with icon ("Set your availability", "Check your availability", "See your requests", "Mark your free dates") | first run | canvas |
| `pages/admin-applications/empty`, `pages/admin-checks/empty`, `pages/admin-reviews/empty` | full, `landmark`, stamps "All caught up", "All clear"; h2 | sentence; one primary link ("Open artists", "Open the audit log") | first run | canvas |
| `pages/availability/empty` | quiet, `landmark`, no stamp, h2 "Every date is Free" | sentence; primary link "Mark dates unavailable" | first run | canvas, above the calendar |
| `pages/requests/no-results`, `pages/admin-artists/no-results`, `pages/admin-bookings/no-results`, `pages/admin-audit/no-results` | quiet, `landmark`, `live`, no stamp, h2 "No new requests match “Lakeshore”", "No artists match “Tobi”"… | sentence; primary "Clear search" / "Clear filters" with icon, optional secondary link "Open applications" | filtered out after a search | canvas |
| `pages/booking-detail/forbidden` | full, stamp "No such ticket", h2 "Check the link" | sentence; primary link "Go to your bookings" + arrow, secondary anchor "Email hello@zamaro.ca" | at page load (404) | canvas |
| `pages/dashboard/forbidden` | full, `landmark`, stamp "Artists only", **h1** "This page is for artists" | sentence; primary link "Back to Discover" with icon + a text [link](link.md) "Lead worship yourself? Apply as an artist" | at page load | canvas |
| `pages/book/invalid` date field | `zm-date-swap` alone, no heading, `label` "Abigail’s next 3 free dates": Tue 17 Nov, Wed 18 Nov, Thu 19 Nov, each "Open all day" | — | default, hover, focus | form surface, under a field error |
| Design system only | filtered out: stamp "No match", "Nobody free leads hymns in Spanish", primary "Remove “Hymns”", secondary "Clear all filters" | — | default | canvas |

## Anatomy

`zm-empty-state`:

1. **Container** — the host, `.empty` (`.empty--quiet` for the quiet size).
   `--color-bg-surface` with a `--border-width-thick` dashed
   `--color-border-strong` rule, one column, left-aligned.
2. **Stamp (optional)** — `.empty__stamp`, a `<p aria-hidden="true">`: a
   2 px-ruled rubber stamp in `--text-h4`, uppercase, tilted −3°, `currentColor`.
3. **Title** — `.empty__title` on a real heading (`h1`–`h4`): what is missing.
4. **Body** — the default slot: one or two sentences, and optionally a
   `zm-date-swap`.
5. **Actions** — `.empty__actions`, a wrapping row holding the `[slot=actions]`
   content: one primary, at most one secondary, optionally a text link.
   Hidden when empty.

`zm-date-swap`:

1. **Heading (optional)** — an `h3`–`h5` over the list ("Nearby dates with
   choirs free"), in a `.stack` with the list.
2. **List** — `ul.date-swap[role=list]`: a grid of cells at least 9 rem wide.
3. **Swap** — `li > button[type=button]` holding `<strong>` date (`--text-figure`,
   uppercase), a space, and the count ("2 choirs free", "Open all day").

Host: `zm-empty-state` is the container itself and carries `.empty`. The
heading, body and actions render inside it. `zm-date-swap` is `display: block`
and renders the `.stack` (with a heading) or the bare list (without).

## API

### `zm-empty-state` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | — | yes | The title text. |
| `headingLevel` | `1 \| 2 \| 3 \| 4` | `2` | no | The title's element: `h1` only where the empty state is the page's main content (`pages/dashboard/forbidden`); `h3` inside a section with an `h2`. |
| `stamp` | `string \| undefined` | `undefined` | no | Two or three words of poster voice. `undefined` renders no stamp. Always `aria-hidden`. |
| `quiet` | `boolean` (attribute) | `false` | no | Adds `.empty--quiet`. |
| `live` | `boolean` (attribute) | `false` | no | Sets `role="status"` on the host, for an empty state that appears because of something the person did (a search, a filter). |
| `landmark` | `boolean` (attribute) | `false` | no | Sets `role="region"` and `aria-labelledby` to the title's generated ID, where the empty state replaces a page's main content. Ignored when `live` is set (`role="status"` wins). |

### `zm-date-swap` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `dates` | `readonly { value: string; date: string; detail: string }[]` | — | yes | One button per entry, in the given order. `value` is the ISO date ("2026-12-23"); `date` the short date ("Wed 23 Dec"); `detail` the count or note ("1 choir free", "Open all day"). |
| `heading` | `string \| undefined` | `undefined` | with no `label` | Renders a heading over the list. |
| `headingLevel` | `3 \| 4 \| 5` | `4` | no | The heading's element. |
| `label` | `string \| undefined` | `undefined` | with no `heading` | `aria-label` on the list when there is no visible heading ("Abigail’s next 3 free dates"). With a heading, the list is `aria-labelledby` the heading instead. |
| `busyValue` | `string \| null` | `null` | no | The `value` whose search is running. That button gets `aria-busy="true"` and `aria-disabled="true"` and shows `busyDetail` in place of its detail; every button ignores activation while one is busy. |
| `busyDetail` | `string` | `''` | when `busyValue` is set | "Checking…". |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `zm-date-swap` `datePicked` | `string`, the ISO `value` | A swap is activated by click, Enter or Space and no swap is busy. |
| `zm-empty-state` | None | Actions are projected buttons and links; consumers listen to them directly. |

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-empty-state` default | `<p>` sentences, one `zm-date-swap` | Rendered after the title in source order. Date swaps go after the sentence and before the actions. |
| `zm-empty-state` `[slot=actions]` | `zm-button`, `zm-button-link`, `zm-button-anchor` (any size), one `zm-link` | Rendered in `.empty__actions`, which wraps and is hidden with `:empty`. |
| `zm-date-swap` | None | Swaps come from `dates`. |

Each slot is declared once. Every string arrives as an input or projected
content (L2-111).

## Variants and sizes

| Variant | Modifier / input | Use for |
|---|---|---|
| No results | `live`, stamp, date swaps, wider-radius action | A search found nobody (L2-011). |
| Filtered out | `live`, quiet or full, "Remove …" / "Clear …" actions | Filters or a search box hide everything. |
| First run | full, no live role | Nothing has happened yet: no bookings, no saved artists, an empty queue. |
| Nothing yet | quiet | A new artist's empty profile section (L2-020). |
| Can't open | full, h1 or h2, no live role | A link to someone else's booking (404, L2-033) or the artist area for a church. |

| Size | Modifier | Padding | Gap | Title |
|---|---|---|---|---|
| Full | — | `--space-10` × `--space-8` (`--space-8` × `--space-5` below SM) | `--space-6` | `--text-h2` |
| Quiet | `.empty--quiet` | `--space-6` | `--space-4` | `--text-h4` |

The width is the container's. Use full where the empty state replaces a page's
main list; quiet inside a section, a stub or a dialog.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| At page load | rendered with the page | Dashed ticket | Read in page order; no live role |
| Appearing after a search | `live`, inserted in place of skeletons | Same | `role="status"`: the title and sentence are announced politely |
| Date swap hover | `:hover` on a swap | `--color-accent` fill, `--color-fg-on-accent` label, `--color-border-on-accent` rule, `--shadow-1`, lifted by `--transform-lift` | — |
| Date swap focus | `:focus-visible` | Two-tone ring (`--color-focus-ring` outline at `--focus-ring-offset`, `--color-focus-ring-offset` gap) and the hover lift | — |
| Date swap active | `:active` | Accent fill, no lift, no shadow | — |
| Date swap busy | `busyValue` matches | Detail reads "Checking…", `cursor: progress`, accent fill kept | `aria-busy="true"`, `aria-disabled="true"`, focus kept |
| Actions busy | the projected button's `busy` | Busy button ("Checking calendars…") | Button CRD |
| Actions disabled | the projected buttons' `disabled` (profile preview) | Disabled buttons | Out of the tab order |
| No stamp | `stamp` undefined | Title first | — |
| No actions | nothing in `[slot=actions]` | `.empty__actions` takes no space | — |
| Replaced | the page removes it when a search re-runs or content arrives | Gone, never shown beside the list | — |

## Markup

Rendered by `zm-empty-state`, no results on Discover:

```html
<zm-empty-state class="empty" role="status">
  <p class="empty__stamp" aria-hidden="true">Sold out</p>
  <h3 class="empty__title" id="zm-empty-1">Nobody’s free Christmas Eve within 40 km</h3>
  <p>Every gospel choir near Burlington is booked for Christmas Eve. Try a nearby date, or widen the radius: 2 choirs are free within 120 km.</p>
  <zm-date-swap>
    <div class="stack">
      <h4 id="zm-date-swap-1">Nearby dates with choirs free</h4>
      <ul class="date-swap" role="list" aria-labelledby="zm-date-swap-1">
        <li><button type="button"><strong>Wed 23 Dec</strong> 1 choir free</button></li>
        <li><button type="button"><strong>Sun 27 Dec</strong> 3 choirs free</button></li>
        <li><button type="button"><strong>Sun 20 Dec</strong> 2 choirs free</button></li>
      </ul>
    </div>
  </zm-date-swap>
  <div class="empty__actions">
    <zm-button variant="primary"><button class="btn btn--primary" type="button">Search within 120 km · 2 free …arrow…</button></zm-button>
    <zm-button><button class="btn" type="button">Show all styles</button></zm-button>
  </div>
</zm-empty-state>
```

Quiet, nothing yet, and a landmark first run:

```html
<zm-empty-state class="empty empty--quiet">
  <p class="empty__stamp" aria-hidden="true">Fresh on the bill</p>
  <h3 class="empty__title" id="zm-empty-2">No videos yet</h3>
  <p>Miriam is filming her first live set this month. Until then, ask her for a recording in your request.</p>
  <div class="empty__actions"><zm-button-link …><a class="btn" href="/artists/miriam-haile#book">Ask Miriam for a recording</a></zm-button-link></div>
</zm-empty-state>

<zm-empty-state class="empty" role="region" aria-labelledby="zm-empty-3">
  <p class="empty__stamp" aria-hidden="true">Quiet week</p>
  <h2 class="empty__title" id="zm-empty-3">Your first request will land here</h2>
  …
</zm-empty-state>
```

A busy swap, and the date swap without a heading:

```html
<li><button type="button" aria-busy="true" aria-disabled="true"><strong>Sun 20 Dec</strong> Checking…</button></li>

<zm-date-swap>
  <ul class="date-swap" role="list" aria-label="Abigail’s next 3 free dates">
    <li><button type="button"><strong>Tue 17 Nov</strong> Open all day</button></li>
    …
  </ul>
</zm-date-swap>
```

Consumer templates:

```html
<zm-empty-state live [stamp]="'discover.empty.stamp' | transloco" [heading]="empty().title" [headingLevel]="3">
  <p>{{ empty().sentence }}</p>
  @if (empty().nearbyDates.length) {
    <zm-date-swap [heading]="empty().nearbyHeading" [dates]="empty().nearbyDates" [busyValue]="pendingDate()" [busyDetail]="'discover.empty.checking' | transloco" (datePicked)="searchDate($event)" />
  }
  @if (empty().widerRadius; as wider) {
    <zm-button slot="actions" variant="primary" (click)="widen(wider.km)">{{ wider.label }}<zm-icon name="arrow-right" /></zm-button>
  }
  @if (filtersApplied()) {
    <zm-button slot="actions" (click)="clearFilters()">{{ 'discover.empty.allStyles' | transloco }}</zm-button>
  }
</zm-empty-state>
```

```html
<zm-empty-state quiet [stamp]="'profile.videos.emptyStamp' | transloco" [heading]="'profile.videos.empty' | transloco" [headingLevel]="3">
  <p>{{ videosEmptySentence() }}</p>
  <zm-button-link slot="actions" [link]="[]" fragment="book" [queryParams]="{ message: 'recording' }">{{ askForRecording() }}</zm-button-link>
</zm-empty-state>
```

The `.empty*` and `.date-swap` classes, the heading and the `<strong>` date are
a contract: page objects find an empty state by its heading and a swap by its
date text.

## Design

- Container: `display: grid`, `grid-template-columns: minmax(0, 1fr)`, gap and
  padding from the size; `--color-bg-surface`; `--border-width-thick` dashed
  `--color-border-strong`; `text-align: left`; square corners.
- Stamp: `width: fit-content`, padding `--space-1` `--space-3`,
  `--border-width-thick` solid `currentColor`, `--text-h4`,
  `--letter-spacing-wide`, uppercase, `transform: rotate(-3deg)`.
- Title: `--text-h2` (full) or `--text-h4` (quiet), uppercase, margin 0.
- Body: `--text-body`, `--color-fg-default`; paragraphs have no extra margin
  (the grid gap spaces them).
- Actions: `display: flex`, `flex-wrap: wrap`, `align-items: center`, gap
  `--space-2`; `:empty` → `display: none`.
- Date swap list: `display: grid`, gap `--space-3`,
  `grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr))`, no bullets.
- Date swap button: full cell width, `display: grid`, gap `--space-1`, padding
  `--space-3`, left-aligned, `--text-body-sm`, `--color-bg-surface`,
  `--border-width-thick` solid `--color-border-strong`, at least
  `--target-comfortable` tall (64 px in practice with two lines), and
  `height: 100%` with `align-content: start`, so every swap in a row has the
  row's height when one date wraps ("Wed 23 / Dec"). Date in
  `--text-figure`, uppercase. Transitions on transform and box-shadow:
  `--duration-fast`, `--ease-standard`.
- Neither component declares component tokens; re-skin through the semantic
  tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Ticket fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Dashed rule, swap rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Title, text, stamp | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Swap hover / active fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Swap hover label and rule | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Swap hover shadow | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Title, sentence, stamp, swap label |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Dashed rule and swap rule |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | The ticket's edge against the page |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Hovered swap label |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on a swap |

Under forced colours the rules use `CanvasText` (tokens) and the swap's hover
fill becomes `Highlight` through the system colours; the dashed rule stays
visible.

## Responsive behaviour

- One column at every breakpoint; text stays left-aligned.
- Below SM (576 px) the full size's side padding drops to `--space-5`, so
  "Search within 120 km · 2 free" with its arrow wraps to at most two balanced
  lines at 360 px.
- Date swaps: as many 9 rem columns as fit (`auto-fill`). Two columns need an
  18.75 rem content box, so at 320 and 360 px they stack in one column; from SM
  they sit two or three across. Swaps in one row share the row's height.
- Actions wrap onto new lines; a button label wraps inside its button and never
  overflows.
- Titles wrap and never truncate; a single word wider than the column breaks
  inside the word (`overflow-wrap: anywhere`), so "Nobody’s free Christmas Eve
  within 40 km" in `--text-h2` fits a 320 px viewport.
- At 320 px and at 200 % zoom nothing is clipped and the page does not scroll
  horizontally. Date swaps and action buttons are at least 44 × 44 CSS px.

## Accessibility

### Role and pattern

A plain container with a real heading. `live` gives it `role="status"` so an
empty state that appears after a search is announced (WCAG 4.1.3); one present
at page load has no live role. `landmark` makes it a labelled region where it
replaces a page's main content. Date swaps are native buttons in a list; no APG
widget pattern applies beyond the
[APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the date swaps, then the actions, in DOM order. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On a swap: emits `datePicked` (nothing while a swap is busy). On an action: activates it. |

### Focus

Focus does not move into an empty state when it appears; it stays on the
search or filter the person just used. A busy swap keeps focus. After a swap's
search loads, the page moves focus to the lineup heading.

### Labelling

- The stamp is decoration and always `aria-hidden="true"`, even where a mock
  forgot it (`pages/saved/empty`, `pages/edit-profile/empty`).
- Each swap's accessible name is its text with a space between date and detail
  ("Wed 23 Dec 1 choir free"), never "Dec1". The component writes the space.
- The swap list is named by its heading, or by `label` when there is none.

### Announcements

`live` empty states are announced once by their `role="status"`: the title
then the sentence. Date swaps and actions announce nothing themselves.

### Motion

The empty state appears without animation. Swaps lift by `--transform-lift`
over `--duration-fast`; under `prefers-reduced-motion: reduce` the movement is
instant and the colour change remains (L2-103).

## Content and internationalisation

- **Title**: what isn't there, with the specifics chosen: "Nobody’s free
  Christmas Eve within 40 km" (L2-011), "No videos yet", "No church reviews
  yet" (L2-020), "No saved artists yet" (L2-027).
- **Sentence**: why, and what to try, one or two sentences. Never blame the
  person ("You have no…").
- **Actions**: a verb with the outcome, one primary: "Search within 120 km · 2
  free", "Show all styles" (L2-011), "Ask Miriam for a recording", "Be her
  first booking" (L2-020), "Find who’s free" (L2-027).
- **Stamp**: two or three words ("Sold out", "Fresh on the bill", "Opening
  night", "Admit one"). Omit it where a pun would sound flippant.
- **Date swaps**: short dates "Sun 20 Dec" (L2-110); counts "1 choir free", "3
  choirs free", pluralised by the catalogue.
- Every string is translatable and passed by the page: `heading`, `stamp`,
  `label`, `heading` of the swap list, `busyDetail`, each `date` and `detail`,
  and the projected sentence and action labels (L2-111). Data values: artist
  first names and pronouns in "Be her first booking", counts, dates and
  distances, formatted by the API library's formatting service. French runs
  about 30 % longer: titles and actions wrap, never clip.

## Performance

- Change detection: `OnPush`, signal inputs; the heading tag from one
  `@switch` with no `ng-content` inside its branches; host role from one
  `computed`. No subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/EmptyState.ts`
  renders the Christmas Eve "Sold out" state with its two actions. Add
  `DateSwap.ts`, which renders the three Christmas swaps (Wed 23 Dec, Sun 27
  Dec, Sun 20 Dec), and export it from `scenarios/index.ts`. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios: `DarkTheme`.
- Layout stability: the empty state replaces the skeleton list in one step;
  nothing inside it loads later.
- Imports: Angular core only. Buttons, links and icons arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given zero matches for Christmas Eve within 40 km, when the lineup renders the empty state, then it shows the "Sold out" stamp, the heading "Nobody’s free Christmas Eve within 40 km" and the explaining sentence. (L2-011)
- **AC-2** Given three nearby dates, when the date swap renders, then it lists "Wed 23 Dec 1 choir free", "Sun 27 Dec 3 choirs free" and "Sun 20 Dec 2 choirs free" in the order given, under the heading "Nearby dates with choirs free", and swaps in the same row have equal heights. (L2-011)
- **AC-3** Given the swap for Sun 20 Dec, when it is activated, then `datePicked` emits "2026-12-20" once. (L2-011)
- **AC-4** Given a wider-radius action and a filters action are projected, when the empty state renders, then "Search within 120 km · 2 free" and "Show all styles" sit in `.empty__actions` after the date swaps. (L2-011)
- **AC-5** Given Miriam Haile's profile with no videos and no reviews, when it renders, then the videos section shows a quiet "No videos yet" with "Ask Miriam for a recording", and the reviews section a quiet "No church reviews yet" with "Be her first booking". (L2-020)
- **AC-6** Given Naomi has no saved artists, when Saved artists renders, then it shows "No saved artists yet" with a "Find who’s free" link to Discover. (L2-027)
- **AC-7** Given another booker's booking URL, when the 404 renders inside the shell, then the empty state reads "Check the link" with the "No such ticket" stamp and a "Go to your bookings" link, and shows nothing about the booking. (L2-033)
- **AC-8** Given `headingLevel` 1, 2, 3 and 4, when each renders, then the title is an `h1`, `h2`, `h3` or `h4` with `.empty__title`. (L2-102)
- **AC-9** Given no `stamp` and nothing in the actions slot, when the empty state renders, then there is no `.empty__stamp` and `.empty__actions` takes no space. (L2-020)
- **AC-10** Given `quiet`, when it renders, then the host has `.empty--quiet`, `--space-6` padding, `--space-4` gaps and a `--text-h4` title; without it, `--space-10` × `--space-8` padding and a `--text-h2` title. (L2-020)

### States

- **AC-11** Given `busyValue` "2026-12-20" and `busyDetail` "Checking…", when the date swap renders, then that button reads "Sun 20 Dec Checking…" with `aria-busy="true"` and `aria-disabled="true"`, keeps focus, and activating any swap emits nothing. (L2-011)
- **AC-12** Given a pointer over a swap, when it hovers, then the swap fills `--color-accent` with an ink label, shows `--shadow-1` and lifts by `--transform-lift`. (L2-011)

### Keyboard and focus

- **AC-13** Given the Discover empty state, when the booker tabs from the sort select, then focus visits the three swaps, then "Search within 120 km · 2 free", then "Show all styles", each with the two-tone focus ring. (L2-101)
- **AC-14** Given a focused swap, when Enter or Space is pressed, then `datePicked` emits that date. (L2-101)
- **AC-15** Given the empty state appears after a search, when it renders, then focus stays where it was and does not move into the empty state. (L2-101)

### Screen readers

- **AC-16** Given `live`, when the empty state replaces the skeletons, then its title and sentence are announced through `role="status"` and the stamp is not announced. (L2-102)
- **AC-17** Given an empty state present at page load ("No bookings yet"), when it renders, then the host has no `role="status"`. (L2-102)
- **AC-18** Given `landmark` on "Your first request will land here", when it renders, then the host is a region named by its heading. (L2-102)
- **AC-19** Given the date swap under the request form's date error with `label` "Abigail’s next 3 free dates" and no heading, when it is read by a screen reader, then the list is named "Abigail’s next 3 free dates" and each swap reads "Tue 17 Nov Open all day" with a space between date and detail. (L2-102)
- **AC-20** Given every empty and no-results state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when the empty state renders, then it is a `--color-bg-surface` charcoal ticket with a light `--color-border-strong` dashed rule, the stamp follows the text colour, and a hovered swap is yellow with a yellow `--shadow-1`. (L2-104)
- **AC-22** Given both themes, when contrast is measured, then title, sentence and swap labels are at least 4.5:1, the dashed rule and swap rule at least 3:1, and the hovered swap label at least 4.5:1. (L2-103)

### Responsive

- **AC-23** Given a 360 px viewport, when the Discover empty state renders, then the full size's side padding is `--space-5`, the swaps stack in one column, and "Search within 120 km · 2 free" wraps to at most two lines inside its button. (L2-096)
- **AC-24** Given a 320 px viewport and text zoomed to 200 %, when any empty state renders, then the title wraps without clipping, nothing overflows the ticket, and the page does not scroll horizontally. (L2-096)
- **AC-25** Given a touch device, when a swap is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given the French catalogue, when titles and actions are about 30 % longer, then they wrap inside the ticket and its buttons without clipping. (L2-111)

### Motion

- **AC-27** Given `prefers-reduced-motion: reduce`, when a swap is hovered, then it takes its hover colours without a lift transition. (L2-103)

### Performance

- **AC-28** Given the `EmptyState` and `DateSwap` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-empty-state` with `heading`, `stamp` and `quiet`. To meet
this CRD:

- Add `headingLevel` (render the title with one `@switch` over 1–4; no
  `ng-content` inside the branches) and a generated title ID.
- Add `live` and `landmark`, and drop the unconditional `role="status"` on the
  host: an empty state at page load must not be a live region (AC-17).
- Make `quiet` a `booleanAttribute` input.
- Add `overflow-wrap: anywhere` on `.empty__title` (D-6).
- Keep `.empty__actions` with `:empty { display: none }`.
- Build `zm-date-swap` in `lib/date-swap/` (`date-swap.ts`, class `DateSwap`):
  the list, the busy rule, `datePicked`, the hover, focus and active styles,
  the equal-height rule (D-9) and the reduced-motion rule. Export it from `public-api.ts` and add the
  `DateSwap.ts` scenario.

## Decisions

- **D-1** *The mocks put `role="status"` on some empty states and not others. Which rule?* `live` is opt-in: set it when the empty state appears because of something the person did (a search, a filter, a cleared list), and leave it off for one present at page load. That is the design system's rule; the current code's unconditional `role="status"` would announce every first-run page.
- **D-2** *Several mocks use `<section aria-labelledby>`. How does a custom-element host keep that?* With `landmark`, which sets `role="region"` and `aria-labelledby` to the title. It is opt-in because most empty states sit inside a section that is already labelled.
- **D-3** *Is the date swap part of the empty state?* No, it is its own component, `zm-date-swap`, specified here. The request form uses the same swaps under a date error (`pages/book/invalid`) with no empty state around them.
- **D-4** *The book mock writes `<strong>Tue 17 Nov</strong>Open all day` with no space. Keep it?* No. The component always writes a space between date and detail, so the name never reads "Nov Open" run together; the design system already fixed the same drift on Discover.
- **D-5** *Does a swap show a busy state, given the page swaps the empty state for skeletons?* Yes, as the design system renders it. The busy state covers the moment between activation and the page's loading state, and it guarantees a double press sends one search.
- **D-6** *What happens to a title word wider than the column at 320 px?* It breaks inside the word (`overflow-wrap: anywhere`), the same rule the [ticket](ticket.md) uses for names; truncating is forbidden and shrinking the type would break the scale.
- **D-7** *A stamp without `aria-hidden` in `pages/saved/empty` and `pages/edit-profile/empty`?* Drift. The stamp repeats the title in poster slang, so the component always hides it.
- **D-8** *Where does the h1 empty state (`pages/dashboard/forbidden`) belong, here or in the error page?* Here. It sits inside the normal shell and page head, uses the empty-state frame and answers with the page's own heading, so `headingLevel` 1 covers it; the [error page](error-page.md) is for pages that cannot be shown at all.
- **D-9** *The 1280 px rendering shows "Wed 23 Dec" wrapping to two lines in a 9 rem swap while "Sun 27 Dec" fits on one, so a row has ragged heights. Fix how?* Each swap button fills its grid cell (`height: 100%`, content aligned to the top), so a row reads as one strip of tickets. Widening the cell would change the design-system grid, and the date wrapping between words is acceptable; truncating it is not.
