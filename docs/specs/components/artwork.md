# Artwork

| Field | Value |
|---|---|
| Selector | `zm-artwork` |
| Library path | `frontend/projects/components/src/lib/artwork/` |
| Status | built |
| Traces to | L2-006, L2-015, L2-020, L2-051, L2-072, L2-086, L2-088, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105 |
| Design system | [`artwork.html`](../../design-system/components/artwork.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/no-photos`](../../mocks/pages/artist/no-photos.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/saved/default`](../../mocks/pages/saved/default.html), [`pages/not-found/artist`](../../mocks/pages/not-found/artist.html), [`pages/book/default`](../../mocks/pages/book/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/edit-profile/video-processing`](../../mocks/pages/edit-profile/video-processing.html), [`pages/mfa-setup/default`](../../mocks/pages/mfa-setup/default.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`dialogs/photo-viewer/default`](../../mocks/dialogs/photo-viewer/default.html) |
| Rendering | [`artwork.html`](artwork.html) |

## Purpose and scope

Artwork is the frame for every picture of an artist. It prints the picture like
a gig poster: a halftone dot screen with a singer's or a group's silhouette cut
out of it until a photo arrives, and the photo itself in greyscale, multiplied
onto the paper. Placeholders and real photos sit side by side without looking
broken, and an artist with no photos keeps the silhouette as their act-type
illustration (L2-020).

The headliner, ticket, poster, video card, photo gallery, Book summary and Edit
profile all compose `zm-artwork`; none of them draws its own halftone.

Use something else when:

- it is a person who is not an artist (the booker's initials) → [avatar](avatar.md);
- it is an icon, logo or product illustration → [icon](icon.md);
- the picture is still loading and no placeholder should show → [skeleton](skeleton.md)
  (`.skeleton--portrait`, `--wide`, `--thumb`, `--thumb-lg`).

Out of scope:

- The grids around it: `.photo-grid` (2 → 4 columns) and `.media-grid` (1 →
  featured + 3). The page owns them; the [video card](video-card.md) owns its
  place in the media grid.
- What happens on activation. Artwork is never interactive; the link, button or
  video card around it owns hover, focus and the target.
- Choosing which photo is primary, the alt text and the rendition URLs. The API
  library maps the media record to the `photo` input.
- The full-size photo viewer dialog's controls (previous, next, close). The
  dialog renders a wide artwork inside its body.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/discover/default` headliner | `yellow`, portrait, `tag` "Headliner", `priority` (above the fold) | label "Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone"; primary photo when the API has one | placeholder, photo | headliner surface |
| `pages/discover/default` lineup, `pages/not-found/artist` similar artists | solo or `group`, `tilt` on every third, consumer class `ticket__art`, height from the ticket | label per artist ("Marcus Bell Trio, piano, upright bass and drums, under warm stage lights") | placeholder, photo | ticket surface |
| `pages/saved/default`, `pages/not-found/artist` | as the lineup, `yellow` for Abigail Mensah | label | placeholder | ticket surface |
| `pages/artist/default`, `pages/profile-preview/default` poster | `yellow`, portrait, `priority`, frame knob set to the stage colour | label | placeholder, photo | stage |
| `pages/artist/no-photos` poster | solo, portrait, frame on the stage | label "Solo vocalist illustration in place of Miriam Haile's photo" | act-type illustration | stage |
| `pages/artist/default`, `pages/artist/empty`, `pages/profile-preview/default` photo grid | `ratio="square"`, solo, `group`, `yellow` or `tilt`, decorative inside the page's "Open photo 1 of 4: …" link | none (no label) | placeholder, photo | canvas |
| `pages/artist/no-photos` gallery | `ratio="square"`, solo, the gallery's only square | label "Solo vocalist illustration: Miriam hasn't added photos yet" | act-type illustration | canvas |
| `pages/artist/default`, `pages/profile-preview/default`, `pages/admin-application/default` videos | `ratio="wide"`, solo, `group`, `tilt` or `yellow`, inside the video card's `<button>` | label "Abigail leading a full sanctuary, hands raised in the front rows"; poster frame as `photo` | placeholder, photo | canvas, panel |
| `pages/edit-profile/default`, `submitting`, `video-processing` and the dialogs over it (`add-photo`, `add-video`, `add-song`, `upload-check`, `account-menu/artist`, `menu/artist`) video rows | `ratio="wide"` (video card, manage mode) | label "No poster frame yet: Jireh is still processing" while processing | placeholder, photo | surface |
| `pages/edit-profile/default` primary photo | `thumb="lg"`, portrait, `yellow` for Abigail, plain for Miriam | label "Your primary photo: Abigail singing into a vintage microphone" | placeholder, photo | surface |
| `pages/edit-profile/default` photos | `ratio="square"`, `tag` "Primary" on the primary photo | label from the photo's alt text | placeholder, photo | surface |
| `pages/book/default`, `dialogs/add-church` | `ratio="square"`, `thumb="sm"`, `yellow` | label "Abigail Mensah singing into a vintage microphone" | placeholder, photo | stub surface |
| `dialogs/photo-viewer/default` | `ratio="wide"`, `priority` | label "Abigail at the microphone during a Sunday service"; full-size photo | placeholder, photo | dialog surface |
| `pages/mfa-setup/default` | `ratio="square"`, `thumb="lg"`, `plain` | label "QR code that adds Zamaro, naomi.fraser@riversidecc.ca, to an authenticator app"; the QR image as `photo` | photo | surface |
| `pages/discover/loading`, `pages/artist/loading` | not artwork: the page renders `zm-skeleton` (`portrait`, `wide`, `ticket__art`) | — | loading | canvas |
| Pages behind dialogs and toasts (`dialogs/menu`, `notifications/saved-toast`, `notifications/share-toast`, `dialogs/report-review`…) | as on the page behind | as on the page behind | inert | as on the page behind |

Every row is buildable with the API below.

## Anatomy

1. **Frame** — the host, `.art`. Square corners, `--border-width-thick` rule in
   `--color-border-strong`, `--space-3` inner padding, `overflow: hidden`. Its
   height comes from the ratio.
2. **Dot screen** — the host's background: a radial-gradient halftone in 0.6 rem
   cells, `--color-halftone-ink` on `--color-halftone-paper` (ink on yellow for
   `.art--yellow`, 0.85 rem cells for `.art--tilt`).
3. **Silhouette** — `.art::before`: a paper-coloured cut-out, one singer at a mic
   or a row of heads (`.art--group`). Hidden under `.art--plain`.
4. **Photo (optional)** — `.art > img` or `.art > picture > img`: fills the frame
   (`object-fit: cover`), greyscale and multiplied onto the paper.
5. **Tag (optional)** — `.art__tag`: an inverse label pinned bottom-left, mono
   overline, raised to `--z-raised` above the photo. "Headliner" or "Primary".

Host: `zm-artwork` is the frame itself. It carries `.art` and its modifiers, and
consumer classes (`ticket__art`) merge onto it. It is `display: grid` with
`place-items: end start`, so the tag sits bottom-left. Custom elements are
phrasing content, so the host is valid inside the video card's `<button>`.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'solo' \| 'group'` | `'solo'` | no | `group` adds `.art--group`: the group silhouette for duos, bands and choirs. |
| `ratio` | `'portrait' \| 'square' \| 'wide'` | `'portrait'` | no | Portrait is 4:5 and adds no class; `square` adds `.art--square` (1:1); `wide` adds `.art--wide` (16:9). |
| `thumb` | `'sm' \| 'lg' \| null` | `null` | no | `sm` adds `.art--thumb` (`--space-20` wide), `lg` adds `.art--thumb-lg` (`--space-32` wide). Both are `flex: none`. |
| `tilt` | `boolean` (attribute) | `false` | no | Adds `.art--tilt`, the coarser screen that tells neighbouring placeholders apart. |
| `yellow` | `boolean` (attribute) | `false` | no | Adds `.art--yellow`: ink dots on the accent. The headliner, and one gallery portrait at most. |
| `plain` | `boolean` (attribute) | `false` | no | Adds `.art--plain`: no dots, no silhouette, and the photo is drawn as-is (no greyscale, no multiply). Only for a machine-read image, the two-step QR code (D-6). |
| `tag` | `string` | `''` | no | Renders `.art__tag` when not empty: "Headliner", "Primary". |
| `label` | `string` | `''` | no | Describes the picture. Placeholder: host `role="img"` and `aria-label`. Photo: the `<img alt>`, and the host has no role. Empty: decorative; the host is `aria-hidden="true"` and a photo gets `alt=""`. |
| `photo` | `ArtworkPhoto \| null` | `null` | no | The photo. `null` shows the placeholder. |
| `priority` | `boolean` (attribute) | `false` | no | The photo is above the fold or the page's largest image: `loading="eager"` and `fetchpriority="high"`. Otherwise `loading="lazy"`. |

```ts
export interface ArtworkPhoto {
  /** Fallback rendition (WebP), for example `{media}/abigail-mensah-800.webp`. */
  src: string;
  /** Intrinsic size of `src`, written to the img so the frame never shifts. */
  width: number;
  height: number;
  /** WebP renditions with width descriptors: the 400, 800, 1200 and 1600 px widths (L2-051). */
  srcset?: string;
  /** AVIF renditions with the same widths; when set, a <picture> with an AVIF <source> wraps the img. */
  avifSrcset?: string;
  /** The rendered width per breakpoint. Required whenever `srcset` or `avifSrcset` is set. */
  sizes?: string;
}
```

The ticket CRD's photo shape (`{ src, srcset, width, height }`) is assignable to
`ArtworkPhoto`, so a ticket passes its photo straight through.

- Inputs are signal inputs; booleans use `booleanAttribute`.
- In dev mode, a `srcset` or `avifSrcset` without `sizes` logs a console error
  naming the component, because the browser would assume `100vw` and download
  the 1600 px rendition for an 80 px thumbnail.

`sizes` per placement, which the consumer passes:

| Placement | `sizes` |
|---|---|
| Headliner | `(min-width: 62rem) 20rem, (min-width: 48rem) 16rem, calc(100vw - 6rem)` |
| Poster | `(min-width: 62rem) 20rem, (min-width: 48rem) 15rem, min(18rem, 100vw)` |
| Ticket | `(min-width: 36rem) 9rem, 6.5rem` |
| Photo grid | `(min-width: 48rem) 25vw, 50vw` |
| Video, featured / others | `100vw` / `(min-width: 48rem) 33vw, 100vw` |
| Thumb sm / lg | `5rem` / `8rem` |
| Photo viewer | `min(100vw, 40rem)` |

### Outputs

None. Artwork is not interactive; the photo's failure is handled inside (see
States).

