# Booking ticket

| Field | Value |
|---|---|
| Selector | `zm-booking-form`, `zm-booking-form-skeleton` |
| Library path | `frontend/projects/components/src/lib/booking-form/` |
| Status | built (`zm-booking-form`, bar only); planned (`stub` and `auth` variants, `zm-booking-form-skeleton`) |
| Traces to | L2-004, L2-019, L2-022, L2-023, L2-044, L2-086, L2-096, L2-097, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-110, L2-111 |
| Design system | [`booking-form.html`](../../design-system/components/booking-form.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/discover/invalid`](../../mocks/pages/discover/invalid.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/booked-date`](../../mocks/pages/artist/booked-date.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/sign-in/default`](../../mocks/pages/sign-in/default.html), [`pages/sign-in/submitting`](../../mocks/pages/sign-in/submitting.html), [`pages/sign-in/invalid`](../../mocks/pages/sign-in/invalid.html), [`pages/sign-up/success`](../../mocks/pages/sign-up/success.html), [`pages/accept-terms/loading`](../../mocks/pages/accept-terms/loading.html), and every other auth page (see Usage) |
| Rendering | [`booking-form.html`](booking-form.html) |

## Purpose and scope

Zamaro's booking forms are printed like admission tickets: a paper card with a
2 px charcoal frame, a dashed perforation under the title and a hard offset
shadow. `zm-booking-form` is that ticket, in three variants that share one
API:

- **Bar** (`variant="bar"`, `.booking-bar`): the search form in the Discover
  [poster](poster.md). Date, kind of gathering, church location and driving
  radius, submitted with "Show the lineup" (L2-004). Always paper
  (`data-theme="light"`), even in the dark theme.
- **Stub** (`variant="stub"`, `.stub`): the request form on each profile.
  "Book Abigail", the artist's ticket number, "From $650", event date with its
  availability, kind of gathering, church and message, "Request to book · Sat
  14 Nov" and the fine print (L2-019). It follows the page theme.
- **Auth card** (`variant="auth"`, `.stub.auth-card`): the same stub, centred on
  the stage, for sign-in, sign-up, password reset, email checks and two-step
  codes ("Admit one · Your account", L2-022, L2-023).

`zm-booking-form-skeleton` is the stub's loading shape on a profile.

The component is the ticket frame: its head, price, perforation, grid and
shadow. The page owns the `<form>`, its fields, its submit and its
validation, and projects them in order.

Use something else when:

- the form is a long flow (the request page, paying the deposit, editing a
  profile) → [form layout](form-layout.md);
- it is a card of information, not a form → [card](card.md).

Out of scope:

- The fields: [form field](form-field.md), [text field](text-field.md),
  [select](select.md), [date picker](date-picker.md), [textarea](textarea.md);
  the submit: [button](button.md); the quick-pick cities: [chip](chip.md); the
  error summary: [form layout](form-layout.md); alerts: [alert](alert.md).
- Validation rules, prefill (the saved church, the 120 km default), the
  availability check, the idempotency key and what submit does. The page owns
  them (L2-004, L2-019, L2-108).
- The stub's place in the profile (after the reviews below LG, pinned in the
  22 rem sidebar from LG) and the auth card's centring: `.profile-layout` and
  `.auth-layout` belong to [container](container.md).
- "Book for Sat 14 Nov" in the poster scrolling to the stub and focusing its
  date field: the page calls the date field's `focus()`.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default`, `empty`, `error`, `limited` | `bar`, heading "Your event", stamp "Admit one church", h2 | four `zm-form-field`s: "Event date", "Kind of gathering", "Church location", "How far can they drive?" (40 km · 30 min, 80 km · 1 hr, 120 km · 1.5 hr, 200 km · 2.5 hr); `zm-button` primary lg submit "Show the lineup" (`.field--full`) | default; prefilled Thu 24 Dec, 40 km (empty) | paper island on the stage |
| `pages/discover/loading` | `bar`, `busy` | submit busy "Checking calendars…" | busy; fields stay editable | paper island |
| `pages/discover/invalid` | `bar` | `zm-error-summary` h3 "Two things before we can search" (`.field--full`); date and place fields with errors; a `.filters` fieldset "Or pick a city" of 11 `chip--sm` (`.field--full`); submit | invalid, focus on the first invalid field | paper island |
| Dialogs and notifications over Discover (`dialogs/menu`, `notifications/saved-toast/*`…) | `bar` | as on the page | inert | paper island |
| `pages/artist/default`, `pages/artist/no-photos` | `stub`, heading "Book Abigail", stamp "No. ACT-0027", price "From $650", note "per service · travel included", h2 | date with success "Abigail is free Sat 14 Nov"; "Kind of gathering"; "Church" = "Riverside Community Church, Burlington"; "Message (optional)"; submit block lg "Request to book · Sat 14 Nov"; fine: "Nothing is charged until Abigail accepts. Cancel free up to 14 days before." with the policy link | available | surface, in the profile aside |
| `pages/artist/booked-date` | `stub` | date error "Abigail is booked Sun 15 Nov. Try another date."; submit "Request to book · Sun 15 Nov" `disabled` | booked date | surface |
| `pages/artist/empty` | `stub`, "Book Miriam", "No. ACT-0154", "From $300" | date empty; submit "Request to book" | no date yet | surface |
| `pages/profile-preview/default`, `empty` | `stub` | every field and the submit `disabled`; fine print without the link | preview | surface |
| `pages/artist/loading`, `pages/profile-preview/loading` | `zm-booking-form-skeleton` | — | loading | surface |
| `pages/sign-in/default`, `error`, `expired`, `locked`, `invalid` | `auth`, stamp "Admit one · Your account", h1 "Sign in" | lead; `zm-alert` (error, locked: danger; expired: status); `zm-error-summary` (invalid); "Email (required)", "Password (required)"; submit block lg "Sign in"; links "Forgot your password?", "Create an account"; fine "Artists sign in here too." | default, error, expired, locked, invalid | stage |
| `pages/sign-in/submitting`, `sign-up/submitting`, `forgot-password/submitting`, `reset-password/submitting`, `mfa-*/submitting`, `accept-terms/submitting` | `auth`, `busy` | fields `readonly`; submit busy "Signing in…", "Creating account…", "Sending link…", "Saving…", "Checking…", "Accepting…" | busy | stage |
| `pages/sign-up/*` | `auth`, "Admit one · New account", "Create your account" | name, email, password fields, terms `zm-checkbox`, "Create account", links, fine | default, invalid, error, challenge, submitting | stage |
| `pages/forgot-password/*`, `pages/reset-password/*` | `auth`, "Admit one · Password help" / "New password" | email or two password fields; "Send reset link" / "Save new password"; links | default, invalid, error, submitting, loading ("Checking your reset link…" with skeleton fields and a busy "Checking link…") | stage |
| `pages/mfa-challenge/*`, `pages/mfa-setup/*` | `auth`, "Admit one · Two-step sign-in" | code field (large), QR `zm-skeleton thumb-lg` while loading, "Verify and continue" / "Turn on"; links; fine | default, invalid, error, locked (field and submit disabled), recovery, submitting, loading | stage |
| `pages/accept-terms/*` | `auth`, "Admit one · Updated terms", h1 "We’ve updated our terms" | summary text, "Accept and continue"; loading: status line and skeletons (section, `busy`) | default, error, loading, submitting | stage |
| `pages/sign-up/success`, `forgot-password/success`, `reset-password/success`, `reset-password/expired`, `mfa-setup/codes`, `verify-email/*`, `confirm-email/*`, `data-export/*` | `auth`, `landmark`, no `<form>` around it | lead, buttons stacked block ("Keep browsing artists", "Resend the email", "Send a new link", "Try again"), links, fine; `confirm-email/default` and `verify-email/default` `busy` with a status line | success, expired, busy, error | stage |

## Anatomy

All variants:

1. **Frame** — the host: `--color-bg-surface`, `--border-width-thick` solid
   `--color-border-strong`, padding `--space-6`, hard offset shadow.
2. **Title** — a heading with the given ID; it names the page's `<form>` (or
   the host, with `landmark`).
