# Status stamp

| Field | Value |
|---|---|
| Selector | `zm-stamp` |
| Library path | `frontend/projects/components/src/lib/stamp/` |
| Status | planned |
| Traces to | L2-022, L2-029, L2-033, L2-034, L2-047, L2-068, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`stamp.html`](../../design-system/components/stamp.html) |
| Source mocks | [`pages/bookings/default`](../../mocks/pages/bookings/default.html), [`pages/bookings/past`](../../mocks/pages/bookings/past.html), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html) and its other states, [`pages/requests/default`](../../mocks/pages/requests/default.html), [`pages/request-detail/default`](../../mocks/pages/request-detail/default.html), [`pages/admin-bookings/default`](../../mocks/pages/admin-bookings/default.html), [`pages/apply/success`](../../mocks/pages/apply/success.html), [`pages/verify-email/expired`](../../mocks/pages/verify-email/expired.html), and every other screen in Usage |
| Rendering | [`stamp.html`](stamp.html) |

## Purpose and scope

The status stamp prints where a booking stands, like a rubber stamp pressed on
a tour book: Requested, Accepted, Confirmed, Completed, or one of the exits
Declined, Withdrawn, Expired and Cancelled (L2-029). Every booking status in the
product is a stamp, wherever the booking appears: Naomi's bookings list,
Abigail's requests inbox, the head of one booking or request, an admin table, a
receipt row, the calendar list. Both sides of a booking see the same word.

The stamp also prints the one-word verdict of a record that is not a booking:
an application "Submitted", a link "Expired", a profile "40%" complete. It is
read-only text; it never acts.

Use something else when:

- it is a count, availability, a payment state or any state outside the booking
  lifecycle ("3", "Free Sat 14 Nov", "Held", "Deposit held") → [badge](badge.md);
