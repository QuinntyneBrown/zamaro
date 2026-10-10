# Footer

| Field | Value |
|---|---|
| Selector | `zm-footer` |
| Library path | `frontend/projects/components/src/lib/footer/` |
| Status | built |
| Traces to | L2-027, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`footer.html`](../../design-system/components/footer.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/sign-in/default`](../../mocks/pages/sign-in/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/empty`](../../mocks/pages/dashboard/empty.html), [`pages/earnings/setup`](../../mocks/pages/earnings/setup.html), [`pages/admin-applications/default`](../../mocks/pages/admin-applications/default.html), [`pages/saved/empty`](../../mocks/pages/saved/empty.html), [`notifications/saved-toast/warning`](../../mocks/notifications/saved-toast/warning.html), and every other page, dialog and notification (see Usage) |
| Rendering | [`footer.html`](footer.html) |

## Purpose and scope

The footer closes every Zamaro page on the charcoal stage, under a yellow rule
that mirrors the top bar. It repeats the routes people look for at the bottom
of a page (how booking works, how to join as an artist, how to reach the Zamaro
team) and gives the signed-in person a shortcut to what needs them: Naomi's
saved artists, Abigail's requests. It is the page's `contentinfo` landmark.

It has two variants. **Full** is the big yellow "Zamaro" word, a one-line
description and up to three link columns; it is on every mocked page in all
three shells (public and booker, artist area, admin app). **Simple** is one
short row for a full-screen task that should not compete with a footer; no mock
uses it yet.

Use something else when:

- it is the main navigation → [top bar](top-bar.md);
- it moves between sections of an account area → [sidebar navigation](sidebar-navigation.md);
- it is a call to act ("Apply as an artist") → the [band](band.md) or a
  [button](button.md) in the page. The footer never holds a primary action.

Out of scope:

- Which columns and items a page shows. The app shell (and the admin app's
  shell) builds them from the session: booker, signed out, artist or
  administrator, with the live Saved and Requests counts.
- Counting saved artists or requests (L2-027 excludes suspended artists). The
  shell passes the formatted label ("Saved artists (2)").
- Toast placement. The footer's bottom padding leaves room for the toast region;
  the [toast](toast.md) owns the region.

## Usage

The mocks render 364 footers across every page, dialog and notification. Each
row is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Every signed-in booker page (`pages/discover/*`, `pages/artist/*`, `pages/saved/*`, `pages/bookings/*`, `pages/account/*`, `pages/book/*`, errors, dialogs and toasts over them; 94 screens) | full, 3 columns | "Churches": Find who's free (`/`), Your bookings (`/bookings`), How booking works (`/#how`), hello@zamaro.ca (`mailto:`) · "Artists": Join the lineup (`/apply`), What artists earn (`/#how`) · "Naomi Fraser": Riverside Community Church (text), Saved artists (3) (`/saved`) | link default, hover, focus | stage |
| Booking pages (`pages/booking-detail/*` and their dialogs and toasts; 48 screens) | full, 3 columns, booker set without "Your bookings" in the mocks (see D-6) | as above | as above | stage |
| Saved count variants (`pages/saved/empty`, `notifications/saved-toast/danger`, `notifications/saved-toast/warning`) | full, booker set | "Saved artists (0)", "Saved artists (2)", "Saved artists (200)" | default | stage |
| Signed out (`pages/apply/*`, `pages/sign-in/*`, `pages/sign-up/*`, `pages/forgot-password/*`, `pages/reset-password/*`, `pages/mfa-challenge/*`…; 42 screens) | full, 3 columns | Churches and Artists as for a booker · "Your account": Sign in (`/sign-in`), Create an account (`/sign-up`) | default | stage |
| Artist area (`pages/dashboard/*`, `pages/requests/*`, `pages/availability/*`, `pages/earnings/*`, `pages/edit-profile/*` and their dialogs; 104 screens) | full, 3 columns | "Churches": Find who's free, How booking works, hello@zamaro.ca · "Artists": Dashboard (`/artist`), Availability (`/artist/calendar`), Earnings (`/artist/earnings`) · "Abigail Mensah": New Covenant Chapel (text), Requests (3) (`/artist/requests`) | default | stage |
| Artist-area empty states (`pages/dashboard/empty` and 6 more) | as artist area | "Miriam Haile": Ethiopian Evangelical Church (text), Requests (0) | default | stage |
| `pages/earnings/setup` | as artist area | "Tobi Adeyemi": Approved, not live yet (text), Requests (0) | default | stage |
| Admin app (`pages/admin-*` and their dialogs; 65 screens) | full, 3 columns | "Admin": Applications, Artists, Bookings · "Records": Reported reviews, Audit log · "Priya Nair": Zamaro team (text), hello@zamaro.ca (`mailto:`) | default | stage |
| Design system only | simple | "Zamaro · Worship artists around Toronto" · How booking works, hello@zamaro.ca | default, focus | stage |

