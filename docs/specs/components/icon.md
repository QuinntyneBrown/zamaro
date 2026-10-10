# Icon

| Field | Value |
|---|---|
| Selector | `zm-icon` |
| Library path | `frontend/projects/components/src/lib/icon/` |
| Status | built |
| Traces to | L2-026, L2-086, L2-087, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`iconography.html`](../../design-system/foundations/iconography.html) |
| Source mocks | Every page, dialog and notification: [`pages/discover/default`](../../mocks/pages/discover/default.html) (top bar, headliner, band), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html) (editor tools), [`dialogs/menu/artist`](../../mocks/dialogs/menu/artist.html) (menu icons), [`dialogs/pay-deposit/default`](../../mocks/dialogs/pay-deposit/default.html) (dialog header), [`notifications/booking-toast/stacked`](../../mocks/notifications/booking-toast/stacked.html) (toast icons) — see Usage |
| Rendering | [`icon.html`](icon.html) |

## Purpose and scope

An icon is a small stroke drawing that supports a word: the heart beside
"Saved", the arrow after "See Abigail's profile", the warning before "We lost
the signal". Zamaro uses few icons, drawn on a 24-unit grid with square caps
and mitred joins like cut vinyl, coloured with `currentColor` so each follows
the text it sits in. `zm-icon` renders one icon from the product's fixed set by
name.

An icon is always decorative to assistive technology. Its meaning is carried by
the words beside it or by the name of the control it sits in.

Use something else when:

- the "icon" is a typographic ornament in text (✦ between marquee items, ★ in
  ratings, ✓ in pressed chips, · between details) → keep the character in the
  text ([marquee](marquee.md), [rating](rating.md), [chip](chip.md));
- it is a picture of an artist → [artwork](artwork.md);
- it is a person's initials → [avatar](avatar.md);
- it is a loading indicator → [spinner](spinner.md).

Out of scope:

- The accessible name of an icon-only control. The control owns it
  ([button](button.md) `label`, [tooltip](tooltip.md) for the visible hint).
- When an icon fills to mean "on". The pressed control decides; the icon only
  exposes the fill knob.
- Layout around the icon: the gap to the label, its position in an input, its
  rotation in a sorted column. The consumer styles the `zm-icon` host.

## Usage

The mocks draw 74 distinct SVGs across all 364 screens (about 3,700 icons).
They reduce to 64 glyphs: 10 of the 74 repeat a glyph with slightly different
path data (two checks, two stars, three locks, two calendars, two searches, two
infos, two copies, two downloads, two tickets). The design system adds four
that complete the core components (`chevron-down`, `external`, `pin`, `play`).
The set below is the union: 68 names. Every SVG in every mock maps to one of
them; nothing else is drawn.

