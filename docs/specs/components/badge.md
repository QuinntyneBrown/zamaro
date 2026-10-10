# Badge

| Field | Value |
|---|---|
| Selector | `zm-badge` |
| Library path | `frontend/projects/components/src/lib/badge/` |
| Status | built |
| Traces to | L2-006, L2-017, L2-025, L2-026, L2-027, L2-039, L2-048, L2-049, L2-062, L2-067, L2-068, L2-069, L2-072, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-110, L2-111 |
| Design system | [`badge.html`](../../design-system/components/badge.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/account/default`](../../mocks/pages/account/default.html), [`pages/availability/default`](../../mocks/pages/availability/default.html), [`pages/earnings/default`](../../mocks/pages/earnings/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/admin-booking/held`](../../mocks/pages/admin-booking/held.html), [`pages/admin-audit/default`](../../mocks/pages/admin-audit/default.html), [`pages/admin-reviews/default`](../../mocks/pages/admin-reviews/default.html), and the top bar of every signed-in screen (see Usage) |
| Rendering | [`badge.html`](badge.html) |

## Purpose and scope

A badge is a small rubber stamp that says where something stands: a date is
Free or Booked, an application is Submitted or Approved, a payment is Held or
Succeeded, an artist is Suspended, and three saved artists wait behind the
"Saved" button. It is static text from a fixed set of words, shown next to the
thing it describes. It is never a control.

Use something else when:

- it is a booking's own status (Requested, Accepted, Confirmed, Completed,
  Declined, Withdrawn, Expired, Cancelled) → [status stamp](stamp.md);
- people filter by it or toggle it → [chip](chip.md);
- it needs a sentence of explanation → [inline message](inline-message.md);
- it is an artist's rating → [rating](rating.md).

Out of scope:

- Choosing the word. The page or the composite (ticket, tour dates, table)
  decides which status applies and passes translated, formatted text.
- Announcing a change. When a badge changes while the page is open (an
  application is approved), the page's `role="status"` region says so; the badge
  has no live region.
- Placement inside a nav link, a menu item or a sidebar link (`margin-left:
  auto` in `.sidenav__link`). The parent lays it out.
- Its loading placeholder. Loading rows use `zm-skeleton shape="badge"`
  ([skeleton](skeleton.md)).

## Usage

