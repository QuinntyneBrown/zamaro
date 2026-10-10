# Form field

| Field | Value |
|---|---|
| Selector | `zm-form-field` |
| Library path | `frontend/projects/components/src/lib/form-field/` |
| Status | built |
| Traces to | L2-004, L2-019, L2-028, L2-059, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`form-field.html`](../../design-system/components/form-field.html) |
| Source mocks | [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/book/invalid`](../../mocks/pages/book/invalid.html), [`dialogs/write-review/invalid`](../../mocks/dialogs/write-review/invalid.html), [`dialogs/add-photo/invalid`](../../mocks/dialogs/add-photo/invalid.html), [`pages/sign-up/invalid`](../../mocks/pages/sign-up/invalid.html), and every other page and dialog with a form (see Usage) |
| Rendering | [`form-field.html`](form-field.html) |

## Purpose and scope

Every typed or picked answer on Zamaro sits in a form field: a stamped label
above, the control, then the one line that matters below it — an error, a piece
of help, or the good news that Abigail is free on Sat 14 Nov. The field does the
wiring (the `for`, the IDs, `aria-describedby`, `aria-invalid`, the requirement
marker and the character counter), so each control only has to be a control.

`zm-form-field` wraps exactly one of the field controls:

- a one-line answer → [text field](text-field.md) (`zm-text-field`, and its
  `zm-file-input` for files);
- a few sentences → [textarea](textarea.md);
- one value from a list → [select](select.md);
- a calendar day → [date picker](date-picker.md).

Use something else when:

- the answer is a set of checkboxes or radios → [checkbox](checkbox.md)'s
  `zm-checkbox-group` or [radio group](radio-group.md), which are `<fieldset>`s
  with a legend, not fields;
- the answer is a single consent checkbox ("I accept Zamaro's terms of use and
  privacy policy") → [checkbox](checkbox.md), which carries its own error;
- the setting applies at once with no submit → [switch](switch.md).

Out of scope:

- Validation rules and their copy. The page validates (L2-075 on the server, the
  page's own rules in the browser) and passes the message in `error`.
- The error summary, its focus move and its links. [Form layout](form-layout.md)
  owns `.error-summary`; the field provides the stable control ID the links
  point to and `focus()` for them to call.
- Layout of fields: `.form-grid`, `.form__row`, `.booking-bar`, dialog bodies.
  The parent lays fields out; the field only spans the grid with `full` and keeps
  a minimum width with `inline`.
- Availability checks and the date suggestions under a booked date. The page
  checks, then projects the result as a [`zm-inline-message`](inline-message.md)
  into `[slot=message]` or passes `error`, and projects the
  [empty state](empty-state.md)'s `.date-swap` list into `[slot=after]`.
- The narrow caption beside Edit profile's primary photo (`.field__help--narrow`
  in `pages/edit-profile/*`). It has no control, so it is not a field; the page
  renders it (D-9).

## Usage

The mocks render about 1,180 fields (`.field` on a `<label>` 810 times, on a
`<div>` 355 times, on a search `<form>` 10 times) across 41 page and dialog
folders. Each row is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/*` booking bar (and every dialog and toast mock drawn over Discover) | label + control, no help | "Event date" (date picker), "Kind of gathering", "How far can they drive?" (selects), "Church location" (text field) | default; invalid "Pick your event date.", "Enter your church's address or town, or pick a city below." | paper island (`data-theme="light"`) on the stage |
| `pages/discover/*` lineup heading | `inline`, select | "Sort" | default | canvas, section head |
| `pages/bookings/*` filter | `inline`, select | "Status" | default, disabled while loading | canvas |
| `pages/artist/default`, `pages/artist/empty` booking stub | label + control; date with a [`zm-inline-message`](inline-message.md) in `[slot=message]` (`id="date-help"`, `live`), or `error` and `live` when booked | "Event date" + "Abigail is free Sat 14 Nov" (success) / "Checking Abigail's calendar…" (busy hint) / error "Abigail is booked Sun 15 Nov. Try another date."; "Kind of gathering"; "Church"; "Message" + `optionalMarker` | default, checking, success, invalid | stub (paper island) |
| `pages/profile-preview/*` | as the stub | as the stub | every control disabled | stub |
| `pages/book/*`, `dialogs/add-church/*` | `requiredMarker`, `help`, `full` | "Event date (required)"; "Service start time (required)" + "7:00 p.m. Abigail arrives an hour early for a sound check."; "Message to Abigail (optional)" + help | default, invalid "Abigail was just booked for Sat 14 Nov. Pick one of her next free dates." with `[slot=after]` `.date-swap`; readonly while sending | surface, form grid |
| `pages/sign-in/*`, `pages/sign-up/*`, `pages/forgot-password/*`, `pages/reset-password/*` | `requiredMarker`, some `help` | "Email (required)", "Password (required)" + "12 to 128 characters. Passwords found in known data breaches are refused.", "Type it again (required)" | default, invalid "This one has 9 characters. Use at least 12.", "Email or password is incorrect."; readonly while busy | auth stub |
| `pages/mfa-challenge/*`, `pages/mfa-setup/*` | `requiredMarker`, `help`, large text field | "6-digit code (required)" + "Signing in as priya@zamaro.ca." | default, invalid "That code is wrong or has expired. Enter the code…", disabled, readonly | auth stub |
| `pages/account/*`, `dialogs/delete-account`, `dialogs/two-step-code` | `optionalMarker` or `requiredMarker`, `help`, `full` | "New email (optional)", "Current password (optional)", "Contact phone (required)" + help, "Church name (required)" full | default, invalid, readonly while saving | form section, form grid |
| `pages/edit-profile/*` and dialogs over it (`add-photo`, `add-song`, `add-video`, `upload-check`, `menu`, `account-menu`) | `requiredMarker`/`optionalMarker`, `help`, `full` | "Display name (required)" + "2 to 80 characters."; "zamaro.ca/artists/ (required)" full; "About you (required)" textarea; "From price, in dollars (required)" | default, invalid, readonly while saving | form section |
| `pages/apply/*` | `requiredMarker`, `help`, `full`; extended markers | "Title for your next video (required with a video)"; "Add a video (optional)" file + help; "Bio (required)" | default, invalid "References must be someone other than you.", readonly while submitting | form grid |
| Review and moderation dialogs (`write-review`, `reply-review`, `hide-review`, `report-review`, `reject-application`, `suspend-artist`) | textarea with `counter`, `help`, marker | "Your review (required)" + "8 / 1,000" + "20 to 1,000 characters. Shown on Abigail's profile with your name and church."; "Note to Tobi (optional)" + "0 / 1,000" | default, invalid "Write at least 20 characters; you have 8.", readonly while posting | dialog |
| Message composers (`pages/booking-detail/*`, `pages/request-detail/*`, `dialogs/accept-request`, `decline-request`, `cancel-booking`, `withdraw-request`, `artist-cancel-booking`, `report-problem`, `pay-deposit`, `pay-balance`; `notifications/booking-toast`) | textarea, `help`, no counter | "Message to Abigail" + "Plain text, 1 to 2,000 characters. Abigail gets an email."; "Why are you cancelling? (required)" | default, invalid "Tell Riverside why you're cancelling. They see it…", "Keep your note to 500 characters; it's 526 now.", readonly | surface, dialog |
| File dialogs (`add-photo`, `add-video`, `upload-check`) | file input; two help lines | "Photo (required)" + "Chosen: youth-night-crop.jpg · 1.1 MB · 640 × 960 px" + "JPEG, PNG, WebP or HEIC up to 15 MB…" | default, invalid "This photo is 640 px on its short side. Choose one at least 800 px.", disabled while uploading | dialog |
| `dialogs/issue-refund`, `dialogs/resolve-hold` | text field with "$" addon, `help`; resolve-hold nests the field between radios | "Amount (required)" + "Up to $237.50 · the deposit Naomi paid Tue 29 Sep" | default, invalid "That's more than is refundable. Enter $237.50 or less." | dialog |
| `dialogs/calendar-feed` | read-only URL text field with a projected "Copy link" button, `help` | "Your secret calendar link" + "Anyone with this link can see your Confirmed bookings…" | readonly | dialog |
| `dialogs/block-dates/*` | two date pickers and a note, `requiredMarker`/`optionalMarker`, `full` | "Start date (required)", "End date (required)", "Note (optional)" + "Up to 100 characters…" | invalid "Choose Fri 27 Nov or later.", readonly while saving | dialog, form grid |
| `dialogs/pay-deposit`, `dialogs/pay-balance` | card fields, `requiredMarker`, `full` | "Name on card (required)", "Card number (required)", "Expiry (MM / YY) (required)", "Security code (required)" + "3 digits on the back" | invalid "Enter all 16 digits; this number has 15.", readonly while paying | dialog, form grid |
| `pages/requests/*`, `pages/admin-artists/*` page heads | search text field; the field sits in the page's `<form role="search">` | "Search requests"; "Search artists" + help | default | canvas |
| `pages/admin-bookings/*`, `pages/admin-audit/*` filters | search, date, email, select fields with `help` | "Search bookings" + "Booking number, artist, church or the booker's email"; "From", "To", "Actor email", "Action", "Outcome", "Target" | default | form grid |
| `pages/saved/*` page head | date picker beside a "Check date" button | "Who's free on" | default | canvas |
| Design system only | `success` on a select and a text field | "Abigail leads these", "Matches your profile" | success | surface |

## Anatomy

1. **Field** — the host, with `.field` (and `.field--inline`, `.field--full`).
   A column of the parts below, `--space-1` apart.
2. **Label row (only with a counter)** — `.field__row`: the label on the left,
   the counter on the right, `--space-2` apart, aligned on the baseline.
3. **Label** — `label.field__label` with `for` = the control's ID. Mono
   overline, uppercase by CSS, stamp tracking, body ink. Always visible, always
   above the control. It is the control's accessible name.
4. **Requirement marker (optional)** — `.field__required` or `.field__optional`
   inside the label, after a space: "(required)", "(optional)", "(required, pick
   1 to 4)". Caption type, sentence case, muted. Part of the name.
5. **Counter (optional)** — `.field__counter`: "used / limit" in tabular
   figures; `data-over="true"` turns it danger red and bold.
6. **Control** — the projected `zm-text-field`, `zm-file-input`, `zm-textarea`,
   `zm-select` or `zm-date-picker`. It owns its own height, rule and focus ring.
7. **Error (optional)** — `.field__error`: bold caption in danger red, text only
   (no icon), directly under the control.
8. **Help (optional, one or more)** — `.field__help`: muted caption, after the
   error. Each line is its own element.
9. **Message (optional)** — a projected [`zm-inline-message`](inline-message.md)
   in `[slot=message]` (the stub's availability check), or the field's own
   `.inline-msg.inline-msg--success` from `success`. Either sits after the
   error, in place of the help.
10. **After content (optional)** — `[slot=after]`: content that follows the
    messages, such as the "Abigail's next 3 free dates" list.
11. **Live region (with a counter or `live`)** — a visually hidden
    `aria-live="polite"` element, last in the field.

Host: `zm-form-field` is the `.field` element itself (`display: flex`, column,
`min-width: 0`). It carries the BEM class so the page objects and the form-grid
rules find it; it renders no wrapper `<div>`. Classes a parent puts on the host
(for example `sort` or `span-full`) stay on the host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The visible label text. Rendered inside `label.field__label`. |
| `fieldId` | `string` | — | yes | The control's `id`, and the stem of every part ID: `{fieldId}-error`, `{fieldId}-help` (then `-help-2`, `-help-3`), `{fieldId}-success`, `{fieldId}-count`, `{fieldId}-live`. Unique on the page; error-summary links use `#{fieldId}`. |
| `requiredMarker` | `string` | — | no | Text of the marker ("(required)", "(required, pick 1 to 4)", "(required with a video)"). Renders `.field__required` and makes the control `required`. |
| `optionalMarker` | `string` | — | no | Text of the marker ("(optional)"). Renders `.field__optional`. If both markers are set, `requiredMarker` wins and dev mode logs a console error. |
| `help` | `string \| readonly string[]` | — | no | One `.field__help` per string, in order. An empty string or array renders nothing. |
| `success` | `string` | — | no | Renders the success inline message in place of every help line. Ignored while `error` is set. |
| `error` | `string \| null` | `null` | no | Renders `.field__error` and marks the control invalid. `null` or `''` removes both. |
| `counter` | `boolean` (attribute) | `false` | no | Shows "used / limit" on the label row. Needs a control that reports a `maxLength` (textarea, text field); without one, dev mode logs a console error and nothing renders. |
| `counterWarning` | `string` | — | no | Announced once through the live region when 20 or fewer characters remain ("20 characters left"). Re-arms when the remainder rises above 20. |
| `counterOver` | `string` | — | no | Announced once when the value is longer than the limit (a restored draft; `maxlength` stops typing past it). |
| `live` | `boolean` (attribute) | `false` | no | After the first render, every change of `success` or `error` is also written to the live region, so a check that runs after a change is heard. |
| `inline` | `boolean` (attribute) | `false` | no | Adds `.field--inline`: a 12 rem minimum width for a field in a heading row or toolbar. |
| `full` | `boolean` (attribute) | `false` | no | Adds `.field--full`: the field spans every column of a grid parent (`grid-column: 1 / -1`). |

- Inputs are signal inputs; booleans use `booleanAttribute`.
- The field provides `FORM_FIELD` (a `FieldContext`) to the projected control:
  `controlId`, `describedBy` (the slotted message, then error, then help or
  success, then counter — only
  the parts that render), `invalid`, `required` and `register(control)`. The
  control registers itself and reports `length`, `maxLength` and `focus()`.
  The contract lives in `form-field/field-context.ts` and is exported from the
  library's public API so every field control implements the same interface.
  A control's own `invalid` and `describedBy` add to what the field provides,
  so a form-level message (sign-in's "Email or password is incorrect.", which
  L2-023 keeps off either field) can mark both controls without a field error
  ([text field](text-field.md), D-6).
- Copy: `label`, both markers, `help`, `success`, `error`, `counterWarning`
  and `counterOver` all come from the translation catalogue through the
  consumer (L2-111). The counter's numbers are formatted by the field with
  Angular's `formatNumber` for the app's `LOCALE_ID` ("1,000"); it has no words.

### Methods

| Method | Effect |
|---|---|
| `focus(): void` | Moves focus to the projected control (its native element), keeping the caret where it was. The error summary's links call it. |

### Outputs

None. The value lives in the control and reaches the page through the forms
API; the field shows what the page tells it.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | exactly one field control: `zm-text-field`, `zm-file-input`, `zm-textarea`, `zm-select` or `zm-date-picker` | Declared once. In dev mode a field with no registered control, or with two, logs a console error. |
| `[slot=message]` | one [`zm-inline-message`](inline-message.md) with an `id` ("date-help") | Declared once, after the error and in place of the help lines (help does not render while the slot is filled, as with `success`). The field reads the projected message's host `id` (`contentChild(InlineMessage, { read: ElementRef })`) and lists it **first** in the control's `aria-describedby`, ahead of the error, help and counter. The message's own `live` (`role="status"`) announces its changes; the field's `live` is not needed for it. If both `success` and the slot are set, the slot wins and dev mode logs a console error. A projected message without an `id` logs a console error and is not listed. |
| `[slot=after]` | any element (the [empty state](empty-state.md)'s `ul.date-swap`) | Declared once, after the messages and before the live region. |

## Variants and sizes

| Variant | Modifier / input | Use for |
|---|---|---|
| Label and control | — | The booking bar and stub fields: nothing else to say. |
| With requirement marker | `requiredMarker` / `optionalMarker` | Mark whichever is less common on the form; long forms and dialogs that mix them mark both. |
| With help | `help` | A format, a limit or why we ask: "Only shared with the artist once the booking is confirmed." |
| With several help lines | `help` as an array | A file field's "Chosen: …" line above its rules. |
| With success | `success` | A check the booker cares about: "Abigail is free Sat 14 Nov". |
| With error | `error` | After a failed submit or a failed check. |
| With counter | `counter` | A text with a limit the writer should see coming: reviews, replies, reasons. |
| Inline | `.field--inline` (`inline`) | A field in a heading row: the lineup's "Sort", the bookings "Status" filter. |
| Full width | `.field--full` (`full`) | A field that spans a two-column form grid: "Church name (required)", "Card number (required)". |

The wrapper has one size. The control inside sets the height (see the
[text field](text-field.md) and [select](select.md) sizes); the width comes from
the layout.

## States

The field has no interaction states of its own; it shows the parts that match
the control's state.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Label, control, help | Control named by the label; described by the help |
| Focus | control `:focus-visible` | The control's double ring (`--shadow-focus`); the field does not change | — |
| Invalid | `error` set | `.field__error` under the control, before any help; the control turns its rule `--color-danger-border` with an inner stripe | Control `aria-invalid="true"`; `aria-describedby` starts with `{fieldId}-error` |
| Success | `success` set, no error | Inline message with a tick in `--color-success-fg` replaces the help | `aria-describedby` points at `{fieldId}-success` |
| Counting | `counter` | "8 / 1,000" on the label row | Described (last), not live; one polite announcement at 20 left |
| Over the limit | value longer than `maxLength` | Counter `data-over="true"`: `--color-danger-fg`, bold | One polite announcement of `counterOver` |
| Read-only | control `readonly` | The control's sunken fill and dashed rule; the label stays body ink | Control still focusable, value read |
| Disabled | control disabled | The control greys; the label stays body ink so the value can be understood | Control out of the tab order |
| Busy | `form[aria-busy="true"]` ancestor | Field at 60 % opacity; pointer events off | The page's status region announces progress |
| Inline | `inline` | Minimum width 12 rem | — |

Rules:

- An error comes first and never replaces the help: both render, error first.
  The success message is the one part that replaces the help.
- Removing the error removes the element and `aria-invalid` in the same change.
- While a form is busy (L2-108) the page sets `readonly` on text fields,
  textareas and date pickers, and disables selects and file inputs (they have
  no read-only state), as every busy mock does. The field only dims.

## Markup

Rendered, label and control (the booking bar's "Church location"):

```html
<zm-form-field class="field">
  <label class="field__label" for="find-place">Church location</label>
  <zm-text-field>
    <input class="input" type="text" id="find-place" name="place" autocomplete="address-level2">
  </zm-text-field>
</zm-form-field>
```

Required, with an error and help (the error first in `aria-describedby`):

```html
<zm-form-field class="field">
  <label class="field__label" for="amount">Amount <span class="field__required">(required)</span></label>
  <zm-text-field class="input-group">
    <span class="input-group__addon" id="amount-prefix">$<span class="visually-hidden"> Canadian dollars</span></span>
    <input class="input" type="text" id="amount" name="amount" inputmode="decimal" required
           aria-invalid="true" aria-describedby="amount-error amount-help amount-prefix">
  </zm-text-field>
  <span class="field__error" id="amount-error">That’s more than is refundable. Enter $237.50 or less.</span>
  <span class="field__help" id="amount-help">Up to $237.50 · the deposit Naomi paid Tue 29 Sep</span>
</zm-form-field>
```

Message slot (the booking stub's date; the inline message is listed first):

```html
<zm-form-field class="field">
  <label class="field__label" for="book-date">Event date</label>
  <zm-date-picker>
    <input class="input" type="date" id="book-date" name="date" min="2026-10-12" max="2028-04-09"
           value="2026-11-14" aria-describedby="date-help">
  </zm-date-picker>
  <zm-inline-message slot="message" id="date-help" class="inline-msg inline-msg--success" role="status"><zm-icon name="check" aria-hidden="true">…</zm-icon>Abigail is free Sat 14 Nov</zm-inline-message>
</zm-form-field>
```

The field's own `success` (design-system specimens such as "Matches your
profile") renders `<span class="inline-msg inline-msg--success" id="{fieldId}-success">`
with the tick in the same place.

Counter on the label row (the review dialog), with an over-limit counter and the
live region:

```html
<zm-form-field class="field">
  <div class="field__row">
    <label class="field__label" for="review">Your review <span class="field__required">(required)</span></label>
    <span class="field__counter" id="review-count">8 / 1,000</span>
  </div>
  <zm-textarea>
    <textarea class="textarea" id="review" name="review" rows="5" minlength="20" maxlength="1000" required
              aria-invalid="true" aria-describedby="review-error review-help review-count">So good!</textarea>
  </zm-textarea>
  <span class="field__error" id="review-error">Write at least 20 characters; you have 8.</span>
  <span class="field__help" id="review-help">20 to 1,000 characters. Shown on Abigail’s profile with your name and church.</span>
  <span class="visually-hidden" id="review-live" aria-live="polite"></span>
</zm-form-field>

<span class="field__counter" id="message-count" data-over="true">2,012 / 2,000</span>
```

Two help lines and after content:

```html
<span class="field__error" id="photo-file-error">This photo is 640 px on its short side. Choose one at least 800 px.</span>
<span class="field__help" id="photo-file-help">Chosen: youth-night-crop.jpg · 1.1 MB · 640 × 960 px</span>
<span class="field__help" id="photo-file-help-2">JPEG, PNG, WebP or HEIC up to 15 MB, at least 800 px on the short side. We remove location data.</span>

<zm-form-field class="field field--full">
  …
  <span class="field__error" id="date-error">Abigail was just booked for Sat 14 Nov. Pick one of her next free dates.</span>
  <ul class="date-swap" role="list" aria-label="Abigail’s next 3 free dates">…</ul>
</zm-form-field>
```

`inline` and `full` add only `.field--inline` and `.field--full` to the host.

Consumer templates:

```html
<zm-form-field fieldId="find-place" [label]="'discover.form.location' | transloco" [error]="errors().location ?? null">
  <zm-text-field formControlName="location" name="place" autocomplete="address-level2" />
</zm-form-field>

<zm-form-field fieldId="review" counter
               [label]="'review.form.text' | transloco"
               [requiredMarker]="'common.form.required' | transloco"
               [help]="'review.form.textHelp' | transloco"
               [counterWarning]="'common.form.charactersLeft' | transloco: { count: 20 }"
               [error]="errors().review ?? null">
  <zm-textarea formControlName="review" name="review" [rows]="5" [minlength]="20" [maxlength]="1000" />
</zm-form-field>

<zm-form-field fieldId="book-date" live [label]="'artist.stub.date' | transloco"
               [error]="dateCheck() === 'booked' ? ('artist.stub.booked' | transloco: { name, date }) : null">
  <zm-date-picker formControlName="date" name="date" [min]="earliest" [max]="latest" />
  @if (dateCheck() !== 'booked') {
    <zm-inline-message slot="message" id="date-help" live
                       [variant]="dateCheck() === 'free' ? 'success' : 'hint'" [busy]="dateCheck() === 'checking'">
      {{ (dateCheck() === 'free' ? 'artist.stub.free' : 'artist.stub.checking') | transloco: { name, date } }}
    </zm-inline-message>
  }
</zm-form-field>
```

The classes, the `for`/`id` pair and the `aria-*` attributes are a contract:
the e2e page objects find fields by label and by these classes. The `zm-icon`
internals are free to change.

## Design

- Parts stack in a column with `--space-1` between them; the label row puts
  `--space-2` between the label and the counter and aligns them on the baseline,
  the counter pushed to the end.
- Label `--text-overline`, `--letter-spacing-stamp`, uppercase, in
  `--color-fg-default`.
- Markers `--text-caption`, `--letter-spacing-normal`, no text transform, in
  `--color-fg-muted`, separated from the label text by one space.
- Help `--text-caption` in `--color-fg-muted`.
- Error `--text-caption` at `--font-weight-bold` in `--color-danger-fg`, block
  level, text only.
- Success: the [inline message](inline-message.md) success variant —
  `--text-caption` bold in `--color-success-fg`, a 1 rem tick nudged down by
  `--space-0-5`, `--space-1` from the text.
- Counter `--text-overline` with tabular figures in `--color-fg-muted`; over the
  limit `--color-danger-fg` and `--font-weight-bold`.
- `inline` sets `min-width: 12rem`; `full` sets `grid-column: 1 / -1`.
- Busy: `:host-context(form[aria-busy="true"])` sets opacity 0.6 and
  `pointer-events: none`.
- Messages appear and disappear without a transition.
- Keep `--space-5` between fields; the parent layout owns that gap.

The field declares no component tokens. The controls inside carry `--field-bg`,
`--field-fg`, `--field-border` and `--field-height`; surfaces re-skin inputs by
overriding those, never the field parts.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Label | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Marker, help, counter | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Error, counter over the limit | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` |
| Invalid control rule (drawn by the control) | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Success message and tick | `--color-success-fg` | `--palette-green-700` | `--palette-green-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Label on a card or dialog |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Help, marker and counter on a card |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Help on the page (lineup sort, page heads) |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Error on a card |
| `--color-success-fg` | `--color-bg-surface` | 4.5:1 | Success on a card |

The booking bar and the booking stub carry `data-theme="light"`, so their fields
stay paper in both themes. Errors and success never rely on colour: the error
is bold words under the control, the invalid control has a thicker left stripe,
and success has a tick. Under `prefers-contrast: more` the muted parts take
`--color-fg-default` through the tokens.

## Responsive behaviour

- A field fills its column; the width comes from the layout, never the field.
- Labels, markers, help, errors and success wrap; nothing truncates.
  "Police Vulnerable Sector Check (required)" is the longest label and wraps at
  320 px.
- On the label row the counter keeps its place at the end and never wraps; a
  long label wraps beside it ("Note to Tobi (optional)" with "125 / 1,000").
- `inline` keeps a 12 rem minimum so the lineup's "Sort" does not collapse at
  360 px; its heading row wraps it under the title.
- `full` spans both columns of a form grid from SM (576 px); below SM the grid
  has one column and `full` changes nothing.
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom every part
  stays available and wraps; the label is part of the control's 44 px target.

## Accessibility

### Role and pattern

Native `<label for>` and `aria-describedby`, as in the
[W3C WAI forms tutorial](https://www.w3.org/WAI/tutorials/forms/). There is no
APG widget pattern for a field; the control inside follows its own.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to and from the control. Label, markers, help, error, success, counter and live region are never focusable. |
| Click or tap on the label | Focuses the control (native `for`). |

### Focus

Only the control takes focus, with its own double ring. `focus()` moves focus
to the control without scrolling it under a sticky header (the page reserves
`scroll-padding`). After a failed submit the error summary takes focus; its
links call `focus()` on each invalid field.

### Labelling

- Every control's accessible name is the visible label, markers included:
  "Phone (optional)", "Event date (required)".
- `aria-describedby` lists a slotted inline message first (the stub's
  availability), then the error, then help (or success), then the counter, so
  the reason is read before the hint. The control appends its own
  addon IDs and `describedBy` after these.
- An invalid control has `aria-invalid="true"`; both it and the error element
  go away as soon as `error` is cleared (L2-102).
- The field never puts help or errors inside the `<label>`, so they are never
  part of the name and never read twice.

### Announcements

The live region is a visually hidden `aria-live="polite"` element. It announces:

- `counterWarning` once when 20 or fewer characters remain, and `counterOver`
  once when the value goes over the limit;
- with `live`, each new `success` or `error` after the first render
  ("Abigail is booked Sun 15 Nov. Try another date.").

Each announcement clears the region first, so the same text is heard again
when it recurs. The counter itself is not live.

### Motion

Nothing animates. Errors, help and success appear without a transition; under
`prefers-reduced-motion: reduce` there is nothing to stop.

## Content and internationalisation

- Labels are short nouns in sentence case: "Event date", "Kind of gathering",
  "Church". A question is fine when it reads better: "How far can they drive?"
- Markers are words in brackets, never asterisks: "(optional)", "(required)",
  "(required, pick 1 to 4)".
- Help is one sentence that says why or how: "Only shared with the artist once
  the booking is confirmed."
- Errors say what is wrong and what to do, without blame: "Abigail is booked Sun
  15 Nov. Pick Sat 14 or Fri 20 Nov." Never "Invalid date".
- Success names the good news, with no typed tick: "Abigail is free Sat 14 Nov".
- Counters read "used / limit": "112 / 2,000".
- Dates, money and distances inside messages are formatted by the page with the
  API library's format service before they reach the field: "Sat 14 Nov",
  "$237.50", "44 km" (L2-110).
- Translatable inputs: `label`, `requiredMarker`, `optionalMarker`, `help`,
  `success`, `error`, `counterWarning`, `counterOver`. Data values inside them
  (names, dates, amounts) are interpolated by the catalogue. French labels and
  messages run about 30 % longer and wrap.

## Performance

- Change detection: `OnPush`, signal inputs; the part IDs, `describedBy`, the
  counter text and the host classes are `computed`s. The only `effect` writes
  the live region.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/FormField.ts`
  renders the booking bar's "Church location" field in its error state — a
  `zm-form-field` around a `zm-text-field`, error "Enter your church's address
  or town, or pick a city below." (`pages/discover/invalid`). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios that include it: `BookingForm` (the four booking-bar
  fields). It migrates with the field to the composed controls and keeps its
  rendered instance.
- Layout stability: an error or success line is one caption line tall and
  appears only after a submit or a change the person made, never on load, so it
  adds no layout shift to a page load (L2-086). The counter reserves its width
  with tabular figures.
- Imports only Angular core and common (`formatNumber`) and `zm-icon` for the
  success tick.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-form-field label="Church" fieldId="church">` around a `zm-text-field`, when it renders, then the host has the class `field`, it contains `label.field__label[for="church"]` followed by an `input#church`, and the input's accessible name is "Church". (L2-100)
- **AC-2** Given `requiredMarker="(required)"` on the "Event date" field, when it renders, then the label contains `<span class="field__required">(required)</span>`, the date input has the `required` attribute and its accessible name is "Event date (required)". (L2-100)
- **AC-3** Given `optionalMarker="(optional)"` on the stub's "Message" field, when it renders, then the label contains `.field__optional` with "(optional)" in `--color-fg-muted`, sentence case, and the textarea's name is "Message (optional)". (L2-100)
- **AC-4** Given `help="Only shared with the artist once the booking is confirmed."` on "Phone", when it renders, then `span.field__help#phone-help` follows the input and the input has `aria-describedby="phone-help"`. (L2-102)
- **AC-5** Given the add-photo field with two help lines, "Chosen: youth-night-crop.jpg · 1.1 MB · 640 × 960 px" and the file rules, when it renders, then two `.field__help` elements render in that order with the IDs `photo-file-help` and `photo-file-help-2`, both listed in that order in the input's `aria-describedby`. (L2-102)

### States

- **AC-6** Given the "Amount" field with help, when `error` becomes "That's more than is refundable. Enter $237.50 or less.", then `.field__error#amount-error` renders after the control and before the help, the input has `aria-invalid="true"`, and its `aria-describedby` starts with `amount-error amount-help`. (L2-102)
- **AC-7** Given an invalid "Church location" field, when `error` becomes `null`, then the `.field__error` element is removed, the input no longer has `aria-invalid`, and `aria-describedby` no longer lists the error ID. (L2-102)
- **AC-8** Given the "Church" field with help, when `success` is "Matches your profile", then `.inline-msg.inline-msg--success#church-success` with an `aria-hidden` tick replaces every help line and is the input's only description. (L2-102)
- **AC-9** Given the stub's "Event date" with `live`, when the page sets `error` to "Abigail is booked Sun 15 Nov. Try another date." after the date changes, then that text is written to `#book-date-live` (`aria-live="polite"`) and a screen reader announces it without focus moving. (L2-019)
- **AC-10** Given the "Your review (required)" field with `counter` around a textarea with `maxlength="1000"` holding "So good!", when it renders, then the label and `span.field__counter#review-count` reading "8 / 1,000" share a `.field__row`, and `review-count` is the last ID in the textarea's `aria-describedby`. (L2-059)
- **AC-11** Given a review with 975 characters and `counterWarning="20 characters left"`, when the 980th character is typed so 20 remain, then the counter reads "980 / 1,000" and the live region announces "20 characters left" once; typing on to 990 announces nothing more. (L2-059)
- **AC-12** Given a restored booking-message draft of 2,012 characters with a 2,000 limit and `counterOver` set, when the field renders, then the counter reads "2,012 / 2,000", has `data-over="true"` and is bold `--color-danger-fg`, and `counterOver` is announced once. (L2-028)
- **AC-13** Given the lineup's "Sort" field with `inline` in a 360 px viewport, when it renders, then the host has `.field--inline` and is at least 12 rem wide. (L2-096)
- **AC-14** Given "Church name (required)" with `full` in a two-column `.form-grid` at 768 px, when it renders, then the host has `.field--full` and spans both columns. (L2-096)
- **AC-15** Given the sign-up form while "Create account" is pending, when the form has `aria-busy="true"` and the page sets the fields `readonly`, then each field renders at 0.6 opacity, keeps its typed value, and the focused password input keeps focus. (L2-108)
- **AC-30** Given the booking stub's "Event date" with a `zm-inline-message` `id="date-help"` reading "Abigail is free Sat 14 Nov" projected into `[slot=message]`, when it renders (and with an error also set), then the message sits after the error in place of the help, and `date-help` is the first ID in the date input's `aria-describedby`, ahead of the error, help and counter IDs. (L2-019)
- **AC-16** Given the booking request's "Event date (required)" after "Abigail was just booked for Sat 14 Nov. Pick one of her next free dates.", when the page projects the `.date-swap` list into `[slot=after]`, then the list renders after the error, inside the field. (L2-028)

### Keyboard and focus

- **AC-17** Given the "Kind of gathering" field, when its label is clicked, then the select receives focus; and given Tab moves through the field, then only the control is a tab stop. (L2-101)
- **AC-18** Given the booking bar submitted with an empty date, when the error summary's "Pick your event date." link calls `focus()` on the "Event date" field, then focus moves to `#find-date` and its double focus ring is visible. (L2-004)

### Screen readers

- **AC-19** Given the invalid "Your review (required)" field, when the textarea's accessible description is computed, then it reads "Write at least 20 characters; you have 8. 20 to 1,000 characters. Shown on Abigail's profile with your name and church. 8 / 1,000", error first. (L2-102)
- **AC-20** Given the error is shown, when it renders, then `.field__error` contains no icon, is `--font-weight-bold`, and the field's invalid state is also carried by words and the control's inner stripe, not by colour alone. (L2-100)
- **AC-21** Given a page with fields in every state (default, required, optional, help, error, success, counter, over the limit, read-only, disabled) in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-22** Given the dark theme, when a field with help and an error renders on a card, then the label is `--color-fg-default`, the help `--color-fg-muted` and the error `--color-danger-fg`, each at least 4.5:1 against `--color-bg-surface`. (L2-103)
- **AC-23** Given the dark theme, when the booking bar's fields render inside its `data-theme="light"` island, then their labels, help and errors use the light-theme values. (L2-104)

### Responsive

- **AC-24** Given a 320 px viewport, when "Police Vulnerable Sector Check (required)" with two help lines and an error renders, then every part wraps inside the field, nothing is clipped, and the page does not scroll horizontally. (L2-096)
- **AC-25** Given a 320 px viewport, when "Note to Tobi (optional)" renders with the counter "125 / 1,000", then the label wraps and the counter stays on the first line at the end of the row. (L2-096)
- **AC-26** Given text zoomed to 200 %, when a dialog field with help and an error renders, then the label, control and messages remain visible and readable without horizontal scrolling. (L2-096)
- **AC-27** Given the French catalogue, when every label, marker, help and error string is replaced by its translation, then the field shows them with no code change and longer strings wrap rather than clip. (L2-111)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when an error, help or success appears or disappears, then it does so without any transition or animation. (L2-103)

### Performance

- **AC-29** Given the `FormField` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-form-field`, but it is a different component: a monolithic
labelled control that renders its own `<input>` or `<select>` (inputs `label`,
`fieldId`, `type: 'text' | 'date' | 'select'`, `options`, `error`, `min`,
`max`, `autocomplete`) and implements `ControlValueAccessor` itself. To meet
this CRD:

- Split it. The field becomes the wrapper defined here; the text, date and
  select controls move to `zm-text-field`, `zm-date-picker` and `zm-select`
  (their CRDs). Remove `type`, `options`, `min`, `max`, `autocomplete` and the
  value accessor from the field. Move `FieldOption` to the select as
  `SelectOption`.
- Add `field-context.ts` with `FieldControl`, `FieldContext` and `FORM_FIELD`,
  export them from `public-api.ts`, and provide `FORM_FIELD` from the field.
- Put `.field` (and the modifiers) on the host; drop the inner `<div class="field">`.
- Add `requiredMarker`, `optionalMarker`, `help` (string or array), `success`,
  `counter`, `counterWarning`, `counterOver`, `live`, `inline`, `full`, the
  `[slot=after]` slot and the live region.
- Add `[slot=message]` for a projected `zm-inline-message`, read its host `id` with
  `contentChild(InlineMessage, { read: ElementRef })`, and list it first.
- Order `aria-describedby` slotted message, error, help or success, counter; today it lists
  only the error.
- Move the field styles that are control styles (`.input`, `.select`) into the
  control components; keep only the field parts here, plus the busy rule.
- Migrate the consumers in the same slice: `pages/discover/search-form` (four
  fields) and `pages/discover/lineup` (the sort, which becomes `inline`).
- The success tick needs a `check` icon in the [icon](icon.md) set.
- Update `FormField.ts` to compose `zm-form-field` + `zm-text-field`; keep the
  same rendered instance and do not lower its iterations.

## Decisions

- **D-1** *A wrapper with a projected control, or one component per field type?* A wrapper. The mocks combine the same label, markers, help, errors and counter with ten control types; one wrapper gives one wiring and one look. The current all-in-one `zm-form-field` would need every control's inputs on one API.
- **D-2** *How does the wrapper wire IDs and `aria-*` into a projected control?* Through the `FORM_FIELD` injection token. The control reads `controlId`, `describedBy`, `invalid` and `required` and registers itself, so the native element carries the attributes and no DOM query is needed.
- **D-3** *Wrapping `<label class="field">` or `<div class="field">` with `label for`?* Always the `for` pattern. The design system allows a wrapping label only when there is nothing but a label and a control. One structure keeps the page objects simple, and help or an error can be added later without moving anything out of the name.
- **D-4** *Does the field host render its own `<div class="field">`?* No, the host is the `.field`. A grid parent's rules and the e2e locators then see the field element directly, and `full` can span a grid without a page style.
- **D-5** *Does the error carry a warning icon?* No. The design system's anatomy caption and its accessibility section mention an icon, but its overview, its sources note ("Field errors are now text only everywhere") and the `components.css` rule say text only. The later, explicit rule wins; bold words, `aria-invalid` and the control's stripe already carry the state without colour.
- **D-6** *`<p>` or `<span>` for help and errors?* `<span>`, block level. The mocks use spans about ten times as often, and a span is valid inside any parent.
- **D-7** *Who computes the counter?* The field, from the length and `maxLength` the control reports, with the numbers formatted for `LOCALE_ID`. The counter then cannot disagree with `maxlength`, and consumers pass only the two announcement strings.
- **D-8** *What does a booked date's error do while the person is not on the field?* With `live`, it is also announced politely. The date-picker page asks for the availability message in a live region, and the check runs after a change, so without an announcement the result would be silent.
- **D-9** *Is the narrow help beside Edit profile's primary photo a field?* No. It is a caption beside an image, with no control to describe; the page renders it with its own style (`--text-caption`, `--color-fg-muted`, at most 16 rem wide). The field does not build `.field__help--narrow`.
- **D-10** *Does the label row also hold a link, as the design-system code table says?* No. No specimen or mock puts a link there, and a link between a label and its control interrupts the reading order. The counter is the only label-row content.
- **D-11** *What happens to a field while its form is busy?* It dims to 0.6 opacity with pointer events off, under `form[aria-busy="true"]`, matching `.form[aria-busy="true"] .field` and `.stub[aria-busy="true"] .field`. The page makes the text controls `readonly` (focus and values stay, L2-108) and disables the rest, as the busy mocks do; the design-system textarea page's "disabled while sending" is the older wording.
- **D-13** *How does the booking stub's availability message ([inline message](inline-message.md) D-3) compose with the field?* Through `[slot=message]`. The stub needs the message's checking (busy) and success states and its own `role="status"`, which a plain `success` string cannot carry; the slot accepts the component and the field lists its `id` first in `aria-describedby`, as the inline-message CRD requires. `success` stays for a static success line, and both render in the same place, replacing the help.
- **D-12** *The search field in a page head is the `<form role="search">` itself in the mocks (`form.field`). How is it built?* The page writes the `<form role="search" class="page-head__search">` and puts a `zm-form-field` inside it. A component cannot become the page's form, and the visual result is the same.