## Anatomy

1. **Landmark and stage** — `footer.footer.on-stage`: `--color-bg-stage`
   with a `--border-width-poster` `--color-accent` rule along the top.
2. **Grid** — `.container.footer__grid`: the page container holding the word
   block and the columns.
3. **Word block** — the grid's first child, `.stack`, a size container for the
   word.
4. **Word** — `p.footer__word`, `aria-hidden="true"`: "Zamaro" in the display
   face, yellow, sized to its column.
5. **Description** — a `<p>` after the word: one sentence.
6. **Column** — a `<div>` with an `<h2>` heading in the mono overline style and
   a `<ul>` of items.
7. **Item** — an `<li>` holding a router link, an external link (`mailto:`), or
   plain text.
8. **Simple row** (simple variant) — `footer.footer.footer--simple.on-stage` >
   `.container.cluster.cluster--between` with the description `<p>` and a
   `ul.cluster.cluster--lg` of items.

Host: `zm-footer` is `display: block` and renders exactly one `<footer>`
element carrying the classes above. The shell places the host after `<main>`
and outside any `article`, `aside`, `main`, `nav` or `section`, so the
`<footer>` is the page's `contentinfo` landmark.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'full' \| 'simple'` | `'full'` | no | `simple` adds `.footer--simple` and renders the one-row layout. |
| `word` | `string` | `''` | with `full` | The decorative wordmark, "Zamaro". The brand name, not translated. Rendered `aria-hidden`. Ignored by `simple`; in dev mode a `full` footer without it logs a console error. |
| `tagline` | `string` | — | yes | The description: "Worship artists for churches around Toronto." (full) or "Zamaro · Worship artists around Toronto" (simple). From the catalogue. |
| `columns` | `readonly FooterColumn[]` | `[]` | with `full` | One to three columns, in order. More than three logs a dev-mode console error and only the first three render. Ignored by `simple`. |
| `links` | `readonly FooterItem[]` | `[]` | with `simple` | The simple row's items. Ignored by `full`. |

