# Alert and banner

| Field | Value |
|---|---|
| Selector | `zm-alert`, `zm-banner` |
| Library path | `frontend/projects/components/src/lib/alert/` |
| Status | built (`zm-alert`); `zm-banner` planned |
| Traces to | L2-022, L2-037, L2-038, L2-057, L2-067, L2-077, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-106, L2-107, L2-108, L2-111, L2-114 |
| Design system | [`alert.html`](../../design-system/components/alert.html) |
| Source mocks | [`pages/discover/error`](../../mocks/pages/discover/error.html), [`pages/discover/limited`](../../mocks/pages/discover/limited.html), [`pages/artist/error`](../../mocks/pages/artist/error.html), [`pages/book/duplicate`](../../mocks/pages/book/duplicate.html), [`dialogs/pay-deposit/failed`](../../mocks/dialogs/pay-deposit/failed.html), [`dialogs/block-dates/warning`](../../mocks/dialogs/block-dates/warning.html), [`pages/admin-booking/held`](../../mocks/pages/admin-booking/held.html), [`notifications/system-banner/*`](../../mocks/notifications/system-banner/info.html), [`pages/offline/default`](../../mocks/pages/offline/default.html), and every error, failed and success screen in Usage |
| Rendering | [`alert.html`](alert.html) |

## Purpose and scope

An alert sits where something happened and says what to do next: "We lost the
signal. Try again." It explains one region of a page — the lineup that failed to
load, a dialog whose action failed, a booking whose balance is on hold — and
stays in the layout until the problem is fixed or the person dismisses it.

A banner runs the full width under the top bar for news that affects the whole
page or site: planned maintenance, being offline, an email to verify, a
profile that just went live. It is one line: a short uppercase label, one
sentence and at most one inline action.

- `zm-alert` renders `.alert`: info (default), success, warning or danger;
  default or compact.
- `zm-banner` renders `.banner`: warning (default), info, success or danger;
  dismissible, persistent or neither.

Use something else when:

- the message belongs to one field or control → [inline message](inline-message.md)
  (or the field's own error, [form field](form-field.md));
- it confirms an action whose result is elsewhere ("Saved Luz Viva") →
  [toast](toast.md);
- a whole page failed → the [error page](error-page.md), which wraps an alert in
  the stage poster;
- nothing is wrong and nothing came back → [empty state](empty-state.md).

Out of scope:

- Deciding when to show it, retrying, counting failures (the third search
  failure adds a status-page link, L2-106) and detecting offline (L2-114). The
  page or shell owns the logic; the alert renders what it is given.
- The actions' behaviour. The page projects [buttons](button.md) and links.
- The error summary of a long form (forms pattern) and the dialog around a
  compact alert ([dialog](dialog.md)).
- Spacing around a page-level alert: the page's `.page-error` wrapper.

## Usage

The mocks render about 87 alerts on 60 screens and 14 banners on 6.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/error` | `zm-alert` danger, `alert`, lg icon | "We lost the signal" / "We couldn’t load who’s free on Saturday 14 November 2026. Your date, location and filters are kept."; actions: primary refresh "Try again", secondary "Email the Zamaro team" (third failure adds the status-page link) | default, retrying | canvas, under the search |
| `pages/discover/limited` | danger | "Too many searches in a minute" / "Give it 40 seconds, then try again…"; primary "Try again in 40 s" disabled until the wait ends | disabled action | canvas |
| `pages/artist/error` and 16 other page or section errors (`account`, `admin-*`, `availability`, `book`, `booking-detail`, `bookings`, `dashboard`, `earnings`, `edit-profile`, `profile-preview`, `request-detail`, `requests`, `saved`) | danger, default size | "We couldn’t reach the artist’s page" / "It’s on our side, not yours…"; primary "Try again" + secondary link ("Back to the lineup", "Back to Discover") | default | canvas, in `.page-error` |
| `pages/admin-applications`, `admin-artists`, `admin-audit`, `admin-bookings`, `admin-checks`, `admin-reviews`, `artist-reviews` errors | danger | title, body, primary "Try again" only | default | canvas |
| Every failed dialog (`accept-request`, `add-photo`, `add-song`, `add-video`, `artist-cancel-booking`, `block-dates`, `calendar-feed`, `cancel-booking`, `decline-request`, `hide-review`, `issue-refund`, `reinstate-artist`, `reject-application`, `reply-review`, `report-problem`, `report-review`, `resolve-hold`, `suspend-artist`, `upload-check`, `weekly-default`, `withdraw-request`, `write-review`) | danger, `compact`, no actions | "Your reply didn’t send" / "Nothing was sent to Riverside…"; "Upload stopped at 61%" | default | dialog body |
| `dialogs/add-church/failed`, `delete-account/failed`, `two-step-code/failed`, `pages/account/failed` | danger, default size, no actions | "We couldn’t save your church" / "Nothing was saved…" | default | dialog body, form |
| `dialogs/pay-deposit/failed`, `pay-balance/*` | danger, `compact`, focused on render | "Your bank declined the card" / "The bank said there isn’t enough credit on it. Nothing was charged…" | focused | dialog body |
| Auth and entry forms (`sign-in/error`, `sign-in/locked`, `sign-up/error`, `sign-up/challenge`, `forgot-password/error`, `reset-password/error`, `mfa-challenge/error`, `mfa-challenge/locked`, `mfa-setup/error`, `verify-email/error`, `confirm-email/error`, `accept-terms/error`, `data-export/error`, `apply/error`), `booking-detail/balance-failed` | danger, `compact`; lock icon on `mfa-challenge/locked` | "Sign-in is paused for 15 minutes" / "There were too many tries…" | default | auth card, form |
| `pages/book/duplicate`, `book/limit`, `book/unverified` | danger, default size, focused on render; body slot holds a link or a small button | "You’ve already asked Abigail about this date." + link "View booking ZAM-0114"; "You’ve sent a lot of requests today. Try again tomorrow."; "Verify your email to send this request" + sm "Resend email" | focused | form |
| `dialogs/block-dates/warning` | warning, `compact`, `alert` | "1 church has asked about this date. They’ll be told you’re not available." / "St. Brendan’s Anglican asked for Sun 22 Nov…" | default | dialog body |
| `pages/booking-detail/held` | warning, `compact`, `status` | "Balance on hold" / "Thanks for telling us. We won’t charge the $487.50 balance…" | default | canvas |
| `pages/admin-booking/held`, `dialogs/resolve-hold/*` | warning, pause icon, `status` | "Held: balance and payout paused" / "Grace Ampofo reported a problem Mon 5 Oct, 4:12 p.m.…" | default | canvas, dialog |
| `pages/admin-artist/suspended`, `dialogs/reinstate-artist/*` | warning, `status` | "Marcus Bell Trio is suspended" / "Their profile now shows not found…" | default | canvas, dialog |
| `pages/admin-application/approved` | success, check icon, `status` | "Tobi Adeyemi is approved" / "We emailed tobi@tobiadeyemi.ca the next step…" | default | canvas |
| Design system only | info; success dismissible | "Travel is included within 120 km"; "Request sent to Abigail Mensah" + close "Dismiss: Request sent to Abigail Mensah" | dismissible | canvas |
| `notifications/system-banner/info` | `zm-banner` info, dismissible | label "Maintenance" / "Zamaro is offline Sun 18 Oct, 2:00 a.m. to 4:00 a.m., for upgrades. Requests you’ve already sent are safe."; close "Dismiss maintenance notice" | default | under the top bar |
| `system-banner/success`, `pages/account/success`, `pages/edit-profile/success` | success, dismissible; optional action link | "Email verified" / "Thanks, Naomi…"; "Saved" / "Your settings are up to date…"; "Live" / "Your changes are on your public profile now…" + "View your profile" | default | under the top bar |
| `system-banner/persistent`, `system-banner/warning`, `pages/book/unverified` | warning, persistent, action button | "Verify your email" / "We sent a link to naomi.fraser@riversidecc.ca…" + "Resend email"; after sending, "Sent" disabled | default, action disabled | under the top bar |
| `system-banner/undeliverable` | warning, persistent, action link | "We can’t reach your email" / "Messages to naomi.fraser@riversidecc.ca are bouncing…" + "Update your email" | default | under the top bar |
| `system-banner/danger` (a page that loses its connection) | danger, persistent, `alert`, wifi-off icon | "You’re offline" / "You can keep reading what’s loaded. Saving artists and sending requests need a connection." | default, cleared on reconnect | under the top bar |
| `pages/offline/default` | danger, persistent, `status` | "You’re offline" / "Saving artists and sending requests need a connection." | default | under the top bar |
| `pages/profile-preview/*` | info, eye icon, action link, not dismissible | "This is a preview" / "Churches see your profile like this…" + "Back to editing" | default | under the top bar |

## Anatomy

### Alert

1. **Container** — `.alert` plus tone and size modifiers: a two-column grid
   (icon, text), 2 px rule in `--alert-border`, tinted fill `--alert-bg`, square
   corners.
2. **Icon** — `zm-icon` (`.icon`, `aria-hidden`), 28 px (`lg`) by default, 20 px
   when compact, in `--alert-icon`.
3. **Text** — `.stack.stack--sm`: the title then the body.
4. **Title** — `.alert__title`, a `<p>`: display face, uppercase. What happened,
   in a few words.
5. **Body** — the projected content: one or two sentences, optionally a link or a
   small button in its own paragraph.
6. **Actions (optional)** — `.alert__actions`: at most one primary and one
   secondary button, plus the status-page link on the third failure. Full width
   below SM, under the text from SM.
7. **Close (optional)** — `.alert__close`, a ghost icon-only button pinned top
   right, only on `.alert--dismissible`.

### Banner

1. **Container** — `.banner` plus tone and `--persistent`: a wrapping flex row,
   padded to the page margin, tinted fill, 2 px rule along the bottom.
2. **Icon** — `zm-icon` 20 px in `--alert-icon`, `aria-hidden`.
3. **Text** — `.banner__text.banner__text--fill`, a `<p>`: the `<strong>` label,
   the sentence, then the inline action.
4. **Action (optional)** — `.banner__action`: a router link, an external link, or
   `button.banner__action`, uppercase and underlined.
5. **Close (optional)** — the generic `.close` button, last.

Hosts: `zm-alert` and `zm-banner` are `display: block` and render the
`.alert` / `.banner` element inside them, which carries the role. Classes a
parent puts on the host (a `.page-error` wrapper is the parent's own element)
stay on the host.

## API

### `zm-alert` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | no | Adds `.alert--{variant}`; info adds none. Every error or failure is `danger`. |
| `heading` | `string` | — | yes | The title text. |
| `compact` | `boolean` (attribute) | `false` | no | Adds `.alert--compact`: inside dialogs, auth cards, forms, the booking stub and cards. |
| `icon` | `IconName \| null` | per variant | no | info `'info'`, success `'check'`, warning and danger `'warning'`. Override for a more exact picture: `'pause'` (held), `'lock'` (locked sign-in). `null` is not allowed: every alert pairs colour with an icon. |
| `live` | `'alert' \| 'status' \| 'off'` | danger `'alert'`, others `'status'` | no | Sets `role="alert"` or `role="status"` on `.alert`; `'off'` sets none, for an alert that is part of the page when it loads and announces nothing. |
| `focusOnRender` | `boolean` (attribute) | `false` | no | Sets `tabindex="-1"` on `.alert` and moves focus to it once, after it renders. Only for an alert that replaces a submit's result (a declined card, a duplicate or refused request). |
| `dismissible` | `boolean` (attribute) | `false` | no | Adds `.alert--dismissible` and the close button. Ignored, with a dev-mode console error, when `variant` is `danger`. |
| `dismissLabel` | `string` | — | with `dismissible` | The close button's name: "Dismiss: Request sent to Abigail Mensah". |

### `zm-banner` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'warning'` | no | Adds `.banner--{variant}` (warning too, so the tone is explicit). |
| `label` | `string` | — | yes | The `<strong>` label: "Maintenance", "Verify your email", "You’re offline". |
| `icon` | `IconName` | per variant | no | info `'info'`, success `'check'`, warning `'warning'`, danger `'wifi-off'`; `'eye'` for the profile preview. |
| `live` | `'alert' \| 'status' \| 'off'` | `'status'` | no | `'alert'` for a banner that appears because something just broke while the page is open (the in-page offline banner). |
| `actionLabel` | `string` | — | no | Renders `.banner__action` after the sentence. |
| `actionLink` | `string \| unknown[]` | — | no | Router link for the action ("View your profile", "Back to editing"). |
| `actionHref` | `string` | — | no | External or `mailto:` address for the action. |
| `actionDisabled` | `boolean` | `false` | no | For a button action: native `disabled` ("Sent"). |
| `persistent` | `boolean` (attribute) | `false` | no | Adds `.banner--persistent`: no close button; the banner stays until its cause is fixed. |
| `dismissible` | `boolean` (attribute) | `false` | no | Renders the `.close` button. Ignored, with a dev-mode console error, when `persistent` is set. |
| `dismissLabel` | `string` | — | with `dismissible` | "Dismiss maintenance notice". |

With `actionLabel` and neither `actionLink` nor `actionHref`, the action is a
`<button class="banner__action" type="button">` that emits `actionPressed`.

### Outputs

| Component | Output | Payload | Emitted when |
|---|---|---|---|
| `zm-alert` | `dismissed` | `void` | The close button is activated. The page removes the alert and moves focus (see Focus). |
| `zm-banner` | `dismissed` | `void` | The close button is activated. The shell removes the banner and remembers the dismissal for the session. |
| `zm-banner` | `actionPressed` | `void` | The button action is activated ("Resend email"). |

### Content slots

| Component | Slot | Accepts | Rule |
|---|---|---|---|
| `zm-alert` | default | `<p>` paragraphs; a `<p>` holding one link (`zm-link` or `<a>`) or one `zm-button size="sm"` | The body, rendered after the title in the text stack. |
| `zm-alert` | `[slot=actions]` | `zm-button`, `zm-button-link`, `zm-button-anchor` | Rendered in `.alert__actions`; the wrapper is hidden when empty. At most one primary. |
| `zm-banner` | default | text | The one sentence after the label, inside `.banner__text`. |

Each slot is declared once. All copy arrives as inputs or slots, translated by
the page (L2-111).

## Variants and sizes

| Variant | Alert modifier | Banner modifier | Use for |
|---|---|---|---|
| Info | — | `.banner--info` | Context the person would otherwise miss; maintenance; the profile preview. |
| Success | `.alert--success` | `.banner--success` | Something that lasts: "Tobi Adeyemi is approved", "Live". |
| Warning | `.alert--warning` | `.banner--warning` | Needs attention soon but is not broken: a hold, a suspension, an email to verify. |
| Danger | `.alert--danger` | `.banner--danger` | A failure and how to recover; being offline. |

| Size | Modifier | Padding | Gap | Title | Icon |
|---|---|---|---|---|---|
| Default alert | — | `--space-6` | `--space-4` by `--space-5` | `--text-h3` | 28 px (`lg`) |
| Compact alert | `.alert--compact` | `--space-4` | `--space-2` by `--space-3` | `--text-h4` | 20 px |
| Dismissible alert | `.alert--dismissible` | right padding `--space-6` + `--target-comfortable` | as the size | as the size | as the size |
| Banner | — | `--space-3` block, `--layout-margin` inline | `--space-3` | label `--text-label` | 20 px |

Width: the alert fills its container; the banner spans the viewport.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Tone colours | Title then body, read in order |
| Appearing | the page renders it after an action | Appears in one step, no animation | `role="alert"` announced at once; `role="status"` announced politely |
| Present at load | `live="off"` | Same | Read in page order only |
| Action hover, focus | the projected button | The button's own states | As the button |
| Retrying | the projected primary button's `busy` | The button shows "Retrying…" and its spinner; the alert text does not change until the result | `aria-busy` on the button |
| Action disabled | the projected button's `disabled` ("Try again in 40 s") | The button's disabled look | Out of the tab order |
| Focused on render | `focusOnRender` | The container shows the two-tone focus ring | Focus lands on the alert; its text is read |
| Dismissible | `dismissible` | Close button top right; room reserved | "Dismiss: …, button" |
| Dismissed | `dismissed` → the page removes it | Gone in one step | Focus moves to the section heading or next control |
| Banner action disabled | `actionDisabled` | Muted "Sent" | Disabled button |
| Banner persistent | `persistent` | No close button | — |
| Banner cleared | the cause is fixed (connection back) → the shell removes it | Gone in one step | Nothing announced |

## Markup

Rendered by `zm-alert`, danger with actions:

```html
<zm-alert>
  <div class="alert alert--danger" role="alert">
    <zm-icon><svg class="icon icon--lg" aria-hidden="true" focusable="false" viewBox="0 0 24 24">…warning…</svg></zm-icon>
    <div class="stack stack--sm">
      <p class="alert__title">We lost the signal</p>
      <p>We couldn’t load who’s free on Saturday 14 November 2026. Your date, location and filters are kept.</p>
    </div>
    <div class="alert__actions">
      <zm-button variant="primary"><button class="btn btn--primary" type="button">…Try again</button></zm-button>
      <zm-button-anchor><a class="btn" href="mailto:hello@zamaro.ca">Email the Zamaro team</a></zm-button-anchor>
    </div>
  </div>
</zm-alert>
```

Compact, focused on render, no actions:

```html
<div class="alert alert--danger alert--compact" role="alert" tabindex="-1">
  <zm-icon><svg class="icon" …>…warning…</svg></zm-icon>
  <div class="stack stack--sm"><p class="alert__title">Your bank declined the card</p><p>The bank said there isn’t enough credit on it. …</p></div>
</div>
```

Dismissible success:

```html
<div class="alert alert--success alert--dismissible" role="status">
  …icon, text…
  <zm-button variant="ghost" iconOnly class="alert__close"><button class="btn btn--ghost btn--icon" type="button" aria-label="Dismiss: Request sent to Abigail Mensah">…close…</button></zm-button>
</div>
```

Rendered by `zm-banner`, persistent with a button action, and dismissible:

```html
<div class="banner banner--warning banner--persistent" role="status">
  <zm-icon><svg class="icon" …>…warning…</svg></zm-icon>
  <p class="banner__text banner__text--fill"><strong>Verify your email</strong>We sent a link to naomi.fraser@riversidecc.ca. You need it to send requests. <button class="banner__action" type="button">Resend email</button></p>
</div>

<div class="banner banner--info" role="status">
  <zm-icon><svg class="icon" …>…info…</svg></zm-icon>
  <p class="banner__text banner__text--fill"><strong>Maintenance</strong>Zamaro is offline Sun 18 Oct, 2:00 a.m. to 4:00 a.m., for upgrades. Requests you’ve already sent are safe.</p>
  <button class="close" type="button" aria-label="Dismiss maintenance notice"><zm-icon>…close…</zm-icon></button>
</div>
```

A link action renders `<a class="banner__action" href="/artists/abigail-mensah">View your profile</a>` in the same place.

Consumer templates:

```html
<zm-alert variant="danger" [heading]="'discover.error.title' | transloco">
  <p>{{ t('discover.error.body', { date: longDate() }) }}</p>
  <zm-button slot="actions" variant="primary" [busy]="retrying()" (click)="store.retry()"><zm-icon name="refresh" />{{ 'discover.error.retry' | transloco }}</zm-button>
  <zm-button-anchor slot="actions" [href]="contactHref">{{ 'discover.error.email' | transloco }}</zm-button-anchor>
</zm-alert>

<zm-alert variant="danger" compact focusOnRender [heading]="decline.title"><p>{{ decline.body }}</p></zm-alert>

<zm-banner variant="danger" persistent live="alert" [label]="'offline.label' | transloco">{{ 'offline.body' | transloco }}</zm-banner>
<zm-banner variant="warning" persistent [label]="'verify.label' | transloco" [actionLabel]="sent() ? ('verify.sent' | transloco) : ('verify.resend' | transloco)" [actionDisabled]="sent()" (actionPressed)="resend()">{{ t('verify.body', { email }) }}</zm-banner>
```

The `.alert*` and `.banner*` classes, the roles and the title text are a
contract: e2e page objects find an alert by role and title, and its actions by
role and name.

## Design

- Alert: `display: grid`, columns `auto minmax(0, 1fr)`, `align-items: start`,
  padding and gaps from the size; rule `--border-width-thick` solid
  `--alert-border`; fill `--alert-bg`; text `--color-fg-default`.
- Title `--text-h3` (compact `--text-h4`), uppercase, `--color-fg-default`,
  margin 0. Body `--text-body`. Title and body sit in `.stack.stack--sm`
  (`--space-2`).
- Actions: `grid-column: 1 / -1` below SM, `grid-column: 2` from SM; `display:
  flex`, `flex-wrap: wrap`, gap `--space-3`; hidden when empty.
- Close: `position: absolute`, top and right `--space-2`; the dismissible alert
  is `position: relative` and reserves `--space-6` + `--target-comfortable` on
  the right.
- Banner: `display: flex`, `flex-wrap: wrap`, `align-items: center`, gap
  `--space-3`, padding `--space-3` `--layout-margin`, `--text-body-sm`, fill
  `--alert-bg`, bottom rule `--border-width-thick` solid `--alert-border`.
  `.banner__text--fill` is `flex: 1 1 0; min-width: 0`.
- Banner label: `<strong>` in `--text-label`, uppercase,
  `--letter-spacing-wide`, `margin-right: --space-2`. Action: `--text-label`,
  uppercase, `--letter-spacing-wide`, colour inherited, underlined with
  `text-underline-offset: 0.22em`, `margin-left: --space-2`; a button action has
  no frame or fill and at least `--target-min` height.
- Banner close: `.close`, `--control-height-sm` square (`--target-comfortable`
  under a coarse pointer), transparent; hover `color-mix` of `currentColor` at
  12 %.
- No motion and no shadow on either. Layer: in flow; the banner sits directly
  after the top bar and scrolls with the page.

Component tokens declared on `.alert` and `.banner`:

| Token | Aliases (info / success / warning / danger) | Overridden by |
|---|---|---|
| `--alert-bg` | `--color-info-bg` / `--color-success-bg` / `--color-warning-bg` / `--color-danger-bg` | tone modifier |
| `--alert-fg` | `--color-info-fg` / `--color-success-fg` / `--color-warning-fg` / `--color-danger-fg` | tone; reserved for status-coloured copy |
| `--alert-border` | `--color-info-border` / `--color-success-border` / `--color-warning-icon` / `--color-danger-border` | tone |
| `--alert-icon` | `--color-info-icon` / `--color-success-icon` / `--color-warning-icon` / `--color-danger-icon` | tone |

Warning uses `--color-warning-icon` for its rule because the warning border token
is too pale to read as an edge. Buttons inside keep their own tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Info fill / rule / icon | `--color-info-bg` / `--color-info-border` / `--color-info-icon` | `--palette-paper-warm` / `--palette-ink-700` / `--palette-ink-750` | `--palette-ink-800` / `--palette-ink-300` / `--palette-signal-500` |
| Success fill / rule and icon | `--color-success-bg` / `--color-success-border` | `--palette-green-50` / `--palette-green-700` | `--palette-green-950` / `--palette-green-300` |
| Warning fill / rule and icon | `--color-warning-bg` / `--color-warning-icon` | `--palette-amber-50` / `--palette-amber-700` | `--palette-amber-950` / `--palette-amber-300` |
| Danger fill / rule and icon | `--color-danger-bg` / `--color-danger-border` | `--palette-red-50` / `--palette-red-600` | `--palette-red-950` / `--palette-red-300` |
| Title, body, banner text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Focus ring (focused alert, actions) | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-info-bg` | 4.5:1 | Text on info |
| `--color-fg-default` | `--color-success-bg` | 4.5:1 | Text on success |
| `--color-fg-default` | `--color-warning-bg` | 4.5:1 | Text on warning |
| `--color-fg-default` | `--color-danger-bg` | 4.5:1 | Text on danger |
| `--color-info-icon` | `--color-info-bg` | 3:1 | Info icon |
| `--color-success-icon` | `--color-success-bg` | 3:1 | Success icon |
| `--color-warning-icon` | `--color-warning-bg` | 3:1 | Warning icon and rule |
| `--color-danger-icon` | `--color-danger-bg` | 3:1 | Danger icon |
| `--color-danger-border` | `--color-bg-surface` | 3:1 | Danger rule against a card |
| `--color-info-border` | `--color-bg-surface` | 3:1 | Info rule against a card |

Under forced colours the rule and icon follow `CanvasText` and the fill
`Canvas`; the title and icon shape still give the tone.

## Responsive behaviour

- Alert below SM (< 576 px): actions span the full width under the icon and
  text; from SM they align with the text column.
- Action buttons wrap onto a new line rather than shrink. "Email the Zamaro team"
  fits a full-width alert at 360 px; inside anything narrower (a card, the stub,
  a compact alert) the page uses the short label "Email us".
- The alert fills its container: the lineup's width on Discover, the dialog body
  in a dialog (where the dialog fills the screen at XS, L2-099).
- Long titles and bodies wrap; a long email address in the body breaks inside
  the word (`overflow-wrap: anywhere` on the text stack) rather than overflow.
- Banner: the text takes the row; the inline action runs on after the sentence
  and the close button stays at the end. At 320 px the sentence wraps over
  several lines and nothing scrolls sideways.
- At 200 % zoom both grow taller and every action stays reachable. Actions are
  44 px (36 px for `size="sm"`, which grows to 44 px under a coarse pointer); the
  close buttons are 44 px under a coarse pointer.

## Accessibility

### Role and pattern

Follows the [APG Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).
`role="alert"` only for a new, important message the person must hear now — a
failed load after a search, a failed action in a dialog, a warning that blocks
the next step. `role="status"` for confirmations, holds and banners that appear
while the page is open. No role for an alert that is part of the page when it
loads. The alert is not a dialog and never traps focus.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through links and buttons in the body, then the actions, then the close button, in DOM order. The alert is focusable only with `focusOnRender`, and then only by script (`tabindex="-1"`). |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates the focused action, banner action or close button. |
| <kbd>Esc</kbd> | Does nothing: alerts and banners are not overlays. |

### Focus

- Showing an alert never moves focus, except with `focusOnRender`, used when a
  submit failed and the alert replaces its result: focus moves to the alert
  once, so the reason is read and the next Tab reaches the form (D-4).
- After dismissing, the page moves focus to the section heading or the next
  control, never to `<body>`.
- After a successful retry the alert is removed and focus stays on the page; the
  page moves it to the content that loaded only if the retry button had focus.
- The focus ring of a focused alert is the standard two-tone ring around the
  container.

### Labelling

- The title and body are read in order inside the live region. The icon is
  decorative (`aria-hidden`); the title states the tone in words.
- The close button names what it dismisses: "Dismiss: Request sent to Abigail
  Mensah", "Dismiss maintenance notice".
- A link action names its destination ("Email the Zamaro team", "Back to the
  lineup"), never "Contact" or "Click here".
- The banner's label is read first, so it names the situation.

### Announcements

`role="alert"` content is announced as soon as it is inserted; `role="status"`
content politely. The in-page offline banner is `role="alert"` and is announced
when the connection drops (L2-114); when it clears, nothing is announced.

### Motion

Alerts and banners appear and disappear without animation, so the layout shift
is one step, not a slide. Buttons inside keep their own `--duration-fast`
lift, which reduced motion removes.

## Content and internationalisation

- **Title:** what happened, in a few words, sentence case in the source: "We lost
  the signal", "Your bank declined the card", "Held: balance and payout paused".
- **Body:** what is safe and what to do, in one or two sentences: "Your date,
  location and filters are kept." For errors, say whose side it is on when known:
  "It’s on our side, not yours." Never blame the person or show a raw error.
- **Fixed copy from L2:** "We lost the signal" with "We couldn't load who's free
  on {long date}. Your date, location and filters are kept." (L2-106); "We
  couldn't reach the artist's page" with "It's on our side, not yours. Your
  search is saved and any request you've sent is safe." (L2-107); "You've sent a
  lot of requests today. Try again tomorrow." (L2-077); "{n} churches have asked
  about this date. They'll be told you're not available." (L2-057); the offline
  banner "You're offline" with "You can keep reading what's loaded. Saving
  artists and sending requests need a connection." (L2-114).
- **Actions:** start with a verb: "Try again", "Pay deposit", "Back to the
  lineup". One primary at most.
- **Banner:** a short label, then one sentence; name the date and time of planned
  events: "Sun 18 Oct, 2:00 a.m. to 4:00 a.m." (L2-110).
- Translatable: `heading`, the body, `label`, the sentence, `actionLabel`,
  `dismissLabel`, every action label. Data values: dates, amounts, emails, names,
  counts — formatted by the page.
- French runs about 30 % longer: titles and bodies wrap; actions wrap onto a new
  line.

## Performance

- Change detection: `OnPush`, signal inputs. Computed: the class list, the icon
  name and the role. `focusOnRender` uses `afterNextRender` once; no
  subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Alert.ts`
  renders the Discover "We lost the signal" alert with "Try again" and "Email the
  Zamaro team" (exists); add `AlertCompact.ts` (dialogs/pay-deposit/failed "Your
  bank declined the card") and `Banner.ts` (system-banner/persistent "Verify your
  email" with "Resend email"). Tune them in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios: `DarkTheme.ts` includes an alert.
- Regression rule: a change to either component's template, inputs, styles or
  change detection is measured against the base branch with
  `--fail-on-regression` before it is pushed.
- Layout stability: an alert that replaces a loading region takes the region's
  place in one step; the banner is in flow under the top bar and pushes content
  down once. The shell renders the offline and email banners on the server when
  their cause is known at load, so they do not shift the first paint (L2-086).
- Imports: `zm-icon` and `zm-button` (for the alert's close button). Nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given the Discover search fails, when the lineup region renders the danger alert, then it shows `.alert.alert--danger` with `role="alert"`, the title "We lost the signal", the body "We couldn’t load who’s free on Saturday 14 November 2026. Your date, location and filters are kept.", a primary "Try again" and a secondary "Email the Zamaro team". (L2-106)
- **AC-2** Given an artist profile request fails, when the page renders, then the alert reads "We couldn’t reach the artist’s page" with "It’s on our side, not yours. Your search is saved and any request you’ve sent is safe.", a primary "Try again" and a "Back to the lineup" link. (L2-107)
- **AC-3** Given the third consecutive search failure, when the alert renders, then a third action links to the public status page and the first two are unchanged. (L2-106)
- **AC-4** Given each variant with no `icon` set, when the alert renders, then info shows the info icon, success the check, warning and danger the warning triangle, each in `--alert-icon`, and the warning alert on `pages/admin-booking/held` shows the pause icon from `icon="pause"`. (L2-038)
- **AC-5** Given `compact` in the pay deposit dialog, when the alert renders, then it has `.alert--compact`, `--space-4` padding, a `--text-h4` title and a 20 px icon. (L2-037)
- **AC-6** Given the block-dates dialog for Sun 22 Nov with one Requested booking, when the warning alert renders, then it is compact, `role="alert"`, and its title reads "1 church has asked about this date. They’ll be told you’re not available." (L2-057)
- **AC-7** Given Marcus Bell Trio suspended, when the admin artist page renders, then a warning alert with `role="status"` reads "Marcus Bell Trio is suspended". (L2-067)
- **AC-8** Given an alert with no projected actions, when it renders, then `.alert__actions` takes no space. (L2-108)
- **AC-9** Given Naomi's eleventh request in 24 hours, when the book page renders the refusal, then the danger alert reads "You’ve sent a lot of requests today. Try again tomorrow." and every value she entered stays in the form. (L2-077)

### States

- **AC-10** Given the Discover alert and "Try again" activated, when the retry is pending, then the button is busy ("Retrying…", `aria-busy="true"`), the alert's title and body are unchanged, and on success the alert is removed. (L2-106)
- **AC-11** Given a declined card in the pay deposit dialog, when the failed alert renders with `focusOnRender`, then `.alert` has `tabindex="-1"`, receives focus once, and every value entered is kept except the card details held by the processor's fields. (L2-108)
- **AC-12** Given `dismissible` with `dismissLabel` "Dismiss: Request sent to Abigail Mensah", when the close button is activated, then `dismissed` emits, and when the page removes the alert, focus moves to the section heading. (L2-101)
- **AC-13** Given `dismissible` on a danger alert, when it renders, then no close button is rendered and a dev-mode console error names the component. (L2-108)
- **AC-14** Given Naomi with an unverified email tries to send a request, when the book page renders, then the danger alert "Verify your email to send this request" holds a small "Resend email" button in its body, and the persistent warning banner "Verify your email" shows under the top bar. (L2-022)

### Banner

- **AC-15** Given the connection drops while Discover is open, when the shell shows the offline banner, then it is `.banner.banner--danger.banner--persistent` with `role="alert"`, reads "You’re offline" then "You can keep reading what’s loaded. Saving artists and sending requests need a connection.", has no close button, and is announced. (L2-114)
- **AC-16** Given the offline banner, when the connection returns, then the banner is removed without an announcement and the page below it is unchanged. (L2-114)
- **AC-17** Given the maintenance banner with `dismissible`, when "Dismiss maintenance notice" is activated, then `dismissed` emits and the banner is removed in one step. (L2-102)
- **AC-18** Given the "Verify your email" banner, when "Resend email" is activated, then `actionPressed` emits; with `actionDisabled` and `actionLabel` "Sent", the action is a disabled button. (L2-022)
- **AC-19** Given `actionLink` "/artists/abigail-mensah" and `actionLabel` "View your profile", when the success banner renders, then the action is a link with `.banner__action` after the sentence, inside `.banner__text--fill`. (L2-102)

### Keyboard and focus

- **AC-20** Given the Discover alert, when the booker tabs into it, then focus moves to "Try again", then "Email the Zamaro team", the alert itself is not a tab stop, and each shows the two-tone ring. (L2-101)
- **AC-21** Given an alert or banner rendered while the person is typing in a field, when it appears without `focusOnRender`, then focus stays in that field. (L2-101)

### Screen readers

- **AC-22** Given a `role="status"` success alert inserted after an action, when it appears, then a screen reader announces its title then its body politely, without the icon. (L2-102)
- **AC-23** Given every alert and banner variant in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-24** Given the dark theme, when the four alert tones render, then each uses its deep tinted fill with a light rule and icon, and title and body stay `--color-fg-default`. (L2-104)
- **AC-25** Given both themes, when contrast is measured, then title and body are at least 4.5:1 on every tone's fill, icons at least 3:1 on their fill, and the danger and info rules at least 3:1 against a card. (L2-103)

### Responsive

- **AC-26** Given a 360 px viewport, when the Discover alert renders, then its actions span the full width under the icon and text and wrap rather than shrink; at 768 px they line up with the text column. (L2-096)
- **AC-27** Given a 320 px viewport, when the "We can’t reach your email" banner renders with naomi.fraser@riversidecc.ca, then the text wraps, the action follows the sentence, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-28** Given the French catalogue, when the Discover alert renders at 360 px with labels about 30 % longer, then the title, body and actions wrap without clipping. (L2-111)

### Motion

- **AC-29** Given an alert or banner appearing or being removed, when it happens, then nothing animates, with or without `prefers-reduced-motion`. (L2-103)

### Performance

- **AC-30** Given the `Alert`, `AlertCompact` and `Banner` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

`zm-alert` exists in `frontend/projects/components/src/lib/alert/alert.ts` with
`heading` and `variant: 'info' | 'danger'`, a hard-coded `role="alert"`, and the
Discover lineup uses it. To meet this CRD:

- Widen `variant` to `'info' | 'success' | 'warning' | 'danger'` and add the
  success and warning token sets; add `--alert-fg`.
- Replace the `.alert__icon` span with the icon as a direct child of `.alert`
  (`.alert > .icon`), and the `.alert__body` div with `.stack.stack--sm`, as the
  design system marks it up; the body slot stays after the title.
- Add `compact` (`.alert--compact`, 20 px icon, `--text-h4` title), `icon`,
  `live` (role computed from the variant), `focusOnRender` (`tabindex="-1"` and
  focus in `afterNextRender`), `dismissible`, `dismissLabel` and `dismissed`
  with the `.alert__close` ghost icon button.
- Add `overflow-wrap: anywhere` to the text stack for long email addresses.
- Add `zm-banner` in the same folder (`banner.ts`, class `Banner`), with the
  `.banner*` and `.close` rules copied from `components.css`, and export it.
- Add the perf-test scenarios `AlertCompact.ts` and `Banner.ts` and export them
  from `scenarios/index.ts`; keep `Alert.ts`.
- The icon set must provide `info`, `check`, `warning`, `pause`, `lock`, `eye`,
  `wifi-off` and `close` ([icon](icon.md)).
- The shell renders the banners under `zm-top-bar`; the page wraps a page-level
  alert in `.page-error` (the mocks' inline `padding-block` is drift).

## Decisions

- **D-1** *One CRD and folder for alert and banner?* Yes. The design system documents them on one page with shared `--alert-*` tokens and tones; two selectors keep their different anatomy apart.
- **D-2** *Which role by default?* Danger `alert`, every other tone `status`, overridable with `live`. The mocks follow this except the block-dates warning, which must be heard before the artist continues, so it sets `live="alert"`; the design system's rule ("role=alert only for a new, important message") is the reason.
- **D-3** *What does the icon size follow?* The size: 28 px default, 20 px compact. The mocks mix them (`book/unverified` uses 20 px in a default alert, `booking-detail/held` 28 px in a compact one); the design system's sizes table ties the icon to the size, so the component does too and the mocks are drift.
- **D-4** *The design system says never move focus into an alert, but the payment and booking-request failure mocks set `tabindex="-1"` and `autofocus`. Which wins?* Both, for different cases. The rule forbids moving focus just to announce; after a failed submit the person's next step is to read why and fix the form, and their focus was on a submit button whose result is the alert. `focusOnRender` exists only for that case (L2-108); every other alert leaves focus alone.
- **D-5** *Is the offline banner dismissible? The `system-banner/danger` mock has a close button and `role="alert"`; the offline page's banner is persistent with `role="status"`; the design system lists offline as persistent.* Persistent in both, with no close button: the design system names offline among the notices that "stay until the cause is fixed", L2-114 calls it persistent, and it clears itself on reconnect. The in-page banner keeps `role="alert"` (L2-114.3 says it is announced when the connection drops); the offline page's banner is present at load and keeps `role="status"`. The mock's close button is drift. Please confirm.
- **D-6** *One banner text layout or two?* One: `.banner__text--fill` with the action inline after the sentence. The design system's product banners ("Maintenance", "Live", "Verify your email", "You’re offline") all use it; `pages/account/success` and `pages/edit-profile/success` place the text and action without `--fill`, which is drift.
- **D-7** *Banner action as a slot or inputs?* Inputs (`actionLabel`, `actionLink`, `actionHref`, `actionDisabled`, `actionPressed`). The action is styled by `.banner__action`, which the banner's encapsulated styles can only reach in its own template; the three kinds the mocks use (router link, external link, button) cover every row.
- **D-8** *Can a danger alert be dismissed?* No. The design system forbids hiding a problem that is still there; `dismissible` is ignored on danger with a dev-mode error, so a page cannot ship one by mistake.
- **D-9** *Is the title a heading?* No, a `<p class="alert__title">`, as in every mock: an alert sits inside sections that already have headings, and a heading per alert would break the outline of dialogs and forms.
- **D-10** *Who remembers a dismissed banner?* The shell, for the session, through `dismissed`. The banner has no storage of its own, so it never keeps personal data on the device (L2-114).
