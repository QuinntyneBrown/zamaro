# Toast

| Field | Value |
|---|---|
| Selector | `zm-toast`, `zm-toast-region` (and the `ToastService` that feeds them) |
| Library path | `frontend/projects/components/src/lib/toast/` |
| Status | planned |
| Traces to | L2-026, L2-066, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-109, L2-110, L2-111, L2-113, L2-114 |
| Design system | [`toast.html`](../../design-system/components/toast.html) |
| Source mocks | [`notifications/saved-toast`](../../mocks/notifications/saved-toast/success.html) (success, with-action, info, warning, danger), [`notifications/booking-toast`](../../mocks/notifications/booking-toast/success.html) (info, success, warning, danger, with-action, stacked), [`notifications/request-toast`](../../mocks/notifications/request-toast/info.html) (info, success, warning, danger, with-action, stacked), [`notifications/availability-toast`](../../mocks/notifications/availability-toast/success.html) (success, info, warning, danger, with-action), [`notifications/session-toast/warning`](../../mocks/notifications/session-toast/warning.html), [`notifications/share-toast/success`](../../mocks/notifications/share-toast/success.html), and the empty region on every page and dialog (see Usage) |
| Rendering | [`toast.html`](toast.html) |

## Purpose and scope

A toast is a small ink slip that rises in the bottom corner to confirm
something that just happened where the person is not looking: "Saved Luz
Viva" with Undo, "Request sent to Abigail", "Link copied". Success, info and
warning toasts leave on their own after 5 seconds; a danger toast reports a
failed background action and stays until it is dismissed or its retry
succeeds. Every toast is read politely from one status region that the page
has from the moment it loads.

The family is three parts:

- `zm-toast-region` is the one `role="status"` region, rendered once by each
  application shell, last in `<body>`.
- `zm-toast` is one slip: kind, title, text, up to two actions, the dismiss
  button and the timer bar.
- `ToastService` is how pages and components raise toasts. It owns the
  timers, the stack of three, the queue and focus return. No page renders
  `zm-toast` itself.

Use something else when:

- the person must read or act on it to continue (a failed booking request,
  a declined card in the pay dialog) → [alert](alert.md), in place;
- it concerns one field or one control → [inline message](inline-message.md);
- it affects the whole page or stays until a cause is fixed (offline,
  unverified email, maintenance) → the banner in [alert](alert.md).

Out of scope:

- What the action does. The service runs the caller's `run` callback or
  navigates to its link; undoing a save belongs to the
  [save toggle](save-toggle.md), paying a deposit to the page it opens.
- The copy. Callers pass translated strings; formatted dates, times and money
  arrive already formatted (L2-110).
- The look of the buttons inside the slip. The [button](button.md) CRD owns
  the `.toast` and `.toast--danger` re-skin; the toast only renders
  `zm-button` and `zm-button-link` at `size="sm"`.
- Deciding when to warn (the idle-session timer of L2-066, the 24-hour
  deposit reminder). The caller decides and calls `show`.

## Usage

