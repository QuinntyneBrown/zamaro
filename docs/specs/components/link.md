# Link

| Field | Value |
|---|---|
| Selector | `a[zm-link]` |
| Library path | `frontend/projects/components/src/lib/link/` |
| Status | planned |
| Traces to | L2-044, L2-046, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-111 |
| Design system | [`link.html`](../../design-system/components/link.html) |
| Source mocks | [`pages/accept-terms/default`](../../mocks/pages/accept-terms/default.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html) (stub fine print), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/sign-in/default`](../../mocks/pages/sign-in/default.html), [`pages/not-found/default`](../../mocks/pages/not-found/default.html), and every other page and dialog (see Usage) |
| Rendering | [`link.html`](link.html) |

## Purpose and scope

A link goes somewhere: to the full cancellation policy, to Abigail's phone
number, to "Full terms of use", to the Zamaro inbox. It is always underlined,
stays ink after it is visited, and highlights like a marker pen under the
pointer. `a[zm-link]` is an attribute component on the page's own native
`<a>`, so the page keeps `routerLink`, `queryParams`, `fragment` or `href` on
the element it writes, and the component adds the look, the trailing icon and
the new-tab rules.

It has two variants, inline (in a sentence, at the sentence's size) and
standalone (on its own line, label type, trailing arrow), and either can be
external (leaves Zamaro, opens a new tab and says so).

Use something else when:

- activating it changes something (saves, submits, retries, loads more
  reviews in place) → [button](button.md), even inside a sentence;
- it must look like a button ("See Abigail's profile", "Back to the lineup",
  "Email hello@zamaro.ca" on an error) → `zm-button-link` or `zm-button-anchor`
  ([button](button.md));
- it is one of the links a component owns and renders itself: the
  [top bar](top-bar.md) and [sidebar navigation](sidebar-navigation.md) links,
  [breadcrumb](breadcrumb.md) crumbs, [footer](footer.md) columns, the name links
  of the [ticket](ticket.md) and [headliner](headliner.md), [booking list](booking-list.md)
  rows, [table](table.md) cells, [pagination](pagination.md), [menu](menu.md)
  items, [tabs](tabs.md), [steps](steps.md) and the [skip link](skip-link.md).
  Those render a plain `<a>` styled by their own component or by the base
  foundation style.

Out of scope:

- Where the link goes and whether it exists. The page decides; a destination
  that is not available is not rendered as a link at all (no disabled state).
- Error-summary links that move focus to a field. The [form field](form-field.md)
  and its error summary own them.
- Surface layouts (the footer's link columns, the `.auth-card__links` row, the
  `.panel__head` cluster). The parent lays the links out.
- Formatting phone numbers, emails and dates in the link text. The page passes
  formatted text.

## Usage

The mocks render about 3,900 `<a>` elements that are not buttons. Most belong
to components that own their links (footer about 1,830, mock navigation, top
bar, breadcrumb, ticket and headliner names, booking lists, settings
navigation). The rows below are the links a page writes in its own content;
the API builds every one.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Booking stub fine print on `pages/artist`, `pages/book`, `dialogs/pay-deposit`, `dialogs/pay-balance`, `notifications/booking-toast` and 7 more | inline, `routerLink` with `fragment` | "Cancellation policy" after "Cancel free up to 14 days before your event." | default, hover, focus | surface, toast |
| `pages/booking-detail`, `pages/request-detail`, `dialogs/cancel-booking`, `dialogs/report-problem`, `dialogs/write-review` contact rows (`.definition__row`) | inline, `href="tel:…"` / `href="mailto:…"` | "905-555-0148", "905-555-0123", "abigail@abigailmensah.ca" | default, hover, focus; long email wraps | surface, dialog |
| `pages/request-detail`, `dialogs/accept-request`, `dialogs/decline-request`, `dialogs/artist-cancel-booking` | inline, `routerLink`, extra class `text-sm` | "Back to requests" | default | surface |
| `pages/dashboard` panel heads | inline, `routerLink`, extra class `text-sm` | "All requests", "Calendar", "All reviews", "Earnings" | default | surface |
| `pages/dashboard` stat hint and apply prompt | inline, `routerLink` | "3 things left, starting with a video", "Lead worship yourself? Apply as an artist" | default | surface |
| `pages/sign-in`, `sign-up`, `forgot-password`, `reset-password`, `mfa-challenge`, `mfa-setup` (`.auth-card__links`) | inline, `routerLink` | "Forgot your password?", "Create an account", "Back to sign in", "Use a recovery code instead", "Cancel and keep it off" | default | surface |
| `pages/not-found`, `pages/server-error` | inline, `href="mailto:…"` with a subject | "Tell us", "Email us the reference" | default | canvas |
| `pages/book` church note, `pages/edit-profile` hints, `pages/booking-detail` artist names | inline, `routerLink` (with `fragment` on edit-profile) | "Edit your church in your account", "Add one more song", "Upload your Vulnerable Sector Check", "Hosanna Collective" | default | surface |
| `pages/book` alert titles | inline, `routerLink` inside an [alert](alert.md) title | "View booking ZAM-0114", "See your requests" | default | alert |
| Dialogs with a contact line (`hide-review`, `issue-refund`, `suspend-artist`, `reject-application`, `resolve-hold`…), `notifications/session-toast`, `pages/apply` | inline, `href="mailto:hello@zamaro.ca"` | "hello@zamaro.ca" | default | dialog, toast |
| `pages/discover` band | inline, `routerLink` | "What artists earn" | default, hover (paper fill) | band |
| `pages/accept-terms` default, submitting, error | standalone, `href` to `https://zamaro.ca/legal/terms` | "Full terms of use" + arrow | default, hover, focus | surface |
| `pages/admin-artists` page head (default, loading) | standalone, `routerLink` | "Vulnerable Sector Checks · 2 waiting" + arrow | default; skeleton in loading | surface |
| Design system: artist channels (planned with profile links) | inline, external, `href="https://www.youtube.com/@abigailmensah"` | "YouTube" + arrow-out icon + hidden "(opens in a new tab)" | default, hover, focus | surface |
| Design system: on the stage | inline, `routerLink` inside `.on-stage` or `.topbar` | "Find who's free", "How booking works" | default, hover (yellow text, no fill), focus | stage |