### Content slots

None. The tag is an input, so its position and layer stay fixed.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Solo (default) | — | A solo artist; the singer silhouette. |
| Group | `.art--group` | Duos, bands and choirs; the row of heads. |
| Tilt | `.art--tilt` | A neighbouring placeholder in a list, so two placeholders do not look identical. Combines with any variant. |
| Yellow | `.art--yellow` | The headliner's art and one gallery portrait at most. |
| Plain | `.art--plain` | The two-step QR code. Never for an artist. |
| With tag | `.art__tag` child | "Headliner" on the headliner, "Primary" on Edit profile. |

| Size | Modifier | Width | Height | Use |
|---|---|---|---|---|
| Portrait | — | fills its column | 4:5 | Headliner, poster, primary photo thumbnail |
| Square | `.art--square` | fills its column | 1:1 | Photo grid, Book summary thumbnail, QR code |
| Wide | `.art--wide` | fills its column | 16:9 | Video thumbnails, photo viewer |
| Ticket | consumer `.ticket__art` | 6.5 rem, 9 rem from SM | the ticket's height | Ticket art (the ticket's CSS sets it) |
| Thumb | `.art--thumb` | `--space-20` (80 px) | from the ratio | Book summary |
| Thumb large | `.art--thumb-lg` | `--space-32` (128 px) | from the ratio | Edit profile primary photo, QR code |