Every page and dialog mock (364 screens) carries the empty region
`<div class="toast-region" role="status" aria-live="polite"></div>` as the last
element of the body. Each row below is one distinct toast; the API builds every
row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Every page and dialog | `zm-toast-region`, empty | — | empty, present from load | fixed bottom corner |
| `notifications/saved-toast/success` (L2-026) | success, `icon` heart, timed | kind "Saved", title "Saved Luz Viva", text "Your saved count is now 3.", action button "Undo" | visible, timer running | inverse slip |
| `notifications/saved-toast/with-action` | success, heart, timed | kind "Removed", title "Removed Elijah Park", text "He's off your saved list. Your count is now 3.", "Undo" | visible | inverse slip |
| `notifications/saved-toast/info` | info, timed | kind "Info", title "Saved artists are private", text, link action "View saved" | visible | inverse slip |
| `notifications/saved-toast/warning` (L2-026) | warning, timed | kind "Heads up", title "You can save up to 200 artists.", text "Remove someone from your saved list to make room for Elijah Park.", link "Open saved artists" | visible | inverse slip |
| `notifications/saved-toast/danger` (L2-026, L2-114) | danger, no timer | kind "Failed", title "Couldn't save Luz Viva. Try again.", text "Your connection dropped, so her heart is empty again.", button "Try again" | visible, retrying | danger paper slip |
| `notifications/booking-toast/success` | success, check-circle, timed | kind "Success", title "Request sent to Abigail", text "Booking ZAM-0114. Nothing is charged; she has until Mon 12 Oct, 10:15 a.m. to reply.", link "View booking" | visible, timer at 60 % | inverse slip |
| `notifications/booking-toast/with-action` | success, timed | kind "Accepted", title "Abigail accepted", text "Pay the $162.50 deposit by Sun 11 Oct, 2:40 p.m. to confirm Sat 14 Nov.", link "Pay deposit" | visible | inverse slip |
| `notifications/booking-toast/info` | info, eye, timed, no action | kind "Info", title "Message sent to Abigail", text | visible | inverse slip |
| `notifications/booking-toast/warning` | warning, clock, timed, no action | kind "Heads up", title "Luz Viva deposit due", text "Pay your $225 deposit for Luz Viva by Sat 10 Oct, 4:00 p.m. or the booking expires." | visible | inverse slip |
| `notifications/booking-toast/danger` | danger, no timer | kind "Failed", title "Payment failed", text, link "Try another card" | visible | danger paper slip |
| `notifications/booking-toast/stacked` | three toasts: success (newest, top), info, warning | as above | stacked, three visible | inverse slips |
| `notifications/request-toast/info` | info, bell, timed | kind "New request", title "Riverside asked for Sat 14 Nov", text "Worship night in Burlington, $650 quoted. Reply by Mon 12 Oct, 10:15 a.m.", link "View" | visible | inverse slip |
| `notifications/request-toast/success` | success, timed, no action | kind "Accepted", title "Request accepted", text | visible | inverse slip |
| `notifications/request-toast/warning` | warning, timed | kind "Heads up", title "Reply to Harvest Point by Sat 10 Oct", text, link "Reply now" | visible | inverse slip |
| `notifications/request-toast/with-action` | success, timed, **two** link actions | kind "Confirmed", title "Riverside paid the deposit", links "See booking", "Open calendar" | visible | inverse slip |
| `notifications/request-toast/danger` | danger, x-circle, no timer | kind "Failed", title "Couldn't send your reply", button "Try again" | visible | danger paper slip |
| `notifications/request-toast/stacked` | success (top), warning, info | as above | stacked | inverse slips |
| `notifications/availability-toast/success` | success, timed | kind "Saved", title "26–27 Nov marked unavailable", text, button "Undo" | visible | inverse slip |
| `notifications/availability-toast/info` | info, lock, timed, no action | kind "Info", title "Sun 15 Nov is Booked", text | visible | inverse slip |
| `notifications/availability-toast/warning` | warning, timed, no action | kind "Heads up", title "Sat 21 Nov is still Booked", long text (two lines at 360 px) | visible | inverse slip |
| `notifications/availability-toast/with-action` | info, bell, timed | kind "Request", title "Sat 14 Nov · Requested · 1", link "Open request" | visible | inverse slip |
| `notifications/availability-toast/danger` | danger, x-circle, no timer | kind "Failed", title "Couldn't save your dates", button "Try again" | visible | danger paper slip |
| `notifications/session-toast/warning` (L2-066) | warning, **persistent** (no timer, no bar) | kind "Heads up", title "You'll be signed out in 2 minutes.", text "Admin sessions end after 30 minutes without activity.", button "Stay signed in" | visible until acted on | inverse slip, admin app |
| `notifications/share-toast/success` (L2-113) | success, check, timed, title only | kind "Shared", title "Link copied" | visible | inverse slip |
| Design system | success, no kind, body only; title only "Copied No. ZAM-0114"; danger "Couldn't save Luz Viva" with "Retry" busy "Retrying…" | — | hover, focus (paused), leaving | inverse and danger slips |

## Anatomy

1. **Region** — `.toast-region`: fixed to the bottom corner at `--z-toast`, a
   grid of slips with `--space-2` between them. `role="status"`,
   `aria-live="polite"`. Ignores pointer events itself.
2. **Slip** — `.toast` plus `.toast--{variant}`: inverse surface (danger:
   tinted paper with a full rule), 4 px accent stripe on the left, hard
   `--shadow-2`. Three columns: icon, body, dismiss.
3. **Icon** — `zm-icon`, 20 px, `--toast-accent`, `aria-hidden`.
4. **Body** — `.toast__body`: the text column.
5. **Kind (optional)** — `.toast__kind`: an overline that names the event or
   tone in words ("Saved", "Heads up", "Failed"), so the tone never depends on
   colour.
6. **Title** — `.toast__title`: bold uppercase label, past tense, names the
   object ("Saved Luz Viva").
7. **Text (optional)** — `.toast__text`: one sentence, body-small.
8. **Actions (optional)** — `.toast__actions`: one or two small buttons or
   links.
9. **Dismiss** — `.close` button with a close icon, named "Dismiss: {title}".
10. **Timer bar (timed toasts only)** — `.toast__progress`: a 2 px bar along
    the bottom edge in `--toast-accent` that empties over the 5 seconds,
    `aria-hidden`.

Host: `zm-toast-region` is the region itself; its host carries
`.toast-region`, `role="status"` and `aria-live="polite"` and renders one
`zm-toast` per visible toast. Each `zm-toast` host carries `.toast`, its
variant class and `data-state`; it has no role of its own.

## API

### `ToastService` (root-provided)

| Member | Signature | Rule |
|---|---|---|
| `show` | `(options: ToastOptions) => ToastRef` | Queues or shows a toast (see States). Never moves focus. |
| `dismissAll` | `() => void` | Removes every visible and queued toast (sign-out, route to an error page). |

### `ToastOptions`

