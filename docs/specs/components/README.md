# Component requirements documents

A component requirements document (CRD) holds everything needed to build one
`zm-*` component in the `components` library in full. An engineer who reads its
two files should be able to implement the whole component and pass every
criterion without coming back to change its API later. Each CRD is a pair of
files with the same name:

- `<component>.md` has the requirements:
  - the usage inventory across every mock
  - anatomy, API and markup
  - variants, sizes and states
  - design tokens and colour in light and dark
  - responsive behaviour, accessibility, content and internationalisation
  - render performance
  - decisions
  - numbered Given/When/Then acceptance criteria, each tracing to an L2
    requirement in [`../L2.md`](../L2.md)
- `<component>.html` renders every variant, size and state with the real
  design-system styles, in light and dark, at phone and tablet widths. Each
  rendering is labelled with the criteria it illustrates.

## The gate

A CRD is written only after three things exist:

1. the L1 and L2 requirements;
2. the component's design-system page in [`../../design-system/components/`](../../design-system/components/), or its mocks in [`../../mocks/`](../../mocks/);
3. at least one L2 requirement that governs it.

The `writing-component-requirements-documents` skill (in `.claude/skills/` and
`.agents/skills/`) writes CRDs and checks them:

```sh
python .claude/skills/writing-component-requirements-documents/scripts/check_crds.py docs/specs/components
```

## How CRDs are used

CRDs are design artifacts, so ATDD does not apply to writing them. When the
component is built, each `implementing-incrementally` slice takes one group of
acceptance criteria and turns it into failing acceptance tests. It then
implements that part of the CRD. A CRD changes only when its inputs change (L2,
mocks or the design system), and the change reaches the CRD before it reaches
the code.

## Index

55 components, 1432 acceptance criteria.