## Anatomy

1. **Anchor** — the consumer's native `<a>`, which is the component host. It
   carries `.link` (and `.link--standalone`), the underline and the hover
   highlight.
2. **Label** — the projected text. It is the accessible name. Inline links
   inherit the paragraph's type; standalone links use `--text-label`,
   uppercase by CSS.
3. **Underline** — 1 px, offset 0.22 em, `currentColor` mixed to 55 %; solid on
   hover. The underline, not the colour, marks the link.
4. **Arrow (standalone)** — a trailing `zm-icon` `arrow-right`, `aria-hidden`.
   It nudges `--space-1` right on hover.
5. **External icon (external)** — a trailing `zm-icon` `external` with
   `.link__external` (0.85 em), `aria-hidden`.
6. **New-tab text (external)** — a `.visually-hidden` span with " (opens in a
   new tab)" from the catalogue.
7. **Hover highlight** — a `--color-accent-subtle` background behind the text.

Host: the `<a>` itself. There is no wrapper element, so an inline link sits in
the sentence's text flow exactly as a plain anchor does, and classes the
consumer puts on it (`text-sm`) stay on it.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'inline' \| 'standalone'` | `'inline'` | no | `standalone` adds `.link--standalone` and renders the trailing arrow. |
| `external` | `boolean` (attribute) | `false` | no | Sets `target="_blank"` and `rel="noopener noreferrer"`, renders the external icon and the new-tab text. Use only with an `https://` `href` that leaves Zamaro. |
| `newTabText` | `string` | `''` | with `external` | The hidden text, " (opens in a new tab)", from the catalogue (`'common.opensInNewTab' \| transloco`). In dev mode, `external` without it logs a console error naming the component. |