| Where | Configuration | Icons | States seen | Surface |
|---|---|---|---|---|
| Top bar on every screen | md in ghost buttons; sm in the brand mark | `menu`, `moon`, `heart`, `mic` | pressed (theme toggle turns `--color-accent-on-stage`), expanded | stage |
| Buttons and links with a leading or trailing icon (every page) | md, before or after the label | `arrow-right`, `arrow-left`, `refresh`, `search`, `plus`, `upload`, `download`, `share`, `check`, `block`, `feed`, `repeat`, `reply`, `undo`, `pause`, `eye-off`, `banknote`, `card`, `shield`, `shield-check`, `lock`, `lock-open`, `star`, `send`, `mail`, `copy`, `key`, `calendar`, `eye` | default, hover, disabled, busy | surface, canvas, stage, band, toast |
| Save toggle and profile "Save" button | md | `heart`, filled when pressed | pressed true/false, busy (pulses) | surface, stage |
| Icon-only editor tools (`pages/edit-profile`, `dialogs/add-photo`, `add-song`, `add-video`, `upload-check`) | md and sm in ghost icon-only buttons | `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `trash`, `star` | default, disabled at list ends | surface |
| Calendar month and pagination (`pages/availability`, `dialogs/block-dates`, admin lists) | md in secondary icon-only buttons | `chevron-left`, `chevron-right` | default, disabled | surface |
| Close buttons (every dialog, toast, chip) | sm | `close` | default, hover, focus | dialog, toast, chip |
| Alerts and banners (`*/failed`, `*/error`, `pages/offline`, `notifications/system-banner`) | lg leading | `warning`, `info`, `pause`, `wifi-off` | — | alert tones |
| Inline messages and field help (`pages/book`, `pages/edit-profile`, `pages/account`) | sm leading | `check`, `info`, `warning`, `lock`, `shield` | — | surface |
| Dialog headers (`docs/mocks/dialogs/*`) | md inside the 40 px icon block | `info`, `warning`, `check`, `phone`, `church`, `image`, `music`, `film`, `block`, `feed`, `x-circle`, `calendar`, `trash`, `eye-off`, `banknote`, `card`, `undo`, `reply`, `flag`, `shield`, `lock`, `key`, `shield-check`, `repeat`, `star` | info and danger tones | dialog |
| Toasts (`notifications/*`) | md leading in the toast's accent colour | `check-circle`, `x-circle`, `info`, `clock`, `bell`, `heart`, `warning` | — | inverse slip, danger slip |
| Main menu, artist menu, admin menu, account menu, sidebar (`dialogs/menu/*`, `dialogs/account-menu/*`) | md leading in each item | `compass`, `help`, `mic`, `moon`, `grid`, `inbox`, `calendar`, `user`, `banknote`, `ticket`, `heart`, `people`, `list`, `document`, `sliders`, `sign-out`, `eye`, `flag` | current, pressed (theme toggle fills) | drawer, menu panel |
| Checkbox (`pages/admin-application`, `dialogs/reject-application`, account forms) | 16 px, stroke width 3, stacked in the box | `check`, `minus` | checked, indeterminate, unchecked (hidden) | control |
| Review actions (`pages/artist-reviews`, `dialogs/reply-review`) | sm in small buttons and the "Reply locked" caption | `reply`, `flag`, `lock` | default | surface |
| Empty states (`pages/dashboard/empty`, `pages/bookings/no-results`, admin empties) | md in the action | `calendar`, `search`, `arrow-right`, `people`, `list` | — | canvas |
| Links (design system) | trailing, 0.85 em | `arrow-right` (nudges on hover), `external` | hover | any |
| Table sort (design system) | 14 px, rotated 180° when descending | `arrow-up` | unsorted (faint), ascending, descending | surface |
| Avatar icon variant (design system) | 55 % of the disc | `user` | — | avatar |
| Select and location field (design system) | md, positioned in the input | `chevron-down`, `search`, `pin` | — | control |

### The icon set

Each name has exactly one path. Circles and rectangles in the mocks are written
as path commands with the same geometry, so every icon is one `<path>`. The
`d` strings are the requirement: copy them exactly.

| Name | Group | Means | Used in | Path `d` |
|---|---|---|---|---|
| `arrow-right` | Direction | Go on; move a photo later | headliner, band, empty states, dashboard, photo order, photo viewer | `M4 12h15M13 6l6 6-6 6` |
| `arrow-left` | Direction | Go back; move a photo earlier | photo order, photo viewer "Previous photo" | `M20 12H5M11 6l-6 6 6 6` |
| `arrow-up` | Direction | Move up; sorted column | setlist editor "Move … up", table sort | `M12 19V5M6 11l6-6 6 6` |
| `arrow-down` | Direction | Move down | setlist editor "Move … down" | `M12 5v14M6 13l6 6 6-6` |
| `chevron-left` | Direction | Previous month or page | calendar, pagination | `m15 6-6 6 6 6` |
| `chevron-right` | Direction | Next month or page | calendar, pagination | `m9 6 6 6-6 6` |
| `chevron-down` | Direction | Expand; open a select | select, disclosure (design system) | `M6 9l6 6 6-6` |
| `external` | Direction | Opens outside Zamaro | external link | `M14 4h6v6M20 4l-9 9M18 14v6H4V6h6` |
| `menu` | Actions | Open the menu | top bar | `M4 7h16M4 12h16M4 17h16` |
| `close` | Actions | Close, dismiss, remove | dialogs, toasts, chips | `M6 6l12 12M18 6 6 18` |
| `plus` | Actions | Add | "Add a song", "Add a video" | `M12 5v14M5 12h14` |
| `minus` | Actions | Partly selected | checkbox (indeterminate) | `M6 12h12` |
| `check` | Actions | Done, verified, free, accept | checkbox tick, field success, "Accept request", "Approve Tobi" | `M5 12l5 5L20 7` |
| `trash` | Actions | Delete, remove | setlist and photo editors, delete account | `M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13` |
| `refresh` | Actions | Try again; new codes | error states, failed dialogs, recovery codes | `M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5` |
| `undo` | Actions | Reverse a decision | "Reinstate…" | `M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3` |
| `repeat` | Actions | Every week | weekly default | `M4 9h13l-3-3M20 15H7l3 3` |
| `reply` | Actions | Reply | review replies | `M10 9V5l-7 7 7 7v-4c5 0 8 1.5 11 5-1-6-4-11-11-11z` |
| `send` | Actions | Send a message | booking messages | `M3 11 21 3l-8 18-2-8z` |
| `share` | Actions | Share a profile | profile header, photo viewer | `M12 3v13M7 8l5-5 5 5M5 14v7h14v-7` |
| `upload` | Actions | Upload a file | "Add a photo", "Upload check" | `M12 16V4M7 9l5-5 5 5M5 14v6h14v-6` |
| `download` | Actions | Download a file | receipts, recovery codes, data export | `M12 3v13M7 11l5 5 5-5M5 21h14` |
| `copy` | Actions | Copy to the clipboard | calendar feed link, recovery codes | `M9 9h11v11H9zM5 15H4V4h11v1` |
| `search` | Actions | Find | "Find who's free", audit filters, search fields | `M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4` |
| `eye` | Actions | Preview, view | "Preview", "View public profile" | `M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z` |
| `eye-off` | Actions | Hide | "Hide review…" | `M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.1 7.9A17 17 0 0 0 2 12s4 6 10 6a9.6 9.6 0 0 0 4.1-.9` |
| `pause` | Actions | Suspended or held | "Suspend…", held bookings | `M8 5v14M16 5v14` |
| `sign-out` | Actions | Sign out | account menu | `M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11` |
| `info` | Status | Information | info alerts, toasts, dialogs | `M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5` |
| `warning` | Status | Error or warning | error alerts, danger dialogs | `M12 3 2 21h20zM12 10v5M12 18v.5` |
| `check-circle` | Status | Success | success toasts | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M8 12l3 3 5-6` |
| `x-circle` | Status | Declined, failed | danger toasts, decline dialog | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M9 9l6 6M15 9l-6 6` |
| `clock` | Status | Deadline, time running | warning toast "Heads up" | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 3` |
| `block` | Status | Unavailable | "Mark dates unavailable" | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M5.6 5.6l12.8 12.8` |
| `bell` | Status | New request | request toasts | `M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4` |
| `wifi-off` | Status | Offline | offline page and banner | `M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 4.6-2.5M14.6 10.2a10 10 0 0 1 4.4 2.4M2 8.8a15 15 0 0 1 4.3-2.6M10.5 4.6A15 15 0 0 1 22 8.8M12 20h.01` |
| `lock` | Security | Secured, locked | "Nothing is charged today", card fields, "Reply locked", two-step on | `M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4` |
| `lock-open` | Security | Turn protection off | "Turn off" two-step sign-in | `M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2` |
| `key` | Security | Recovery codes | two-step codes | `M4 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M11 12l9-9M17 6l3 3` |
| `shield` | Security | Check before acting | approve help, "Resolve hold…" | `M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z` |
| `shield-check` | Security | Vulnerable sector check | "Upload a newer check" | `M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM8.5 12l2.5 2.5 4.5-5` |
| `heart` | Objects | Saved artists (fills when saved) | save toggle, top bar Saved | `M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z` |
| `star` | Objects | Reviews; primary photo | "Leave a review", "Make photo 2 your primary photo" | `m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z` |
| `flag` | Objects | Report | "Report … review", report problem | `M5 21V4h11l-1.5 4L16 12H5` |
| `calendar` | Objects | Dates and availability | "See your calendar", menus | `M4 6h16v14H4zM4 10h16M8 3v4M16 3v4` |
| `feed` | Objects | Calendar feed | "Subscribe in your calendar" | `M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 18.5v.5` |
| `card` | Objects | Card payment | pay deposit, pay balance | `M3 6h18v12H3zM3 10h18M7 15h4` |
| `banknote` | Objects | Money, earnings, refunds | "Issue refund…", Earnings | `M3 7h18v10H3zM7 12h.5M16.5 12h.5M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z` |
| `ticket` | Objects | Bookings | menus "Your bookings", admin Bookings | `M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10` |
| `inbox` | Objects | Requests | artist menu, sidebar | `M4 13l3-8h10l3 8v6H4zM4 13h5l1 2h4l1-2h5` |
| `grid` | Objects | Dashboard | artist menu | `M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z` |
| `user` | Objects | Profile | artist menu, sidebar | `M8 8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M4 21c1-4 4-6 8-6s7 2 8 6` |
| `people` | Objects | Artists (admin) | admin menu, empty applications | `M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 3.5-6 7-6s6 2 7 6M16 3.5a4 4 0 0 1 0 7.5M18 15c2 .7 3.3 2.6 4 6` |
| `list` | Objects | Audit log, lists | admin menu, sidebar | `M8 6h13M8 12h13M8 18h13M3 6h.5M3 12h.5M3 18h.5` |
| `sliders` | Objects | Account settings | account menu | `M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4` |
| `document` | Objects | A document | "View document of … check", admin menu | `M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5` |
| `image` | Objects | Photos | add photo | `M3 6h18v13H3zM3 15l5-5 4 4 3-3 6 6M15.5 9.5v.5` |
| `music` | Objects | Songs | add song | `M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z` |
| `film` | Objects | Videos | add video | `M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4` |
| `church` | Objects | A church | add church | `M12 3 4 8v13h16V8zM9 21v-6h6v6M12 7v4M10 9h4` |
| `mail` | Objects | Email | "Resend the email", "Send a new link" | `M3 5h18v14H3zM3 6l9 7 9-7` |
| `phone` | Objects | Phone | "Add contact phone" | `M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z` |
| `pin` | Objects | Location and distance | location field (design system) | `M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z` |
| `play` | Objects | Play a video | video player (design system) | `M7 4v16l13-8z` |
| `compass` | Navigation | Discover | main menu | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M15 9l-2 5-4 1 2-5z` |
| `help` | Navigation | How booking works | main menu | `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17v.5` |
| `mic` | Brand | The brand mark; for artists | top bar, main menu | `M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8` |
| `moon` | Brand | Dark theme | top bar, main menu | `M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z` |

## Anatomy

1. **Host** — `zm-icon`: an inline box (`display: inline-flex`), square, sized by
   `size` (or `--zm-icon-size`), `flex: none` so it never squashes,
   `vertical-align: middle`. It is the element consumers style: classes,
   margins, positioning, rotation and animation go on the host.
2. **Drawing** — `svg.icon` (plus `.icon--sm`, `.icon--lg`, `.icon--fill`):
   `viewBox="0 0 24 24"`, `aria-hidden="true"`, `focusable="false"`, filling the
   host (`width` and `height` 100 %, `display: block`).
3. **Path** — one `<path>` whose `d` comes from the icon set: stroke
   `currentColor`, width 2.25 (`--zm-icon-stroke-width`), `stroke-linecap:
   square`, `stroke-linejoin: miter`, fill `none` (`--zm-icon-fill`).

The drawing stays inside a 2-unit safe area of the 24-unit grid; shapes are
straight lines and simple arcs, with no gradients and no second tone.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `name` | `IconName` | — | yes | One of the 68 names in the icon set. `IconName` is the exported union of the registry's keys, so an unknown literal fails to compile. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | 16, 20 or 28 px (1, 1.25, 1.75 rem). Adds `.icon--sm` or `.icon--lg` to the SVG; md adds none. |
| `filled` | `boolean` (attribute) | `false` | no | Adds `.icon--fill`: the shape is filled with `currentColor` and keeps its stroke. Only for closed shapes (`heart`, `star`, `bell`, `flag`, `pin`, `play`, `shield`, `ticket`). |

- Inputs are signal inputs; `filled` uses `booleanAttribute`.
- A name that arrives at run time from data (a menu item's `icon`) and is not
  in the registry renders the empty SVG at the requested size and, in dev mode,
  logs a console error naming the value. It never throws.

### Exports

| Export | Type | Rule |
|---|---|---|
| `Icon` | component | `zm-icon`. |
| `IconName` | type | The union of the registry's keys. Every component that takes an icon (`dialog`'s `icon`, `menu` items, `toast`, `inline-message`, `form-layout` status, `sidebar-navigation`) types it as `IconName`. |
| `ICON_NAMES` | `readonly IconName[]` | The names in registry order, for the icon sheet and its visual test. |

### Component knobs (custom properties)

| Property | Default | Set by |
|---|---|---|
| `--zm-icon-size` | from `size` | A consumer that needs a size outside the three (chip remove 0.875 rem, table sort 0.875 rem, link external 0.85 em, avatar 55 %). Set it on the host or an ancestor. |
| `--zm-icon-fill` | `none` (`currentColor` with `filled`) | A pressed parent: `zm-button` with `pressed`, the save toggle, a pressed menu item set `--zm-icon-fill: currentColor`, so the heart fills without the consumer knowing the icon. |
| `--zm-icon-stroke-width` | `2.25` | The checkbox (3, so the tick reads at 16 px). |

### Outputs

None. An icon is not interactive.

### Content slots

None. The component declares no `ng-content`.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Outline | — | Every icon by default. |
| Filled | `.icon--fill` (`filled`), or `--zm-icon-fill: currentColor` from a pressed parent | "On": a saved heart, a pressed theme toggle in the menu. Filled means on; never fill for decoration. |

| Size | Modifier | Box | Use for |
|---|---|---|---|
| Small | `.icon--sm` | 1 rem (16 px) | Chips, close buttons, field and inline messages, the brand mark, small buttons. |
| Medium | — | 1.25 rem (20 px) | Buttons, menus, navigation, toasts, dialog header blocks. The default. |
| Large | `.icon--lg` | 1.75 rem (28 px) | Leading icons of alerts and banners. |

Sizes are in `rem`, so icons grow with text zoom.

## States

The icon has no interaction states of its own. Its parent's state reaches it
through colour and the fill knob.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Outline in `currentColor` | Hidden (`aria-hidden="true"`) |
| Filled | `filled`, or a pressed parent setting `--zm-icon-fill` | Shape filled with `currentColor`, stroke kept | Hidden; the parent's `aria-pressed` carries the state |
| Parent hover, focus, disabled | the parent's state changes its text colour | Follows `currentColor` (a disabled button's icon is `--color-fg-disabled`) | Hidden |
| Parent busy | e.g. the save toggle's `aria-busy="true"` animates the host | The consumer's animation (pulse); stops under reduced motion | Hidden |
| Unknown name | a run-time name not in the registry | Empty box at the requested size; dev-mode console error | Hidden |
| Forced colours | `forced-colors: active` | `currentColor` follows the system text colour; strokes stay visible | Hidden |

## Markup

```html
<!-- rendered: <zm-icon name="refresh" /> -->
<zm-icon>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"></path></svg>
</zm-icon>

<!-- rendered: <zm-icon name="close" size="sm" /> -->
<zm-icon>
  <svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"></path></svg>
</zm-icon>

<!-- rendered: <zm-icon name="heart" filled /> -->
<zm-icon>
  <svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"></path></svg>
</zm-icon>
```

Large adds `.icon--lg`; the structure is the same.

Consumer templates:

```html
<!-- leading icon in a button: the label is the name -->
<zm-button variant="primary" (click)="retry()"><zm-icon name="refresh" />{{ 'errors.retry' | transloco }}</zm-button>

<!-- icon-only: the button is named, the icon is not -->
<zm-button variant="ghost" iconOnly [label]="'editor.photo.remove' | transloco: { n: 2 }"><zm-icon name="trash" /></zm-button>

<!-- a consumer sizing and placing the host -->
<a zm-link external href="https://www.youtube.com/@abigailmensah">YouTube<zm-icon name="external" class="link__external" /><span class="visually-hidden">{{ 'common.newTab' | transloco }}</span></a>

<!-- tinted by its parent -->
<span class="alert__icon"><zm-icon name="warning" size="lg" /></span>
```

The `svg.icon` classes, `aria-hidden="true"` and `focusable="false"` are the
contract. The path data is fixed by the icon set; visual tests compare the
rendered sheet with the design system's.

## Design

- Host: `display: inline-flex`, `flex: none`, `vertical-align: middle`,
  `inline-size` and `block-size` of `var(--zm-icon-size)`, where the size sets
  `--zm-icon-size` to 1 rem, 1.25 rem or 1.75 rem unless a consumer has set it.
- SVG: `display: block`, `width: 100%`, `height: 100%`, `overflow: visible`.
- Path: `stroke: currentColor`, `stroke-width: var(--zm-icon-stroke-width,
  2.25)`, `stroke-linecap: square`, `stroke-linejoin: miter`, `fill:
  var(--zm-icon-fill, none)`; with `.icon--fill`, `fill: currentColor`.
- Icon to label gap belongs to the parent: `--space-2` in buttons and menus,
  `--space-1` in chips.
- No transitions or animations of its own.

Component tokens: the three `--zm-icon-*` knobs above. The icon reads no colour
token; it reads `currentColor`.

## Colour

The icon takes the colour of its text. The parts below are the product's
contexts and the semantic token that colours each.

| Part | Token | Light | Dark |
|---|---|---|---|
| Icon in body text and secondary buttons | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Icon in muted text and input adornments | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Icon on primary (yellow) | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Icon on the stage and top bar | `--color-fg-on-stage` | `--palette-ink-100` | `--palette-ink-100` |
| Pressed theme toggle in the top bar | `--color-accent-on-stage` | per theme | per theme |
| Info alert and dialog icon | `--color-info-icon` | `--palette-ink-750` | `--palette-signal-500` |
| Success alert icon, upload done | `--color-success-icon` | `--palette-green-700` | `--palette-green-300` |
| Warning alert icon | `--color-warning-icon` | `--palette-amber-700` | `--palette-amber-300` |
| Danger alert and dialog icon | `--color-danger-icon` | `--palette-red-600` | `--palette-red-300` |
| Disabled control icon | `--color-fg-disabled` | `--palette-ink-400` | `--palette-ink-600` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 3:1 | Icon in a button or menu on paper (text colours already pass 4.5:1) |
| `--color-fg-muted` | `--color-bg-surface` | 3:1 | Icon in muted text |
| `--color-fg-on-stage` | `--color-bg-stage` | 3:1 | Top-bar icons |
| `--color-info-icon` | `--color-info-bg` | 3:1 | Info alert icon |
| `--color-success-icon` | `--color-success-bg` | 3:1 | Success alert icon |
| `--color-warning-icon` | `--color-warning-bg` | 3:1 | Warning alert icon |
| `--color-danger-icon` | `--color-danger-bg` | 3:1 | Danger alert icon |

Icons are hidden from assistive technology, but a sighted user still reads them
next to their words, so each colour pair meets 3:1 (WCAG 1.4.11). Disabled
icons are exempt, as disabled text is. Under forced colours `currentColor`
follows the system text colour automatically.

## Responsive behaviour

- Nothing changes across breakpoints. Sizes are in `rem`, so at 200 % text zoom
  every icon doubles with its label.
- `flex: none` keeps an icon square when a label wraps in a narrow button at
  320 px; the label wraps, the icon never shrinks or clips.
- An icon is never a target on its own. Its parent control provides the 44 × 44
  CSS px target (L2-096).

## Accessibility

### Role and pattern

The icon is decorative: `aria-hidden="true"` on the SVG, which has no `<title>`
and no role. No APG pattern applies. An icon is never the only carrier of
meaning: an icon-only control takes its name from its own `aria-label`
(`label` on [button](button.md)) and gets a [tooltip](tooltip.md); a status
icon sits beside a title that says the same in words ("We lost the signal").

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Never stops on an icon. `focusable="false"` keeps legacy engines from focusing the SVG. |

### Focus

Not focusable. Focus rings belong to the parent control.

### Labelling

- No `aria-label`, `title` or `role="img"` on the icon, ever. The component has
  no input for one (D-4).
- The accessible name of a control with an icon and text is the text: "Try
  again", not "refresh Try again".
- One meaning per icon across the product (the icon set's *Means* column): the
  heart is always "saved", never "like" or "favourite song".

### Announcements

None.

### Motion

The icon does not animate. Consumers that animate the host (the save toggle's
pulse while saving, the standalone link's arrow nudge on hover, the table's
rotation) stop or skip the animation under `prefers-reduced-motion: reduce`.

## Content and internationalisation

- Icons support words; they almost never replace them. Fewer than one button in
  three has one (design system, Usage).
- Leading icons name a state or an object (refresh before "Try again", heart
  before "Saved"); a trailing arrow means "go on" ("See Abigail's profile").
- No glyph contains letters, numbers or culture-specific symbols, so the set
  needs no change for the French catalogue (L2-111). Both catalogues are
  left-to-right; the arrows are not mirrored.
- Translatable inputs: none. Data values: none.

## Performance

- Change detection: `OnPush`, signal inputs, the path from one `computed`
  lookup. No `effect`, no subscriptions, no host listeners.
- Rendering: inline SVG in the component's template, server-rendered with the
  page. No sprite sheet, no icon font and no network request, so icons are in
  the first paint and never pop in (L2-086).
- Weight: the registry is one `const` object of 68 path strings in
  `icon.ts`, about 4 KB raw and under 3 KB gzipped; it ships once in the
  initial bundle shared by both applications (L2-087). A new icon is added to
  the registry only when a mock or the design system draws it.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Icon.ts`
  renders the brand mark's `mic` at `size="sm"`, as the top bar does.
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep it at
  roughly 100–300 ms.
- Composite scenarios that include it: `Button`, `TopBar`, `Menu`, `Alert`,
  `Setlist`, `Dialog`, `EmptyState`, `DarkTheme`. The host change from
  `display: contents` to `inline-flex` is measured against the base branch with
  `--fail-on-regression` before it is pushed.
- Layout stability: the host reserves its square before paint, so an icon
  never shifts the label beside it.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-icon name="refresh" />` in the "Try again" button, when it renders, then the host contains exactly one `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` with one `<path>` whose `d` is the icon set's `refresh` path, stroked in `currentColor` at width 2.25 with square caps and mitred joins, and no fill. (L2-100)
- **AC-2** Given `size` sm, md and lg, when each renders, then the host and its SVG measure 16, 20 and 28 CSS px square, and the SVG carries `.icon--sm`, no size modifier, and `.icon--lg` respectively. (L2-096)
- **AC-3** Given the icon sheet rendering every name in `ICON_NAMES`, when the visual test runs in both themes, then each of the 68 icons matches its design-system or mock drawing and no two names share a path. (L2-096)
- **AC-4** Given a menu item whose run-time `icon` value is "wallet", which is not in the registry, when it renders in dev mode, then the item shows an empty 20 px box, the label is unaffected, nothing throws, and the console names "wallet". (L2-086)
- **AC-5** Given a consumer class on the host (`class="link__external"`) that sets `--zm-icon-size: 0.85em` and a left margin, when it renders, then the host takes that size and margin and the SVG fills it. (L2-096)
- **AC-6** Given the checkbox setting `--zm-icon-stroke-width: 3` on its `check` icon, when Tobi's "Reference verified" box is ticked, then the tick is drawn at stroke width 3 in a 16 px box. (L2-096)

### States

- **AC-7** Given the profile header's "Save" button for Abigail Mensah, when `pressed` becomes true, then its `heart` icon is filled with `currentColor` through `--zm-icon-fill` and keeps its stroke; when `pressed` is false, then the heart is an outline. (L2-026)
- **AC-8** Given `<zm-icon name="heart" filled />`, when it renders, then the SVG has `.icon--fill`, the shape is filled with `currentColor`, and its outline is the same size as the unfilled heart. (L2-026)
- **AC-9** Given a disabled "Move Goodness of God up" button, when it renders, then its `arrow-up` icon is drawn in the button's `--color-fg-disabled` text colour. (L2-104)

### Keyboard and focus

- **AC-10** Given a page of icon buttons and icon links, when the user tabs through it, then focus lands only on the controls and never on an icon. (L2-101)

### Screen readers

- **AC-11** Given the "Try again" button with a leading `refresh` icon, when its accessible name is computed, then it is exactly "Try again". (L2-102)
- **AC-12** Given the icon-only button labelled "Remove photo 2", when a screen reader reads it, then it announces "Remove photo 2, button" and nothing for the `trash` icon. (L2-102)
- **AC-13** Given the icon sheet and every product context in the Usage table in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-14** Given the dark theme, when the top bar, a secondary button, a danger alert and a toast render, then each icon is drawn in its parent's text colour: `--color-fg-on-stage`, `--color-fg-default`, `--color-danger-icon` and the toast's accent. (L2-104)
- **AC-15** Given both themes, when contrast is measured, then each foreground and background pair in the Colour table is at least 3:1. (L2-103)
- **AC-16** Given forced colours (Windows high contrast), when the "Try again" button renders, then its `refresh` stroke takes the system button text colour and stays visible. (L2-100)

### Responsive

- **AC-17** Given text zoomed to 200 %, when the "Try again" button renders, then the icon measures 40 CSS px and stays aligned with the label. (L2-096)
- **AC-18** Given a 320 px viewport and the button "Search within 120 km · 2 free" with a trailing `arrow-right`, when the label wraps, then the icon stays 20 px square and nothing clips. (L2-096)

### Motion

- **AC-19** Given `prefers-reduced-motion: reduce`, when the save toggle is busy and a standalone link is hovered, then the heart does not pulse and the arrow moves without a transition, and the icon itself declares no animation or transition. (L2-103)

### Content

- **AC-20** Given the French catalogue, when every page renders, then no icon needs to change, because no glyph in the set contains text. (L2-111)

### Performance

- **AC-21** Given server-side rendering of Discover, when the HTML arrives, then every icon is an inline SVG with its path already in the markup and the page makes no network request for icons. (L2-086)
- **AC-22** Given a production build, when the initial bundle is measured, then the icon registry adds less than 3 KB gzipped and is included once for both applications' shared code. (L2-087)
- **AC-23** Given the `Icon` scenario and the composites that contain icons, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and `Icon` renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-icon` with `name` and `size`, ten icons, `:host { display:
contents }` and the `--zm-icon-fill` knob. To meet this CRD:

- Extend the registry to the 68 names and paths in the icon set, in that order,
  and export `ICON_NAMES`.
- Correct `info` to `M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5`
  (the built path puts the dot at `M12 7v.5`, off the sheet).
- Change the host to `display: inline-flex`, `flex: none`, `vertical-align:
  middle`, sized by `--zm-icon-size`; make the SVG `display: block` at 100 %
  (D-2). Then remove the wrapper spans consumers added only to style the icon
  where a class on the host now does it.
- Add the `filled` input and `.icon--fill` (fill `currentColor`, stroke kept).
- Add `--zm-icon-size` and `--zm-icon-stroke-width`.
- Add the dev-mode console error for an unknown run-time name, and render the
  empty SVG instead of a `path` with `d="undefined"`.
- Consumers that style the SVG today through descendant selectors in global
  CSS (`.check__box .icon`, `.chip__remove .icon`, `.table__sort .icon`,
  `.avatar--icon .icon`, `.input-icon > .icon`, `.save[aria-busy] .icon`) move
  those rules to the `zm-icon` host in their own stylesheets.
- Keep `Icon.ts` as is; measure the host change with the composites listed in
  Performance.

## Decisions

- **D-1** *Which path wins where the mocks draw one glyph two ways?* The design-system icon sheet's path where it has one (`search`, `info`, `calendar`, `share`), otherwise the most-used drawing (`check` `M5 12l5 5L20 7`, `star`, `lock` `M5 11h14v10H5z…`, `download` `M12 3v13…`). For `copy`, the drawing whose back sheet stops short of the front (`M9 9h11v11H9zM5 15H4V4h11v1`), which stays legible at 16 px. For `ticket`, the drawing with the stub line, which matches the ticket card's perforation. One glyph per name keeps the visual test stable.
- **D-2** *Should the host stay `display: contents`?* No; it becomes an `inline-flex` box. Eight consumers in the design system size, position, rotate, fade or animate the icon (chip remove, table sort, avatar, input adornment, checkbox, save pulse, link nudge, link external). With encapsulated styles they cannot reach the inner SVG, and a `display: contents` host has no box to style. A real host lets each consumer style `zm-icon` with an ordinary class; the layout is the same, since the host is the same size as the SVG it replaces as the flex item.
- **D-3** *Does filling keep the stroke?* Yes. The design-system sheet's `.icon--fill` removes the stroke, but every pressed control in the mocks (`.btn[aria-pressed="true"] .icon`, `.save[aria-pressed="true"] .icon`, the pressed menu item) fills and keeps it. Removing the stroke would shrink the filled heart by the stroke width, so "on" would look smaller than "off". One "on" look for both routes.
- **D-4** *Can an icon carry its own accessible name?* No. Every icon in the mocks is hidden, and the design system names the control, never the SVG, even for status icons. The component has no `label` input, so a named icon cannot be built.
- **D-5** *Names for glyphs the sheet does not name?* By what the glyph shows, matching the built names and the sibling CRDs: `banknote` (not `money` or `wallet`), `lock-open`, `check-circle`, `x-circle`, `eye-off`, `wifi-off`, `sign-out`, `sliders`, `people`. The sheet's `retry` stays `refresh`, the built name every consumer already uses.
- **D-6** *The sheet has a `sort` glyph; the table page draws `arrow-up` and rotates it. Which?* `arrow-up`, as the table page renders it. The sheet's `sort` is a heavier down-arrow that nothing uses, and keeping both would put two near-identical arrows in the set. `sort` is not in the registry.
- **D-7** *Keep `chevron-down`, `external`, `pin` and `play`, which no mock draws?* Yes. The design system adds them for the select, the external link, the location field and the video player, whose CRDs use them; adding them later would widen `IconName` under every consumer.
- **D-8** *A sprite sheet or an icon font instead of inline paths?* No. Inline SVG is server-rendered with the page, needs no request, follows `currentColor`, and the whole set is under 3 KB gzipped. A sprite would need an extra request or a shared `<symbol>` document that SSR must inline anyway.
- **D-9** *Mirror arrows for right-to-left languages?* No. Zamaro's catalogues are English and French, both left-to-right (L2-111); adding mirroring now would change every arrow's markup for no reader.
