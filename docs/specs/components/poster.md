# Poster hero

| Field | Value |
|---|---|
| Selector | `zm-poster`, `zm-artist-poster`, `zm-artist-poster-skeleton` |
| Library path | `frontend/projects/components/src/lib/poster/` |
| Status | built (`zm-poster`); planned (`zm-artist-poster`, `zm-artist-poster-skeleton`) |
| Traces to | L2-004, L2-011, L2-012, L2-020, L2-086, L2-088, L2-096, L2-097, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111, L2-112 |
| Design system | [`poster.html`](../../design-system/components/poster.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/discover/empty`](../../mocks/pages/discover/empty.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/discover/error`](../../mocks/pages/discover/error.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/booked-date`](../../mocks/pages/artist/booked-date.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/profile-preview/loading`](../../mocks/pages/profile-preview/loading.html), and the dialogs and notifications drawn over them (see Usage) |
| Rendering | [`poster.html`](poster.html) |

## Purpose and scope

The poster is the charcoal stage at the top of a public page, set like a tour
poster. It holds the page's only `<h1>` and stays charcoal in both themes. Two
layouts share the stage:

- `zm-poster`, the **search poster** on Discover: a kicker, the question with
  the date set huge ("Who’s free Sat 14 Nov", L2-004), one line of context,
  and the [booking bar](booking-form.md) beside it from LG (L2-097).
- `zm-artist-poster`, the **artist poster** on a profile: the breadcrumb, the
  portrait, the artist's name at poster size, up to four facts and the Book,
  Save and Share actions (L2-012). `zm-artist-poster-skeleton` is its loading
  shape (L2-105).

Use something else when:

- the header is a workspace or booking page head (`.page-head`) → those pages'
  own heads, not a poster;
- the profile could not be loaded → the [error page](error-page.md)'s
  `zm-error-stage`, which prints the failure on the same stage;
- it is the featured artist inside the Discover lineup → the
  [headliner](headliner.md).

Out of scope:

- The booking bar's fields, validation and submit ([booking form](booking-form.md)),
  projected into the search poster.
- The breadcrumb ([breadcrumb](breadcrumb.md)), the save toggle and buttons
  ([button](button.md)) and the rating glyph ([rating](rating.md)), projected or
  composed.
- Choosing the copy: the page passes the formatted date ("Sat 14 Nov", or
  "Pick a date" before a search), the sub line, the kicker and the facts
  (L2-110, L2-111).
- The song marquee directly under the artist poster ([marquee](marquee.md)).
- The Discover lineup's own error and empty states: the search poster stays
  unchanged when results fail.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default`, `limited`, `error` | `zm-poster`, kicker "Worship artists within driving distance of Toronto", heading "Who’s free", date "Sat 14 Nov", sub "Seven artists are free that Saturday and will drive to Burlington." (error and limited: "Seven praise and worship artists are usually free on a Saturday in November.") | booking bar | default; lineup error below | stage |
| `pages/discover/loading` | `zm-poster`, sub "Checking the calendars of every artist who drives to Burlington…" | booking bar with busy submit "Checking calendars…" | loading (copy only) | stage |
| `pages/discover/empty` | `zm-poster`, date "Thu 24 Dec", sub "Christmas Eve is the busiest night of the year for worship artists." | booking bar | empty (copy only) | stage |
| `pages/discover/invalid` | `zm-poster`, date "Pick a date", sub "Tell us the date and where your church is. We’ll show who’s free and will drive to you." | booking bar with errors | invalid (copy only) | stage |
| `pages/artist/default`, `pages/artist/no-photos` | `zm-artist-poster`, kicker "Headliner · Gospel & contemporary vocalist", name "Abigail Mensah", rating 4.9 by 38 churches, facts "Brampton, ON", "Drives up to 120 km", yellow art | breadcrumb "Discover · Sat 14 Nov" / "Abigail Mensah"; actions "Book for Sat 14 Nov" (primary link to `#book`), "Saved" (pressed), "Share" | default | stage |
| `pages/artist/booked-date` | as above | "Book for Sun 15 Nov" | default | stage |
| `pages/artist/empty` | `zm-artist-poster`, kicker "New to Zamaro · Solo vocalist & pianist", name "Miriam Haile", rating `null` → "New" + "No reviews yet", facts "Etobicoke, ON", "Drives up to 40 km", plain art | breadcrumb "Discover" / "Miriam Haile"; "Check dates", "Save" (not pressed), "Share" | new artist | stage |
| `pages/profile-preview/default`, `empty` | `zm-artist-poster` without breadcrumb; kicker without "Headliner" | actions all `disabled` | preview | stage |
| `pages/artist/loading`, `pages/profile-preview/loading` | `zm-artist-poster-skeleton`, hidden heading "Artist profile", status "Loading the artist’s profile…" | breadcrumb "Discover · Sat 14 Nov" / "Loading artist" (artist only) | loading | stage |
| `pages/artist/error`, `pages/profile-preview/error` | not this component: [`zm-error-stage`](error-page.md) | — | error | stage |
| `dialogs/menu`, `dialogs/account-menu`, `dialogs/photo-viewer`, `dialogs/report-review/*`, `notifications/saved-toast/*`, `notifications/share-toast/*`, `notifications/system-banner/*` | as on the page behind | as on the page behind | inert behind a dialog or under a banner | stage |
| Design system only | `zm-artist-poster` for "Grace Tabernacle Mass Choir" | — | long name | stage |

