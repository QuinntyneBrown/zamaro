# Top bar

| Field | Value |
|---|---|
| Selector | `zm-top-bar` |
| Library path | `frontend/projects/components/src/lib/top-bar/` |
| Status | built |
| Traces to | L2-026, L2-027, L2-034, L2-066, L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`top-bar.html`](../../design-system/components/top-bar.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/saved/empty`](../../mocks/pages/saved/empty.html), [`pages/sign-in/default`](../../mocks/pages/sign-in/default.html), [`pages/apply/default`](../../mocks/pages/apply/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/requests/empty`](../../mocks/pages/requests/empty.html), [`pages/admin-artists/default`](../../mocks/pages/admin-artists/default.html), [`pages/admin-checks/default`](../../mocks/pages/admin-checks/default.html), [`dialogs/menu/default`](../../mocks/dialogs/menu/default.html), [`dialogs/account-menu/default`](../../mocks/dialogs/account-menu/default.html), [`notifications/saved-toast/warning`](../../mocks/notifications/saved-toast/warning.html), and every other page, dialog and notification (see Usage) |
| Rendering | [`top-bar.html`](top-bar.html) |

## Purpose and scope

The top bar is the masthead on every Zamaro screen: the yellow-marked
"Zamaro" brand that goes home, the primary links, the Saved artists link with
its count, the theme toggle, and the account button (or "Sign in" when nobody
is signed in). It sits on the charcoal stage with a 4 px yellow rule under it,
sticks to the top of the viewport, and is the page's banner landmark.

The same component serves three shells:

- the **public bar** for guests and bookers (Discover, How booking works, For
  artists, Saved, account);
- the **artist workspace bar** (an "Artists" role tag, Dashboard, Requests,
  Availability, Earnings, Profile, and the "View public profile" shortcut);
- the **admin workspace bar** in the separate `admin` application (an "Admin"
  role tag, Applications, Artists, Bookings, Reviews, Audit log).

Below LG (XL for a workspace bar) the links collapse behind a menu button that
opens the navigation drawer.

Use something else when:

- it is the list of links inside the drawer or the account menu →
  [menu](menu.md) inside a [dialog](dialog.md);
- it moves between sections of an account area below the bar →
  [sidebar navigation](sidebar-navigation.md) or [tabs](tabs.md);
- it says where the page sits below another one → [breadcrumb](breadcrumb.md).

Out of scope:

- The navigation drawer and the account menu themselves. The shell opens them as
  CDK dialogs ([dialog](dialog.md) drawer and menu variants, filled by
  [menu](menu.md)), traps focus in them and returns focus to the button that
  opened them. The top bar only renders the two buttons, reflects
  `expanded`/`controls`, and emits `menuOpened` and `accountOpened`.
- Choosing, storing and applying the theme (first paint, `prefers-color-scheme`,
  saving to the account). The shell's theme service owns L2-104 AC1–AC3; the bar
  renders the toggle, reflects `themePressed` and emits `themeToggled`.
- Deciding which link is current. The shell reads it from route data and passes
  `current` (D-3).
- Fetching the Saved count, the workspace counts and the signed-in person. The
  shell passes them in; the bar formats nothing.
- `html { scroll-padding-top }`, which keeps focused and in-page targets clear
  of the sticky bar. It lives in the library's global reset
  (`styles/reset.scss`), not in the component (AGENTS.md: global styles hold
  foundations only).
- The skip link before the bar → [skip link](skip-link.md).

## Usage

The mocks render 364 top bars, one on every page, dialog and notification. Each
row is one distinct configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Booker screens (Discover, profile, book, bookings, booking detail, account, data export, saved, error pages, and every dialog and toast over them — 145 screens) | `variant="public"`, 3 links, `saved`, `account` Naomi | "Discover", "How booking works", "For artists"; Saved + count 3 " artists"; theme toggle "Dark theme"; avatar "NF", "Account menu for Naomi Fraser" | current "Discover" on `/`; no current on a profile, booking or account page | stage |
| `pages/saved/default`, `loading`, `error` | as above, `current="saved"` | Saved link current | `aria-current="page"` on Saved | stage |
| `pages/saved/empty` | as above, Saved count 0 | "Saved" with no badge | current Saved, no count | stage |
| `notifications/saved-toast/danger`, `warning` | as above, count 2 and 200 | "Saved" + "2", "Saved" + "200" | count changes in place | stage |
| `dialogs/menu/default` | as above, `menuExpanded` | menu button "Open menu" | expanded true, behind the open drawer | stage |
| `dialogs/account-menu/default` | as above, `accountExpanded` | avatar "NF" | expanded true, behind the account menu | stage |
| Signed out: `pages/apply/*`, `forgot-password/*`, `reset-password/*`, `discover/invalid` (30 screens) | `variant="public"`, 3 links, `auth` "Sign in", no `saved`, no `account` | "Sign in" link to `/sign-in` | current "For artists" on `/apply`; "Discover" on `/` | stage |
| `pages/sign-in/*`, `mfa-challenge/*` (12 screens) | `variant="public"`, `auth` with `shortLabel` | "Create account", "Sign up" below 480 px, to `/sign-up` | no current | stage |
| Artist workspace: `pages/dashboard`, `requests`, `request-detail`, `availability`, `earnings`, `edit-profile`, `profile-preview`, `account/artist`, `artist-reviews` and their dialogs (112 screens) | `variant="workspace"`, `role` "Artists", 5 links, Requests `count`, `shortcut`, `account` Abigail | "Dashboard", "Requests" + 3 " awaiting reply", "Availability", "Earnings", "Profile"; "View public profile"; avatar "AM", "Account menu for Abigail Mensah" | current on each section, and on its detail pages (Requests on a request, Profile on the preview); none on artist reviews | stage |
| Artist empty states (`dashboard/empty`, `requests/empty`, `availability/empty`, `earnings/empty`, `edit-profile/empty`, `profile-preview/empty`, `artist-reviews/empty`) | as above, Requests count 0, `account` Miriam | "Requests" with no badge; avatar "MH" | as above | stage |
| `pages/earnings/setup` | as above, `account` Tobi | avatar "TA", "Account menu for Tobi Adeyemi" | current Earnings | stage |
| `dialogs/menu/artist`, `dialogs/account-menu/artist` | as above, `menuExpanded` / `accountExpanded` | — | expanded true | stage |
| Admin workspace: every `pages/admin-*` page and its dialogs, `notifications/session-toast` (65 screens) | `variant="workspace"`, `role` "Admin", `homeLink` `/admin/applications`, 5 links with counts, no `shortcut`, `account` Priya | "Applications" + 3 " waiting", "Artists", "Bookings" + 1 " held", "Reviews" + 2 " reported", "Audit log"; avatar "PN", "Account menu for Priya Nair" | current on each section and its records; "Artists" on the checks queue (`/admin/vulnerable-sector-checks`); counts 0 hide (`admin-applications/empty`, `admin-reviews/empty`); count 2 after an approval | stage |
| `dialogs/menu/admin` | as above, `menuExpanded` | — | expanded true | stage |
| Before the session is known (first render of a signed-in route, from the [avatar](avatar.md) inventory) | `account="loading"` | skeleton circle in place of the avatar | loading | stage |
| Design system only | the theme toggle pressed | moon icon in `--color-accent-on-stage` | pressed true | stage |

