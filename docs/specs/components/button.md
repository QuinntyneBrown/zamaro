# Button

| Field | Value |
|---|---|
| Selector | `zm-button`, `zm-button-link`, `zm-button-anchor` |
| Library path | `frontend/projects/components/src/lib/button/` |
| Status | built |
| Traces to | L2-026, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`button.html`](../../design-system/components/button.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`dialogs/cancel-booking/default`](../../mocks/dialogs/cancel-booking/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), and every other page and dialog (see Usage) |
| Rendering | [`button.html`](button.html) |

## Purpose and scope

A button lets someone act: show the lineup, request a booking, try again, save
an artist, open a menu. One yellow primary button per view says what matters
most. The family has three components that share one look:

- `zm-button` renders a native `<button>` for actions.
- `zm-button-link` renders a router `<a>` for in-app navigation that should look
  like a button ("See Abigail's profile", "Back to Discover").
- `zm-button-anchor` renders an `<a href>` for addresses outside the app
  ("Email hello@zamaro.ca", a check document that opens in a new tab).

Keeping three components, rather than one that switches element by input, keeps
the most-rendered control free of a conditional slot (AGENTS.md: declare each
`ng-content` slot once).

Use something else when:

- it only goes somewhere inside running text → [link](link.md);
- it saves an artist on a ticket or headliner → [save toggle](save-toggle.md);
- it opens a list of actions → this button with `expanded`, plus [menu](menu.md)
  for the list.

Out of scope:

- Form validation, error summaries and idempotency keys. The form owns them; the
  button only reflects `busy` (L2-108).
- The confirmation flow around a danger action. The [dialog](dialog.md) owns it.
- Layout of button rows (`.cluster`, `.form-actions__buttons`, dialog footers).
  The parent owns the layout. The button only fills the width it is given when
  `block` is set.

## Usage

The mocks render about 3,350 buttons across 75 screens. Each row is one distinct
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Top bar on every screen | `zm-button` ghost, icon-only, `expanded` + `controls` | menu icon, label "Open menu" | expanded false/true | top bar (stage) |
| Top bar on every screen | `zm-button` ghost, icon-only, `pressed` | moon icon, visually hidden "Dark theme" | pressed false/true | top bar (stage) |
| `pages/discover/default` booking bar | `zm-button` primary, lg, `type="submit"`, block below SM | "Show the lineup" | default, busy "Checking calendars…" | light island on stage |
| `pages/discover/default` headliner | `zm-button-link` ink | "See Abigail's profile" + trailing arrow icon | default, hover, focus | surface |
| `pages/discover/default` band | `zm-button-link` secondary, lg | "Apply as an artist" + arrow | default | band |
| `pages/discover/empty` | `zm-button` primary + secondary in a cluster | "Search within 120 km · 2 free", "Show all styles" | default | canvas |
| `pages/discover/error`, `pages/artist/error` | `zm-button` primary with leading icon; `zm-button-anchor` ghost, sm | refresh icon + "Try again"; "Email hello@zamaro.ca" | default | canvas |
| `pages/artist/default` header | `zm-button-link` primary with fragment; `zm-button` secondary `pressed`; `zm-button` secondary | "Book for Sat 14 Nov"; heart + "Saved"/"Save"; share icon + "Share" | pressed true/false | stage |
| `pages/artist/default` tour dates | `zm-button` secondary, sm, `label` extends the visible text | "Pick", name "Pick Fri 20 Nov" | default, disabled | surface |
| `pages/artist/default` booking stub | `zm-button` primary, lg, block, submit (the stub form navigates to the request page; it never goes busy) | "Request to book · Sat 14 Nov" | default, disabled when the date is booked | surface |
| `pages/book/default`, `pages/book/submitting` | `zm-button` primary, lg, submit | "Send request to Abigail" | default, busy "Sending request…" | surface |
| `pages/edit-profile/default`, `dialogs/add-photo`, `dialogs/add-song` | `zm-button` ghost, icon-only, `label` | arrow and bin icons, "Move Goodness of God up", "Remove photo 2" | default, disabled at the ends of a list | surface |
| `pages/availability/default`, `dialogs/block-dates` | `zm-button` secondary, icon-only | chevrons, "Previous month, October 2026" | default | surface |
| Every form dialog footer (`add-church`, `add-song`, `write-review`, `report-problem`…) | `zm-button` primary submit + `zm-button` secondary | "Save changes" / "Cancel" | busy "Saving…", "Uploading…", "Posting…"; disabled | dialog, buttons stretch on phones |
| Destructive dialogs (`cancel-booking`, `decline-request`, `delete-account`, `hide-review`, `suspend-artist`…) | `zm-button` danger submit, optionally block; `zm-button` secondary | "Cancel booking", "Delete my account" / "Keep booking" | busy "Cancelling…", "Deleting…"; disabled | dialog |
| `pages/admin-artist`, `pages/admin-reviews` | `zm-button-link` danger, block or default | "Suspend…", "Hide review… of Elijah Park" | default | surface |
| `dialogs/pay-deposit`, `dialogs/pay-balance` | `zm-button` primary, lg, submit; money in the label | "Pay $162.50", busy "Paying $162.50…" | busy | dialog |
| Forms with a reset (`pages/discover` filters, `pages/edit-profile`) | `zm-button` secondary, `type="reset"` | "Discard", "Clear filters" | default | surface |
| Lists and tables (`pages/bookings`, `pages/requests`, `pages/admin-checks`, `pages/account` sessions) | `zm-button` / `zm-button-link` / `zm-button-anchor` sm, secondary, primary or ghost | "Review", "Pay $225 deposit", "End session", "View document of Abigail Mensah's check (opens in a new tab)" | default, disabled | surface, raised above a stretched card link |
| Forms while sending (`pages/book/submitting`, `dialogs/delete-account`) | `zm-button-link` secondary, `disabled` beside a busy submit | "Back to profile" | disabled link | surface |
| Toasts (`notifications/saved-toast`, `notifications/booking-toast`) | `zm-button` / `zm-button-link` sm, secondary or ghost | "Undo", "Go to your bookings" | default | toast (inverse), danger toast |
| Bulk bar (`pages/requests`) | `zm-button` sm | "Decline selected" | default | bulk bar (inverse) |
| Input groups (`pages/discover` location) | `zm-button` secondary beside an input | "Use my location" | default | input group |
| Account pages (`pages/accept-terms`, `pages/sign-up`) | `zm-button` secondary, block | "Sign out", "Resend the email" | default, disabled | surface |
| Design system only | `zm-button` link variant | "Show all styles" | all | canvas |

