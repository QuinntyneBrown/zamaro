# Spinner

| Field | Value |
|---|---|
| Selector | `zm-spinner`, `zm-spinner-inline` |
| Library path | `frontend/projects/components/src/lib/spinner/` |
| Status | planned |
| Traces to | L2-022, L2-025, L2-052, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`spinner.html`](../../design-system/components/spinner.html) |
| Source mocks | [`pages/verify-email/default`](../../mocks/pages/verify-email/default.html), [`pages/confirm-email/default`](../../mocks/pages/confirm-email/default.html), [`pages/discover/loading`](../../mocks/pages/discover/loading.html), [`pages/artist/default`](../../mocks/pages/artist/default.html) (booking stub date check), [`pages/edit-profile/video-processing`](../../mocks/pages/edit-profile/video-processing.html) |
| Rendering | [`spinner.html`](spinner.html) |

## Purpose and scope

A spinner is a turning ink ring for a short wait with no measurable end:
checking calendars, confirming a link, processing a video. It always comes with
words, visible or visually hidden, that say what Zamaro is doing, and those
words are what assistive technology reads.

The family has two components:

- `zm-spinner` is the ring. On its own it is decorative; with a `label` it is a
  lone spinner that names the wait in visually hidden text inside a
  `role="status"` host ("Processing video").
- `zm-spinner-inline` is the status line `.spinner-inline`: a small ring before a
  visible sentence ("Checking calendars…"), and the polite live region that
  announces it.

Use something else when:

- a button is waiting → the button's own busy state draws its ring
  ([button](button.md), `busy`); never put a spinner inside a button;
- the content has a known shape (the lineup, a profile, a list) →
  [skeleton](skeleton.md);
- the wait is measurable or longer than about 10 seconds (an upload) →
  [progress bar](progress-bar.md);
- a field's availability check is running → [inline message](inline-message.md)
  with `busy`, which composes `zm-spinner` so the message keeps its place and id.

Out of scope:

- When a wait starts and ends. The page or store decides; the component only
  hides itself for its first 400 ms (`delay`).
- The 600 ms minimum once shown and the 8-second "Still checking — thanks for
  waiting." copy. Both depend on when the work finishes, which only the
  consumer knows (D-4). The consumer keeps the busy state for at least 600 ms
  after the spinner became visible (400 ms after the wait started) and swaps
  the label after 8 s.
- `aria-busy="true"` on the region being filled. The page sets it (L2-105).
- Visually hidden page-level status lines with no ring (the artist profile's
  "Loading the artist's profile…"). They are plain `role="status"` paragraphs.

## Usage

The mocks render the inline status line on two pages; the design system adds
the lone spinner and the status line above the loading lineup. Every row below
is buildable with the API.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/verify-email/default` | `zm-spinner-inline` md, `class="lead"` | "Confirming naomi.fraser@riversidecc.ca…" | turning, reduced motion | stub card on the poster |
| `pages/confirm-email/default` | `zm-spinner-inline` md, `class="lead"` | "Switching your sign-in to naomi@riversidecc.ca…" | turning | stub card on the poster |
| `pages/discover/loading` status line above the skeleton lineup (design system) | `zm-spinner-inline` md, `class="lead"`, mounted before the search with `active` | "Finding who's free on Saturday 14 November 2026…" | idle (empty region), turning | canvas |
| Booking bar and lists while loading (design system) | `zm-spinner-inline` sm | "Checking calendars…", "Loading Abigail's dates…" | turning | canvas, stage |
| `pages/artist/default` booking stub, date check | `zm-spinner` sm inside `zm-inline-message busy` | "Checking Abigail's calendar…" (the message's text) | turning, then replaced by the result | surface |
| Video card, video processing (design system; `pages/edit-profile/video-processing` shows the text) | `zm-spinner` lg with `label` | visually hidden "Processing video" | turning | art placeholder on surface |
| A waiting area (design system) | `zm-spinner` md with `label` | visually hidden "Loading Abigail's videos" | turning | surface |
| Busy buttons on every form | not this component: `.btn[aria-busy="true"]::after` | — | — | — |

## Anatomy

1. **Ring** — `.spinner` (`.spinner--sm`, `.spinner--lg`): a circle drawn with a
   `currentColor` rule, `--border-width-thick` for sm and md,
   `--border-width-poster` for lg, `--radius-full`. One transparent quarter (the
   right side) shows the turn. Always `aria-hidden="true"`.
2. **Hidden label (optional, `zm-spinner`)** — `.visually-hidden` text after the
   ring. Present only when `label` is set.
3. **Status line (`zm-spinner-inline`)** — `.spinner-inline`: the ring, then the
   projected sentence, in a row with `--space-2` between, `--text-stub`,
   uppercase by CSS.

Hosts:

- `zm-spinner` is `display: inline-flex` and holds the inner
  `<span class="spinner">`. With `label`, the host carries `role="status"` and
  the hidden label; without it the host carries `aria-hidden="true"`.
- `zm-spinner-inline` is the status line itself: the host carries
  `.spinner-inline` and `role="status"`, so a parent can add a type class on the
  host (`class="lead"`).

## API

### `zm-spinner` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.spinner--sm` or `.spinner--lg` to the ring. Match the text beside it: sm with 12–14 px text and dense rows, md with body text, lg alone in a waiting area. |
| `label` | `string` | `''` | no | When set: visually hidden text after the ring and `role="status"` on the host. When empty: the host is `aria-hidden="true"` and announces nothing. |
| `delay` | `boolean` (attribute) | `true` | no | The ring is transparent for its first 400 ms (D-3), so a wait that ends sooner never flashes a ring. `false` shows it at once. |