## Anatomy

1. **Bar** — `<header class="topbar">`, plus `.topbar--workspace` for a
   workspace bar. Charcoal `--color-bg-stage` in both themes, at least
   `--layout-topbar-height` tall including the `--border-width-poster`
   `--color-accent` rule along the bottom; side padding `--layout-margin`.
2. **Menu button** — `zm-button` ghost icon-only with `class="topbar__menu"`,
   menu icon, name from `menuLabel`, `aria-expanded`, `aria-controls`. First in
   DOM order; shown below LG (below XL on a workspace bar).
3. **Brand** — `<a class="topbar__brand">` to `homeLink`: a 32 px (2 rem)
   `.brand-mark` square in `--color-accent` holding the `mic` icon
   (`aria-hidden`), then the word from `brand` in `--text-figure`. The word is
   the link's name.
4. **Role tag (optional)** — `<span class="topbar__role">` after the brand,
   outlined in `currentColor`, `--text-overline`, `--color-fg-on-stage-muted`:
   "Artists", "Admin".
5. **Primary navigation** — `<nav class="topbar__nav" aria-label="Primary">`
   holding one `<a class="nav-link">` per link, with an optional count badge.
   Shown from LG (from XL on a workspace bar).
6. **Current marker** — on the link with `aria-current="page"`, a 3 px
   (`--border-width-thick` + 1 px) `--color-accent-on-stage` underline drawn by
   an inset shadow.
7. **Spacer** — `<span class="topbar__spacer">`, which pushes the rest right.
8. **Saved link (public bar, signed in)** — `<a class="nav-link topbar__saved">`
   to `/saved`: heart icon, the label in `.nav-link__text` (visually hidden
   below LG), and a yellow count badge.
9. **Shortcut (workspace, optional)** — `<a class="nav-link topbar__link">`
   ("View public profile"), shown only from 2XL (1536 px).
10. **Theme toggle** — `zm-button` ghost icon-only with `class="topbar__theme"`,
    moon icon, visually hidden "Dark theme", `aria-pressed`. Shown from LG; below
    LG the drawer carries the same toggle.
11. **Account button (signed in)** — the [avatar](avatar.md) button
    (`zm-avatar-button`) with the person's initials.
12. **Account link (signed out)** — `<a class="nav-link">` "Sign in", or
    `<a class="nav-link topbar__auth">` with a short and a long label.

Host: `zm-top-bar` is `display: block; position: sticky; top: 0; z-index:
var(--z-sticky)` and renders exactly one `<header class="topbar">`, which
carries every class above. The host, not the header, is sticky (D-6). The
count badges are [badge](badge.md) hosts (`zm-badge variant="count"`), the two
icon buttons are [button](button.md) hosts and the account button is an
[avatar](avatar.md) host.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'public' \| 'workspace'` | `'public'` | no | `workspace` adds `.topbar--workspace`: the links collapse until XL and Saved never renders. |
| `brand` | `string` | — | yes | The brand word, "Zamaro". It is the home link's accessible name. |
| `homeLink` | `string \| readonly unknown[]` | `'/'` | no | `routerLink` of the brand: `'/'`, `'/artist'`, `'/admin/applications'`. |
| `role` | `string` | `''` | no | Renders `.topbar__role` after the brand when not empty: "Artists", "Admin". |
| `navLabel` | `string` | — | yes | `aria-label` of the primary `<nav>`: "Primary". It must be the only nav with that name on the page. |
| `links` | `readonly TopBarLink[]` | — | yes | The primary links in order; three to five. |
| `current` | `string \| null` | `null` | no | The `id` of the current link, or `'saved'` for the Saved link. That link gets `aria-current="page"`; `null` marks nothing. The brand and the shortcut are never current. |
| `saved` | `TopBarSaved \| null` | `null` | no | Renders the Saved link (public bar, signed in). Ignored on a workspace bar; in dev mode setting it there logs a console error naming the component. |
| `shortcut` | `TopBarLinkBase \| null` | `null` | no | Renders `.topbar__link` (workspace bar): "View public profile" to `/artists/abigail-mensah`. |
| `account` | `TopBarAccount \| 'loading' \| null` | `null` | no | Signed in: renders the avatar button. `'loading'`: the avatar's skeleton circle while the session is being read. `null`: nothing, and `auth` shows instead. |
| `accountExpanded` | `boolean` | `false` | no | The avatar button's `aria-expanded`: true while the account menu is open. |
| `accountControls` | `string` | — | no | The avatar button's `aria-controls`: the account menu dialog's `id`. |
| `auth` | `TopBarAuth \| null` | `null` | no | Signed out: renders the account link. Ignored while `account` is not `null`. |
| `menuLabel` | `string` | — | yes | The menu button's accessible name: "Open menu". Constant; it does not change when the drawer opens (D-7). |
| `menuExpanded` | `boolean` | `false` | no | The menu button's `aria-expanded`. |
| `menuControls` | `string` | — | no | The menu button's `aria-controls`: the drawer dialog's `id` ("nav-drawer"). |
| `themeLabel` | `string` | — | yes | The theme toggle's constant name, "Dark theme", rendered as visually hidden text. |
| `themePressed` | `boolean` | `false` | no | The theme toggle's `aria-pressed`: true while the dark (stage) theme is on. |

Inputs are Angular signal inputs; `accountExpanded`, `menuExpanded` and
`themePressed` accept bare attributes (`booleanAttribute`).

Types, exported from the library's public API:

```ts
export interface TopBarLinkBase {
  label: string;                      // "View public profile"
  link: string | readonly unknown[];  // routerLink
  fragment?: string;                  // "how", "join"
  queryParams?: Params;
}

