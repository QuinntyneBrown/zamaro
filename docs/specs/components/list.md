# List

| Field | Value |
|---|---|
| Selector | `zm-list` |
| Library path | `frontend/projects/components/src/lib/list/` |
| Status | planned |
| Traces to | L2-025, L2-067, L2-072, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 |
| Design system | [`list.html`](../../design-system/components/list.html) |
| Source mocks | [`pages/account/default`](../../mocks/pages/account/default.html) and its states, [`pages/mfa-setup/codes`](../../mocks/pages/mfa-setup/codes.html), [`dialogs/two-step-code/codes`](../../mocks/dialogs/two-step-code/codes.html), [`dialogs/two-step-code/new-codes`](../../mocks/dialogs/two-step-code/new-codes.html), [`dialogs/delete-account/default`](../../mocks/dialogs/delete-account/default.html), [`dialogs/suspend-artist/default`](../../mocks/dialogs/suspend-artist/default.html) |
| Rendering | [`list.html`](list.html) |

## Purpose and scope

A list stacks short records that are read one at a time: what suspending an
artist changes, Naomi's ten recovery codes, her signed-in devices, and — on
phones — a short table turned into rows. Each item has a title and at most one
line of detail, an optional avatar before it and an optional badge, price or
small button after it. In the interactive form each whole row is one link or
button.

Use something else when:

- people compare three or more facts across rows → [table](table.md);
- they browse artists with pictures and prices → [ticket](ticket.md);
- it is a booking or request row → [booking list](booking-list.md);
- it is songs → [setlist](setlist.md); days → [tour dates](tour-dates.md);
- it is a menu of actions → [menu](menu.md).

Out of scope:

- The empty state that replaces an empty list ([empty state](empty-state.md)).
  A list never renders with no items.
- What a row's link opens and where focus goes inside the opened content; the
  page owns routing and focus after navigation.
- Ending a session: the "End session" request, the busy state and the toast.
  The page passes `busy`/`disabled` to the projected button in the trail.
- The `<nav>` around a list of navigation links; the page wraps it.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `dialogs/suspend-artist/default` "What suspending changes" | `divided`, meta-only items | "The profile at zamaro.ca/artists/marcus-bell-trio shows not found." … "1 confirmed booking is listed for you to resolve: ZAM-0097, Sun 25 Oct." | default | dialog |
| `pages/mfa-setup/codes`, `dialogs/two-step-code/codes`, `new-codes` | `grid`, `ordered`, `code` items, `label` "10 recovery codes" | "7kq4-m2xd" … "j7ve-5pkh"; new "b6tn-3qzk" … | default | surface, dialog |
| `pages/account/*` "Signed-in devices", `dialogs/delete-account/*`, `dialogs/two-step-code/*` | `device` | "Chrome on Windows" / "Burlington, ON · This device · active now" + badge "This device"; "Safari on iPhone" + sm button "End session" named "End session on Safari on iPhone" | default, button disabled while the form submits | surface, dialog |
| Phone layout of a short table (design system, Responsive) | `interactive`, `divided`, avatar, link items, `current` | "Abigail Mensah" / "Sat 14 Nov · Worship night" + stamp "Requested" | default, hover, focus, current | canvas, side panel |
| Design system only | plain, `divided` with avatar and badge trail | "Sound check 90 minutes before the service"; Naomi's saved artists with "Free Sat 14 Nov" / "Booked" | default, loading | canvas |

## Anatomy

1. **List** — `<ul class="list" role="list">` (or `<ol>` with `ordered`),
   with `.list--divided`, `.list--grid` or `.list--interactive`; the device
   variant renders `<ul class="device-list" role="list">`.
2. **Item** — `<li class="list__item">`: flex row of leading, content and trail,
   `--space-3` block padding, `--space-4` gap.
3. **Leading (optional)** — a 40 px [avatar](avatar.md), `aria-hidden` when
   the name sits beside it.
4. **Content** — `.list__content`: a column that shrinks and wraps
   (`min-width: 0`).
5. **Title** — `.list__title`: `--text-label`. The name people scan for.
6. **Meta** — `.list__meta`: one muted line, parts joined by " · ".
7. **Code (grid lists)** — `<code>` as the whole item content.
8. **Trail (optional)** — `.list__trail`: pushed to the end, never shrinks; a
   badge, a stamp, a price, or (static lists only) a small button.