## Anatomy

`zm-poster`:

1. **Stage** — `section.poster.on-stage`, labelled by its heading:
   `--color-bg-stage`, padding `--space-12` / `--space-16` (`--space-16` /
   `--space-20` from LG), `overflow: hidden`.
2. **Grid** — `.container.poster__grid`: copy and the projected aside; two
   columns from LG.
3. **Kicker** — `p.overline.poster__kicker`: mono overline in
   `--color-accent-on-stage`.
4. **Title** — `h1.poster__title` in `--text-h1`, uppercase: the heading text,
   a space, then the date.
5. **Date** — `span.poster__date` in `--text-display`, `--color-accent-on-stage`:
   one no-wrap `<span>` for the first word and one for the rest ("Sat" /
   "14 Nov"), so the day and month never split.
6. **Sub line** — `p.poster__sub`, `--text-body-lg`, `--color-fg-on-stage-muted`.
7. **Halftone corner** — `.poster::after`: yellow dots, 22 rem, faded by a
   mask, decorative.

`zm-artist-poster` adds, inside `.container.stack.stack--lg`:

8. **Breadcrumb (optional)** — the projected `zm-breadcrumb`.
9. **Header grid** — `.artist-poster`: portrait and copy; the portrait moves to
   a right column from MD.
10. **Portrait** — `zm-artwork` (`.art`, `.art--yellow` for a headliner) or an
    `<img class="artist-poster__photo">`, capped at 18 rem, paper rule.
11. **Name** — `h1.artist-poster__name` in `--text-poster`, breaking anywhere.
12. **Facts** — `p.artist-poster__facts`: the rating in a `<strong>` (yellow),
    then up to three facts as spans.
13. **Actions** — `.cluster` holding the projected actions.

`zm-artist-poster-skeleton` keeps 1, 8 and 9 and replaces 10–13 with stage
skeletons, a visually hidden `<h1>` and a visually hidden status line.

Host: each `zm-*` host is `display: block` and renders the `<section>` inside
it. The host carries no classes of its own.

## API

### `zm-poster` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | "Worship artists within driving distance of Toronto". |
| `heading` | `string` | — | yes | "Who’s free". |
| `date` | `string` | — | yes | "Sat 14 Nov", "Thu 24 Dec", or "Pick a date" before a search. Split at the first space into two no-wrap spans; a one-word date renders one span. |
| `subtitle` | `string` | — | yes | One sentence with a count and a place; while loading, what is happening, ending in "…". |
| `headingId` | `string` | `'hero-title'` | no | The `<h1>`'s ID; the section is `aria-labelledby` it. |

