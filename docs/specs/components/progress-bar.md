# Progress bar

| Field | Value |
|---|---|
| Selector | `zm-progress-bar`, `zm-meter` |
| Library path | `frontend/projects/components/src/lib/progress-bar/` |
| Status | planned |
| Traces to | L2-049, L2-051, L2-052, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`progress-bar.html`](../../design-system/components/progress-bar.html) |
| Source mocks | [`dialogs/add-video/busy`](../../mocks/dialogs/add-video/busy.html), [`dialogs/add-photo/busy`](../../mocks/dialogs/add-photo/busy.html), [`dialogs/upload-check/busy`](../../mocks/dialogs/upload-check/busy.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/empty`](../../mocks/pages/dashboard/empty.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/edit-profile/empty`](../../mocks/pages/edit-profile/empty.html), and every edit-profile state and dialog over it (see Usage) |
| Rendering | [`progress-bar.html`](progress-bar.html) |

## Purpose and scope

A progress bar is a ruled track that fills with yellow ink while a long task
with a measurable end moves along: Abigail uploading "Jireh — live at Living
Waters" (46 %), a photo (62 %), her Vulnerable Sector Check (80 %). It names the
task, prints the value, and records how the task ended: success, or danger at
the point where it stopped. While the server works and cannot report a share
(the video is "Processing"), it slides a block along the track instead.

`zm-meter` is the slim completeness gauge on the same design-system page. It
shows a quantity that is not a running task, such as "Profile 100% complete" on
Abigail's dashboard and editor, or "Profile 40% complete" for Miriam Haile. It
never animates and the number is always written beside it.

Use something else when:

- the wait is short (under about 4 seconds) with no measurable end → [spinner](spinner.md), or the busy state of the [button](button.md);
- content is loading into a known layout → [skeleton](skeleton.md);
- the steps explain a process rather than track it ("How booking works") → [steps](steps.md);
- the outcome needs a sentence and a way forward ("We lost the signal. The first 62% is kept.") → an [inline message](inline-message.md) or [alert](alert.md) beside the bar.

Out of scope:

- The upload itself, chunking and resume (L2-052.5), and computing the
  percentage or time left. The dialog owns them and passes the numbers.
- The `role="status"` wrapper, the "372 of 808 MB sent · about 2 minutes left"
  help line, the Cancel upload and Resume upload buttons, and the milestone
  announcements ("Upload complete"). The dialog or page owns them.
- The `aria-busy` region around a filling list. The page owns it.
- The stat tile (`.stat`, `.stat__label`, `.stat__value`) and the edit-profile
  page head that hold a meter. The page owns them and supplies the meter's name.
- Number formatting. The consumer passes formatted text ("46%", "2 of 4"),
  translated (L2-111).

