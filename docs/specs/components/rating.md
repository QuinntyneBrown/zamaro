# Rating

| Field | Value |
|---|---|
| Selector | `zm-rating` |
| Library path | `frontend/projects/components/src/lib/rating/` |
| Status | built |
| Traces to | L2-006, L2-012, L2-018, L2-020, L2-060, L2-067, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`rating.html`](../../design-system/components/rating.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/artist-reviews/default`](../../mocks/pages/artist-reviews/default.html), [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/booking-detail/declined`](../../mocks/pages/booking-detail/declined.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/admin-artist/default`](../../mocks/pages/admin-artist/default.html), [`pages/admin-reviews/default`](../../mocks/pages/admin-reviews/default.html), [`dialogs/suspend-artist/default`](../../mocks/dialogs/suspend-artist/default.html), [`dialogs/hide-review/default`](../../mocks/dialogs/hide-review/default.html) |
| Rendering | [`rating.html`](rating.html) |

## Purpose and scope

The rating says how churches rated an artist: "★ 4.9 · 38 churches". It reads as
one phrase to a screen reader, "Rated 4.9 out of 5 by 38 churches" (L2-102), and
never as five star characters. The same component shows one church's whole-star
score on a review ("4 out of 5 stars"), and says "New" when nobody has reviewed
the artist yet.

It is display-only. Churches give their score in the write-review dialog with a
[radio group](radio-group.md) of five stub cards, never a clickable row of stars.

Out of scope:

- Computing the score and the count (L2-060). The API returns the mean rounded to
  one decimal and the number of distinct churches; the page passes the count
  text ("38 churches") from the catalogue.
- The review card around a single review's stars, its byline and reply
  ([review](review.md)).
- The poster facts line around the profile rating, including its separate "38
  churches" fact and "No reviews yet" ([poster](poster.md)).
- The link to the reviews ("Show all 38 reviews"); the page places it.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` headliner meta; `pages/book/*` artist line; `pages/artist-reviews/default` page head | `inline`, `countText` | "★ 4.9 · 38 churches" | rated | surface, stage page head |
| Ticket kicker on Discover, `pages/not-found/artist` ([ticket](ticket.md)) | `inline` inside `.ticket__no` | "★ 4.6 · 17 churches"; "New" with label "No reviews yet" | rated, no reviews | ticket surface |
| `pages/artist/default` poster facts, inside `<strong>` | `inline`, no `countText`, full label | "★ 4.9" named "Rated 4.9 out of 5 by 38 churches" | rated | stage |
| `pages/artist/default` reviews heading; `pages/dashboard/default` | `summary` | "★★★★★ 4.9 · 38 churches" | rated | canvas, card |
| Reviews on `pages/artist/default`, `pages/artist-reviews`, `pages/admin-reviews`, `dialogs/hide-review`, `dialogs/report-review`, `dialogs/reply-review` | `stars` | "★★★★★" named "5 out of 5 stars"; "★★★★☆"; "★★☆☆☆" | rated | review card |
| Admin tables and definition rows (`pages/admin-artists`, `pages/admin-artist`, `dialogs/suspend-artist`, `dialogs/reinstate-artist`) | `inline`, no `countText`, label without the count | "★ 4.6" named "Rated 4.6 out of 5" | rated, hovered row | table surface, panel |
| `pages/booking-detail/declined`, `artist-cancelled` alternatives ([tour dates](tour-dates.md)) | `inline`, no `countText`, short label | "★ 4.8" named "Rated 4.8 out of 5" | rated | canvas |
| Toasts and dialogs over Discover or the profile | as their page | as their page | inert behind a dialog | as their page |
| Design system only | `full`, `compact`; `loading` on every variant; `full` with no reviews | "★★★★★ 4.9 38 churches"; "4.8 · 21 churches"; "New · No reviews yet" | rated, low score, loading, no reviews | paper, stage |

## Anatomy

1. **Stars** — `.stars`: five glyphs, ★ filled then ☆ empty, in `--text-stub`
   with `--letter-spacing-wide`. In the inline form, a single ★.
2. **Score** — the mean to one decimal. In `full` and `compact`, `.rating__score`
   in `--text-figure`.
3. **Count** — `countText` ("38 churches"). In `full` and `compact`,
   `.rating__count`, muted.
4. **Image wrapper** — the element with `role="img"` and `aria-label` that makes
   the parts one phrase. Its children are presentational.
5. **New** — `newText` ("New"), and in `full` the `newDetail` ("No reviews yet").

Host: `zm-rating` is `display: inline` (`inline-flex` for `full` and
`compact`), `white-space: nowrap` for the inline forms, and renders exactly one
`<span>` wrapper. It never renders a block element, so it is valid inside a
`<p>`, `<dd>`, `<strong>` or heading.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `score` | `number \| null` | — | yes | 0–5. `null` means no visible reviews yet. In `stars`, a whole number 1–5. |
| `label` | `string` | — | yes | The accessible name: "Rated 4.9 out of 5 by 38 churches", "Rated 4.6 out of 5" where the count is shown elsewhere, "4 out of 5 stars" for one review, "No reviews yet" when `score` is null. |
| `variant` | `'inline' \| 'summary' \| 'full' \| 'compact' \| 'stars'` | `'inline'` | no | See Variants. |
| `countText` | `string` | `''` | no | "38 churches". Empty drops the count and its " · ". |
| `newText` | `string` | `''` | when `score` can be null | "New". |
| `newDetail` | `string` | `''` | no | `full` only: "No reviews yet", shown after " · ". |
| `loading` | `boolean` (attribute) | `false` | no | Renders the skeleton in place of the rating (see States). |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden text read while loading: "Loading rating". |

- Signal inputs; `loading` uses `booleanAttribute`.
- The score is formatted by the component with one decimal using the app's
  `LOCALE_ID` (`formatNumber(score, locale, '1.1-1')`): "5.0", "4.9"; French
  "4,9". Every other string arrives translated from the consumer (L2-111).

### Outputs

None. The rating is not interactive.

### Content slots

None. Every part is an input, so the accessible name and the visible text cannot
drift apart.

## Variants and sizes

| Variant | Modifier | Visible | Use for |
|---|---|---|---|
| Inline | — | "★ 4.9 · 38 churches", or "★ 4.6" with no count | Inside a line of facts: ticket kicker, headliner meta, page heads, table cells, definition rows, the poster facts. |
| Summary | `.stars` on the wrapper | "★★★★★ 4.9 · 38 churches" | The heading of a reviews section; the dashboard. |
| Full | `.rating` | stars, `.rating__score`, `.rating__count` | A standalone rating block (design system; ready for profile layouts). |
| Compact | `.rating` | `.rating__score`, `.rating__count` "· 21 churches" | Tight list meta where the stars would crowd (design system). |
| Stars | `.stars` | "★★★★☆" | One church's whole-star score on a review. |

Glyphs round to the nearest whole star, halves up: 4.9 and 4.6 show five, 4.4
shows four, 3.4 three. The score text gives the precision.

One size: stars and count `--text-stub` (14 px), the full and compact score
`--text-figure`. The inline forms take the size of the text around them (an
overline in the ticket kicker, body in a page head).

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Rated | `score` is a number | As the variant | One image named by `label` |
| Low score | `score` < 4 | Identical styling to a high score; fewer filled glyphs | As rated |
| No reviews, inline | `score` null | `newText` "New" | Image named by `label` ("No reviews yet") |
| No reviews, summary or full | `score` null | `<strong>` "New" then "· No reviews yet" (`newDetail`), count styling | Plain text, no image role: "New · No reviews yet" |
| No reviews, compact | `score` null | "New" in count styling | Plain text "New" |
| No reviews, stars | `score` null | A muted "—" | Image named by `label` |
| Loading | `loading` | `zm-skeleton` `text` + `short`, `inline`, in the rating's place | `loadingLabel` in visually hidden text; the skeleton is `aria-hidden` |
| On the stage | `.on-stage` ancestor | Stars `--color-accent-on-stage`, count `--color-fg-on-stage-muted` | — |
| In a hovered or selected table row | row fill | Unchanged | — |

The rating never turns red, never shows ☆☆☆☆☆ or "0.0", and has no hover,
focus or pressed state.

## Markup

```html
<!-- inline, rated -->
<zm-rating><span role="img" aria-label="Rated 4.9 out of 5 by 38 churches">★ 4.9 · 38 churches</span></zm-rating>
<!-- inline, no count (admin row, poster facts) -->
<zm-rating><span role="img" aria-label="Rated 4.6 out of 5">★ 4.6</span></zm-rating>
<!-- inline, no reviews (ticket kicker) -->
<zm-rating><span role="img" aria-label="No reviews yet">New</span></zm-rating>
<!-- summary -->
<zm-rating><span class="stars" role="img" aria-label="Rated 4.9 out of 5 by 38 churches">★★★★★ 4.9 · 38 churches</span></zm-rating>
<!-- full -->
<zm-rating><span class="rating" role="img" aria-label="Rated 4.9 out of 5 by 38 churches"><span class="stars">★★★★★</span><span class="rating__score">4.9</span><span class="rating__count">38 churches</span></span></zm-rating>
<!-- full, no reviews -->
<zm-rating><span class="rating"><strong>New</strong><span class="rating__count">· No reviews yet</span></span></zm-rating>
<!-- compact -->
<zm-rating><span class="rating" role="img" aria-label="Rated 4.8 out of 5 by 21 churches"><span class="rating__score">4.8</span><span class="rating__count">· 21 churches</span></span></zm-rating>
<!-- stars, one review -->
<zm-rating><span class="stars" role="img" aria-label="4 out of 5 stars">★★★★☆</span></zm-rating>
<!-- loading -->
<zm-rating><span><zm-skeleton class="skeleton skeleton--text skeleton--short" aria-hidden="true"></zm-skeleton><span class="visually-hidden">Loading rating</span></span></zm-rating>
```

Consumer templates:

```html
<zm-rating [score]="artist.rating" [label]="artist.ratingLabel" [countText]="artist.ratingCount" [newText]="'rating.new' | transloco" />
<zm-rating variant="summary" [score]="4.9" [label]="'rating.label' | transloco: { score: '4.9', count: 38 }" [countText]="'rating.churches' | transloco: { count: 38 }" />
<zm-rating variant="stars" [score]="review.stars" [label]="'rating.stars' | transloco: { n: review.stars }" />
```

The `role="img"` wrapper and its `aria-label` are the contract: e2e page objects
find a rating by its role and name ("Rated 4.9 out of 5 by 38 churches"). The
`.stars`, `.rating`, `.rating__score` and `.rating__count` classes are kept for
visual parity.

## Design

- `.rating`: `display: inline-flex`, `align-items: baseline`, gap `--space-2`,
  `--text-stub`, uppercase.
- `.rating__score`: `--text-figure`. `.rating__count`: `--color-fg-muted`.
- `.stars`: `--text-stub`, `--letter-spacing-wide`. Inside a `.review` the
  review places it on its own line (review CRD).
- Inline and summary separators are " · " (a middle dot with spaces).
- No motion: ratings never count up or fill in.

The rating has no component tokens. Stage mappings live in its own stylesheet:
`:host-context(.on-stage) .stars { color: var(--color-accent-on-stage) }` and
`:host-context(.on-stage) .rating__count { color: var(--color-fg-on-stage-muted) }`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Stars and score | `--color-fg-default` (current colour) | `--palette-ink-750` | `--palette-ink-100` |
| Count | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Stars on the stage | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Count on the stage | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Stars and score on paper |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Count on paper |
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Summary on the page |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Stars on the stage |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Count on the stage |

Empty stars are outlines in the same colour as filled ones: the difference is
shape, not colour. Stars are text, so they follow forced-colours mode.

## Responsive behaviour

- The inline forms do not wrap inside (`white-space: nowrap`); the line of facts
  around them wraps between parts. "★ 4.9 · 38 churches" fits a 296 px ticket
  body at 320 px.
- `full` and `compact` wrap between their parts, never inside the stars; at
  360 px the full rating (about 15 rem) fits on one line.
- Nothing changes across breakpoints. At 200 % zoom it grows with the text.
- Not a target.

## Accessibility

### Role and pattern

One `role="img"` with an `aria-label` that says the rating in words (L2-102). No
APG pattern applies. Input of a score is the [radio group](radio-group.md)'s
Star rating, never this component.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the rating; it is never focusable. |

### Focus

None. Never make the stars a link; link the words next to it.

### Labelling

- The label is the only thing read: "Rated 4.9 out of 5 by 38 churches", or
  "Rated 4.6 out of 5" where the count sits elsewhere in the row.
- A review's stars read "4 out of 5 stars".
- With no reviews, the inline form reads `label` ("No reviews yet"); the full
  form reads its visible words, "New · No reviews yet".
- The label is required; in dev mode an empty `label` with a numeric score logs a
  console error naming the component.

### Announcements

None. A rating that changes after moderation updates on the next load.

### Motion

None, so `prefers-reduced-motion` changes nothing.

## Content and internationalisation

- Score: one decimal, always: "5.0", "4.9" (L2-060). 4.86 is passed as 4.9 by
  the API and shows "4.9".
- Count names who rated: "38 churches", "1 church", never "38 reviews" or
  "(38)" (L2-060). Separate with a middle dot, never brackets.
- Labels: "Rated {score} out of 5 by {n} churches"; "Rated {score} out of 5"
  where the count is shown elsewhere; "{n} out of 5 stars" for one review.
- Unrated: "New" on a ticket (L2-006); "New · No reviews yet" on the profile
  header (L2-012, L2-020).
- All words come from the translation catalogue through the consumer (L2-111);
  the component formats only the number, by `LOCALE_ID`.

## Performance

- Change detection: `OnPush`, signal inputs; `scoreText`, `glyphs` and the
  wrapper class from `computed`. No `effect`, no subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Rating.ts`
  renders Marcus Bell Trio's inline rating (4.6, "17 churches", "Rated 4.6 out
  of 5 by 17 churches"). Add `RatingStars.ts`, which renders Pastor Femi
  Adebayo's review stars (4, "4 out of 5 stars"). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios that include it: `Ticket`, `Lineup`, `Headliner`,
  `DarkTheme`, `Table`.
- Layout stability: the loading skeleton is one text line, the rating's own
  height, so the swap does not shift the line (L2-105).
- Imports: Angular core and `zm-skeleton`.

## Acceptance criteria

### Rendering

- **AC-1** Given Abigail Mensah's rating (score 4.9, `countText` "38 churches", label "Rated 4.9 out of 5 by 38 churches"), when the inline rating renders on the Discover headliner, then it shows "★ 4.9 · 38 churches" inside one `<span role="img">`. (L2-006)
- **AC-2** Given a score of 4.86 passed as 4.9 and a score of 5, when each renders, then they show "4.9" and "5.0", one decimal always. (L2-060)
- **AC-3** Given `countText` "38 churches", when the rating renders, then the count names churches; the component adds no "reviews" wording and no brackets. (L2-060)
- **AC-4** Given Miriam Haile with no reviews on a ticket (`score` null, `newText` "New", label "No reviews yet"), when it renders, then it shows "New" and never ☆☆☆☆☆ or "0.0". (L2-006)
- **AC-5** Given `variant="full"` with `score` null, `newText` "New" and `newDetail` "No reviews yet", when it renders, then it shows "New · No reviews yet" with "New" in a `<strong>`. (L2-020)
- **AC-6** Given the profile reviews heading for Abigail Mensah, when `variant="summary"` renders, then it shows "★★★★★ 4.9 · 38 churches" on a `.stars` wrapper. (L2-018)
- **AC-7** Given Pastor Femi Adebayo's 4-star review, when `variant="stars"` renders, then it shows "★★★★☆" named "4 out of 5 stars". (L2-018)
- **AC-8** Given scores 4.9, 4.6, 4.4 and 3.4 in `full`, when each renders, then it shows five, five, four and three filled glyphs, always five glyphs in total, with the same colours for every score. (L2-060)
- **AC-9** Given the admin artists table row for Marcus Bell Trio (score 4.6, no `countText`, label "Rated 4.6 out of 5"), when it renders, then it shows "★ 4.6" with no " · ". (L2-067)
- **AC-10** Given `variant="compact"` for Hosanna Collective (4.8, "21 churches"), when it renders, then it shows `.rating__score` "4.8" and `.rating__count` "· 21 churches" with no stars. (L2-060)

### States

- **AC-11** Given `loading` with `loadingLabel` "Loading rating", when it renders, then a single-line `zm-skeleton` (`aria-hidden`) holds the place, "Loading rating" is visually hidden text, and no `role="img"` is present. (L2-105)
- **AC-12** Given a loading rating inside a ticket kicker, when the score arrives, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Screen readers

- **AC-13** Given Abigail Mensah's inline rating, when a screen reader reads it, then it announces "Rated 4.9 out of 5 by 38 churches" once and never "black star". (L2-102)
- **AC-14** Given the poster facts rating "★ 4.9" with label "Rated 4.9 out of 5 by 38 churches", when it is read, then the label is announced and the visible glyph is not. (L2-102)
- **AC-15** Given the profile header of Miriam Haile, when it is read, then it says "New · No reviews yet" in words. (L2-012)
- **AC-16** Given the rating in a ticket, a table row and a review card, when Tab moves through the page, then focus never lands on a rating. (L2-100)
- **AC-17** Given every variant and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-18** Given the full rating inside an `.on-stage` area, when it renders, then the stars use `--color-accent-on-stage` and the count `--color-fg-on-stage-muted`, each at least 4.5:1 on `--color-bg-stage`. (L2-103)
- **AC-19** Given the dark theme, when the summary and stars variants render on the canvas and a review card, then glyphs and score use `--color-fg-default` and the count `--color-fg-muted`. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then stars, score and count on paper and canvas are at least 4.5:1. (L2-103)

### Responsive

- **AC-21** Given a 320 px viewport and the ticket kicker "No. 06 · ★ 4.8 · 26 churches", when it renders, then the rating stays on one line, the kicker wraps before it if needed, and the page does not scroll horizontally. (L2-096)

### Content

- **AC-22** Given the French catalogue and `LOCALE_ID` `fr-CA`, when the rating renders score 4.9 with "38 églises", then it shows "★ 4,9 · 38 églises" and the label comes from the catalogue with no code change. (L2-111)

### Performance

- **AC-23** Given the `Rating` and `RatingStars` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-rating` with `score`, `label`, `countText` and `newText`, the
inline form only. To meet this CRD:

- Add `variant` with `summary`, `full`, `compact` and `stars`, and the glyph
  string (`'★'.repeat(n) + '☆'.repeat(5 - n)`, n = `Math.floor(score + 0.5)`,
  clamped 0–5) as a `computed`.
- Drop the " · {count}" segment when `countText` is empty (today it always
  renders " · ").
- Format the score with `formatNumber` and `LOCALE_ID` instead of `toFixed(1)`.
- Add `newDetail`, and the no-review markup for `full`, `compact` and `stars`.
- Add `loading` and `loadingLabel` with `zm-skeleton width="short" inline`.
- Move the `.rating`, `.rating__score`, `.rating__count` and `.stars` styles
  and the two stage mappings into the component stylesheet.
- Log the dev-mode error for an empty `label`.
- Add the `RatingStars` scenario and export it from `scenarios/index.ts`.

## Decisions

- **D-1** *One component for an artist's rating and a review's stars, or two?* One, with a `stars` variant. They share the glyph rule, the `role="img"` labelling and the stage colours, and the design system documents both on one page.
- **D-2** *Which element does the component render?* Always a `<span>`. The mocks use `<p class="stars">` for the reviews heading, but a `<span>` is valid everywhere the rating appears (inside `<strong>`, `<dd>`, overlines and headings), and the page owns block layout. Classes, role and name are the contract, not the tag.
- **D-3** *How does a no-review rating read?* Inline: the image is named by `label` ("No reviews yet") and shows "New", as the ticket CRD already requires. Full and compact: plain words with no image role, as the design system renders "New · No reviews yet", so nothing is read twice.
- **D-4** *Who formats the score?* The component, with one decimal by `LOCALE_ID`. The API library's formatting service covers dates, money and distance (L2-110); a score is a number whose precision the design system fixes, so formatting it here keeps every consumer consistent.
- **D-5** *How is loading announced when `zm-skeleton` is always `aria-hidden`?* With `loadingLabel` as visually hidden text next to it, replacing the design system's `role="img"` skeleton, because the skeleton CRD fixes skeletons as hidden. The region's `aria-busy` remains the page's job.
- **D-6** *Does the inline label drop the count in tables?* Only when the consumer passes the short label. The design system allows "Rated 4.6 out of 5" where the count is shown elsewhere; the admin tables pass it. The component never builds the label itself, so the rule stays with the catalogue.