9. **Row link (interactive)** — `.list__link`: an `<a>` or `<button>` filling
   the row, at least 44 px tall, holding leading, content and trail.
10. **Device row** — `<li>` with a `<span>` of `<strong>` (device) over a
    `.text-muted` line, then the trail.

Host: `zm-list` is `display: block` and renders the list element; it carries no
role.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `items` | `readonly ListItem[]` | — | yes | At least one item. Tracked by `id`. |
| `variant` | `'default' \| 'interactive' \| 'grid' \| 'device'` | `'default'` | no | `interactive` adds `.list--interactive` and renders row links; `grid` adds `.list--grid`; `device` renders `.device-list` rows. |
| `divided` | `boolean` (attribute) | `false` | no | Adds `.list--divided` (default and interactive). The device list is always divided. |
| `ordered` | `boolean` (attribute) | `false` | no | Renders `<ol>` instead of `<ul>`. |
| `label` | `string` | — | no | `aria-label` on the list ("10 recovery codes", "Naomi's saved artists"). |
| `labelledBy` | `string` | — | no | `aria-labelledby`; wins over `label`. |
| `currentToken` | `'true' \| 'page'` | `'true'` | no | The `aria-current` value on the current row link. |
| `loading` | `boolean` (attribute) | `false` | no | Renders `loadingCount` skeleton items. |
| `loadingCount` | `number` | `3` | no | Skeleton items while loading. |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden "Loading". |

`ListItem`:

| Field | Type | Rule |
|---|---|---|
| `id` | `string` | Key; emitted by `activated`. |
| `title` | `string?` | `.list__title`; in `device`, the `<strong>` ("Chrome on Windows"). |
| `meta` | `string?` | `.list__meta` (device: the muted line). |
| `code` | `string?` | `grid` items: rendered as `<code>`. |
| `avatar` | `{ name: string; kind?: 'person' \| 'group'; initials?: string; size?: 'sm' \| 'md'; photo?: { src: string; srcset: string } \| null }?` | A decorative [`zm-avatar`](avatar.md) before the content, passed through to its inputs of the same names: `name` derives the initials ("Abigail Mensah" → "AM"), `kind="group"` gives an act the ink disc (`.avatar--ink`), `initials` overrides, `size` defaults to `md` (40 px; `sm` 32 px in compact rows), `photo` replaces the initials. Never `standalone`, so it stays `aria-hidden` beside the title. |
| `link` | `string \| unknown[]?` | `interactive`: the row is a `routerLink` `<a class="list__link">`. Without it, the row is a `<button class="list__link" type="button">`. |
| `queryParams` | `Record<string, string>?` | With `link`. |
| `current` | `boolean?` | `interactive`: `aria-current` on the row link (inverse fill). |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `activated` | `string` (the item `id`) | An interactive row rendered as a `<button>` is activated. Link rows navigate and emit nothing. |

### Content templates

| Template | Context | Rule |
|---|---|---|
| `<ng-template zmListTrail let-item>` | `ListItem` | The trail for each item: a `zm-badge`, `zm-stamp`, a price, or — in `default` and `device` only — one `zm-button size="sm"`. Inside an interactive row link it must hold no interactive element (dev-mode error when it does). An empty result renders no `.list__trail`. |

Queried once with `contentChild`; there is no `ng-content`.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | `.list` | Static facts: what a booking includes, what suspending changes. |
| Divided | `.list--divided` | Two-line items; a hairline between items, none above the first. |
| Interactive | `.list--interactive` | Each row opens a record: a short table on phones, a side list of requests. |
| Grid | `.list--grid` | Two columns of short items (recovery codes). |
| Device | `.device-list` | Signed-in sessions: device over place and activity, an action or "This device". |