## Usage

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `dialogs/add-video/busy` | `zm-progress-bar`, value 46 of 100 | label "Uploading jireh-living-waters.mp4", value text "46%", value text for AT "46%, about 2 minutes left" | determinate, in progress | dialog surface, inside the dialog's `role="status"` stack beside "372 of 808 MB sent · about 2 minutes left." |
| `dialogs/add-photo/busy` | `zm-progress-bar`, value 62 | "Uploading easter-sunrise-lakeshore.jpg", "62%" | in progress | dialog surface, beside "5.6 of 9 MB sent." |
| `dialogs/upload-check/busy` | `zm-progress-bar`, value 80 | "Uploading vsc-peel-regional-police-2026.pdf", "80%" | in progress | dialog surface, beside "1 of 1.2 MB sent." |
| `pages/edit-profile/video-processing` (L2-052.2), after the upload | `zm-progress-bar`, value null | "Processing video", "Up to 5 min" | indeterminate | surface (Videos section) |
| Video upload finished | `zm-progress-bar` success, 100 | "Uploaded · ready to publish", "100%" | success | dialog surface |
| Video upload dropped (L2-052.5) | `zm-progress-bar` danger, 62 | "Upload stopped", "62%" | danger, fill kept at 62 % | dialog surface; the dialog adds "We lost the signal. The first 62% is kept." and Resume upload |
| Video processing failed (L2-052.2) | `zm-progress-bar` danger, value null | "Processing failed", "Not live" | danger, full static fill | surface; the page adds the failure reason |
| Design system, booking request steps | `zm-progress-bar`, value 2 of max 4 | "Your church", "2 of 4", AT "Step 2 of 4: your church" | determinate steps | surface (stub) |
| Upload queued | `zm-progress-bar`, value 0 | "Queued", "0%" | queued | dialog surface |
| `pages/dashboard/default` stat | `zm-meter`, value 100, `ariaLabel` "Profile complete" | the stat prints "100%" | full | surface (stat tile) |
| `pages/dashboard/empty` stat | `zm-meter`, value 40, `ariaLabel` "Profile complete" | "40%" | partial | surface |
| `pages/edit-profile/default` page head, and every edit-profile state (address-locked, check-pending, invalid, submitting, success, video-processing) | `zm-meter`, value 100, `labelledBy` the page's "Profile 100% complete" label | label above, caption below | full | canvas (page head) |
| `pages/edit-profile/empty` page head | `zm-meter`, value 40, labelled "Profile 40% complete" | "3 things to finish" panel below | partial | canvas |
| Dialogs over the editor (`add-photo`, `add-song`, `add-video`, `upload-check` in every state; `menu/artist`, `account-menu/artist`) | the edit-profile meter, behind the dialog | as above | inert | canvas, inert behind the dialog |
| Design system, accent stat | `zm-meter` `ink`, value 2 of max 6, labelled "Videos 2 of 6" | — | partial | surface beside a yellow neighbour |

## Anatomy

`zm-progress-bar`:

1. **Container** — `.progress` (the host): a column, head above track, `--space-1` apart. Carries the tone and `.progress--indeterminate`.
2. **Head** — `.progress__head`: mono overline, uppercase, label left and value right.
3. **Label** — the first `<span>` in the head, with a generated `id`. It names the bar.
4. **Value** — `.progress__value`: "46%" or "2 of 4" in tabular figures, so it does not jitter while it counts.
5. **Track** — `.progress__track`: 12 px tall, paper fill, 2 px `--color-border-strong` rule, `overflow: hidden`. Carries `role="progressbar"` and the ARIA values.
6. **Fill** — `.progress__bar`: yellow by default, width from the value.
7. **Leading edge** — the fill's 2 px right rule in `--color-border-on-accent`, so the yellow reads against paper. The indeterminate block also has a left rule.

`zm-meter`:

1. **Track** — `.meter` (the host): 12 px, `--color-bg-subtle`, 1 px `--color-border-strong` rule. Carries `role="progressbar"`.
2. **Fill** — `.meter__bar`: `--color-accent`, or `--color-fg-default` with `.meter--ink`.

Host: `zm-progress-bar` is the `.progress` element itself (`display: flex`,
`flex-direction: column`) and fills the width of its container. `zm-meter` is
the `.meter` element itself (`display: block`). Neither renders a wrapper
element around the classes, so the e2e page objects find them by class.

## API

### `zm-progress-bar` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | The visible task name in the head: "Uploading jireh-living-waters.mp4". It names the bar through `aria-labelledby`. |
| `value` | `number \| null` | `null` | no | Progress in units of `max`. `null` means not measurable: with the default variant the bar is indeterminate. Clamped to `0…max`; a non-finite number is treated as 0. |
| `max` | `number` | `100` | no | 100 for percent, or the number of steps (4). Must be greater than 0; otherwise 100 is used and a dev-mode console error names the component. |
| `valueText` | `string` | `''` | no | The visible value: "46%", "2 of 4", "Up to 5 min". Hidden when empty. |
| `ariaValueText` | `string` | `''` | no | Sets `aria-valuetext` when a number alone is unclear: "46%, about 2 minutes left", "Step 2 of 4: your church". When empty and `valueText` is set, `valueText` is used. |
| `variant` | `'default' \| 'success' \| 'danger'` | `'default'` | no | Adds `.progress--success` or `.progress--danger`. The default adds no modifier. |