## Anatomy

1. **Container** — the native element with `.btn` and its modifiers. Square
   corners, 2 px rule, height from the size, content centred, gap `--space-2`
   between icon and label.
2. **Label** — the projected text. It is the accessible name unless `label` is
   set. Uppercase by CSS; the source copy stays sentence case.
3. **Icon (optional)** — a projected `zm-icon` before or after the label,
   `aria-hidden="true"`, `currentColor`. A trailing arrow means "go on". When
   pressed, the icon fills.
4. **Busy spinner** — `.btn[aria-busy="true"]::after`, a 1em ring after the
   label. It is generated by CSS, not markup.
5. **Print shadow (hover)** — a hard `--shadow-1` offset while the container
   lifts by `--transform-lift`.

Host: each `zm-*` host is `display: inline-flex` and renders exactly one native
element (`<button>` or `<a>`) carrying every class and ARIA attribute. With
`block`, the host is `display: flex` and the native element fills it. Classes a
parent puts on the host (for example `topbar__menu`) stay on the host.

## API

### Inputs shared by all three components

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'secondary' \| 'primary' \| 'ink' \| 'ghost' \| 'link' \| 'danger'` | `'secondary'` | no | Adds `.btn--{variant}`. Secondary adds no modifier. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.btn--sm` or `.btn--lg`. Medium adds no modifier. |
| `block` | `boolean` (attribute) | `false` | no | Adds `.btn--block`; the host becomes `display: flex` and fills its container. |
| `iconOnly` | `boolean` (attribute) | `false` | no | Adds `.btn--icon` (square). Needs `label`; in dev mode a missing `label` logs a console error naming the component. |
| `label` | `string` | — | with `iconOnly` | Sets `aria-label`. With visible text, it must start with that text (WCAG 2.5.3): "Pick" → "Pick Fri 20 Nov". |
| `describedBy` | `string` | — | no | Sets `aria-describedby` (space-separated IDs). |

