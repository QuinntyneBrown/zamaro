# Zamaro design system

Extracted from [docs/mocks](../mocks/README.md) on Friday 9 October 2026. Open [index.html](index.html) in a browser (no build step); press `t` to switch theme.

The gig-poster language of the mocks — charcoal ink on warm newsprint, one butter-yellow fill, condensed uppercase display type, square corners, hard offset print shadows, a charcoal “stage” — written down as tokens, a component stylesheet and one documentation page per foundation, component and pattern. Both themes meet WCAG 2.2 AA.

## Use it

```html
<link rel="stylesheet" href="docs/design-system/tokens/tokens.css">
<link rel="stylesheet" href="docs/design-system/assets/components.css">
```

Use the classes on each page’s **Code** section; state comes from real attributes (`disabled`, `aria-pressed`, `aria-invalid`, `aria-busy`, `aria-current`…). `data-state="hover|focus|active"` is for documentation and mocks only. `data-theme="dark"` on `<html>` forces the stage; otherwise the OS preference applies.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ramps, semantic roles in both themes, status colours, all 145 contrast checks live, adding a brand theme. |
| [Typography](foundations/typography.html) | Display, sans and mono families; 16 role shorthands with specimens; weights, line heights, tracking; measure. |
| [Spacing](foundations/spacing.html) | The 4px scale, inside vs between rules, control heights and padding. |
| [Layout](foundations/layout.html) | Breakpoints, columns/gutters/margins, live grid, container and sidebar, page templates. |
| [Elevation](foundations/elevation.html) | Four hard offset shadows in both themes, surface hierarchy, the hover lift, z-order. |
| [Shape](foundations/shape.html) | Square radii, 1/2/4px rules, the round exceptions. |
| [Motion](foundations/motion.html) | Durations and easings with replayable demos, choreography, reduced motion. |
| [Iconography](foundations/iconography.html) | Icon style, sizes, labelling rules, the full icon sheet. |
| [Theming](foundations/theming.html) | Token tiers, how themes apply, paper and stage islands, adding a theme, tokens.json. |
| [Responsive](foundations/responsive.html) | Mobile-first rules, every component’s behaviour per breakpoint, touch, testing matrix. |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA checklist, focus and target tokens, component contract, testing. |
| [Content](foundations/content.html) | Voice and tone, casing, formats, button verbs, error and empty formulas, microcopy library. |

## Components

