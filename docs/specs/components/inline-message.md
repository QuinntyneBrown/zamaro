# Inline message

| Field | Value |
|---|---|
| Selector | `zm-inline-message` |
| Library path | `frontend/projects/components/src/lib/inline-message/` |
| Status | planned |
| Traces to | L2-019, L2-048, L2-081, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-110, L2-111 |
| Design system | [`inline-message.html`](../../design-system/components/inline-message.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/account/export-requested`](../../mocks/pages/account/export-requested.html), [`pages/account/export-ready`](../../mocks/pages/account/export-ready.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/admin-application/verified`](../../mocks/pages/admin-application/verified.html), [`dialogs/reject-application/default`](../../mocks/dialogs/reject-application/default.html), and the dialogs shown over these pages (see Usage) |
| Rendering | [`inline-message.html`](inline-message.html) |

## Purpose and scope

An inline message is one short line of status right where the person is
looking: under the date they picked ("Abigail is free Sat 14 Nov"), beside the
button it describes ("Verify both references before you approve."), under the
action it reports ("Requested today at 11:20 a.m. …"). It says one thing, with
an icon and a colour that agree, and its subject points at it with
`aria-describedby`.

Use something else when:

- the message needs a title, an action or more than one sentence →
  [alert](alert.md);
- it confirms an action with no on-screen subject (saving an artist from the
  lineup) → [toast](toast.md);
- it is a form field's own help or error under the control →
  [form field](form-field.md) (`.field__help`, `.field__error` with
  `aria-invalid`); a field that needs a status message projects this component
  into the field's message slot (D-3);
- it is a booking status → [stamp](stamp.md).

Out of scope:

- Setting `aria-describedby` and `aria-invalid` on the subject. The subject (the
  page, or the form field) owns them; the message only carries the `id`.
- Deciding which message to show (free, booked, verified). The page passes the
  variant and the words.
- Error summaries after a failed submit (forms pattern).

## Usage

