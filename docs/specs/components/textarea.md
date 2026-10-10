# Textarea

| Field | Value |
|---|---|
| Selector | `zm-textarea` |
| Library path | `frontend/projects/components/src/lib/textarea/` |
| Status | planned |
| Traces to | L2-019, L2-028, L2-030, L2-045, L2-047, L2-050, L2-059, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`textarea.html`](../../design-system/components/textarea.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html), [`dialogs/write-review/invalid`](../../mocks/dialogs/write-review/invalid.html), [`dialogs/reply-review/busy`](../../mocks/dialogs/reply-review/busy.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), and every other dialog with a note or reason (see Usage) |
| Rendering | [`textarea.html`](textarea.html) |

## Purpose and scope

A textarea holds a few sentences: the message Naomi sends with a booking
request ("about 250 people, the songs we love"), a reply to a review, the
reason an administrator hides one, the bio an artist writes about herself. It
is a native `<textarea>` with the field look, at least three lines tall, that
can grow with the text and never grows sideways.

`zm-textarea` is the control only. It always sits in a [form field](form-field.md),
which owns the label, the requirement marker, help, errors and the
"used / limit" counter; the textarea tells the field how long its value is and
what its limit is, so the counter can never disagree with `maxlength`.

Use something else when:

- the answer is one line (a name, a town, a title) → [text field](text-field.md);
- the answer is one of a known list of reasons → [radio group](radio-group.md)
  or [select](select.md), with a textarea for the optional note beside it.

Out of scope:

- The label, markers, help, error, counter and its announcements. The
  [form field](form-field.md) renders them.
- Validation and its copy (a 20-character minimum for reviews, a required
  reason). The page validates and passes `error` to the field (L2-075 validates
  again on the server).
- Masking contact details in messages (L2-046). The API replaces them for the
  recipient; the textarea sends what was typed.
- Rich text, mentions and links. Zamaro does not use rich text; line breaks
  are kept and links are made clickable where the message is shown, not here.
- The busy state of the form. The page sets `readonly` while it sends (D-6).

## Usage

The mocks render 163 textareas across 25 page and dialog folders. Each row is
one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Message composers: `pages/booking-detail/*`, `pages/request-detail/*`, `dialogs/accept-request`, `decline-request`, `cancel-booking`, `withdraw-request`, `pay-deposit`, `pay-balance`, `notifications/booking-toast` (67) | `rows=3`, `maxlength=2000`, field with help, no counter | "Message to Abigail" / "Message Naomi" + "Plain text, 1 to 2,000 characters. Abigail gets an email at most every 15 minutes." | default, readonly while sending | surface, dialog |
| `pages/artist/default`, `pages/artist/empty` booking stub (10, with the dialogs drawn over it) | default rows, `placeholder`, field `optionalMarker` | "Message (optional)", placeholder "Your church, the room, the songs you love." | default | stub (paper island) |
| `pages/profile-preview/*` stub | as the stub | as the stub | disabled | stub |
| `pages/book/*`, `dialogs/add-church` | `rows=5`, `maxlength=2000`, field `full`, `optionalMarker`, help | "Message to Abigail (optional)" | default, readonly while sending | form grid |
| `dialogs/write-review/*` | `rows=5`, `minlength=20`, `maxlength=1000`, field `counter`, `requiredMarker`, help | "Your review (required)" + "8 / 1,000" | default, invalid "Write at least 20 characters; you have 8.", readonly while posting | dialog |
| `dialogs/reply-review/*`, `dialogs/suspend-artist/*`, `dialogs/hide-review/*` | `rows=4` (hide: 3), `maxlength=500`, `required`, field `counter`, help | "Your reply (required)" + "103 / 500"; "Reason (required)" + "0 / 500" | default, invalid, readonly while saving | dialog |
| `dialogs/reject-application/*`, `dialogs/report-review/*` | `rows=4` / `rows=3`, `maxlength` 1,000 / 500, field `counter`, `optionalMarker` | "Note to Tobi (optional)" + "125 / 1,000"; "Anything else? (optional)" + "59 / 500" | default, readonly | dialog |
| `dialogs/decline-request/*` | `rows=3` (invalid mock: 6), field `optionalMarker`, help | "Note to Naomi (optional)" | default, invalid "Keep your note to 500 characters; it's 526 now.", readonly | dialog |
| `dialogs/artist-cancel-booking/*`, `dialogs/report-problem/*` | `rows=4` / `rows=5`, `maxlength`, field `requiredMarker`, help | "Why are you cancelling? (required)", "What went wrong? (required)" | default, invalid "Tell Riverside why you're cancelling. They see it…", "Describe what went wrong…", readonly | dialog |
| `dialogs/issue-refund/*`, `dialogs/resolve-hold/*` | `rows=3`, `required`, field help | "Reason (required)" + "Grace and Hosanna Collective read this in the outcome email." | default, invalid "A reason is required.", readonly | dialog |
| `pages/edit-profile/*` and dialogs over it | `rows=7`, `required`, field help | "About you (required)" + "100 to 1,500 characters · 322 used. …" with Abigail's two-paragraph bio | default, invalid, readonly while saving | form section |
| `pages/apply/*` | `rows=6`, `required`, field `full`, help | "Bio (required)" | default, readonly while submitting | form grid |
| Design system only | `autogrow`, `placeholder`, field `counter` and live warning | "Message (optional)" + "234 / 2,000" | default, hover, focus, invalid, read-only, disabled | surface |