### `zm-meter` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `value` | `number` | `0` | no | Clamped to `0…max`. |
| `max` | `number` | `100` | no | 100, or a count (6 videos). Greater than 0, as for the progress bar. |
| `labelledBy` | `string` | — | one of the two | The `id` of the visible label beside the meter ("Profile 100% complete"). Sets `aria-labelledby`. |
| `ariaLabel` | `string` | — | one of the two | Sets `aria-label` when the label is not a single element ("Profile complete" in the dashboard stat). If neither is set, a dev-mode console error names the component. |
| `ink` | `boolean` (attribute) | `false` | no | Adds `.meter--ink`: an ink fill where yellow would compete with a yellow neighbour. |

Inputs are signal inputs; booleans accept bare attributes (`booleanAttribute`),
numbers accept attribute strings (`numberAttribute`).

### Outputs

None. Neither component is interactive.

### Content slots

None. Every string arrives as an input, so the head's structure and the label's
`id` stay under the component's control. Help lines and actions sit beside the
component in the consumer's template.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Determinate (default) | — | A task with a known share done: uploads, steps. |
| Indeterminate | `.progress--indeterminate` | `value` null with the default variant: the server is working and cannot report a share ("Processing video"). |
| Success | `.progress--success` | The task finished: "Uploaded · ready to publish", 100 %. |
| Danger | `.progress--danger` | The task failed: the fill stays where it stopped ("Upload stopped", 62 %). |
| Meter | `.meter` (`zm-meter`) | A completeness or usage gauge, not a running task. |
| Meter, ink | `.meter.meter--ink` | The same, beside a yellow neighbour. |

Both components have one size: a 12 px track (`--space-3`). The width follows the
container at every breakpoint; neither has a fixed width.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Queued | `value` 0 | Empty track; the 2 px ink leading edge sits at the start | `aria-valuenow="0"` |
| In progress | `value` between 0 and `max` | Yellow fill to `value / max`, easing over `--duration-slow` to each new value | `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`, `aria-valuetext` |
| Steps | `max` 4, `value` 2 | Fill at 50 %; value "2 of 4" | `aria-valuemax="4"`, `aria-valuetext="Step 2 of 4: your church"` |
| Indeterminate | `value` null, default variant | `.progress--indeterminate`: a 35 % block with ink edges slides across the track, one cycle per `--duration-loop` × 1.6 | No `aria-valuenow`; `aria-valuetext` from the value text when set |
| Success | `variant` success | Fill `--color-success-solid`; at 100 % for a finished upload | Values kept |
| Danger | `variant` danger | Fill `--color-danger-solid`, kept at the value it reached | Values kept; the page announces the failure |
| Danger or success without a value | `variant` success or danger, `value` null | Full, static fill in the tone colour; no sliding block | No `aria-valuenow` |
| Reduced motion | `prefers-reduced-motion: reduce` | Width changes instantly; the indeterminate block stops and shows a full fill at half opacity | Unchanged |
| Meter | `zm-meter` | Fill to `value / max`, no transition, no animation | `role="progressbar"` with values and a name |
| Inert | a dialog opens over the page | No change; the meter behind is not reachable | Not reachable |

Neither component has hover, focus, active or disabled states: they are never
focusable.

## Markup

Rendered by `zm-progress-bar`, determinate:

```html
<zm-progress-bar class="progress">
  <div class="progress__head"><span id="zm-progress-1">Uploading jireh-living-waters.mp4</span><span class="progress__value">46%</span></div>
  <div class="progress__track" role="progressbar" aria-labelledby="zm-progress-1" aria-valuemin="0" aria-valuemax="100" aria-valuenow="46" aria-valuetext="46%, about 2 minutes left">
    <div class="progress__bar" style="--progress: 46%;"></div>
  </div>
</zm-progress-bar>
```