### `zm-button` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | no | Native `type`. |
| `pressed` | `boolean \| undefined` | `undefined` | no | Toggle button. `undefined` omits `aria-pressed`; `true`/`false` writes it. |
| `expanded` | `boolean \| undefined` | `undefined` | no | Disclosure or menu button. `undefined` omits `aria-expanded`. |
| `controls` | `string` | — | no | Sets `aria-controls`. Use it with `expanded`. |
| `busy` | `boolean` | `false` | no | Sets `aria-busy="true"` and `aria-disabled="true"`. Never sets native `disabled`. While busy, activation is suppressed (see States). |
| `disabled` | `boolean` | `false` | no | Native `disabled`. Ignored while `busy` is true, so focus never drops to `<body>`. |

### `zm-button-link` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `link` | `string \| unknown[]` | — | yes | `routerLink`. |
| `queryParams` | `Record<string, string>` | `{}` | no | Carried forward search state ("?date=2026-11-14"). |
| `fragment` | `string` | — | no | In-page target, such as `book` for "Book for Sat 14 Nov". |
| `disabled` | `boolean` | `false` | no | Sets `aria-disabled="true"` and `tabindex="-1"` and removes the `href`, so activation does nothing. |

### `zm-button-anchor` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `href` | `string` | — | yes | `mailto:`, `tel:` or `https://`. |
| `newTab` | `boolean` (attribute) | `false` | no | Sets `target="_blank"` and `rel="noopener noreferrer"`. The visible or `label` text must end with the translated "(opens in a new tab)". |
| `disabled` | `boolean` | `false` | no | As for `zm-button-link`. |

### Outputs

None. Consumers listen to the native `click` on the host: `(click)="retry()"`.
The component guarantees that `click` does not reach the host while `busy` or
`disabled` is true.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text, `zm-icon`, a `.visually-hidden` span | Declared once in each component. Icons sit before or after the text in source order. |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Primary | `.btn--primary` | The one action the view exists for. Never two in one view. |
| Secondary | — | Every other action. The default. |
| Ink | `.btn--ink` | A strong secondary beside yellow ("See Abigail's profile"). |
| Ghost | `.btn--ghost` | Dense places: top bar, toolbars, list-row tools. No frame, no lift. |
| Link | `.btn--link` | A minor action that reads as a link inside a sentence. |
| Danger | `.btn--danger` | Destructive actions, inside a confirmation dialog or an admin detail page. |

| Size | Modifier | Height | Side padding | Label size |
|---|---|---|---|---|
| Small | `.btn--sm` | `--control-height-sm` (36 px; `--target-comfortable` under a coarse pointer) | `--space-3` | `--font-size-xs` |
| Medium | — | `--control-height-md` (44 px) | `--space-5` | `--font-size-sm` |
| Large | `.btn--lg` | `--control-height-lg` (56 px) | `--space-6` | `--font-size-md` |

The link variant uses `--target-min` height and `--space-0-5` padding, and
`--target-comfortable` under a coarse pointer. Icon-only buttons are square at
the size's height.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Variant colours | Role button (or link), name from text or `label` |
| Hover | `:hover` | Framed variants lift by `--transform-lift` over `--shadow-1` and take `--btn-bg-hover`. Ghost and link fill `--btn-bg-hover` without lifting. | — |
| Focus | `:focus-visible` | Two-tone ring: `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset`, with a `--color-focus-ring-offset` gap. On the stage and the top bar the outline is `--color-accent-on-stage`. | — |
| Active | `:active` | Background `--btn-bg-active`; shadow and lift removed (pressed flat) | — |
| Pressed | `pressed = true` | Yellow fill (`--color-accent`), `--color-fg-on-accent` label, icon filled. On the top bar the theme toggle turns its icon `--color-accent-on-stage` instead of filling. | `aria-pressed="true"` |
| Expanded | `expanded = true` | `--color-bg-subtle` fill, no lift; on the stage `--color-bg-stage-raised` | `aria-expanded="true"` |
| Busy | `busy = true` | Variant colours kept, spinner after the label, `cursor: progress`, width never shrinks | `aria-busy="true"`, `aria-disabled="true"`, still focusable, name kept |
| Disabled | `disabled = true` | `--color-bg-subtle` fill, `--color-fg-disabled` label and rule, no lift, `cursor: not-allowed`. Ghost and link stay frameless. A disabled primary loses its yellow. | Native `disabled` (button) or `aria-disabled` + `tabindex="-1"` (links): out of the tab order |

