# Divider

| Field | Value |
|---|---|
| Selector | `zm-divider` |
| Library path | `frontend/projects/components/src/lib/divider/` |
| Status | planned |
| Traces to | L2-048, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 |
| Design system | [`divider.html`](../../design-system/components/divider.html) |
| Source mocks | [`pages/admin-application/default`](../../mocks/pages/admin-application/default.html), [`pages/admin-application/verified`](../../mocks/pages/admin-application/verified.html), [`pages/admin-application/approved`](../../mocks/pages/admin-application/approved.html), [`dialogs/reject-application/default`](../../mocks/dialogs/reject-application/default.html) (and its busy, failed and invalid states) |
| Rendering | [`divider.html`](divider.html) |

## Purpose and scope

A divider is a printed rule between two groups of content, for the places where
space alone does not show that they are separate: inside a dense panel, between
a form and its fine print. It is thin when it only separates, strong when it
closes a block, and dashed like a ticket's tear line when what follows can be
torn off (the price, the totals, the fine print). A labelled divider names the
alternative that follows: "Or pick a nearby date".

Most separation in Zamaro comes from space and from rules that components
already draw. Use something else when:

- children of a column just need space between them → `.stack` ([container](container.md));
- items of a list need hairlines → the list's own `.list--divided` ([list](list.md));
- page bands need a rule between them → `.section + .section` ([container](container.md));
- the rule is part of a component (the ticket's perforated stub, the booking
  ticket's dashed head, the setlist's song rules, the dialog's footer rule) →
  that component draws it with a border ([ticket](ticket.md),
  [booking ticket](booking-form.md), [setlist](setlist.md), [dialog](dialog.md));
- the next block needs a name → a heading, never a labelled divider.

Out of scope:

- The 4 px yellow rule that separates parts of the stage (top bar, poster,
  footer). It belongs to those components (`--border-width-poster`,
  `--color-accent`); a `zm-divider` is never placed on the stage.
- Splitters (focusable separators that resize panes). Zamaro has none.
- The layout around the divider (the stack or cluster it sits in).

## Usage

The mocks render 7 dividers, all the same configuration; the design system
specifies four more forms that complete the component. The API builds every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/admin-application/default`, `verified`, `approved` "Church references" panel | hairline, `<hr>`, default spacing | between Pastor Samuel Osei's block and Ruth Kim's block, each a definition list and a "Reference verified" checkbox | default | panel (surface) |
| `dialogs/reject-application/default`, `busy`, `failed`, `invalid` (the application page behind the dialog) | as above | as above | inert behind the dialog | panel (surface) |
| Design system, booking summary | perforated, `<hr>` | above "Deposit due now (25%) $162.50" under "Abigail Mensah · Sun 1 Nov $650" | default | surface |
| Design system, closing a block | strong, `<hr>` | between blocks of a dense card | default | surface, canvas, sunken well |
| Design system, rating row | vertical, in a non-wrapping `.cluster` | between "★ 4.9 · 38 churches", "Brampton · 44 km" and "From $650" | default | canvas |
| Design system, alternatives | label | "Or pick a nearby date", "Or send your own list" | default | surface, canvas, sunken well |
| Inside a `.stack` or a grid with a gap | any horizontal variant, `flush` | — | default | any paper surface |

## Anatomy

1. **Rule** — `.divider` on an `<hr>`: a top border, hairline (1 px) or thick
   (2 px), solid or dashed, the full width of its container.
2. **Vertical rule** — `.divider.divider--vertical` on a `<span>`: a hairline
   left border that stretches to the height of its row.
3. **Label** — `.divider.divider--label` on a `<p>`: the text in mono overline
   style between two flexible hairlines.
4. **Label lines** — the label's `::before` and `::after`: hairlines that take
   the remaining width on each side, `--space-3` from the text.
5. **Spacing** — `--space-6` above and below a horizontal divider (none with
   `flush`); `--space-2` left and right of a vertical one.

Host: `zm-divider` is `display: contents`. It renders exactly one native element
(`<hr>`, `<span>` or `<p>`) that carries every class and ARIA attribute, so the
rule is the flex or grid item of the parent's layout (a vertical divider
stretches in its cluster; a horizontal one takes the stack's width). Classes a
consumer puts on the host have no box to style; spacing is set with `flush`.

## API

### Inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `variant` | `'hairline' \| 'strong' \| 'perforated' \| 'vertical' \| 'label'` | `'hairline'` | no | Chooses the element and modifier: hairline `<hr class="divider">`, strong `<hr class="divider divider--strong">`, perforated `<hr class="divider divider--perforated">`, vertical `<span class="divider divider--vertical" role="separator" aria-orientation="vertical">`, label `<p class="divider divider--label">`. |
| `label` | `string` | `''` | when `variant` is `'label'` | The label text, from the translation catalogue: "Or pick a nearby date". Ignored by the other variants. In dev mode an empty label on the label variant logs a console error naming the component. |
| `flush` | `boolean` (attribute) | `false` | no | Adds `.divider--flush`: no block margin, for a horizontal divider inside a `.stack` or grid whose gap already spaces it. Ignored by the vertical variant. |

- Inputs are signal inputs; `flush` uses `booleanAttribute`.
- The divider has no copy of its own: the label arrives as an input (L2-111).

### Outputs

None. A divider is not interactive.

### Content slots

None. The component declares no `ng-content`; the label is an input so the one
template branch that shows text needs no slot.

## Variants and sizes

| Variant | Element and modifier | Use for |
|---|---|---|
| Hairline | `hr.divider` | Separating two groups inside a panel or card ("Church references"). The default. Decorative weight. |
| Strong | `hr.divider.divider--strong` | Closing a block, at the weight of card frames. |
| Perforated | `hr.divider.divider--perforated` | A tear line above what belongs to the block but can be torn off: the amount due, totals, fine print. At most one per block. |
| Vertical | `span.divider.divider--vertical[role=separator]` | Between blocks in one non-wrapping row. In running text use a middle dot (·) instead. |
| Label | `p.divider.divider--label` | Introducing an alternative: "Or pick a nearby date". |

There are no sizes. Each variant has one weight: hairline and vertical use
`--border-width-hairline`; strong and perforated use `--border-width-thick`.
Width is always the container's (horizontal) or the row's height (vertical).

## States

Dividers are not interactive: they have no hover, focus, active, disabled or
busy state. What changes is the surface and the user's settings.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | The variant's rule | Horizontal: separator. Vertical: separator, vertical. Label: paragraph text |
| Flush | `flush` | No block margin; the parent's gap spaces it | — |
| On canvas, surface or sunken well | ancestor background | Same tokens on every paper surface; strong and perforated keep at least 3:1 on each | — |
| Increased contrast | `prefers-contrast: more` | `--color-border-default` resolves to `--color-border-strong`, so hairlines darken; the label turns `--color-fg-default` | — |
| Forced colours | `forced-colors: active` | Both border tokens resolve to `CanvasText`; the label text follows the system text colour | — |
| Inert | an open dialog makes the page `inert` | No change | Not reachable (never was) |

## Markup

Horizontal variants render one `<hr>`:

```html
<zm-divider>
  <hr class="divider">
</zm-divider>

<zm-divider variant="perforated">
  <hr class="divider divider--perforated">
</zm-divider>
```

Strong adds `.divider--strong`; `flush` adds `.divider--flush`; the structure is
the same.

Vertical, inside the consumer's row:

```html
<div class="cluster" style="flex-wrap: nowrap">
  <zm-rating …>…</zm-rating>
  <zm-divider variant="vertical">
    <span class="divider divider--vertical" role="separator" aria-orientation="vertical"></span>
  </zm-divider>
  <span>Brampton · 44 km</span>
</div>
```

Label:

```html
<zm-divider variant="label" label="Or pick a nearby date">
  <p class="divider divider--label">Or pick a nearby date</p>
</zm-divider>
```

Consumer templates:

```html
<!-- admin application, between the two references -->
<div class="stack stack--sm">…Pastor Samuel Osei…</div>
<zm-divider />
<div class="stack stack--sm">…Ruth Kim…</div>

<!-- booking summary -->
<zm-divider variant="perforated" />

<!-- labelled alternative -->
<zm-divider variant="label" [label]="'discover.empty.nearbyDivider' | transloco" />

<!-- inside a stack -->
<div class="stack"><p>…</p><zm-divider flush /><p>…</p></div>
```

The element, the `.divider*` classes and the `role` / `aria-orientation`
attributes are the contract: e2e page objects find dividers by role
`separator` and by class for visual parity.

## Design

- Horizontal rule: `border: 0`, `border-top` of `--border-width-hairline` solid
  `--color-border-default` (hairline); `--border-width-thick` solid
  `--color-border-strong` (strong); `--border-width-thick` dashed
  `--color-border-strong` (perforated). `width: 100%`, `margin-block:
  var(--space-6)`, `margin-inline: 0`, no height of its own.
- Flush: `margin-block: 0`.
- Vertical: `width: auto`, `align-self: stretch`, `margin: 0 var(--space-2)`,
  `border-left` of `--border-width-hairline` solid `--color-border-default`, no
  top border. It needs a flex or grid parent to stretch; in any other parent it
  has no height.
- Label: `display: flex`, `align-items: center`, `gap: var(--space-3)`,
  `font: var(--text-overline)`, `letter-spacing: var(--letter-spacing-stamp)`,
  `text-transform: uppercase`, `color: var(--color-fg-muted)`,
  `text-align: center`, `margin-block: var(--space-6)` (0 with `flush`).
  `::before` and `::after`: `content: ""`, `flex: 1`, `min-width:
  var(--space-4)`, `border-top` of `--border-width-hairline` solid
  `--color-border-default` (D-3).
- No radius, no shadow, no motion, no layer.

The divider declares no component tokens. A component that needs a tinted rule
draws its own border from a semantic token (as the ticket does with
`--ticket-border`) rather than overriding the divider.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Hairline, vertical, label lines | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Strong and perforated rules | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Label text | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-border-strong` | `--color-bg-surface` | 3:1 | Strong and perforated rules on a card or panel |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Strong and perforated rules on the page |
| `--color-border-strong` | `--color-bg-surface-sunken` | 3:1 | Strong and perforated rules in a sunken well |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Label on a card or panel |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Label on the page |
| `--color-border-default` | `--color-bg-surface` | 1:1 (exempt) | Hairline: decorative, WCAG 1.4.11 does not apply |

A hairline carries no information on its own. When a rule does carry meaning
(the perforation that says "this part is the payment"), use strong or
perforated, which clear 3:1. Under `prefers-contrast: more` the hairline takes
`--color-border-strong`; under forced colours every rule is `CanvasText`.

## Responsive behaviour

- Horizontal dividers are always the full width of their container, at every
  breakpoint. Nothing changes between XS and XL.
- A vertical divider belongs in a row that does not wrap. If the row wraps on
  phones, the consumer switches it to a `.stack` below SM and uses a horizontal
  divider, or drops the divider and relies on the gap; a vertical divider never
  ends up at the start of a wrapped line.
- The label should stay on one line at 360 px (under 30 characters in English).
  When it cannot (French, 200 % zoom, 320 px), the text wraps onto more lines,
  centred, and each side line keeps at least `--space-4`, so the label is never
  clipped and never forces horizontal scroll.
- At 320 px nothing overflows; at 200 % zoom the label text grows and wraps and
  the rules keep their widths. A divider is not a target, and it never reduces
  the 8 px gap between targets on either side of it.

## Accessibility

### Role and pattern

- Horizontal: native `<hr>`, implicit role `separator` (horizontal). No ARIA
  added.
- Vertical: `<span role="separator" aria-orientation="vertical">`.
- Label: a `<p>`. It is not a separator, because a separator's content is not
  read and "Or pick a nearby date" must be. The lines are generated content and
  carry no text.
- No dividers are focusable; the
  [APG window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)
  pattern does not apply.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Skips dividers; they are never focusable. |

### Focus

Not focusable. With the default `--space-6` margin, a focus ring on the control
before or after a divider never overlaps the rule.

### Labelling

Screen readers announce `<hr>` and the vertical span as "separator". Use a
divider between groups of content, never between every item of a list (the
list announces its items and count). A divider is never used in place of a
heading.

### Announcements

None.

### Motion

None. The divider does not animate.

## Content and internationalisation

- Label text names the alternative that follows, in a few words, sentence case
  in the source: "Or pick a nearby date", "Or send your own list". The overline
  style uppercases it.
- Keep it under 30 characters in English. French runs about 30 % longer ("Ou
  choisissez une date proche"); it wraps rather than clips.
- Translatable input: `label`. The divider has no data values and no other copy.

## Performance

- Change detection: `OnPush`, signal inputs, one `@switch` on `variant` with one
  element per branch. No `effect`, no subscriptions, no host listeners.
- Perf-test scenarios: `frontend/projects/perf-test/src/scenarios/Divider.ts`
  renders the hairline between Pastor Samuel Osei's and Ruth Kim's references;
  `DividerLabel.ts` renders the labelled divider "Or pick a nearby date".
  Iterations in `e2e/perf-test/config/scenario-iterations.mjs` keep each at
  roughly 100–300 ms. Export both from `scenarios/index.ts`.
- Composite scenarios: none today; the divider is not repeated on a screen.
- Layout stability: a divider's size is fixed by its border width and margins;
  it never changes after first render and causes no layout shift (L2-086).
- Imports: Angular core only.

## Acceptance criteria

### Rendering

- **AC-1** Given `<zm-divider />` between Pastor Samuel Osei's and Ruth Kim's blocks in Tobi Adeyemi's "Church references" panel, when the application renders, then exactly one `<hr class="divider">` separates the two references, each keeps its own "Reference verified" checkbox, and the rule is the panel's full content width. (L2-048)
- **AC-2** Given a hairline divider, when its computed style is read, then its top border is `--border-width-hairline` solid `--color-border-default`, it has no other border, and its block margins are `--space-6`. (L2-096)
- **AC-3** Given `variant="strong"` and `variant="perforated"`, when they render, then the `<hr>` carries `.divider.divider--strong` (solid) or `.divider.divider--perforated` (dashed), with a `--border-width-thick` top border in `--color-border-strong`, and matches the design-system rendering in the visual test. (L2-096)
- **AC-4** Given `variant="vertical"` between "★ 4.9 · 38 churches" and "Brampton · 44 km" in a non-wrapping cluster, when it renders, then it is a `<span class="divider divider--vertical">` as tall as the row, `--space-2` from each neighbour, with a `--border-width-hairline` left rule. (L2-096)
- **AC-5** Given `variant="label"` with `label` "Or pick a nearby date", when it renders, then it is a `<p class="divider divider--label">` whose text is "Or pick a nearby date" (uppercase by CSS only), with a hairline on each side `--space-3` from the text. (L2-096)
- **AC-6** Given `flush` on a horizontal divider inside a `.stack`, when it renders, then the divider has no block margin and the space on each side equals the stack's gap. (L2-096)

### Keyboard and focus

- **AC-7** Given a page with dividers of every variant between links and buttons, when the user tabs through it, then focus never lands on a divider. (L2-101)

### Screen readers

- **AC-8** Given a horizontal divider, when the accessibility tree is read, then it is exposed as one `separator` with horizontal orientation and no name. (L2-102)
- **AC-9** Given a vertical divider, when the accessibility tree is read, then it is exposed as a `separator` with `aria-orientation="vertical"`. (L2-102)
- **AC-10** Given the labelled divider "Or pick a nearby date", when a screen reader reads the page, then it reads "Or pick a nearby date" as text, and the label is not exposed as a separator. (L2-102)
- **AC-11** Given every variant on canvas, surface and sunken backgrounds in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-12** Given the dark theme, when every variant renders, then hairlines and label lines use `--color-border-default` (dark charcoal on charcoal), strong and perforated rules use `--color-border-strong` (light grey), and the label uses `--color-fg-muted`. (L2-104)
- **AC-13** Given both themes, when contrast is measured, then strong and perforated rules are at least 3:1 against `--color-bg-surface`, `--color-bg-canvas` and `--color-bg-surface-sunken`, and the label is at least 4.5:1 against `--color-bg-surface` and `--color-bg-canvas`. (L2-103)

### Responsive

- **AC-14** Given a 320 px viewport, when each horizontal variant renders inside a panel, then it is exactly the panel's content width and the page does not scroll horizontally. (L2-096)
- **AC-15** Given the label "Or pick a nearby date" at 320 px with text zoomed to 200 %, when it renders, then the text wraps onto further centred lines without clipping, each side line stays at least `--space-4` wide, and the page does not scroll horizontally. (L2-096)
- **AC-16** Given the French catalogue's label "Ou choisissez une date proche", when it replaces the English label, then it renders from the catalogue with no code change and wraps rather than clips at 360 px. (L2-111)

### Performance

- **AC-17** Given the `Divider` and `DividerLabel` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

The divider is planned. Build it as:

- Folder `frontend/projects/components/src/lib/divider/`, file `divider.ts`,
  class `Divider`, selector `zm-divider`, exported from `public-api.ts`.
- Template: one `@switch (variant())` with an `<hr>` for hairline, strong and
  perforated (classes from one `computed`), a `<span role="separator"
  aria-orientation="vertical">` for vertical and a `<p>{{ label() }}</p>` for
  label. No `ng-content`.
- Styles in the component (encapsulated): copy `.divider*` from
  `docs/design-system/assets/components.css`, add `.divider--flush`, add
  `text-align: center` to the label and `min-width: var(--space-4)` to its
  lines (D-3). `:host { display: contents; }`.
- Dev-mode check: log a console error when `variant` is `'label'` and `label`
  is empty.
- Add `Divider.ts` and `DividerLabel.ts` to
  `frontend/projects/perf-test/src/scenarios/`, export them from `index.ts`, and
  tune their iterations.
- The admin application page (`/admin/applications/:id`) uses `<zm-divider />`
  between the references; nothing else in the product needs a divider today.

## Decisions

- **D-1** *A component, or a global `.divider` utility class?* A component, `zm-divider`. The variants change the element (`<hr>`, `<span role="separator">`, `<p>`) and the ARIA, which a class cannot guarantee; the component makes the accessible element the only way to get the look. The rule's styles stay encapsulated, as AGENTS.md requires for components.
- **D-2** *How is the label passed: an input or projected content?* An input, `label`. Only the label variant shows text, so a slot would exist in one `@switch` branch only; an input keeps the template free of conditional projection and keeps the copy a plain translated string.
- **D-3** *What happens when the label must wrap?* The text wraps onto centred lines and each side line keeps at least `--space-4`. The design system only says to keep the label short; at 320 px with 200 % zoom, or in French, it cannot stay on one line, and without a minimum the flex lines collapse to nothing and the label stops reading as a divider.
- **D-4** *How does a divider inside a stack drop its margin?* With an explicit `flush` input. The design-system page says "inside a stack, the stack gap sets it instead" but its CSS has no rule for it, and an ancestor-based `:host-context(.stack)` would also match stacks several levels up. The mocks' only dividers keep the default margin, so the default stays `--space-6`.
- **D-5** *Should the host be the native element (`hr[zm-divider]`)?* No. `<hr>` is a void element and the variants need different elements; a `zm-divider` host with `display: contents` renders the right element and still makes it the parent's flex item, so the vertical rule stretches in its row.
- **D-6** *Keep strong, perforated, vertical and label, which no mock uses yet?* Yes. The design-system page specifies each with its tokens and states, and adding them later would change the `variant` union every consumer types against.
- **D-7** *Can a divider be used on the stage?* No. The design system separates stage areas with the 4 px yellow rule, which the stage components draw. The divider defines no `.on-stage` mapping, and review rejects a `zm-divider` inside `.on-stage`.