The mocks render about 735 badges across 80 screens. Each row is one distinct
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Top-bar "Saved" button on every booker screen | `count`, `count` 3, `countLabel` "artists" | — | 2, 3, 200 (the 200-artist limit, `notifications/saved-toast/warning`) | top bar (stage) |
| Workspace nav links and account menus (`pages/dashboard`, `pages/requests`, `pages/admin-*`, `dialogs/account-menu`, `dialogs/menu`) | `count` with "awaiting reply", "waiting", "held", "reported" | — | inside a current (`aria-current="page"`) link | top bar, menu surface |
| `pages/discover/default` headliner | `free` | "Free Sat 14 Nov" | default | surface |
| `pages/saved/default` ticket actions | `free` or `booked` | "Free Sat 14 Nov", "Booked Sun 15 Nov" | default | ticket surface |
| `pages/artist/default`, `pages/artist/empty`, `pages/profile-preview`, `pages/booking-detail/declined` tour dates and alternatives | `free`, `booked` | "Free", "Booked" | default; on the current-date row | canvas |
| Toasts and banners over Discover (`notifications/saved-toast/*`, `notifications/system-banner/*`) | `free` behind the toast | "Free Sat 14 Nov" | inert behind the toast | surface |
| `pages/account/*`, `dialogs/delete-account`, `dialogs/two-step-code` | `neutral`; `success` | "This device", "Off"; "On" | default | surface |
| `pages/availability/default`, `dialogs/block-dates`, `dialogs/calendar-feed`, `dialogs/weekly-default` | `neutral` | "Unavailable" | default | canvas, panel |
| `pages/earnings/default`, `pages/earnings/setup` | `neutral` | "Deposit held", "Paid Tue 16 Jun", "Not set up" | default | card |
| `pages/edit-profile/*`, `dialogs/upload-check` | `success`, `info`, `neutral` beside text in a `.cluster` | "Verified" + "Verified until Fri 3 Mar 2028", "Waiting for verification", "Not uploaded" | default | surface |
| `pages/admin-application`, `dialogs/reject-application` page head | `info`, `success` | "Submitted", "Approved" | default | stage page head |
| `pages/admin-artists` table, `pages/admin-artist` "Standing" panel head | `success`, `danger` | "Approved", "Suspended" | default, row hover | table surface, panel |
| `pages/admin-booking/*` payment lines, `dialogs/issue-refund`, `dialogs/resolve-hold` | `success`, `info`, `warning` in a dense table cell; `warning` beside a status stamp | "Succeeded", "Scheduled", "Paused"; "Held" | default, row hover | table surface, stage page head |
| `pages/admin-bookings/held` | `warning` after a flat stamp in one cell | "Held" | default | table surface |
| `pages/admin-audit/default` | `success`, `danger` | "Succeeded", "Failed" | default, row hover | dense table surface |
| `pages/admin-reviews/default`, `dialogs/hide-review` panel heads | `warning` | "2 reports", "1 report" | default | panel |
| `pages/admin-checks/verified` | `success` inline in a cell sentence | "Verified" + " until Tue 25 Sep 2029 · by Priya Nair" | default | table surface |
| Design system only | `solid` with each tone; `neutral` "New on Zamaro" | "Held", "Submitted", "Approved", "Suspended" | default, on every surface | paper, hovered row, selected row, stage |

## Anatomy

1. **Stamp** — `.badge`: inline flex box, `--border-width-hairline` rule in
   `--badge-border`, `--radius-sm` corners, `--space-0-5` × `--space-2` padding,
   fill `--badge-bg`, label colour `--badge-fg`.
2. **Dot** — `.badge::before`: a 0.5 em square in `currentColor`. Decorative,
   generated by CSS. The count badge has no dot.
3. **Label** — the projected text, or for a count the formatted number. Mono
   `--text-overline`, `--letter-spacing-wide`, uppercase by CSS. The word is the
   meaning.
4. **Hidden meaning (count only)** — `.visually-hidden` span after the number,
   holding `countLabel` (" artists").

