# Error page

| Field | Value |
|---|---|
| Selector | `zm-error-page`, `zm-error-stage` |
| Library path | `frontend/projects/components/src/lib/error-page/` |
| Status | planned |
| Traces to | L2-021, L2-086, L2-093, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-107, L2-110, L2-111, L2-114 |
| Design system | [`error-page.html`](../../design-system/components/error-page.html) |
| Source mocks | [`pages/not-found/default`](../../mocks/pages/not-found/default.html), [`pages/not-found/artist`](../../mocks/pages/not-found/artist.html), [`pages/server-error/default`](../../mocks/pages/server-error/default.html), [`pages/offline/default`](../../mocks/pages/offline/default.html), [`pages/artist/error`](../../mocks/pages/artist/error.html), [`pages/profile-preview/error`](../../mocks/pages/profile-preview/error.html) |
| Rendering | [`error-page.html`](error-page.html) |

## Purpose and scope

When a whole page cannot be shown, Zamaro prints the failure like a gig poster
and offers one way back, while the top bar and footer stay so nobody is
stranded. Two compositions cover every page-level error:

- `zm-error-page`, the **full-page error** (`.error-page`): an overline with the
  status in plain words, a display-size poster headline ("No show", "Dead
  air", "No signal"), a lead that says whose fault it is and what is safe, an
  optional receipt with the reference, the recovery buttons and a footnote.
  It serves the 404 page, the missing-artist 404 (L2-021), the 500 page with
  its request ID (L2-093) and the offline page (L2-114).
- `zm-error-stage`, the **error with known context**: the charcoal poster stage
  with the breadcrumb, a show-language kicker ("Show postponed") and a
  plain-words title ("This profile didn’t load"), then the recovery
  [alert](alert.md) in `.page-error` with Try again and a way back (L2-107).

Use something else when:

- only one section failed (the Discover lineup) → an [alert](alert.md) in that
  section, poster unchanged;
- the page loaded but a list is empty, or the person may not open a resource
  inside the shell (someone else's booking, a church in the artist area) → an
  [empty state](empty-state.md);
- a background action failed (saving an artist) → a danger [toast](toast.md).

Out of scope:

- Serving the real HTTP status (404, 500, 503), the document title ("Page not
  found · Zamaro"), and moving focus to the heading on a route change: the
  router and server rendering own them (L2-101.3).
- The similar-artists section under the missing-artist 404 ("Free that night
  instead"): the page renders it with [tickets](ticket.md).
- The persistent "You’re offline" banner above the offline page and the
  connection-lost banner: the [alert](alert.md) banner, shown by the shell.
- Retrying, counting failures and deciding when the reference appears: the
  page passes the inputs for each step.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/not-found/default` | `zm-error-page`, overline "Error 404 · Page not found", poster "No show" + hidden suffix ": page not found" as the `h1`, lead "We couldn’t find that page. The link may be old, or the address has a typo." | actions: primary lg link "Find who’s free" + arrow, secondary lg link "Your saved artists"; note "Followed a link from one of our emails? Tell us and we’ll fix it." with a `mailto:` link | default | canvas |
| `pages/not-found/artist` | `zm-error-page`, overline "Error 404 · Artist not found", decorative poster "No show" (`aria-hidden`), `heading` "This artist isn’t on Zamaro" as the `h1`, lead "They may have left or changed their address. Here are similar artists who are free on Sat 14 Nov, nearest first." | none; the page's similar-artists section follows | default | canvas |
| `pages/server-error/default` | `zm-error-page`, overline "Error 500 · Something broke on our side", poster "Dead air" + suffix ": something went wrong", lead "Something went wrong on our side, not yours. Anything you already sent is safe." | details: receipt "Reference 7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17", "When Fri 9 Oct, 10:42 a.m."; actions: primary lg "Try again" with refresh icon, secondary lg link "Back to Discover"; note "Still broken? Email us the reference and we’ll look it up." (`mailto:` with the reference as subject) | default, retrying (busy "Retrying…"), failed again | canvas |
| `pages/offline/default` | `zm-error-page`, overline "Offline", poster "No signal" as the `h1`, lead "We can’t reach Zamaro right now. Check your connection and try again." | actions: primary lg "Try again"; note "Requests you’ve already sent are safe, and anything you were typing stays on the page you left." | default, retrying | canvas, under the persistent offline banner |
| `pages/artist/error` | `zm-error-stage`, kicker "Show postponed", title "This profile didn’t load" (`name` style), alert danger `live` "We couldn’t reach the artist’s page" | breadcrumb "Discover · Sat 14 Nov" / "Artist"; message "It’s on our side, not yours. Your search is saved and any request you’ve sent is safe."; actions: primary "Try again" with icon, secondary link "Back to the lineup" | default, retrying, failed again | stage, then canvas |
| `pages/profile-preview/error` | `zm-error-stage`, kicker "Show postponed", title "This preview didn’t load", no breadcrumb | alert as above for the artist's own preview | default | stage |
| Design system only | `zm-error-stage` with `display` headline, `strike` ("Live" / "On hold", "Here" / "Not found", "Doors" / "Back soon"), `subtitle`, `reference`; alert tones danger, warning, info; maintenance with no actions | — | first failure, retrying, failed again, focused | stage |
| Design system only | `zm-error-page` with `strike` before the poster word, off the stage (red strike) | — | default | canvas |

## Anatomy

`zm-error-page` (host renders `div.container.error-page`):

1. **Column** — `.error-page`: a left-aligned grid, gap `--space-6`, padding
   `--space-16` top and `--space-20` bottom.
2. **Overline** — `p.overline`: the status in plain words, with the code.
3. **Poster headline** — `.error-poster` in `--text-display`, uppercase: the
   page's `h1`, or decoration (`p`, `aria-hidden`) when `heading` is set.
   Optional `.strike` word before it (`aria-hidden`) and an optional visually
   hidden suffix.
4. **Heading (optional)** — `h1.page-head__title` with `heading`, after a
   decorative poster.
5. **Lead** — `p.lead`: whose fault, what is safe.
6. **Details (optional)** — `[slot=details]`, the receipt, full width up to
   `--layout-auth-width`.
7. **Actions** — `div.cluster` of large buttons, "Try again" first.
8. **Note (optional)** — `p.text-muted` with a link to the team.

`zm-error-stage` (host renders two blocks):

1. **Stage** — `section.poster.on-stage` labelled by the title, holding
   `.container.stack.stack--lg`.
2. **Breadcrumb (optional)** — `[slot=breadcrumb]`.
3. **Kicker** — `p.overline.poster__kicker`, yellow.
4. **Title** — `h1`: `.artist-poster__name` (`name`, the profile's
   known-context style) or `.error-poster` (`display`), with optional
   `.strike` and `.poster__sub` and `.error-code` lines.
5. **Recovery** — `div.container.page-error` holding one `zm-alert` with the
   message (default slot) and the actions (`[slot=actions]`).

Hosts: both are `display: block`. The page places them inside `<main>`.

## API

### `zm-error-page` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `overline` | `string` | — | yes | "Error 404 · Page not found", "Error 500 · Something broke on our side", "Offline". |
| `poster` | `string` | — | yes | The display words: "No show", "Dead air", "No signal". Six letters or fewer per word. |
| `posterSuffix` | `string \| undefined` | `undefined` | no | Visually hidden text after the poster words inside the `h1`: ": page not found". Ignored when `heading` is set. |
| `strike` | `string \| undefined` | `undefined` | no | A struck word before the poster words, `aria-hidden`: "Live" before "On hold". |
| `heading` | `string \| undefined` | `undefined` | no | When set, the poster becomes an `aria-hidden` `<p>` and this text is the `h1.page-head__title`: "This artist isn’t on Zamaro". |
| `lead` | `string` | — | yes | One or two sentences. |
| `headingId` | `string` | `'error-title'` | no | The `h1`'s `id`. The `h1` has `tabindex="-1"`. |
| `autoFocus` | `boolean` (attribute) | `false` | no | Focuses the `h1` after the first render, for an error that replaces content in a page that was already open. |

### `zm-error-stage` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `kicker` | `string` | — | yes | "Show postponed", "Error 500 · Show postponed". |
| `heading` | `string` | — | yes | "This profile didn’t load", "On hold". |
| `headline` | `'name' \| 'display'` | `'name'` | no | `name`: `.artist-poster__name` (`--text-poster`), for a page whose context is known. `display`: `.error-poster` (`--text-display`). |
| `strike` | `string \| undefined` | `undefined` | no | With `display`: a struck word before the heading, `aria-hidden`, yellow on the stage. |
| `subtitle` | `string \| undefined` | `undefined` | no | `.poster__sub`: "Zamaro hit a problem showing this page." |
| `reference` | `string \| undefined` | `undefined` | no | `.error-code`: "Reference 7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17 · Fri 9 Oct, 2:32 p.m." Selectable text. |
| `headingId` | `string` | `'error-title'` | no | The `h1`'s `id`; the section is `aria-labelledby` it; `tabindex="-1"`. |
| `alertTone` | `'danger' \| 'warning' \| 'info'` | `'danger'` | no | The recovery alert's tone: failure, refused, nothing wrong. |
| `alertHeading` | `string` | — | yes | "We couldn’t reach the artist’s page". |
| `alertLive` | `boolean` (attribute) | `false` | no | Passed to `zm-alert` as `live="alert"` when true and `live="off"` when false (no role), whatever the tone; set it when the error replaces content in an open page (a failed load or retry). |
| `autoFocus` | `boolean` (attribute) | `false` | no | As for `zm-error-page`. |

### Outputs

None. Try again and the ways back are projected buttons and links.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `zm-error-page` `[slot=details]` | one `zm-description-list` (receipt) | After the lead; hidden when empty. |
| `zm-error-page` `[slot=actions]` | `zm-button` (Try again), `zm-button-link`, `zm-button-anchor`, size lg | In a `.cluster`; hidden when empty. |
| `zm-error-page` `[slot=note]` | text and one `zm-link` or `zm-button-anchor` | Inside `p.text-muted`, last; hidden when empty. |
| `zm-error-stage` `[slot=breadcrumb]` | one `zm-breadcrumb` | First in the stage; hidden when empty. |
| `zm-error-stage` default | `<p>` message | The alert's body. |
| `zm-error-stage` `[slot=actions]` | `zm-button`, `zm-button-link`, `zm-button-anchor` | The alert's actions. |

Each slot is declared once; the `h1`/`p` choice is one `@if` with no
`ng-content` in its branches. All copy arrives through inputs or slots
(L2-111).

## Variants and sizes

| Variant | Selector and inputs | Use for |
|---|---|---|
| Not found | `zm-error-page`, poster "No show" | A wrong address (404). |
| Artist not found | `zm-error-page` with `heading` | A missing, suspended or deleted artist (404, L2-021). |
| Server error | `zm-error-page` with details | A 500, with the request ID (L2-093). |
| Offline | `zm-error-page`, poster "No signal" | No connection on navigation (L2-114). |
| Known context | `zm-error-stage`, `headline="name"` | A profile or preview that failed to load (L2-107). |
| Stage poster | `zm-error-stage`, `headline="display"`, `strike`, `reference` | Design-system compositions: maintenance ("Back soon", info tone, no actions), access refused (warning tone). |

Sizes follow the design system's three scales: full page (`zm-error-page`),
page with known context (`zm-error-stage`), section (an [alert](alert.md), not
this component). Type scales with the viewport: `--text-display` 64–160 px,
`--text-poster` 72–208 px.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| First failure | rendered | Poster words or stage, lead or alert, "Try again" first | One `h1`; no live role on a fresh page load |
| Retrying | the page sets `busy` on Try again | Busy "Retrying…" with spinner | Button `aria-busy`; focus stays on it |
| Failed again | the page changes the alert or lead and shows `reference` / details | "Still not working" with the reference; Email us | With `alertLive`, announced by `role="alert"` |
| Recovered | the page renders the real content | The error is replaced | Focus moves to the new page's heading (router) |
| Replacing open content | `autoFocus` (and `alertLive`) | — | Focus moves to the `h1`, so the failure is heard |
| Focused action | `:focus-visible` on Try again | Two-tone ring (yellow on the stage) | — |
| Off the stage | `strike` in `zm-error-page` | Strike line `--color-danger-solid` | Struck word hidden |
| On the stage | `strike` in `zm-error-stage` | Strike line `--color-accent-on-stage` | Struck word hidden |

## Markup

Rendered by `zm-error-page`, server error:

```html
<zm-error-page>
  <div class="container error-page">
    <p class="overline">Error 500 · Something broke on our side</p>
    <h1 id="error-title" class="error-poster" tabindex="-1">Dead air<span class="visually-hidden">: something went wrong</span></h1>
    <p class="lead">Something went wrong on our side, not yours. Anything you already sent is safe.</p>
    <zm-description-list …><dl class="receipt">
      <div class="receipt__row"><dt>Reference</dt><dd>7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17</dd></div>
      <div class="receipt__row"><dt>When</dt><dd>Fri 9 Oct, 10:42 a.m.</dd></div>
    </dl></zm-description-list>
    <div class="cluster">
      <zm-button variant="primary" size="lg">…Try again</zm-button>
      <zm-button-link size="lg" link="/">Back to Discover</zm-button-link>
    </div>
    <p class="text-muted">Still broken? <a href="mailto:hello@zamaro.ca?subject=7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17">Email us the reference</a> and we’ll look it up.</p>
  </div>
</zm-error-page>
```

Artist not found (decorative poster, separate heading) and a struck word:

```html
<div class="container error-page">
  <p class="overline">Error 404 · Artist not found</p>
  <p class="error-poster" aria-hidden="true">No show</p>
  <h1 id="error-title" class="page-head__title" tabindex="-1">This artist isn’t on Zamaro</h1>
  <p class="lead">They may have left or changed their address. Here are similar artists who are free on Sat 14 Nov, nearest first.</p>
</div>

<h1 id="error-title" class="error-poster" tabindex="-1"><span class="strike" aria-hidden="true">Live</span> On hold</h1>
```

Rendered by `zm-error-stage`:

```html
<zm-error-stage>
  <section class="poster on-stage" aria-labelledby="error-title">
    <div class="container stack stack--lg">
      <zm-breadcrumb …><nav aria-label="Breadcrumb">…Discover · Sat 14 Nov…Artist…</nav></zm-breadcrumb>
      <p class="overline poster__kicker">Show postponed</p>
      <h1 id="error-title" class="artist-poster__name" tabindex="-1">This profile didn’t load</h1>
    </div>
  </section>
  <div class="container page-error">
    <zm-alert variant="danger" live="alert" …>
      <div class="alert alert--danger" role="alert">
        …icon…
        <div class="stack stack--sm"><p class="alert__title">We couldn’t reach the artist’s page</p><p>It’s on our side, not yours. Your search is saved and any request you’ve sent is safe.</p></div>
        <div class="alert__actions">…Try again…Back to the lineup…</div>
      </div>
    </zm-alert>
  </div>
</zm-error-stage>
```

With `headline="display"`, `subtitle` and `reference`, the title is
`h1.error-poster` and the stage adds `p.poster__sub` and `p.error-code` after
it.

Consumer templates:

```html
<zm-error-page [overline]="'errors.server.overline' | transloco" [poster]="'errors.server.poster' | transloco" [posterSuffix]="'errors.server.suffix' | transloco" [lead]="'errors.server.lead' | transloco">
  <zm-description-list slot="details" variant="receipt" [rows]="referenceRows()" />
  <zm-button slot="actions" variant="primary" size="lg" [busy]="retrying()" (click)="retry()"><zm-icon name="refresh" />{{ (retrying() ? 'errors.retrying' : 'errors.tryAgain') | transloco }}</zm-button>
  <zm-button-link slot="actions" size="lg" link="/">{{ 'errors.backToDiscover' | transloco }}</zm-button-link>
  <ng-container slot="note">{{ 'errors.server.stillBroken' | transloco }} <zm-link [href]="emailWithReference()">{{ 'errors.server.emailReference' | transloco }}</zm-link> {{ 'errors.server.lookItUp' | transloco }}</ng-container>
</zm-error-page>
```

```html
<zm-error-stage [kicker]="'profile.error.kicker' | transloco" [heading]="'profile.error.title' | transloco" [alertHeading]="'profile.error.alert' | transloco" alertLive autoFocus>
  <zm-breadcrumb slot="breadcrumb" [crumbs]="crumbs()" [label]="'shell.breadcrumb' | transloco" />
  <p>{{ 'profile.error.message' | transloco }}</p>
  <zm-button slot="actions" variant="primary" [busy]="retrying()" (click)="reload()"><zm-icon name="refresh" />{{ 'errors.tryAgain' | transloco }}</zm-button>
  <zm-button-link slot="actions" link="/" [queryParams]="lastSearch()">{{ 'profile.error.back' | transloco }}</zm-button-link>
</zm-error-stage>
```

The `.error-page`, `.error-poster`, `.page-error` classes and the single `h1`
are a contract: page objects find an error page by its heading and its
recovery buttons by name.

## Design

- Column: `display: grid`, gap `--space-6`, `justify-items: start`,
  padding-block `--space-16` `--space-20`; details full width up to
  `--layout-auth-width`.
- Overline `--text-overline`, `--letter-spacing-stamp`, uppercase.
- Poster `--text-display`, uppercase, `color: inherit`. Strike:
  `text-decoration: line-through`, thickness 0.08 em, colour
  `--color-danger-solid` off the stage, `--color-accent-on-stage` on it.
- Heading (artist not found) `--text-h1`, uppercase.
- Lead `--text-body-lg`; note `--color-fg-muted`.
- Actions `.cluster`, gap `--space-2`, wrapping; large buttons.
- Stage: the [poster](poster.md)'s stage, padding and halftone corner; the
  kicker `--color-accent-on-stage`; `.artist-poster__name` `--text-poster` with
  `overflow-wrap: anywhere`; `.error-code` `--text-overline`,
  `--letter-spacing-stamp`, `--color-fg-on-stage-muted`, `overflow-wrap:
  anywhere`.
- Recovery: `.page-error` padding-block `--space-10` inside `.container`.
- No component tokens. The alert keeps its own `--alert-*` tokens.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Page column text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Note | `--color-fg-muted` | per theme | per theme |
| Strike off the stage | `--color-danger-solid` | `--palette-red-600` | `--palette-red-300` |
| Stage | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Stage title | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Kicker, strike on the stage | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Reference on the stage | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |
| Danger alert fill | `--color-danger-bg` | `--palette-red-50` | `--palette-red-950` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Overline, poster, lead on the page |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Note |
| `--color-danger-solid` | `--color-bg-canvas` | 3:1 | Strike line off the stage |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Stage title |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Kicker and strike on the stage |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Reference on the stage |
| `--color-fg-default` | `--color-danger-bg` | 4.5:1 | Alert text on the danger fill |

The stage is charcoal in both themes; the page column and the alert follow the
theme. Under forced colours text uses `CanvasText` and the strike line keeps
its `line-through` in the text colour.

## Responsive behaviour

- The poster words scale with `--text-display` (64 px at 360 px, 160 px from
  about 1070 px). Each word is six letters or fewer ("No show", "Dead air", "No
  signal", "Not found"), so none overflows a 320 px screen.
- The struck word and the poster words may wrap onto separate lines on phones;
  that reads as a poster correction.
- "This profile didn’t load" in `--text-poster` wraps at word boundaries and
  breaks inside a word only if one is wider than the column.
- Actions wrap; below SM (576 px) the alert's actions drop under its text and
  fill the width, so "Try again" is the first thing under the thumb (alert
  CRD). The full-page actions wrap onto their own lines.
- The reference ID breaks anywhere (`overflow-wrap: anywhere`) rather than push
  the page sideways.
- At 320 px and at 200 % zoom nothing clips and the page does not scroll
  horizontally. Every action is at least 44 × 44 CSS px.

## Accessibility

### Role and pattern

A normal page inside the shell's landmarks: the top bar, `<main>` holding the
error, the footer. The page has exactly one `h1`: the poster words, the
separate heading, or the stage title (L2-102). `zm-error-stage`'s section is a
region named by its title. The alert follows the
[APG Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) only when
`alertLive` is set.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Skip link, top bar, breadcrumb (if any), the actions in order ("Try again" first), the note's link, then the footer. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates Try again, a way back, or the email link. |

### Focus

On a full page load focus starts at the top and the skip link goes to
`<main>`, whose first heading is the error. The `h1` has `tabindex="-1"`; with
`autoFocus` the component focuses it after the first render, for an error that
replaced content in an open page. While retrying, focus stays on the busy
"Try again".

### Labelling

- The poster words read with their hidden suffix: "No show: page not found",
  "Dead air: something went wrong".
- A struck word is `aria-hidden`, so the heading reads "On hold", not "Live On
  hold".
- On the missing-artist page the poster "No show" is hidden and the heading
  "This artist isn’t on Zamaro" is the only `h1`.
- The reference is plain, selectable text and is also in the email link's
  subject, so nobody has to copy it (L2-093).

### Announcements

None on a fresh page load. With `alertLive`, the recovery alert is announced
once when it appears.

### Motion

Nothing animates except a busy "Try again"'s spinner, which keeps turning under
reduced motion because it reports status (button CRD).

## Content and internationalisation

- **Overline**: the error in plain words, with the code for people who search
  it: "Error 404 · Page not found", "Error 500 · Something broke on our side",
  "Offline".
- **Poster**: two short words ("No show", "Dead air", "No signal"); keep the
  joke gentle, since churches book for services and funerals.
- **Lead**: whose side it is on and what is safe: "Something went wrong on our
  side, not yours. Anything you already sent is safe."
- **Offline** (L2-114): heading "No signal", text "We can’t reach Zamaro right
  now. Check your connection and try again.", and "Try again".
- **Profile error** (L2-107): "We couldn’t reach the artist’s page" with "It’s
  on our side, not yours. Your search is saved and any request you’ve sent is
  safe.", "Try again" and "Back to the lineup".
- **Missing artist** (L2-021): "This artist isn’t on Zamaro", with the search
  date in the lead ("free on Sat 14 Nov").
- **Reference**: the whole request ID and the time in L2-110 format, "Fri 9
  Oct, 10:42 a.m."; never a stack trace or a raw path.
- **Actions**: "Try again" for failures; a specific destination for a 404
  ("Find who’s free", "Back to the lineup"), never just "Home".
- Translatable inputs: `overline`, `poster`, `posterSuffix`, `strike`,
  `heading`, `lead`, `kicker`, `subtitle`, `alertHeading` and the projected
  copy. Data values: the request ID, times and dates (formatted by the API
  library's formatting service), the search date. A French catalogue keeps
  each poster word short; a longer word wraps and, if wider than the column,
  breaks inside the word rather than overflow.

## Performance

- Change detection: `OnPush`, signal inputs. `autoFocus` uses
  `afterNextRender` once; no subscriptions, no `effect`.
- Perf-test scenarios: add `frontend/projects/perf-test/src/scenarios/ErrorPage.ts`
  (the 500 page: "Dead air", the reference receipt, "Try again", "Back to
  Discover") and `ErrorStage.ts` (Abigail's profile error with the breadcrumb
  and the danger alert), and export them from `scenarios/index.ts`. Iterations
  in `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios: `DarkTheme`.
- Weight: the offline page must render from the app shell alone (the service
  worker caches only the shell and static assets, L2-114), so the component
  imports nothing that fetches: Angular core, `zm-alert` (stage only). The
  receipt, buttons and breadcrumb arrive through slots.
- Layout stability: the error replaces the page in one step; nothing inside it
  loads later.

## Acceptance criteria

### Rendering

- **AC-1** Given a slug that does not exist, when the 404 renders, then it shows the overline "Error 404 · Artist not found", a decorative "No show" that is `aria-hidden`, the `h1` "This artist isn’t on Zamaro", and the lead naming Sat 14 Nov, with the page's similar artists after it. (L2-021)
- **AC-2** Given a suspended artist's slug, when the page renders, then it is the same `zm-error-page` as AC-1 and contains no profile content. (L2-021)
- **AC-3** Given a server error with request ID 7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17 at Fri 9 Oct, 10:42 a.m., when the 500 page renders, then the receipt shows "Reference 7f3c9a2e-41d6-4b8e-9c05-2a6e1d8b4f17" and "When Fri 9 Oct, 10:42 a.m.", and the note's email link has that ID as its subject. (L2-093)
- **AC-4** Given no connection, when the offline page renders, then it shows the overline "Offline", the `h1` "No signal", the text "We can’t reach Zamaro right now. Check your connection and try again." and a "Try again" button. (L2-114)
- **AC-5** Given the offline page and the connection back, when "Try again" is activated, then the page that was asked for opens. (L2-114)
- **AC-6** Given Abigail's profile request fails, when `zm-error-stage` renders, then the stage keeps the breadcrumb "Discover · Sat 14 Nov", shows "Show postponed" and the `h1` "This profile didn’t load", and the danger alert reads "We couldn’t reach the artist’s page" with "It’s on our side, not yours. Your search is saved and any request you’ve sent is safe.", "Try again" and "Back to the lineup". (L2-107)
- **AC-7** Given the profile error, when "Back to the lineup" is activated, then Discover opens with the previous search restored. (L2-107)
- **AC-8** Given no details, actions or note, when `zm-error-page` renders, then no empty receipt, cluster or note takes space. (L2-021)

### States

- **AC-9** Given "Try again" on the profile error is activated, when the retry is pending, then the button reads "Retrying…" with `aria-busy="true"` and keeps focus, and a second press starts no second retry. (L2-107)
- **AC-10** Given a `strike` of "Live" before "On hold", when it renders off the stage, then the struck word has a 0.08 em `--color-danger-solid` line; on the stage, `--color-accent-on-stage`. (L2-103)

### Keyboard and focus

- **AC-11** Given the profile error replaced an open profile with `autoFocus`, when it renders, then focus moves to the `h1` "This profile didn’t load" (`tabindex="-1"`). (L2-101)
- **AC-12** Given the 500 page, when the person tabs into `<main>`, then focus reaches "Try again" before "Back to Discover", and each shows the two-tone focus ring. (L2-101)

### Screen readers

- **AC-13** Given the 404 page, when its heading is read, then it is announced as "No show: page not found"; given a struck word, then only the remaining words are read. (L2-102)
- **AC-14** Given every error page, when its headings are listed, then there is exactly one `h1`. (L2-102)
- **AC-15** Given the profile error with `alertLive`, when it appears in an open page, then the alert is announced once through `role="alert"`; given the 500 page loaded fresh, then nothing is announced as an alert. (L2-102)
- **AC-16** Given every error page in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-17** Given the dark theme, when the profile error renders, then the stage is still charcoal with a paper title and yellow kicker, and the alert and the page column follow the dark theme. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then the poster words, lead and stage title are at least 4.5:1, the note and reference at least 4.5:1, and the off-stage strike line at least 3:1. (L2-103)

### Responsive

- **AC-19** Given a 320 px viewport, when "Dead air", "No show" and "No signal" render at `--text-display`, then no word overflows and the page does not scroll horizontally. (L2-096)
- **AC-20** Given a 360 px viewport, when the profile error renders, then "Try again" is the first action under the alert text and every action is at least 44 × 44 CSS px. (L2-096)
- **AC-21** Given text zoomed to 200 %, when the 500 page renders, then the reference wraps inside the receipt and every action stays reachable. (L2-096)
- **AC-22** Given the French catalogue, when the overline, lead and alert copy are about 30 % longer, then they wrap without clipping. (L2-111)

### Motion

- **AC-23** Given `prefers-reduced-motion: reduce`, when an error page renders, then nothing on it animates. (L2-103)

### Formatting

- **AC-24** Given an error at 2:32 p.m. on Fri 9 Oct, when the reference renders, then the time reads "Fri 9 Oct, 2:32 p.m." (L2-110)

### Performance

- **AC-25** Given the `ErrorPage` and `ErrorStage` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. Create `frontend/projects/components/src/lib/error-page/`:

- `error-page.ts` — `ErrorPage`, selector `zm-error-page`; renders the
  `.container.error-page` column; one `@if` for the poster-as-heading versus
  decorative-poster-plus-heading, with no `ng-content` in either branch.
- `error-stage.ts` — `ErrorStage`, selector `zm-error-stage`; reuses the
  poster's stage styles from `lib/poster/` (shared stylesheet, not global
  styles) and composes `zm-alert` (`variant` from `alertTone`, `heading` from
  `alertHeading`, `live` set to `'alert'` or `'off'` from `alertLive`; the
  alert's own default would make every danger alert `role="alert"`).
- Slots wrapped in `:empty`-hidden containers; `autoFocus` with
  `afterNextRender`.
- Export both from `public-api.ts`; add the `ErrorPage.ts` and `ErrorStage.ts`
  scenarios.
- Uses no CDK primitive.

## Decisions

- **D-1** *The design system shows every page error as the poster stage plus an alert, but the 404, 500 and offline mocks use the plain `.error-page` column. Which?* Both, by scale. The design system itself documents `.error-page` as the layout of the 404, 500 and offline pages, and the stage composition for a page whose context is known (the profile). The mocks are followed for every page they cover; the stage variants with a strike, reference and tones stay available in `zm-error-stage` as the design system specifies them. (Flagged to the team lead as a source difference.)
- **D-2** *Two components, or one with a layout input?* Two. The column and the stage have different slots (details and note versus breadcrumb and alert), and one component would need slots inside conditional branches, which AGENTS.md forbids.
- **D-3** *How is the missing-artist page's heading built, where the poster word is decoration?* With `heading`: the poster becomes an `aria-hidden` `<p>` and the heading is the `h1`, as in `pages/not-found/artist`. The page keeps one `h1` and the screen reader hears the plain sentence.
- **D-4** *Does the recovery alert always have `role="alert"`?* No. It is set with `alertLive`, only when the error replaces content in a page that was already open, as the design system says; a page that loads as an error is read in order instead.
- **D-5** *Who moves focus to the error heading?* The router does on a route change (L2-101.3); the component does only with `autoFocus`, for an in-place failure, so focus never jumps twice.
- **D-6** *Is the maintenance page built?* No mock and no L2 requirement covers it, so no page is built now; `zm-error-stage` with `headline="display"`, info tone and no actions already renders it, so it will need no component change.
- **D-7** *Where does the 403 for a church in the artist area live?* In the [empty state](empty-state.md) (`pages/dashboard/forbidden`), inside the shell. The design system's stage "Crew only" composition remains buildable with `zm-error-stage` and the warning tone.
