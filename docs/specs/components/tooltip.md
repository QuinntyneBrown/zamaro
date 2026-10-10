# Tooltip

| Field | Value |
|---|---|
| Selector | `[zmTooltip]` (directive on the trigger), `zm-tooltip` (the label it renders in the overlay) |
| Library path | `frontend/projects/components/src/lib/tooltip/` |
| Status | planned |
| Traces to | L2-026, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-111 |
| Design system | [`tooltip.html`](../../design-system/components/tooltip.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/availability/default`](../../mocks/pages/availability/default.html), [`dialogs/add-song/default`](../../mocks/dialogs/add-song/default.html), [`dialogs/add-photo/default`](../../mocks/dialogs/add-photo/default.html), [`dialogs/block-dates/default`](../../mocks/dialogs/block-dates/default.html), [`dialogs/cancel-booking/default`](../../mocks/dialogs/cancel-booking/default.html), [`notifications/saved-toast/with-action`](../../mocks/notifications/saved-toast/with-action.html), and every screen with the top bar (see Usage) |
| Rendering | [`tooltip.html`](tooltip.html) |

## Purpose and scope

A tooltip is a small ink label that names what an icon-only control does, for
people who point at it or tab to it: "Save to compare later" over the heart on
a ticket, "Move up" over an arrow in the setlist editor, "Previous month" over a
calendar chevron. It appears after a short hover, or at once on keyboard focus,
and never holds anything you can click. The iconography foundation requires one
on every icon-only control.

`[zmTooltip]` is an attribute directive placed on the trigger (a `zm-button`
host, a `zm-save-toggle` host, a native `<button>` or `<a>`). It shows a
`zm-tooltip` label in an Angular CDK overlay (AGENTS.md: CDK for overlays), so
no ancestor's `overflow` clips it and it stacks at `--z-tooltip` above dialogs,
toasts and the sticky top bar.

Use something else when:

- the information is needed to finish a task (prices, deadlines, rules) → help
  text in the [form field](form-field.md) or copy on the page;
- it is an error → [inline message](inline-message.md);
- the control already has a visible label ("Share", "Save") → nothing;
- it is a list of actions → [menu](menu.md); a decision → [dialog](dialog.md).

Out of scope:

- The trigger's accessible name. The trigger owns it (`label` on
  [`zm-button`](button.md), the artist-specific name on the
  [save toggle](save-toggle.md)); the tooltip only describes.
- Keyboard shortcuts' behaviour. The page defines and handles a shortcut; the
  tooltip only shows its key and declares it with `aria-keyshortcuts`.
- When a trigger shows a visible label instead (the top bar's Saved text from SM
  up). The consumer disables the tooltip at those widths.

## Usage

The mocks render about 2,000 icon-only controls across 75 screens and no
tooltip yet (the design system adds it). Every row below is an icon-only
control that takes a tooltip, with the text and placement this CRD sets.

| Where | Trigger | Tooltip text | Placement | States seen | Surface |
|---|---|---|---|---|---|
| Top bar on every screen, XS–MD | `zm-button` ghost icon-only `topbar__menu`, name "Open menu", `expanded` | "Menu" | below, start | hidden, open; expanded true/false | top bar (stage) |
| Top bar on every screen, LG+ | `zm-button` ghost icon-only `topbar__theme`, name "Dark theme", `pressed` | "Dark theme" (equals the name, so no description) | below, centre | pressed true/false | top bar (stage) |
| Top bar, XS (text visually hidden) | `a.nav-link.topbar__saved` with heart and count badge | "Your saved artists" | below, centre | hidden, open; disabled from SM, where the text shows | top bar (stage) |
| Top bar on every signed-in screen | `zm-avatar-button` "NF", "AM", "PN", "MH", "TA" | "Your account" | below, end | hidden, open; expanded | top bar (stage), workspace top bar |
| `pages/discover/default`, `pages/saved/default`, `pages/not-found/artist` tickets and headliner | `zm-save-toggle` (`.save`), "Save Hosanna Collective to your saved artists" / "Remove Abigail Mensah from your saved artists" | "Save to compare later" / "Saved · press to remove" | above, centre | off, on, busy | ticket surface, headliner stage |
| `pages/edit-profile/*` setlist, `dialogs/add-song/*` | `zm-button` ghost icon-only, "Move Goodness of God up", "Move Way Maker down", "Remove Jireh" | "Move up", "Move down", "Remove" | above, centre | enabled; disabled at the list ends (no tooltip) | surface, dialog body |
| `pages/edit-profile/*` photos, `dialogs/add-photo/*`, `dialogs/add-video/*`, `dialogs/upload-check/*` | `zm-button` ghost icon-only, "Move photo 2 earlier", "Remove photo 2", "Make photo 3 your primary photo" | "Move earlier", "Move later", "Remove", "Make primary photo" | above, centre | enabled; disabled (no tooltip) | surface, dialog body |
| `pages/availability/*`, `dialogs/block-dates/*`, `dialogs/weekly-default/*`, `dialogs/calendar-feed/*`, `notifications/availability-toast/*` | `zm-button` icon-only, "Previous month, October 2026" / "Next month, December 2026" | "Previous month", "Next month" | above, centre | default | surface, dialog body |
| Every dialog header (`cancel-booking`, `add-church`, `pay-deposit`… 30 dialogs) | `button.close`, name "Close" or "Close menu" | "Close" (equals the name, so no description) | below, end | default; disabled while busy (no tooltip) | dialog surface; full screen at XS |
| Toasts and banners (`notifications/*-toast`, `notifications/system-banner`) | `button.close`, "Dismiss: Saved Luz Viva" | "Dismiss" | above, end | default | toast (inverse), danger toast |
| Design system | share icon-only button with shortcut | "Share profile" + <kbd>S</kbd> | above, centre | hidden, hover, focus, with shortcut | canvas |
| Any page behind an open dialog | any of the above | — | — | inert: no tooltip opens | canvas |

Every row is buildable with the inputs below: text, placement, alignment,
shortcut and disabled.

## Anatomy

1. **Label** — `.tooltip`, the `zm-tooltip` host. `--text-caption` bold,
   sentence case, `--color-fg-inverse` on `--color-bg-inverse`, padding
   `--space-1` × `--space-2`, at most 16 rem wide, then wraps.
2. **Shortcut (optional)** — a `<kbd>` after the text in `--text-overline` with
   a hairline box in `currentColor`, `--space-1` padding and left margin.
3. **Arrow** — `.tooltip::after`, a `--space-1` triangle in the label's fill,
   pointing at the trigger's centre (or `--space-4` in from the aligned edge).
4. **Hover bridge** — `.tooltip::before`, an invisible strip spanning the
   `--space-2` gap to the trigger, so the pointer can move onto the label
   (WCAG 1.4.13 Hoverable).
5. **Description** — a visually hidden element holding the same text, created by
   the CDK `AriaDescriber` and referenced by the trigger's `aria-describedby`.
   It exists from the first render, so it is read on focus.

Host: `[zmTooltip]` renders nothing in place. On first open it creates a CDK
overlay whose pane holds one `zm-tooltip` host carrying `.tooltip` and its
modifiers. The DS `.tooltip-anchor` wrapper is not rendered (D-1).

## API

### `[zmTooltip]` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `zmTooltip` | `string` | — | yes | The text. An empty string disables the tooltip. Changing it while open updates the label and the description in place. |
| `zmTooltipPlacement` | `'above' \| 'below'` | `'above'` | no | The preferred side. The overlay flips to the other side when the preferred one has no room, and the arrow follows (`.tooltip--below` when it ends up below). |
| `zmTooltipAlign` | `'center' \| 'start' \| 'end'` | `'center'` | no | Aligns the label with the trigger's centre, start edge or end edge (`.tooltip--start`, `.tooltip--end`). The overlay shifts to start or end alignment by itself when a centred label would leave the viewport. |
| `zmTooltipShortcut` | `string \| undefined` | `undefined` | no | One key as printed on the keyboard ("S"). Renders the `<kbd>` and sets `aria-keyshortcuts` on the trigger element. |
| `zmTooltipDisabled` | `boolean` (attribute) | `false` | no | Never opens; removes the description. Use it where the trigger shows a visible label (the top bar's Saved link from SM). |

The directive finds the **trigger element**: the host itself when it is a
`button`, an `a[href]` or has a `tabindex`; otherwise the first descendant
`button, a[href], [tabindex]:not([tabindex="-1"])` (the native element inside
`zm-button` or `zm-save-toggle`). It resolves the element after the host's first
render and again on each open.

It also never opens while the trigger element is `disabled`, has
`aria-disabled="true"`, or sits inside an `inert` subtree.

### Outputs

None. The tooltip is never interactive, and nothing outside it needs to know
whether it is open.

### Content slots

None. The text is a string input so it can also be the screen-reader
description; a tooltip never holds markup, links or buttons.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Above, centre | — | The default: list tools, calendar chevrons, save toggles. |
| Below | `.tooltip--below` | The top bar, dialog close buttons, anything within 3 rem of the top of the viewport. |
| Start / end aligned | `.tooltip--start` / `.tooltip--end` | Triggers at the edge: the menu button (start), the avatar and close buttons (end). |
| With shortcut | `<kbd>` inside | A control with a page-defined shortcut. |
| Raised | `.tooltip--raised` | Applied automatically when the trigger is inside `.on-stage`, `.topbar`, `.toast` or `.bulk-bar`: `--color-bg-surface-raised` label, `--color-fg-default` text and a hairline `--color-fg-on-stage-muted` outline, so it never sinks into a dark or inverse surface (D-6). |

One size. The width follows the text up to 16 rem, then the text wraps; there is
no truncation.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Hidden | default | No overlay in the DOM | The trigger already has `aria-describedby` pointing at the hidden description |
| Waiting | pointer (mouse or pen) enters the trigger | Nothing yet; a `--duration-tooltip-delay` timer runs. Leaving cancels it. | — |
| Open (hover) | the delay elapses while the pointer is over the trigger | Label fades in over `--duration-fast` with `--ease-enter`, `--space-2` from the trigger | Description unchanged; the visible label is `aria-hidden` |
| Open (focus) | keyboard focus reaches the trigger (CDK `FocusMonitor` origin `keyboard`) | Opens at once, no delay (D-3) | Description read with the name |
| Hovered | pointer moves from the trigger onto the label | Stays open | — |
| Dismissed | <kbd>Esc</kbd> while open | Hidden at once; stays hidden until the pointer and focus have both left the trigger | Focus stays on the trigger |
| Updated | `zmTooltip` changes while open ("Save to compare later" → "Saved · press to remove") | New text in place; the overlay repositions | Description text replaced |
| Disabled | `zmTooltipDisabled`, empty text, trigger `disabled` or `aria-disabled`, or inside `inert` | Never opens | No description |
| Touch | pointer type `touch`, or focus from a tap | Never opens | Description still present |
| Closed | pointer leaves both trigger and label, focus leaves, the trigger scrolls out of view, another tooltip opens, or the trigger is destroyed | Hidden at once (no fade out) | — |

Only one tooltip is open in the application at a time.

## Markup

Rendered on the trigger and in the overlay container while open:

```html
<!-- the trigger (zm-button renders the native button) -->
<zm-button variant="ghost" iconOnly>
  <button class="btn btn--ghost btn--icon" type="button" aria-label="Move Goodness of God up" aria-describedby="cdk-describedby-message-3">…</button>
</zm-button>

<!-- end of <body>: CDK AriaDescriber container, present from first render -->
<div id="cdk-describedby-message-container" class="cdk-visually-hidden" aria-hidden="true">
  <div id="cdk-describedby-message-3">Move up</div>
</div>

<!-- end of <body>: CDK overlay container, only while open -->
<div class="cdk-overlay-container">
  <div class="cdk-overlay-connected-position-bounding-box">
    <div class="cdk-overlay-pane zm-tooltip-pane">
      <zm-tooltip class="tooltip" aria-hidden="true">Move up</zm-tooltip>
    </div>
  </div>
</div>
```

Below and end-aligned in the top bar, raised:

```html
<zm-tooltip class="tooltip tooltip--below tooltip--end tooltip--raised" aria-hidden="true">Your account</zm-tooltip>
```

With a shortcut:

```html
<button class="btn btn--icon" type="button" aria-label="Share Abigail Mensah’s profile" aria-describedby="cdk-describedby-message-7" aria-keyshortcuts="S">…</button>
<zm-tooltip class="tooltip" aria-hidden="true">Share profile<kbd>S</kbd></zm-tooltip>
```

When the text equals the trigger's accessible name ("Close"), no
`aria-describedby` is added (D-5):

```html
<button class="close" type="button" aria-label="Close">…</button>
<zm-tooltip class="tooltip tooltip--below tooltip--end" aria-hidden="true">Close</zm-tooltip>
```

Consumer templates:

```html
<zm-save-toggle [zmTooltip]="(saved() ? 'saveToggle.tooltip.saved' : 'saveToggle.tooltip.save') | transloco" [artistName]="artist.name" [saved]="saved()" />
<zm-button variant="ghost" iconOnly [label]="'editProfile.setlist.moveUp' | transloco: { song: song.title }" [disabled]="first" [zmTooltip]="'editProfile.setlist.moveUpTip' | transloco" (click)="moveUp(song)"><zm-icon name="arrow-up" /></zm-button>
<zm-avatar-button [name]="user.name" [label]="'shell.account.open' | transloco: { name: user.name }" [expanded]="accountOpen()" controls="account-menu" [zmTooltip]="'shell.account.tip' | transloco" zmTooltipPlacement="below" zmTooltipAlign="end" />
<a class="nav-link topbar__saved" routerLink="/saved" [zmTooltip]="'shell.saved.tip' | transloco" zmTooltipPlacement="below" [zmTooltipDisabled]="!compact()">…</a>
```

The `.tooltip` classes and modifiers are a contract: e2e page objects find the
open tooltip by `.tooltip` in the overlay container and check its text. The
overlay's wrapper elements belong to the CDK and are free to change.

## Design

- Offset `--space-2` between trigger and label (the CDK connected position's
  `offsetY`), which clears the `--focus-ring-width` ring and its
  `--focus-ring-offset`; only the arrow's tip meets the ring.
- Viewport margin `--space-2`: the label never sits closer than 8 px to a
  viewport edge.
- Label `--text-caption`, `--font-weight-bold`, `--letter-spacing-normal`, no
  text transform, `width: max-content`, `max-width: 16rem`, `overflow-wrap:
  anywhere` for a single word wider than 16 rem.
- Padding `--space-1` × `--space-2`; corners square (no radius).
- Arrow: a `--space-1` border triangle centred on the trigger; `--space-4` in
  from the edge for start and end alignment; pointing up when below.
- Hover bridge: `::before`, full label width, `--space-2` tall, on the trigger
  side.
- Motion: fade in over `--duration-fast` with `--ease-enter` once the
  `--duration-tooltip-delay` (hover) has elapsed; no fade out.
- Layer: the overlay pane sits at `--z-tooltip`, above `--z-modal`,
  `--z-toast` and `--z-sticky`. `pointer-events` stay on so the label can be
  hovered.

Component tokens declared on the `zm-tooltip` host:

| Token | Aliases | Overridden by |
|---|---|---|
| `--tooltip-bg` | `--color-bg-inverse` | `.tooltip--raised` → `--color-bg-surface-raised` |
| `--tooltip-fg` | `--color-fg-inverse` | `.tooltip--raised` → `--color-fg-default` |
| `--tooltip-outline` | `transparent` | `.tooltip--raised` → `--color-fg-on-stage-muted` |

The arrow reads `--tooltip-bg`. The directive reads `--duration-tooltip-delay`
from the document's computed style once, the first time a tooltip waits, and
uses that number for its timer, so the token stays the single source.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Label and arrow | `--color-bg-inverse` | `--palette-ink-750` | `--palette-ink-100` |
| Text and `<kbd>` box | `--color-fg-inverse` | `--palette-paper` | `--palette-ink-750` |
| Raised label | `--color-bg-surface-raised` | `--palette-paper-bright` | `--palette-ink-800` |
| Raised text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Raised outline | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Tooltip text |
| `--color-bg-inverse` | `--color-bg-canvas` | 3:1 | Label against the page |
| `--color-bg-inverse` | `--color-bg-surface` | 3:1 | Label against a card or dialog |
| `--color-fg-default` | `--color-bg-surface-raised` | 4.5:1 | Raised tooltip text |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 3:1 | Raised label's outline against the stage (its edge) |

Under forced colours the label takes `Canvas` / `CanvasText` with a 1 px
`CanvasText` border (`forced-color-adjust` left on), so it stays visible as a
box.

## Responsive behaviour

- The label is positioned by the CDK flexible connected position strategy with
  `withPush(true)` and a `--space-2` viewport margin. At 320 px a centred label
  on a trigger near the edge shifts to start or end alignment (the arrow still
  points at the trigger) and never causes horizontal scroll or clips (L2-096).
- Long or translated text wraps at 16 rem and grows taller; nothing truncates.
- Touch screens have no hover, so the tooltip never opens from a tap. Every
  trigger keeps its own accessible name, and the description is still
  available to screen readers. Nothing important lives only in a tooltip.
- At XS, dialogs fill the screen (L2-099); their close tooltip opens below and
  end-aligned, inside the viewport.
- At 200 % zoom the label grows with the text and still fits the viewport (it
  wraps at 16 rem).

## Accessibility

### Role and pattern

[APG Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), adapted
(D-2): the trigger's name comes from its own `aria-label` or text; the tooltip
text is the trigger's description through `aria-describedby`, pointing at the
`AriaDescriber` element that exists before the tooltip is shown. The visible
`zm-tooltip` is `aria-hidden="true"`, so nothing is read twice. The tooltip
never receives focus and never contains links or buttons. It meets WCAG 1.4.13
Content on Hover or Focus: dismissible (<kbd>Esc</kbd>), hoverable (bridge) and
persistent (no timeout).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Focusing a trigger opens its tooltip at once; moving focus on closes it. The tooltip is never a tab stop. |
| <kbd>Esc</kbd> | Closes the open tooltip without moving focus. Inside a dialog or menu, the first press closes only the tooltip; the next press closes the dialog (D-4). |
| The shortcut (e.g. <kbd>S</kbd>) | Handled by the page, never while typing in a field. |

### Focus

Focus never moves because of a tooltip. The label sits `--space-2` from the
trigger, so the two-tone focus ring stays fully visible while the tooltip is
open (L2-101). Programmatic focus (a dialog's autofocus landing on Close, focus
returning to a trigger after a dialog closes) does not open the tooltip.

### Labelling

- The trigger keeps its specific name: "Move Goodness of God up", "Remove
  Hosanna Collective from your saved artists". The tooltip text starts with the
  same verb (WCAG 2.5.3): "Move up", "Saved · press to remove".
- When the text equals the trigger's accessible name (case and surrounding
  space ignored), no description is added (D-5).
- `zmTooltipShortcut` sets `aria-keyshortcuts` on the trigger element.

### Announcements

None. The tooltip is not a live region; the description is read when the
trigger is focused or inspected.

### Motion

The label fades in over `--duration-fast`. Under `prefers-reduced-motion:
reduce` the token drops to near zero, so it appears without a fade. The
`--duration-tooltip-delay` on hover stays, because it prevents flicker rather
than decorating.

## Content and internationalisation

- Two to four words, sentence case, no full stop: "Menu", "Your saved
  artists", "Save to compare later", "Move earlier", "Make primary photo".
- Start with the verb the control performs; don't repeat the object already on
  screen (the artist's name is on the ticket, the song title is in the row).
- Toggles say their state: "Saved · press to remove".
- Shortcuts are one key as printed: <kbd>S</kbd>, not "s".
- Every string arrives through `zmTooltip` from the translation catalogue
  (L2-111); the component has no copy. French runs about 30 % longer and wraps
  at 16 rem.

## Performance

- Change detection: `OnPush` on `zm-tooltip`; signal inputs on the directive.
  A closed tooltip creates no overlay, no component and no timers; it only
  registers its listeners and its `AriaDescriber` message. Listeners are added
  in the browser only (`afterNextRender`), so server rendering creates nothing.
- Pointer and focus listeners run outside the Angular zone (or zoneless) and
  enter it only to open or close.
- The overlay is created on first open and reused; it is disposed when the
  directive is destroyed.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Tooltip.ts`
  renders the closed directive on the setlist editor's "Move Goodness of God up"
  ghost icon-only button with the tooltip "Move up";
  `TooltipLabel.ts` renders one `zm-tooltip` reading "Saved · press to remove".
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms.
- Composite scenarios that include it: `TopBar`, `DarkTheme`, `Lineup` (one
  save-toggle tooltip per ticket).
- Layout stability: the label lives in the overlay, out of the page's flow, so
  opening it causes no layout shift (L2-086).
- Imports: `@angular/cdk/overlay`, `@angular/cdk/a11y` (`AriaDescriber`,
  `FocusMonitor`, `InteractivityChecker`) and nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given the setlist editor's "Move Goodness of God up" button with `zmTooltip` "Move up", when the page renders, then no `.tooltip` exists in the DOM and the native button has `aria-describedby` naming a hidden element whose text is "Move up". (L2-100)
- **AC-2** Given a mouse pointer resting on Hosanna Collective's save toggle with `zmTooltip` "Save to compare later", when 300 ms pass, then one `.tooltip` reading "Save to compare later" is visible above the toggle, centred on it, `--space-2` away, with its arrow pointing down; at 250 ms nothing is visible. (L2-100)
- **AC-3** Given the top bar's account avatar "NF" with `zmTooltipPlacement` "below" and `zmTooltipAlign` "end", when it is hovered, then the tooltip "Your account" opens below the avatar with `.tooltip--below.tooltip--end.tooltip--raised`, and its end edge lines up with the avatar's. (L2-096)
- **AC-4** Given a trigger 16 px from the right edge of a 320 px viewport with a centred tooltip, when it opens, then the label is at least `--space-2` inside the viewport, its arrow points at the trigger, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-5** Given a trigger in the top 40 px of the viewport with placement "above", when the tooltip opens, then it flips below the trigger and carries `.tooltip--below`. (L2-096)
- **AC-6** Given a French tooltip of 64 characters ("Afficher le mois précédent dans le calendrier des disponibilités"), when it opens, then the label is at most 16 rem wide, wraps onto a second line and shows every character. (L2-111)
- **AC-7** Given the design-system share button with `zmTooltip` "Share profile" and `zmTooltipShortcut` "S", when the tooltip opens, then it reads "Share profile" followed by a `<kbd>` "S", and the native button has `aria-keyshortcuts="S"`. (L2-100)
- **AC-8** Given Abigail Mensah's save toggle with its tooltip open reading "Save to compare later", when the booker saves her and `zmTooltip` becomes "Saved · press to remove", then the open label and the description both read "Saved · press to remove" without closing. (L2-026)

### States

- **AC-9** Given an open tooltip on the "Previous month" chevron, when the pointer moves from the chevron across the 8 px gap onto the label, then the tooltip stays open (WCAG 1.4.13 Hoverable). (L2-100)
- **AC-10** Given an open tooltip, when Escape is pressed, then it closes at once, focus stays on the trigger, and it does not reopen until the pointer and focus have left the trigger and come back (WCAG 1.4.13 Dismissible). (L2-100)
- **AC-11** Given an open tooltip with the pointer still over the trigger, when 10 seconds pass, then it is still open; when the pointer leaves both the trigger and the label, then it closes within one frame (WCAG 1.4.13 Persistent). (L2-100)
- **AC-12** Given "Move Goodness of God up" is disabled at the top of the list, when it is hovered for 1 second, then no tooltip opens and the button has no tooltip `aria-describedby`. (L2-100)
- **AC-13** Given a touch device, when the booker taps Luz Viva's save toggle, then the toggle acts and no tooltip opens. (L2-096)
- **AC-14** Given an open tooltip on one setlist button, when the pointer moves to the next row's "Remove Jireh" and rests 300 ms, then the first tooltip closes and exactly one `.tooltip`, "Remove", is open. (L2-100)
- **AC-15** Given the page behind an open dialog is `inert`, when a pointer rests on a save toggle behind it, then no tooltip opens. (L2-101)

### Keyboard and focus

- **AC-16** Given keyboard focus moves with Tab to "Next month, December 2026", when it lands, then the tooltip "Next month" is visible at once, with no 300 ms wait. (L2-101)
- **AC-17** Given the cancel-booking dialog opens and its autofocus places programmatic focus on Close, when it renders, then no tooltip is shown. (L2-101)
- **AC-18** Given the tooltip on the dialog's Close button is open, when Escape is pressed, then only the tooltip closes and the dialog stays open; when Escape is pressed again, then the dialog closes and focus returns to the control that opened it. (L2-101)
- **AC-19** Given a focused trigger with its tooltip open, when the ring is inspected, then the whole two-tone focus ring is visible and the label overlaps it by no more than the arrow's tip. (L2-101)
- **AC-20** Given an open tooltip, when Tab is pressed, then focus moves to the next control on the page, never into the tooltip, and the tooltip closes. (L2-101)

### Screen readers

- **AC-21** Given the share button named "Share Abigail Mensah's profile" with the tooltip "Share profile", when it receives focus with a screen reader, then it is announced as "Share Abigail Mensah's profile, button, Share profile" once, even after the tooltip appears. (L2-100)
- **AC-22** Given a dialog's Close button named "Close" with the tooltip "Close", when its accessible description is computed, then it is empty. (L2-100)
- **AC-23** Given open tooltips in both themes, on canvas, in a dialog and in the top bar, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-24** Given both themes, when contrast is measured, then tooltip text on its label is at least 4.5:1, the label is at least 3:1 against the canvas and the surface it opens over, and a raised label's outline is at least 3:1 against the stage. (L2-103)
- **AC-25** Given the dark theme, when a tooltip opens over the canvas, then it is a `--color-bg-inverse` label (paper) with `--color-fg-inverse` text; given a trigger in the top bar or inside a toast, then it carries `.tooltip--raised` with a `--color-bg-surface-raised` label and a hairline outline, in both themes. (L2-104)

### Motion

- **AC-26** Given `prefers-reduced-motion: reduce`, when a hovered trigger's tooltip opens, then it still waits 300 ms and then appears at full opacity without a fade. (L2-103)

### Performance

- **AC-27** Given the `Tooltip` and `TooltipLabel` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression, and a page of 24 closed tooltips creates no overlay pane. (L2-086)
- **AC-28** Given a tooltip opens and closes on Discover, when layout shift is measured, then the cumulative layout shift it causes is 0. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/tooltip/`: `tooltip.ts` (the
  `Tooltip` directive, selector `[zmTooltip]`), `tooltip-label.ts` (the
  `TooltipLabel` component, selector `zm-tooltip`, host class `tooltip`), and
  `tooltip.scss` for the label's styles. Export both from `public-api.ts`.
- Build on `@angular/cdk/overlay`: `Overlay.create` with
  `flexibleConnectedTo(triggerElement)` positions for above/below × centre,
  start, end (preferred first, then the flipped side, then the other
  alignments), `withPush(true)`, `withViewportMargin(8)`, `offsetY` ±8,
  `scrollStrategies.reposition({ autoClose: true })`, `panelClass:
  'zm-tooltip-pane'`. Map `positionChanges` to the `.tooltip--below`,
  `--start` and `--end` classes on the label.
- Use `AriaDescriber.describe(trigger, text)` and `removeDescription` on change,
  disable and destroy; skip it when the text equals the trigger's name
  (`aria-label`, else trimmed text content).
- Use `FocusMonitor.monitor(trigger)` and open only for origin `keyboard`.
  Pointer: `pointerenter` / `pointerleave` with `pointerType !== 'touch'`; the
  close on leave waits one animation frame and is cancelled by `pointerenter` on
  the label.
- Escape: subscribe to the overlay's `keydownEvents()` so the CDK keyboard
  dispatcher gives it to the tooltip before an underlying dialog or menu; call
  `preventDefault()` and mark the tooltip dismissed until the pointer and focus
  leave.
- A root `TooltipRegistry` service holds the open tooltip so opening one closes
  any other.
- Reproduce the design-system styles in `tooltip.scss`: `.tooltip` (without the
  DS's `position: absolute` and translate; the overlay positions it),
  `::before` bridge on the trigger side, `::after` arrow, `--below`, `--start`,
  `--end`, `kbd`, and the new `--raised` modifier; plus the fade-in.
- Detect `.tooltip--raised` on open with
  `trigger.closest('.on-stage, .topbar, .toast, .bulk-bar')`.
- Add the perf-test scenarios `Tooltip.ts` and `TooltipLabel.ts` and export them
  from `scenarios/index.ts`.
- Consumers to wire in their own slices: top bar (menu, theme, Saved at XS,
  avatar), save toggle, setlist and photo editors, calendar navigation, dialog
  and toast close buttons.

## Decisions

- **D-1** *The design system positions the label with CSS inside a `.tooltip-anchor`. Keep that?* No. The label opens in a CDK overlay (AGENTS.md: CDK for overlays). An absolutely positioned child is clipped by the dialog body's scrolling and the setlist list, and cannot move to stay on screen. The `.tooltip` classes and look are kept; the `.tooltip-anchor` wrapper is not rendered.
- **D-2** *Name or description? The patterns page says a tooltip that names an icon button is its label (`aria-labelledby`); the tooltip page says the control keeps its `aria-label` and the tooltip is `aria-describedby`.* Description. Every icon-only control in the mocks already carries a specific `aria-label` ("Move Goodness of God up"), the button CRD requires `label` with `iconOnly`, and the patterns page itself says phones need a name that does not depend on the tooltip. The more specific name stays the name.
- **D-3** *Does keyboard focus wait for the 300 ms delay? The tooltip page says yes; the patterns page says "at once on keyboard focus".* At once. The delay exists to stop flicker when a pointer sweeps across a row of tickets; a keyboard user lands on one control deliberately and needs the hint immediately.
- **D-4** *Escape with a tooltip open inside a dialog: close the tooltip, the dialog, or both?* Only the tooltip. WCAG 1.4.13 needs a way to dismiss it without moving focus, and closing the dialog moves focus. A second Escape closes the dialog as L2-101 requires. This is also what the CDK keyboard dispatcher does when the tooltip's overlay is topmost.
- **D-5** *A tooltip that repeats the name ("Close", "Dark theme") would be read twice. Skip those tooltips?* Keep them for pointer users, but add no description when the text equals the trigger's accessible name.
- **D-6** *The design system raises the tooltip on `.on-stage` and `.topbar` with a descendant selector, which cannot reach a label in the overlay container. And an ink label on an ink toast disappears.* The directive adds `.tooltip--raised` when the trigger is inside `.on-stage`, `.topbar`, `.toast` or `.bulk-bar`, with the design system's stage styling. The toast and bulk bar are inverse surfaces where the default label has no contrast.
- **D-7** *Why does the description live in a separate hidden element instead of the visible label?* The visible label exists only after the delay, so a screen reader that computes the description on focus would find nothing, and `aria-describedby` pointing at a missing ID is invalid. The CDK `AriaDescriber` element exists from first render. The visible label is `aria-hidden` so nothing is read twice.
- **D-8** *Does the tooltip move to stay on screen? The design system says it does not.* It does: the CDK strategy flips it and shifts alignment within a `--space-2` viewport margin. The design system's rule existed because CSS could not do this, and L2-096 forbids clipping at 320 px.
- **D-9** *Tooltips on disabled controls, such as "Move up" at the top of the list?* None. A disabled button cannot be focused, Chromium does not send it pointer events reliably, and its name already says what it would do.
- **D-10** *Which icon-only controls get a tooltip, and with what text?* Every one in the Usage table, as the iconography foundation requires, including dialog and toast close buttons. The copy in the Usage table follows the design-system content rules and becomes catalogue keys.
- **D-11** *What happens when the page scrolls while a tooltip is open?* The CDK reposition strategy keeps it attached; it closes when the trigger scrolls out of view. That keeps it persistent (1.4.13) without leaving a label floating over unrelated content.
- **D-12** *In the dark theme the raised fill (`--color-bg-surface-raised`) is only about 1.3:1 against the stage. Is the raised label visible enough?* Yes, because its edge is the hairline `--color-fg-on-stage-muted` outline, which clears 3:1 against the stage in both themes, and its text clears 4.5:1 on the fill. The outline is therefore required, not decorative, and AC-24 measures it. The rendering's contrast section showed the fill-only pair failing.
