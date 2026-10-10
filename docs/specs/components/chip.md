# Chip

| Field | Value |
|---|---|
| Selector | `zm-chip`, `zm-chip-group` |
| Library path | `frontend/projects/components/src/lib/chip/` |
| Status | built |
| Traces to | L2-004, L2-008, L2-086, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`chip.html`](../../design-system/components/chip.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/empty`](../../mocks/pages/discover/empty.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/discover/error`](../../mocks/pages/discover/error.html), [`pages/discover/limited`](../../mocks/pages/discover/limited.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), and the dialogs and notifications drawn over Discover (see Usage) |
| Rendering | [`chip.html`](chip.html) |

## Purpose and scope

Chips are the small stamped tags under "Filter by style" on the lineup. Naomi
presses "Gospel choir" to filter the lineup and presses it again to clear it.
The same shape picks a city under "Or pick a city", labels an artist's styles on
a ticket, and lists the filters in use with a remove button each. The component
has three kinds that look alike and behave differently:

- **Toggle** (`kind="toggle"`, the default) — a native `<button aria-pressed>`:
  the style filters ("Band", "Under $800") and the quick-pick cities
  ("Burlington").
- **Static** (`kind="static"`) — plain text in a stamp, not interactive: "Hymns"
  in a ticket's tags slot.
- **Removable** (`kind="removable"`) — text with its own remove button: "Gospel
  choir ×" in a "Filters in use" row.

`zm-chip-group` is the `<fieldset class="filters">` with its stamped legend that
holds a set of toggle or removable chips, wraps them onto as many rows as they
need, and returns focus when a removable chip goes away.

Use something else when:

- the choice is a value in a form that is submitted → [checkbox](checkbox.md) or
  [radio group](radio-group.md) (the profile editor's styles are checkboxes);
- it reports a status ("Free Sat 14 Nov", "Booked Sun 15 Nov") → [badge](badge.md);
- it is an action with a verb ("Show all styles") → [button](button.md).

Out of scope:

- What a filter does: the search, the URL state (L2-009), the result summary
  and its announcement (L2-008). The page owns them and passes `pressed` back.
- Whether a chip is shown or hidden, and in what order. The page renders the
  chips it wants inside the group.
- Setting the church location from a city chip (L2-004). The page does it on
  `pressedChange`.
- The list semantics around static chips. The consumer gives a set of tags its
  `role="list"` container (D-6).

## Usage

The mocks render 137 chips on 23 screens, all of them on Discover or on the
Discover page drawn behind a dialog or notification. Each row is one
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` lineup | `zm-chip-group` legend "Filter by style"; 7 `zm-chip` toggles, md | "Band", "Solo vocalist", "Gospel choir", "Acoustic", "Hymns", "Spanish", "Under $800" | default (none pressed), hover, focus | canvas |
| `pages/discover/empty` | as default | as default | "Gospel choir" pressed, behind "Nobody's free Christmas Eve within 40 km" | canvas |
| `pages/discover/loading` | as default, all `disabled` | as default | disabled while "Finding who's free on Saturday 14 November 2026…" | canvas |
| `pages/discover/error`, `pages/discover/limited` | as default | as default | default: the filters stay usable beside "We lost the signal" and "Too many searches in a minute" | canvas |
| `pages/discover/invalid` booking bar | `zm-chip-group` legend "Or pick a city"; 11 `zm-chip` toggles, `size="sm"` | "Toronto", "Burlington", "Mississauga", "Brampton", "Hamilton", "Markham", "Ajax", "Oshawa", "Barrie", "Kitchener", "Niagara" | default (none pressed); pressed once the page has set that city | light island (`data-theme="light"`) on the stage |
| `dialogs/menu`, `dialogs/account-menu`, `notifications/saved-toast/*` (5), `notifications/system-banner/*` (6) | the Discover lineup behind the overlay | as default | inert behind a dialog; default behind a toast or banner | canvas |
| Design system: counts | toggle with `count` and `countLabel` | "Band" + "3", name "Band, 3 free"; "Gospel choir" + "2" pressed | default, pressed | canvas |
| Design system and [ticket](ticket.md) `[slot=tags]` | `zm-chip kind="static"`, in a `role="list"` | "Band", "Acoustic", "Spanish" (Luz Viva); "Hymns" | default only | ticket surface |
| Design system: filters in use | `zm-chip-group` legend "Filters in use" (`legendHidden`); `zm-chip kind="removable"` | "Gospel choir", "Under $800", "Within 120 km", each with "Remove filter: {label}" | default, hover and focus on the ×, removed | canvas |

## Anatomy

1. **Container** — `.chip` on the native element. Square (`--radius-sm`), 2 px
   rule, height `--chip-height`, label and count centred on one line.
2. **Tick (pressed toggle)** — `.chip[aria-pressed="true"]::before`, a "✓"
   generated by CSS with empty alternative text (`content: "✓" / ""`), so the
   pressed state never relies on the ink fill alone.
3. **Label** — the projected text, mono stub type, uppercase by CSS. It is the
   accessible name.
4. **Count (optional)** — `.chip__count`: a visually hidden ", ", the number,
   and the visually hidden `countLabel` (" free"), regular weight in the
   label's colour.
5. **Remove button (removable)** — `.chip__remove`, a 24 px square native
   `<button>` holding `zm-icon name="close"` (`aria-hidden`), named by
   `removeLabel`.
6. **Group** — `zm-chip-group`: `<fieldset class="filters">` and its
   `<legend>`, a wrapping row with `--space-2` gaps.

Host: `zm-chip` is `display: inline-flex` and renders exactly one `.chip`
element: a `<button>` for a toggle, a `<span>` for static and removable chips.
`zm-chip-group` is `display: block` and renders the `<fieldset>`; its chips are
its projected children.

## API

### `zm-chip` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kind` | `'toggle' \| 'static' \| 'removable'` | `'toggle'` | no | Picks the element and modifier: toggle `<button class="chip">`, static `<span class="chip chip--static">`, removable `<span class="chip chip--removable">`. |
| `pressed` | `boolean` (attribute) | `false` | no | Toggle only. Writes `aria-pressed="true"` or `"false"`; a toggle always has the attribute. Ignored by the other kinds. |
| `size` | `'sm' \| 'md'` | `'md'` | no | Toggle only. `sm` adds `.chip--sm` (quick-pick cities). Static has its own 24 px size; removable is md. |
| `disabled` | `boolean` (attribute) | `false` | no | Toggle only. Sets `aria-disabled="true"`, never native `disabled`; the chip stays focusable and activation is suppressed (D-3). |
| `count` | `string \| undefined` | `undefined` | no | Toggle only. The formatted number ("3"). When set, renders `.chip__count`. |
| `countLabel` | `string` | `''` | when `count` is set | The visually hidden word after the number: "free", so the name reads "Band, 3 free". |
| `removeLabel` | `string` | — | when `kind` is `'removable'` | The remove button's `aria-label`: "Remove filter: Gospel choir". In dev mode a removable chip without it logs a console error naming the component. |

### `zm-chip` outputs

| Output | Payload | Rule |
|---|---|---|
| `pressedChange` | `boolean`, the requested value (`!pressed`) | Toggle only. Emitted once per activation. Not emitted while `disabled`. The chip never changes its own `pressed`; the page sets it back (D-2). |
| `removed` | `void` | Removable only. Emitted once when the remove button is activated. The page removes the chip from the group. |

The native `click` never reaches the host of a disabled toggle (a capture-phase
listener stops it). Consumers listen to `pressedChange`, not `click`.

### `zm-chip` content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text | The label. Declared once, in one `<ng-template>` that each kind's branch renders with `ngTemplateOutlet` (AGENTS.md). |

### `zm-chip-group` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `legend` | `string` | — | yes | The `<legend>` text: "Filter by style", "Or pick a city", "Filters in use". It names the group. |
| `legendHidden` | `boolean` (attribute) | `false` | no | Adds `.visually-hidden` to the legend; the group keeps its name. Used for "Filters in use". |
| `legendId` | `string \| undefined` | `undefined` | no | Sets the legend's `id` and `tabindex="-1"` so focus can be sent to it (by this group or another one's `returnFocusTo`). |
| `returnFocusTo` | `string \| undefined` | `undefined` | no | The ID of the element that receives focus when the last removable chip in the group is removed. Without it, the group's own legend receives focus (it then gets `tabindex="-1"`). |

### `zm-chip-group` outputs and slots

No outputs. Its default slot accepts `zm-chip` elements of one kind (toggles or
removables). After a removable chip emits `removed` and the page drops it, the
group moves focus: to the remove button of the chip now in the same position,
otherwise to the previous chip's remove button, otherwise to `returnFocusTo`
(D-4). Focus moves only if it was inside the removed chip.

Every string arrives as an input or a slot: the label, `countLabel`,
`removeLabel` and `legend` come from the translation catalogue through the page
(L2-111). The only character the component writes is the separator ", " before
a count (D-7).

## Variants and sizes

| Kind | Modifier | Use for |
|---|---|---|
| Toggle | — | A filter that changes the lineup at once, or a quick pick that sets a field. Several can be pressed together. |
| Static | `.chip--static` | A fact about an artist ("Hymns", "Spanish"). Not focusable, no hover. |
| Removable | `.chip--removable` | A filter in use, removed with its ×. Only the × is a control. |

| Size | Modifier | Height | Side padding | Label size |
|---|---|---|---|---|
| Medium (toggle, removable) | — | `--target-comfortable` (44 px) | `--space-4` (removable: `--space-1` on the right) | `--text-stub` |
| Small (toggle) | `.chip--sm` | `--control-height-sm` (36 px; `--target-comfortable` under a coarse pointer) | `--space-3` | `--font-size-xs` |
| Static | `.chip--static` | `--target-min` (24 px) | `--space-2` | `--font-size-xs` |

Width comes from the label: a chip is as wide as its text plus padding, and the
group wraps chips onto new rows.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default (off) | `aria-pressed="false"` | `--chip-bg` surface, `--chip-fg` label, `--chip-border` rule | "Hymns, toggle button, not pressed" |
| Hover | `:hover` on a toggle | `--chip-bg` becomes `--color-accent-subtle`; a pressed chip keeps its inverse fill | — |
| Active | `:active` on a toggle | `--chip-bg` becomes `--color-accent-subtle-hover` | — |
| Focus | `:focus-visible` | Two-tone ring: `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset` over a `--color-focus-ring-offset` gap | — |
| Pressed | `pressed = true` | `--color-bg-inverse` fill and rule, `--color-fg-inverse` label, "✓" before the label | `aria-pressed="true"`: "Gospel choir, toggle button, pressed"; the tick is not read |
| Pressed + hover | both | Inverse fill kept | — |
| Disabled | `disabled = true` | `--color-bg-subtle` fill, `--color-fg-disabled` label and rule, `cursor: not-allowed`, no hover fill; a pressed disabled chip keeps its tick | `aria-disabled="true"`, still focusable, activation does nothing |
| With count | `count` set | "Band 3", count at regular weight | "Band, 3 free" |
| Static | `kind="static"` | 24 px stamp, no interaction states | Text (a list item when the consumer gives it a list) |
| Removable | `kind="removable"` | Text chip with a 24 px × that fills `--color-bg-inverse` with a `--color-fg-inverse` icon on hover; the chip itself has no hover | The × is "Remove filter: Gospel choir, button" |
| Removed | `removed` emitted, the page drops it | The row reflows | Focus moves per the group rule |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

A chip appears in the light booking bar (`data-theme="light"`) on the stage; it
then takes the light tokens whatever the page theme, because the island sets
the theme.

## Markup

Toggle, off and pressed, rendered by `zm-chip` inside `zm-chip-group`:

```html
<zm-chip-group>
  <fieldset class="filters">
    <legend>Filter by style</legend>
    <zm-chip><button class="chip" type="button" aria-pressed="false">Band</button></zm-chip>
    <zm-chip><button class="chip" type="button" aria-pressed="true">Gospel choir</button></zm-chip>
  </fieldset>
</zm-chip-group>
```

Small, disabled, with a count:

```html
<button class="chip chip--sm" type="button" aria-pressed="false">Burlington</button>
<button class="chip" type="button" aria-pressed="false" aria-disabled="true">Hymns</button>
<button class="chip" type="button" aria-pressed="false">Band<span class="chip__count"><span class="visually-hidden">, </span>3<span class="visually-hidden"> free</span></span></button>
```

Static tags in a consumer's list:

```html
<ul class="cluster" role="list" aria-label="Luz Viva's styles">
  <li><zm-chip kind="static"><span class="chip chip--static">Band</span></zm-chip></li>
  <li><zm-chip kind="static"><span class="chip chip--static">Spanish</span></zm-chip></li>
</ul>
```

Removable chips in a group with a hidden legend:

```html
<fieldset class="filters">
  <legend class="visually-hidden" id="filters-in-use" tabindex="-1">Filters in use</legend>
  <zm-chip kind="removable">
    <span class="chip chip--removable">Gospel choir<button class="chip__remove" type="button" aria-label="Remove filter: Gospel choir"><zm-icon name="close" /></button></span>
  </zm-chip>
</fieldset>
```

Consumer templates:

```html
<zm-chip-group [legend]="'discover.filters.legend' | transloco">
  @for (style of styles; track style) {
    <zm-chip [pressed]="isPressed(style)" [disabled]="store.status() === 'loading'" (pressedChange)="toggleStyle(style, $event)">{{ 'common.style.' + style | transloco }}</zm-chip>
  }
</zm-chip-group>

<zm-chip-group [legend]="'discover.form.cities' | transloco">
  @for (city of cities; track city) {
    <zm-chip size="sm" [pressed]="place()?.city === city" (pressedChange)="pickCity(city, $event)">{{ city }}</zm-chip>
  }
</zm-chip-group>

<zm-chip-group [legend]="'discover.filters.inUse' | transloco" legendHidden returnFocusTo="filters-legend">
  @for (filter of activeFilters(); track filter.key) {
    <zm-chip kind="removable" [removeLabel]="'discover.filters.remove' | transloco: { filter: filter.label }" (removed)="clear(filter)">{{ filter.label }}</zm-chip>
  }
</zm-chip-group>
```

The `.chip*` and `.filters` classes, `aria-pressed` and the remove buttons'
names are a contract: the e2e page objects find chips by role and name
(`getByRole('button', { name: 'Burlington', exact: true })`) and check
`aria-pressed`. The icon's internals are free to change.

## Design

- Height `--chip-height`; padding `0 --space-4` (sm `--space-3`, static
  `--space-2`, removable right `--space-1`); gap `--space-1` between tick, label
  and count.
- Label `--text-stub`, uppercase, `--letter-spacing-wide`; sm and static
  `--font-size-xs`. Count `--font-weight-regular`, colour inherited.
- Rule `--border-width-thick` solid `--chip-border`; radius `--radius-sm`.
- Transition on `background` only: `--duration-fast`, `--ease-standard`.
  Nothing moves or lifts.
- Remove button: `--target-min` square, transparent, `color: inherit`; its icon
  is 0.875 rem. Under a coarse pointer it is `--target-comfortable`.
- Group: `display: flex; flex-wrap: wrap; gap: --space-2`; fieldset reset
  (no border, padding or margin, `min-width: 0`). Legend `--text-overline`,
  `--letter-spacing-stamp`, uppercase, `margin-bottom: --space-2`.

Component tokens declared on `.chip`:

| Token | Aliases | Overridden by |
|---|---|---|
| `--chip-bg` | `--color-bg-surface` | hover, active, pressed, disabled |
| `--chip-fg` | `--color-fg-default` | pressed, disabled |
| `--chip-border` | `--color-border-strong` | pressed (`--color-bg-inverse`), disabled (`--color-fg-disabled`) |
| `--chip-height` | `--target-comfortable` | sm, static, coarse pointer |

Styles live in the chip's own stylesheet. `zm-chip-group` owns the `.filters`
rules, so pages stop restyling the fieldset.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Hover fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Active fill | `--color-accent-subtle-hover` | `--palette-signal-500` | `--palette-ink-700` |
| Pressed fill and rule | `--color-bg-inverse` | `--palette-ink-750` | `--palette-ink-100` |
| Pressed label and tick | `--color-fg-inverse` | `--palette-paper` | `--palette-ink-750` |
| Disabled fill | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Disabled label and rule | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |
| Focus ring / gap | `--color-focus-ring` / `--color-focus-ring-offset` | `--palette-ink-750` / `--palette-signal-500` | `--palette-signal-500` / `--palette-ink-900` |

Pressed chips are ink, not yellow: yellow is kept for the one primary action and
"free" badges. In dark the inverse pair flips, so a pressed chip is a paper
stamp on the charcoal page.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Label on chip |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Label on hover fill |
| `--color-fg-default` | `--color-accent-subtle-hover` | 4.5:1 | Label on active fill |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Pressed label |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Chip rule on the page |
| `--color-bg-inverse` | `--color-bg-canvas` | 3:1 | Pressed chip edge on the page |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring |

Disabled text is exempt as an inactive control (WCAG 1.4.3). Under forced
colours the rule is `CanvasText` and the ring `Highlight`; the pressed state
still shows through the tick, which is text, not colour.

## Responsive behaviour

- The group is a wrapping row. The seven style chips take two or three rows at
  360 px and every chip stays visible; nothing scrolls sideways (L2-097).
- The eleven city chips wrap the same way inside the booking bar, spanning both
  of its columns from SM.
- A label stays on one line in practice (one to three words). As a safety net a
  label wider than the row wraps inside its chip, which grows taller, rather
  than clipping or forcing horizontal scroll (D-8).
- Under a coarse pointer, small chips and the × grow to `--target-comfortable`
  (44 px). Medium chips are 44 px already. Static chips are not targets.
- At 320 px no chip clips and the page does not scroll horizontally. At 200 %
  zoom chips wrap onto more rows.

## Accessibility

### Role and pattern

A toggle is a native `<button type="button">` with `aria-pressed`, the toggle
form of the [APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
The group is a `<fieldset>` named by its `<legend>`. A static chip is text; a
removable chip is text with a real `<button>` inside, and the chip itself is not
focusable. No `role="checkbox"`: a chip acts at once, it is not a form value.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the chips one by one in DOM order; each toggle and each × is a tab stop. Disabled toggles stay in the order. Static chips are skipped. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggles a toggle chip (emits `pressedChange`); removes a removable chip (emits `removed`). Does nothing on a disabled toggle. |
| After a removal | Focus moves to the × now in the same position, else the previous ×, else `returnFocusTo` (or the group's legend). |

### Focus

The two-tone ring appears on `:focus-visible` around the chip, or around the ×
on a removable chip. Mouse presses show no ring. Becoming disabled never moves
focus: the chip Naomi just pressed keeps focus while the lineup reloads.

### Labelling

The label text is the toggle's name; `aria-pressed` carries the state, so the
name never changes when pressed. The tick has empty alternative text. A count
reads "Band, 3 free". A remove button says what it removes: "Remove filter:
Gospel choir". The legend names the group: "Filter by style".

### Announcements

None from the chip. The page announces the result after a filter changes
through its polite status region ("Sat 14 Nov · 2 free · within 120 km",
L2-008).

### Motion

Only the fill changes, over `--duration-fast`. Under `prefers-reduced-motion:
reduce` the duration tokens drop to near zero, so the change is instant.

## Content and internationalisation

- One to three words, sentence case in the source (CSS uppercases): "Gospel
  choir", "Under $800", "Spanish".
- Name what is being filtered for, not the action: "Hymns", not "Show hymns".
- Price and distance use Zamaro's formats (L2-110), formatted before they reach
  the chip: "Under $800", "Within 120 km".
- Counts are bare numbers with hidden words: visible "Band 3", read "Band, 3
  free".
- Remove labels follow "Remove filter: {label}".
- Legends say what the chips do: "Filter by style", "Or pick a city", "Filters
  in use".
- Style names and copy come from the catalogue (`common.style.*`,
  `discover.filters.*`); city names are data. French labels run about 30 %
  longer: chips wrap onto more rows and never clip (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs. The class list is one `computed`.
  `zm-chip-group` reads its chips with `contentChildren` and only acts after a
  removal; it runs no work on ordinary renders.
- Perf-test scenarios: `Chip.ts` renders the pressed quick-pick "Burlington"
  (sm), as today. Add `ChipGroup.ts`, which renders the "Filter by style"
  group with its seven chips and "Gospel choir" pressed, the repeated
  composition on every Discover state. Tune both in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenario that includes it: `DarkTheme`.
- Layout stability: becoming disabled or pressed changes no dimension (the tick
  takes space inside the padding the label already reserves, and the group
  never reflows on a state change), so loading and filtering cause no layout
  shift (L2-086).
- Imports: Angular core, `NgTemplateOutlet`, `zm-icon` (removable only).

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-chip>Band</zm-chip>` in the "Filter by style" group, when it renders, then the host contains exactly one `<button type="button" class="chip" aria-pressed="false">` whose accessible name is "Band". (L2-008)
- **AC-2** Given the "Gospel choir" chip with `pressed` true, when it renders, then it has `aria-pressed="true"`, the `--color-bg-inverse` fill and rule, the `--color-fg-inverse` label and a "✓" before the label. (L2-008)
- **AC-3** Given each kind (toggle, static, removable), each size (sm, md) and each state in the States table, when it renders, then the element carries exactly the classes in the Markup section and matches the design-system rendering in the visual test. (L2-096)
- **AC-4** Given the quick-pick chip "Burlington" with `size="sm"`, when it renders under a fine pointer, then it is a `.chip.chip--sm` button 36 px tall with `aria-pressed="false"`. (L2-004)
- **AC-5** Given Luz Viva's static chips "Band", "Acoustic" and "Spanish" in a consumer's `role="list"`, when they render, then each is a 24 px `<span class="chip chip--static">`, none is focusable and none changes on hover. (L2-100)
- **AC-6** Given a removable chip "Gospel choir" with `removeLabel` "Remove filter: Gospel choir", when it renders, then it is a `<span class="chip chip--removable">` whose only focusable part is a `<button class="chip__remove">` with that `aria-label`. (L2-100)

### Behaviour

- **AC-7** Given "Band" is not pressed, when Naomi activates it, then `pressedChange` emits `true` once and the chip keeps `aria-pressed="false"` until the page sets `pressed` to true. (L2-008)
- **AC-8** Given "Band" is pressed, when Naomi activates "Gospel choir", then only "Gospel choir" emits `pressedChange` (`true`) and "Band" stays pressed, so both can be pressed together. (L2-008)
- **AC-9** Given the quick-pick chip "Burlington", when it is activated, then `pressedChange` emits `true` and nothing else happens inside the chip; the page sets the location and then passes `pressed` true. (L2-004)
- **AC-10** Given the removable chip "Under $800", when its × is activated, then `removed` emits once. (L2-008)
- **AC-11** Given every style chip is `disabled` while "Finding who's free on Saturday 14 November 2026…" shows, when a chip is clicked or Enter or Space is pressed on it, then neither `pressedChange` nor a `click` reaches the host, so no second search is sent. (L2-108)

### States

- **AC-12** Given a disabled chip "Hymns", when it renders, then it has `aria-disabled="true"`, no native `disabled` attribute, the `--color-bg-subtle` fill and the `--color-fg-disabled` label and rule, and no hover fill. (L2-108)
- **AC-13** Given the "Band" chip with a `count` of "3" and `countLabel` "free", when it renders, then it shows "Band 3" with the count at regular weight in the label's colour, and its accessible name is "Band, 3 free". (L2-102)

### Keyboard and focus

- **AC-14** Given the "Filter by style" group, when Naomi presses Tab from the sort select, then focus visits "Band", "Solo vocalist", "Gospel choir", "Acoustic", "Hymns", "Spanish" and "Under $800" in that order, and Enter or Space on a focused chip emits `pressedChange`. (L2-101)
- **AC-15** Given focus on "Gospel choir", when Naomi presses Space and the page then sets every chip `disabled` while the lineup loads, then focus stays on "Gospel choir". (L2-101)
- **AC-16** Given a chip receives keyboard focus, when it is focused, then the two-tone ring is drawn around it (`--color-focus-ring` outline over a `--color-focus-ring-offset` gap); given a removable chip, then the ring is drawn around its ×; given a mouse press, then no ring is drawn. (L2-101)
- **AC-17** Given removable chips "Gospel choir", "Under $800" and "Within 120 km" with focus on the × of "Under $800", when it is activated and the page drops that chip, then focus moves to the × of "Within 120 km"; when "Within 120 km", now last in the row, is removed, then focus moves to the × of "Gospel choir"; when no chip is left, then focus moves to the element named by `returnFocusTo`. (L2-101)

### Screen readers

- **AC-18** Given the "Filter by style" group with "Gospel choir" pressed, when a screen reader reaches that chip, then it announces the group "Filter by style" and "Gospel choir, toggle button, pressed", and it does not announce the tick. (L2-102)
- **AC-19** Given a chip is toggled, when the page's result count changes, then the chip's accessible name is unchanged and the chip contains no live region; the announcement comes from the page's status region. (L2-102)
- **AC-20** Given Discover with every chip kind and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when the style chips render, then an off chip is a `--color-bg-surface` charcoal with a `--color-border-strong` rule, and a pressed chip is a `--color-bg-inverse` paper stamp with a `--color-fg-inverse` ink label. (L2-104)
- **AC-22** Given the dark theme, when the quick-pick chips render inside the booking bar, then they use the light tokens because the bar sets `data-theme="light"`. (L2-104)
- **AC-23** Given both themes, when contrast is measured, then every label pair in the Colour table is at least 4.5:1, and the chip rule, the pressed edge and the focus ring are at least 3:1 against the page. (L2-103)

### Responsive

- **AC-24** Given a 360 px viewport, when the seven style chips render, then they wrap onto as many rows as they need, every chip is fully visible and the page does not scroll horizontally. (L2-097)
- **AC-25** Given a coarse pointer, when a small chip ("Burlington") and a removable chip's × are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given a 320 px viewport, when the eleven city chips and the style chips render, then no label is clipped and nothing overflows the group. (L2-096)
- **AC-27** Given the French catalogue, when the legend, labels, `countLabel` and `removeLabel` are about 30 % longer, then they render in French with no code change and the chips wrap onto more rows without clipping. (L2-111)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when a chip is hovered or pressed, then its fill changes without a transition. (L2-103)

### Performance

- **AC-29** Given the `Chip` and `ChipGroup` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-chip` as a toggle with `pressed`, `size` and `disabled`. To
meet this CRD:

- Add `kind` with the static and removable branches. Put the default slot in one
  `<ng-template>` and render it with `ngTemplateOutlet` in each branch.
- Add the `pressedChange` output and stop rendering the press through the
  consumer's `(click)`. Move `pages/discover/lineup` and
  `pages/discover/search-form` from `(click)` to `(pressedChange)`.
- Replace native `disabled` with `aria-disabled="true"`, a capture-phase click
  guard (as in the button), and styles on `.chip[aria-disabled="true"]` that
  match today's `.chip:disabled`.
- Add `count` and `countLabel` with the `.chip__count` markup, and
  `removeLabel` and `removed` with the `.chip__remove` button (`zm-icon
  name="close"`), plus the static and removable styles and the coarse-pointer
  rule for `.chip__remove`.
- Make `pressed` and `disabled` accept bare attributes (`booleanAttribute`).
- Add `zm-chip-group` (`chip-group.ts` in the same folder) with `legend`,
  `legendHidden`, `legendId` and `returnFocusTo`, the `.filters` styles, and the
  focus rule after a removal. Remove the copied `.filters` rules from
  `lineup.scss` and `search-form.scss`.
- Keep `Chip.ts`; add `ChipGroup.ts` and export it from `scenarios/index.ts`.

## Decisions

- **D-1** *One component with a `kind` input, or three?* One `zm-chip` with `kind`. The [ticket](ticket.md) CRD already projects "static `zm-chip`s" into its tags slot, and the three kinds share every token and class. The single text slot sits in one `ng-template`, which AGENTS.md prescribes for a component that renders different elements.
- **D-2** *Does a toggle flip itself?* No. It emits `pressedChange` with the requested value and waits for `pressed`. The filter state lives in the URL (L2-009) and the city chip's state depends on the location field, so the page is the only owner and the chip can never disagree with it.
- **D-3** *Native `disabled` or `aria-disabled` while the lineup loads?* `aria-disabled`. The loading mock uses native `disabled`, but pressing a chip is what starts the load: with native `disabled` the chip Naomi just pressed would drop focus to `<body>` (L2-101). The look is identical, and Playwright's `toBeDisabled` honours `aria-disabled`.
- **D-4** *Where does focus go after a removable chip is removed?* The design system says the next ×, then the previous one, then "the filters' legend". The group does it, since it is the only part that sees its siblings, and `returnFocusTo` names the target when none is left, so a "Filters in use" row can send focus to the "Filter by style" legend.
- **D-5** *Does the group own the `.filters` styles?* Yes, as `zm-chip-group`. Two pages copy the fieldset rules today, and AGENTS.md keeps component styles out of global sheets.
- **D-6** *Who gives static chips list semantics?* The consumer, with a `role="list"` container and `<li>` hosts, as the design system's Luz Viva tags do. A chip cannot know whether it is one tag or one of several, and a `listitem` outside a list is an axe failure.
- **D-7** *Is the ", " before a count copy?* No, it is punctuation that makes a screen reader pause ("Band, 3 free"). The words are `countLabel`, from the catalogue.
- **D-8** *What happens when a label is wider than the row?* It wraps inside the chip, which grows taller. The design system says labels never wrap and keeps them to three words; that content rule holds, and the wrap is only a safety net for long translations so L2-096 is never broken by clipping.
- **D-9** *Counts and removable chips appear only on the design-system page. Keep them?* Yes. The design system specifies both with every state ("Filters in use" for phones), and adding them later would change the `kind` union and the outputs every consumer types against.
