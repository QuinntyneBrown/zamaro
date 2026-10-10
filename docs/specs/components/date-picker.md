# Date picker

| Field | Value |
|---|---|
| Selector | `zm-date-picker` |
| Library path | `frontend/projects/components/src/lib/date-picker/` |
| Status | planned |
| Traces to | L2-004, L2-019, L2-028, L2-049, L2-056, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-110, L2-111 |
| Design system | [`date-picker.html`](../../design-system/components/date-picker.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/book/invalid`](../../mocks/pages/book/invalid.html), [`dialogs/block-dates/invalid`](../../mocks/dialogs/block-dates/invalid.html), [`dialogs/upload-check/invalid`](../../mocks/dialogs/upload-check/invalid.html), [`pages/admin-audit/default`](../../mocks/pages/admin-audit/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html) |
| Rendering | [`date-picker.html`](date-picker.html) |

## Purpose and scope

The event date is the first thing a coordinator decides and the first field in
every booking form. The date picker takes one calendar day: the browser's own
`<input type="date">` in the field look, limited to the dates a church can
book, with up to four quick-pick dates beside it ("This Sunday · 11 Oct", "Sat 14
Nov", "Christmas Eve"). Its value is always an ISO date (`2026-11-14`), whatever
the browser shows.

It is a field control: it sits inside a [form field](form-field.md), which
gives it its label, help, error and the "Abigail is free Sat 14 Nov" message.

Use something else when:

- the artist marks many days on a month grid, or the page shows which days are
  free → [calendar](calendar.md);
- a time of day is needed ("Service start time") → [text field](text-field.md)
  with `type="time"`;
- the artist's next dates are listed read-only → [tour dates](tour-dates.md).

Out of scope:

- Deciding which dates are allowed. The page passes `min` and `max` (today + 3
  days and today + 18 months for a booking, L2-004; today and 18 months for a
  blocked range, L2-056; no later than today for a check's issue date, L2-049),
  computed with the API library's calendar-date helpers in `America/Toronto`.
- Validation and its copy: an empty required date, a date before `min` typed by
  hand, an end before a start. The page validates and passes the message to the
  field's `error`.
- Availability: whether Abigail is free on the chosen date, the success or
  booked message, and the "Abigail's next 3 free dates" list. The page checks
  and passes them to the [form field](form-field.md) (`success`, `error`,
  `[slot=after]`).
- Date ranges. A retreat or a blocked range is two date pickers ("First day",
  "Last day"; "Start date", "End date") side by side in a form row; the page
  sets the second's `min` from the first's value.
- Formatting the date in words. The page formats "Sat 14 Nov" with the API
  library's format service for the messages and the preset labels (L2-110).

## Usage

The mocks render about 65 date inputs, every one `input.input[type="date"]`
with `min`, `max` or both; none uses a custom calendar. Quick-pick presets are
in the design system only ("part of the core set"), drawn from the empty
state's nearby dates.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/*` booking bar (and every dialog and toast mock over Discover) | `min="2026-10-12"`, `max="2028-04-09"`, in a bare field | "Event date", value `2026-11-14`, empty for a guest | default, empty, invalid "Pick your event date."; L2-004 "Pick a date at least 3 days away.", "We take bookings up to 18 months ahead." | paper island on the stage |
| `pages/artist/default`, `pages/artist/empty` booking stub | same window; field with `success`/`error`, `live` | "Event date" + "Abigail is free Sat 14 Nov" / "Abigail is booked Sun 15 Nov. Try another date."; empty for Miriam Haile (no search date carried) | default, success, invalid, empty | stub (paper island) |
| `pages/profile-preview/*` | same window, disabled | "Event date", empty | disabled | stub |
| `pages/book/*`, `dialogs/add-church/*` over it | same window, `required`, field `full` + help | "Event date (required)" | default, invalid "Abigail was just booked for Sat 14 Nov. Pick one of her next free dates." with the `.date-swap` list after it; readonly while sending | form grid |
| `dialogs/block-dates/*` | `min="2026-10-09"`, `max="2028-04-09"`, `required`, two in a form grid | "Start date (required)" `2026-11-27`, "End date (required)" | default, invalid "Choose Fri 27 Nov or later.", readonly while saving | dialog |
| `dialogs/upload-check/*` | `max="2026-10-09"` only, `required`, wrapping field with help | "Issue date (required)" + "The date printed on the check. It counts for 3 years from this date." | default, invalid "Enter the issue date printed on the check.", readonly while uploading | dialog |
| `pages/admin-audit/*` filters | `min="2024-10-09"`, `max="2026-10-09"` | "From" `2026-10-01`, "To" | default | form grid |
| `pages/saved/*` page head | booking window, beside a "Check date" primary button in a cluster | "Who's free on" `2026-11-14` | default | canvas |
| Design system, quick picks | `presets` + `presetsLabel` | "This Sunday · 11 Oct", "Sat 14 Nov" (pressed), "Christmas Eve"; group "Quick dates for Event date" | pressed, unpressed | surface |
| Design system, retreat | two pickers in a `.form__row` | "First day" `2027-03-05`, "Last day" `2027-03-07` with `min="2027-03-05"` | default | surface |
| Design system, sizes | `size` sm, md, lg | `2026-11-14` | default | surface |

## Anatomy

1. **Host** — `zm-date-picker`: a column (`display: flex`, `--space-2` gap,
   `min-width: 0`) holding the input and, when set, the presets.
2. **Box** — `input.input[type="date"]`: the field look of a
   [text field](text-field.md) — `--field-height`, square, 2 px charcoal rule,
   surface fill, full width.
3. **Date segments** — day, month and year in the browser's order and format,
   with tabular figures so the width does not jump. Drawn by the browser.
4. **Calendar button** — drawn by the browser; opens the system calendar. On
   phones the whole box opens the system picker.
5. **Presets (optional)** — `div.cluster[role="group"]` after the input,
   labelled by `presetsLabel`, holding one small [chip](chip.md) per preset;
   the chip matching the value is pressed.

The label, help, error and the availability message belong to the
[form field](form-field.md) around it.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `min` | `string` (ISO `YYYY-MM-DD`) | — | no | Native `min`. The browser greys earlier days in its calendar. |
| `max` | `string` (ISO) | — | no | Native `max`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.input--sm` or `.input--lg`. Small is for wide-screen toolbars only. |
| `readonly` | `boolean` (attribute) | `false` | no | Native `readonly`; the box stays focusable and the presets are disabled. |
| `required` | `boolean` (attribute) | `false` | no | Native `required`. Also set when the field has a `requiredMarker`. |
| `name` | `string` | — | no | Native `name` (`date`, `block-start`, `issued-on`). |
| `presets` | `readonly DatePreset[]` | `[]` | no | `DatePreset { value: string /* ISO */; label: string }`. At most four; one chip each, in order. |
| `presetsLabel` | `string` | — | with `presets` | The group's `aria-label`: "Quick dates for Event date". In dev mode, presets without it log a console error. |
| `id` | `string` | — | standalone only | Native `id`. Inside a form field the field's `fieldId` wins. |
| `label` | `string` | — | standalone only | Written as `aria-label` when there is no form field. Dev mode logs a console error when there is neither. |
| `describedBy` | `string` | — | no | Extra IDs appended after the field's `aria-describedby`. |
| `invalid` | `boolean` (attribute) | `false` | no | Writes `aria-invalid="true"`, ORed with the field's `error`, so a form-level message can mark the control (as on the [text field](text-field.md), D-6). |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- The date picker implements `ControlValueAccessor`. The value is the ISO
  string (`'2026-11-14'`) or `null` when empty or incomplete; `writeValue(null)`
  empties the box. `onChange` fires on the native `input` event; `onTouched` on
  `blur` of the box and on a preset press.
- Disabled comes from the forms API (`setDisabledState`); it disables the box
  and every preset chip.
- It implements the field's `FieldControl` (`length` is always 0, `maxLength`
  undefined, `focus()`), registers with `FORM_FIELD`, and takes `id`,
  `aria-describedby`, `aria-invalid` and `required` from it.
- Copy: `presetsLabel`, `label` and every `DatePreset.label` come from the
  catalogue through the consumer (L2-111); the preset labels are formatted by
  the page with the format service ("Sat 14 Nov").

### Methods

| Method | Effect |
|---|---|
| `focus(): void` | Focuses the box (its first segment). The field's `focus()` and the error summary call it. |

### Outputs

None. The chosen date reaches the page through the forms API (`valueChanges`).

### Content slots

None. The presets are data (`presets`), so their pressed state can follow the
value.

## Variants and sizes

| Variant | Modifier / input | Use for |
|---|---|---|
| Event date | — | The booking bar, the stub, the request form. |
| With an availability message | the field's `success` / `error` | The stub, where the artist is known. |
| With quick picks | `presets` | A few likely dates under the field, one tap each. |
| Two dates | two pickers, the page linking `min` | A retreat ("First day", "Last day"), a blocked range. |

| Size | Modifier | Height | Text |
|---|---|---|---|
| Small | `.input--sm` | `--control-height-sm` (`--target-comfortable` under a coarse pointer) | `--text-body-sm` |
| Medium | — | `--control-height-md` | `--text-body` |
| Large | `.input--lg` | `--control-height-lg` | `--text-body-lg` |

Medium everywhere in the booking flow; large only for a date alone on a screen.
The width is always the field's.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default, with value | value set | Date in the browser's format, tabular figures | Spin-button segments with the value announced |
| Empty | value `null` | The browser's segment placeholders ("yyyy-mm-dd" or "mm/dd/yyyy") in `--field-fg` | Each segment "blank" |
| Hover | `:hover` | Rule `--color-fg-default` | — |
| Focus | `:focus-visible` | Double ring `--shadow-focus` around the box; the browser highlights the active segment | — |
| Invalid | field `error` or `invalid` | Rule `--color-danger-border` with an inner left stripe; on focus the ring replaces the stripe | `aria-invalid="true"`, error first in `aria-describedby` |
| Read-only | `readonly` | `--color-bg-surface-sunken` fill, dashed rule; presets disabled | Focusable, value read, not editable |
| Disabled | forms API | `--color-bg-subtle` fill, `--color-fg-disabled` text and rule, `not-allowed`; presets disabled | Out of the tab order |
| Open | browser calendar | The system calendar, which follows `color-scheme` (light on newsprint, dark on the stage theme) | The browser's own |
| Preset pressed | value equals a preset's `value` | That chip inverse with a tick | `aria-pressed="true"` |
| Preset unpressed | otherwise | Chip outline | `aria-pressed="false"` |

While the form is busy (L2-108) the page sets `readonly`, as the busy mocks do,
so the date and focus are kept.

## Markup

Rendered, the booking bar's event date:

```html
<zm-date-picker>
  <input class="input" type="date" id="find-date" name="date" min="2026-10-12" max="2028-04-09" value="2026-11-14">
</zm-date-picker>
```

Invalid, inside its field (the error comes from the field):

```html
<zm-form-field class="field">
  <label class="field__label" for="block-end">End date <span class="field__required">(required)</span></label>
  <zm-date-picker>
    <input class="input" type="date" id="block-end" name="block-end" min="2026-10-09" max="2028-04-09" required
           value="2026-11-26" aria-invalid="true" aria-describedby="block-end-error">
  </zm-date-picker>
  <span class="field__error" id="block-end-error">Choose Fri 27 Nov or later.</span>
</zm-form-field>
```

With presets:

```html
<zm-date-picker>
  <input class="input" type="date" id="dp-preset" name="date" min="2026-10-09" value="2026-11-14">
  <div class="cluster" role="group" aria-label="Quick dates for Event date">
    <zm-chip size="sm"><button class="chip chip--sm" type="button" aria-pressed="false">This Sunday · 11 Oct</button></zm-chip>
    <zm-chip size="sm"><button class="chip chip--sm" type="button" aria-pressed="true">Sat 14 Nov</button></zm-chip>
    <zm-chip size="sm"><button class="chip chip--sm" type="button" aria-pressed="false">Christmas Eve</button></zm-chip>
  </div>
</zm-date-picker>
```

Read-only and disabled add the native `readonly` or `disabled` attribute to the
input (and `disabled` to every chip's button); sizes add `.input--sm` or
`.input--lg`. Standalone, without a field, the input carries `aria-label`.

Consumer templates:

```html
<zm-form-field fieldId="find-date" [label]="'discover.form.date' | transloco" [error]="errors().date ?? null">
  <zm-date-picker formControlName="date" name="date" [min]="earliest" [max]="latest" />
</zm-form-field>

<zm-form-field fieldId="dp-preset" [label]="'booking.form.date' | transloco">
  <zm-date-picker formControlName="date" name="date" [min]="today"
                  [presets]="quickDates()"
                  [presetsLabel]="'booking.form.quickDates' | transloco: { field: ('booking.form.date' | transloco) }" />
</zm-form-field>
```

The input's classes and attributes, and the group's `role` and `aria-label`, are
a contract for the page objects. The chips' internals belong to the
[chip](chip.md).

## Design

- The box is a `.input`: height `--field-height` (from the size), padding
  `--space-2` × `--space-3` (large `--space-4` sides), `--text-body` (sm
  `--text-body-sm`, lg `--text-body-lg`), rule `--border-width-thick` in
  `--field-border`, radius `--radius-md`, fill `--field-bg`, text `--field-fg`,
  `font-variant-numeric: tabular-nums`.
- Hover sets `--field-border` to `--color-fg-default`. Focus replaces the
  outline with `--shadow-focus`. Invalid sets `--field-border` to
  `--color-danger-border` and adds an inset `--border-width-thick` stripe on the
  left. Read-only sets `--field-bg` to `--color-bg-surface-sunken` and a dashed
  rule. Disabled sets `--field-bg` `--color-bg-subtle`, `--field-fg` and
  `--field-border` `--color-fg-disabled`.
- Rule and ring transitions take `--duration-fast` with `--ease-standard`.
- Presets: a `.cluster` (wrapping row, `--space-2` gap) `--space-2` below the
  box; chips at `--control-height-sm`.
- The calendar button and popup are the browser's; `color-scheme` from the
  token sheet themes them.

Component tokens (shared with the text field, declared on `.input`):

| Token | Aliases | Overridden by |
|---|---|---|
| `--field-bg` | `--color-bg-surface` | read-only, disabled, surfaces |
| `--field-fg` | `--color-fg-default` | disabled |
| `--field-border` | `--color-border-strong` | hover, invalid, disabled |
| `--field-height` | `--control-height-md` | sizes, coarse pointer (small) |

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Date text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Invalid rule | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Read-only fill | `--color-bg-surface-sunken` | `--palette-paper-warm` | `--palette-ink-950` |
| Disabled fill / text | `--color-bg-subtle` / `--color-fg-disabled` | `--palette-ink-100` / `--palette-ink-400` | `--palette-ink-700` / `--palette-ink-600` |
| Focus ring, inner / outer | `--color-focus-ring-offset` / `--color-focus-ring` | `--palette-signal-500` / `--palette-ink-750` | `--palette-ink-900` / `--palette-signal-500` |
| Pressed preset | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Date on the box |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Rule on a card |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Rule on the page |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Pressed preset label |

The booking bar and stub are `data-theme="light"` islands, so their date stays
paper in both themes. Under forced colours the rule is `CanvasText` and the
ring `Highlight` (tokens). Free or booked is never shown by colouring the box:
the field says it in words.

## Responsive behaviour

- Full width of its field at every breakpoint. In the booking bar it stacks
  above "Kind of gathering" below SM (576 px) and pairs with it from SM.
- On phones, tapping anywhere in the box opens the system picker; the calendar
  button is a desktop affordance.
- Presets wrap onto a second line rather than scrolling sideways; "This Sunday ·
  11 Oct" fits a 296 px column on one line.
- Two pickers sit side by side from MD (768 px) in a `.form__row`, or from SM in
  a `.form-grid`, and stack below.
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom the box grows
  and stays usable. The box is 44 px tall; small chips grow to 44 px under a
  coarse pointer (L2-096).

## Accessibility

### Role and pattern

Native `<input type="date">`; the browser exposes each segment as a spin
button. No custom grid, so there is no APG Date Picker Dialog to imitate; if one
is ever needed it lives in the [calendar](calendar.md). Presets are toggle
buttons ([chip](chip.md)) in a labelled `role="group"`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Into the box (first segment) and out; in some browsers between segments; then to each preset chip. Disabled boxes and chips are skipped; read-only boxes are not. |
| <kbd>←</kbd> / <kbd>→</kbd> | Between day, month and year. |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Changes the focused segment. |
| Digits | Type the segment. |
| <kbd>Alt</kbd>+<kbd>↓</kbd> or <kbd>Space</kbd> | Opens the browser calendar (Chrome, Edge). |
| <kbd>Enter</kbd> | Submits the surrounding form (native). |
| <kbd>Enter</kbd> / <kbd>Space</kbd> on a preset | Fills the date; focus stays on the chip. |

### Focus

The double ring around the whole box; the browser highlights the active
segment inside it. A preset press never moves focus into the box, so keyboard
users can try several dates quickly. `focus()` lands on the first segment.

### Labelling

The name is the field's visible label ("Event date (required)"); the
description is the field's error, then help or success. The preset group is
named by `presetsLabel` and each chip's text is a full date ("Sat 14 Nov"), not
"Next". Standalone, `label` becomes `aria-label`.

### Announcements

The date picker announces nothing itself. The availability result is
announced by the field's live region (`live`); a preset press is announced by
the chip's pressed state.

### Motion

Only the rule colour and ring fade over `--duration-fast`; under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero. The
system calendar animates as the platform does.

## Content and internationalisation

- Labels: "Event date"; "Start date" and "End date"; "First day" and "Last
  day"; "Issue date"; "From" and "To"; "Who's free on".
- Inside the box the browser shows the date in the person's locale; Zamaro does
  not control it. Outside it, dates are Zamaro's: "Sat 14 Nov", with the year
  only outside the current year ("Fri 5 Mar 2027", L2-110), formatted by the
  page with the format service.
- Preset labels name the day plainly: "This Sunday · 11 Oct", "Sat 14 Nov",
  "Christmas Eve". Three or four at most.
- Errors give the way out: "Pick a date at least 3 days away.", "We take
  bookings up to 18 months ahead.", "Choose Fri 27 Nov or later."
- Translatable inputs: `presetsLabel`, `label`, each `DatePreset.label`. Data
  values: `min`, `max`, the value. French preset labels run longer and wrap.

## Performance

- Change detection: `OnPush`, signal inputs; the classes and each preset's
  pressed state are `computed`s. No `effect`, no subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/DatePicker.ts`
  renders the stub's "Event date" for Abigail Mensah inside its form field —
  `min="2026-10-12"`, `max="2028-04-09"`, value `2026-11-14`, success "Abigail
  is free Sat 14 Nov" — plus the three design-system presets. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: `BookingForm` (the booking bar's event date).
- Layout stability: the box's height is fixed by `--field-height`; presets
  render with the box on first paint, never after load (L2-086).
- Imports Angular core and forms and `zm-chip`; no date library and no
  calendar code.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-date-picker>` in the "Event date" field with `min="2026-10-12"` and `max="2028-04-09"`, when it renders, then the host contains one `input.input[type="date"]#find-date` with those `min` and `max` attributes and the accessible name "Event date". (L2-004)
- **AC-2** Given the form control holds `'2026-11-14'`, when it renders, then the input's value is `2026-11-14`; and when a person picks 24 December 2026, then the control's value becomes `'2026-12-24'` whatever the browser's display format. (L2-110)
- **AC-3** Given a guest's empty booking bar, when it renders with the value `null`, then the input is empty; and when the person clears a typed date, then the value is `null`, not `''`. (L2-004)
- **AC-4** Given each size, when it renders, then small adds `.input--sm` at `--control-height-sm`, medium adds no modifier at `--control-height-md`, and large adds `.input--lg` at `--control-height-lg`. (L2-096)
- **AC-5** Given `presets` "This Sunday · 11 Oct" (`2026-10-11`), "Sat 14 Nov" (`2026-11-14`) and "Christmas Eve" (`2026-12-24`) with `presetsLabel="Quick dates for Event date"`, when the value is `2026-11-14`, then a `role="group"` named "Quick dates for Event date" follows the input with three small chips, only "Sat 14 Nov" with `aria-pressed="true"`. (L2-100)

### States

- **AC-6** Given the booking bar submitted with an empty date, when the field's `error` is "Pick your event date.", then the input has `aria-invalid="true"`, `aria-describedby="find-date-error"`, and the `--color-danger-border` rule with the inner stripe. (L2-102)
- **AC-7** Given the stub's date in its field with `live`, when Naomi picks Sun 15 Nov and the page sets the field's `error` to "Abigail is booked Sun 15 Nov. Try another date.", then the input is invalid and the message is linked by `aria-describedby`; when she picks Sat 14 Nov and the page sets `success` "Abigail is free Sat 14 Nov", then the input is no longer invalid. (L2-019)
- **AC-8** Given the block-dates dialog while "Save" is pending, when the page sets `readonly` on "Start date" and "End date", then both inputs have `readonly`, the sunken fill and dashed rule, stay focusable and keep `2026-11-27` and `2026-11-26`. (L2-108)
- **AC-9** Given `pages/profile-preview`, when the form control is disabled, then the input has the native `disabled` attribute, `--color-bg-subtle` fill and `--color-fg-disabled` text, Tab skips it, and every preset chip is disabled. (L2-100)
- **AC-10** Given the "End date (required)" field after "Choose Fri 27 Nov or later.", when the person picks Fri 27 Nov, then the page clears the error and the input loses `aria-invalid`. (L2-056)
- **AC-11** Given the request form's "Event date (required)" after the server returns "Abigail was just booked for Sat 14 Nov.", when the field shows the error and the `.date-swap` list after it, then the date picker keeps `2026-11-14`, is invalid, and the list follows the error, not the input. (L2-028)
- **AC-12** Given the upload-check "Issue date (required)" with `max="2026-10-09"` and no `min`, when it renders, then the input has `max="2026-10-09"`, no `min` attribute, and `required`. (L2-049)

### Keyboard and focus

- **AC-13** Given focus on the "Sat 14 Nov" preset with the value `2026-10-11`, when Enter or Space is pressed, then the value becomes `2026-11-14`, the control is marked touched, "Sat 14 Nov" is pressed and "This Sunday · 11 Oct" is not, and focus stays on the chip. (L2-101)
- **AC-14** Given the date picker gains keyboard focus, when it is focused, then the double ring (`--shadow-focus`) surrounds the whole box and is not clipped by the field, the stub or a dialog body. (L2-101)
- **AC-15** Given the error summary link "Pick your event date.", when it calls the field's `focus()`, then focus lands on the date input. (L2-004)
- **AC-16** Given the box, when Tab moves through the field, then the box is one stop (or its segments, per browser) followed by one stop per enabled preset chip. (L2-101)

### Screen readers

- **AC-17** Given a date picker with neither a form field nor `label`, when it renders in dev mode, then a console error names `zm-date-picker`; and given `label="Event date"` standalone, then the input has `aria-label="Event date"`. (L2-100)
- **AC-18** Given a page with date pickers in every state (value, empty, invalid, read-only, disabled, presets) in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme on a card, when a date picker renders, then the box is `--color-bg-surface` charcoal with a `--color-border-strong` rule and `--color-fg-default` text, the text at least 4.5:1 and the rule and focus ring at least 3:1 against their backgrounds. (L2-103)
- **AC-20** Given the dark theme, when the booking bar's date renders inside the `data-theme="light"` island, then it uses the light fill, rule and text, and its system calendar opens light. (L2-104)

### Responsive

- **AC-21** Given a 320 px viewport, when the booking bar renders the date with three presets, then the box fills the field, the chips wrap, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-22** Given a coarse pointer, when the box and the small preset chips are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-23** Given the French catalogue, when the preset labels and `presetsLabel` are replaced by translations about 30 % longer, then they render with no code change and the chips wrap rather than clip. (L2-111)

### Motion

- **AC-24** Given `prefers-reduced-motion: reduce`, when the date picker is hovered, focused or becomes invalid, then the rule and ring change without a transition. (L2-103)

### Performance

- **AC-25** Given the `DatePicker` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. Today the date input is a branch of the monolithic `zm-form-field`
(`type="date"` with `min` and `max`, consumed by `pages/discover/search-form`).
To build this CRD:

- Create `frontend/projects/components/src/lib/date-picker/date-picker.ts`
  (class `DatePicker`, selector `zm-date-picker`), `.html` and `.scss`; export
  it and `DatePreset` from `public-api.ts`.
- Implement `ControlValueAccessor` (`NG_VALUE_ACCESSOR`) and the field's
  `FieldControl`; inject `FORM_FIELD` optionally and register.
- Move the `.input` and `.input[type="date"]` rules for the date box out of
  `form-field.scss` into `date-picker.scss` (the text field has its own copy of
  the `.input` rules; both read the shared `--field-*` tokens).
- Render presets with `zm-chip` (`size="sm"`, `[pressed]`, `[disabled]`,
  `(click)`); no new chip API is needed.
- Migrate the discover search form's date in the same slice as the form field
  split.
- Add the perf-test scenario `DatePicker.ts` and export it from
  `scenarios/index.ts`.

## Decisions

- **D-1** *Native date input or a custom calendar grid?* Native, as the design system decides: system pickers on phones, built-in keyboard and screen-reader support, `min` at the source, an ISO value and no script weight. Marking free days on a grid is the [calendar](calendar.md)'s job.
- **D-2** *What is the value of an empty or half-typed date?* `null`. The native input reports `''` for both; one empty value keeps "required" checks simple, and the page's message ("Pick your event date.") covers both cases.
- **D-3** *Where do the presets render?* Inside the date picker host, after the input, so the field's error and help follow them. The design-system specimen puts the chip cluster after the field; inside the host the presets stay with their field in a form grid instead of taking the next grid cell.
- **D-4** *Does the date picker compute `min` and `max`?* No. Each form has its own window (booking, blocked range, issue date, audit filter), and today depends on `America/Toronto` (L2-110). The page computes them with the API library's calendar-date helpers.
- **D-5** *Does a typed date outside `min`/`max` block the value?* No. The browser accepts typed digits outside the range; the value is passed on and the page's validation shows "Pick a date at least 3 days away." or "We take bookings up to 18 months ahead." (L2-004).
- **D-6** *Are presets usable while read-only?* No. A preset changes the value, so it is disabled whenever the box is read-only or disabled.
- **D-7** *Does pressing the pressed preset clear the date?* No. It sets the same date again and stays pressed; clearing is done in the box. A preset is a shortcut, not a toggle of the value.
- **D-8** *How is a range linked?* By the page: two date pickers, the second's `min` bound to the first's value. The design system forbids a range picker, and two fields keep each date's label and error separate.
- **D-9** *Sizes exist only on the design-system page. Keep them?* Yes. The date picker takes the text field's sizes; adding them later would change the input union consumers type against.
