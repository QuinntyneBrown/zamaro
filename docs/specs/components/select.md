# Select

| Field | Value |
|---|---|
| Selector | `zm-select` |
| Library path | `frontend/projects/components/src/lib/select/` |
| Status | planned |
| Traces to | L2-004, L2-007, L2-019, L2-048, L2-050, L2-053, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`select.html`](../../design-system/components/select.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/bookings/loading`](../../mocks/pages/bookings/loading.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`dialogs/add-song/default`](../../mocks/dialogs/add-song/default.html), [`dialogs/reject-application/invalid`](../../mocks/dialogs/reject-application/invalid.html), [`pages/admin-audit/default`](../../mocks/pages/admin-audit/default.html), and every other screen with a select (see Usage) |
| Rendering | [`select.html`](select.html) |

## Purpose and scope

A select picks one value from a list Naomi doesn't need to see all at once: the
kind of gathering, how far an artist will drive, how to sort the lineup, the key
Abigail leads "Goodness of God" in. It is the browser's own `<select>`, dressed
in the field's charcoal rule with a chevron drawn in CSS, so phones get their
system picker and screen readers get the native combobox for free.

`zm-select` is a field control: it sits inside a [form field](form-field.md),
which gives it its label, help, error and requirement marker. Outside a field
(the setlist's per-song key) it takes its name from `label`.

Use something else when:

- two to six options each need a sentence, or the choice costs money → [radio group](radio-group.md);
- several values at once → [checkbox](checkbox.md) group, or filter [chips](chip.md);
- the list is actions ("Share", "Remove from saved") → [menu](menu.md), never a select;
- the answer is a date → [date picker](date-picker.md); free text → [text field](text-field.md).

Out of scope:

- The label, markers, help, error and success messages. The
  [form field](form-field.md) renders them and wires `aria-describedby`.
- What a change does. The page re-sorts the lineup and announces "Sorted by
  highest rated" in its status region (L2-007); the select only reports the new
  value. A change never submits or navigates (WCAG 3.2.2).
- The option lists and their order. The page builds them from the catalogue
  and its data (L2-004, L2-048, L2-053) and passes formatted labels.
- The open list. It is drawn by the operating system and follows the theme's
  `color-scheme`; it cannot be styled.

## Usage

The mocks render 385 selects across 31 page and dialog folders: 157 inside a
field and 228 standalone in the setlist editor. Each row is one distinct
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/*` booking bar (and every dialog and toast drawn over Discover) | in a field, md | "Kind of gathering": Sunday service, Worship night, Youth event, Conference or retreat, Wedding, Funeral or memorial; "How far can they drive?": 40 km · 30 min, 80 km · 1 hr, 120 km · 1.5 hr (default), 200 km · 2.5 hr | default | paper island (`data-theme="light"`) on the stage |
| `pages/discover/empty` | as above | radius "40 km · 30 min" chosen | default | paper island |
| `pages/discover/*` lineup heading | in an `inline` field | "Sort": Closest first (default), Highest rated, Price, low to high | default, changed (page re-sorts and announces) | canvas, section head |
| `pages/bookings/*` filter | in an `inline` field | "Status": All statuses, Requested, Accepted, Confirmed (Upcoming); All statuses, Completed, Declined, Withdrawn, Expired (Past) | default, disabled while loading | canvas |
| `pages/artist/default`, `pages/artist/empty` booking stub | in a field | "Kind of gathering", "Worship night" chosen | default | stub (paper island) |
| `pages/profile-preview/*` | as the stub | "Kind of gathering" | disabled | stub |
| `pages/book/*`, `dialogs/add-church/*` | in a field with `requiredMarker` | "Kind of gathering (required)" | default, disabled while sending | form grid |
| `pages/edit-profile/*` and dialogs over it | in a field with `requiredMarker`, `help`, `required` | "Pronoun in your profile (required)": she/her, he/him, they/them; "Maximum driving distance (required)": 20 km … 200 km in 10 km steps, 120 km chosen | default, disabled while saving | form section |
| `pages/apply/*` | in a field with `requiredMarker`, `help` | "Maximum driving distance (required)" | default, disabled while submitting | form grid |
| `dialogs/add-song/*` | in a field with `requiredMarker`, `help` | "Key (required)": Any key + the 24 major and minor keys ("Key of D♭", "Key of F♯ minor") | default, disabled while saving | dialog |
| `pages/edit-profile/*` setlist editor | standalone, `label` names the song, auto width in `.setlist__controls` | "Key for Goodness of God", "Key for Way Maker", 25 options, "Key of A" chosen | default, disabled while saving | form section, setlist row |
| `dialogs/reject-application/*` | in a field with `requiredMarker`, `help`, `placeholder` | "Reason (required)": Choose a reason; References could not be confirmed; Videos don't show you leading worship; Outside the Zamaro service area; Application incomplete or inaccurate; Other | default, invalid "Choose a reason from the list.", disabled while sending | dialog |
| `pages/admin-audit/*` filters | in a field; an "all" option with an empty value | "Action": All actions, auth.sign_in … booking_hold.resolved; "Outcome": Any outcome, Succeeded, Failed, Denied | default | form grid |
| Design system only | `placeholder` with `required`; sizes sm and lg; success in a field | "Choose one"; "Small · 36px", "Large · 56px"; "Abigail leads these" | default, hover, focus, invalid, disabled | surface |

## Anatomy

1. **Box** — `select.select`: the native element. Height from the size
   (`--field-height`), square (`--radius-md`), `--border-width-thick` rule in
   `--field-border`, `--field-bg` fill, `--space-10` right padding for the
   chevron.
2. **Selected value** — the chosen option's text in `--text-body` (16 px), so
   phones do not zoom on focus.
3. **Chevron** — two `linear-gradient`s in `currentColor`, drawn by
   `.select`'s background; it greys with the text when disabled. No icon file.
4. **Options** — native `<option>`s from `options`, and the `placeholder`
   option first when set.

Host: `zm-select` is `display: block; min-width: 0` and renders exactly one
native `<select>` carrying every class and attribute. Classes a parent puts on
the host stay on the host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `options` | `readonly SelectOption[]` | `[]` | yes | One `<option>` per entry, in order. `SelectOption { value: string; label: string; disabled?: boolean }`. `value` is written to the option's `value`; `label` is its text. Values are unique; an option with `value: ''` is an ordinary option ("All statuses", "Any outcome"). |
| `placeholder` | `string` | — | no | Renders a first `<option value="" disabled>` with this text ("Choose a reason", "Choose one"). It is selected while the form value is `null` and cannot be chosen back. Use only when there is no sensible default. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.select--sm` or `.select--lg`. Medium adds no modifier. |
| `name` | `string` | — | no | Native `name`. |
| `required` | `boolean` (attribute) | `false` | no | Native `required`. Inside a field, the field's `requiredMarker` also sets it. |
| `id` | `string` | generated | no | Standalone only. Inside a field the ID is the field's `fieldId`. |
| `label` | `string` | — | standalone | Standalone only: written as `aria-label` ("Key for Goodness of God"). Ignored inside a field. Dev mode logs a console error when the select has neither a field nor `label`. |
| `describedBy` | `string` | — | no | Extra IDs appended to `aria-describedby` after the field's. |
| `invalid` | `boolean` (attribute) | `false` | no | Writes `aria-invalid="true"`, ORed with the field's `error`, so a form-level message can mark the control (as on the [text field](text-field.md), D-6). |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- Value: the select is a `ControlValueAccessor`. The form value is the chosen
  option's `value` (`string`), or `null` while the placeholder shows.
  `writeValue(null)` or a value no option has selects the placeholder; without a
  placeholder that is a consumer error, logged in dev mode, and the native
  first option shows. Disabled comes from the forms API (`setDisabledState`).
- `onTouched` runs on `blur`; the value is reported on the native `change`.
- Inside a field the select injects `FORM_FIELD`, takes `controlId`,
  `describedBy`, `invalid` and `required` from it, and registers itself with
  `length` 0 and `maxLength` `undefined` (a select has no counter).
- Copy: `placeholder`, `label` and every option `label` come from the
  translation catalogue through the consumer (L2-111); data labels (audit action
  codes) come from the API.

### Methods

| Method | Effect |
|---|---|
| `focus(): void` | Focuses the native `<select>`. The field's `focus()` and the error summary's links call it. |

### Outputs

None. The value reaches the page through the forms API
(`formControl.valueChanges`); the native `change` event also bubbles from the
host.

### Content slots

None. Options arrive through `options`, so the component owns the placeholder
option and the selected state.

## Variants and sizes

| Variant | Modifier / input | Use for |
|---|---|---|
| Default value | — | A list with a likely answer, preselected: Sunday service, 120 km, Closest first. |
| Placeholder | `placeholder` | No sensible default: "Reason (required)" in the reject dialog. |
| Standalone | `label` | A select with no visible label of its own because its row names it: the setlist key. |
| Inline sort or filter | the field's `inline` | A heading row: lineup "Sort", bookings "Status". |

| Size | Modifier | Height | Padding | Type |
|---|---|---|---|---|
| Small | `.select--sm` | `--control-height-sm` (36 px; `--target-comfortable` under a coarse pointer) | `--space-1` block, `--space-3` start, `--space-10` end | `--text-body-sm` |
| Medium | — | `--control-height-md` (44 px) | `--space-2` × `--space-3`, `--space-10` end | `--text-body` |
| Large | `.select--lg` | `--control-height-lg` (56 px) | `--space-2` × `--space-4`, `--space-10` end | `--text-body-lg` |

Medium is the default and matches buttons and text fields beside it. Small uses
14 px text, which makes iPhones zoom on focus, so it is for wide-screen
toolbars only. The width is the field's (100 %), except in the setlist row.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Surface fill, `--color-border-strong` rule, value and chevron in `--color-fg-default` | Combobox, named by the field label or `label`; the value is read |
| Placeholder | value `null` with `placeholder` | Placeholder text in `--color-fg-default`, as any value | "Choose a reason" is read as the value |
| Hover | `:hover` | Rule darkens to `--color-fg-default` | — |
| Focus | `:focus-visible` | Double ring `--shadow-focus`; outline none | — |
| Open | system | The platform list (sheet on iOS, dropdown elsewhere), in the theme's `color-scheme` | Listbox popup |
| Invalid | field `error` (or `invalid`) | Rule `--color-danger-border` and an inner start stripe `inset --border-width-thick` in `--color-danger-border`; on focus the ring replaces the stripe | `aria-invalid="true"`; error first in `aria-describedby` |
| Disabled | forms API disabled | `--color-bg-subtle` fill, `--color-fg-disabled` text, rule and chevron, `cursor: not-allowed` | Native `disabled`: out of the tab order |
| Busy form | the page disables it while sending | As disabled; the field dims to 0.6 | Removed from the tab order until the request returns |
| In a setlist row | `.setlist__controls` ancestor | `width: auto`, `min-width: 9rem` | — |

Selects have no read-only state in HTML. A read-only value is shown as text or
as a read-only [text field](text-field.md). While a form is busy (L2-108) the
page disables its selects, as every busy mock does, and keeps their values.

## Markup

Rendered in a field (the booking bar's radius):

```html
<zm-form-field class="field">
  <label class="field__label" for="find-radius">How far can they drive?</label>
  <zm-select>
    <select class="select" id="find-radius" name="radius">
      <option value="40">40 km · 30 min</option>
      <option value="80">80 km · 1 hr</option>
      <option value="120" selected>120 km · 1.5 hr</option>
      <option value="200">200 km · 2.5 hr</option>
    </select>
  </zm-select>
</zm-form-field>
```

Placeholder, required and invalid (the reject dialog):

```html
<select class="select" id="reason" name="reason" required aria-invalid="true" aria-describedby="reason-error reason-help">
  <option value="" disabled selected>Choose a reason</option>
  <option value="references">References could not be confirmed</option>
  <option value="videos">Videos don’t show you leading worship</option>
  …
</select>
```

Standalone (the setlist key), and disabled:

```html
<zm-select>
  <select class="select" id="zm-select-3" name="key-2" aria-label="Key for Goodness of God">
    <option value="any">Any key</option> … <option value="A" selected>Key of A</option> …
  </select>
</zm-select>

<select class="select" id="status" name="status" disabled>…</select>
```

Sizes add only `.select--sm` or `.select--lg`; the structure is the same.

Consumer templates:

```html
<zm-form-field fieldId="find-kind" [label]="'discover.form.kind' | transloco">
  <zm-select formControlName="kind" name="kind" [options]="kinds" />
</zm-form-field>

<zm-form-field fieldId="lineup-sort" inline [label]="'discover.lineup.sort' | transloco">
  <zm-select name="sort" [options]="sorts" [formControl]="sortControl" />
</zm-form-field>

<zm-form-field fieldId="reason" [label]="'admin.reject.reason' | transloco"
               [requiredMarker]="'common.form.required' | transloco"
               [help]="'admin.reject.reasonHelp' | transloco: { name }" [error]="errors().reason ?? null">
  <zm-select formControlName="reason" name="reason" [options]="reasons"
             [placeholder]="'admin.reject.choose' | transloco" />
</zm-form-field>

<zm-select [name]="'key-' + $index" [options]="keys" [formControl]="song.key"
           [label]="'profile.setlist.keyFor' | transloco: { title: song.title }" />
```

The `select.select` element, its modifiers and its `aria-*` attributes are a
contract: the e2e page objects find selects by role (`combobox`) and name, and
by these classes for visual parity.

## Design

- Width 100 % of the field; height `--field-height` (from the size) as a
  minimum; padding `--space-2` × `--space-3` with `--space-10` at the end for
  the chevron.
- Value `--text-body` in `--field-fg`; small `--text-body-sm`, large
  `--text-body-lg`.
- Rule `--border-width-thick` in `--field-border`; radius `--radius-md`
  (square); fill `--field-bg`.
- `appearance: none`; the chevron is two 0.36 rem gradient triangles in
  `currentColor`, about 1 rem from the end edge, centred vertically.
- Transitions on the rule colour and the ring: `--duration-fast`,
  `--ease-standard`.
- In `.setlist__controls`: `:host-context(.setlist__controls)` sets the
  select's width to `auto` with `min-width: 9rem`, so key selects sit in the
  row beside the reorder buttons.

Component tokens declared on `.select` (shared with the text field and
textarea):

| Token | Aliases | Overridden by |
|---|---|---|
| `--field-bg` | `--color-bg-surface` | disabled (`--color-bg-subtle`), surfaces |
| `--field-fg` | `--color-fg-default` | disabled (`--color-fg-disabled`) |
| `--field-border` | `--color-border-strong` | hover (`--color-fg-default`), invalid (`--color-danger-border`), disabled (`--color-fg-disabled`) |
| `--field-height` | `--control-height-md` | sizes, coarse pointer (small) |

A surface that needs a quieter select overrides these tokens, never the rules.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Value and chevron | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Invalid rule and stripe | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Disabled fill | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Disabled text, rule, chevron | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |
| Focus ring, inner / outer | `--color-focus-ring-offset` / `--color-focus-ring` | `--palette-signal-500` / `--palette-ink-750` | `--palette-ink-900` / `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Value on the field |
| `--color-fg-default` | `--color-bg-surface` | 3:1 | Chevron (a graphical object) |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Rule on a card |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Rule on the page (lineup sort) |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring, outer |

The open list follows `color-scheme` (light on `:root` and `[data-theme="light"]`,
dark on `[data-theme="dark"]`), so it is dark in the dark theme and light inside
the booking bar's and stub's paper islands. Disabled text is exempt from the
contrast minimum (WCAG 1.4.3); disabled also changes the fill and the cursor.
Under forced colours the select returns to `appearance: auto`, so the system
draws its own arrow and edge, and the ring uses `Highlight` through
`--color-focus-ring`. Invalid never relies on colour alone: the field's error
text and the stripe carry it.

## Responsive behaviour

- Full width of its field at every breakpoint. In the booking bar it pairs with
  its neighbour from SM (576 px) and stacks below; the layout decides.
- The longest option decides nothing about the width. A value wider than the
  box is clipped by the browser at the chevron, so options stay under about 24
  characters ("Funeral or memorial", "120 km · 1.5 hr", "Key of F♯ minor") to
  fit at 320 px. The longest product option, "Videos don't show you leading
  worship" (37 characters), sits in a dialog wide enough at 360 px; at 320 px it
  is the one value allowed to clip, and the full text is still read and shown in
  the open list (D-6).
- The inline sort keeps the field's 12 rem minimum and wraps under the heading
  on phones.
- In the setlist editor the key select is auto width with a 9 rem minimum and
  wraps with the reorder buttons below MD.
- Under a coarse pointer the small size grows to `--target-comfortable`; medium
  and large already reach 44 px. On phones the open list is the system picker.
- At 320 px nothing scrolls horizontally; at 200 % zoom the select grows with
  its text and stays usable.

## Accessibility

### Role and pattern

A native `<select>` (a combobox with a listbox popup in the accessibility tree).
No custom listbox: one would have to follow the
[APG Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) and
would still lose the phone picker, type-ahead and autofill.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to and from the select. Disabled selects are skipped. |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Changes the value (Windows) or opens the list (macOS). |
| <kbd>Alt</kbd>+<kbd>↓</kbd> / <kbd>Space</kbd> | Opens the list. |
| A letter | Jumps to the next option starting with it ("W" → Worship night, Wedding). |
| <kbd>Enter</kbd> / <kbd>Esc</kbd> | Chooses / closes without changing. |

The component adds no key handling; it never submits or navigates on change.

### Focus

The double ring (`--shadow-focus`) hugs the box on `:focus-visible`, the same
as text fields, so a card never clips it. Focus stays on the select after a
change; the lineup's re-sort does not move it.

### Labelling

- Inside a field the name is the field's visible label, markers included:
  "Reason (required)". Standalone, the name is `label`: "Key for Goodness of
  God", which names the row's object.
- Option text is what is announced, so options stand alone: "120 km · 1.5 hr",
  never "1.5". The placeholder option is a value, not a label.
- `aria-describedby` comes from the field (error, help, counter order), then
  `describedBy`.
- `aria-invalid="true"` while the field has an error; removed with it (L2-102).

### Announcements

None from the select. A result of a change is announced by the page's
`role="status"` region ("Sorted by highest rated").

### Motion

Only the rule colour and the ring fade, over `--duration-fast`. Under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero and the
change is instant. The open list animates as the platform does.

## Content and internationalisation

- Options in sentence case, short and parallel: "Sunday service", "Worship
  night", "Youth event".
- Order by how often they are picked, or by size for ranges: 40, 80, 120, 200
  km; 20 to 200 km in 10 km steps.
- Add the detail a coordinator needs after a middle dot: "120 km · 1.5 hr".
- Default to the most likely option (Sunday service, 120 km, Closest first).
  Use a placeholder ("Choose a reason") only when guessing would be wrong.
- Filters lead with the "all" option: "All statuses", "All actions", "Any
  outcome".
- Distances use "km" (L2-110), formatted by the page; key names use the musical
  signs ("D♭", "F♯").
- Translatable inputs: `placeholder`, `label`, every option `label`. Data
  values: audit action codes, which stay as the API sends them. French options
  run about 30 % longer; keep them under 24 characters where possible.

## Performance

- Change detection: `OnPush`, signal inputs; the classes, the ID and
  `aria-describedby` are `computed`s. Options render with `@for` tracked by
  `value`. No `effect`, no subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Select.ts`
  renders the booking bar's "How far can they drive?" select in a
  `zm-form-field`, four options with "120 km · 1.5 hr" chosen. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios that include it: `BookingForm` (kind and radius) and
  `Setlist` once the editable setlist renders key selects.
- Layout stability: the select's height is fixed by `--field-height`; choosing a
  value never changes its size (L2-086).
- Imports only Angular core and `@angular/forms` (`NG_VALUE_ACCESSOR`).

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-select>` with the six kinds inside the "Kind of gathering" field, when it renders, then the host contains exactly one `select.select#find-kind` with six options in the order Sunday service, Worship night, Youth event, Conference or retreat, Wedding, Funeral or memorial, and its accessible name is "Kind of gathering". (L2-004)
- **AC-2** Given the radius select with the form value `'120'`, when it renders, then "120 km · 1.5 hr" is selected and each option's text is the full "distance · time" label. (L2-004)
- **AC-3** Given the reject dialog's select with `placeholder="Choose a reason"` and a `null` value, when it renders, then the first option is `<option value="" disabled>` "Choose a reason", it is selected, and the form value stays `null`. (L2-048)
- **AC-4** Given the reject dialog after a reason is chosen, when the person opens the list again, then "Choose a reason" cannot be chosen. (L2-048)
- **AC-5** Given each size (sm, md, lg), when it renders, then the select carries `.select` plus exactly `.select--sm`, no modifier or `.select--lg`, and is 36, 44 or 56 px tall. (L2-096)
- **AC-6** Given the add-song dialog's "Key (required)" select, when it renders, then it lists "Any key" followed by the 24 major and minor keys and has the native `required` attribute. (L2-053)
- **AC-7** Given the setlist editor, when the key select for "Goodness of God" renders without a field, then its accessible name is "Key for Goodness of God", it has no visible label, and it is auto width with at least 9 rem in `.setlist__controls`. (L2-053)
- **AC-8** Given the edit-profile "Maximum driving distance (required)" select, when it renders, then it offers 20 km to 200 km in 10 km steps with "120 km" selected. (L2-050)

### States

- **AC-9** Given the lineup sort on "Closest first", when "Highest rated" is chosen, then the form value becomes the Highest rated value once, the page is not navigated or submitted, and focus stays on the select. (L2-007)
- **AC-10** Given the reject dialog submitted with no reason, when the field's `error` is "Choose a reason from the list.", then the select has `aria-invalid="true"`, `aria-describedby` starting with `reason-error`, and a `--color-danger-border` rule with an inner stripe. (L2-102)
- **AC-11** Given the bookings "Status" filter while the list is loading, when the page disables the control, then the select has the native `disabled` attribute, a `--color-bg-subtle` fill and `--color-fg-disabled` text and chevron, and Tab skips it. (L2-108)
- **AC-12** Given the booking request form while it is sending, when the page disables "Kind of gathering (required)" and the request fails, then the select is enabled again with "Worship night" still selected. (L2-108)
- **AC-13** Given the stub's "Kind of gathering" select on the profile preview, when it renders disabled, then its value "Sunday service" stays readable and the chevron greys with the text. (L2-019)

### Keyboard and focus

- **AC-14** Given focus moves to the select with the keyboard, when it receives focus, then the double ring `--shadow-focus` is drawn around the box and is not clipped by the card or dialog. (L2-101)
- **AC-15** Given the focused "Kind of gathering" select, when "W" is typed, then "Worship night" is selected, and pressing "W" again selects "Wedding". (L2-101)
- **AC-16** Given the field's `focus()` called from the error summary link "Choose a reason from the list.", when it runs, then focus moves to `#reason`. (L2-101)

### Screen readers

- **AC-17** Given the radius select, when a screen reader reads it, then it is announced as a combobox named "How far can they drive?" with the value "120 km · 1.5 hr". (L2-102)
- **AC-18** Given a page with selects in every state (default, placeholder, hover, focus, invalid, disabled, standalone) in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme, when a select on a card renders, then its fill is `--color-bg-surface` charcoal, its value and chevron `--color-fg-default`, its rule `--color-border-strong`, and the open list uses the dark `color-scheme`. (L2-104)
- **AC-20** Given the dark theme, when the booking bar's selects render inside its `data-theme="light"` island, then they use the light values and the open list is light. (L2-104)
- **AC-21** Given both themes, when contrast is measured, then the value is at least 4.5:1 and the chevron, rule, invalid rule and focus ring at least 3:1 against the field or the page. (L2-103)

### Responsive

- **AC-22** Given a coarse pointer, when a small select is measured, then it is at least 44 px tall. (L2-096)
- **AC-23** Given a 320 px viewport, when the booking bar and the setlist editor render, then no select causes horizontal scrolling, and "Funeral or memorial", "120 km · 1.5 hr" and "Key of F♯ minor" show in full. (L2-096)
- **AC-24** Given the French catalogue, when the kinds and the placeholder are replaced by their translations, then the select shows them with no code change. (L2-111)

### Motion

- **AC-25** Given `prefers-reduced-motion: reduce`, when the select is hovered or focused, then the rule colour and ring change without a transition. (L2-103)

### Performance

- **AC-26** Given the `Select` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

No `zm-select` exists. Today the select is a branch of the monolithic
`zm-form-field` (`type="select"`, `options: FieldOption[]`), which renders the
`<select class="select">`, its styles and the value accessor. To meet this CRD:

- Create `frontend/projects/components/src/lib/select/select.ts` (class
  `Select`, selector `zm-select`), with its template and `select.scss`, and
  export it and `SelectOption` from `public-api.ts`.
- Move the select markup, the `.select` styles (chevron, sizes, states) and the
  accessor out of `form-field/`. Rename `FieldOption` to `SelectOption` and add
  `disabled?`.
- Implement `ControlValueAccessor` with `string | null`; render `placeholder`
  as a disabled first option; track options by `value`.
- Inject `FORM_FIELD` (optional) and register with `length` 0 and `maxLength`
  `undefined`; take the ID, `aria-describedby`, `aria-invalid` and `required`
  from it. Standalone, write `label` to `aria-label` and log a dev-mode error
  when both are missing.
- Add the sizes, the coarse-pointer rule for small, the invalid stripe with the
  focus-ring override, the disabled rule, `:host-context(.setlist__controls)`
  and the forced-colours `appearance: auto` rule.
- Migrate `pages/discover/search-form` (kind, radius) and
  `pages/discover/lineup` (sort, `inline` field) in the field's slice.
- Add `frontend/projects/perf-test/src/scenarios/Select.ts`, export it from
  `scenarios/index.ts`, and tune its iterations. Update `BookingForm.ts` to the
  composed controls without lowering its iterations.

## Decisions

- **D-1** *Options as an input, or projected `<option>` children?* An input. The component owns the placeholder option and the selected state, which projected options would split across the consumer; every usage builds its list from data or the catalogue anyway.
- **D-2** *Does the placeholder stay choosable?* No. The design system renders it `disabled` so it cannot be chosen back. The reject-application mock leaves "Choose a reason" enabled; the design-system rule wins because choosing it back would turn a valid answer into an empty one with no message.
- **D-3** *How is an "All statuses" filter option different from a placeholder?* It is an ordinary option whose value may be `''`. Only `null` maps to the placeholder, so a filter can mean "no filter" with a real, choosable option, as the bookings and audit filters do.
- **D-4** *Optgroups?* None. No mock or specimen groups options; the longest list (25 keys) reads in order, and type-ahead covers it. Adding them later would be an additive change to `SelectOption`.
- **D-5** *Who sizes the setlist key select?* The select, through `:host-context(.setlist__controls)`, matching the `components.css` rule. The page never reaches into the select's styles.
- **D-6** *What happens to an option wider than the box at 320 px?* The browser clips it at the chevron; nothing wraps in a native select. Options are written under about 24 characters. The 37-character admin reason is accepted because it sits in a dialog, is read in full by screen readers and shows in full in the open list.
- **D-7** *How does the chevron survive forced colours?* The select returns to `appearance: auto`, so the system draws its own arrow and border. The CSS gradients would otherwise be the only arrow and could be dropped by a high-contrast theme.
- **D-8** *Read-only selects?* None, as in HTML and the design system. A busy form disables its selects (as the mocks do); a value that cannot change is shown as text or a read-only [text field](text-field.md).
