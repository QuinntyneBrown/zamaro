# Skip link

| Field | Value |
|---|---|
| Selector | `zm-skip-link` |
| Library path | `frontend/projects/components/src/lib/skip-link/` |
| Status | built |
| Traces to | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`skip-link.html`](../../design-system/components/skip-link.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`dialogs/menu/default`](../../mocks/dialogs/menu/default.html), [`notifications/system-banner/info`](../../mocks/notifications/system-banner/info.html), and every other page, dialog and notification (see Usage) |
| Rendering | [`skip-link.html`](skip-link.html) |

## Purpose and scope

The skip link is the first thing a keyboard user meets on every Zamaro page.
It is invisible until it receives focus; then a yellow "Skip to content" stamp
appears in the top-left corner over the top bar, and Enter moves focus past the
brand, the navigation, Saved and the account button straight into `<main>`. It
satisfies WCAG 2.4.1 Bypass Blocks and L2-101's first criterion.

A page with one long, important region may add a second skip link after the
first, named for where it lands ("Skip to the booking form" on an artist
profile). It is the same component with a different target.

Use something else when:

- the link goes somewhere inside the page's content and is always visible
  ("Book for Sat 14 Nov") → [link](link.md) or [button](button.md)
  (`zm-button-link` with a fragment);
- it moves between sections of a settings form → [sidebar navigation](sidebar-navigation.md).

Out of scope:

- Where the skip links sit in the DOM and which page gets a second one. The app
  shell owns that: it renders them as the first elements of the shell, before
  the [top bar](top-bar.md).
- The target element (`<main id="main">`, the booking stub heading). The shell
  and the page own their IDs. The skip link makes the target focusable if it is
  not (see API), but never creates it.
- `html { scroll-padding-top }`, which keeps the target clear of the sticky top
  bar. It is a global foundation in `reset.scss`.
