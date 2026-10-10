# Skeleton

| Field | Value |
|---|---|
| Selector | `zm-skeleton` |
| Library path | `frontend/projects/components/src/lib/skeleton/` |
| Status | built |
| Traces to | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105 |
| Design system | [`skeleton.html`](../../design-system/components/skeleton.html) |
| Source mocks | [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/saved/loading`](../../mocks/pages/saved/loading.html), [`pages/bookings/loading`](../../mocks/pages/bookings/loading.html), [`pages/availability/loading`](../../mocks/pages/availability/loading.html), [`pages/book/loading`](../../mocks/pages/book/loading.html), [`pages/mfa-setup/loading`](../../mocks/pages/mfa-setup/loading.html), and every other `loading` state (see Usage) |
| Rendering | [`skeleton.html`](skeleton.html) |

## Purpose and scope

A skeleton is a blank print block in the shape of what is coming: a line of
copy, a heading, a price, a field, the poster headline, the song strip. Pages
and composite components lay skeletons out exactly where the loaded content
will land, so the swap moves nothing (L2-105). `zm-skeleton` is the one block;
everything a loading screen looks like comes from composing it inside the real
layout (a `.ticket`, a `.stub`, an `.artist-poster`, a `.booking-list` row).

Use something else when:

- an action is in progress (sending a request, saving) → a busy [button](button.md)
  or a [spinner](spinner.md);
- content already on screen is refreshing → keep it and show a [spinner](spinner.md);
- loading failed → an [alert](alert.md); it returned nothing → an [empty state](empty-state.md).

Out of scope:

- The loading region: `aria-busy="true"` on the section or `<main>`, the
  `aria-hidden="true"` container around the skeletons, and the one
  `role="status"` line that announces the wait ("Finding who’s free on
  Saturday 14 November 2026…"). The page owns them, because the status sits in
  a different place on every page (a lead paragraph, a visually hidden
  paragraph, the page-head subtitle).
- When to show skeletons (after 300 ms, L2-105), the 8-second "Still checking —
  thanks for waiting." status, and how many items to show (two tickets on
  phones, four on desktop). The page decides.
- Composite skeletons. `zm-ticket-skeleton` belongs to the [ticket](ticket.md);
  the headliner, booking stub, artist poster, booking-list row and calendar day
  skeletons belong to [headliner](headliner.md), [booking form](booking-form.md),
  the profile header, [booking list](booking-list.md) and
  [calendar](calendar.md). Each composes `zm-skeleton` with the shapes below.
- Disabling the filter chips above a loading lineup. The [chip](chip.md) owns
  its disabled state.

## Usage

The mocks render about 600 skeleton blocks across 27 loading screens. Each row
is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Every list and detail page (`pages/account`, `pages/admin-*`, `pages/dashboard`, `pages/requests`, `pages/earnings`…) | `text` with `short`, `medium`, `long` or `full`; `text` default width | — | loading | canvas, card |
| Section and card titles on most loading pages | `title` with no width, `short`, `medium` or `long` | — | loading | canvas, card |
| `pages/discover/loading`, `pages/saved/loading` ticket art | `none` + parent class `ticket__art` (the ticket's grid cell sizes it) | — | loading | ticket surface |
| `pages/discover/loading`, `pages/saved/loading` ticket stub | `title` + `short`, `title` + `price`, `figure`; `target` in place of the save toggle | — | loading | ticket surface |
| `pages/saved/loading`, `pages/booking-detail/loading` actions | `control-sm` with `short`, `medium` or `long` | — | loading | ticket surface, card |
| Forms while loading (`pages/account`, `pages/book`, `pages/edit-profile`, `pages/reset-password`, `pages/accept-terms`, `pages/admin-application`…) | `control`, `control` + `short` or `medium`, `control-lg`, `block` | — | loading | card, stub |
| `pages/artist/loading`, `pages/profile-preview/loading` booking stub | `title`, `figure`, `control` × 2, `block`, `control-lg` | — | loading | stub surface |
| `pages/discover/loading` headliner; `pages/artist/loading` poster | `portrait`; `text` + `short`; `poster`; `poster` + `medium` | — | loading | canvas (headliner), stage (poster) |
| `pages/book/loading`, `pages/booking-detail/loading`, `pages/request-detail/loading` page head | `text` + `medium`, `poster`, `poster` + `long` | — | loading | stage |
| `pages/artist/loading`, `pages/profile-preview/loading` song strip | `strip`, full bleed under the poster | — | loading | canvas, between stage and content |
| Videos (`pages/artist`, `pages/edit-profile`, `pages/profile-preview`) | `wide` (16:9) | — | loading | canvas, card |
| Reviews and ratings (`pages/artist`, `pages/artist-reviews`, `pages/admin-reviews`) | `figure`; `control` + `short`; `block` | — | loading | card |
| `pages/availability/loading` calendar cells | `text` + `day` × 30 | — | loading | calendar surface |
| `pages/bookings/loading` booking-list rows | `date`, `title` + `medium`, `text` + `long`, `amount`, `stamp`, each with the row's element class (`booking-list__date`…) | — | loading | card |
| `pages/dashboard`, `pages/requests`, `pages/earnings` rows | `badge` | — | loading | card |
| `pages/book/loading` request summary; `pages/mfa-setup/loading` QR code | `thumb`; `thumb-lg` | — | loading | card |
| One-off placeholders (`pages/book`, `pages/booking-detail`, `pages/edit-profile`, `pages/request-detail`: message bubbles, a document preview, a 12 px divider) | `none` or `short`, height set on the host with one spacing token (`--space-3` to `--space-32`) | — | loading | card |
| Page-head subtitles inside the status line (`pages/admin-applications`, `pages/dashboard`, `pages/availability`…) | `text` + `medium` or `long`, inside a `<p role="status">` next to the visually hidden status text | — | loading | canvas |
| `pages/bookings/loading` page-head subtitle | `text` + `medium`, `inline`, inside a sentence-level `<p>` | — | loading | canvas |
| Design system only | `circle` (avatar) | — | loading | canvas |
| Dark theme on every loading screen | as above | — | loading, reduced motion | dark canvas, dark card, stage |

## Anatomy

1. **Block** — the host, `.skeleton`, plus one shape modifier
   (`.skeleton--{shape}`) and at most one width modifier (`.skeleton--{width}`).
   A flat `--color-bg-subtle` fill with square corners (a circle is the one
   exception).
2. **Sweep** — the block's background: a band of `--color-bg-subtle-hover`
   centred in a 300 %-wide gradient that slides across once per
   `--duration-deliberate`. Generated by CSS, not markup.

Host: `zm-skeleton` is the block itself. It carries the `.skeleton` classes and
`aria-hidden="true"`, is `display: block` (`inline-block` with `inline`), and
renders no children. Classes a consumer puts on the host (`ticket__art`,
`booking-list__date`) stay on the host next to the component's own classes.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `shape` | `'text' \| 'title' \| 'figure' \| 'poster' \| 'control' \| 'control-sm' \| 'control-lg' \| 'target' \| 'circle' \| 'block' \| 'portrait' \| 'wide' \| 'strip' \| 'date' \| 'amount' \| 'stamp' \| 'badge' \| 'thumb' \| 'thumb-lg' \| 'none'` | `'text'` | no | Adds `.skeleton--{shape}`. `'none'` adds no shape modifier: the block is at least 1 rem tall and the consumer's class or one height token sizes it. |
| `width` | `'short' \| 'medium' \| 'long' \| 'full' \| 'day' \| 'price' \| undefined` | `undefined` | no | Adds `.skeleton--{width}`. `undefined` keeps the shape's default width. |
| `inline` | `boolean` (attribute) | `false` | no | Adds `.skeleton--inline`: `display: inline-block`, `vertical-align: middle`, for a placeholder inside a sentence-level `<p>`. |

- Inputs are signal inputs; `inline` uses `booleanAttribute`.
- A one-off size is set on the host with one spacing or control token:
  `<zm-skeleton shape="none" style="height: var(--space-24)" />`. A size used
  more than once becomes a shape here first (design system, Code); a raw rem
  value is never set inline.

### Outputs

None. A skeleton is inert.

### Content slots

None. The component declares no `ng-content`, so anything projected is
dropped. A skeleton never carries text or a label.

## Variants and sizes

Shapes stand in for kinds of content. Pick the shape of what will load.

| Shape | Modifier | Height | Default width | Use for |
|---|---|---|---|---|
| Text | `.skeleton--text` | 1 rem (16 px) | 70 % | A line of body copy, a kicker, a meta line |
| Title | `.skeleton--title` | 1.75 rem (28 px) | 55 % | An h2–h4 line, a price in a ticket stub |
| Figure | `.skeleton--figure` | 2.5 rem (40 px) | 50 % | A big number: the stub price, a rating score |
| Poster | `.skeleton--poster` | `clamp(3.5rem, 12vw, 8rem)` | 80 % | A line of the poster headline or the artist's name |
| Control | `.skeleton--control` | `--control-height-md` | 100 % | A text field, select or medium button |
| Small control | `.skeleton--control-sm` | `--control-height-sm` | 100 % | A small button or a row of small controls |
| Large control | `.skeleton--control-lg` | `--control-height-lg` | 100 % | A large button (the stub submit) |
| Target | `.skeleton--target` | `--target-comfortable` | `--target-comfortable` | The save toggle |
| Circle | `.skeleton--circle` | 2.5 rem | 2.5 rem, `--radius-full` | An avatar |
| Block | `.skeleton--block` | 100 % of the container, at least 6 rem | 100 % | A textarea, a panel, a review body |
| Portrait | `.skeleton--portrait` | from `aspect-ratio: 4 / 5` | 100 % | An artist photo |
| Wide | `.skeleton--wide` | from `aspect-ratio: 16 / 9` | 100 % | A video |
| Strip | `.skeleton--strip` | `--font-size-xl` + 2 × `--space-3` + 2 × `--border-width-thick` (the [marquee](marquee.md)'s height) | 100 % | The profile's song strip |
| Date | `.skeleton--date` | `--space-12` | 100 % | A booking-list date block |
| Amount | `.skeleton--amount` | `--space-8` | `--space-24` | A booking-list amount |
| Stamp | `.skeleton--stamp` | `--space-6` | `--space-24` | A booking status stamp |
| Badge | `.skeleton--badge` | `--space-6` | `--control-height-lg` | A status badge in a row |
| Thumb | `.skeleton--thumb` | `--space-20` | `--space-20`, `flex: none` | `.art--thumb` (the request summary's artist) |
| Large thumb | `.skeleton--thumb-lg` | `--space-32` | `--space-32`, `flex: none` | `.art--thumb-lg` (the MFA QR code) |
| None | — | at least 1 rem | 100 % | A cell sized by its parent (`ticket__art`) or a one-off height |

| Width | Modifier | Width | Combine with |
|---|---|---|---|
| Short | `.skeleton--short` | 40 % | text, title, control, control-sm, none |
| Medium | `.skeleton--medium` | 60 % | text, title, poster, control, control-sm |
| Long | `.skeleton--long` | 90 % | text, title, poster, control-sm |
| Full | `.skeleton--full` | 100 % | text, title |
| Day | `.skeleton--day` | `--space-5` | text (a calendar day number) |
| Price | `.skeleton--price` | `--space-20` | title (a ticket stub price) |

Percentages are of the containing block. A width modifier always wins over the
shape's default width (it is declared after the shapes).

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Loading | rendered | `--color-bg-subtle` fill; the `--color-bg-subtle-hover` sweep moves once per `--duration-deliberate`, linear, forever | Hidden (`aria-hidden="true"`); the page's region has `aria-busy="true"` and its status line speaks |
| Loaded | the page removes the skeletons | Content replaces every block in one step; no block fades on its own | The page removes `aria-busy` and updates the status line ("7 artists free on Sat 14 Nov") |
| On a card | inside `.card`, `.stub`, `.ticket` | Same tokens; `--color-bg-subtle` sits on `--color-bg-surface` | — |
| On the stage | an `.on-stage` ancestor | `--color-bg-stage-raised` fill with a `--color-bg-stage-raised-hover` sweep, so a loading poster stays charcoal in both themes | — |
| Still | `prefers-reduced-motion: reduce` | No animation; a flat `--color-bg-subtle` (or stage-raised) block | — |
| Forced colours | `forced-colors: active` | Backgrounds are removed by the browser; a `--border-width-hairline` `GrayText` outline drawn inside the box keeps the placeholder visible without changing its size | — |

The skeleton has no interaction states (hover, focus, active, disabled): it is
not interactive.

## Markup

Rendered by `zm-skeleton`, default and with a shape and width:

```html
<zm-skeleton class="skeleton skeleton--text" aria-hidden="true"></zm-skeleton>
<zm-skeleton class="skeleton skeleton--title skeleton--short" aria-hidden="true"></zm-skeleton>
```

A cell sized by its parent, and a one-off height:

```html
<zm-skeleton class="ticket__art skeleton" aria-hidden="true"></zm-skeleton>
<zm-skeleton class="skeleton skeleton--short" style="height: var(--space-10)" aria-hidden="true"></zm-skeleton>
```

Inline, inside the bookings page-head subtitle:

```html
<p class="page-head__sub"><zm-skeleton class="skeleton skeleton--text skeleton--medium skeleton--inline" aria-hidden="true"></zm-skeleton><span class="visually-hidden" role="status">Loading your bookings</span></p>
```

Every other shape and width adds only its modifier class; the structure is the
same. The surrounding region, as the page builds it on Discover:

```html
<section id="lineup" class="section" aria-labelledby="lineup-title" aria-busy="true">
  <h2 id="lineup-title">The lineup</h2>
  <p class="lead"><span role="status">Finding who’s free on Saturday 14 November 2026…</span></p>
  <ul class="lineup" role="list" aria-hidden="true">
    <li><zm-ticket-skeleton class="ticket ticket--loading" aria-hidden="true">…</zm-ticket-skeleton></li>
  </ul>
</section>
```

The artist poster on the stage, as the profile header composes it:

```html
<section class="poster on-stage" aria-labelledby="artist-name">
  <div class="artist-poster" aria-hidden="true">
    <zm-skeleton shape="portrait" />
    <div class="stack"><zm-skeleton width="short" /><zm-skeleton shape="poster" /><zm-skeleton shape="poster" width="medium" /><zm-skeleton /></div>
  </div>
  <h1 id="artist-name" class="visually-hidden">Artist profile</h1>
  <p class="visually-hidden" role="status">Loading the artist’s profile…</p>
</section>
<zm-skeleton shape="strip" />
```

Consumer templates:

```html
<zm-skeleton />
<zm-skeleton shape="title" width="price" />
<zm-skeleton shape="none" class="ticket__art" />
<zm-skeleton shape="date" class="booking-list__date" />
<zm-skeleton width="day" />
<zm-skeleton width="medium" inline />
```

The `.skeleton` classes and `aria-hidden="true"` are a contract: the visual
tests compare loading screens by them, and the a11y tests check nothing inside
an `aria-hidden` skeleton is focusable.

## Design

- Minimum height 1 rem on every block; heights and widths per the tables above.
- Corners square (no radius); `.skeleton--circle` uses
  `--radius-full`.
- Fill: `linear-gradient(90deg, --color-bg-subtle 0 40%, --color-bg-subtle-hover
  50%, --color-bg-subtle 60% 100%)` at `0 0 / 300% 100%`.
- Animation: `shimmer` moves `background-position` from `100% 0` to `0 0` over
  `--duration-deliberate` (900 ms), `linear`, `infinite`.
- No margin, no border, no shadow, no layer. Spacing between blocks comes from
  the parent layout (`.stack`, `.ticket__body`, `.stub`).
- The skeleton declares no component tokens; the gradient is the whole
  component (design system, Theming). Surfaces re-skin it through
  `:host-context(.on-stage)`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Block | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Sweep | `--color-bg-subtle-hover` | `--palette-ink-200` | `--palette-ink-600` |
| Stage block | `--color-bg-stage-raised` | `--palette-ink-800` | `--palette-ink-800` |
| Stage sweep | `--color-bg-stage-raised-hover` | `--palette-ink-700` | `--palette-ink-700` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | The page's status line beside the skeletons |
| `--color-bg-subtle` | `--color-bg-surface` | decorative | Block on a card (exempt) |
| `--color-bg-stage-raised` | `--color-bg-stage` | decorative | Block on the stage (exempt) |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | The loading ticket's frame around the blocks |

Skeleton blocks are deliberately low contrast and exempt from WCAG 1.4.11: they
carry no information and are hidden from assistive technology. The status
text carries the meaning. Under forced colours the blocks keep a `GrayText`
outline (D-5).

## Responsive behaviour

- A skeleton inherits its layout from the component it sits in: a loading
  ticket stacks its stub below at XS and moves it right from SM, exactly like a
  loaded ticket.
- Widths are percentages of the container, so lines shorten with the screen.
  Heights are fixed rem values, except `--poster`, which follows the poster
  headline (56 px at 360 px, 128 px from about 1067 px).
- Rem heights grow with text zoom, so at 200 % a text skeleton is still one
  line of 200 % text and the swap still lands in place.
- At 320 px no skeleton overflows its container or the page. Fixed-width shapes
  (`amount`, `stamp`, `thumb-lg` at 128 px) fit inside a 288 px column.
- Not targets: no hit area applies.

## Accessibility

### Role and pattern

Presentation only. The host has `aria-hidden="true"`, no role, no name and no
`tabindex`. The loading region follows WCAG 4.1.3 Status Messages through the
page's `role="status"` line; no APG pattern applies.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips skeletons: they contain nothing focusable. Real controls around them (search, sort) stay reachable. |

### Focus

Nothing to focus. When content replaces the skeletons, focus does not move;
the status line announces the result. The component never contains a focusable
element, so an `aria-hidden` skeleton container never hides a focus target.

### Labelling

No label on any block. One status message per loading region, written by the
page. The page `<h1>` stays a real heading while loading (visually hidden if
needed).

### Announcements

None from the skeleton.

### Motion

The sweep is slow and low contrast. Under `prefers-reduced-motion: reduce` the
animation is removed (`animation: none`) and the block stays still
(L2-103). `--duration-deliberate` also drops to near zero under reduced motion.

## Content and internationalisation

- Skeletons have no text and no translatable strings. The words live in the
  page's status line: a present-tense verb, the date and an ellipsis, "Finding
  who’s free on Saturday 14 November 2026…" (long date, L2-110).
- Mirror the shape of the real copy: a short kicker line, a title line, a meta
  line. Vary widths across repeated items (`long`, `medium`) so a list does not
  look stamped out. Don't draw lines where the loaded component has none.
- Because no string is inside, a longer French catalogue changes nothing in the
  skeleton; the status line wraps.

## Performance

- Change detection: `OnPush`, signal inputs, the class string from one
  `computed`. Empty template; no subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Skeleton.ts`
  renders one loading ticket's placeholders (block, short text, title, text,
  short title, target) as on `pages/discover/loading`. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: `TicketSkeleton` (ticket CRD) and `DarkTheme`.