One size. Height follows content: one line, two lines, or a 40 px avatar.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default (static) | — | Title, meta, trail | List item text |
| Row hover | `.list__link:hover` | `--color-accent-subtle` highlighter | — |
| Row focus | `.list__link:focus-visible` | Two-tone ring around the whole row | — |
| Current | `current` | Inverse fill (`--color-bg-inverse`, `--color-fg-inverse`); meta at full strength | `aria-current="true"` (or `page`) |
| Trail button busy / disabled | the projected `zm-button`'s `busy` / `disabled` | As [button](button.md) | As button |
| Loading | `loading` | `loadingCount` items: `zm-skeleton circle` (when avatars are expected) + two `text` lines | Visually hidden "Loading"; skeletons hidden |
| Inert | page `inert` behind a dialog | — | Not reachable |

## Markup

Divided, meta only:

```html
<zm-list>
  <ul class="list list--divided" role="list">
    <li class="list__item"><div class="list__content"><span class="list__meta">The trio leaves search straight away.</span></div></li>
  </ul>
</zm-list>
```

Grid of codes:

```html
<ol class="list list--grid" role="list" aria-label="10 recovery codes">
  <li class="list__item"><code>7kq4-m2xd</code></li>
</ol>
```

With avatar and trail:

```html
<li class="list__item"><zm-avatar name="Abigail Mensah"><span class="avatar" aria-hidden="true">AM</span></zm-avatar><div class="list__content"><span class="list__title">Abigail Mensah</span><span class="list__meta">Brampton · 44 km · from $650</span></div><span class="list__trail"><zm-badge variant="free">…Free Sat 14 Nov…</zm-badge></span></li>
```

Interactive:

```html
<ul class="list list--interactive list--divided" role="list">
  <li class="list__item"><a class="list__link" href="/bookings/ZAM-0114" aria-current="true"><zm-avatar name="Abigail Mensah"><span class="avatar" aria-hidden="true">AM</span></zm-avatar><span class="list__content"><span class="list__title">Abigail Mensah</span><span class="list__meta">Sat 14 Nov · Worship night</span></span><span class="list__trail"><zm-stamp class="stamp stamp--requested">Requested</zm-stamp></span></a></li>
</ul>
```

Inside a link the content and trail are `<span>`s, not `<div>`s; the avatar
already renders a `<span>`. An act uses the group disc:
`<zm-avatar name="Hosanna Collective" kind="group"><span class="avatar avatar--ink" aria-hidden="true">HC</span></zm-avatar>`.

Inside the list's own template the avatar is:

```html
@if (item.avatar; as a) {
  <zm-avatar [name]="a.name" [kind]="a.kind ?? 'person'" [initials]="a.initials" [size]="a.size ?? 'md'" [photo]="a.photo ?? null" />
}
```

Device:

```html
<ul class="device-list" role="list">
  <li><span><strong>Chrome on Windows</strong><span class="text-muted">Burlington, ON · This device · active now</span></span><zm-badge>…This device…</zm-badge></li>
  <li><span><strong>Safari on iPhone</strong><span class="text-muted">Burlington, ON · Last active 2 hours ago</span></span><zm-button size="sm" …><button class="btn btn--sm" type="button" aria-label="End session on Safari on iPhone">End session</button></zm-button></li>
</ul>
```

Consumer templates:

```html
<zm-list variant="device" [items]="sessions()">
  <ng-template zmListTrail let-s>
    @if (s.id === currentSessionId()) {
      <zm-badge>{{ 'account.devices.thisDevice' | transloco }}</zm-badge>
    } @else {
      <zm-button size="sm" [label]="'account.devices.endLabel' | transloco: { device: s.title }" [disabled]="saving()" (click)="endSession(s.id)">{{ 'account.devices.end' | transloco }}</zm-button>
    }
  </ng-template>
</zm-list>
<zm-list variant="grid" ordered [label]="'mfa.codes.label' | transloco: { count: 10 }" [items]="codes()" />
```

The `.list*` and `.device-list` classes are the contract; page objects read rows
by `.list__title` and act on trail buttons by name.

## Design

- `.list`: no list style, padding or margin. Item: flex, `align-items: center`,
  gap `--space-4`, padding `--space-3` 0.
- `.list--grid`: grid of two equal columns, gap `--space-2` `--space-5`.
- `.list--divided`: `--border-width-hairline` `--color-border-default` between
  items.
- Content: flex column, `min-width: 0`, `flex: 1`; title `--text-label`; meta
  `--text-body-sm`, `--color-fg-muted`.
