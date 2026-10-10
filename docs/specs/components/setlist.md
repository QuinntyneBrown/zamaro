# Setlist

| Field | Value |
|---|---|
| Selector | `zm-setlist` |
| Library path | `frontend/projects/components/src/lib/setlist/` |
| Status | built |
| Traces to | L2-016, L2-053, L2-054, L2-086, L2-096, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 |
| Design system | [`setlist.html`](../../design-system/components/setlist.html) |
| Source mocks | [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/artist/empty`](../../mocks/pages/artist/empty.html), [`pages/artist/loading`](../../mocks/pages/artist/loading.html), [`pages/profile-preview/default`](../../mocks/pages/profile-preview/default.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/edit-profile/empty`](../../mocks/pages/edit-profile/empty.html), [`pages/edit-profile/invalid`](../../mocks/pages/edit-profile/invalid.html), [`pages/edit-profile/submitting`](../../mocks/pages/edit-profile/submitting.html), [`pages/edit-profile/success`](../../mocks/pages/edit-profile/success.html), [`dialogs/add-song/default`](../../mocks/dialogs/add-song/default.html), [`dialogs/add-song/limit`](../../mocks/dialogs/add-song/limit.html) |
| Rendering | [`setlist.html`](setlist.html) |

## Purpose and scope

The setlist is the songs an artist leads, printed like the list taped to a stage
monitor: a big two-digit number, the title, who wrote it and the key. On the
profile it tells a worship coordinator at a glance whether the artist knows the
congregation's songs and in which key ("Songs Abigail leads", L2-016). In the
profile editor the same list becomes editable: each song gets a key select and
buttons to move it up, move it down or remove it (L2-053).

The profile setlist is a required perf-test composite (AGENTS.md).

Use something else when:

- it is not songs → [list](list.md);
- songs need more columns (length, tempo, lead singer) → [table](table.md);
- it is the first five songs under the artist's name → the song strip
  ([marquee](marquee.md)).

Out of scope:

- The section, its heading ("Songs Abigail leads") and the note "Ask for any of
  these, or send your own list." (L2-016). The page owns them and labels the
  list with the heading's ID.
- The empty state for an artist with no songs ([empty state](empty-state.md)).
- Adding a song: the "Add a song" button, the count "4 of 50 songs." and the
  add-song dialog with its 50-song limit (L2-053) belong to the page and the
  [dialog](dialog.md).
- Saving the edited order and keys. The setlist emits changes; the edit-profile
  form holds the value and submits it.