- Layout stability: every shape's box equals the box of what replaces it, so
  the swap from skeleton to content shifts nothing (L2-105). The strip is the
  marquee's exact height; the portrait and wide shapes reserve their aspect
  ratio before media loads.
- The sweep animates `background-position` only, so it never triggers layout.
- Imports: Angular core only.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-skeleton />`, when it renders, then the host has exactly the classes `skeleton skeleton--text`, `aria-hidden="true"`, no children, a height of 16 px and 70 % of its container's width. (L2-105)
- **AC-2** Given each shape in the Variants table, when it renders at 1280 px, then its height is the table's value (text 16 px, title 28 px, figure 40 px, control 44 px, control-sm 36 px, control-lg 56 px, target 44 × 44 px, circle 40 × 40 px, date 48 px, amount 96 × 32 px, stamp 96 × 24 px, badge 56 × 24 px, thumb 80 × 80 px, thumb-lg 128 × 128 px, poster 128 px). (L2-105)
- **AC-3** Given `width` short, medium, long, full, day and price, when each renders in a 400 px container, then its width is 160, 240, 360, 400, 20 and 80 px. (L2-105)
- **AC-4** Given `<zm-skeleton shape="none" class="ticket__art" />` in a loading ticket, when it renders and later its inputs change, then the host keeps `ticket__art` next to `skeleton`, carries no shape modifier and fills the ticket's art cell. (L2-105)
- **AC-5** Given `<zm-skeleton shape="strip" />` under the artist poster, when Abigail Mensah's profile loads and the song marquee replaces it, then the marquee's top and height equal the strip's and the sections below do not move. (L2-105)
- **AC-6** Given the artist profile loading state with the poster, strip and stub skeletons, when Abigail Mensah's profile replaces them, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)
- **AC-7** Given `width="medium" inline` inside the bookings page-head subtitle, when it renders, then the host is `display: inline-block` and the subtitle's line box is no taller than one line of text. (L2-105)
- **AC-8** Given text projected between `<zm-skeleton>` tags, when it renders, then nothing is rendered inside the host. (L2-102)

### States

- **AC-9** Given a skeleton while loading, when its computed style is read, then it animates `background-position` with a `--duration-deliberate` (900 ms) linear infinite animation over a `--color-bg-subtle` to `--color-bg-subtle-hover` gradient. (L2-105)
- **AC-10** Given skeletons inside the artist poster's `.on-stage` section, when they render in the light theme and in the dark theme, then each block's fill is `--color-bg-stage-raised` with a `--color-bg-stage-raised-hover` sweep. (L2-104)

### Keyboard and focus

- **AC-11** Given the Discover lineup while loading, when the booker presses Tab from the sort select, then focus never lands on a skeleton or inside the `aria-hidden` list. (L2-101)

### Screen readers

- **AC-12** Given the Discover lineup while loading, when it is read by a screen reader, then it announces "Finding who’s free on Saturday 14 November 2026…" once and announces nothing for any skeleton block. (L2-102)
- **AC-13** Given every loading screen in both themes, when axe-core runs, then there are zero serious or critical violations from skeletons. (L2-100)

### Theming

- **AC-14** Given the dark theme, when a skeleton renders on a card, then its block is `--color-bg-subtle` (`--palette-ink-700`) with a `--color-bg-subtle-hover` (`--palette-ink-600`) sweep, just above the charcoal surface. (L2-104)

### Responsive

- **AC-15** Given a 320 px viewport, when the Discover and bookings loading screens render, then no skeleton overflows its container and the page does not scroll horizontally. (L2-096)
- **AC-16** Given text zoomed to 200 %, when a loading ticket renders, then its text and title skeletons double in height with the text and nothing overlaps. (L2-096)
- **AC-17** Given a 360 px viewport, when a `poster` skeleton renders, then it is 56 px tall; at 1280 px it is 128 px. (L2-105)

### Motion

- **AC-18** Given `prefers-reduced-motion: reduce`, when skeletons render, then they have no animation and show a flat fill. (L2-103)

### Performance

- **AC-19** Given the `Skeleton` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-skeleton` with seven shapes and four widths. To meet this
CRD:

