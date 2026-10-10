# Adapt layout to screens

## Overview

Zamaro is used on phones between rehearsals as often as on office desktops. This
feature is the responsive frame every page sits in: the rules that keep content
readable from a 320 px phone to a wide desktop, the compact header on small screens,
full-screen dialogs on phones, and the automated visual tests that catch layout
regressions before release.

The slice is cross-cutting. It owns the application shell and the shared layout
rules, not any one page's arrangement. Page-specific layouts build on it: the
Discover layout (L2-097) is described with the search in
`discovery/search-available-artists`, and the artist profile layout (L2-098) is
described with the profile. Focus, landmarks and dialog keyboard behaviour live in
`user-experience/meet-accessibility-standards`; the theme toggle in the header lives
in `user-experience/switch-theme`.

Terms used in this design:

- **breakpoint** — viewport width at which the layout changes, fixed by the L2 conventions as XS < 576 px, SM >= 576 px, MD >= 768 px, LG >= 992 px and XL >= 1200 px
- **viewport class** — one of XS, SM, MD, LG or XL for the current viewport width
- **reflow** — re-arrangement of content into fewer columns so that no horizontal scrolling or clipping occurs
- **touch target** — hit area of an interactive control, measured in CSS pixels
- **compact header** — top bar variant in which the primary links sit behind a menu button: below LG for the booker shell (L2-099 requires it at XS and SM), below XL for the artist shell
- **navigation drawer** — overlay panel that holds the primary links of the compact header
- **full-screen dialog** — how every design-system dialog renders at XS: it covers the whole viewport with its title and close button pinned at the top
- **visual baseline** — approved screenshot of one page state at one viewport class, stored in the repository and compared on every build

## Description

The slice lives almost entirely in Zamaro Web. It touches the Zamaro API only through
the current-user endpoint that feeds the header's Saved count and account initials,
and through the seeded API that the visual test suite runs against.

**Frontend (Zamaro Web, `core/layout`)**

- **`breakpoints.scss`** — the single SCSS map of the L2 breakpoints and the
  `respond-to(xs|sm|md|lg|xl)` mixin. Layout itself is CSS: mobile-first media
  queries, CSS grid and `min-width: 0` on grid children. The design system's
  `--layout-breakpoint-sm/md/lg/xl` tokens hold the same values (36, 48, 62 and
  75rem, that is 576, 768, 992 and 1200 px), so the map, `tokens.css` and
  `components.css` agree.
- **`BreakpointService`** — wraps the CDK `BreakpointObserver` with the same five
  queries. It exposes `viewportClass: Signal<ViewportClass>` and
  `isCompact: Signal<boolean>` (true below LG). Components read it only where
  behaviour changes, not to lay out content. During server-side rendering it reports
  `xs`, so the first paint of a phone needs no client correction. Not built in M1: the shell
  switches with CSS alone, so nothing needs it yet.
- **`Shell`** (`app/shell`, ADR-0007) — root layout holding `zm-skip-link`, `zm-top-bar`,
  the routed `<main>` and `zm-footer`, all from the components library.
- **`zm-top-bar`** (`TopBar`) — the design-system top bar. From LG it shows Discover,
  How booking works and For artists inline, with the theme toggle from
  `user-experience/switch-theme`. Below LG it uses the compact header: the three
  links and the theme toggle move into `MenuDialog` behind a menu button
  with `aria-expanded` and `aria-controls`, while the Saved count and the account
  initials stay visible (L2-099). L2-099 requires this at XS and SM; MD keeps it too
  because the links, Saved, the toggle and the account button do not fit in 768 px.
  The workspace bar (`topbar--workspace`: the artist area and the admin app) has five
  primary links and stays compact until XL. The Saved
  button keeps its word in the accessible name when only the heart and count show.
- **`MenuDialog`** (`app/dialogs/menu`) — the navigation drawer, a CDK `Dialog` with the
  `zm-dialog` drawer frame holding the primary links (`zm-menu`) and the theme toggle. The
  menu button carries `aria-controls="nav-drawer"`, the dialog's id. Initial focus goes to
  the close button, which comes first (as in `docs/mocks/dialogs/menu`). The drawer traps focus,
  closes on Escape, on backdrop click and when a link is chosen, and returns focus to
  the menu button. The guest drawer omits the mock's "Saved artists and your account
  stay in the top bar" line, because guests have neither; it returns with sign-in (M2).
  The open/close behaviour needs no `BreakpointService`: CSS shows the menu button only
  below LG.
- **`DialogService`** — wrapper around the CDK `Dialog` used by every dialog. Its
  panel uses the design-system `.dialog` classes, which at XS fill the screen:
  `100vw` by `100dvh`, the header holding the title and close button at the top, a
  scrolling body and a sticky footer padded by the safe-area inset. The close button
  therefore stays reachable without scrolling (L2-099).
- **Global layout rules (`styles/layout.scss`)** — `rem` units for type and spacing,
  no fixed heights on text containers, `overflow-wrap: anywhere` on display names,
  media with `aspect-ratio`, and tables and tab strips that scroll inside their own
  container. These rules keep a 320 px viewport free of page-level horizontal
  scrolling and clipped text, and keep content and functions available at 200 % text
  zoom (L2-096).
- **Touch targets** — under `@media (pointer: coarse)` every button, link styled as
  a control, chip, toggle and form control has a minimum block and inline size of
  `--target-comfortable` (44 px), extended with padding or a `::before` hit area when
  the visible shape is smaller (L2-096). The design system's `components.css` carries
  this `(pointer: coarse)` rule. Links inside running text are exempt, following the
  WCAG 2.5.8 inline exception and the design system's responsive foundation.
