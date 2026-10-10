# Form layout

| Field | Value |
|---|---|
| Selector | `zm-form-section`, `zm-form-section-skeleton`, `zm-form-actions`, `zm-error-summary`, plus the layout classes `.form-stack`, `.form-grid`, `.field--full`, `.fieldset`, `.form`, `.form--wide`, `.form__row`, `.form__inline`, `.form__actions` |
| Library path | `frontend/projects/components/src/lib/form-layout/` and `frontend/projects/components/src/styles/form-layout.scss` |
| Status | planned |
| Traces to | L2-004, L2-023, L2-025, L2-028, L2-047, L2-050, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 |
| Design system | [`form-layout.html`](../../design-system/components/form-layout.html) |
| Source mocks | [`pages/account/default`](../../mocks/pages/account/default.html), [`pages/account/invalid`](../../mocks/pages/account/invalid.html), [`pages/account/submitting`](../../mocks/pages/account/submitting.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/apply/step-2`](../../mocks/pages/apply/step-2.html), [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/book/invalid`](../../mocks/pages/book/invalid.html), [`pages/book/loading`](../../mocks/pages/book/loading.html), [`pages/sign-in/invalid`](../../mocks/pages/sign-in/invalid.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`dialogs/add-photo/invalid`](../../mocks/dialogs/add-photo/invalid.html), [`pages/admin-audit/default`](../../mocks/pages/admin-audit/default.html), and every other form (see Usage) |
| Rendering | [`form-layout.html`](form-layout.html) |

## Purpose and scope

Form layout arranges [form fields](form-field.md) into Zamaro's forms: long
forms as a stack of paper sections, each with a dashed-rule title and a
two-column grid of fields, ending in an actions bar with a save status and the
buttons; short forms as one column. After a failed submit, an error summary at
the top lists what to fix and links to each field. While a request is sending,
the fields keep their values and stop taking input: text fields go read-only,
choices go disabled.

It is a kit of three components and a set of layout classes:

- `zm-form-section` — a titled section panel (`.form-section`), optionally the
  danger variant; `zm-form-section-skeleton` is its loading shape.
- `zm-form-actions` — the actions bar (`.form-actions`) with the status line.
- `zm-error-summary` — the error summary (`.error-summary`).
- Layout classes, global utilities beside `.stack` and `.cluster`:
  `.form-stack`, `.form-grid`, `.field--full`, `.fieldset`, and the short-form
  set `.form`, `.form--wide`, `.form__row`, `.form__inline`, `.form__actions`,
  `.form__actions--start`.

Use something else when:

- it is the Discover search or the profile's booking stub, or a sign-in card →
  [booking form](booking-form.md) (it places these parts inside its own frame);
- the form lives in a dialog's footer row → [dialog](dialog.md) owns
  `.dialog__footer`; the summary and grid still come from here;
- it moves between sections of a settings page →
  [sidebar navigation](sidebar-navigation.md) (`.settings-layout`,
  `.settings-nav`);
- it is a single message under a field → [form field](form-field.md) or
  [inline message](inline-message.md).

Out of scope:

- Labels, help, `(required)` / `(optional)` markers, inline errors,
  `aria-invalid` and `aria-describedby` on each control. The
  [form field](form-field.md), [text field](text-field.md),
  [select](select.md), [textarea](textarea.md), [checkbox](checkbox.md) and
  [radio group](radio-group.md) own them.
- Validation rules, error copy, idempotency keys and what is kept after a
  failure. The page and its form model own them; the layout only shows them
  (L2-108).
- The submit button's busy state. The [button](button.md) owns it; the page
  binds the same flag to the form and the button.
- The success banner and toasts ([alert](alert.md), [toast](toast.md)).

## Usage

