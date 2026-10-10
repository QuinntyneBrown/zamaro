# Zamaro design system

Extracted from [docs/mocks](../mocks/README.md) on Friday 9 October 2026. Open [index.html](index.html) in a browser (no build step); press `t` to switch theme.

The gig-poster language of the mocks — charcoal ink on warm newsprint, one butter-yellow fill, condensed uppercase display type, square corners, hard offset print shadows, a charcoal “stage” — written down as tokens, a component stylesheet and one documentation page per foundation, component and pattern. Both themes meet WCAG 2.2 AA.

## Use it

```html
<link rel="stylesheet" href="docs/design-system/tokens/tokens.css">
<link rel="stylesheet" href="docs/design-system/assets/components.css">
```

The system serves both front-end applications, the public app and the administrator app under `/admin`: every reusable `zm-*` component in the shared `components` library implements one page here. Use the classes on each page’s **Code** section; state comes from real attributes (`disabled`, `aria-pressed`, `aria-invalid`, `aria-busy`, `aria-current`…). `data-state="hover|focus|active"` is for documentation and mocks only. `data-theme="dark"` on `<html>` forces the stage; otherwise the OS preference applies.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ramps, semantic roles in both themes, status colours, all 169 contrast checks live, adding a brand theme. |
| [Typography](foundations/typography.html) | Display, sans and mono families; 16 role shorthands with specimens; weights, line heights, tracking; measure. |
| [Spacing](foundations/spacing.html) | The 4px scale, inside vs between rules, control heights and padding. |
| [Layout](foundations/layout.html) | The L2 breakpoints (XS < 576, SM 576, MD 768, LG 992, XL 1200px), columns/gutters/margins, live grid, container and sidebar, page templates. |
| [Elevation](foundations/elevation.html) | Four hard offset shadows in both themes, surface hierarchy, the hover lift, z-order. |
| [Shape](foundations/shape.html) | Square radii, 1/2/4px rules, the round exceptions. |
| [Motion](foundations/motion.html) | Durations and easings with replayable demos, choreography, reduced motion. |
| [Iconography](foundations/iconography.html) | Icon style, sizes, labelling rules, the full icon sheet. |
| [Theming](foundations/theming.html) | Token tiers, how themes apply, the theme toggle, the dark-theme wrapper, paper and stage islands, adding a theme, tokens.json. |
| [Responsive](foundations/responsive.html) | Mobile-first rules, every component’s behaviour per breakpoint, 44px touch targets, testing matrix at 320/576/768/992/1200. |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA checklist, focus and target tokens, component contract, testing. |
| [Content](foundations/content.html) | Voice and tone, casing, formats, button verbs, error and empty formulas, microcopy library. |

## Components

