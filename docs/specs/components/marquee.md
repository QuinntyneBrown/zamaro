# Marquee

| Field | Value |
|---|---|
| Selector | `zm-marquee` |
| Library path | `frontend/projects/components/src/lib/marquee/` |
| Status | built |
| Traces to | L2-004, L2-012, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-105 |
| Design system | [`marquee.html`](../../design-system/components/marquee.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), and the dialogs and notifications drawn over those pages (see Usage) |
| Rendering | [`marquee.html`](marquee.html) |

## Purpose and scope

The marquee is the yellow bill under a gig poster: one strip of city names on
Discover, or of the first five songs an artist leads on their profile
(L2-012). It closes the stage with a printed rule. It is decoration only: it
never moves, never holds a link, and is hidden from assistive technology,
because it only repeats what the page already says accessibly (the location
field and quick-pick cities, the setlist).

Use something else when:

- it announces something → a [banner](alert.md) or a [toast](toast.md);
- it links somewhere → the [top bar](top-bar.md) or a [list](list.md);
- it lists the songs with their details → the [setlist](setlist.md).

Out of scope:

- Choosing the items: the page passes the eleven quick-pick cities on Discover,
  or the first five setlist songs in setlist order on a profile. The marquee
  never slices, sorts or repeats the list.
- The loading placeholder. While a profile loads, the page renders a
  [`zm-skeleton shape="strip"`](skeleton.md) in the marquee's place.