3. **Stamp (optional)** — mono, muted, `aria-hidden="true"` decoration.
4. **Perforation** — `--border-width-thick` dashed `--color-border-strong` rule
   under the head.
5. **Body** — the default slot, in source order.

Bar (`.booking-bar`): the title is `h2.booking-bar__title` (`--text-h4`) with
the stamp as a `<small>` pushed right, and the perforation on the title. The
host is a grid: one column, two from SM; `.booking-bar__title` and any
projected child with `.field--full` span both.

Stub (`.stub`): a column, `--space-5` apart. Head `div.stub__head` holds the
`h2.stub__title` (`--text-h3`, `tabindex="-1"`) and the `span.stub__code`
stamp on one baseline. Then the price block `p > span.stub__price +
span.text-muted` (when `price` is set), the body, and the fine print
`p.stub__fine` (`[slot=fine]`).

Auth card (`.stub.auth-card`): as the stub, but the head stacks the stamp
(kicker) over `h1.auth-card__title` (`--text-h2`), there is no price, and
`div.auth-card__links` (`[slot=links]`) sits after the body, before the fine
print. Width `--layout-auth-width` at most.

`zm-booking-form-skeleton`: a `.stub` frame, `aria-hidden`, holding title,
figure, two control, block and large-control skeletons.