The silhouette narrows on wide art (34 % of the width, 60 % for a group) so it
keeps its proportions.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Placeholder | `photo = null` | Dot screen and silhouette | `role="img"`, `aria-label` = `label` |
| Photo loading | `photo` set, image not yet decoded | The placeholder shows through until the photo paints over it; nothing fades | `<img alt>` = `label` |
| Photo loaded | the img's `load` | Greyscale photo multiplied onto the paper (or the yellow) | `<img alt>` = `label`; the host has no role |
| Photo failed | the img's `error` | The img is removed and the placeholder shows; never a broken-image icon | The host takes `role="img"` and `aria-label` = `label` again |
| Decorative | `label = ''` | Unchanged | Host `aria-hidden="true"`; a photo gets `alt=""` |
| Plain | `plain = true` | Paper background, no dots or silhouette, photo drawn as-is | As for a photo |
| On the stage | consumer sets `--zm-art-border-color: var(--color-fg-on-stage)` | Paper frame | — |
| Frameless | consumer sets `--zm-art-border-width: 0` (inside `.card__media`) | No frame | — |
| Inside a control | a parent link, button or video card | The parent draws hover and focus around the frame | Inside a `<button>` the label is presentational; the button's own name carries it |

Artwork has no hover, focus, disabled or busy state of its own.