Indeterminate (no `aria-valuenow`, no `--progress`; the stylesheet sizes the block):

```html
<zm-progress-bar class="progress progress--indeterminate">
  <div class="progress__head"><span id="zm-progress-2">Processing video</span><span class="progress__value">Up to 5 min</span></div>
  <div class="progress__track" role="progressbar" aria-labelledby="zm-progress-2" aria-valuemin="0" aria-valuemax="100" aria-valuetext="Up to 5 min">
    <div class="progress__bar"></div>
  </div>
</zm-progress-bar>
```

Steps, success and danger add only their values and modifier:

```html
<zm-progress-bar class="progress">… aria-valuemax="4" aria-valuenow="2" aria-valuetext="Step 2 of 4: your church" … style="--progress: 50%;" …</zm-progress-bar>
<zm-progress-bar class="progress progress--success">… aria-valuenow="100" … style="--progress: 100%;" …</zm-progress-bar>
<zm-progress-bar class="progress progress--danger">… aria-valuenow="62" … style="--progress: 62%;" …</zm-progress-bar>
```

With no value text, the `.progress__value` span is not rendered.

Rendered by `zm-meter`:

```html
<zm-meter class="meter" role="progressbar" aria-labelledby="complete-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="--value: 100%;">
  <div class="meter__bar"></div>
</zm-meter>
<zm-meter class="meter meter--ink" role="progressbar" aria-label="Videos" aria-valuemin="0" aria-valuemax="6" aria-valuenow="2" style="--value: 33.33%;">
  <div class="meter__bar"></div>
</zm-meter>
```

Consumer templates:

```html
<!-- dialogs/add-video, busy: the dialog owns the status stack and the help line -->
<div class="stack stack--sm" role="status">
  <zm-progress-bar [label]="t('video.upload.label', { file: fileName() })" [value]="percent()" [valueText]="t('common.percent', { n: percent() })" [ariaValueText]="t('video.upload.valueText', { n: percent(), left: timeLeft() })" />
  <p class="field__help">{{ t('video.upload.sent', { sent: sentMb(), total: totalMb(), left: timeLeft() }) }}</p>
</div>

<!-- after the upload, while the server transcodes -->
<zm-progress-bar [label]="'video.processing' | transloco" [value]="null" [valueText]="'video.processing.eta' | transloco" />

<!-- dashboard stat: no single label element -->
<zm-meter [value]="profile.completeness" [ariaLabel]="'dashboard.stats.complete' | transloco" />

<!-- edit-profile page head -->
<p class="field__label" id="complete-label">{{ t('profile.complete', { n: profile.completeness }) }}</p>
<zm-meter [value]="profile.completeness" labelledBy="complete-label" />
```