Navigation stays on the native element and is not an input:

- in-app: Angular's `routerLink`, with `queryParams` and `fragment`
  ("Cancellation policy" → `routerLink="/"` `fragment="how"`). Never a bare
  `href="#how"`: the app's `<base href="/">` turns it into a full navigation to
  `/#how`;
- outside the app: `href` with `https://`, `mailto:` or `tel:`.

The component requires one of `routerLink` or `href`. An `<a zm-link>` with
neither logs a dev-mode console error, because an anchor without a destination
is not a link (use a [button](button.md)).

### Outputs

None. Navigation is the anchor's own behaviour; a consumer that needs to know
listens to the native `click`.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | text, optionally a `.visually-hidden` span | Declared once, before the icons. The icons and the new-tab text render after it with `@if`, outside the slot. |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Inline | `.link` | Words inside a sentence or a short line: "Cancellation policy", "905-555-0148", "Forgot your password?". |
| Standalone | `.link .link--standalone` | A link on its own line under a section or at the end of a card: "Full terms of use", "Vulnerable Sector Checks · 2 waiting". |
| External (either variant) | `target="_blank"` + `.link__external` icon | A destination that leaves Zamaro: an artist's YouTube channel. Standalone and external renders the external icon in place of the arrow. |

There are no sizes. An inline link takes the size of its text (a consumer
class such as `text-sm` sets it); a standalone link uses `--text-label` at one
size, `--target-min` minimum height.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | `--color-fg-link` text, 55 % underline | Role link, name from the text |
| Hover | `:hover` | `--color-fg-link-hover` text on a `--color-accent-subtle` fill, solid underline; the standalone arrow nudges `--space-1` right | — |
| Focus | `:focus-visible` | The shared two-tone ring: `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset`, around each line box of a wrapped link | — |
| Active | `:active` | No extra style | — |
| Visited | `:visited` | Identical to default, by design | — |
| External | `external` | Arrow-out icon after the text | Name ends "(opens in a new tab)" |
| Inside a skeleton list | page loading | The page renders a skeleton in its place (`pages/admin-artists/loading`); the link has no loading state | — |

The link has no disabled, busy, pressed or invalid state. A destination that is
not available is removed and explained in plain text (design system).

Surfaces re-colour the link; the link's stylesheet owns each mapping with
`:host-context`:

| Surface ancestor | Effect |
|---|---|
| `.on-stage`, `.topbar` | Text inherits `--color-fg-on-stage`; hover turns it `--color-accent-on-stage` with no fill; focus ring `--color-accent-on-stage` |
| `.band` | Text stays ink (`--color-fg-on-accent`); hover fills paper, `--color-fg-on-stage`, in both themes (D-10) |
| `.toast` | Text inherits the toast's foreground; hover keeps it with no fill |
| `.alert` | Text inherits the alert's foreground; hover as default |

## Markup

Inline, in-app, inside a sentence:

```html
<p class="stub__fine">Cancel free up to 14 days before your event.
  <a zm-link class="link" href="/#how">Cancellation policy</a></p>
```

Inline, contact:

```html
<dd><a zm-link class="link" href="tel:+19055550148">905-555-0148</a></dd>
<dd><a zm-link class="link" href="mailto:abigail@abigailmensah.ca">abigail@abigailmensah.ca</a></dd>
```

Standalone:

```html
<a zm-link variant="standalone" class="link link--standalone" href="https://zamaro.ca/legal/terms">Full terms of use<zm-icon name="arrow-right"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24">…</svg></zm-icon></a>
```

External:

```html
<a zm-link external class="link" href="https://www.youtube.com/@abigailmensah" target="_blank" rel="noopener noreferrer">YouTube<zm-icon name="external" class="link__external"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24">…</svg></zm-icon><span class="visually-hidden"> (opens in a new tab)</span></a>
```

Consumer templates:

```html
<p class="stub__fine">{{ 'stub.cancelFree' | transloco }} <a zm-link routerLink="/" fragment="how">{{ 'stub.policy' | transloco }}</a></p>
<a zm-link variant="standalone" href="https://zamaro.ca/legal/terms">{{ 'terms.full' | transloco }}</a>
<a zm-link class="text-sm" routerLink="/artist/requests">{{ 'dashboard.allRequests' | transloco }}</a>
<a zm-link [href]="'tel:' + contact.phoneE164">{{ contact.phone }}</a>
<a zm-link external [href]="channel.url" [newTabText]="'common.opensInNewTab' | transloco">{{ channel.site }}</a>
```

The `.link` and `.link--standalone` classes, `target`, `rel` and the
`.visually-hidden` text are a contract: e2e page objects find links by role and
name, and the visual tests compare the classes' look. The `zm-icon` internals
are free to change.

## Design

- Underline: `text-decoration: underline`, thickness 1 px, offset 0.22 em,
  colour `currentColor` mixed to 55 % (solid on hover).
- Inline type: inherited from the parent.
- Standalone: `display: inline-flex`, `align-items: center`, gap `--space-2`,
  min-height `--target-min`, `--text-label`, uppercase,
  `--letter-spacing-wide`. The arrow is the standard 1.25 rem `.icon` and
  translates by `--space-1` on hover.
- External icon `.link__external`: 0.85 em square, 0.15 em left margin, so it
  scales with the text at 200 % zoom.
- Transitions: background, colour and the arrow's translate take
  `--duration-fast` with `--ease-standard`.
- The link has no component tokens. Surfaces re-colour it by setting `color`
  (design system: there are no `--link-*` tokens), through `:host-context`
  rules in the link's own stylesheet.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Text | `--color-fg-link` | `--palette-ink-750` | `--palette-ink-100` |
| Hover text | `--color-fg-link-hover` | `--palette-ink-750` | `--palette-signal-500` |
| Hover highlight | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Stage text | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Stage hover and focus | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Band text | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Band hover fill | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-link` | `--color-bg-canvas` | 4.5:1 | Link on the page |
| `--color-fg-link` | `--color-bg-surface` | 4.5:1 | Link on a card or dialog |
| `--color-fg-link-hover` | `--color-accent-subtle` | 4.5:1 | Hover text on the highlight |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Stage link |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Stage link, hover |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Link on the band |
| `--color-fg-on-accent` | `--color-fg-on-stage` | 4.5:1 | Band link, hover |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring on the page |

Link text has the same colour as body text, so colour alone never marks a link
(WCAG 1.4.1); the underline does, in every theme and on every surface. Under
forced colours the browser's `LinkText` applies and the underline stays.

## Responsive behaviour

- Inline links wrap with their sentence at every width. A long email address
  or URL breaks anywhere (`overflow-wrap: anywhere` on the link) so it never
  pushes the page sideways: "abigail@abigailmensah.ca" fits a 320 px contact
  row.
- Standalone links keep their arrow at the end of the last line. The label
  wraps inside the link (the arrow is a separate flex item and never drops to
  a line of its own); "Vulnerable Sector Checks · 2 waiting" takes two lines
  at 320 px.
- Under a coarse pointer a standalone link grows to `--target-comfortable`
  (44 px) tall. Inline links inside a sentence keep the line height, under
  WCAG 2.5.8's inline exception (D-5).
- At 200 % zoom the external icon scales with the text and nothing clips.
- No breakpoint changes the link; the narrow frames in the rendering show the
  wrapping.

## Accessibility

### Role and pattern

A native `<a>` with a destination, following the
[APG Link pattern](https://www.w3.org/WAI/ARIA/apg/patterns/link/). Never
`role="link"` on another element and never `href="#"` with a click handler.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves focus to and from the link in DOM order. |
| <kbd>Enter</kbd> | Follows the link (router navigation for `routerLink`; the browser for `href`). |
| <kbd>Space</kbd> | Scrolls the page; it never follows a link. |

### Focus

The shared two-tone ring on `:focus-visible` only. A link that wraps shows the
ring on each line box. The ring is never clipped by an ancestor's `overflow`
and never hidden by a sticky header. On the stage the ring is
`--color-accent-on-stage`.

### Labelling

The link text is the accessible name and makes sense on its own (WCAG 2.4.4):
"Cancellation policy", "Full terms of use", never "Read more" or "click here".
Icons are `aria-hidden`. An external link's name ends with "(opens in a new
tab)". When the same text would repeat on a page, the page makes it unique
("Elijah Park's profile") instead of using `aria-label`; the component has no
`label` input on purpose.

### Announcements

None. Router navigation moves focus to the new page's heading (L2-101, the
shell owns it).

### Motion

The highlight and the arrow nudge take `--duration-fast`. Under
`prefers-reduced-motion: reduce` they change instantly, and in-page fragment
links jump instead of smooth-scrolling.

## Content and internationalisation

- Name the destination in the few words that are linked: "Cancellation
  policy", "How booking works", "hello@zamaro.ca". Never a bare URL.
- Sentence case in the source; standalone links are uppercased by CSS. Four
  words or fewer for standalone links so the arrow stays on the line at 360 px.
- External links name the site: "Watch on YouTube".
- Phone numbers show as "905-555-0148" with a `tel:+19055550148` destination;
  emails are their own link text.
- Every string arrives from the catalogue through the consumer (L2-111),
  including the new-tab text. A sentence that contains a link is three keys
  (before, link text, after), so a translation can reorder words without HTML
  in the catalogue; "after" may be empty. French runs about 30 % longer and
  wraps.
- Data values (church and artist names, phone numbers, emails) come from the
  API.

## Performance

- Change detection: `OnPush`, signal inputs, the host classes and attributes
  from host bindings. No subscriptions and no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Link.ts`
  renders the booking stub's fine print, "Cancel free up to 14 days before
  your event." with an inline `routerLink` "Cancellation policy", and a
  standalone "Full terms of use" after it. Its iterations are tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios that include it: none at the time of writing; the
  `BookingForm` scenario will include the stub's fine print when it renders it.