Surfaces re-skin the button through its component tokens; the button owns every
mapping (see Design):

| Surface ancestor | Effect |
|---|---|
| `.on-stage` | Secondary, ink, ghost and danger become paper outlines (`--color-fg-on-stage`); hover inverts with no lift. Primary and pressed keep yellow. |
| `.topbar` and `.on-stage`, ghost | Text `currentColor`, hover `--color-accent-on-stage`, no fill |
| `.band` | Solid stage fill, `--color-fg-on-stage` label, paper print shadow. Wins over an `.on-stage` ancestor (D-9). |
| `.toast` | Transparent, `--color-fg-inverse` label and rule, underline on hover |
| `.toast--danger` | `--color-fg-default` label, `--color-border-strong` rule, `--color-danger-bg` hover |
| `.bulk-bar` | As toast, on the inverse bar |
| `.input-group` | Height pinned to `--control-height-md` |
| `.dialog__footer` at XS | Host stretches (`flex: 1 1 auto`) so footer buttons share the width |
| `.card--interactive`, `.booking-list` | Host raised to `--z-raised` above the stretched card link |

## Markup

Rendered by `zm-button`, default and with icons:

```html
<zm-button>
  <button class="btn" type="button">Share</button>
</zm-button>

<zm-button variant="primary">
  <button class="btn btn--primary" type="button">
    <zm-icon name="refresh" aria-hidden="true">…</zm-icon>Try again
  </button>
</zm-button>
```

Icon-only, toggle, menu:

```html
<button class="btn btn--icon" type="button" aria-label="Share Abigail Mensah's profile">…</button>
<button class="btn" type="button" aria-pressed="true">…Saved</button>
<button class="btn btn--ghost btn--icon" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">…</button>
```

Busy and disabled:

```html
<button class="btn btn--primary btn--lg" type="submit" aria-busy="true" aria-disabled="true">Checking calendars…</button>
<button class="btn btn--sm" type="button" aria-label="Pick Fri 20 Nov" disabled>Pick</button>
```

Links:

```html
<zm-button-link variant="ink" link="/artists/abigail-mensah" [queryParams]="{ date: '2026-11-14' }">
  <a class="btn btn--ink" href="/artists/abigail-mensah?date=2026-11-14">See Abigail's profile …</a>
</zm-button-link>

<a class="btn" aria-disabled="true" tabindex="-1">Back to profile</a>

<a class="btn btn--sm" href="https://…/checks/abigail-mensah.pdf" target="_blank" rel="noopener noreferrer">View document of Abigail Mensah's check (opens in a new tab)</a>
```

Variants and sizes add only their modifier class (`.btn--ghost`, `.btn--link`,
`.btn--danger`, `.btn--sm`, `.btn--lg`, `.btn--block`); the structure is the same.

Consumer templates:

```html
<zm-button variant="primary" size="lg" type="submit" block [busy]="searching()">{{ (searching() ? 'discover.search.busy' : 'discover.search.submit') | transloco }}</zm-button>
<zm-button variant="ghost" iconOnly class="topbar__menu" [label]="'shell.menu.open' | transloco" [expanded]="menuOpen()" controls="site-menu"><zm-icon name="menu" /></zm-button>
<zm-button [pressed]="saved()" (click)="toggleSave()"><zm-icon name="heart" />{{ (saved() ? 'artist.saved' : 'artist.save') | transloco }}</zm-button>
<zm-button-anchor variant="ghost" size="sm" href="mailto:hello@zamaro.ca">{{ 'errors.email' | transloco }}</zm-button-anchor>
```

The classes and ARIA attributes on the native element are a contract: the e2e
page objects locate buttons by role and name, and by these classes for visual
parity. The `zm-icon` internals are free to change.

## Design

- Height `--btn-height`, from the size. Side padding `--btn-padding`; block
  padding `--space-1`; icon gap `--space-2`.
- Label `--text-label` at `--btn-font-size`, `--letter-spacing-wide`, uppercase,
  centred, `text-wrap: balance`. No text decoration.
- Rule `--border-width-thick` in `--btn-border`; radius `--radius-md` (square).
- Hover shadow `--btn-shadow-hover` (`--shadow-1`, colour `--color-shadow`);
  hover transform `--btn-transform-hover` (`--transform-lift`).