The `.progress*` and `.meter*` classes and the ARIA attributes are a contract:
the e2e page objects find a bar by role and name ("Uploading
jireh-living-waters.mp4") and read its `aria-valuenow`. The generated label `id`
is free to change; only its link to `aria-labelledby` is fixed.

## Design

- Container: column, gap `--space-1`.
- Head: flex row, `justify-content: space-between`, gap `--space-2`; `--text-overline`, `--letter-spacing-stamp`, uppercase. The label wraps; the value stays on the right of the first line (`flex: none` on the value).
- Value: `font-variant-numeric: tabular-nums`.
- Track: height `--space-3`; fill `--color-bg-surface`; rule `--border-width-thick` solid `--color-border-strong`; square corners; `overflow: hidden`.
- Fill: `height: 100%`; background `--progress-fill`; right rule `--border-width-thick` solid `--color-border-on-accent`; `transition: width var(--duration-slow) var(--ease-standard)`.
- Indeterminate block: width 35 %, left and right rules in `--color-border-on-accent`, `animation: progress-slide calc(var(--duration-loop) * 1.6) var(--ease-standard) infinite` from `translate: -100% 0` to `translate: 300% 0`.
- Meter: height `--space-3`; track `--color-bg-subtle` with a `--border-width-hairline` `--color-border-strong` rule; fill `--color-accent` (ink: `--color-fg-default`); no transition.

Component tokens declared on `.progress__bar`, in the component's own stylesheet:

| Token | Aliases | Overridden by |
|---|---|---|
| `--progress-fill` | `--color-accent` | `.progress--success` → `--color-success-solid`; `.progress--danger` → `--color-danger-solid` |

The fill width comes from two per-instance knobs that `components.css` reads with a
fallback: `--progress` on `.progress__bar` (`width: var(--progress, 0%)`) and
`--value` on `.meter` (`.meter__bar { width: var(--value, 0%) }`). The
components set them from their value input (D-1).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Track fill | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Track rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Fill (default) | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Fill, success / danger | `--color-success-solid` / `--color-danger-solid` | per theme | per theme |
| Leading edge | `--color-border-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Head label and value | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Meter track | `--color-bg-subtle` | `--palette-ink-100` | `--palette-ink-700` |
| Meter rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Meter fill / ink fill | `--color-accent` / `--color-fg-default` | per theme | per theme |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Head label and value on a dialog or card |
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Track rule |
| `--color-border-on-accent` | `--color-bg-surface` | 3:1 | Light: leading edge on the empty track |
| `--color-success-solid` | `--color-bg-surface` | 3:1 | Success fill |
| `--color-danger-solid` | `--color-bg-surface` | 3:1 | Danger fill |
| `--color-accent` | `--color-bg-surface` | 3:1 | Dark: yellow fill on the charcoal track |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Meter rule in the edit-profile page head |

On light paper the yellow fill alone is too pale to count as a graphic (WCAG
1.4.11), so the ink leading edge and the printed value carry the meaning. In the
dark theme the yellow fill carries it and the ink edge is decorative. Neither
component sits on the stage or the yellow band; a consumer that needs one there
wraps it in a paper island (`data-theme="light"`). Under forced colours the
rules use `CanvasText` and the fill `Highlight`, so the share stays visible.

## Responsive behaviour

- The bar and the meter fill the width of their container at every breakpoint.
- The head is a flex row. A long label wraps under itself; the value stays on
  the right of the first line and never wraps ("46%", "2 of 4"). At 320 px
  "Uploading vsc-peel-regional-police-2026.pdf" wraps and a file name with no
  spaces breaks inside the word (`overflow-wrap: anywhere` on the label), so
  nothing overflows the dialog.
- The track never shrinks below its 12 px height; at 200 % zoom the head wraps
  more and the track keeps its full width.
- Nothing is a touch target. Controls beside the bar (Cancel upload, Resume
  upload) follow the button sizes and sit at least `--space-2` away.

## Accessibility

### Role and pattern

The track (`zm-progress-bar`) or the host (`zm-meter`) has the WAI-ARIA
`progressbar` role with `aria-valuemin`, `aria-valuemax` and, while measurable,
`aria-valuenow`. There is no APG widget pattern for it. A native `<progress>` is
not used: it cannot carry the ink leading edge in every browser.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips both components; they are never focusable. Focus stays on the control that started the task, or on Cancel upload or Resume upload beside the bar. |

### Focus

Never moves focus. When a task finishes, focus stays where it is. If the bar is
replaced by new content after the person asked for it (pressed Upload), the
dialog may move focus to that content's heading; the component never does.

### Labelling

- The bar is named by its visible label through `aria-labelledby`: "Uploading
  jireh-living-waters.mp4". It is never unnamed.
- `aria-valuetext` adds what a number alone cannot say: "46%, about 2 minutes
  left", "Step 2 of 4: your church".
- The meter is named by the page's label ("Profile 100% complete") or by
  `ariaLabel` ("Profile complete"), and the number is printed beside it.

### Announcements

None from the component. Screen readers do not announce every value change, and
they should not. The dialog's `role="status"` stack announces the upload, and
milestones ("Upload complete", "Upload stopped at 62%") go in the page's status
region.

### Motion

The fill eases over `--duration-slow`, which reduced motion drops to near zero,
so the width changes instantly. The indeterminate block's slide is removed under
`prefers-reduced-motion: reduce`: it shows a full fill at half opacity instead,
and the label says the task is still working. The meter never animates.

## Content and internationalisation

- Label: a present-tense verb and the object: "Uploading
  jireh-living-waters.mp4", "Processing video", "Sending request to Abigail".
  On phones keep it to about 30 characters where the consumer controls it.
- Value: a whole percentage ("46%") or steps ("2 of 4"). Add time left only when
  it can be estimated honestly, and only in `ariaValueText` and the help line
  ("about 2 minutes left").
- Done: say what is ready ("Uploaded · ready to publish"). Failed: say what is
  kept, beside the bar ("The first 62% is kept.").
- Indeterminate: set expectations ("Processing video", "Up to 5 min").
- Meter: the number is always written next to it ("Profile 100% complete",
  "Videos 2 of 6").
- Translatable inputs: `label`, `valueText`, `ariaValueText`, `ariaLabel`. The
  consumer formats numbers with the catalogue, so French reads "46 %" with no
  code change (L2-111). Data values: file names come from the upload.

## Performance

- Change detection: `OnPush`, signal inputs. The clamped share, the `--progress` / `--value` percentage and
  the ARIA value text are `computed`. No subscriptions, no `effect`, no timers.
- The indeterminate slide and the width transition are CSS only; a value change
  updates one custom property and one attribute.
- Perf-test scenario: `frontend/projects/perf-test/src/scenarios/ProgressBar.ts`
  renders "Uploading jireh-living-waters.mp4" at 46 % with "46%, about 2 minutes
  left". `Meter.ts` renders "Profile 100% complete" with its label. Both are
  tuned in `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios: `DarkTheme` when it includes a dialog with an upload.
- Layout stability: the track has a fixed height and the head one line of
  overline text, so swapping indeterminate for determinate, or the value text
  changing, shifts nothing; the value uses tabular figures.
- Imports: nothing beyond `@angular/core`.

## Acceptance criteria

### Rendering

- **AC-1** Given an upload of "jireh-living-waters.mp4" at 46 %, when `zm-progress-bar` renders with label "Uploading jireh-living-waters.mp4", value 46 and value text "46%", then the head shows the label and "46%", the track has `role="progressbar"` with `aria-valuenow="46"`, `aria-valuemin="0"` and `aria-valuemax="100"`, and `.progress__bar` carries `--progress: 46%`, so the fill is 46 % of the track. (L2-052)
- **AC-2** Given the upload moves from 46 % to 61 %, when `value` changes, then `--progress` and `aria-valuenow` change together, the fill eases to the new width over `--duration-slow`, and the value text reads "61%". (L2-052)
- **AC-3** Given the upload finishes and the server starts transcoding, when `value` becomes null with label "Processing video", then the bar has `.progress--indeterminate`, a block slides along the track, and the track has no `aria-valuenow`. (L2-052)
- **AC-4** Given processing ends, when the bar renders with `variant` success, value 100 and label "Uploaded · ready to publish", then it has `.progress--success` and a full `--color-success-solid` fill. (L2-052)
- **AC-5** Given the connection drops at 62 %, when the bar renders with `variant` danger and value 62, then it has `.progress--danger`, the fill stays at 62 % in `--color-danger-solid`, and `aria-valuenow` is 62. (L2-052)
- **AC-6** Given processing fails with no share to report, when the bar renders with `variant` danger and value null, then the fill is full and static, no block slides, and the track has no `aria-valuenow`. (L2-052)
- **AC-7** Given a photo upload of "easter-sunrise-lakeshore.jpg" at 62 % in the add-photo dialog, when it renders, then the bar reads "Uploading easter-sunrise-lakeshore.jpg" and "62%" and its fill is 62 %. (L2-051)
- **AC-8** Given Abigail's check "vsc-peel-regional-police-2026.pdf" uploading at 80 %, when it renders, then the bar reads the file name and "80%" with `aria-valuenow="80"`. (L2-049)
- **AC-9** Given the booking request steps with value 2, max 4, value text "2 of 4" and value text for assistive technology "Step 2 of 4: your church", when it renders, then the fill is 50 %, `aria-valuemax` is 4 and `aria-valuetext` is "Step 2 of 4: your church". (L2-102)
- **AC-10** Given a value of 120 with max 100, or a value of −5, when the bar renders, then the fill and `aria-valuenow` are clamped to 100 and 0. (L2-052)
- **AC-11** Given Abigail's dashboard, when `zm-meter` renders with value 100 and `ariaLabel` "Profile complete", then it has `.meter`, `role="progressbar"`, `aria-valuenow="100"`, the name "Profile complete", and a full yellow fill. (L2-100)
- **AC-12** Given Miriam Haile's editor, when `zm-meter` renders with value 40 and `labelledBy` "complete-label", then it is named "Profile 40% complete" and the host carries `--value: 40%`, so its fill is 40 %. (L2-100)
- **AC-13** Given `ink` and value 2 of max 6, when the meter renders, then it has `.meter--ink`, an ink fill a third of the track, and `aria-valuemax="6"`. (L2-100)

### Keyboard and focus

- **AC-14** Given an upload in progress in the add-video dialog, when the artist presses Tab, then focus moves from Cancel upload to the busy submit and never stops on the bar, and changing `value` never moves focus. (L2-101)

### Screen readers

- **AC-15** Given the add-video upload at 46 %, when it is read by a screen reader, then it is announced as a progress bar named "Uploading jireh-living-waters.mp4" with the value "46%, about 2 minutes left". (L2-102)
- **AC-16** Given every route that shows a progress bar or a meter, in both themes, when axe-core runs, then there are zero serious or critical violations, including no unnamed progress bar. (L2-100)

### Theming

- **AC-17** Given the dark theme, when a determinate bar renders, then the track is `--color-bg-surface` charcoal with a `--color-border-strong` light rule and the yellow fill. (L2-104)
- **AC-18** Given both themes, when contrast is measured, then the head text is at least 4.5:1 on the surface, the track rule at least 3:1, the light-theme leading edge at least 3:1 against the empty track, and the success and danger fills at least 3:1 against the track. (L2-103)

### Responsive

- **AC-19** Given a 320 px viewport and the label "Uploading vsc-peel-regional-police-2026.pdf", when the bar renders in the upload-check dialog, then the label wraps (breaking inside the file name if it must), "80%" stays on the right of the first line, the track keeps the full width, and nothing overflows the dialog. (L2-096)
- **AC-20** Given the French catalogue, when the labels and values run about 30 % longer ("Téléversement de …", "46 %"), then the head wraps without clipping and the component code is unchanged. (L2-111)

### Motion

- **AC-21** Given `prefers-reduced-motion: reduce`, when the value changes, then the width changes without a transition; and when the bar is indeterminate, then no block slides and the track shows a full fill at half opacity. (L2-103)
- **AC-22** Given a meter, when its value changes, then the fill changes without any transition in either motion setting. (L2-103)

### Performance

- **AC-23** Given the `ProgressBar` and `Meter` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

Planned. To build it:

- Folder `frontend/projects/components/src/lib/progress-bar/` with
  `progress-bar.ts` (`ProgressBar`, selector `zm-progress-bar`) and `meter.ts`
  (`Meter`, selector `zm-meter`). Export both from `public-api.ts`.
- Host bindings: `class: 'progress'`, `[class.progress--indeterminate]`,
  `[class.progress--success]`, `[class.progress--danger]`; for the meter
  `class: 'meter'`, `role: 'progressbar'`, `[class.meter--ink]` and the ARIA
  attributes.
- Generate the label `id` from a module-level counter (`zm-progress-{n}`), stable
  across server and client render order.
- `share = computed(() => clamp(value, 0, max) / max * 100)`; bind
  `[style.--progress]` (the share with a `%` unit) on `.progress__bar` only when the bar is not indeterminate,
  and `[style.--value]` on the meter host,
  and `[attr.aria-valuenow]` to `null` when `value` is null.
- Copy the `.progress*`, `.meter*` and `progress-slide` rules from
  `components.css` into the component styles, keeping the `--progress` and
  `--value` knobs as the design system writes them (D-1), adding `overflow-wrap: anywhere` and
  `min-width: 0` on the label, `flex: none` on the value, the full static fill
  for success or danger with no value (D-3), and the reduced-motion rule.
- Dev-mode console errors for `max` ≤ 0 and for a meter with neither
  `labelledBy` nor `ariaLabel`.
- No CDK primitive. Add `ProgressBar.ts` and `Meter.ts` to
  `frontend/projects/perf-test/src/scenarios/` and export them from
  `scenarios/index.ts`.

## Decisions

- **D-1** *How is the fill width set?* As the design system does it: the progress bar sets `--progress` on `.progress__bar` and the meter sets `--value` on its host, each a percentage computed from the value input. `components.css` reads both through `var(--x, 0%)` fallbacks as per-instance knobs, so the component's stylesheet stays a copy of the design system's and the rendered DOM matches the mocks exactly. An indeterminate bar sets no `--progress`, so the stylesheet's 35 % block applies.
- **D-2** *One `state` input, or `variant` plus an indeterminate flag?* `variant` (default, success, danger) plus `value: number | null`, where null means not measurable. It is the same signal the ARIA needs (no `aria-valuenow`), so there is no way to set a value and indeterminate at once, and a separate flag would duplicate it.
- **D-3** *What do success or danger look like with no value?* A full, static fill in the tone colour. The sliding block means "still working", which is wrong once the task has ended; L2-052.2 needs a failure for processing, which has no percentage. A full red track records how it ended and the page states the reason.
- **D-4** *Who formats the value?* The consumer, through `valueText` and `ariaValueText`. The catalogue decides "46%" or "46 %" and "2 of 4" (L2-111), and only the dialog knows the time left.
- **D-5** *Is `aria-valuetext` defaulted?* Yes, to `valueText` when `ariaValueText` is empty, so "Up to 5 min" and "2 of 4" are read as written instead of as a bare number.
- **D-6** *Does the bar include the help line, the status wrapper or Cancel?* No. The three busy dialogs put them beside the bar inside their own `role="status"` stack, and Resume and Cancel belong to the upload flow. Keeping the component to the bar alone serves every row with no slots.
- **D-7** *Is the meter part of this CRD?* Yes. The design system documents `.meter` on the progress-bar page and it shares the progressbar role. It is a separate component because its label lives outside it (a stat tile, a page head) and it never animates.
- **D-8** *How is the meter named?* By `labelledBy` when the page has one label element ("Profile 100% complete") and by `ariaLabel` in the dashboard stat, where the label and the number are separate spans. Both mocks do exactly this.
- **D-9** *Out-of-range values?* Clamped to `0…max`, and a non-finite value is 0, so a bad upload event can never draw a fill past the track or announce 120 %.
- **D-10** *Long file names in the head?* The label wraps and breaks inside a word when it must (`overflow-wrap: anywhere`), and the value never wraps. File names have no spaces, and at 320 px "vsc-peel-regional-police-2026.pdf" in uppercase overline does not fit; truncation is forbidden (L2-096).
- **D-11** *What does reduced motion do to the indeterminate bar?* It follows the design system: no slide, a full fill at half opacity. The label still says the task is working, so meaning does not depend on the motion.