## Markup

Placeholder:

```html
<zm-artwork class="art art--group" role="img" aria-label="Hosanna Collective, five musicians on a lit stage with guitars and a drum kit"></zm-artwork>
```

Yellow with a tag:

```html
<zm-artwork class="art art--yellow" role="img" aria-label="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone">
  <span class="art__tag">Headliner</span>
</zm-artwork>
```

Photo, with AVIF and WebP:

```html
<zm-artwork class="art art--yellow">
  <picture>
    <source type="image/avif" srcset="{media}/abigail-mensah-400.avif 400w, {media}/abigail-mensah-800.avif 800w, {media}/abigail-mensah-1200.avif 1200w, {media}/abigail-mensah-1600.avif 1600w" sizes="(min-width: 62rem) 20rem, (min-width: 48rem) 16rem, calc(100vw - 6rem)">
    <img src="{media}/abigail-mensah-800.webp" srcset="{media}/abigail-mensah-400.webp 400w, …, {media}/abigail-mensah-1600.webp 1600w" sizes="(min-width: 62rem) 20rem, (min-width: 48rem) 16rem, calc(100vw - 6rem)" width="800" height="1000" alt="Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone" loading="eager" fetchpriority="high" decoding="async">
  </picture>
  <span class="art__tag">Headliner</span>
</zm-artwork>
```

Without `avifSrcset` the `<img>` is the host's direct child (`.art > img`).
Without `priority` the img has `loading="lazy"` and no `fetchpriority`.

Decorative, in the photo grid:

```html
<li><a href="/artists/abigail-mensah/photos/1" aria-label="Open photo 1 of 4: Abigail at the microphone during a Sunday service">
  <zm-artwork class="art art--square" aria-hidden="true"></zm-artwork>
</a></li>
```

Plain, the two-step QR code:

```html
<zm-artwork class="art art--square art--thumb-lg art--plain">
  <img src="data:image/svg+xml;…" width="128" height="128" alt="QR code that adds Zamaro, naomi.fraser@riversidecc.ca, to an authenticator app" loading="eager" fetchpriority="high" decoding="async">
</zm-artwork>
```

Consumer templates:

```html
<zm-artwork yellow priority [tag]="'lineup.headliner.tag' | transloco" [label]="artist.artLabel" [photo]="artist.photo" />
<zm-artwork class="ticket__art" [variant]="artist.artVariant" [tilt]="i % 3 === 2" [label]="artist.artLabel" [photo]="artist.photo" />
<zm-artwork ratio="square" [variant]="photo.artVariant" [photo]="photo.image" />
<zm-artwork ratio="square" thumb="sm" yellow [label]="artist.artLabel" [photo]="artist.thumbnail" />
<zm-artwork ratio="square" thumb="lg" plain [label]="'mfa.qr.label' | transloco: { email }" [photo]="qrImage()" />
```

