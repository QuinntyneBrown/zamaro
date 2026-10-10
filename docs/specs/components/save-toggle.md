# Save toggle

| Field | Value |
|---|---|
| Selector | `zm-save-toggle` |
| Library path | `frontend/projects/components/src/lib/save-toggle/` |
| Status | planned |
| Traces to | L2-006, L2-021, L2-026, L2-027, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`save-toggle.html`](../../design-system/components/save-toggle.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/not-found/artist`](../../mocks/pages/not-found/artist.html), [`notifications/saved-toast/with-action`](../../mocks/notifications/saved-toast/with-action.html), [`notifications/saved-toast/danger`](../../mocks/notifications/saved-toast/danger.html), and the dialogs and notifications drawn over Discover (see Usage) |
| Rendering | [`save-toggle.html`](save-toggle.html) |

## Purpose and scope

The save toggle is the round heart on a ticket and on the headliner. One press
adds the artist to Naomi's saved artists, another removes them, and the yellow
fill shows at a glance which artists are saved. It is the one round control in
a square system, so the heart means one thing across Zamaro.

`zm-save-toggle` is presentational. It shows the value it is given, reports a
press, and shows that a save is in flight. The app's `SavedArtistsStore`
decides what a press does (D-1).

Use something else when:

- there is room for words, as in the profile header → [button](button.md) with
  `pressed` ("Save" / "Saved");
- it toggles anything other than a saved artist → [button](button.md) with
  `pressed`, or a [chip](chip.md) for a filter.

Out of scope:

- Saving and unsaving: the optimistic update, the request, the revert on
  failure, the 200-artist limit and the guest's sign-in redirect with its
  pending intent (L2-026). The page or app store owns them.
- The confirmation and error toasts ("Saved Luz Viva" with Undo, "Couldn't save
  Luz Viva. Try again.") and the top-bar Saved count. The [toast](toast.md) and
  the [top bar](top-bar.md) own them.
- Raising the toggle above a card's stretched link. The [ticket](ticket.md) and
  [card](card.md) put their slots at `--z-raised`.
- Whether a toggle is shown at all (signed-in bookers and guests see it; an
  artist or administrator browsing does not). The page decides.

## Usage

The mocks render 103 save toggles on 7 screen groups. Each row is one
configuration; the API below builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` ticket stubs | in the [ticket](ticket.md) default slot | "Save Marcus Bell Trio to your saved artists", "Remove Hosanna Collective from your saved artists", "Save Daniel and Ruth Okonkwo to your saved artists" (6 tickets) | off, on (Hosanna Collective, Luz Viva), hover, focus | ticket surface |
| `pages/discover/default` headliner | last in the headliner's action cluster, after "See Abigail's profile" | "Remove Abigail Mensah from your saved artists" | on | headliner surface |
| `pages/saved/default` | in each saved ticket's stub, beside the actions slot | Abigail Mensah, Hosanna Collective, Luz Viva | on; pressing removes the ticket from the list | ticket surface |
| `pages/not-found/artist` similar artists | in up to 3 ticket stubs | "Save Elijah Park to your saved artists" | off | ticket surface |
| `notifications/saved-toast/success`, `with-action`, `info`, `warning` | the lineup behind the toast | "Remove Luz Viva from your saved artists" | on, just saved | ticket surface |
| `notifications/saved-toast/danger` | the lineup behind "Couldn't save Luz Viva. Try again." | "Save Luz Viva to your saved artists" | off, reverted | ticket surface |
| `dialogs/menu`, `dialogs/account-menu`, `notifications/system-banner/*` | the lineup behind the overlay | as Discover | inert behind a dialog; default behind a banner | ticket surface |
| Design system and [card](card.md) `[slot=aside]` | saved-artist card | "Remove Elijah Park from your saved artists" | on | card surface |
| Design system: states | standalone | Elijah Park, Abigail Mensah | busy (`aria-busy`), disabled | surface |
| A guest on Discover | as Discover, never pressed | "Save Abigail Mensah to your saved artists" | off; a press starts sign-in | ticket surface |

## Anatomy

1. **Circle** — `.save`, a native `<button type="button">`: 44 px
   (`--target-comfortable`), `--radius-full`, 2 px rule.
2. **Heart** — `zm-icon name="heart"` (`.icon`, 20 px stroke, `aria-hidden`).
   Outlined when off; filled (`fill: currentColor`) when on.
3. **Pressed fill** — butter yellow with an ink rule and an ink heart, the same
   pressed look as the profile's "Saved" button.
4. **Busy pulse** — `.save[aria-busy="true"] .icon` fades between full and 0.35
   opacity on `--duration-loop`.

Host: `zm-save-toggle` is `display: inline-flex; flex: none` and renders exactly
one `<button class="save">` carrying every attribute. It never shrinks inside a
cramped stub.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `artistName` | `string` | — | yes | The artist's display name, as on the ticket: "Daniel & Ruth Okonkwo". It goes into the accessible name, with " & " spoken as the catalogue's "and" (D-4). |
| `saved` | `boolean` | `false` | no | Writes `aria-pressed="true"` or `"false"`; the attribute is always present. Chooses the "Remove…" or "Save…" name. |
| `busy` | `boolean` (attribute) | `false` | no | Sets `aria-busy="true"` and `aria-disabled="true"`; never native `disabled`. While busy, activation is suppressed and focus stays. |
| `disabled` | `boolean` (attribute) | `false` | no | Native `disabled`. Ignored while `busy` is true. Used only where the list itself cannot act yet. |

### Outputs

| Output | Payload | Rule |
|---|---|---|
| `savedChange` | `boolean`, the requested value (`!saved`) | Emitted once per activation. Not emitted while `busy` or `disabled`. The toggle never changes its own `saved`; the store flips it at once (optimistic) and the toggle follows (D-2). |

A capture-phase listener stops the native `click` from reaching the host while
busy or disabled, so neither the toggle nor a stretched link behind it reacts.

### Text

The accessible names come from the catalogue through the `SAVE_TOGGLE_TEXT`
injection token, which the components library declares and each application
binds in its `app.config.ts` (D-3):

```ts
export interface SaveToggleText {
  /** "Save {name} to your saved artists" */
  save(name: string): string;
  /** "Remove {name} from your saved artists" */
  remove(name: string): string;
  /** "and", which replaces " & " in a spoken name */
  and: string;
}
export const SAVE_TOGGLE_TEXT = new InjectionToken<SaveToggleText>('SaveToggleText');
```

The Zamaro application binds it with transloco keys `saved.toggle.save`,
`saved.toggle.remove` and `common.and`. A toggle rendered without the token
throws a dev-mode error naming the token. The toggle has no other copy and no
visible text.

### Content slots

None. The heart is the only content; the toggle never shows a visible label.

## Variants and sizes

There is one variant with two values (off and on). What changes is where it
sits: a ticket stub, the headliner's cluster, a card's aside.

The toggle has one size: a `--target-comfortable` circle at every breakpoint and
under every pointer.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Off | `saved = false` | `--save-bg` surface, `--save-border` rule, outlined `--save-fg` heart | "Save Elijah Park to your saved artists, toggle button, not pressed" |
| On | `saved = true` | `--color-accent` fill, `--color-border-on-accent` rule, filled `--color-fg-on-accent` heart | "Remove Abigail Mensah from your saved artists, toggle button, pressed" |
| Hover | `:hover` under `(hover: hover)` | Scales to 1.08 on `--ease-spring`; no lift, no shadow | — |
| Active | `:active` | Scales to 0.94 | — |
| Focus | `:focus-visible` | Two-tone ring (`--focus-ring-width` in `--color-focus-ring` at `--focus-ring-offset` over `--color-focus-ring-offset`) around the circle's box | — |
| Busy | `busy = true` | The value has already flipped; the heart pulses; `cursor: progress`; colours kept | `aria-busy="true"`, `aria-disabled="true"`, focusable, name kept |
| Disabled | `disabled = true` | `--color-bg-subtle` fill, `--color-fg-disabled` rule and heart, no scale, `cursor: not-allowed` | Native `disabled`, out of the tab order |
| Reverted | the store flips `saved` back after a failure | Returns to the previous value | The page's error toast says so |
| Inside a focused ticket | the ticket's `:focus-within` | The ticket lifts while the toggle shows its ring | — |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

## Markup

Off and on:

```html
<zm-save-toggle>
  <button class="save" type="button" aria-pressed="false" aria-label="Save Marcus Bell Trio to your saved artists">
    <zm-icon name="heart">…</zm-icon>
  </button>
</zm-save-toggle>

<button class="save" type="button" aria-pressed="true" aria-label="Remove Luz Viva from your saved artists">…</button>
```

Busy, right after a press (already flipped), and disabled:

```html
<button class="save" type="button" aria-pressed="true" aria-busy="true" aria-disabled="true" aria-label="Remove Luz Viva from your saved artists">…</button>
<button class="save" type="button" aria-pressed="false" aria-label="Save Elijah Park to your saved artists" disabled>…</button>
```

A name with an ampersand:

```html
<button class="save" type="button" aria-pressed="false" aria-label="Save Daniel and Ruth Okonkwo to your saved artists">…</button>
```

Consumer templates:

```html
<zm-ticket …>
  <zm-save-toggle [artistName]="artist.name" [saved]="saved.has(artist.id)" [busy]="saved.pending(artist.id)" (savedChange)="saved.toggle(artist, $event)" />
</zm-ticket>

<!-- headliner: last in the cluster, after the profile link -->
<div class="cluster">
  <zm-badge variant="free">{{ freeLabel() }}</zm-badge>
  <zm-button-link variant="ink" [link]="profileLink()">…</zm-button-link>
  <zm-save-toggle [artistName]="headliner().name" [saved]="saved.has(headliner().id)" (savedChange)="saved.toggle(headliner(), $event)" />
</div>
```

```ts
// app.config.ts
{ provide: SAVE_TOGGLE_TEXT, useFactory: () => {
  const t = inject(TranslocoService);
  return { save: (name) => t.translate('saved.toggle.save', { name }), remove: (name) => t.translate('saved.toggle.remove', { name }), get and() { return t.translate('common.and'); } };
} }
```

The `.save` class, `aria-pressed`, `aria-busy` and the accessible name are a
contract: the e2e page objects find a toggle by role and name ("Save Marcus Bell
Trio to your saved artists") and read `aria-pressed`. The icon's internals are
free to change.

## Design

- Size `--target-comfortable` square, `--radius-full`, padding 0, content
  centred (`display: inline-grid; place-items: center`).
- Rule `--border-width-thick` solid `--save-border`.
- Heart: `zm-icon` at its default 20 px, stroke `currentColor`; filled when on
  through `--zm-icon-fill: currentColor`.
- Transitions: `transform` over `--duration-fast` on `--ease-spring`;
  `background` over `--duration-fast` on `--ease-standard`.
- Busy pulse: opacity to 0.35, `--duration-loop`, `--ease-standard`, infinite,
  alternate.
- Hover growth applies only under `(hover: hover)`, so a tap never leaves a
  grown circle behind on a touch screen.
- Clearance: at least `--space-2` from the price and the card edge. The
  [ticket](ticket.md) stub's padding and gap provide it.

Component tokens declared on `.save`:

| Token | Aliases | Overridden by |
|---|---|---|
| `--save-bg` | `--color-bg-surface` | on (`--color-accent`), disabled (`--color-bg-subtle`) |
| `--save-fg` | `--color-fg-default` | on (`--color-fg-on-accent`), disabled (`--color-fg-disabled`) |
| `--save-border` | `--color-border-strong` | on (`--color-border-on-accent`), disabled (`--color-fg-disabled`) |

A surface that needs a different look overrides these three tokens, not the
rules.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill (off) | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Rule (off) | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Heart (off) | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Fill (on) | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Heart and rule (on) | `--color-fg-on-accent` / `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Disabled fill / heart and rule | `--color-bg-subtle` / `--color-fg-disabled` | `--palette-ink-100` / `--palette-ink-400` | `--palette-ink-700` / `--palette-ink-600` |
| Focus ring / gap | `--color-focus-ring` / `--color-focus-ring-offset` | `--palette-ink-750` / `--palette-signal-500` | `--palette-signal-500` / `--palette-ink-900` |

The pressed toggle keeps butter yellow and the ink heart in both themes, so a
saved artist looks the same on paper and on the stage.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Circle rule on the ticket |
| `--color-fg-default` | `--color-bg-surface` | 3:1 | Heart (off) |
| `--color-fg-on-accent` | `--color-accent` | 3:1 | Heart (on) |
| `--color-border-on-accent` | `--color-bg-surface` | 3:1 | Pressed circle's edge in light (the ink rule) |
| `--color-accent` | `--color-bg-surface` | 3:1 | Pressed circle's edge in dark (the yellow fill) |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on the ticket |

The heart is a graphic, so 3:1 applies (WCAG 1.4.11). In dark the ink rule
merges into the charcoal ticket (about 1.2:1), so the pressed circle's edge is
its yellow fill instead; in light the yellow is too pale against paper and the
ink rule is the edge. Each theme passes on one of the two (D-9). The state never relies on
colour alone: the heart is outlined when off and filled when on. Disabled is
exempt as an inactive control. Under forced colours the rule is `CanvasText`,
the ring `Highlight`, and the filled heart still marks the pressed state.

## Responsive behaviour

- The same 44 px circle at every width; it never shrinks.
- In a ticket it moves with the stub: bottom-right below SM, at the bottom of
  the stub column from SM (the ticket owns this, L2-097).
- It keeps at least `--space-2` from the price and the edge, so a thumb aimed at
  the heart does not open the profile.
- At 320 px and at 200 % zoom the circle stays 44 px and nothing overlaps it.
- Touch devices get no hover growth.

## Accessibility

### Role and pattern

A native `<button type="button">` with `aria-pressed`, the toggle form of the
[APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/). Never a
checkbox: saving takes effect at once, it is not a form value. Never inside a
link: the ticket's stretched name link sits under it, not around it.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to the toggle in DOM order: after the ticket's name link and actions, or after "See Abigail's profile" on the headliner. A busy toggle stays in the order; a disabled one is skipped. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Emits `savedChange`. Focus stays on the toggle. Does nothing while busy or disabled. |

### Focus

The two-tone ring follows the square outline box around the circle, on
`:focus-visible` only. Becoming busy, the value flipping and a revert never move
focus. On Saved artists, where removing an artist removes the whole ticket,
the page moves focus to the next ticket's name link (the page's rule, recorded
here so the toggle never tries to keep focus on a destroyed element).

### Labelling

The icon is `aria-hidden`, so `aria-label` is the only name, and it always names
the artist. It says what pressing will do: "Save Elijah Park to your saved
artists" when off, "Remove Abigail Mensah from your saved artists" when on.
`aria-pressed` adds the state, so a screen reader says "Remove Abigail Mensah
from your saved artists, toggle button, pressed" (D-5).

### Announcements

None from the toggle. The page's toast announces the result politely ("Saved
Luz Viva", L2-109), and the top-bar Saved link updates ("Saved 3 artists").

### Motion

The grow and squeeze take `--duration-fast` on `--ease-spring`. Under
`prefers-reduced-motion: reduce` the duration tokens drop to near zero, so
scale changes are instant, and the busy pulse stops: the heart holds still at
full opacity while `aria-busy` and the toast carry the meaning (D-6).

## Content and internationalisation

- Off: "Save {artist} to your saved artists". On: "Remove {artist} from your
  saved artists".
- Use the artist's full display name, with "and" for "&": "Daniel and Ruth
  Okonkwo".
- Never a bare "Save": a screen-reader list of buttons on the lineup must not be
  seven identical names.
- Never a visible label beside the circle; where there is room for words, use
  the "Save" / "Saved" [button](button.md).
- The patterns and "and" come from the catalogue through `SAVE_TOGGLE_TEXT`
  (L2-111); the name is data. French names ("Enregistrer Luz Viva dans vos
  artistes") change only the accessible name, never the layout.

## Performance

- Change detection: `OnPush`, signal inputs. The accessible name is one
  `computed` from `artistName`, `saved` and the injected text; no `effect`, no
  subscriptions.
- Perf-test scenario: add `frontend/projects/perf-test/src/scenarios/SaveToggle.ts`,
  which renders Luz Viva's toggle, saved ("Remove Luz Viva from your saved
  artists"), with a static `SAVE_TOGGLE_TEXT` provider, and export it from
  `scenarios/index.ts`. Tune its iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios that include it once tickets and the headliner project
  it: `Lineup`, `Ticket`, `Headliner`, `DarkTheme`.
- Layout stability: the circle has a fixed size, so saving, busy and revert
  shift nothing (L2-086).
- Imports: Angular core and `zm-icon`. It must not import the app's store, the
  router or transloco.

## Acceptance criteria

### Rendering

- **AC-1** Given Marcus Bell Trio's ticket on Discover with `saved` false, when the toggle renders, then the host contains exactly one `<button type="button" class="save" aria-pressed="false">` named "Save Marcus Bell Trio to your saved artists" with an outlined heart. (L2-006)
- **AC-2** Given Luz Viva is saved, when the toggle renders, then it has `aria-pressed="true"`, a `--color-accent` fill, a `--color-border-on-accent` rule, a filled heart and the name "Remove Luz Viva from your saved artists". (L2-006)
- **AC-3** Given Daniel & Ruth Okonkwo's ticket, when the toggle renders, then its name is "Save Daniel and Ruth Okonkwo to your saved artists". (L2-102)
- **AC-4** Given Naomi's Saved artists page, when it renders, then each of the toggles for Abigail Mensah, Hosanna Collective and Luz Viva has `aria-pressed="true"`. (L2-027)
- **AC-5** Given the not-found page's similar artists, when they render, then each ticket carries a toggle named after its artist ("Save Elijah Park to your saved artists"). (L2-021)

### Behaviour

- **AC-6** Given Luz Viva's toggle with `saved` false, when Naomi activates it, then `savedChange` emits `true` once and the toggle keeps `aria-pressed="false"` until `saved` becomes true. (L2-026)
- **AC-7** Given the store flips `saved` to true at once and sets `busy`, when the toggle re-renders, then it has `aria-pressed="true"`, the name "Remove Luz Viva from your saved artists", `aria-busy="true"` and `aria-disabled="true"`, and no native `disabled`. (L2-026)
- **AC-8** Given a saved toggle, when Naomi activates it, then `savedChange` emits `false` once. (L2-026)
- **AC-9** Given a busy toggle, when it is clicked twice or Enter is pressed on it, then `savedChange` does not emit and no `click` reaches the host or the ticket behind it, so a double tap does not save and unsave. (L2-108)
- **AC-10** Given the save request fails and the store sets `saved` back to false, when the toggle re-renders, then it shows the outlined heart and the name "Save Luz Viva to your saved artists", and focus has not moved. (L2-026)
- **AC-11** Given a toggle inside a ticket, when Naomi activates it, then the profile does not open. (L2-006)

### States

- **AC-12** Given `disabled` true, when the toggle renders, then it has the native `disabled` attribute, the `--color-bg-subtle` fill and `--color-fg-disabled` rule and heart, does not scale on hover, and Tab skips it. (L2-101)
- **AC-13** Given `busy` and `disabled` both true, when it renders, then it is busy: focusable, `aria-disabled="true"` and no native `disabled`. (L2-108)

### Keyboard and focus

- **AC-14** Given the headliner's cluster, when Naomi tabs through it, then focus reaches "See Abigail's profile" and then the toggle "Remove Abigail Mensah from your saved artists". (L2-101)
- **AC-15** Given focus on a toggle, when Naomi presses Space, then `savedChange` emits once and focus stays on the toggle through busy and back; when she presses Enter, then the same happens. (L2-101)
- **AC-16** Given the toggle receives keyboard focus, when it is focused, then the two-tone ring is drawn around it and is not clipped by the ticket; given a mouse press, then no ring is drawn. (L2-101)

### Screen readers

- **AC-17** Given Abigail Mensah's saved toggle, when a screen reader reaches it, then it announces "Remove Abigail Mensah from your saved artists, toggle button, pressed" and does not announce the icon. (L2-102)
- **AC-18** Given the Discover lineup, when a screen reader lists the page's buttons, then every save toggle has a distinct name that includes its artist. (L2-102)
- **AC-19** Given a page with toggles off, on, busy and disabled in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-20** Given the dark theme, when toggles render, then an off toggle is a `--color-bg-surface` charcoal circle with a `--color-border-strong` rule and the on toggle keeps the `--color-accent` fill and an ink heart. (L2-104)
- **AC-21** Given both themes, when contrast is measured, then the off rule, the off heart and the on heart are each at least 3:1 against their backgrounds, the pressed circle's edge is at least 3:1 against the ticket (the ink rule in light, the yellow fill in dark), and the focus ring at least 3:1 against the ticket. (L2-103)

### Responsive

- **AC-22** Given a touch device at 360 px, when the toggle in a ticket stub is measured, then it is 44 × 44 CSS px, at least `--space-2` from the price and the ticket edge, and does not grow when tapped. (L2-096)
- **AC-23** Given a 320 px viewport and text zoomed to 200 %, when a ticket renders, then the toggle stays a 44 px circle and does not overlap the price or the name. (L2-096)
- **AC-24** Given the French catalogue bound to `SAVE_TOGGLE_TEXT`, when the toggle renders, then its accessible name is French and no code changed. (L2-111)

### Motion

- **AC-25** Given `prefers-reduced-motion: reduce`, when the toggle is hovered, pressed or busy, then it does not animate: no scale transition and no pulse. (L2-103)

### Performance

- **AC-26** Given the `SaveToggle` scenario and the `Lineup` composite, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The component is planned. To build it:

- Folder `frontend/projects/components/src/lib/save-toggle/`, files
  `save-toggle.ts` (class `SaveToggle`, selector `zm-save-toggle`),
  `save-toggle.scss` and `save-toggle-text.ts` (`SaveToggleText` and
  `SAVE_TOGGLE_TEXT`). Export all from `public-api.ts`.
- Add the `heart` path (`M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7
  10-7 10z`) to `zm-icon`.
- Copy the `.save` rules from `components.css` into `save-toggle.scss`, with the
  hover rule wrapped in `@media (hover: hover)` and the reduced-motion rule that
  stops the pulse.
- Add the capture-phase click guard used by `zm-button`, so busy and disabled
  presses never reach the host or the ticket.
- Bind `SAVE_TOGGLE_TEXT` in `projects/zamaro/src/app/app.config.ts` with the
  transloco keys above, and add `saved.toggle.save`, `saved.toggle.remove` and
  `common.and` to the catalogue.
- Project it into `zm-ticket` (default slot) and the headliner's cluster, and
  wire both to the app's `SavedArtistsStore`.
- Add `SaveToggle.ts` and export it from `scenarios/index.ts`.

## Decisions

- **D-1** *The save-artist design has `SaveToggleComponent` read the store itself. Does `zm-save-toggle`?* No. Every `zm-*` component lives in the components library (AGENTS.md), which knows nothing of app stores. The ticket CRD already projects `<zm-save-toggle [artistName] [saved] (savedChange)>`, so the toggle shows `saved` and reports presses, and the page passes the store's state in.
- **D-2** *Does the toggle flip itself?* No. It emits the requested value. The store applies the optimistic flip at once and reverts on failure (L2-026), so there is one owner of the value and a revert needs no special input.
- **D-3** *How do the translated names reach a component that only gets `artistName`?* Through the `SAVE_TOGGLE_TEXT` token bound in `app.config.ts`, as AGENTS.md has applications bind the API tokens. It keeps the ticket's API, keeps transloco out of the library, and saves 30 toggles on a page from each binding two translated labels.
- **D-4** *Who turns "&" into "and"?* The toggle, with the catalogue's word from `SAVE_TOGGLE_TEXT.and`. The design system requires "Daniel and Ruth Okonkwo" in the name, and doing it in one place means no consumer can forget.
- **D-5** *Changing name or fixed name?* Changing ("Save…" / "Remove…"), as the design system and every mock specify. The design system notes the APG preference for a fixed name and keeps the changing one unless testing says otherwise; this CRD follows the design system.
- **D-6** *Does the busy pulse run under reduced motion?* No. The design-system page says it keeps running, but its own `components.css` stops it with the note "under reduced motion every animation stops, status indicators included", and L2-103 says animations are disabled. The pulse lasts only as long as one request, and `aria-busy` and the toast carry the meaning.
- **D-7** *Busy wins over disabled?* Yes, as for the button. A busy control never drops focus to `<body>`.
- **D-8** *Disabled while the lineup loads?* The loading lineup shows skeleton tickets whose stub has a skeleton target, not a disabled toggle, so `disabled` appears only where the design system shows it. It stays in the API because the design system specifies it with every state.
- **D-9** *The pressed toggle's ink rule measures about 1.2:1 against the dark ticket. Is that a failure?* No. The rendering's contrast check showed it, and the requirement is that the circle's boundary is visible, which in dark is the yellow fill against charcoal (well above 3:1) and in light is the ink rule against paper. The CRD measures the edge that each theme actually draws, and keeps the ink rule in both themes so the pressed look stays the same on paper and on the stage.