| Field | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'success' \| 'info' \| 'warning' \| 'danger'` | `'success'` | no | Adds `.toast--{variant}`. Danger has no timer. |
| `title` | `string` | — | yes | The announcement. Complete on its own: "Saved Luz Viva", never "Saved". |
| `kind` | `string` | — | no | The overline: "Saved", "Accepted", "Heads up", "Failed". |
| `text` | `string` | — | no | One sentence with the real date, time or amount, already formatted. |
| `icon` | `IconName` | per variant: success `check`, info `info`, warning `warning`, danger `warning` | no | Overrides the leading icon. |
| `actions` | `readonly ToastAction[]` (0–2) | `[]` | no | A third action is a dev-mode console error naming the toast; only the first two render. |
| `dismissLabel` | `string` | — | yes | The close button's name: "Dismiss: Saved Luz Viva". |
| `persistent` | `boolean` | `false` | no | No timer and no bar; stays until acted on or dismissed. Only for the idle-session warning (L2-066). |
| `key` | `string` | — | no | A toast with the same `key` as a visible or queued one replaces it in place and restarts its timer. |
| `origin` | `HTMLElement \| null` | `document.activeElement` at `show` time | no | Where focus returns if the toast closes with focus inside it. |

### `ToastAction`

| Field | Type | Required | Rule |
|---|---|---|---|
| `label` | `string` | yes | One verb: "Undo", "Try again", "Pay deposit". |
| `ariaLabel` | `string` | no | Extends the label and starts with it (WCAG 2.5.3): "Undo save Luz Viva". |
| `link` | `string \| unknown[]` | one of `link` / `run` | Renders `zm-button-link size="sm"`; activating it navigates and dismisses the toast. |
| `queryParams`, `fragment` | as `zm-button-link` | no | Passed through. |
| `run` | `() => void \| Promise<unknown>` | one of `link` / `run` | Renders `zm-button size="sm"`. A plain return dismisses the toast. A promise sets the button `busy` with `busyLabel` until it settles: resolved dismisses the toast, rejected keeps it (danger retry). |
| `busyLabel` | `string` | with a promise `run` | "Retrying…". |
| `variant` | `'secondary' \| 'ghost'` | no | `'secondary'` (outlined) by default. |

### `ToastRef`

| Member | Type | Rule |
|---|---|---|
| `dismiss()` | `() => void` | Starts the leaving transition; a queued toast is removed at once. |
| `dismissed` | `Signal<ToastDismissal \| null>` | `null` while open; then `'timeout' \| 'close' \| 'action' \| 'replaced' \| 'programmatic'`. |
| `update(patch)` | `(Partial<Pick<ToastOptions, 'title' \| 'kind' \| 'text'>>) => void` | Changes the copy in place without restarting the timer (danger toast after a failed retry). |

### `zm-toast-region` inputs

None. It reads the service. It has one public knob: `--zm-toast-offset`
(default `0px`), added to the bottom offset by a page that has a sticky bottom
bar, so a toast never covers it.

### `zm-toast` inputs

`zm-toast` is internal to the library: the region renders it from a
`ToastOptions` (`toast` input, required) and a `paused` input. It is not
exported from `public-api.ts`.

### Outputs

None on the components. Results come back through `ToastRef.dismissed` and the
action's `run`.

### Content slots

None. Every string arrives through `ToastOptions` (L2-111), so the service can
queue, replace and re-render toasts without the caller's template.

## Variants and sizes

| Variant | Modifier | Surface | Timer | Use for |
|---|---|---|---|---|
| Success | `.toast--success` | inverse, yellow stripe | 5 s | A change was made: "Saved Luz Viva", "Link copied". |
| Info | `.toast--info` | inverse, yellow stripe | 5 s | Something the system did or something new: "Riverside asked for Sat 14 Nov". |
| Warning | `.toast--warning` | inverse, amber stripe | 5 s | Needs attention soon: "Luz Viva deposit due", "You can save up to 200 artists." |
| Warning, persistent | `.toast--warning` | inverse, amber stripe | none | Only "You'll be signed out in 2 minutes." (L2-066). |
| Danger | `.toast--danger` | tinted paper, full red rule | none | A failed background action: "Couldn't save Luz Viva. Try again." |

Toasts have one size: the full region width, which is the viewport minus
`--space-4` each side below SM and 24 rem from SM. Height follows the content.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Region empty | no toasts | Nothing visible; takes no space; ignores pointer events | Empty polite live region, present from load |
| Entering | inserted | Rises `--space-4` and fades in over `--duration-slow` with `--ease-enter` | Region announces kind, title and text politely |
| Visible, timed | success, info, warning | Timer bar empties from full width over 5 s | — |
| Paused | pointer over the slip, focus inside it, or `document.hidden` | Timer bar stops where it is | — |
| Action hover / focus | the button's own `:hover` / `:focus-visible` | Underline on hover; two-tone ring on focus (button CRD); timer paused | Button role and name |
| Action busy | promise from `run` pending | Button `busy` with "Retrying…"; slip stays | `aria-busy` on the button |
| Persistent | `persistent = true` | No timer bar | — |
| Danger | `variant = 'danger'` | Danger paper slip, red stripe and rule; no timer bar | Read politely like every toast |
| Replaced | `show` with a matching `key` | Copy changes in place, timer restarts | New text announced |
| Queued | four or more toasts | Not rendered | Not announced until shown |
| Leaving | timeout, close, action, Esc | `data-state="leaving"`: fades and slides `--space-8` right over `--duration-base` with `--ease-exit`; removed after | Removed from the region |
| Held | a modal dialog is open | Not shown; timer not started | Not announced until the dialog closes |

Stacking: at most three slips are visible. The newest is first in the region
(on top). When a fourth arrives, the newest is shown at once and the oldest
visible slip makes room: a timed slip leaves as if its timer ran out; a danger
or persistent slip goes back to the front of the queue and returns, timer
untouched, as soon as a slot frees. A queued danger toast is never dropped.
Each visible timed toast keeps its own timer.

## Markup

Rendered region with one timed success toast:

```html
<zm-toast-region class="toast-region" role="status" aria-live="polite">
  <zm-toast class="toast toast--success" data-state="visible">
    <zm-icon name="heart">…<svg class="icon" aria-hidden="true">…</svg></zm-icon>
    <div class="toast__body">
      <p class="toast__kind">Saved</p>
      <p class="toast__title">Saved Luz Viva</p>
      <p class="toast__text">Your saved count is now 3.</p>
      <div class="toast__actions">
        <zm-button size="sm"><button class="btn btn--sm" type="button" aria-label="Undo save Luz Viva">Undo</button></zm-button>
      </div>
    </div>
    <button class="close" type="button" aria-label="Dismiss: Saved Luz Viva"><zm-icon name="close" size="sm">…</zm-icon></button>
    <span class="toast__progress" aria-hidden="true"></span>
  </zm-toast>