Host: `zm-booking-form` is the ticket itself. It carries the variant classes,
`data-theme="light"` for the bar, `aria-busy` when busy, and is `display:
grid` (bar) or `display: flex` column (stub, auth). The page's `<form>` wraps
it; the host never renders a `<form>`.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'bar' \| 'stub' \| 'auth'` | `'bar'` | no | Host classes `.booking-bar`, `.stub` or `.stub.auth-card`; `bar` also sets `data-theme="light"`. |
| `heading` | `string` | — | yes | "Your event", "Book Abigail", "Sign in". |
| `headingId` | `string` | — | yes | The heading's `id`. The page's `<form>` is `aria-labelledby` it; "Book for Sat 14 Nov" links to it. |
| `headingLevel` | `1 \| 2 \| 3` | `2` | no | `h1` on auth pages (the card holds the page heading), `h3` where the form sits under a page `h2`. |
| `stamp` | `string \| undefined` | `undefined` | no | Bar: the `<small>` ("Admit one church"). Stub: `.stub__code` ("No. ACT-0027"). Auth: the kicker ("Admit one · Your account"). Always `aria-hidden`. |
| `price` | `string \| undefined` | `undefined` | no | Stub only: "From $650" in `.stub__price`. Ignored by the other variants. |
| `priceNote` | `string \| undefined` | `undefined` | with `price` | Stub only: "per service · travel included". |
| `busy` | `boolean` (attribute) | `false` | no | Sets `aria-busy="true"` on the host; projected `.field`s and `.fieldset`s fade to 60 % and ignore pointer input (values kept). The page also sets `busy` on its submit. |
| `landmark` | `boolean` (attribute) | `false` | no | Sets `role="region"` and `aria-labelledby` to `headingId` on the host, for an auth card that is not inside a `<form>` (success, expired, checking a link). |

### Outputs

None. The page's `<form>` emits `ngSubmit`; projected controls emit their own
events.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | `zm-form-field`s, `zm-error-summary`, `zm-alert`, a `.filters` fieldset of `zm-chip`s, `<p>` lead or status text, `zm-skeleton`s, the submit `zm-button` (or stacked block buttons and links in a `.stack`) | Rendered after the head (and the stub's price) in source order. In the bar, children with `.field--full` (the submit, the error summary, the chips) span both columns. |
| `[slot=links]` | `zm-link`s or `<a>`s | Auth: rendered in `.auth-card__links` after the body. Hidden when empty. Other variants render the wrapper hidden. |
| `[slot=fine]` | text and at most one `zm-link` | Stub and auth: rendered inside `p.stub__fine`, last. Hidden when empty. |

Each slot is declared once, outside the variant `@switch` (which renders only
the head and contains no `ng-content`). Every string is an input or projected
content (L2-111).

### `zm-booking-form-skeleton`

No inputs, outputs or slots. The page renders it in the stub's place while the
profile loads and announces the load from its own status line.

## Variants and sizes

| Variant | Host classes | Use for |
|---|---|---|
| Bar | `.booking-bar` + `data-theme="light"` | The Discover search, inside the poster. |
| Stub | `.stub` | The request form in a profile's sidebar. |
| Auth card | `.stub.auth-card` | Every sign-in, account-recovery and email-check page. |
| Stub skeleton | `.stub` (`zm-booking-form-skeleton`) | The stub while the profile loads. |

One size per variant. The bar fills its poster column; the stub fills the
`--layout-sidebar-width` (22 rem) aside from LG and the content width below;
the auth card is full width up to `--layout-auth-width` (28 rem). Fields use
`--control-height-md`, the submit `--control-height-lg`.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | rendered | Paper ticket, perforated head | A form landmark named by the title ("Your event", "Book Abigail", "Sign in") |
| Busy (bar, auth) | `busy` and the submit's `busy` | Fields fade to 60 %, ignore pointer input; submit spinner "Checking calendars…", "Signing in…" | Host `aria-busy="true"`; submit `aria-busy` + `aria-disabled`, keeps focus; a second submit sends nothing |
| Invalid | the page shows the error summary and field errors | Danger summary spanning the bar; fields with `.field__error` | Fields `aria-invalid="true"` with `aria-describedby`; focus moves to the first invalid field (bar) or the summary (auth) |
| Available (stub) | date field `success` "Abigail is free Sat 14 Nov" | Success inline message with a check icon | Read as the date field's description; announced when it changes (`live`) |
| Booked date (stub) | date field `error` "Abigail is booked Sun 15 Nov. Try another date." and the submit `disabled` | Error replaces the help; disabled submit | `aria-invalid`; the submit is out of the tab order |
| No date yet (stub) | date empty | Submit "Request to book" with no date | — |
| Preview (stub) | every control `disabled` | Disabled controls; fine print with no link | Out of the tab order |
| Error, locked, expired (auth) | the page projects a `zm-alert` | Alert above the fields; locked disables the field and submit | The alert's own role |
| Checking (auth) | `busy` + `landmark`, a status line | Spinner line or skeletons in the body | Region `aria-busy`; status announced once |
| Loading (stub) | `zm-booking-form-skeleton` | Title, figure, two controls, block, large control skeletons | Hidden; the page's status line speaks |
| Dark theme, bar | `[data-theme="dark"]` page | Still paper and ink, yellow shadow; light date-picker `color-scheme` | — |
| Dark theme, stub and auth | `[data-theme="dark"]` page | Charcoal surface, light frame, yellow shadow | — |

The stub has no busy or sent state: "Request to book" opens the request page
(`/artists/{slug}/book`) carrying the date, kind of gathering, church and
message, and that page owns sending (D-1).

## Markup

Rendered by the bar, inside the page's form:

```html
<form novalidate aria-labelledby="find-title" aria-busy="false">
  <zm-booking-form class="booking-bar" data-theme="light">
    <h2 id="find-title" class="booking-bar__title">Your event <small aria-hidden="true">Admit one church</small></h2>
    <zm-form-field class="field">…Event date…</zm-form-field>
    <zm-form-field class="field">…Kind of gathering…</zm-form-field>
    <zm-form-field class="field">…Church location…</zm-form-field>
    <zm-form-field class="field">…How far can they drive?…</zm-form-field>
    <zm-button class="field--full" variant="primary" size="lg" type="submit"><button class="btn btn--primary btn--lg" type="submit">Show the lineup</button></zm-button>
  </zm-booking-form>