The `.art*` classes are a contract: page objects find art by `.art`, and visual
tests compare it with the design system.

## Design

- Ratio 4:5 by default (`aspect-ratio`), 1:1 for `--square`, 16:9 for `--wide`.
- Padding `--space-3`, which places the tag; `display: grid; place-items: end
  start`.
- Frame `var(--zm-art-border-width)` solid `var(--zm-art-border-color)`, square
  corners, `overflow: hidden`.
- Dot screen: `radial-gradient(circle, var(--color-halftone-ink) 28%, transparent
  31%) 0 0 / 0.6rem 0.6rem` over `--color-halftone-paper`. The cell stays 0.6 rem
  at every size, so a bigger frame shows more dots, not bigger ones. `--tilt`
  sets 0.85 rem cells.
- Silhouette: `::before`, absolutely positioned, centred, bottom −8 %, 70 % wide
  (92 % for a group; 34 % and 60 % on wide art), `aspect-ratio: 1 / 1.25`, a
  `clip-path` polygon, filled with the paper colour (the accent for `--yellow`).
- Photo: `position: absolute; inset: 0; width: 100%; height: 100%; object-fit:
  cover; filter: grayscale(1) contrast(1.1); mix-blend-mode: multiply`.
- Plain: `background: var(--color-bg-surface)`, no `::before`, and the photo has
  `filter: none; mix-blend-mode: normal`.
- Tag `--text-overline`, `--letter-spacing-wide`, uppercase by CSS, padding
  `--space-1` `--space-2`, `--z-raised`.
- Thumbnails: width `--space-20` or `--space-32`, `flex: none`.
- No motion and no elevation of its own.

Component tokens:

| Token | Aliases | Overridden by |
|---|---|---|
| `--zm-art-border-color` | `--color-border-strong` | the poster on the stage (`--color-fg-on-stage`) |
| `--zm-art-border-width` | `--border-width-thick` | `.card__media` (0) |