## Anatomy

1. **Text area** — `textarea.textarea`: square, `--border-width-thick` rule in
   `--field-border`, `--field-bg` fill, `--space-2` × `--space-3` padding, body
   text at `--line-height-normal`, at least 6 rem (about three lines) tall.
2. **Resize handle** — the browser's, vertical only. Hidden while auto-grow is
   in effect (D-3).
3. **Placeholder (optional)** — `--color-fg-subtle`, a hint at the content,
   never the label.

Everything else around it — label, marker, counter, error, help — is the
[form field](form-field.md)'s.

Host: `zm-textarea` is `display: block; min-width: 0` and renders exactly one
native `<textarea>` carrying the class, the state attributes and every `aria-*`
attribute. Classes a parent puts on the host stay on the host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `name` | `string` | — | no | Native `name`. |
| `rows` | `number` | `3` | no | Native `rows`, the starting height; the box is never shorter than 6 rem. |
| `maxlength` | `number` | — | no | Native `maxlength`, set to the L2 limit (2,000 for messages, 1,000 for reviews and notes to applicants, 500 for replies, reasons and decline notes, 1,500 for bios). Reported to the field as `maxLength`. |
| `minlength` | `number` | — | no | Native `minlength` (20 for reviews, 100 for bios). The page checks it on submit; the browser never blocks typing. |
| `placeholder` | `string` | — | no | Native `placeholder`. A real example ending in an ellipsis or a hint; never the label. |
| `readonly` | `boolean` (attribute) | `false` | no | Native `readonly`: sunken and dashed, focusable, selectable. Used while the form is sending. |
| `required` | `boolean` (attribute) | `false` | no | Native `required`. Inside a field, the field's `requiredMarker` also sets it. |
| `autogrow` | `boolean` (attribute) | `false` | no | Adds `.textarea--autogrow`: grows with the text to 20 rem, then scrolls. |
| `spellcheck` | `boolean \| undefined` | `undefined` | no | `undefined` omits the attribute (browser default, on); `false` writes `spellcheck="false"`. |
| `id` | `string` | — | standalone only | Native `id`. Inside a field the field's `fieldId` is used and this is ignored. |
| `label` | `string` | — | standalone only | Written as `aria-label` when there is no field. In dev mode a textarea with neither a field nor `label` logs a console error naming `zm-textarea`. |
| `describedBy` | `string` | — | no | Extra IDs appended to `aria-describedby` after the field's. |
| `invalid` | `boolean` (attribute) | `false` | no | Writes `aria-invalid="true"`, ORed with the field's `error`, so a form-level message can mark the control (as on the [text field](text-field.md), D-6). |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- Value: `string`, through `ControlValueAccessor`. `writeValue(null)` shows an
  empty box; the textarea emits the text exactly as typed, line breaks
  included, never trimmed (D-5).