</form>
```

Busy and invalid bar:

```html
<zm-booking-form class="booking-bar" data-theme="light" aria-busy="true">…<button class="btn btn--primary btn--lg" type="submit" aria-busy="true" aria-disabled="true">Checking calendars…</button></zm-booking-form>

<zm-booking-form class="booking-bar" data-theme="light">
  <h2 id="find-title" class="booking-bar__title">Your event <small aria-hidden="true">Admit one church</small></h2>
  <zm-error-summary class="error-summary field--full" …>…Two things before we can search…</zm-error-summary>
  …fields with errors…
  <fieldset class="filters field--full"><legend>Or pick a city</legend><zm-chip size="sm" …>Toronto</zm-chip>…</fieldset>
  <zm-button class="field--full" …>…Show the lineup…</zm-button>
</zm-booking-form>
```

Rendered by the stub:

```html
<aside aria-labelledby="book-title">
  <form novalidate aria-labelledby="book-title">
    <zm-booking-form class="stub">
      <div class="stub__head">
        <h2 id="book-title" class="stub__title" tabindex="-1">Book Abigail</h2>
        <span class="stub__code" aria-hidden="true">No. ACT-0027</span>
      </div>
      <p><span class="stub__price">From $650</span><br><span class="text-muted">per service · travel included</span></p>
      <zm-form-field class="field">…Event date… <span class="inline-msg inline-msg--success" id="book-date-success">…Abigail is free Sat 14 Nov</span></zm-form-field>
      …Kind of gathering, Church, Message (optional)…
      <zm-button variant="primary" size="lg" block type="submit"><button class="btn btn--primary btn--lg btn--block" type="submit">Request to book · Sat 14 Nov</button></zm-button>
      <p class="stub__fine">Nothing is charged until Abigail accepts. <a href="/#policy">Cancel free up to 14 days before</a>.</p>
    </zm-booking-form>
  </form>
</aside>
```

Rendered by the auth card, and a status card with `landmark`:

```html
<form novalidate aria-labelledby="card-title">
  <zm-booking-form class="stub auth-card">
    <div class="stub__head">
      <span class="stub__code" aria-hidden="true">Admit one · Your account</span>
      <h1 id="card-title" class="auth-card__title">Sign in</h1>
    </div>
    <p class="text-muted">Welcome back. Your saved artists and requests are waiting.</p>
    …Email, Password…
    <zm-button variant="primary" size="lg" block type="submit">…Sign in…</zm-button>
    <div class="auth-card__links"><a href="/forgot-password">Forgot your password?</a><a href="/sign-up">Create an account</a></div>
    <p class="stub__fine">Artists sign in here too.</p>
  </zm-booking-form>
</form>

<zm-booking-form class="stub auth-card" role="region" aria-labelledby="card-title">…Check your email to finish signing up…</zm-booking-form>
```

Rendered by `zm-booking-form-skeleton`:

```html
<zm-booking-form-skeleton class="stub" aria-hidden="true">
  <zm-skeleton class="skeleton skeleton--title" aria-hidden="true"></zm-skeleton>
  <zm-skeleton class="skeleton skeleton--figure" aria-hidden="true"></zm-skeleton>
  <zm-skeleton class="skeleton skeleton--control" aria-hidden="true"></zm-skeleton>
  <zm-skeleton class="skeleton skeleton--control" aria-hidden="true"></zm-skeleton>
  <zm-skeleton class="skeleton skeleton--block" aria-hidden="true"></zm-skeleton>
  <zm-skeleton class="skeleton skeleton--control-lg" aria-hidden="true"></zm-skeleton>
