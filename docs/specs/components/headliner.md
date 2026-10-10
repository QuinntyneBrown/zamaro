# Headliner

| Field | Value |
|---|---|
| Selector | `zm-headliner`, `zm-headliner-skeleton` |
| Library path | `frontend/projects/components/src/lib/headliner/` |
| Status | built |
| Traces to | L2-006, L2-007, L2-026, L2-086, L2-088, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`headliner.html`](../../design-system/components/headliner.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/discover/empty`](../../mocks/pages/discover/empty.html), [`pages/discover/error`](../../mocks/pages/discover/error.html) |
| Rendering | [`headliner.html`](headliner.html) |

## Purpose and scope

The headliner is the top of the bill on Discover: the most-booked artist who is
free on the booker's date and within travel range, shown larger than the rest of
the lineup, with a church's own words about why. It is "No. 01": a framed panel
with the yellow halftone art (or the primary photo), the display-size name, four
facts, one five-star quote, the "Free {date}" badge, an ink button to the
profile and a save toggle. It stays first whatever the sort; the tickets below
it follow the sort, numbered from "No. 02" (L2-006, L2-007).

`zm-headliner-skeleton` is the same frame filled with skeletons, for the lineup
while it loads.

Use something else when:

- it is any other artist in the lineup → [ticket](ticket.md);
- it is the artist's own profile header → [poster](poster.md);
- nobody is free → [empty state](empty-state.md); the search failed →
  [alert](alert.md). Neither page has a headliner.

Out of scope:

- Choosing the headliner (most bookings this season, ties by rating, distance,
  artist ID), the season word and the "one per page" rule. The search API and
  the page own them (L2-006).
- Picking and truncating the review on the server. The API sends the most
  recent five-star review; the component enforces the 160-character limit so it
  holds wherever the quote comes from (see Content).
- The save toggle's behaviour (saving, the "Saved {name}" toast with Undo, the
  sign-in redirect for guests, the 200-artist limit). The
  [save toggle](save-toggle.md) owns it; the headliner gives it a place in the
  actions row.
- Formatting the date, price, distance and rating. The page passes formatted
  strings from the API library's format service.
- The lineup section, its `h2` "The lineup", its `aria-busy` and the status
  line. The page owns them.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` lineup, top | Abigail Mensah: kicker "No. 01 · Most booked this autumn", name `h3`, meta "Solo vocalist · Hymns" / "Brampton · 44 km" / "★ 4.9 · 38 churches" / "From $650", quote and "Rev. Janet Clarke, Oshawa", badge "Free Sat 14 Nov", button "See Abigail's profile" → `/artists/abigail-mensah?date=2026-11-14`, yellow solo art with tag "Headliner" | save toggle, pressed ("Remove Abigail Mensah from your saved artists") | default, name hover and focus, button hover, focus, active, toggle saved / saving | canvas |
| Design system "Real photo, not saved" | Daniel & Ruth Okonkwo: "Duo · Acoustic, Hymns", "Ajax · 97 km", "★ 4.9 · 14 churches", "From $700", quote by "Pastor Femi Adebayo, Brampton", button "See Daniel & Ruth Okonkwo's profile", group art with the primary photo | save toggle, not pressed | default, photo | canvas |
| A group headliner (Hosanna Collective, Grace Tabernacle Mass Choir) | group art; the button uses the full name: "See Grace Tabernacle Mass Choir's profile" | save toggle | default, long name wrapping | canvas |
| An artist with no reviews who has the most bookings | rating `null` → "New"; no quote | save toggle | no reviews, no quote | canvas |
| One result only (L2-006 criterion 7) | as Discover, with no tickets after it | save toggle | default | canvas |
| Signed-out guest on Discover | as Discover | save toggle, not pressed (activating it starts sign-in, L2-026) | default | canvas |
| Date filled while the page is open | badge `booked`: "Booked Sat 14 Nov" | save toggle | booked | canvas |
| `pages/discover/loading` | `zm-headliner-skeleton`, `aria-hidden` | — | loading | canvas |
| `pages/discover/empty`, `pages/discover/error`, `invalid`, `limited` | no headliner | — | — | — |
| Dialogs and toasts over Discover (`dialogs/menu`, `dialogs/account-menu`, `notifications/saved-toast/*`, `notifications/system-banner/*`) | as Discover | as Discover | inert behind the dialog; the toast "Saved Abigail Mensah" follows the toggle | canvas |

## Anatomy

1. **Frame** — `article.headliner`: paper surface, `--border-width-poster`
   frame in `--color-border-strong`, hard `--shadow-3`, padding `--space-8`
   (`--space-10` from LG). It never moves.
2. **Art** — `zm-artwork` (`.art.art--yellow`, solo or group), 4:5, with the
   tag `.art__tag` "Headliner". The only yellow halftone in the lineup.
3. **Body** — `.stack.headliner__body`: the copy column, bottom-aligned beside
   the art from MD.
4. **Kicker** — `p.overline.headliner__kicker`: "No. 01 · Most booked this
   autumn".
5. **Name** — `h3.headliner__name` with one link to the profile, in
   `--text-display`, uppercase. Hover fills it yellow.
6. **Meta** — `.headliner__meta`: four stub-font facts, each a `<span>`: act
   type and styles, town · distance, rating (`zm-rating`), "From" price.
7. **Quote (optional)** — `p.headliner__quote`: one review sentence in a `<q>`,
   then the reviewer muted after a dash (`span.text-muted.headliner__attribution`).
8. **Actions** — `.cluster.headliner__actions`: the badge (`zm-badge` `free`,
   or `booked`), the ink `zm-button-link` with a trailing arrow, and the
   projected save toggle.

Host: `zm-headliner` is `display: block` and renders the `<article>` inside it,
so the article is a native element named by its heading. It sits directly in the
lineup section, before the page's `<ol class="lineup">`.

`zm-headliner-skeleton` is itself the frame: the host carries `.headliner` and
`aria-hidden="true"`. It is a plain element, not an article.

## API

### `zm-headliner` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | "No. 01 · Most booked this autumn". |
| `name` | `string` | — | yes | The artist's own spelling. The heading and link text. |
| `nameId` | `string` | a unique `zm-headliner-name-{n}` | no | The heading's `id`; the article's `aria-labelledby` points at it. |
| `link` | `string \| unknown[]` | — | yes | `routerLink` to the profile, `/artists/{slug}`. Used by the name and the button. |
| `queryParams` | `Record<string, string>` | `{}` | no | The carried-forward search date: `{ date: '2026-11-14' }`. |
| `artVariant` | `'solo' \| 'group'` | `'solo'` | no | The artwork silhouette. The art is always yellow. |
| `artLabel` | `string` | — | yes | Describes the photo: "Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone". |
| `artTag` | `string` | — | yes | "Headliner". |
| `photo` | `ArtworkPhoto \| null` | `null` | no | The primary photo ([artwork](artwork.md)); always loaded with `priority`. |
| `actLine` | `string` | — | yes | "Solo vocalist · Hymns". |
| `placeLine` | `string` | — | yes | "Brampton · 44 km". |
| `rating` | `number \| null` | — | yes | `null`: `ratingNew` ("New"). A number: "★ 4.9 · {ratingCount}". Rendered by `zm-rating`. |
| `ratingLabel` | `string` | — | yes | "Rated 4.9 out of 5 by 38 churches", or "No reviews yet". |
| `ratingCount` | `string` | `''` | when `rating` is a number | "38 churches". |
| `ratingNew` | `string` | `''` | when `rating` is `null` | "New". |
| `priceLabel` | `string` | — | yes | "From". |
| `price` | `string` | — | yes | "$650". The meta reads "{priceLabel} {price}". |
| `quote` | `string \| null` | `null` | no | The review sentence, without quotation marks. `null` or empty: no quote paragraph. Truncated to 160 characters (see Content). |
| `attribution` | `string` | `''` | when `quote` is set | "Rev. Janet Clarke, Oshawa": the reviewer's name and city. |
| `availability` | `string` | — | yes | "Free Sat 14 Nov". |
| `booked` | `boolean` (attribute) | `false` | no | The badge becomes `booked` ("Booked Sat 14 Nov"); see States. |
| `profileLabel` | `string` | — | yes | "See Abigail's profile". The button's visible text and name. |

### `zm-headliner-skeleton` inputs

None.

### Outputs

None. Navigation is the two links; saving belongs to the projected toggle.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | one `zm-save-toggle` | Rendered last in `.headliner__actions`, after the button. Declared once. |

All copy arrives as inputs (L2-111). The template holds only punctuation: the
" · " separators come from the page's strings, and the dash before the reviewer
is the typographic "— ".

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Placeholder art | — | The artist has no primary photo yet: the yellow halftone. |
| Photo | `photo` set | The primary photo inside the yellow art, greyscale and multiplied onto the yellow. |
| No quote | `quote` null | No five-star review yet. |
| Booked | `booked` | The searched date filled while the page was open. |
| Loading | `zm-headliner-skeleton` | The lineup is still loading. |

The headliner has one size. It spans the lineup column; the art column and
padding change at MD and LG, and the name's type scales with the viewport through
`--text-display`.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper frame, yellow art, ink button | An article named "Abigail Mensah" with a heading, two links and a toggle |
| Name hover | `.headliner__name a:hover` | The name's text fills `--color-accent` with `--color-fg-on-accent` type, like a highlighter | — |
| Name focus | `:focus-visible` | Two-tone ring hugging the text; a two-line name shows a ring per line | — |
| Button hover / focus / active | the button's states | Lift over `--shadow-1`, ring, press (button CRD) | — |
| Saved | toggle `aria-pressed="true"` | Yellow toggle, filled heart (save toggle CRD) | "Remove Abigail Mensah from your saved artists, toggle button, pressed" |
| Saving | toggle `aria-busy="true"` | The heart pulses | Busy |
| No reviews | `rating = null` | Meta reads "New" in place of the rating | "No reviews yet" |
| No quote | `quote = null` | No quote paragraph; the actions follow the meta | — |
| Booked | `booked = true` | Badge `booked`: "Booked Sat 14 Nov". Nothing else changes; the artist drops out of the headliner slot on the next search | The badge text carries the meaning |
| Photo | `photo` set | Photo in the yellow art | `<img alt>` = `artLabel` |
| Loading | `zm-headliner-skeleton` | The frame with skeleton blocks sized like the parts (see Design) | The page hides it (`aria-hidden`) and sets `aria-busy` on the lineup section |
| Empty / error | no results / search failed | There is no headliner; the empty state or the alert takes the lineup's place | — |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

The frame itself does not react to the pointer; only its three controls do.

## Markup

Rendered by `zm-headliner`:

```html
<zm-headliner>
  <article class="headliner" aria-labelledby="zm-headliner-name-0">
    <zm-artwork class="art art--yellow" role="img" aria-label="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone"><span class="art__tag">Headliner</span></zm-artwork>
    <div class="stack headliner__body">
      <p class="overline headliner__kicker">No. 01 · Most booked this autumn</p>
      <h3 class="headliner__name" id="zm-headliner-name-0"><a href="/artists/abigail-mensah?date=2026-11-14">Abigail Mensah</a></h3>
      <div class="headliner__meta">
        <span>Solo vocalist · Hymns</span><span>Brampton · 44 km</span>
        <span><zm-rating><span role="img" aria-label="Rated 4.9 out of 5 by 38 churches">★ 4.9 · 38 churches</span></zm-rating></span>
        <span>From $650</span>
      </div>
      <p class="headliner__quote"><q>She had the whole congregation singing in three-part harmony by the last verse.</q> <span class="text-muted headliner__attribution">— Rev. Janet Clarke, Oshawa</span></p>
      <div class="cluster headliner__actions">
        <zm-badge><span class="badge badge--free">Free Sat 14 Nov</span></zm-badge>
        <zm-button-link><a class="btn btn--ink" href="/artists/abigail-mensah?date=2026-11-14">See Abigail’s profile <zm-icon>…arrow-right…</zm-icon></a></zm-button-link>
        <zm-save-toggle>…<button class="save" type="button" aria-pressed="true" aria-label="Remove Abigail Mensah from your saved artists">…</button></zm-save-toggle>
      </div>
    </div>
  </article>
</zm-headliner>
```

With a photo, the artwork renders it inside the yellow art (artwork CRD) with
`loading="eager"` and `fetchpriority="high"`, and the art host drops its role:

```html
<zm-artwork class="art art--yellow art--group"><picture>…<img … width="800" height="1000" alt="Daniel and Ruth Okonkwo singing together at a piano" loading="eager" fetchpriority="high" decoding="async"></picture><span class="art__tag">Headliner</span></zm-artwork>
```

Without a quote, `p.headliner__quote` is not rendered. Booked swaps the badge's
modifier: `<span class="badge badge--booked">Booked Sat 14 Nov</span>`.

Loading:

```html
<zm-headliner-skeleton class="headliner" aria-hidden="true">
  <span class="skeleton skeleton--portrait"></span>
  <div class="stack">
    <span class="skeleton skeleton--text skeleton--short"></span>
    <span class="skeleton skeleton--poster"></span>
    <span class="skeleton skeleton--poster skeleton--medium"></span>
    <span class="skeleton skeleton--text"></span>
    <span class="skeleton skeleton--text skeleton--short headliner__skeleton--below-sm"></span>
    <span class="skeleton skeleton--text skeleton--long"></span>
    <span class="skeleton skeleton--text skeleton--long"></span>
    <span class="skeleton skeleton--text skeleton--medium"></span>
    <span class="skeleton skeleton--control skeleton--medium"></span>
    <span class="skeleton skeleton--control skeleton--short headliner__skeleton--below-lg"></span>
    <span class="skeleton skeleton--target headliner__skeleton--below-sm"></span>
  </div>
</zm-headliner-skeleton>
```

Consumer template on Discover:

```html
<section id="lineup" class="section" aria-labelledby="lineup-title" [attr.aria-busy]="loading() || null">
  …<h2 id="lineup-title">{{ 'lineup.title' | transloco }}</h2>…
  @if (loading()) {
    <zm-headliner-skeleton />
  } @else if (headliner(); as h) {
    <zm-headliner [kicker]="'lineup.headliner.kicker' | transloco: { season: h.season }" [name]="h.name"
      [link]="['/artists', h.slug]" [queryParams]="{ date: searchDate() }"
      [artVariant]="h.artVariant" [artLabel]="h.artLabel" [artTag]="'lineup.headliner.tag' | transloco" [photo]="h.photo"
      [actLine]="h.actLine" [placeLine]="h.placeLine"
      [rating]="h.rating" [ratingLabel]="h.ratingLabel" [ratingCount]="h.ratingCount" [ratingNew]="'lineup.new' | transloco"
      [priceLabel]="'lineup.from' | transloco" [price]="h.price"
      [quote]="h.quote" [attribution]="h.attribution"
      [availability]="h.availability" [booked]="h.booked"
      [profileLabel]="'lineup.headliner.profile' | transloco: { name: h.profileName }">
      <zm-save-toggle [artistName]="h.name" [saved]="h.saved" (savedChange)="toggleSave(h)" />
    </zm-headliner>
  }
  <ol class="lineup" role="list" …>…</ol>
</section>
```

The `.headliner*` classes, the `<article>` with `aria-labelledby`, the `h3` and
the two links are a contract: the e2e page object finds the headliner by
`.headliner`, its name by the heading, and reads the meta and quote by class.
The utility classes (`.stack`, `.overline`, `.text-muted`, `.cluster`) keep
visual parity with the mocks.

## Design

- Grid: one column under MD (art on top, full width, 4:5); from MD (768 px)
  `16rem minmax(0, 1fr)` with `align-items: end`; from LG (992 px) `20rem
  minmax(0, 1fr)`.
- Padding and gap `--space-8`; from LG `--space-10`.
- Frame `--border-width-poster` solid `--color-border-strong` on
  `--color-bg-surface`, `--shadow-3`. No transition: the frame never moves.
- Body: `.stack` gap `--space-4`, `min-width: 0` so long names wrap.
- Kicker `--text-overline`, `--letter-spacing-stamp`, uppercase.
- Name `--text-display`, uppercase, `overflow-wrap: anywhere`, margin 0. The
  link inherits colour with no underline; on hover its background is
  `--color-accent` and its colour `--color-fg-on-accent`.
- Meta: flex, wrapping, gap `--space-2` `--space-4`, `--text-stub`, uppercase.
  Each fact wraps as a unit.
- Quote `--text-body`, `--color-fg-default`; the `<q>` draws the language's
  quotation marks; the attribution `--color-fg-muted`.
- Actions: `.cluster` (wrapping, gap `--space-2`), so the badge, button and
  toggle wrap as units.
- Skeleton: the same frame, grid and padding; the blocks in Markup. Two
  component-scoped classes hide rows where the real content takes fewer lines:
  `.headliner__skeleton--below-sm` is hidden from SM (576 px), and
  `.headliner__skeleton--below-lg` from LG (992 px). The rows reproduce
  Abigail Mensah's headliner within 10 % of its height at 360, 768 and 1280 px:
  measured, the real headliner is 934, 549 and 558 px tall and the skeleton 924,
  552 and 580 px.

No component tokens. The name hover reads `--color-accent` and
`--color-fg-on-accent`; the frame reads semantic tokens only.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Frame surface | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Frame rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Print shadow | `--shadow-3` (`--color-shadow`) | `--palette-ink-700` | `--palette-signal-500` |
| Name, meta, quote | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Reviewer | `--color-fg-muted` | per theme | per theme |
| Yellow art, name hover, free badge | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Art dots, text on yellow | `--color-border-on-accent` / `--color-fg-on-accent` | per theme (ink) | per theme (ink) |
| Tag and ink button | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

In the dark theme the frame becomes a charcoal panel with a light frame and a
yellow print shadow; the yellow art and the tag look the same in both themes;
the ink button turns paper-coloured.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Name, meta, quote |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Reviewer |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Tag and ink button label |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Free badge, name hover |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Frame |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on the name and button |

## Responsive behaviour

- **XS and SM (< 768 px)**: one column. The art is on top, full width at 4:5;
  the copy follows; padding `--space-8`. This is the lineup's single column
  (L2-097).
- **MD (≥ 768 px)**: two columns, the art 16 rem and the copy bottom-aligned
  beside it.
- **LG and up (≥ 992 px)**: the art 20 rem; padding and gap `--space-10`. The
  headliner spans both of the lineup's ticket columns.
- The name wraps and, when one word is wider than the column, breaks inside the
  word (`overflow-wrap: anywhere`): at 320 px "TABERNACLE" in
  `--text-display` does. It never truncates or scrolls sideways.
- The meta facts and the actions wrap as units: at 360 px the badge, the button
  and the toggle take three rows.
- A long button label wraps inside the button rather than overflowing: at
  320 px "See Grace Tabernacle Mass Choir's profile" takes four lines and the
  button grows taller (D-11).
- At 320 px nothing overflows the frame or the page; at 200 % zoom everything
  stays reachable.
- The button and the toggle are at least 44 × 44 px with `--space-2` between
  them; the name is a large target on its own.

## Accessibility

### Role and pattern

An `<article>` labelled by the name's heading (`aria-labelledby`), so it is
listed as "Abigail Mensah, article". The name is an `<h3>` under the lineup's
`<h2>`, at the level of the ticket names that follow. It holds two links to the
same profile, the name and the button. That is deliberate: the button gives a
large target and a clear label, and the two have distinct text. The save toggle
follows the [APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
with `aria-pressed`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Three stops in order: the name, "See Abigail's profile", the save toggle. |
| <kbd>Enter</kbd> | On the name or the button: opens the profile with the search date. On the toggle: toggles save. |
| <kbd>Space</kbd> | On the toggle: toggles save. |

### Focus

Each control shows the two-tone ring (ink in the light theme, yellow in the
dark). The name's ring hugs the text. The frame does not clip the rings: no
`overflow: hidden` on the article or the body.

### Labelling

- The article's name is the artist's name.
- The art is one image named by `artLabel`; the "Headliner" tag inside it is not
  read separately. With a photo, the `<img alt>` carries the description.
- The rating is one image named "Rated 4.9 out of 5 by 38 churches", never star
  characters (L2-102).
- The price reads "From $650".
- The quote is a `<q>`; the reviewer is plain text after a dash.
- The button's name is its visible text, "See Abigail's profile"; the arrow is
  `aria-hidden`.
- The save toggle is named after the artist (save toggle CRD).

### Announcements

None from the headliner. The page announces the result summary through its
status region; the save toggle's toast announces itself.

### Motion

The ink button lifts in `--duration-fast` and the save toggle snaps with
`--ease-spring`; both are instant under `prefers-reduced-motion: reduce`. The
frame never moves. Skeletons stop shimmering (skeleton CRD).

## Content and internationalisation

- **Kicker**: "No. 01 · Most booked this {season}", with the season word from
  the catalogue ("spring", "summer", "autumn", "winter"). Never "Featured" or
  "Sponsored" (L2-006).
- **Name**: the artist's own spelling, "&" for duos ("Daniel & Ruth Okonkwo").
- **Meta**: four facts, no more: act line "Solo vocalist · Hymns", town ·
  distance "Brampton · 44 km", the rating "★ 4.9 · 38 churches" or "New", and
  "From $650" (L2-006, L2-110).
- **Quote**: the most recent five-star review, plain text, in the page
  language's quotation marks (drawn by `<q>`). If it is longer than 160
  characters, the component cuts it at the last space within its first 160
  characters, drops trailing punctuation and spaces, and adds "…", so the result
  is at most 160 characters. A quote of 160 characters or fewer is shown
  unchanged, so a quote the API already truncated is not cut again.
- **Attribution**: the reviewer's name as they gave it and their city: "Rev.
  Janet Clarke, Oshawa".
- **Button**: "See {first name}'s profile"; for groups and duos the full name:
  "See Grace Tabernacle Mass Choir's profile", "See Daniel & Ruth Okonkwo's
  profile".
- **Badge**: "Free {short date}", the searched date: "Free Sat 14 Nov";
  "Booked Sat 14 Nov" when booked (L2-110).
- French runs about 30 % longer ("Le plus demandé cet automne", "Voir le profil
  d'Abigail"); the kicker, meta and actions wrap within the frame.
- Translatable inputs: `kicker`, `artTag`, `ratingNew`, `priceLabel`,
  `availability`, `profileLabel`, and the rating label pattern. Data values:
  `name`, `actLine`, `placeLine`, `ratingCount`, `price`, `quote`,
  `attribution`, `artLabel`.

## Performance

- Change detection: `OnPush`, signal inputs. Computed values: the truncated
  quote and the badge variant. No subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Headliner.ts`
  renders Abigail Mensah ("No. 01 · Most booked this autumn", "Solo vocalist ·
  Hymns", "Brampton · 44 km", ★ 4.9 · 38 churches, "From $650", Rev. Janet
  Clarke's quote, "Free Sat 14 Nov", "See Abigail's profile") with a projected
  save toggle.
- Add `HeadlinerSkeleton.ts`, which renders one `zm-headliner-skeleton`. Both
  are tuned in `e2e/perf-test/config/scenario-iterations.mjs` to roughly
  100–300 ms.
- Layout stability: the skeleton has the same frame and grid as the headliner
  and rows that reproduce its height (Design), so the swap shifts the lineup
  below it as little as possible (L2-105). The art's ratio reserves its space,
  and a photo has explicit `width` and `height`.
- LCP: on phones the headliner's art is usually Discover's largest image, so
  the photo loads eagerly with `fetchpriority="high"` (L2-086, L2-088).
- Imports: `RouterLink`, `zm-artwork`, `zm-rating`, `zm-badge`,
  `zm-button-link`, `zm-icon`. The save toggle arrives through the slot.

## Acceptance criteria

### Rendering

- **AC-1** Given Abigail Mensah as the headliner, when it renders, then it shows "No. 01 · Most booked this autumn", "Abigail Mensah" as an `h3` link, the facts "Solo vocalist · Hymns", "Brampton · 44 km", "★ 4.9 · 38 churches" and "From $650" in that order, the quote with "— Rev. Janet Clarke, Oshawa", the badge "Free Sat 14 Nov" and the ink button "See Abigail's profile" with a trailing arrow. (L2-006)
- **AC-2** Given the headliner, when it renders, then its art is a yellow halftone (`.art.art--yellow`) with the tag "Headliner", and no other artwork in the lineup is yellow-tagged. (L2-006)
- **AC-3** Given Abigail's primary `photo`, when the headliner renders, then the photo is an `<img>` inside the yellow art with `srcset`, explicit `width` and `height`, `loading="eager"`, `fetchpriority="high"` and the `artLabel` as `alt`. (L2-088)
- **AC-4** Given the headliner linked to `/artists/abigail-mensah` with `queryParams` `{ date: '2026-11-14' }`, when the booker activates the name or "See Abigail's profile", then they navigate to `/artists/abigail-mensah?date=2026-11-14`. (L2-006)
- **AC-5** Given a projected save toggle for a signed-in booker, when the headliner renders, then the toggle sits last in the actions row and reflects whether Abigail is saved, and activating it does not open the profile. (L2-006)
- **AC-6** Given a guest on Discover, when they activate the headliner's save toggle, then only the toggle's action runs (it starts sign-in) and the headliner does not navigate. (L2-026)
- **AC-7** Given a review of 212 characters, when the headliner renders it, then the quote is at most 160 characters, ends at a word boundary followed by "…", and has no trailing space or punctuation before the ellipsis. (L2-006)
- **AC-8** Given a quote of 160 characters or fewer, including one the API already cut and ended with "…", when the headliner renders, then it is shown unchanged. (L2-006)
- **AC-9** Given a headliner with no five-star review, when it renders with `quote` null, then there is no quote paragraph and the actions row follows the meta. (L2-006)
- **AC-10** Given the most-booked artist has no reviews yet, when the headliner renders with `rating` null and `ratingNew` "New", then the rating fact reads "New" and is named "No reviews yet". (L2-006)
- **AC-11** Given Grace Tabernacle Mass Choir as the headliner with `artVariant` group, when it renders, then the art shows the group silhouette on yellow and the button reads "See Grace Tabernacle Mass Choir's profile". (L2-006)
- **AC-12** Given the lineup re-sorted from Closest first to Price, low to high, when the page re-renders, then the headliner keeps "No. 01 · Most booked this autumn" and the same artist, and its element is not re-created. (L2-007)

### States

- **AC-13** Given a pointer over the name, when it hovers, then the name's text fills `--color-accent` with `--color-fg-on-accent` type, and the frame does not move. (L2-006)
- **AC-14** Given `zm-headliner-skeleton`, when it renders in place of the headliner, then it is a `.headliner` frame with `aria-hidden="true"`, contains only skeleton blocks, and is not an article. (L2-105)
- **AC-15** Given Abigail's headliner and the skeleton at 360, 768 and 1280 px, when both are measured, then the skeleton's height is within 10 % of the headliner's at each width. (L2-105)
- **AC-16** Given the skeleton replaced by Abigail's headliner on Discover, when the swap is measured, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)
- **AC-17** Given `booked` with `availability` "Booked Sat 14 Nov", when the headliner renders, then the badge has `.badge--booked` and reads "Booked Sat 14 Nov". (L2-006)

### Keyboard and focus

- **AC-18** Given keyboard focus entering the headliner, when the booker tabs through it, then focus moves to the name, then "See Abigail's profile", then the save toggle, and each shows the two-tone focus ring, unclipped. (L2-101)
- **AC-19** Given focus on the name or the button, when the booker presses Enter, then the profile opens with the search date; given focus on the toggle, when they press Space, then it toggles. (L2-101)

### Screen readers

- **AC-20** Given the headliner, when a screen reader lists landmarks and articles, then it is an article named "Abigail Mensah" (`aria-labelledby` pointing at the heading's `id`), and the heading is level 3. (L2-102)
- **AC-21** Given the rating fact, when it is read by a screen reader, then it is announced as "Rated 4.9 out of 5 by 38 churches", not as star characters. (L2-102)
- **AC-22** Given the art with its tag, when it is read by a screen reader, then it is one image named by `artLabel` and "Headliner" is not read separately. (L2-102)
- **AC-23** Given the headliner in both themes, in default, photo, no-quote and booked states, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-24** Given the dark theme, when the headliner renders, then the frame is `--color-bg-surface` charcoal with a `--color-border-strong` frame and a yellow `--shadow-3`, the yellow art and the tag look as in the light theme, and the ink button is paper-coloured. (L2-104)
- **AC-25** Given both themes, when contrast is measured, then the name, meta and quote are at least 4.5:1, the reviewer at least 4.5:1, the tag, button label and badge at least 4.5:1 on their fills, and the frame and focus ring at least 3:1. (L2-103)

### Responsive

- **AC-26** Given an XS viewport (360 px), when the headliner renders, then the art is on top at full width and 4:5, and the copy follows in one column. (L2-097)
- **AC-27** Given MD and LG viewports, when the headliner renders, then the art is 16 rem wide beside bottom-aligned copy at MD, and 20 rem with `--space-10` padding at LG. (L2-096)
- **AC-28** Given a 320 px viewport and "Grace Tabernacle Mass Choir", when the headliner renders, then the name wraps, "TABERNACLE" breaks inside the word rather than overflowing, the meta and actions wrap as units, nothing is clipped, and the page does not scroll horizontally. (L2-096)
- **AC-29** Given a touch device, when the button and the save toggle are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-30** Given the French catalogue, when the kicker, "From" and the button label are about 30 % longer, then they wrap within the frame without clipping. (L2-111)

### Motion

- **AC-31** Given `prefers-reduced-motion: reduce`, when the button is hovered or the toggle activated, then the lift and the snap happen without a transition, and the frame never moves in either setting. (L2-103)

### Formatting

- **AC-32** Given the formatted values "$1,800", "Mississauga · 32 km" and "Free Sat 14 Nov", when the headliner renders Hosanna Collective, then the meta reads "From $1,800" and "Mississauga · 32 km" and the badge "Free Sat 14 Nov", unchanged. (L2-110)

### Performance

- **AC-33** Given the `Headliner` and `HeadlinerSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-headliner`. To meet this CRD:

- Rename `priceLine` to `priceLabel` and `price`, rendered "{priceLabel}
  {price}" in one span, matching the ticket.
- Rename `badge` to `availability` and add `booked`, which sets the badge
  variant to `booked` (badge CRD).
- Add `artVariant`, `artLabel` and `photo`, and pass them to `zm-artwork` with
  `yellow` and `priority`. Today the art has only a tag and no label, so it is
  `aria-hidden` and the headliner's image is never described.
- Make `nameId` default to a unique id from a module counter, not the fixed
  `headliner-name`.
- Make `attribution` required with `quote`, render the quote in a `<q>` (not
  literal curly quotes), and truncate it in a `computed` with the rule in
  Content. Put the truncation function in the library (`truncate-at-word.ts`)
  with its own unit tests.
- Add the mock's utility classes beside the element classes: `stack` on the
  body, `overline` on the kicker, `text-muted` on the attribution, `cluster` on
  the actions (D-3).
- Drop the duplicate `.headliner__name a` colour rule that relies on
  `components.css`; keep the encapsulated styles complete on their own.
- Add `zm-headliner-skeleton` in the same folder (`headliner-skeleton.ts`), using
  `zm-skeleton` blocks with the skeleton CRD's shapes and the two responsive row
  classes. Add its perf-test scenario `HeadlinerSkeleton.ts` and export it from
  `scenarios/index.ts`.

## Decisions

- **D-1** *Does the headliner render its own `<article>`, or is the host the article?* It renders a native `<article>` inside `zm-headliner`. An `article` element needs no role and is named by `aria-labelledby`; the skeleton, which must not be an article, carries `.headliner` on its host instead.
- **D-2** *Heading level as an input, like the ticket?* No. The headliner appears only at the top of the lineup, under the lineup's `h2`; the design system fixes it as an `h3`. The ticket needs `headingLevel` for Saved artists, which has no headliner.
- **D-3** *Mock utility classes or element classes?* Both. The mocks use `.stack`, `.overline`, `.text-muted` and `.cluster`, which keep visual parity, while the `.headliner__body`, `__kicker`, `__quote`, `__attribution` and `__actions` element classes give the page object stable hooks that do not change when a utility does.
- **D-4** *Who truncates the quote to 160 characters?* The component, with a rule that leaves strings of 160 characters or fewer alone. L2-006 makes the limit part of the card, so it must hold whatever the API sends; because the rule is idempotent, a server that already truncates is not cut twice.
- **D-5** *Literal curly quotes or a `<q>`?* A `<q>`. Literal “ ” are English punctuation hard-coded in the template; the `<q>` element draws the marks for the page's `lang` (« » in French), so L2-111's French catalogue needs no code change.
- **D-6** *What if the most recent five-star review does not exist?* No quote. L2-006 asks for the most recent five-star review; showing a lower-rated quote would misrepresent the reason for headlining, and inventing an empty slot would leave a gap in the frame.
- **D-7** *Is the `booked` state needed when the artist leaves the slot on the next search?* Yes. The design system specifies that the badge turns "Booked Sat 14 Nov" if the date fills while the page is open; a `booked` input costs one class and avoids a later API change.
- **D-8** *How tall is the skeleton?* As tall as the real headliner. The design system's skeleton (four blocks) is 576 px at 360 px against the real headliner's 934 px, and 488 against 558 px at 1280 px: the swap would push the whole lineup down. The skeleton in Markup adds the name's second line, the meta, three quote lines and the actions, with two rows shown only where the real content wraps; it is measured within 10 % at 360, 768 and 1280 px. The design-system page and the skeleton CRD's headliner row should adopt it.
- **D-9** *Where does the save toggle sit?* Projected, last in the actions row. It has its own CRD, behaviour and requests, and the same toggle appears on the ticket and the profile (ticket D-7).
- **D-10** *Is the art's tag an input or fixed "Headliner"?* An input. It is user-facing copy, so it comes from the catalogue (L2-111).
- **D-11** *What does the button do with a long group name?* It wraps. The content rule asks for the full name of a group ("See Grace Tabernacle Mass Choir's profile"), and the 320 px rendering shows it cannot fit on one line; truncating would hide whose profile it opens, and shortening to a first name does not work for a group. The button grows taller and stays a single target.