- Disabled comes from the forms API (`setDisabledState`): native `disabled`.
- Field contract: the textarea injects `FORM_FIELD` (optional), registers
  itself as a `FieldControl`, and reports `length` (the value's length in
  UTF-16 code units, the unit native `maxlength` counts, a line break counting
  as 1) and `maxLength` (the `maxlength` input). It takes `id`,
  `aria-describedby`, `aria-invalid` and `required` from the field.
- No copy of its own: `placeholder` and `label` come from the translation
  catalogue through the consumer (L2-111).

### Methods

| Method | Effect |
|---|---|
| `focus(): void` | Focuses the native `<textarea>` without moving the caret (the browser keeps the last selection). |

### Outputs

None. The value reaches the page through the forms API (`valueChanges`). The
native `input`, `change` and `focusout` events bubble from the inner element.

### Content slots

None. The value is the form value, not projected content; the label and
messages belong to the [form field](form-field.md).

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | — | Every note, reason, reply and message in the mocks: a fixed starting height from `rows`, resizable vertically. |
| Auto-grow | `.textarea--autogrow` | A message that may run long where the page has room for it to grow: the booking message on the book page and in the stub. |

Textareas have one width (their field) and one type size. The starting height
comes from `rows` (3 by default; 4, 5, 6 and 7 in the mocks) with a 6 rem
minimum; auto-grow then follows the content up to 20 rem.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | `--field-bg` fill, `--color-border-strong` rule | Multi-line text box, named by the field label |
| Placeholder | empty with `placeholder` | Hint in `--color-fg-subtle` | Placeholder read only when empty; the label stays the name |
| Hover | `:hover` | Rule darkens to `--color-fg-default` | — |
| Focus | `:focus-visible` | No outline; the double ring `--shadow-focus` hugs the box | — |
| Invalid | field `error` (or `invalid`) | Rule `--color-danger-border` plus a `--border-width-thick` inner stripe on the start side; on focus the ring replaces the stripe | `aria-invalid="true"`, described by the error first |
| Read-only | `readonly` | `--color-bg-surface-sunken` fill, dashed rule | Focusable, selectable, announced read-only |
| Disabled | forms API disabled | `--color-bg-subtle` fill, `--color-fg-disabled` text and rule, `cursor: not-allowed` | Native `disabled`: out of the tab order |
| Growing | `autogrow`, text longer than the box | Height follows the content to 20 rem, then the box scrolls | — |
| Busy form | page sets `readonly` while sending | As read-only, inside the field's 0.6 opacity | Focus and value kept (L2-108) |

Surfaces: the textarea has no surface mappings. Inside the booking stub it stays
paper because the stub carries `data-theme="light"`; a surface that needs quieter
fields overrides `--field-bg` and `--field-border`, never the rules.

## Markup

Rendered, a message composer inside its field:

```html
<zm-textarea>
  <textarea class="textarea" id="reply" name="reply" rows="3" maxlength="2000"
            aria-describedby="reply-help"></textarea>
</zm-textarea>
```

Required, invalid, with a counter (the review dialog; the field writes the IDs):

```html
<zm-textarea>
  <textarea class="textarea" id="review" name="review" rows="5" minlength="20" maxlength="1000" required
            aria-invalid="true" aria-describedby="review-error review-help review-count">So good!</textarea>
</zm-textarea>
```

Placeholder, auto-grow, read-only, disabled and standalone:

```html
<textarea class="textarea" id="message" name="message" rows="3"
          placeholder="Your church, the room, the songs you love."></textarea>
<textarea class="textarea textarea--autogrow" id="message" name="message" rows="3" maxlength="2000">We’re hosting a worship night…</textarea>
<textarea class="textarea" id="reply" name="reply" rows="4" maxlength="500" required readonly
          aria-describedby="reply-help reply-count">Thank you, Janet. St. Brendan’s sang like a choir of hundreds…</textarea>
<textarea class="textarea" id="message" name="message" rows="3" disabled></textarea>
<textarea class="textarea" rows="3" aria-label="Message to Abigail"></textarea>
```

Consumer templates:

```html
<zm-form-field fieldId="reply" [label]="'booking.thread.label' | transloco: { name }" [help]="'booking.thread.help' | transloco">
  <zm-textarea formControlName="body" name="reply" [maxlength]="2000" [readonly]="sending()" />
</zm-form-field>

<zm-form-field fieldId="review" counter [label]="'review.form.text' | transloco"
               [requiredMarker]="'common.form.required' | transloco" [error]="errors().review ?? null">
  <zm-textarea formControlName="review" name="review" [rows]="5" [minlength]="20" [maxlength]="1000" />
</zm-form-field>

<zm-form-field fieldId="message" [label]="'artist.stub.message' | transloco" [optionalMarker]="'common.form.optional' | transloco">
  <zm-textarea formControlName="message" name="message" autogrow [maxlength]="2000"
               [placeholder]="'artist.stub.messagePlaceholder' | transloco" />
</zm-form-field>
```

The class, `rows`, the length attributes, the state attributes and the `aria-*`
attributes on the native element are a contract: page objects find the
textarea by its label and the visual tests by `.textarea`.

## Design

- Width 100 % of the field; `min-height: 6rem`; padding `--space-2` block ×
  `--space-3` inline.
- Text `--text-body` (16 px, so phones do not zoom on focus) at
  `--line-height-normal`, in `--field-fg`.
- Rule `--border-width-thick` solid `--field-border`; radius `--radius-md`
  (square).
- `resize: vertical`, never both: the stub and dialogs must not be pushed
  sideways.
- Auto-grow: `field-sizing: content` with `max-height: 20rem`, then
  `overflow-y: auto`. Inside `@supports (field-sizing: content)` it also sets
  `resize: none`; where the browser lacks `field-sizing` the box keeps its
  6 rem height and its vertical handle, with no script (D-3).
- Long unbroken text (a pasted link) wraps inside the box
  (`overflow-wrap: anywhere`), never widening it.
- Transitions on the rule colour and the ring: `--duration-fast`,
  `--ease-standard`. The box resizes without animation.

Component tokens, shared with the [text field](text-field.md) and
[select](select.md) and declared on `.textarea` in the component's own
stylesheet:

| Token | Aliases | Overridden by |
|---|---|---|
| `--field-bg` | `--color-bg-surface` | read-only (`--color-bg-surface-sunken`), disabled (`--color-bg-subtle`), surfaces |
| `--field-fg` | `--color-fg-default` | disabled (`--color-fg-disabled`) |
| `--field-border` | `--color-border-strong` | hover (`--color-fg-default`), invalid (`--color-danger-border`), disabled (`--color-fg-disabled`) |