These two are the public knobs. Never set a background on `.art` directly: it
replaces the dot screen and the silhouette. Re-skin with the two halftone tokens
or the modifiers.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Dots | `--color-halftone-ink` | per theme (mid grey) | per theme (light grey) |
| Paper, silhouette | `--color-halftone-paper` | per theme (bright paper) | per theme (raised charcoal) |
| Yellow paper | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Yellow dots | `--color-border-on-accent` | per theme (ink) | per theme (ink) |
| Tag fill / text | `--color-bg-inverse` / `--color-fg-inverse` | `--palette-ink-750` / `--palette-paper` | `--palette-ink-100` / `--palette-ink-750` |
| Frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Frame on the stage | `--color-fg-on-stage` | per theme (paper) | per theme (paper) |
| Plain background | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values. The yellow art and the tag look the
same in both themes. In the dark theme a multiplied photo darkens onto the
charcoal paper, which keeps photos from glowing on the stage.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-inverse` | `--color-bg-inverse` | 4.5:1 | Tag text |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Frame against a card |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Frame against the page |
| `--color-halftone-ink` | `--color-halftone-paper` | 3:1 | Dots, so the silhouette reads (decorative; WCAG 1.4.11 does not require it) |
| `--color-border-on-accent` | `--color-accent` | 3:1 | Yellow art dots (decorative) |

Forced colours: the frame keeps a `CanvasText` border, the dot screen and
silhouette drop out (backgrounds are removed), and the photo and the tag text
stay visible.

## Responsive behaviour

- Artwork is fluid: it fills its grid cell and keeps its ratio at every
  breakpoint. It has no breakpoints of its own; the headliner, poster, ticket,
  photo grid and media grid change its width.
- Thumbnails keep their fixed width beside text in a `nowrap` cluster, and never
  shrink at 320 px (L2-096).
- At 320 px nothing overflows: a portrait in the headliner is the column width,
  288 px or less, and its height follows. At 200 % zoom the frame grows with its
  column and the tag stays inside it.
- Artwork is never a touch target on its own; the parent control supplies the
  44 × 44 px target.

## Accessibility

### Role and pattern

A placeholder that stands for a photo is the host with `role="img"` and
`aria-label`. A real photo is an `<img alt>` inside a host with no role. Art that
only decorates (the photo grid square inside a labelled link, a repeated
thumbnail beside the same name) is `aria-hidden="true"` with no label and
`alt=""`. No APG widget pattern applies.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the artwork; it is never focusable. |

### Focus

None of its own. A parent link or button draws the ring around the whole frame;
the host never sets `outline`.

### Labelling

- The label describes the photo, not the placeholder: who, doing what, where,
  in one sentence, without "Image of" or "Photo of".
- The same label is kept when the photo arrives or fails, so the page reads the
  same either way.
- The tag inside a `role="img"` host is part of the image and is not read
  separately. If the tag matters, the label or nearby text says it.
- Inside a `<button>` (video card) the children are presentational, so the
  button's `aria-label` carries what matters.

### Announcements

None.

### Motion

None. The photo is not faded in: it paints over the placeholder when it decodes,
so there is nothing to reduce under `prefers-reduced-motion`.

## Content and internationalisation

- Labels: who, doing what, where. Name the artist the first time; later photos
  in the same gallery can say "Abigail" only. Groups give count and instruments
  ("five musicians on a lit stage with guitars and a drum kit").
- Act-type illustration labels say what stands in: "Solo vocalist illustration
  in place of Miriam Haile's photo".
- Pick the silhouette by the photo: `group` for duos, bands and choirs with more
  than one face; solo otherwise.
- Tags are one word, sentence case in the source, uppercase from CSS:
  "Headliner", "Primary". French tags ("Tête d'affiche") run longer and wrap
  inside the frame's padding.
- Translatable inputs: `tag`, and `label` when it is product copy (the
  act-type illustration, the QR code). Data values: `label` from the artist's
  alt text (5–150 characters, L2-051) and the `photo` URLs.

## Performance

- Change detection: `OnPush`, signal inputs. Computed values: the host classes,
  the role and label pair, and whether to render `<picture>`. One signal holds
  the photo's failed state and resets when `photo` changes. No subscriptions.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Artwork.ts`
  renders the headliner's yellow portrait with the "Headliner" tag and Abigail
  Mensah's label. Add `ArtworkPhoto.ts`, which renders the same art with a
  `photo` (an inline data-URL image, so the run needs no network).
- Composite scenarios that include it: `Ticket`, `Lineup`, `Headliner`,
  `VideoCard` and `MediaGrid` (the [video card](video-card.md)). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms.
- Layout stability: the frame's `aspect-ratio` (or the ticket's height) reserves
  the space before the photo loads, and the img has explicit `width` and
  `height`, so a photo arriving shifts nothing (L2-105).
- Images: AVIF and WebP `srcset`s from the CDN, `sizes` per placement, lazy
  unless `priority` (L2-088). The poster and the headliner are the pages'
  largest images and set `priority` for LCP (L2-086).
- Imports: Angular core only. No image library, no `NgOptimizedImage` (it would
  force its own loader and markup).

## Acceptance criteria

### Rendering

- **AC-1** Given Elijah Park's art with no photo and the label "Elijah Park seated on a stool with an acoustic guitar", when it renders, then the host has the class `art` and no modifier, a 4:5 ratio, the dot screen and the singer silhouette, `role="img"` and that `aria-label`. (L2-020)
- **AC-2** Given Hosanna Collective's art with `variant` group, when it renders, then the host has `.art--group` and shows the row-of-heads silhouette. (L2-020)
- **AC-3** Given Miriam Haile, who has no photos, when her profile renders, then the poster and the gallery's only square show the solo act-type illustration with the label "Solo vocalist illustration in place of Miriam Haile's photo" and no `<img>` and no broken image. (L2-020)
- **AC-4** Given `ratio` square in the photo grid and `ratio` wide on a video, when they render, then the hosts have `.art--square` (1:1) and `.art--wide` (16:9), and the wide silhouette is 34 % of the width. (L2-015)
- **AC-5** Given the yellow headliner art with `tag` "Headliner", when it renders, then it has `.art--yellow` with ink dots on the accent and an `.art__tag` reading "HEADLINER" pinned bottom-left. (L2-006)
- **AC-6** Given each variant, ratio, thumb size, tilt and plain combination in the design system's specimens, when the visual test captures them, then each matches the design-system rendering. (L2-096)
- **AC-7** Given the primary photo in Edit profile with `thumb` lg and `tag` "Primary" on a photo-grid square, when they render, then the thumbnail is 128 px wide and does not shrink, and the square shows "PRIMARY". (L2-051)