- Transitions on transform, box-shadow and background: `--duration-fast`,
  `--ease-standard`. The spinner turns once per `--duration-loop`.
- Busy spinner: 1em square, `--border-width-thick` ring in `currentColor` with
  a transparent right side, `--radius-full`.

Component tokens declared on `.btn`, in the component's own stylesheet:

| Token | Aliases | Overridden by |
|---|---|---|
| `--btn-bg` | `--color-bg-surface` | variants, pressed, expanded, disabled, surfaces |
| `--btn-fg` | `--color-fg-default` | variants, pressed, disabled, surfaces |
| `--btn-border` | `--color-border-strong` | variants, pressed, disabled, surfaces |
| `--btn-bg-hover` | `--btn-bg` | primary, ghost, link, danger, pressed, surfaces |
| `--btn-fg-hover` | `--btn-fg` | stage, top bar |
| `--btn-bg-active` | `--btn-bg-hover` | primary, ghost |
| `--btn-shadow-hover` | `--shadow-1` | ghost, link, stage, band, toast, bulk bar |
| `--btn-transform-hover` | `--transform-lift` | ghost, link, stage, toast, bulk bar |
| `--btn-height` | `--control-height-md` | sizes, link, input group, coarse pointer |
| `--btn-padding` | `--space-5` | sizes, link, icon-only |
| `--btn-font-size` | `--font-size-sm` | sizes |

Surface mappings use `:host-context(<surface>)` in the button's stylesheet, so
pages never reach into the button with global or `::ng-deep` styles.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Primary fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Primary fill, hover / active | `--color-accent-hover` / `--color-accent-active` | `--palette-signal-300` / `--palette-signal-400` | `--palette-signal-300` / `--palette-signal-400` |
| Primary label and rule | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Secondary fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Secondary label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Secondary rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Ink fill / label | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Ghost hover / active | `--color-bg-subtle` / `--color-bg-subtle-hover` | `--palette-ink-100` / `--palette-ink-200` | `--palette-ink-700` / `--palette-ink-600` |
| Link hover | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Danger fill / hover | `--color-danger-solid` / `--color-danger-solid-hover` | `--palette-red-600` / `--palette-red-700` | `--palette-red-300` / `--palette-red-50` |
| Danger label | `--color-fg-on-danger` | `--palette-paper-bright` | `--palette-ink-750` |
| Disabled label and rule | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |
| Hover shadow | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Label on primary |
| `--color-fg-on-accent` | `--color-accent-hover` | 4.5:1 | Label on primary, hover |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Ink label |
| `--color-fg-on-danger` | `--color-danger-solid` | 4.5:1 | Danger label |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Secondary label |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Secondary rule on a card |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring on the page |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Outline button label on the stage |

Disabled text is exempt from contrast minimums (WCAG 1.4.3), but the disabled
state must not rely on colour alone: it also loses its lift and shows the
`not-allowed` cursor. Under forced colours the rule uses `CanvasText` and the
focus ring `Highlight` (tokens), and the busy spinner stays visible because it
is drawn in `currentColor`.

## Responsive behaviour

- Labels never truncate. They wrap onto a balanced second line rather than
  overflow. In the booking stub at 360 px, "Request to book · Sat 14 Nov" wraps
  to two lines, as the design system predicts (booking-form CRD). The button
  grows taller and stays inside the stub.
- Below SM (576 px) a form's submit button is `block`. The consumer sets
  `block` from the breakpoint or by layout; the button fills its container.
- At XS, buttons in a `.dialog__footer` stretch to share the width.
- Under a coarse pointer, small and link buttons grow to `--target-comfortable`
  (44 px). Medium and large already meet it, and icon-only buttons are square at
  the size's height.
- At 320 px no label clips or forces horizontal scroll. At 200 % zoom the label
  wraps and the button grows taller; it never overlaps neighbours.

## Accessibility

### Role and pattern