| Component | Selector | Status | Criteria | Traces to | Requirements | Rendering | Design system |
|---|---|---|---|---|---|---|---|
| Alert and banner | `zm-alert`, `zm-banner` | built (`zm-alert`); `zm-banner` planned | 30 | L2-022, L2-037, L2-038, L2-057, L2-067, L2-077, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-106, L2-107, L2-108, L2-111, L2-114 | [alert.md](alert.md) | [alert.html](alert.html) | [`alert.html`](../../design-system/components/alert.html) |
| Artwork | `zm-artwork` | built | 23 | L2-006, L2-015, L2-020, L2-051, L2-072, L2-086, L2-088, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105 | [artwork.md](artwork.md) | [artwork.html](artwork.html) | [`artwork.html`](../../design-system/components/artwork.html) |
| Avatar | `zm-avatar`, `zm-avatar-button`, `zm-avatar-group` | planned | 26 | L2-024, L2-086, L2-088, L2-096, L2-099, L2-100, L2-101, L2-103, L2-104, L2-105, L2-111 | [avatar.md](avatar.md) | [avatar.html](avatar.html) | [`avatar.html`](../../design-system/components/avatar.html) |
| Badge | `zm-badge` | built | 26 | L2-006, L2-017, L2-025, L2-026, L2-027, L2-039, L2-048, L2-049, L2-062, L2-067, L2-068, L2-069, L2-072, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-110, L2-111 | [badge.md](badge.md) | [badge.html](badge.html) | [`badge.html`](../../design-system/components/badge.html) |
| Band | `zm-band` | planned | 23 | L2-047, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111, L2-112 | [band.md](band.md) | [band.html](band.html) | [`band.html`](../../design-system/components/band.html) |
| Booking list | `zm-booking-list`, `zm-booking-list-row`, `zm-booking-list-row-skeleton` | planned | 25 | L2-033, L2-034, L2-039, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [booking-list.md](booking-list.md) | [booking-list.html](booking-list.html) | [`booking-list.html`](../../design-system/components/booking-list.html) |
| Booking ticket | `zm-booking-form`, `zm-booking-form-skeleton` | built (`zm-booking-form`, bar only); planned (`stub` and `auth` variants, `zm-booking-form-skeleton`) | 30 | L2-004, L2-019, L2-022, L2-023, L2-044, L2-086, L2-096, L2-097, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-110, L2-111 | [booking-form.md](booking-form.md) | [booking-form.html](booking-form.html) | [`booking-form.html`](../../design-system/components/booking-form.html) |
| Breadcrumb | `zm-breadcrumb` | built | 22 | L2-009, L2-012, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [breadcrumb.md](breadcrumb.md) | [breadcrumb.html](breadcrumb.html) | [`breadcrumb.html`](../../design-system/components/breadcrumb.html) |
| Button | `zm-button`, `zm-button-link`, `zm-button-anchor` | built | 29 | L2-026, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-108, L2-111 | [button.md](button.md) | [button.html](button.html) | [`button.html`](../../design-system/components/button.html) |
| Calendar | `zm-calendar` | planned | 38 | L2-056, L2-057, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [calendar.md](calendar.md) | [calendar.html](calendar.html) | [`calendar.html`](../../design-system/components/calendar.html) |
| Card | `zm-card`, `zm-panel`, `zm-message`, `zm-stat`, `zm-stat-skeleton` | planned | 32 | L2-018, L2-034, L2-045, L2-046, L2-047, L2-061, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [card.md](card.md) | [card.html](card.html) | [`card.html`](../../design-system/components/card.html) |
| Checkbox | `zm-checkbox`, `zm-checkbox-group` | planned | 29 | L2-022, L2-037, L2-048, L2-050, L2-056, L2-065, L2-068, L2-080, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [checkbox.md](checkbox.md) | [checkbox.html](checkbox.html) | [`checkbox.html`](../../design-system/components/checkbox.html) |
| Chip | `zm-chip`, `zm-chip-group` | built | 29 | L2-004, L2-008, L2-086, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [chip.md](chip.md) | [chip.html](chip.html) | [`chip.html`](../../design-system/components/chip.html) |
| Date picker | `zm-date-picker` | planned | 25 | L2-004, L2-019, L2-028, L2-049, L2-056, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-110, L2-111 | [date-picker.md](date-picker.md) | [date-picker.html](date-picker.html) | [`date-picker.html`](../../design-system/components/date-picker.html) |
| Description list | `zm-description-list` | planned | 22 | L2-034, L2-037, L2-039, L2-044, L2-046, L2-047, L2-067, L2-068, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [description-list.md](description-list.md) | [description-list.html](description-list.html) | [`description-list.html`](../../design-system/components/description-list.html) |
| Dialog | `zm-dialog` (plus the `openDialog()` helper in the same folder) | built | 30 | L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [dialog.md](dialog.md) | [dialog.html](dialog.html) | [`dialog.html`](../../design-system/components/dialog.html), with [Dialogs & overlays](../../design-system/patterns/dialogs-and-overlays.html) |
| Divider | `zm-divider` | planned | 17 | L2-048, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [divider.md](divider.md) | [divider.html](divider.html) | [`divider.html`](../../design-system/components/divider.html) |
| Empty state | `zm-empty-state`, `zm-date-swap` | built (`zm-empty-state`); planned (`zm-date-swap`) | 28 | L2-011, L2-020, L2-027, L2-033, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [empty-state.md](empty-state.md) | [empty-state.html](empty-state.html) | [`empty-state.html`](../../design-system/components/empty-state.html) |
| Error page | `zm-error-page`, `zm-error-stage` | planned | 25 | L2-021, L2-086, L2-093, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-107, L2-110, L2-111, L2-114 | [error-page.md](error-page.md) | [error-page.html](error-page.html) | [`error-page.html`](../../design-system/components/error-page.html) |
| Footer | `zm-footer` | built | 24 | L2-027, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [footer.md](footer.md) | [footer.html](footer.html) | [`footer.html`](../../design-system/components/footer.html) |
| Form field | `zm-form-field` | built | 30 | L2-004, L2-019, L2-028, L2-059, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [form-field.md](form-field.md) | [form-field.html](form-field.html) | [`form-field.html`](../../design-system/components/form-field.html) |
| Form layout | `zm-form-section`, `zm-form-section-skeleton`, `zm-form-actions`, `zm-error-summary`, plus the layout classes `.form-stack`, `.form-grid`, `.field--full`, `.fieldset`, `.form`, `.form--wide`, `.form__row`, `.form__inline`, `.form__actions` | planned | 30 | L2-004, L2-023, L2-025, L2-028, L2-047, L2-050, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 | [form-layout.md](form-layout.md) | [form-layout.html](form-layout.html) | [`form-layout.html`](../../design-system/components/form-layout.html) |
| Headliner | `zm-headliner`, `zm-headliner-skeleton` | built | 33 | L2-006, L2-007, L2-026, L2-086, L2-088, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [headliner.md](headliner.md) | [headliner.html](headliner.html) | [`headliner.html`](../../design-system/components/headliner.html) |
| Icon | `zm-icon` | built | 23 | L2-026, L2-086, L2-087, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [icon.md](icon.md) | [icon.html](icon.html) | [`iconography.html`](../../design-system/foundations/iconography.html) |
| Inline message | `zm-inline-message` | planned | 20 | L2-019, L2-048, L2-081, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-110, L2-111 | [inline-message.md](inline-message.md) | [inline-message.html](inline-message.html) | [`inline-message.html`](../../design-system/components/inline-message.html) |
| Link | `a[zm-link]` | planned | 24 | L2-044, L2-046, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-111 | [link.md](link.md) | [link.html](link.html) | [`link.html`](../../design-system/components/link.html) |
| List | `zm-list` | planned | 20 | L2-025, L2-067, L2-072, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 | [list.md](list.md) | [list.html](list.html) | [`list.html`](../../design-system/components/list.html) |
| Marquee | `zm-marquee` | built | 16 | L2-004, L2-012, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-105 | [marquee.md](marquee.md) | [marquee.html](marquee.html) | [`marquee.html`](../../design-system/components/marquee.html) |
| Menu | `zm-menu` | built | 24 | L2-023, L2-024, L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [menu.md](menu.md) | [menu.html](menu.html) | [`menu.html`](../../design-system/components/menu.html) |
| Pagination | `zm-pagination` | planned | 22 | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-110, L2-111 | [pagination.md](pagination.md) | [pagination.html](pagination.html) | [`pagination.html`](../../design-system/components/pagination.html) |
| Poster hero | `zm-poster`, `zm-artist-poster`, `zm-artist-poster-skeleton` | built (`zm-poster`); planned (`zm-artist-poster`, `zm-artist-poster-skeleton`) | 28 | L2-004, L2-011, L2-012, L2-020, L2-086, L2-088, L2-096, L2-097, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111, L2-112 | [poster.md](poster.md) | [poster.html](poster.html) | [`poster.html`](../../design-system/components/poster.html) |
| Progress bar | `zm-progress-bar`, `zm-meter` | planned | 23 | L2-049, L2-051, L2-052, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [progress-bar.md](progress-bar.md) | [progress-bar.html](progress-bar.html) | [`progress-bar.html`](../../design-system/components/progress-bar.html) |
| Radio group | `zm-radio-group`, `zm-radio` | planned | 28 | L2-030, L2-047, L2-059, L2-062, L2-068, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [radio-group.md](radio-group.md) | [radio-group.html](radio-group.html) | [`radio-group.html`](../../design-system/components/radio-group.html) |
| Rating | `zm-rating` | built | 23 | L2-006, L2-012, L2-018, L2-020, L2-060, L2-067, L2-086, L2-096, L2-100, L2-102, L2-103, L2-104, L2-105, L2-111 | [rating.md](rating.md) | [rating.html](rating.html) | [`rating.html`](../../design-system/components/rating.html) |
| Review | `zm-review`, `zm-review-skeleton` | planned | 26 | L2-018, L2-059, L2-061, L2-062, L2-075, L2-086, L2-096, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [review.md](review.md) | [review.html](review.html) | [`review.html`](../../design-system/components/review.html) |
| Save toggle | `zm-save-toggle` | planned | 26 | L2-006, L2-021, L2-026, L2-027, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [save-toggle.md](save-toggle.md) | [save-toggle.html](save-toggle.html) | [`save-toggle.html`](../../design-system/components/save-toggle.html) |
| Select | `zm-select` | planned | 26 | L2-004, L2-007, L2-019, L2-048, L2-050, L2-053, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [select.md](select.md) | [select.html](select.html) | [`select.html`](../../design-system/components/select.html) |
| Setlist | `zm-setlist` | built | 24 | L2-016, L2-053, L2-054, L2-086, L2-096, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-108, L2-111 | [setlist.md](setlist.md) | [setlist.html](setlist.html) | [`setlist.html`](../../design-system/components/setlist.html) |
| Sidebar navigation | `zm-sidebar-nav`, `zm-settings-nav` | planned | 26 | L2-025, L2-050, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [sidebar-navigation.md](sidebar-navigation.md) | [sidebar-navigation.html](sidebar-navigation.html) | [`sidebar-navigation.html`](../../design-system/components/sidebar-navigation.html) |
| Skeleton | `zm-skeleton` | built | 19 | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105 | [skeleton.md](skeleton.md) | [skeleton.html](skeleton.html) | [`skeleton.html`](../../design-system/components/skeleton.html) |
| Skip link | `zm-skip-link` | built | 20 | L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-111 | [skip-link.md](skip-link.md) | [skip-link.html](skip-link.html) | [`skip-link.html`](../../design-system/components/skip-link.html) |
| Spinner | `zm-spinner`, `zm-spinner-inline` | planned | 20 | L2-022, L2-025, L2-052, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 | [spinner.md](spinner.md) | [spinner.html](spinner.html) | [`spinner.html`](../../design-system/components/spinner.html) |
| Status stamp | `zm-stamp` | planned | 22 | L2-022, L2-029, L2-033, L2-034, L2-047, L2-068, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 | [stamp.md](stamp.md) | [stamp.html](stamp.html) | [`stamp.html`](../../design-system/components/stamp.html) |
| Steps | `zm-steps`, `zm-stepper`, `zm-timeline`, `zm-timeline-skeleton` | planned | 31 | L2-001, L2-029, L2-047, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111, L2-112 | [steps.md](steps.md) | [steps.html](steps.html) | [`steps.html`](../../design-system/components/steps.html) |
| Switch | `zm-switch` | planned | 19 | L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-111 | [switch.md](switch.md) | [switch.html](switch.html) | [`switch.html`](../../design-system/components/switch.html) |
| Table | `zm-table`, `zm-bulk-bar` | planned | 27 | L2-048, L2-049, L2-056, L2-067, L2-068, L2-069, L2-086, L2-087, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [table.md](table.md) | [table.html](table.html) | [`table.html`](../../design-system/components/table.html) |
| Tabs | `zm-tabs`, `zm-tab` | planned | 28 | L2-033, L2-034, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 | [tabs.md](tabs.md) | [tabs.html](tabs.html) | [`tabs.html`](../../design-system/components/tabs.html) |
| Text field | `zm-text-field`, `zm-file-input`, `zm-upload-list` | planned | 28 | L2-004, L2-023, L2-047, L2-055, L2-058, L2-068, L2-072, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [text-field.md](text-field.md) | [text-field.html](text-field.html) | [`text-field.html`](../../design-system/components/text-field.html) |
| Textarea | `zm-textarea` | planned | 29 | L2-019, L2-028, L2-030, L2-045, L2-047, L2-050, L2-059, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 | [textarea.md](textarea.md) | [textarea.html](textarea.html) | [`textarea.html`](../../design-system/components/textarea.html) |
| Ticket card | `zm-ticket`, `zm-ticket-skeleton` | built | 32 | L2-006, L2-007, L2-021, L2-027, L2-086, L2-088, L2-096, L2-097, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [ticket.md](ticket.md) | [ticket.html](ticket.html) | [`ticket.html`](../../design-system/components/ticket.html) |
| Toast | `zm-toast`, `zm-toast-region` (and the `ToastService` that feeds them) | planned | 37 | L2-026, L2-066, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-109, L2-110, L2-111, L2-113, L2-114 | [toast.md](toast.md) | [toast.html](toast.html) | [`toast.html`](../../design-system/components/toast.html) |
| Tooltip | `[zmTooltip]` (directive on the trigger), `zm-tooltip` (the label it renders in the overlay) | planned | 28 | L2-026, L2-086, L2-096, L2-100, L2-101, L2-103, L2-104, L2-111 | [tooltip.md](tooltip.md) | [tooltip.html](tooltip.html) | [`tooltip.html`](../../design-system/components/tooltip.html) |
| Top bar | `zm-top-bar` | built | 31 | L2-026, L2-027, L2-034, L2-066, L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 | [top-bar.md](top-bar.md) | [top-bar.html](top-bar.html) | [`top-bar.html`](../../design-system/components/top-bar.html) |
| Tour dates | `zm-tour-dates` | planned | 26 | L2-017, L2-019, L2-054, L2-056, L2-067, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 | [tour-dates.md](tour-dates.md) | [tour-dates.html](tour-dates.html) | [`tour-dates.html`](../../design-system/components/tour-dates.html) |
| Video card | `zm-video-card` | planned | 30 | L2-014, L2-052, L2-086, L2-087, L2-088, L2-096, L2-098, L2-100, L2-101, L2-103, L2-104, L2-105, L2-111 | [video-card.md](video-card.md) | [video-card.html](video-card.html) | [`video-card.html`](../../design-system/components/video-card.html) |