</zm-booking-form-skeleton>
```

Consumer templates:

```html
<form novalidate [formGroup]="search" (ngSubmit)="find()" aria-labelledby="find-title" [attr.aria-busy]="searching()">
  <zm-booking-form [heading]="'discover.bar.title' | transloco" [stamp]="'discover.bar.stamp' | transloco" headingId="find-title" [busy]="searching()">
    @if (errors().length) {
      <zm-error-summary class="field--full" [headingLevel]="3" [heading]="errorHeading()" [items]="errors()" />
    }
    <zm-form-field fieldId="find-date" [label]="'discover.bar.date' | transloco" [error]="dateError()"><zm-date-picker formControlName="date" … /></zm-form-field>
    …
    <zm-button class="field--full" variant="primary" size="lg" type="submit" [busy]="searching()">{{ (searching() ? 'discover.bar.busy' : 'discover.bar.submit') | transloco }}</zm-button>
  </zm-booking-form>
</form>
```

```html
<form novalidate [formGroup]="request" (ngSubmit)="openRequestPage()" aria-labelledby="book-title">
  <zm-booking-form variant="stub" headingId="book-title" [heading]="bookHeading()" [stamp]="artist.ticketNumber" [price]="fromPrice()" [priceNote]="'profile.stub.priceNote' | transloco">
    <zm-form-field fieldId="book-date" live [label]="'profile.stub.date' | transloco" [success]="freeMessage()" [error]="bookedMessage()">…</zm-form-field>
    …
    <zm-button variant="primary" size="lg" block type="submit" [disabled]="dateBooked()">{{ submitLabel() }}</zm-button>
    <ng-container slot="fine">{{ fineLead() }} <zm-link link="/" fragment="policy">{{ 'profile.stub.cancelFree' | transloco }}</zm-link>.</ng-container>
  </zm-booking-form>
</form>
```

The `.booking-bar*`, `.stub*` and `.auth-card*` classes, the heading IDs and
`aria-busy` are a contract: page objects find each form by its title and the
price and code by class.

## Design

- Frame: `--color-bg-surface`, `--color-fg-default`, `--border-width-thick`
  solid `--color-border-strong`, padding `--space-6`, square corners.
- Shadow: bar `--size-offset-3` `--size-offset-3` 0 `--color-accent-on-stage`
  (yellow in both themes); stub `--shadow-3` (`--color-shadow`: ink in light,
  yellow in dark); auth card the bar's yellow offset.
- Bar: `display: grid`, gap `--space-4`; from SM `grid-template-columns: 1fr
  1fr`; title `--text-h4`, uppercase, `display: flex`, `justify-content:
  space-between`, `flex-wrap: wrap`, `align-items: baseline`, gap
  `--space-2`, padding-bottom `--space-3`, dashed bottom rule; `small` in
  `--text-stub` with `white-space: nowrap`, so at 320 px it drops whole under
  the title instead of splitting (D-9).
- Stub and auth: `display: flex`, column, gap `--space-5`; head `display:
  flex`, `justify-content: space-between`, `align-items: baseline`, gap
  `--space-2`, padding-bottom `--space-3`, dashed bottom rule; title
  `--text-h3`; code `--text-stub`, `--letter-spacing-stamp`, uppercase,
  `--color-fg-muted`, `white-space: nowrap`; price `--text-figure-lg`; note
  `--color-fg-muted`; fine print `--text-caption`, `--color-fg-muted`.
- Auth: head stacks (`flex-direction: column`, `align-items: flex-start`, gap
  `--space-1`); title `--text-h2`; links `display: flex`, `flex-wrap: wrap`,
  `justify-content: space-between`, gap `--space-3`, `--text-body-sm`;
  `max-width: --layout-auth-width`, `width: 100%`, `position: relative`,
  `z-index: --z-raised` (above the poster's halftone).
- Busy fade: projected `.field` and `.fieldset` at `opacity: 0.6`,
  `pointer-events: none`.
- No component tokens. Fields and buttons keep theirs (`--field-*`, `--btn-*`).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Ticket surface | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` (stub, auth); bar stays light |
| Frame, perforation, field edges | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` (stub, auth) |
| Labels, values, title | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` (stub, auth) |
| Code, price note, fine print | `--color-fg-muted` | per theme | per theme |
| Bar and auth shadow | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Stub shadow | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Availability message | `--color-success-fg` | per theme | per theme |
| Date error | `--color-danger-fg` | `--palette-red-700` | `--palette-red-300` (stub); bar keeps the light value |
| Focus ring inside the bar | `--color-focus-ring` | `--palette-ink-750` | `--palette-ink-750` (light island) |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Labels, values, title |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Price note, code, fine print |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Frame and field edges |
| `--color-success-fg` | `--color-bg-surface` | 4.5:1 | "Abigail is free Sat 14 Nov" |
| `--color-danger-fg` | `--color-bg-surface` | 4.5:1 | Date error |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Submit label |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring inside the paper bar |

The bar is a `data-theme="light"` island: its tokens are the newsprint theme
in both themes, including its focus ring, which must be ink, not the stage
yellow (yellow on paper is about 1.4:1). Under forced colours the frame and
perforation use `CanvasText` (tokens).

## Responsive behaviour

- **Bar**: one column at XS; two columns from SM (576 px), title and
  `.field--full` children spanning both (L2-097). Inside the poster it stacks
  under the copy until LG, then takes the right column (poster CRD).