- Announcing a move or a removal: the page's `role="status"` region does,
  from the output payloads.

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/artist/default` "Songs Abigail leads" | default (two columns from MD), `labelledBy="songs-title"` | 8 songs, "Way Maker · Sinach · Key of E" … "Twi praise medley · Traditional Ghanaian · Key of F" | default, long title "Oceans (Where Feet May Fail)" | canvas |
| `pages/artist/empty` "Songs Miriam leads" | default | 4 songs, the shortest setlist | default | canvas |
| `pages/artist/loading`, `pages/profile-preview/loading` | `loading` | — | loading | canvas |
| `pages/profile-preview/*` | default, as the public profile | 8 or 4 songs | default | canvas under the preview banner |
| Dialogs and toasts over the profile (`dialogs/photo-viewer`, `dialogs/report-review`, `notifications/share-toast`) | default | as the profile | inert behind a dialog | canvas |
| `pages/edit-profile/default`, `invalid`, `success` | `editable`, key options "Any key" + 24 keys | 8 songs with key select, Up, Down, Remove | first Up and last Down disabled | form section surface |
| `pages/edit-profile/empty` | `editable` | Miriam Haile's 4 songs | first Up, last Down disabled | form section surface |
| `pages/edit-profile/submitting` | `editable`, `disabled` | every select and button disabled | disabled | form section surface |
| `dialogs/add-song/*`, `dialogs/add-photo`, `dialogs/add-video`, `dialogs/upload-check`, `dialogs/account-menu`, `dialogs/menu` over the editor | `editable` | as the editor | inert behind a dialog | form section surface |
| Design system only | `layout="single"` | Miriam's 4 songs in a 24 rem column; "Any key" | default, key unknown | canvas |

## Anatomy

1. **List** — `<ol class="setlist" role="list">` (`.setlist--single`,
   `.setlist--edit`). Counter-numbered grid.
2. **Song row** — `<li>`: grid of number (3 rem), song and key, `--space-4`
   block padding, hairline below.
3. **Number** — `li::before`: CSS counter, two digits ("03"),
   `--text-figure`, muted. Generated, so the source stays a clean list.
4. **Song** — `.setlist__song`: the title in `--text-h4`, uppercase, tight
   leading. It holds the credit.
5. **Credit** — `.setlist__credit` inside the song: writer or source,
   `--text-body-sm`, muted, sentence case. Omitted when there is none.
6. **Key** — `.setlist__key`: `--text-stub`, uppercase, never wraps. Read-only
   only.
7. **Controls (editable)** — `.setlist__controls`: a key select
   ([`zm-select`](select.md) with no form field: `[label]` "Key for Way Maker"
   as its `aria-label`, `[options]` from `keyOptions`, `name="key-{n}"`; the
   select's own `:host-context(.setlist__controls)` rule sets `width: auto;
   min-width: 9rem`) and three ghost icon-only [buttons](button.md): move up
   (arrow up), move down (arrow down), remove (bin).

Host: `zm-setlist` is `display: block` and renders the `<ol>`. The page renders
the heading; the host carries no role.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `songs` | `readonly SetlistEntry[]` | — | yes | In the artist's order. `SetlistEntry` is `{ id: string; title: string; credit: string \| null; key: string }`; `key` is the display text ("Key of B♭", "Any key") in read-only mode and the option value in editable mode. Rows are tracked by `id`. |
| `labelledBy` | `string` | — | no | Sets `aria-labelledby` on the `<ol>` (the section heading's ID). |
| `label` | `string` | — | no | Sets `aria-label` when there is no heading. Ignored when `labelledBy` is set. |
| `layout` | `'columns' \| 'single'` | `'columns'` | no | `single` adds `.setlist--single`: one column at every width. Editable is always one column. |
| `editable` | `boolean` (attribute) | `false` | no | Adds `.setlist--edit` and the controls; hides `.setlist__key`. |
| `keyOptions` | `readonly SelectOption[]` (`{ value: string; label: string; disabled?: boolean }`, from [select](select.md)) | `[]` | with `editable` | "Any key" then the 24 major and minor keys (L2-053), labels translated ("Key of D♭"). |
| `editLabels` | `{ key: (title: string) => string; moveUp: (title: string) => string; moveDown: (title: string) => string; remove: (title: string) => string }` | — | with `editable` | Accessible names built from the catalogue: "Key for Way Maker", "Move Way Maker up", "Move Way Maker down", "Remove Way Maker". |
| `disabled` | `boolean` (attribute) | `false` | no | Disables every select and button while the form submits (L2-108). |
| `loading` | `boolean` (attribute) | `false` | no | Renders `loadingCount` skeleton rows instead of songs. |
| `loadingCount` | `number` | `3` | no | Skeleton rows while loading. |
| `loadingLabel` | `string` | `''` | with `loading` | Visually hidden text "Loading songs". |

- Signal inputs; booleans use `booleanAttribute`.
- In dev mode, `editable` without `keyOptions` or `editLabels` logs a console
  error naming the component.

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `moved` | `{ id: string; from: number; to: number }` | Up or Down is activated; `to` is `from − 1` or `from + 1`. |
| `removed` | `{ id: string; index: number }` | Remove is activated. The setlist does not ask for confirmation; the form's Discard restores it. |
| `keyChanged` | `{ id: string; key: string }` | The song's key select changes; `key` is the option value. |

The component never reorders `songs` itself: the page applies the change and
passes the new array, and the component keeps focus (see Focus).

### Content slots

None.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default | — | The public profile and its preview: one column on phones, two from MD, numbered across then down. |
| Single | `.setlist--single` | A narrow container (dialog, sidebar) where reading top to bottom matters. |
| Editable | `.setlist--edit` | The artist's own setlist in the profile editor: one column, controls per song. |

One size. Height follows the content; titles wrap.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | Number, title, credit, key | "list, 8 items"; each item reads "Way Maker Sinach Key of E" |
| Long title | title wider than its column | Wraps in the song column; number and key stay on the first line (`align-items: baseline`) | — |
| No credit | `credit` null | Title only | — |
| Key unknown | `key` "Any key" | "Any key" in the key column; never empty | — |
| Loading | `loading` | `loadingCount` rows of `zm-skeleton` `title` + `text short`, in the final row grid | `loadingLabel` in visually hidden text; skeletons hidden |
| Editable | `editable` | Controls after the song; key column hidden | Each control named after the song |
| First / last song | index 0 / last | Up disabled on the first song, Down disabled on the last | Disabled buttons leave the Tab order |
| One song | `songs.length === 1` | Up and Down both disabled; Remove enabled | — |
| Disabled | `disabled` | Every select and button disabled | Out of the Tab order |
| Control hover, focus | the button's and select's own states | As [button](button.md) ghost and [select](select.md) | — |
| Inert | an open dialog makes the page `inert` | — | Not reachable |

## Markup

Read-only, rendered by `zm-setlist`:

```html
<zm-setlist>
  <ol class="setlist" role="list" aria-labelledby="songs-title">
    <li><span class="setlist__song">Way Maker<span class="setlist__credit">Sinach</span></span><span class="setlist__key">Key of E</span></li>
    <li><span class="setlist__song">Jireh<span class="setlist__credit">Elevation &amp; Maverick City</span></span><span class="setlist__key">Key of B♭</span></li>
  </ol>
</zm-setlist>
```

Single column adds `.setlist--single`; the structure is the same.

Editable:

```html
<ol class="setlist setlist--edit" role="list" aria-labelledby="songs-title">
  <li>
    <span class="setlist__song">Way Maker<span class="setlist__credit">Sinach</span></span>
    <span class="setlist__controls">
      <zm-select name="key-1"><select class="select" name="key-1" aria-label="Key for Way Maker">…<option value="E" selected>Key of E</option>…</select></zm-select>
      <zm-button variant="ghost" iconOnly><button class="btn btn--ghost btn--icon" type="button" aria-label="Move Way Maker up" disabled>…</button></zm-button>
      <zm-button variant="ghost" iconOnly><button class="btn btn--ghost btn--icon" type="button" aria-label="Move Way Maker down">…</button></zm-button>
      <zm-button variant="ghost" iconOnly><button class="btn btn--ghost btn--icon" type="button" aria-label="Remove Way Maker">…</button></zm-button>
    </span>
  </li>
</ol>
```

Inside the setlist's own template, each key select is:

```html
<zm-select [label]="editLabels().key(song.title)" [options]="keyOptions()" [formControl]="keyControl(song.id)" [name]="'key-' + ($index + 1)" (change)="emitKey(song.id, $event)" />
```

Loading:

```html
<ol class="setlist" role="list">
  <li><span class="setlist__song"><zm-skeleton class="skeleton skeleton--title" aria-hidden="true"></zm-skeleton><zm-skeleton class="skeleton skeleton--text skeleton--short" aria-hidden="true"></zm-skeleton></span></li>
  …
</ol>
<span class="visually-hidden">Loading songs</span>
```

Consumer templates:

```html
<section class="section" aria-labelledby="songs-title">
  <div class="section__head"><div><p class="overline section__kicker">{{ 'artist.setlist.kicker' | transloco }}</p><h2 id="songs-title">{{ 'artist.setlist.title' | transloco: { name: firstName() } }}</h2></div><p class="text-muted">{{ 'artist.setlist.note' | transloco }}</p></div>
  <zm-setlist labelledBy="songs-title" [songs]="songs()" [loading]="loading()" [loadingLabel]="'artist.setlist.loading' | transloco" />
</section>

<zm-setlist editable labelledBy="songs-title" [songs]="form.songs()" [keyOptions]="keyOptions()" [editLabels]="editLabels" [disabled]="saving()"
  (moved)="form.moveSong($event)" (removed)="form.removeSong($event)" (keyChanged)="form.setKey($event)" />
```

The `.setlist*` classes, the `<ol>` and the control names are the contract: the
e2e page objects read songs by `.setlist__song` and drive the editor by the
buttons' names ("Move Jireh up").

## Design

- `.setlist`: grid, `gap: 0`, `counter-reset: song`; no list style or padding.
- Row: `grid-template-columns: 3rem minmax(0, 1fr) auto`, `align-items:
  baseline`, gap `--space-3`, `padding-block: --space-4`, bottom rule
  `--border-width-hairline` `--color-border-default`.
- Number `--text-figure`, `--color-fg-muted`, `decimal-leading-zero`.
- Song `--text-h4`, line height 1.1, uppercase. Credit `display: block`,
  `--text-body-sm`, `--color-fg-muted`, no transform.
- Key `--text-stub`, uppercase, `white-space: nowrap`.
- From MD (`--layout-breakpoint-md`, 768 px): two columns, column gap
  `--space-8`. `.setlist--single` and `.setlist--edit` stay one column.
- Editable row: `3rem minmax(0, 1fr)` below MD with controls on their own line
  in column 2; from MD `3rem minmax(0, 1fr) auto` with controls at the end.
  Controls: flex, wrap, gap `--space-1`, `align-items: center`; the select
  `width: auto; min-width: 9rem`.
- No motion: rows move instantly when reordered.

No component tokens. Colours are semantic tokens read directly.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Song and key | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Number and credit | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Row rule | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Song and key on the profile |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Number and credit on the profile |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Number and credit in the editor |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Key select rule in the editor |

Row rules are decorative and exempt from WCAG 1.4.11.

## Responsive behaviour

- Below MD (768 px): one column (L2-098).
- From MD: two columns, songs flow across then down (01 02, 03 04), so the
  numbers still read in order (L2-098).
- The key never wraps; at 360 px "Key of B♭" fits beside a two-line title.
- Titles wrap at word boundaries; a single word wider than the column breaks
  inside the word (`overflow-wrap: anywhere` on `.setlist__song`).
- Editable below MD: the controls drop under the title; from MD they line up at
  the end of the row. Icon buttons are 44 × 44 px with `--space-1` between them.
- At 320 px nothing overflows; at 200 % zoom the controls wrap onto further
  lines and stay reachable.

## Accessibility

### Role and pattern

A native `<ol>` with `role="list"` (Safari drops list semantics with
`list-style: none`), labelled by the section heading. No APG pattern for the
list. The controls are a native select and APG Buttons. Reordering is by
buttons, never by drag alone.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Read-only: skips the setlist. Editable: moves through each song's key select, Up, Down and Remove, song by song. Disabled buttons are skipped. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On Up, Down or Remove: activates it. |
| Arrow keys | On the key select: native option change. |

### Focus

- After Up or Down, focus stays on the same button of the moved song in its new
  row. If that button is now disabled (the song reached the top or bottom),
  focus moves to the song's other arrow.
- After Remove, focus moves to the Remove button of the song now at that index,
  or of the new last song; with no songs left, the component emits and the page
  moves focus to "Add a song".
- The shared two-tone ring on every control; nothing clips it.

### Labelling

- Each read-only item reads number, title, credit and key: "03 Great Is Thy
  Faithfulness Thomas Chisholm, 1923 Key of D". The number is CSS-generated and
  read by most screen readers.
- Keys use the real ♭ and ♯ signs, read as "flat" and "sharp"; never "Bb".
- Each control is named after its song through `editLabels`, so eight "Remove"
  buttons are distinguishable.

### Announcements

None from the component. The page announces "Way Maker moved to 2 of 8" or
"Removed Way Maker" in its status region from `moved` and `removed`.

### Motion

None. Reordering is instant.

## Content and internationalisation

- Titles as published, title case: "Great Is Thy Faithfulness". CSS
  uppercases them.
- Credit the writer, the band or the tradition: "Sinach", "Bethel Music",
  "Traditional Ghanaian"; a year only for hymns: "Thomas Chisholm, 1923".
- Keys "Key of D", "Key of B♭", or "Any key" (L2-053, L2-016).
- Every song the artist added, up to 50, in their order (L2-053).
- Titles, credits and keys are data; key labels, control names and the loading
  text come from the catalogue (L2-111).

## Performance

- Change detection: `OnPush`, signal inputs, `@for … track song.id`. No
  `effect`; focus restoration runs in `afterNextRender` only after an emitted
  move or removal.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/Setlist.ts`
  renders Abigail Mensah's eight songs, the "profile setlist" composite. Add
  `SetlistEdit.ts`, which renders the same eight songs `editable` with 25 key
  options. Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each
  at roughly 100–300 ms.
- Composite scenarios that include it: `DarkTheme`.
- Layout stability: loading rows use the song grid with a title and a credit
  skeleton per row (L2-105). Rows never animate.
- Imports: Angular core, `zm-skeleton`, and for `editable` `zm-select`,
  `zm-button` and `zm-icon`.

## Acceptance criteria

### Rendering

- **AC-1** Given Abigail Mensah's eight songs, when the profile setlist renders, then it is one `<ol class="setlist" role="list">` with eight items numbered "01" to "08", each with title, credit and key, starting "Way Maker · Sinach · Key of E". (L2-016)
- **AC-2** Given "Jireh" by "Elevation & Maverick City" in the key of B♭, when it renders, then the key reads "Key of B♭" with the real flat sign. (L2-016)
- **AC-3** Given a song with `credit` null, when it renders, then there is no empty `.setlist__credit` element. (L2-016)
- **AC-4** Given a song with key "Any key", when it renders, then the key column reads "Any key". (L2-053)
- **AC-5** Given `labelledBy="songs-title"` on the profile, when it renders, then the `<ol>` has `aria-labelledby="songs-title"`; given `label` and no `labelledBy`, it has `aria-label` instead. (L2-102)
- **AC-6** Given the profile preview, when Abigail views it, then the setlist renders exactly as the public profile. (L2-054)

### Editable

- **AC-7** Given `editable` with Abigail's eight songs, when it renders, then each song has a key select named "Key for {title}" and buttons "Move {title} up", "Move {title} down" and "Remove {title}", and no `.setlist__key`. (L2-053)
- **AC-8** Given the editable setlist, when it renders, then "Move Way Maker up" and "Move Twi praise medley down" are disabled and every other move button is enabled. (L2-053)
- **AC-9** Given "Move Goodness of God up" is activated, when the event is handled, then `moved` emits `{ id, from: 1, to: 0 }` once, and after the page passes the new order, focus is on "Move Goodness of God up" in row 01, or on its Down button if Up is now disabled. (L2-101)
- **AC-10** Given "Remove Jireh" is activated, when the page removes it, then `removed` emits `{ id, index: 3 }` and focus moves to the Remove button of the song now in row 04. (L2-101)
- **AC-11** Given the `zm-select` labelled "Key for Way Maker" is changed to "Key of D", when its native `change` event fires, then `keyChanged` emits `{ id, key: 'D' }`. (L2-053)
- **AC-12** Given the edit-profile form is submitting, when `disabled` is true, then every key select and button in the setlist is disabled and a second activation emits nothing. (L2-108)
- **AC-13** Given Abigail reorders songs and saves, when her profile renders, then the setlist shows the new order and its first five songs match the strip. (L2-053)

### States

- **AC-14** Given `loading` with `loadingLabel` "Loading songs", when it renders, then three rows of title and short-text skeletons sit in the song grid, the skeletons are `aria-hidden` and "Loading songs" is visually hidden text. (L2-105)
- **AC-15** Given the profile loading, when the eight songs replace the skeletons, then the cumulative layout shift from the swap is 0.05 or less. (L2-105)

### Screen readers

- **AC-16** Given Abigail's setlist, when a screen reader reaches it, then it announces a list of 8 items and reads item 3 as "03 Great Is Thy Faithfulness Thomas Chisholm, 1923 Key of D". (L2-102)
- **AC-17** Given the read-only and editable setlists in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-18** Given the dark theme, when the profile setlist renders, then song and key use `--color-fg-default`, numbers and credits `--color-fg-muted` and rules `--color-border-default` on the dark canvas. (L2-104)
- **AC-19** Given both themes, when contrast is measured, then song and key are at least 4.5:1 and number and credit at least 4.5:1 on the canvas and the surface. (L2-103)

### Responsive

- **AC-20** Given a viewport of 768 px or wider, when the profile setlist renders, then it shows two columns with "01" left and "02" right; below 768 px it shows one column. (L2-098)
- **AC-21** Given a 320 px viewport and "Oceans (Where Feet May Fail)", when it renders, then the title wraps inside its column, the number and "Key of D" stay on the first line, and the page does not scroll horizontally. (L2-096)
- **AC-22** Given the editable setlist below 768 px, when it renders, then each song's controls sit on their own line under the title and every button is at least 44 × 44 CSS px. (L2-096)
- **AC-23** Given the French catalogue, when key labels ("Tonalité de ré") and control names are about 30 % longer, then they come from the catalogue and the controls wrap without clipping. (L2-111)

### Performance

- **AC-24** Given the `Setlist` and `SetlistEdit` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-setlist` with a `songs` input (`title`, `credit`, `key`),
tracked by index, read-only and two-column only. To meet this CRD:

- Add `id` to `SetlistEntry` and track rows by it.
- Add `labelledBy` and `label` on the `<ol>`.
- `zm-select` is a ControlValueAccessor with no value input or change
  output: the setlist keeps one `FormControl<string | null>` per song (keyed
  by `id`, reset from `songs` when they change), binds it with
  `[formControl]`, and emits `keyChanged` from the select's native `change`
  event. `disabled` calls `disable()` / `enable()` on those controls (the
  forms API).
- Add `layout` (`.setlist--single`), `editable` (`.setlist--edit`,
  `.setlist__controls`), `keyOptions`, `editLabels`, `disabled`, and the
  `moved`, `removed` and `keyChanged` outputs.
- Add the focus restoration after moves and removals.
- Add `loading`, `loadingCount` and `loadingLabel` with `zm-skeleton`.
- Add `overflow-wrap: anywhere` to `.setlist__song`.
- Add the editable-row grid rules from `components.css`.
- Update `Setlist.ts` to give each song an `id`, add `SetlistEdit.ts`, and export
  it from `scenarios/index.ts`.

## Decisions

- **D-1** *Is the editor a separate component?* No, the `editable` variant of `zm-setlist`. The design system documents `.setlist--edit` on the setlist page, the rows share the number and song markup, and one component keeps the public and edited lists identical (L2-054).
- **D-2** *Does the setlist reorder its own array?* No. It emits `moved`, `removed` and `keyChanged`, and the edit-profile form owns the value, so Discard and save go through one source of truth.
- **D-3** *Are inline controls allowed, given AGENTS.md forbids inline forms in pages?* Yes. The key select and the move and remove buttons are fields of the edit-profile form, not button-triggered editing; adding a song still opens the add-song dialog.
- **D-4** *Is Remove confirmed?* No. It is one field change in an unsaved form that Discard restores, as on `pages/edit-profile/default`, and a confirmation per song would slow down editing a 50-song list.
- **D-5** *How are the per-song control names translated?* Through `editLabels` functions built from catalogue keys with a `{title}` parameter. Passing four strings per song would make every consumer rebuild the same labels.
- **D-6** *Where does focus go after a move?* It stays on the same control of the moved song (the design system is silent). Moving focus elsewhere would make repeated presses impossible; when that control becomes disabled, the other arrow is the nearest useful stop.
- **D-7** *Does the list label come from `aria-labelledby` although the mocks put it only on the section?* Yes, as the design system's code shows. Labelling the list as well names it in the screen reader's list navigation.