### `zm-artist-poster` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | "Headliner · Gospel & contemporary vocalist", "New to Zamaro · Solo vocalist & pianist". |
| `name` | `string` | — | yes | The artist's own spelling. The `<h1>` text. |
| `headingId` | `string` | `'artist-name'` | no | The `<h1>`'s ID; the section is `aria-labelledby` it; the stub's "Book" links do not target it. |
| `rating` | `number \| null` | — | yes | A number: `zm-rating` inline "★ 4.9" inside the `<strong>`, then the `ratingCount` fact (`aria-hidden`, since the rating's label already says it). `null`: the `<strong>` reads `ratingNew` and the next fact reads `noReviews` (L2-020). |
| `ratingLabel` | `string` | `''` | when `rating` is a number | "Rated 4.9 out of 5 by 38 churches". |
| `ratingCount` | `string` | `''` | when `rating` is a number | "38 churches". |
| `ratingNew` | `string` | `''` | when `rating` is `null` | "New". |
| `noReviews` | `string` | `''` | when `rating` is `null` | "No reviews yet". |
| `facts` | `readonly string[]` | `[]` | no | Up to two more facts after the rating: base city and driving distance ("Brampton, ON", "Drives up to 120 km"). More than two logs a dev-mode console error and renders the first two. |
| `artLabel` | `string` | — | yes | The portrait's description: "Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone". |
| `artYellow` | `boolean` | `false` | no | The yellow halftone, for the headliner (`.art--yellow`). |
| `artVariant` | `'solo' \| 'group'` | `'solo'` | no | The artwork silhouette. |
| `photo` | `{ src: string; srcset: string; width: number; height: number } \| null` | `null` | no | The primary photo. When set, an `<img class="artist-poster__photo">` replaces the artwork, eager-loaded with `fetchpriority="high"` because it is above the fold (L2-088). |

### `zm-artist-poster-skeleton` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | — | yes | The visually hidden `<h1>`: "Artist profile". |
| `status` | `string` | — | yes | The visually hidden `role="status"` line: "Loading the artist’s profile…". |
| `headingId` | `string` | `'artist-name'` | no | As above. |

### Outputs

None. Every action is a projected button or link; the consumer listens to it.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-poster` default | one `zm-booking-form` (the booking bar) | Rendered as the grid's second cell. |
| `zm-artist-poster` `[slot=breadcrumb]` | one `zm-breadcrumb` | Rendered first in the container. Wrapper omitted when empty (`:empty`). |
| `zm-artist-poster` `[slot=actions]` | `zm-button-link` (Book), `zm-button` with `pressed` (Save), `zm-button` (Share) | Rendered in the `.cluster` after the facts. Hidden when empty. |
| `zm-artist-poster-skeleton` `[slot=breadcrumb]` | one `zm-breadcrumb` | As above. |

Each slot is declared once. All copy arrives through inputs or slots (L2-111).

## Variants and sizes

| Variant | Selector | Use for |
|---|---|---|
| Search poster | `zm-poster` | Discover: the question, the date and the booking bar. |
| Artist poster | `zm-artist-poster` | A public profile or the artist's profile preview. |
| Artist poster, new artist | `zm-artist-poster` with `rating` `null` | No reviews yet: "New · No reviews yet", plain halftone. |
| Artist poster, loading | `zm-artist-poster-skeleton` | While the profile loads. |

One size. The poster spans the full width; its type scales with the viewport
through `clamp()` tokens: title `--text-h1` (48–88 px), date `--text-display`
(64–160 px), name `--text-poster` (72–208 px).

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | rendered | Charcoal stage, yellow kicker and date, paper title | A region named by the `<h1>` |
| Searching (Discover) | the page changes `subtitle` and the bar's submit goes busy | Sub line "Checking the calendars of every artist who drives to Burlington…" | The lineup's status line announces; the poster does not |
| No date yet | `date` "Pick a date" | "Who’s free / Pick a date" | Read as one phrase |
| Results empty or failed | the page keeps the poster | Unchanged, with the empty date ("Thu 24 Dec") or the searched date | — |
| New artist | `rating` `null` | Yellow "New", then "No reviews yet" | Read as two facts |
| Preview | the projected buttons are `disabled` | Disabled buttons on the stage | Out of the tab order |
| Loading (artist) | `zm-artist-poster-skeleton` | Stage skeletons: portrait, short text, two poster lines, text | Section `aria-busy="true"`; skeletons hidden; hidden `<h1>` stays a heading; status line announces once |
| Long name | "Grace Tabernacle Mass Choir" | Wraps at word boundaries; a word wider than the column breaks inside it | — |
| Inert | a dialog is open | No change | Not reachable |

The poster has no pointer states of its own; its buttons, links and fields
carry them, re-skinned for the stage (yellow focus ring, paper outlines).

## Markup

Rendered by `zm-poster`:

```html
<zm-poster>
  <section class="poster on-stage" aria-labelledby="hero-title">
    <div class="container poster__grid">
      <div class="stack">
        <p class="overline poster__kicker">Worship artists within driving distance of Toronto</p>
        <h1 id="hero-title" class="poster__title">Who’s free <span class="poster__date"><span>Sat</span> <span>14 Nov</span></span></h1>
        <p class="poster__sub">Seven artists are free that Saturday and will drive to Burlington.</p>
      </div>
      <zm-booking-form …>…</zm-booking-form>
    </div>
  </section>
</zm-poster>
```

Rendered by `zm-artist-poster`, rated and new:

```html
<section class="poster on-stage" aria-labelledby="artist-name">
  <div class="container stack stack--lg">
    <zm-breadcrumb …><nav aria-label="Breadcrumb"><ol class="breadcrumb">…</ol></nav></zm-breadcrumb>
    <div class="artist-poster">
      <zm-artwork class="art art--yellow" role="img" aria-label="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone"></zm-artwork>
      <div class="stack">
        <p class="overline poster__kicker">Headliner · Gospel &amp; contemporary vocalist</p>
        <h1 id="artist-name" class="artist-poster__name">Abigail Mensah</h1>
        <p class="artist-poster__facts"><strong><zm-rating><span role="img" aria-label="Rated 4.9 out of 5 by 38 churches">★ 4.9</span></zm-rating></strong><span aria-hidden="true">38 churches</span><span>Brampton, ON</span><span>Drives up to 120 km</span></p>
        <div class="cluster">…Book for Sat 14 Nov…Saved…Share…</div>
      </div>
    </div>
  </div>
</section>

<p class="artist-poster__facts"><strong>New</strong><span>No reviews yet</span><span>Etobicoke, ON</span><span>Drives up to 40 km</span></p>
```

With a photo:

```html
<img class="artist-poster__photo" src="…/abigail-mensah-640.avif" srcset="…" width="640" height="800" alt="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone" fetchpriority="high" decoding="async">
```

Rendered by `zm-artist-poster-skeleton`:

```html
<section class="poster on-stage" aria-labelledby="artist-name" aria-busy="true">
  <div class="container stack stack--lg">
    <zm-breadcrumb …>…Loading artist…</zm-breadcrumb>
    <div class="artist-poster" aria-hidden="true">
      <zm-skeleton class="skeleton skeleton--portrait" aria-hidden="true"></zm-skeleton>
      <div class="stack">
        <zm-skeleton class="skeleton skeleton--text skeleton--short" aria-hidden="true"></zm-skeleton>
        <zm-skeleton class="skeleton skeleton--poster" aria-hidden="true"></zm-skeleton>
        <zm-skeleton class="skeleton skeleton--poster skeleton--medium" aria-hidden="true"></zm-skeleton>
        <zm-skeleton class="skeleton skeleton--text" aria-hidden="true"></zm-skeleton>
      </div>
    </div>
    <h1 id="artist-name" class="visually-hidden">Artist profile</h1>
    <p class="visually-hidden" role="status">Loading the artist’s profile…</p>
  </div>
</section>
```

Consumer templates:

```html
<zm-poster [kicker]="'discover.poster.kicker' | transloco" [heading]="'discover.poster.heading' | transloco" [date]="posterDate()" [subtitle]="posterSub()">
  <zm-booking-form variant="bar" …>…</zm-booking-form>
</zm-poster>
```

```html
<zm-artist-poster [kicker]="artist.kicker" [name]="artist.name" [rating]="artist.rating" [ratingLabel]="artist.ratingLabel" [ratingCount]="artist.ratingCount"
  [ratingNew]="'profile.new' | transloco" [noReviews]="'profile.noReviews' | transloco" [facts]="[artist.city, artist.driveLine]"
  [artLabel]="artist.artLabel" [artYellow]="artist.headliner" [photo]="artist.photo">
  <zm-breadcrumb slot="breadcrumb" [crumbs]="crumbs()" [label]="'shell.breadcrumb' | transloco" />
  <zm-button-link slot="actions" variant="primary" [link]="[]" fragment="book">{{ bookLabel() }}</zm-button-link>
  <zm-button slot="actions" [pressed]="saved()" (click)="toggleSave()"><zm-icon name="heart" />{{ (saved() ? 'profile.saved' : 'profile.save') | transloco }}</zm-button>
  <zm-button slot="actions" (click)="share()"><zm-icon name="share" />{{ 'profile.share' | transloco }}</zm-button>
</zm-artist-poster>
```

The `.poster*` and `.artist-poster*` classes, the `<h1>` and the labelled
section are a contract: page objects read the date, name and facts by class
and find the poster by its heading.

## Design

- Stage: `.on-stage` sets `--color-bg-stage` and `--color-fg-on-stage`;
  `position: relative`; `overflow: hidden`; padding-block `--space-12`
  `--space-16`, from LG `--space-16` `--space-20`. Side margins come from
  `.container` (`--layout-margin`).
- Children above the corner: `.poster > * { position: relative; z-index:
  --z-raised }`.
- Halftone corner: `::after`, 22 rem square at `inset: auto -4rem -4rem auto`,
  `radial-gradient(circle, --color-accent-on-stage 22%, transparent 24%)` at
  0.85 rem, masked from the bottom-right corner, `opacity: 0.35`,
  `pointer-events: none`.
- Kicker: `--text-overline`, `--letter-spacing-stamp`, uppercase.
- Title `--text-h1`, uppercase. Date: `display: flex`, `flex-wrap: wrap`,
  `column-gap: 0.18em`, `--text-display`, each span `white-space: nowrap`.
- Sub line `--text-body-lg`.
- Search grid: gap `--space-10`; from LG `grid-template-columns: 1.15fr 1fr`,
  `align-items: end`, gap `--space-16`.
- Artist grid: gap `--space-8`; from MD `1fr 15rem` with the portrait in the
  second column (`order: 2`), `align-items: end`; from LG `1fr 20rem`.
  Portrait (art, photo or skeleton) `max-width: 18rem`; the art's rule is
  `--color-fg-on-stage`; the photo has `aspect-ratio: 4 / 5`, `object-fit:
  cover` and the same rule.
- Name `--text-poster`, uppercase, `overflow-wrap: anywhere`.
- Facts: `display: flex`, `flex-wrap: wrap`, gap `--space-2` `--space-5`,
  `--text-stub`, uppercase, `--color-fg-on-stage-muted`; `strong` in
  `--color-accent-on-stage` with inherited weight.
- Actions `.cluster`: gap `--space-2`, wrapping.
- No component tokens. Re-skin through the stage tokens on `.on-stage`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Stage | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Title, name | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Sub line, facts | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |
| Kicker, date, rating fact, halftone dots | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Stage skeleton | `--color-bg-stage-raised` | `--palette-ink-800` | `--palette-ink-800` |
| Focus ring on the stage | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Title and name |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Kicker, date, rating fact |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Sub line and facts |
| `--color-fg-on-stage` | `--color-bg-stage` | 3:1 | The portrait's rule |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Primary button label (Book) |

The stage is the same charcoal family in both themes, dropping to the deepest
ink in dark so it still reads above the dark canvas. Under forced colours the
stage takes `Canvas` and the text `CanvasText`; the halftone corner, a
background image, disappears.

## Responsive behaviour

- **XS and SM (< 768 px)**: the search poster's copy and booking bar stack in
  one column (L2-097); the artist poster shows the portrait first, capped at
  18 rem, then the copy (L2-098).
- **MD (≥ 768 px)**: the artist portrait moves to a 15 rem right column,
  bottom-aligned with the name.
- **LG and up (≥ 992 px)**: the search poster's copy and booking bar sit side by
  side (1.15fr and 1fr), bottom-aligned, `--space-16` apart (L2-097); the
  padding grows; the artist portrait column is 20 rem (L2-098).
- The date wraps between its two spans only: "Sat" may drop above "14 Nov", but
  "14 Nov" never splits. At 360 px "14 Nov" is about 64 px tall and fits.
- The artist name breaks anywhere rather than overflow ("Grace Tabernacle Mass
  Choir" at 320 px).
- The halftone corner is clipped by the poster's `overflow: hidden`, so it never
  causes horizontal scroll. At 320 px nothing in the poster clips or scrolls;
  at 200 % zoom the title, date and facts wrap and every action stays
  reachable. Actions are at least 44 × 44 CSS px.

## Accessibility

### Role and pattern

A `<section>` named by its heading (`aria-labelledby`): a region landmark that
holds the page's only `<h1>` (L2-102). No APG pattern applies; it is static
content. The portrait is `role="img"` with `artLabel` (the photo's `alt`); the
halftone corner is a pseudo-element and never announced.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the breadcrumb, the actions and the booking-bar fields in reading order. The poster itself is not focusable. |
| <kbd>Enter</kbd> | On "Book for Sat 14 Nov": goes to the booking stub (L2-019 and the stub's date field focus belong to the booking form). |

### Focus

On the stage the focus ring of every projected control is
`--color-accent-on-stage` with a `--color-bg-stage` gap; inside the paper
booking bar it returns to ink. The poster's `overflow: hidden` never clips a
ring: the container's margins keep every control at least `--space-5` from the
edge.

### Labelling

- The title reads as one phrase, "Who’s free Sat 14 Nov"; CSS adds the
  uppercase, so screen readers do not spell it out.
- The rating is one image named "Rated 4.9 out of 5 by 38 churches"; the
  visible "38 churches" fact beside it is `aria-hidden` so it is not read twice
  (L2-102). A new artist's facts read "New", "No reviews yet".
- While loading, the visually hidden `<h1>` "Artist profile" stays a heading
  and a separate `role="status"` line announces the load; `role="status"` is
  never put on the `<h1>`.

### Announcements

Only the skeleton's status line ("Loading the artist’s profile…"), once.
Search progress is announced by the lineup's status line, not the poster.

### Motion

Nothing on the poster moves. The skeleton's sweep stops under
`prefers-reduced-motion: reduce` (skeleton CRD).

## Content and internationalisation

- **Kicker**: where or who, under eight words: "Worship artists within driving
  distance of Toronto", "Headliner · Gospel & contemporary vocalist", "New to
  Zamaro · Solo vocalist & pianist".
- **Title**: the question then the date in the short form, "Who’s free" + "Sat
  14 Nov" (L2-004, L2-110); "Pick a date" before a search; the date that has
  no one free on the empty state ("Thu 24 Dec", L2-011). Sentence case in the
  source.
- **Sub line**: one sentence with a count and a place; while loading, the
  present tense and an ellipsis.
- **Name**: as the artist writes it, "&" for duos ("Daniel & Ruth Okonkwo").
- **Facts**: at most four, rating first: "★ 4.9 · 38 churches · Brampton, ON ·
  Drives up to 120 km"; a new artist "New · No reviews yet" (L2-012, L2-020).
  Distances in km (L2-110).
- **Actions** (page copy): "Book for Sat 14 Nov" with a search date, "Check
  dates" without one (L2-012).
- Translatable inputs: `kicker`, `heading`, `subtitle`, `ratingLabel` pattern,
  `ratingCount`, `ratingNew`, `noReviews`, the drive fact pattern, `heading`
  and `status` of the skeleton. Data values: the date (formatted by the API
  library's formatting service), the name, city, rating and art description.
  French runs about 30 % longer: titles, facts and actions wrap and never clip.

## Performance

- Change detection: `OnPush`, signal inputs; the date's two words and the
  facts list from `computed`s. No subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Poster.ts`
  renders the Discover hero after Naomi's search ("Who’s free Sat 14 Nov",
  "Seven artists are free that Saturday and will drive to Burlington."). Add
  `ArtistPoster.ts`, which renders Abigail Mensah's header (yellow art, ★ 4.9,
  38 churches, Brampton, ON, Drives up to 120 km, three actions, breadcrumb),
  and `ArtistPosterSkeleton.ts`, and export both from `scenarios/index.ts`.
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms.
- Composite scenarios: `DarkTheme`.
- Server rendering: both posters render fully on the server, so a crawler gets
  the date, the name and the facts in the HTML (L2-112).