- **Stub**: full width under LG, after the reviews; from LG in the 22 rem aside,
  pinned while the profile scrolls (layout owned by `.profile-layout`, L2-098).
  It must fit a laptop screen without scrolling inside itself: four fields at
  most.
- **Auth card**: full width minus the page margins on phones, at most 28 rem,
  centred; its links wrap onto two lines.
- The submit label wraps onto two balanced lines rather than overflow; in the
  22 rem aside and at 360 px "Request to book · Sat 14 Nov" already takes two,
  so it is the longest allowed.
- A single-line value longer than its field ("Riverside Community Church,
  Burlington" in the 22 rem stub) scrolls inside the native input; the field
  never grows past the ticket (D-8).
- At 320 px nothing in any variant clips or scrolls horizontally; the bar's
  stamp wraps under the title if it must. At 200 % zoom every field and the
  submit stay reachable. Fields are 44 px, the submit 56 px. The bar's stamp
  never splits: "Admit one church" moves under "Your event" at 320 px.

## Accessibility

### Role and pattern

The page's native `<form>` is named by the title (`aria-labelledby`), which
makes it a form landmark: "Your event", "Book Abigail", "Sign in". The stub's
`<aside>` is labelled by the same title. A status auth card with `landmark` is
a region. No APG widget pattern applies; every control is native.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Through the fields and the submit in reading order (date, kind, place or church, radius or message, submit), then the auth links. |
| <kbd>Enter</kbd> | Submits from any single-line field or the submit; adds a line in the message textarea. Does nothing while busy (button CRD). |
| <kbd>Space</kbd> | Activates the focused submit. |

### Focus

Fields show the double ring; inside the bar every ring is ink on paper. On a
submit with errors focus moves to the first invalid field (bar, L2-004) or the
error summary (auth). The stub title has `tabindex="-1"` so the poster's
"Book for Sat 14 Nov" can scroll to it; the page then focuses the date field
(L2-019). Becoming busy never moves focus.

### Labelling

Every control has a visible label from its form field; help and errors are
`aria-describedby` descriptions. The stamp ("Admit one church", "No.
ACT-0027", "Admit one · Your account") is `aria-hidden` decoration; the price
and its note are plain text read in order. The busy submit's name follows its
label ("Checking calendars…").

### Announcements

The stub's availability message is announced when it changes (the form
field's `live`). Busy auth cards announce from their status line. The bar
announces nothing itself; the lineup's status line reports the search.

### Motion

Only the busy spinner moves (`--duration-loop`) and it keeps turning under
reduced motion because it reports status (button CRD); field borders and rings
change in `--duration-fast`, which drops to near zero under
`prefers-reduced-motion: reduce`.

## Content and internationalisation

- **Titles**: "Your event" (bar); "Book {first name}" (stub, L2-019); the auth
  page's task ("Sign in", "Create your account", "Choose a new password").
- **Stamps**: "Admit one church"; the artist's ticket number "No. ACT-0027"
  (artist numbers use `ACT-`, never `ZAM-`, L2-019); "Admit one · {topic}" on
  auth cards.
- **Price**: "From $650" and "per service · travel included" (L2-019, money per
  L2-110).
- **Availability**: "Abigail is free Sat 14 Nov"; booked "Abigail is booked Sun
  15 Nov. Try another date." (L2-019).
- **Submit**: "Show the lineup", busy "Checking calendars…"; "Request to book ·
  Sat 14 Nov", or "Request to book" before a date is chosen.
- **Fine print**: "Nothing is charged until Abigail accepts. Cancel free up to
  14 days before." with the second sentence linking to the full policy (L2-019,
  L2-044).
- Radius options pair distance and time: "120 km · 1.5 hr" (L2-004, L2-110).
- Translatable inputs: `heading`, `stamp` (except the ticket number), `price`
  pattern, `priceNote`, and all projected copy. Data values: first names,
  ticket numbers, prices and dates formatted by the API library's formatting
  service. French runs about 30 % longer: titles, the stamp and the submit wrap.

## Performance

- Change detection: `OnPush`, signal inputs; host classes and attributes from
  one `computed`. No subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/BookingForm.ts`
  renders the Discover bar with its four fields (keep it, adding the
  submit "Show the lineup"). Add `BookingStub.ts` (Abigail's stub: "Book
  Abigail", "No. ACT-0027", "From $650", four fields, "Request to book · Sat 14
  Nov", fine print), `AuthCard.ts` (the sign-in card) and
  `BookingFormSkeleton.ts`, and export them from `scenarios/index.ts`.
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms.
- Composite scenarios: `Poster` (the bar inside it, once the scenario projects
  it), `DarkTheme`.
- Layout stability: the stub skeleton has the stub's frame, padding, gap and
  each part at its real height, so the stub lands without moving the aside
  (L2-105). Becoming busy changes no size.
- Imports: Angular core and `zm-skeleton` (skeleton component only). Fields,
  buttons, chips, alerts and links arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given the Discover bar, when it renders, then the host has `.booking-bar` and `data-theme="light"`, the title "Your event" is an `h2` with id "find-title" carrying an `aria-hidden` "Admit one church", and the page's form is named "Your event". (L2-004)
- **AC-2** Given the bar's four fields and submit, when it renders, then the fields read "Event date", "Kind of gathering", "Church location" and "How far can they drive?", and the submit "Show the lineup" spans the full width. (L2-004)
- **AC-3** Given the invalid search, when the bar renders the error summary and the "Or pick a city" chips, then both carry `.field--full` and span both columns at SM and up. (L2-004)
- **AC-4** Given Abigail's stub, when it renders, then it shows "Book Abigail", the code "No. ACT-0027", "From $650", "per service · travel included", the four fields, "Request to book · Sat 14 Nov" and the fine print, in that order. (L2-019)
- **AC-5** Given the fine print, when it renders, then it reads "Nothing is charged until Abigail accepts. Cancel free up to 14 days before." and "Cancel free up to 14 days before" links to the full cancellation policy. (L2-044)
- **AC-6** Given the sign-in card, when it renders, then the host has `.stub.auth-card`, the kicker "Admit one · Your account" sits above the `h1` "Sign in", and the links "Forgot your password?" and "Create an account" sit in `.auth-card__links` between the submit and "Artists sign in here too.". (L2-023)
- **AC-7** Given the sign-up success card with `landmark` and no form, when it renders, then the host is a region named "Check your email to finish signing up". (L2-022)
- **AC-8** Given no price, links or fine print, when a ticket renders, then no empty price block, links row or fine-print paragraph takes space. (L2-019)

### States

- **AC-9** Given a valid search, when "Show the lineup" is pressed and the search is pending, then the host has `aria-busy="true"`, the submit reads "Checking calendars…" with `aria-busy` and `aria-disabled`, the fields fade to 60 % but keep their values, and a second press sends no second search. (L2-108)
- **AC-10** Given a date on which Abigail is free, when it is chosen in the stub, then the date field's description reads "Abigail is free Sat 14 Nov" as a success message. (L2-019)
- **AC-11** Given Sun 15 Nov, when it is chosen, then the stub shows "Abigail is booked Sun 15 Nov. Try another date." with the date `aria-invalid="true"`, and the submit "Request to book · Sun 15 Nov" is disabled. (L2-019)
- **AC-12** Given an available date and the stub submitted, when "Request to book · Sat 14 Nov" is pressed, then the request page opens with the date, kind of gathering, church and message carried, and the stub itself shows no busy state. (L2-019)
- **AC-13** Given sign-in is submitting, when the card renders, then the host has `aria-busy="true"`, the fields are read-only and faded, and the submit reads "Signing in…" with `aria-busy`. (L2-108)
- **AC-14** Given invalid credentials, when the card re-renders, then it shows the summary "Couldn’t sign you in" and the field error "Email or password is incorrect.", both fields `aria-invalid="true"`. (L2-023)
- **AC-15** Given the profile is loading, when `zm-booking-form-skeleton` renders, then it is an `aria-hidden` `.stub` with title, figure, two control, block and large-control skeletons, and swapping it for Abigail's stub shifts layout by 0.05 or less. (L2-105)

### Keyboard and focus

- **AC-16** Given the bar, when the booker tabs through it, then focus moves date, kind, location, radius, "Show the lineup", and every focus ring inside the paper bar is ink (`--color-focus-ring` of the light theme), not stage yellow, in both themes. (L2-101)
- **AC-17** Given an empty search is submitted, when the errors render, then focus moves to the first invalid field, the date. (L2-004)
- **AC-18** Given a viewport narrower than LG, when "Book for Sat 14 Nov" in the poster is activated, then the stub's title (`tabindex="-1"`) scrolls into view and focus lands on its date field. (L2-019)

### Screen readers

- **AC-19** Given the stub, when its date help is read, then the date field is named "Event date" and described by "Abigail is free Sat 14 Nov", and "No. ACT-0027" is not announced. (L2-102)
- **AC-20** Given each variant in every state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when Discover renders, then the bar stays paper with ink text and a yellow offset shadow; when a profile renders, then the stub is a `--color-bg-surface` charcoal with a light frame and a yellow `--shadow-3`. (L2-104)
- **AC-22** Given both themes, when contrast is measured, then labels and values are at least 4.5:1, the code and fine print at least 4.5:1, the frame at least 3:1, and the availability and error messages at least 4.5:1 on the ticket. (L2-103)

### Responsive

- **AC-23** Given XS (360 px), when Discover renders, then the bar's fields stack in one column; given SM and MD, then they sit in two columns. (L2-097)
- **AC-24** Given LG, when Abigail's profile renders, then the stub fills the 22 rem aside; below LG it follows the reviews at full width. (L2-098)
- **AC-25** Given the 22 rem stub, when "Request to book · Sat 14 Nov" renders, then it wraps to at most two lines inside the button and never overflows. (L2-096)
- **AC-26** Given a 320 px viewport and text zoomed to 200 %, when each variant renders, then nothing is clipped, the bar's stamp "Admit one church" stays on one line (under the title if it must), the page does not scroll horizontally, and every field and the submit stay reachable. (L2-096)
- **AC-27** Given the French catalogue, when titles, stamps and the submit are about 30 % longer, then they wrap inside the ticket without clipping. (L2-111)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when a field takes focus or the bar goes busy, then borders and rings change without a transition and only the status spinner turns. (L2-103)

### Formatting

- **AC-29** Given a price of 1800 dollars for Hosanna Collective, when the stub renders the page's formatted price, then it reads "From $1,800". (L2-110)

### Performance

- **AC-30** Given the `BookingForm`, `BookingStub`, `AuthCard` and `BookingFormSkeleton` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-booking-form`, the bar only, with `heading`, `stamp` and
`titleId`. To meet this CRD:

- Rename `titleId` to `headingId` and add `headingLevel`.
- Add `variant` (`bar` default, `stub`, `auth`), each rendering its head in one
  `@switch` with no `ng-content` inside it, and the host classes
  `.booking-bar` / `.stub` / `.stub auth-card`. Keep `data-theme="light"` for
  the bar only.
- Make `stamp` optional; add `price`, `priceNote`, `busy` and `landmark`.
- Span projected `.field--full` children in the bar (the global layout class
  from the form-layout CRD) instead of asking pages to set `grid-column`.
- Add the `[slot=links]` and `[slot=fine]` wrappers with `:empty { display:
  none }`.
- Add the busy fade for projected fields (D-4), the stub `tabindex="-1"`
  title, and the bar title's `flex-wrap` with a no-wrap stamp (D-9).
- Add `zm-booking-form-skeleton` (`booking-form-skeleton.ts`) using
  `zm-skeleton`.
- Depends on the button and field CRDs restoring the ink focus ring on a light
  island inside `.on-stage` (`:host-context(.on-stage [data-theme="light"])`);
  verify AC-16 when the bar is wired.
- Add the `BookingStub.ts`, `AuthCard.ts` and `BookingFormSkeleton.ts`
  scenarios; extend `BookingForm.ts` with the submit only if its rendered
  instance changes.

## Decisions

- **D-1** *Does the stub's submit go busy ("Sending request…"), or hand over to the request page?* It hands over. The design system says the stub has no busy or sent state, its states matrix marks the stub submit "never busy", and every mock stub's form opens `pages/book`; "Sending request…" appears only on the request page. The page's submit is a projected `zm-button`, so the stub needs no API for either behaviour. The team lead confirmed this ruling; the busy "Sending request…" belongs to `pages/book`.
- **D-2** *One component with variants, or three components?* One, `zm-booking-form`, because the three share the frame, the slots and the order of the body; only the head differs, and the head holds no slots, so a `@switch` there is safe under AGENTS.md's slot rule. The skeleton is separate because it has no data (as `zm-ticket-skeleton`).
- **D-3** *Who owns the `<form>`?* The page. Reactive forms, `ngSubmit` and validation live there, and an auth status card has no form at all. The host carries the ticket classes so the visual contract holds; the extra wrapper element does not affect layout.
- **D-4** *How do projected fields fade while busy under emulated encapsulation?* The component's stylesheet scopes one rule to its own projected descendants, `:host([aria-busy='true']) ::ng-deep :is(.field, .fieldset)`, matching the design system's `.stub[aria-busy] .field`. It is the only deep rule, it never leaves the host, and it keeps every booking page from repeating the fade.
- **D-5** *How do bar children span both columns?* With the global `.field--full` layout class (form-layout CRD), which `zm-form-field` sets through `full` and pages put on the submit, the error summary and the chips fieldset. A projected element cannot be matched by the host's encapsulated styles, and a shared class keeps one spanning rule across every form grid.
- **D-6** *Is the artist's ticket number announced?* No. It is `aria-hidden` decoration in the design system and every mock; L2-019 requires it to be shown, which it is, and the stub's name "Book Abigail" carries the meaning.
- **D-7** *Does the auth card belong here?* Yes. The design system defines it on this page as "the same paper stub", and the [card](card.md) CRD defers it here.
- **D-8** *The 360 px and 1280 px renderings show "Riverside Community Church, Burlington" running past the edge of the stub's Church field. Is that clipped text (L2-096)?* No. A native single-line input scrolls its value and the caret reaches every character; the value is never lost and the page never scrolls sideways. Shortening the saved church or switching to a textarea would change the data or the control, so the stub keeps the native field.
- **D-9** *At 320 px the bar's "Admit one church" stamp splits across two lines beside a two-line "Your event". Fix how?* The stamp gets `white-space: nowrap` (as `.stub__code` already has) and the title row wraps, so the stamp drops whole under the title. The design system is silent; a stamp broken mid-phrase reads as a layout fault.