- **`CurrentUserStore`** — signal store fed by `AuthService`. It holds the initials
  and the Saved count that the compact header keeps visible.

**Mocks and design system**

- The top bar of every mock is the shell: booker pages such as
  [`discover/default`](../../../mocks/pages/discover/default.html), artist pages such as
  [`dashboard/default`](../../../mocks/pages/dashboard/default.html) and admin pages such as
  [`admin-applications/default`](../../../mocks/pages/admin-applications/default.html)
  (both `topbar--workspace`, with an "Artists" or "Admin" role tag), and guest pages such as
  [`sign-in/default`](../../../mocks/pages/sign-in/default.html).
- The navigation drawer is [`dialogs/menu`](../../../mocks/dialogs/menu/default.html)
  ([`artist`](../../../mocks/dialogs/menu/artist.html), [`admin`](../../../mocks/dialogs/menu/admin.html)); the account menu is
  [`dialogs/account-menu`](../../../mocks/dialogs/account-menu/default.html).
- Every dialog mock under `docs/mocks/dialogs/`, for example
  [`withdraw-request`](../../../mocks/dialogs/withdraw-request/default.html), shows the
  full-screen dialog when viewed at XS.
- Design system: [Layout](../../../design-system/foundations/layout.html) and
  [Responsive](../../../design-system/foundations/responsive.html) foundations,
  [Top bar](../../../design-system/components/top-bar.html),
  [Dialog](../../../design-system/components/dialog.html) and the
  [Navigation & page structure](../../../design-system/patterns/navigation-and-page-structure.html)
  pattern.

**Visual tests (Zamaro Web, `e2e/visual`)**

- **`visual.spec.ts`** — Playwright suite driven by `e2e/routes.manifest.ts`, the list
  of every route and every state (default, loading, empty, error and others) that the
  mocks define. It captures each entry at 320, 576, 768, 992 and 1200 px wide, one
  width per viewport class, and compares with `toHaveScreenshot()`. Any pixel
  difference above the threshold fails the build until a reviewer approves the new
  baseline in the same pull request (L2-096). The diff threshold and whether every
  capture also runs in both themes are `<TO SUPPLY>`.
- **`layout.spec.ts`** — at 320 px it asserts that
  `document.documentElement.scrollWidth` does not exceed the viewport width and that
  no text element with hidden overflow has a `scrollWidth` larger than its
  `clientWidth`. With touch emulation it measures each interactive control's bounding
  box against 44 × 44 px. With the root font size at 200 % it asserts that each
  manifest action is still visible and operable.

**Backend (Zamaro API)**

- **`MeController`** — `GET /api/v1/me` returns `MeResource` with the user's name,
  initials, roles, Saved count and theme preference. The header reads the initials and
  Saved count from it; a guest receives 401 and sees the signed-out header.
- **`VisualFixtureSeeder`** — database seeder used only in CI. It loads the fixed
  artists, bookings and reviews the mocks show, so screenshots are deterministic.
  Requests that fake loading and error states are intercepted in Playwright and never
  reach the API.

## Requirements

This feature realises the following level-2 (L2) requirements; page-specific layouts
(L2-097, L2-098) are realised by their page features.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-096` | `L1-020` | **Layout at every breakpoint.**<br>Acceptance criteria:<br>1. Given any page at 320 px wide, when it renders, then there is no horizontal scrolling and no text is clipped.<br>2. Given XS, SM, MD, LG and XL viewports, when every page renders, then automated visual tests capture each and fail on unreviewed changes.<br>3. Given any interactive control, when it is measured, then its target is at least 44 × 44 CSS px on touch devices.<br>4. Given text is zoomed to 200%, when any page renders, then all content and functions remain available. |
| `L2-099` | `L1-020` | **Navigation and dialogs on small screens.**<br>Acceptance criteria:<br>1. Given XS and SM, when the header renders, then Discover, How booking works and For artists collapse into a menu button, and the Saved count and account initials remain visible.<br>2. Given XS, when any dialog opens, then it fills the screen with its close button reachable without scrolling. |

## Diagrams

### System context

Guests, bookers, artists and administrators reach Zamaro on any screen size. A CDN
serves the web assets; no other external system takes part in layout.

![C4 system context for adapting layout to screens](diagrams/c4-context.png)

### Containers

Zamaro Web renders the shell on the server and adapts it in the browser. It calls the
Zamaro API only for the current user's header data. CI runs the visual suite against
Zamaro Web backed by the e2e suite's mocked API (AGENTS.md).

![C4 container view for adapting layout to screens](diagrams/c4-container.png)

### Components

Inside Zamaro Web, `Shell` composes the top bar, the footer and the drawer (`MenuDialog`).
In M1 CSS switches them to their compact variants; `BreakpointService` and
`CurrentUserStore`, which supplies the initials and Saved count, arrive when behaviour or
accounts need them.

![C4 component view for adapting layout to screens](diagrams/c4-component.png)

### Class structure

The shell, header and dialog wrapper depend on `BreakpointService`. The header reads
`CurrentUserStore`, which mirrors the `MeResource` returned by `MeController`.

![Class diagram for adapting layout to screens](diagrams/class-structure.png)

### Behaviour — render the shell and open a dialog on a phone

At XS the header renders compact from the first paint, keeps the Saved count and
initials visible, and opens the primary links in a drawer. A dialog opened at XS
covers the screen with its close button at the top.

![Sequence diagram for the shell and a dialog on a phone](diagrams/sequence-small-screen-shell.png)

### Behaviour — visual regression check in CI

The visual suite seeds the API, captures every route state at five widths, runs the
overflow, target-size and zoom assertions, and fails the build on any unapproved
difference.

![Sequence diagram for the visual regression check](diagrams/sequence-visual-regression.png)
