# Radio group

| Field | Value |
|---|---|
| Selector | `zm-radio-group`, `zm-radio` |
| Library path | `frontend/projects/components/src/lib/radio-group/` |
| Status | planned |
| Traces to | L2-030, L2-047, L2-059, L2-062, L2-068, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`radio-group.html`](../../design-system/components/radio-group.html) |
| Source mocks | [`dialogs/decline-request/default`](../../mocks/dialogs/decline-request/default.html), [`pages/apply/default`](../../mocks/pages/apply/default.html), [`dialogs/write-review/default`](../../mocks/dialogs/write-review/default.html), [`dialogs/report-review/invalid`](../../mocks/dialogs/report-review/invalid.html), [`dialogs/resolve-hold/invalid`](../../mocks/dialogs/resolve-hold/invalid.html), and their busy, failed and invalid states (see Usage) |
| Rendering | [`radio-group.html`](radio-group.html) |

## Purpose and scope

A radio group asks for exactly one answer and shows every option at once: why
Abigail is declining, what kind of act Tobi is, how many stars Naomi gives,
what an administrator does with a held booking. Pick one and the others let go.

The pair has two components:

- `zm-radio-group` renders the `<fieldset>` with its `<legend>`, the
  requirement marker, the help and the group's error, owns the shared `name`,
  and is the form control (`ControlValueAccessor`) whose value is the chosen
  option's `value`.
- `zm-radio` renders one option: a native `<input type="radio">` inside its
  `<label>`, drawn as a light choice row, a full radio row, a stub card or a
  choice card.

Use something else when:

- several options can be true at once → [checkbox](checkbox.md)'s
  `zm-checkbox-group`;
- there are more than about six options, or they need no comparison →
  [select](select.md);
- a single yes/no that takes effect at once → [switch](switch.md); that waits
  for submit → [checkbox](checkbox.md);
- the choice is a filter that applies to a list instantly → [chip](chip.md).

Out of scope:

- What each option does to the rest of the form. The page shows or hides
  dependent fields (resolve-hold's "Amount to refund") and projects them
  between the radios; the group only lays them out.
- Validation and error copy. The page decides when nothing chosen is an error
  and passes the message in `error`.
- The error summary and its links. [Form layout](form-layout.md) owns it; the
  group's `focus()` is what its link calls.
- The star glyphs and their words in the review dialog. The dialog projects
  them into each `zm-radio`; the read-only star display is
  [rating](rating.md).
- Layout around the group (`.form-grid`, dialog bodies). The parent places the
  fieldset.

## Usage

The mocks render 89 radios in 13 page and dialog states, all native radios in a
`<fieldset>`. The design system adds choice cards and an inline yes/no pair.
Each row is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `dialogs/decline-request/*` | `choice` rows, stacked, heading legend + `optionalMarker` | "Why are you declining? (optional)": "I'm not free that day", "It's too far to travel" + "Burlington is 44 km from Brampton", "It's not the right fit" + "For example the style or the size of the event", "Another reason" + "Say more in the note" | default (first checked), busy (every radio disabled), failed | dialog |
| `pages/apply/default`, `pages/apply/invalid`, `pages/apply/submitting` | `choice` rows, `inline`, heading legend + `requiredMarker` | "Act type (required)": "Solo", "Duo", "Band", "Choir" | default (Solo checked), disabled while submitting | form grid |
| `dialogs/write-review/*` | `stub` cards, `inline`, heading legend + `requiredMarker`; label is `aria-hidden` stars + visually hidden words; description is the score's word | "Your rating (required)": "★★★★★" / "5 out of 5 stars" / "Unforgettable", "Great", "Good", "Fair", "Poor" | default (5 checked in edit mode, none for a new review), busy (all disabled), invalid | dialog |
| `dialogs/report-review/*` | `radio` rows, stacked, label legend + `requiredMarker`, descriptions | "Why are you reporting it? (required)": "Offensive" + "Hateful, abusive or crude.", "Not about this artist", "Personal information", "Other" | default, invalid "Choose one reason.", busy (disabled), failed | dialog |
| `dialogs/resolve-hold/*` | `radio` rows, stacked, label legend + `requiredMarker`, descriptions; a `zm-form-field` projected between two radios | "Outcome (required)": "Release the balance" + "Charge Grace's $600 balance now and pay Hosanna Collective $736.", "Partial refund" + nested "Amount to refund (required)", "Full refund" | default, invalid (nested field error), busy, failed | dialog |
| Design system, booking request | `card` variant, `cards` layout, label legend | "Kind of gathering": "Sunday service" + "Three or four songs · about 25 min", "Worship night", "Youth event", "Funeral or memorial" | default, hover, focus, selected, invalid, disabled | surface |
| Design system | `radio` rows, `inline`, label legend | "Indoors or outdoors?": "Indoors", "Outdoors" | default; invalid "Choose indoors or outdoors so the artist can plan for sound." | surface |
| Design system | `radio` rows, stacked, descriptions | "Sound at your church": "Sound system and a technician" + "The artist plugs in and sings." … | default, hover, focus | surface |

## Anatomy

1. **Group** — `fieldset.fieldset` (heading legend) or `fieldset.choice-group`
   (label legend), the host's only child. A column of legend, help, options and
   error.
2. **Legend** — `<legend>`: the question. `.fieldset > legend` is `--text-h4`
   uppercase; `.choice-group > legend` is the stamped overline of a field label.
   It names the group and is read before each option.
3. **Requirement marker (optional)** — `.field__required` or `.field__optional`
   inside the legend, after a space, as on a [form field](form-field.md).
4. **Help (optional)** — `.field__help` under the legend, before the options.
5. **Options** — `.choice-group__options`, holding the projected `zm-radio`s and
   anything projected between them. `display: contents` when stacked, a wrapping
   row when inline, a card grid for cards.
6. **Error (optional)** — `.field__error` after the options, text only.
7. **Option** — `zm-radio`, a `<label>` in one of four looks:
   - `.choice` — the light row: the native radio drawn as a 20 px round dot
     (`appearance: none`), then `.choice__text` with an optional `<small>`.
   - `.radio` — the full row: a visually hidden native radio, the drawn 24 px
     `.radio__dot`, then `.radio__text` with an optional `.radio__desc`.
   - `.choice.choice--stub` — the light row framed as a ticket stub, tinted
     yellow when checked.
   - `.choice-card` — a card with `.choice-card__title` and `.choice-card__meta`.
8. **Option label** — the projected content; the accessible name.
9. **Option description (optional)** — one muted sentence inside the label, so
   it is part of the name.

Host: `zm-radio-group` is `display: block` (`min-width: 0`) and renders the
fieldset. `zm-radio` is `display: contents`, so its `<label>` is the item the
options wrapper lays out, exactly as in the mocks.

## API

### `zm-radio-group` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `legend` | `string` | — | yes | The question. Rendered in `<legend>`. |
| `name` | `string` | — | yes | Shared native `name` of every radio, and the ID stem: `{name}-help`, `{name}-error`, and each radio `{name}-{value}`. Unique on the page. |
| `requiredMarker` | `string` | — | no | "(required)". Renders `.field__required` in the legend and sets `required` on the first radio only. |
| `optionalMarker` | `string` | — | no | "(optional)". Renders `.field__optional`. If both are set, `requiredMarker` wins and dev mode logs a console error. |
| `help` | `string` | — | no | One `.field__help#{name}-help` under the legend. |
| `error` | `string \| null` | `null` | no | Renders `.field__error#{name}-error`, links it from the fieldset and sets `aria-invalid="true"` on every radio. |
| `variant` | `'choice' \| 'radio' \| 'stub' \| 'card'` | `'choice'` | no | The look of every option in the group. |
| `layout` | `'stack' \| 'inline' \| 'cards'` | `'stack'` | no | Adds `.choice-group__options--inline` or `--cards` to the options wrapper. `cards` is for the `card` variant. |
| `legendStyle` | `'heading' \| 'label'` | `'heading'` | no | `heading` renders `fieldset.fieldset`; `label` renders `fieldset.choice-group`. |

### `zm-radio` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `value` | `string` | — | yes | The native `value`, and the group's value when chosen. Unique in the group. |
| `description` | `string` | — | no | `<small>` (choice, stub), `.radio__desc` (radio) or `.choice-card__meta` (card), inside the label. |
| `disabled` | `boolean` (attribute) | `false` | no | Locks this one option. ORs with the group's disabled state from the forms API. |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- A `zm-radio` must sit inside a `zm-radio-group`; it injects the group for its
  `name`, `variant`, checked state and invalid state. Outside one, dev mode logs
  a console error naming the component.
- The group implements `ControlValueAccessor`. Its value is `string | null`:
  `null` means nothing is chosen. `writeValue` checks the matching radio and
  unchecks the rest; a value that matches no radio checks none. Choosing a radio
  calls `onChange` with its `value`; leaving the group (focus out of the
  fieldset) calls `onTouched`. `setDisabledState(true)` disables every radio.
- Copy: `legend`, both markers, `help`, `error`, each option's projected label
  and `description` come from the translation catalogue through the consumer
  (L2-111).

### Methods

| Method | Effect |
|---|---|
| `focus(): void` (on `zm-radio-group`) | Focuses the checked radio, or the first enabled one when none is checked. The error summary's link calls it. |

### Outputs

None. The value reaches the page through the forms API
(`formControlName="reason"`, `valueChanges`). The native `change` event bubbles
from the chosen radio for consumers that need it.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-radio-group` default | `zm-radio` options, and any element between them (a `zm-form-field` that belongs to the option above it) | Declared once, inside `.choice-group__options`. |
| `zm-radio` default | text, or inline elements such as `<span aria-hidden="true">★★★★★</span><span class="visually-hidden">5 out of 5 stars</span>` | Declared once, in one `<ng-template>` that every variant branch renders with `ngTemplateOutlet` (AGENTS.md slot rule). |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Choice row | `.choice` (`variant="choice"`) | Reasons and short answers in forms and dialogs: decline a request, act type. The default. |
| Radio row | `.radio` (`variant="radio"`) | Weightier choices with a description each, as in the moderation and payment dialogs. |
| Stub card | `.choice.choice--stub` (`variant="stub"`) | A row of compact framed answers: the five star scores. |
| Choice card | `.choice-card` (`variant="card"`) | A choice that shapes the rest of the form, with a title and a detail line. |

| Layout | Modifier | Use for |
|---|---|---|
| Stack | — (`display: contents`; the fieldset's own gap) | The default; options with descriptions. |
| Inline | `.choice-group__options--inline` | Two to four one- or two-word options ("Solo", "Duo"; the star cards). |
| Cards | `.choice-group__options--cards` | Choice cards. |

| Option | Control | Row |
|---|---|---|
| Choice / stub | 20 px (1.25 rem) round dot, `--border-width-thick` | At least `--target-comfortable` tall, `--space-2` block padding; stub adds `--space-3` × `--space-4` padding and a frame |
| Radio | `--target-min` (24 px) round dot | At least `--target-min` tall, `--target-comfortable` under a coarse pointer |
| Card | no visible dot | `--space-4` padding; width from the grid column |

There is one size per variant.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Empty dot (or plain card) | Radio, name from the label, "1 of 4" in the group |
| Hover | `:hover` | Radio: dot fills `--color-accent-subtle`. Card: lifts by `--transform-lift` over `--shadow-1`. Choice and stub rows: pointer cursor only | — |
| Focus | `:focus-visible` on the input | Choice and stub: the two-tone ring on the 20 px dot. Radio: `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset` around `.radio__dot`. Card: the outline around the whole card | — |
| Checked | `:checked` | Choice and stub: dot `--color-accent` with a `--color-fg-on-accent` rim and centre; stub fills `--color-accent-subtle`. Radio: dot `--color-accent`, `--color-border-on-accent` rule, 10 px centre. Card: `--color-border-selected` frame doubled inside, `--color-accent-subtle` fill | Checked; arrow keys move it |
| Invalid | `error` set | Every dot's rule (card frame) turns `--color-danger-border`; the error appears under the options | Every radio `aria-invalid="true"`; fieldset `aria-describedby` starts with `{name}-error` |
| Disabled | `disabled` or forms disabled | Choice: `--color-bg-subtle` dot, `--color-border-default` rule, `--color-fg-disabled` text. Radio: `--color-bg-subtle` dot, `--color-fg-disabled` rule and text. Card: `--color-fg-disabled` frame on `--color-bg-subtle`, no lift. `cursor: not-allowed` | Out of the arrow and tab order |
| Checked and disabled | both | Choice, stub and radio keep the checked dot (stub keeps its tint), text `--color-fg-disabled`, so busy dialogs keep the answer visible. A card takes the disabled look, as `components.css` orders it (D-8) | Checked, unavailable |
| Busy | page disables the group while sending (L2-108) | As disabled; the chosen answer stays checked | The page's status region announces progress |

A chosen card is never shown invalid: an error only exists while nothing is
chosen.

## Markup

Rendered by `zm-radio-group` with `variant="choice"` (decline a request):

```html
<zm-radio-group>
  <fieldset class="fieldset">
    <legend>Why are you declining? <span class="field__optional">(optional)</span></legend>
    <div class="choice-group__options">
      <zm-radio>
        <label class="choice"><input type="radio" id="reason-free" name="reason" value="free" checked><span class="choice__text"><span>I’m not free that day</span></span></label>
      </zm-radio>
      <zm-radio>
        <label class="choice"><input type="radio" id="reason-far" name="reason" value="far"><span class="choice__text"><span>It’s too far to travel</span><small>Burlington is 44 km from Brampton</small></span></label>
      </zm-radio>
    </div>
  </fieldset>
</zm-radio-group>
```

`variant="radio"` with a label legend and an error (report a review):

```html
<fieldset class="choice-group" aria-describedby="reason-error">
  <legend>Why are you reporting it? <span class="field__required">(required)</span></legend>
  <div class="choice-group__options">
    <label class="radio">
      <input type="radio" id="reason-offensive" name="reason" value="offensive" required aria-invalid="true">
      <span class="radio__dot"></span>
      <span class="radio__text"><span>Offensive</span><span class="radio__desc">Hateful, abusive or crude.</span></span>
    </label>
    <label class="radio">
      <input type="radio" id="reason-other" name="reason" value="other" aria-invalid="true">
      <span class="radio__dot"></span>
      <span class="radio__text"><span>Other</span><span class="radio__desc">Something else the Zamaro team should look at.</span></span>
    </label>
  </div>
  <span class="field__error" id="reason-error">Choose one reason.</span>
</fieldset>
```

`variant="stub"`, `layout="inline"` (the star rating):

```html
<fieldset class="fieldset">
  <legend>Your rating <span class="field__required">(required)</span></legend>
  <div class="choice-group__options choice-group__options--inline">
    <label class="choice choice--stub"><input type="radio" id="stars-5" name="stars" value="5" required checked><span class="choice__text"><span><span aria-hidden="true">★★★★★</span><span class="visually-hidden">5 out of 5 stars</span></span><small>Unforgettable</small></span></label>
    …4 Great, 3 Good, 2 Fair, 1 Poor
  </div>
</fieldset>
```

`variant="card"`, `layout="cards"`:

```html
<fieldset class="choice-group">
  <legend>Kind of gathering</legend>
  <div class="choice-group__options choice-group__options--cards">
    <label class="choice-card">
      <input type="radio" id="kind-sunday" name="kind" value="sunday" checked>
      <span class="stack stack--sm"><span class="choice-card__title">Sunday service</span><span class="choice-card__meta">Three or four songs · about 25 min</span></span>
    </label>
  </div>
</fieldset>
```

Help renders `<span class="field__help" id="{name}-help">` after the legend, and
the fieldset's `aria-describedby` is `"{name}-error {name}-help"` (only the parts
that render). Disabled options add the native `disabled`.

Consumer templates:

```html
<zm-radio-group formControlName="reason" name="reason" variant="radio" legendStyle="label"
                [legend]="'review.report.reason' | transloco"
                [requiredMarker]="'common.form.required' | transloco"
                [error]="errors().reason ?? null">
  @for (reason of reasons; track reason) {
    <zm-radio [value]="reason" [description]="'review.report.' + reason + 'Help' | transloco">{{ 'review.report.' + reason | transloco }}</zm-radio>
  }
</zm-radio-group>

<zm-radio-group formControlName="resolution" name="resolution" variant="radio" legendStyle="label" [legend]="'admin.hold.outcome' | transloco">
  <zm-radio value="release" [description]="releaseHelp()">{{ 'admin.hold.release' | transloco }}</zm-radio>
  <zm-radio value="partial" [description]="partialHelp()">{{ 'admin.hold.partial' | transloco }}</zm-radio>
  @if (form.value.resolution === 'partial') {
    <zm-form-field class="nested" fieldId="partial-amount" [label]="'admin.hold.amount' | transloco" [error]="errors().amount ?? null">
      <zm-text-field formControlName="amount" inputmode="decimal" prefix="$" [prefixHint]="'common.money.cad' | transloco" />
    </zm-form-field>
  }
  <zm-radio value="full" [description]="fullHelp()">{{ 'admin.hold.full' | transloco }}</zm-radio>
</zm-radio-group>

<zm-radio-group formControlName="stars" name="stars" variant="stub" layout="inline" [legend]="'review.form.rating' | transloco" [requiredMarker]="'common.form.required' | transloco">
  @for (s of [5, 4, 3, 2, 1]; track s) {
    <zm-radio [value]="'' + s" [description]="'review.score.' + s | transloco"><span aria-hidden="true">{{ stars(s) }}</span><span class="visually-hidden">{{ 'review.score.label' | transloco: { count: s } }}</span></zm-radio>
  }
</zm-radio-group>
```

The classes, the native radios, the shared `name` and the `aria-*` attributes
are a contract: page objects find the group by its role and legend and each
option by role and name. `.choice-group__options` is structural and free to
change, as long as the stacked layout keeps the fieldset's gap.

## Design

- Fieldset: `border: 0`, no padding or margin, `min-width: 0`, a column with
  `--space-4` gap (`.fieldset`) or `--space-3` gap (`.choice-group`).
- Legend, heading style: `--text-h4`, uppercase, `--space-4` below. Label
  style: `--text-overline`, `--letter-spacing-stamp`, uppercase, `--space-3`
  below. Markers as on the [form field](form-field.md): `--text-caption`,
  `--letter-spacing-normal`, no transform, `--color-fg-muted`.
- Help `--text-caption` in `--color-fg-muted`; error `--text-caption` at
  `--font-weight-bold` in `--color-danger-fg`, text only.
- Options wrapper: stack is `display: contents`; inline is a wrapping flex row
  with `--space-3` row gap and `--space-6` column gap, aligned to the start
  (choice rows use no row gap, `--space-0`, because they are already 44 px tall
  with their own padding, as on the [checkbox](checkbox.md) group; the
  stub variant uses `--space-3` both ways and `align-items: stretch`, so the
  five star cards share one height); cards is a grid of
  `repeat(auto-fill, minmax(min(100%, 18rem), 1fr))` with `--layout-gutter`.
- Choice row: flex, `--space-3` gap, `align-items: flex-start`, min height
  `--target-comfortable`, `--space-2` block padding, `--text-body`. Dot 1.25 rem,
  `--border-width-thick` in `--color-border-strong` on `--color-bg-surface`,
  `--radius-full`, 0.15 rem top margin; checked centre 0.5 rem.
  `.choice__text` is a grid with `--space-0-5` gap; `<small>` is
  `--text-body-sm` in `--color-fg-muted`.
- Stub card: the choice row plus `--space-3` × `--space-4` padding and a
  `--border-width-thick` `--color-border-strong` frame on `--color-bg-surface`.
- Radio row: inline flex, `--space-3` gap, min height `--target-min`
  (`--target-comfortable` under a coarse pointer), `--text-body`. Dot
  `--target-min` square, `--radius-full`; centre 0.625 rem in `currentColor`.
  `.radio__text` has `--space-0-5` top padding; `.radio__desc` is
  `--text-body-sm` in `--color-fg-muted`.
- Choice card: flex, `--space-3` gap, `--space-4` padding,
  `--border-width-thick` in `--choice-border`, `--color-bg-surface`; title
  `--text-h4` uppercase, meta `--text-body-sm` muted, `--space-2` apart
  (`.stack--sm`).
- Radios are round (`--radius-full`) on purpose: the one shape everywhere
  recognises as "pick one". Everything else stays square.
- Transitions: dot fill `--duration-fast` `--ease-standard`; card lift and
  shadow `--duration-fast`.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--control-bg` | `--color-bg-surface` | radio hover, checked, disabled |
| `--control-border` | `--color-border-strong` | radio checked, invalid, disabled |
| `--control-fg` | `--color-fg-on-accent` | radio disabled |
| `--choice-border` | `--color-border-strong` | card checked (`--color-border-selected`), invalid, disabled |

`--control-*` are shared with the [checkbox](checkbox.md) box; `--choice-border`
is the card's only knob.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Dot fill / card fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Dot rule, card frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Hover dot fill, stub and card checked fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Checked dot | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Checked centre and rim | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Checked card frame | `--color-border-selected` | `--palette-ink-750` | `--palette-signal-500` |
| Label, card title | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Description, card meta | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Invalid rule | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Error | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` |
| Disabled fill / text | `--color-bg-subtle` / `--color-fg-disabled` | `--palette-ink-100` / `--palette-ink-400` | `--palette-ink-700` / `--palette-ink-600` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Dot rule and card frame on a dialog |
| `--color-fg-on-accent` | `--color-accent` | 3:1 | Checked centre on yellow |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Label and card title on the checked tint |
| `--color-fg-muted` | `--color-accent-subtle` | 4.5:1 | Description on the checked tint |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Description on a dialog |
| `--color-border-selected` | `--color-bg-surface` | 3:1 | Checked card frame |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring |

Checked never relies on colour alone: a centre dot appears (and a card doubles
its frame). Under forced colours the rules read `CanvasText` and the ring
`Highlight` through the tokens. Disabled text is exempt from contrast minimums.

## Responsive behaviour

- Stacked groups are the same at every width; labels and descriptions wrap
  under themselves, never under the dot.
- Inline groups wrap onto more lines. The five star cards fit on one line from
  about 560 px and wrap to two or three lines at 320–360 px; each card keeps its
  stars and word together.
- Cards take one column below about 600 px (18 rem plus gutters) and as many
  18 rem columns as fit above that. Titles wrap; keep them to two or three words.
- A field projected between radios (resolve-hold) sits indented by `--space-8`
  through the page's own class; it wraps like any field.
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom every option
  stays available. Every label is a full-width target at least 44 px tall on
  touch devices (choice rows by default, radio rows under a coarse pointer,
  stub and card by their padding).

## Accessibility

### Role and pattern

Native `<input type="radio">`s with one shared `name` in a `<fieldset>` with a
`<legend>`, which gives the
[APG Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
without ARIA roles. No `role="radiogroup"`, no `tabindex` management in script.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves into the group (to the checked radio, or the first when none is checked) and out of it. The radios are one tab stop; a field projected between them is its own stop. |
| <kbd>↓</kbd> / <kbd>→</kbd> | Checks the next enabled radio, wrapping to the first. |
| <kbd>↑</kbd> / <kbd>←</kbd> | Checks the previous enabled radio, wrapping to the last. |
| <kbd>Space</kbd> | Checks the focused radio when none is checked yet. |
| <kbd>Enter</kbd> | Submits the form, as native; it does not check. |

### Focus

The ring follows the input that has focus: on the 20 px dot for choice and stub
rows, on `.radio__dot` for radio rows, around the card for cards. Arrow keys
move focus and selection together, so the ring is always on the checked option.
The hidden input of radio rows and cards stays 1 px and in place, so focus never
scrolls the page. `focus()` never moves the selection.

### Labelling

- The legend names the group, markers included: "Why are you reporting it?
  (required)". Each `<label>` names its option; the description is inside it.
- The star cards are named by their hidden words — "5 out of 5 stars
  Unforgettable" — and never by the star characters, which are `aria-hidden`
  (L2-102).
- The group error is linked from the fieldset with `aria-describedby` (error
  first, then help), and every radio gets `aria-invalid="true"` (D-1). The
  error and every `aria-invalid` go away when a radio is checked and the page
  clears `error`.
- `required` is on the first radio only; the browser treats the group as one.

### Announcements

None of its own. Checking a radio is announced by the screen reader as the
state change. The page's status region announces sending and failure.

### Motion

The dot fill and the card lift take `--duration-fast`. Under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero, so both
change instantly.

## Content and internationalisation

- The legend asks the question: "Why are you declining?", "Act type", "Kind of
  gathering". Sentence case; a question mark when it is one.
- Options are parallel and mutually exclusive. If two could both be true, use
  checkboxes.
- Descriptions are one short sentence or fact: "Burlington is 44 km from
  Brampton", "Refund part of the $200 Grace has paid." Money, distances and
  dates inside them are formatted by the page with the API library's format
  service ("$600", "44 km", L2-110).
- Pre-check the most common answer only when a guess is safe ("I'm not free
  that day", "Solo"). Leave money and moderation outcomes unchosen.
- Card detail lines use a middle dot: "Three or four songs · about 25 min".
- Translatable inputs: `legend`, `requiredMarker`, `optionalMarker`, `help`,
  `error`, each option's projected label and `description`. French options run
  about 30 % longer; inline rows wrap and cards grow taller.

## Performance

- Change detection: `OnPush`, signal inputs. The group holds the value in a
  signal; each `zm-radio` reads `checked`, `invalid` and `variant` as
  `computed`s from the injected group, so checking one radio re-renders only
  the two that changed. No subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/RadioGroup.ts`
  renders the decline-request group — "Why are you declining? (optional)" with
  its four `choice` options and descriptions, "I'm not free that day" checked;
  `StarRating.ts` renders the write-review "Your rating (required)" group of
  five `stub` cards, an inline composition that repeats on a screen.
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms. Export both from `scenarios/index.ts`.
- Composite scenarios: none.
- Layout stability: the group renders at its final size; an error is one
  caption line added only after a submit (L2-086).
- Imports only Angular core, common (`NgTemplateOutlet`) and forms. No CDK.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-radio-group name="reason" legend="Why are you declining?" optionalMarker="(optional)">` with four `zm-radio`s, when it renders, then the host contains one `fieldset.fieldset` whose `<legend>` reads "Why are you declining? (optional)" with `.field__optional`, and four `label.choice` elements each holding an `input[type="radio"][name="reason"]` with the ID `reason-{value}`. (L2-030)
- **AC-2** Given the "It's too far to travel" option with `description="Burlington is 44 km from Brampton"`, when it renders, then the description is a `<small>` inside `.choice__text` and the radio's accessible name is "It's too far to travel Burlington is 44 km from Brampton". (L2-030)
- **AC-3** Given `variant="radio"` and `legendStyle="label"` for "Why are you reporting it?", when it renders, then the fieldset is `fieldset.choice-group`, each option is `label.radio` with `.radio__dot` and `.radio__text`, and each description is `.radio__desc`. (L2-062)
- **AC-4** Given `layout="inline"` for "Act type (required)" with Solo, Duo, Band and Choir, when it renders at 768 px, then the options wrapper has `.choice-group__options--inline` and the four options sit on one row. (L2-047)
- **AC-5** Given `variant="card"` and `layout="cards"` for "Kind of gathering", when it renders, then each option is `label.choice-card` with `.choice-card__title` "Sunday service" and `.choice-card__meta` "Three or four songs · about 25 min", in a grid of 18 rem columns. (L2-100)
- **AC-6** Given the resolve-hold group with a `zm-form-field` "Amount to refund (required)" projected between "Partial refund" and "Full refund", when it renders, then the field sits between those two radios inside the fieldset, the three radios share `name="resolution"`, and Tab from the checked "Partial refund" moves to the amount input. (L2-068)

### Value

- **AC-7** Given `formControlName="reason"` with value `null`, when "Offensive" is clicked, then that radio is checked, the control's value becomes "offensive", and every other radio in the group is unchecked. (L2-062)
- **AC-8** Given the form control's value is set to "4" in edit mode, when the star group renders, then the "4 out of 5 stars" radio is checked; given the value is set to `null`, then none is checked. (L2-059)
- **AC-9** Given `requiredMarker="(required)"` on "Your rating", when it renders, then only the first radio carries the `required` attribute. (L2-059)

### States

- **AC-10** Given "Why are you reporting it? (required)" submitted with nothing chosen, when `error` is "Choose one reason.", then `.field__error#reason-error` renders after the options, the fieldset has `aria-describedby="reason-error"`, every radio has `aria-invalid="true"` and every dot's rule is `--color-danger-border`. (L2-102)
- **AC-11** Given the invalid reporting group, when "Other" is checked and the page clears `error`, then the error element, the fieldset's `aria-describedby` and every `aria-invalid` are removed. (L2-102)
- **AC-12** Given the write-review dialog while "Post review" is pending, when the page disables the rating group, then every star radio is `disabled`, "5 out of 5 stars" stays checked with its `--color-accent-subtle` tint, and the value is kept. (L2-108)
- **AC-13** Given the "Another reason" option with `disabled`, when the group renders, then that radio has the native `disabled` attribute, its text is `--color-fg-disabled`, and arrow keys skip it. (L2-101)
- **AC-14** Given a checked choice card "Sunday service", when it renders, then it has a `--color-border-selected` frame doubled by an inset ring and a `--color-accent-subtle` fill; when a card is hovered, then it lifts by `--transform-lift` over `--shadow-1`. (L2-103)

### Keyboard and focus

- **AC-15** Given the decline group with "I'm not free that day" checked, when Tab enters the group, then focus lands on that radio; when ↓ is pressed three times, then "Another reason" is checked and focused; when ↓ is pressed again, then the first option is checked again. (L2-101)
- **AC-16** Given keyboard focus on a choice row, a radio row and a choice card, when each has focus, then the two-tone ring is visible on the 20 px dot, on `.radio__dot` and around the whole card respectively. (L2-101)
- **AC-17** Given the error summary's "Choose one reason." link, when it calls `focus()` on the group with nothing checked, then the first enabled radio receives focus and nothing becomes checked. (L2-101)

### Screen readers

- **AC-18** Given the star rating, when a screen reader moves through it, then the options are announced as "5 out of 5 stars Unforgettable, radio button, 1 of 5" and so on, and no star character is announced. (L2-102)
- **AC-19** Given the invalid reporting group, when focus enters it, then the group is announced with its legend "Why are you reporting it? (required)" and the description "Choose one reason.", and the radio as invalid. (L2-102)
- **AC-20** Given a page with every variant in every state (default, checked, invalid, disabled, checked and disabled) in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when every variant renders, then the empty dot is `--color-bg-surface` charcoal with a `--color-border-strong` rule, the checked dot stays yellow with an ink centre, and the checked card frame is `--color-border-selected` yellow. (L2-104)
- **AC-22** Given both themes, when contrast is measured, then the dot rule, checked centre, checked card frame, invalid rule and focus ring are at least 3:1, and labels and descriptions on `--color-bg-surface` and `--color-accent-subtle` at least 4.5:1. (L2-103)

### Responsive

- **AC-23** Given a 320 px viewport, when the five star cards render inline, then they wrap onto further lines, each card keeps its stars and word together, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-24** Given a 360 px viewport, when "Release the balance" with its description "Charge Grace's $600 balance now and pay Hosanna Collective $736." renders, then the text wraps under itself beside the dot, never under it. (L2-096)
- **AC-25** Given a touch device, when a choice row and a radio row are measured, then each label's target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given the French catalogue, when the legends, options and descriptions are translated, then they render with no code change and longer text wraps rather than clips. (L2-111)

### Motion

- **AC-27** Given `prefers-reduced-motion: reduce`, when a radio is checked or a card is hovered, then the fill and the lift change without a transition. (L2-103)

### Performance

- **AC-28** Given the `RadioGroup` and `StarRating` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. The library has no radio component.

- Folder `frontend/projects/components/src/lib/radio-group/` with
  `radio-group.ts` (class `RadioGroup`, selector `zm-radio-group`) and
  `radio.ts` (class `Radio`, selector `zm-radio`); export both from
  `public-api.ts`.
- `RadioGroup` provides itself under a `RADIO_GROUP` injection token and
  `NG_VALUE_ACCESSOR`. It holds `value`, `disabled` and `touched` state in
  signals; `Radio` injects the token and reads `name`, `variant`, `invalid`,
  `required` (true only for the first registered radio) and `checked`.
- `Radio` renders its label content once in an `<ng-template>` and outputs it
  with `ngTemplateOutlet` inside the `@switch` on `variant`.
- Styles: the `.choice`, `.choice--stub`, `.radio`, `.choice-card`,
  `.fieldset`/`.choice-group` legend and `.choice-group__options` rules from
  `components.css`, encapsulated in the two components; the choice input's
  two-tone focus ring is declared on the input, since global `:focus-visible`
  styles are not relied on.
- No CDK primitive: native radios give the keyboard pattern.
- Composes nothing; a projected [form field](form-field.md) is the page's.
- Perf-test scenarios `RadioGroup.ts` and `StarRating.ts`, exported from
  `scenarios/index.ts`.

## Decisions

- **D-1** *Where is a group error linked: from the fieldset or from each radio?* From the fieldset (`aria-describedby`), with `aria-invalid="true"` on every radio. The design-system page states this rule and renders it; the `dialogs/report-review/invalid` mock puts `aria-describedby` on each radio instead, which makes the error repeat on every arrow press. The design system is the corrected source, and L2-102's "message is linked with `aria-describedby`" is met at the group, which is the field. This is a source conflict for the user to confirm.
- **D-2** *Is `zm-radio` usable on its own?* No. A radio without a group has no name and no value to report; one group owns both and the error.
- **D-3** *Why can the group hold content other than radios?* Resolve-hold shows the refund amount right under "Partial refund". Projecting it between the radios keeps it next to the option it belongs to in reading and tab order, without a slot per option.
- **D-4** *Which legend style is the default?* `heading` (`fieldset.fieldset`). Most mock groups (decline, act type, star rating) use it; the moderation and payment dialogs and the design-system page use the `.choice-group` overline, available as `label`.
- **D-5** *Do choice and stub rows have a hover style?* No. `components.css` gives them none and the design system renders none; the pointer cursor and the whole-row target are enough. Radio rows and cards keep their documented hover.
- **D-6** *Why a `.choice-group__options` wrapper?* The slot must be declared once, but inline and card layouts need a container. With `display: contents` when stacked, the fieldset's own gap applies as in the mocks; inline and cards get a real box. The design-system page has no element for this, so it is a CRD addition the page can catch up with.
- **D-7** *How are radio IDs formed?* `{name}-{value}` ("reason-offensive", "stars-5"). The mocks use mostly that pattern; one stem keeps error-summary targets predictable.
- **D-8** *Choice cards have no invalid or disabled look on the design-system page's states matrix (inline styles only). Which applies?* The later `components.css` rules: an invalid card's frame turns `--color-danger-border`, a disabled one takes `--color-fg-disabled` on `--color-bg-subtle` with no lift, even when checked — the same values the page showed inline. Cards are not used in a busy form today, so losing the selected tint while disabled costs nothing.
- **D-9** *What happens while the form is busy?* The page disables the group through the forms API (radios have no read-only state), keeping the checked answer visible, as the write-review, decline-request and report-review busy mocks do.