export interface TopBarLink extends TopBarLinkBase {
  id: string;                         // matched against `current`: "discover", "requests"
  count?: number | null;              // 3; 0, null or undefined renders no badge
  countLabel?: string;                // "awaiting reply", "waiting", "held", "reported"
}

export interface TopBarSaved {
  label: string;                      // "Saved"
  link: string | readonly unknown[];  // "/saved"
  count: number;                      // 0 renders no badge
  countLabel: string;                 // "artists"
}

export interface TopBarAccount {
  name: string;                       // "Naomi Fraser": the avatar's initials come from it
  label: string;                      // "Account menu for Naomi Fraser"
  kind?: 'person' | 'group';          // as the avatar's `kind`; defaults to 'person'
  photo?: { src: string; srcset: string } | null;
}

export interface TopBarAuth {
  label: string;                      // "Sign in", or the long form "Create account"
  shortLabel?: string;                // "Sign up": shown below 480 px instead of `label`
  link: string | readonly unknown[];  // "/sign-in", "/sign-up"
}
```

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `menuOpened` | `void` | The menu button is activated (click, <kbd>Enter</kbd> or <kbd>Space</kbd>). The shell opens the drawer. |
| `accountOpened` | `void` | The avatar button is activated. The shell opens the account menu. |
| `themeToggled` | `void` | The theme toggle is activated. The shell flips the theme and sets `themePressed`. |

Links navigate through the router; they emit nothing.

### Content slots

None. Every part is built from inputs so the bar renders identically on the
server and in the browser, and the 364 call sites cannot drift. Every string
arrives through `brand`, `role`, `navLabel`, the link labels and count labels,
`menuLabel`, `themeLabel`, the account `label` and the auth labels (L2-111).

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Public | — | Guests and bookers in the `zamaro` application. Three links, Saved when signed in, "Sign in" when not. |
| Workspace | `.topbar--workspace` | The artist area (`role` "Artists") and the `admin` application (`role` "Admin"). Five links with counts, no Saved, an optional shortcut. Compact until XL. |

The signed-in, signed-out and loading forms are not variants: they follow from
`account` and `auth`.

The top bar has one size: at least `--layout-topbar-height` (68 px including
the rule) at every width. Its width is the viewport's; only its contents change
with the breakpoint (see Responsive behaviour).

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Paper `--color-fg-on-stage` text and icons on `--color-bg-stage` | Banner landmark containing the "Primary" navigation landmark |
| Link hover | `:hover` on a `.nav-link`, the brand or the shortcut | Text turns `--color-accent-on-stage`; no fill, no lift | — |
| Link focus | `:focus-visible` | Ring in `--color-accent-on-stage` at `--focus-ring-width`, `--focus-ring-offset` gap in `--color-bg-stage` | — |
| Current | `current` names the link (or `'saved'`) | `--color-accent-on-stage` underline, 3 px, inset; text stays paper | `aria-current="page"` ("current page") |
| Count | `count` > 0 | Yellow `.badge--count` after the label ([badge](badge.md)) | Name gains the number and the hidden noun: "Requests 3 awaiting reply" |
| No count | `count` 0, `null` or absent | No badge | Name is the label alone: "Saved" |
| Menu open | `menuExpanded` | Menu button takes the expanded stage fill `--color-bg-stage-raised` ([button](button.md)) | `aria-expanded="true"`, name unchanged |
| Account open | `accountExpanded` | Avatar as the [avatar](avatar.md) expanded state | `aria-expanded="true"` |
| Theme on | `themePressed` | Moon icon filled in `--color-accent-on-stage`; no yellow fill | `aria-pressed="true"`: "Dark theme, toggle button, pressed" |
| Account loading | `account === 'loading'` | Skeleton circle the size of the avatar; no button | `aria-hidden="true"`; no control announced |
| Signed out | `account` null and `auth` set | "Sign in" link (or "Sign up" / "Create account") at the right end | Link named by its visible text |
| Behind a dialog | a CDK dialog is open | Unchanged; covered by the backdrop | Inert (the dialog hides the rest of the page) |
| Printed | `@media print` | The bar is not printed | — |

The brand has no current state: it always links home.

## Markup

Rendered by `zm-top-bar`, public bar, Naomi signed in on Discover (LG and up;
the same DOM at every width — CSS hides and shows the parts):

```html
<zm-top-bar>
  <header class="topbar">
    <zm-button class="topbar__menu" variant="ghost" iconOnly>
      <button class="btn btn--ghost btn--icon" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer"><zm-icon name="menu" aria-hidden="true">…</zm-icon></button>
    </zm-button>
    <a class="topbar__brand" href="/"><span class="brand-mark" aria-hidden="true"><zm-icon name="mic" size="sm">…</zm-icon></span>Zamaro</a>
    <nav class="topbar__nav" aria-label="Primary">
      <a class="nav-link" href="/" aria-current="page">Discover</a>
      <a class="nav-link" href="/#how">How booking works</a>
      <a class="nav-link" href="/#join">For artists</a>
    </nav>
    <span class="topbar__spacer"></span>
    <a class="nav-link topbar__saved" href="/saved">
      <zm-icon name="heart" aria-hidden="true">…</zm-icon><span class="nav-link__text">Saved</span>
      <zm-badge variant="count"><span class="badge badge--count">3<span class="visually-hidden"> artists</span></span></zm-badge>
    </a>
    <zm-button class="topbar__theme" variant="ghost" iconOnly>
      <button class="btn btn--ghost btn--icon" type="button" aria-pressed="false"><zm-icon name="moon" aria-hidden="true">…</zm-icon><span class="visually-hidden">Dark theme</span></button>
    </zm-button>
    <zm-avatar-button>
      <button class="avatar" type="button" aria-label="Account menu for Naomi Fraser" aria-haspopup="dialog" aria-expanded="false" aria-controls="account-menu">NF</button>
    </zm-avatar-button>
  </header>
