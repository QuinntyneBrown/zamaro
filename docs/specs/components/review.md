# Review

| Field | Value |
|---|---|
| Selector | `zm-review`, `zm-review-skeleton` |
| Library path | `frontend/projects/components/src/lib/review/` |
| Status | planned |
| Traces to | L2-018, L2-059, L2-061, L2-062, L2-075, L2-086, L2-096, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`review.html`](../../design-system/components/review.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/artist-reviews/default`](../../mocks/pages/artist-reviews/default.html), [`pages/artist-reviews/loading`](../../mocks/pages/artist-reviews/loading.html), [`pages/admin-reviews/default`](../../mocks/pages/admin-reviews/default.html), [`dialogs/reply-review/default`](../../mocks/dialogs/reply-review/default.html), [`dialogs/reply-review/edit`](../../mocks/dialogs/reply-review/edit.html), [`dialogs/report-review/default`](../../mocks/dialogs/report-review/default.html), [`dialogs/hide-review/default`](../../mocks/dialogs/hide-review/default.html) |
| Rendering | [`review.html`](review.html) |

## Purpose and scope

A review is what one church said after a completed booking, in its own words:
a quote under a yellow quote mark, the stars it gave, and who said it, with the
church, town and month. When the artist has replied, the reply sits beneath it,
labelled "Reply from Abigail Mensah", and under that the actions the viewer may
take on this review (Reply, Edit reply, Report).

`zm-review-skeleton` is the same frame filled with skeletons, for a review list
that is still loading.

Use something else when:

- it is the artist's average score ("★★★★★ 4.9 · 38 churches" in the section
  head, "★ 4.9 · 38 churches" on a ticket) → [rating](rating.md);
- it is one pull quote inside another component, such as the headliner's
  "“She had the whole congregation singing…” — Rev. Janet Clarke, Oshawa" → a
  plain paragraph owned by [headliner](headliner.md);
- there are no reviews yet ("No church reviews yet") → [empty state](empty-state.md);
- it is a message in a booking thread → [card](card.md) (`.message`).

Out of scope:

- The list: the page owns `<ul class="reviews" role="list">`, its two-column
  grid from 768 px, each `<li>`, ordering (newest first), paging ("Show all 38
  reviews", "Show 10 more") and the "Showing 4 of 38, newest first" caption
  (L2-018).
- Which actions a viewer gets. The page decides: Report for any signed-in user
  except on their own review, Reply or Edit reply or "Reply locked" for the
  artist on their Reviews page, nothing for guests and in dialogs and the
  admin panel. It builds the buttons and projects them (L2-061, L2-062).
- The dialogs those actions open (reply, report, hide). They are CDK dialogs
  owned by the page (AGENTS.md: button-triggered editing opens a dialog).
- Moderation: a hidden review is never sent to the page, so it never renders
  (L2-062).
- Formatting dates. The page passes "September 2026" and "Thu 8 Oct · editable
  until Thu 15 Oct, 11:20 a.m." already formatted by the API library's format
  service (L2-110).

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default` "What churches say", signed in as Naomi | 4 reviews in `ul.reviews`, newest first; 2 with replies "Reply from Abigail Mensah · October 2026" / "· June 2026" | actions: ghost sm "Report" + hidden " Rev. Janet Clarke's review"; none on Naomi's own review | default, 5 and 4 stars, with reply, with and without actions | canvas |
| `pages/profile-preview/default` | as the profile, previewed by Abigail | no actions | default, with reply | canvas |
| `pages/artist/empty` (Miriam Haile) | not rendered; the page shows the empty state "No church reviews yet" / "Be her first booking" | — | no reviews | canvas |
| `pages/artist/loading` | not rendered; the profile skeleton covers the section | — | loading | canvas |
| `pages/artist-reviews/default` (Abigail's Reviews page) | 4 reviews, then "Show 10 more" | Janet, Femi: primary sm "Reply" + ghost sm "Report"; Tomi: reply "Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m." + secondary sm "Edit reply" + "Report"; Naomi: reply "… · Tue 16 Jun · locked Tue 23 Jun" + caption with lock icon "Reply locked" + "Report" | no reply, reply editable, reply locked | canvas |
| `pages/artist-reviews/loading` | `zm-review-skeleton` × 4 with `actions`, in an `aria-hidden` list | — | loading | canvas |
| `pages/artist-reviews/empty`, `error` | not rendered; empty state "No reviews yet" or alert "We couldn't load your reviews" | — | empty, error | canvas |
| `pages/admin-reviews/default` (Priya) | one review per `.panel` under "Review of Hosanna Collective": Pastor Dave Mwangi, 2 stars; Grace Ampofo, 2 stars | no reply, no actions (the panel's "Hide review…" and "Dismiss reports" sit outside) | default, low rating | inside a paper panel |
| `dialogs/reply-review/default`, `edit` | one review at the top of the dialog body (Janet, Tomi) | no reply, no actions | default | dialog surface |
| `dialogs/report-review/default` and states | Femi's 4-star review in the body | none | default | dialog surface |
| `dialogs/hide-review/default` and states | the admin panel behind the dialog, inert | none | inert | canvas |
| `dialogs/photo-viewer/default`, `notifications/share-toast/success` | the profile list behind, inert | as the profile | inert | canvas |
| Design system, single review | one review on its own, "under a booking confirmation" | none | default | canvas |

Every row is buildable with the API below. Rows that do not render the
component (empty, error, profile loading) are listed so the page's states are
accounted for.

## Anatomy

1. **Host** — `zm-review`, carrying `.stack.stack--sm`: a column with
   `--space-2` between the card, the reply and the actions. The page's `<li>`
   holds it.
2. **Card** — `figure.review`: paper surface, `--border-width-thick` frame in
   `--color-border-strong`, `--space-6` padding, `--space-4` between parts.
3. **Quote mark** — `blockquote::before`: a “ in `--text-figure-lg` on a
   `--color-accent` block. CSS content, not text.
4. **Quote** — `blockquote > p` in `--text-body-lg`. One `<p>` per paragraph
   of the review text.
5. **Caption** — `figcaption`, in `--text-stub`, uppercase: the stars, then the
   reviewer's name as a text node, then the source line.
6. **Stars** — `span.stars`, `role="img"` with "5 out of 5 stars": five
   characters, filled ★ then empty ☆, on their own line.
7. **Source line** — the caption's plain `<span>`: "St. Brendan's Anglican,
   Oshawa · September 2026", `--text-caption`, muted, sentence case.
8. **Reply (optional)** — `div.message`: sunken surface with a
   `--border-width-poster` yellow left rule; `p.message__meta` "Reply from
   Abigail Mensah · October 2026" over a `blockquote > p` with the reply.
9. **Actions (optional)** — `div.cluster`: the projected small buttons and
   captions, in reading order after the reply. Hidden when empty.

`zm-review-skeleton` host is a `div.review` (the same frame) holding skeleton
blocks, and optionally a small-control skeleton under it.

## API

### `zm-review` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `quote` | `string` | — | yes | The review text, 20–1,000 characters as submitted (L2-059). Plain text: rendered by interpolation, never as HTML. A blank line (`\n\n`) starts a new `<p>`; single line breaks become spaces. |
| `stars` | `1 \| 2 \| 3 \| 4 \| 5` | — | yes | Whole stars. Renders `stars` × ★ then `5 − stars` × ☆. A value outside 1–5 is clamped and, in dev mode, logs a console error naming the component. |
| `starsLabel` | `string` | — | yes | The stars' accessible name from the catalogue: "5 out of 5 stars". |
| `reviewer` | `string` | — | yes | Name with title as given: "Rev. Janet Clarke", "Pastor Femi Adebayo". |
| `source` | `string` | — | yes | "{church}, {town} · {month year}": "Harvest Point Church, Milton · August 2026". |
| `reply` | `string \| null` | `null` | no | The artist's reply, 1–500 characters (L2-061). Plain text, same paragraph rule as `quote`. `null` renders no `.message`. |
| `replyMeta` | `string` | `''` | when `reply` is set | "Reply from Abigail Mensah · October 2026" on the profile; "Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m." or "… · Tue 16 Jun · locked Tue 23 Jun" on the artist's Reviews page. Must start with the translated "Reply from {artist name}". |

### `zm-review-skeleton` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `actions` | `boolean` (attribute) | `false` | no | Adds a small-control skeleton under the card, for lists whose reviews carry actions (the artist's Reviews page). |

### Outputs

None. The component has no interactive parts of its own; the projected buttons
emit their own `click`, which the page handles.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `[slot=actions]` | `zm-button` `size="sm"` (primary "Reply", secondary "Edit reply", ghost "Report"), each ending with a `.visually-hidden` span naming the review; a `span.text-caption` with a `zm-icon` lock and "Reply locked" | Rendered in `div.cluster` after the reply. The wrapper always renders and is hidden with `:empty`, so the page needs no `@if` around the slot. Declared once. |

There is no default slot: every part of the card is an input, so its markup
stays fixed for the e2e page objects.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Review | — | A review on its own: admin panel, dialogs, profile preview. |
| With reply | `.message` after the card | A review the artist has answered (L2-061). |
| With actions | `.cluster` after the card or reply | A review the viewer can act on. |
| Loading | `zm-review-skeleton` | A review list that is still loading. |

The variants combine; they are produced by the inputs and slot, not by a
modifier class on the card.

Reviews have one size. The page's grid sets their width; the type never
shrinks. Keep quotes short in the product voice rather than scaling them.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Card with quote mark, quote, stars, reviewer, source line | A figure: the quote, then the caption |
| Lower rating | `stars` < 5 | Outline ☆ for the missing stars; no colour change | "4 out of 5 stars" |
| With reply | `reply` set | `.message` under the card, sunken, yellow left rule | "Reply from Abigail Mensah · October 2026", then the reply quote |
| Reply editable | page passes "editable until …" meta and "Edit reply" | Secondary sm button | "Edit reply to Tomi Oduya's review, button" |
| Reply locked | page passes "locked …" meta and the "Reply locked" caption | Caption with lock icon, no Edit button | "Reply locked" read as text; the icon is hidden |
| No reply yet (artist view) | page projects primary "Reply" | Primary sm button | "Reply to Rev. Janet Clarke's review, button" |
| Reportable | page projects ghost "Report" | Ghost sm button | "Report Pastor Femi Adebayo's review, button" |
| Action focus | `:focus-visible` on a projected button | The button's two-tone ring (button CRD) | — |
| Loading | `zm-review-skeleton` | Same frame and padding; skeleton blocks shimmer | The page hides the list (`aria-hidden="true"`), sets `aria-busy` on the region and announces "Loading your reviews" once |
| Inert | an open dialog makes the page `inert` | No change | Not reachable |

The card itself has no hover, focus, active or disabled state: it is static
text. Empty and error are the page's states (empty state, alert); the component
is not rendered in them.

## Markup

Rendered by `zm-review` inside the page's list item, with a reply and actions:

```html
<li>
  <zm-review class="stack stack--sm">
    <figure class="review">
      <blockquote><p>She rehearsed with our volunteer band on Saturday and made them sound like pros on Sunday.</p></blockquote>
      <figcaption><span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span>Tomi Oduya<span>Harvest Point Church, Milton · August 2026</span></figcaption>
    </figure>
    <div class="message">
      <p class="message__meta">Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m.</p>
      <blockquote><p>Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.</p></blockquote>
    </div>
    <div class="cluster">
      <zm-button size="sm"><button class="btn btn--sm" type="button"><svg class="icon icon--sm" aria-hidden="true">…</svg>Edit reply<span class="visually-hidden"> to Tomi Oduya’s review</span></button></zm-button>
      <zm-button variant="ghost" size="sm"><button class="btn btn--ghost btn--sm" type="button"><svg class="icon icon--sm" aria-hidden="true">…</svg>Report<span class="visually-hidden"> Tomi Oduya’s review</span></button></zm-button>
    </div>
  </zm-review>
</li>
```

A review on its own (admin panel, dialog body) renders only the figure inside
the host; `.message` is absent and `.cluster` is present but empty, so
`:empty` hides it:

```html
<zm-review class="stack stack--sm">
  <figure class="review">
    <blockquote><p>The band was great, but the sound company we hired double-charged us and never answered our emails. Avoid them.</p></blockquote>
    <figcaption><span class="stars" role="img" aria-label="2 out of 5 stars">★★☆☆☆</span>Pastor Dave Mwangi<span>Lakeshore Alliance Church, Oakville · September 2026</span></figcaption>
  </figure>
  <div class="cluster"></div>
</zm-review>
```

A locked reply's actions:

```html
<div class="cluster">
  <span class="text-caption"><svg class="icon icon--sm" aria-hidden="true">…</svg> Reply locked</span>
  <zm-button variant="ghost" size="sm">…Report<span class="visually-hidden"> Naomi Fraser’s review</span>…</zm-button>
</div>
```

A two-paragraph review becomes two `<p>` in the blockquote:

```html
<blockquote><p>Our seniors asked for hymns and our youth asked for Jireh.</p><p>She gave both, and somehow it felt like one service.</p></blockquote>
```

Loading:

```html
<zm-review-skeleton class="stack stack--sm" aria-hidden="true">
  <div class="review">
    <span class="skeleton skeleton--figure"></span>
    <span class="skeleton skeleton--text skeleton--long"></span>
    <span class="skeleton skeleton--text skeleton--medium"></span>
    <span class="skeleton skeleton--text skeleton--short"></span>
  </div>
  <span class="skeleton skeleton--control-sm skeleton--short"></span> <!-- only with actions -->
</zm-review-skeleton>
```

Consumer templates:

```html
<ul class="reviews" role="list">
  @for (review of reviews(); track review.id) {
    <li>
      <zm-review [quote]="review.text" [stars]="review.stars" [starsLabel]="'reviews.stars' | transloco: { n: review.stars }"
        [reviewer]="review.reviewer" [source]="review.source" [reply]="review.reply?.text ?? null" [replyMeta]="review.reply?.meta ?? ''">
        @if (canReport(review)) {
          <zm-button slot="actions" variant="ghost" size="sm" (click)="openReport(review)">
            <zm-icon name="flag" size="sm" />{{ 'reviews.report' | transloco }}<span class="visually-hidden">{{ 'reviews.reportTarget' | transloco: { name: review.reviewer } }}</span>
          </zm-button>
        }
      </zm-review>
    </li>
  }
</ul>
```

```html
<ul class="reviews" role="list" aria-hidden="true">
  @for (i of [1, 2, 3, 4]; track i) { <li><zm-review-skeleton actions /></li> }
</ul>
```

The `.review`, `blockquote`, `figcaption`, `.stars`, `.message` and
`.message__meta` structure is a contract: the e2e page objects find a review by
its reviewer's name in the caption and read the stars by their accessible name.
The skeleton's inner blocks are free to change as long as the frame and height
hold.

## Design

- Host: `display: flex; flex-direction: column; gap: --space-2`
  (`.stack.stack--sm`), `min-width: 0` so the grid column can shrink.
- Card: `display: flex; flex-direction: column; gap: --space-4`, padding
  `--space-6`, `--border-width-thick` solid `--color-border-strong` on
  `--color-bg-surface`, text `--color-fg-default`. Square corners, no shadow.
- In the page's grid the list items in a row stretch to the row's height; the
  card inside keeps its content height, so a reply and actions always sit
  directly under their own card (D-10). The caption stays under the quote and
  is never pinned to the bottom.
- Quote `--text-body-lg`; `overflow-wrap: anywhere` so a long URL or word in a
  1,000-character review wraps (D-6). Paragraphs `--space-3` apart.
- Quote mark: `--text-figure-lg`, line height 0.6, `--color-accent` fill,
  `--color-fg-on-accent` glyph, padding `--space-2` `--space-2` 0, margin below
  `--space-2`, `width: fit-content`.
- Caption `--text-stub`, uppercase. Stars `--text-stub` with
  `--letter-spacing-wide`, `display: block`, `white-space: nowrap`, margin below
  `--space-1`. Source span `display: block`, `--text-caption`,
  `--color-fg-muted`, `text-transform: none`.
- Reply: padding `--space-4` `--space-5`, gap `--space-2`,
  `--color-bg-surface-sunken`, left rule `--border-width-poster` in
  `--color-accent`. Meta `--text-stub`, uppercase, muted; reply quote
  `--text-body-lg` with `overflow-wrap: anywhere`.
- Actions: `.cluster`, gap `--space-2`, wraps.
- Skeleton: the `.review` frame and padding; blocks `--space-4` apart, as in the
  card.
- No motion of its own. No layers.

The review declares no component tokens. Re-skin by overriding the semantic
tokens on an ancestor, never by restyling `.review`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Card surface | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Quote, stars, reviewer | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Source line, reply meta | `--color-fg-muted` | per theme | per theme |
| Quote-mark block, reply rule | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Quote-mark glyph | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Reply surface | `--color-bg-surface-sunken` | per theme | per theme |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Quote, stars, reviewer |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Church and date |
| `--color-fg-on-accent` | `--color-accent` | 3:1 | Quote mark (large glyph) |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Card frame |
| `--color-fg-default` | `--color-bg-surface-sunken` | 4.5:1 | Reply text |
| `--color-fg-muted` | `--color-bg-surface-sunken` | 4.5:1 | Reply meta |

The yellow reply rule is emphasis, not information: "Reply from {artist}"
carries the meaning, so the rule is exempt from 3:1 against the sunken
surface. Under forced colours the frame and rule fall back to system
`CanvasText`, and the stars stay readable as characters behind their label.

## Responsive behaviour

- The component does not change across breakpoints. The page's `.reviews` grid
  is one column under MD and two columns from MD (768 px), `--space-6` apart
  (L2-098).
- At 320 px the card keeps `--space-6` padding; the quote, reviewer and source
  line wrap; the stars never wrap. Nothing clips or scrolls sideways (L2-096).
- At 200 % zoom the card grows taller and the actions wrap onto more rows.
- Actions are small buttons; under a coarse pointer they grow to
  `--target-comfortable` (button CRD), so every target is at least 44 × 44 CSS
  px with `--space-2` between them.
- Text wraps; nothing truncates. A review is shown in full (up to 1,000
  characters); there is no "Read more".

## Accessibility

### Role and pattern

Each review is a `<figure>` with a `<blockquote>` and a `<figcaption>`, which
ties the quote to its source. The attribution is in the caption, not the
blockquote, because it is not part of what was said. The page puts each review
in an `<li>` of a `<ul role="list">`, so the count is announced. There is no APG
widget pattern: the card is static content; the projected buttons follow the
[APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Skips the card and reply; stops on the projected buttons in source order: Reply or Edit reply, then Report. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On a button: opens its dialog. |

### Focus

The card has no focus style. The buttons show their own two-tone ring. When a
dialog opened from a review closes, focus returns to the button that opened it
(L2-101, page and dialog CRD); the component keeps its buttons in the DOM
across the reply change so that target exists, except when the page replaces
"Reply" with "Edit reply", in which case the page moves focus to "Edit reply".

### Labelling

- The stars are one image named by `starsLabel` ("4 out of 5 stars"), never
  read as characters (L2-102). `aria-label` is only valid with `role="img"`, so
  both are always set.
- Reply, Edit reply and Report repeat on every review, so each carries
  visually hidden text naming the reviewer: "Report Tomi Oduya's review". The
  visible word comes first, so voice users can say "click Report" (WCAG
  2.5.3).
- The reply's meta line starts "Reply from {artist name}", so it is never
  mistaken for the church's words (L2-018).
- The lock icon is `aria-hidden`; "Reply locked" is the text.
- The quote mark is CSS content; some screen readers read it as "left double
  quotation mark", which is accurate.

### Announcements

None from the component. The page announces "Loading your reviews" once in a
status line outside the hidden skeleton list, and the dialogs announce their
own results through toasts.

### Motion

None of its own. Skeletons stop shimmering under `prefers-reduced-motion:
reduce` (skeleton CRD).

## Content and internationalisation

- **Quote**: the church's own words, shown in full as submitted, plain text.
  Song titles appear as the reviewer typed them ("Jireh"); no emphasis markup is
  parsed (D-3). The component adds no quotation marks; the quote mark is CSS.
- **Stars**: whole numbers, filled ★ then empty ☆, five in total; the label
  states the same number: "4 out of 5 stars" (catalogue pattern with `{n}`).
- **Reviewer**: name with title as given: "Rev. Janet Clarke", "Pastor Femi
  Adebayo". Uppercase by CSS; source copy keeps its case.
- **Source line**: "{church}, {town} · {month year}": "Living Waters
  Fellowship, Brampton · May 2026". Month and year in en-CA long form
  ("September 2026") from the format service (L2-110).
- **Reply meta**: "Reply from {artist name} · {date}". Public profile: month
  and year ("October 2026"). Artist's Reviews page: short date, then
  "editable until {short date}, {time}" inside the 7-day window ("Thu 8 Oct ·
  editable until Thu 15 Oct, 11:20 a.m.") or "locked {short date}" after it
  ("Tue 16 Jun · locked Tue 23 Jun") (L2-061, L2-110).
- **Actions**: "Reply", "Edit reply", "Report", "Reply locked", with hidden
  " to {reviewer}'s review" or " {reviewer}'s review".
- Data values: quote, reply, reviewer, church, town. Copy values: the stars
  label pattern, "Reply from", "editable until", "locked", action labels and
  the hidden suffixes, all from the catalogue through the page (L2-111).
  French runs about 30 % longer; the meta line and actions wrap.

## Performance

- Change detection: `OnPush`, signal inputs. Computed values: the quote's and
  reply's paragraph arrays and the star string. No subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Review.ts`
  renders Tomi Oduya's 5-star review ("She rehearsed with our volunteer band on
  Saturday and made them sound like pros on Sunday.", "Harvest Point Church,
  Milton · August 2026") with Abigail's reply "Reply from Abigail Mensah ·
  October 2026" and a ghost "Report" in the actions slot.
- `ReviewSkeleton.ts` renders one `zm-review-skeleton` with `actions`.
- Composite scenario: `ReviewList.ts` renders the profile's "What churches say":
  four reviews in `ul.reviews` (Janet, Tomi with reply, Naomi with reply,
  Femi 4 stars), each with Report except Naomi's. Each scenario is tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Regression rule: a change to the template, inputs, styles or change detection
  is measured against the base branch with `--fail-on-regression` before push.
- Layout stability: the skeleton uses the same `.review` frame, padding and
  gap, and four lines close to a two-line quote plus caption, so swapping
  skeletons for reviews shifts the page by 0.05 or less (L2-105).
- Imports: Angular core only. Buttons and icons arrive through the slot; the
  component does not import `zm-button`.

## Acceptance criteria

### Rendering

- **AC-1** Given Rev. Janet Clarke's 5-star review "She had the whole congregation singing in three-part harmony by the last verse." from "St. Brendan's Anglican, Oshawa · September 2026", when it renders, then a `figure.review` shows the quote in a `blockquote`, "★★★★★", "Rev. Janet Clarke" and "St. Brendan's Anglican, Oshawa · September 2026" in the `figcaption`. (L2-018)
- **AC-2** Given Pastor Femi Adebayo's review with `stars` 4, when it renders, then the stars read "★★★★☆" with no colour change from a 5-star review. (L2-018)
- **AC-3** Given a 1-star review, when it renders, then the stars read "★☆☆☆☆" and are labelled "1 out of 5 stars"; given `stars` 0 or 6 in dev mode, then a console error names `zm-review` and the stars clamp to 1 or 5. (L2-059)
- **AC-4** Given a 1,000-character review, when it renders, then the whole text is shown, with no truncation and no "Read more". (L2-059)
- **AC-5** Given a review whose text contains `<b>Great</b> <script>alert(1)</script>`, when it renders, then the markup is shown as literal text and no element or script is created. (L2-075)
- **AC-6** Given a review text with a blank line between two paragraphs, when it renders, then the blockquote holds two `<p>` elements in order. (L2-018)
- **AC-7** Given Tomi Oduya's review with `reply` "Thank you, Tomi! …" and `replyMeta` "Reply from Abigail Mensah · October 2026", when it renders, then a `.message` directly beneath the card shows that meta line over the reply in a blockquote. (L2-018)
- **AC-8** Given `reply` null, when the review renders, then there is no `.message` element. (L2-061)
- **AC-9** Given Abigail's Reviews page and a reply inside its 7-day window, when the review renders with meta "Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m." and an "Edit reply" action, then both show beneath the card; given a reply past the window, then the meta reads "… · Tue 16 Jun · locked Tue 23 Jun", "Reply locked" shows and there is no "Edit reply". (L2-061)
- **AC-10** Given a signed-in booker on Abigail's profile, when a review renders with a projected "Report" button, then the button sits in `.cluster` after the reply, and the component renders no delete or hide control of its own. (L2-062)
- **AC-11** Given no content in the actions slot, when the review renders, then the `.cluster` wrapper takes up no space and the host's height equals the card's (plus the reply when present). (L2-062)
- **AC-12** Given an admin panel "Review of Hosanna Collective", when Pastor Dave Mwangi's 2-star review renders inside it, then only the figure renders, framed as on the profile, and the panel's own buttons sit outside the component. (L2-062)

### States

- **AC-13** Given `zm-review-skeleton`, when it renders in place of a review, then it has the same `.review` frame, padding and gap, contains only skeleton blocks, and with `actions` adds one small-control skeleton beneath. (L2-105)
- **AC-14** Given four skeletons on the artist's Reviews page replaced by four reviews, when the swap is measured, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Keyboard and focus

- **AC-15** Given Rev. Janet Clarke's review with "Reply" and "Report" on Abigail's Reviews page, when the artist tabs through it, then focus skips the card and stops on "Reply", then "Report", each showing the two-tone focus ring. (L2-101)

### Screen readers

- **AC-16** Given Femi's review, when it is read by a screen reader, then the stars are announced as "4 out of 5 stars", not as star characters. (L2-102)
- **AC-17** Given the "Report" action on Tomi Oduya's review, when buttons are listed by a screen reader, then it is named "Report Tomi Oduya's review" and its name starts with the visible "Report". (L2-102)
- **AC-18** Given a list of reviews with replies and actions in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme, when a review renders, then the card is `--color-bg-surface` charcoal with a `--color-border-strong` frame and paper text, and the quote mark stays a yellow block with ink glyph. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then quote, stars and reviewer are at least 4.5:1 on the card, the source line and reply meta at least 4.5:1 on their surfaces, and the frame at least 3:1. (L2-103)

### Responsive

- **AC-21** Given a 320 px viewport and a review from "Riverside Community Church, Burlington · June 2026", when it renders, then the quote, reviewer and source line wrap, the stars stay on one line, a 60-character unbroken word in the quote wraps inside the card, and the page does not scroll horizontally. (L2-096)
- **AC-22** Given the profile's review list at 768 px, when it renders, then reviews sit two per row in the page's `.reviews` grid, each reply sits directly under its own card, and below 768 px they sit one per row. (L2-098)
- **AC-23** Given a touch device, when the "Reply" and "Report" buttons under a review are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-24** Given the French catalogue, when the reply meta and actions are about 30 % longer, then they wrap within the review without clipping. (L2-111)

### Formatting

- **AC-25** Given a reply posted Thursday 8 October 2026 and editable until 15 October at 11:20, when the artist's Reviews page passes the formatted meta, then it reads "Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m.", and the profile's source line reads "August 2026". (L2-110)

### Performance

- **AC-26** Given the `Review`, `ReviewSkeleton` and `ReviewList` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

- Folder `frontend/projects/components/src/lib/review/`: `review.ts`
  (`Review`, selector `zm-review`), `review.html`, `review.scss`, and
  `review-skeleton.ts` (`ReviewSkeleton`, selector `zm-review-skeleton`).
  Export both from `public-api.ts`.
- Host binding `class: 'stack stack--sm'` on both components. The skeleton
  host also sets `aria-hidden="true"`, so a skeleton is hidden even outside an
  `aria-hidden` list.
- Paragraphs: a `computed` splits on `/\n\s*\n/`, trims, drops empties, and
  replaces remaining `\n` with spaces; render with `@for` and interpolation. No
  `[innerHTML]`, no `DomSanitizer` bypass.
- Stars: `computed(() => '★'.repeat(n) + '☆'.repeat(5 - n))` after clamping.
- The `.review` rules in `components.css` are global foundations for now; the
  component's own stylesheet carries the card, caption, stars and `.message`
  rules it renders, with the additions in this CRD: `white-space: nowrap` on
  `.stars`, `overflow-wrap: anywhere` on both blockquotes, `--space-3` between
  quote paragraphs, and `.cluster:empty { display: none }`.
- Skeleton blocks use `zm-skeleton` with shapes `figure`, `text` (`long`,
  `medium`, `short`) and a small control; the skeleton CRD owns those shapes
  (`skeleton--control-sm`).
- Add perf-test scenarios `Review.ts`, `ReviewSkeleton.ts` and `ReviewList.ts`
  and export them from `scenarios/index.ts`.
- Composes nothing at runtime; buttons, icons and captions are projected.

## Decisions

- **D-1** *Does the component render the `<li>` and the reply and actions, or only the figure?* It renders the figure, the reply and the actions wrapper, on a `.stack.stack--sm` host; the page renders the `<li>` and the `ul.reviews`. The design system's "with reply and actions" markup puts `.stack.stack--sm` on the `<li>`; moving it to the host keeps the list semantics with the page (as the ticket does) while keeping the three parts' order and spacing in one place.
- **D-2** *How are actions supplied?* Through one `[slot=actions]`, not inputs. Which actions apply depends on who is viewing (guest, booker, the reviewer, the artist inside or after the 7-day window, the admin), which only the page knows, and the dialogs they open are the page's. The mocks show these as links to dialog mocks; in the product they are `zm-button`s that open CDK dialogs (AGENTS.md).
- **D-3** *Plain text or rich text, and what about song titles in `<em>`?* Plain text. Reviews and replies are user input (L2-059, L2-061) and are shown as literal text (L2-075), as the bio is (L2-013). The design system's rule "song titles in `<em>`" cannot be met without parsing markup, so titles appear as typed; the design-system content rule should drop it. Blank-line paragraphs are kept, as the bio keeps paragraph breaks.
- **D-4** *What does the loading review look like: the design system's `div.review` with three text lines, or the artist-reviews mock's `.panel` with a figure, three lines and a control?* The `.review` frame (the design system) holding the mock's contents (a figure block for the quote mark, long, medium and short lines), plus the control skeleton only when the list has actions. `.panel` and `.review` share padding and frame today, but tying the skeleton to `.review` keeps the swap shift-free if either changes (L2-105), and the mock's extra blocks match a real review's height better than three lines. The control is `skeleton--control-sm` because the actions are small buttons; the mock's full-height control would shift the page on swap.
- **D-5** *Should the stars be a shared component?* No. Per-review stars are five characters with a label and render only here; the average with score and count is `zm-rating` (rating CRD), including the section head's "★★★★★ 4.9 · 38 churches".
- **D-6** *What happens to one word wider than the card?* It wraps inside the word (`overflow-wrap: anywhere` on the quote and reply). Reviews are free text up to 1,000 characters and may contain a URL; at 320 px the card's text column is under 240 px, and L2-096 forbids clipping or horizontal scroll.
- **D-7** *Is a review truncated with "Read more"?* No. L2-018 asks for the review text, the design system shows none, and the 1,000-character limit keeps cards readable; paging is by review, not by text.
- **D-8** *Out-of-range stars?* Clamp to 1–5 and log in dev mode. L2-059 allows only 1–5, so another value is a data bug; clamping keeps the page rendering while the log surfaces it.
- **D-9** *Does the card set its own text colour?* Yes, `--color-fg-default`. `components.css` already adds it, which fixes the design-system note that a review on the stage would inherit paper text on a paper card.
- **D-10** *Do cards in a grid row stretch to the same height, as the design system says?* The list items do; the cards do not. With a reply or actions under some reviews and not others, stretching the card would push a reply away from the review it answers, or need subgrid across items of different shapes. The rendering shows the profile list: cards whose quotes are a similar length line up, and each reply stays attached to its card. The design-system page should say the items stretch, not the cards.