| Component | Variants | States | Source mocks |
|---|---|---|---|
| **Actions** | | | |
| [Button](components/button.html) | primary, secondary, ink, ghost, link, danger; icon, icon-only, block; sm/md/lg | hover, focus, active, disabled, loading, pressed, expanded | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html), [discover/empty](../mocks/pages/discover/empty.html), [discover/error](../mocks/pages/discover/error.html), [artist/default](../mocks/pages/artist/default.html) |
| [Link](components/link.html) | inline, standalone, external, on stage | hover, focus, visited | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Menu](components/menu.html) | account, sort; sections, checkable, danger item | open, item hover/focus, checked, disabled | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Save toggle](components/save-toggle.html) | off, on | hover, focus, active, disabled, busy | [discover/default](../mocks/pages/discover/default.html) |
| **Inputs** | | | |
| [Form field](components/form-field.html) | label, optional, help, error, counter, success help | invalid, success | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Text field](components/text-field.html) | text, email, search, number, password, addons; sm/md/lg | hover, focus, invalid, read-only, disabled | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Textarea](components/textarea.html) | default, auto-grow, with counter | focus, invalid, read-only, disabled | [artist/default](../mocks/pages/artist/default.html) |
| [Select](components/select.html) | native, with placeholder; sm/md/lg | hover, focus, invalid, disabled | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Date picker](components/date-picker.html) | native date, with presets | focus, invalid, disabled | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Checkbox](components/checkbox.html) | single, group, with description | checked, indeterminate, invalid, disabled | core set (not in mocks yet) |
| [Radio group](components/radio-group.html) | vertical, inline, card | checked, invalid, disabled | core set (not in mocks yet) |
| [Switch](components/switch.html) | label right/left, with description | on, off, focus, disabled | core set (not in mocks yet) |
| [Chip](components/chip.html) | filter toggle, static tag, removable; sm/md | hover, focus, active, pressed, disabled | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html), [discover/empty](../mocks/pages/discover/empty.html) |
| [Form layout](components/form-layout.html) | single column, two column, inline, actions bar, error summary | submitting | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| **Navigation** | | | |
| [Top bar](components/top-bar.html) | full, compact (phone) | current, hover, focus, expanded | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Sidebar navigation](components/sidebar-navigation.html) | grouped, collapsible, badges, collapsed | current, hover, expanded | core set (not in mocks yet) |
| [Tabs](components/tabs.html) | underline, stamp, counts; sm/md | selected, hover, focus, disabled | core set (not in mocks yet) |
| [Breadcrumb](components/breadcrumb.html) | on stage, on paper, collapsed | current, hover | [artist/default](../mocks/pages/artist/default.html), [artist/loading](../mocks/pages/artist/loading.html), [artist/empty](../mocks/pages/artist/empty.html), [artist/error](../mocks/pages/artist/error.html) |
| [Pagination](components/pagination.html) | numbered, prev/next, status | current, hover, disabled | core set (not in mocks yet) |
| [Skip link](components/skip-link.html) | default | focused | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Footer](components/footer.html) | stage, simple | link hover | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| **Containers & overlays** | | | |
| [Container & stack](components/container.html) | container, stack, cluster, grid, section, profile layout | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Divider](components/divider.html) | hairline, strong, perforated, vertical, labelled | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Card](components/card.html) | default, interactive, header/footer, media, selected, flat | hover, focus-within, selected | core set (not in mocks yet) |
| [Dialog](components/dialog.html) | confirm, destructive, form; sm/md/lg; sheet on phones | open, busy, invalid | core set (not in mocks yet) |
| [Tooltip](components/tooltip.html) | above, below, with shortcut | visible | core set (not in mocks yet) |
| **Data display** | | | |
| [Table](components/table.html) | default, dense, sortable, selectable, row actions, sticky | row hover, selected, loading, empty, error | core set (not in mocks yet) |
| [List](components/list.html) | simple, divided, two-line, interactive, with avatar | hover, current | core set (not in mocks yet) |
| [Description list](components/description-list.html) | vertical, horizontal, stub | – | core set (not in mocks yet) |
| [Avatar](components/avatar.html) | initials, image, icon, ink; group; status; sm/md/lg | hover (button) | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Badge](components/badge.html) | outline, free, booked, count, four tones, solid | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Rating](components/rating.html) | score, stars, count | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Setlist](components/setlist.html) | two column, single | – | [artist/default](../mocks/pages/artist/default.html), [artist/empty](../mocks/pages/artist/empty.html) |
| [Tour dates](components/tour-dates.html) | free, booked, your date | current | [artist/default](../mocks/pages/artist/default.html), [artist/empty](../mocks/pages/artist/empty.html) |
| **Feedback** | | | |
| [Alert & banner](components/alert.html) | info, success, warning, danger; dismissible, compact; banner | – | [discover/error](../mocks/pages/discover/error.html), [artist/error](../mocks/pages/artist/error.html) |
| [Inline message](components/inline-message.html) | info, success, warning, danger | – | [artist/default](../mocks/pages/artist/default.html), [artist/empty](../mocks/pages/artist/empty.html) |
| [Toast](components/toast.html) | success, info, warning, danger; with action; stacked | leaving | [discover/default](../mocks/pages/discover/default.html) |
| [Progress bar](components/progress-bar.html) | determinate, indeterminate, success, danger | – | core set (not in mocks yet) |
| [Spinner](components/spinner.html) | sm, md, lg, inline | – | [discover/loading](../mocks/pages/discover/loading.html) |
| [Skeleton](components/skeleton.html) | text, title, poster, figure, block, control, circle, portrait, wide; composed | – | [discover/loading](../mocks/pages/discover/loading.html), [artist/loading](../mocks/pages/artist/loading.html) |
| [Empty state](components/empty-state.html) | full, quiet; with date swap | date-swap hover | [discover/empty](../mocks/pages/discover/empty.html), [artist/empty](../mocks/pages/artist/empty.html) |
| [Error page](components/error-page.html) | 404, 403, 500, offline, maintenance | – | [artist/error](../mocks/pages/artist/error.html), [discover/error](../mocks/pages/discover/error.html) |
| **Zamaro signatures** | | | |
| [Poster hero](components/poster.html) | discover hero, artist header | loading, error | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html), [discover/empty](../mocks/pages/discover/empty.html), [discover/error](../mocks/pages/discover/error.html), [artist/default](../mocks/pages/artist/default.html), [artist/loading](../mocks/pages/artist/loading.html), [artist/empty](../mocks/pages/artist/empty.html), [artist/error](../mocks/pages/artist/error.html) |
| [Marquee](components/marquee.html) | yellow, stage | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html) |
| [Booking ticket](components/booking-form.html) | hero bar, profile stub | busy, invalid, success | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html), [artist/default](../mocks/pages/artist/default.html), [artist/empty](../mocks/pages/artist/empty.html) |
| [Ticket card](components/ticket.html) | default, loading, booked | hover, focus-within | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html) |
| [Headliner](components/headliner.html) | default, loading | hover | [discover/default](../mocks/pages/discover/default.html), [discover/loading](../mocks/pages/discover/loading.html) |
| [Steps](components/steps.html) | horizontal, vertical, progress | current, complete | [discover/default](../mocks/pages/discover/default.html) |
| [Review](components/review.html) | default, with stars | – | [artist/default](../mocks/pages/artist/default.html) |
| [Artwork](components/artwork.html) | solo, group, wide, square, tilt, yellow, tag, photo | – | [discover/default](../mocks/pages/discover/default.html), [artist/default](../mocks/pages/artist/default.html), [artist/empty](../mocks/pages/artist/empty.html) |
| [Video card](components/video-card.html) | default | hover, focus, active, busy | [artist/default](../mocks/pages/artist/default.html) |
| [Band](components/band.html) | default | button hover | [discover/default](../mocks/pages/discover/default.html) |