</zm-top-bar>
```

The `topbar__menu` and `topbar__theme` classes sit on the `zm-button` hosts,
which the button CRD keeps on the host; the top bar's stylesheet hides and
shows those hosts. Saved with no count renders no `zm-badge` at all.

Workspace bar, Abigail on Requests:

```html
<header class="topbar topbar--workspace">
  <zm-button class="topbar__menu" …>…</zm-button>
  <a class="topbar__brand" href="/artist"><span class="brand-mark" aria-hidden="true">…</span>Zamaro</a>
  <span class="topbar__role">Artists</span>
  <nav class="topbar__nav" aria-label="Primary">
    <a class="nav-link" href="/artist">Dashboard</a>
    <a class="nav-link" href="/artist/requests" aria-current="page">Requests <zm-badge variant="count"><span class="badge badge--count">3<span class="visually-hidden"> awaiting reply</span></span></zm-badge></a>
    <a class="nav-link" href="/artist/calendar">Availability</a>
    <a class="nav-link" href="/artist/earnings">Earnings</a>
    <a class="nav-link" href="/artist/profile">Profile</a>
  </nav>
  <span class="topbar__spacer"></span>
  <a class="nav-link topbar__link" href="/artists/abigail-mensah">View public profile</a>
  <zm-button class="topbar__theme" …>…</zm-button>
  <zm-avatar-button><button class="avatar" type="button" aria-label="Account menu for Abigail Mensah" aria-haspopup="dialog" aria-expanded="false" aria-controls="account-menu">AM</button></zm-avatar-button>
</header>
```

The admin bar has the same structure with `role` "Admin", the brand to
`/admin/applications`, five admin links and no `.topbar__link`.

Signed out, and on the sign-in page:

```html
<!-- after the theme toggle, in place of Saved and the avatar -->
<a class="nav-link" href="/sign-in">Sign in</a>

<a class="nav-link topbar__auth" href="/sign-up"><span class="topbar__auth-short">Sign up</span><span class="topbar__auth-long">Create account</span></a>
```

Session loading (in place of the avatar button):

```html
<zm-avatar-button><span class="skeleton skeleton--circle avatar-skeleton" aria-hidden="true"></span></zm-avatar-button>
```

Consumer templates:

```html
<!-- zamaro shell: booker -->
<zm-top-bar
  brand="Zamaro"
  [navLabel]="'common.nav.label' | transloco"
  [links]="links()"
  [current]="section()"
  [saved]="saved()"
  [account]="account()"
  [accountExpanded]="accountOpen()"
  accountControls="account-menu"
  [auth]="auth()"
  [menuLabel]="'common.menu.open' | transloco"
  [menuExpanded]="menuOpen()"
  menuControls="nav-drawer"
  [themeLabel]="'common.theme.dark' | transloco"
  [themePressed]="theme.isDark()"
  (menuOpened)="openMenu()"
  (accountOpened)="openAccountMenu()"
  (themeToggled)="theme.toggle()"
/>

<!-- admin shell -->
<zm-top-bar variant="workspace" brand="Zamaro" homeLink="/admin/applications" [role]="'admin.role' | transloco" [links]="adminLinks()" [current]="section()" [account]="account()" … />
```

```ts
// zamaro shell: the links and Saved, from the catalogue and the session
links = computed<TopBarLink[]>(() => [
  { id: 'discover', label: this.t('common.nav.discover'), link: '/' },
  { id: 'how', label: this.t('common.nav.how'), link: '/', fragment: 'how' },
  { id: 'for-artists', label: this.t('common.nav.forArtists'), link: '/', fragment: 'join' },
]);
// route data: { section: 'discover' } on '/', { section: 'for-artists' } on '/apply', { section: 'saved' } on '/saved'
saved = computed<TopBarSaved | null>(() => this.session.signedIn()
  ? { label: this.t('common.nav.saved'), link: '/saved', count: this.savedCount(), countLabel: this.t('common.nav.savedCount') }
  : null);