`zm-button` is a native `<button>`; the links are native `<a>`. A toggle follows
the [APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) with
`aria-pressed`. A menu button follows the
[APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
with `aria-expanded` and `aria-controls`. No `<div>` with a click handler, and
no `role="button"` on a link.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves focus to and from the button in DOM order. Disabled buttons and disabled links are skipped; busy buttons are not. |
| <kbd>Enter</kbd> | Activates a button; follows a link. Does nothing while busy or disabled. |
| <kbd>Space</kbd> | Activates a button on key up (moving away before release cancels). Does not activate links. Does nothing while busy. |

### Focus

The two-tone ring appears on `:focus-visible` only, so mouse clicks do not show
it. It is never clipped by an ancestor's `overflow` and never hidden under a
sticky header (the page reserves `scroll-padding`). Becoming busy never moves
focus. When `busy` returns to false, focus stays on the button.

### Labelling

The visible label is the accessible name. Icon-only buttons take their name
from `label`, which names the object: "Share Abigail Mensah's profile", "Move
Goodness of God up". When `label` extends a visible label, the visible text
comes first. A toggle keeps one name and exposes its state through
`aria-pressed`; its visible text may change ("Save" / "Saved") to match L2-026.
Icons are `aria-hidden`.

### Announcements

The button announces nothing itself. Busy progress is announced by the page's
`role="status"` region ("Finding who's free on Saturday 14 November 2026…");
the button adds `aria-busy`.

### Motion

The lift, shadow and fill take `--duration-fast`. Under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero, so
states change instantly, and the busy spinner stops turning (it stays visible
as a static ring).

## Content and internationalisation

- Start with a verb, sentence case in the source: "Request to book", "Try
  again", "Apply as an artist". Never "OK", "Submit" or "Click here".
- Name the object or the date when the context is ambiguous: "Book for Sat 14
  Nov". A middle dot separates action and detail: "Search within 120 km · 2
  free".
- Destructive labels name what is lost: "Cancel booking", "Delete my account".
- Four words or fewer before the dot. At 360 px a label with a date may wrap
  to two lines, never more in English.
- Busy labels use the present participle and an ellipsis: "Checking
  calendars…", "Sending request…", "Paying $162.50…".
- Dates use the short en-CA form "Sat 14 Nov", money "$1,800" or "$162.50"
  (L2-110), formatted by the API library's formatting service before the string
  reaches the button.
- The button has no copy of its own. Every string (projected text, `label`,
  the "(opens in a new tab)" suffix) comes from the translation catalogue
  through the consumer (L2-111). French labels run about 30 % longer and wrap,
  never clip.

## Performance

- Change detection: `OnPush`, signal inputs, classes from one `computed`. No
  `effect`, no subscriptions, no host listeners except the activation guard.
- Perf-test scenarios: `Button.ts` renders the top-bar theme toggle (ghost,
  icon-only, moon icon, "Dark theme"); `ButtonLink.ts` renders "See Abigail's
  profile" (ink, `/artists/abigail-mensah`); `ButtonAnchor.ts` renders "Email
  the Zamaro team" (`mailto:hello@zamaro.ca`, secondary). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly 100–300 ms.
- Composite scenarios that include it: `TopBar`, `DarkTheme`, `Headliner`,
  `EmptyState`, `Alert`.
- Becoming busy never changes the button's width or height (the spinner takes
  space the label already reserves, and the busy label is the same length or
  shorter in the catalogue). It causes no layout shift (L2-086).