- Largest Contentful Paint: on a profile the portrait photo or the name is the
  LCP element; the photo is eager, `fetchpriority="high"`, with explicit
  `width` and `height` (L2-086, L2-088).
- Layout stability: the skeleton has the same grid, portrait cap and
  poster-sized name lines, so the profile lands without moving (L2-105).
- Imports: `zm-rating`, `zm-artwork`, `zm-skeleton`. Breadcrumb, buttons and the
  booking bar arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given a search for Sat 14 Nov from Burlington, when Discover renders, then the poster's `<h1>` reads "Who’s free Sat 14 Nov", the date is two no-wrap spans "Sat" and "14 Nov" in `.poster__date`, and the sub line reads "Seven artists are free that Saturday and will drive to Burlington." (L2-004)
- **AC-2** Given a guest who has not searched, when Discover renders with `date` "Pick a date", then the title reads "Who’s free Pick a date" with spans "Pick" and "a date". (L2-004)
- **AC-3** Given a nearby date Sun 20 Dec is chosen from the empty state, when the search re-runs, then the poster's date reads "Sun 20 Dec". (L2-011)
- **AC-4** Given Abigail Mensah's profile opened from a Sat 14 Nov search, when it renders, then the poster shows the kicker "Headliner · Gospel & contemporary vocalist", the `<h1>` "Abigail Mensah", the facts "★ 4.9", "38 churches", "Brampton, ON", "Drives up to 120 km", and the projected "Book for Sat 14 Nov", "Saved" and "Share" actions after the facts. (L2-012)
- **AC-5** Given Miriam Haile, who has no reviews, when her profile renders with `rating` `null`, then the facts read "New", "No reviews yet", "Etobicoke, ON", "Drives up to 40 km", with "New" in the yellow `<strong>`, and no rating image is rendered. (L2-020)
- **AC-6** Given the breadcrumb slot is empty (profile preview), when the artist poster renders, then no empty wrapper takes space above the header. (L2-012)
- **AC-7** Given a `photo` for Abigail Mensah, when the poster renders, then the portrait is an `<img class="artist-poster__photo">` with `srcset`, explicit `width` and `height`, `fetchpriority="high"`, no `loading="lazy"`, and `artLabel` as `alt`; without a photo it is `zm-artwork` with `.art--yellow` when `artYellow` is set. (L2-088)
- **AC-8** Given a crawler requests Discover or a profile, when the server-rendered HTML arrives, then it already contains the poster's `<h1>`, date or name, and facts. (L2-112)