```

The classes, `aria-current`, `aria-expanded`, `aria-pressed` and the landmark
names are a contract: the e2e page objects find the bar by its banner role, the
links by role and name inside the "Primary" navigation, and the current link
by `aria-current`. The icon and badge internals are free to change.

## Design

- Bar: `display: flex; align-items: center`, gap `--space-3` (`--space-2`
  below SM), `min-height: var(--layout-topbar-height)`, padding `--space-3`
  `--layout-margin`, bottom rule `--border-width-poster` in `--color-accent`.
- Brand: `inline-flex`, gap `--space-2`, `--text-figure` uppercase with
  `--letter-spacing-wide`; `--font-size-xl` below SM and `--font-size-lg` below
  400 px (25 rem). `min-height: var(--target-comfortable)` so its target meets
  44 px (D-9). The mark is 2 rem square, `--color-accent` fill, icon in
  `--color-fg-on-accent`.
- Role tag: `--text-overline`, `--letter-spacing-stamp`, uppercase, padding
  `--space-0-5` `--space-2`, `--border-width-hairline` rule in `currentColor`,
  colour `--color-fg-on-stage-muted`.
- Primary nav: `display: flex`, gap `--space-1`. Hidden below LG; on a workspace
  bar hidden from LG to below XL too.
- Nav links (`.nav-link`, also the Saved, shortcut and auth links):
  `inline-flex`, gap `--space-2`, `min-height: var(--target-comfortable)`,
  padding `0 --space-3` (`--space-2` below SM), `--text-label` uppercase with
  `--letter-spacing-wide`, no underline, `white-space: nowrap` — except inside
  `.topbar__nav` from LG, where a label may wrap onto a second line (D-10).
- Current marker: `box-shadow: inset 0 calc(var(--border-width-thick) * -1 - 1px) 0 var(--color-accent-on-stage)`.
- Saved label (`.nav-link__text`): visually hidden below LG, shown from LG.
- Shortcut: hidden below 2XL (`--layout-breakpoint-2xl`, 96 rem).
- Auth link: `white-space: nowrap`; the short label shows below 480 px (30 rem),
  the long label from 480 px.
- Focus inside the bar: `outline-color: var(--color-accent-on-stage)` with a
  `--focus-ring-offset` gap in `--color-bg-stage`.
- Motion: link colour changes over `--duration-fast` with `--ease-standard`; the
  avatar's hover scale is the avatar's.
- Layer: the host is sticky at `top: 0` with `z-index: var(--z-sticky)`; the
  [skip link](skip-link.md) sits above it at `--z-tooltip`.

The top bar declares no component tokens. Its children are re-skinned by
context in their own stylesheets: the [button](button.md) maps `.topbar` ghost
buttons (text `currentColor`, hover `--color-accent-on-stage`, pressed theme
toggle with a yellow icon and no fill, expanded `--color-bg-stage-raised`), the
[badge](badge.md) keeps the count yellow on the stage, and the
[avatar](avatar.md) keeps its yellow disc and ink outline. The bar's own
stylesheet styles only its own elements (`.topbar*`, `.brand-mark`,
`.nav-link`), so pages never reach into it.

## Colour

The bar is a stage surface in both themes, so it barely changes between them.

| Part | Token | Light | Dark |
|---|---|---|---|
| Bar fill | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Text, icons, link labels | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Hover text, current underline, focus ring, pressed moon | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |
| Bottom rule, brand mark, count fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Mark icon, count numeral and outline | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Role tag | `--color-fg-on-stage-muted` | `--palette-ink-300` | `--palette-ink-300` |
| Expanded menu button | `--color-bg-stage-raised` | `--palette-ink-800` | `--palette-ink-800` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | Link text, brand word |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Hover text; also the current underline and focus ring (3:1 needed) |
| `--color-fg-on-stage-muted` | `--color-bg-stage` | 4.5:1 | Role tag |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Count numeral, brand-mark icon |
| `--color-accent` | `--color-bg-stage` | 3:1 | Bottom rule and count badge against the bar |
| `--color-fg-on-stage` | `--color-bg-stage-raised` | 4.5:1 | Menu icon on the expanded fill |

The current page is marked by the underline and `aria-current`, never by colour
alone. Under forced colours the bar keeps its rule as `CanvasText`, links use
`LinkText`, and the current underline is drawn with a real
`border-bottom` in `Highlight` (box shadows are removed in forced-colours
mode, so the stylesheet adds that border inside `@media (forced-colors: active)`).

## Responsive behaviour

| Width | Public bar | Workspace bar |
|---|---|---|
| Below 400 px | Menu, brand at `--font-size-lg`, spacer, Saved (heart + count), avatar; or menu, brand, "Sign in" / "Sign up" | Menu, brand, role tag, spacer, avatar |
| 400–575 px (XS) | As above with the brand at `--font-size-xl`; gaps `--space-2`; link padding `--space-2` | As above |
| 480 px | The auth link switches from "Sign up" to "Create account" | — |
| 576–991 px (SM, MD) | Compact: menu button, brand, spacer, Saved (heart + count), avatar; gaps `--space-3` | Compact |
| 992–1199 px (LG) | Full: brand, the links, spacer, Saved with its label, theme toggle, avatar; no menu button | Still compact (five links do not fit): menu button, brand, role tag, spacer, theme toggle, avatar |
| 1200 px and up (XL) | Full | Full: brand, role tag, five links, spacer, theme toggle, avatar |
| 1536 px and up (2XL) | Full | Full, plus the "View public profile" shortcut |

- L2-099: at XS and SM the three public links collapse into the menu button,
  and the Saved count and the initials stay visible. MD keeps the compact bar
  because the full one needs about 870 px.
- The bar never scrolls sideways and never clips text. At 320 px the public row
  (44 + brand + Saved about 70 + 40 + gaps) fits; the brand drops to
  `--font-size-lg` below 400 px so it still fits when the display face falls
  back to a wider one.
- At 200 % zoom the CSS viewport halves, so a 1280 px window shows the compact
  bar and every link stays reachable through the drawer.
- Every target is at least 44 × 44 CSS px: links, Saved and the auth link are
  `--target-comfortable` tall, the icon buttons are 44 px squares, the brand
  link is `--target-comfortable` tall (D-9), and the avatar extends its target
  to 44 px (avatar D-4).
- The height never changes with the breakpoint, the state or the count, so the
  sticky offset and `scroll-padding-top` hold.

## Accessibility

### Role and pattern

The bar is a `<header>` outside any `main`, `article`, `aside`, `nav` or
`section`, so it is the page's banner landmark; the links sit in
`<nav aria-label="Primary">`. The menu button follows the
[APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
(`aria-expanded`, `aria-controls`) with a modal drawer behind it. The theme
toggle is an [APG toggle button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
(`aria-pressed`). The account button declares `aria-haspopup="dialog"` because
the account menu is a dialog holding a plain list of links, not an ARIA menu
(D-4; avatar D-3). Saved is a link, not a disclosure (D-5).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through, in DOM order: menu button (when shown), brand, the links (when shown), Saved, shortcut (when shown), theme toggle (when shown), avatar or the account link. Hidden parts are `display: none` and are skipped. |
| <kbd>Enter</kbd> | Follows a link; activates the menu button, the theme toggle or the avatar. |
| <kbd>Space</kbd> | Activates the menu button, the theme toggle or the avatar. Does not follow links. |
| <kbd>Esc</kbd> | Closes the open drawer or account menu (the dialog's behaviour) and focus returns to the button that opened it. |

### Focus

The skip link is the first stop on every page, before the bar. Inside the bar
the ring is `--color-accent-on-stage` with a `--color-bg-stage` gap in both
themes, drawn outside each control and never clipped by the bar. Opening the
drawer or the account menu moves focus into the dialog; closing it returns
focus to the menu button or the avatar ([dialog](dialog.md), L2-101 AC4). The
bar never moves focus itself. Because it is sticky, the global
`scroll-padding-top` (`--layout-topbar-height` plus `--space-4`) keeps a focused
element and an in-page target below it.

### Labelling

- Brand: "Zamaro"; the mark is `aria-hidden`.
- Navigation: "Primary", unique on the page.
- Saved: "Saved 3 artists" — the badge's number plus its visually hidden
  " artists"; below LG "Saved" is visually hidden, not removed, so the name is
  the same at every width. With no saved artists: "Saved".
- Workspace counts: "Requests 3 awaiting reply", "Applications 3 waiting",
  "Bookings 1 held", "Reviews 2 reported".
- Menu button: "Open menu", with `aria-expanded` for its state.
- Theme toggle: "Dark theme", constant, with `aria-pressed` for its state.
- Avatar: "Account menu for Naomi Fraser"; initials are never the name.
- Icons are `aria-hidden`.

### Announcements

The bar announces nothing. When a save changes the count, the badge updates in
place and the page's polite toast ("Saved Abigail Mensah") announces it; the
badge is not a live region.

### Motion

Link colour changes take `--duration-fast`; the avatar's hover scale is the
avatar's. Under `prefers-reduced-motion: reduce` the duration tokens drop to
near zero, so changes are instant. Nothing in the bar slides or fades; the
drawer's slide is the dialog's.

## Content and internationalisation

- Nav labels are one to three short words, sentence case in the source; CSS
  uppercases them: "Discover", "How booking works", "For artists";
  "Dashboard", "Requests", "Availability", "Earnings", "Profile";
  "Applications", "Artists", "Bookings", "Reviews", "Audit log".
- Three to five links. More belongs in the drawer, the footer or an account page.
- The Saved count is the number of saved artists (L2-027), not a notification
  count; it shows the real number, "200" (D-8). Counts are digits from the
  badge.
- Count nouns come from the catalogue without a leading space ("artists",
  "awaiting reply", "waiting", "held", "reported"); the badge adds the space.
- The role tag is one word: "Artists", "Admin".
- The signed-out link is "Sign in"; on the sign-in page it is "Create account",
  shortened to "Sign up" below 480 px.
- The brand word "Zamaro" is a proper name and is passed in, not translated.
- Translatable inputs: `navLabel`, link `label` and `countLabel`, Saved
  `label` and `countLabel`, `shortcut.label`, `role`, `menuLabel`,
  `themeLabel`, the account `label` (a catalogue string with the name
  interpolated), the auth `label` and `shortLabel`. Data values: the person's
  `name`, the counts, the routes. The component has no copy of its own
  (L2-111).
- French runs about 30 % longer. At LG a primary label may wrap onto a second
  line inside its 44 px link (D-10); the Saved label, the shortcut and the auth
  link never wrap and were budgeted to fit.

## Performance

- Change detection: `OnPush`, signal inputs. The rendered link list, the
  current flags and the Saved/count presence come from `computed` signals; no
  `effect`, no subscriptions, no `routerLinkActive` (D-3), no host listeners.
- Perf-test scenarios:
  - `frontend/projects/perf-test/src/scenarios/TopBar.ts` renders Naomi
    Fraser's public bar on Discover: three links with "Discover" current, Saved
    with count 3 " artists", the theme toggle "Dark theme", and the "NF" avatar
    "Account menu for Naomi Fraser".
  - `frontend/projects/perf-test/src/scenarios/TopBarWorkspace.ts` renders
    Abigail Mensah's artist bar: role "Artists", five links with "Requests" +
    3 " awaiting reply" current, "View public profile", the theme toggle and
    the "AM" avatar.
  - Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
    roughly 100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Regression rule: a change to its template, inputs, styles or change detection
  is measured against the base branch with `--fail-on-regression` before it is
  pushed.
- Layout stability: the bar's height is fixed by `--layout-topbar-height`; the
  account skeleton is the avatar's size, the badge appears inside a link that
  does not change height, and the server renders the same parts the browser
  shows, so hydration and the session arriving shift nothing (L2-086).
- Weight: imports Angular core, `RouterLink`, and the library's `zm-button`,
  `zm-icon`, `zm-badge` and `zm-avatar-button`. It never imports the CDK
  dialog, the drawer or the account menu; the shell loads those on first use.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi Fraser signed in on Discover (`/`) with `current="discover"`, when the public bar renders at 1280 px, then the page has exactly one banner landmark containing a navigation landmark named "Primary" with the links "Discover", "How booking works" and "For artists" in that order, followed by Saved, the "Dark theme" toggle and the "Account menu for Naomi Fraser" button. (L2-102)
- **AC-2** Given the brand link, when it renders, then its accessible name is "Zamaro", the mark is hidden from assistive technology, and activating it navigates to `homeLink` (`/` on the public bar, `/artist` for Abigail, `/admin/applications` for Priya Nair). (L2-102)
- **AC-3** Given `current` is "discover", when the bar renders, then only the "Discover" link has `aria-current="page"` and the `--color-accent-on-stage` underline; given `current` is null on Abigail Mensah's profile, then no link in the bar has `aria-current`. (L2-102)
- **AC-4** Given Priya Nair on the checks queue at `/admin/vulnerable-sector-checks` with `current="artists"`, when the admin bar renders at 1280 px, then "Artists" has `aria-current="page"` although its link is `/admin/artists`. (L2-066)
- **AC-5** Given Abigail Mensah with 3 requests awaiting reply, when the artist bar renders at 1280 px, then it has `.topbar--workspace`, the role tag "Artists", five links, no Saved link, and the Requests link's accessible name is "Requests 3 awaiting reply". (L2-034)
- **AC-6** Given Miriam Haile with no requests (`count` 0), when the artist bar renders, then the Requests link has no count badge and its name is "Requests". (L2-034)
- **AC-7** Given the admin bar for Priya Nair, when it renders at 1280 px, then the links read "Applications 3 waiting", "Artists", "Bookings 1 held", "Reviews 2 reported" and "Audit log", the role tag reads "Admin", and there is no `.topbar__link`. (L2-066)

### Saved

- **AC-8** Given Naomi with 3 saved artists, when the bar renders, then the Saved link goes to `/saved`, shows the heart, "Saved" and a yellow count "3", and its accessible name is "Saved 3 artists". (L2-026)
- **AC-9** Given Naomi saves a fourth artist, when `saved.count` changes from 3 to 4, then the badge shows "4" in place, the bar's height and the link's position do not change, and focus stays where it was. (L2-026)
- **AC-10** Given Naomi on `/saved` with no saved artists, when the bar renders with `current="saved"` and count 0, then the Saved link has `aria-current="page"`, no badge, and the name "Saved". (L2-027)
- **AC-11** Given a booker with 200 saved artists (the L2-026 limit), when the bar renders, then the badge shows "200", not a capped value, and the bar does not grow or overflow at 320 px. (L2-027)

### Signed out and loading

- **AC-12** Given a guest on `/apply` with `account` null and `auth` "Sign in", when the bar renders, then there is no Saved link and no avatar, a "Sign in" link to `/sign-in` follows the theme toggle, and "For artists" is current. (L2-102)
- **AC-13** Given the sign-in page with `auth` { label "Create account", shortLabel "Sign up", link `/sign-up` }, when the bar renders at 360 px, then the link shows "Sign up"; at 576 px it shows "Create account"; and its accessible name always matches the visible text. (L2-100)
- **AC-14** Given a signed-in route before the session is known (`account="loading"`), when the bar renders, then a skeleton circle the avatar's size takes the account button's place with `aria-hidden="true"`; when Naomi's session arrives, then "NF" replaces it with a cumulative layout shift of 0. (L2-105)

### Interaction

- **AC-15** Given the compact bar at 360 px, when the menu button "Open menu" is activated with a click, <kbd>Enter</kbd> or <kbd>Space</kbd>, then `menuOpened` emits once; and given the shell then sets `menuExpanded`, then the button has `aria-expanded="true"`, `aria-controls="nav-drawer"`, the name "Open menu" and the `--color-bg-stage-raised` fill. (L2-099)
- **AC-16** Given the avatar "Account menu for Naomi Fraser", when it is activated, then `accountOpened` emits once; and given the shell sets `accountExpanded`, then the button has `aria-haspopup="dialog"`, `aria-expanded="true"` and `aria-controls` naming the account menu. (L2-101)
- **AC-17** Given the light theme at 1280 px, when the theme toggle "Dark theme" is activated, then `themeToggled` emits once; and given the shell sets `themePressed`, then the toggle has `aria-pressed="true"`, keeps the name "Dark theme", and its moon icon is `--color-accent-on-stage` with no yellow fill. (L2-104)

### Keyboard and focus

- **AC-18** Given Naomi's bar at 1280 px, when Tab is pressed from the skip link, then focus visits the brand, "Discover", "How booking works", "For artists", Saved, the theme toggle and the avatar, in that order, and never the hidden menu button. (L2-101)
- **AC-19** Given any control in the bar, when it receives keyboard focus in either theme, then a ring in `--color-accent-on-stage` with a `--color-bg-stage` gap is visible and is not clipped by the bar. (L2-101)
- **AC-20** Given the page scrolled so the sticky bar overlaps content, when Tab moves focus to a field directly under the bar, then the field scrolls clear of the bar and is not hidden by it. (L2-101)

### Responsive

- **AC-21** Given XS (360 px) and SM (576 px), when the public bar renders for Naomi, then "Discover", "How booking works" and "For artists" are not displayed and the menu button is, while the Saved count "3" and the initials "NF" stay visible, and the Saved link's name is still "Saved 3 artists". (L2-099)
- **AC-22** Given the artist bar at 992 px and at 1199 px, when it renders, then the links are behind the menu button; at 1200 px they show inline and the menu button is hidden; "View public profile" shows only from 1536 px. (L2-099)
- **AC-23** Given a 320 px viewport, when the public bar renders for Naomi and the signed-out bar renders on the sign-in page, then neither scrolls horizontally, nothing is clipped, and the bar keeps `--layout-topbar-height`. (L2-096)
- **AC-24** Given a coarse pointer, when the brand link, the links, Saved, the menu button, the theme toggle and the avatar are measured, then each target is at least 44 × 44 CSS px. (L2-096)
- **AC-25** Given text zoomed to 200 % in a 1280 px window, when the bar renders, then it shows the compact layout and every primary link is reachable through the menu button. (L2-096)

### Content

- **AC-26** Given the French catalogue, when the public bar renders at 992 px with labels about 30 % longer, then each primary label fits on at most two lines inside its link, the bar keeps its height, and the page does not scroll horizontally. (L2-111)

### Theming and contrast

- **AC-27** Given the dark theme, when the bar renders, then its fill is `--color-bg-stage` (`--palette-ink-950`), darker than the dark canvas, with the same paper text, yellow rule, mark and badges as in the light theme. (L2-104)
- **AC-28** Given both themes, when contrast is measured, then link text and the role tag are at least 4.5:1 on the bar, the hover text is at least 4.5:1, the count numeral is at least 4.5:1 on yellow, and the focus ring, the current underline and the bottom rule are at least 3:1 against the bar. (L2-103)
- **AC-29** Given the axe-core run over the public, signed-out, artist and admin bars, collapsed and full, in both themes, when it runs, then there are zero serious or critical violations. (L2-100)

### Motion

- **AC-30** Given `prefers-reduced-motion: reduce`, when a link is hovered or the theme toggles, then the colour change happens with no transition. (L2-103)

### Performance

- **AC-31** Given the `TopBar` and `TopBarWorkspace` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-top-bar` with `brand`, `homeLink`, `navLabel`, `links`
(`label`, `link`, `fragment`), `menuLabel`, `menuExpanded`, `menuControls`,
`themeLabel`, `themePressed` and the `menuOpened` and `themeToggled` outputs.
Its perf-test scenario renders the guest bar. To meet this CRD:

