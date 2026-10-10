# Checkbox

| Field | Value |
|---|---|
| Selector | `zm-checkbox`, `zm-checkbox-group` |
| Library path | `frontend/projects/components/src/lib/checkbox/` |
| Status | planned |
| Traces to | L2-022, L2-037, L2-048, L2-050, L2-056, L2-065, L2-068, L2-080, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`checkbox.html`](../../design-system/components/checkbox.html) |
| Source mocks | [`pages/sign-up/invalid`](../../mocks/pages/sign-up/invalid.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/account/default`](../../mocks/pages/account/default.html), [`dialogs/weekly-default/default`](../../mocks/dialogs/weekly-default/default.html), [`dialogs/pay-deposit/invalid`](../../mocks/dialogs/pay-deposit/invalid.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/admin-bookings/default`](../../mocks/pages/admin-bookings/default.html), and every other screen with a checkbox (see Usage) |
| Rendering | [`checkbox.html`](checkbox.html) |

## Purpose and scope

A checkbox says yes to something on its own line and waits for the form to be
sent: the styles Abigail leads, the days she is unavailable every week, the
emails Naomi wants, that she accepts the terms. Several can be ticked at once,
and a ticked box fills butter yellow with an ink tick.

- `zm-checkbox` is one native `<input type="checkbox">` in its label, as a light
  choice row (`.choice`, the default), a framed consent stub (`.choice--stub`)
  or the drawn box (`.check`) that also has the indeterminate state. Alone it is
  a boolean form control with its own error.
- `zm-checkbox-group` is the `<fieldset>` and `<legend>` around several
  checkboxes. It is one form control whose value is the list of ticked values.

Use something else when:

- exactly one of several → [radio group](radio-group.md);
- a setting that applies at once, with no submit → [switch](switch.md);
- filters that change the lineup immediately → [chip](chip.md);
- a typed or picked answer with a label above → [form field](form-field.md).

Out of scope:

- Validation rules and their copy ("Accept the terms and privacy policy to create
  an account.", "Pick 1 to 4 styles."). The page validates and passes `error`.
- Saving consent records and their versions (L2-080) and email preferences
  (L2-065). The page sends the form; the checkbox only holds the value.
- The select-all logic. The page computes `indeterminate` and the parent's
  checked state from the children; the checkbox renders them.
- Grid layout of the form. A group always spans a form grid; a single checkbox
  spans one only with `full`; anything else (the "Held only" filter's
  `align-self`) is the page's.
- Groups of switches. The [switch](switch.md) leaves its fieldset to the page;
  checkbox groups need a component because their value is a list.

## Usage

The mocks render about 480 checkboxes on 40 screens: 470 light `.choice` rows,
4 `.choice--stub` consents and 19 drawn `.check` boxes. Each row is one distinct
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/edit-profile/*` "Styles" (and the dialogs drawn over it) | group, `requiredMarker="(required, pick 1 to 4)"`, `layout="inline"`, choice rows | "Band", "Solo vocalist", "Gospel choir", "Acoustic", "Hymns", "Spanish" | checked, unchecked; disabled while saving | form section, form grid |
| `pages/edit-profile/*` "Languages you lead in" | group, `optionalMarker`, inline, choice rows | "English", "French", "Spanish", "Twi", "Amharic", "Korean" | checked, unchecked, disabled while saving | form section |
| `pages/apply/*` "Styles" | group, `requiredMarker`, inline | the same six styles | checked, unchecked | form grid |
| `dialogs/weekly-default/*` | group "Unavailable every" + `optionalMarker="(choose any)"`, stack, choice rows | "Sunday" … "Saturday" | Monday checked; disabled while saving | dialog |
| `pages/account/*` "Email me about" (and the dialogs over it) | group, stack, choice rows with descriptions; one row `disabled` and checked | "Bookings and payments" + "Always on: these are about your dates and your money."; "Event reminders" + "A week and a day before each event."; "Review prompts" + "Two days after an event, so other churches hear how it went."; "New artists near my church" + "Optional. About once a month; the same choice you made at sign-up." | checked, unchecked, checked + disabled ("Always on"), disabled while saving | form section |
| `pages/sign-up/*` terms | single, choice row, `requiredMarker`, `required` | "I accept Zamaro's terms of use and privacy policy (required)" | unchecked; invalid "Accept the terms and privacy policy to create an account."; checked + disabled while creating | auth stub |
| `pages/sign-up/*` marketing consent | single, choice row with description, never pre-ticked | "Email me about new artists near my church" + "Optional. About once a month; unsubscribe any time." | unchecked; disabled while creating | auth stub |
| `dialogs/pay-deposit/*` card consent | single, `variant="stub"`, `requiredMarker`, description, `full` | "Save this card for the $487.50 balance (required)" + "Charged 48 hours after the event, Mon 16 Nov at 7:00 p.m., unless you report a problem first." | unchecked, checked; invalid "Tick the box so we can charge the balance after the event."; checked + disabled while paying | dialog, inside the "Card details" fieldset's form grid |
| `pages/admin-application/*` references | single, `variant="check"`, description | "Reference verified" + "Call or email them, then tick when they vouch for Tobi." / "Verified by Priya Nair, Fri 9 Oct, 1:50 p.m." | unchecked, checked, checked + disabled | panel |
| `dialogs/reject-application/*` (page behind) | as admin-application | as above | as above | panel |
| `pages/admin-bookings/*` search filter | single, `variant="check"`, description, beside a search field in a `form-grid` | "Held only" + "Completed bookings with a reported problem" | unchecked, checked | form grid |
| Design system: "What would you like from Abigail?" | group, `variant="check"`, descriptions | "Lead the congregation" + "Three or four songs in the service." … | checked, unchecked | surface |
| Design system: select all | group "Styles", `variant="check"`; a parent without `value` with `indeterminate` and `controls`; `indent` children | "All styles"; "Band", "Gospel choir", "Hymns" | indeterminate, checked, unchecked | surface |
| Design system: states matrix | `variant="check"` | "Hymns", "Band", "All styles" | unchecked, checked, indeterminate × default, hover, focus, invalid, disabled | surface |

## Anatomy

`zm-checkbox`, choice row (default):

1. **Row** — `label.choice`: flex row, `--space-3` between box and text,
   at least `--target-comfortable` tall, `--space-2` block padding. The whole
   row is the target.
2. **Box** — the native `input[type="checkbox"]` drawn with `appearance: none`:
   1.25 rem square, `--border-width-thick` rule, `--radius-sm`; checked fills
   `--color-accent` with a clip-path tick in `--color-fg-on-accent`.
3. **Text** — `.choice__text`: a grid of the label line and the description,
   `--space-0-5` apart.
4. **Label** — a `<span>` holding the projected label, then the marker
   (`.field__required` / `.field__optional`) after a space.
5. **Description (optional)** — `<small>` in `--text-body-sm`, muted. Part of
   the name.
6. **Error (standalone, optional)** — `span.field__error` after the label.

Stub (`.choice.choice--stub`): the same row framed by a `--border-width-thick`
rule in `--color-border-strong` with `--space-3` × `--space-4` padding on
`--color-bg-surface`; checked turns the fill `--color-accent-subtle`.

Drawn box (`label.check`):

1. **Input** — `input[type="checkbox"]`, visually hidden (1 px, opacity 0) but
   focusable, first in the label.
2. **Box** — `.check__box`, directly after the input: `--target-min` square,
   `--radius-xs`, holding two `zm-icon`s in one grid cell, `.check__tick` and
   `.check__dash`; CSS shows one by state.
3. **Text** — `.check__text` with the label and `.check__desc`.

`zm-checkbox-group`:

1. **Fieldset** — `<fieldset class="fieldset">` (`legendStyle="heading"`) or
   `<fieldset class="choice-group">` (`legendStyle="label"`).
2. **Legend** — the question or noun phrase, with the marker inside it.
3. **Help (optional)** — `.field__help`, after the legend.
4. **Options** — `.choice-group__options` around the projected checkboxes:
   `display: contents` when stacked, a wrapping row when `inline`.
5. **Error (optional)** — `.field__error`, after the options.

Host: `zm-checkbox` is `display: flex; flex-direction: column; gap:
var(--space-1)` around one label and its error; with `full` it spans every grid
column. `zm-checkbox-group` is `display: block` and always spans every grid
column (`grid-column: 1 / -1`, a no-op outside a grid), as `.form-grid >
.fieldset` does in the mocks. The classes are on the native elements inside.

## API

### `zm-checkbox` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'choice' \| 'stub' \| 'check'` | `'choice'`, or the group's | no | `choice` → `.choice`; `stub` → `.choice.choice--stub`; `check` → `.check`. An explicit value wins over the group's. |
| `value` | `string` | — | in a group | The value the group collects. A child without `value` is standalone even inside a group (the select-all parent). |
| `name` | `string` | the group's `name` | no | Native `name`. |
| `description` | `string` | — | no | `<small>` (choice, stub) or `.check__desc` (check), inside the label. |
| `requiredMarker` | `string` | — | no | "(required)": `.field__required` after the label text. Sets native `required` on a standalone checkbox. |
| `optionalMarker` | `string` | — | no | "(optional)": `.field__optional`. If both are set, `requiredMarker` wins and dev mode logs a console error. |
| `required` | `boolean` (attribute) | `false` | no | Native `required` without a visible marker. |
| `indeterminate` | `boolean` (attribute) | `false` | no | Sets the native `indeterminate` property (there is no attribute). Only with `variant="check"`; on other variants dev mode logs a console error and it is ignored. Cleared by the browser when the box is toggled; the page sets it again from the children. |
| `controls` | `string` | — | no | `aria-controls` (space-separated IDs of the boxes a select-all parent controls). |
| `id` | `string` | generated `zm-checkbox-{n}` | no | The input's `id`; error ID `{id}-error`. |
| `describedBy` | `string` | — | no | Extra IDs appended to `aria-describedby`. |
| `label` | `string` | — | with no visible text | Written as `aria-label` on the input, for a box with no projected label text: a table row selector ("Select Abigail Mensah, Sat 14 Nov") or a table's select-all header ("Select all open requests"). With `label` and no projected content the text element (`.choice__text` / `.check__text`) is not rendered, and the label row keeps its 24 px box and 44 px target. In dev mode a checkbox with neither projected text nor `label` logs a console error. |
| `error` | `string \| null` | `null` | no | Standalone only: renders `.field__error#{id}-error` after the label, sets `aria-invalid="true"` and puts the error ID first in `aria-describedby`. Inside a group, use the group's `error`. |
| `invalid` | `boolean` (attribute) | `false` | no | `aria-invalid="true"` without a message (set by the group on its children). |
| `disabled` | `boolean` (attribute) | `false` | no | Locks one option ("Bookings and payments: Always on"). ORs with the forms API's disabled state and the group's. |
| `indent` | `boolean` (attribute) | `false` | no | `padding-inline-start: var(--space-8)`, for children under a select-all parent. |
| `full` | `boolean` (attribute) | `false` | no | Host spans every grid column (`grid-column: 1 / -1`). |

Standalone, `zm-checkbox` is a `ControlValueAccessor` with a `boolean` value.
Inside a `zm-checkbox-group` with a `value`, its checked state comes from the
group's value and it does not register its own accessor.

### `zm-checkbox-group` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `legend` | `string` | — | yes | Legend text: "Styles", "Email me about", "Unavailable every". |
| `requiredMarker` | `string` | — | no | "(required, pick 1 to 4)": `.field__required` inside the legend. No native `required` on the boxes (D-5). |
| `optionalMarker` | `string` | — | no | "(optional)", "(choose any)": `.field__optional`. |
| `help` | `string` | — | no | `.field__help#{id}-help` after the legend. |
| `error` | `string \| null` | `null` | no | `.field__error#{id}-error` after the options; the fieldset gets `aria-describedby="{id}-error {id}-help"` and every child `aria-invalid="true"`. |
| `variant` | `'choice' \| 'stub' \| 'check'` | `'choice'` | no | Default variant of the children. |
| `layout` | `'stack' \| 'inline'` | `'stack'` | no | `inline` adds `.choice-group__options--inline`: a wrapping row. |
| `legendStyle` | `'heading' \| 'label'` | `'heading'` | no | `heading` → `fieldset.fieldset` (legend `--text-h4`, as every mock); `label` → `fieldset.choice-group` (stamped overline legend, as the design-system specimens). |
| `name` | `string` | — | no | Native `name` for every child without its own. |
| `id` | `string` | generated `zm-checkbox-group-{n}` | no | The fieldset's `id`; stem of the help and error IDs. |

`zm-checkbox-group` is a `ControlValueAccessor` whose value is a `readonly
string[]` of the ticked children's values, in DOM order. Writing a value ticks
exactly the children whose value is in it; values with no child are kept in
the model and dev mode logs a console error. `setDisabledState` disables every
child.

### Methods

| Component | Method | Effect |
|---|---|---|
| `zm-checkbox` | `focus(): void` | Focuses the native input. |
| `zm-checkbox-group` | `focus(): void` | Focuses the first enabled child's input (the error summary's link target). |

### Outputs

None. Values reach the page through the forms API. The native `change` event
bubbles from the input for pages that react to a single box (select all).

### Content slots

| Component | Slot | Accepts | Rule |
|---|---|---|---|
| `zm-checkbox` | default | the label text (inline content) | Declared once, in one `<ng-template>` rendered with `ngTemplateOutlet` in the choice and the check branch (AGENTS.md slot rule). Never block content, links or controls. |
| `zm-checkbox-group` | default | `zm-checkbox` children | Declared once, inside `.choice-group__options`. |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- Every string arrives from the consumer (L2-111): the projected label,
  `description`, `legend`, both markers, `help` and `error`.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Choice row | `.choice` | Every form and dialog checkbox: styles, languages, weekdays, email preferences, terms. The default. |
| Stub | `.choice.choice--stub` | One important consent that deserves a frame: "Save this card for the $487.50 balance". |
| Drawn box | `.check` | Where the indeterminate state is needed (select all) and the admin tools: "Reference verified", "Held only". |

| Group layout | Modifier | Use for |
|---|---|---|
| Stack | — (options `display: contents`) | Rows with descriptions, weekdays. The fieldset's own gap separates them. |
| Inline | `.choice-group__options--inline` | Short one- or two-word options: styles, languages. |

One size. The choice box is 1.25 rem in a row at least `--target-comfortable`
(44 px) tall; the drawn box is `--target-min` (24 px) in a row at least
`--target-min` tall, `--target-comfortable` under a coarse pointer. The label
makes the row the target, so its width comes from the text and the container.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Unchecked | — | Surface box with a `--color-border-strong` rule | "not checked" |
| Hover (check) | `:hover` on `.check` | Empty box fills `--color-accent-subtle`; a checked or indeterminate box keeps its yellow | — |
| Hover (choice, stub) | `:hover` | No change; the cursor is a pointer over the whole row | — |
| Focus | input `:focus-visible` | The two-tone ring: a `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset` over a `--color-focus-ring-offset` gap. Check: on `.check__box`. Choice and stub: on the drawn input. Never on the row or the label text. | — |
| Checked | `checked` | Box fills `--color-accent`, rule `--color-border-on-accent`, ink tick; stub row fills `--color-accent-subtle` | "checked" |
| Indeterminate | `indeterminate` (check) | Yellow fill with the ink dash; the tick hidden | "mixed" / "half checked" |
| Invalid | `error` or group `error` | Box rule `--color-danger-border` on every box, checked or not; a checked box keeps its yellow fill and tick. Error text under the row or the group. | `aria-invalid="true"`; described by the error |
| Disabled | `disabled`, forms disabled or group disabled | Box `--color-bg-subtle`; rule `--color-fg-disabled` (check) or `--color-border-default` (choice); label `--color-fg-disabled`; `cursor: not-allowed` | Out of the tab order; "dimmed"/"unavailable" |
| Checked + disabled | both | `--color-bg-subtle` box with the tick (or dash) in `--color-fg-muted`, muted label ("Always on"); the tick stays visible in both themes (D-12) | "checked, dimmed" |
| Busy | page disables the boxes; `form[aria-busy="true"]` fades fieldsets ([form layout](form-layout.md)) | As disabled, at 60 % opacity | The page's status region announces progress |

Rules:

- A ticked box is never colour alone: the tick or dash appears.
- Consent and anything that costs money is never pre-ticked; the component has
  no default `checked` (the forms value starts `false`).
- While a form is sending (L2-108) the page disables every checkbox, as the
  sign-up, pay-deposit, weekly-default and edit-profile busy mocks do; values are
  kept.

## Markup

Rendered by `zm-checkbox`, choice row with a marker, standalone and invalid:

```html
<zm-checkbox>
  <label class="choice">
    <input type="checkbox" id="terms" name="terms" required aria-invalid="true" aria-describedby="terms-error">
    <span class="choice__text"><span>I accept Zamaro’s terms of use and privacy policy <span class="field__required">(required)</span></span></span>
  </label>
  <span class="field__error" id="terms-error">Accept the terms and privacy policy to create an account.</span>
</zm-checkbox>
```

With a description:

```html
<label class="choice">
  <input type="checkbox" id="news" name="news">
  <span class="choice__text"><span>Email me about new artists near my church</span><small>Optional. About once a month; unsubscribe any time.</small></span>
</label>
```

Stub, checked and full width:

```html
<zm-checkbox><!-- full: the host spans every grid column -->
  <label class="choice choice--stub">
    <input type="checkbox" id="consent" name="consent" required>
    <span class="choice__text"><span>Save this card for the $487.50 balance <span class="field__required">(required)</span></span><small>Charged 48 hours after the event, Mon 16 Nov at 7:00 p.m., unless you report a problem first.</small></span>
  </label>
</zm-checkbox>
```

Drawn box, indeterminate parent:

```html
<label class="check">
  <input type="checkbox" id="styles-all" aria-controls="st-band st-choir st-hymns"><!-- .indeterminate = true -->
  <span class="check__box">
    <zm-icon class="check__tick" name="check" aria-hidden="true">…</zm-icon>
    <zm-icon class="check__dash" name="dash" aria-hidden="true">…</zm-icon>
  </span>
  <span class="check__text">All styles</span>
</label>

<label class="check">
  <input type="checkbox" id="ref-1" name="ref-1">
  <span class="check__box">…</span>
  <span class="check__text">Reference verified<span class="check__desc">Call or email them, then tick when they vouch for Tobi.</span></span>
</label>
```

Rendered by `zm-checkbox-group`, inline, with a group error:

```html
<zm-checkbox-group>
  <fieldset class="fieldset" id="styles" aria-describedby="styles-error">
    <legend>Styles <span class="field__required">(required, pick 1 to 4)</span></legend>
    <div class="choice-group__options choice-group__options--inline">
      <zm-checkbox><label class="choice"><input type="checkbox" name="styles" value="band" aria-invalid="true"><span class="choice__text"><span>Band</span></span></label></zm-checkbox>
      …
    </div>
    <span class="field__error" id="styles-error">Pick 1 to 4 styles.</span>
  </fieldset>
</zm-checkbox-group>
```

`legendStyle="label"` renders `<fieldset class="choice-group">` instead; the
structure is the same. The stack layout drops only the `--inline` modifier.
In the rendered markup the projected label is inside a `<span>` in the choice
variants and directly in `.check__text` in the check variant.

Consumer templates:

```html
<zm-checkbox formControlName="terms" name="terms"
             [requiredMarker]="'common.form.required' | transloco"
             [error]="errors().terms ?? null">{{ 'signUp.terms' | transloco }}</zm-checkbox>

<zm-checkbox-group formControlName="styles" name="styles" layout="inline"
                   [legend]="'profile.styles.legend' | transloco"
                   [requiredMarker]="'profile.styles.marker' | transloco"
                   [error]="errors().styles ?? null">
  @for (style of styles; track style) {
    <zm-checkbox [value]="style">{{ 'common.style.' + style | transloco }}</zm-checkbox>
  }
</zm-checkbox-group>

<zm-checkbox-group formControlName="emails" [legend]="'account.emails.legend' | transloco">
  <zm-checkbox value="bookings" disabled [description]="'account.emails.bookingsHelp' | transloco">{{ 'account.emails.bookings' | transloco }}</zm-checkbox>
  <zm-checkbox value="reminders" [description]="'account.emails.remindersHelp' | transloco">{{ 'account.emails.reminders' | transloco }}</zm-checkbox>
</zm-checkbox-group>

<zm-checkbox variant="check" formControlName="ref1" [description]="refNote(0)">{{ 'admin.application.refVerified' | transloco }}</zm-checkbox>
```

The classes, the input's `type`, `name`, `value` and `aria-*` attributes, and
the fieldset and legend are a contract: page objects find boxes by role and
name and groups by role `group` and legend. The `zm-icon` internals are free to
change.

## Design

- Choice row: `display: flex`, `align-items: flex-start`, gap `--space-3`,
  `min-height: var(--target-comfortable)`, `padding-block: var(--space-2)`,
  `--text-body`, `cursor: pointer`.
- Choice box: 1.25 rem square, top margin 0.15 rem to align with the first
  line, `--border-width-thick` rule in `--color-border-strong`, `--radius-sm`,
  `--color-bg-surface` fill. Checked: `--color-accent` fill, rule
  `--color-fg-on-accent`, a 0.75 rem clip-path tick in `--color-fg-on-accent`.
- Choice text: grid, gap `--space-0-5`; `<small>` in `--text-body-sm`,
  `--color-fg-muted`.
- Stub: padding `--space-3` × `--space-4`, `--border-width-thick` rule in
  `--color-border-strong`, fill `--color-bg-surface`; checked fill
  `--color-accent-subtle`.
- Drawn box row: `display: inline-flex`, gap `--space-3`,
  `min-height: var(--target-min)`. Box `--target-min` square, `--radius-xs`,
  `--border-width-thick`; icons 1 rem with stroke width 3, both in grid area
  `1 / 1`. `.check__text` padding-top `--space-0-5`; `.check__desc`
  `--text-body-sm` muted.
- Markers: `--text-caption`, `--letter-spacing-normal`, no transform,
  `--color-fg-muted` (the same rule as in the [form field](form-field.md); the
  checkbox stylesheet carries its own copy, since styles are encapsulated).
- Error: `--text-caption`, `--font-weight-bold`, `--color-danger-fg`, text only.
- Group: the fieldset carries the [form layout](form-layout.md)'s `.fieldset`
  (column, gap `--space-4`, legend `--text-h4` uppercase, `margin-bottom:
  var(--space-4)`) or `.choice-group` (column, gap `--space-3`, legend
  `--text-overline`, `--letter-spacing-stamp`, uppercase, `margin-bottom:
  var(--space-3)`). Inline options: `display: flex; flex-wrap: wrap`; column
  gap `--space-6`; row gap `--space-0` for choice rows (they are already 44 px
  tall), `--space-3` for the drawn box and the stub.
- Fill transitions take `--duration-fast` with `--ease-standard`; nothing moves.

Component tokens (drawn box), declared on `.check__box`:

| Token | Aliases | Overridden by |
|---|---|---|
| `--control-bg` | `--color-bg-surface` | hover (`--color-accent-subtle`), checked and indeterminate (`--color-accent`), disabled (`--color-bg-subtle`) |
| `--control-border` | `--color-border-strong` | checked (`--color-border-on-accent`), invalid (`--color-danger-border`), disabled (`--color-fg-disabled`) |
| `--control-fg` | `--color-fg-on-accent` | disabled (`--color-fg-disabled`) |

The choice and stub rows read semantic tokens directly, as `components.css`
does; they declare no component tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Empty box fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Box rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Checked fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Checked rule and tick | `--color-border-on-accent` / `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Hover fill (check), checked stub fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Description, marker | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Invalid rule | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Error text | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` |
| Disabled fill / label | `--color-bg-subtle` / `--color-fg-disabled` | `--palette-ink-100` / `--palette-ink-400` | `--palette-ink-700` / `--palette-ink-600` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Box rule on a card |
| `--color-accent` | `--color-bg-surface` | 3:1 | Checked box against a card (the fill is the edge; D-13) |
| `--color-fg-on-accent` | `--color-accent` | 3:1 | Tick or dash on yellow |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid box rule |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Label |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Description and marker |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Label on a checked stub |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Error |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring |

The checked box is the same yellow with an ink tick in both themes. Disabled
boxes and labels are exempt from contrast minimums (WCAG 1.4.3) and also lose
the pointer. Under forced colours the native input draws the choice box and the
`.check__box` rule takes `CanvasText` through `--color-border-strong`; the tick
icons use `currentColor`.

## Responsive behaviour

- Groups stack at every width; inline groups wrap onto new lines and never
  scroll sideways.
- Labels and descriptions wrap under themselves, never under the box: the text
  column is `min-width: 0` beside a fixed box. "I accept Zamaro's terms of use
  and privacy policy (required)" wraps to three lines at 320 px.
- The stub frame keeps its padding and grows taller as the text wraps.
- Under a coarse pointer the drawn-box row grows to `--target-comfortable`; the
  choice row already is. The label makes each row's target its full width.
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom every row wraps
  and stays usable.

## Accessibility

### Role and pattern

Native `<input type="checkbox">` inside a `<label>`, which gives the
[APG Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
without ARIA, including the mixed state through the `indeterminate` property.
Groups are a `<fieldset>` with a `<legend>` (role `group`, named by the legend).
No `role="checkbox"` on anything else.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to each enabled checkbox in DOM order; every box is a tab stop. Disabled boxes are skipped. |
| <kbd>Space</kbd> | Toggles the focused box. An indeterminate parent becomes checked; the page then ticks every child. |
| <kbd>Enter</kbd> | Does not toggle; submits the form as the browser does. |

### Focus

The ring follows `:focus-visible` only. On the drawn box the input is hidden,
so the ring is drawn on `.check__box` (`input:focus-visible + .check__box`); on
the choice and stub rows it is drawn on the visible input. The row never
carries the ring. Toggling never moves focus; `focus()` puts it on the input.

### Labelling

- The wrapping label names the box: projected text, then the marker, then the
  description ("Event reminders A week and a day before each event."). Keep the
  description to one sentence.
- The legend names the group and is read before each box: "Styles (required,
  pick 1 to 4), group, Band, checkbox, not checked".
- A standalone error is linked from the input with `aria-describedby`; a group
  error from the fieldset. Invalid boxes have `aria-invalid="true"` (L2-102).
- A select-all parent lists its children in `aria-controls`.

### Announcements

None of its own. The browser announces state changes on toggle; errors appear
after a submit and the error summary takes focus.

### Motion

The fill fades over `--duration-fast`; nothing moves. Under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero and the
change is instant.

## Content and internationalisation

- Write the label as what will be true when ticked: "Bring backing tracks",
  "I accept Zamaro's terms of use and privacy policy". Never "Check to…".
- Labels in sentence case without a full stop; descriptions are one sentence
  with a full stop.
- A legend is a question or a noun phrase: "What would you like from Abigail?",
  "Styles", "Email me about".
- Markers in brackets: "(required, pick 1 to 4)", "(choose any)", "(optional)".
- Never pre-tick consent or anything that costs money (L2-080). Marketing email
  is its own unchecked box.
- The parent of an indeterminate group is "All {things}": "All styles".
- Money and dates inside labels are formatted by the page: "$487.50", "Mon 16
  Nov at 7:00 p.m." (L2-110).
- Translatable: the projected label, `description`, `legend`, `requiredMarker`,
  `optionalMarker`, `help`, `error`. Data values: style and language names from
  the catalogue, names in descriptions ("Verified by Priya Nair"). French runs
  about 30 % longer and wraps.

## Performance

- Change detection: `OnPush`, signal inputs; classes and `aria-describedby`
  from `computed`s. The group derives each child's checked state from one
  `computed` set of values; no per-child subscriptions. The only `effect` writes
  the native `indeterminate` property.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Checkbox.ts`
  renders Naomi's sign-up terms box, a choice row with the "(required)" marker
  ("I accept Zamaro's terms of use and privacy policy"); `CheckboxGroup.ts`
  renders the account "Email me about" group with its four rows and
  descriptions, "Bookings and payments" checked and disabled. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios: none today.
- Layout stability: ticking changes only colours; an error is one caption line
  that appears after a submit, never on load (L2-086).
- Imports Angular core, common (`NgTemplateOutlet`), forms (the value-accessor
  token) and `zm-icon`.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-checkbox>Event reminders</zm-checkbox>` with `description="A week and a day before each event."`, when it renders, then the host contains one `label.choice` holding an `input[type="checkbox"]` and `.choice__text` with the label `<span>` and a `<small>` description, and the box's accessible name is "Event reminders A week and a day before each event.". (L2-100)
- **AC-2** Given `variant="stub"` on the pay-deposit consent "Save this card for the $487.50 balance" with `requiredMarker="(required)"`, when it renders, then the label is `.choice.choice--stub`, the label line ends with `<span class="field__required">(required)</span>`, the input is `required`, and it is not checked until Naomi ticks it. (L2-037)
- **AC-3** Given `variant="check"` on "Reference verified" with the description "Call or email them, then tick when they vouch for Tobi.", when it renders, then the label is `.check` containing the hidden input, `.check__box` with `.check__tick` and `.check__dash` icons, and `.check__text` with `.check__desc`. (L2-048)
- **AC-4** Given the sign-up form, when it renders, then the terms box and the "Email me about new artists near my church" box are two separate unchecked checkboxes. (L2-080)

### Groups

- **AC-5** Given `zm-checkbox-group` "Styles" with `requiredMarker="(required, pick 1 to 4)"`, `layout="inline"` and six children, when it renders, then there is one `fieldset.fieldset` whose legend reads "Styles (required, pick 1 to 4)", and the children sit in `.choice-group__options.choice-group__options--inline`, wrapping with a `--space-6` column gap. (L2-050)
- **AC-6** Given the "Styles" group bound to a form control with `['solo-vocalist', 'hymns']`, when Abigail ticks "Band", then the control's value becomes `['band', 'solo-vocalist', 'hymns']`, in the children's DOM order. (L2-050)
- **AC-7** Given the "Styles" group with `error="Pick 1 to 4 styles."`, when it renders, then `.field__error` follows the options, the fieldset has `aria-describedby` naming it, and every checkbox in the group has `aria-invalid="true"`. (L2-102)
- **AC-8** Given the weekly-default group "Unavailable every (choose any)" with `optionalMarker="(choose any)"`, when it renders, then the legend contains `.field__optional` and the group value lists only the ticked days ("mon"). (L2-056)
- **AC-9** Given the account "Email me about" group with "Bookings and payments" `disabled` and checked, when Naomi unticks "Event reminders" and tries to untick "Bookings and payments", then the value drops `reminders`, keeps `bookings`, and the disabled box cannot be toggled. (L2-065)
- **AC-10** Given the admin-bookings search form with the "Held only" check box, when it is ticked and the form is submitted, then the form value carries `held: true`. (L2-068)

### States

- **AC-11** Given the sign-up terms box with `error="Accept the terms and privacy policy to create an account."`, when it renders, then `span.field__error#terms-error` follows the label, the input has `aria-invalid="true"` and `aria-describedby="terms-error"`, and the box rule is `--color-danger-border`. (L2-022)
- **AC-12** Given the "All styles" parent with `variant="check"`, `indeterminate` and `controls="st-band st-choir st-hymns"`, when it renders, then the input's `indeterminate` property is true, the dash is visible on a yellow fill, the tick is hidden, and `aria-controls` lists the three IDs. (L2-102)
- **AC-13** Given `indeterminate` on a choice-row checkbox, when it renders in dev mode, then a console error names `zm-checkbox` and the box renders without the mixed state. (L2-100)
- **AC-14** Given a checked box, when it renders in either variant, then it shows the tick on `--color-accent`, so the checked state is not carried by colour alone; and given hover on an unchecked `.check`, then only its box fill turns `--color-accent-subtle`. (L2-103)
- **AC-15** Given the account "Email me about" group in the dark theme, when "Bookings and payments" renders checked and disabled, then its tick is drawn in `--color-fg-muted` on `--color-bg-subtle` and is visible, so "Always on" still reads as ticked. (L2-065)
- **AC-16** Given the sign-up form is creating the account, when the page disables the checkboxes, then each input has `disabled`, keeps its checked state, is skipped by Tab, and the label is `--color-fg-disabled`. (L2-108)

### Keyboard and focus

- **AC-17** Given keyboard focus on a `.check` box, when it is focused, then the focus ring is drawn on `.check__box` and not on the row; given focus on a choice row, then the ring is on the drawn input. (L2-101)
- **AC-18** Given focus on "Event reminders", when Space is pressed, then it toggles and focus stays; when Enter is pressed, then it does not toggle. (L2-101)
- **AC-19** Given the "Styles" group is invalid, when the error summary link calls the group's `focus()`, then focus moves to the "Band" checkbox. (L2-101)

### Screen readers

- **AC-20** Given the "Styles" group, when a screen reader moves into "Band", then it announces the group name "Styles (required, pick 1 to 4)" and "Band, checkbox, not checked". (L2-102)
- **AC-29** Given a table row checkbox with `variant="check"`, `label="Select Abigail Mensah, Sat 14 Nov"` and no projected text, when it renders, then its accessible name is "Select Abigail Mensah, Sat 14 Nov" (from `aria-label`), no empty `.check__text` element renders, and its target is at least 44 × 44 CSS px on a coarse pointer; and given the indeterminate header "Select all open requests", then it is announced as mixed with that name. (L2-100)
- **AC-21** Given a page with every variant, group layout and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-22** Given the dark theme, when a checked box renders, then it keeps the `--color-accent` fill with the `--color-fg-on-accent` tick, and the empty box is `--color-bg-surface` with a `--color-border-strong` rule. (L2-104)
- **AC-23** Given both themes, when contrast is measured, then the box rule, the checked fill against the card, the tick and the invalid rule are at least 3:1 and the label, description and error at least 4.5:1 against their backgrounds. (L2-103)

### Responsive

- **AC-24** Given a 320 px viewport, when the terms box "I accept Zamaro's terms of use and privacy policy (required)" renders, then the text wraps under itself beside the box, nothing clips, and the page does not scroll horizontally. (L2-096)
- **AC-25** Given a coarse pointer, when a choice row or a drawn-box row is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-26** Given the French catalogue, when every label, description and legend is translated, then they render with no code change and wrap rather than clip. (L2-111)

### Motion

- **AC-27** Given `prefers-reduced-motion: reduce`, when a box is ticked, then its fill changes without a transition. (L2-103)

### Performance

- **AC-28** Given the `Checkbox` and `CheckboxGroup` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/checkbox/` with `checkbox.ts`
  (`Checkbox`, selector `zm-checkbox`), `checkbox-group.ts` (`CheckboxGroup`,
  selector `zm-checkbox-group`), their templates and styles; export both from
  `public-api.ts`.
- `zm-checkbox` provides `NG_VALUE_ACCESSOR` only when it is standalone. Inside
  a group with a `value` it injects the group (an optional `CHECKBOX_GROUP`
  token) and reads `checked`, `name`, `variant`, `invalid` and `disabled` from
  it; the group registers children through that token and orders values by
  `compareDocumentPosition`.
- The label slot lives in one `<ng-template>`; the template renders it with
  `ngTemplateOutlet` in the choice branch and the check branch.
- The native `indeterminate` property is set with an `effect` on the input
  element (`viewChild`).
- The drawn box needs `check` and `dash` icons in the [icon](icon.md) set.
- Styles: `.choice`, `.choice--stub`, `.check`, `.check__*`, the markers, the
  error and `.choice-group__options` live in the component stylesheets. The
  fieldset uses the global `.fieldset` / `.choice-group` layout classes from
  [form layout](form-layout.md).
- Add the perf-test scenarios `Checkbox.ts` and `CheckboxGroup.ts` and export
  them from `scenarios/index.ts`.
- Consumers to build with it: sign-up, account email preferences,
  edit-profile and apply styles and languages, weekly-default, pay-deposit,
  admin-application and admin-bookings.

## Decisions

- **D-1** *One component per look, or one with a variant?* One `zm-checkbox` with `variant`. The three looks are the same native control with the same API; only the markup inside the label differs, and the slot rule is met with one template.
- **D-2** *Which look is the default?* The choice row. It is about 470 of the 490 checkboxes in the mocks. The drawn box stays for the indeterminate state and the admin tools, as the design system reserves it.
- **D-3** *Does the group render `.fieldset` or `.choice-group`?* `.fieldset` by default, because every checkbox group in the mocks is a `fieldset.fieldset` with an `--text-h4` legend; `legendStyle="label"` gives the design-system specimens' `.choice-group` overline legend.
- **D-4** *How do options lay out without wrapping the slot in different elements?* One `.choice-group__options` element around the slot, `display: contents` when stacked so the fieldset's own gap applies exactly as in the mocks, and a wrapping flex row when inline. It is a CRD addition; the design-system page should document it.
- **D-5** *Does a required group put `required` on its boxes?* No. Native `required` on every box would demand all of them; "pick 1 to 4" is the page's rule, shown by the marker and checked on submit.
- **D-6** *What is the row gap of inline choice rows?* None (`--space-0`), with a `--space-6` column gap, as the edit-profile mock's `.cluster` sets. Choice rows are already 44 px tall with their own padding, so the design system's `--space-3` row gap would push wrapped rows apart. The drawn box and stub keep `--space-3`.
- **D-7** *Where is a group error linked?* From the fieldset with `aria-describedby`, and every box gets `aria-invalid="true"`, as the radio-group design system specifies for groups; the checkbox mocks show no group error. A single box links its error from the input, as the sign-up and pay-deposit mocks do.
- **D-8** *Does a group span a form grid?* Always: its host sets `grid-column: 1 / -1`, matching `.form-grid > .fieldset`, which cannot match through the component host. A single checkbox spans only with `full`, like the pay-deposit consent's `.field--full` wrapper.
- **D-9** *Busy forms: disabled or read-only?* Disabled. Checkboxes have no read-only state, and the sign-up, pay-deposit, weekly-default and edit-profile busy mocks disable them; values are kept (L2-108). The [form layout](form-layout.md) fade still applies to the fieldset.
- **D-10** *Should a box that saves the moment it is ticked be a checkbox ("Reference verified")?* It is a checkbox because its value is read when the administrator approves (L2-048 needs both references verified first); immediate settings use the [switch](switch.md), as its CRD says.
- **D-11** *Can the label hold links ("terms of use" as a link)?* No. A link inside a label toggles the box when clicked on some platforms and splits the name; when the terms and privacy policy need links, the page puts them outside the label, next to the box.
- **D-12** *What does a checked, disabled choice box look like?* The `components.css` rule gives it `--color-bg-subtle` and keeps the ink tick, which vanishes in the dark theme (ink on `--palette-ink-700`; the rendering shows it). The tick is drawn in `--color-fg-muted` instead, visible in both themes, so a locked "Always on" preference still reads as ticked. The design-system rule should catch up.
- **D-13** *Which edge of a checked box must meet 3:1?* Its yellow fill against the card. The ink rule (`--color-border-on-accent`) is 1.2:1 on the dark surface, as the rendering's contrast table shows, so in the dark theme the box's boundary is the `--color-accent` fill, which stays well above 3:1 in both themes; the ink rule is kept for the light theme's print look.