- Trail: `margin-left: auto`, `flex: none`.
- Interactive: item padding 0; `.list__link` flex, gap `--space-4`, full width,
  `min-height: --target-comfortable`, padding `--space-3`, inherits colour and
  font, no underline, left-aligned.
- Device list: grid; row flex wrap, space-between, gap `--space-2` `--space-4`,
  `padding-block: --space-3`, bottom rule hairline `--color-border-default`;
  label `<strong>` `--text-label`, uppercase, `--letter-spacing-wide`; detail
  `--text-body-sm`.
- The hover fill changes instantly; nothing moves.

No component tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Title | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Meta | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Divider | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Row hover | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Current row | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Title |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Meta |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Title on a hovered row |
| `--color-fg-muted` | `--color-accent-subtle` | 4.5:1 | Meta on a hovered row |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Current row |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring |

Dividers are decorative and exempt from WCAG 1.4.11.

## Responsive behaviour

- Items are one flex row at every width: content shrinks and wraps, avatar and
  trail never shrink.
- At 360 px a badge trail such as "Free Sat 14 Nov" fits beside a two-line
  title. Trails longer than about 16 characters belong in the meta line.
- Device rows wrap the action under the text on narrow screens.
- The grid stays two columns down to 320 px; codes are 9 characters.
- Interactive rows are at least 44 px tall and full width.
- At 320 px nothing overflows; at 200 % zoom rows grow taller.

## Accessibility

### Role and pattern

A native `<ul>` or `<ol>` with `role="list"`. Interactive rows are ordinary
links or buttons; this is not the APG Listbox, so there is no arrow-key
selection. A list of navigation links sits in a page-owned `<nav>`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Interactive: row to row. Static and device lists: only trail buttons. |
| <kbd>Enter</kbd> | Follows a row link or activates a row button. |
| <kbd>Space</kbd> | Activates a row button. |

### Focus

The ring wraps the whole `.list__link` (`--focus-ring-width`,
`--focus-ring-offset`), visible on the ink current row. After a trail action
that removes its row ("End session"), the page moves focus to the next row's
button, or the list's heading.

### Labelling

- A row link's name is its text: title, meta and trail ("Abigail Mensah Sat 14
  Nov · Worship night Requested").
- Avatars beside a name are `aria-hidden`.
- Trail buttons are named after the row ("End session on Safari on iPhone").
- Label the list when the page has more than one.

### Announcements

None. The page announces results of trail actions.

### Motion

None. Loading skeletons stop shimmering under `prefers-reduced-motion`.

## Content and internationalisation

- The title is the name people scan for; never start it with a status or date.
- Meta is one line, most useful first, joined with " · ": "Brampton · 44 km ·
  from $650", "Burlington, ON · Last active 2 hours ago".
- One trail per row: a badge, a price or a small button.
- Codes are shown exactly as issued, in `<code>`.
- Titles and meta are data or catalogue strings passed in; the component has no
  copy of its own (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs, `@for … track item.id`. No
  `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/List.ts`
  renders Naomi's three signed-in devices (`device`, "This device" badge and two
  "End session" buttons). Add `ListInteractive.ts`, which renders three request
  rows with avatars, stamps and one current row. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Layout stability: loading items sit in the final row positions (L2-105).
- Imports: Angular core, `RouterLink`, `NgTemplateOutlet`, `zm-avatar`,
  `zm-skeleton`.

## Acceptance criteria

### Rendering

- **AC-1** Given the suspend-artist dialog for Marcus Bell Trio, when its divided list of four consequences renders, then it is one `<ul class="list list--divided" role="list">` of `.list__item`s, each holding a `.list__meta` sentence, with a hairline between items and none above the first. (L2-067)
- **AC-2** Given Naomi's ten new recovery codes, when the `grid` list renders `ordered` with `label` "10 recovery codes", then it is an `<ol class="list list--grid" role="list" aria-label="10 recovery codes">` of ten `<code>` items in two columns. (L2-072)
- **AC-3** Given Naomi's signed-in devices, when the `device` list renders, then each row shows the device in uppercase bold over "Burlington, ON · Last active 2 hours ago", the current device ends with a "This device" badge and the others with "End session" buttons. (L2-025)
- **AC-4** Given the End session buttons, when their names are listed, then they read "End session on Safari on iPhone" and "End session on Firefox on Mac". (L2-025)
- **AC-5** Given an item with `avatar` `{ name: 'Abigail Mensah' }` and a Free badge trail, when it renders, then a `zm-avatar` showing "AM" comes first and is `aria-hidden`, an act with `kind: 'group'` ("Hosanna Collective") shows the ink "HC" disc, and the badge sits in `.list__trail` at the end of the row. (L2-102)
- **AC-6** Given `variant="interactive"` with link items, when it renders, then each item holds exactly one `<a class="list__link">` that fills the row and contains the avatar, content and trail as `<span>`s. (L2-100)
- **AC-7** Given an interactive item without `link`, when it is activated, then it is a `<button class="list__link" type="button">` and `activated` emits the item's `id`. (L2-101)