</zm-toast-region>
```

Danger, retrying (no timer bar):

```html
<zm-toast class="toast toast--danger" data-state="visible">
  <zm-icon name="warning">…</zm-icon>
  <div class="toast__body">
    <p class="toast__kind">Failed</p>
    <p class="toast__title">Couldn't save Luz Viva. Try again.</p>
    <p class="toast__text">Your connection dropped, so her heart is empty again.</p>
    <div class="toast__actions"><zm-button size="sm"><button class="btn btn--sm" type="button" aria-busy="true" aria-disabled="true">Retrying…</button></zm-button></div>
  </div>
  <button class="close" type="button" aria-label="Dismiss: Couldn't save Luz Viva">…</button>
</zm-toast>
```

Title only, and two link actions:

```html
<zm-toast class="toast toast--success" data-state="visible">
  <zm-icon name="check">…</zm-icon>
  <div class="toast__body"><p class="toast__kind">Shared</p><p class="toast__title">Link copied</p></div>
  <button class="close" type="button" aria-label="Dismiss: Link copied">…</button>
  <span class="toast__progress" aria-hidden="true"></span>
</zm-toast>

<div class="toast__actions">
  <zm-button-link size="sm" link="/artist/requests/ZAM-0114"><a class="btn btn--sm" href="/artist/requests/ZAM-0114">See booking</a></zm-button-link>
  <zm-button-link size="sm" link="/artist/calendar"><a class="btn btn--sm" href="/artist/calendar">Open calendar</a></zm-button-link>
</div>
```

Leaving: the same slip with `data-state="leaving"`, removed after the
transition. Empty parts (`.toast__kind`, `.toast__text`, `.toast__actions`)
are not rendered at all.

Consumers:

```html
<!-- app shell, once, last in the body -->
<zm-toast-region />
```

```ts
// save toggle, after a successful save (L2-026)
this.toasts.show({
  variant: 'success', icon: 'heart',
  kind: t('toast.saved.kind'), title: t('toast.saved.title', { name }), text: t('toast.saved.count', { count }),
  dismissLabel: t('toast.dismiss', { title }),
  actions: [{ label: t('toast.undo'), ariaLabel: t('toast.undoSave', { name }), run: () => this.unsave() }],
  key: `save:${slug}`, origin: this.host.nativeElement,
});

// after the save request fails (L2-026, L2-114)
this.toasts.show({ variant: 'danger', kind: t('toast.failed'), title: t('toast.saveFailed', { name }), …,
  actions: [{ label: t('toast.tryAgain'), busyLabel: t('toast.retrying'), run: () => this.save() }] });
```

The `.toast*` classes, `data-state` and the region's role are a contract: e2e
page objects find the region by role `status`, a toast by its title text, and
its buttons by role and name. The `zm-icon` internals are free to change.

## Design

- Region: `position: fixed`, `z-index: var(--z-toast)`, `display: grid`, gap
  `--space-2`, `pointer-events: none`. Below SM: left and right `--space-4`,
  bottom `calc(var(--space-4) + env(safe-area-inset-bottom) + var(--zm-toast-offset, 0px))`.
  From SM: right `--space-6`, bottom `calc(var(--space-6) + var(--zm-toast-offset, 0px))`,
  width 24 rem.
- Slip: `pointer-events: auto`; grid columns `auto minmax(0, 1fr) auto`, gap
  `--space-3`, padding `--space-4`, `align-items: start`; left rule
  `--border-width-poster` in `--toast-accent`; `--shadow-2`. Square corners.
- Kind `--text-overline`, `--letter-spacing-stamp`, uppercase. Title
  `--text-label`, `--letter-spacing-wide`, uppercase. Text `--text-body-sm`.
  Body text wraps (`overflow-wrap: anywhere` on the title for long e-mail
  addresses or codes).
- Actions: flex row, gap `--space-2`, margin-top `--space-2`, wraps.
- Dismiss: the `.close` button, `--control-height-sm` square, and
  `--target-comfortable` under a coarse pointer; hover fills 12 % of
  `currentColor`.
- Timer bar: absolute along the bottom edge, height `--border-width-thick`,
  `--toast-accent`; the slip is `position: relative; overflow: hidden` only
  when it has a bar. Its width animates from 100 % to 0 linearly over 5 s.
- Enter: `toast-in` over `--duration-slow` with `--ease-enter` (from opacity 0
  and `--space-4` lower). Leave: opacity 0 and `--space-8` to the right over
  `--duration-base` with `--ease-exit`.
- Print: the region is hidden.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--toast-accent` | `--color-accent` | `.toast--warning` → `--color-warning-border`; `.toast--danger` → `--color-danger-icon` |
| `--zm-toast-offset` | `0px` | a page with a sticky bottom bar sets it on `<body>` or the shell to that bar's height |

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Slip | `--color-bg-inverse` | `--palette-ink-750` | `--palette-ink-100` |
| Text, button label and rule | `--color-fg-inverse` | `--palette-paper` | `--palette-ink-750` |
| Stripe and icon, success and info | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Stripe and icon, warning | `--color-warning-border` | per theme | per theme |
| Danger slip / rule | `--color-danger-bg` / `--color-danger-border` | per theme | per theme |
| Danger stripe and icon | `--color-danger-icon` | per theme | per theme |
| Danger text and button label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Shadow | `--color-shadow` (in `--shadow-2`) | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