The mocks render about 480 form sections, 230 grids, 110 fieldsets, 68 actions
bars and 34 error summaries across 45 screens. The short-form classes (`.form`,
`.form__row`, `.form__inline`, `.form__actions`) appear only on the
design-system page. Each row is one distinct configuration; the API below
builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/account/*` (default, invalid, submitting, success, failed, out-of-area, two-step-on) and the pages behind `dialogs/delete-account`, `dialogs/two-step-code` | `form.form-stack` of `zm-form-section` (h2, with and without lead); `.form-grid` with `.field--full`; a `.fieldset` of choices; sticky `zm-form-actions`; sections after the form (two-step, devices, your data); a danger section | "Profile", "Church" + lead "Artists see this on every request…", "Email preferences"; status "Saved 2 min ago"; "Discard" (reset) + "Save changes"; danger "Delete account" + "Delete account…" | ready; invalid with summary "Fix 2 things before saving" (h2) and status "2 fields to fix · not saved" (danger); "Church address outside the area · not saved"; submitting "Saving…" with Discard disabled; success "Saved just now" (success); failed "Not saved · try again" | canvas, sections on `--color-bg-surface` |
| `pages/edit-profile/*` (default, empty, invalid, success, submitting, video-processing) and the pages behind `dialogs/add-photo`, `add-song`, `add-video`, `upload-check` | nine `zm-form-section`s, grids and fieldsets; sticky `zm-form-actions` with only a primary | "Photo & name", "Bio", "Rate & travel", …; status "Saved 2 min ago · live", "Saved Mon 5 Oct · live" | invalid "2 fields to fix · not saved"; submitting "Publishing…" + busy "Saving…"; success "Saved just now · live" | canvas |
| `pages/apply/*` (default, step-2 … step-4, invalid, outside-area, error, submitting) | `form.form-stack`, one or two sections, fieldsets (styles, references), static `zm-form-actions` | status "Step 2 of 4 · Saved on this device"; "Back" (link) + "Continue" / "Send application" | invalid summary "Fix 2 things to continue" + status "Step 4 of 4 · 2 things to fix" (danger); outside-area "Not sent · 1 thing to fix"; error "Not sent · answers kept"; submitting "Sending your application…" with the form `aria-busy` | canvas |
| `pages/book/*` (default, invalid, submitting, unverified) | `form.form-stack`, sections "Your event" (grid, message `.field--full`) and "Your church" (a definition list), static `zm-form-actions` with a lock icon status | status "Nothing is charged today" → "Sending to Abigail"; "Back to profile" (link) + lg primary "Send request to Abigail" | invalid summary "Your request wasn't sent" / "Abigail was just booked for Sat 14 Nov."; submitting "Sending request…" with "Back to profile" disabled | canvas |
| `pages/book/loading` | `zm-form-section-skeleton` × 2 in an `aria-hidden` `.form-stack` | half, half, half, area; half, half | loading | canvas |
| Dialog forms (`add-church`, `block-dates`, `pay-deposit`, `pay-balance`, `delete-account`, `decline-request`, `write-review`, `report-problem`, `artist-cancel-booking`, `hide-review`, `issue-refund`, `reject-application`, `reply-review`, `report-review`, `resolve-hold`, `suspend-artist`, `two-step-code`, `upload-check`, `add-photo`, `add-song`, `add-video`) | `.form-grid` and `.fieldset` in `.dialog__body`; `zm-error-summary` at the top of the body, h3 | "Fix 2 things to upload", "Check the dates", "Your church wasn't saved", "Fix 3 things to pay", "Shorten your note", one to three links | invalid (summary shown and focused) | dialog surface |
| `pages/sign-in/invalid`, `pages/mfa-challenge/invalid`, `pages/mfa-setup/invalid` | `zm-error-summary` h2 inside the auth card | "Couldn't sign you in" / "Email or password is incorrect."; "That code didn't work" | invalid | card |
| `pages/discover/invalid` | `zm-error-summary` h3 spanning the booking bar, `autoFocus` off | "Two things before we can search" / "Pick your event date.", "Enter your church's location." | invalid, focus on the first invalid field | paper island on the stage |
| `pages/admin-audit/default`, `pages/admin-bookings/*` | `form.form-grid[role="search"]` of filters, then a `.cluster` of buttons | "Actor email", "Action", "From", "To"; "Filter" + "Clear filters" | default | surface |
| Design system only | `.form`, `.form--wide`, `.form__row`, `.form__inline`, `.form__actions`, `.form__actions--start` | "Request Abigail Mensah", "Contact on the day" / "Phone", "Artist or song" + "Search" | ready, invalid, submitting | canvas |

## Anatomy

1. **Stack** — `.form-stack`: a column of sections and the actions bar,
   `--space-8` apart. Usually the `<form>` itself.
2. **Section** — `zm-form-section`, host `.form-section`: a paper panel with a
   `--border-width-thick` rule, padding `--space-6`, contents `--space-5` apart.
3. **Section title** — `.form-section__title`: an `h2` (or `h3`) in `--text-h3`,
   uppercase, over a dashed rule. It names the section for assistive
   technology.
4. **Section lead (optional)** — `.form-section__lead`: muted text under the
   title. May hold a badge ("Off").
5. **Grid** — `.form-grid`: fields in one column, two from SM; `.field--full`
   and `.fieldset` span both.
6. **Fieldset** — `.fieldset` with a `<legend>` in `--text-h4`: grouped choices
   or a group of fields ("Reference 1", "Card details").
7. **Actions bar** — `zm-form-actions`, host `.form-actions`: status on the
   left, buttons on the right, `--color-bg-canvas` fill and a top rule. Sticky
   to the bottom of the viewport, or in the flow (`.form-actions--static`).
8. **Status** — `.form-actions__status`: a square `.dot` (or an icon) and a
   short line in `--text-stub`, muted, success or danger.
9. **Buttons** — `.form-actions__buttons`: the projected buttons, secondary
   first and primary last, as in the mocks.
10. **Error summary** — `zm-error-summary`, host `.error-summary`: danger tint,
    a title that counts or names the problem, and one link per field.
11. **Danger section** — `.form-section--danger`: the section in the danger
    rule, for an irreversible action that opens a confirmation dialog.

Hosts: `zm-form-section`, `zm-form-actions` and `zm-error-summary` each carry
their block class on the host element, so the design-system selectors
(`.form-stack > *`, `.booking-bar > .error-summary`) apply to them unchanged.
`zm-form-section` is `display: grid`; `zm-form-actions` is `display: flex`;
`zm-error-summary` is `display: flex` (column).

## API

### Layout classes (`styles/form-layout.scss`)

Global utilities, imported by the library's `styles/index.scss` with
`utilities.scss`. Pages and dialogs put them on their own elements.

| Class | On | Rule |
|---|---|---|
| `.form-stack` | the `<form>` or a `<div>` | Grid, gap `--space-8`, `min-width: 0`. |
| `.form-grid` | a `<div>` in a section or dialog body, or a search `<form>` | Grid, gap `--space-4`; two equal columns from SM. |
| `.field--full` | any direct child of `.form-grid`, including a `zm-form-field` host | Spans both columns. |
| `.fieldset` | a `<fieldset>`, or the host of a component that renders one | No border or padding, column gap `--space-4`; spans both grid columns; `> legend` in `--text-h4`, uppercase, `margin-bottom: var(--space-4)`. |
| `.form` / `.form--wide` | a short `<form>` | Column, gap `--space-5`, capped at 36 rem / uncapped. |
| `.form__row` | a `<div>` of two fields | One column; two equal columns from MD. |
| `.form__inline` | a short search `<form>` | Wrapping row, `align-items: end`, gap `--space-3`; each `.field` grows from 12 rem. |
| `.form__actions` / `.form__actions--start` | a `<div>` of buttons at the end of a `.form` | Wrapping row, gap `--space-3`, right- / left-aligned, `--space-4` above the buttons, dashed top rule. |
| `[aria-busy="true"]` on `.form`, `.form-stack` or `.form-grid` | the `<form>` | Marks the form busy for assistive technology. It adds no fade and no styles of its own: while busy, the page sets text fields, textareas and date pickers `readonly` and selects, file inputs, checkboxes and radios `disabled`; values stay (D-11). |

### `zm-form-section` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | — | yes | The title: "Church", "Your event". |
| `headingId` | `string` | — | yes | The title's `id`; the host's `aria-labelledby`. A one-section form uses it as its own `aria-labelledby` ("Your music"). |
| `headingLevel` | `2 \| 3` | `2` | no | 2 under the page's `h1`; 3 inside a dialog or under another heading. |
| `danger` | `boolean` (attribute) | `false` | no | Adds `.form-section--danger`. |

Slots: `[slot=lead]` (inline content of `.form-section__lead`: text, a
[badge](badge.md); the paragraph is hidden when empty) and the default slot
(the body: a `.form-grid`, a fieldset, a definition list, a list, a cluster of
buttons). Each declared once.

The host carries `role="region"` and `aria-labelledby`, the same semantics as
the mock's `<section aria-labelledby>`. An `id` set on the host (`id="church"`,
the settings-nav target) stays on the host.

### `zm-form-section-skeleton` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `fields` | `readonly ('half' \| 'full' \| 'area')[]` | `['half', 'half']` | no | One placeholder per field: a label line and a control block; `full` spans both columns; `area` spans both with a `--space-32` tall block for a textarea. |

### `zm-form-actions` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `placement` | `'sticky' \| 'static'` | `'sticky'` | no | `static` adds `.form-actions--static` and keeps the bar in the flow (multi-step application, booking request). |
| `status` | `string` | `''` | no | The status line. Empty renders an empty status and keeps the buttons on the right. |
| `statusTone` | `'neutral' \| 'success' \| 'danger'` | `'neutral'` | no | `success` and `danger` add `.form-actions__status--success` / `--danger`. |
| `statusIcon` | `IconName \| null` | `null` | no | An icon in place of the dot (the lock on "Nothing is charged today"). |

Slot: default — the buttons, rendered inside `.form-actions__buttons` in source
order. The status is a `<span role="status">`, so a change from "Saved 2 min
ago" to "Saving…" or "2 fields to fix · not saved" is announced politely.

### `zm-error-summary` inputs, outputs and methods

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | — | yes | "Fix 2 things before saving", "Your request wasn't sent". |
| `summaryId` | `string` | — | yes | The host's `id`; the title is `{summaryId}-title` and labels the host. |
| `headingLevel` | `2 \| 3` | `2` | no | 2 on a page, 3 in a dialog or inside the booking bar. |
| `items` | `readonly { fieldId: string; message: string }[]` | — | yes | One `<li><a href="#{fieldId}">{message}</a></li>` each, in field order. An empty array hides the host (`hidden`). |
| `autoFocus` | `boolean` | `true` | no | Focuses the summary once when it first renders. `false` on Discover, which focuses the first invalid field instead (L2-004, D-3). |

| Output | Payload | Fires when |
|---|---|---|
| `itemActivated` | `string` (the `fieldId`) | A link is activated, after the summary has moved focus to the field. A consumer whose field cannot take focus by `id` (a payment processor's hosted field) focuses it here. |

| Method | Effect |
|---|---|
| `focus()` | Focuses the summary. The page calls it after a second failed submit, when the summary is already shown. |

Activating a link prevents the default fragment navigation, focuses
`document.getElementById(fieldId)` (which scrolls it into view below the sticky
top bar through the page's `scroll-padding-top`), then emits `itemActivated`.

All three components take their copy through inputs and slots (L2-111) and
hold no strings of their own.

## Variants and sizes

| Variant | Class | Use for |
|---|---|---|
| Section | `.form-section` | Every group of related fields on a long form. |
| Danger section | `.form-section--danger` | One irreversible action at the end of a settings page ("Delete account"). |
| Sticky actions | `.form-actions` | Account settings and the profile editor: save from anywhere on a long page. |
| Static actions | `.form-actions.form-actions--static` | Multi-step and one-shot forms (apply, booking request): the bar ends the form. |
| Status: neutral / success / danger | `.form-actions__status`, `--success`, `--danger` | Saved time and progress / just saved / not saved, things to fix. |
| Short form | `.form`, `.form--wide` | A standalone short form; uncapped inside a card that sets the width. |

Sizes: the stack, sections and grid fill their container; `.form` caps at 36 rem.
Field and button heights come from their own components.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Ready | — | Sections, fields prefilled; status neutral ("Saved 2 min ago") | Each section is a region named by its title |
| Invalid | the page renders `zm-error-summary` after a failed submit | Summary at the top in danger tint; each field shows its own error; status danger ("2 fields to fix · not saved") | Focus moves to the summary (or, on Discover, the first invalid field); the status change is announced |
| Submitting | `aria-busy="true"` on the form, `busy` on the submit | Text fields, textareas and date pickers `readonly`; selects, file inputs, checkboxes and radios `disabled`; fieldsets not disabled; values kept; status "Saving…", "Sending to Abigail"; secondary buttons disabled | Form and submit are `aria-busy`; status announced; focus stays on the submit |
| Saved | the page sets `statusTone` `success` | Status "Saved just now" in `--color-success-fg` | Announced through the status |
| Failed | the page sets `statusTone` `danger` | "Not saved · try again", "Not sent · answers kept"; every value kept | Announced through the status |
| Loading | `zm-form-section-skeleton` | Section frames with skeleton title, labels and controls | The page hides the stack (`aria-hidden="true"`) and announces "Loading the booking form" |
| Sticky | `placement` sticky | Bar pinned to the viewport bottom over `--color-bg-canvas` with a top rule | Focused fields are never hidden behind it (see Accessibility) |
| Danger section | `danger` | Danger rule and title rule | The button names the action ("Delete account…") |

## Markup

A long form (account settings):

```html
<form class="form-stack" id="account-form" novalidate aria-labelledby="account-title" aria-busy="false">
  <zm-error-summary class="error-summary" id="error-summary" tabindex="-1" aria-labelledby="error-summary-title">
    <h2 class="error-summary__title" id="error-summary-title">Fix 2 things before saving</h2>
    <ul><li><a href="#new-email">Enter a full new email address</a></li><li><a href="#postal">Enter a full postal code</a></li></ul>
  </zm-error-summary>

  <zm-form-section class="form-section" id="church" role="region" aria-labelledby="church-title">
    <h2 class="form-section__title" id="church-title">Church</h2>
    <p class="form-section__lead">Artists see this on every request. Bookings already sent keep the address they were made with.</p>
    <div class="form-grid">
      <zm-form-field class="field--full" …>…</zm-form-field>
      <zm-form-field …>…</zm-form-field>
    </div>
  </zm-form-section>

  <zm-form-actions class="form-actions">
    <span class="form-actions__status form-actions__status--danger" role="status"><span class="dot" aria-hidden="true"></span>2 fields to fix · not saved</span>
    <div class="form-actions__buttons"><zm-button type="reset">…Discard</zm-button><zm-button variant="primary" type="submit">…Save changes</zm-button></div>
  </zm-form-actions>
</form>
```

A danger section, a static bar with an icon, a skeleton:

```html
<zm-form-section class="form-section form-section--danger" id="delete" role="region" aria-labelledby="delete-title">
  <h2 class="form-section__title" id="delete-title">Delete account</h2>
  <p class="form-section__lead">Sign-in stops straight away and your personal data is erased within 30 days. …</p>
  <div class="cluster"><zm-button variant="danger">…Delete account…</zm-button></div>
</zm-form-section>

<zm-form-actions class="form-actions form-actions--static">
  <span class="form-actions__status" role="status"><zm-icon name="lock" size="sm" aria-hidden="true">…</zm-icon>Nothing is charged today</span>
  <div class="form-actions__buttons"><zm-button-link link="/artists/abigail-mensah">…Back to profile</zm-button-link><zm-button variant="primary" size="lg" type="submit">…Send request to Abigail</zm-button></div>
</zm-form-actions>

<zm-form-section-skeleton class="form-section" aria-hidden="true">
  <span class="skeleton skeleton--title skeleton--short"></span>
  <div class="form-grid">
    <div class="field"><span class="skeleton skeleton--text skeleton--short"></span><span class="skeleton skeleton--control"></span></div>
    <div class="field field--full"><span class="skeleton skeleton--text skeleton--short"></span><span class="skeleton form-section__area"></span></div>
  </div>
</zm-form-section-skeleton>
```

A dialog error summary (`headingLevel` 3) and the short form:

```html
<zm-error-summary class="error-summary" id="photo-errors" tabindex="-1" aria-labelledby="photo-errors-title">
  <h3 class="error-summary__title" id="photo-errors-title">Fix 2 things to upload</h3>
  <ul><li><a href="#photo-file">Choose a photo at least 800 px on the short side</a></li><li><a href="#photo-alt">Write alt text of at least 5 characters</a></li></ul>
</zm-error-summary>

<form class="form" novalidate aria-labelledby="req-title">
  <div class="form__row"><div class="field">…</div><div class="field">…</div></div>
  <div class="form__actions"><button class="btn btn--primary" type="submit">Request to book · Sat 14 Nov</button></div>
</form>
```

Consumer templates:

```html
<form class="form-stack" novalidate [formGroup]="form" (ngSubmit)="save()" [attr.aria-busy]="saving()">
  @if (errors().length) {
    <zm-error-summary #summary summaryId="error-summary" [heading]="'account.errors.summary' | transloco: { count: errors().length }" [items]="errors()" />
  }
  <zm-form-section heading="{{ 'account.church.title' | transloco }}" headingId="church-title" id="church">
    <span slot="lead">{{ 'account.church.lead' | transloco }}</span>
    <div class="form-grid">…</div>
  </zm-form-section>
  <zm-form-actions [status]="statusText()" [statusTone]="statusTone()">
    <zm-button type="reset" [disabled]="saving()">{{ 'common.discard' | transloco }}</zm-button>
    <zm-button variant="primary" type="submit" [busy]="saving()">{{ (saving() ? 'common.saving' : 'common.save') | transloco }}</zm-button>
  </zm-form-actions>
</form>
```

The `.form-*`, `.error-summary*` and `.fieldset` classes, the section regions,
the summary's links to field `id`s and the status's `role="status"` are a
contract: the e2e page objects find a section by its region name, read the
status, and follow summary links by text.

## Design

- Stack: grid, gap `--space-8`. Section: grid, gap `--space-5`, padding
  `--space-6`, `--color-bg-surface`, `--border-width-thick` solid
  `--color-border-strong`, `min-width: 0`.
- Section title `--text-h3`, uppercase, `padding-bottom: var(--space-3)`, bottom
  rule `--border-width-thick` dashed `--color-border-strong`. Lead
  `--color-fg-muted`. Danger: frame and title rule `--color-danger-border`.
- Grid: gap `--space-4`; from SM two equal `1fr` columns.
- Fieldset: no border, padding or margin, `min-width: 0`, column flex with gap
  `--space-4`; legend `--text-h4`, uppercase, no padding,
  `margin-bottom: var(--space-4)`.
- Actions bar: flex, wraps, `align-items: center`, `justify-content:
  space-between`, gap `--space-3`, padding `--space-4` `--space-5`, fill
  `--color-bg-canvas`, top rule `--border-width-thick` solid
  `--color-border-strong`. Sticky: `position: sticky; bottom: 0; z-index:
  var(--z-sticky)`. The button group has `margin-inline-start: auto`, so it
  stays right when the status is empty or wraps.
- Status: inline flex, gap `--space-2`, `--text-stub`, uppercase. Dot: a square
  of `--space-2`, `currentColor`. Icon: `zm-icon` small, `currentColor`.
- Buttons group: flex, wraps, gap `--space-3`.
- Error summary: column flex, gap `--space-2`, padding `--space-5`,
  `--border-width-thick` solid `--color-danger-border`, fill
  `--color-danger-bg`, text `--color-fg-default`; title `--text-h4`,
  uppercase, `--color-danger-fg`; list padding-left `--space-5`; links
  `--color-danger-fg`, `--font-weight-bold`, underlined.
- Short form: `.form` column gap `--space-5`, max 36 rem; `.form__row` gap
  `--space-5`, two columns from MD; `.form__inline` gap `--space-3`, fields
  `flex: 1 1 12rem`; `.form__actions` gap `--space-3`, `padding-top:
  var(--space-4)`, top rule `--border-width-thick` dashed
  `--color-border-strong`.
- Busy: no layout style. The read-only and disabled looks belong to the field
  components ([text field](text-field.md), [textarea](textarea.md),
  [select](select.md), [checkbox](checkbox.md), [radio group](radio-group.md)).
- Skeleton: the section frame with `zm-skeleton` blocks (skeleton CRD
  modifiers `skeleton--title`, `skeleton--short`, `skeleton--text`, `skeleton--control`); the area block is
  `--space-32` tall.
- No motion of its own. Focusing the summary scrolls with the page's
  `scroll-behavior`, which reduced motion turns off.

The kit declares no component tokens; the design system defines none
(`form-layout.html`, Theming).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Section fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Section frame, title rule, bar rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Section lead, neutral status | `--color-fg-muted` | per theme | per theme |
| Bar fill | `--color-bg-canvas` | per theme | per theme |
| Summary fill | `--color-danger-bg` | per theme | per theme |
| Summary frame, danger section rule | `--color-danger-border` | per theme | per theme |
| Summary title and links, danger status | `--color-danger-fg` | per theme | per theme |
| Summary text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Success status | `--color-success-fg` | per theme | per theme |
| Focus ring (summary, its links) | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-danger-fg` | `--color-danger-bg` | 4.5:1 | Summary title and links |
| `--color-fg-default` | `--color-danger-bg` | 4.5:1 | Summary text |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Summary frame, danger section on a card |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Section frame and title rule |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Section lead |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Neutral status on the bar |
| `--color-success-fg` | `--color-bg-canvas` | 4.5:1 | Saved status |
| `--color-danger-fg` | `--color-bg-canvas` | 4.5:1 | Fields-to-fix status |

The status never relies on colour alone: its words say "saved", "not saved" or
"to fix". Disabled choices while busy are inactive, which WCAG exempts; read-only
fields keep full contrast. Under forced colours the frames and rules
use `CanvasText` and the summary keeps its frame.

## Responsive behaviour

- **XS (< 576 px)**: `.form-grid` is one column; every field is full width, in
  DOM order. The actions bar wraps the status above the buttons when they do
  not fit; the buttons wrap in source order.
- **SM and up (≥ 576 px)**: `.form-grid` is two equal columns; `.field--full`
  and `.fieldset` span both.
- **MD and up (≥ 768 px)**: `.form__row` becomes two columns.
- **LG and up (≥ 992 px)**: settings pages put the stack beside the settings
  nav ([sidebar navigation](sidebar-navigation.md)); the kit itself does not
  change.
- Section titles, leads, legends, statuses and summary links wrap and never
  truncate. At 320 px no section, grid, bar or summary overflows and the page
  does not scroll horizontally. At 200 % zoom everything reflows into one
  column and stays reachable; the sticky bar never covers more than its own
  wrapped height.
- Buttons in the bar keep their 44 px targets and `--space-3` gaps (L2-096).

## Accessibility

### Role and pattern

A native `<form novalidate>` named by its heading (`aria-labelledby`); search
forms add `role="search"`. Each `zm-form-section` is a region named by its
title. Groups of checkboxes, radios or related fields are `<fieldset>`s with a
`<legend>`; rows of unrelated fields are not. The error summary follows the
[W3C WAI forms tutorial on user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/):
a focusable, labelled container with links to the fields, without
`role="alert"` (D-2).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the summary's links, then the fields in DOM order (left to right in grid rows), then the bar's buttons. |
| <kbd>Enter</kbd> on a summary link | Focuses that field and scrolls it clear of the sticky top bar. |
| <kbd>Enter</kbd> in a text field | Submits the form (not in a textarea). |

### Focus

- After a failed submit, focus moves to the summary (`tabindex="-1"`), except on
  Discover, where it moves to the first invalid field (L2-004). A second
  failed submit refocuses it through `focus()`.
- While submitting, focus stays on the busy submit button.
- A focused field is never hidden behind the sticky top bar or the sticky
  actions bar (WCAG 2.4.11): while a sticky `zm-form-actions` is rendered, the
  document's `scroll-padding-bottom` is at least twice `--control-height-lg`,
  set from the library's global `form-layout.scss` with
  `html:has(.form-actions:not(.form-actions--static))`.

### Labelling

- The summary is labelled by its title; the title counts the problems or names
  the one problem. Each link's text names the fix ("Enter a full postal code")
  and its `href` is the field's `id`.
- Each section is announced by its title ("Church, region").
- The status line is `role="status"`; its text says what happened, not only its
  colour.
- The status dot and icon are `aria-hidden`.

### Announcements

- The summary is announced by taking focus, once.
- Status changes ("Saving…", "Saved just now", "2 fields to fix · not saved",
  "Sending to Abigail") are announced politely by the bar's `role="status"`.

### Motion

None of its own. Scrolling to a focused field follows the page's
`scroll-behavior`, which is instant under `prefers-reduced-motion: reduce`. The
submit's spinner is the button's (button CRD).

## Content and internationalisation

- Section titles are nouns: "Church", "Email preferences", "Your event".
- Leads say what the section is for in one sentence: "Artists see this on every
  request."
- Summary titles say how many and why ("Fix 2 things before saving", "Fix 3
  things to pay") or name the one problem ("Check the dates", "Your request
  wasn't sent"). Links are instructions ("Pick your event date.") or the server
  message ("Abigail was just booked for Sat 14 Nov.", "Email or password is
  incorrect.", "References must be someone other than you.").
- Status lines are short, uppercase by CSS, sentence case in the source, with
  " · " between facts: "Saved 2 min ago · live", "Step 2 of 4 · Saved on this
  device", "2 fields to fix · not saved".
- Busy statuses use the present participle and an ellipsis: "Saving…",
  "Publishing…", "Sending your application…".
- Counts in titles and statuses use the catalogue's plural forms; dates and
  times ("Saved Mon 5 Oct", "Sat 14 Nov") come from the API library's format
  service (L2-110).
- Every string comes from the translation catalogue through the page (L2-111).
  French runs about 30 % longer: titles, statuses and links wrap.

## Performance

- Change detection: `OnPush`, signal inputs. `zm-error-summary` focuses itself
  once with `afterNextRender`; no `effect`, no subscriptions in any of the
  three.
- Perf-test scenarios to add, each exported from `scenarios/index.ts` and tuned
  in `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms:
  - `FormSection.ts`: Naomi's "Church" section with its lead and a grid of six
    fields (church name full width, street, city, postal code, phone,
    denomination).
  - `FormActions.ts`: the sticky bar with "Saved 2 min ago", "Discard" and
    "Save changes".
  - `ErrorSummary.ts`: "Fix 2 things before saving" with "Enter a full new
    email address" and "Enter a full postal code".
  - `FormSectionSkeleton.ts`: the booking request's first loading section
    (half, half, half, area).
- Layout stability: the skeleton sections have the same frame, padding, title
  height and grid as the loaded sections, so the swap shifts nothing (L2-105).
  The summary appears at the top only after a submit the person started, so it
  is not counted as unexpected shift. Status changes keep the bar's height on
  one line at SM and up.
- Imports: `zm-icon` (status icon) and `zm-skeleton`. Nothing else; buttons
  and fields arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi's account settings, when the page renders, then the form is a `.form-stack` of `zm-form-section`s, each a region named by its `h2` title ("Church"), with the lead "Artists see this on every request." under the "Church" title. (L2-025)
- **AC-2** Given a section whose `[slot=lead]` is empty, when it renders, then no `.form-section__lead` takes space. (L2-025)
- **AC-3** Given the "Church" grid at SM, when it renders, then fields sit in two equal columns and the "Church name" field with `.field--full` spans both. (L2-025)
- **AC-4** Given the "Email preferences" `.fieldset` inside a `.form-grid` at SM, when it renders, then it spans both columns and its legend "Email me about" is an uppercase `--text-h4`. (L2-025)
- **AC-5** Given the "Delete account" section with `danger`, when it renders, then it has `.form-section--danger`, its frame and title rule use `--color-danger-border`, and its only control is the "Delete account…" button. (L2-025)
- **AC-6** Given account settings with a sticky `zm-form-actions` and status "Saved 2 min ago", when the page scrolls, then the bar stays pinned to the bottom of the viewport with "Discard" and "Save changes" on the right and the status on the left. (L2-025)
- **AC-7** Given the application's step 2 with `placement` static and status "Step 2 of 4 · Saved on this device", when it renders, then the bar has `.form-actions--static`, sits in the flow after the last section, and shows "Back" then "Continue". (L2-047)
- **AC-8** Given the booking request, when it renders, then the static bar shows a lock icon and "Nothing is charged today" beside "Back to profile" and "Send request to Abigail". (L2-028)
- **AC-9** Given a `zm-form-actions` with an empty `status`, when it renders, then the buttons stay at the right edge of the bar. (L2-050)

### Error summary

- **AC-10** Given account settings submitted with a short email and a short postal code, when the summary renders, then it has the title "Fix 2 things before saving" as an `h2`, links "Enter a full new email address" (`#new-email`) and "Enter a full postal code" (`#postal`), and is labelled by its title. (L2-102)
- **AC-11** Given the summary renders after a failed submit, when it appears, then it has focus, is announced once, and has no `role="alert"`. (L2-102)
- **AC-12** Given focus on the summary link "Enter a full postal code", when Enter is pressed, then focus moves to the postal-code input, which is fully visible below the sticky top bar and above the sticky actions bar, and `itemActivated` emits "postal". (L2-101)
- **AC-13** Given the summary is already shown, when the form is submitted again and still fails, then the page's call to `focus()` moves focus back to the summary. (L2-102)
- **AC-14** Given Discover submitted without a date or location, when the summary "Two things before we can search" renders with `autoFocus` false, then focus moves to the date field, not the summary. (L2-004)
- **AC-15** Given the booking request fails because Abigail was booked meanwhile, when the summary renders, then it reads "Your request wasn't sent" with the link "Abigail was just booked for Sat 14 Nov." to `#date`, and every value Naomi entered is kept. (L2-028)
- **AC-16** Given sign-in with a wrong password, when the summary renders, then it reads "Couldn't sign you in" with the link "Email or password is incorrect." (L2-023)
- **AC-17** Given a dialog form ("Fix 2 things to upload") with `headingLevel` 3, when the summary renders at the top of the dialog body, then its title is an `h3`. (L2-102)
- **AC-18** Given `items` is empty, when `zm-error-summary` renders, then the host is `hidden` and takes no space. (L2-102)

### States

- **AC-19** Given the profile editor is saved, when the request is pending with `aria-busy="true"` on the form, then the text fields, textareas and date pickers are `readonly`, the selects, file inputs, checkboxes and radios are `disabled`, no fieldset is `disabled`, every value is kept, the submit is busy and the status reads "Publishing…". (L2-108)
- **AC-20** Given the profile editor with two invalid fields, when it is saved, then the status reads "2 fields to fix · not saved" with `.form-actions__status--danger`, and the change is announced by its `role="status"`. (L2-050)
- **AC-21** Given account settings saved successfully, when the status becomes "Saved just now" with `statusTone` success, then it is `--color-success-fg` and announced politely. (L2-025)
- **AC-22** Given the booking request is loading, when `zm-form-section-skeleton`s render with fields half, half, half, area and then are replaced by the sections, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Theming

- **AC-23** Given the dark theme, when a settings page renders, then sections are `--color-bg-surface` with `--color-border-strong` frames, the bar is `--color-bg-canvas`, and the summary is `--color-danger-bg` with `--color-danger-fg` title and links. (L2-104)
- **AC-24** Given both themes, when contrast is measured, then the summary title, links and text on its tint, the section lead and every status tone are at least 4.5:1, and the section frame and summary frame at least 3:1. (L2-103)
- **AC-25** Given a settings page and the booking request in invalid and submitting states in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Responsive

- **AC-26** Given a 360 px viewport, when the "Church" section renders, then every field is full width in DOM order. (L2-096)
- **AC-27** Given a 320 px viewport, when the actions bar shows "Church address outside the area · not saved" with "Discard" and "Save changes", then the status wraps above the buttons, nothing is clipped, and the page does not scroll horizontally. (L2-096)
- **AC-28** Given text zoomed to 200 %, when a long settings form renders, then every field and button stays reachable and the sticky bar never hides the focused field. (L2-096)
- **AC-29** Given the French catalogue, when section titles, statuses and summary links are about 30 % longer, then they wrap within their containers without clipping. (L2-111)

### Performance

- **AC-30** Given the `FormSection`, `FormActions`, `ErrorSummary` and `FormSectionSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. Build it in `frontend/projects/components/src/lib/form-layout/`:

- `form-section.ts` (`FormSection`, `zm-form-section`), host classes
  `form-section` and `form-section--danger`, `role="region"`,
  `aria-labelledby`. Render the title with one `@switch` on 2 and 3; the slots
  sit outside the switch, each declared once. The lead `<p>` is hidden with
  `:empty`.
- `form-section-skeleton.ts` (`FormSectionSkeleton`,
  `zm-form-section-skeleton`) using `zm-skeleton` blocks; its area block is a
  component class with `height: var(--space-32)`.
- `form-actions.ts` (`FormActions`, `zm-form-actions`), host classes
  `form-actions` and `form-actions--static`; the status is a
  `<span role="status">` with the dot or `zm-icon`.
- `error-summary.ts` (`ErrorSummary`, `zm-error-summary`), host class
  `error-summary`, `tabindex="-1"`, `id`, `aria-labelledby`, `hidden` when
  `items` is empty; `afterNextRender` focus when `autoFocus`; public `focus()`;
  link click handler that calls `preventDefault()`, focuses the field and
  emits `itemActivated`.
- `styles/form-layout.scss` with every layout class in the API table and the
  `html:has(…)` scroll padding (no busy fade, D-11); import it from
  `styles/index.scss`.
- Export the four components from `public-api.ts`.
- The [icon](icon.md) set needs `lock`; the [skeleton](skeleton.md) needs its
  `skeleton--control` modifier.
- Replace the hand-written `.error-summary` in
  `pages/discover/search-form/search-form.html` and its page styles with
  `zm-error-summary` (`headingLevel` 3, `autoFocus` false), keeping the
  existing first-invalid-field focus.
- Add the four perf-test scenarios.

## Decisions

- **D-1** *Components or classes?* Both. The section, actions bar and error summary have behaviour or structure worth guaranteeing (region naming, the status live region, focus and link handling), so they are components. The stack, grid, field span, fieldset and short-form classes are pure layout applied to page-owned elements and to other components' hosts (`zm-form-field class="field--full"`), so they are global utilities next to `.stack` and `.cluster`, which AGENTS.md allows.
- **D-2** *Every mock gives the error summary `role="alert"` (and `autofocus`); the design system forbids `role="alert"` because the summary would be read twice.* No `role="alert"`; the summary takes focus instead. The design system's Labelling section settles it explicitly, and focus already makes screen readers read the labelled container.
- **D-3** *L2-004 says a failed Discover search moves focus to the first invalid field; the design system says the summary takes focus.* Both, by form: `autoFocus` defaults to true for every form, and Discover sets it false and focuses the first invalid field, as L2-004 requires and the `pages/discover/invalid` mock shows (its summary has no `tabindex`). L2 outranks the design system where they differ, and only Discover's requirement says otherwise.
- **D-4** *The mocks use `h2`, `h3` and `p` for summary titles.* `h2` on pages and `h3` in dialogs and inside the booking bar, through `headingLevel`. A title is a heading in every case, so the summary appears in the heading list; `p` was inconsistent within the dialog mocks themselves.
- **D-5** *Does the status line always announce?* Yes, it is always `role="status"`. The account and profile mocks set it; the apply and booking mocks did not, but their statuses also change while sending ("Sending to Abigail", "Not sent · answers kept"), and a status region that does not change on load announces nothing extra.
- **D-6** *The apply mock puts `aria-busy` on a `.form-stack`, while the design system only describes `.form[aria-busy]`.* `aria-busy` is valid on every form layout (`.form`, `.form-stack`, `.form-grid`) and means the same thing; how the fields behave while busy is D-11.
- **D-7** *How is a focused field kept clear of the sticky actions bar (WCAG 2.4.11)?* With document `scroll-padding-bottom` of twice `--control-height-lg` while a sticky bar is rendered, set in CSS with `:has()`. It covers the bar wrapped onto two lines at XS and needs no script.
- **D-8** *Is `zm-form-section` a `<section>` element?* The host is the section, with `role="region"` and `aria-labelledby`, which is what a named `<section>` exposes. Keeping the block class on the host lets `.form-stack` place it and keeps an `id` given for the settings nav on the same element.
- **D-9** *The short-form classes (`.form`, `.form__row`, `.form__inline`, `.form__actions`) appear in no mock. Keep them?* Yes, as utilities. The design system specifies them with every state, they cost nothing until used, and leaving them out would make the first short form invent its own layout.
- **D-10** *Where does `.fieldset` live, given the checkbox and radio group components render fieldsets?* Here, as the layout class those components put on their fieldset or host. The class defines spacing, the legend and the grid span; the choice components define the choices.
- **D-11** *Do busy forms fade their fields, or set them read-only and disabled?* Read-only and disabled, as the busy mocks do (`pages/edit-profile/submitting`, `pages/apply/submitting`, `pages/account/submitting`, `pages/book/submitting` and the dialogs' `busy` states): text fields, textareas and date pickers are `readonly`; selects, file inputs, checkboxes and radios, which have no read-only state, are `disabled`; fieldsets are not disabled, values are kept and the submit is busy. The [text field](text-field.md), [textarea](textarea.md), [select](select.md), [checkbox](checkbox.md) and [radio group](radio-group.md) CRDs already specify this. The design system's 60 % fade on `.form[aria-busy] .field` is dropped: no form-layout busy mock shows it (the fade on auth cards belongs to the stub, and on dialogs to the dialog).