### States

- **AC-8** Given Abigail's request row is `current`, when it renders, then its link has `aria-current="true"`, the inverse fill and its meta at full strength; with `currentToken="page"` it has `aria-current="page"`. (L2-102)
- **AC-9** Given a pointer over an interactive row, when it hovers, then the row fills `--color-accent-subtle` with no movement. (L2-103)
- **AC-10** Given the account form is submitting, when the page sets the End session buttons `disabled`, then they are disabled and skipped by Tab. (L2-108)
- **AC-11** Given `loading` with `loadingCount` 3, when it renders, then three items of a circle and two text skeletons sit in the final row positions, hidden from assistive technology, with visually hidden "Loading". (L2-105)

### Keyboard and focus

- **AC-12** Given an interactive list, when Tab moves through it, then each row link is one stop and shows the two-tone ring around the whole row, including on the current ink row. (L2-101)

### Screen readers

- **AC-13** Given an interactive row, when its accessible name is computed, then it is "Abigail Mensah Sat 14 Nov · Worship night Requested". (L2-102)
- **AC-14** Given every variant and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-15** Given the dark theme, when an interactive list renders, then the hover highlighter is deep amber and the current row a paper fill with charcoal text. (L2-104)
- **AC-16** Given both themes, when contrast is measured, then title and meta are at least 4.5:1 on the surface and the hovered row, the current row text at least 4.5:1, and the focus ring at least 3:1. (L2-103)

### Responsive

- **AC-17** Given a 320 px viewport, when the device list renders, then each End session button wraps under its text when needed and the page does not scroll horizontally. (L2-096)
- **AC-18** Given a touch device, when an interactive row is measured, then it is at least 44 px tall and spans the list's width. (L2-096)

### Content

- **AC-19** Given the French catalogue, when "This device" and "End session" are about 30 % longer, then they come from the consumer and the row wraps without clipping. (L2-111)

### Performance

- **AC-20** Given the `List` and `ListInteractive` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build it as:

- Folder `frontend/projects/components/src/lib/list/`: `list.ts` (`List`,
  selector `zm-list`) and `list-trail.ts` (`ListTrail` directive,
  `ng-template[zmListTrail]`); export the `ListItem` type.
- Move the `.list*` and `.device-list*` rules from `components.css` into the
  component stylesheet.
- Composes `zm-avatar`, `zm-skeleton` and, through the trail template,
  `zm-badge`, `zm-stamp` and `zm-button`.
- Dev-mode console errors: empty `items` without `loading`; a trail template
  that renders a link or button inside an interactive row.
- Add the `List` and `ListInteractive` scenarios and export them from
  `scenarios/index.ts`.

## Decisions

- **D-1** *Is the device list part of this component?* Yes, as `variant="device"`. The design system documents `.device-list` on the list page, and it is a list of sessions with a trail like any other.
- **D-2** *Rows as data or projected `<li>`s?* Data with a trail template. Component selectors must be elements (`eslint.config.js`), and a host between `<ul>` and `<li>` breaks list semantics; `zm-menu` already renders its rows from data.
- **D-3** *Can an interactive row hold a button in its trail?* No. A control inside a row link is invalid HTML and unreachable (design-system Do and don't); the dev-mode check enforces it.
- **D-4** *Does the list render its own empty state?* No. The design system says never render an empty list; the page shows the [empty state](empty-state.md) in its place.
- **D-5** *Which `aria-current` value?* `true` by default, as the design system's request list uses it; `currentToken="page"` for a list of page links.