```ts
export interface FooterColumn {
  /** Names the audience: "Churches", "Artists", the person's name, "Admin", "Records". */
  heading: string;
  items: readonly FooterItem[];
}

/** A route (`link`), an external address (`href`), or, with neither, plain text. */
export interface FooterItem {
  label: string;
  link?: string | readonly unknown[];
  fragment?: string;
  queryParams?: Params;
  /** `mailto:`, `tel:` or `https://`. */
  href?: string;
}
```

- `link` renders a `routerLink` anchor (with `fragment` and `queryParams`).
- `href` renders a plain `<a href>`. An item with both logs a dev-mode console
  error and renders the `link`.
- Neither renders the `label` as text in the `<li>`.
- Items are tracked by index, so two items with the same label are allowed.

### Outputs

None. Footer items are links; the router or the browser handles them.

### Content slots

None. The footer is data-driven: every column has the same structure, and the
shell builds the columns from the session (D-2).

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Full | — | Every page in every shell. |
| Simple | `.footer--simple` | A full-screen task that should not compete with a footer. Not used by any mock yet. |

| Variant | Padding top / bottom | Content |
|---|---|---|
| Full | `--space-16` / `--space-24` | Word, description, up to three columns |
| Simple | `--space-8` / `--space-8` | Description and one row of items |

There are no sizes. The width is the page's; the container sets the margins.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper text on the stage; links underlined at 55 % of the text colour | `contentinfo` landmark; one `h2` per column |
| Link hover | `:hover` | `--color-accent-on-stage` text, no background | — |
| Link focus | `:focus-visible` | Stage ring: `--color-accent-on-stage` outline with a `--color-bg-stage` gap | — |
| Plain text item | item without `link` or `href` | Paper text, no underline, no states | Read as text in the list |
| Count changes | the shell passes a new label ("Saved artists (3)" → "(4)") | The item's text updates in place; nothing else re-renders | Not announced; the save toast announces it |
| Signed out | the shell passes the "Your account" column | As default | As default |
| Inert | an open modal dialog | No hover response | Not reachable |

## Markup

Full, rendered by `zm-footer` for Naomi Fraser:

```html
<zm-footer>
  <footer class="footer on-stage">
    <div class="container footer__grid">
      <div class="stack">
        <p class="footer__word" aria-hidden="true">Zamaro</p>
        <p>Worship artists for churches around Toronto.</p>
      </div>
      <div>
        <h2>Churches</h2>
        <ul>
          <li><a href="/">Find who’s free</a></li>
          <li><a href="/bookings">Your bookings</a></li>
          <li><a href="/#how">How booking works</a></li>
          <li><a href="mailto:hello@zamaro.ca">hello@zamaro.ca</a></li>
        </ul>
      </div>
      <div>
        <h2>Artists</h2>
        <ul>
          <li><a href="/apply">Join the lineup</a></li>
          <li><a href="/#how">What artists earn</a></li>
        </ul>
      </div>
      <div>
        <h2>Naomi Fraser</h2>
        <ul>
          <li>Riverside Community Church</li>
          <li><a href="/saved">Saved artists (3)</a></li>
        </ul>
      </div>
    </div>
  </footer>
</zm-footer>
```

The signed-out, artist and admin footers have the same structure with other
columns (see Usage).

Simple:

```html
<footer class="footer footer--simple on-stage">
  <div class="container cluster cluster--between">
    <p>Zamaro · Worship artists around Toronto</p>
    <ul class="cluster cluster--lg">
      <li><a href="/#how">How booking works</a></li>
      <li><a href="mailto:hello@zamaro.ca">hello@zamaro.ca</a></li>
    </ul>
  </div>
