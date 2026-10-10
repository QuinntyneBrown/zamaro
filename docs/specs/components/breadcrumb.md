# Breadcrumb

| Field | Value |
|---|---|
| Selector | `zm-breadcrumb` |
| Library path | `frontend/projects/components/src/lib/breadcrumb/` |
| Status | built |
| Traces to | L2-009, L2-012, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`breadcrumb.html`](../../design-system/components/breadcrumb.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/error`](../../mocks/pages/artist/error.html), [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html), [`pages/booking-detail/forbidden`](../../mocks/pages/booking-detail/forbidden.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/admin-artist/default`](../../mocks/pages/admin-artist/default.html), [`pages/admin-booking/default`](../../mocks/pages/admin-booking/default.html), [`pages/admin-checks/default`](../../mocks/pages/admin-checks/default.html), and the dialogs and toasts shown over them (see Usage) |
| Rendering | [`breadcrumb.html`](breadcrumb.html) |

## Purpose and scope

The breadcrumb says where a page sits and takes the person one level up. On a
profile its first crumb carries the search the booker came from, "Discover · Sat
14 Nov", and returns to that exact lineup; on a booking it reads "Your bookings
/ ZAM-0114"; in the admin app "Artists / Marcus Bell Trio". The last crumb is
the current page: plain bold text with `aria-current="page"`, never a link. A
trail of four or more levels collapses its middle behind a "…" button on
phones.

It sits above the page's `<h1>`: inside the poster on public pages (stage), and
at the top of the content on record pages (paper).

Use something else when:

- the page is a step in a sequence (request, pay) → [steps](steps.md);
- the person moves between sections of an account area → [sidebar navigation](sidebar-navigation.md) or [tabs](tabs.md);
- it is the only way back from an error → the page's own "Back to the lineup" [link](link.md) or [button](button.md) (L2-107), which the breadcrumb sits beside, not instead of.

Out of scope:

- Building the trail: which ancestors exist, their labels and the search
  parameters they carry. The page builds `crumbs` from its route and the
  carried search state (L2-009).
- Placeholder copy while the page loads ("Loading artist", "Loading") or fails
  ("Artist", "Booking not found"). The page passes that text as the last crumb.
