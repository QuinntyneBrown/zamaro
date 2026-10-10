# Band

| Field | Value |
|---|---|
| Selector | `zm-band` |
| Library path | `frontend/projects/components/src/lib/band/` |
| Status | planned |
| Traces to | L2-047, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111, L2-112 |
| Design system | [`band.html`](../../design-system/components/band.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/discover/empty`](../../mocks/pages/discover/empty.html), [`pages/discover/error`](../../mocks/pages/discover/error.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/discover/limited`](../../mocks/pages/discover/limited.html) |
| Rendering | [`band.html`](band.html) |

## Purpose and scope

The band is the yellow strip near the end of a page that asks a second audience
to act. On Discover the page is for bookers, and the band speaks to worship
leaders: "For artists · Lead worship? Get on the bill." with one action, "Apply
as an artist". It is a yellow panel with a 4 px ink frame: an overline, a
headline, one or two sentences of terms, and one action, which sits beside the
copy from 992 px.

Use something else when:

- it is the page's main action ("Show the lineup") → a primary [button](button.md);
- it is system news, a warning or an outage → [alert](alert.md) (banner);
- it is decoration with no action → [marquee](marquee.md);
- it is the end of the page's chrome → [footer](footer.md).

Out of scope:

- The landmark around the band: the page's `<section id="join" class="section"
  aria-labelledby="join-title">` and its `.container`. The header's "For
  artists" link targets that section's `id` (`/#join`), so the page owns it
  (D-1).
- The action's own behaviour, states and re-skin rules. The action is a
  projected [`zm-button-link`](button.md) (or a projected form with a
  `zm-button`); the button CRD owns its markup, busy state and the `.band`
  surface mapping. The band only provides the surface it reads.
- Any in-place form's validation and submission (a "Notify me" form). The page
  owns the form; the band gives it the action column.
- Where the band sits in the page and how often: once per page, after the main
  content and before the footer, is a page rule from the design system.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` `#join` | kicker "For artists", title "Lead worship? Get on the bill.", `headingId` "join-title" | body: "Your dates, your radius, your rate. Free to join; Zamaro keeps 8% when a church books you."; action: `zm-button-link` secondary lg "Apply as an artist" + trailing arrow to `/artists/apply` | default; action hover, focus, active | canvas, inside the page's `section.section` > `.container` |
| `pages/discover/loading`, `empty`, `error`, `invalid`, `limited` | as default, unchanged in every lineup state | as default | default | canvas |
| Dialogs and notifications over Discover (`dialogs/menu/default`, `dialogs/account-menu/default`, `notifications/saved-toast/*`, `notifications/system-banner/*`) | as default | as default | inert behind the dialog; unchanged under a toast or banner | canvas |
| Header "For artists" (`pages/discover/*` top bar) | link to `default.html#join` | — | the band's section is the scroll target | — |
| Design system, with a text link | as default | body ends with an inline link "See what artists earn" | link default, hover (paper highlight), focus | canvas |
| Design system, on the stage | kicker "For churches", title "Booking for Christmas Eve?" | body: "Most choirs fill up by mid-November. Save the date now and we'll tell you who's free."; action: "Start a Christmas search" (no arrow) | default | stage (`.on-stage` ancestor) |
| Design system, in-place form | as default with a projected `<form>` | action: `zm-button` secondary lg `type="submit"` "Notify me", busy "Sending…" | default, busy | canvas |

Every row is buildable with the API below: copy arrives as two inputs plus the
body slot, and the action column takes either a link button or a form.

## Anatomy

1. **Band** — the host, `.band`: yellow fill, ink text, 4 px ink frame; a grid
   of the copy and the action.
2. **Copy** — `.stack` (first grid cell): overline, headline and body, `--space-4`
   apart.
3. **Overline** — `p.overline`: the audience, "For artists". Mono, uppercase.
4. **Headline** — `h2` with `id` = `headingId`: `--text-h1`, uppercase, balanced
   wrapping. It names the page's section landmark.
5. **Body** — the default slot, inside the stack after the headline: one or two
   `<p>` with the terms, optionally one inline link.