- Its placement: directly after the poster, outside `.container`, at most once
  per page. The page owns the order.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default`, `empty`, `error`, `invalid`, `limited`, `loading` | default | 11 cities: "Toronto", "Burlington", "Mississauga", "Brampton", "Hamilton", "Markham", "Ajax", "Oshawa", "Barrie", "Kitchener", "Niagara" | default (clipped at the edge), unchanged in every page state | full bleed under the stage poster |
| `pages/artist/default`, `booked-date`, `no-photos`; `pages/profile-preview/default` | default | 5 songs: "Way Maker", "Goodness of God", "Great Is Thy Faithfulness", "Jireh", "Blessed Assurance" | default | full bleed under the artist poster |
| `pages/artist/empty`, `pages/profile-preview/empty` | default | Miriam Haile's 4 songs: "Goodness of God", "It Is Well With My Soul", "Abide With Me", "Firm Foundation" | short list | full bleed under the artist poster |
| `pages/artist/loading` | not rendered; `zm-skeleton shape="strip"` holds its place | — | loading | between stage and content |
| An artist with no setlist yet | `items` empty | — | empty: not rendered | — |
| `dialogs/menu`, `dialogs/account-menu`, `dialogs/photo-viewer`, `dialogs/report-review/*`, `notifications/saved-toast/*`, `notifications/share-toast/*`, `notifications/system-banner/*` | as on the page behind | as on the page behind | inert behind a dialog or under a banner | as on the page |
| Design system only | `variant="stage"` | songs or cities | default, short list | on or between charcoal surfaces |

## Anatomy

1. **Strip** — the host, `.marquee` (`.marquee--stage` for the stage variant).
   Full width, `--color-accent` fill, `--border-width-thick` rules top and
   bottom, `--space-3` vertical padding. Never wraps; clipped at the edge with
   `overflow: hidden`.
2. **Item** — one `<span>` per city or song, `--space-5` side padding,
   `display: inline-block`, in `--text-h4` uppercase with
   `--letter-spacing-wide`.
3. **Separator** — a typed " ✦" at the end of every item except the last,
   inside the item's span, so it never starts the strip or follows the last
   item.
4. **Clipped edge** — no fade, no scroll; the text runs off the right edge.

Host: `zm-marquee` is the strip itself. It carries `.marquee`,
`aria-hidden="true"` and `display: block`, and renders the item spans directly
inside it.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `items` | `readonly string[]` | — | yes | One span per entry, in the given order. An empty array renders nothing and hides the host (`hidden`). Duplicates are allowed and rendered (tracked by index). |
| `variant` | `'default' \| 'stage'` | `'default'` | no | `'stage'` adds `.marquee--stage`: charcoal strip with `--color-accent-on-stage` type and rules. |

### Outputs

None. The marquee is not interactive.

### Content slots

None. Items arrive through `items` so the separator rule is applied by the
component, never typed by a consumer.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | — | Under the poster on Discover and on profiles: butter yellow with ink type and rules, in both themes. |
| Stage | `.marquee--stage` | A strip that sits on or between charcoal surfaces, so the page does not get a second yellow band. |

One size: one line of `--text-h4` (`--font-size-xl`, line height 1) plus
2 × `--space-3` padding and 2 × `--border-width-thick` rules, 50 px tall. The
width is always the viewport's: the page places it outside `.container`.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | `items` longer than the viewport | Items run off the right edge, clipped | Hidden (`aria-hidden="true"`) |
| Short list | few items (Miriam's four songs) | The rest of the strip is empty yellow; nothing repeats to fill it | Hidden |
| Empty | `items` is empty | Host has `hidden`; nothing renders, no empty strip | Not in the tree |
| Loading (page) | the page shows `zm-skeleton shape="strip"` instead | Strip-height skeleton | Hidden |
| Inert | a dialog is open over the page | Unchanged | Not reachable |

No hover, focus, active, disabled or busy states: nothing inside is
interactive.

## Markup

Rendered by `zm-marquee`:

```html
<zm-marquee class="marquee" aria-hidden="true">
  <span>Way Maker ✦</span><span>Goodness of God ✦</span><span>Great Is Thy Faithfulness ✦</span><span>Jireh ✦</span><span>Blessed Assurance</span>
</zm-marquee>
```

Stage variant and empty:

```html
<zm-marquee class="marquee marquee--stage" aria-hidden="true"><span>Jireh ✦</span><span>Way Maker</span></zm-marquee>
<zm-marquee class="marquee" aria-hidden="true" hidden></zm-marquee>
```

No whitespace text nodes between spans: the side padding alone spaces the
items, so the strip matches the design-system rendering exactly.

Consumer templates:

```html
<zm-poster …>…</zm-poster>
<zm-marquee [items]="quickPickCities" />
```

```html
@if (profile(); as artist) {
  <zm-marquee [items]="artist.setlist.slice(0, 5).map(song => song.title)" />
} @else {
  <zm-skeleton shape="strip" />
}
```

(The page computes the five titles in a `computed`, not in the template; the
`slice` above shows the rule.)

The `.marquee` class and `aria-hidden="true"` are a contract for the visual
and a11y tests.

## Design

- Strip: `padding-block: --space-3`; `border-block: --border-width-thick solid`;
  `overflow: hidden`; `white-space: nowrap`.
- Type: `--text-h4`, `line-height: 1`, uppercase, `--letter-spacing-wide`. The
  source copy keeps the song's own capitalisation ("Great Is Thy
  Faithfulness").
- Item: `display: inline-block`, `padding-inline: --space-5`.
- No motion, no shadow, no layer.
- No component tokens. To re-skin, override the semantic tokens on the strip or
  an ancestor; never set a raw colour on `.marquee`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Strip fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Type | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Rules | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Stage fill | `--color-bg-stage` | `--palette-ink-850` | `--palette-ink-950` |
| Stage type and rules | `--color-accent-on-stage` | `--palette-signal-500` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Type on the yellow strip |
| `--color-border-on-accent` | `--color-bg-canvas` | 3:1 | Light: ink rule against the page |
| `--color-accent` | `--color-bg-canvas` | 3:1 | Dark: yellow strip against the page |
| `--color-accent-on-stage` | `--color-bg-stage` | 4.5:1 | Stage variant type |

Hidden text is still read by sighted people, so the strip meets text contrast.
Under forced colours the browser repaints the strip with system colours; the
rules use `CanvasText` like every border.

## Responsive behaviour

- The strip spans the viewport edge to edge at every breakpoint; type and
  padding never change.
- Text never wraps. About two cities show at 360 px and about nine at 1280 px,
  so the list is ordered for its first two items to make sense alone
  ("Toronto ✦ Burlington ✦").
- `overflow: hidden` clips the strip, so even eleven cities never cause
  horizontal page scroll at 320 px (L2-096).
- At 200 % zoom the strip grows to two lines' height of its one line of type
  and still clips; nothing it says is lost, because the same content is on the
  page.
- Nothing to tap: the strip does not intercept pointer or scroll gestures.

## Accessibility

### Role and pattern

A plain block with `aria-hidden="true"`: no role, no label, no heading. No APG
pattern applies. It is hidden because it repeats content (eleven city names
before the lineup), because each "✦" would be read as "four-pointed star", and
because part of it is clipped off-screen.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Skips the marquee. It never contains anything focusable. |

### Focus

Nothing inside takes focus, so there is no focus style.

### Labelling

None. The same information exists accessibly: the location and radius fields
and the quick-pick cities for Discover, the [setlist](setlist.md) for songs.

### Announcements

None.

### Motion

None, by design: no CSS animation and no `<marquee>` element. A scrolling
strip would need a pause control (WCAG 2.2.2) and would distract from the
lineup (L2-103).

## Content and internationalisation

- **Cities**: the eleven quick-pick cities of L2-004, region anchor first:
  Toronto, Burlington, Mississauga, Brampton, Hamilton, Markham, Ajax, Oshawa,
  Barrie, Kitchener, Niagara. City name only, no province.
- **Songs**: the first five songs of the setlist, in setlist order, title only,
  no writer or key (L2-012). Fewer when the setlist is shorter (Miriam's four).
- Every item but the last ends in " ✦". No commas, counts or prices. Never put
  anything in the strip that is not elsewhere on the page.
- Data values: song titles come from the artist's setlist; city names come from
  the same catalogue entries the quick-pick chips use, so a French catalogue
  that renames a city renames it in both (L2-111). The separator glyph is not
  copy and is the same in every language.

## Performance

- Change detection: `OnPush`, signal inputs; the host class and `hidden` from
  one `computed`. No subscriptions, no `effect`.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Marquee.ts`
  renders the eleven Discover cities. Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep it at roughly
  100–300 ms.
- Composite scenarios: `DarkTheme`.
- Layout stability: the strip's height is fixed by its type and padding and
  equals `.skeleton--strip`, so the song strip replaces its skeleton without
  moving the sections below (L2-105).
- Imports: Angular core only.

## Acceptance criteria

### Rendering

- **AC-1** Given `items` with the eleven Discover cities, when the marquee renders, then the host has `.marquee` and `aria-hidden="true"` and contains eleven spans, "Toronto ✦" first and "Niagara" last with no separator. (L2-004)
- **AC-2** Given Abigail Mensah's setlist, when her profile renders the marquee with its first five titles, then the spans read "Way Maker ✦", "Goodness of God ✦", "Great Is Thy Faithfulness ✦", "Jireh ✦" and "Blessed Assurance", in that order. (L2-012)
- **AC-3** Given Miriam Haile's four songs, when her profile renders, then the strip shows four items and leaves the rest of the strip empty yellow, with no item repeated. (L2-012)
- **AC-4** Given an artist with no setlist, when the profile renders the marquee with an empty `items`, then the host has `hidden` and takes no space. (L2-012)
- **AC-5** Given `variant="stage"`, when the marquee renders, then the host has `.marquee.marquee--stage`, a `--color-bg-stage` fill and `--color-accent-on-stage` type and rules. (L2-104)

### States

- **AC-6** Given the profile loading with `zm-skeleton shape="strip"` in the marquee's place, when the marquee replaces it, then the marquee's height equals the skeleton's (50 px) and the content below does not move. (L2-105)
- **AC-7** Given Discover in its loading, empty, error and invalid states, when each renders, then the city marquee is present and unchanged. (L2-004)

### Keyboard and focus

- **AC-8** Given Discover, when the booker tabs from the "Show the lineup" button, then focus goes to the next focusable element after the marquee and never inside it. (L2-101)

### Screen readers

- **AC-9** Given Discover read by a screen reader, when it moves from the search form to the lineup, then no city name or "four-pointed star" from the marquee is announced. (L2-100)
- **AC-10** Given pages with a marquee in both themes, when axe-core runs, then there are zero serious or critical violations from it. (L2-100)

### Theming

- **AC-11** Given the dark theme, when the default marquee renders, then it stays `--color-accent` with `--color-fg-on-accent` type and `--color-border-on-accent` rules, as in the light theme. (L2-104)
- **AC-12** Given both themes, when contrast is measured, then the type on the strip is at least 4.5:1, the stage variant's type at least 4.5:1, and the strip's edge against the page at least 3:1. (L2-103)

### Responsive

- **AC-13** Given a 320 px viewport, when Discover renders eleven cities, then the strip is clipped at the edge, its text does not wrap, and the page does not scroll horizontally. (L2-096)
- **AC-14** Given a 360 px viewport, when the marquee renders, then "Toronto ✦" and "Burlington ✦" are fully visible. (L2-096)

### Motion

- **AC-15** Given any motion preference, when the marquee has been on screen for ten seconds, then no item has moved and no animation or transition is applied. (L2-103)

### Performance

- **AC-16** Given the `Marquee` scenario, when the perf test runs against the base branch with `--fail-on-regression`, then it is not flagged as a possible regression and renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The library has `zm-marquee` with `items`. To meet this CRD:

- Add the host class `marquee` so the e2e class contract holds, and keep
  `aria-hidden="true"`.
- Add `variant` with `.marquee--stage` and its colours.
- Hide the host (`[attr.hidden]`) when `items` is empty.
- Track items by `$index`, not by value, so duplicate titles do not throw.
- Make sure the template emits no whitespace text between spans (keep the
  `@for` body on one line or use `preserveWhitespaces: false`, the default).
- Keep the `Marquee.ts` scenario as it is.

## Decisions

- **D-1** *Who decides which songs and how many?* The page. L2-012 says the first five setlist songs; the marquee renders what it is given, so the same component serves the eleven cities without a limit input.
- **D-2** *Should an empty list render an empty strip?* No. The design system says to leave the marquee out when there is nothing to repeat; hiding the host on an empty array lets the page bind the setlist directly without an `@if`.
- **D-3** *Does the stage variant ship though no mock uses it?* Yes. The design system specifies it for strips between charcoal surfaces; shipping it now keeps the `variant` union stable.
- **D-4** *Items as an input or as projected spans?* An input. The separator rule (every item but the last) is the component's job; projected spans would make every consumer type the " ✦" correctly.
- **D-5** *Is the separator translatable copy?* No. "✦" is a printed ornament, hidden from assistive technology, and the same in every language, so it is the one character the component writes itself.