### States

- **AC-9** Given the profile is loading, when `zm-artist-poster-skeleton` renders, then the section has `aria-busy="true"`, the header grid is `aria-hidden` and holds a portrait, a short text, two poster lines (one medium) and a text skeleton, and a visually hidden `<h1>` "Artist profile" stays in the page. (L2-105)
- **AC-10** Given the skeleton replaced by Abigail Mensah's poster, when the swap is measured, then the cumulative layout shift from it is 0.05 or less. (L2-105)
- **AC-11** Given the Discover search is running, when the page changes the sub line to "Checking the calendars of every artist who drives to Burlington…", then the poster's kicker, title and date stay unchanged. (L2-004)

### Keyboard and focus

- **AC-12** Given Abigail's profile, when the booker tabs through the poster, then focus moves through the breadcrumb link, "Book for Sat 14 Nov", "Saved" and "Share" in that order, each with a `--color-accent-on-stage` focus ring that is not clipped by the poster. (L2-101)

### Screen readers

- **AC-13** Given any public page with a poster, when its landmarks are listed, then the poster is a region named by its heading, and the page has exactly one `<h1>`, the poster's. (L2-102)
- **AC-14** Given Abigail's facts, when they are read by a screen reader, then the rating is announced once as "Rated 4.9 out of 5 by 38 churches" and the visible "38 churches" fact is not read again. (L2-102)
- **AC-15** Given the loading skeleton, when a screen reader reads the page, then it announces "Loading the artist’s profile…" once from a status line that is not the `<h1>`. (L2-102)
- **AC-16** Given every poster state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the light and the dark theme, when a poster renders, then its stage is `--color-bg-stage` charcoal in both, with paper title and yellow kicker and date. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then title, kicker, date, sub line and facts are each at least 4.5:1 against the stage. (L2-103)