- The page title, the `<h1>` and focus after navigation (L2-101 route-change
  focus is the shell's).
- Vertical spacing above and below the trail. The consumer sets it with the
  `page-crumbs` class on the host or the surrounding layout (D-3).

## Usage

The mocks render 112 breadcrumbs on 69 screens. Each row is one distinct
configuration; the API below builds every row.

| Where | Configuration | Crumbs | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default`, and the dialogs and toasts over a profile (`dialogs/photo-viewer`, `dialogs/report-review/*`, `notifications/share-toast/*`) | 2 crumbs in the poster | "Discover · Sat 14 Nov" → `/?date=2026-11-14&kind=worship-night&place=Burlington…` / "Abigail Mensah" | default, hover, focus, current; inert behind a dialog | stage |
| `pages/artist/loading` | 2 crumbs | "Discover · Sat 14 Nov" / "Loading artist" | loading copy in the current crumb | stage |
| `pages/artist/error` | 2 crumbs, kept above the error | "Discover · Sat 14 Nov" / "Artist" | error copy | stage |
| `pages/artist/empty`, `pages/artist/no-photos` | 2 crumbs, opened without a search date | "Discover" → `/` / "Miriam Haile" | default | stage |
| `pages/book/*`, `dialogs/add-church/*` | 3 crumbs, `page-crumbs` on the host | "Discover · Sat 14 Nov" / "Abigail Mensah" → `/artists/abigail-mensah?date=2026-11-14` / "Request to book" | default; "Loading" (`pages/book/loading`); "Request sent" (`pages/book/success`) | canvas (paper) |
| `pages/booking-detail/*` and the dialogs over a booking (`cancel-booking`, `pay-deposit`, `pay-balance`, `write-review`, `report-problem`, `withdraw-request`…) | 2 crumbs, `page-crumbs` | "Your bookings" → `/bookings` / "ZAM-0114" | default; "Booking not found" (`pages/booking-detail/forbidden`) | canvas |
| `pages/admin-application/*`, `dialogs/reject-application/*` | 2 crumbs, `page-crumbs` | "Applications" → `/admin/applications` / "Tobi Adeyemi" | default; "Loading" | canvas |
| `pages/admin-artist/*`, `dialogs/suspend-artist/*`, `dialogs/reinstate-artist/*` | 2 crumbs, `page-crumbs` | "Artists" → `/admin/artists` / "Marcus Bell Trio" | default; "Loading" | canvas |
| `pages/admin-booking/*`, `dialogs/issue-refund/*`, `dialogs/resolve-hold/*`, `dialogs/menu/admin` | 2 crumbs, `page-crumbs` | "Bookings" → `/admin/bookings` / "ZAM-0097" or "ZAM-0104" | default | canvas |
| `pages/admin-checks/*` | 2 crumbs inside the page head, no `page-crumbs` | "Artists" → `/admin/artists` / "Vulnerable Sector Checks" | default | canvas |
| Design system, collapsed | 5 crumbs, `moreLabel` | "Dashboard" / "Requests" / "ZAM-0114" / … / "Messages" | collapsed below MD, expanded | canvas |

## Anatomy

1. **Landmark** — `<nav aria-label="Breadcrumb">`, rendered by the component.
2. **List** — `<ol class="breadcrumb">`: a wrapping row in `--text-stub`,
   uppercase, items `--space-2` apart.
3. **Ancestor crumb** — `<li>` holding a router `<a>`. Underlined, inherits the
   surface's text colour.
4. **Separator** — `"/"` drawn by `li + li::before` with empty alternative text
   (`content: "/" / ""`), `--space-2` after it.
5. **Current crumb** — the last `<li>`, plain text, `--font-weight-bold`,
   `aria-current="page"`.
6. **More button (collapsed trails only)** — `<li class="breadcrumb__toggle">`
   holding `<button class="breadcrumb__more">…</button>`, after the first crumb.
7. **Middle crumbs (collapsed trails only)** — every crumb between the first and
   the last carries `.breadcrumb__middle`, hidden below MD until "…" is pressed.

Host: `zm-breadcrumb` is `display: block` and renders the `<nav>`. Classes the
consumer puts on the host (`page-crumbs`) stay on the host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `crumbs` | `readonly Crumb[]` | — | yes | Two or more, root first, current page last. Every crumb but the last needs `link`; in dev mode a missing one logs a console error naming the crumb. The last crumb's `link` is ignored. |
| `label` | `string` | — | yes | The landmark name, "Breadcrumb" from the catalogue (L2-111). |
| `moreLabel` | `string` | `''` | when `crumbs.length >= 4` | The "…" button's `aria-label`: "Show 2 more levels". The consumer formats it with the number of middle crumbs (`crumbs.length - 2`). In dev mode a missing one logs a console error. |

```ts
export interface Crumb {
  label: string;                         // "Discover · Sat 14 Nov", "ZAM-0114"
  link?: string | readonly unknown[];    // routerLink; omitted or ignored on the last crumb
  queryParams?: Params;                  // the carried search: { date: '2026-11-14', kind: 'worship-night', place: 'Burlington' }
  fragment?: string;
}
```

### Outputs

None. Ancestor crumbs are router links; the "…" button is handled inside the
component.

### Content slots

None. Every string arrives through `crumbs`, `label` and `moreLabel`.

## Variants and sizes

| Variant | Trigger | Use for |
|---|---|---|
| Stage | an `.on-stage` ancestor (the poster) | Public pages: the profile. Hover turns the link yellow. |
| Paper | no stage ancestor | Record pages: request form, booking, admin records. Hover lays the yellow highlighter behind the text. |
| Collapsed | four or more crumbs | Deep trails. Below MD the middle hides behind "…". |

The variant is not an input: the surface decides it (D-2). There is one size:
`--text-stub` type on items at least `--target-min` tall (`--target-comfortable`
under a coarse pointer). The width is the container's; the list wraps.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Underlined links, "/" separators, bold current crumb | Navigation landmark "Breadcrumb", list of N items |
| Hover, paper | `a:hover` | `--color-accent-subtle` behind the text | — |
| Hover, stage | `a:hover` inside `.on-stage` | Text `--color-accent-on-stage`, no background | — |
| Focus | `:focus-visible` | Two-tone ring: `--color-focus-ring` on paper; `--color-accent-on-stage` with a `--color-bg-stage` gap on the stage | — |
| Current | last crumb | `--font-weight-bold`, no underline, not a link | `aria-current="page"`; not a tab stop |
| Collapsed | `crumbs.length >= 4`, viewport below MD, not expanded | First crumb, "…" button, current crumb; middle crumbs `display: none` | Button "Show 2 more levels", `aria-expanded="false"`, `aria-controls` the list |
| Expanded | "…" pressed | Every crumb shows; the button's `<li>` is removed | Focus moves to the first revealed link |
| Inert | a dialog makes the page `inert` | No hover | Not reachable |

From MD the "…" button never shows and every crumb shows, so a collapsed trail
is a phone-only state.

## Markup

Two crumbs on the stage (the profile poster):

```html
<zm-breadcrumb>
  <nav aria-label="Breadcrumb">
    <ol class="breadcrumb">
      <li><a href="/?date=2026-11-14&amp;kind=worship-night&amp;place=Burlington">Discover · Sat 14 Nov</a></li>
      <li aria-current="page">Abigail Mensah</li>
    </ol>
  </nav>
</zm-breadcrumb>
```

Three crumbs on paper, with the consumer's spacing class on the host:

```html
<zm-breadcrumb class="page-crumbs">
  <nav aria-label="Breadcrumb">
    <ol class="breadcrumb">
      <li><a href="/?date=2026-11-14&amp;kind=worship-night&amp;place=Burlington">Discover · Sat 14 Nov</a></li>
      <li><a href="/artists/abigail-mensah?date=2026-11-14">Abigail Mensah</a></li>
      <li aria-current="page">Request to book</li>
    </ol>
  </nav>
</zm-breadcrumb>
```

Collapsed (five crumbs). Below MD the `.breadcrumb__middle` items are hidden by
the component's stylesheet; from MD the `.breadcrumb__toggle` item is:

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb breadcrumb--collapsible" id="zm-breadcrumb-1">
    <li><a href="/artist">Dashboard</a></li>
    <li class="breadcrumb__toggle"><button class="breadcrumb__more" type="button" aria-expanded="false" aria-controls="zm-breadcrumb-1" aria-label="Show 3 more levels">…</button></li>
    <li class="breadcrumb__middle"><a href="/artist/requests">Requests</a></li>
    <li class="breadcrumb__middle"><a href="/artist/bookings/ZAM-0114">ZAM-0114</a></li>
    <li class="breadcrumb__middle"><a href="/artist/bookings/ZAM-0114/thread">Thread</a></li>
    <li aria-current="page">Messages</li>
  </ol>
</nav>
```

Expanded: the `.breadcrumb__toggle` item is gone and the list keeps
`.breadcrumb--collapsible` with `.breadcrumb--expanded`, which shows the
middle at every width.

Consumer templates:

```html
<!-- profile poster -->
<zm-breadcrumb [crumbs]="crumbs()" [label]="'common.breadcrumb.label' | transloco" />

<!-- booking page -->
<zm-breadcrumb class="page-crumbs" [crumbs]="[{ label: 'bookings.title' | transloco, link: '/bookings' }, { label: booking().number }]" [label]="'common.breadcrumb.label' | transloco" />

<!-- deep trail -->
<zm-breadcrumb [crumbs]="trail()" [label]="'common.breadcrumb.label' | transloco"
  [moreLabel]="'common.breadcrumb.more' | transloco: { count: trail().length - 2 }" />
```

The `<nav>`, `.breadcrumb`, `aria-current="page"` and `.breadcrumb__more` are a
contract: page objects find the trail by its landmark name and read the
current crumb by `aria-current`. The separator is CSS and has no markup.

## Design

- List: `display: flex`, `flex-wrap: wrap`, `align-items: center`, gap
  `--space-2`, no list style, no padding or margin.
- Type `--text-stub`, uppercase by CSS (source copy is sentence case).
- Items `display: inline-flex`, `min-height: --target-min`;
  `--target-comfortable` under `pointer: coarse`.
- Separator: `li + li::before { content: "/"; content: "/" / ""; margin-right:
  var(--space-2) }`. The toggle item and hidden middle items keep the
  separator logic: a hidden item draws nothing, so exactly one "/" sits
  between two visible crumbs.
- Links `color: inherit`, underlined by the shared link rule (55 % of the text
  colour). Paper hover `--color-accent-subtle` background; stage hover
  `--color-accent-on-stage` text and no background (`:host-context(.on-stage)`).
- Current crumb `--font-weight-bold`.
- More button: `min-height: --target-min` (`--target-comfortable` under a coarse
  pointer), padding `0 --space-1`, no background or border, `color: inherit`,
  `font: inherit`, underlined, `cursor: pointer`.
- Collapse rule: below `--layout-breakpoint-md` (48 rem), `.breadcrumb--collapsible:not(.breadcrumb--expanded) .breadcrumb__middle { display: none }`; from MD, `.breadcrumb__toggle { display: none }`.
- No motion; no component tokens. Hover colours come from semantic tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Crumbs on the stage | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Hover on the stage, stage focus ring | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Stage focus gap | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Crumbs on paper | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Hover highlighter on paper | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Paper focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

The rendering shows the live resolved values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Crumbs in the poster |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Hovered crumb on the stage |
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Crumbs on paper |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Hovered crumb on its highlighter |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring on paper |
| `--color-accent-on-stage` | `--color-bg-stage` | 3:1 | Focus ring on the stage |

Under forced colours the links take `LinkText`, the current crumb `CanvasText`
and the focus ring `Highlight`; the separators stay visible because they are
text.

## Responsive behaviour

- The list wraps (`flex-wrap`); it never scrolls sideways. The two- and
  three-crumb trails in the mocks fit on one line at 360 px except "Discover ·
  Sat 14 Nov / Abigail Mensah / Request to book", which wraps after the second
  crumb at 320 px.
- When the list wraps, the "/" belongs to the crumb after it, so a wrapped line
  starts with "/ Abigail Mensah" (as the 320 px and matrix renderings show).
  That keeps each separator attached to the level it introduces (D-9).
- A long crumb ("Grace Tabernacle Mass Choir", "Vulnerable Sector Checks")
  wraps inside its item at word boundaries; a word wider than the line breaks
  inside the word (`overflow-wrap: anywhere` on the list). The current crumb
  is never truncated.
- Below MD (768 px) a trail of four or more crumbs shows the first crumb, "…"
  and the current crumb. From MD every crumb shows, wrapping if needed (D-5).
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom the trail
  wraps and stays usable; under a coarse pointer every crumb and the "…" button
  are at least 44 px tall.

## Accessibility

### Role and pattern

[APG Breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/):
a `<nav>` landmark named by `label`, an ordered list of links, and
`aria-current="page"` on the last item. The "…" button follows the
[APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
(`aria-expanded`, `aria-controls`). Only one landmark per page is named
"Breadcrumb".

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the ancestor links and the "…" button. The current crumb is not a stop. Hidden middle crumbs are skipped. |
| <kbd>Enter</kbd> | Follows a link; on "…", reveals the middle crumbs. |
| <kbd>Space</kbd> | On "…", reveals the middle crumbs. |

### Focus

The shared two-tone ring, drawn outside the link and never clipped. After "…"
is pressed, its item is removed and focus moves to the first revealed crumb
link ("Requests"), so focus never falls to `<body>`. When `crumbs` changes
(navigation to another record), the trail collapses again.

### Labelling

- The landmark name is `label` ("Breadcrumb").
- Each link's name is its visible label, so "Discover · Sat 14 Nov" says where
  it goes and for which date (L2-012).
- The separators are not announced (`content: "/" / ""`).
- The "…" button's name is `moreLabel` ("Show 3 more levels"); an ellipsis
  alone means nothing read aloud.

### Announcements

None. Revealing the middle crumbs moves focus, which announces the first one.

### Motion

None. Hover and reveal are instant, so `prefers-reduced-motion` changes
nothing.

## Content and internationalisation

- Each crumb is the title of the page it opens, shortened: "Your bookings",
  "Applications", "Artists", "Bookings".
- The first crumb on a profile carries the search date with a middle dot:
  "Discover · Sat 14 Nov" (short date, L2-110 form, formatted before it reaches
  the component). Without a search date it reads "Discover" (L2-012).
- The current crumb names the page: the artist ("Abigail Mensah"), the booking
  number ("ZAM-0114"), the applicant ("Tobi Adeyemi"), the action ("Request to
  book"). While loading or after a failure the page passes "Loading artist",
  "Loading", "Artist" or "Booking not found".
- Sentence case in the source; `--text-stub` uppercases it.
- Translatable inputs: `label`, `moreLabel`, and the labels of fixed ancestors
  ("Discover", "Your bookings", "Request to book"). Data values: artist names,
  booking numbers, applicant names. French labels run about 30 % longer and
  wrap.

## Performance

- Change detection: `OnPush`, signal inputs. `collapsible` (`crumbs().length >= 4`)
  and `expanded` are a `computed` and a `signal`; no `effect`, no subscriptions,
  no `BreakpointObserver`: the collapse is CSS, so the server renders the final
  layout.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Breadcrumb.ts`
  renders the profile trail "Discover · Sat 14 Nov / Abigail Mensah" with the
  search in `queryParams`. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: none (one per page, not repeated).
- Layout stability: the trail is in the server-rendered HTML with its final
  labels; the loading crumb ("Loading artist") is replaced by the name on the
  same line, and the collapse never toggles after hydration, so the trail
  causes no layout shift (L2-086).
- Imports: `RouterLink` only.

## Acceptance criteria

### Rendering

- **AC-1** Given a profile opened from Naomi's search for Sat 14 Nov, when the breadcrumb renders, then it reads "Discover · Sat 14 Nov / Abigail Mensah", the first crumb is a link and "Abigail Mensah" is plain text with `aria-current="page"`. (L2-012)
- **AC-2** Given that first crumb has `queryParams` `{ date: '2026-11-14', kind: 'worship-night', place: 'Burlington' }`, when it is activated, then the router opens `/?date=2026-11-14&kind=worship-night&place=Burlington` and Discover shows the same inputs and results. (L2-009)
- **AC-3** Given Miriam Haile's profile opened from a shared link without a search date, when the breadcrumb renders, then the first crumb reads "Discover" and links to `/` with no query string. (L2-012)
- **AC-4** Given the request page's three crumbs, when it renders, then it reads "Discover · Sat 14 Nov / Abigail Mensah / Request to book", the first two are links and exactly two "/" separators are drawn. (L2-012)
- **AC-5** Given any trail, when it renders, then the host contains one `<nav>` named by `label` ("Breadcrumb") holding one `<ol class="breadcrumb">`, and the last `<li>` has no link even when its crumb has `link` set. (L2-102)
- **AC-6** Given `class="page-crumbs"` on the host of Naomi's booking trail "Your bookings / ZAM-0114", when it renders, then the class stays on `zm-breadcrumb` and the trail sits on the canvas with paper colours. (L2-104)

### States

- **AC-7** Given the stage trail in the poster, when a pointer hovers "Discover · Sat 14 Nov", then its text turns `--color-accent-on-stage` with no background; given the paper trail, when "Your bookings" is hovered, then `--color-accent-subtle` sits behind the text. (L2-104)
- **AC-8** Given a five-crumb trail with `moreLabel` "Show 3 more levels" at 360 px, when it renders, then it shows "Dashboard", a "…" button and "Messages", the three middle crumbs are not displayed, and exactly two separators are visible. (L2-096)
- **AC-9** Given that collapsed trail, when "…" is activated with Enter or Space, then the three middle crumbs appear in place, the button is removed, and focus is on the "Requests" link. (L2-101)
- **AC-10** Given the same five-crumb trail at 768 px or wider, when it renders, then every crumb shows and no "…" button is displayed or focusable. (L2-096)
- **AC-11** Given an expanded trail, when `crumbs` changes to another record's five-crumb trail, then it renders collapsed again below MD. (L2-096)

### Keyboard and focus

- **AC-12** Given the request page's trail, when the booker tabs through it, then focus visits "Discover · Sat 14 Nov" then "Abigail Mensah" and skips "Request to book". (L2-101)
- **AC-13** Given keyboard focus on a stage crumb, when it is focused, then the ring is `--color-accent-on-stage` with a `--color-bg-stage` gap; on a paper crumb, the ring is `--color-focus-ring` over a `--color-focus-ring-offset` gap; neither is clipped. (L2-101)

### Screen readers

- **AC-14** Given the profile trail, when it is read by a screen reader, then it is announced as a navigation landmark "Breadcrumb" with a list of 2 items, "Discover · Sat 14 Nov, link" and "Abigail Mensah, current page", and no "slash" is read. (L2-102)
- **AC-15** Given a collapsed trail, when the "…" button is read, then it is announced as "Show 3 more levels, button, collapsed". (L2-102)
- **AC-16** Given every mocked trail (stage, paper, collapsed) in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the dark theme, when the stage trail renders, then it looks the same as in light (`--color-fg-on-stage` on `--color-bg-stage`); when the paper trail renders, then crumbs are `--color-fg-default` on the dark canvas and the hover highlighter is the dark `--color-accent-subtle`. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then crumbs on the stage and on paper, hovered crumbs and the hovered highlighter pair are at least 4.5:1, and both focus rings at least 3:1. (L2-103)

### Responsive

- **AC-19** Given a 320 px viewport, when "Discover · Sat 14 Nov / Abigail Mensah / Request to book" renders, then it wraps onto a second line, nothing is clipped or truncated, and the page does not scroll horizontally. (L2-096)
- **AC-20** Given a coarse pointer, when a crumb link or the "…" button is measured, then its target is at least 44 × 44 CSS px including its item's height. (L2-096)
- **AC-21** Given the French catalogue, when "Your bookings" and "Request to book" are about 30 % longer, then the trail wraps within its container without clipping. (L2-111)

### Performance

- **AC-22** Given the `Breadcrumb` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-breadcrumb` with `crumbs` and `label`. To meet this CRD:

- Make `label` required and drop the English default `'Breadcrumb'`; the
  consumer passes the catalogue string (L2-111). The artist page already does.
- Widen `Crumb.link` to `string | readonly unknown[]` and add `fragment`.
- Log a dev-mode console error for a non-last crumb without `link`, instead of
  silently rendering it as text.
- Add the collapsed form: `moreLabel` input, `.breadcrumb--collapsible` and
  `.breadcrumb--expanded` on the list, `.breadcrumb__middle` on middle items, the
  `.breadcrumb__toggle` item with the `.breadcrumb__more` button, a unique list
  `id` for `aria-controls`, the MD media rules, focus to the first revealed link
  after render (`afterNextRender`), and reset of `expanded` when `crumbs`
  changes.
- Add `:host { display: block }` so `page-crumbs` spacing applies to the host.
- Add the coarse-pointer rule raising `li` and `.breadcrumb__more` to
  `--target-comfortable`, and `overflow-wrap: anywhere` on the list.
- Add forced-colours fallbacks only if the shared reset does not already map
  links and the ring.
- The `Breadcrumb` scenario already renders the cast's profile trail; keep it.
- Ask the design system to document `.breadcrumb--collapsible`,
  `.breadcrumb__middle` and `.breadcrumb__toggle` (D-4), and the coarse-pointer
  `.breadcrumb__more` rule it already lists.

## Decisions

- **D-1** *Can the last crumb be a link?* No. The component never renders a link for the last crumb, even if `link` is set, so a page cannot accidentally link to itself (design system: "plain text, never a link"). Ignoring rather than rejecting lets a page build every crumb the same way.
- **D-2** *Stage or paper: an input or the surface?* The surface. The trail inherits its colours and reads `:host-context(.on-stage)` for the stage hover, as the built code does. Every mock trail already sits on the right surface, and an input could disagree with it.
- **D-3** *Who owns the `.page-crumbs` spacing, which the mocks put on the `<nav>`?* The consumer, as a class on the host. The component renders the `<nav>` and `:host` is a block, so `class="page-crumbs"` on `zm-breadcrumb` gives the same spacing; `pages/admin-checks` puts the trail inside its page head with no class, which the same API covers. Spacing around a component is the parent's layout (AGENTS.md: global styles are foundations and layout utilities).
- **D-4** *The design system hides collapsed crumbs with the `hidden` attribute and shows "…" at every width below 768 px. How is the breakpoint applied without a flash?* With CSS: a `.breadcrumb--collapsible` list hides `.breadcrumb__middle` items below MD until expanded, and hides `.breadcrumb__toggle` from MD. A `hidden` attribute set from a breakpoint observer would render the full trail on the server and collapse it after hydration, which shifts the page (L2-086). The visible result is the design system's; the class names are new and recorded for the design system to adopt.
- **D-5** *The design system says the full trail shows from 768 px "unless it would wrap". Is that measured?* No. From MD every crumb shows and the list wraps, as the responsive rules allow. Measuring the trail after render would reintroduce the post-hydration shift D-4 avoids, and no mock has a trail of four or more levels.
- **D-6** *How many crumbs make a trail collapsible?* Four or more, as the design system states. The first and the current crumb always show; every crumb between them is a middle crumb.
- **D-7** *Where does the "…" count come from, and how is it worded?* The consumer formats `moreLabel` from the catalogue with the middle count, `crumbs.length - 2` ("Show 3 more levels"). The component has no copy of its own (L2-111), and plural rules belong to the catalogue.
- **D-8** *What happens to the expanded state on navigation?* It resets when `crumbs` changes. A new record has a new trail; carrying "expanded" over would show a long trail on a phone the person never asked to expand.
- **D-9** *When the trail wraps, may a line end with a dangling "/"?* No. The separator is the next item's `::before`, so it always moves with the crumb it introduces and a wrapped line starts with "/". The rendering showed this at 320 px; it reads as "and then", and a trailing slash would read as a missing crumb.
- **D-10** *Does the loading or error trail need its own state?* No. The page passes placeholder text ("Loading artist", "Artist") as the current crumb, as every loading and error mock does. The first crumb still carries the search, so the way back works while the profile loads or fails.
