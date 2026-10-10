# Text field

| Field | Value |
|---|---|
| Selector | `zm-text-field`, `zm-file-input`, `zm-upload-list` |
| Library path | `frontend/projects/components/src/lib/text-field/` |
| Status | planned |
| Traces to | L2-004, L2-023, L2-047, L2-055, L2-058, L2-068, L2-072, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`text-field.html`](../../design-system/components/text-field.html) |
| Source mocks | [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/sign-in/invalid`](../../mocks/pages/sign-in/invalid.html), [`pages/account/default`](../../mocks/pages/account/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`dialogs/issue-refund/invalid`](../../mocks/dialogs/issue-refund/invalid.html), [`dialogs/calendar-feed/default`](../../mocks/dialogs/calendar-feed/default.html), [`pages/apply/step-2`](../../mocks/pages/apply/step-2.html), [`dialogs/add-photo/invalid`](../../mocks/dialogs/add-photo/invalid.html), and every other form (see Usage) |
| Rendering | [`text-field.html`](text-field.html) |

## Purpose and scope

A text field takes one line of typing: the church's town in the booking bar,
Naomi's email at sign-in, a search on an admin list, a refund amount, a
6-digit code. It is a native `<input>`, square, ruled in charcoal, and always
sits under a visible label in a [form field](form-field.md). The family has
three components:

- `zm-text-field` renders `<input class="input">` for text, email, phone, web
  address, search, password, number and time, with optional addons ("$",
  "km"), a leading search icon, a password show toggle and one projected button
  ("Copy link").
- `zm-file-input` renders `<input class="input" type="file">` for photos,
  videos, captions and the Vulnerable Sector Check.
- `zm-upload-list` renders the files already attached above a file input
  (`.upload-list`): a row per file with its title, facts and a "Remove" button.

Use something else when:

- the answer may run past one line → [textarea](textarea.md);
- it is a calendar day → [date picker](date-picker.md) (`type="date"` is not a
  text-field type);
- it is one of a fixed list → [select](select.md) or [radio group](radio-group.md);
- it is a yes/no → [checkbox](checkbox.md).

Out of scope:

- The label, requirement marker, help, error, success and counter. The
  [form field](form-field.md) owns them and wires them in through `FORM_FIELD`.
- Validation and its copy (L2-075, L2-072, L2-051). The page validates and
  passes the message to the field.
- Copying the calendar link to the clipboard and its "Copied" status. The page
  owns the projected button's click and the [toast](toast.md) or status region.
- Uploading files, progress and processing states ("Processing", "Live",
  L2-052). The page uploads; the file input only picks files, and the upload
  list only shows what the page gives it.
- Formatting the value. Money and distances are typed as text and parsed by
  the page; the field never reformats while someone types.

## Usage

The mocks render 864 text-like `<input class="input">` elements (854 medium,
10 large) and 20 file inputs across 40 page and dialog folders; one upload
list. Each row is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/*` booking bar (and every dialog and toast over Discover) | `text`, `autocomplete="address-level2"` | "Church location", value "Burlington, ON" | default, invalid "Enter your church's address or town, or pick a city below." | paper island on the stage |
| `pages/artist/*` booking stub, `pages/profile-preview/*` | `text` | "Church", value "Riverside Community Church, Burlington" | default, disabled (preview) | stub |
| `pages/sign-in/*`, `pages/forgot-password/*` | `email` + `placeholder="name@church.ca"`, `autocomplete="email"`; `password`, `autocomplete="current-password"` | "Email (required)", "Password (required)" | default; invalid with a form-level message "Email or password is incorrect." (`describedBy`, `invalid`); readonly while signing in | auth stub |
| `pages/sign-up/*`, `pages/reset-password/*` | `text` `autocomplete="name"`; `email`; `password` `autocomplete="new-password"` | "Full name (required)", "Password (required)" + 12–128 help, "Type it again (required)" | default, invalid "This one has 9 characters. Use at least 12.", readonly while busy | auth stub |
| `pages/mfa-challenge/*`, `pages/mfa-setup/*` | `text`, `size="lg"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, `maxlength="6"`, `pattern="[0-9]{6}"`, `spellcheck="false"`; recovery code `autocomplete="off"` | "6-digit code (required)", "Recovery code (required)" | default, invalid, disabled, readonly | auth stub |
| `dialogs/two-step-code` | `text`, `autocomplete="one-time-code"`, `spellcheck="false"` | "Code (required)" | default, invalid, readonly | dialog |
| `pages/account/*`, `dialogs/add-church`, `dialogs/delete-account` | `text` with `name`, `street-address`, `address-level2`, `postal-code` autocomplete; `tel` `autocomplete="tel"`; `email`; `password` current and new; `number` `inputmode="numeric"` `min="1"` | "Your name (required)", "Street address (required)", "City (required)", "Postal code (required)", "Contact phone (required)", "New email (optional)", "Typical attendance (optional)", "Denomination (optional)" | default, invalid "We couldn't find that address…", readonly while saving | form section, dialog |
| `pages/edit-profile/*` and dialogs over it | `text`; slug `text` `pattern="[a-z0-9-]+"` `spellcheck="false"` `autocapitalize="off"`; price `number` `min="100"` `max="20000"` `step="1"`; `maxlength`/`minlength` on titles and alt text | "Display name (required)", "zamaro.ca/artists/ (required)", "From price, in dollars (required)", "Alt text (required)", "Song title (required)", "Writer or source (optional)" | default, invalid, readonly while saving | form section, dialog |
| `pages/apply/*` | `text`, `email`, `number`; references `text` | "Full name (required)", "Email (required)", "Base city (required)", "Phone or email (required)", "Title for your next video (required with a video)" | default, invalid "References must be someone other than you.", readonly while submitting | form grid |
| `pages/book/*`, `dialogs/add-church` | `time` | "Service start time (required)", value "19:00" | default, readonly while sending | form grid |
| `dialogs/pay-deposit`, `dialogs/pay-balance` | `text` `autocomplete="cc-name"`; `inputmode="numeric"` with `cc-number`, `cc-exp`, `cc-csc`; `postal-code` | "Name on card (required)", "Card number (required)", "Expiry (MM / YY) (required)", "Security code (required)" | default, invalid "Enter all 16 digits; this number has 15.", readonly while paying | dialog |
| `dialogs/issue-refund`, `dialogs/resolve-hold` | `text`, `inputmode="decimal"`, `prefix="$"` + `prefixHint=" Canadian dollars"` | "Amount (required)", "Amount to refund (required)" | default, invalid "That's more than is refundable. Enter $237.50 or less." | dialog |
| `dialogs/calendar-feed` | `url`, `readonly`, `spellcheck="false"`, projected `zm-button` "Copy link" in `[slot=action]` | "Your secret calendar link" | readonly | dialog |
| `dialogs/block-dates` | `text`, `maxlength="100"` | "Note (optional)" | default, readonly while saving | dialog |
| `pages/requests/*`, `pages/admin-artists/*`, `pages/admin-bookings/*` | `search`, `autocomplete="off"` | "Search requests", "Search artists", "Search bookings" | default | page head, form grid |
| `pages/admin-audit/*` | `email` `autocomplete="off"` `spellcheck="false"`; `text` | "Actor email", "Target" | default | form grid |
| File dialogs `add-photo`, `add-video`, `upload-check`; `pages/apply/step-2` | `zm-file-input` with `accept` | "Photo (required)" `image/jpeg,image/png,image/webp,image/heic`; "Video file (required)" / "Add a video (optional)" `video/mp4,video/quicktime,video/webm`; "Captions (optional)" `.vtt,text/vtt`; "Police Vulnerable Sector Check (required)" `application/pdf,image/jpeg,image/png` | default, invalid "That's an AVI file. Choose an MP4, MOV or WebM video.", disabled while uploading | dialog, form grid |
| `pages/apply/step-2` | `zm-upload-list` above the file input | "Uploaded videos": "Way Maker, live at Cornerstone" / "way-maker-cornerstone.mp4 · 214 MB · 6:12 · Live" + "Remove" | default | canvas |
| Design system only | leading search `icon`; `suffix="km"`; password `revealText`/`revealLabel`; `size="sm"` | "Search artists or songs" + placeholder "Hosanna Collective, Way Maker…"; "How far can they drive?" 120 km; "Password" + "Show" | all | surface |

## Anatomy

`zm-text-field`:

1. **Container** — the host. Plain when it has nothing but the input;
   `.input-group` when it has an addon, the show toggle or a projected button;
   `.input-icon` when it has a leading icon. `display: flex`, `min-width: 0`.
2. **Prefix addon (optional)** — `span.input-group__addon#{id}-prefix`: a
   sunken box sharing the input's rule, mono stub type, muted, uppercase by
   CSS. Holds a unit or currency, plus a visually hidden extension.
3. **Leading icon (optional)** — `zm-icon`, `aria-hidden="true"`, muted,
   absolutely placed `--space-3` from the start, never clickable.
4. **Input** — `input.input` (+ `.input--sm` or `.input--lg`). 44 px tall by
   default, 2 px rule, square, surface fill, body text. Takes the field's ID.
5. **Suffix addon (optional)** — `span.input-group__addon#{id}-suffix` after the
   input ("km").
6. **Show toggle (password, optional)** — a `zm-button` (secondary, pressed
   toggle) with an eye icon and the text "Show".
7. **Action (optional)** — one projected `zm-button` after the input ("Copy
   link").

`zm-file-input`: the host wraps one `input.input[type="file"]`, 8 px padding,
pointer cursor; the browser draws its own button and file name.

`zm-upload-list`: `ul.upload-list[role="list"]` with an `aria-label`; each
`li.upload-list__item` holds a success icon (`aria-hidden`), a
`div.upload-list__text` with `<strong>` title and a `<span>` of facts, and a
small ghost `zm-button` "Remove".

## API

### Inputs shared by `zm-text-field` and `zm-file-input`

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `name` | `string` | — | no | Native `name`, for autofill heuristics. |
| `id` | `string` | — | no | Native `id` outside a field. Inside a [form field](form-field.md) the field's `fieldId` wins. |
| `label` | `string` | — | outside a field | Written as `aria-label`. In dev mode a control with neither a field nor `label` logs a console error naming the component. |
| `describedBy` | `string` | — | no | Extra IDs appended to `aria-describedby` after the field's and the addons' ("credentials-error" at sign-in). |
| `invalid` | `boolean` (attribute) | `false` | no | Sets `aria-invalid="true"`, ORed with the field's error (D-6). |
| `required` | `boolean` (attribute) | `false` | no | Native `required`, ORed with the field's `requiredMarker`. |

### `zm-text-field` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `type` | `'text' \| 'email' \| 'tel' \| 'url' \| 'search' \| 'password' \| 'number' \| 'time'` | `'text'` | no | Native `type`. `number` only for small whole counts and the whole-dollar price; money with cents and distances are `text` with `inputmode`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.input--sm` or `.input--lg`. Medium adds nothing. |
| `placeholder` | `string` | — | no | A real example ending in an ellipsis, never the label. |
| `autocomplete` | `string` | — | no | Native token (`email`, `tel`, `street-address`, `one-time-code`, `cc-number`, `off`…), WCAG 1.3.5. |
| `inputmode` | `'text' \| 'numeric' \| 'decimal' \| 'tel' \| 'email' \| 'url' \| 'search'` | — | no | Native `inputmode`. |
| `maxlength` / `minlength` | `number` | — | no | Native limits. `maxlength` is reported to the field as `maxLength` for its counter. |
| `min` / `max` / `step` | `number \| string` | — | no | Native, for `number` and `time`. |
| `pattern` | `string` | — | no | Native `pattern` ("[a-z0-9-]+", "[0-9]{6}"). |
| `spellcheck` | `boolean \| undefined` | `undefined` | no | Writes `spellcheck="true\|false"`. When `undefined`, `email`, `url` and `password` write `false`; other types write nothing. |
| `autocapitalize` | `'off' \| 'none' \| 'sentences' \| 'words' \| 'characters'` | — | no | Native `autocapitalize`. |
| `readonly` | `boolean` (attribute) | `false` | no | Native `readonly`: sunken, dashed, focusable. The page sets it while the form is busy. |
| `icon` | `IconName` | — | no | Leading decorative icon (`search`); the host gets `.input-icon`. Not combined with a prefix. |
| `prefix` / `suffix` | `string` | — | no | Visible addon text before / after the input ("$", "km"). Each addon gets `{id}-prefix` / `{id}-suffix` and joins `aria-describedby` after the field's IDs. |
| `prefixHint` / `suffixHint` | `string` | — | no | Visually hidden text appended inside the addon (" Canadian dollars"). |
| `revealText` | `string` | — | with `revealLabel` | Visible text of the password show toggle ("Show"). Only with `type="password"`. |
| `revealLabel` | `string` | — | with `revealText` | Accessible name of the toggle ("Show password"); begins with the visible text (WCAG 2.5.3). |

### `zm-file-input` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `accept` | `string` | — | no | Native `accept`, matching the help text ("video/mp4,video/quicktime,video/webm"). |
| `multiple` | `boolean` (attribute) | `false` | no | Native `multiple`. |

A file input has no `readonly`, `size`, `placeholder` or addons.

### `zm-upload-list` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The list's `aria-label` ("Uploaded videos"). |
| `items` | `readonly UploadItem[]` | `[]` | no | `UploadItem { id: string; title: string; facts: string; removeLabel: string }`. An empty list renders nothing. |
| `removeText` | `string` | — | yes | Visible text of each remove button ("Remove"). |
| `disabled` | `boolean` (attribute) | `false` | no | Disables every remove button while the form is busy. |

### Values

| Component | Value | Rule |
|---|---|---|
| `zm-text-field` | `string` (`''` when empty) | `type="number"` emits `number \| null` (`null` when empty or not a number), like Angular's number accessor. `time` emits `"HH:mm"`. |
| `zm-file-input` | `readonly File[]` | `[]` when nothing is chosen. `writeValue([])` or `null` clears the input; any other written value is ignored (browsers forbid setting files). |

All three are signal-input components with `OnPush`. `zm-text-field` and
`zm-file-input` implement `ControlValueAccessor` and `FieldControl` (`length`,
`maxLength`, `focus()`) and register with the enclosing field.

### Methods

| Method | Effect |
|---|---|
| `focus(): void` | On `zm-text-field` and `zm-file-input`: focuses the native input. |

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `zm-upload-list` `removed` | the `UploadItem`'s `id` | A row's "Remove" button is activated. The page removes the file and the row. |

`zm-text-field` and `zm-file-input` have no outputs: the value reaches the page
through the forms API; native `input` and `change` events bubble from the host.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-text-field` `[slot=action]` | one `zm-button` | Declared once, after the input and any suffix or toggle. Detected with `contentChild(Button)`, which puts `.input-group` on the host. |

`zm-file-input` and `zm-upload-list` have no slots.

## Variants and sizes

| Variant | How | Use for |
|---|---|---|
| Text | `type="text"` | Names, places, card details, slugs, codes. |
| Email | `type="email"` | Sign-in, sign-up, account email; `@` keyboard; spellcheck off. |
| Phone | `type="tel"` | "Contact phone (required)". |
| Web address | `type="url"` | The calendar feed link. |
| Search | `type="search"`, optional `icon="search"` | Admin and request lists. Esc clears. |
| Password | `type="password"`, optional show toggle | Sign-in, reset, account. |
| Number | `type="number"` | Small counts ("Typical attendance") and the whole-dollar price. |
| Time | `type="time"` | "Service start time (required)". |
| Addon | `.input-group` with `prefix`/`suffix` | A unit or currency that belongs to the value. |
| Action | `.input-group` with `[slot=action]` | A button that acts on the value ("Copy link"). |
| File | `zm-file-input` | Photos, videos, captions, checks. |
| Upload list | `zm-upload-list` | Files already attached. |

| Size | Modifier | Height | Padding | Type |
|---|---|---|---|---|
| Small | `.input--sm` | `--control-height-sm` (`--target-comfortable` under a coarse pointer) | `--space-1` × `--space-3` | `--text-body-sm` |
| Medium | — | `--control-height-md` | `--space-2` × `--space-3` | `--text-body` |
| Large | `.input--lg` | `--control-height-lg` | `--space-2` × `--space-4` | `--text-body-lg` |

Small is for wide-screen toolbars only: its 14 px text makes iOS zoom on focus.
Large is for a single important field on its own (the 6-digit code). The width
is always the field's.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | `--field-bg` fill, `--field-border` rule, `--field-fg` value | Textbox (or spin button for `number`), named by the label |
| Placeholder | empty with `placeholder` | Example text in `--color-fg-subtle` | Not the name |
| Hover | `:hover` | Rule darkens to `--color-fg-default` | — |
| Focus | `:focus-visible` | Double ring `--shadow-focus` around the box, outline none; inside a group the input rises to `--z-raised` | — |
| Invalid | field `error` or `invalid` | Rule `--color-danger-border` plus an inner left stripe of `--border-width-thick`; the focus ring replaces the stripe while focused | `aria-invalid="true"`, described by the error |
| Read-only | `readonly` | `--color-bg-surface-sunken` fill, dashed rule | Focusable, value read, not editable |
| Disabled | forms `disable()` | `--color-bg-subtle` fill, `--color-fg-disabled` value and rule, `not-allowed` cursor | Out of the tab order |
| Show toggle pressed | toggle activated | Input becomes `type="text"`; toggle shows the pressed (yellow) button | Toggle `aria-pressed="true"`, name unchanged |
| Busy form | page sets `readonly` (text) or disables (file) | As read-only / disabled; the field dims | Focus kept on text fields |

## Markup

Rendered, plain (the booking bar):

```html
<zm-text-field>
  <input class="input" type="text" id="find-place" name="place" autocomplete="address-level2">
</zm-text-field>
```

Prefix addon with a hidden extension, invalid:

```html
<zm-text-field class="input-group">
  <span class="input-group__addon" id="amount-prefix">$<span class="visually-hidden"> Canadian dollars</span></span>
  <input class="input" type="text" id="amount" name="amount" inputmode="decimal" required
         aria-invalid="true" aria-describedby="amount-error amount-help amount-prefix">
</zm-text-field>
```

Leading icon, search:

```html
<zm-text-field class="input-icon">
  <zm-icon name="search" aria-hidden="true">…</zm-icon>
  <input class="input" type="search" id="artist-search" name="q" autocomplete="off" placeholder="Hosanna Collective, Way Maker…">
</zm-text-field>
```

Read-only with a projected action (the calendar feed):

```html
<zm-text-field class="input-group">
  <input class="input" type="url" id="feed-url" name="feed-url" readonly spellcheck="false"
         value="https://zamaro.ca/api/v1/calendar-feeds/q7Hk2mVb9xT4nLc8RzW1pYs3dFg6jE0aKuNo5tBiQvA.ics"
         aria-describedby="feed-url-help">
  <zm-button slot="action"><button class="btn" type="button">…Copy link</button></zm-button>
</zm-text-field>
```

Password with the show toggle:

```html
<zm-text-field class="input-group">
  <input class="input" type="password" id="password" name="password" autocomplete="current-password" spellcheck="false">
  <zm-button><button class="btn" type="button" aria-pressed="false" aria-controls="password" aria-label="Show password">…Show</button></zm-button>
</zm-text-field>
```

Large code field and number:

```html
<input class="input input--lg" type="text" id="code" name="code" inputmode="numeric" autocomplete="one-time-code"
       maxlength="6" pattern="[0-9]{6}" spellcheck="false" required aria-describedby="code-help">
<input class="input" type="number" id="price" name="price" inputmode="numeric" min="100" max="20000" step="1" required>
```

File input and upload list:

```html
<zm-upload-list>
  <ul class="upload-list" role="list" aria-label="Uploaded videos">
    <li class="upload-list__item">
      <zm-icon name="check-circle" aria-hidden="true">…</zm-icon>
      <div class="upload-list__text"><strong>Way Maker, live at Cornerstone</strong><span>way-maker-cornerstone.mp4 · 214 MB · 6:12 · Live</span></div>
      <zm-button variant="ghost" size="sm"><button class="btn btn--ghost btn--sm" type="button" aria-label="Remove Way Maker, live at Cornerstone">Remove</button></zm-button>
    </li>
  </ul>
</zm-upload-list>

<zm-file-input>
  <input class="input" type="file" id="video-file" name="video-file" accept="video/mp4,video/quicktime,video/webm" aria-describedby="video-file-help">
</zm-file-input>
```

Sizes add only `.input--sm` or `.input--lg`; types change only `type` and the
native attributes.

Consumer templates:

```html
<zm-form-field fieldId="amount" [label]="'admin.refund.amount' | transloco"
               [requiredMarker]="'common.form.required' | transloco"
               [help]="'admin.refund.amountHelp' | transloco: { max, paid }" [error]="errors().amount ?? null">
  <zm-text-field formControlName="amount" name="amount" inputmode="decimal"
                 prefix="$" [prefixHint]="'common.money.cad' | transloco" />
</zm-form-field>

<zm-form-field fieldId="feed-url" [label]="'calendar.feed.link' | transloco" [help]="'calendar.feed.help' | transloco">
  <zm-text-field type="url" readonly [spellcheck]="false" [formControl]="feedUrl">
    <zm-button slot="action" (click)="copy()"><zm-icon name="copy" />{{ 'calendar.feed.copy' | transloco }}</zm-button>
  </zm-text-field>
</zm-form-field>

<zm-form-field fieldId="password" [label]="'auth.password' | transloco" [requiredMarker]="'common.form.required' | transloco">
  <zm-text-field type="password" formControlName="password" autocomplete="current-password"
                 [invalid]="credentialsWrong()" describedBy="credentials-error"
                 [revealText]="'auth.show' | transloco" [revealLabel]="'auth.showPassword' | transloco" />
</zm-form-field>

<zm-upload-list [label]="'apply.videos.uploaded' | transloco" [items]="videos()"
                [removeText]="'common.remove' | transloco" (removed)="removeVideo($event)" />
```

The `.input`, `.input-group`, `.input-icon`, `.upload-list` classes and the
native attributes are a contract: the e2e page objects find inputs by label and
check these classes for visual parity. The `zm-icon` internals are free to
change.

## Design

- Height `--field-height` from the size; padding `--space-2` × `--space-3`
  (large `--space-4` inline, small `--space-1` block); value `--text-body`,
  16 px, so phones do not zoom.
- Rule `--border-width-thick` in `--field-border`, radius `--radius-md`
  (square), fill `--field-bg`, value `--field-fg`; width 100 %.
- Transitions on border colour and box shadow: `--duration-fast`,
  `--ease-standard`.
- Placeholder `--color-fg-subtle` at full opacity.
- Addon: `--text-stub`, uppercase, `--color-fg-muted` on
  `--color-bg-surface-sunken`, `--space-3` inline padding, the same
  `--border-width-thick` `--color-border-strong` rule. Every part after the
  first in a group takes `margin-inline-start: calc(var(--border-width-thick) * -1)`
  so neighbours share one rule; with a projected action the input takes the
  same negative `margin-inline-end`, so the component never styles the
  projected button. The focused input rises to `--z-raised`.
- Leading icon 1 rem, `--color-fg-muted`, at `--space-3` from the start; the
  input's start padding becomes `--space-10`.
- Time and number values use tabular figures.
- File input padding `--space-2`, pointer cursor.
- Upload list: rows `--space-2` apart; each row `--space-3` × `--space-4`
  padding, `--space-3` gap, `--color-bg-surface-sunken` fill, dashed
  `--border-width-thick` `--color-border-strong` rule; icon in
  `--color-success-icon`; title and facts `--text-body-sm`, facts
  `--color-fg-muted` with `overflow-wrap: anywhere`.

Component tokens declared on `.input`, in the component's own stylesheet
(shared with the [textarea](textarea.md) and [select](select.md)):

| Token | Aliases | Overridden by |
|---|---|---|
| `--field-bg` | `--color-bg-surface` | read-only (`--color-bg-surface-sunken`), disabled (`--color-bg-subtle`), surfaces |
| `--field-fg` | `--color-fg-default` | disabled (`--color-fg-disabled`) |
| `--field-border` | `--color-border-strong` | hover (`--color-fg-default`), invalid (`--color-danger-border`), disabled (`--color-fg-disabled`), surfaces |
| `--field-height` | `--control-height-md` | sizes, coarse pointer for small |

A surface that needs quieter fields overrides these tokens on the host, never
the rules.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Value | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Placeholder | `--color-fg-subtle` | `--palette-ink-500` | `--palette-ink-400` |
| Addon text, icon, upload facts | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Addon, read-only and upload row fill | `--color-bg-surface-sunken` | `--palette-paper-warm` | `--palette-ink-950` |
| Disabled fill / text | `--color-bg-subtle` / `--color-fg-disabled` | `--palette-ink-100` / `--palette-ink-400` | `--palette-ink-700` / `--palette-ink-600` |
| Invalid rule | `--color-danger-border` | `--palette-red-600` | `--palette-red-300` |
| Focus ring inner / outer | `--color-focus-ring-offset` / `--color-focus-ring` | `--palette-signal-500` / `--palette-ink-750` | `--palette-ink-900` / `--palette-signal-500` |
| Upload icon | `--color-success-icon` | `--palette-green-700` | `--palette-green-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Value |
| `--color-fg-subtle` | `--color-bg-surface` | 4.5:1 | Placeholder |
| `--color-fg-muted` | `--color-bg-surface-sunken` | 4.5:1 | Addon text, upload facts |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Rule on a card |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Rule on the page |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Invalid rule |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring, outer |

Disabled text is exempt from contrast minimums, but the disabled state is also
shown by the fill and the cursor. Read-only is shown by the dashed rule, not
colour alone. Invalid adds the inner stripe. Under forced colours the rule uses
`CanvasText` and the ring `Highlight` through the tokens. The booking bar and
stub are `data-theme="light"` islands, so their inputs stay paper in both
themes.

## Responsive behaviour

- The input is always 100 % of its field; its width says nothing about the
  expected length.
- In a group, addons, the show toggle and the action keep their width and the
  input shrinks (`min-width: 0`), so "$ + amount", "120 + km" and the calendar
  feed's link with "Copy link" fit at 320 px. The long feed URL scrolls inside
  the read-only input; it never widens the page.
- Medium and large use 16 px text; small (14 px) grows to `--target-comfortable`
  under a coarse pointer and stays off phone layouts.
- The file input's native button and file name wrap or truncate as the browser
  draws them; the input never overflows its field.
- Upload rows wrap long file names anywhere; the Remove button stays on the row.
  At 320 px the text column is about 8 rem wide beside the icon and "Remove",
  so a long title wraps a word per line; that is accepted (D-12).
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom the value,
  addons and buttons stay available; every input is at least 44 px tall except
  small on a fine pointer.

## Accessibility

### Role and pattern

Native `<input>` with the matching `type`; no ARIA role. There is no APG
pattern for a textbox; follow the
[W3C WAI forms tutorial on labels](https://www.w3.org/WAI/tutorials/forms/labels/).
The show toggle follows the
[APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) with
`aria-pressed`. The file input is native, so the system picker, camera and photo
library work with every assistive technology. The upload list is a `role="list"`
`<ul>` (the reset list keeps its semantics in Safari).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | To and from the input, then the show toggle or action. Read-only inputs are stops; disabled are skipped. |
| <kbd>Enter</kbd> | Submits the surrounding form. |
| <kbd>Esc</kbd> | Clears a search field (native). |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Steps a number by `step`; changes a time segment. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> on "Show" | Shows or hides the password; focus stays on the toggle; the caret position and value are kept. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> on a file input | Opens the system file picker. |

### Focus

The double ring (`--shadow-focus`) replaces the outline and hugs the box, so a
card never clips it. In a group the focused input rises above its neighbours so
the addon or button does not cover the ring. `focus()` focuses the input.
Toggling "Show" never moves focus.

### Labelling

- The name is the field's visible label; outside a field, `label` becomes
  `aria-label` ("Search requests").
- Addons are described, not named: `aria-describedby` ends with the addon IDs,
  so the refund field reads "Amount (required), edit, … $ Canadian dollars".
- The show toggle keeps the name "Show password" in both states; `aria-pressed`
  carries the state and `aria-controls` names the input.
- `describedBy` and `invalid` let a form-level message ("Email or password is
  incorrect.") describe and invalidate both credentials fields.
- Each upload row's remove button is named after its file: "Remove Way Maker,
  live at Cornerstone".
- Placeholders are never labels.

### Announcements

None of its own. Errors and counters are the field's; "Copied" is the page's.

### Motion

Rule colour and ring fade over `--duration-fast`; under
`prefers-reduced-motion: reduce` the token drops to near zero and they change
instantly.

## Content and internationalisation

- Labels name the value, not the action: "Church location", not "Enter your
  location".
- Placeholders show a real example and end with an ellipsis: "Hosanna
  Collective, Way Maker…". Never rules or the label.
- Units go in an addon, not in the value: "120" + "km", "$" + "1,800". The
  hidden hint names the currency for screen readers (" Canadian dollars").
- Prefill what Zamaro knows (Naomi's church and town), WCAG 3.3.7.
- The component has no copy of its own: `label`, `placeholder`, addon text and
  hints, `revealText`, `revealLabel`, the upload list's `label`, `removeText`
  and each item's `removeLabel` come from the catalogue through the consumer
  (L2-111). Values (names, addresses, file names, sizes) are data; the page
  formats file facts ("214 MB · 6:12") and money with the format service
  (L2-110). French labels run about 30 % longer; the input's width does not
  change, and addon text stays short ("km", "$").

## Performance

- Change detection: `OnPush`, signal inputs; classes, the effective type,
  `aria-describedby` and `spellcheck` are `computed`s. No `effect`, no
  subscriptions; the value accessor writes the native value directly.
- Perf-test scenarios: `TextField.ts` renders the refund "Amount (required)"
  field's control — `prefix="$"`, `prefixHint=" Canadian dollars"`,
  `inputmode="decimal"`, value "300", invalid (`dialogs/issue-refund/invalid`);
  `FileInput.ts` renders "Add a video (optional)" with the video `accept`
  (`pages/apply/step-2`); `UploadList.ts` renders "Way Maker, live at
  Cornerstone" (`way-maker-cornerstone.mp4 · 214 MB · 6:12 · Live`). Iterations
  in `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms. Export each from `scenarios/index.ts`.
- Composite scenarios that include it: `FormField` (the "Church location"
  field), `BookingForm`.
- Layout stability: the input has a fixed height from `--field-height`;
  toggling "Show" swaps the type, never the size, and causes no shift (L2-086).
- Imports Angular core and forms, `zm-icon` and `zm-button` only.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-text-field formControlName="location" name="place" autocomplete="address-level2" />` in the "Church location" field, when it renders, then the host contains exactly one `input.input[type="text"]#find-place[name="place"][autocomplete="address-level2"]` named "Church location". (L2-004)
- **AC-2** Given each `type` (text, email, tel, url, search, password, number, time) and each size, when it renders, then the native input carries that `type`, `.input` plus exactly `.input--sm` or `.input--lg` for those sizes, and matches the design-system rendering in the visual test. (L2-096)
- **AC-3** Given the refund field with `prefix="$"` and `prefixHint=" Canadian dollars"`, when it renders, then the host has `.input-group`, `span.input-group__addon#amount-prefix` precedes the input with a `.visually-hidden` " Canadian dollars", and `amount-prefix` is the last ID in the input's `aria-describedby`. (L2-068)
- **AC-4** Given the calendar-feed field with a projected `<zm-button slot="action">Copy link</zm-button>`, when it renders, then the host has `.input-group`, the button follows the read-only `input[type="url"]`, both are 44 px tall, and they share one 2 px rule. (L2-058)
- **AC-5** Given the slug field with `pattern="[a-z0-9-]+"`, `[spellcheck]="false"` and `autocapitalize="off"`, when it renders, then the input has those three attributes; and given an `email` field with `spellcheck` unset, then it has `spellcheck="false"`. (L2-055)
- **AC-6** Given "From price, in dollars (required)" as `type="number"` with value 650, when the person clears it, then the form control's value is `null`; when they type "700", then it is the number 700. (L2-111)
- **AC-7** Given "6-digit code (required)" with `size="lg"`, `inputmode="numeric"`, `autocomplete="one-time-code"` and `maxlength="6"`, when it renders, then the input has `.input--lg`, is `--control-height-lg` tall and carries each attribute. (L2-096)

### States

- **AC-8** Given the "Church location" field, when its error is set, then the input has `aria-invalid="true"`, a `--color-danger-border` rule and an inner left stripe; when the error clears, then both go. (L2-102)
- **AC-9** Given the sign-in form after "Email or password is incorrect.", when both inputs have `invalid` and `describedBy="credentials-error"`, then each has `aria-invalid="true"` and `aria-describedby` containing `credentials-error`. (L2-023)
- **AC-10** Given the reset-password form while "Save new password" is pending, when the page sets `readonly` on its fields, then each input has the `readonly` attribute, a `--color-bg-surface-sunken` fill and a dashed rule, stays focusable, and keeps what was typed. (L2-108)
- **AC-11** Given the "Photo (required)" file input while the photo uploads, when the form disables it, then the native input is `disabled` and skipped by Tab; when the upload fails, then it is enabled again with no value lost from the other fields. (L2-108)
- **AC-12** Given a password field with `revealText="Show"` and `revealLabel="Show password"`, when the toggle is activated, then the input becomes `type="text"`, the toggle has `aria-pressed="true"`, its name stays "Show password", focus stays on the toggle and the value is unchanged; activating it again restores `type="password"`. (L2-072)
- **AC-13** Given the "Add a video (optional)" file input, when the person picks `way-maker-cornerstone.mp4`, then the form value is a one-item `File[]`; when the page writes `[]`, then the input is cleared. (L2-047)
- **AC-14** Given `zm-upload-list` with "Way Maker, live at Cornerstone", when "Remove" is activated, then `removed` emits that item's `id`, and the button is named "Remove Way Maker, live at Cornerstone". (L2-047)

### Keyboard and focus

- **AC-15** Given focus moves to a text field with the keyboard, when it receives focus, then the double ring `--shadow-focus` is drawn around the box, and inside an input group the input sits above its addon so the ring is not covered. (L2-101)
- **AC-16** Given the "Amount" field in a form, when Enter is pressed in it, then the form submits; and given a read-only input, then Tab stops on it while a disabled input is skipped. (L2-101)
- **AC-17** Given the error summary link "Enter all 16 digits; this number has 15.", when it calls `focus()` on the "Card number (required)" field, then the card-number input is focused. (L2-101)

### Screen readers

- **AC-18** Given the toolbar search outside any field with `label="Search requests"`, when its accessible name is computed, then it is "Search requests"; and given a text field with neither a field nor `label`, then dev mode logs a console error naming `zm-text-field`. (L2-100)
- **AC-19** Given a page with every type, size and state, the addon group, the action group, the show toggle, the file input and the upload list in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-20** Given the dark theme, when a default, focused, invalid, read-only and disabled input render on a card, then the fill is `--color-bg-surface` charcoal with a `--color-border-strong` rule and `--color-fg-default` value, and the read-only fill is `--color-bg-surface-sunken`. (L2-104)
- **AC-21** Given both themes, when contrast is measured, then the value and placeholder are at least 4.5:1 on the fill, addon text at least 4.5:1 on its sunken fill, and the rule, invalid rule and focus ring at least 3:1. (L2-103)
- **AC-22** Given the dark theme, when the booking bar's "Church location" renders inside its `data-theme="light"` island, then its input uses the light-theme fill, rule and value. (L2-104)

### Responsive

- **AC-23** Given a 320 px viewport, when the refund amount group and the calendar-feed link with "Copy link" render, then the addon and button keep their width, the input shrinks, nothing clips and the page does not scroll horizontally. (L2-096)
- **AC-24** Given a coarse pointer, when a small input is measured, then it is at least 44 px tall. (L2-096)
- **AC-25** Given a 320 px viewport, when the upload list shows a 60-character file name, then the facts line wraps inside the row and the "Remove" button stays on the row. (L2-096)
- **AC-26** Given the French catalogue, when labels, placeholders, `revealText` and `removeText` are replaced by longer translations, then nothing clips and no code changes. (L2-111)

### Motion

- **AC-27** Given `prefers-reduced-motion: reduce`, when an input is hovered or focused, then the rule colour and ring change without a transition. (L2-103)

### Performance

- **AC-28** Given the `TextField`, `FileInput` and `UploadList` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has no text field. Today a text input is drawn inside the
monolithic `zm-form-field` (`type: 'text' | 'date'`, `min`, `max`,
`autocomplete`, the `.input` styles). To meet this CRD:

- Create `frontend/projects/components/src/lib/text-field/` with
  `text-field.ts` (`TextField`, selector `zm-text-field`), `file-input.ts`
  (`FileInput`, `zm-file-input`) and `upload-list.ts` (`UploadList`,
  `zm-upload-list`, with `UploadItem`); export them from `public-api.ts`.
- Move the `.input` styles and the text-input part of `zm-form-field`'s
  template and value accessor here; the field keeps only its parts (see the
  [form field](form-field.md) notes). Add `.input--sm`, `.input--lg`,
  read-only, placeholder, `.input-group`, `.input-icon` and the coarse-pointer
  rule, none of which exist today.
- Implement `ControlValueAccessor` and `FieldControl`; inject `FORM_FIELD`
  optionally and register; bind `id`, `aria-describedby` (field IDs, addon IDs,
  `describedBy`), `aria-invalid` and `required` from it.
- Detect the projected action with `contentChild(Button)`; host class
  `input-group` = prefix, suffix, reveal toggle or action; `input-icon` = icon.
- Build the show toggle with `zm-button` (`pressed`, `label`, `controls`).
- Use `zm-button` (ghost, sm, `label`) for upload rows.
- Icons needed in the [icon](icon.md) set: `search`, `eye`, `check-circle`
  (`copy` for the calendar-feed consumer).
- Add the `TextField.ts`, `FileInput.ts` and `UploadList.ts` perf-test
  scenarios and export them from `scenarios/index.ts`.

## Decisions

- **D-1** *Is the date input a text-field type?* No. `type="date"` is the [date picker](date-picker.md), which adds presets and an ISO value. Time stays here: "Service start time" is a plain native time input with no extra behaviour.
- **D-2** *One component for files too?* No, a separate `zm-file-input`. Its value is `File[]`, it has no read-only state, size, placeholder or addons, and a union type on one component would weaken every text field's API.
- **D-3** *Who owns the upload list?* This CRD, as `zm-upload-list`, because the design system documents it on the text-field page as the file field's companion; it is not a field control and does not register with the field.
- **D-4** *What value does `type="number"` emit?* `number | null`, like Angular's own number accessor, so "From price" reaches the page as 650 and an empty field as `null`. Every other type emits a string.
- **D-5** *How does the host know it has a projected action?* `contentChild(Button)`. A marker directive would add API for one use; the action slot only accepts a `zm-button`, so the query is exact.
- **D-6** *The contract says `invalid` is for standalone use. What about sign-in?* `invalid` ORs with the field's error everywhere. The sign-in mock invalidates both credential inputs with one form-level message ("Email or password is incorrect.", L2-023 forbids saying which was wrong), so the field cannot hold the error and the control must still be `aria-invalid` and described by it.
- **D-7** *How do group parts share one rule without the component styling a projected button?* Negative inline margins on the parts the component draws (addons, input), with the input's end margin pulled under a projected action. The button keeps its own height mapping for `.input-group` from the [button](button.md) CRD.
- **D-8** *Is the show toggle built in?* Yes, behind `revealText` and `revealLabel`. The design system specifies its exact markup and behaviour; building it once keeps `aria-controls`, the fixed name and the type swap consistent on every password field.
- **D-9** *Spellcheck default?* Off for `email`, `url` and `password` when unset (the design system: "Email turns spellcheck off"; a password must never go to a spellcheck service); untouched for other types.
- **D-10** *Disabled or read-only while a form is busy?* Read-only for text fields, disabled for file inputs, as the busy mocks do (L2-108 keeps values; read-only keeps focus). See the [form field](form-field.md) D-11.
- **D-11** *Search and icon in the mocks?* The mocks' searches have no icon; the design system's leading search icon is kept as `icon`, because adding it later would change the host's class contract.
- **D-12** *At 320 px a long upload title wraps a word per line beside the icon and "Remove" (seen in the rendering). Should the button drop under the text?* No. The design system keeps Remove on the row, nothing clips or scrolls (L2-096), and a row that changes shape at one width would move the button away from the file it removes. The row grows taller instead.
