# Avatar

| Field | Value |
|---|---|
| Selector | `zm-avatar`, `zm-avatar-button`, `zm-avatar-group` |
| Library path | `frontend/projects/components/src/lib/avatar/` |
| Status | planned |
| Traces to | L2-024, L2-086, L2-088, L2-096, L2-099, L2-100, L2-101, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`avatar.html`](../../design-system/components/avatar.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`dialogs/account-menu/default`](../../mocks/dialogs/account-menu/default.html), [`dialogs/account-menu/artist`](../../mocks/dialogs/account-menu/artist.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/empty`](../../mocks/pages/dashboard/empty.html), [`pages/admin-applications/default`](../../mocks/pages/admin-applications/default.html), [`pages/earnings/setup`](../../mocks/pages/earnings/setup.html), and every signed-in screen (see Usage) |
| Rendering | [`avatar.html`](avatar.html) |

## Purpose and scope

An avatar is a round yellow token with someone's initials, photo or an icon. It
helps people recognise a person, an act or a church next to its name. In the top
bar it is Naomi's "NF" button that opens her account menu; everywhere else it is
a picture beside a name, never the only place the name appears.

The family has three components that share one look:

- `zm-avatar` renders a picture: a `<span class="avatar">`, hidden from
  assistive technology beside a name, or a named image when it stands alone.
- `zm-avatar-button` renders a native `<button class="avatar">` that opens the
  account menu. It is the only interactive avatar.
- `zm-avatar-group` renders up to three avatars and an ink "+4" overflow disc as
  one named image.

Use something else when:

- it is an artist's portrait on a profile, ticket or headliner →
  [artwork](artwork.md);
- the person is not known yet (loading) → the avatar's own `loading` state,
  which draws a [skeleton](skeleton.md) circle;
- it is a count without faces ("3" saved) → [badge](badge.md).

Out of scope:

- The account menu itself (`.dialog--menu`): the [dialog](dialog.md) and the
  [top bar](top-bar.md) own it. The avatar button only reflects `expanded` and
  names the menu it controls.
- The row layout around a picture avatar ([list](list.md), review byline,
  message header). The parent owns spacing and the name beside it.
- Presence data. The page decides whether someone is online; the avatar only
  draws the dot it is given.
- Image processing (crops, widths, formats). The media pipeline (L2-051, L2-088)
  provides the URLs.

## Usage

The mocks render 322 avatars across 69 screens, all of them the top-bar account
button. The design system adds the picture, image, icon, group and status uses
that lists, reviews and messages need; they are specified here so those screens
never change the API.

| Where | Configuration | Content | States seen | Surface |
|---|---|---|---|---|
| Top bar, booker screens (144 screens: Discover, profile, bookings, saved, account, dialogs over them) | `zm-avatar-button`, md, person | "NF", name "Account menu for Naomi Fraser" | default, hover, focus, expanded false; expanded true in `dialogs/account-menu/default` | top bar (stage) |
| Workspace top bar, artist screens (103: dashboard, requests, availability, edit profile, earnings…) | `zm-avatar-button`, md, person | "AM", "Account menu for Abigail Mensah" | expanded false/true (`dialogs/account-menu/artist`) | workspace top bar (stage) |
| Artist empty states (`pages/dashboard/empty`, `requests/empty`, `availability/empty`, `edit-profile/empty`, `earnings/empty`, `artist-reviews/empty`, `profile-preview/empty`) | `zm-avatar-button`, md, person | "MH", "Account menu for Miriam Haile" | default | workspace top bar |
| `pages/earnings/setup` | `zm-avatar-button`, md, person | "TA", "Account menu for Tobi Adeyemi" | default | workspace top bar |
| Admin screens (65: applications, artists, bookings, checks, reviews, audit and their dialogs) | `zm-avatar-button`, md, person | "PN", "Account menu for Priya Nair" | default | workspace top bar |
| Top bar before the session is known | `zm-avatar-button` with `loading` | skeleton circle | loading | top bar |
| Design system: list rows (`patterns/data-tables-and-lists`, saved artists in a menu-sized list) | `zm-avatar`, md, person or group, beside the name | "AM", "HC", "LV" | default | surface |
| Design system: review byline, account-menu header | `zm-avatar`, lg | "NF" | default | surface, dialog |
| Design system: an uploaded photo | `zm-avatar` with `photo`, beside the name (`alt=""`) or standalone (`alt` = name) | Abigail Mensah's photo | default, image failed → initials | surface |
| Design system: new artist without a photo | `zm-avatar` with `icon="mic"`, standalone | "Miriam Haile, no photo yet" | default | surface |
| Design system: message header | `zm-avatar` with `status="online"` | "AM" + "Online now" dot | online, no dot | surface |
| Design system: a church as the party on a request | `zm-avatar`, group | "RC" for Riverside Community Church | default | surface |
| Design system: who is free | `zm-avatar-group`, md or sm, max 3 | AM, HC, EP, "+4"; "7 artists free Sat 14 Nov: Abigail Mensah, Hosanna Collective, Elijah Park and 4 more" | default; max 2 on a tight phone row | canvas, surface |
| Any screen behind an open dialog | `zm-avatar-button` | as above | inert | top bar |

Every row is buildable with the API below.

## Anatomy

1. **Disc** — `.avatar`. A full circle (`--radius-full`) at `--avatar-size`:
   2 rem, 2.5 rem or 3.5 rem. `--color-accent` fill, or the inverse pair with
   `.avatar--ink`.
2. **Outline** — `--border-width-thick` in `--color-border-on-accent` (ink
   variant: `--color-bg-inverse`), the edge that keeps yellow from melting into
   paper.
3. **Content** — one of: two initials in `--text-stub`, bold, uppercase; an
   `<img>` that covers the disc; or a `zm-icon` at 55 % (`.avatar--icon`).
4. **Status dot (optional)** — `.avatar__status` inside `.avatar-wrap`, 0.75 rem,
   `--color-success-solid`, bottom right, with a `--border-width-thick` ring in
   `--color-bg-surface`.
5. **Hit area (button only)** — a transparent `::before` that extends the
   button's target to `--target-comfortable` around the 40 px disc.
6. **Group** — `.avatar-group`: avatars overlapping by `--space-2` (`--space-1` at small), each ringed
   in `--color-bg-surface`, then an ink overflow disc "+4".

Host: `zm-avatar` is `display: inline-flex; flex: none` and renders one
`<span class="avatar">`, or `<span class="avatar-wrap">` holding the disc and
the dot. `zm-avatar-button` is `display: inline-flex; flex: none` and renders one
native `<button class="avatar">`. `zm-avatar-group` renders one
`<span class="avatar-group" role="img">` containing `zm-avatar` hosts. Classes a
parent puts on a host stay on the host.

## API

### `zm-avatar` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `name` | `string` | `''` | yes, unless `initials` is set | The person's, act's or church's name as written: "Naomi Fraser", "Daniel & Ruth Okonkwo". Source of the initials and of the standalone name. |
| `kind` | `'person' \| 'group'` | `'person'` | no | `person`: one human, including a solo artist. `group`: a band, duo, choir or church. `group` adds `.avatar--ink` and changes the initials rule. |
| `initials` | `string \| undefined` | `undefined` | no | Overrides the derived initials ("+4" for an overflow disc). At most three characters are shown. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.avatar--sm` (32 px) or `.avatar--lg` (56 px). Medium adds no modifier. |
| `photo` | `{ src: string; srcset: string } \| null` | `null` | no | The person's own photo. Renders an `<img>` with `width` and `height` from the size, `loading="lazy"`, `decoding="async"`. If it fails to load, the initials show instead. |
| `icon` | `IconName \| null` | `null` | no | Renders that `zm-icon` at 55 % with `.avatar--icon`, used when there is no photo to show yet (`mic`). A loaded photo wins over the icon; the icon wins over initials. |
| `standalone` | `boolean` (attribute) | `false` | no | `false`: the disc is `aria-hidden="true"` (the name is beside it) and an image has `alt=""`. `true`: the disc is `role="img"` named by `label`, or the image's `alt` is `label`. |
| `label` | `string` | `name` | no | The standalone accessible name: "Abigail Mensah", "Miriam Haile, no photo yet". Ignored unless `standalone`. |
| `status` | `'online' \| null` | `null` | no | Adds the status dot and the `.avatar-wrap`. |
| `statusLabel` | `string` | `''` | with `status` | The dot's name, "Online now". The same status must also appear in text beside the avatar. |
| `loading` | `boolean` | `false` | no | Renders the skeleton circle at the avatar's size instead of the disc, `aria-hidden="true"`. |

### `zm-avatar-button` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `name` | `string` | — | yes | "Naomi Fraser". Source of the initials. |
| `kind` | `'person' \| 'group'` | `'person'` | no | As for `zm-avatar`. |
| `initials` | `string \| undefined` | `undefined` | no | As for `zm-avatar`. |
| `photo` | `{ src: string; srcset: string } \| null` | `null` | no | As for `zm-avatar`; the image is decorative (`alt=""`) because the button has its own name. |
| `label` | `string` | — | yes | `aria-label`: "Account menu for Naomi Fraser". Initials are never the name. |
| `expanded` | `boolean` | `false` | no | `aria-expanded`. |
| `controls` | `string` | — | no | `aria-controls`: the account menu's ID. |
| `loading` | `boolean` | `false` | no | Renders the skeleton circle (a `<span>`, not a button) until the person is known. |

The button is always medium (40 px) and always has `type="button"` and
`aria-haspopup="dialog"` (D-3).

### `zm-avatar-group` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `members` | `{ name: string; kind?: 'person' \| 'group'; initials?: string; photo?: { src: string; srcset: string } \| null }[]` | — | yes | In display order. Only the first `max` are drawn. |
| `total` | `number` | `members.length` | no | The real count. When it exceeds `max`, an ink disc reads "+{total − max}". |
| `max` | `2 \| 3` | `3` | no | Faces shown before the overflow disc. |
| `size` | `'sm' \| 'md'` | `'md'` | no | Size of every disc. |
| `label` | `string` | — | yes | The group's accessible name, listing who is shown and how many more: "7 artists free Sat 14 Nov: Abigail Mensah, Hosanna Collective, Elijah Park and 4 more". The consumer updates it when `max` changes. |

### Initials

Derived by the exported pure function `avatarInitials(name: string, kind:
'person' | 'group'): string`, which the components use when `initials` is not
set. Words are split on spaces; "&", punctuation-only words and the article
"The" are skipped; each letter is the word's first grapheme, upper-cased with
the `en-CA` locale.

| Kind | Rule | Examples |
|---|---|---|
| `person` | First letter of the first word and of the last word | Naomi Fraser → "NF", Abigail Mensah → "AM", Priya Nair → "PN", Miriam Haile → "MH", Tobi Adeyemi → "TA" |
| `group` | First letters of the first two words | Hosanna Collective → "HC", Marcus Bell Trio → "MB", Daniel & Ruth Okonkwo → "DR", Grace Tabernacle Mass Choir → "GT", Riverside Community Church → "RC", St. Brendan's Anglican → "SB" |
| either, one word | Its first letter | Luz → "L" |

### Outputs

None. Consumers listen to the native `click` on `zm-avatar-button`
(`(click)="toggleAccountMenu()"`), as with [`zm-button`](button.md). Picture
avatars and groups are not interactive.

### Content slots

None. Every part comes from inputs, so no slot is repeated across the
photo / icon / initials branches.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Initials (yellow) | — | A person: the signed-in user, a booker, a solo artist. The default. |
| Ink | `.avatar--ink` | A group act or a church ("HC", "RC"), and the overflow count. Set by `kind: 'group'`. |
| Image | `.avatar > img` | A person who uploaded a photo. |
| Icon | `.avatar--icon` | No photo and nothing better to show yet (the mic for a new artist). |
| With status | `.avatar-wrap` + `.avatar__status` | Online now, in messages. Offline has no dot. |
| Group | `.avatar-group` | Several people or acts at once, at most three faces. |

| Size | Modifier | Disc | Initials | Use for |
|---|---|---|---|---|
| Small | `.avatar--sm` | 2 rem (32 px) | `--font-size-xs` | Dense rows and groups. Never a button. |
| Medium | — | 2.5 rem (40 px) | `--text-stub` size | Top bar, list rows. The button's only size. |
| Large | `.avatar--lg` | 3.5 rem (56 px) | `--font-size-md` | Review byline, account-menu header. |

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Disc, outline and content | Button: "Account menu for Naomi Fraser, button, collapsed". Picture: hidden, or a named image when standalone |
| Hover (button) | `:hover` | Disc scales to 1.06 over `--duration-fast` with `--ease-spring` | — |
| Focus (button) | `:focus-visible` | Two-tone ring: `--focus-ring-width` outline in `--color-focus-ring` at `--focus-ring-offset` with a `--color-focus-ring-offset` gap; in the top bar the outline is `--color-accent-on-stage` with a `--color-bg-stage` gap | — |
| Expanded (button) | `expanded = true` | No change to the disc; the ring stays while focus is near | `aria-expanded="true"` |
| Image | `photo` set and loaded | The photo covers the disc inside the outline | Decorative (`alt=""`) or named (`alt` = `label`) |
| Image failed | the `<img>` fires `error` | Initials on the same disc; no broken-image icon | Unchanged |
| Icon | `icon` set, no loaded photo | Mic at 55 % on yellow | Standalone name, for example "Miriam Haile, no photo yet" |
| Online | `status = 'online'` | Green dot bottom right, ringed in the surface | Dot is `role="img"` "Online now" |
| Loading | `loading = true` | Skeleton circle at the same size; no outline, no initials | `aria-hidden="true"`; the region is `aria-busy` (page) |
| Inert | an open dialog makes the top bar `inert` | No hover response | Not reachable |

Surfaces:

| Surface ancestor | Effect |
|---|---|
| `.topbar`, `.on-stage` | Disc and initials unchanged; focus ring `--color-accent-on-stage` |
| `.avatar-group` | Each disc ringed with `--color-bg-surface` and overlapped by `--space-2` |

## Markup

Rendered by `zm-avatar-button` in the top bar:

```html
<zm-avatar-button>
  <button class="avatar" type="button" aria-label="Account menu for Naomi Fraser" aria-haspopup="dialog" aria-expanded="false" aria-controls="account-menu">NF</button>
</zm-avatar-button>
```

Rendered by `zm-avatar`, beside a name, as an act, with a photo:

```html
<zm-avatar><span class="avatar" aria-hidden="true">NF</span></zm-avatar>
<zm-avatar><span class="avatar avatar--ink" aria-hidden="true">HC</span></zm-avatar>
<zm-avatar><span class="avatar" aria-hidden="true"><img src="…/abigail-mensah-40.webp" srcset="…/abigail-mensah-40.webp 1x, …/abigail-mensah-80.webp 2x" width="40" height="40" loading="lazy" decoding="async" alt=""></span></zm-avatar>
```

Standalone (image and icon):

```html
<span class="avatar avatar--lg"><img src="…/abigail-mensah-56.webp" srcset="…" width="56" height="56" loading="lazy" decoding="async" alt="Abigail Mensah"></span>
<span class="avatar avatar--icon" role="img" aria-label="Miriam Haile, no photo yet"><zm-icon name="mic" aria-hidden="true">…</zm-icon></span>
```

With a status dot:

```html
<span class="avatar-wrap">
  <span class="avatar" aria-hidden="true">AM</span>
  <span class="avatar__status" role="img" aria-label="Online now"></span>
</span>
```

Loading:

```html
<span class="skeleton skeleton--circle avatar-skeleton" aria-hidden="true"></span>
```

Rendered by `zm-avatar-group`:

```html
<span class="avatar-group" role="img" aria-label="7 artists free Sat 14 Nov: Abigail Mensah, Hosanna Collective, Elijah Park and 4 more">
  <zm-avatar><span class="avatar" aria-hidden="true">AM</span></zm-avatar>
  <zm-avatar><span class="avatar avatar--ink" aria-hidden="true">HC</span></zm-avatar>
  <zm-avatar><span class="avatar" aria-hidden="true">EP</span></zm-avatar>
  <zm-avatar><span class="avatar avatar--ink" aria-hidden="true">+4</span></zm-avatar>
</span>
```

Size modifiers add only `.avatar--sm` or `.avatar--lg`; the structure is the
same.

Consumer templates:

```html
<zm-avatar-button [name]="user().name" [label]="'shell.account.open' | transloco: { name: user().name }" [expanded]="accountOpen()" controls="account-menu" [loading]="!user()" (click)="toggleAccount()" />
<zm-avatar [name]="artist.name" [kind]="artist.isGroup ? 'group' : 'person'" [photo]="artist.avatar" />
<zm-avatar name="Miriam Haile" icon="mic" standalone [label]="'avatar.noPhoto' | transloco: { name: 'Miriam Haile' }" />
<zm-avatar-group [members]="free().slice(0, 3)" [total]="free().length" [label]="freeLabel()" />
```

The `.avatar*` classes and the button's ARIA attributes are a contract: e2e
page objects find the account button by its role and name, and read the
initials and modifiers by class. The `zm-icon` internals are free to change.

## Design

- Disc `--avatar-size` (2.5 rem; `.avatar--sm` 2 rem; `.avatar--lg` 3.5 rem),
  `--radius-full`, content centred (`inline-grid; place-items: center`),
  `flex: none`, padding 0.
- Initials `--text-stub` with `--font-weight-bold`, `line-height: 1`,
  uppercase; small `--font-size-xs`, large `--font-size-md`.
- Outline `--border-width-thick` solid `--color-border-on-accent`; ink variant
  `--color-bg-inverse`.
- Image: `width: 100%; height: 100%; object-fit: cover; border-radius:
  var(--radius-full)`, so the disc does not need `overflow: hidden` (the button's
  hit area sits outside it).
- Icon: `.avatar--icon .icon` at 55 % of the disc.
- Status dot: 0.75 rem, `--radius-full`, `--color-success-solid`, ring
  `--border-width-thick` in `--color-bg-surface`, at the bottom-right corner of
  `.avatar-wrap` (`position: relative; display: inline-block`).
- Group: `display: inline-flex`; every disc after the first overlaps by
  `--space-2` at medium and `--space-1` at small (negative start margin) and has a `--border-width-thick`
  `--color-bg-surface` ring (box shadow).
- Button: `cursor: pointer`, `position: relative`; hover `transform:
  scale(1.06)` with `--duration-fast` and `--ease-spring`. Its `::before` hit
  area is a `--target-comfortable` circle centred on the disc.
- Skeleton: the [skeleton](skeleton.md) circle shape, with `.avatar-skeleton`
  setting width and height to the avatar's `--avatar-size` for small and large.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--avatar-size` | 2.5 rem | `.avatar--sm` (2 rem), `.avatar--lg` (3.5 rem) |
| `--zm-avatar-ring` | `transparent` | `zm-avatar-group` → `--color-bg-surface` |

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Disc | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Initials | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Outline | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Ink disc and outline | `--color-bg-inverse` | `--palette-ink-750` | `--palette-ink-100` |
| Ink initials | `--color-fg-inverse` | `--palette-paper` | `--palette-ink-750` |
| Status dot | `--color-success-solid` | `--palette-green-700` | `--palette-green-300` |
| Group and dot ring | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |
| Focus ring in the top bar | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Initials on yellow |
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Ink initials |
| `--color-border-on-accent` | `--color-bg-surface` | 3:1 | Outline on paper (light theme) |
| `--color-accent` | `--color-bg-surface` | 3:1 | Disc edge on the surface (dark theme, where the ink outline sinks into the charcoal) |
| `--color-accent` | `--color-bg-stage` | 3:1 | Disc against the top bar |
| `--color-success-solid` | `--color-bg-surface` | 3:1 | Status dot |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring on the page |
| `--color-accent-on-stage` | `--color-bg-stage` | 3:1 | Focus ring in the top bar |

Under forced colours the disc keeps a `CanvasText` outline (tokens), so it
stays a visible circle; initials follow `CanvasText`, and the status dot is
backed by text.

## Responsive behaviour

- Avatars never scale with the viewport and never shrink in a flex row
  (`flex: none`).
- At XS and SM the account button stays visible beside the menu button and the
  Saved heart (L2-099), at 40 px, from 320 px up.
- The button's target is at least 44 × 44 CSS px on touch devices through its
  `::before` hit area; the disc stays 40 px (L2-096). Small avatars are never
  buttons.
- Groups show at most three faces plus a count at every width; on a tight phone
  row the consumer sets `max` to 2 and updates `label`.
- At 200 % zoom the disc and initials grow together (rem sizes); initials never
  overflow the disc.

## Accessibility

### Role and pattern

`zm-avatar-button` is a native `<button>` that opens the account menu, a
`.dialog--menu` dialog with a plain link list, so it declares
`aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`
([APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
semantics for the trigger). Picture avatars are `aria-hidden` beside a name, or
`role="img"` (or an `<img>` with `alt`) when they stand alone. A group is one
`role="img"`.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Reaches the account button in DOM order; picture avatars and groups are skipped. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates the button (`click`); the top bar opens the menu, which moves focus to its first item. |
| <kbd>Esc</kbd> | Handled by the menu dialog: it closes and focus returns to the avatar button. |

### Focus

The shared two-tone ring follows the circle's bounding box on `:focus-visible`
only; in the top bar it is `--color-accent-on-stage` with a `--color-bg-stage`
gap, so it stays apart from the yellow disc. The ring is never clipped (no
`overflow: hidden` on the button) and never hidden under the sticky top bar.

### Labelling

- The button's name says what it does and whose it is: "Account menu for Naomi
  Fraser". Initials are never the accessible name.
- Images beside a name use `alt=""`; standalone images use the name as `alt`
  ("Abigail Mensah", the name, not a description of the photo).
- The status dot is `role="img"` named "Online now", and the same status is in
  text beside the avatar; colour is never the only signal.
- A group's name lists who is shown and how many more.

### Announcements

None. A change of `expanded` is exposed through `aria-expanded`.

### Motion

The hover grow takes `--duration-fast` with `--ease-spring`. Under
`prefers-reduced-motion: reduce` the duration drops to near zero, so the disc is
simply larger while hovered.

## Content and internationalisation

- Two initials: first and last name for a person ("NF"), the first two words for
  a group act or church ("HC", "MB", "DR" for Daniel & Ruth Okonkwo).
- Overflow counts are "+4", never "4+" or "and 4 more" inside the disc.
- Images are the person's own photo, cropped to the face; never stock photos.
- Translatable inputs: `label` ("Account menu for {name}"), `statusLabel`
  ("Online now"), the standalone `label` ("{name}, no photo yet") and the group
  `label` ("{count} artists free {short date}: {names} and {n} more"), all from
  the catalogue through the consumer (L2-111). Data values: `name`, `photo`,
  member names. Dates in labels use the short form "Sat 14 Nov" (L2-110).
- Names are shown as written, so accented initials keep their accent
  ("Élise Roy" → "ÉR").

## Performance

- Change detection: `OnPush`, signal inputs. Initials, classes and the content
  choice are `computed`; the only state is a `photoFailed` signal set by the
  image's `error` event. No subscriptions, no `effect`.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Avatar.ts`
  renders Abigail Mensah's "AM" picture avatar (md, person) beside her name;
  `AvatarButton.ts` renders Naomi Fraser's top-bar button "NF" ("Account menu
  for Naomi Fraser", collapsed) inside a `.topbar`; `AvatarGroup.ts` renders
  "7 artists free Sat 14 Nov" (AM, HC, EP, +4). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly 100–300 ms.
- Composite scenarios that include it: `TopBar`, `DarkTheme`.
- Layout stability: the skeleton circle has the avatar's exact size, so the swap
  shifts nothing (L2-105); photos have explicit `width` and `height`.
- Images: `srcset` with 1x and 2x WebP or AVIF from the CDN, lazy-loaded
  (L2-088). The account button's image is decorative and small, so it stays
  lazy too; it never delays the top bar's first paint because the initials show
  until it loads.
- Imports: `zm-icon` and the skeleton styles. Nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given Naomi Fraser is signed in with Riverside Community Church, when the top bar renders `<zm-avatar-button name="Naomi Fraser" label="Account menu for Naomi Fraser" controls="account-menu">`, then the host contains one `<button type="button" class="avatar">` reading "NF" with `aria-label="Account menu for Naomi Fraser"`, `aria-haspopup="dialog"`, `aria-expanded="false"` and `aria-controls="account-menu"`. (L2-024)
- **AC-2** Given the names Naomi Fraser, Abigail Mensah, Priya Nair, Miriam Haile and Tobi Adeyemi as people, and Hosanna Collective, Marcus Bell Trio, Daniel & Ruth Okonkwo and Riverside Community Church as groups, when their avatars render without `initials`, then they read "NF", "AM", "PN", "MH", "TA", "HC", "MB", "DR" and "RC". (L2-024)
- **AC-3** Given each size (sm, md, lg) and each variant (initials, ink, image, icon, status), when it renders, then the disc is 32, 40 or 56 px, carries exactly the modifier classes in the Variants and sizes tables, and matches the design-system rendering in the visual test. (L2-096)
- **AC-4** Given `kind` "group" for Hosanna Collective, when the avatar renders, then it has `.avatar--ink`, a `--color-bg-inverse` disc and `--color-fg-inverse` initials. (L2-096)
- **AC-5** Given Abigail Mensah's `photo` with a 1x and 2x `srcset`, when a medium avatar renders beside her name, then it contains an `<img>` with that `srcset`, `width="40"`, `height="40"`, `loading="lazy"` and `alt=""`, covering the disc inside the outline. (L2-088)
- **AC-6** Given a photo URL that fails to load, when the image errors, then the disc shows "AM" in its place, no broken-image icon is visible, and the disc's size does not change. (L2-088)
- **AC-7** Given a group of seven free artists with `max` 3, when it renders, then it shows "AM", "HC", "EP" and an ink "+4", overlapping by `--space-2`, and the group is one `role="img"` named "7 artists free Sat 14 Nov: Abigail Mensah, Hosanna Collective, Elijah Park and 4 more". (L2-100)
- **AC-8** Given the same group with `max` 2, when it renders, then it shows two faces and "+5", and at small size each disc overlaps the previous one by `--space-1`, so no initials are covered. (L2-096)

### States

- **AC-9** Given the account button, when the account menu opens and `expanded` becomes true, then `aria-expanded` is "true" and the disc's fill, size and initials do not change. (L2-024)
- **AC-10** Given a pointer over the account button, when it hovers, then the disc scales to 1.06; given a picture avatar, when it is hovered, then nothing changes. (L2-096)
- **AC-11** Given the top bar before the session is known, when `loading` is true, then a skeleton circle the size of the button renders with `aria-hidden="true"` and no button; when the person loads, then "NF" replaces it with a cumulative layout shift of 0. (L2-105)
- **AC-12** Given Abigail Mensah's avatar with `status` "online" and `statusLabel` "Online now", when it renders, then a `--color-success-solid` dot sits at the bottom right inside `.avatar-wrap`, it is `role="img"` named "Online now", and the page shows "online now" in text beside the name. (L2-100)

### Keyboard and focus

- **AC-13** Given focus moves to the account button with the keyboard, when it receives focus, then the two-tone ring is drawn around the circle's bounding box, `--color-accent-on-stage` with a `--color-bg-stage` gap inside the top bar and `--color-focus-ring` on paper. (L2-101)
- **AC-14** Given the account menu was opened from the avatar with Enter, when Escape closes it, then focus returns to the avatar button and its ring is visible. (L2-101)
- **AC-15** Given a list of saved artists with picture avatars, when the booker tabs through it, then no avatar receives focus. (L2-101)

### Screen readers

- **AC-16** Given the account button, when it is read by a screen reader, then it is announced as "Account menu for Naomi Fraser, button, collapsed", and "NF" is not announced as its name. (L2-100)
- **AC-17** Given a picture avatar beside "Abigail Mensah", when it is read, then it is skipped; given a standalone image avatar, then it is an image named "Abigail Mensah"; given Miriam Haile's icon avatar, then it is an image named "Miriam Haile, no photo yet". (L2-100)
- **AC-18** Given every variant, size and state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-19** Given the dark theme, when the account button renders, then the disc stays `--color-accent` with `--color-fg-on-accent` initials and outline; given an ink avatar, then it becomes a light disc with dark initials. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then initials are at least 4.5:1 on yellow and on ink, the disc's edge at least 3:1 against the surface (the ink outline in the light theme, the yellow fill in the dark theme), the disc at least 3:1 against the top bar, and the status dot at least 3:1 against the surface. (L2-103)

### Responsive

- **AC-21** Given XS (320 px and 360 px) and SM viewports, when the top bar renders, then the "NF" button is visible at 40 × 40 px beside the menu button and Saved heart, and it does not shrink. (L2-099)
- **AC-22** Given a coarse pointer, when the account button's target is measured, then it is at least 44 × 44 CSS px while the disc stays 40 px. (L2-096)
- **AC-23** Given text zoomed to 200 %, when a large avatar renders "NF", then the initials stay inside the disc and nothing overlaps neighbours. (L2-096)

### Content

- **AC-24** Given the French catalogue, when the account button's `label` is the French "Account menu for Naomi Fraser", then the button's accessible name is that string and no English remains in the component. (L2-111)

### Motion

- **AC-25** Given `prefers-reduced-motion: reduce`, when the account button is hovered, then it reaches its 1.06 scale without a transition. (L2-103)

### Performance

- **AC-26** Given the `Avatar`, `AvatarButton` and `AvatarGroup` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/avatar/`: `avatar.ts` (`Avatar`,
  `zm-avatar`), `avatar-button.ts` (`AvatarButton`, `zm-avatar-button`),
  `avatar-group.ts` (`AvatarGroup`, `zm-avatar-group`), `avatar-initials.ts`
  (`avatarInitials`), and `avatar.scss` shared by the three. Export all four
  from `public-api.ts`.
- Reproduce the design-system styles in `avatar.scss`: `.avatar`, `--sm`,
  `--lg`, `--ink`, `--icon`, `> img` (with the radius instead of the disc's
  `overflow: hidden`), `.avatar-wrap`, `.avatar__status`, `button.avatar` hover
  and its `::before` hit area, the ring from `--zm-avatar-ring`, and
  `.avatar-skeleton`. The group's overlap targets its own `zm-avatar` hosts
  (`:host > zm-avatar + zm-avatar`).
- Compose `zm-icon` for the icon variant and the skeleton CRD's circle styles
  for loading.
- The template uses one `@if` chain on the content (loaded photo → icon →
  initials); it has no `ng-content`.
- The top bar ([top-bar](top-bar.md)) composes `zm-avatar-button` at its end,
  with a [tooltip](tooltip.md) "Your account" below and end-aligned; the
  built `zm-top-bar` does not render it yet.
- Add the perf-test scenarios `Avatar.ts`, `AvatarButton.ts` and
  `AvatarGroup.ts`, and export them from `scenarios/index.ts`.

## Decisions

- **D-1** *One component that switches between `<button>` and `<span>`, or separate components?* Separate, as with the button family. The interactive avatar has a different contract (name, expanded, controls, hit area), and the group is a different element. No component renders a different element by condition except the loading skeleton, which has no content.
- **D-2** *Who works out the initials?* The library, through `avatarInitials`, with the design system's two rules chosen by `kind`. The rule then lives in one tested place, and `initials` stays available for overrides such as "+4".
- **D-3** *The account menu is a `.dialog--menu` with a plain link list, not an ARIA menu, and the mocks set no `aria-haspopup` or `aria-controls`. What does the button declare?* `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`. The patterns page names `aria-haspopup="menu"`, but the `dialogs/account-menu` mock and its note ("a plain link list, not an arrow-key menu") make it a dialog, and declaring a menu would promise arrow-key behaviour that is not there. `aria-controls` comes from the design-system code sample.
- **D-4** *The account button is 40 px, but L2-096 requires a 44 × 44 px target.* A transparent `::before` extends the target to `--target-comfortable` while the disc stays 40 px as designed. The design system's "the top bar's padding makes it 44 px" does not enlarge the actual target. The image therefore takes the disc's radius, and the disc drops `overflow: hidden`.
- **D-5** *Ink "to tell an act apart from a person": which artists are acts?* `kind: 'group'` covers anything with more than one person, plus churches: bands, duos, choirs and churches are ink; solo artists and users are yellow. This matches every design-system example (AM yellow, HC ink, EP yellow, RC ink).
- **D-6** *The design system has image, icon, group and status variants that no mock uses yet. Keep them?* Yes. The design system specifies them for messages, reviews and lists. Adding inputs later would change the API every consumer types against.
- **D-7** *How is a loading avatar sized at small and large, when the skeleton circle is 40 px only?* `.avatar-skeleton` sets the circle's width and height from the avatar's `--avatar-size`, so the skeleton always matches the disc it replaces (L2-105).
- **D-8** *In a group, the design system's `.avatar-group > .avatar` needs the discs as direct children, but each is inside a `zm-avatar` host.* The group styles its own `zm-avatar` hosts for the overlap and sets `--zm-avatar-ring` for the ring. The rendered DOM keeps `.avatar-group` and `.avatar`, and the page objects locate them as descendants.
- **D-9** *Which sizes can the button take?* Medium only. The design system says small avatars are never buttons, and the only button (the top bar) is 40 px.
- **D-10** *What does a loaded photo do when `icon` is also set?* The photo wins, then the icon, then the initials. A real photo is always the best way to recognise someone; the icon only stands in for a missing one.
- **D-11** *The design system overlaps every group by `--space-2`. The rendering shows that at small size this covers the right edge of the previous disc's initials ("AM" loses half its M).* Small groups overlap by `--space-1`; medium keeps `--space-2`, where the initials stay clear. Faces in a group are decorative (the group is one named image), but half-covered letters read as a rendering fault.
- **D-12** *The ink outline is only about 1.2:1 against the dark surface. Does the avatar lose its edge in the dark theme?* No: there the yellow fill is the edge and clears 3:1 against the surface and the top bar, as the design system's dark contrast pair says. The outline's 3:1 requirement applies in the light theme only.