6. **Action** — the `[slot=action]` content, the second grid cell: a large link
   button re-skinned as the charcoal stage button, or a small form whose submit
   button gets the same skin.

Host: `zm-band` is the band itself. It carries the class `band`, so
`components.css` and the e2e page objects see `.band` exactly as in the
mock. It renders the `.stack` and projects the action directly after it. It
never renders the `<section>` or `.container` (D-1).

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | The overline: "For artists", "For churches". |
| `title` | `string` | — | yes | The headline text: "Lead worship? Get on the bill." Rendered as an `h2`. |
| `headingId` | `string` | — | yes | The headline's `id`. The page's `<section>` points `aria-labelledby` at it ("join-title"). |

All three are signal inputs and carry copy from the translation catalogue
(L2-111); the component holds no strings of its own.

### Outputs

None. The band has no behaviour: navigation belongs to the projected link
button and submission to the projected form.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | one or two `<p>` of body copy, which may contain one inline `<a>` (`routerLink`) | Rendered inside `.stack` after the headline. Inline links inherit ink and highlight paper on hover (`.band a:not(.btn)`). |
| `[slot=action]` | one `zm-button-link` (`size="lg"`, default variant) or one `<form>` holding a `zm-button` `type="submit"` `size="lg"` | Rendered as the band's second grid cell. Any `.btn` inside the band takes the stage skin whatever its `variant`. |

Each slot is declared once in the template; no `@if` wraps either slot.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Call to action (default) | — | A second audience's one action: "Apply as an artist". |
| With a text link | — (content) | A "learn more" link inside the body, beside the main action. |
| On the stage | — (an `.on-stage` ancestor) | A band placed on a charcoal page. It looks the same; only its surroundings change (D-4). |
| In-place form | — (content) | A band that submits without leaving the page, such as "Notify me". |

The variants are content, not modifiers: the band has no modifier classes.