The slip is an inverse surface: charcoal on newsprint in the light theme,
paper on the stage in the dark theme, so it always stands out from the page.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Kind, title, text, button labels |
| `--color-fg-inverse` | `--color-bg-inverse` | 3:1 | Button outlines and the close icon |
| `--color-accent` | `--color-bg-inverse` | 3:1 (light) | Stripe and icon, light theme |
| `--color-fg-default` | `--color-danger-bg` | 4.5:1 | Danger toast text |
| `--color-danger-icon` | `--color-danger-bg` | 3:1 | Danger icon |
| `--color-danger-border` | `--color-bg-canvas` | 3:1 | Danger slip edge against the page |
| `--color-focus-ring` | `--color-bg-inverse` | 3:1 | Focus ring on a toast button |

In the dark theme the yellow stripe and icon on the paper slip fall below 3:1.
They are decorative there: the kind and title state the outcome in words, and
the slip contrasts strongly with the stage. Under forced colours the slip draws
a `CanvasText` border so its edge survives, and the icons follow `currentColor`.

## Responsive behaviour

- **XS (< 576 px)**: the region spans the viewport with `--space-4` side
  margins and sits `--space-4` above the bottom edge plus the safe-area inset,
  so it clears the home indicator.
- **SM and up (≥ 576 px)**: the region is 24 rem wide, `--space-6` from the
  right and bottom edges.
- Titles and text wrap; nothing truncates. The close button stays top-right in
  its own column. Actions wrap onto a second line rather than shrinking.
- At 320 px the three-column slip fits: the longest mock title, "Reply to
  Harvest Point by Sat 10 Oct", wraps to two lines, and "Couldn't save Grace
  Tabernacle Mass Choir. Try again." to five lines in the uppercase label
  face; the slip grows taller and nothing scrolls sideways or clips. The
  rendering at 320 px shows this; it is allowed for long artist names, and is
  the reason titles are kept to about four words plus the name.