### Photos

- **AC-8** Given a `photo` with `avifSrcset`, `srcset`, `sizes`, `width` 800 and `height` 1000, when it renders, then the host contains a `<picture>` with an AVIF `<source>` and an `<img>` whose `srcset`, `sizes`, `width`, `height`, `decoding="async"` and `loading="lazy"` are set and whose `alt` is the label, and the host has no `role` or `aria-label`. (L2-088)
- **AC-9** Given the photo's renditions, when the srcsets are read, then each lists the 400, 800, 1200 and 1600 px widths with width descriptors. (L2-051)
- **AC-10** Given `priority` on the headliner or poster art, when it renders, then the img has `loading="eager"` and `fetchpriority="high"`. (L2-086)
- **AC-11** Given a photo URL that returns 404, when the img fires `error`, then the img is removed, the placeholder shows, the host takes `role="img"` with the same label, and no broken-image icon appears. (L2-020)
- **AC-12** Given a photo that loads after the page has painted, when it arrives, then the art's box does not move or resize and the cumulative layout shift it causes is 0. (L2-105)
- **AC-13** Given the two-step QR code in a `plain` art, when it renders in both themes, then the image shows with no greyscale filter, no multiply blend and no dots or silhouette behind it, so an authenticator app can scan it. (L2-072)

### Screen readers

- **AC-14** Given art with no `label` inside the "Open photo 1 of 4: Abigail at the microphone during a Sunday service" link, when the link is read, then only the link's name is announced: the host is `aria-hidden="true"` and a photo inside it has `alt=""`. (L2-015)
- **AC-15** Given the yellow headliner art with its tag, when a screen reader reads it, then it announces one image named "Abigail Mensah, eyes closed and one hand raised, singing into a vintage microphone" and does not read "Headliner" separately. (L2-102)
- **AC-16** Given a page with artwork in every state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Keyboard and focus

- **AC-17** Given a page with a placeholder, a photo and a decorative square, when the person tabs through it, then focus never lands on an artwork host. (L2-101)

### Theming

- **AC-18** Given the dark theme, when a placeholder renders, then its dots read `--color-halftone-ink` on `--color-halftone-paper`, while the yellow art and the tag look the same as in the light theme. (L2-104)
- **AC-19** Given the poster on the stage with `--zm-art-border-color` set to `--color-fg-on-stage`, when it renders, then the frame is paper-coloured in both themes. (L2-104)
- **AC-20** Given both themes, when contrast is measured, then the tag text is at least 4.5:1 on its fill and the frame at least 3:1 against both the card and the page. (L2-103)

### Responsive

- **AC-21** Given a 320 px viewport, when the headliner portrait, a ticket's art and a Book summary thumbnail render, then each keeps its ratio or fixed width, nothing overflows and the page does not scroll horizontally. (L2-096)

### Motion

- **AC-22** Given `prefers-reduced-motion: reduce` or not, when a photo replaces the placeholder, then nothing animates: there is no fade, transition or animation on the host, the img or the tag. (L2-103)

### Performance