| Component | Variants | States | Source mocks |
|---|---|---|---|
| **Actions** | | | |
| [Button](components/button.html) | primary, secondary, ink, ghost, link, danger; icon, icon-only, block; sm/md/lg | hover, focus, active, disabled, loading, pressed, expanded | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 64 more screens |
| [Link](components/link.html) | inline, standalone, external, on stage | hover, focus, visited | Every screen: inline links in copy and `.link--standalone`, e.g. [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html) |
| [Menu](components/menu.html) | account menu, sort; link list, signed-in block, theme toggle item, sections, checkable, danger item | open, item hover/focus, checked, disabled | [dialogs/account-menu](../mocks/dialogs/account-menu/default.html), [dialogs/menu](../mocks/dialogs/menu/default.html) |
| [Save toggle](components/save-toggle.html) | off, on | hover, focus, active, disabled, busy | [pages/discover](../mocks/pages/discover/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/not-found](../mocks/pages/not-found/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |
| **Inputs** | | | |
| [Form field](components/form-field.html) | label, optional, help, error, counter, success help | invalid, success | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 41 more screens |
| [Text field](components/text-field.html) | text, email, search, number, password, addons; sm/md/lg | hover, focus, invalid, read-only, disabled | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/requests](../mocks/pages/requests/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html) and 27 more screens |
| [Textarea](components/textarea.html) | default, auto-grow, with counter | focus, invalid, read-only, disabled | [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/apply](../mocks/pages/apply/default.html) and 13 more screens |
| [Select](components/select.html) | native, with placeholder; sm/md/lg | hover, focus, invalid, disabled | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/apply](../mocks/pages/apply/default.html) and 6 more screens |
| [Date picker](components/date-picker.html) | native date, with presets | focus, invalid, disabled | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [pages/admin-audit](../mocks/pages/admin-audit/default.html) and 4 more screens |
| [Checkbox](components/checkbox.html) | single, group, with description | checked, indeterminate, invalid, disabled | [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html), [pages/sign-up](../mocks/pages/sign-up/default.html), [pages/apply](../mocks/pages/apply/default.html), [pages/admin-application](../mocks/pages/admin-application/default.html), [pages/admin-bookings](../mocks/pages/admin-bookings/default.html) and 6 more screens |
| [Radio group](components/radio-group.html) | vertical, inline, card | checked, invalid, disabled | [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html), [pages/sign-up](../mocks/pages/sign-up/default.html), [pages/apply](../mocks/pages/apply/default.html), [dialogs/decline-request](../mocks/dialogs/decline-request/default.html), [dialogs/pay-deposit](../mocks/dialogs/pay-deposit/default.html) and 4 more screens |
| [Switch](components/switch.html) | label right/left, with description | on, off, focus, disabled | Core set: no mock uses it yet |
| [Chip](components/chip.html) | filter toggle, static tag, removable; sm/md | hover, focus, active, pressed, disabled | [pages/discover](../mocks/pages/discover/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |
| [Form layout](components/form-layout.html) | single column, two column, inline, sections and grid, sticky actions bar, settings layout, error summary | submitting | [pages/discover](../mocks/pages/discover/default.html), [pages/book](../mocks/pages/book/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html), [pages/sign-in](../mocks/pages/sign-in/default.html), [pages/sign-up](../mocks/pages/sign-up/default.html) and 32 more screens |
| [Calendar](components/calendar.html) | month grid, legend, bulk bar | free, blocked, requested, booked, outside, today, selected | [pages/availability](../mocks/pages/availability/default.html), [notifications/availability-toast](../mocks/notifications/availability-toast/danger.html) |
| **Navigation** | | | |
| [Top bar](components/top-bar.html) | booker, workspace (artist and admin), signed out; full (from LG; workspace from XL), compact with drawer; theme toggle | current, hover, focus, expanded | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 37 more screens |
| [Sidebar navigation](components/sidebar-navigation.html) | grouped, collapsible, badges, collapsed | current, hover, expanded | [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html) (the `.settings-nav` variant; the grouped `.sidenav` is core set) |
| [Tabs](components/tabs.html) | underline, stamp, counts; sm/md | selected, hover, focus, disabled | [pages/bookings](../mocks/pages/bookings/default.html), [pages/requests](../mocks/pages/requests/default.html), [notifications/request-toast](../mocks/notifications/request-toast/info.html) |
| [Breadcrumb](components/breadcrumb.html) | on stage, on paper, collapsed | current, hover | [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/admin-application](../mocks/pages/admin-application/default.html), [pages/admin-artist](../mocks/pages/admin-artist/default.html), [pages/admin-booking](../mocks/pages/admin-booking/default.html) and 1 more screens |
| [Pagination](components/pagination.html) | numbered, prev/next, status | current, hover, disabled | Core set: no mock uses it yet |
| [Skip link](components/skip-link.html) | default | focused | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 37 more screens |
| [Footer](components/footer.html) | stage (booker, signed out, artist area, admin app), simple | link hover | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 37 more screens |
| **Containers & overlays** | | | |
| [Container & stack](components/container.html) | container, stack, cluster, grid, section, profile layout | – | [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/requests](../mocks/pages/requests/default.html) and 29 more screens |
| [Divider](components/divider.html) | hairline, strong, perforated, vertical, labelled | – | [pages/admin-application](../mocks/pages/admin-application/default.html) |
| [Card](components/card.html) | default, interactive, header/footer, media, selected, flat; panel, stat, message | hover, focus-within, selected | [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html), [pages/earnings](../mocks/pages/earnings/default.html) and 9 more screens |
| [Dialog](components/dialog.html) | confirm, destructive, form, drawer, anchored menu; header icon; sm/md/lg; full screen on phones | open, busy, invalid | [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html), [dialogs/accept-request](../mocks/dialogs/accept-request/default.html), [dialogs/account-menu](../mocks/dialogs/account-menu/default.html), [dialogs/add-church](../mocks/dialogs/add-church/default.html), [dialogs/add-photo](../mocks/dialogs/add-photo/default.html) and 31 more screens |
| [Tooltip](components/tooltip.html) | above, below, with shortcut | visible | Core set: no mock uses it yet |
| **Data display** | | | |
| [Table](components/table.html) | default, dense, sortable, selectable, row actions, sticky | row hover, selected, loading, empty, error | [pages/availability](../mocks/pages/availability/default.html), [pages/admin-applications](../mocks/pages/admin-applications/default.html), [pages/admin-artists](../mocks/pages/admin-artists/default.html), [pages/admin-audit](../mocks/pages/admin-audit/default.html), [pages/admin-booking](../mocks/pages/admin-booking/default.html), [pages/admin-bookings](../mocks/pages/admin-bookings/default.html) and 1 more screens |
| [List](components/list.html) | simple, divided, two-line, interactive, with avatar | hover, current | [pages/account](../mocks/pages/account/default.html), [pages/mfa-setup](../mocks/pages/mfa-setup/default.html), [dialogs/suspend-artist](../mocks/dialogs/suspend-artist/default.html) |
| [Description list](components/description-list.html) | vertical, horizontal, stub; definition grid; receipt | – | [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html), [pages/apply](../mocks/pages/apply/default.html), [pages/server-error](../mocks/pages/server-error/default.html), [pages/admin-application](../mocks/pages/admin-application/default.html) and 13 more screens |
| [Avatar](components/avatar.html) | initials, image, icon, ink; group; status; sm/md/lg | hover (button) | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 30 more screens |
| [Badge](components/badge.html) | outline, free, booked, count, four tones, solid | – | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 32 more screens |
| [Rating](components/rating.html) | full, compact, inline (as in the mocks), stars only | – | [pages/artist](../mocks/pages/artist/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/artist-reviews](../mocks/pages/artist-reviews/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [pages/admin-reviews](../mocks/pages/admin-reviews/default.html), [dialogs/hide-review](../mocks/dialogs/hide-review/default.html) and 2 more screens |
| [Setlist](components/setlist.html) | two column, single | – | [pages/artist](../mocks/pages/artist/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html) |
| [Tour dates](components/tour-dates.html) | free, booked, your date | current | [pages/artist](../mocks/pages/artist/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html), [pages/availability](../mocks/pages/availability/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html) and 2 more screens |
| [Status stamp](components/stamp.html) | the eight L2-029 statuses; lg, flat | – | [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/requests](../mocks/pages/requests/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html) and 11 more screens |
| [Booking list](components/booking-list.html) | bookings, requests inbox, dashboard, earnings | hover, loading | [pages/bookings](../mocks/pages/bookings/default.html), [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/requests](../mocks/pages/requests/default.html), [pages/earnings](../mocks/pages/earnings/default.html), [notifications/request-toast](../mocks/notifications/request-toast/danger.html) |
| **Feedback** | | | |
| [Alert & banner](components/alert.html) | info, success, warning, danger; dismissible, compact; banner, persistent banner, banner action | – | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 63 more screens |
| [Inline message](components/inline-message.html) | info, success, warning, danger | – | [pages/artist](../mocks/pages/artist/default.html), [pages/account](../mocks/pages/account/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [pages/admin-application](../mocks/pages/admin-application/default.html) |
| [Toast](components/toast.html) | success, info, warning, danger; kind line, timer bar; with action; stacked (3, newest on top) | leaving | [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/account](../mocks/pages/account/default.html), [dialogs/accept-request](../mocks/dialogs/accept-request/default.html), [dialogs/add-church](../mocks/dialogs/add-church/default.html), [dialogs/add-photo](../mocks/dialogs/add-photo/default.html), [dialogs/add-song](../mocks/dialogs/add-song/default.html) and 30 more screens |
| [Progress bar](components/progress-bar.html) | determinate, indeterminate, success, danger; meter | – | [pages/dashboard](../mocks/pages/dashboard/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [dialogs/add-photo](../mocks/dialogs/add-photo/default.html), [dialogs/add-video](../mocks/dialogs/add-video/default.html), [dialogs/upload-check](../mocks/dialogs/upload-check/default.html) |
| [Spinner](components/spinner.html) | sm, md, lg, inline | – | [pages/confirm-email](../mocks/pages/confirm-email/default.html), [pages/verify-email](../mocks/pages/verify-email/default.html) |
| [Skeleton](components/skeleton.html) | text, title, poster, figure, block, control, circle, portrait, wide, strip; role sizes (control-sm, day, price, date, amount, stamp, badge, thumb); composed | – | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 20 more screens |
| [Empty state](components/empty-state.html) | full, quiet; with date swap | date-swap hover | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/bookings](../mocks/pages/bookings/default.html), [pages/saved](../mocks/pages/saved/default.html) and 12 more screens |
| [Error page](components/error-page.html) | 404, 403, 500, offline, maintenance | – | [pages/server-error](../mocks/pages/server-error/default.html), [pages/not-found](../mocks/pages/not-found/default.html), [pages/offline](../mocks/pages/offline/default.html) |
| **Zamaro signatures** | | | |
| [Poster hero](components/poster.html) | discover hero, artist header | loading, error | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/sign-in](../mocks/pages/sign-in/default.html), [pages/sign-up](../mocks/pages/sign-up/default.html), [pages/accept-terms](../mocks/pages/accept-terms/default.html), [pages/confirm-email](../mocks/pages/confirm-email/default.html) and 9 more screens |
| [Marquee](components/marquee.html) | yellow, stage | – | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |
| [Booking ticket](components/booking-form.html) | hero bar, profile stub | busy, invalid, success | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/sign-in](../mocks/pages/sign-in/default.html), [pages/sign-up](../mocks/pages/sign-up/default.html), [pages/accept-terms](../mocks/pages/accept-terms/default.html), [pages/confirm-email](../mocks/pages/confirm-email/default.html) and 9 more screens |
| [Ticket card](components/ticket.html) | default, loading, booked | hover, focus-within | [pages/discover](../mocks/pages/discover/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/not-found](../mocks/pages/not-found/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |
| [Headliner](components/headliner.html) | default, loading | hover | [pages/discover](../mocks/pages/discover/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |
| [Steps](components/steps.html) | horizontal, vertical, progress; application stepper; timeline | current, complete | [pages/discover](../mocks/pages/discover/default.html), [pages/book](../mocks/pages/book/default.html), [pages/booking-detail](../mocks/pages/booking-detail/default.html), [pages/request-detail](../mocks/pages/request-detail/default.html), [pages/earnings](../mocks/pages/earnings/default.html), [pages/apply](../mocks/pages/apply/default.html) and 4 more screens |
| [Review](components/review.html) | default, with stars, with reply and actions | – | [pages/artist](../mocks/pages/artist/default.html), [pages/artist-reviews](../mocks/pages/artist-reviews/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [pages/admin-reviews](../mocks/pages/admin-reviews/default.html), [dialogs/hide-review](../mocks/dialogs/hide-review/default.html), [dialogs/reply-review](../mocks/dialogs/reply-review/default.html) and 1 more screens |
| [Artwork](components/artwork.html) | solo, group, wide, square, tilt, yellow, tag, photo, thumb, thumb-lg | – | [pages/discover](../mocks/pages/discover/default.html), [pages/artist](../mocks/pages/artist/default.html), [pages/book](../mocks/pages/book/default.html), [pages/saved](../mocks/pages/saved/default.html), [pages/edit-profile](../mocks/pages/edit-profile/default.html), [pages/not-found](../mocks/pages/not-found/default.html) and 6 more screens |
| [Video card](components/video-card.html) | default | hover, focus, active, busy | [pages/artist](../mocks/pages/artist/default.html), [pages/profile-preview](../mocks/pages/profile-preview/default.html), [pages/admin-application](../mocks/pages/admin-application/default.html) |
| [Band](components/band.html) | default | button hover | [pages/discover](../mocks/pages/discover/default.html), [notifications/saved-toast](../mocks/notifications/saved-toast/danger.html), [notifications/system-banner](../mocks/notifications/system-banner/danger.html) |

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
- [`tokens/tokens.json`](tokens/tokens.json) — W3C DTCG export (277 entries with theme overrides), generated from `tokens.css`.
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
| assets/ui.css | Spinners used `--duration-deliberate`, which reduced motion zeroes, making them spin at effectively infinite speed. | `--duration-loop`, which reduced motion does not zero; `components.css` stops spinners outright under reduced motion (see the changelog). |
| assets/ui.css | Ticket notches always painted `--color-bg-canvas`, wrong on any other surface. | `--ticket-notch-bg` component token. |
| all pages | `aria-label` sat on plain `<span>`s (the Saved count badge, review stars), which many screen readers ignore. | Give the element `role="img"` (stars) or put the count in the button’s visible or hidden text. |
| pages/discover/empty | “Search within 120 km · 2 choirs free” is too long for a phone button and overflowed at 360px once labels stopped wrapping. | Label shortened to the L2-011 format, “Search within 120 km · 2 free”; the sentence above names the choirs. Buttons also wrap to a balanced second line as a safety net. |
| pages/artist/loading | `role="status"` on the page `<h1>` replaced its heading role. | A plain visually hidden `<h1>` plus a separate `role="status"` line. |
| pages/discover/empty, artist/empty | Decorative stamps (“Sold out”, “Fresh on the bill”, “Opening night”) were read aloud before the real title. | Stamps are `aria-hidden="true"`. |
| pages/discover/empty | Date-swap buttons read “Sun 20 Dec2 choirs free”: no space between date and count. | A space after the date. |
| pages/artist/default, empty | The date help sat inside the wrapping `<label>`, so the field’s name became “Event date ✓ Abigail is free…”; review stars put `aria-label` on a plain `<span>`. | The help sits outside a `<label for>`; the stars get `role="img"`. |
| pages/discover/* (4 mocks) | “Apply as an artist” was a `<button>` although it leads to another page. | A button-styled link. |
| assets/ui.css | On the stage, the yellow focus ring also applied inside the paper booking bar (1.4:1 on paper); reviews placed on the stage inherited paper-coloured text. | Paper islands restore the ink ring; `.review` sets its own text colour. |
| assets/ui.css (extended) | Selected outlines reused `--color-border-on-accent` (ink in both themes), which is 1.2:1 on dark surfaces; switch and choice cards had no disabled style. | New `--color-border-selected` (ink on newsprint, yellow on the stage; at least 9:1 in both themes); disabled and invalid states added. |
| all pages | The top bar overflowed 360px by 15px when no condensed display font is installed. | Tighter gaps and a 22px wordmark below 576px; brand mark never shrinks. |

Decisions kept from the mocks rather than normalised: a 20px phone margin (so ticket notches clear the screen edge), a 3px focus ring with 3px offset, 44px default control height, all-zero radii, and round radios and switches as the only rounded controls besides avatars and the save toggle.

## Changelog

Friday 9 October 2026, aligning the system with `docs/specs/L2.md` and the full mock set (every booker, artist, account and administrator screen):

| Change | Before | After | Why |
|---|---|---|---|
| Breakpoints | `--layout-breakpoint-sm/lg/xl` 40, 64, 80rem (640, 1024, 1280px); media queries at 40/64rem | 36, 62, 75rem (576, 992, 1200px); every query in `components.css` and `tokens.css` moved with them | L2 conventions: XS < 576, SM 576, MD 768, LG 992, XL 1200 |
| Dialogs on phones | Bottom sheet, 92dvh, below 640px | Full screen (100dvh) below 576px; title and close stay at the top, footer sticky | L2-099 |
| Theme toggle | Only in the mock bar | `.topbar__theme` icon button (constant name “Dark theme”, `aria-pressed`) from LG; a “Dark theme” item in the navigation drawer below it | L2-104 |
| Artist top bar | Inline nav from 1024px (overflowed by up to 241px) | Compact until XL; “View public profile” in the bar from 96rem only | L2-096 (no horizontal scroll) |
| Focus ring | Single-colour outline for buttons, links and chips | Two-tone everywhere: outline plus an inner band in `--color-focus-ring-offset` | L2-101 |
| Touch targets | No coarse-pointer rule | Compact controls grow to 44px under `(pointer: coarse)` | L2-096 |
| Toasts | “At least 8 s”, +2 s with an action, newest at the bottom, errors in an assertive region | Every non-error toast 5 s (pauses on hover and focus), newest on top, one polite region | L2-109, L2-102 |
| Reduced motion | Spinners and the busy heart kept turning | Every animation stops, status indicators included; busy text carries the meaning | L2-103 |
| Formats | “7 pm”, long dates without the year | “7:00 p.m.”, “Saturday 14 November 2026”, short dates add the year outside the current year | L2-110 |
| Ratings in mocks | `★ 4.9 (38 churches)` read as star characters | `role="img"` with “Rated 4.9 out of 5 by 38 churches” | L2-102 |
| Receipt values | Long values (request IDs) could overflow | `overflow-wrap: anywhere` on `.receipt__row dd` | L2-093 reference on the server error page |
| Workspace top bar | Admin pages reused `.topbar--artist` | `.topbar--workspace` for the artist area (“Artists” tag) and the admin app (“Admin” tag) | AGENTS.md: the admin app has its own shell |
| Dialog header | Pages documented the kicker as `.overline dialog__kicker` and a warning icon inside the `.dialog--danger` title | `.dialog__kicker` sets the overline type itself; danger dialogs show `.dialog__icon--danger` at the start of the header and no icon in the title (title-icon rules removed) | The mocks: 112 plain `.dialog__kicker`s, 16 `.dialog--danger` dialogs with the header icon |
| Message limits | Textarea and form-field pages let text run over the limit (`maxlength` above it) and treated a phone number in a first message as an error | `maxlength` equals the limit with a counter on the label row; invalid examples are a missing or too-short text (“Write at least 20 characters; you have 8.”); contact details are masked for the recipient, not rejected | Every textarea mock (`maxlength` 500, 1,000, 2,000); L2-046 |
| Count badges | `aria-label` on the badge `<span>` in 426 mock places | Visually hidden text (“3” plus a hidden “ artists”); counts in tabs are `.tabs__count` | Badge accessibility rule; L2-102 |
| Requirement markers | “(required)” in a `.optional` span (over 700 labels) beside `.field__optional` | `.field__optional` and `.field__required`, one style; `.optional` removed | One documented pattern |
| Error alerts | Some error states used the plain (info) `.alert` | Every failure is `.alert--danger` with `role="alert"` | Alert tone rule |
| Booking statuses | Badge page used tones for Requested, Accepted, Declined, Deposit due | Booking statuses are stamps; badge tones cover application, payment and admin states | Mocks and the stamp page |
| Inline sizes | Skeleton widths, record-page paddings, thumbnails (`width: 8rem`, `7rem`, `var(--space-20)`), the profile editor’s help measure and completeness block (`16rem`), list search fields (`min(100%, 18rem)`) and repeated skeleton sizes used inline `style` | `.skeleton--full`, `.page-crumbs`, `.page-head--after-breadcrumb`, `.detail-layout--flush`, `.list--grid`, `.error-page > .receipt`, `.art--thumb` / `--thumb-lg`, `.field__help--narrow`, `.page-head__aside`, `.page-head__search`, `.skeleton--control-sm/day/price/date/amount/stamp/badge/thumb/thumb-lg`; no raw rem value is inline in a product element any more. What remains inline is spacing tokens, progress and meter values (`--value`, `--progress`) and single-use placeholder heights from spacing tokens; mock annotations (`.mock-note`) are positioned inline as mock chrome | Tokens by role (AGENTS.md) |
| Busy buttons | Pages used `disabled` + `aria-busy`, a few `aria-busy` alone; dialogs used `aria-busy` + `aria-disabled` | One pattern everywhere: `aria-busy="true"` + `aria-disabled="true"` and a “Verb…” label, never native `disabled` (focus stays); a busy button keeps its variant colours | L2-108; button page |
| Field errors | About a fifth of field errors had a warning icon | `.field__error` is text only | The mocks’ majority; form-field page |
| Show more vs pages | Lists pattern said “show 12, then Show 6 more”; pagination used the lineup and reviews as examples | The lineup loads 24 and “Show more artists” (L2-010); reviews add 10 (L2-018); pagination is for record lists only and no mock uses it yet | L2-010, L2-018 |
| Footer | One booker footer documented; simple footer recommended for the booking flow and dashboard | Booker, signed-out, artist-area and admin-app footers documented; the mocks keep the full footer everywhere | The mocks |
| Spelling | “E-mail” with a hyphen | “Email”, as in the specs’ strings | L2 |
| New pages | – | [Status stamp](components/stamp.html), [Booking list](components/booking-list.html), [Calendar](components/calendar.html); MVP-kit classes (panel, stat, meter, receipt, definition, timeline, stepper, form sections, settings nav, page head, auth card, upload list, device list, banner and toast additions, dialog drawer and menu) documented on their component pages | Every class the mocks use is documented |

Perf-test composites (AGENTS.md) map to these pages: the artist ticket in the Discover results → [Ticket card](components/ticket.html); the profile setlist → [Setlist](components/setlist.html); the availability calendar month → [Calendar](components/calendar.html); the requests inbox row → [Booking list](components/booking-list.html); the dark-theme wrapper → [Theming](foundations/theming.html#how).

## Verification

Run on Friday 9 October 2026 from the repository root (scripts ship with the `extracting-design-systems` and `writing-html-mocks` skills in `.claude/skills/`):

```sh
python .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css --pairs docs/design-system/tokens/contrast-pairs.json
#  -> 169 passed, 0 failed (light and dark)
python .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
#  -> 76 pages (55 components, 8 patterns), 0 errors, 0 warnings
python .claude/skills/extracting-design-systems/scripts/tokens_to_json.py docs/design-system/tokens/tokens.css
#  -> 277 tokens written to tokens/tokens.json
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks
#  -> 0 errors, 0 warnings across every screen (the mocks read the system CSS)
```

- Class coverage: every class used in `docs/mocks/**/*.html`, apart from the mock chrome in `docs/mocks/assets/mock.css`, is defined in `assets/components.css` and documented on a component page.

- Token coverage: each of the 212 custom properties in `tokens.css` appears with a live `data-token` value on exactly one foundation page.
- Horizontal overflow (headless Chromium): none on any of the 73 original pages at 360px and 1280px; after the breakpoint alignment, none on any of the 337 mocks at 320, 992 and 1200px, no top bar overflowing, and every open dialog filling a 320px screen with its close button in view.
- Screenshots reviewed at 360 and 1280px in both themes: `index.html`, `foundations/color.html`, `components/button.html`, `components/ticket.html`, `components/dialog.html`, `components/text-field.html`, plus every other page at 1280px by the agents that wrote them. Fixes made from review: compact theme swatches and shadow tiles, wrapping long headings and inline code, phone padding in anatomy frames and examples, docs-chrome selectors that leaked into product specimens.
- Mocks re-screenshotted at 360/768/1280 in both themes through the system CSS and compared with the originals: identical apart from the logged drift fixes (pressed “Saved” toggle, select chevrons, wording of the empty-state primary).
- Known limit: the container has no condensed display font installed, so screenshots fall back to a plain sans and display type is wider than it will be with Bebas Neue; layouts were checked to survive that fallback.

