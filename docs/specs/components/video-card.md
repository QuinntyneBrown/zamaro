# Video card

| Field | Value |
|---|---|
| Selector | `zm-video-card` |
| Library path | `frontend/projects/components/src/lib/video-card/` |
| Status | planned |
| Traces to | L2-014, L2-052, L2-086, L2-087, L2-088, L2-096, L2-098, L2-100, L2-101, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`video-card.html`](../../design-system/components/video-card.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/edit-profile/video-processing`](../../mocks/pages/edit-profile/video-processing.html), [`pages/edit-profile/submitting`](../../mocks/pages/edit-profile/submitting.html) |
| Rendering | [`video-card.html`](video-card.html) |

## Purpose and scope

Bookers want to see an artist lead a room before they book. The video card is
one clip in the "Watch her lead" section of a profile: a wide halftone
thumbnail (or the clip's poster frame) with a yellow "Play · 6:12" stamp and a
muted caption under it. Pressing the thumbnail plays the clip in place, in the
same 16:9 frame, with the browser's own controls and captions when the artist
supplied them. It never leaves the page and never autoplays (L2-014).

The same card, in `manage` mode, is the artist's own list of uploads in Edit
profile: the thumbnail, a caption that ends with the upload status ("Live",
"Processing", "Failed"), a Remove button and, for a failed upload, the reason.
It does not play there.

Use something else when:

- it is a still photo → [artwork](artwork.md) in the page's `.photo-grid`;
- it links to an outside channel → [link](link.md);
- the artist has no videos → the page shows a quiet [empty state](empty-state.md)
  ("No videos yet", L2-020);
- it is an upload in progress → the add-video dialog's [progress bar](progress-bar.md).

Out of scope:

- The `.media-grid` list around the cards, its `role="list"`, the `<li>`s and the
  featured first item spanning the row. The page owns them.
- Which videos are shown: still-processing videos are left out of the public
  profile by the page and the API (L2-014).
- Ordering, uploading, transcoding and caption upload (L2-052). The card shows
  what the API returns.
- The Remove action and its confirmation. The page projects the button and
  handles it.
- Formatting the duration and composing the strings. The page passes formatted,
  translated strings.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default` "Watch her lead", first item | `play`, group art, the featured card (the grid spans it across the row from MD) | stamp "Play · 6:12", caption "Way Maker — live at Bethel Pentecostal, Hamilton", label "Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds" | default, hover, focus, active, busy, playing, failed | canvas |
| `pages/artist/default`, items 2–4 | `play`, art solo, `tilt` or `yellow` | "Play · 4:40" "Great Is Thy Faithfulness — acoustic"; "Play · 8:05" "Twi praise medley — Harvest Sunday 2025"; "Play · 5:30" "Goodness of God — women's retreat, Muskoka" | as above | canvas |
| `pages/artist/booked-date`, `pages/profile-preview/default` | as the profile | as the profile | as the profile | canvas |
| `pages/admin-application/default`, `approved`, `verified` "Videos" panel | `play`, solo art, the only item | "Play · 5:48", "Way Maker — live at Cornerstone", label "Play Way Maker, live at Cornerstone, 5 minutes 48 seconds" | default, playing | panel surface |
| `pages/artist/loading` | not rendered; the page shows a `.skeleton--wide` in its place | — | loading | canvas |
| `pages/artist/empty` | not rendered; the page shows the empty state | — | empty | canvas |
| `pages/edit-profile/default` (and `dialogs/add-video`, `add-photo`, `add-song`, `upload-check`, `account-menu/artist`, `menu/artist`, which show it behind) | `manage`, art as on the profile | caption "Way Maker — live at Bethel Pentecostal, Hamilton · 6:12 · Live"; actions: sm "Remove" labelled "Remove the Way Maker video" | live | form-section surface |
| `pages/edit-profile/video-processing` | `manage`, plain art labelled "No poster frame yet: Jireh is still processing" | caption "Jireh — live at Living Waters, Brampton · 7:42 · Processing"; Remove | processing | form-section surface |
| `pages/edit-profile/video-processing` | `manage`, plain art labelled "No poster frame: O Holy Night did not process" | caption "O Holy Night — carol service 2025 · 16:20 · Failed"; Remove; error "Longer than 15 minutes. Trim it and upload it again." | failed | form-section surface |
| `pages/edit-profile/submitting` | `manage` | Remove projected `disabled` while the form saves | submitting | form-section surface |
| Dialogs and toasts over a profile or application (`dialogs/photo-viewer`, `dialogs/report-review`, `dialogs/reject-application`, `notifications/share-toast`) | as the page behind | as the page behind | inert behind the dialog | canvas |
| Design system | `play`, halftone and yellow art | as the profile | hover, focus, active, busy, failed, both themes | canvas |

Every row is buildable with the API below.

## Anatomy

Play mode:

1. **Button** — `.video`: a native, unstyled, full-width `<button type="button">`;
   the whole thumbnail is the target.
2. **Thumbnail** — `zm-artwork` with `ratio="wide"`: `.art.art--wide` plus the art
   modifiers; the poster frame as its photo when the API has one.
3. **Play stamp** — `.video__play`: yellow label with a 2 px ink rule, pinned
   `--space-4` from the bottom-left, "Play · 6:12". A spinner follows the text
   while busy.
4. **Caption** — `.video__caption`: song and setting, muted, outside the button.
5. **Player** — `.video__player`: a native `<video controls>` that takes the
   button's place in the same 16:9 frame once the clip plays.
6. **Failure message** — `.inline-msg.inline-msg--danger` under the frame, with the
   alert icon, "This video didn't load. Press play to try again."

Manage mode:

1. **Thumbnail** — `zm-artwork` `ratio="wide"`, not inside a button.
2. **Row** — `.video__row`: a `.cluster.cluster--between` with the caption on the
   left and the actions on the right.
3. **Caption** — `.video__caption`, including the duration and status.
4. **Actions** — the `[slot=actions]` content (Remove).
5. **Error** — the `[slot=error]` content (a `p.field__error`).

Host: `zm-video-card` is `display: block` and sits inside the page's `<li>`. It
never renders the `<li>`, so the page owns the list.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `mode` | `'play' \| 'manage'` | `'play'` | no | `play` renders the button and player; `manage` renders the thumbnail, row and slots, and never plays. |
| `caption` | `string` | — | yes | "Way Maker — live at Bethel Pentecostal, Hamilton". In manage mode it ends with duration and status: "… · 6:12 · Live". |
| `stampText` | `string` | `''` | in `play` | "Play · 6:12". The visible stamp. |
| `label` | `string` | `''` | in `play` | The button's `aria-label`: "Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds". Must start with the stamp's first word (WCAG 2.5.3). |
| `artVariant` | `'solo' \| 'group'` | `'solo'` | no | Passed to `zm-artwork` `variant`. |
| `artTilt` | `boolean` | `false` | no | Passed to `zm-artwork` `tilt`. |
| `artYellow` | `boolean` | `false` | no | Passed to `zm-artwork` `yellow`. |
| `artLabel` | `string` | — | yes | Describes the thumbnail: "Abigail leading a full sanctuary, hands raised in the front rows", or "No poster frame yet: Jireh is still processing". Passed to `zm-artwork` `label`. |
| `poster` | `ArtworkPhoto \| null` | `null` | no | The poster frame (L2-052). Passed to `zm-artwork` `photo` and used as the player's `poster`. `null` keeps the halftone. |
| `stream` | `string \| null` | `null` | in `play` | The HLS manifest URL of the adaptive renditions (L2-052). |
| `captions` | `{ src: string; srclang: string; label: string } \| null` | `null` | no | The artist's WebVTT file. Rendered as a `<track kind="captions" default>`. |
| `errorText` | `string` | `''` | in `play` | "This video didn't load. Press play to try again." Shown after a failure. |

`ArtworkPhoto` is the type exported by the artwork component:
`{ src: string; width: number; height: number; srcset?: string; sizes?: string; avifSrcset?: string }`.

Inputs are signal inputs; booleans accept bare attributes (`booleanAttribute`).
Every user-facing string is an input; the component holds no copy (L2-111).

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `played` | `void` | The clip's first `playing` event after a press. Pages may use it for analytics. |
| `failed` | `void` | Loading failed or stalled (see States), once per attempt. |

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| `[slot=actions]` | `zm-button` `size="sm"` ("Remove") | Manage mode only, in `.video__row` after the caption. Ignored in play mode. |
| `[slot=error]` | one `p.field__error` with an `id` | Manage mode only, under the row. Its wrapper always renders and is hidden with `:empty`. The consumer passes the same `id` to the Remove button's `describedBy`. |

Each slot is declared once, outside the `@if` on `mode`: the row's actions
wrapper and the error wrapper render in both modes and are hidden in play mode,
so projection never depends on a branch (AGENTS.md).

### Playback service

`VideoPlayback` (root-provided, in the same folder) makes sure one clip plays at
a time: when a card starts playing it pauses whichever card was playing.

`ZM_HLS_LOADER` (an `InjectionToken<() => Promise<HlsAttacher>>` in the same
folder) loads the streaming library on demand. Its default factory does a
dynamic `import('hls.js')`. Tests and the perf-test app bind a fake.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Play | — (`.video` button) | A clip on the public profile, profile preview and the admin application view. |
| Manage | — (thumbnail + `.video__row`) | The artist's own uploads in Edit profile. |
| Thumbnail | `zm-artwork` modifiers `art--group`, `art--tilt`, `art--yellow` | Tell neighbouring placeholders apart until a poster frame exists. |

One size. The card fills its grid cell at 16:9; the featured first card is the
same component, spanning the row because the page's `.media-grid` makes its
first child span. The stamp stays the same size at every width.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Thumbnail, stamp, caption | Button named by `label` |
| Hover | `:hover` on `.video` | The stamp lifts by `--transform-lift` over `--shadow-1` (ink); the thumbnail does not move | — |
| Focus | `:focus-visible` on `.video` | The two-tone ring wraps the whole thumbnail with `--focus-ring-offset` | — |
| Active | `:active` | The stamp presses flat: no shadow, no lift | — |
| Busy | `aria-busy="true"` + `aria-disabled="true"` on `.video`, from the press until the first `playing` event | A spinner after the stamp text; colours kept | Name kept, focus kept; further presses ignored |
| Playing | after the first `playing` event | The button is removed; `.video__player` fills the same frame with native controls and captions | Focus moves to the `<video>` |
| Paused | native controls, or another card starts (`VideoPlayback`) | The player stays in place, paused | Native |
| Failed | `error` on the video or the stream, or no `playing` within 10 s of the press | The button returns, not busy; the danger inline message appears under the frame | The message is linked to the button with `aria-describedby` and announced once through a polite live region; focus stays on the button |
| Retry | press after a failure | Busy again; the message stays until the clip plays | As busy |
| Manage, live | `mode="manage"`, caption "… · Live" | Thumbnail and row | Thumbnail is an image named by `artLabel` |
| Manage, processing | caption "… · Processing", plain halftone | As live; no poster frame yet | `artLabel` says it is processing |
| Manage, failed | caption "… · Failed" plus the error slot | Danger error text under the row | Remove is described by the error |
| Manage, submitting | the projected Remove is `disabled` | Disabled Remove (button CRD) | Remove out of the tab order |
| Loading | the page renders `zm-skeleton` with the wide shape in place of the card | 16:9 skeleton | The page hides it and sets `aria-busy` on the region |
| Inert | an open dialog makes the page `inert` | No hover response | Not reachable |

The card has no disabled state; a video that cannot play is not shown.

## Markup

Play mode, default (rendered inside the page's `<li>`):

```html
<li>
  <zm-video-card>
    <button class="video" type="button" aria-label="Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds">
      <zm-artwork class="art art--wide art--group" role="img" aria-label="Abigail leading a full sanctuary, hands raised in the front rows"></zm-artwork>
      <span class="video__play">Play · 6:12</span>
    </button>
    <span class="video__caption">Way Maker — live at Bethel Pentecostal, Hamilton</span>
  </zm-video-card>
</li>
```

With a poster frame, the artwork holds the image (artwork CRD):

```html
<zm-artwork class="art art--wide"><picture><source type="image/avif" srcset="…"><img src="…/way-maker-poster-800.webp" srcset="…" sizes="(min-width: 48rem) 66vw, 100vw" width="800" height="450" alt="Abigail leading a full sanctuary, hands raised in the front rows" loading="lazy" decoding="async"></picture></zm-artwork>
```

Busy, while the player loads (the video is present but hidden):

```html
<button class="video" type="button" aria-busy="true" aria-disabled="true" aria-label="Play Way Maker, …, 6 minutes 12 seconds">…<span class="video__play">Play · 6:12</span></button>
<video class="video__player" hidden controls preload="none" playsinline poster="…/way-maker-poster-800.webp"><track kind="captions" srclang="en" label="English" src="…/way-maker.en.vtt" default></video>
```

Playing:

```html
<zm-video-card>
  <video class="video__player" controls preload="none" playsinline poster="…/way-maker-poster-800.webp" aria-label="Way Maker, live at Bethel Pentecostal, Hamilton">
    <track kind="captions" srclang="en" label="English" src="…/way-maker.en.vtt" default>
  </video>
  <span class="video__caption">Way Maker — live at Bethel Pentecostal, Hamilton</span>
</zm-video-card>
```

Failed:

```html
<button class="video" type="button" aria-describedby="video-err-1" aria-label="Play Way Maker, …, 6 minutes 12 seconds">…</button>
<span class="video__caption">Way Maker — live at Bethel Pentecostal, Hamilton</span>
<p class="inline-msg inline-msg--danger" id="video-err-1" role="status"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24">…</svg>This video didn't load. Press play to try again.</p>
```

The message wrapper (`role="status"`) is always in the DOM in play mode and is
empty until a failure, so the announcement is reliable. Its `id` is generated
per instance.

Manage mode, failed upload:

```html
<zm-video-card>
  <zm-artwork class="art art--wide" role="img" aria-label="No poster frame: O Holy Night did not process"></zm-artwork>
  <div class="video__row cluster cluster--between">
    <span class="video__caption">O Holy Night — carol service 2025 · 16:20 · Failed</span>
    <zm-button><button class="btn btn--sm" type="button" aria-label="Remove the O Holy Night video" aria-describedby="video-7-error">…Remove</button></zm-button>
  </div>
  <div class="video__error"><p class="field__error" id="video-7-error">Longer than 15 minutes. Trim it and upload it again.</p></div>
</zm-video-card>
```

Consumer templates:

```html
<ul class="media-grid" role="list">
  @for (video of videos(); track video.id) {
    <li>
      <zm-video-card [caption]="video.caption" [stampText]="video.stamp" [label]="video.playLabel"
        [artVariant]="video.artVariant" [artTilt]="video.artTilt" [artYellow]="video.artYellow" [artLabel]="video.posterAlt"
        [poster]="video.poster" [stream]="video.stream" [captions]="video.captions"
        [errorText]="'profile.videos.failed' | transloco" />
    </li>
  }
</ul>
```

```html
<zm-video-card mode="manage" [caption]="video.manageCaption" [artLabel]="video.posterAlt" [poster]="video.poster">
  <zm-button slot="actions" size="sm" [label]="video.removeLabel" [describedBy]="video.error ? video.errorId : ''" [disabled]="saving()" (click)="remove(video)">
    <zm-icon name="trash" size="sm" />{{ 'editProfile.videos.remove' | transloco }}
  </zm-button>
  @if (video.error) {
    <p slot="error" class="field__error" [id]="video.errorId">{{ video.error }}</p>
  }
</zm-video-card>
```

The `.video`, `.video__play`, `.video__caption` and `.video__player` classes and
the button's `aria-label` are a contract: e2e page objects find a video by its
label and assert playback on `.video__player`. The inner structure of the
spinner is free to change.

## Design

- Button: `display: block`, `width: 100%`, no padding, border or background,
  `cursor: pointer`, text aligned left, `font: inherit`.
- Stamp: `position: absolute`, left and bottom `--space-4`, `--z-raised`;
  padding `--space-2` `--space-3`, gap `--space-2`; `--text-label`, uppercase from
  CSS, `--letter-spacing-wide`; rule `--border-width-thick`.
- Stamp hover: `box-shadow: var(--shadow-1)` and `transform: var(--transform-lift)`
  (the lift moves it up and left by `--size-offset-1`); transitions
  `--duration-fast` with `--ease-standard`. Active: no shadow, no transform.
- Busy spinner: `::after`, 1 em, `--border-width-thick` ring with a transparent
  right edge, `--radius-full`, `spin` over `--duration-loop`.
- Caption: `display: block`, `margin-top: --space-2`, `--text-body-sm`.
- Player: `display: block`, `width: 100%`, `aspect-ratio: 16 / 9`, the same frame
  as the art (`--border-width-thick` solid `--color-border-strong`), background
  `--color-bg-stage` behind letterboxing, `object-fit: contain`.
- Failure message: `margin-top: --space-2` (inline message CRD).
- Manage row: `margin-top: --space-2`; the caption inside it has no top margin;
  the error wrapper `margin-top: --space-1` and is hidden when empty.
- Focus: the global ring, `--focus-ring-width` and `--focus-ring-offset`, on the
  button, so it wraps the whole thumbnail. The host never sets `overflow: hidden`.

No component tokens. The stamp reads semantic tokens directly.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Stamp fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Stamp label and spinner | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Stamp rule and hover shadow | `--color-border-on-accent` | per theme | per theme |
| Caption | `--color-fg-muted` | per theme | per theme |
| Player frame | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Player letterbox | `--color-bg-stage` | per theme | per theme |
| Failure message | `--color-danger-fg` | per theme | per theme |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |
| Thumbnail | artwork tokens (`--color-halftone-ink`, `--color-halftone-paper`) | per theme | per theme |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values. The stamp prints the same yellow
and ink in both themes.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Stamp label |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Caption on the page |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Caption in a panel or form section |
| `--color-danger-fg` | `--color-bg-canvas` | 4.5:1 | Failure message |
| `--color-focus-ring` | `--color-bg-canvas` | 3:1 | Focus ring around the thumbnail |
| `--color-border-on-accent` | `--color-bg-canvas` | 3:1 | Stamp rule against the page (light) |

## Responsive behaviour

- **Under MD (< 768 px)**: the page's `.media-grid` stacks the cards one per row
  at full width (L2-098).
- **MD and up (≥ 768 px)**: the first card spans the row and the rest sit three
  across (L2-098). The card itself does not change.
- The stamp keeps its size at every width; on a third-width card at 768 px
  ("Play · 12:45") it still fits on one line inside the frame.
- Captions wrap; they never truncate. A long caption ("Goodness of God — women's
  retreat, Muskoka") takes two lines on a third-width card.
- The player takes exactly the thumbnail's box, so playing a clip never moves
  the grid.
- In manage mode the row wraps: on a narrow cell Remove drops under the caption,
  left-aligned (`.cluster` wrapping).
- At 320 px nothing overflows; the full-width thumbnail is at least 160 px tall
  and the whole of it is the target. At 200 % zoom everything stays reachable.

## Accessibility

### Role and pattern

A native `<button type="button">` ([APG Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/))
that is replaced by a native `<video controls>` in the same frame. Only phrasing
content is inside the button (`zm-artwork` is an autonomous custom element,
which is phrasing content, and the stamp is a `<span>`). The caption is a
sibling, outside the button. A `<div>` with a click handler is never used.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | One stop per card (the button, or the player once playing). In manage mode, the Remove button. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Starts the clip. Ignored while busy. |
| Native player keys | Once focus is on the player, the browser's controls (play, pause, seek, captions, full screen). |

### Focus

The ring wraps the whole thumbnail. When the clip starts playing, focus moves
from the button to the `<video>` (the button no longer exists), so focus is
never lost to `<body>`. After a failure focus stays on the button.

### Labelling

- Children of a button are presentational, so the thumbnail's label is not read;
  the button's `label` carries song, setting and duration in words, and starts
  with "Play", the visible stamp word (WCAG 2.5.3).
- The busy button keeps its name.
- The player is named after the clip (`aria-label` = the caption text without
  the stamp), so a screen reader says what is playing.
- The failure message is linked to the button with `aria-describedby`.
- In manage mode the thumbnail is an image named by `artLabel`, which says when
  there is no poster frame yet.

### Announcements

A failure is announced once through the card's polite `role="status"` message.
Playback itself is announced by the native player.

### Motion

The stamp lift takes `--duration-fast`; under `prefers-reduced-motion: reduce`
it is instant and the busy spinner stops turning (it stays visible as a static
ring; `aria-busy` still reports the state). Videos never autoplay, the
thumbnail never animates, and the component never calls `play()` without a
press.

## Content and internationalisation

- **Stamp**: "Play · " then the duration as m:ss ("Play · 6:12"), sentence case;
  CSS uppercases it. Videos are at most 15 minutes (L2-052), so there are no hours.
- **Caption**: song title, an em dash, then the setting: "Way Maker — live at
  Bethel Pentecostal, Hamilton". In manage mode add " · {m:ss} · {status}" with
  the status "Live", "Processing" or "Failed" (L2-052).
- **Label**: "Play {song}, {setting}, {m} minutes {s} seconds".
- **Failure**: "This video didn't load. Press play to try again."
- **Remove**: visible "Remove", label "Remove the {song} video".
- Data values: song title, setting, duration and the poster description come
  from the API (titles 5–100 characters, L2-052). Copy values ("Play", the label
  pattern, the statuses, the failure text) come from the translation catalogue
  through the page (L2-111). French runs about 30 % longer; "Lire · 6:12" and
  longer captions wrap within the card.

## Performance

- Change detection: `OnPush`, signal inputs. Internal state is one signal
  (`idle | busy | playing | failed`). No `effect`; the `<video>` element is
  created only after the first press, so an idle card renders a button, the
  artwork and two spans.
- No media is fetched before a press: the poster frame is lazy-loaded by the
  artwork, the player uses `preload="none"`, and the streaming library is
  loaded only when the browser cannot play HLS natively (L2-087).
- Playback start: on press, a browser with native HLS gets the manifest as the
  `src`; otherwise the loaded library attaches it, and `play()` runs in the same
  press. The first rendition the player picks is the lowest that fits the frame,
  so playback starts within 2 s on 10 Mbps (L2-088).
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/VideoCard.ts`
  renders "Way Maker — live at Bethel Pentecostal, Hamilton", "Play · 6:12",
  group art, idle. The composite `MediaGrid.ts` renders the profile's four
  videos in a `.media-grid`. Both are tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Layout stability: the card's height is the 16:9 thumbnail plus one caption
  line; the page's `.skeleton--wide` has the same ratio, and the player takes
  the thumbnail's box (L2-105).
- Imports: `zm-artwork`, `zm-icon` (failure icon). The streaming library is a
  dynamic import behind `ZM_HLS_LOADER`; nothing else.

## Acceptance criteria

### Rendering

- **AC-1** Given Abigail Mensah's first video (caption "Way Maker — live at Bethel Pentecostal, Hamilton", stamp "Play · 6:12", group art), when the card renders, then it is a `button.video` containing `.art.art--wide.art--group` and `.video__play` "Play · 6:12", followed by `.video__caption` with the caption outside the button. (L2-014)
- **AC-2** Given the profile's four videos in the page's `.media-grid` at MD, when they render, then the first card spans the row and the other three sit three across, each a 16:9 thumbnail with its stamp and caption. (L2-098)
- **AC-3** Given a video with a poster frame, when the card renders, then the thumbnail shows the poster image with `srcset`, explicit `width` and `height` and `loading="lazy"`; without one, it shows the halftone placeholder. (L2-088)
- **AC-4** Given an idle card, when the page loads, then no video, manifest or caption file is requested and the player library is not downloaded. (L2-087)

### Playback

- **AC-5** Given the "Way Maker" card, when the booker presses it, then the button shows the busy spinner with `aria-busy="true"` and `aria-disabled="true"`, and once the clip plays a `video.video__player` with native controls fills the same frame and the button is gone. (L2-014)
- **AC-6** Given a card on the profile, when the page loads and stays idle, then nothing plays and no `<video>` has `autoplay`; playback starts only after a press. (L2-014)
- **AC-7** Given a video whose artist supplied an English WebVTT file, when it plays, then the player has a `<track kind="captions" srclang="en">` that is showing; without a file, it has no track. (L2-014)
- **AC-8** Given a 10 Mbps connection, when play is pressed, then playback starts within 2 seconds. (L2-088)
- **AC-9** Given a browser without native HLS, when play is pressed for the first time, then the streaming library is downloaded then, in its own chunk, and is not part of the initial bundle. (L2-087)
- **AC-10** Given "Way Maker" is playing, when the booker presses "Great Is Thy Faithfulness", then "Way Maker" pauses in place and "Great Is Thy Faithfulness" plays. (L2-014)
- **AC-11** Given the stream fails to load, when the error arrives or nothing plays within 10 seconds, then the button returns without the busy state, "This video didn't load. Press play to try again." appears under the frame, `failed` is emitted, and pressing again retries. (L2-014)
- **AC-12** Given the card is playing, when the clip's frame is measured before and after the swap, then the card's position and size are unchanged. (L2-086)

### States

- **AC-13** Given a pointer over a card, when it hovers, then the stamp lifts by `--transform-lift` over `--shadow-1` and the thumbnail does not move; when pressed, the stamp is flat. (L2-014)
- **AC-14** Given a busy card, when it is pressed again, then nothing more happens and only one player is created. (L2-014)

### Manage mode

- **AC-15** Given Edit profile with "Way Maker", when the card renders in `manage` mode, then it shows the wide thumbnail, the caption "Way Maker — live at Bethel Pentecostal, Hamilton · 6:12 · Live" and the projected "Remove" in `.video__row`, with no `button.video` and no play stamp. (L2-052)
- **AC-16** Given "Jireh" still processing, when its manage card renders, then the caption ends "· Processing" and the thumbnail is the halftone placeholder named "No poster frame yet: Jireh is still processing". (L2-052)
- **AC-17** Given "O Holy Night" failed, when its manage card renders with the error "Longer than 15 minutes. Trim it and upload it again." in the error slot, then the error shows under the row and the Remove button is described by it. (L2-052)
- **AC-18** Given a manage card with nothing in the error slot, when it renders, then the error wrapper takes no space. (L2-052)

### Keyboard and focus

- **AC-19** Given keyboard focus on a card, when it is focused, then the two-tone ring wraps the whole thumbnail with `--focus-ring-offset`. (L2-101)
- **AC-20** Given focus on the "Way Maker" button, when <kbd>Enter</kbd> or <kbd>Space</kbd> is pressed and the clip starts, then focus moves to the `<video>`, and after a failure focus stays on the button. (L2-101)

### Screen readers

- **AC-21** Given the "Way Maker" card, when it is read by a screen reader, then it is a button named "Play Way Maker, live at Bethel Pentecostal, Hamilton, 6 minutes 12 seconds", and the name starts with the visible word "Play". (L2-100)
- **AC-22** Given a failure, when the message appears, then it is announced once through a polite live region and is linked to the button with `aria-describedby`. (L2-100)
- **AC-23** Given the profile's videos section in both themes, idle, busy and failed, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-24** Given the dark theme, when a card renders, then the stamp is still `--color-accent` with `--color-fg-on-accent` text and its hover shadow is `--color-border-on-accent`, and the caption uses `--color-fg-muted`. (L2-104)
- **AC-25** Given both themes, when contrast is measured, then the stamp label is at least 4.5:1, the caption at least 4.5:1 on the canvas and on a surface, and the focus ring at least 3:1. (L2-103)

### Responsive

- **AC-26** Given a 360 px viewport, when the profile's videos render, then the cards stack one per row at full width, each thumbnail is at least 44 px tall and wholly the target, and the page does not scroll horizontally. (L2-096)
- **AC-27** Given a 768 px viewport and the French catalogue, when a third-width card renders "Play · 12:45" and a two-line caption, then the stamp fits inside the frame on one line and the caption wraps without clipping. (L2-111)
- **AC-28** Given the skeleton the page shows while the profile loads, when it is replaced by the cards, then the cards occupy the skeleton's 16:9 box and the layout shift from the swap is 0.05 or less. (L2-105)

### Motion

- **AC-29** Given `prefers-reduced-motion: reduce`, when a card is hovered and then pressed, then the stamp moves without a transition and the busy spinner does not rotate. (L2-103)

### Performance

- **AC-30** Given the `VideoCard` and `MediaGrid` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

- Folder `frontend/projects/components/src/lib/video-card/`: `video-card.ts`
  (class `VideoCard`, selector `zm-video-card`), `video-card.html`,
  `video-card.scss`, `video-playback.ts` (`VideoPlayback`, root-provided) and
  `hls-loader.ts` (`ZM_HLS_LOADER`, `HlsAttacher` interface with
  `attach(video, url): Promise<void>` and `destroy()`). Export them from
  `public-api.ts`.
- Composes `zm-artwork` (`ratio="wide"`, `photo` = `poster`, `label` = `artLabel`)
  and `zm-icon` for the failure icon. Buttons in manage mode arrive by slot.
- Play mode: create the `<video>` with `@if` on the state, not before the first
  press. Detect native HLS with
  `video.canPlayType('application/vnd.apple.mpegurl')`; otherwise call the
  loader. Start a 10 s timer on press, cleared on `playing`. On `playing`, set
  the state, move focus to the video and emit `played`. On error or timeout,
  destroy the attacher, remove the video, show the message, emit `failed`.
- Destroy the attacher and pause the video in `DestroyRef.onDestroy`, so leaving
  the profile stops playback.
- Styles: `.video`, `.video__play` and `.video__caption` as in `components.css`;
  add `.video__player`, `.video__row` and `.video__error` (D-4).
- `hls.js` is a new frontend dependency: record it in an ADR in `docs/adr/` in
  the slice that adds it.
- Add the perf-test scenarios `VideoCard.ts` and `MediaGrid.ts` with a fake
  `ZM_HLS_LOADER`, export them from `scenarios/index.ts`, and tune their
  iterations.

## Decisions

- **D-1** *Is the Edit profile row part of this component?* Yes, as `mode="manage"`. It reuses `.video__caption` and the same wide thumbnail and appears on eight screens; a separate component would duplicate the thumbnail rules, and leaving it to pages would scatter the inline-style drift the mocks show. Manage mode never plays, because the artist checks uploads, and the status belongs in the caption the mock already writes.
- **D-2** *How is the adaptive stream played?* HLS (the renditions of L2-052). Browsers that play HLS natively get the manifest as `src`; others load `hls.js` through a dynamic import behind `ZM_HLS_LOADER`. That keeps the library out of the initial bundle (L2-087), lets tests bind a fake, and leaves the stream format a single input.
- **D-3** *When is the button swapped for the player?* On the first `playing` event, not on press. Until then the button stays, busy, with its name and focus, as the design system's busy state says, so a failure can fall back to the button without focus ever reaching `<body>`. The hidden `<video>` is created on press so `play()` runs within the press.
- **D-4** *What markup does the player use?* A native `<video class="video__player" controls preload="none" playsinline>` with the poster frame as `poster`, in the art's frame. The design system describes the swap but has no class or mock for it; `.video__player`, `.video__row` and `.video__error` are new elements for the design-system page to adopt. The mock's inline margins on the manage row become `.video__row`.
- **D-5** *Do captions show by default?* Yes, the track is `default`. L2-014 asks for captions when the artist supplied them; showing them on first play makes them available without finding the control, and the native control turns them off.
- **D-6** *Can two clips play at once?* No. `VideoPlayback` pauses the playing card when another starts, so two soundtracks never overlap. The paused player stays in place rather than reverting to the thumbnail, so its position is kept.
- **D-7** *When is a load a failure?* On a media or stream error, or when nothing plays within 10 s of the press. L2-088 targets 2 s; 10 s leaves room for slow connections while still telling the booker something went wrong.
- **D-8** *Does the busy spinner keep turning under reduced motion?* No. The design-system page says the spinner keeps turning, but `components.css` stops `.video[aria-busy="true"] .video__play::after` under `prefers-reduced-motion`, and L2-103 says animations are disabled. The spinner stays as a static ring and `aria-busy` reports the state.
- **D-9** *Is there a `zm-video-card-skeleton`?* No. The page renders the skeleton CRD's wide shape, which already has the 16:9 ratio; the loading profile replaces the whole section with skeletons, not individual cards.
- **D-10** *Does the card take a `priority` input for its poster?* No. The videos section is never above the fold on any page, so posters are always lazy-loaded.
- **D-11** *How is the failure message linked and announced?* A `role="status"` wrapper is always present in play mode and filled on failure, with an instance-generated `id` used in the button's `aria-describedby`. A message inserted together with its live region is often not announced.
- **D-12** *How does a manage-mode error describe the Remove button?* The consumer gives the error an `id` and passes it to the button's `describedBy`; the card cannot reach into projected content, and the button CRD already has `describedBy`.
</content>
</invoke>