The textarea does not read `--field-height`; its height is the 6 rem minimum,
`rows` and auto-grow. The 6 rem and 20 rem values are fixed in the stylesheet,
not tokens, as in `components.css`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Placeholder | `--color-fg-subtle` | `--palette-ink-500` | `--palette-ink-400` |
| Invalid rule and stripe | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Read-only fill | `--color-bg-surface-sunken` | `--palette-paper-warm` | `--palette-ink-950` |
| Disabled fill | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Disabled text and rule | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |
| Focus ring, inner / outer | `--color-focus-ring-offset` / `--color-focus-ring` | `--palette-signal-500` / `--palette-ink-750` | `--palette-ink-900` / `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Text in the box |
| `--color-fg-subtle` | `--color-bg-surface` | 4.5:1 | Placeholder |
| `--color-fg-default` | `--color-bg-surface-sunken` | 4.5:1 | Read-only text |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Rule on a card or dialog |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Rule on the page |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring, outer |

Disabled text is exempt from contrast minimums (WCAG 1.4.3); the disabled box
also changes fill and cursor. Invalid never relies on colour alone: the inner
stripe and the field's error words carry it. Under forced colours the rule
becomes `CanvasText` and the ring `Highlight` through the tokens.

## Responsive behaviour

- Full width of its field at every breakpoint: the sidebar width of the booking
  stub on desktop, the page width on phones, the dialog body in dialogs.
- Auto-grow stops at 20 rem so the submit button stays reachable on a phone;
  past that the textarea scrolls inside itself.
- The 16 px text stops iOS zooming on focus.
- At 320 px nothing scrolls horizontally: long words and pasted links wrap
  inside the box. At 200 % zoom the box keeps its 6 rem minimum in rem, so it
  grows with the text.
- The box is at least 96 px tall and full width, well over the 44 × 44 px
  target; the label is part of the target. The resize handle is a mouse
  affordance; touch users rely on the starting height and auto-grow.

## Accessibility

### Role and pattern

Native `<textarea>`, a multi-line text box. There is no APG widget pattern;
follow the [W3C WAI forms tutorial](https://www.w3.org/WAI/tutorials/forms/).
No ARIA role is added.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves into and out of the textarea. Tab never inserts a tab character. Read-only textareas are tab stops; disabled ones are skipped. |
| <kbd>Enter</kbd> | Inserts a new line. It never submits the form. |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> | Not used. Sending stays on the submit button so nobody sends by accident. |

### Focus

The double ring (`--shadow-focus`) surrounds the whole box and is never
clipped, because it is a box shadow on the element itself and no ancestor in
the field sets `overflow`. `focus()` keeps the caret where it was when focus
returns from an error-summary link. Becoming read-only while the form sends
never moves focus.

### Labelling

The [form field](form-field.md)'s visible label is the name ("Message
(optional)", "Your review (required)"). `aria-describedby` lists the field's
error, help and counter in that order, then any `describedBy` IDs. A standalone
textarea is named by `label` (`aria-label`). The placeholder is never the name.

### Announcements

The textarea announces nothing itself. The field's polite live region says
"20 characters left" once near the limit; the counter is described, not live.

### Motion

The rule colour and the ring change over `--duration-fast`; under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero, so they
change instantly. Auto-grow resizes without animation in every mode.

## Content and internationalisation

- The field's label names the thing ("Message"); the placeholder or help says
  what helps the artist decide: "Your church, the room, the songs you love."
- Prefill nothing in a message: a canned greeting reads as spam to artists.
- Limit by characters, as L2 sets them, with `maxlength` equal to the limit and
  a counter where the writer should see it coming: 2,000 for booking messages
  and the thread (L2-028, L2-045), 1,000 for reviews (L2-059) and notes to
  applicants (L2-048), 500 for replies, reasons and decline notes (L2-030), 1,500
  for bios (L2-047, L2-050).
- Errors say what to change: "Write at least 20 characters; you have 8."
- Plain text only: line breaks are kept as typed and shown as typed; the text is
  output-encoded wherever it is displayed.
- Translatable inputs: `placeholder`, `label`. Data values: the text itself.
  French placeholders run about 30 % longer; they wrap inside the box.

## Performance

- Change detection: `OnPush`, signal inputs; `length` is a signal updated on
  `input`, the classes and the described-by list are `computed`s. No `effect`
  except the dev-mode label check.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Textarea.ts`
  renders Naomi's booking message to Abigail in its field with the counter —
  "Message (optional)", `autogrow`, `maxlength` 2,000, the 234-character text
  "We're hosting a worship night for churches across Burlington, about 250
  people…" and the counter "234 / 2,000". Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: none today; the booking stub's scenario will include it
  when the stub is built.
- Layout stability: the starting height is fixed by `rows` and the 6 rem
  minimum, so nothing shifts on load; auto-grow only changes height while the
  person types (L2-086).
- Imports only Angular core and forms; no autosize script.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-textarea name="reply" [maxlength]="2000">` in the field "Message to Abigail" with `fieldId="reply"`, when it renders, then the host contains exactly one `textarea.textarea#reply` with `rows="3"`, `name="reply"` and the accessible name "Message to Abigail". (L2-045)
- **AC-2** Given the edit-profile "About you (required)" textarea with `rows="7"`, when it renders, then it has `rows="7"`, the `required` attribute, and is never shorter than 6 rem. (L2-050)
- **AC-3** Given the booking message with `maxlength` 2,000 holding 2,000 characters, when another character is typed or pasted, then the value stays 2,000 characters long. (L2-028)
- **AC-4** Given the review textarea with `minlength="20"` and `maxlength="1000"` holding "So good!", when it renders in a field with `counter`, then the native element carries both attributes and the field's counter reads "8 / 1,000" from the reported `length` and `maxLength`. (L2-059)
- **AC-5** Given the stub's "Message (optional)" with the placeholder "Your church, the room, the songs you love.", when it is empty, then the placeholder shows in `--color-fg-subtle`, the visible label stays above the box, and the name is "Message (optional)". (L2-019)
- **AC-6** Given a `zm-textarea` with `label="Message to Abigail"` and no field, when it renders, then the textarea has `aria-label="Message to Abigail"`; given neither a field nor `label`, then dev mode logs a console error naming `zm-textarea`. (L2-100)