Every component page has the same thirteen sections: overview, anatomy, variants, sizes, states (every variant × every state, both themes), responsive, theming, accessibility (role/pattern, keyboard, focus, labelling, live contrast, motion, touch), content, do and don’t, tokens (live light and dark values), code and sources (mocks + drift fixed).

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | Layout, labels, validation timing, error summary, submit states, the booking request. |
| [Feedback & loading](patterns/feedback-and-loading.html) | Which feedback for which event; skeleton vs spinner vs progress; optimistic save. |
| [Empty & error states](patterns/empty-and-error-states.html) | Copy formulas, stamp words, first-run vs no-results vs error, recovery. |
| [Navigation & page structure](patterns/navigation-and-page-structure.html) | The shell, poster hero, breadcrumbs, back behaviour, mobile menu. |
| [Dialogs & overlays](patterns/dialogs-and-overlays.html) | Dialog vs sheet vs menu vs tooltip vs page; stacking. |
| [Data tables & lists](patterns/data-tables-and-lists.html) | Tickets vs tables vs lists; sort, filter, pagination, responsive tables. |
| [Notifications](patterns/notifications.html) | Toast vs banner vs notification centre; priority and timing. |
| [Content & tone](patterns/content-and-tone.html) | Voice, poster vocabulary, formats, microcopy library. |

## Tokens

- [`tokens/tokens.css`](tokens/tokens.css) — the single source of truth: primitives, semantic tokens, light (“newsprint”, `:root` and `[data-theme="light"]`) and dark (“stage”, `[data-theme="dark"]` and `prefers-color-scheme`), reduced motion, more contrast and forced colours.
- [`tokens/tokens.json`](tokens/tokens.json) — W3C DTCG export (270 entries with theme overrides), generated from `tokens.css`.
- [`tokens/contrast-pairs.json`](tokens/contrast-pairs.json) — every foreground/background pairing the components rely on; checked in both themes.
- [`assets/components.css`](assets/components.css) — the product stylesheet; token-only, with component tokens (`--btn-*`, `--field-*`, `--chip-*`, `--ticket-*`…) and `data-state` hooks.
- [`assets/ds.css`](assets/ds.css), [`assets/ds.js`](assets/ds.js) — documentation chrome: theme toggle, live token values and contrast ratios.

The mocks now read the system: `docs/mocks/assets/tokens.css` and `ui.css` forward to the two files above.

## Drift found in the mocks