- the status needs a sentence or a next step ("Pay the $162.50 deposit by Mon 12
  Oct") → [inline message](inline-message.md) or [alert](alert.md) beside the
  stamp, not instead of it;
- it is the list of bookings itself → [booking list](booking-list.md).

Out of scope:

- Choosing the status. The page maps the booking's status from the API to the
  `status` input; the stamp never derives it from dates or payments.
- Announcing a status change. The page's toast or status region announces it
  ([toast](toast.md)); the stamp is only replaced.
- Layout around the stamp: the page head's flex row, the `.cluster` with a
  "Held" badge, the row's status line ([booking list](booking-list.md)).
- The loading placeholder. The page renders a [skeleton](skeleton.md) with
  `shape="stamp"` in the stamp's place.

## Usage

The mocks print about 345 stamps on 60 screens. Each row is one configuration;
the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/bookings/default`, `bookings/past` rows | default size, in `.booking-list__status` before the next action | "Confirmed", "Requested", "Accepted"; "Withdrawn", "Declined", "Completed" | every status | row (surface) |
| `pages/bookings/loading` | not rendered: `zm-skeleton shape="stamp"` in its place | — | loading | row |
| `pages/requests/default`, `requests/no-results`, `pages/dashboard/default` "Needs your reply", `notifications/request-toast/*` (behind) | default, before the reply deadline caption | "Requested", "Confirmed", "Declined", "Completed" | default | row |
| `pages/booking-detail/*` page head (default, accepted, confirmed, completed, declined, withdrawn, expired, deposit-expired, cancelled, artist-cancelled, balance-due, balance-failed, held) | `lg`, after the title block | all eight statuses | every status | canvas |
| `pages/request-detail/*` page head (Abigail's side of the same bookings) | `lg` | all eight statuses | every status | canvas |
| `pages/book/success` panel head | `lg`, after "Booking ZAM-0114" | "Requested" | default | raised panel |
| Dialogs over a booking or request page (`accept-request`, `decline-request`, `withdraw-request`, `pay-deposit`, `pay-balance`, `cancel-booking`, `artist-cancel-booking`, `write-review`, `report-problem`, `issue-refund`, `resolve-hold`, `menu`) and `notifications/booking-toast/*` | `lg`, inert behind the dialog or toast | "Requested", "Accepted", "Confirmed", "Completed" | inert | canvas |
| `pages/availability/default` "In November", `dialogs/block-dates`, `dialogs/calendar-feed`, `dialogs/weekly-default`, `notifications/availability-toast/*` | default, trailing a [tour dates](tour-dates.md) row | "Confirmed", "Requested" | default | canvas |
| `pages/admin-artist/default` and `suspended`, `dialogs/suspend-artist`, `dialogs/reinstate-artist` | default, trailing a tour-dates row | "Requested", "Accepted", "Confirmed", "Declined" | default | panel |
| `pages/admin-bookings/default`, `held` status column | `flat`, in a table cell; "Held" warning badge beside it in held | all statuses | default | table |
| `pages/admin-booking/*` page head | `lg`, with a "Held" badge in a `.cluster` in held | "Confirmed", "Completed" | default | stage page head |
| `dialogs/delete-account/blocked` receipt row | `flat`, right-aligned in the `dd` | "Confirmed" | default | dialog |
| `pages/apply/success` panel head | `lg`, no status | "Submitted" | default | raised panel |
| `pages/edit-profile/empty` panel head | `flat`, no status | "40%" | default | panel |
| `pages/verify-email/expired`, `confirm-email/expired`, `reset-password/expired`, `data-export/expired` | `lg` `expired`, in a paragraph of the auth card | "Expired" | default | auth card (surface) on the poster |

## Anatomy

1. **Stamp** — the host, `.stamp` plus its modifiers. An inline-flex box with a
   2 px rule and a 1 px outline 2 px outside it, both `currentColor`, rotated
   −2° (−4° large, 0° flat).
2. **Ink square** — `.stamp::before`, half an em square in `currentColor`. A
   shape cue so the status never depends on colour alone. Generated by CSS.
3. **Word** — the projected text: one L2-029 word, or one outcome word or number.
   Mono overline, uppercase by CSS, stamp tracking; display face when large.

Host: `zm-stamp` is the stamp itself. The host carries `.stamp` and every
modifier and is `display: inline-flex`. It renders no inner element: its
template is the content slot, so the DOM is `<zm-stamp class="stamp
stamp--accepted">Accepted</zm-stamp>`. Classes a parent puts on the host stay on
it.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `status` | `StampStatus \| null` | `null` | no | `'requested' \| 'accepted' \| 'confirmed' \| 'completed' \| 'declined' \| 'withdrawn' \| 'expired' \| 'cancelled'`. Adds `.stamp--{status}`. `null` adds no status modifier: the ink-on-paper stamp for outcomes that are not booking statuses ("Submitted", "40%"). |
| `size` | `'md' \| 'lg'` | `'md'` | no | `'lg'` adds `.stamp--lg`. Once per page, in the page head of one booking, request, application or expired link. |
| `flat` | `boolean` (attribute) | `false` | no | Adds `.stamp--flat`: no rotation. For table cells, receipt rows and panel heads where a tilt fights the alignment. Combines with either size. |

`StampStatus` is exported from the stamp's file. The legacy `.stamp--paid` and
`.stamp--done` classes are never produced.

### Outputs

None. The stamp is static text.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text | The word. With a `status`, it is that status's catalogue word ("Accepted" for `accepted`), so both sides of a booking read the same. Without a `status`, one past-tense word or a number. Declared once. |

The stamp hard-codes no copy (L2-111): the consumer projects the translated word.

## Variants and sizes

| Variant | Modifier | Look | Use for |
|---|---|---|---|
| Requested | `.stamp--requested` | Ink on paper | The church has asked; the artist has 72 hours (24 inside 7 days) to reply. |
| Accepted | `.stamp--accepted` | Success green on paper | The artist said yes; the deposit is due within 48 hours. |
| Confirmed | `.stamp--confirmed` | Ink on yellow | The deposit is paid; the date is booked. |
| Completed | `.stamp--completed` | Muted ink | 24 hours after the event started. |
| Declined | `.stamp--declined` | Danger red | The artist said no, or another church booked the date. |
| Withdrawn | `.stamp--withdrawn` | Muted ink | The church withdrew before confirming. |
| Expired | `.stamp--expired` | Warning amber | No reply or no deposit before the deadline; also an expired email or download link. |
| Cancelled | `.stamp--cancelled` | Muted ink, struck through | A Confirmed booking was cancelled by either side. |
| Outcome | — | Ink on paper | Records outside the lifecycle: "Submitted", "40%". |

| Size | Modifier | Type | Padding | Rotation |
|---|---|---|---|---|
| Default | — | `--text-overline`, `--letter-spacing-stamp` | `--space-0-5` block, `--space-2` inline | −2° |
| Large | `.stamp--lg` | `--font-size-2xl` in `--font-family-display`, line height 1, `--letter-spacing-wide` | `--space-1` block, `--space-3` inline | −4° |
| Flat (either size) | `.stamp--flat` | as the size | as the size | 0° |

The width comes from the word; the stamp never stretches.

## States

A stamp is not interactive: it has no hover, focus, active or disabled state.
Its states are the statuses themselves, plus these lifecycle moments.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Each status | `status` | The variant's colour, square and rule; Cancelled struck through | The word, read as text |
| Outcome | `status = null` | Ink on paper | The word |
| Loading | the page renders `zm-skeleton shape="stamp"` instead | A skeleton bar the stamp's size, no guessed status | Hidden; the page's status line speaks |
| Changed | the page passes a new `status` and word | The stamp is replaced in one step, no transition | Nothing from the stamp; the page's toast or status region announces the change |
| Inert | an open dialog makes the page `inert` | Unchanged | Not reachable |
| Forced colours | `forced-colors: active` | Word, square, rule and outline in `CanvasText`; Confirmed's fill becomes `Canvas`; the strike-through stays | The word |

## Markup

Rendered by `zm-stamp`, default size in a list row:

```html
<zm-stamp class="stamp stamp--accepted">Accepted</zm-stamp>
```

Large in a page head, and flat in a table cell:

```html
<header class="page-head">
  <div><h1 class="page-head__title">Worship night with Abigail Mensah</h1><p class="page-head__sub">Sat 14 Nov 2026 · 7:00 p.m. · Burlington</p></div>
  <zm-stamp class="stamp stamp--requested stamp--lg">Requested</zm-stamp>
</header>

<td><zm-stamp class="stamp stamp--accepted stamp--flat">Accepted</zm-stamp></td>
```

An outcome with no status:

```html
<zm-stamp class="stamp stamp--lg">Submitted</zm-stamp>
<zm-stamp class="stamp stamp--flat">40%</zm-stamp>
```

Each status adds only its modifier; the structure is the same. Modifier order
in the class list carries no meaning (the mocks write both orders).

Consumer templates:

```html
<zm-stamp [status]="booking.status">{{ 'booking.status.' + booking.status | transloco }}</zm-stamp>
<zm-stamp [status]="booking.status" size="lg">{{ 'booking.status.' + booking.status | transloco }}</zm-stamp>
<zm-stamp [status]="row.status" flat>{{ 'booking.status.' + row.status | transloco }}</zm-stamp>
<zm-stamp size="lg">{{ 'apply.success.stamp' | transloco }}</zm-stamp>
```

The `.stamp` and `.stamp--{status}` classes and the visible word are a
contract: the e2e page objects read a booking's status from the stamp's text
and check its modifier.

## Design

- Box: `display: inline-flex`, `align-items: center`, gap `--space-1` between
  the square and the word, `white-space: nowrap`.
- Rule `--border-width-thick` solid `currentColor`; outline
  `--border-width-hairline` solid `currentColor` at an offset of
  `--border-width-thick`. Square corners.
- Fill `--color-bg-surface`; text `currentColor` from the status (see Colour).
- Type: default `--text-overline` with `--letter-spacing-stamp`, uppercase; large
  `--font-weight-regular` `--font-size-2xl` / 1 `--font-family-display` with
  `--letter-spacing-wide`.
- Square: `::before`, `0.5em` × `0.5em`, `currentColor`, so it scales with the
  size.
- Rotation through the `rotate` property: −2° default, −4° large, 0 flat. The
  rotation never changes the layout box, so neighbours do not move.
- Cancelled: `text-decoration: line-through`.
- No motion, no shadow, no layer of its own. Inside a stretched-link row the
  stamp stays below the link (D-4).

The stamp declares no component tokens. Each modifier sets `color` (and
Confirmed the fill) from a semantic token, and every part reads
`currentColor`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill (every status but Confirmed) | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Requested, outcome | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Accepted | `--color-success-fg` | `--palette-green-700` | `--palette-green-300` |
| Confirmed fill / ink | `--color-accent` / `--color-fg-on-accent` | `--palette-signal-500` / `--palette-ink-750` | `--palette-signal-500` / `--palette-ink-750` |
| Completed, Withdrawn, Cancelled | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Declined | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` |
| Expired | `--color-warning-fg` | `--palette-amber-700` | `--palette-amber-300` |

The default stamp is 12 px text, so every status needs the full 4.5:1 against
its own fill. The rules are the same colour as the text, so they clear the 3:1
non-text minimum with it.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Requested, outcome |
| `--color-success-fg` | `--color-bg-surface` | 4.5:1 | Accepted |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Confirmed |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Completed, Withdrawn, Cancelled |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Declined |
| `--color-warning-fg` | `--color-bg-surface` | 4.5:1 | Expired |
| `--color-success-fg` | `--color-bg-canvas` | 4.5:1 | Accepted rule against the page (the outline sits on the canvas) |
| `--color-warning-fg` | `--color-bg-canvas` | 4.5:1 | Expired rule against the page |

Under forced colours every part follows `CanvasText` and the yellow fill drops
to `Canvas`; the word and the square still say the status.

## Responsive behaviour

- The stamp never wraps (`white-space: nowrap`) and keeps its size at every
  breakpoint. The longest word, "Withdrawn", is about 7 rem at the default size
  and fits every row and table cell at 320 px.
- In a [booking list](booking-list.md) row it sits in the status line under the
  meta below MD and in the right-hand status column from MD; the row owns that
  move.
- In a page head the large stamp wraps under the title block on narrow screens:
  the head is a wrapping flex row, so nothing overflows at 320 px (L2-096).
- The rotation adds about 0.1 rem of overhang at each corner; the consumer keeps
  at least `--space-1` around the stamp so the outline is never clipped by an
  `overflow: hidden` ancestor.
- At 200 % zoom the stamp grows with the text and the row or head wraps around
  it.
- Nothing to tap, so the 44 px target rule does not apply.

## Accessibility

### Role and pattern

A plain inline element with the status as visible text. No role, no
`aria-label`, no live region: the word is the information. No APG pattern
applies. When the stamp sits apart from what it describes (a page head), the
heading or row it belongs to comes first in the DOM, so it reads "Worship night
with Abigail Mensah … Requested".

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the stamp; it is never focusable and has no `tabindex`. Any action ("Pay $225 deposit", "Leave a review") is a real button beside it. |

### Focus

None. The stamp never takes focus and never moves it.

### Labelling

The word is the label. The ink square and the strike-through are CSS, so they
add nothing to the accessible text, and status never depends on colour alone
(WCAG 1.4.1): every status prints its word and the square. Never replace the
word with an icon or add a "Status:" prefix inside the stamp; a table column
header or the row context supplies it.

### Announcements

None. When a status changes while the page is open (Abigail accepts), the page
replaces the stamp and announces the change through its toast ("Abigail
accepted") or status region.

### Motion

None. The tilt is static and nothing animates when the status changes, so
`prefers-reduced-motion` changes nothing.

## Content and internationalisation

- With a status, use the L2-029 word exactly, in sentence case in the source
  ("Requested"); CSS uppercases it. Never "Pending", "Paid", "Done" or "Awaiting
  deposit".
- One word. Deadlines, amounts and next steps go beside the stamp in text: "1 day
  left · reply by Sat 10 Oct, 3:15 p.m." (L2-110 formats).
- The same word on both sides of a booking: Naomi and Abigail both see
  "Accepted".
- Without a status: one past-tense word or a number ("Submitted", "Expired" for a
  link, "40%").
- Translatable: the word, from the catalogue (`booking.status.{status}`,
  `apply.success.stamp`…). Data values: none; even "40%" is formatted by the
  page.
- French status words run longer ("Confirmée", "Annulée", "Retirée", "Expirée"):
  the stamp grows, never wraps, and the row's status line wraps the action
  under it instead.

## Performance

- Change detection: `OnPush`, signal inputs. The host class list is one
  `computed` from `status`, `size` and `flat`; the template is a single
  `<ng-content />`. No subscriptions, no `effect`, no imports.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Stamp.ts`
  renders the default "Accepted" stamp from Luz Viva's row on Naomi's bookings
  (`status="accepted"`); iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly 100–300 ms.
- Composite scenarios: `BookingList.ts` and `RequestsInboxRow.ts` (the
  "requests inbox row" composite) render stamps in rows ([booking
  list](booking-list.md)); `DarkTheme.ts` wraps them in `data-theme="dark"`.
- Regression rule: a change to the stamp's template, inputs or styles runs the
  perf test against the base branch with `--fail-on-regression` before it is
  pushed.
- Layout stability: the skeleton stamp (`zm-skeleton shape="stamp"`, 96 × 24 px)
  matches the default stamp's box, so the swap shifts nothing (L2-105). The
  rotation uses `rotate`, which never moves neighbours.
- Weight: no dependencies.

## Acceptance criteria

### Rendering

- **AC-1** Given each of the eight statuses with its word ("Requested", "Accepted", "Confirmed", "Completed", "Declined", "Withdrawn", "Expired", "Cancelled"), when a stamp renders, then the host has `.stamp` and `.stamp--{status}`, shows the word uppercased by CSS with the source text in sentence case, and shows the ink square before it. (L2-029)
- **AC-2** Given ZAM-0114 Accepted, when Naomi's booking page and Abigail's request page render, then both show a large stamp with the word "Accepted" and the class `.stamp--accepted`. (L2-029)
- **AC-3** Given a Cancelled booking, when its stamp renders, then the word is struck through and drawn in `--color-fg-muted`. (L2-029)
- **AC-4** Given Naomi's upcoming bookings, when the list renders, then Marcus Bell Trio's row shows "Confirmed", Abigail Mensah's "Requested" and Luz Viva's "Accepted" in the row's status line before the next action. (L2-033)
- **AC-5** Given Abigail's requests inbox, when Harvest Point Church's row renders, then it shows a default "Requested" stamp followed by "1 day left · reply by Sat 10 Oct, 3:15 p.m." as text outside the stamp. (L2-034)
- **AC-6** Given the admin bookings table, when ZAM-0088 renders, then its status cell holds a flat "Accepted" stamp with `.stamp--flat` and no rotation. (L2-068)
- **AC-7** Given `size="lg"` on the booking page head, when the stamp renders, then it uses the display face at `--font-size-2xl`, padding `--space-1` by `--space-3` and a −4° rotation. (L2-029)
- **AC-8** Given Tobi Adeyemi's submitted application, when the success panel renders, then it shows a large stamp "Submitted" with `.stamp` and no status modifier. (L2-047)
- **AC-9** Given a verification link opened after 24 hours, when the expired page renders, then it shows a large `.stamp--expired` stamp "Expired" under the heading "This link has expired". (L2-022)

### States

- **AC-10** Given Naomi's bookings while they load, when the rows render, then each status slot holds a skeleton stamp the size of a default stamp and no stamp with a guessed status is shown. (L2-105)
- **AC-11** Given the skeleton rows replaced by loaded rows, when the swap is measured, then the cumulative layout shift from the stamps is 0. (L2-105)
- **AC-12** Given a booking page open on ZAM-0114 Requested, when the status changes to Accepted, then the stamp is replaced in one step with no transition, and the stamp itself has no `role`, `aria-live` or `aria-atomic`. (L2-102)

### Keyboard and focus

- **AC-13** Given a booking list row with a stamp and a "Message" button, when the booker tabs through the row, then focus moves from the name link to "Message" and never lands on the stamp. (L2-101)

### Screen readers

- **AC-14** Given Abigail's booking page head, when it is read by a screen reader, then the heading "Worship night with Abigail Mensah" is read before the stamp, and the stamp is read as the plain text "Requested" with no extra name or prefix. (L2-102)
- **AC-15** Given every status in forced-colours mode, when the stamps render, then each still shows its word, its ink square and its rule, and Cancelled stays struck through. (L2-100)
- **AC-16** Given Naomi's upcoming and past bookings in both themes, when axe-core runs, then the stamps add no serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the dark theme, when the eight stamps render, then each is printed on `--color-bg-surface` charcoal in its status colour, and Confirmed keeps the `--color-accent` yellow fill with `--color-fg-on-accent` ink. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then every status word is at least 4.5:1 against its own fill, and the rule and outline are at least 3:1 against the fill and the page. (L2-103)

### Responsive

- **AC-19** Given a 320 px viewport, when a "Withdrawn" stamp renders in a booking list row and a large "Requested" stamp in a page head, then neither wraps or clips, the large stamp moves under the title block, and the page does not scroll horizontally. (L2-096)
- **AC-20** Given the French catalogue, when the eight words render at the default size in a booking list row at 360 px, then each stays on one line and the row's action wraps under it rather than overlapping it. (L2-111)

### Motion

- **AC-21** Given `prefers-reduced-motion: reduce`, when a stamp renders or changes status, then nothing animates and the tilt is unchanged. (L2-103)

### Performance

- **AC-22** Given the `Stamp`, `BookingList` and `RequestsInboxRow` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The stamp is planned. To build it:

- Folder `frontend/projects/components/src/lib/stamp/`, file `stamp.ts`, class
  `Stamp`, selector `zm-stamp`; export `Stamp` and `StampStatus` from
  `public-api.ts`.
- Host bindings only: `class: 'stamp'` plus a `computed` class string for the
  status, `stamp--lg` and `stamp--flat`. Template `<ng-content />`.
- Copy the `.stamp*` rules from `components.css` into `:host` styles
  (`:host(.stamp--accepted)`…), including the L2-029 colour rules for
  Requested, Completed and Withdrawn that sit in the integration block; leave
  out `.stamp--paid` and `.stamp--done`.
- Add `@media (forced-colors: active)` rules: `forced-color-adjust: auto`, the
  Confirmed fill to `Canvas`, so the outline and square stay visible.
- Add the perf-test scenario `Stamp.ts` and export it from `scenarios/index.ts`.
- The skeleton stand-ins are the [skeleton](skeleton.md)'s: `shape="stamp"`
  (96 × 24 px) for a default stamp, and for the large stamp `shape="none"` with a
  `--space-10` height and `width="short"`, as `pages/booking-detail/loading` draws
  it (D-6).

## Decisions

- **D-1** *Does the stamp render its own word from `status`, or take it as content?* As content. Copy never lives in the component (L2-111), outcome stamps ("Submitted", "40%") have no status to derive a word from, and projecting the word keeps the API the same as the button's. The consumer projects the catalogue word for the status.
- **D-2** *Host or inner element?* The host is the stamp. A stamp is one inline box with no inner structure, so a wrapper span would only add a node to every row; the BEM classes on the host keep the e2e contract.
- **D-3** *Where does the status type live?* `StampStatus` is declared in the components library with the eight L2-029 values, so the library does not depend on the API library's models. The page maps the API's booking status onto it.
- **D-4** *Is the stamp raised above a row's stretched link, as the design-system CSS does (`.booking-list .stamp`)?* No. The stamp is not interactive, so raising it only makes a dead spot in the row: a click on it would do nothing. Below the link, a click on the stamp opens the booking like the rest of the row. Buttons in the row stay raised (button CRD). The rendering is the same.
- **D-5** *Can a stamp show a status outside L2-029?* No status modifier exists for anything else, and the legacy `.stamp--paid` and `.stamp--done` aliases are never produced. Payment states are badges ("Held", "Deposit held"), as the design system says.
- **D-6** *What stands in for a large stamp while a booking page loads?* A skeleton 40 px tall (`--space-10`), which is the large stamp's height (`--font-size-2xl` at line height 1, plus `--space-1` padding and the 2 px rule on each side): `zm-skeleton shape="none" width="short"` with that height, as the loading mock draws it. The skeleton's `stamp` shape (24 px) matches only the default size, and reusing the "none" shape avoids a shape that is used once.
- **D-7** *Is "Expired" on an expired email or download link a booking status?* It reuses the Expired stamp with `status="expired"`, because the meaning (a deadline passed) and the word are the same, and a second amber outcome variant would add nothing.