Host: `zm-badge` is `display: inline-flex` with `vertical-align: baseline` and
renders exactly one `<span class="badge …">`. It adds no role, no `tabindex` and
no ARIA attributes. Classes a parent puts on the host stay on the host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'neutral' \| 'free' \| 'booked' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'count'` | `'neutral'` | no | Adds `.badge--{variant}`; `neutral` adds no modifier. |
| `solid` | `boolean` (attribute) | `false` | no | Adds `.badge--solid`. Honoured only with `info`, `success`, `warning` or `danger`; with any other variant it adds nothing, and in dev mode logs a console error naming the variant. |
| `count` | `number \| null` | `null` | with `variant="count"` | Shown as the label: the real number, never capped ("200", not "99+"). Whole numbers 0 or more, formatted with the app's `LOCALE_ID` ("1,240" in en-CA if a workspace count ever grows that large). |
| `countLabel` | `string` | `''` | with `variant="count"` | The count's meaning, rendered as `<span class="visually-hidden"> {countLabel}</span>` after the number: " artists", " awaiting reply". Empty renders no span (the parent control's name already says it). |

- Inputs are signal inputs; `solid` uses `booleanAttribute`.
- Every string arrives already translated and formatted (L2-110, L2-111): the
  date in "Free Sat 14 Nov" comes from the API library's formatting service
  through the consumer.

### Outputs

None. A badge is not interactive.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | plain text (one to three words, or a word and a short date) | The label for every variant except `count`. Declared once, after the count's number and hidden span, so a count badge leaves it empty. No elements, icons or links. |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Neutral | — | Labels with no tone: "Unavailable", "Off", "This device", "Deposit held", "Paid Tue 16 Jun", "Not set up", "Not uploaded", "New on Zamaro". Takes the colour of the text around it. |
| Free | `.badge--free` | The one yellow stamp: an artist is free ("Free", "Free Sat 14 Nov"). Availability only. |
| Booked | `.badge--booked` | Muted, struck through: an artist is booked ("Booked", "Booked Sun 15 Nov"). Availability only. |
| Info | `.badge--info` | Waiting on someone: "Submitted", "Scheduled", "Waiting for verification". |
| Success | `.badge--success` | Done: "Approved", "Succeeded", "Verified", "On". |
| Warning | `.badge--warning` | Needs attention: "Held", "Paused", "2 reports". |
| Danger | `.badge--danger` | Stopped or failed: "Suspended", "Failed". |
| Solid | `.badge--solid` + a tone | The single state in a view that needs action now. Never a column of solid badges. |
| Count | `.badge--count` | A number on a control: the 3 on "Saved", "Requests 3". Yellow, no dot, at least 1.5 em wide, growing with its digits. |

Badges have one size: `--text-overline` on a `--space-0-5` × `--space-2` pad
(count: `0` × `--space-1`). They take the line height of the text they sit in and
never scale with the viewport. Width comes from the label.

## States

A badge is not interactive: it has no hover, focus, active or disabled state.
What changes is the surface beneath it, and each variant holds up on every one.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Variant colours | Read as its text: "Booked" |
| On a hovered table row | the row's `:hover` | Unchanged; the row fills `--color-bg-subtle` beneath it | — |
| On a selected row | the row's `aria-selected="true"` | Unchanged; the row fills `--color-accent-subtle` | — |
| On the stage | `.on-stage` or `.topbar` ancestor | Neutral and tones unchanged; `booked` label turns `--color-fg-on-stage-muted`; free and count keep yellow | — |
| Inside a link or button | a parent `a`, `button` or `.nav-link` | Unchanged | Part of the parent's name: "Saved 3 artists" |
| Inside a current nav link | parent `aria-current="page"` | Unchanged (count stays yellow on the ink fill) | — |
| Inert | an open dialog makes the page `inert` | Unchanged | Not reachable |
| Three-digit count | `count` ≥ 100 (Saved is capped at 200 by L2-026) | Label "200"; the badge widens with tabular digits, never truncates | Read as "200" plus `countLabel` |

## Markup

Rendered by `zm-badge`, each variant:

```html
<zm-badge variant="free"><span class="badge badge--free">Free Sat 14 Nov</span></zm-badge>
<zm-badge variant="booked"><span class="badge badge--booked">Booked</span></zm-badge>
<zm-badge><span class="badge">Unavailable</span></zm-badge>
<zm-badge variant="warning"><span class="badge badge--warning">Held</span></zm-badge>
<zm-badge variant="warning" solid><span class="badge badge--warning badge--solid">Held</span></zm-badge>
```

Count, inside the top-bar Saved button (the button and its text belong to the
[top bar](top-bar.md)):

```html
<button class="nav-link" type="button" aria-expanded="false">
  <svg class="icon" aria-hidden="true">…</svg><span class="nav-link__text">Saved</span>
  <zm-badge variant="count"><span class="badge badge--count">3<span class="visually-hidden"> artists</span></span></zm-badge>