- Add the shapes `control`, `control-sm`, `control-lg`, `circle`, `wide`,
  `strip`, `date`, `amount`, `stamp`, `badge`, `thumb`, `thumb-lg` and `none`,
  with the sizes in the Variants table taken from `components.css`.
- Add the widths `day` and `price`, declared after the shapes so a width
  always wins.
- Add `inline` (`booleanAttribute`) and `.skeleton--inline`.
- Add `aria-hidden="true"` to the host.
- Replace the `'[class]'` host binding with one `computed` class string bound
  so consumer classes on the host survive (verify `ticket__art` stays, AC-4),
  and render no modifier for `'none'`.
- Add the stage mapping with `:host-context(.on-stage)` and the forced-colours
  outline (D-5).
- Keep the reduced-motion rule. Keep the `Skeleton.ts` scenario as it is; do
  not lower its iterations.

## Decisions

- **D-1** *A wrapper component for the loading region (busy, hidden list, status)?* No. The status line sits in a different place on every loading mock (a `.lead`, a visually hidden paragraph, the page-head subtitle, a visually hidden `<h1>`), so the page owns `aria-busy`, the `aria-hidden` container and the status. The skeleton stays one inert block.
- **D-2** *Does each skeleton carry `aria-hidden` itself?* Yes, as well as the container. The design system puts it on the container; several mocks also put it on single blocks inside a status paragraph. A block has no content, so hiding it costs nothing and guarantees no block is ever read, wherever a page places it.
- **D-3** *How are the bare `.skeleton` spans built (ticket art, one-off heights)?* With `shape="none"`. The ticket's art cell sizes its block by grid, and the design system allows a once-used placeholder to take one spacing token inline (`height: var(--space-24)`); everything repeated is a shape.
- **D-4** *The bookings mock makes a skeleton inline with a raw `style="display: inline-block"`. Keep that?* Yes, as the `inline` input and `.skeleton--inline`, so no page writes the style. The design-system page catches up with the modifier.
- **D-5** *What happens under forced colours, where backgrounds disappear?* The block keeps its box and draws a `--border-width-hairline` `GrayText` outline with a negative offset, so the reserved space stays visible without changing size. The design system is silent; an invisible hole in a high-contrast page would look broken.
- **D-6** *Which stub price shape does a loading ticket use: `title` + `short` (Discover mock), `title` + `price` (Saved mock) or `figure` (ticket CRD)?* All three stay buildable here; the [ticket](ticket.md) CRD fixes its own skeleton at `figure`, which matches the loaded price's `--text-figure`. The skeleton offers the shapes; the composite chooses.
- **D-7** *The `ticket__art` skeleton and the `.booking-list__*` blocks get their class from the consumer. Can the component's own class binding remove them?* No. AC-4 requires consumer classes to survive input changes, because parent layouts locate and size these cells by class.