- Regression rule: a change to its template, inputs, styles or change
  detection runs the perf test against the base branch with
  `--fail-on-regression` before it is pushed.
- Layout stability: hover changes colour and background only, never size.
  The arrow's nudge is a `translate`, which does not cause layout shift.
- Imports: Angular core and `zm-icon`. It does not import `RouterLink`; the
  consumer applies it.

## Acceptance criteria

### Rendering

- **AC-1** Given the booking stub's fine print "Cancel free up to 14 days before your event." with `<a zm-link routerLink="/" fragment="how">Cancellation policy</a>`, when it renders and the link is activated, then the anchor has `.link`, is underlined, and the router navigates to the policy without a full page load. (L2-044)
- **AC-2** Given `<a zm-link variant="standalone" href="https://zamaro.ca/legal/terms">Full terms of use</a>`, when it renders, then the anchor has `.link.link--standalone`, the label style in uppercase, and a trailing `aria-hidden` arrow icon after the text. (L2-100)
- **AC-3** Given a Confirmed booking for Abigail Mensah, when the contact rows render, then "905-555-0148" is a link to `tel:+19055550148` and "abigail@abigailmensah.ca" is a link to `mailto:abigail@abigailmensah.ca`. (L2-046)
- **AC-4** Given an `external` link "YouTube" to `https://www.youtube.com/@abigailmensah` with `newTabText` " (opens in a new tab)", when it renders, then the anchor has `target="_blank"` and `rel="noopener noreferrer"`, an `aria-hidden` `.link__external` icon, and its accessible name is "YouTube (opens in a new tab)". (L2-100)
- **AC-5** Given `<a zm-link class="text-sm" routerLink="/artist/requests">All requests</a>` in the dashboard panel head, when it renders, then the anchor keeps the consumer's `text-sm` class beside `.link`, and no wrapper element is added around it. (L2-100)
- **AC-6** Given a visited link to Abigail Mensah's profile, when it renders, then its colour and underline are identical to an unvisited link. (L2-100)