</footer>
```

Consumer templates:

```html
<zm-footer word="Zamaro" [tagline]="'common.footer.tagline' | transloco" [columns]="footerColumns()" />
<zm-footer variant="simple" [tagline]="'common.footer.short' | transloco" [links]="footerLinks()" />
```

```ts
// shell.ts — the booker's third column
{ heading: user.name, items: [
  { label: user.churchName },
  { label: t('common.footer.savedCount', { count: saved.count() }), link: '/saved' },
] }
```

The `.footer`, `.footer__grid` and `.footer__word` classes, the `h2` per
column and the link names are a contract: the shell page object finds the
footer by its `contentinfo` role and the columns by heading.

## Design

- Full padding: `--space-16` top, `--space-24` bottom, so the last link clears
  the toast region and a phone's home indicator. Simple: `--space-8` both.
- Top rule `--border-width-poster` solid `--color-accent`.
- Grid gap `--space-8`; item gap `--space-3`; the description sits under the
  word with the `.stack` gap (`--space-4`).
- Word: `--text-display` at `min(var(--font-size-5xl), 26cqi)`, uppercase,
  `--color-accent-on-stage`. The word block is `container-type: inline-size`,
  so the word shrinks with its column and never runs into the columns beside
  it.
- Column heading: `--text-overline` with `--letter-spacing-stamp`, margin below
  `--space-3`. Headings keep the overline style, not the global `h2` style.
- Description and items: `--text-body`, `--color-fg-on-stage`.
- Links: `color: inherit`, underline from the global link rule; hover
  `--color-accent-on-stage` with no background; no transition.
- Lists: no bullets, no padding, no margin.

The footer declares no component tokens. Stage colours come from the shared
`.on-stage` utility, which also gives every link inside it the stage hover and
the stage focus ring.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Background | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Text, headings, links | `--color-fg-on-stage` | per theme | per theme |
| Word, link hover, focus ring | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Top rule | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Text, headings and links |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Hovered links (the word is decorative and large) |
| `--color-accent-on-stage` | `--color-bg-stage` | 3:1 | Focus ring |

The stage is charcoal in both themes; in the dark theme it drops to the
darkest charcoal so the footer still reads as a band below the dark canvas.

## Responsive behaviour

- **Below MD (< 768 px)**: one column. The word and description, then each
  column stacked, `--space-8` apart; every link gets its own full-width row.
- **MD (768–991 px)**: the word block spans the full width; the three columns
  sit side by side under it.
- **LG and up (≥ 992 px)**: four columns, `2fr` for the word block and `1fr`
  for each column.
- The word is `min(--font-size-5xl, 26cqi)`: at 320 px it shrinks with the
  column; at 992 px it fits the `2fr` column beside the columns.
- Simple: one row with space between the description and the items, wrapping
  onto two rows when it does not fit.
- Long labels ("Ethiopian Evangelical Church", "Grace Tabernacle Mass Choir" as
  a heading) wrap inside their column; nothing truncates. At 320 px nothing
  overflows and the page does not scroll horizontally; at 200 % zoom every link
  stays reachable.
- Under a coarse pointer every footer link is `display: inline-flex` with
  `min-height: --target-comfortable`, so each target is at least 44 CSS px
  tall (L2-096); the list keeps its `--space-3` gap, so the column grows taller
  on touch devices. With a fine pointer the links are plain text lines.

## Accessibility

### Role and pattern

A `<footer>` outside sectioning content, so it is the `contentinfo` landmark
(L2-102). Columns are lists under `<h2>` headings, so screen-reader users can
jump between them by heading. No APG widget pattern applies; it is plain
links.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the links in reading order: column by column, top to bottom. Plain-text items are skipped. |
| <kbd>Enter</kbd> | Follows the link, or opens the mail app for hello@zamaro.ca. |

### Focus

The stage ring, `--focus-ring-width` in `--color-accent-on-stage` at
`--focus-ring-offset` with a `--color-bg-stage` gap. Nothing in the footer
traps or moves focus.

### Labelling

- The word is `aria-hidden="true"`: the top bar already names the brand.
- Column headings name their audience ("Churches", "Artists", "Naomi Fraser",
  "Admin", "Records").
- The mail link shows the address itself, so its purpose is clear out of
  context (WCAG 2.4.4).
- Counts are part of the link text ("Saved artists (3)"), so the name says what
  the link holds.

### Announcements

None. Count changes are announced by the toast that confirms the save.

### Motion

Nothing animates. Link colour changes instantly.

## Content and internationalisation

- Column headings name people, not site sections: "Churches", "Artists", then
  the signed-in person's own name. The admin app, which serves one team, names
  its areas: "Admin" and "Records". Signed out: "Your account".
- Links start with a verb or say exactly where they go: "Find who's free",
  "Join the lineup", "What artists earn", "Create an account".
- Two to four items per column; the footer is a short list of routes, not a
  site map.
- Description: one sentence, "Worship artists for churches around Toronto."
- Counts match the top bar and show the real number, never "99+": "Saved
  artists (0)", "Saved artists (200)", "Requests (3)" (L2-027).
- Translatable inputs: `tagline`, every column `heading` except a person's
  name, every item `label` except data values, through the shell's
  `translateSignal` or the `transloco` pipe (L2-111). Data values: the person's
  name, the church name, "hello@zamaro.ca", and the count number. The word is
  the brand and is not translated. French labels run about 30 % longer and
  wrap within the column.

## Performance

- Change detection: `OnPush`, signal inputs. The variant class and the column
  cap come from `computed`s. No subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Footer.ts`
  renders Naomi Fraser's booker footer (Churches, Artists, Naomi Fraser with
  Riverside Community Church and "Saved artists (3)"). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly
  100–300 ms.
