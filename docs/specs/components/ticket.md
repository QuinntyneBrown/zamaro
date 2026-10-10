# Ticket card

| Field | Value |
|---|---|
| Selector | `zm-ticket`, `zm-ticket-skeleton` |
| Library path | `frontend/projects/components/src/lib/ticket/` |
| Status | built |
| Traces to | L2-006, L2-007, L2-021, L2-027, L2-086, L2-088, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`ticket.html`](../../design-system/components/ticket.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/saved/loading`](../../mocks/pages/saved/loading.html), [`pages/not-found/artist`](../../mocks/pages/not-found/artist.html) |
| Rendering | [`ticket.html`](ticket.html) |

## Purpose and scope

The ticket card shows one artist in a list of results as an admission ticket:
halftone art (or the primary photo) on the left, the kicker, name and meta in
the middle, and a perforated stub with the "From" price and a save toggle. The
whole ticket opens the artist's profile; the save toggle saves the artist
without leaving the list.

`zm-ticket-skeleton` is the same shape filled with skeletons, for lists that are
still loading.

Use something else when:

- it is the featured artist at the top of Discover → [headliner](headliner.md);
- it is not an artist (a booking request, a church) → [card](card.md);
- it is a single date on a profile → [tour dates](tour-dates.md).

Out of scope:

- The list around the tickets: the `.lineup` grid, its `role="list"` and its
  label, numbering, ordering (L2-007) and headliner selection (L2-006). The page
  owns the `<ol class="lineup">` and each `<li>`.
- The save toggle's behaviour (saving, undo toast, sign-in redirect). The
  [save toggle](save-toggle.md) owns it; the ticket gives it a place in the stub.
- The availability badge and the Request button on Saved artists. The page
  projects them into the actions slot.
- Formatting distances, prices and dates. The page passes formatted strings.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` lineup | kicker "No. 02" + rating, name as `h3`, act and place lines, "From $950", art solo or group, tilt varies | save toggle in the stub | default, hover, focus, saved / unsaved toggle | canvas |
| `pages/discover/default` lineup, an artist with no reviews | kicker "No. 05" + "New" | save toggle | default | canvas |
| `pages/discover/loading` | `zm-ticket-skeleton` × 4 in an `aria-hidden` list | — | loading | canvas |
| `pages/saved/default` | kicker "Saved Wed 7 Oct", no rating, name as `h2` | save toggle (pressed); actions: badge "Free Sat 14 Nov" + sm button "Request" | default, saved | canvas |
| `pages/saved/default`, artist booked on the date | as above, `booked`; actions: badge "Booked Sun 15 Nov", no Request | save toggle | booked | canvas |
| `pages/saved/loading` | `zm-ticket-skeleton` × 3 | — | loading | canvas |
| `pages/not-found/artist` similar artists | kicker "No. 01" + rating, `h3`, up to 3 tickets | save toggle | default | canvas |
| Design system, matched styles | as Discover, plus tags slot with static chips ("Hymns") | chips | default | surface (`--zm-ticket-notch-bg` set to the surface) |
| Dialogs and notifications that show a page behind them (`dialogs/menu`, `notifications/saved-toast`…) | as Discover | as Discover | inert behind the dialog | canvas |

## Anatomy

1. **Art** — `.ticket__art`: always a `zm-artwork`, which shows the halftone
   placeholder or, when there is one, the primary photo inside its frame. Left column, full height, 6.5 rem wide (9 rem from
   SM), ruled off on the right.
2. **Body** — `.ticket__body`: the middle column.
3. **Kicker** — `.ticket__no`: mono overline, muted. "No. 02 · ★ 4.6 · 17
   churches", "No. 05 · New" or "Saved Wed 7 Oct".
4. **Name** — `.ticket__name`: an `h2` or `h3` in `--text-h3`, uppercase. Its
   link's `::after` stretches over the whole ticket.
5. **Meta** — `.ticket__meta`: two lines, the act line and the place line.
6. **Tags (optional)** — `.ticket__tags`: static chips that explain a match.
7. **Actions (optional)** — `.ticket__actions`: badges and small buttons,
   raised above the stretched link.
8. **Stub** — `.ticket__stub`: the price and the save toggle, behind a 2 px
   dashed perforation with two half-circle notches.
9. **Price** — `.ticket__price`: "From" as an overline over the amount in
   `--text-figure`.
10. **Frame** — the host: paper surface, 2 px `--ticket-border`. Hover and
    focus lift it and tilt it −0.4° over `--shadow-2`.

Host: `zm-ticket` is the card itself. It carries `.ticket` (and `.ticket--booked`
or `.ticket--loading`), it is the grid, and it sits inside the page's `<li>`. It
never renders the `<li>`, so the page owns list semantics.

## API

### `zm-ticket` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | "No. 02" or "Saved Wed 7 Oct". |
| `rating` | `number \| null \| undefined` | `undefined` | no | `undefined`: no rating segment. `null`: the `newText` ("New"). A number: "★ 4.6 · {ratingCount}". Rendered by `zm-rating`, after " · ". |
| `ratingLabel` | `string` | `''` | when `rating` is not `undefined` | The rating's accessible name: "Rated 4.6 out of 5 by 17 churches", or "No reviews yet". |
| `ratingCount` | `string` | `''` | when `rating` is a number | "17 churches". |
| `ratingNew` | `string` | `''` | when `rating` is `null` | "New". |
| `name` | `string` | — | yes | The artist's own spelling. The link text. |
| `headingLevel` | `2 \| 3` | `3` | no | The name's heading level: 2 on Saved artists, 3 under a section heading. |
| `link` | `string \| unknown[]` | — | yes | `routerLink` to the profile, `/artists/{slug}`. |
| `queryParams` | `Record<string, string>` | `{}` | no | The carried-forward search date: `{ date: '2026-11-14' }`. |
| `actLine` | `string` | — | yes | "Band · Acoustic, Hymns". |
| `placeLine` | `string` | — | yes | "Hamilton · 14 km from you". |
| `priceLabel` | `string` | — | yes | "From". |
| `price` | `string` | — | yes | "$950". |
| `artVariant` | `'solo' \| 'group'` | `'solo'` | no | The artwork silhouette. |
| `artTilt` | `boolean` | `false` | no | `.art--tilt`, to tell neighbouring placeholders apart. |
| `artYellow` | `boolean` | `false` | no | `.art--yellow`. |
| `artLabel` | `string` | — | yes | Describes the artist's art or photo: "Marcus Bell Trio, piano, upright bass and drums, under warm stage lights". |
| `photo` | `ArtworkPhoto \| null` (artwork CRD) | `null` | no | The primary photo, passed straight to `zm-artwork`'s `photo`. The artwork renders it inside `.art` with the print treatment. |
| `artPriority` | `boolean` | `false` | no | Passed to `zm-artwork`'s `priority`: set it for tickets the page knows are above the fold, so the photo loads eagerly. |
| `booked` | `boolean` | `false` | no | Adds `.ticket--booked`. The page also projects a "Booked {date}" badge. |

### `zm-ticket-skeleton` inputs

None. It renders the loading shape with no content.

### Outputs

None. Navigation is the name link; saving belongs to the projected save toggle.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | one `zm-save-toggle` | Rendered in the stub after the price, raised to `--z-raised`. |
| `[slot=actions]` | `zm-badge`, `zm-button` or `zm-button-link` with `size="sm"` | Rendered in `.ticket__actions` under the meta, raised to `--z-raised`. Hidden when empty. |
| `[slot=tags]` | static `zm-chip`s | Rendered in `.ticket__tags` under the meta. Hidden when empty. |

Each slot is declared once in the template. Its wrapper always renders and is
hidden with `:empty`, so no `@if` is needed around a slot.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | — | An artist in the lineup, Saved artists or similar artists. |
| Booked | `.ticket--booked` | An artist who is not free on the chosen date: quiet frame, muted name and price. |
| Loading | `.ticket--loading` (`zm-ticket-skeleton`) | A list that is still loading. |

The ticket has one size. Its width comes from the lineup grid; the art and stub
columns change at SM (see Responsive behaviour).

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper surface, `--ticket-border` frame | List item with a heading and a link |
| Hover | `:host(:hover)` | Lifts by `--transform-lift` and rotates −0.4° over `--shadow-2` | — |
| Focus | `:host(:focus-within)` | The name link shows the two-tone ring; the ticket lifts as on hover. The save toggle and actions show their own rings. | — |
| Saved | the projected toggle's `aria-pressed="true"` | Yellow toggle, filled heart (save toggle) | "Remove {name} from your saved artists, toggle button, pressed" |
| Saving | the projected toggle's `aria-busy="true"` | The heart pulses (save toggle) | Busy |
| Booked | `booked = true` | Frame `--color-border-default`, name and price `--color-fg-muted` | The "Booked Sun 15 Nov" badge text carries the meaning |
| Loading | `zm-ticket-skeleton` | Same grid; skeleton blocks for art, kicker, name, meta, price and toggle; no lift on hover | The page hides the list (`aria-hidden="true"`) and sets `aria-busy` on the region |
| No reviews | `rating = null` | Kicker "No. 05 · New" | "New" is read with the `ratingLabel` |
| No rating segment | `rating = undefined` | Kicker only: "Saved Wed 7 Oct" | — |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

## Markup

Rendered by `zm-ticket` inside the page's list item:

```html
<li>
  <zm-ticket class="ticket">
    <zm-artwork class="ticket__art art art--group" role="img" aria-label="Marcus Bell Trio, piano, upright bass and drums, under warm stage lights"></zm-artwork>
    <div class="ticket__body">
      <span class="ticket__no">No. 02 · <zm-rating><span role="img" aria-label="Rated 4.6 out of 5 by 17 churches">★ 4.6 · 17 churches</span></zm-rating></span>
      <h3 class="ticket__name"><a href="/artists/marcus-bell-trio?date=2026-11-14">Marcus Bell Trio</a></h3>
      <p class="ticket__meta">Band · Acoustic, Hymns<br>Hamilton · 14 km from you</p>
      <div class="ticket__tags"></div>
      <div class="ticket__actions"></div>
    </div>
    <div class="ticket__stub">
      <p class="ticket__price"><small>From</small>$950</p>
      <zm-save-toggle>…<button class="save" type="button" aria-pressed="false" aria-label="Save Marcus Bell Trio to your saved artists">…</button></zm-save-toggle>
    </div>
  </zm-ticket>
</li>
```

With a photo, the artwork renders it inside its frame (artwork CRD); the host
keeps `.ticket__art`:

```html
<zm-artwork class="ticket__art art">
  <img src="…/abigail-mensah-800.webp" srcset="…" sizes="(min-width: 36rem) 9rem, 6.5rem" width="800" height="1000" alt="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone" loading="lazy" decoding="async">
</zm-artwork>
```

Saved artists, booked, with actions:

```html
<zm-ticket class="ticket ticket--booked">
  …<span class="ticket__no">Saved Wed 7 Oct</span>
  <h2 class="ticket__name"><a href="/artists/abigail-mensah?date=2026-11-15">Abigail Mensah</a></h2>
  <p class="ticket__meta">Solo vocalist · Hymns<br>Brampton · 44 km from you</p>
  <div class="ticket__actions"><zm-badge><span class="badge badge--booked">Booked Sun 15 Nov</span></zm-badge></div>
  …
</zm-ticket>
```

Loading:

```html
<zm-ticket-skeleton class="ticket ticket--loading" aria-hidden="true">
  <span class="skeleton ticket__art"></span>
  <div class="ticket__body"><span class="skeleton skeleton--text skeleton--short"></span><span class="skeleton skeleton--title"></span><span class="skeleton skeleton--text"></span></div>
  <div class="ticket__stub"><span class="skeleton skeleton--figure"></span><span class="skeleton skeleton--target"></span></div>
</zm-ticket-skeleton>
```

Consumer templates:

```html
<ol class="lineup" role="list" [attr.aria-label]="lineupLabel()">
  @for (artist of tickets(); track artist.slug; let i = $index) {
    <li>
      <zm-ticket [kicker]="artist.number" [rating]="artist.rating" [ratingLabel]="artist.ratingLabel" [ratingCount]="artist.ratingCount" [ratingNew]="'lineup.new' | transloco"
        [name]="artist.name" [link]="['/artists', artist.slug]" [queryParams]="{ date: searchDate() }"
        [actLine]="artist.actLine" [placeLine]="artist.placeLine" [priceLabel]="'lineup.from' | transloco" [price]="artist.price"
        [artVariant]="artist.artVariant" [artTilt]="i % 3 === 2" [artLabel]="artist.artLabel" [photo]="artist.photo">
        <zm-save-toggle [artistName]="artist.name" [saved]="artist.saved" (savedChange)="toggleSave(artist)" />
      </zm-ticket>
    </li>
  }
</ol>
```

```html
<zm-ticket [kicker]="saved.savedOn" [name]="saved.name" [headingLevel]="2" [booked]="saved.booked" …>
  <zm-badge slot="actions" [variant]="saved.booked ? 'booked' : 'free'">{{ saved.availability }}</zm-badge>
  @if (!saved.booked) {
    <zm-button-link slot="actions" size="sm" link="/book" [label]="saved.requestLabel">{{ 'saved.request' | transloco }}</zm-button-link>
  }
  <zm-save-toggle … />
</zm-ticket>
```

The `.ticket*` classes, the heading and the single link are a contract: the e2e
page objects find a ticket by its heading and read the kicker, meta and price by
class.

## Design

- Grid: XS columns `6.5rem minmax(0, 1fr)` with areas `art body` / `stub stub`;
  from SM `9rem minmax(0, 1fr) 10.5rem` with areas `art body stub`.
- Body: padding `--space-5`, vertical gap `--space-3`, `min-width: 0` so long
  names wrap.
- Kicker `--text-overline`, `--letter-spacing-stamp`, `--color-fg-muted`.
- Name `--text-h3`, uppercase, link inherits colour with no underline, and its
  hover has no background.
- Meta `--text-body-sm`, `--color-fg-muted`.
- Stub: padding `--space-4` `--space-5`, gap `--space-3`, `--text-stub`,
  uppercase. Perforation `--border-width-thick` dashed `--ticket-border`: on
  top at XS, on the left from SM.
- Notches: radius `--notch` (1 rem); fill `--ticket-notch-bg`; outline
  `--border-width-thick` in `--ticket-border`. At XS they sit on the left and
  right ends of the perforation; from SM, at its top and bottom.
- Price `--text-figure`; its "From" `--text-overline`, on its own line.
- Frame `--border-width-thick` solid `--ticket-border` on `--color-bg-surface`.
- Hover and focus-within: `transform: var(--transform-lift) rotate(-0.4deg)`,
  `box-shadow: var(--shadow-2)`, transitions `--duration-base` with
  `--ease-standard`.
- Layers: the stretched link covers the ticket; the save toggle, tags and
  actions sit above it at `--z-raised`.

Component tokens declared on the host:

| Token | Aliases | Overridden by |
|---|---|---|
| `--ticket-border` | `--color-border-strong` | `.ticket--booked` → `--color-border-default` |
| `--ticket-notch-bg` | `--zm-ticket-notch-bg`, falling back to `--color-bg-canvas` | the consumer, through `--zm-ticket-notch-bg` |
| `--notch` | 1 rem | — |

`--zm-ticket-notch-bg` is the one public knob. A consumer that places tickets on
a surface, in a dialog or on the stage sets it to that background
(`style="--zm-ticket-notch-bg: var(--color-bg-surface)"`), so the notches look
cut out.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Ticket surface | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Frame, perforation, notch outline | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Booked frame | `--color-border-default` | per theme | per theme |
| Notch fill (default) | `--color-bg-canvas` | per theme | per theme |
| Name, price | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Kicker, meta, booked name and price | `--color-fg-muted` | per theme | per theme |
| Hover shadow | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Name and price |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Kicker, meta, booked name and price |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Frame and perforation |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Frame against the page |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on the name |

The booked frame (`--color-border-default`) is deliberately quiet and is exempt
as a non-essential edge: the badge text carries the meaning, and the muted name
still passes 4.5:1.

## Responsive behaviour

- **XS (< 576 px)**: two columns, art 6.5 rem and body. The stub runs across the
  bottom, price on the left and toggle on the right, with a horizontal
  perforation and notches at its left and right ends (L2-097).
- **SM and up (≥ 576 px)**: three columns, art 9 rem, body and stub 10.5 rem. The
  perforation turns vertical and the notches move to the top and bottom; the
  price sits above the toggle (L2-097).
- **LG and up (≥ 992 px)**: the page's lineup shows two tickets per row; the
  ticket itself does not change (L2-097).
- Names wrap and never truncate: "Grace Tabernacle Mass Choir" takes two lines at
  360 px. A single word wider than the name column breaks inside the word
  (`overflow-wrap: anywhere`); at 320 px "TABERNACLE" does. Meta lines wrap too.
- At 320 px nothing overflows the ticket or the page. At 200 % zoom the body
  grows taller and every part stays reachable.
- The save toggle is 44 px with at least `--space-3` around it, so a tap beside
  it never opens the profile.

## Accessibility

### Role and pattern

The page renders each ticket inside an `<li>` of an `<ol class="lineup"
role="list">` labelled with the date ("More artists free Saturday 14 November
2026"). `zm-ticket` is a group of a heading, a link, text and controls. It has
no role of its own and is never wrapped in an `<a>`. A button inside a link is
invalid and unreachable.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the ticket's focusable parts in order: the name link, any action buttons, then the save toggle. |
| <kbd>Enter</kbd> | On the name: opens the profile with the search date. On a toggle or button: activates it. |
| <kbd>Space</kbd> | On the toggle or a button: activates it. |

### Focus

The ring is drawn around the name link (`:focus-visible`), and `:focus-within`
lifts the whole ticket, so keyboard users get the same response as pointer
users. The ring is never clipped by the ticket: the host does not set
`overflow: hidden`.

### Labelling

- The link text is the artist's name, so a screen-reader list of links reads as
  a list of names.
- The art is `role="img"` with `artLabel` (the photo's `alt` when there is a
  photo).
- The rating is one image named "Rated 4.6 out of 5 by 17 churches", never star
  characters (L2-102).
- The price reads "From $950".
- The save toggle is named after the artist (save toggle CRD).
- The booked state is badge text, not just muted colour.

### Announcements

None from the ticket. The page announces the search result count through its
status region.

### Motion

The lift and tilt take `--duration-base`. Under `prefers-reduced-motion:
reduce` the duration drops to near zero, so the ticket changes position without
animating. Skeletons stop shimmering (skeleton CRD).

## Content and internationalisation

- **Kicker**: "No. {nn}", two digits, from "No. 02" in the lineup and "No. 01"
  in similar artists, then " · " and the rating. Saved artists: "Saved {short
  date}" ("Saved Wed 7 Oct"), with no rating. With no reviews: "No. 05 · New"
  (L2-006).
- **Name**: the artist's own spelling, "&" for duos ("Daniel & Ruth Okonkwo").
- **Act line**: the act type written as its style name, then the other styles:
  "Band · Acoustic, Hymns", "Solo vocalist · Hymns", "Gospel choir" (L2-006).
- **Place line**: base city, then distance: "Hamilton · 14 km from you".
  Estimates read "about 81 km from you"; under 1 km reads "Under 1 km from you".
- **Price**: "From" plus the lowest rate, no cents for whole dollars: "$2,400"
  (L2-110).
- **Booked**: say when: "Booked Sun 15 Nov", not "Unavailable" (L2-027).
- Data values: name, places, rating numbers and price come from the API, already
  formatted by the API library's formatting service. Copy values ("From",
  "New", "from you", the rating label pattern) come from the translation
  catalogue through the page (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs. The only computed values are the
  heading tag and the art choice. No subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Ticket.ts`
  renders Marcus Bell Trio ("No. 02", ★ 4.6 · 17 churches, "Band · Acoustic,
  Hymns", "Hamilton · 14 km from you", "From $950", group art) in an
  `<ol role="list"><li>`.
- Add `TicketSkeleton.ts`, which renders one `zm-ticket-skeleton`.
- Composite scenario: `Lineup.ts` renders 24 tickets, the "artist ticket in the
  Discover results" composite. Both are tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Layout stability: the skeleton has the same grid, columns and stub as the
  final ticket, so swapping skeletons for tickets shifts nothing (L2-105). A
  photo has explicit `width` and `height` and keeps the art column's size.
- Images: the primary photo uses `srcset` in AVIF or WebP from the CDN. It is
  lazy-loaded unless the page marks it above the fold (L2-088).
- Imports: `RouterLink`, `zm-artwork` (which owns the photo), `zm-rating`. Nothing else; badges,
  buttons, chips and the save toggle arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given Marcus Bell Trio's ticket (`kicker` "No. 02", rating 4.6 by 17 churches, act line "Band · Acoustic, Hymns", place line "Hamilton · 14 km from you", price "$950"), when it renders, then it shows "No. 02 · ★ 4.6 · 17 churches", "Marcus Bell Trio", both meta lines and "From $950". (L2-006)
- **AC-2** Given an artist with no reviews, when the ticket renders with `rating` null and `ratingNew` "New", then the kicker reads "No. 05 · New". (L2-006)
- **AC-3** Given a ticket on Saved artists with `kicker` "Saved Wed 7 Oct" and no `rating`, when it renders, then the kicker reads "Saved Wed 7 Oct" and shows no rating segment. (L2-027)
- **AC-4** Given a ticket linked to `/artists/marcus-bell-trio` with `queryParams` `{ date: '2026-11-14' }`, when the booker activates anywhere on the ticket outside the save toggle and actions, then they navigate to `/artists/marcus-bell-trio?date=2026-11-14`. (L2-006)
- **AC-5** Given a projected save toggle, when the booker activates it, then the profile does not open and only the toggle's action runs. (L2-006)
- **AC-6** Given Saved artists with actions "Free Sat 14 Nov" and a "Request" button, when the ticket renders, then the badge and button sit in `.ticket__actions` under the meta, and activating "Request" does not open the profile. (L2-027)
- **AC-7** Given `booked` with a projected "Booked Sun 15 Nov" badge, when the ticket renders, then it has `.ticket--booked`, the frame uses `--color-border-default`, the name and price use `--color-fg-muted`, and the badge text is visible. (L2-027)
- **AC-8** Given no content in the tags or actions slots, when the ticket renders, then neither wrapper takes up space in the body. (L2-006)
- **AC-9** Given `headingLevel` 2, when the ticket renders, then the name is an `h2`; with the default, it is an `h3`. (L2-102)
- **AC-10** Given the lineup re-sorted from Closest first to Price, low to high, when the tickets re-render with new kickers, then each ticket shows its new number from "No. 02" and keeps its own name, meta and price. (L2-007)
- **AC-11** Given the not-found page with three similar artists, when it renders, then each is a ticket numbered from "No. 01" with a save toggle. (L2-021)
- **AC-12** Given a `photo` for Abigail Mensah, when the ticket renders, then the `.ticket__art` artwork contains an `<img>` with `srcset`, `sizes`, explicit `width` and `height`, `loading="lazy"` and the `artLabel` as `alt`; without a photo, it shows the halftone placeholder. (L2-088)

### States

- **AC-13** Given a pointer over a ticket, when it hovers, then the ticket lifts by `--transform-lift`, rotates −0.4° and shows `--shadow-2`. (L2-006)
- **AC-14** Given `zm-ticket-skeleton`, when it renders in place of a ticket, then it has the same columns, stub and height as a ticket with two meta lines, contains only skeleton blocks, and does not lift on hover. (L2-105)
- **AC-15** Given four skeletons replaced by four tickets on Discover, when the swap is measured, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Keyboard and focus

- **AC-16** Given keyboard focus on the name link, when it is focused, then the link shows the two-tone focus ring and the whole ticket lifts as on hover. (L2-101)
- **AC-17** Given a Saved ticket with a "Request" button and a save toggle, when the booker tabs through it, then focus moves to the name, then "Request", then the toggle, and each shows its own ring. (L2-101)

### Screen readers

- **AC-18** Given Marcus Bell Trio's ticket, when it is read by a screen reader, then the rating is announced as "Rated 4.6 out of 5 by 17 churches", not as star characters. (L2-102)
- **AC-19** Given a ticket, when the page's links are listed by a screen reader, then the ticket contributes exactly one link, named "Marcus Bell Trio". (L2-102)
- **AC-20** Given the art, when it is read by a screen reader, then it is an image named by `artLabel` ("Marcus Bell Trio, piano, upright bass and drums, under warm stage lights"). (L2-100)
- **AC-21** Given a lineup of tickets in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-22** Given the dark theme, when a ticket renders, then it is a `--color-bg-surface` charcoal with a `--color-border-strong` frame, and its hover shadow is `--color-shadow` (yellow). (L2-104)
- **AC-23** Given tickets inside a paper surface with `--zm-ticket-notch-bg` set to `--color-bg-surface`, when they render, then the notches are filled with the surface colour. (L2-104)
- **AC-24** Given both themes, when contrast is measured, then name and price on the ticket are at least 4.5:1, kicker and meta at least 4.5:1, and the frame at least 3:1 against both the ticket and the page. (L2-103)

### Responsive

- **AC-25** Given an XS viewport (360 px), when a ticket renders, then the stub sits beneath the body across the full width, price left and toggle right, with a horizontal perforation. (L2-097)
- **AC-26** Given SM and MD viewports, when a ticket renders, then the stub sits to the right of the body in a 10.5 rem column with a vertical perforation. (L2-097)
- **AC-27** Given a 320 px viewport and "Grace Tabernacle Mass Choir", when the ticket renders, then the name wraps at word boundaries, a single word wider than the column ("TABERNACLE") breaks inside the word rather than overflowing, nothing is clipped or truncated, and the page does not scroll horizontally. (L2-096)
- **AC-28** Given a touch device, when the save toggle on a ticket is measured, then its target is at least 44 × 44 CSS px and does not overlap the name link's text. (L2-096)
- **AC-29** Given the French catalogue, when "From" and "from you" are about 30 % longer, then the stub and meta wrap within the ticket without clipping. (L2-111)

### Motion

- **AC-30** Given `prefers-reduced-motion: reduce`, when a ticket is hovered or focused, then it moves to its lifted position without a transition. (L2-103)

### Formatting

- **AC-31** Given a price of 1800 dollars passed formatted, when the ticket renders, then the stub reads "From $1,800" with no cents. (L2-110)

### Performance

- **AC-32** Given the `Ticket`, `TicketSkeleton` and `Lineup` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-ticket`. To meet this CRD:

- Rename `positionLabel` to `kicker`.
- Make `rating` and `ratingLabel` optional, with `undefined` meaning no rating
  segment (AC-3).
- Add `headingLevel`. Render the name with one `@switch` on 2 and 3; the link
  sits inside each branch and holds no `ng-content`.
- Add `artTilt`, `artYellow`, `artLabel`, `photo` and `artPriority`, and pass
  them to `zm-artwork` (`tilt`, `yellow`, `label`, `photo`, `priority`).
  Today the art renders `aria-hidden` because it has no `label`.
- Add `booked`, bound to `[class.ticket--booked]` on the host, with the
  `--ticket-border` and muted-colour overrides.
- Add the `[slot=actions]` and `[slot=tags]` wrappers with `:empty { display:
  none }`, raised to `--z-raised`. Raise the default stub slot too.
- Add the host class `ticket` so the e2e class contract holds.
- Read `--ticket-notch-bg` from `var(--zm-ticket-notch-bg, var(--color-bg-canvas))`.
- Add `zm-ticket-skeleton` in the same folder (`ticket-skeleton.ts`), using
  `zm-skeleton` blocks with the skeleton CRD's modifiers. Add its perf-test
  scenario `TicketSkeleton.ts` and export it from `scenarios/index.ts`.
- Add `overflow-wrap: anywhere` to `.ticket__name` (D-8).
- Turn off the lift on `.ticket--loading`, and make sure no `overflow: hidden`
  clips the focus ring.

## Decisions

- **D-1** *Does the ticket render its own `<li>`?* No. The page owns the list (`<ol>` or `<ul>`, label, `aria-hidden` while loading). The design-system markup puts `.ticket` on the `<li>`; in Angular the host carries `.ticket` inside a plain `<li>`. That keeps list semantics in one place and lets the skeleton list be `aria-hidden` as a whole.
- **D-2** *Where does the "Booked {date}" badge go?* In the actions slot, under the meta, as on Saved artists. The design-system specimen put it in place of the place line, but L2-027 needs both the place and the availability, and one slot for availability on every page keeps the API single-shaped.
- **D-3** *Kicker as one string, or number plus rating?* One `kicker` string plus an optional rating. Saved artists' "Saved Wed 7 Oct" has no number, and a free-text kicker serves both without a second variant.
- **D-4** *Photo or artwork?* Both, through one element. The design system specifies "halftone placeholder or photo" with the photo inside `.art`, where its print treatment lives (artwork CRD D-1). The ticket passes `photo` to `zm-artwork` rather than rendering its own `<img>`. Shipping the `photo` input now avoids an API change when artist photos reach the lineup, and L2-088 sets its rules.
- **D-5** *A loading input on `zm-ticket`, or a separate component?* A separate `zm-ticket-skeleton`. A loading ticket has no data, and making every content input optional just for loading would weaken the API for the common case.
- **D-6** *How does a consumer fit the notches to a surface?* Through `--zm-ticket-notch-bg`, which follows AGENTS.md's `--zm-` rule for component knobs. The internal `--ticket-notch-bg` keeps its design-system name.
- **D-7** *Is the save toggle part of the ticket?* No, it is projected. It has its own CRD, behaviour and requests, and the same toggle appears on the headliner and the profile.
- **D-8** *What happens when one word is wider than the name column?* It breaks inside the word (`overflow-wrap: anywhere` on `.ticket__name`). The 320 px rendering shows "TABERNACLE" in uppercase `--text-h3` does not fit the 296 px column. Shrinking the type would break the design-system scale, and truncating is forbidden, so breaking the word is the remaining option that keeps L2-096.