### States

- **AC-7** Given the review field with `error` "Write at least 20 characters; you have 8.", when it renders, then the textarea has `aria-invalid="true"`, a `--color-danger-border` rule with an inner stripe on the start side, and `aria-describedby="review-error review-help review-count"`. (L2-102)
- **AC-8** Given each state (default, hover, focus, invalid, read-only, disabled) with and without a placeholder, when the visual test captures it, then it matches the design-system states matrix. (L2-096)
- **AC-9** Given the reply dialog while "Post reply" is pending, when the page sets `readonly`, then the textarea keeps its text and focus, shows the `--color-bg-surface-sunken` fill and a dashed rule, and its text can still be selected and copied. (L2-108)
- **AC-10** Given a booking message whose submission fails, when the error renders, then the textarea still holds every character Naomi typed, line breaks included. (L2-108)
- **AC-11** Given the profile preview's stub, when the message textarea is disabled, then it has the native `disabled` attribute, the `--color-bg-subtle` fill and `--color-fg-disabled` text, and Tab skips it. (L2-101)
- **AC-12** Given an `autogrow` booking message in a browser with `field-sizing`, when Naomi types past three lines, then the box grows with the text until 20 rem and then scrolls inside itself, with no resize handle. (L2-096)
- **AC-13** Given an `autogrow` textarea in a browser without `field-sizing`, when it renders, then it keeps its starting height with a vertical resize handle and no script runs to size it. (L2-096)
- **AC-14** Given any textarea, when its handle is dragged sideways, then the width does not change; dragging down makes it taller. (L2-096)

### Keyboard and focus

- **AC-15** Given focus in the booking message inside its form, when Enter is pressed, then a line break is inserted and the form is not submitted; when Tab is pressed, then focus moves to the next control and no tab character is inserted. (L2-101)
- **AC-16** Given the textarea receives keyboard focus, when it is focused, then the double ring `--shadow-focus` is drawn around the whole box and nothing clips it. (L2-101)
- **AC-17** Given the invalid review textarea with the caret after "So good!", when the error summary's link calls the field's `focus()`, then focus moves to the textarea with the caret where it was. (L2-101)

### Screen readers

- **AC-18** Given the invalid "Your review (required)" textarea, when a screen reader reaches it, then it announces the name "Your review (required)", a multi-line edit, invalid, and the description starting "Write at least 20 characters; you have 8." (L2-102)
- **AC-19** Given a page with textareas in every state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Content

- **AC-20** Given Naomi types "About 250 people." followed by two line breaks and "Call me on 905-555-0123.", when the value reaches the form, then it is exactly that text, with both line breaks and no trimming. (L2-045)
- **AC-21** Given the decline note with `maxlength` 500 and a restored 526-character draft, when the field shows "Keep your note to 500 characters; it's 526 now.", then the textarea keeps all 526 characters until Abigail shortens them. (L2-030)
- **AC-22** Given the application's "Bio (required)" with `minlength` 100 and `maxlength` 1,500, when Tobi has typed 1,500 characters, then no further character is accepted and the field's counter, if shown, reads "1,500 / 1,500". (L2-047)

### Theming

- **AC-23** Given the dark theme, when a textarea renders on a dialog, then its fill is `--color-bg-surface` charcoal, its rule `--color-border-strong`, its text at least 4.5:1, its placeholder at least 4.5:1 and its rule at least 3:1 against the surface. (L2-103)
- **AC-24** Given the dark theme, when the booking stub's message renders inside the stub's `data-theme="light"` island, then it keeps the light-theme fill, text and rule. (L2-104)