- Composite scenarios: `DarkTheme` renders the footer with the top bar under
  `data-theme="dark"`.
- Layout stability: the footer renders with the page's first paint (server
  rendered) and its columns are known from the session, so it never shifts the
  page. A count change replaces text of similar width (L2-086).
- Imports: Angular core and `RouterLink` only.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi Fraser is signed in, when the footer renders, then it shows the word "Zamaro", "Worship artists for churches around Toronto." and three columns headed "Churches", "Artists" and "Naomi Fraser", in that order. (L2-102)
- **AC-2** Given the booker's "Churches" column, when it renders, then "Find who's free" links to `/`, "Your bookings" to `/bookings`, "How booking works" to `/` with the fragment `how`, and "hello@zamaro.ca" is a plain anchor to `mailto:hello@zamaro.ca`. (L2-102)
- **AC-3** Given the item "Riverside Community Church" with no `link` or `href`, when it renders, then it is plain text in its `<li>`, not a link, and Tab skips it. (L2-101)
- **AC-4** Given Naomi has three saved artists and one of them is later suspended, when the shell passes "Saved artists (2)", then the item reads "Saved artists (2)" and links to `/saved`. (L2-027)
- **AC-5** Given a booker with 200 saved artists, when the footer renders, then the item reads "Saved artists (200)", not a capped number. (L2-027)
- **AC-6** Given a signed-out visitor on the sign-in page, when the footer renders, then the third column is "Your account" with "Sign in" (`/sign-in`) and "Create an account" (`/sign-up`). (L2-102)
- **AC-7** Given Abigail Mensah in the artist area, when the footer renders, then the "Artists" column lists Dashboard, Availability and Earnings, and the third column is "Abigail Mensah" with "New Covenant Chapel" as text and "Requests (3)" linking to `/artist/requests`. (L2-102)
- **AC-8** Given Priya Nair in the admin app, when the footer renders, then the columns are "Admin" (Applications, Artists, Bookings), "Records" (Reported reviews, Audit log) and "Priya Nair" ("Zamaro team" as text, hello@zamaro.ca). (L2-102)
- **AC-9** Given `variant="simple"` with the tagline "Zamaro · Worship artists around Toronto" and two links, when it renders, then the footer has `.footer--simple`, no word and no columns, and one row with the tagline and both links. (L2-102)
- **AC-10** Given four columns passed to a full footer, when it renders, then only the first three render and a dev-mode console error is logged. (L2-102)

### Screen readers

- **AC-11** Given any page, when its landmarks are listed, then there is exactly one `contentinfo` landmark and it is this footer. (L2-102)
- **AC-12** Given the footer, when a screen reader reads it, then "Zamaro" from the word is not announced, and each column is reachable as an `h2` heading followed by a list. (L2-102)
- **AC-13** Given the axe-core run on Discover, the artist dashboard and the admin applications page in both themes, when it runs, then the footer has zero serious or critical violations. (L2-100)

### Keyboard and focus

- **AC-14** Given keyboard focus moves into the footer, when it reaches "Find who's free", then the stage ring is visible: a `--color-accent-on-stage` outline with a `--color-bg-stage` gap. (L2-101)
- **AC-15** Given the booker's footer, when the person tabs through it, then focus visits Find who's free, Your bookings, How booking works, hello@zamaro.ca, Join the lineup, What artists earn and Saved artists (3), in that order. (L2-101)

### Theming

- **AC-16** Given the dark theme, when the footer renders, then its background is `--color-bg-stage` (the darkest charcoal), the word stays `--color-accent-on-stage` and the top rule stays `--color-accent`. (L2-104)
- **AC-17** Given both themes, when contrast is measured, then text and links are at least 4.5:1 on the stage, hovered links at least 4.5:1, and the focus ring at least 3:1. (L2-103)
- **AC-18** Given a pointer over "Join the lineup", when it hovers, then the link turns `--color-accent-on-stage` with no background fill. (L2-103)