- **AC-23** Given the `Artwork` and `ArtworkPhoto` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-artwork` with `variant`, `tilt`, `yellow`, `tag` and `label`.
To meet this CRD:

- Add the host class `art` (`host: { class: 'art' }`) and bind the modifiers as
  classes, so the e2e and visual contract holds. Today the styles hang on
  `:host` and the element has no `.art` class.
- Add `ratio` (`.art--square`, `.art--wide`, with the wide silhouette widths),
  `thumb` (`.art--thumb`, `.art--thumb-lg`), and `plain` (`.art--plain`).
- Change `label` to default `''` and keep the role logic in one `computed`:
  placeholder or failed photo → `role="img"` + `aria-label`; photo → no role;
  empty label → `aria-hidden="true"`.
- Add `photo` and `priority`: render `<picture>` when `avifSrcset` is set, else
  `<img>`, with the attributes in Markup; a `failed` signal set by `(error)` and
  reset when `photo` changes; a dev-mode console error when a srcset has no
  `sizes`.
- Read the frame from `var(--zm-art-border-width, var(--border-width-thick))`
  and `var(--zm-art-border-color, var(--color-border-strong))`.
- Add the photo rule (`object-fit`, greyscale, multiply), the plain overrides and
  a forced-colours rule (`@media (forced-colors: active)`: `border-color:
  CanvasText`).
- Add the `ArtworkPhoto.ts` perf-test scenario and export it from
  `scenarios/index.ts`.
- `zm-ticket` renders its photo as its own `<img class="ticket__art">`
  (ticket CRD D-4). The print treatment (greyscale, multiply) lives on
  `.art > img`, so a ticket photo only looks like the rest of the product when
  it is passed to `zm-artwork`'s `photo`. See D-1.

## Decisions

- **D-1** *Where does a photo go: inside the artwork or in place of it?* Inside: `zm-artwork` renders the `<img>` in `.art`, as the design system specifies ("an `<img alt>` inside `.art`"), so every photo gets the same frame, print treatment and failure fallback. The ticket's photo shape is assignable to `ArtworkPhoto`; the ticket can hand its `photo` through and keep the `.ticket__art` class on the artwork host.
- **D-2** *Which formats, and how?* AVIF and WebP through a `<picture>` when the API supplies both, a plain `<img srcset>` with WebP otherwise. The design system's code sample uses `<picture>` with both, and L2-051 produces both; L2-088 requires one of them with `srcset`. Optional `avifSrcset` keeps the ticket's simpler shape valid.
- **D-3** *Who supplies `sizes`?* The consumer, per placement, from the table in API. Only the consumer knows the rendered width; a default of `100vw` would download the 1600 px rendition for an 80 px thumbnail, so a missing `sizes` is a dev-mode error.
- **D-4** *Fade the photo in?* No. The design system allows either a skeleton or keeping the placeholder and fading; keeping the placeholder under the photo with no fade gives the same no-shift result with no motion to reduce and no extra state.
- **D-5** *Does artwork have a loading input?* No. The pages that load before they know an artist (Discover, the profile) render `zm-skeleton` with the matching ratio, as the mocks do. When the artist is known and only the photo is pending, the placeholder is the loading state.
- **D-6** *How does the two-step QR code use artwork?* With a new `plain` modifier. The mock puts the QR in a square 128 px art frame, but the print treatment would multiply the QR's white modules onto the dot screen and could stop it scanning. `.art--plain` keeps the frame and size and drops the dots, silhouette and photo filter. It is not in `components.css` yet; the design-system page should add it.
- **D-7** *How does the poster put a paper frame on the stage, and the card media drop it?* Through `--zm-art-border-color` and `--zm-art-border-width`, which follow AGENTS.md's `--zm-` rule for component knobs. The design system draws both with parent selectors (`.artist-poster > .art`, `.card__media > .art`) that cannot reach an encapsulated component's styles reliably.
- **D-8** *Is `label` required?* No. Empty means decorative, which the photo grid needs inside its labelled links. Every other placement passes a label; the CRDs of the headliner, ticket and video card make it required on their side.
- **D-9** *Is the tag a slot or an input?* An input. It is one word of text in a fixed place and layer; a slot would invite badges or icons the design system does not allow.
- **D-10** *Does a duo get the solo or the group silhouette?* The group. The design system says the group silhouette is for "a duo, band or choir"; the content rule says "more than one face", and a duo has two.