### Responsive

- **AC-19** Given an XS viewport (360 px), when Discover renders, then the poster copy sits above the booking bar in one column. (L2-097)
- **AC-20** Given an LG viewport (1280 px), when Discover renders, then the poster copy and the booking bar sit side by side in a 1.15fr / 1fr grid, bottom-aligned. (L2-097)
- **AC-21** Given XS and MD viewports, when Abigail's profile renders, then at XS the portrait sits above the name, capped at 18 rem; from MD it sits in a right column of 15 rem (20 rem from LG). (L2-098)
- **AC-22** Given a 360 px viewport, when the date "14 Nov" renders at `--text-display`, then it stays on one line and does not overflow the poster. (L2-096)
- **AC-23** Given a 320 px viewport and the name "Grace Tabernacle Mass Choir", when the artist poster renders, then the name wraps, a word wider than the column breaks inside it, and the page does not scroll horizontally. (L2-096)
- **AC-24** Given text zoomed to 200 %, when either poster renders, then the title, facts and actions wrap and every action stays reachable without horizontal scroll. (L2-096)
- **AC-25** Given the French catalogue, when the kicker, sub line and facts are about 30 % longer, then they wrap inside the poster without clipping. (L2-111)

### Motion

- **AC-26** Given `prefers-reduced-motion: reduce`, when the artist poster skeleton renders, then no skeleton animates, and the poster itself has no animation in any state. (L2-103)