### Responsive

- **AC-19** Given a 360 px viewport, when the footer renders, then the word block and each column stack in one column, and every link sits on its own row. (L2-096)
- **AC-20** Given a 768 px viewport, when the footer renders, then the word block spans the width and the three columns sit side by side beneath it; given 992 px, then the word block and the three columns share one row. (L2-096)
- **AC-21** Given a 320 px viewport and text zoomed to 200 %, when the footer renders, then the word shrinks with its column, long labels wrap, nothing is clipped and the page does not scroll horizontally. (L2-096)

- **AC-22** Given a touch device (coarse pointer), when each footer link is measured, then its target is at least 44 CSS px tall and as wide as its text, and no two targets overlap. (L2-096)

### Content

- **AC-23** Given the French catalogue, when the footer renders, then the tagline, headings and labels are French with no code change, and labels about 30 % longer wrap inside their columns. (L2-111)

### Performance

- **AC-24** Given the `Footer` and `DarkTheme` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-footer` with `word`, `tagline` and `columns`, the full
layout and the three item kinds. To meet this CRD:

- Add `variant` with the simple layout and the `.footer--simple` padding, and
  the `links` input it renders (AC-9).
- Make `word` optional (default `''`) with a dev-mode error for a full footer
  without it; make `columns` default to `[]`.
- Cap the columns at three in a `computed` and log a dev-mode error beyond that
  (AC-10).
- Add `queryParams` to `FooterItem`, and allow `link` to be a commands array.
- Log a dev-mode error for an item with both `link` and `href`.
- Track items and columns by `$index`; today they track by `label` and
  `heading`, which breaks on repeated labels.
- Add the coarse-pointer target rule for links (AC-22).
- Set `:host { display: block; }`.
- The shell (`frontend/projects/zamaro/src/app/shell/shell.ts`) builds only the
  signed-out subset today ("Find who's free", "How booking works", the mail
  link, "What artists earn"). The booker, signed-out "Your account", artist and
  admin column sets arrive with their slices; they need no component change.
- The `Footer` scenario renders Naomi's footer already; no change. Do not lower
  its iterations.

## Decisions

- **D-1** *Keep the simple variant although no mock uses it?* Yes. The design system specifies it as part of the core set for full-screen tasks, and adding it later would change the input set every consumer types against. The mocks keep the full footer everywhere, so no page uses it yet.
- **D-2** *Columns as data or as projected content?* Data, as built. Every column is the same heading-and-list structure, the shell derives all of them from the session, and data keeps one `ng-content`-free template that the visual test can pin down.
- **D-3** *How many columns?* At most three, as in every mock and on the design-system page; the four-track grid (word plus three) has no room for a fourth at LG.
- **D-4** *Where does the MD layout end: 1023 px or 991 px?* At 991 px. The design-system page's prose says "768–1023px" but its own next line and its stylesheet switch to four columns at 992 px, the L2 LG breakpoint, and the mocks render that.
- **D-5** *Is the word translated?* No. "Zamaro" is the brand and is `aria-hidden`; it stays an input so the admin app and any future brand change pass it the same way as the top bar's brand.
- **D-6** *The booking pages' mocks drop "Your bookings" from the booker's Churches column. Which is right?* The full booker set, with "Your bookings", on every booker page. The design-system page lists it for bookers, 94 other booker screens include it, and a footer that changes per page breaks the design system's "same routes on every page" rule. The component renders whatever the shell passes, so this is a shell rule; the 48 booking screens are mock drift.
- **D-7** *Is a count change announced?* No. The save toast (L2-026) announces the change; announcing the footer and the top bar too would repeat it three times.
- **D-8** *Do footer links need 44 px targets?* Yes, under a coarse pointer. The design-system page treats them as text lines at least 24 px tall (WCAG 2.5.8), but they are a list of links, not links in running text, so the touch-target foundation's inline exception does not cover them and L2-096 requires 44 × 44 CSS px on touch devices. The links grow to `--target-comfortable` only under `(pointer: coarse)`, so the desktop look is unchanged.