- A toast never covers the focused element (WCAG 2.4.11). Pages with a sticky
  bottom bar (the booking stub's mobile bar, form action bars) set
  `--zm-toast-offset` so the region sits above it.
- At 200 % zoom the slip grows taller. If three slips are taller than the
  viewport, the region caps its height at
  `calc(100dvh - var(--layout-topbar-height))` and scrolls vertically, newest
  at the top, so every toast and button stays reachable and none slides under
  the top bar.
- Under a coarse pointer the close button is 44 px; `sm` buttons grow to
  `--target-comfortable` (button CRD), with `--space-2` between them.

## Accessibility

### Role and pattern

The region is a polite live region (`role="status"`, `aria-live="polite"`)
that exists from page load, so every toast inserted into it is announced
(WCAG 4.1.3 Status Messages, L2-102). Danger toasts use the same polite region:
they are told apart by their kind, title, icon and by staying, not by an
assertive role. A toast is not a dialog: it never traps or takes focus. Toasts
carry no role of their own.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Reaches each toast's actions, then its close button, in DOM order (newest toast first). The region is last in `<body>`. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates the focused action or close button. |
| <kbd>Escape</kbd> | With focus inside a toast, dismisses that toast and returns focus. Does nothing elsewhere. |

### Focus

- Showing, replacing or queueing a toast never moves focus.
- While focus is inside a toast its timer is paused.
- When a toast closes with focus inside it (timeout cannot happen then, so:
  close, Escape, an action, or `dismiss()`), focus moves to its `origin` if
  that element is still connected and focusable; otherwise to the page's main
  heading (`h1`, which has `tabindex="-1"`). Never to `<body>`.
- An action that navigates leaves focus to the router's focus rule (L2-101).
- Every toast action is also possible elsewhere: pressing the save toggle again
  is the same as Undo; Pay deposit is on the booking page.

### Labelling

- The kind, title and text are the announcement, in that order; keep them
  complete ("Saved Luz Viva", not "Saved").
- The icon and the timer bar are `aria-hidden`.
- The close button is named by `dismissLabel`: "Dismiss: Saved Luz Viva".
- An action's `ariaLabel` starts with its visible label: "Undo save Luz Viva".

### Announcements

Each toast is announced once when it is inserted into the region. A replaced
toast announces its new copy. A queued toast is announced when it is shown. A
held toast (dialog open) is announced after the dialog closes. `update()`
copy changes are announced because they happen inside the live region.

### Motion

Entering rises and fades; leaving fades and slides right. Under
`prefers-reduced-motion: reduce` both durations drop to near zero, so toasts
appear and disappear in place, and the timer bar is hidden because its
5-second shrink is motion. The timing rules do not change: a timed toast still
leaves after 5 seconds and still pauses.

## Content and internationalisation

- **Kind**: one or two words naming the event or tone: "Saved", "Removed",
  "Accepted", "Confirmed", "New request", "Info", "Heads up", "Failed",
  "Shared".
- **Title**: past tense, names the object, about four words: "Saved Luz Viva",
  "Removed Elijah Park", "Link copied" (L2-113), "Request sent to Abigail".
  Fixed strings from L2: "Saved {artist name}" (L2-026), "Couldn't save
  {artist name}. Try again." (L2-026), "You can save up to 200 artists."
  (L2-026), "You'll be signed out in 2 minutes." (L2-066), "Link copied"
  (L2-113).
- **Text**: one sentence with what happens next or what is safe, using the
  real date, time and money: "Pay the $162.50 deposit by Sun 11 Oct, 2:40 p.m.
  to confirm Sat 14 Nov." (L2-110). Short enough to read in 5 seconds; anything
  longer belongs in an alert or banner.
- **Actions**: one verb or verb phrase: "Undo", "Try again", "View", "Pay
  deposit", "Stay signed in". Never "OK" or "Close".
- **Errors**: what failed, that nothing was lost, and Try again: "Couldn't send
  your reply. Nothing reached Riverside."
- No celebration ("Woohoo!").
- Translatable fields: `kind`, `title`, `text`, action `label`, `ariaLabel`,
  `busyLabel`, `dismissLabel` (L2-111). Data inside them (artist and church
  names, booking numbers, dates, amounts) is interpolated by the caller from
  the API and the formatting service. French runs about 30 % longer; titles and
  text wrap, and actions wrap to a second row.

## Performance

- Change detection: `OnPush` everywhere. The service keeps the visible stack
  and the queue in signals; the region renders with `@for (toast of visible();
  track toast.id)`. No change detection runs while a timer counts down: timers
  are `setTimeout` with the remaining time recomputed only on pause and resume,
  and the timer bar is a CSS animation paused with `animation-play-state`.
- Pause sources (pointer, focus, `visibilitychange`) are native listeners on
  the host registered outside Angular's zone where possible and only touch a
  `paused` signal on change.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Toast.ts`
  renders one success `zm-toast` for Luz Viva (kind "Saved", title "Saved Luz
  Viva", text "Your saved count is now 3.", Undo, timer bar) inside a static
  region; `ToastStack.ts` renders the three-slip stack of
  `notifications/booking-toast/stacked` ("Abigail accepted" with Pay deposit,
  "Message sent to Abigail", "Luz Viva deposit due"). Both are tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms, and
  appear in the `DarkTheme` composite.
- Regression rule: a change to the template, inputs, styles or change detection
  is measured against the base branch with `--fail-on-regression` before it is
  pushed.
- Layout stability: the region is fixed-position, so toasts never shift page
  content and count for nothing in Cumulative Layout Shift (L2-086).
- Weight: imports `zm-icon`, `zm-button` and `zm-button-link` only. No CDK
  overlay, no animation library; the region is in the initial shell, so the
  toast code is part of the shell bundle and must stay small.

## Acceptance criteria

### Rendering

- **AC-1** Given the app shell, when any page loads, then the body ends with exactly one `zm-toast-region` that has `role="status"`, `aria-live="polite"` and no toasts, and it takes no space and does not block clicks on the page beneath it. (L2-102)
- **AC-2** Given a signed-in booker saves Luz Viva, when the save succeeds and the toggle calls `show`, then a success toast appears with kind "Saved", title "Saved Luz Viva", its text and an "Undo" button, and activating Undo runs the caller's undo and dismisses the toast. (L2-026)
- **AC-3** Given the save request for Luz Viva fails, when the danger toast is shown, then it reads "Couldn't save Luz Viva. Try again." under the kind "Failed", has the `.toast--danger` slip, a "Try again" button and no timer bar. (L2-026)
- **AC-4** Given a booker with 200 saved artists tries to save Elijah Park, when the limit toast is shown, then it is a warning toast titled "You can save up to 200 artists." (L2-026)
- **AC-5** Given a device without the Web Share API, when Share copies the profile link, then a success toast titled "Link copied" appears with no text and no action. (L2-113)
- **AC-6** Given the request-toast with-action toast, when it renders, then "See booking" and "Open calendar" are both small link buttons in `.toast__actions`, and a third action passed in dev mode logs a console error and is not rendered. (L2-109)
- **AC-7** Given a toast with no `kind`, `text` or actions, when it renders, then none of `.toast__kind`, `.toast__text` or `.toast__actions` is in the DOM. (L2-109)

### Timing

- **AC-8** Given a success, info or warning toast, or one with an Undo action, when it appears and nothing touches it, then it starts leaving 5 seconds later and its timer bar empties over those 5 seconds. (L2-109)
- **AC-9** Given a timed toast with 2 seconds left, when the pointer moves over it, then the timer and the bar stop, and when the pointer leaves, the toast leaves 2 seconds later. (L2-109)
- **AC-10** Given a timed toast, when focus moves to its Undo button, then the timer pauses, and when focus leaves the toast, it resumes with the time that was left. (L2-109)
- **AC-11** Given a timed toast, when the tab is hidden, then the timer pauses, and when the tab is visible again it resumes with the time that was left. (L2-109)
- **AC-12** Given a danger toast "Couldn't send your reply", when 60 seconds pass, then it is still visible; it leaves only when it is dismissed or its retry resolves. (L2-109)
- **AC-13** Given the danger toast's "Try again" whose `run` returns a pending promise, when it is activated, then the button reads "Retrying…" with `aria-busy="true"`; when the promise resolves the toast leaves, and when it rejects the toast stays with "Try again" restored. (L2-109)
- **AC-14** Given an administrator idle for 28 minutes, when the persistent warning "You'll be signed out in 2 minutes." with "Stay signed in" is shown, then it has no timer bar and stays until they act, dismiss it, or the session ends. (L2-066)

### Stacking

- **AC-15** Given three toasts raised in order (info, warning, then success), when they are visible, then the region shows all three with the success toast first (on top) and each keeps its own timer. (L2-109)
- **AC-16** Given three timed toasts visible, when a fourth is raised, then the fourth appears first at once, the oldest leaves, and at most three are ever visible. (L2-109)
- **AC-17** Given a visible danger toast and three newer toasts, when the third newer one is raised, then the danger toast leaves the view into the queue and reappears, unchanged, as soon as a visible toast leaves; it is never dropped. (L2-109)
- **AC-18** Given a visible "Saved Luz Viva" toast with key `save:luz-viva`, when a toast with the same key is shown, then it replaces the first in place with the new copy and a fresh 5-second timer, and only one is visible. (L2-109)

### Keyboard and focus

- **AC-19** Given focus on Luz Viva's save toggle, when the success toast appears, then focus stays on the toggle. (L2-101)
- **AC-20** Given the booking-toast with-action toast, when the person tabs into the region, then focus moves to "Pay deposit", then to "Dismiss: Abigail accepted", and each shows the two-tone focus ring. (L2-101)
- **AC-21** Given focus on a toast's Undo button, when Escape is pressed, then the toast leaves and focus returns to the save toggle that raised it; if that toggle is gone, focus moves to the page's `h1`, never to `<body>`. (L2-101)
- **AC-22** Given a modal dialog is open, when a toast is raised, then it is held and not shown, and it appears and is announced after the dialog closes. (L2-101)

### Screen readers

- **AC-23** Given a screen reader is running, when "Saved Luz Viva" appears, then the region announces it politely, starting "Saved, Saved Luz Viva, Your saved count is now 3.", and focus does not move. (L2-102)
- **AC-24** Given a danger toast, when it appears, then it is announced through the same polite region, not an assertive alert. (L2-102)
- **AC-25** Given any toast, when its close button is inspected, then it is named "Dismiss: {title}", and an Undo with `ariaLabel` "Undo save Luz Viva" has a name that starts with its visible text. (L2-100)
- **AC-26** Given the stacked booking toasts in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-27** Given the light theme, when a success toast renders, then it is a `--color-bg-inverse` charcoal slip with `--color-fg-inverse` text and a `--color-accent` stripe, and in the dark theme the same toast is a paper slip on the stage. (L2-104)
- **AC-28** Given both themes, when contrast is measured, then toast text on the slip and danger toast text on `--color-danger-bg` are at least 4.5:1, and the danger icon and button outlines at least 3:1. (L2-103)

### Responsive

- **AC-29** Given a 360 px viewport, when a toast appears, then the region spans the width less `--space-4` each side and sits `--space-4` plus the safe-area inset above the bottom; from 576 px it is 24 rem wide, `--space-6` from the right and bottom. (L2-096)
- **AC-30** Given a 320 px viewport and the title "Couldn't save Grace Tabernacle Mass Choir. Try again.", when the toast renders, then the title wraps, nothing is clipped, and the page does not scroll horizontally. (L2-096)
- **AC-31** Given a touch device, when the close button and a small action are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-32** Given a page that sets `--zm-toast-offset` to its sticky bottom bar's height, when a toast appears, then the toast sits entirely above the bar and does not cover the focused control in it. (L2-096)
- **AC-33** Given the French catalogue, when "Couldn't save {artist name}. Try again." and "Try again" run about 30 % longer, then they wrap inside the slip without clipping. (L2-111)

### Content

- **AC-34** Given the accepted-booking toast, when its text is built from the formatted deposit and deadline, then it reads "Pay the $162.50 deposit by Sun 11 Oct, 2:40 p.m. to confirm Sat 14 Nov." (L2-110)
- **AC-35** Given a save that fails while offline, when the toggle reverts, then the danger toast of AC-3 is shown and nothing is queued to send later. (L2-114)

### Motion

- **AC-36** Given `prefers-reduced-motion: reduce`, when a toast enters and leaves, then it appears and disappears in place without rising or sliding, the timer bar is not shown, and it still leaves after 5 seconds. (L2-103)

### Performance

- **AC-37** Given the `Toast` and `ToastStack` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has no toast yet. To build it:

- Folder `frontend/projects/components/src/lib/toast/` with `toast.ts`
  (`Toast`, selector `zm-toast`, internal), `toast-region.ts` (`ToastRegion`,
  selector `zm-toast-region`), `toast.service.ts` (`ToastService`,
  `providedIn: 'root'`) and `toast.types.ts` (`ToastOptions`, `ToastAction`,
  `ToastRef`, `ToastDismissal`). Export the region, the service and the types
  from `public-api.ts`; keep `Toast` private.
- Render `zm-toast-region` once in each application shell (`zamaro` and
  `admin`), last in the body, so it exists before any toast is raised. Remove
  the hand-written `<div class="toast-region">` from any page.
- No CDK Overlay or Dialog: a toast is not modal, takes no focus and needs no
  positioning relative to an anchor; a fixed region is enough. No
  `LiveAnnouncer`: the region itself is the polite live region, and a second
  announcer would read every toast twice.
- Hold toasts while a modal dialog is open by reading the CDK `Dialog`
  service's `openDialogs` (the [dialog](dialog.md) builds on CDK Dialog); flush
  the hold when `afterAllClosed` emits.
- Leaving: set `data-state="leaving"`, then remove the toast on
  `transitionend` of `opacity`, with a fallback timeout of `--duration-base`
  read from the computed style (reduced motion makes the transition near
  zero).
- Timer: store `remaining` and `startedAt`; on pause, `clearTimeout` and
  subtract; on resume, `setTimeout(remaining)`. The bar's CSS animation runs
  for 5 s with `animation-play-state: paused` bound to the same `paused`
  signal, and restarts on replace by re-keying the element.
- The icon set must provide `check`, `info`, `warning`, `close`, `heart`,
  `bell`, `eye`, `lock`, `clock`, `x-circle` and `check-circle` (the mocks'
  leading icons); the [icon](icon.md) CRD owns them.
- Add the `Toast.ts` and `ToastStack.ts` scenarios, export them from
  `scenarios/index.ts`, and add the stack to the `DarkTheme` composite.

## Decisions

- **D-1** *One component that pages render, or a service?* A service plus one region. Toasts outlive the component that raised them (the save toggle can scroll away or the route can change), the stack and queue are app-wide (L2-109), and one region must exist from load for announcements (L2-102). A template component would need every page to own the stack.
- **D-2** *What happens when a fourth toast arrives?* The newest shows at once on top; the oldest timed toast leaves; an oldest danger or persistent toast goes back to the queue and returns when a slot frees. The sources differ: the booking-toast/stacked note says "a fourth pushes the oldest out", while the request-toast/stacked note and the design system say older ones wait in a queue and a queued error is never dropped. This rule satisfies both: what the person just did is confirmed immediately (the newest is first), timed toasts are not resurrected late, and no error is lost. Product should confirm.
- **D-3** *Dismiss control: `.close` or a ghost icon button?* The shared `.close` button, as in every notification mock and the design system's product-toast section; the ghost `.btn--icon` in the design system's first specimen is the older form. `.close` grows to 44 px under a coarse pointer (L2-096).
- **D-4** *How does the timer bar animate without change detection?* A CSS animation of the bar's width from 100 % to 0 over 5 s, paused with `animation-play-state` by the same `paused` state that stops the `setTimeout`. The mocks show a static `--value`, which a real timer would have to update every frame; a CSS animation keeps the INP budget (L2-086) and stays in step with the JavaScript timer because both pause together.
- **D-5** *What does reduced motion do to the timer bar?* It is hidden. A 5-second shrinking bar is motion (L2-103 disables animations), and a frozen full bar would misstate the time left. The timer itself is unchanged, as the design system requires.
- **D-6** *Does a danger toast use `role="alert"`?* No. The design system, the mock notes and L2-102 put every toast in one polite region; urgency is carried by the kind "Failed", the danger slip and the toast staying. Failures that block the task are alerts in the page, not toasts.
- **D-7** *What are the copy fields' names and tags?* `kind`, `title`, `text`, each a `<p>`. Some mocks write the kind as a `<span>`; the design system's markup uses `<p>`, and one element keeps the e2e contract single.
- **D-8** *What about toasts raised while a modal dialog is open?* They are held until the dialog closes. CDK Dialog hides the rest of the page from assistive technology, so a toast inserted then would be neither reachable nor reliably announced; dialogs report their own results in place with compact alerts, as every failed-dialog mock does.
- **D-9** *How do identical toasts merge?* By `key`: a toast with a matching key replaces the visible or queued one in place and restarts the timer. The design system's "Saved 3 artists" merging needs plural copy only the caller can write, so the caller passes the merged title with the same key.
- **D-10** *How does a retry report progress?* The action's `run` may return a promise; the button goes busy with `busyLabel` ("Retrying…", as in the design system's states table), the toast leaves on success and stays on failure. That is the design system's rule that a danger toast also leaves when its retry succeeds.
- **D-11** *Where does focus go when the origin is gone?* To the page's main heading, which the shell already makes focusable for route changes (L2-101), so focus is never lost to `<body>`.
- **D-12** *How do pages with sticky bottom bars avoid being covered?* Through `--zm-toast-offset`, the one public knob (AGENTS.md's `--zm-` rule), added to the region's bottom offset. The design system says to raise the region above sticky bars; the page knows the bar's height, the toast does not.
- **D-13** *What if three tall toasts do not fit at 200 % zoom?* The region caps its height below the top bar and scrolls. The design system did not render this case; L2-096 requires every function to stay available at 200 % zoom, and scrolling keeps every action reachable without hiding the newest toast.