- Focus on route change (L2-101.3, focus to the new page's `<h1>`). The router
  integration in the shell owns it.

## Usage

The mocks render 364 skip links on 364 screens, all the same configuration. The
second link exists only on the design-system page.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Every page, dialog and notification mock (`pages/*`, `dialogs/*`, `notifications/*`) | `target="main"`, first element in `<body>`, before the top bar and before any system banner | "Skip to content" | hidden, focus | over the top bar (stage) |
| Mocks with a loading main (`<main id="main" aria-busy="true">`, 23 screens) | as above | "Skip to content" | hidden, focus; the target is busy | over the top bar |
| Mocks whose main is the poster or a container (`<main id="main" class="poster">`, `class="container"`, 58 screens) | as above | "Skip to content" | hidden, focus | over the top bar |
| Dialog mocks (`dialogs/*`) | as above, behind an open modal dialog | "Skip to content" | not reachable while the dialog traps focus | over the top bar |
| Design system: artist profile, second link | `target="book-title"`, directly after the first link | "Skip to the booking form" | hidden, focus | over the top bar |
| Design system: static specimens | `.skip-link--static`, documentation only | "Skip to content" | focus, focus + hover | stage, paper |

## Anatomy

1. **Link** — `a.skip-link`, a native same-page link with
   `href="#{target}"`. Square corners, `--border-width-thick` outline in
   `--color-border-on-accent`, `--color-accent` fill.
2. **Label** — the projected text. It is the accessible name. Uppercase by
   CSS; the source copy is sentence case.
3. **Focus ring** — the shared two-tone ring, always in its stage colours
   because the link always shows over the top bar.

Host: `zm-skip-link` is an inline element that renders exactly one `<a
class="skip-link">`. The anchor is absolutely positioned against the initial
containing block, so the host takes no space in the layout.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `target` | `string` | `'main'` | no | The `id` of the element that receives focus. Renders `href="#{target}"`. |

### Outputs

None. Activation moves focus; nothing outside the component needs to react.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text | The label, from the translation catalogue: `'common.skipToContent' \| transloco`. Declared once. No icons. |

### Behaviour on activation

On `click` (which Enter fires on a link), the component:

1. looks up `document.getElementById(target)`;
2. always calls `preventDefault()`, so neither the browser nor the router
   navigates (with `<base href="/">`, `#main` would otherwise resolve to
   `/#main` and leave the page);
3. if the target exists: adds `tabindex="-1"` when the target has no
   `tabindex` attribute and is not natively focusable, calls
   `focus({ preventScroll: true })`, then `scrollIntoView({ block: 'start' })`
   so `scroll-padding-top` and the page's `scroll-behavior` apply;
4. if the target does not exist: leaves focus on the skip link and, in dev
   mode, logs a console error naming the missing `id`.

The URL never changes.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Hidden until focused | — | The product, on every page. |
| Static | `.skip-link--static` | Design-system and mock documentation only. Not an input; the component never renders it. |

The skip link has one size: `--space-3` by `--space-4` padding around
`--text-label`, about 50 px tall and about 180 px wide for "Skip to content".
Its width comes from its label.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Hidden | default | `top: -10rem`, outside the viewport. Never `display: none` or `visibility: hidden`. | In the tab order; reachable in browse mode as "Skip to content, link" |
| Focus | `:focus-visible` | Moves to `top: --space-3`, `left: --space-3`, above the top bar at `--z-tooltip`; ring in `--color-accent-on-stage` with a `--color-bg-stage` gap | "Skip to content, link" |
| Focus + hover | `:focus-visible:hover` | Fill `--color-accent-hover`; label stays `--color-fg-on-accent` | — |
| Activated | Enter or click | Focus leaves the link, so it hides again; the target is focused and scrolled to below the sticky bar | The target is announced (for `<main>`: the main landmark) |
| Target missing | no element with the `id` | Nothing moves; the link stays shown and focused | — |
| Inert | an open modal dialog traps focus | Not reachable | Not reachable |
| Print | `@media print` | `display: none` | — |

## Markup

Rendered by `zm-skip-link`:

```html
<zm-skip-link>
  <a class="skip-link" href="#main">Skip to content</a>
</zm-skip-link>
```

Two links on an artist profile:

```html
<zm-skip-link><a class="skip-link" href="#main">Skip to content</a></zm-skip-link>
<zm-skip-link><a class="skip-link" href="#book-title">Skip to the booking form</a></zm-skip-link>
```

The target, after the first activation when it had no `tabindex`:

```html
<main id="main" tabindex="-1">…</main>
```

Consumer template (the app shell, first in its template):

```html
<zm-skip-link>{{ 'common.skipToContent' | transloco }}</zm-skip-link>
@if (skipToBooking()) {
  <zm-skip-link target="book-title">{{ 'artist.skipToBooking' | transloco }}</zm-skip-link>
}
<zm-top-bar … />
<main id="main" tabindex="-1"><router-outlet /></main>
```

The `.skip-link` class, the `href` and the accessible name are a contract: the
shell page object (`e2e/pages/shell.ts`) finds the link by role and name.

## Design

- Position `absolute`; hidden at `top: -10rem`; shown at `top: --space-3`,
  `left: --space-3`; layer `--z-tooltip`, above the sticky top bar at
  `--z-sticky`.
- Padding `--space-3` block, `--space-4` inline.
- Label `--text-label`, `--letter-spacing-wide`, uppercase, no text
  decoration. `max-width: calc(100vw - 2 * var(--space-3))` with normal
  wrapping, so a long or zoomed label wraps inside the stamp.
- Outline `--border-width-thick` in `--color-border-on-accent`; square corners
  (`--radius-md`).
- Focus ring: `--focus-ring-width` outline in `--color-accent-on-stage` at
  `--focus-ring-offset`, with a `--color-bg-stage` gap drawn by
  `box-shadow`, in both themes.
- No transition: it appears in place.

The skip link declares no component tokens. Its look is fixed: it reads the
accent tokens directly, and no surface re-skins it.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Fill, hover | `--color-accent-hover` | `--palette-signal-300` | `--palette-signal-300` |
| Label | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Outline | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Focus ring | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Ring gap, top bar behind | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Label |
| `--color-fg-on-accent` | `--color-accent-hover` | 4.5:1 | Label while hovered |
| `--color-accent` | `--color-bg-stage` | 3:1 | Stamp edge against the top bar |
| `--color-accent-on-stage` | `--color-bg-stage` | 3:1 | Focus ring over the top bar |

Under forced colours the fill is dropped by the browser, but the stamp keeps a
real border and the focus ring is a real outline, so both stay visible in the
system colours.

## Responsive behaviour

- Same position at every width: `--space-3` from the top and left, over the top
  bar. Nothing hides it at any breakpoint; phones with a keyboard or switch
  access get it too.
- "Skip to content" fits on one line from 320 px. At 200 % zoom, or with a
  label longer than the viewport allows, the label wraps inside the stamp,
  which grows taller and never overflows the viewport.
- When shown it is about 50 px tall, above the 44 × 44 CSS px target.
- Landing on the target scrolls it below the sticky top bar at every width
  (through `scroll-padding-top`).

## Accessibility

### Role and pattern

A native same-page link (`<a href="#main">`), WCAG 2.4.1 Bypass Blocks. No APG
widget pattern applies. The landmarks (`header`, `nav`, `main`, `footer`) are
the other bypass mechanism and must also exist (L2-102).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> (first press on a page) | Focuses the skip link and shows it. |
| <kbd>Enter</kbd> | Moves focus to the target; the next <kbd>Tab</kbd> reaches the first focusable element inside it. |
| <kbd>Tab</kbd> again, without Enter | Hides it; focus continues to the next skip link, or to the top bar. |
| <kbd>Shift</kbd>+<kbd>Tab</kbd> from the top bar | Shows it again. |

### Focus

The link is the first focusable element in the document: nothing, not even a
system banner or cookie notice, comes before it. The ring is always the stage
ring, since the link always shows over the charcoal top bar; the
`--color-bg-stage` gap keeps the yellow ring from merging with the yellow
stamp. After activation, focus is on the target. How a focused `<main>` looks is the
global foundations' rule, not the skip link's; the skip link never styles its
target.

### Labelling

The visible label is the name: "Skip to content". A second link names where it
lands: "Skip to the booking form". Never "Skip navigation", which says what is
skipped rather than where you land.

### Announcements

None from the component. Moving focus to `<main>` makes screen readers announce
the main landmark and its first content.

### Motion

Nothing animates. Under `prefers-reduced-motion: reduce` the page's
`scroll-behavior` is `auto`, so the scroll to the target jumps rather than
glides.

## Content and internationalisation

- "Skip to content" on every page, the same words everywhere (WCAG 3.2.4). Key
  `common.skipToContent`.
- A second link, when a page has one: "Skip to the booking form" (key
  `artist.skipToBooking`). Never more than two skip links on a page.
- Sentence case in the source; CSS uppercases it.
- The component has no copy of its own: the label is projected from the
  catalogue (L2-111). French ("Passer au contenu") is a similar length; longer
  labels wrap.

## Performance

- Change detection: `OnPush`, one signal input, one `computed` for the `href`.
  One click listener; no subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/SkipLink.ts`
  renders "Skip to content" with the default target. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: none; the skip link is not part of the repeated
  compositions.
- Layout stability: absolutely positioned, so showing and hiding it never moves
  anything (L2-086).
- Imports: Angular core and `DOCUMENT` only.

## Acceptance criteria

### Rendering

- **AC-1** Given the shell renders `<zm-skip-link>Skip to content</zm-skip-link>` first, when Discover loads, then the first focusable element in the document is `<a class="skip-link" href="#main">` named "Skip to content", positioned outside the viewport and not hidden with `display: none` or `visibility: hidden`. (L2-101)
- **AC-2** Given Discover has loaded, when Tab is first pressed, then the skip link shows `--space-3` from the top-left corner, above the top bar. (L2-101)
- **AC-3** Given the focused skip link, when Enter is pressed, then `document.activeElement` is `<main id="main">`, the URL is unchanged and no router navigation starts. (L2-101)
- **AC-4** Given the skip link has moved focus to `<main>`, when Tab is pressed, then focus lands on the first focusable element inside `<main>`, not on the top bar. (L2-101)
- **AC-5** Given a target without a `tabindex` (the mocks' `<main id="main">`), when the skip link is activated, then the target gets `tabindex="-1"` and receives focus. (L2-101)
- **AC-6** Given no element with the target `id`, when the skip link is activated, then the page does not navigate, focus stays on the skip link, and in dev mode a console error names the missing `id`. (L2-101)
- **AC-7** Given the focused skip link, when Tab is pressed without Enter, then the link moves back outside the viewport and focus moves to the next focusable element (the top bar's menu button or brand). (L2-101)
- **AC-8** Given Abigail Mensah's profile with a second skip link "Skip to the booking form" targeting `book-title`, when the second Tab press focuses it and Enter is pressed, then focus moves to the booking stub's heading. (L2-101)

### States

- **AC-9** Given the focused skip link over the sticky top bar, when it is shown, then its ring is a `--focus-ring-width` outline in `--color-accent-on-stage` with a `--color-bg-stage` gap, and no part of the link or ring is covered by the top bar. (L2-101)
- **AC-10** Given the page has scrolled 1,000 px, when the skip link is activated, then the top of `<main>` lands below the sticky top bar, not under it. (L2-101)

### Screen readers

- **AC-11** Given a screen reader, when the skip link takes focus, then it is announced as "Skip to content, link"; when it is activated, then the main landmark is announced. (L2-102)
- **AC-12** Given the axe-core run on Discover with the skip link focused and unfocused in both themes, when it runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-13** Given the dark theme, when the skip link is shown, then it has the same `--color-accent` fill, `--color-fg-on-accent` label and `--color-border-on-accent` outline as in the light theme. (L2-104)
- **AC-14** Given both themes, when contrast is measured, then the label is at least 4.5:1 on the fill and on the hover fill, and the stamp and the ring are at least 3:1 against the top bar. (L2-103)

### Responsive

- **AC-15** Given a 320 px viewport, when the skip link is shown, then "Skip to content" sits on one line inside the viewport and the page does not scroll horizontally. (L2-096)
- **AC-16** Given text zoomed to 200 % at 320 px, when the skip link is shown, then the label wraps inside the stamp, nothing is clipped, and the stamp stays inside the viewport. (L2-096)
- **AC-17** Given a touch device with a keyboard, when the shown skip link is measured, then its target is at least 44 × 44 CSS px. (L2-096)

### Content

- **AC-18** Given the French catalogue, when the shell renders the skip link, then its label is the French string with no code change, and the component holds no English text of its own. (L2-111)

### Motion

- **AC-19** Given `prefers-reduced-motion: reduce` and a scrolled page, when the skip link is activated, then the page jumps to `<main>` without smooth scrolling. (L2-103)

### Performance

- **AC-20** Given the `SkipLink` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-skip-link` with `target`, the default slot and the
hand-moved focus. To meet this CRD:

- Always call `preventDefault()`, also when the target is missing, and log a
  dev-mode console error naming the `id` (AC-6). Today a missing target falls
  through to the browser, which resolves `#main` against `<base href="/">`.
- Add `tabindex="-1"` to a target that has no `tabindex` and is not natively
  focusable before focusing it (AC-5).
- Focus with `focus({ preventScroll: true })` and then
  `scrollIntoView({ block: 'start' })`, so the scroll happens once and honours
  `scroll-padding-top` and the page's `scroll-behavior` (AC-10, AC-19). Today
  `focus()` scrolls first and `scrollIntoView()` scrolls again.
- Add the stage focus ring: `.skip-link:focus-visible { outline-color:
  var(--color-accent-on-stage); box-shadow: 0 0 0 var(--focus-ring-offset)
  var(--color-bg-stage); }` (AC-9). Today it inherits the global ink ring in the
  light theme, which is barely visible on the charcoal bar.
- Add `max-width: calc(100vw - 2 * var(--space-3))` so a zoomed or long label
  wraps (AC-16).
- Add `@media print { .skip-link { display: none; } }` to the component's
  stylesheet.
- Compute the `href` in a `computed` instead of concatenating in the template.
- The shell already gives `<main>` `tabindex="-1"` and renders the link first;
  keep both. The second link ("Skip to the booking form") needs the shell to
  read it from the profile route and the catalogue key `artist.skipToBooking`;
  that is shell work in the profile slice, not a component change.
- The perf-test scenario needs no change.

## Decisions

- **D-1** *Why move focus by hand instead of letting the browser follow `#main`?* The app sets `<base href="/">`, so `href="#main"` resolves to `/#main` and would navigate away from deep routes. Moving focus in a click handler keeps the URL and the router untouched; the `href` stays for semantics (link role, status bar, copy link).
- **D-2** *What if the target has no `tabindex`?* The component adds `tabindex="-1"`. The design system requires it on `<main>`, but the mocks' `<main id="main">` lacks it and some browsers then scroll without moving focus. Making the component robust keeps L2-101.1 true for any target, including a second link's heading.
- **D-3** *Which focus ring colours?* Always the stage ring (`--color-accent-on-stage` with a `--color-bg-stage` gap), in both themes. The link is positioned over the charcoal top bar but is not inside `.topbar` in the DOM, so the stage rule in the global stylesheet never reaches it; the design system's Focus section says the ring over the top bar is yellow on charcoal.
- **D-4** *How does a page get a second skip link?* With a second `zm-skip-link` instance and a different `target`. No list input: two links are the maximum, and the shell places both before the top bar from route data.
- **D-5** *May the label wrap?* Yes, at 200 % zoom or with a long translation. The design system says it never wraps at normal sizes, which holds for "Skip to content" from 320 px; clipping or overflowing at zoom would break L2-096.
- **D-6** *Is `.skip-link--static` an input?* No. It exists so the design system and mocks can show the focused look in place. Shipping it would put a permanent yellow stamp on the page.
- **D-7** *Label as an input or as projected text?* Projected text, as built. It keeps the name in the DOM for the page object and the catalogue pipe in the consumer.