| Mock | Issue | Resolution |
|---|---|---|
| assets/ui.css (13 rules) | Components read primitives directly (`--palette-ink`, `--palette-paper*`) for outlines, fills and text: primary button, free and count badges, avatar, brand mark, skip link, step numbers, video play stamp, yellow artwork, art tag, marquee, band, booking bar. | Semantic tokens `--color-border-on-accent`, `--color-fg-on-accent`, the inverse pair, stage tokens, and a `data-theme="light"` paper island for the booking bar. |
| assets/ui.css | `.btn--ink` and pressed `.chip` borrowed `--color-fg-default` / `--color-bg-canvas` as fill and text. | Use `--color-bg-inverse` / `--color-fg-inverse`. |
| assets/ui.css | A disabled primary button kept its yellow fill. | Disabled drops every variant to the subtle fill with disabled text and rule. |
| pages/artist/default | The “Saved” toggle had `aria-pressed="true"` but no pressed style. | Pressed buttons fill yellow with a filled icon. |
| pages/*/default (8 mocks) | The top-bar “Saved” button combined `.nav-link`, `.btn--ghost` and an inline style reset. | `.nav-link` resets buttons itself; markup uses one class. |
| pages/discover/* (4 mocks) | Sort field used `style="min-width: 12rem"`. | `.field--inline`. |
| pages/artist/default, empty | Stub heading used `style="font: var(--text-h3)"`; About copy used `style="margin-top: var(--space-4)"`. | `.stub__title`, `.section__body`. |
| pages/artist/error | Container used an inline `padding-block`. | `.page-error`. |
| pages/artist/default, empty | Success help (“✓ Abigail is free Sat 14 Nov”) was plain muted text with a typed ✓. | `.inline-msg--success` with a check icon (4.5:1 success text). |
| pages/discover/loading, artist/loading | 19 skeleton sizes were inline `style` widths and heights. | Skeleton modifiers: `--short/--medium/--long`, `--portrait`, `--wide`, `--control`, `--control-lg`, `--target`, `--figure`, `--block`. |
| assets/ui.css | Stage skeletons read `--palette-ink-800/700`. | `--color-bg-stage-raised` and `--color-bg-stage-raised-hover`. |
| pages/discover/loading | Disabled filter chips had no disabled style. | `.chip:disabled`. |
| assets/ui.css | `.chip__count` used `opacity: 0.75` (contrast risk). | Full-strength colour. |
| pages/discover/error, artist/error | `.alert` was danger-only by default. | Tones: info (default), `--success`, `--warning`, `--danger`; mocks use `alert alert--danger`. |
| assets/ui.css | Invalid styling covered `.input` only, and no field error element existed. | Invalid state for input, select and textarea; `.field__error` with `aria-describedby`. |
| assets/ui.css | `.review figcaption span` also restyled the stars; the quote mark declared `color` twice. | Scoped to non-star spans; single declaration. |
| assets/ui.css + mock note | Toast region sat at `bottom: --space-16` to clear the mock bar, and no toast existed although the mock note promises “Saved Luz Viva”. | `.toast` component; region at `--space-6` (phones `--space-4` + safe area). |
| assets/ui.css | Seven inline display-font shorthands (`var(--font-weight-regular) var(--font-size-2xl) / 1 var(--font-family-display)` …). | Role tokens `--text-figure`, `--text-figure-lg`; marquee and setlist songs snap to `--text-h4`. |
| assets/ui.css | Off-grid sizes: brand mark 1.9rem (30.4px), ticket notch 0.9rem, skeleton bars 0.9rem and 1.8rem, count badge 1.4em. | 2rem, 1rem, 1rem / 1.75rem, 1.5em. |
| assets/tokens.css | Shadow offsets 3px and 5px were off the grid. | 4px and 6px (`--size-offset-1/2`); 8px and 12px unchanged. |
| assets/tokens.css | Dark subtle text `#97948d` measured 4.56:1 on raised surfaces, a thin margin. | `--palette-ink-400` lightened to `#a19e97` (5.17:1). |
| assets/tokens.css | `--palette-ink` was both a colour and a ramp group (invalid in DTCG); `--offset-*`, `--lift`, `--shadow-color`, `--ease-snap` didn’t follow the naming scheme. | `--palette-ink-750`, `--size-offset-*`, `--transform-lift`, `--color-shadow`, `--ease-spring`. |
| assets/tokens.css | Light colours were declared on `:root` only, so a light island inside a dark page (and the docs’ side-by-side themes) inherited dark values; shadows embedded the root colour. | Light colours on `:root, [data-theme="light"]`; shadows re-declared per theme. |
| assets/ui.css | Spinners used `--duration-deliberate`, which reduced motion zeroes, making them spin at effectively infinite speed. | `--duration-loop` (kept under reduced motion); skeleton sweep stops instead. |
| assets/ui.css | Ticket notches always painted `--color-bg-canvas`, wrong on any other surface. | `--ticket-notch-bg` component token. |
| all pages | `aria-label` sat on plain `<span>`s (the Saved count badge, review stars), which many screen readers ignore. | Give the element `role="img"` (stars) or put the count in the button’s visible or hidden text. |
| pages/discover/empty | “Search within 120 km · 2 choirs free” is too long for a phone button and overflowed at 360px once labels stopped wrapping. | Label shortened to “Search within 120 km”; the count moved into the sentence above. Buttons also wrap to a balanced second line as a safety net. |
| pages/artist/loading | `role="status"` on the page `<h1>` replaced its heading role. | A plain visually hidden `<h1>` plus a separate `role="status"` line. |
| pages/discover/empty, artist/empty | Decorative stamps (“Sold out”, “Fresh on the bill”, “Opening night”) were read aloud before the real title. | Stamps are `aria-hidden="true"`. |
| pages/discover/empty | Date-swap buttons read “Sun 20 Dec2 choirs free”: no space between date and count. | A space after the date. |
| all pages | The top bar overflowed 360px by 15px when no condensed display font is installed. | Tighter gaps and a 22px wordmark below 640px; brand mark never shrinks. |

Decisions kept from the mocks rather than normalised: a 20px phone margin (so ticket notches clear the screen edge), a 3px focus ring with 3px offset, 44px default control height, all-zero radii, and round radios and switches as the only rounded controls besides avatars and the save toggle.

## Verification

VERIFICATION_PLACEHOLDER