</button>
```

Info, success and danger add only their modifier class; the structure is the
same.

Consumer templates:

```html
<zm-badge [variant]="saved.booked ? 'booked' : 'free'">{{ saved.availability }}</zm-badge>
<zm-badge variant="count" [count]="savedCount()" [countLabel]="'shell.saved.countLabel' | transloco" />
<zm-badge variant="success">{{ 'admin.outcome.succeeded' | transloco }}</zm-badge>
<p class="cluster"><zm-badge variant="success">{{ 'check.verified' | transloco }}</zm-badge><span>{{ verifiedUntil() }}</span></p>
```

The `.badge` and `.badge--*` classes are a contract: e2e page objects read a
row's status by the badge class and its text, and visual tests compare them with
the design system.

## Design

- Box: `display: inline-flex`, `align-items: center`, gap `--space-1`, padding
  `--space-0-5` `--space-2`; rule `--border-width-hairline` solid; radius
  `--radius-sm`.
- Label: `--text-overline`, `--letter-spacing-wide`, `text-transform:
  uppercase`, `white-space: nowrap`. The source copy stays sentence case.
- Dot: `::before`, 0.5 em square, `currentColor`, `flex: none`.
- Booked: `text-decoration: line-through` on the label (decoration only).
- Count: padding `0` `--space-1`, `min-width: 1.5em`, `justify-content: center`,
  tabular figures, no dot. Width grows with the digits; one digit is a square.
- No motion: a status change swaps the badge in place.

Component tokens declared on `.badge` in the component's own stylesheet:

| Token | Aliases | Overridden by |
|---|---|---|
| `--badge-fg` | `currentColor` | every variant; `booked` on the stage |
| `--badge-bg` | `transparent` | free, count, tones, solid |
| `--badge-border` | `currentColor` | free, count, tones, solid |

The stage mapping uses `:host-context(.on-stage)` and `:host-context(.topbar)`
in the badge's stylesheet, so pages never restyle the badge.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Free and count fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Free and count label and rule | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Booked label and rule | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Booked on the stage | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |
| Info fill / label / rule | `--color-info-bg` / `--color-info-fg` / `--color-info-border` | `--palette-paper-warm` / `--palette-ink-750` / `--palette-ink-700` | `--palette-ink-800` / `--palette-ink-100` / `--palette-ink-300` |
| Success fill / label / rule | `--color-success-bg` / `--color-success-fg` / `--color-success-border` | `--palette-green-50` / `--palette-green-700` / `--palette-green-700` | `--palette-green-950` / `--palette-green-300` / `--palette-green-300` |
| Warning fill / label / rule | `--color-warning-bg` / `--color-warning-fg` / `--color-warning-icon` | `--palette-amber-50` / `--palette-amber-700` / `--palette-amber-700` | `--palette-amber-950` / `--palette-amber-300` / `--palette-amber-300` |
| Danger fill / label / rule | `--color-danger-bg` / `--color-danger-fg` / `--color-danger-border` | `--palette-red-50` / `--palette-red-700` / `--palette-red-600` | `--palette-red-950` / `--palette-red-300` / `--palette-red-300` |
| Solid fills | `--color-info-solid`, `--color-success-solid`, `--color-warning-solid`, `--color-danger-solid` | per theme | per theme |
| Solid labels | `--color-fg-inverse` (info, success, warning), `--color-fg-on-danger` (danger) | per theme | per theme |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

Labels are 12 px, so every pair needs 4.5:1 (L2-103):

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Free and count |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Booked on paper |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Booked in the tour dates |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Booked on the stage |
| `--color-info-fg` | `--color-info-bg` | 4.5:1 | Info |
| `--color-success-fg` | `--color-success-bg` | 4.5:1 | Success |
| `--color-warning-fg` | `--color-warning-bg` | 4.5:1 | Warning |
| `--color-danger-fg` | `--color-danger-bg` | 4.5:1 | Danger |
| `--color-fg-inverse` | `--color-warning-solid` | 4.5:1 | Solid warning |
| `--color-fg-on-danger` | `--color-danger-solid` | 4.5:1 | Solid danger |

The tone is never the only signal (WCAG 1.4.1): every status has its own word.
Under forced colours the fills drop out, the rule and dot follow `CanvasText`
(they are `currentColor` or rule-drawn), and the struck-through Booked keeps its
strike.

## Responsive behaviour

- A badge never wraps inside (`white-space: nowrap`). "Free Sat 14 Nov" is the
  longest label and fits beside a ticket's "Request" button at 320 px.
- In a flex row a badge keeps its width (`flex: none` on the host) and the text
  beside it wraps instead. In the tour dates, the badge sits in the note cluster
  on free rows so the date is never squeezed ([tour dates](tour-dates.md)).
- Badges do not change across breakpoints. At 320 px nothing overflows; at 200 %
  zoom the badge grows with the text and the row wraps around it.
- A badge is not a target. A count inside a button adds to that button's
  44 × 44 px target and needs none of its own.

## Accessibility

### Role and pattern

Plain text in a `<span>`: no role, no APG pattern. No `aria-label` on the span,
which has no role to carry it; meaning that is not visible goes in visually
hidden text.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the badge; it is never focusable. A badge inside a link or button is part of that control's stop. |

### Focus

None. Never add `tabindex`. A badge that needs an explanation gets text next to
it.

### Labelling

- The word is the label. The strike on Booked and the dot are decoration and
  are not announced.
- A count is a number plus `countLabel` in visually hidden text, so the top-bar
  button reads "Saved 3 artists" and the workspace link "Requests 3 awaiting
  reply".
- The badge text is part of an enclosing link's or button's accessible name.

### Announcements

None from the badge. The page announces status changes through its
`role="status"` region.

### Motion

None. Nothing animates, so `prefers-reduced-motion` changes nothing.

## Content and internationalisation

- Use only the fixed set: Free, Booked; Submitted, Scheduled, Waiting for
  verification; Approved, Succeeded, Verified, On; Held, Paused, "{n} reports"
  ("1 report"); Failed, Suspended; and the neutral Unavailable, Off, This
  device, Deposit held, Paid {date}, Not uploaded, Not set up, New on Zamaro.
  One to three words, sentence case in the source.
- Add a date only to Free, Booked and Paid, and only where it is not obvious:
  "Free Sat 14 Nov" on a ticket, plain "Free" in a list of dates, "Paid Tue 16
  Jun" on a payout row. Dates use the short en-CA form (L2-110).
- Availability names when: "Booked Sun 15 Nov", never "Unavailable" for a
  booked artist (L2-027).
- Statuses are states, not actions: "Held", not "Release payment".
- Counts are the real number in digits, never "9+" or "99+" (top-bar design system). Saved never exceeds 200 (L2-026), so the top-bar count is at most three digits.
- Every word comes from the translation catalogue through the consumer (L2-111);
  French labels run about 30 % longer and still do not wrap inside the badge,
  so the row around it wraps.

## Performance

- Change detection: `OnPush`, signal inputs, the class list and the count label
  from one `computed` each. No `effect`, no subscriptions, no host listeners.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Badge.ts`
  renders the headliner's "Free Sat 14 Nov" (`variant="free"`) for Abigail
  Mensah. Add `BadgeCount.ts`, which renders the top-bar count (3, " artists").
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms.
- Composite scenarios that include it: `Headliner`, `TopBar`, `DarkTheme`,
  `TourDates`, `Lineup` (Saved tickets' actions) and `Table`.
- Layout stability: a badge's size depends only on its text, and the loading
  placeholder (`zm-skeleton shape="badge"`) reserves the same 56 × 24 px box, so
  the swap does not shift the row (L2-105).
- Imports: Angular core only.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-badge variant="free">Free Sat 14 Nov</zm-badge>` on the Discover headliner for Abigail Mensah, when it renders, then the host contains exactly one `<span class="badge badge--free">` reading "Free Sat 14 Nov", with no role and no `tabindex`. (L2-006)
- **AC-2** Given Naomi's saved Abigail Mensah booked on her search date, when the ticket renders `<zm-badge variant="booked">Booked Sun 15 Nov</zm-badge>`, then the span has `.badge.badge--booked`, a `--color-fg-muted` label and a line-through, and the text "Booked Sun 15 Nov" is visible. (L2-027)
- **AC-3** Given Abigail Mensah's upcoming dates, when the Sun 15 Nov row renders a booked badge and the Tue 17 Nov row a free badge, then they read "Booked" and "Free" and differ in word as well as colour. (L2-017)
- **AC-4** Given each tone (`info` "Submitted", `success` "Approved", `warning` "Held", `danger` "Suspended") and `neutral` "Unavailable", when each renders, then the span carries `.badge` plus exactly the modifier in the Variants table, and matches the design-system rendering in the visual test. (L2-100)
- **AC-5** Given `solid` with `variant="warning"` on the held booking ZAM-0104, when it renders, then the span has `.badge--warning.badge--solid`, a `--color-warning-solid` fill and a `--color-fg-inverse` label. (L2-068)
- **AC-6** Given `solid` with `variant="free"`, when it renders in dev mode, then no `.badge--solid` class is added and a console error names the `free` variant. (L2-100)
- **AC-7** Given an artist application in review, when the admin page head renders `<zm-badge variant="info">Submitted</zm-badge>` and, after approval, `<zm-badge variant="success">Approved</zm-badge>`, then each reads its word with its tone. (L2-048)
- **AC-8** Given Elijah Park's verified Vulnerable Sector Check, when the edit-profile check section renders, then a success badge "Verified" sits beside the text "Verified until Fri 25 Sep 2029" on one baseline. (L2-049)
- **AC-9** Given the audit log, when the Fri 9 Oct, 3:12 a.m. failed sign-in row renders, then its outcome cell holds a danger badge "Failed", and a successful sign-in a success badge "Succeeded". (L2-069)
- **AC-10** Given Marcus Bell Trio suspended, when the admin artist "Standing" panel renders, then its head holds a danger badge "Suspended". (L2-067)
- **AC-11** Given the review of Hosanna Collective with two reports, when the admin reviews panel renders, then its head holds a warning badge "2 reports". (L2-062)
- **AC-12** Given Naomi's signed-in devices, when the account page renders, then the Chrome on Windows row ends with a neutral badge "This device" in place of an "End session" button. (L2-025)
- **AC-13** Given Naomi has two-step sign-in on, when the account page renders, then the security section shows a success badge "On"; with it off, a neutral badge "Off". (L2-072)
- **AC-14** Given Abigail's paid-out booking, when the earnings row renders, then it shows a neutral badge "Paid Tue 16 Jun". (L2-039)

### Count

- **AC-15** Given Naomi with 3 saved artists, when the top-bar Saved button renders `<zm-badge variant="count" [count]="3" countLabel="artists" />`, then the span has `.badge--count`, shows "3", has no dot, is at least 1.5 em wide, and the button's accessible name is "Saved 3 artists". (L2-026)
- **AC-16** Given Naomi saves a fourth artist, when the count input changes from 3 to 4, then the badge shows "4" in place, with no animation. (L2-026)
- **AC-17** Given a booker with 200 saved artists, the L2-026 limit, when the top-bar count badge renders, then it shows "200" on one line with tabular digits, the badge is wider than for "3" but keeps its padding, the Saved button reads "Saved 200 artists", and nothing overflows the top bar at 320 px. (L2-026)

### Screen readers

- **AC-18** Given a booked badge, when it is read by a screen reader, then it is announced as "Booked" with no mention of strike-through, and the dot is not announced. (L2-102)
- **AC-19** Given every badge variant on paper, the hovered row, the selected row and the stage in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-20** Given the dark theme, when every variant renders, then Free stays `--color-accent` with an ink label, tone fills turn deep with light labels, solid fills turn light with dark labels, and Booked stays muted and struck through. (L2-104)
- **AC-21** Given both themes, when contrast is measured, then each label-on-fill pair in the Colour table is at least 4.5:1. (L2-103)
- **AC-22** Given a booked badge inside an `.on-stage` area in the light theme, when it renders, then its label uses `--color-fg-on-stage-muted` and passes 4.5:1 against `--color-bg-stage`. (L2-103)

### Responsive

- **AC-23** Given a 320 px viewport and a Saved artists ticket with "Free Sat 14 Nov" and a "Request" button, when it renders, then the badge stays on one line, the row wraps around it if needed, and the page does not scroll horizontally. (L2-096)

### Content and formatting

- **AC-24** Given the short date Sun 15 Nov 2026 formatted by the API library's formatting service, when the consumer passes "Booked Sun 15 Nov", then the badge shows it unchanged; for a date in 2027 the consumer's string includes the year and the badge still does not wrap at 360 px. (L2-110)
- **AC-25** Given the French catalogue, when "Free Sat 14 Nov" is replaced by its 30 % longer translation, then the badge grows on one line and nothing in the badge is hard-coded English. (L2-111)

### Performance

- **AC-26** Given the `Badge` and `BadgeCount` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-badge` with `variant: 'default' | 'free'`. To meet this CRD:

- Rename the `default` variant to `neutral` and add `booked`, `info`, `success`,
  `warning`, `danger` and `count` with their component-token mappings from
  `components.css`.
- Add `solid` (`booleanAttribute`) with the four `.badge--solid.badge--{tone}`
  rules and the dev-mode error for other variants.
- Add `count` and `countLabel`; render the formatted number (no cap) and the visually
  hidden span before the single `<ng-content />`.
- Add `.badge--booked { text-decoration: line-through }` and the count rules
  (`min-width: 1.5em`, `font-variant-numeric: tabular-nums`, no dot).
- Add `:host-context(.on-stage, .topbar) .badge--booked { --badge-fg:
  var(--color-fg-on-stage-muted) }`.
- Make the host `display: inline-flex; flex: none` so a badge never shrinks in a
  flex row.
- Build the class list in one `computed`.
- Add the `BadgeCount` scenario and export it from `scenarios/index.ts`.

## Decisions

- **D-1** *Is the neutral variant called `default`?* No, `neutral`, as the design system names it ("Neutral outline"). `default` reads as "the usual one" and invites misuse for statuses that need a tone.
- **D-2** *Does Booked on the stage switch to the neutral outline?* No. The design-system states matrix renders a plain badge there, but `components.css` (added later, "Additions found while documenting") maps `.on-stage .badge--booked` to `--color-fg-on-stage-muted`, which passes 4.5:1. Keeping one variant per meaning means consumers never pick a variant by surface.
- **D-3** *Is the count capped ("99+")?* No: it shows the real number. The badge page's content rule said above 99 show "99+", but the [top bar](../../design-system/components/top-bar.html) page says the Saved count "never says '9+'; show the real number", and `notifications/saved-toast/warning` renders "200". L2-026 caps saved artists at 200, so the Saved count is at most three digits and the badge is sized for that (min 1.5 em, growing with tabular digits). The workspace counts (Requests awaiting reply, Applications waiting, Bookings held, Reviews reported) have no L2 limit and the mocks show 1–3; they follow the same rule and show the real number with locale grouping, never a cap. The badge design-system page should drop its "99+" line.
- **D-4** *Is the count projected or an input?* An input (`count`, `countLabel`). The number formatting and the visually hidden meaning are then built once and tested here, not in every top bar and nav link.
- **D-5** *Can a badge hold an icon or a link?* No. The design system shows only text, and a badge is never interactive. Anything more is an inline message or a button next to it.
- **D-6** *Where does the "Held" badge go when a booking also has a status?* Beside the booking's [status stamp](stamp.md), as on `pages/admin-booking/held`; the badge never replaces the stamp. The page lays them out in a `.cluster`.
- **D-7** *Should `solid` with a non-tone variant be an error?* A dev-mode console error only. Solid is meaningless on free, booked, neutral and count, and the design system forbids it there, but a production page must still render.