- Add `variant` (`.topbar--workspace` and its XL/2XL rules), `role`
  (`.topbar__role`), `shortcut` (`.topbar__link`), `saved`
  (`.topbar__saved`, `.nav-link__text`), `account` (including `'loading'`),
  `accountExpanded`, `accountControls`, `auth` (`.topbar__auth`,
  `.topbar__auth-short`, `.topbar__auth-long` and the 30 rem rule) and the
  `accountOpened` output.
- Add `id`, `count`, `countLabel` and `queryParams` to `TopBarLink`, and accept
  a commands array for `link` and `homeLink`; render counts with
  `zm-badge variant="count"`.
- Replace `routerLinkActive` and `exactMatch` with the `current` input (D-3).
- Make the host sticky (`:host { display: block; position: sticky; top: 0;
  z-index: var(--z-sticky) }`) and drop `position: sticky` from `.topbar`
  (D-6).
- Give the brand link `min-height: var(--target-comfortable)` (D-9) and add
  the 25 rem brand size step.
- Let `.topbar__nav .nav-link` wrap onto two lines from LG (`white-space:
  normal; text-wrap: balance; max-inline-size` from its content), keeping
  `nowrap` everywhere else (D-10).
- Render the account button with `zm-avatar-button` (`name`, `label`,
  `expanded`, `controls`, `loading`); the avatar CRD owns its look, hit area
  and `aria-haspopup="dialog"`.