### `zm-spinner-inline` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `size` | `'sm' \| 'md'` | `'sm'` | no | The ring's size. Use md when the host also has `class="lead"`. |
| `active` | `boolean` | `true` | no | `false` keeps the host in the DOM as an empty `role="status"` region (no ring, no text, no height). A page that starts a wait while it is open mounts the line idle, then sets `active`, so the sentence is announced (D-2). |
| `delay` | `boolean` (attribute) | `true` | no | The whole line is transparent for its first 400 ms after it becomes active. The text is in the DOM from the start, so it is still announced. |

### Outputs

None. Neither component is interactive.

### Content slots

| Slot | Component | Accepts | Rule |
|---|---|---|---|
| None | `zm-spinner` | — | The hidden text comes from `label`. |
| default | `zm-spinner-inline` | text | The status sentence, present tense with an ellipsis. Declared once; rendered only while `active`. |

All copy arrives translated through `label` or the slot (L2-111).

## Variants and sizes

| Variant | Component | Use for |
|---|---|---|
| Decorative ring | `zm-spinner` without `label` | Inside another component that carries the words (the inline message's busy state, the status line). |
| Lone spinner | `zm-spinner` with `label` | An area waiting for content with no visible text ("Processing video"). |
| Status line | `zm-spinner-inline` | A visible sentence about the wait, under a field or above a list. |

| Size | Modifier | Ring | Rule width | Pairs with |
|---|---|---|---|---|
| Small | `.spinner--sm` | 1 rem | `--border-width-thick` | `--text-caption`, `--text-stub`, dense rows |
| Medium | — | 1.5 rem | `--border-width-thick` | `--text-body`, `--text-body-lg` (`.lead`) |
| Large | `.spinner--lg` | 2.5 rem | `--border-width-poster` | stands alone |

A busy button's ring is 1em and belongs to the button.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Turning | rendered | Ring turns once per `--duration-loop`, linear | Ring hidden; label or sentence read once by the polite region |
| Delayed | first 400 ms with `delay` | Ring (or the whole line) at `opacity: 0`, space reserved | Text already in the region, so it is announced |
| Idle | `zm-spinner-inline` with `active = false` | Nothing visible, no height | Empty `role="status"` region, ready to announce |
| Reduced motion | `prefers-reduced-motion: reduce` | Ring holds still with its gap showing | Unchanged |
| On the stage | `.on-stage` ancestor | Ring and text in `--color-fg-on-stage` (inherited) | Unchanged |
| On yellow | inside an accent fill | Ring in `--color-fg-on-accent` (inherited) | Unchanged |
| Done | consumer removes it or sets `active = false` | Replaced by the result | The result is announced by its own region |

A spinner has no hover, focus, disabled or error state; it is never focusable.

## Markup

`zm-spinner`, decorative and lone:

```html
<zm-spinner aria-hidden="true"><span class="spinner spinner--sm" aria-hidden="true"></span></zm-spinner>

<zm-spinner role="status">
  <span class="spinner spinner--lg" aria-hidden="true"></span><span class="visually-hidden">Processing video</span>
</zm-spinner>
```

`zm-spinner-inline`, active and idle:

```html
<zm-spinner-inline class="spinner-inline lead" role="status">
  <span class="spinner" aria-hidden="true"></span>Confirming naomi.fraser@riversidecc.ca…
</zm-spinner-inline>

<zm-spinner-inline class="spinner-inline" role="status"></zm-spinner-inline>
```

This corrects the verify-email and confirm-email mocks, whose
`<span class="spinner-inline" aria-hidden="true">` was empty inside a
`<p class="lead" role="status" aria-live="polite">`, so no ring rendered (D-1).
`role="status"` already implies polite announcements; `aria-live` is not added.

Consumer templates:

```html
<zm-spinner-inline class="lead" size="md">{{ 'verifyEmail.confirming' | transloco: { email: email() } }}</zm-spinner-inline>

<zm-spinner-inline class="lead" size="md" [active]="searching()">{{ t('discover.loading', { date: longDate() }) }}</zm-spinner-inline>

<zm-spinner size="lg" [label]="'video.processing' | transloco" />
```

The `.spinner`, `.spinner--sm`, `.spinner--lg` and `.spinner-inline` classes and
the `role="status"` on the host are a contract: e2e page objects find the status
line by role and read its text.

## Design

- Ring: inline-block, `flex: none`, `--border-width-thick` (sm, md) or
  `--border-width-poster` (lg) solid `currentColor`, right side transparent,
  `--radius-full`. Sizes 1 rem, 1.5 rem, 2.5 rem.
- Turn: `animation: spin var(--duration-loop) linear infinite` (`@keyframes spin`
  to `rotate(1turn)`).
- Status line: `display: inline-flex`, `align-items: center`, gap `--space-2`,
  `--text-stub`, uppercase. When the text wraps, `align-items: flex-start` keeps
  the ring on the first line (D-5).
- Delay: a zero-length `animation` from `opacity: 0` to `opacity: 1` with a
  400 ms `animation-delay` and `both` fill, so no script timer is needed.
- No layer, no elevation, no component tokens: colour is `currentColor`.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Ring and text on the page | `currentColor` from `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Ring on the stage | `--color-fg-on-stage` | per theme | per theme |
| Ring on yellow | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Ring in a hint message | `--color-fg-muted` | per theme | per theme |

"Per theme" means the semantic token resolves to a different primitive in each
theme; the rendering shows the live values.

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Status text and ring on the page |
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Status text and ring on a card |
| `--color-fg-on-stage` | `--color-bg-stage` | 4.5:1 | On the stage |
| `--color-fg-on-accent` | `--color-accent` | 3:1 | Ring on yellow |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Ring and text in a hint |

The ring is a graphic and needs 3:1; it shares the text colour, which clears
4.5:1. Under forced colours `currentColor` follows the system text colour.

## Responsive behaviour

- Spinners keep their size at every breakpoint; they follow the text beside
  them.
- The status line wraps under itself; the ring stays at the start of the first
  line. At 320 px "Confirming naomi.fraser@riversidecc.ca…" wraps after
  "Confirming"; at 200 % zoom the address no longer fits one line and breaks
  inside (`overflow-wrap: anywhere`) rather than overflowing (D-5).
- At 320 px nothing scrolls horizontally or clips; at 200 % zoom the line grows
  taller. Nothing is a touch target.

## Accessibility

### Role and pattern

No APG widget applies; the rule is WCAG 4.1.3 Status Messages. The ring is
always `aria-hidden="true"`. The words live in a `role="status"` host: the lone
spinner's hidden label or the status line's sentence. A spinner never takes
`role="status"` on a heading and never replaces a heading (the page's `h1`
stays an `h1`).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Skips the spinner; it is never focusable. |

### Focus

Showing or removing a spinner never moves focus. Focus stays on the control
that started the wait.

### Labelling

The label names the wait with a present-tense verb: "Processing video",
"Checking Abigail's calendar…". No `aria-label` on the ring. A decorative
`zm-spinner` without `label` is hidden as a whole.

### Announcements

The host is the live region. A status line rendered with the page (verify
email) is read when the page loads; one that starts later is mounted idle
(`active = false`) and announced when it becomes active. The text is announced
even during the 400 ms visual delay.

### Motion

The ring turns once per `--duration-loop` (900 ms), a slow non-flashing
rotation. Under `prefers-reduced-motion: reduce` the component sets
`animation: none` on the ring, so it holds still and the words carry the
meaning (L2-103). `--duration-loop` itself is not overridden, because a
near-zero infinite loop would spin at full speed. The delay is not motion and
stays.

## Content and internationalisation

- Present tense and an ellipsis: "Checking calendars…", "Sending request…",
  "Confirming naomi.fraser@riversidecc.ca…". Never "Please wait" or "Loading"
  alone.
- Say what is happening for the person, with the real object and date:
  "Finding who's free on Saturday 14 November 2026…" (long date, L2-110).
- Translatable: `label` and the slot text, from the catalogue (L2-111). Data:
  email addresses and names interpolated by the consumer.
- French runs about 30 % longer; the line wraps, the ring stays on the first
  line.

## Performance

- Change detection: `OnPush`, signal inputs; the size class and the role are
  host bindings. No timers, no subscriptions: the delay is CSS.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Spinner.ts`
  renders a lone `zm-spinner` lg labelled "Processing video";
  `SpinnerInline.ts` renders `zm-spinner-inline` "Checking calendars…". Both are
  tuned in `e2e/perf-test/config/scenario-iterations.mjs` to roughly
  100–300 ms.
- Composite scenarios: `InlineMessage.ts` composes `zm-spinner` only in its busy
  case; none otherwise.
- Layout stability: the ring is `flex: none` with a fixed size, and the delay
  uses opacity, so the space is reserved from the first frame and nothing
  shifts when it becomes visible.
- Imports: nothing beyond `@angular/core`.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-spinner />`, when it renders, then it contains one `span.spinner` 1.5 rem square drawn in `currentColor`, the host is `aria-hidden="true"` and the accessibility tree contains nothing for it. (L2-100)
- **AC-2** Given `size` "sm" and "lg", when they render, then the rings are 1 rem with `--border-width-thick` and 2.5 rem with `--border-width-poster` respectively. (L2-100)
- **AC-3** Given `zm-spinner` with `size` "lg" and `label` "Processing video" in a video card, when it renders, then the host has `role="status"`, the ring is `aria-hidden="true"` and "Processing video" is visually hidden text that a screen reader announces. (L2-052)
- **AC-4** Given `zm-spinner-inline` with "Checking calendars…", when it renders, then the host has `.spinner-inline` and `role="status"`, a small ring precedes the uppercase text and the text is announced politely. (L2-102)
- **AC-5** Given the verify-email page, when it renders the status line "Confirming naomi.fraser@riversidecc.ca…" with `size` "md" and `class="lead"`, then a visible 1.5 rem ring precedes the text. (L2-022)
- **AC-6** Given the confirm-email page, when it renders "Switching your sign-in to naomi@riversidecc.ca…", then the line has a visible ring and is announced, and the paragraph below ("Until this finishes you still sign in with naomi.fraser@riversidecc.ca.") is not part of the live region. (L2-025)

### States

- **AC-7** Given `zm-spinner-inline` with `active` false, when it renders, then the host is an empty `role="status"` element with no ring, no text and zero height. (L2-102)
- **AC-8** Given an idle status line on Discover, when a search starts and `active` becomes true with "Finding who's free on Saturday 14 November 2026…", then a screen reader announces the sentence once. (L2-105)
- **AC-9** Given `delay` on (the default), when a spinner is shown and removed 300 ms later, then it was never visible (opacity 0 throughout); when it stays, it becomes fully visible at 400 ms without moving anything around it. (L2-105)
- **AC-10** Given `delay` false, when the spinner renders, then it is visible in the first frame. (L2-105)
- **AC-11** Given a status line on the stage (`.on-stage`), when it renders, then ring and text use `--color-fg-on-stage`; inside a yellow fill the ring uses `--color-fg-on-accent`. (L2-103)

### Keyboard and focus

- **AC-12** Given a page with a status line and a button after it, when the user tabs, then focus moves past the spinner to the button; a spinner appearing or disappearing never moves focus. (L2-101)

### Screen readers

- **AC-13** Given the artist profile while loading, with a visually hidden `h1` "Artist profile", when a status line is shown, then it is a separate element and the `h1` keeps its heading role. (L2-102)
- **AC-14** Given every route that shows a spinner, in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-15** Given the dark theme, when a status line renders on the canvas, then the ring and text use the dark `--color-fg-default` with no extra rule. (L2-104)
- **AC-16** Given both themes, when contrast is measured, then the ring against the page, a card and the stage is at least 3:1 and the status text at least 4.5:1. (L2-103)

### Responsive

- **AC-17** Given a 320 px viewport and "Confirming naomi.fraser@riversidecc.ca…", when the line renders, then the text wraps (inside the address if it is wider than the line), the ring stays at the start of the first line and the page does not scroll horizontally. (L2-096)
- **AC-18** Given the French catalogue, when "Checking calendars…" becomes about 30 % longer, then the line wraps within its container without clipping. (L2-111)

### Motion

- **AC-19** Given `prefers-reduced-motion: reduce`, when a spinner renders, then the ring does not rotate, its transparent quarter stays visible and its text is unchanged. (L2-103)

### Performance

- **AC-20** Given the `Spinner` and `SpinnerInline` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The spinner is planned. To build it:

- Folder `frontend/projects/components/src/lib/spinner/` with `spinner.ts`
  (class `Spinner`, selector `zm-spinner`) and `spinner-inline.ts` (class
  `SpinnerInline`, selector `zm-spinner-inline`); export both from
  `public-api.ts`.
- `SpinnerInline` imports `Spinner` and renders
  `<zm-spinner [size]="size()" [delay]="false" />` (the line's own delay covers
  the ring) before the slot, inside one `@if (active())`. The slot is declared
  once.
- Copy the `.spinner`, `.spinner--sm`, `.spinner--lg`, `.spinner-inline` rules
  and the reduced-motion rule from `components.css` into the components' own
  styles; `@keyframes spin` stays local to the component.
- Add `.spinner-inline { overflow-wrap: anywhere; }` and, when wrapping, keep the
  ring on the first line (D-5).
- Add the perf-test scenarios `Spinner.ts` and `SpinnerInline.ts` and export
  them from `scenarios/index.ts`.
- Update the verify-email and confirm-email pages to the corrected markup
  (D-1) when those slices are built.

## Decisions

- **D-1** *The verify-email and confirm-email mocks render an empty `.spinner-inline` span inside a status paragraph: what is the correct markup?* The paragraph itself is the status line: `zm-spinner-inline` (host `.spinner-inline`, `role="status"`, `class="lead"`) holding a md ring and the sentence. The design system's anatomy and code show the ring inside the status line; the empty span drew nothing, so the mock drifted.
- **D-2** *How does a status line that starts while the page is open get announced?* `zm-spinner-inline` has `active`: the host stays mounted as an empty `role="status"` region and fills when active. The design system requires the status element to exist before the wait starts (4.1.3), and a live region inserted together with its text is not announced reliably.
- **D-3** *Does the component own the 400 ms delay?* Yes, by CSS (`delay`, on by default): a zero-length opacity animation with a 400 ms delay. It needs no timer, reserves the space, and keeps the text in the region so the announcement is not delayed.
- **D-4** *Does the component own the 600 ms minimum and the 8-second "Still checking — thanks for waiting." copy?* No. Both depend on when the work finishes and which copy applies, which only the page or store knows; the component would need the result to enforce them. The consumer keeps the busy state for at least 600 ms after the spinner became visible and swaps the label after 8 s.
- **D-5** *What happens when the status text is wider than its line?* It wraps under itself with the ring at the start of the first line (`align-items: flex-start` for wrapped lines), and an unbreakable address breaks inside (`overflow-wrap: anywhere`). The 320 px rendering shows the uppercase mono address only just fits a line on its own, so at 200 % zoom it cannot; truncating would hide which address is being confirmed (L2-096).
- **D-6** *One component with an `inline` input, or two?* Two. The ring has no slot and no semantics of its own, while the status line is a live region with a slot; one component would need a conditional slot (AGENTS.md: declare each slot once) and a conditional role.
- **D-7** *Two perf scenarios, or one?* Two (`Spinner.ts`, `SpinnerInline.ts`): AGENTS.md requires a scenario for every component in the library, and these are two components.