### Responsive

- **AC-25** Given a 320 px viewport, when the message holds a pasted 90-character link with no spaces, then the link wraps inside the box and the page does not scroll horizontally. (L2-096)
- **AC-26** Given text zoomed to 200 %, when the review dialog renders, then the textarea and its text remain fully visible and usable without horizontal scrolling. (L2-096)
- **AC-27** Given the French catalogue, when the stub's placeholder is replaced by its translation, then it shows with no code change and wraps inside the box. (L2-111)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when the textarea is hovered or focused, then the rule colour and the ring change without a transition, and auto-grow never animates. (L2-103)

### Performance

- **AC-29** Given the `Textarea` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has no textarea; the mocks' textareas have no component yet. To
build it:

- Folder `frontend/projects/components/src/lib/textarea/`, files `textarea.ts`,
  `textarea.html`, `textarea.scss`; class `Textarea`, selector `zm-textarea`.
  Export it from `public-api.ts`.
- Implement `ControlValueAccessor` (`NG_VALUE_ACCESSOR`) and the field's
  `FieldControl` (`length`, `maxLength`, `focus()`); inject `FORM_FIELD`
  optionally and register on init. Take `id`, `aria-describedby`,
  `aria-invalid` and `required` from the field when present.
- Styles: the `.textarea` rules and the shared `--field-*` tokens from
  `components.css`, plus `overflow-wrap: anywhere`, the `@supports
  (field-sizing: content)` block that hides the handle for auto-grow, and the
  `max-height: 20rem` cap with `overflow-y: auto`.
- Dev-mode console error when there is neither a field nor `label`.
- No CDK primitive; no other component composed.
- Add `frontend/projects/perf-test/src/scenarios/Textarea.ts`, export it from
  `scenarios/index.ts`, and tune its iterations.

## Decisions

- **D-1** *Does the textarea render its own label, counter or error?* No. The [form field](form-field.md) owns every part around the control, as for every other field control; the textarea only reports `length` and `maxLength` so the counter is computed in one place.
- **D-2** *What is the default `rows`?* 3. It is the most common value in the mocks (the 67 message composers and most reasons), and with body text at `--line-height-normal` three rows plus padding is about the design system's 6 rem minimum.
- **D-3** *How does auto-grow work without `field-sizing`, and what happens to the handle?* No script: browsers without `field-sizing` keep the 6 rem box and its vertical handle, as the design system says. Where `field-sizing` is supported the handle is hidden, because the box sizes itself (design-system anatomy); `components.css` does not yet hide it, so the component adds the `@supports` rule.
- **D-4** *Which variants use auto-grow?* Only consumers that set `autogrow`. No mock uses it yet; the design system names the booking message as its use, so the stub and the book page set it and every dialog keeps the fixed height its mock shows.
- **D-5** *Is the value trimmed or normalised?* No. The textarea emits exactly what was typed, line breaks included, so a failed send keeps every character (L2-108); trimming and the 1–2,000 rule are the page's and the server's validation (L2-075).
- **D-6** *Read-only or disabled while a form sends?* Read-only. Every busy mock (`dialogs/reply-review/busy`, `pages/book/submitting`, `dialogs/write-review/busy`…) sets `readonly`, which keeps focus and lets the text be read and copied. The design-system page's "Disabled is for the moment a request is being sent" is superseded by the mocks, as the team lead ruled; the design-system page should catch up. Disabled is kept for read-only previews (`pages/profile-preview`).
- **D-7** *The decline-note mock has no `maxlength` and shows "it's 526 now". Should the textarea set `maxlength`?* Yes, 500, as the design-system content rule requires (`maxlength` equal to the L2-030 limit, said with a counter, not an error after the fact). The over-limit error stays possible for a restored draft, and the textarea never cuts text it was given (AC-21).
- **D-8** *The stub's message has no `maxlength` in the mocks. Does it get one?* Yes, 2,000, the L2-028 limit for the request message; the stub opens full size on the book page, which already sets it, and the same message must not accept more in the smaller form.
- **D-9** *How is length counted?* In UTF-16 code units with a line break as 1, the unit native `maxlength` uses, so the counter and the browser's limit always agree.