### States

- **AC-7** Given a pointer over "Cancellation policy", when it hovers, then the text takes `--color-fg-link-hover` on a `--color-accent-subtle` fill and the underline turns solid; given a standalone link, then its arrow also moves `--space-1` to the right. (L2-100)
- **AC-8** Given an inline link inside `.on-stage`, when it renders and is hovered, then its text is `--color-fg-on-stage` and turns `--color-accent-on-stage` on hover with no background fill. (L2-104)
- **AC-9** Given "What artists earn" on the yellow band, when it renders and is hovered, then its text stays `--color-fg-on-accent` and the hover fills paper (`--color-fg-on-stage`) in both themes, so the hover text stays at least 4.5:1. (L2-104)

### Keyboard and focus

- **AC-10** Given keyboard focus on "Forgot your password?", when it is focused, then the two-tone ring is visible: a `--focus-ring-width` outline in `--color-focus-ring` offset by `--focus-ring-offset`. (L2-101)
- **AC-11** Given a link that wraps onto two lines at 320 px, when it receives keyboard focus, then the ring is drawn around each line box and is not clipped. (L2-101)
- **AC-12** Given a focused link, when Enter is pressed, then it navigates; when Space is pressed, then it does not navigate. (L2-101)
- **AC-13** Given a link inside the top bar or `.on-stage`, when it receives keyboard focus, then the ring is `--color-accent-on-stage`. (L2-101)

### Screen readers

- **AC-14** Given the standalone "Full terms of use" link, when its accessible name is computed, then it is "Full terms of use" and the arrow icon is not announced. (L2-100)
- **AC-15** Given a page with every link variant in both themes, when axe-core runs, then there are zero serious or critical violations, including link-name and link-in-text-block. (L2-100)

### Theming

- **AC-16** Given the dark theme, when an inline link renders on the canvas, then its text is `--color-fg-link` (paper) with an underline, and its hover text is `--color-fg-link-hover` (yellow) on the deep amber `--color-accent-subtle`. (L2-104)
- **AC-17** Given both themes, when contrast is measured, then link text on the canvas and on a surface, hover text on the highlight, and stage link text are each at least 4.5:1, and the focus ring is at least 3:1 against the page. (L2-103)

### Responsive

- **AC-18** Given a 320 px viewport, when the contact row "abigail@abigailmensah.ca" and the standalone "Vulnerable Sector Checks · 2 waiting" render, then the email breaks inside the address, the standalone label wraps with its arrow after the last line, nothing is clipped and the page does not scroll horizontally. (L2-096)
- **AC-19** Given a coarse pointer, when the standalone "Full terms of use" link is measured, then its target is at least 44 CSS px tall. (L2-096)
- **AC-20** Given text zoomed to 200 %, when the external "YouTube" link renders, then the external icon scales with the text and stays on the line after the last word. (L2-096)

### Content

- **AC-21** Given the French catalogue, when the stub's sentence and "Cancellation policy" are replaced by text about 30 % longer, then the sentence and the link wrap without clipping and no component code changes. (L2-111)
- **AC-22** Given an `external` link with no `newTabText`, when it renders in dev mode, then a console error names `a[zm-link]` and the missing input. (L2-111)

### Motion

- **AC-23** Given `prefers-reduced-motion: reduce`, when a standalone link is hovered, then the highlight appears and the arrow moves without a transition. (L2-103)

### Performance

- **AC-24** Given the `Link` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The component is planned. Build it as:

- Folder `frontend/projects/components/src/lib/link/`, file `link.ts`, class
  `Link`, selector `a[zm-link]`, exported from `public-api.ts`.
- Host bindings: `class.link` always, `class.link--standalone`,
  `attr.target` and `attr.rel` when `external`.