### Formatting

- **AC-27** Given an event date of 2027-01-09, outside the current year, when the poster renders the page's formatted date, then it reads "Sat 9 Jan 2027" split as "Sat" and "9 Jan 2027". (L2-110)

### Performance

- **AC-28** Given the `Poster`, `ArtistPoster` and `ArtistPosterSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-poster` (search poster). To meet this CRD:

- Add the `overline` class to the kicker, so the markup matches the design
  system and the visual tests.
- Keep the date split and the `nowrap` spans; keep `headingId`.
- Make the host `display: block`.
- Add `zm-artist-poster` (`artist-poster.ts`, class `ArtistPoster`) and
  `zm-artist-poster-skeleton` (`artist-poster-skeleton.ts`) in the same folder,
  sharing the stage styles (move them to a shared stylesheet in the folder, not
  to global styles). Compose `zm-rating` (inline, no count), `zm-artwork` and
  `zm-skeleton`.
- Add `.artist-poster__photo` styles (D-4).
- Wrap the breadcrumb and actions slots in wrappers hidden with `:empty`.
- Add the `ArtistPoster.ts` and `ArtistPosterSkeleton.ts` scenarios.

## Decisions

- **D-1** *Is the artist poster part of this CRD, though the search poster is the one built?* Yes. The design system defines both layouts on one page, and the [rating](rating.md) CRD already points here for the poster facts. Specifying both now keeps the shared stage rules in one place.
- **D-2** *One component with a layout input, or separate components?* Separate. The search poster projects a form; the artist poster projects a breadcrumb and actions. One component would need conditional slots, which AGENTS.md forbids in branches.
- **D-3** *Where does the profile error go?* To [`zm-error-stage`](error-page.md). It is the same stage with different content (kicker "Show postponed", a plain-words title) plus the recovery alert, and both the error-page and poster design-system pages show it; the error page owns L2-107.
- **D-4** *How does a real photo fit the halftone portrait slot?* As `<img class="artist-poster__photo">` with the art's 4:5 ratio, 18 rem cap and stage rule. The design system shows only the halftone; L2-088 sets the photo rules, and the ticket CRD takes the same approach for its art.
- **D-5** *Why is "38 churches" hidden next to the rating?* The mocks hide it: the rating's accessible name already says "by 38 churches", so reading the fact again would repeat it. For a new artist both facts are read.
- **D-6** *How many facts?* At most four, rating first, as the design system's content rules say. The rating and its count are two; `facts` holds the other two, and a dev-mode error catches a third.
- **D-7** *Is the profile portrait lazy-loaded?* No. It is above the fold and usually the Largest Contentful Paint element, so it loads eagerly with `fetchpriority="high"`, as L2-088's "unless it is above the fold" allows.