The band has one size: it fills its container. Padding is `--space-10` block
and `--space-8` inline below 992 px, and `--space-12` all round from 992 px.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Yellow `--color-accent` panel, `--color-border-on-accent` frame, ink text | A region named by the headline (from the page's section) with a heading level 2 |
| Action hover | `.btn:hover` | The stage button lifts by `--transform-lift` over a hard `--color-fg-on-stage` (paper) shadow offset by `--size-offset-2` | — |
| Action active | `.btn:active` | Pressed flat, no shadow (button CRD) | — |
| Action focus | `:focus-visible` | 3 px ring in `--color-border-on-accent` (ink), never the yellow stage ring | — |
| Action busy | projected `zm-button` `busy` | Spinner after the label; stage colours kept | `aria-busy="true"`, `aria-disabled="true"`; name kept |
| Text link hover | `a:not(.btn):hover` | Paper highlight (`--color-fg-on-stage`) behind ink text, in both themes | — |
| Text link focus | `a:not(.btn):focus-visible` | Ink ring, as the action | — |
| On the stage | `.on-stage` ancestor | Identical to default: the band's own text, link and button rules win over the stage's | Unchanged |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |
| Loading, empty, error | the page's lineup state | None: the band is static copy and renders unchanged in every Discover state | Unchanged |
| Forced colours | `forced-colors: active` | Fill and text become system colours; the frame stays as a system border; the focus ring uses `Highlight` | Unchanged |

## Markup

Rendered by `zm-band` inside the page's section:

```html
<section id="join" class="section" aria-labelledby="join-title">
  <div class="container">
    <zm-band class="band">
      <div class="stack">
        <p class="overline">For artists</p>
        <h2 id="join-title">Lead worship? Get on the bill.</h2>
        <p>Your dates, your radius, your rate. Free to join; Zamaro keeps 8% when a church books you.</p>
      </div>
      <zm-button-link><a class="btn btn--lg" href="/artists/apply">Apply as an artist <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">…</svg></a></zm-button-link>
    </zm-band>
  </div>
</section>
```

With a text link in the body (the link is part of the projected paragraph):

```html
<p>Your dates, your radius, your rate. Free to join; Zamaro keeps 8% when a church books you. <a href="/artists/earnings-explained">See what artists earn</a>.</p>
```

In-place form, busy:

```html
<form class="cluster" novalidate>
  <zm-button><button class="btn btn--lg" type="submit" aria-busy="true" aria-disabled="true">Sending…</button></zm-button>
</form>
```

Consumer templates:

```html
<section id="join" class="section" aria-labelledby="join-title">
  <div class="container">
    <zm-band headingId="join-title" [kicker]="'discover.join.kicker' | transloco" [title]="'discover.join.title' | transloco">
      <p>{{ 'discover.join.body' | transloco }}</p>
      <zm-button-link slot="action" size="lg" link="/artists/apply">
        {{ 'discover.join.apply' | transloco }} <zm-icon name="arrow-right" />
      </zm-button-link>
    </zm-band>
  </div>
</section>
```

```html
<zm-band headingId="christmas-title" [kicker]="'band.forChurches' | transloco" [title]="'band.christmas.title' | transloco">
  <p>{{ 'band.christmas.body' | transloco }}</p>
  <form slot="action" (ngSubmit)="notify()">
    <zm-button type="submit" size="lg" [busy]="sending()">{{ (sending() ? 'band.notify.busy' : 'band.notify.label') | transloco }}</zm-button>
  </form>
</zm-band>
```

The `.band` class on the host, the `.stack` > `.overline` + `h2` structure and
the `id` on the headline are a contract: the e2e page objects find the band by
its heading and the header link by its fragment. The internal order of body
paragraphs is free.

## Design

- Grid, gap `--space-6`, items centred. Below 992 px one column: copy then
  action, the action left-aligned. From `--layout-breakpoint-lg` (992 px):
  `minmax(0, 1fr) auto`, gap `--space-10`, the action vertically centred on the
  right.
- Padding `--space-10` `--space-8` below 992 px; `--space-12` from 992 px.
- Frame `--border-width-poster` solid `--color-border-on-accent`; square
  corners; no shadow.
- Overline `.overline`: `--text-overline`, `--letter-spacing-stamp`,
  uppercase.
- Headline `--text-h1` (48–88 px through `clamp()`), uppercase, `text-wrap:
  balance`, `overflow-wrap: break-word`.
- Inline links: ink, underlined; hover fills `--color-fg-on-stage` behind them.
- Body: body type, `max-width: var(--layout-measure)`, `text-wrap: pretty`.
- Action: `size="lg"`, so `--control-height-lg` (56 px) high with `--space-6`
  side padding. Its label wraps in balanced lines when the column is narrower
  than the label, and the button grows taller rather than overflowing (D-6).
- Motion: only the action moves (lift over `--duration-fast` with
  `--ease-standard`, button CRD). The band never animates in.

Component tokens: the band declares none of its own. It re-skins every button
inside it by overriding the button's component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--btn-bg` | `--color-bg-stage` | `.band .btn` |
| `--btn-fg` | `--color-fg-on-stage` | `.band .btn` |
| `--btn-border` | `--color-bg-stage` | `.band .btn` |
| `--btn-shadow-hover` | `--size-offset-2` `--size-offset-2` 0 `--color-fg-on-stage` | `.band .btn` |
| focus `outline-color` | `--color-border-on-accent` | `.band :focus-visible` |

These band rules take precedence over the `.on-stage` button and link rules
when a band sits on the stage (D-4).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Text (overline, headline, body, links) | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Frame, focus ring | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Action fill | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Action label, hover shadow | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Link hover highlight | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |

The band is the same in both themes except the action fill, which is a
slightly deeper charcoal in dark. The body link's hover highlight reads
`--color-fg-on-stage` (paper in both themes), not `--color-bg-surface`, which is
charcoal in the dark theme and would put ink text on charcoal (D-5).

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Overline, headline, body and link text |
| `--color-fg-on-accent` | `--color-fg-on-stage` | 4.5:1 | Link text on its hover highlight |
| `--color-border-on-accent` | `--color-accent` | 3:1 | Frame and focus ring on the band |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Action label |
| `--color-bg-stage` | `--color-accent` | 3:1 | Action edge against the band |
| `--color-border-on-accent` | `--color-bg-canvas` | 3:1 | Band frame against the light page |
| `--color-accent` | `--color-bg-canvas` | 3:1 | Band against the dark page |

In forced-colours mode the system replaces the fill and text, the frame stays
as a system border and the focus ring uses `Highlight` (tokens.css).

## Responsive behaviour

- **Below LG (< 992 px)**: one column. Copy first, then the action, left-aligned
  under the body. Padding `--space-10` block, `--space-8` inline.
- **LG and up (≥ 992 px)**: two columns. The copy takes the remaining width and
  the action sits on the right, vertically centred, `--space-10` away. Padding
  `--space-12`.
- The headline wraps in balanced lines and never truncates. A single word wider
  than the column breaks (`overflow-wrap: break-word`).
- At 360 px the band leaves about 256 px for the action and at 320 px about
  208 px. At both widths "Apply as an artist" with its arrow wraps onto two
  balanced lines ("Apply as / an artist"); the button grows taller and nothing
  overflows the band or the page (D-6). The design-system page's claim that it
  fits on one line at 360 px does not hold with the large size's type.
- At 200 % zoom the copy and the action stack, everything stays visible and
  reachable.
- Touch: the large action is 56 px tall, wider than 44 px. An inline body link
  is at least 24 px tall through its line height and is never the only way to
  act.

## Accessibility

### Role and pattern

The page's `<section aria-labelledby="{headingId}">` makes the band a region
landmark named by its headline, "Lead worship? Get on the bill." The band
itself is a plain element with no role. The headline is an `h2` under the
page's single `h1`. The action goes to another page, so it is a link styled as
a button (`zm-button-link`), never a `<button>`; only an in-place form uses a
real submit button. No APG widget pattern applies.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to the body link (if any), then the action, in reading order. |
| <kbd>Enter</kbd> | Follows the link; submits an in-place form. |
| <kbd>Space</kbd> | Activates a submit button. |

### Focus

Inside the band the 3 px ring is ink (`--color-border-on-accent`), at least 3:1
against the yellow; the yellow stage ring would vanish. The ring sits
`--focus-ring-offset` outside the action, on the yellow. Nothing in the band
clips it (no `overflow: hidden`). Following the header's "For artists" link
moves to the section (`/#join`) without moving focus into the band.

### Labelling

- The visible text is each control's accessible name: "Apply as an artist".
  The arrow is `aria-hidden`.
- Two links in one band must have different text ("See what artists earn" and
  "Apply as an artist").
- The overline is plain text read before the headline; it is not part of the
  landmark name.

### Announcements

None from the band. A projected form announces its own result through the
page's toast or status region.

### Motion

The action's lift takes `--duration-fast` and drops to near zero under
`prefers-reduced-motion: reduce`. The band itself never moves or animates in.

## Content and internationalisation

- **Overline**: the audience: "For artists", "For churches".
- **Headline**: a question the reader answers yes to, then the offer, in poster
  voice, under eight words: "Lead worship? Get on the bill."
- **Body**: the terms in plain numbers, one or two sentences: "Free to join;
  Zamaro keeps 8% when a church books you." Percentages are written with the
  digit and "%".
- **Action**: verb first, three or four words: "Apply as an artist". A trailing
  arrow means it goes to another page; an in-place action has none ("Notify
  me", busy "Sending…").
- Every string is copy from the translation catalogue (L2-111); the band holds no
  data values. French runs about 30 % longer: the headline wraps to more lines
  and the action label wraps inside the button, and nothing clips.

## Performance

- Change detection: `OnPush`, three signal inputs, no computed values, no
  subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Band.ts`
  renders the Discover band ("For artists", "Lead worship? Get on the bill.",
  the 8% body and a `zm-button-link` "Apply as an artist" with the arrow).
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep it at
  roughly 100–300 ms.
- Composite scenarios: `DarkTheme` once it includes the Discover page's lower
  sections; none today.
- Layout stability: the band is static, server-rendered copy with no images or
  late content, so it never shifts the page (L2-086).
- Server rendering: the band renders fully on the server, so Discover's HTML
  holds its copy and link (L2-112).
- Imports: Angular core only. Buttons, icons and forms arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given the Discover band with `kicker` "For artists", `title` "Lead worship? Get on the bill.", the 8% body and an "Apply as an artist" action, when it renders, then the host has the class `band` and contains, in order, `p.overline` "For artists", an `h2` "Lead worship? Get on the bill.", the body paragraph and the action link. (L2-111)
- **AC-2** Given `headingId` "join-title" and the page's `<section aria-labelledby="join-title">`, when the accessibility tree is read, then the section is a region named "Lead worship? Get on the bill." and the headline is a level-2 heading, so the page keeps its single `h1`. (L2-102)
- **AC-3** Given the band's "Apply as an artist" action, when a visitor activates it, then they navigate to `/artists/apply`, the artist application. (L2-047)
- **AC-4** Given the action is a `zm-button-link` with the default variant, when it renders inside the band, then its `.btn` has the `--color-bg-stage` fill, a `--color-fg-on-stage` label and a `--color-bg-stage` rule. (L2-104)
- **AC-5** Given a body paragraph ending with the link "See what artists earn", when it renders, then the link is ink, and on hover in either theme it gets the paper `--color-fg-on-stage` highlight with ink text at a contrast of at least 4.5:1. (L2-103)
- **AC-6** Given Discover in its loading, empty, error, invalid and limited states, when each renders, then the band is present and identical to the default state. (L2-096)
- **AC-7** Given Discover requested by a crawler, when the server response arrives, then the band's overline, headline, body and the `/artists/apply` link are in the server-rendered HTML. (L2-112)

### States

- **AC-8** Given a pointer over the action, when it hovers, then the stage button lifts by `--transform-lift` over a hard paper shadow offset by `--size-offset-2`, and the band itself does not move. (L2-104)
- **AC-9** Given an in-place "Notify me" form in the action slot, when it is submitted and the request is pending, then the button reads "Sending…", has `aria-busy="true"` and `aria-disabled="true"`, keeps the stage colours, and a second press sends nothing. (L2-108)
- **AC-10** Given a band inside an `.on-stage` ancestor ("For churches", "Booking for Christmas Eve?", "Start a Christmas search"), when it renders, then the action keeps the solid stage fill rather than the stage's paper outline, the body link hover keeps ink text, and the band looks the same as on the canvas. (L2-103)

### Keyboard and focus

- **AC-11** Given a band with a body link and an action, when a keyboard user tabs through it, then focus moves to "See what artists earn" and then to "Apply as an artist". (L2-101)
- **AC-12** Given keyboard focus on the action or the body link, when it is focused, then the ring is drawn in `--color-border-on-accent` (ink), not the stage yellow, and is not clipped. (L2-101)

### Screen readers

- **AC-13** Given the action with its trailing arrow, when it is read by a screen reader, then it is announced as a link named "Apply as an artist", with nothing read for the arrow. (L2-102)
- **AC-14** Given Discover with the band in both themes, when axe-core runs, then the band contributes zero serious or critical violations. (L2-100)

### Theming

- **AC-15** Given the light and dark themes, when the band renders, then its fill, text and frame read `--color-accent`, `--color-fg-on-accent` and `--color-border-on-accent` and are the same in both themes. (L2-104)
- **AC-16** Given both themes, when contrast is measured, then band text is at least 4.5:1 on the yellow, the action label at least 4.5:1 on the stage fill, the focus ring at least 3:1 on the yellow, and the band's edge at least 3:1 against the page. (L2-103)

### Responsive

- **AC-17** Given a viewport narrower than 992 px, when the band renders, then the action sits below the copy, left-aligned, with `--space-10` block and `--space-8` inline padding. (L2-096)
- **AC-18** Given a viewport of 992 px or wider, when the band renders, then the copy and the action sit side by side with the action vertically centred on the right, and the padding is `--space-12`. (L2-096)
- **AC-19** Given a 320 px or 360 px viewport, when the band renders, then the headline wraps at word boundaries, "Apply as an artist" wraps inside the button onto balanced lines, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-20** Given a touch device, when the action is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-21** Given the French catalogue, when the headline, body and action are about 30 % longer, then they wrap inside the band without clipping and the action stays fully visible. (L2-111)

### Motion

- **AC-22** Given `prefers-reduced-motion: reduce`, when the action is hovered, then it moves to its lifted position without a transition, and the band never animates in. (L2-103)

### Performance

- **AC-23** Given the `Band` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned window. (L2-086)

## Implementation notes

The component is planned. To build it:

- Folder `frontend/projects/components/src/lib/band/`: `band.ts` (class `Band`,
  selector `zm-band`), `band.html`, `band.scss`. Export it from
  `public-api.ts`.
- Host binding `class: 'band'`. The template is one `.stack` (overline,
  `<h2 [id]="headingId()">`, `<ng-content />`) followed by
  `<ng-content select="[slot=action]" />`. No `@if` around either slot.
- `band.scss` carries the `.band` rules from `components.css` on `:host`, the
  `h2` type, the inline link colour and its `--color-fg-on-stage` hover (D-5),
  and the LG grid.
- The `.btn` re-skin and the focus-ring colour must reach the projected button,
  which is encapsulated in its own component. Per the button CRD, the button
  reads its surface with `:host-context(.band)`; the band does not use
  `::ng-deep`. That mapping must be ordered or specified so the band's mapping
  beats the `.on-stage` mapping when both contexts match (D-4): the button CRD
  lists the surface rules, and the band rule comes after the stage rule with at
  least the same specificity.
- Likewise `.band a:not(.btn)` and its hover beat the stage's link rules
  (`:is(.on-stage, .topbar) a:not(.btn)`), which today would turn a band link
  yellow-on-yellow on hover; the design-system stylesheet needs the same fix
  (D-4).
- Add the perf-test scenario `Band.ts` and export it from `scenarios/index.ts`.
- Composes nothing; it imports only Angular core.

## Decisions

- **D-1** *Does `zm-band` render the `<section>` landmark, or does the page?* The page. The section is the target of the header's "For artists" link (`#join`), it carries the page's section padding and `.container`, and it is labelled by the band's headline through `headingId`. Keeping landmarks and anchors in the page matches the ticket's list rule (ticket D-1) and lets the band sit in any section without a nested landmark.
- **D-2** *Should the heading level be an input?* No; it is always an `h2`. The band is used once per page, after the main content, as its own top-level section under the page `h1` (design system), and `components.css` styles `.band h2`. An input with one used value would only invite a broken outline.
- **D-3** *Inputs or slots for the copy?* The overline and headline are inputs, because they are always plain text and the headline needs the `id`. The body is the default slot, because the "With a text link" variant puts a router link inside the sentence, which an input cannot carry.
- **D-4** *What happens when a band sits on the stage?* The band wins: its button, link and focus rules take precedence over the `.on-stage` rules, so the band looks the same anywhere. The design-system page says "The band keeps its ink frame and stage button on a charcoal page", but with today's selectors `.on-stage .btn:not(.btn--primary):not([aria-pressed="true"])` outranks `.band .btn` and draws a paper-outlined button with paper text on yellow, and the stage link hover turns band links yellow. The rendering shows the intended result; the selectors are an implementation fix, not a design change.
- **D-5** *Which highlight does a body link use on hover?* Paper in both themes, read from `--color-fg-on-stage`. The design system specifies `--color-bg-surface`, which is paper in light but charcoal in dark, so in the dark theme the hover would put ink text (`--color-fg-on-accent`, the same in both themes) on charcoal, below 4.5:1 and contrary to L2-103. `--color-fg-on-stage` is the role token that is paper in both themes, so the band keeps its "identical in both themes" rule. The design-system page should adopt the same token.
- **D-6** *What does the action do when its label is wider than the column?* It wraps onto balanced lines inside the button and the button grows taller (`text-wrap: balance` on `.btn`, the height token is a minimum). Shrinking the size would break the one-size rule, and truncating is forbidden by L2-096. The rendering shows "Apply as an artist" already takes two lines at 360 px as well as 320 px, not one as the design-system page says; the design system advises three or four words, which keeps it to two lines.
- **D-7** *Does the band have a loading or error state?* No. It is static copy from the catalogue, and the Discover mocks render it unchanged in loading, empty, error, invalid and limited.