- Template: `<ng-content />`, then `@if (variant() === 'standalone' &&
  !external())` the `arrow-right` icon, then `@if (external())` the `external`
  icon with `.link__external` and the `.visually-hidden` new-tab text. The slot
  is outside every `@if`.
- Add the `external` path (`M14 4h6v6M20 4l-9 9M18 14v6H4V6h6`) to the icon
  set in `lib/icon/icon.ts`.
- Styles in `link.scss`: the `.link` look on `:host` (matching the base `a`
  style in `styles/reset.scss`), the standalone and external rules, the
  coarse-pointer height, `overflow-wrap: anywhere`, and the surface mappings
  with `:host-context(.on-stage)`, `.topbar`, `.band`, `.toast`, `.alert`.
- Dev-mode console errors for `external` without `newTabText` and for an
  anchor with neither `routerLink` nor `href`.
- Add the perf-test scenario `Link.ts` and export it from
  `scenarios/index.ts`.

## Decisions

- **D-1** *An element component, as for the button, or an attribute component on `<a>`?* An attribute component, `a[zm-link]`. Inline links sit inside sentences, and a wrapper element would split the text flow and the focus ring. The consumer keeps Angular's own `routerLink`, `queryParams` and `fragment`, or `href` for `mailto:`, `tel:` and `https://`, on the native element, so one component covers in-app and outside links without mirroring the router's inputs or switching elements by condition.
- **D-2** *Does every link need the component?* Every link a page writes in its own content uses `a[zm-link]`, so the surface colours, the new-tab rule and the `.link` class contract apply in one place. Links that a component owns and renders (footer, top bar, breadcrumb, ticket and headliner names, booking lists, tables, menus, tabs, pagination) stay plain anchors styled by that component or the base foundation style; they are listed under Purpose and scope.
- **D-3** *Standalone and external together: arrow or arrow-out?* One trailing icon, the arrow-out. Two icons would crowd the label, and the arrow-out already means "go on, elsewhere".
- **D-4** *Is "Full terms of use" (`https://zamaro.ca/legal/terms`) external?* No. It stays on Zamaro's own domain, so it opens in the same tab with the arrow, as in `pages/accept-terms`. `external` is for destinations that leave Zamaro.
- **D-5** *L2-096 asks for 44 × 44 px targets on touch for every interactive control; the design system exempts links inside a sentence (WCAG 2.5.8 inline exception). Which applies?* Standalone links meet 44 px under a coarse pointer. Inline links inside running text keep the line height: making them 44 px tall would break the sentence's line spacing, and WCAG 2.2 AA (L2-100) exempts them. This reading of L2-096 needs product confirmation; if L2-096 is meant literally, only an L2 change or a layout change to every sentence with a link could meet it.
- **D-6** *Disabled links?* None. The design system removes an unavailable destination and explains why in text. `zm-button-link` keeps its disabled state for button-styled links beside a busy form ([button](button.md) D-4).
- **D-7** *How does translated copy with a link inside a sentence work?* As three catalogue keys (before, link text, after) rendered around the anchor. Catalogues hold no HTML, so output stays encoded (L2-075) and French can reorder by leaving "after" empty.
- **D-8** *Does the link have an `aria-label` input for repeated text?* No. The design system requires unique visible text instead ("Elijah Park's profile"), which also keeps WCAG 2.5.3 Label in Name.
- **D-9** *Where do surface colours live inside Angular's encapsulation?* In the link's stylesheet with `:host-context(<surface>)`, as the button does ([button](button.md) D-5). The `.toast` and `.alert` mappings are added because the mocks put links in the booking toast's fine print and in alert titles, which the design-system page did not render.
- **D-10** *The design system fills a hovered band link with `--color-bg-surface`; the dark rendering shows that fill turning charcoal under ink text, so the hovered link disappears on the yellow band. What does the hover fill?* Paper in both themes, `--color-fg-on-stage` (which resolves to the same paper primitive in light and dark). The band is the same yellow in both themes, so its link hover must not follow the theme. The design-system rule (`.band a:not(.btn):hover`) should catch up.