- Imports only Angular core, `RouterLink` (in `zm-button-link`) and nothing
  else.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-button variant="primary">Request to book</zm-button>`, when it renders, then the host contains exactly one `<button type="button" class="btn btn--primary">` whose accessible name is "Request to book". (L2-100)
- **AC-2** Given each variant (secondary, primary, ink, ghost, link, danger) and each size (sm, md, lg), when it renders, then the native element carries `.btn` plus exactly the modifier classes in the Variants and sizes tables, and matches the design-system rendering in the visual test. (L2-096)
- **AC-3** Given `block` is set inside a 343 px wide booking stub, when it renders, then the host and its `<button>` are 343 px wide. (L2-096)
- **AC-4** Given `<zm-button-link variant="ink" link="/artists/abigail-mensah" [queryParams]="{ date: '2026-11-14' }">`, when it is activated, then the router navigates to `/artists/abigail-mensah?date=2026-11-14` without a full page load. (L2-100)
- **AC-5** Given `<zm-button-anchor newTab href="https://…/checks/abigail-mensah.pdf">` with the text "View document of Abigail Mensah's check (opens in a new tab)", when it renders, then the anchor has `target="_blank"` and `rel="noopener noreferrer"`. (L2-100)

### States

- **AC-6** Given a submit button "Send request to Abigail" in a form, when `busy` becomes true, then the button has `aria-busy="true"` and `aria-disabled="true"`, does not have the `disabled` attribute, keeps focus, shows the spinner, and keeps its primary colours. (L2-108)
- **AC-7** Given a busy submit button, when it is clicked, or Enter is pressed in one of the form's text fields, then no `submit` event fires on the form and no `click` reaches the host. (L2-108)
- **AC-8** Given a busy button, when its width is measured before and after `busy` becomes true with the label changing from "Pay $162.50" to "Paying $162.50…", then the width does not decrease and the cumulative layout shift is 0. (L2-086)
- **AC-9** Given the "Pick" button for Fri 20 Nov is `disabled`, when it renders, then it has the native `disabled` attribute, the `--color-bg-subtle` fill and `--color-fg-disabled` label, no hover lift, and Tab skips it. (L2-101)
- **AC-10** Given `busy` and `disabled` are both true, when it renders, then the button is busy (focusable, `aria-disabled="true"`, no native `disabled`). (L2-108)
- **AC-11** Given `<zm-button-link disabled>` "Back to profile" beside the busy "Send request to Abigail" submit, when it renders, then the anchor has `aria-disabled="true"`, `tabindex="-1"` and no `href`, and activating it does not navigate. (L2-108)
- **AC-12** Given the profile header's save toggle for Abigail Mensah, when `pressed` is true, then the button has `aria-pressed="true"`, a `--color-accent` fill, a filled heart icon and the text "Saved"; when false, then `aria-pressed="false"`, the secondary look and the text "Save". (L2-026)
- **AC-13** Given the top-bar menu button with `expanded` false, when the menu opens and `expanded` becomes true, then `aria-expanded` changes to "true", `aria-controls` names the menu's ID, and the button shows the `--color-bg-stage-raised` fill. (L2-101)
- **AC-14** Given `pressed` and `expanded` are undefined, when the button renders, then it has neither `aria-pressed` nor `aria-expanded`. (L2-100)

### Keyboard and focus

- **AC-15** Given focus moves to a button with the keyboard, when it receives focus, then a two-tone ring is visible: a `--focus-ring-width` outline in `--color-focus-ring` offset by `--focus-ring-offset`, over a `--color-focus-ring-offset` gap. (L2-101)
- **AC-16** Given a button inside the top bar or an `.on-stage` area, when it receives keyboard focus, then the ring is `--color-accent-on-stage` with a `--color-bg-stage` gap. (L2-101)
- **AC-17** Given the button is clicked with a mouse, when it gains focus, then no focus ring is drawn. (L2-101)
- **AC-18** Given a focused `zm-button`, when Space is pressed and released, then `click` fires once; given a focused `zm-button-link`, when Space is pressed, then it does not navigate. (L2-101)

### Screen readers

- **AC-19** Given an icon-only "Remove photo 2" button, when it is read by a screen reader, then it is announced as "Remove photo 2, button" and the icon is not announced. (L2-100)
- **AC-20** Given a "Pick" button with `label` "Pick Fri 20 Nov", when its accessible name is computed, then it is "Pick Fri 20 Nov", which begins with the visible text. (L2-100)
- **AC-21** Given the axe-core run over a page with every button variant and state in both themes, when it runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-22** Given the dark theme, when every variant renders, then the primary fill stays `--color-accent` with an ink label, the secondary is a `--color-bg-surface` charcoal with a `--color-border-strong` rule, and the hover shadow is `--color-shadow` (yellow). (L2-104)
- **AC-23** Given both themes, when contrast is measured, then each label-on-fill pair in the Colour table is at least 4.5:1 and the secondary rule and focus ring are at least 3:1 against their backgrounds. (L2-103)
- **AC-24** Given a secondary button inside the yellow `.band`, including a band placed inside an `.on-stage` area, when it renders, then it has the stage fill and a `--color-fg-on-stage` label; given one inside a `.toast`, then it is transparent with a `--color-fg-inverse` label and rule. (L2-104)

### Responsive

- **AC-25** Given a coarse pointer, when a small button ("Pick") or a link-variant button is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given a 320 px viewport and text zoomed to 200 %, when the booking stub renders "Request to book · Sat 14 Nov", then the label wraps inside the button, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-27** Given the French catalogue, when "Request to book · Sat 14 Nov" is replaced by a label 30 % longer, then the button grows taller and never clips text. (L2-111)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when a button is hovered, then its lift and shadow appear without a transition; when it is busy, then the spinner is a static ring. (L2-103)

### Performance

- **AC-29** Given the `Button`, `ButtonLink` and `ButtonAnchor` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-button`, `zm-button-link` and `zm-button-anchor`. To meet
this CRD:

- Add the `link` and `danger` variants and their styles (including
  `.btn--danger:disabled` and `.btn--ghost:disabled, .btn--link:disabled`).
- Add the `sm` size and its coarse-pointer rule.
- Add `block`, with `:host` becoming `display: flex`, to all three components.
- Add `iconOnly`, `label` and `describedBy` to `zm-button-link` and
  `zm-button-anchor`; add `describedBy` to `zm-button`.
- Accept `type="reset"`.
- Add `fragment` and `disabled` to `zm-button-link`; add `newTab` and `disabled`
  to `zm-button-anchor`.
- Make `disabled` lose to `busy`: `[disabled]="disabled() && !busy()"`.
- Add the activation guard. A capture-phase click listener on the native
  `<button>` calls `preventDefault()` and `stopPropagation()` while busy, so
  neither form submission nor the consumer's `(click)` runs (AC-7).
- Move every surface mapping into `button.scss` with `:host-context`: `.band`,
  `.toast`, `.toast--danger`, `.bulk-bar`, `.input-group`, `.dialog__footer` at
  XS, `.card--interactive` and `.booking-list`, plus the existing `.topbar` and
  `.on-stage`. Also map the expanded fill on the stage.
- Make the `.band` mapping beat `.on-stage` when a band sits on the stage. Use
  `:host-context(.on-stage .band)` or a later, more specific rule (D-9).
- Stop the spinner under reduced motion.
- Log a dev-mode console error when `iconOnly` is set without `label`.
- Add perf-test cases to the existing scenarios only if the scenario's rendered
  instance changes. Do not lower iterations.

## Decisions

- **D-1** *One component with an `href` input, or three?* Three, as built. A single component would render `<a>` or `<button>` by condition and need its slot in an `ng-template` on every render of the most-used control. The split also makes the element choice explicit at each call site.
- **D-2** *Should the button expose its own output for activation?* No. The native `click` bubbles to the host and is the idiom pages already use (`(click)="store.retry()"`). The component's job is to guarantee that `click` does not escape while busy or disabled.
- **D-3** *Does `disabled` win over `busy`?* No, busy wins. The design system forbids native `disabled` on a busy button because it drops focus to `<body>`. A form that is sending is busy, whatever else it says.
- **D-4** *How are disabled links built?* With `aria-disabled="true"`, `tabindex="-1"` and no `href`, as in `pages/book/submitting` and `dialogs/delete-account`. An anchor without `href` cannot navigate and is not focusable by default.
- **D-5** *How do surfaces re-skin the button inside Angular's style encapsulation?* With `:host-context(<surface>)` rules in the button's own stylesheet, which the library already uses for the top bar and stage. Global stylesheets stay limited to foundations (AGENTS.md), and the button stays the only owner of its look.
- **D-6** *The mocks render "Accept", "Pay $162.50 deposit" and "Leave a review" as `<a class="btn">` that link between mock states. Are those links?* No. In the product they perform an action, so they are `zm-button`. Only real navigation uses `zm-button-link` or `zm-button-anchor`.
- **D-7** *The link variant exists only on the design-system page. Keep it?* Yes. The design system specifies it with every state, and adding it later would change the variant union every consumer types against.
- **D-8** *What does a toggle's accessible name do when its text changes from "Save" to "Saved"?* The name follows the visible text, as L2-026 requires the control to read "Saved". `aria-pressed` carries the state. For the top-bar theme toggle the name is fixed ("Dark theme") and only `aria-pressed` changes.
- **D-9** *Which mapping wins when a band sits on the stage?* The band. The nearest surface decides how a button looks, and in `components.css` the `.on-stage` outline rule beats `.band .btn`, which turns the band's button into a paper outline on yellow that nearly disappears (band CRD D-4). The button's own stylesheet orders the mappings so the band wins.
