# Sidebar navigation

| Field | Value |
|---|---|
| Selector | `zm-sidebar-nav`, `zm-settings-nav` |
| Library path | `frontend/projects/components/src/lib/sidebar-navigation/` |
| Status | planned |
| Traces to | L2-025, L2-050, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`sidebar-navigation.html`](../../design-system/components/sidebar-navigation.html) |
| Source mocks | [`pages/account/default`](../../mocks/pages/account/default.html), [`pages/account/artist`](../../mocks/pages/account/artist.html), [`pages/account/loading`](../../mocks/pages/account/loading.html), [`pages/account/invalid`](../../mocks/pages/account/invalid.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/edit-profile/empty`](../../mocks/pages/edit-profile/empty.html), [`dialogs/delete-account/default`](../../mocks/dialogs/delete-account/default.html), [`dialogs/two-step-code/default`](../../mocks/dialogs/two-step-code/default.html), [`dialogs/add-video/default`](../../mocks/dialogs/add-video/default.html), and every other state of those pages (see Usage) |
| Rendering | [`sidebar-navigation.html`](sidebar-navigation.html) |

## Purpose and scope

Sidebar navigation is a vertical list of links beside the content of a
signed-in area. The design system defines two forms, and this CRD specifies
both, because they share the list's look and rules:

- `zm-settings-nav` jumps between the sections of one long settings form:
  Naomi Fraser's account settings ("Profile · Church · Email · … · Delete
  account") and Abigail Mensah's profile editor ("Photo & name · Bio · … ·
  Background check"). The current item is the section in view
  (`aria-current="true"`). From LG it is a sticky column; below LG a
  horizontally scrolling row above the form. This is the form every mock uses.
- `zm-sidebar-nav` moves between pages of an account area: a panel of grouped
  links with icons, "needs attention" counts and the current page
  (`aria-current="page"`), which can fold groups and collapse to an icon rail.
  No mock uses it yet; the artist area and the admin app navigate through the
  workspace [top bar](top-bar.md). It is specified now so an area that outgrows
  the top bar adopts it without a new API (D-1).

Use something else when:

- two to five sibling views of one list share a page ("Upcoming · Past") →
  [tabs](tabs.md);
- it is the product's primary navigation → [top bar](top-bar.md), and its
  drawer below LG → [menu](menu.md) in a [dialog](dialog.md);
- it is a sequence of steps → [steps](steps.md).

Out of scope:

- The page layout around it: `.settings-layout` (the 14 rem column beside the
  form from LG) and the two-column page that holds the panel. The page owns
  them ([form layout](form-layout.md)).
- The sections themselves, their headings and ids, and form validation. The
  settings nav only links to them and tracks which is in view.
- Moving the panel's links into the top bar's drawer below LG. The shell builds
  the drawer's items ([menu](menu.md)); the panel only hides itself.
- Deciding which page is current. The shell passes `current` from route data,
  as for the [top bar](top-bar.md).

## Usage

The mocks render the settings nav 52 times on 40 screens; the panel appears
only on the design-system page. Each row is one distinct configuration.

| Where | Configuration | Content | States seen | Surface |
|---|---|---|---|---|
| `pages/account/default`, `loading`, `invalid`, `submitting`, `success`, `failed`, `error`, `out-of-area`, `two-step-on`, `export-requested`, `export-ready`; `dialogs/delete-account/*` | `zm-settings-nav`, label "Settings sections", 9 sections | Profile, Church, Email, Password, Email preferences, Two-step sign-in, Signed-in devices, Your data, Delete account | current "Profile"; inert behind a dialog | canvas |
| `dialogs/two-step-code/*` over `pages/account/two-step-on` | as above | as above | current "Two-step sign-in" | canvas, inert |
| `pages/account/artist` | `zm-settings-nav`, 9 sections | Profile, **Contact**, Email, Password, Email preferences, Two-step sign-in, Signed-in devices, Your data, Delete account (L2-025) | current "Profile" | canvas |
| `pages/edit-profile/*` (default, empty, loading, invalid, submitting, success, error, address-locked, check-pending, video-processing); `dialogs/add-photo/*`, `add-song/*`, `add-video/*`, `upload-check/*`, `dialogs/menu/artist`, `dialogs/account-menu/artist` | `zm-settings-nav`, label "Profile sections", 9 sections | Photo & name, Bio, Rate & travel, Languages, Songs, Videos, Photos, Profile address, Background check (L2-050) | current "Photo & name"; inert | canvas |
| Every settings page below LG | the same nav as a scrolling row above the form | as above | current underlined; row scrolled to keep it visible | canvas |
| Design system, artist dashboard | `zm-sidebar-nav`, label "Artist dashboard", 3 groups | Gigs (Requests 2 new, Bookings, Calendar), Money (Payouts), Profile (Your profile, Setlist), Profile folded | current "Bookings", hover, focus, group open/closed | canvas |
| Design system, booker account | `zm-sidebar-nav`, label "Your account", 1 group | heading "Riverside Community Church": Requests (1 awaiting reply), Bookings, Saved artists (3 artists) | current "Saved artists" | canvas |
| Design system, rail | `zm-sidebar-nav`, `collapsed` | icons only; names "Requests, 2 new", "Bookings", "Calendar", "Payouts" | current, tooltip on hover/focus | canvas |

## Anatomy

`zm-settings-nav`:

1. **Landmark and row** — `<nav class="settings-nav" aria-label="…">`. Below LG
   a single scrolling row; from LG a sticky column.
2. **Section link** — `<a href="/account#church">`, a direct child of the nav.
   Muted `--text-label`, uppercase, 44 px tall.
3. **Current marker** — on the link with `aria-current="true"`: full-strength
   text and a `--border-width-poster` `--color-accent` underline (row) or left
   bar (column).

`zm-sidebar-nav`:

1. **Panel** — `<nav class="sidenav" aria-label="…">`: surface fill,
   `--border-width-thick` `--color-border-strong` rule, `--space-4` padding, up
   to 18 rem wide.
2. **Group** — `<details class="sidenav__group">`; its `<summary>` is the group
   heading in the mono overline style, muted, with a CSS fold marker ("+" closed,
   "–" open).
3. **List** — `<ul class="sidenav__list">`.
4. **Link** — `<a class="sidenav__link">`: a 44 px row with an icon
   (`zm-icon`, `aria-hidden`), the label in `.sidenav__label`, and an optional
   count.
5. **Count (optional)** — the [badge](badge.md) count form,
   `<span class="badge badge--count">2<span class="visually-hidden"> new</span></span>`,
   pushed to the right edge.
6. **Current marker** — `aria-current="page"`: `--color-accent-subtle` fill,
   `--color-fg-accent` text and a `--border-width-poster` `--color-border-selected`
   bar on the left.
7. **Rail tooltip (collapsed only)** — a [tooltip](tooltip.md) with the link's
   name, shown on hover and focus.

Hosts: `zm-settings-nav` and `zm-sidebar-nav` are `display: block` and each
renders exactly one `<nav>`. Below LG the `zm-sidebar-nav` host is
`display: none`.

## API

### `zm-settings-nav` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The landmark name: "Settings sections", "Profile sections". Unique on the page. |
| `sections` | `readonly SettingsSection[]` | — | yes | In page order. Each `id` must match an element on the page; in dev mode a missing one logs a console error naming the id. |
| `current` | `ModelSignal<string>` | the URL fragment if it names a section, else the first section's `id` | no | Two-way. The component writes it as the person scrolls or activates a link; the page may set it (for example to the first section with an error). |

```ts
export interface SettingsSection {
  id: string;     // 'church', the target element's id
  label: string;  // "Church"
}
```

### `zm-sidebar-nav` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The landmark name: "Artist dashboard", "Your account". Never "Primary". |
| `groups` | `readonly SidebarGroup[]` | — | yes | One or more groups in display order. |
| `current` | `string \| null` | `null` | no | The `id` of the current item. Its link gets `aria-current="page"` and its group renders open. `null`: nothing is current. |
| `collapsed` | `boolean` (attribute) | `false` | no | Adds `.sidenav--collapsed`: the 76 px icon rail. The consumer sets it from 992 to 1199 px on pages that need the width. |

```ts
export interface SidebarGroup {
  id: string;
  heading: string;                    // "Gigs", "Riverside Community Church"
  open?: boolean;                     // initial state, default true; ignored when the group holds `current`
  items: readonly SidebarItem[];
}

export interface SidebarItem {
  id: string;                         // matched against `current`
  label: string;                      // "Requests"
  icon: IconName;                     // zm-icon name
  link: string | readonly unknown[];  // routerLink
  queryParams?: Params;
  count?: number | null;              // shown when greater than 0
  countNoun?: string;                 // visually hidden words after the number: "new", "awaiting reply"
  railLabel?: string;                 // the name in the collapsed rail: "Requests, 2 new"; defaults to `label`
}
```

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `currentChange` (`zm-settings-nav`, from the `current` model) | `string`, the section id | The section in view changes, or a link is activated. |

`zm-sidebar-nav` has no outputs: its items are router links and its groups are
native disclosures.

### Content slots

None. Every string arrives through the inputs (L2-111).

## Variants and sizes

| Variant | Component / modifier | Use for |
|---|---|---|
| Settings nav | `zm-settings-nav`, `.settings-nav` | Sections of one long form: account settings, profile editor. |
| Grouped panel | `zm-sidebar-nav`, `.sidenav` | Pages of an account area with four or more sections. |
| Single group | `zm-sidebar-nav` with one group | A small account area; the group heading names the church. |
| Collapsed rail | `zm-sidebar-nav collapsed`, `.sidenav--collapsed` | 992–1199 px on pages that need the width (the calendar). |

One size: 44 px rows (`--target-comfortable`). The settings column is 14 rem
wide (the page's `.settings-layout`); the panel is up to 18 rem and the rail
76 px.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Settings: muted label. Panel: `--color-fg-default` label on the surface | Link |
| Hover | `:hover` | Settings: `--color-accent-subtle` fill, `--color-fg-default` text. Panel: `--color-bg-subtle` fill. No lift. | — |
| Focus | `:focus-visible` | The shared two-tone ring outside the link, never clipped by the row's scroll box | — |
| Current section | `aria-current="true"` | Full-strength text; `--color-accent` underline (row) or left bar (column) | "current" announced |
| Current page | `aria-current="page"` | `--color-accent-subtle` fill, `--color-fg-accent` text, `--color-border-selected` left bar | "current page" announced |
| Current, focus | both | Current look plus the ring | — |
| Group open / closed | `open` on `<details>` | "–" / "+" marker; closed groups render no visible links | Summary is a disclosure button, expanded or collapsed |
| Group heading focus | `summary:focus-visible` | The ring around the heading row | — |
| With count | `count > 0` | Yellow count badge at the right edge | "Requests 2 new" |
| Collapsed rail | `collapsed` | Icons only, labels and headings clipped, counts moved into the name, tooltip on hover and focus | Names from `railLabel`; headings still read |
| Hidden below LG | viewport < 992 px | Panel not displayed | Not in the tree; links are in the drawer |
| Inert | a dialog makes the page `inert` | No hover | Not reachable |

## Markup

`zm-settings-nav` (account settings, scrolled to the top):

```html
<zm-settings-nav>
  <nav class="settings-nav" aria-label="Settings sections">
    <a href="/account#profile" aria-current="true">Profile</a>
    <a href="/account#church">Church</a>
    <a href="/account#email">Email</a>
    <a href="/account#password">Password</a>
    <a href="/account#preferences">Email preferences</a>
    <a href="/account#two-step">Two-step sign-in</a>
    <a href="/account#devices">Signed-in devices</a>
    <a href="/account#data">Your data</a>
    <a href="/account#delete">Delete account</a>
  </nav>
</zm-settings-nav>
```

`zm-sidebar-nav` (Abigail's dashboard):

```html
<zm-sidebar-nav>
  <nav class="sidenav" aria-label="Artist dashboard">
    <details class="sidenav__group" open>
      <summary>Gigs</summary>
      <ul class="sidenav__list">
        <li><a class="sidenav__link" href="/artist/requests"><zm-icon name="inbox" aria-hidden="true">…</zm-icon><span class="sidenav__label">Requests</span><span class="badge badge--count">2<span class="visually-hidden"> new</span></span></a></li>
        <li><a class="sidenav__link" href="/artist/bookings" aria-current="page"><zm-icon name="calendar" aria-hidden="true">…</zm-icon><span class="sidenav__label">Bookings</span></a></li>
        <li><a class="sidenav__link" href="/artist/availability"><zm-icon name="calendar" aria-hidden="true">…</zm-icon><span class="sidenav__label">Calendar</span></a></li>
      </ul>
    </details>
    <details class="sidenav__group">
      <summary>Profile</summary>
      <ul class="sidenav__list">…</ul>
    </details>
  </nav>
</zm-sidebar-nav>
```

Collapsed rail: the nav adds `.sidenav--collapsed`; every group is open; each
`<summary>` has `tabindex="-1"`; the count badge is not rendered and the label
carries `railLabel`; each link is wrapped in the tooltip anchor:

```html
<li><span class="tooltip-anchor sidenav__tip"><a class="sidenav__link" href="/artist/requests"><zm-icon name="inbox" aria-hidden="true">…</zm-icon><span class="sidenav__label">Requests, 2 new</span></a><span class="tooltip tooltip--end" role="tooltip" aria-hidden="true">Requests, 2 new</span></span></li>
```

Consumer templates:

```html
<div class="settings-layout">
  <zm-settings-nav [label]="'account.sections.label' | transloco" [sections]="sections()" [(current)]="section" />
  <form class="form-stack">… <section class="form-section" id="church" aria-labelledby="church-title">…</section> …</form>
</div>

<zm-sidebar-nav [label]="'artist.nav.label' | transloco" [groups]="groups()" [current]="routeSection()" [collapsed]="needsWidth() && isLg()" />
```

The `.settings-nav`, `.sidenav*` classes, `aria-current` values and the
`<details>`/`<summary>` structure are a contract: page objects find the nav by
its landmark name and the current item by `aria-current`. Icon internals are
free to change.

## Design

`zm-settings-nav`:

- Row (below LG): `display: flex`, gap `--space-1`, `overflow-x: auto`,
  `scrollbar-width: none`, no list style.
- Column (from `--layout-breakpoint-lg`): `flex-direction: column`,
  `position: sticky`, `top: calc(var(--layout-topbar-height) + var(--space-6))`.
- Link: `min-height: --target-comfortable`, padding `0 --space-3`,
  `--text-label`, uppercase, `--letter-spacing-wide`, `white-space: nowrap`,
  `--color-fg-muted`, no underline. Hover `--color-accent-subtle` fill and
  `--color-fg-default` text.
- Current: `--color-fg-default`; row `box-shadow: inset 0 calc(var(--border-width-poster) * -1) 0 var(--color-accent)`;
  column `box-shadow: inset var(--border-width-poster) 0 0 var(--color-accent)`.

`zm-sidebar-nav`:

- Panel: column flex, gap `--space-4`, width 100 %, `max-width: 18rem`, padding
  `--space-4`, `--color-bg-surface`, `--border-width-thick` solid
  `--color-border-strong`. Square corners.
- Summary: flex between, `min-height: --target-min` (`--target-comfortable`
  under a coarse pointer), padding `--space-1 --space-2`, `--text-overline`,
  `--letter-spacing-stamp`, uppercase, `--color-fg-muted`; native marker hidden;
  `::after` "+" / "–" in `--text-label`.
- List: column flex, gap `--space-0-5`, margin-top `--space-1`.
- Link: flex, gap `--space-3`, `min-height: --target-comfortable`, padding
  `0 --space-3`, `--text-label`, `--color-fg-default`, no underline, a
  transparent `--border-width-poster` left border so the current bar does not
  shift the label. Long labels wrap inside the row. The badge has
  `margin-left: auto`.
- Rail: `max-width: calc(var(--target-comfortable) + var(--space-8))`, padding
  inline `--space-2`; labels and summaries clipped (the visually-hidden
  pattern, never `display: none`); links centred with no padding.
- Rail tooltips: the anchor `.sidenav__tip` is `display: flex; width: 100%` and the
  link inside it `flex: 1`, so the link keeps the full row width and its current fill and bar line up with
  the other rows. The bubble sits at the rail's inline end, vertically centred
  on the link (`.tooltip--end`, D-12), so it never covers the neighbouring
  icons or leaves the panel's left edge.
- No motion: groups open instantly; hover has no transition. The rail tooltip
  appears after `--duration-tooltip-delay` (tooltip CRD).
- No component tokens. To re-skin the current marker, a surface overrides
  `--color-accent-subtle`, `--color-fg-accent` and `--color-border-selected` on
  the host.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Settings link | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Settings current text, panel link | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Settings current bar, count badge fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Settings hover, panel current fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Panel current text | `--color-fg-accent` | `--palette-ink-750` | `--palette-signal-500` |
| Panel current bar | `--color-border-selected` | `--palette-ink-750` | `--palette-signal-500` |
| Panel fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Panel rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Panel hover | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Group heading | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Count number | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Settings link |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Hovered settings link |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Panel link |
| `--color-fg-default` | `--color-bg-subtle` | 4.5:1 | Hovered panel link |
| `--color-fg-accent` | `--color-accent-subtle` | 4.5:1 | Current panel link |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Group heading |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Count badge |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Panel rule |
| `--color-border-selected` | `--color-accent-subtle` | 3:1 | Current panel bar |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on the panel |

The settings nav's yellow bar on newsprint is under 3:1 against the canvas; it
is decoration there, and the current section is also marked by full-strength
text and `aria-current`. Under forced colours the current settings link keeps
its bar as `Highlight` and the panel's current bar uses `CanvasText`.

## Responsive behaviour

- **Settings nav below LG (< 992 px)**: one row above the form that scrolls
  sideways inside itself with no visible scrollbar; the page never scrolls
  sideways. When `current` changes, the row adjusts its own `scrollLeft` so the
  current link is fully visible; it never scrolls the page.
- **Settings nav from LG**: a sticky column under the top bar, `--space-6`
  below it, in the page's 14 rem column.
- **Panel from XL (≥ 1200 px)**: the full panel in the first column of the page.
- **Panel 992–1199 px**: full, or the 76 px rail when the consumer sets
  `collapsed`.
- **Panel below LG**: `display: none`; its links are in the top bar's drawer
  with the same groups.
- Labels never truncate. Panel labels wrap inside the 44 px-minimum row;
  settings links stay on one line and the row scrolls.
- At 320 px nothing scrolls the page horizontally; at 200 % zoom the settings
  row still scrolls and every link stays reachable; every link is at least
  44 × 44 CSS px.

## Accessibility

### Role and pattern

Both are `<nav>` landmarks with their own `aria-label`, unique on the page and
distinct from the top bar's "Primary". The settings nav is a set of same-page
links with `aria-current="true"` on the section in view. The panel holds lists
of page links with `aria-current="page"`; its groups are native
`<details>`/`<summary>` disclosures
([APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)). Neither
uses `role="tree"`, `role="menu"` or `role="tablist"`: they are site
navigation, with no arrow-key behaviour.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Settings: through the section links in order. Panel: through group headings and the links of open groups, top to bottom; links in closed groups are skipped. Rail: links only. |
| <kbd>Enter</kbd> | Follows a link; on a group heading, opens or closes the group. |
| <kbd>Space</kbd> | On a group heading, opens or closes the group. |

### Focus

- The shared two-tone ring, outside the link, so the settings row's scroll box
  and the current highlight never hide it.
- Activating a settings link scrolls its section to just below the sticky top
  bar and moves focus to the section element (the component gives it
  `tabindex="-1"` if it has none), so the next <kbd>Tab</kbd> continues inside
  that section. `scroll-padding-top` on `html` keeps the section clear of the
  top bar (L2-101).
- After a panel link loads a page, focus goes to the page's `<h1>` (the
  shell's route-change rule), not back to the panel.

### Labelling

- Settings links are named by their visible label; the current one adds
  "current".
- Panel links read label then count: "Requests 2 new". In the rail the name is
  `railLabel` ("Requests, 2 new"), kept in the DOM, clipped; the tooltip
  repeats it visually and is `aria-hidden`, so it is not read twice.
- Group headings read "Gigs, expanded" or "Profile, collapsed".

### Announcements

None. A change of the current section is not announced; `aria-current` is read
when the person reaches the link.

### Motion

Activating a settings link scrolls smoothly, except under
`prefers-reduced-motion: reduce`, where it jumps (L2-103). Nothing else moves.

## Content and internationalisation

- Settings labels name the section, one to three words, sentence case in the
  source: "Signed-in devices", "Rate & travel", "Background check". An artist's
  account has "Contact" where a booker's has "Church" (L2-025).
- Panel labels are nouns for the pages they open: "Requests", "Bookings",
  "Saved artists", "Calendar", "Payouts". Group headings are short ("Gigs",
  "Money", "Profile") or the church's name in a booker account.
- Order is stable: daily work first, money next, profile and settings last.
- Counts mean "needs your attention": "2 new", "1 awaiting reply". A count of 0
  shows no badge, as the top bar's counts.
- Translatable inputs: `label`, section and item labels, group headings (except
  church names), `countNoun`, `railLabel`. Data values: church names, counts.
  French labels run about 30 % longer: panel labels wrap; settings links widen
  and the row scrolls.

## Performance

- Change detection: `OnPush`, signal inputs and a `model` for `current`. The
  settings nav tracks sections with one `IntersectionObserver` created after
  render in the browser only, disconnected on destroy; no scroll or resize
  listeners. The panel computes the open groups from `groups` and `current` in
  one `computed`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/SettingsNav.ts`
  renders Naomi Fraser's nine account sections with "Profile" current;
  `SidebarNav.ts` renders Abigail Mensah's "Artist dashboard" panel (Gigs with
  "Requests 2 new" and "Bookings" current, Money, Profile folded). Iterations
  in `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Composite scenarios: none (one per page).
- Layout stability: the server renders the settings nav with the first section
  (or the URL's section) current, the same markup the browser keeps; the
  observer only moves `aria-current`, which changes colour, not size. The
  panel's current bar reserves its border width, so a current change moves
  nothing (L2-086).
- Imports: `RouterLink`, `zm-icon`, `zm-badge`, and `zm-tooltip` (panel only).
  No CDK layout or scrolling packages.

## Acceptance criteria

### Settings nav — rendering

- **AC-1** Given Naomi Fraser's account settings, when the page renders, then a `<nav class="settings-nav">` named "Settings sections" holds nine links, Profile through Delete account, and "Profile" has `aria-current="true"`. (L2-025)
- **AC-2** Given Abigail Mensah's account settings, when the page renders, then the second link reads "Contact" and links to the Contact section. (L2-025)
- **AC-3** Given Abigail's profile editor, when the page renders, then the nav named "Profile sections" lists Photo & name, Bio, Rate & travel, Languages, Songs, Videos, Photos, Profile address and Background check, in that order. (L2-050)
- **AC-4** Given the URL `/account#devices`, when the page loads, then "Signed-in devices" is current and its section is in view below the top bar. (L2-025)

### Settings nav — behaviour

- **AC-5** Given the account page at 1280 px, when Naomi scrolls until the Email section's top passes `--layout-topbar-height` plus `--space-6` from the viewport top, then "Email" becomes current and no other link has `aria-current`. (L2-025)
- **AC-6** Given the account page scrolled to its end, when the short "Delete account" section cannot reach the top, then "Delete account" is current. (L2-025)
- **AC-7** Given "Signed-in devices" is activated with Enter, when the scroll ends, then the Signed-in devices section sits just below the sticky top bar, focus is on that section, the URL is `/account#devices`, and the link is current. (L2-101)
- **AC-8** Given the page sets `current` to "rate" after a failed save of the profile editor, when the nav updates, then "Rate & travel" is current. (L2-050)
- **AC-9** Given a 1280 px viewport, when the page scrolls, then the settings nav stays fixed `--space-6` below the top bar with the current link's left bar in `--color-accent`. (L2-096)
- **AC-10** Given a 360 px viewport, when the account page renders, then the nav is one row above the form that scrolls sideways inside itself, the page does not scroll horizontally, and the current link has a `--color-accent` underline. (L2-096)
- **AC-11** Given that 360 px row with "Your data" off-screen to the right, when "Your data" becomes current, then the row scrolls sideways until it is fully visible and the page's vertical scroll position does not change. (L2-096)

### Panel — rendering and states

- **AC-12** Given Abigail's dashboard panel with `current` "bookings", when it renders, then the "Bookings" link has `aria-current="page"`, a `--color-accent-subtle` fill, `--color-fg-accent` text and a `--color-border-selected` left bar. (L2-101)
- **AC-13** Given "Requests" with `count` 2 and `countNoun` "new", when it renders, then a yellow count badge shows "2" at the row's right edge and the link's name is "Requests 2 new"; given `count` 0 or null, then no badge renders. (L2-102)
- **AC-14** Given the "Profile" group with `open` false, when the panel renders, then its links are not displayed and Tab skips them; given `current` is "setlist" in that group, then the group renders open. (L2-101)
- **AC-15** Given `collapsed` at 1100 px, when the panel renders, then it is 76 px wide, shows icons only, the "Requests" link is named "Requests, 2 new", no badge renders, and hovering or focusing it shows a tooltip reading "Requests, 2 new" at the rail's inline end, and the current row's fill spans the rail's full width. (L2-102)
- **AC-16** Given a viewport narrower than 992 px, when a page with the panel renders, then the panel is not displayed and causes no horizontal scroll. (L2-096)

### Keyboard and focus

- **AC-17** Given keyboard focus on the "Gigs" heading, when Space is pressed, then the group closes and the heading reads "collapsed"; Enter opens it again. (L2-101)
- **AC-18** Given keyboard focus on any settings link, panel link or group heading, when it is focused, then the two-tone ring is fully visible and not clipped by the scrolling row or the panel. (L2-101)

### Screen readers

- **AC-19** Given a page with the top bar and a settings nav, when its landmarks are listed, then the navigations are "Primary" and "Settings sections", each named once. (L2-102)
- **AC-20** Given the account page and the dashboard panel in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-21** Given the dark theme, when the panel renders, then the current link reads `--color-fg-accent` (yellow) on the dark `--color-accent-subtle` with a yellow `--color-border-selected` bar, and the count keeps its yellow fill with an ink number. (L2-104)
- **AC-22** Given both themes, when contrast is measured, then settings links, panel links, hovered links, the current panel link, group headings and the count are at least 4.5:1, and the panel rule, current bar and focus ring at least 3:1. (L2-103)

### Responsive and content

- **AC-23** Given a coarse pointer, when settings links, panel links and group headings are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-24** Given the French catalogue, when panel labels are about 30 % longer, then they wrap inside their rows without clipping, and settings links stay on one line in the scrolling row. (L2-111)

### Motion

- **AC-25** Given `prefers-reduced-motion: reduce`, when a settings link is activated, then the page jumps to the section without smooth scrolling. (L2-103)

### Performance

- **AC-26** Given the `SettingsNav` and `SidebarNav` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/sidebar-navigation/` with
  `settings-nav.ts` (`SettingsNav`, selector `zm-settings-nav`) and
  `sidebar-nav.ts` (`SidebarNav`, selector `zm-sidebar-nav`), plus the
  `SettingsSection`, `SidebarGroup` and `SidebarItem` types; export all from
  `public-api.ts`.
- Settings links: `routerLink` to the current route with `fragment`, and
  `replaceUrl` so section jumps do not fill the history. The click handler
  scrolls the target (`scrollIntoView({ block: 'start', behavior })`, behaviour
  from `prefers-reduced-motion`), focuses it with `preventScroll`, adds
  `tabindex="-1"` when missing, sets `current`, and ignores observer updates
  until the scroll settles.
- Scroll tracking: one `IntersectionObserver` with a top root margin of the
  top-bar height plus `--space-6` (read from computed style) over the section
  elements, plus a sentinel at the end of the last section for AC-6. Create it
  in `afterNextRender`; never on the server.
- Row scrolling: set the nav's `scrollLeft` to bring the current link into
  view; do not call `scrollIntoView` on the link, which can scroll the page.
- Panel: `[open]` on each `<details>` bound to `group.open ?? true` or "holds
  current"; counts through `zm-badge`'s count form (badge CRD); icons through
  `zm-icon` (icon CRD — `inbox`, `calendar`, `money`, `user`, `list` must
  exist there); rail tooltips through `zm-tooltip` with `aria-hidden` on the
  bubble (tooltip CRD).
- Styles: copy `.settings-nav` and `.sidenav*` from the design system into the
  two stylesheets; add `:host { display: block }`, the panel's `display: none`
  below LG, the coarse-pointer summary rule, `tabindex="-1"` on summaries in the
  rail, and the forced-colours bars.
- Add the perf-test scenarios `SettingsNav.ts` and `SidebarNav.ts` and export
  them from `scenarios/index.ts`.
- Ask the design system to fix its tokens table, which names
  `--color-border-on-accent` for the current bar while its CSS and theming text
  use `--color-border-selected` (D-7).

## Decisions

- **D-1** *The grouped panel is in no mock. Specify it now?* Yes. The design system specifies it with every state and marks it ready, and an account area that outgrows the top bar would otherwise reshape the component later. The settings nav, which every mock uses, is the first slice.
- **D-2** *One component with a mode, or two?* Two selectors in one folder: `zm-settings-nav` and `zm-sidebar-nav`. They differ in markup (flat links versus grouped lists), current semantics (`aria-current="true"` for a section in view, `"page"` for a page) and behaviour (scroll tracking versus router links). One input switching all three would make every input half-optional.
- **D-3** *How is the current section tracked?* By scroll position, through an `IntersectionObserver`: the current section is the last whose top has passed the line `--layout-topbar-height` + `--space-6` below the viewport top, and at the end of the page the last section. That is where the sticky column sits, so the highlighted link matches what is under it. Scroll listeners would run on every frame; the observer runs only when a boundary is crossed.
- **D-4** *Does activating a section link change the URL and history?* It updates the fragment with `replaceUrl`, so `/account#devices` can be shared or reloaded (AC-4) while Back still leaves the page instead of walking through sections.
- **D-5** *Where does focus go after a section link?* To the section, as an in-page link does natively. The component adds `tabindex="-1"` when the section lacks it, because the mocks' sections have none and the app's `<base href="/">` stops the browser from moving focus itself (as the skip link CRD notes).
- **D-6** *Who decides the panel's current page?* The shell, through `current`, from route data, as the top bar does. Router matching cannot express that a booking detail page belongs to "Bookings" or a nested record to its list.
- **D-7** *The design system's tokens table names `--color-border-on-accent` for the current bar; its CSS and theming text use `--color-border-selected`. Which?* `--color-border-selected`. It is ink on newsprint and yellow on the stage theme, so the bar stays visible on the dark amber fill; `--color-border-on-accent` stays ink in dark and would vanish. The table is the drift.
- **D-8** *How does the collapsed rail treat group headings?* Every group renders open and each summary is visually hidden and out of the tab order (`tabindex="-1"`), so no invisible control takes focus; screen readers still read the headings. A rail is too narrow to show which group is closed.
- **D-9** *Does a count of 0 show?* No badge, as on the top bar and in the design system's rule that counts mean "needs your attention". `Requests (0)` in the footer is a different component's copy.
- **D-10** *Does the settings nav mark sections with errors?* No. The invalid account and profile mocks show the same nav; errors are carried by the form's error summary and fields (L2-102). The page may set `current` to the first invalid section (AC-8).
- **D-11** *Does the panel hide itself below LG, or does the page remove it?* It hides itself with a media query on the host. The server cannot know the viewport, and a page-side breakpoint check would render it on phones and remove it after hydration, shifting the page.
- **D-12** *Where does a rail tooltip sit, and how is the link wrapped?* At the rail's inline end, vertically centred (`.tooltip--end`), with the anchor stretched to the row (`.sidenav__tip`). The rendering showed the design system's default above-placement covering the icon above it and overflowing the rail's left edge, and the inline-flex anchor shrinking the current row's fill. The [tooltip](tooltip.md) CRD needs the end placement; the design system should add both classes.
