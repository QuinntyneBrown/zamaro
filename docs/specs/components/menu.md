# Menu

| Field | Value |
|---|---|
| Selector | `zm-menu` |
| Library path | `frontend/projects/components/src/lib/menu/` |
| Status | built |
| Traces to | L2-023, L2-024, L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`menu.html`](../../design-system/components/menu.html) |
| Source mocks | [`dialogs/menu/default`](../../mocks/dialogs/menu/default.html), [`dialogs/menu/artist`](../../mocks/dialogs/menu/artist.html), [`dialogs/menu/admin`](../../mocks/dialogs/menu/admin.html), [`dialogs/account-menu/default`](../../mocks/dialogs/account-menu/default.html), [`dialogs/account-menu/artist`](../../mocks/dialogs/account-menu/artist.html) |
| Rendering | [`menu.html`](menu.html) |

## Purpose and scope

The menu is the short list of places and actions behind a top-bar control: the
navigation drawer behind the menu button below LG ("Discover", "How booking
works", "For artists", then "Dark theme"), and the account menu behind Naomi's
"NF" avatar ("Your bookings", "Saved artists 3", "Account settings", then "Sign
out"). It is a plain list in Tab order (`.menu-list`): links, a few buttons and
separators, optionally headed by who is signed in (`.menu__who`).

`zm-menu` renders the list and the "who" header only. It always sits inside a
[dialog](dialog.md): the drawer (`.dialog--drawer`) or the anchored account
menu (`.dialog--menu`), both opened with the Angular CDK Dialog.

Use something else when:

- the links are the primary navigation at LG and up → [top bar](top-bar.md);
- the list chooses a form value (sort, a kind of gathering) → [select](select.md)
  or [radio group](radio-group.md);
- the list moves between sections of one settings page →
  [sidebar navigation](sidebar-navigation.md);
- the content has inputs or paragraphs → [dialog](dialog.md).

Out of scope:

- Opening, closing, focus trapping, Escape, the backdrop and focus return. The
  [dialog](dialog.md) and the CDK own them; the menu emits `chosen` so the
  opener can close it.
- The triggers. The top-bar menu button is a [button](button.md) with
  `expanded` and `controls`; the avatar is the [top bar](top-bar.md)'s.
- What an item does: signing out, toggling the theme and storing the choice
  belong to the page and its services. The menu reports which item was
  activated.
- The ARIA menu-button pattern (`role="menu"`, `menuitemradio`, arrow keys,
  type-ahead) that the design-system page shows for a sort menu and per-artist
  actions. No screen uses it (D-1).

## Usage

The mocks render the menu in five dialogs; every other screen reaches one of
them from the top bar. Each row is one distinct configuration; the API below
builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `dialogs/menu/default` (guest and booker drawer, below LG) | 3 links (one with no fragment, two with fragments `how`, `join`), separator, theme toggle | icons compass, help, mic, moon; "Discover", "How booking works", "For artists", "Dark theme" | current page on "Discover"; toggle pressed false/true | drawer, `--color-bg-surface-raised` |
| `dialogs/menu/artist` (artist drawer) | 5 links, separator, 1 link, separator, theme toggle | "Dashboard", "Requests" + count 3 "awaiting reply", "Availability", "Earnings", "Profile", "View public profile", "Dark theme" | current page on "Profile" (`/artist/profile`) | drawer |
| `dialogs/menu/admin` (administrator drawer) | 5 links with counts, separator, theme toggle | "Applications" 3 "waiting", "Artists", "Bookings" 1 "held", "Reviews" 2 "reported", "Audit log", "Dark theme" | current page on "Bookings", also on a booking under `/admin/bookings/…` | drawer |
| `dialogs/account-menu/default` (booker) | who header, 3 links, separator, action | "Naomi Fraser" / "Riverside Community Church" / "naomi.fraser@riversidecc.ca" (muted); "Your bookings", "Saved artists" + count 3, "Account settings", "Sign out" | first link focused on open | anchored account menu (`.dialog--menu`) |
| `dialogs/account-menu/artist` (artist) | who header, 3 links, separator, action | "Abigail Mensah" / "Artist · New Covenant Chapel, Brampton" / "3 requests awaiting reply" (muted); "Dashboard", "View public profile", "Account settings", "Sign out" | as above | anchored account menu |
| Every signed-in screen's avatar ("Account menu for Miriam Haile", "Tobi Adeyemi", "Priya Nair") | as the booker or artist account menu, with that person's name, role or church and note | who header + links + "Sign out" | as above | anchored account menu |
| Every screen below LG (the top-bar menu button) | the drawer row for the signed-in role | — | theme toggle reflects the current theme | drawer |
| Design system only | `role="menu"` panel with sections, shortcuts, checkable, danger and disabled items | — | — | out of scope (D-1) |

## Anatomy

1. **Who (optional)** — `.menu__who`: who is signed in. The name in `<strong>`
   (`--text-h4`, uppercase), then one detail line (church, or "Artist ·
   {church}, {city}"), then an optional muted note (the email, or "3 requests
   awaiting reply"). A `--border-width-thick` dashed rule below it.
2. **List** — `ul.menu-list[role="list"]`: one column, no bullets, no gaps.
3. **Link item** — `li > a.menu__item`: optional icon, label, optional count
   badge. The current page carries `aria-current="page"`.
4. **Button item** — `li > button.menu__item[type="button"]`: an action ("Sign
   out") or a toggle ("Dark theme", with `aria-pressed`).
5. **Icon** — a leading `zm-icon`, `aria-hidden="true"`, `currentColor`; filled
   when its toggle is pressed.
6. **Count (optional)** — a trailing [badge](badge.md) `badge--count` ("3"),
   with a visually hidden suffix (" waiting") that completes the name.
7. **Separator** — `li.menu__sep[aria-hidden="true"]`: a hairline between
   groups, never between single items.

Host: `zm-menu` is `display: block` and renders the who header and the list in
that order. It has no role, border or padding; the dialog it sits in provides
the panel.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `items` | `readonly MenuItem[]` | — | yes | Rendered in order. A separator never starts or ends the list. |
| `who` | `MenuWho \| null` | `null` | no | When set, renders `.menu__who` above the list. |
| `whoId` | `string` | `''` | when `who` is set | The `id` of `.menu__who`, which the account-menu dialog passes as its `ariaDescribedBy`. |
| `current` | `string \| null` | `null` | no | The `id` of the current link item, which the shell reads from route data, the same value it passes to the [top bar](top-bar.md)'s `current`. That item gets `aria-current="page"`; `null` marks nothing (D-7). |

```ts
export type MenuItem =
  | { kind: 'link'; id: string; label: string; icon?: IconName; link: string | unknown[]; fragment?: string;
      queryParams?: Record<string, string>; count?: number; countLabel?: string }
  | { kind: 'action'; id: string; label: string; icon?: IconName }
  | { kind: 'toggle'; id: string; label: string; icon?: IconName; pressed: boolean }
  | { kind: 'separator' };

export interface MenuWho {
  name: string;   // "Naomi Fraser"
  detail: string; // "Riverside Community Church"
  note?: string;  // "naomi.fraser@riversidecc.ca" (muted)
}
```

- `link` items render `routerLink` with `fragment` and `queryParams`. The
  link item whose `id` equals `current` gets `aria-current="page"`; no router
  matching is involved, so "Bookings" stays current on
  `/admin/bookings/ZAM-0114` and "Artists" on `/admin/vulnerable-sector-checks`
  because the route data says so. `id` values are the top bar's link ids
  ("discover", "requests", "artists").
- `count` renders the count badge after the label; `countLabel` (" waiting",
  " held", " awaiting reply") is its visually hidden suffix. `count` 0 or
  `undefined` renders no badge.
- `action` and `toggle` items render a `<button type="button">`. A toggle writes
  `aria-pressed` from `pressed`; an action writes no `aria-pressed`.
- Every string arrives through `label`, `countLabel` and `who` (L2-111). The
  menu has no copy of its own.

### Outputs

| Output | Payload | Fires when |
|---|---|---|
| `chosen` | `void` | A link item is followed (click or Enter). The opener closes the dialog. |
| `activated` | `string` (the item's `id`) | An action or toggle item is activated. For a toggle, the consumer flips `pressed`; the menu does not hold state. |

### Content slots

None. The menu builds every item from `items`, so the e2e page objects can rely
on one markup shape.

## Variants and sizes

| Variant | What decides it | Use for |
|---|---|---|
| Drawer list | `who` is `null` | The navigation drawer below LG: links, then the theme toggle. |
| Account menu | `who` is set | The avatar's anchored menu: who is signed in, links, then "Sign out". |

The menu has one size. Every item is `--target-comfortable` (44 px) tall and
fills the width of the dialog: `--layout-drawer-width` in the drawer (the full
width below it) and `--layout-menu-width` in the account menu.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Item text `--color-fg-default` on the dialog surface, no fill | Link or button named by its text |
| Hover | `:hover` | Fill `--color-accent-subtle`, text `--color-fg-default`; no underline | — |
| Focus | `:focus-visible` | Fill `--color-accent-subtle` plus an inset `--border-width-thick` rule in `--color-focus-ring`, drawn inside the item | — |
| Current page | `aria-current="page"` on the item whose `id` is `current` | `--font-weight-bold` and an inset `--border-width-poster` bar on the left in `--color-border-selected` | "current page" |
| Pressed toggle | `pressed: true` | As current page, and the icon is filled (`currentColor`) | `aria-pressed="true"`: "Dark theme, toggle button, pressed" |
| Unpressed toggle | `pressed: false` | Default | `aria-pressed="false"` |
| With count | `count > 0` | Yellow count badge after the label | Name ends with the count and its suffix: "Requests 3 awaiting reply" |
| Who header | `who` set | Name, detail and muted note above a dashed rule | Read in reading order; also the dialog's description |
| Inert | the dialog is closing | — | — |

The menu has no disabled, busy, loading or empty state. Every item it shows is
available; an item that would be unavailable is left out of `items` (D-5).

## Markup

Rendered by `zm-menu` in the drawer:

```html
<zm-menu>
  <ul class="menu-list" role="list">
    <li><a class="menu__item" href="/" aria-current="page"><zm-icon name="compass" aria-hidden="true">…</zm-icon>Discover</a></li>
    <li><a class="menu__item" href="/#how"><zm-icon name="help" aria-hidden="true">…</zm-icon>How booking works</a></li>
    <li><a class="menu__item" href="/#join"><zm-icon name="mic" aria-hidden="true">…</zm-icon>For artists</a></li>
    <li class="menu__sep" aria-hidden="true"></li>
    <li><button class="menu__item" type="button" aria-pressed="false"><zm-icon name="moon" aria-hidden="true">…</zm-icon>Dark theme</button></li>
  </ul>
</zm-menu>
```

A link with a count:

```html
<li><a class="menu__item" href="/admin/applications"><zm-icon …></zm-icon>Applications <zm-badge variant="count"><span class="badge badge--count">3<span class="visually-hidden"> waiting</span></span></zm-badge></a></li>
```

The account menu, with the who header and an action:

```html
<zm-menu>
  <div class="menu__who" id="account-who"><strong>Naomi Fraser</strong><span>Riverside Community Church</span><span class="text-muted">naomi.fraser@riversidecc.ca</span></div>
  <ul class="menu-list" role="list">
    <li><a class="menu__item" href="/bookings">…Your bookings</a></li>
    <li><a class="menu__item" href="/saved">…Saved artists <zm-badge variant="count"><span class="badge badge--count">3</span></zm-badge></a></li>
    <li><a class="menu__item" href="/account">…Account settings</a></li>
    <li class="menu__sep" aria-hidden="true"></li>
    <li><button class="menu__item" type="button">…Sign out</button></li>
  </ul>
</zm-menu>
```

Consumer templates (the dialogs):

```html
<!-- dialogs/menu: the drawer -->
<zm-dialog variant="drawer" [heading]="'common.menu.title' | transloco" [titleId]="titleId" …>
  <nav [attr.aria-label]="'common.menu.label' | transloco">
    <zm-menu [items]="items()" [current]="shell.current()" (chosen)="dialogRef.close()" (activated)="theme.toggle()" />
  </nav>
</zm-dialog>

<!-- dialogs/account-menu: a dialog anchored under the avatar (aria-haspopup="dialog", D-8) -->
<h2 class="dialog__title visually-hidden" [id]="titleId">{{ 'account.menu.title' | transloco: { name: who().name } }}</h2>
<zm-menu [who]="who()" whoId="account-who" [items]="items()" [current]="shell.current()" (chosen)="dialogRef.close()" (activated)="signOut($event)" />
```

```ts
items = computed<MenuItem[]>(() => [
  { kind: 'link', id: 'bookings', label: this.t('nav.bookings'), icon: 'ticket', link: '/bookings' },
  { kind: 'link', id: 'saved', label: this.t('nav.saved'), icon: 'heart', link: '/saved', count: this.saved.count() },
  { kind: 'link', id: 'account', label: this.t('nav.account'), icon: 'sliders', link: '/account' },
  { kind: 'separator' },
  { kind: 'action', id: 'sign-out', label: this.t('auth.signOut'), icon: 'sign-out' },
]);
```

The `.menu-list`, `.menu__item`, `.menu__sep` and `.menu__who` classes,
`aria-current` and `aria-pressed` are a contract: the e2e page objects find
items by role and name and check the current page by `aria-current`. The
`zm-icon` and `zm-badge` internals are free to change.

## Design

- List: `display: grid`, no gap, no padding, no bullets.
- Item: `display: flex`, `align-items: center`, gap `--space-3`, full width,
  `min-height: var(--target-comfortable)`, side padding `--space-3`, text
  `--text-body-sm`, left-aligned, no text decoration, no border, transparent
  background, `cursor: pointer`. The count badge sits right after the label.
- Focus rule: `box-shadow: inset 0 0 0 var(--border-width-thick)
  var(--color-focus-ring)`, with the outline removed only because this rule
  replaces it.
- Current page and pressed toggle: `--font-weight-bold`, `box-shadow: inset
  var(--border-width-poster) 0 0 var(--color-border-selected)`.
- Separator: zero height, `margin: var(--space-1) 0`, top border
  `--border-width-hairline` solid `--color-border-default`.
- Who header: `display: grid`, gap `--space-0-5`, padding `--space-3`,
  `margin-bottom: var(--space-2)`, bottom border `--border-width-thick` dashed
  `--color-border-strong`, text `--text-body-sm`; the name `--text-h4`,
  uppercase; the note `--color-fg-muted`.
- Icons `zm-icon` at the default size; the item's gap separates icon and label.
- No motion of its own: fills change instantly. The dialog animates in.
- Layer: none. The CDK overlay places the dialog at its own z-index.

The menu reads semantic tokens directly and declares no component tokens; the
design system defines none (`menu.html`, Theming).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Surface (from the dialog) | `--color-bg-surface-raised` | per theme | per theme |
| Item text, who name and detail | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Hover and focus fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Focus rule | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |
| Current and pressed bar | `--color-border-selected` | per theme | per theme |
| Who note | `--color-fg-muted` | per theme | per theme |
| Separator | `--color-border-default` | per theme | per theme |
| Who rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Count badge fill and text | `--color-accent` / `--color-fg-on-accent` | `--palette-signal-500` / `--palette-ink-750` | `--palette-signal-500` / `--palette-ink-750` |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface-raised` | 4.5:1 | Item label on the panel |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Item label on hover and focus |
| `--color-fg-muted` | `--color-bg-surface-raised` | 4.5:1 | Who note |
| `--color-focus-ring` | `--color-bg-surface-raised` | 3:1 | Focus rule |
| `--color-border-selected` | `--color-bg-surface` | 3:1 | Current-page and pressed bar |
| `--color-border-selected` | `--color-accent-subtle` | 3:1 | Bar on a hovered current item |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Count |

The current page and the pressed toggle never rely on colour alone: both are
bold and carry the bar, and the toggle's icon fills. Under forced colours the
focus rule and the bar are box shadows, which forced-colours mode removes, so
the item also keeps a transparent `outline` of `--border-width-thick` that
becomes visible as `Highlight` on focus, and the current item keeps its bold
weight.

## Responsive behaviour

- The menu's own layout does not change across breakpoints; the dialog's width
  does. The drawer is `min(100vw, --layout-drawer-width)` and full height; the
  account menu is `--layout-menu-width`, never wider than the viewport less two
  `--layout-margin`s, and hangs under the top bar's right edge (dialog CRD).
- The drawer exists only below LG (992 px), where the top bar collapses its
  links into the menu button (L2-099). From LG the same links and the theme
  toggle sit in the top bar, and the drawer is never opened.
- Labels wrap and never truncate. The item grows taller; the icon stays at the
  top of the first line's height because the item centres its content.
- At 320 px the drawer fills the width and no item, count or who line overflows.
  At 200 % zoom items grow and the dialog body scrolls; every item stays
  reachable.
- Every item is at least 44 px tall and full width, so it meets the target size
  on touch (L2-096).

## Accessibility

### Role and pattern

A list of links and buttons (`ul role="list"`, restoring list semantics that
`list-style: none` removes in Safari), not an ARIA `menu`: the items are few,
mostly navigation, and reached with Tab. In the drawer the list sits inside
`<nav aria-label="Main menu">`; in the account menu inside the dialog, which is
named "Account menu for Naomi Fraser". Separators are presentation only
(`aria-hidden="true"`).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the items in order. The dialog traps focus, so Tab wraps from "Dark theme" back to the dialog's close button. |
| <kbd>Enter</kbd> | Follows a link (fires `chosen`) or activates a button (fires `activated`). |
| <kbd>Space</kbd> | Activates a button item. Does nothing on a link. |
| <kbd>Esc</kbd> | Closes the dialog (dialog CRD); focus returns to the trigger. |

### Focus

The dialog decides the first focus: the drawer's close button, or the account
menu's first item ("Your bookings"). The menu never moves focus itself.
Activating a toggle keeps focus on it, so "Dark theme" can be pressed again.
The focus rule is drawn inset, so the dialog's edge never clips it.

### Labelling

- Each item is named by its text. A count adds its number and suffix:
  "Applications 3 waiting", "Requests 3 awaiting reply". In the account menu
  "Saved artists 3" has no suffix, because the label already says what is
  counted.
- The theme toggle has a fixed name, "Dark theme", and exposes its state with
  `aria-pressed` (WCAG 4.1.2).
- The current page is announced with `aria-current="page"`, not by colour.
- `.menu__who` is plain text in reading order and is the account-menu dialog's
  description (`whoId`), so opening it reads "Account menu for Naomi Fraser,
  Naomi Fraser, Riverside Community Church, naomi.fraser@riversidecc.ca".
- Icons are `aria-hidden`.

### Announcements

None. Theme changes and signing out are visible results; the page announces
anything else it needs through its own status region.

### Motion

The menu does not animate. The dialog's entrance obeys
`prefers-reduced-motion` (dialog CRD).

## Content and internationalisation

- Destinations are nouns ("Your bookings", "Saved artists", "Availability");
  actions start with a verb ("Sign out"). Sentence case, one to three words.
- "Sign out" is an ordinary item, not a danger item: nothing is lost.
- The toggle is named after the state it turns on: "Dark theme".
- Count suffixes complete a sentence after the number: " waiting", " held",
  " reported", " awaiting reply". They start with a space.
- Who header: the person's name as on the account; detail is the church name,
  or "Artist · {church}, {city}" for artists, or "Administrator" for
  administrators; the note is the account email, or the artist's waiting
  requests ("3 requests awaiting reply").
- Counts are integers formatted by the API library's format service (L2-110);
  names, churches and emails come from data. Every other string comes from the
  translation catalogue through the consumer (L2-111). French labels run about
  30 % longer and wrap within the item.

## Performance

- Change detection: `OnPush`, signal inputs, no `effect`, no subscriptions.
  The menu does not track the router; `current` arrives as an input.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Menu.ts`
  renders the guest drawer ("Discover", "How booking works", "For artists",
  separator, "Dark theme"). Add `MenuAccount.ts`, which renders Naomi Fraser's
  account menu (who header, "Your bookings", "Saved artists" with count 3,
  "Account settings", separator, "Sign out"), and export it from
  `scenarios/index.ts`. Tune both in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios that include it: `DarkTheme` when it renders the drawer.
- Layout stability: the menu renders inside a dialog that opens on demand, so it
  causes no layout shift on the page (L2-086). The count badge reserves its
  width when the count is first known; the consumer passes the count already
  loaded with the session.
- Imports: `RouterLink`, `RouterLinkActive`, `zm-icon`, `zm-badge`. No CDK
  import; the dialog brings the CDK.

## Acceptance criteria

### Rendering

- **AC-1** Given a guest below LG who opens the menu button, when the drawer renders, then it lists "Discover", "How booking works" and "For artists" as links in a `ul.menu-list[role="list"]`, then a separator, then a "Dark theme" button. (L2-099)
- **AC-2** Given the drawer on Discover (`/`) with `current` "discover", when it renders, then "Discover" has `aria-current="page"` and "How booking works" (`/#how`) and "For artists" (`/#join`) do not. (L2-102)
- **AC-3** Given the administrator drawer with `current` "bookings" on `/admin/bookings/ZAM-0114`, or `current` "artists" on `/admin/vulnerable-sector-checks`, when it renders, then exactly that item has `aria-current="page"` and is bold with the `--color-border-selected` bar, and no other item is marked. (L2-102)
- **AC-4** Given an item with `count` 3 and `countLabel` " waiting", when it renders, then the link shows the label followed by a `badge--count` reading "3", and its accessible name is "Applications 3 waiting". (L2-102)
- **AC-5** Given Naomi Fraser signed in, when the account menu renders with `who` { "Naomi Fraser", "Riverside Community Church", "naomi.fraser@riversidecc.ca" }, then `.menu__who` shows her name uppercase, her church, and the muted email above a dashed rule. (L2-024)
- **AC-6** Given the account menu with `whoId` "account-who", when the dialog opens with `ariaDescribedBy` "account-who", then `.menu__who` has that `id` and the dialog's description is her name, church and email. (L2-024)
- **AC-7** Given the account menu, when "Sign out" is activated, then `activated` emits "sign-out" once and `chosen` does not fire. (L2-023)
- **AC-8** Given a link item, when it is followed with a click or Enter, then `chosen` fires once and the router navigates without a full page load. (L2-099)
- **AC-9** Given separators in `items`, when the list renders, then each is an `li.menu__sep` with `aria-hidden="true"` and a `--color-border-default` hairline. (L2-102)

### States

- **AC-10** Given the theme toggle with `pressed` false, when it is activated, then `activated` emits "theme", and when the consumer passes `pressed` true, then the button has `aria-pressed="true"`, is bold, shows the bar and a filled moon icon. (L2-104)
- **AC-11** Given a pointer over an item, when it hovers, then the item fills with `--color-accent-subtle` and its text stays `--color-fg-default`. (L2-103)

### Keyboard and focus

- **AC-12** Given the drawer is open, when the person presses Tab repeatedly, then focus moves through every item in order and never reaches a separator. (L2-101)
- **AC-13** Given keyboard focus on an item, when it is focused, then it shows the `--color-accent-subtle` fill and an inset `--border-width-thick` rule in `--color-focus-ring` that the dialog's edge does not clip. (L2-101)
- **AC-14** Given focus on "Dark theme", when Space or Enter is pressed, then `activated` fires and focus stays on the toggle. (L2-101)
- **AC-15** Given focus on a link item, when Space is pressed, then nothing is followed and `chosen` does not fire. (L2-101)

### Screen readers

- **AC-16** Given the theme toggle, when it is read by a screen reader, then it is announced as "Dark theme, toggle button, not pressed" and its name does not change when pressed. (L2-102)
- **AC-17** Given the drawer and the account menu in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-18** Given the dark theme, when the drawer renders, then items are `--color-fg-default` on `--color-bg-surface-raised`, the hover fill is `--color-accent-subtle` and the focus rule is `--color-focus-ring`. (L2-104)
- **AC-19** Given both themes, when contrast is measured, then item labels on the panel and on the hover fill and the who note are at least 4.5:1, and the focus rule and current-page bar are at least 3:1. (L2-103)

### Responsive

- **AC-20** Given a 320 px viewport, when the artist drawer renders "Requests 3 awaiting reply" and "View public profile", then no item or badge overflows the drawer and the page does not scroll horizontally. (L2-096)
- **AC-21** Given a touch device, when each item is measured, then its target is at least 44 × 44 CSS px. (L2-096)
- **AC-22** Given the French catalogue with labels about 30 % longer, when the account menu renders at 360 px, then long labels wrap inside their items and nothing is clipped. (L2-111)
- **AC-23** Given the translation catalogue, when the menu renders, then every label, count suffix and who line comes from `items` and `who`, and the component contains no user-facing string of its own. (L2-111)

### Performance

- **AC-24** Given the `Menu` and `MenuAccount` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-menu` with `link`, `toggle` and `separator` items and the
`chosen` and `toggled` outputs. To meet this CRD:

- Add the `action` item kind, rendered as a `<button type="button">` without
  `aria-pressed`.
- Rename the `toggled` output to `activated` and emit it for action and toggle
  items. Update `dialogs/menu/menu.ts` to `(activated)="theme.toggle()"`.
- Make `icon` optional on every item kind.
- Add `id`, `queryParams`, `count` and `countLabel` to link items, add the
  `current` input, and replace `routerLinkActive` with
  `[attr.aria-current]="item.id === current() ? 'page' : null"` (D-7). Render the count with `zm-badge variant="count"` and a
  `.visually-hidden` suffix; the [badge](badge.md) needs its `count` variant.
- Add the `who` and `whoId` inputs and render `.menu__who` (`<strong>`, detail
  `<span>`, note `<span class="text-muted">`) with its styles above the list.
- `track` items by `kind` plus `link` or `id` rather than `$index`, so
  re-ordering a role's items does not re-create the rest.
- Add the forced-colours outline (transparent `outline` that becomes visible on
  focus) and keep `outline: none` only alongside the inset rule.
- The icon set needs the drawer and account icons (grid, inbox, calendar, user,
  wallet, document, people, ticket, flag, list, heart, sliders, sign-out, eye);
  add them through the [icon](icon.md) CRD's `IconName`.
- Add the `MenuAccount.ts` perf-test scenario and export it.

## Decisions

- **D-1** *The design-system page documents an ARIA menu button (`role="menu"`, checkable items, sections, shortcuts, danger and disabled items, arrow keys, type-ahead). Does `zm-menu` build it?* No. No mock or L2 requirement uses it: the design system's own Sources note that the account menu and drawer are now mocked as a plain list in a dialog, and the sort and per-artist menus "are still not in the mocks". The list and the ARIA menu have different roles and keyboard models, so a future ARIA menu would be its own component, not a change to `zm-menu`'s API.
- **D-2** *Does `zm-menu` render the `.menu` panel?* No. In both mocks the list sits directly in a dialog (`.dialog--drawer` body or `.dialog--menu`), which supplies the surface, rule and shadow. The `.menu` panel belongs to the ARIA menu (D-1).
- **D-3** *Is the who header part of the menu or of the dialog?* The menu. Its class is `.menu__who` in the menu block, it sits in the same list column, and L2-024 makes "the account menu lists their name and church name" a menu requirement. `whoId` lets the dialog use it as its description, as the mock's `aria-describedby` does.
- **D-4** *How do counts read for a screen reader?* As one name with a visually hidden suffix ("Applications 3 waiting"), as in `dialogs/menu/admin` and `artist`. The suffix is optional because the account menu's "Saved artists 3" already says what is counted.
- **D-5** *Should items have a disabled state?* No. No mock shows one, and the menu lists only places the person can go. An item that does not apply to a role is left out of that role's `items`.
- **D-6** *One output for buttons or one per kind?* One `activated` with the item's `id`, plus `chosen` for links. "Sign out" and "Dark theme" are both buttons the consumer acts on; a single output keeps the API the same when an action is added, and `chosen` stays the opener's signal to close.
- **D-7** *How is the current item decided?* By an explicit `current` id that the shell reads from route data, not by `routerLinkActive`, the same rule as the [top bar](top-bar.md)'s D-3. Router matching cannot mark "Artists" on `/admin/vulnerable-sector-checks` or keep "Discover" current on `/#how`, and the drawer must mark the same item as the top bar it stands in for below LG. The shell passes one value to both.
- **D-8** *How does the account menu relate to the avatar that opens it?* The avatar declares `aria-haspopup="dialog"` ([top bar](top-bar.md) D-4, [avatar](avatar.md) D-3), and the account menu is a [dialog](dialog.md) holding this list. `zm-menu` therefore never takes `role="menu"` or arrow-key handling (D-1); it is the list inside the dialog, reached with Tab.