- Remove the `.topbar__menu { color: inherit }` and the
  `.topbar :focus-visible` overrides only if the button CRD's `:host-context(.topbar)`
  mapping covers them; keep the ring for the brand and the links.
- Add the forced-colours current underline and `@media print { :host { display: none } }`.
- Log a dev-mode console error when `saved` is set on a workspace bar.
- Update `TopBar.ts` to Naomi's signed-in bar and add `TopBarWorkspace.ts`,
  exporting it from `scenarios/index.ts`; tune both in
  `scenario-iterations.mjs`. Do not lower existing iterations.
- Update the `zamaro` shell to pass `current`, `saved`, `account`/`auth` and
  the account outputs, and build the `admin` shell's workspace bar the same way.

## Decisions

- **D-1** *Data inputs or projected content for the links?* Data inputs, as built. The bar appears on all 364 screens in two applications; a typed `links` array keeps every shell's bar structurally identical, lets the component own the `.nav-link`, count and current markup that the e2e page objects depend on, and avoids conditional slots.
- **D-2** *One component with a `variant`, or separate public and workspace bars?* One component. The design system documents one bar with a `.topbar--workspace` modifier; the parts (brand, nav, spacer, theme toggle, avatar) are shared and only visibility rules and the role tag differ.
- **D-3** *How is the current link decided?* By an explicit `current` id that the shell reads from route data, not by `routerLinkActive`. The mocks mark "Artists" on `/admin/vulnerable-sector-checks`, "Requests" on a request's own page, "Profile" on the profile preview and nothing on artist reviews, which no path rule reproduces; and "Discover" must stay current on `/#how`, which fragment matching would move to "How booking works". The [sidebar navigation](sidebar-navigation.md) panel uses the same `current` approach.
- **D-4** *The patterns name `aria-haspopup="menu"` for the avatar; the mocks render the account menu as a dialog with a plain link list. Which?* `aria-haspopup="dialog"`, matching the `dialogs/account-menu` mock note ("a plain link list, not an arrow-key menu"), the built `zm-menu`, and the [avatar](avatar.md) CRD's D-3. Declaring a menu would promise arrow-key behaviour that is not there.
- **D-5** *The design-system page renders Saved as a `<button aria-expanded>` opening a panel, but also says it links to the Saved artists page, and every mock renders `<a href="…/saved">`. Which?* A link to `/saved`. L2-027 gives saved artists their own page, every mock links there, and the design system's own code sample uses `<a>`. There is no Saved panel, so the "open" Saved state is dropped and Saved's current state is `aria-current="page"` on `/saved`, as in `pages/saved/*`.
- **D-6** *Which element is sticky?* The host. A sticky element sticks only within its parent's box, and the `<header>`'s parent is the `zm-top-bar` host, which is exactly the bar's height; the host is a child of the shell, whose box spans the page.
- **D-7** *The design-system states matrix shows the open menu button as "Close menu" with a close icon; the mocks keep "Open menu" with `aria-expanded="true"`. Which?* Keep "Open menu" and the menu icon; `aria-expanded` and the expanded fill carry the state. The drawer is modal and has its own "Close menu" button, so the bar's button cannot be reached while it is open, and a changing name plus a state would contradict each other — the same rule the design system applies to the theme toggle.
- **D-8** *The top-bar page says the Saved count "never says 9+; show the real number" and `notifications/saved-toast/warning` shows "200"; an earlier draft of the [badge](badge.md) CRD capped counts at "99+". Which?* The real number, confirmed by the team lead: L2-026 AC4 caps saved artists at 200, so the count never exceeds three digits, and the badge CRD drops its cap and sizes the count badge for three digits. The bar passes the count through unchanged.
- **D-9** *The brand link is only as tall as its 32 px mark, below the 44 px target L2-096 requires on touch devices. Fix?* Give the brand link `min-height: var(--target-comfortable)`. It sits in a 68 px bar, so the bar does not grow and the mark does not change.
- **D-10** *French labels about 30 % longer would push the three public links past the width they have at 992 px. Wrap, truncate, or collapse by measurement?* From LG a primary nav label may wrap onto a second line inside its 44 px link (`text-wrap: balance`); English labels stay on one line. Truncation would hide words, and switching to the compact bar by measurement would shift the header after hydration. Saved, the shortcut and the auth link keep `white-space: nowrap`.
- **D-11** *Should the bar render a Saved link on a workspace bar if one is passed?* No. `.topbar--workspace` hides `.topbar__saved` in the design system; the component does not render it and logs a dev-mode error, so a shell mistake is caught rather than shipped.
- **D-12** *Does the menu button render when there is nothing to collapse?* Yes, always; CSS shows it only below LG (below XL on a workspace bar). Rendering the same DOM at every width keeps server and browser output identical and the breakpoints in CSS.
- **D-13** *Where does the theme toggle go below LG?* Into the drawer, as the last [menu](menu.md) item with the same name and state; the bar hides `.topbar__theme` below LG. On a workspace bar from LG to XL, where the links are still in the drawer, the toggle shows in both places, as the design-system CSS does; both reflect the one theme.