The mocks render 15 inline messages on 9 screens; the design system adds the
hint, warning and danger rows. Every row is buildable with the API.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default` booking stub, under Event date (also behind `dialogs/photo-viewer`, `dialogs/report-review`, `notifications/share-toast`) | success, `live`, inside the date field's message slot, `id="date-help"` | "Abigail is free Sat 14 Nov" | success; busy "Checking Abigail's calendar…" while a new date is checked (design system) | stub (surface) |
| `pages/account/export-requested` | info, `block`, `live`, `id="data-status"`, described from the disabled "Download my data" button | "Requested today at 11:20 a.m. We'll email naomi.fraser@riversidecc.ca a link within 24 hours." | info | surface |
| `pages/account/export-ready` | success, `block`, `live`, same id | "Your file is ready. Download it until Fri 16 Oct, 11:24 a.m.; then it is deleted." | success, swapped in place from info | surface |
| `pages/admin-application/default`, `dialogs/reject-application/*` (page behind) | info, `block`, icon `shield`, `id="approve-help"`, described from the Approve button | "Verify both references before you approve." | info | raised panel |
| `pages/admin-application/verified` | success, `block`, same id | "Both references verified." | success, swapped in place | raised panel |
| Ticket body (design system) | warning | "Free until 1:00 p.m. only" | warning | ticket (surface) |
| Beside a button (design system) | success, after "Save changes" | "Saved at 2:14 p.m." | success | surface |
| Under a field before input (design system) | hint | "Most churches book 4–6 weeks ahead." | hint | surface |
| Outside a field (design system) | danger | "Abigail is booked Sat 21 Nov. Try another date." | danger | surface |
| Any status message on the stage | not supported: wrap in a light island (`data-theme="light"`) | — | — | — |

## Anatomy

1. **Icon** — a `zm-icon` at `size="sm"` (16 px), `aria-hidden="true"`, nudged
   `--space-0-5` down so it sits on the first line. Replaced by a small
   `zm-spinner` while `busy`.
2. **Message** — the projected text: bold caption (`--text-caption`,
   `--font-weight-bold`) in `--msg-fg`. One short sentence.
3. **Subject** (not part of the component) — the control or row whose
   `aria-describedby` lists the message's `id`.

Host: `zm-inline-message` is the message itself. It carries `.inline-msg` and
its variant modifier, the consumer's `id`, and `role="status"` when `live`. It
is `display: inline-flex`; with `block` it is `display: flex` so it takes its
own line like a paragraph.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'hint' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'hint'` | no | Adds `.inline-msg--{variant}`; hint adds no modifier. Sets `--msg-fg`. |
| `icon` | `IconName` | per variant | no | Overrides the leading icon. Defaults: hint `info`, info `info`, success `check`, warning `warning`, danger `warning`. The admin decision panel uses `shield`. |
| `block` | `boolean` (attribute) | `false` | no | Host `display: flex`; for a message that stands on its own line in a panel or section. |
| `live` | `boolean` (attribute) | `false` | no | Adds `role="status"` to the host so a change of text or variant is announced politely. The consumer keeps the same instance and changes its inputs; it never re-creates a live message (D-4). |
| `busy` | `boolean` | `false` | no | Shows a small `zm-spinner` in place of the icon and the hint colour, whatever the variant. The text is the checking copy ("Checking Abigail's calendar…"). |

The `id` is a plain attribute on the host (`id="date-help"`); the component
adds no input for it (D-2).

### Outputs

None. The message is not interactive.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text | One sentence, translated by the consumer (L2-111). No typed symbols such as ✓; the icon carries the tone. Declared once. |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Hint | — | Advice before anything goes wrong: "Most churches book 4–6 weeks ahead." |
| Info | `.inline-msg--info` | A fact the person needs: "Verify both references before you approve." |
| Success | `.inline-msg--success` | A check passed: "Abigail is free Sat 14 Nov", "Both references verified." |
| Warning | `.inline-msg--warning` | It will work, with a catch: "Free until 1:00 p.m. only". Never blocks. |
| Danger | `.inline-msg--danger` | It won't work as entered, outside a form field. Inside a field use the field's error. |

One size: a 12 px bold caption with a 16 px icon; `--space-1` between them. The
width is the container's; the message is never larger than its subject.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Variant colour and icon | Read after the subject's label and value, through `aria-describedby` |
| Busy | `busy = true` | Small spinner instead of the icon, `--color-fg-muted` text | With `live`, the checking text is announced |
| Changed | new `variant` or text on the same instance | Swaps in place, no transition | With `live`, the new text is announced once |
| Subject focused | subject `:focus-visible` | No change (the ring is the subject's) | Message read as the description |
| Subject invalid | subject `aria-invalid="true"` | Danger only; the field's error slot shows it | Read as the description |
| Subject disabled | subject `disabled` | No change: it describes a fact, not the control | Still the subject's description in the accessibility tree |
| Reduced motion | `prefers-reduced-motion: reduce` | The busy spinner holds still | Unchanged |

There is no hover, focus or disabled state of the message itself.

## Markup

Rendered, by variant:

```html
<zm-inline-message class="inline-msg inline-msg--success" id="date-help" role="status">
  <zm-icon><svg class="icon icon--sm" aria-hidden="true" focusable="false" viewBox="0 0 24 24">…check…</svg></zm-icon>Abigail is free Sat 14 Nov
</zm-inline-message>

<zm-inline-message class="inline-msg">…info…Most churches book 4–6 weeks ahead.</zm-inline-message>

<zm-inline-message class="inline-msg inline-msg--info" id="approve-help" style="display: flex">…shield…Verify both references before you approve.</zm-inline-message>
```

Warning and danger add `.inline-msg--warning` or `.inline-msg--danger` and the
warning icon; the structure is the same. `block` is a host style, not a class.

Busy:

```html
<zm-inline-message class="inline-msg" id="date-help" role="status">
  <zm-spinner aria-hidden="true"><span class="spinner spinner--sm" aria-hidden="true"></span></zm-spinner>Checking Abigail's calendar…
</zm-inline-message>
```

Consumer templates:

```html
<!-- Booking stub: the date field's message slot (form-field CRD) -->
<zm-inline-message slot="message" id="date-help" live [variant]="dateCheck() === 'free' ? 'success' : 'hint'" [busy]="dateCheck() === 'checking'">
  {{ dateMessage() }}
</zm-inline-message>

<!-- Data export: the button points at the message -->
<zm-button [disabled]="exportRequested()" describedBy="data-status">{{ 'account.data.download' | transloco }}</zm-button>
<zm-inline-message id="data-status" block live [variant]="exportReady() ? 'success' : 'info'">{{ exportStatus() }}</zm-inline-message>

<!-- Admin decision panel -->
<zm-inline-message id="approve-help" block [variant]="bothVerified() ? 'success' : 'info'" [icon]="bothVerified() ? 'check' : 'shield'">{{ approveHelp() }}</zm-inline-message>
```

The `.inline-msg` classes and the `id` are a contract: e2e page objects read a
subject's description through its `aria-describedby` and check the message's
class for its tone. The `zm-icon` internals are free to change.

## Design

- Layout: `inline-flex` (or `flex` with `block`), `align-items: flex-start`, gap
  `--space-1`.
- Text: `--text-caption`, `--font-weight-bold`, colour `--msg-fg`.
- Icon: 16 px (`zm-icon size="sm"`), `flex: none`, `margin-top: --space-0-5`.
  The busy spinner is `zm-spinner size="sm"` with the same nudge.
- Distance from the subject: at least `--space-1`, which `.field` and the
  parent's stack provide.
- No border, fill, shadow, motion or layer.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--msg-fg` | `--color-fg-muted` | `.inline-msg--info` → `--color-info-fg`, `--success` → `--color-success-fg`, `--warning` → `--color-warning-fg`, `--danger` → `--color-danger-fg`; `busy` → `--color-fg-muted` |

These are the text-safe status foregrounds, not the icon colours, because the
message is text.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Hint text and icon | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Info | `--color-info-fg` | `--palette-ink-750` | `--palette-ink-100` |
| Success | `--color-success-fg` | `--palette-green-700` | `--palette-green-300` |
| Warning | `--color-warning-fg` | `--palette-amber-700` | `--palette-amber-300` |
| Danger | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` |

The rendering shows the live resolved values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Hint on a card or stub |
| `--color-info-fg` | `--color-bg-surface` | 4.5:1 | Info |
| `--color-success-fg` | `--color-bg-surface` | 4.5:1 | Success |
| `--color-warning-fg` | `--color-bg-surface` | 4.5:1 | Warning |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Danger |
| `--color-danger-fg` | `--color-bg-canvas` | 4.5:1 | Danger on the page |
| `--color-success-fg` | `--color-bg-surface-raised` | 4.5:1 | Success in a raised panel |

Messages never sit on the stage or on yellow; there they go in a light island.
Under forced colours the text and icon follow the system text colour, so the
icon shape and the words carry the tone.

## Responsive behaviour

- The message wraps under its own first line and never truncates; the icon stays
  aligned with the first line (`align-items: flex-start`).
- Under a field it takes the field's width; beside a button in a cluster it wraps
  onto its own line on phones and stays directly after the button in the DOM.
- On a ticket it sits in the body column, above the perforated stub on phones.
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom the text wraps
  and stays readable. The message is not a touch target.

## Accessibility

### Role and pattern

A plain element referenced by its subject's `aria-describedby`; no APG widget
applies. With `live` it is a `role="status"` region present from the start, so a
change is announced politely (WCAG 4.1.3).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the message; it is read when its subject receives focus. |

### Focus

Never move focus to a message. On a failed submit, focus goes to the error
summary or the first invalid field.

### Labelling

The words carry the meaning, so no "Success:" prefix and no typed ✓ (a screen
reader reads "check mark"). The icon is decorative. A subject with both help and
a message lists both ids in `aria-describedby`, message first.

### Announcements

Only with `live`: the first render of a live message is not announced as a
change, later changes are. The booking stub's check announces "Checking
Abigail's calendar…" and then "Abigail is free Sat 14 Nov".

### Motion

None: the message swaps in place. The busy spinner stops turning under reduced
motion ([spinner](spinner.md)).

## Content and internationalisation

- One sentence, ideally under 40 characters under a stub field. Drop the full
  stop for fragments ("Abigail is free Sat 14 Nov"); keep it for full sentences
  ("Both references verified.").
- Name the person and the date: "Abigail is free Sat 14 Nov", "Abigail is booked
  Sat 21 Nov. Try another date." (L2-019).
- Errors say how to fix it; hints give advice the label does not.
- Dates "Sat 14 Nov" and "Fri 16 Oct, 11:24 a.m.", times "2:14 p.m." (L2-110).
- Translatable: all slot text, from the catalogue with interpolated names, dates
  and email addresses (L2-111). French runs about 30 % longer; the message wraps.

## Performance

- Change detection: `OnPush`, signal inputs; the icon name and classes are
  `computed`. No subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/InlineMessage.ts`
  renders the booking stub's success message "Abigail is free Sat 14 Nov";
  iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep it at
  roughly 100–300 ms.
- Composite scenarios: `BookingForm.ts`, once the stub's date message uses this
  component.
- Layout stability: the busy spinner and the icon are both 16 px, so swapping
  between checking and the result does not move the line's start.
- Imports: `zm-icon`, `zm-spinner`.

## Acceptance criteria

### Rendering

- **AC-1** Given the booking stub on Abigail Mensah's profile and a free date, when the message renders with `variant` "success", then it has `.inline-msg.inline-msg--success`, a 16 px check icon and the text "Abigail is free Sat 14 Nov", with no typed ✓ character. (L2-019)
- **AC-2** Given the stub's date field with `aria-describedby="date-help"`, when a screen reader focuses the field, then it reads "Event date", the date, then "Abigail is free Sat 14 Nov". (L2-102)
- **AC-3** Given the five variants, when they render, then each has its own colour and its default icon (hint and info: info, success: check, warning and danger: warning), so the tone never depends on colour alone. (L2-100)
- **AC-4** Given Naomi has requested her data, when the info message "Requested today at 11:20 a.m. We'll email naomi.fraser@riversidecc.ca a link within 24 hours." renders with `block` and `live`, then it sits on its own line under the disabled "Download my data" button, which lists `data-status` in `aria-describedby`. (L2-081)
- **AC-5** Given the export is ready, when the same message instance changes to `variant` "success" and "Your file is ready. Download it until Fri 16 Oct, 11:24 a.m.; then it is deleted.", then the line swaps in place with a check icon and the new text is announced once. (L2-081)
- **AC-6** Given Tobi Adeyemi's application with unverified references, when the decision panel renders the info message with `icon` "shield", then it reads "Verify both references before you approve." and the Approve button's `aria-describedby` points at `approve-help`. (L2-048)
- **AC-7** Given both references are verified, when the message changes to success with the check icon and "Both references verified.", then it keeps `id="approve-help"` and the Approve button now reads it as its description. (L2-048)

### States

- **AC-8** Given a booker picks a new date in the stub, when the availability check runs and `busy` is true, then the message shows a small spinner instead of the icon, the muted colour and "Checking Abigail's calendar…", and keeps `id="date-help"`. (L2-019)
- **AC-9** Given a live message, when its text or variant changes, then the change is announced politely through the host's `role="status"`; a message without `live` has no role and announces nothing. (L2-102)
- **AC-10** Given a disabled subject (the "Download my data" button), when it renders, then the message keeps its variant colour. (L2-081)

### Keyboard and focus

- **AC-11** Given a page with a message after a button, when the user tabs, then focus moves from the button to the next control without stopping on the message, and no change of the message moves focus. (L2-101)

### Screen readers

- **AC-12** Given every route that shows an inline message, in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-13** Given the dark theme, when the five variants render on a card, then each uses its dark status foreground and stays legible on the charcoal surface. (L2-104)
- **AC-14** Given both themes, when contrast is measured, then hint, info, success, warning and danger text are each at least 4.5:1 on `--color-bg-surface`, and danger at least 4.5:1 on `--color-bg-canvas`. (L2-103)

### Responsive

- **AC-15** Given a 320 px viewport and "Your file is ready. Download it until Fri 16 Oct, 11:24 a.m.; then it is deleted.", when the message renders, then it wraps under its first line, the icon stays beside the first line, nothing is truncated and the page does not scroll horizontally. (L2-096)
- **AC-16** Given 200 % text zoom, when the stub's message renders, then it wraps and remains fully readable. (L2-096)
- **AC-17** Given the French catalogue, when a message is about 30 % longer, then it wraps within its container without clipping. (L2-111)

### Motion

- **AC-18** Given `prefers-reduced-motion: reduce` and a busy message, when it renders, then the spinner does not rotate and the message changes to its result without any transition. (L2-103)

### Formatting

- **AC-19** Given a ready export at 11:24 a.m. on Fri 16 Oct passed formatted, when the message renders, then it reads "Fri 16 Oct, 11:24 a.m.". (L2-110)

### Performance

- **AC-20** Given the `InlineMessage` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned window. (L2-086)

## Implementation notes

The inline message is planned. To build it:

- Folder `frontend/projects/components/src/lib/inline-message/`, file
  `inline-message.ts`, class `InlineMessage`, selector `zm-inline-message`;
  export it from `public-api.ts`.
- Host bindings: `class` `inline-msg` plus `inline-msg--{variant}` (none for
  hint and while `busy`), `role` `status` when `live`, `display: flex` when
  `block`.
- Template: `@if (busy()) { <zm-spinner size="sm" /> } @else { <zm-icon [name]="iconName()" size="sm" /> }`
  then one `<ng-content />` outside the `@if`.
- Copy the `.inline-msg` rules from `components.css`, with the icon at
  `--space-0-5` top margin.
- Needs from [icon](icon.md): `info`, `check`, `warning`, `shield`. Needs from
  [form field](form-field.md): a message slot whose element id the control lists
  first in `aria-describedby` (D-3).
- Replace the booking stub's typed "✓" help text with this component when the
  stub slice is built (D-1).
- Add the perf-test scenario `InlineMessage.ts` and export it from
  `scenarios/index.ts`.

## Decisions

- **D-1** *L2-019.2 says the stub shows "✓ {first name} is free {date}"; the design system forbids a typed ✓. Which wins?* The ✓ is the success check icon, and the text is "Abigail is free Sat 14 Nov". Both sources agree on what the person sees (a check mark and the sentence); the design system fixed the typed character because screen readers read it as "check mark" and muted help text hid the tone. To confirm with the user.
- **D-2** *An `id` input, or a plain attribute?* A plain attribute on the host. The host is the message element, so the native `id` is exactly what `aria-describedby` needs; an input would only copy it.
- **D-3** *How does the stub's success message compose with `zm-form-field`, which owns `.field__help` and `.field__error`?* The field offers a message slot and lists the slotted element's id first in the control's `aria-describedby`; the stub projects `zm-inline-message` there. The field's error slot stays the field's own, because only it sets `aria-invalid`. The mock's extra `field__help` class on the message is dropped: `.inline-msg` sets its own type.
- **D-4** *How is a changing message announced?* `live` puts `role="status"` on the host, and the consumer changes the inputs of the same instance (info → success on the export, checking → free in the stub). A live region inserted with its text is not announced reliably, and the design system requires the status element to exist before the change.
- **D-5** *Checking state: the design system's step table uses a separate `.spinner-inline.text-caption` line; is it a different element?* No, it is the same message with `busy`. Keeping one element keeps the `id` the field points at and the live region, so the result replaces the checking text in place; the type and colour match the hint, which the step table's caption also shows.
- **D-6** *Icon size: the mocks use both 20 px and 16 px.* 16 px (`zm-icon size="sm"`), as the design system's anatomy and sizes specify; a message is never larger than its subject. The 20 px icons in export-requested and the admin panel are drift.
- **D-7** *`<p>` or `<span>`?* Neither: the host is the element, `inline-flex` by default and `flex` with `block`. The mocks used `<p>` for standalone lines and `<span>` beside controls only for layout; the `block` input gives the same layout without changing the element.
- **D-8** *The design system's danger example reads "Abigail isn't free Sat 21 Nov. Pick another date."; L2-019.3 says "{first name} is booked {date}. Try another date."* The L2 copy is used. Copy belongs to the consumer, and L2 is the requirement; inside the stub this message is the date field's error (form field), not this component.
