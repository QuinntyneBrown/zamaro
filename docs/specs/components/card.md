# Card

| Field | Value |
|---|---|
| Selector | `zm-card`, `zm-panel`, `zm-message`, `zm-stat`, `zm-stat-skeleton` |
| Library path | `frontend/projects/components/src/lib/card/` |
| Status | planned |
| Traces to | L2-018, L2-034, L2-045, L2-046, L2-047, L2-061, L2-086, L2-096, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-110, L2-111 |
| Design system | [`card.html`](../../design-system/components/card.html) |
| Source mocks | [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html) and every booking-detail state, [`pages/request-detail/default`](../../mocks/pages/request-detail/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/dashboard/empty`](../../mocks/pages/dashboard/empty.html), [`pages/dashboard/loading`](../../mocks/pages/dashboard/loading.html), [`pages/apply/step-4`](../../mocks/pages/apply/step-4.html), [`pages/apply/success`](../../mocks/pages/apply/success.html), [`pages/book/success`](../../mocks/pages/book/success.html), [`pages/admin-booking/held`](../../mocks/pages/admin-booking/held.html), [`pages/artist-reviews/default`](../../mocks/pages/artist-reviews/default.html), [`pages/sign-in/expired`](../../mocks/pages/sign-in/expired.html), and every other screen in Usage |
| Rendering | [`card.html`](card.html) |

## Purpose and scope

The card family is Zamaro's framed paper: a 2 px charcoal frame on the surface,
square corners and a dashed tear line, like a printed ticket without its stub.
The design-system page documents four members, and this CRD specifies all four
because they share the frame, the tokens and the rules:

- `zm-card` holds one thing in a grid of like things: a booking summary, a
  package, a saved artist. With a `link` the whole card opens the item through
  one stretched title link. It is fully specified by the design system but not
  yet used by a mock (D-11).
- `zm-panel` is the block the signed-in pages are built from: a headed section
  of a booking, a request, an application or the dashboard, with a dashed rule
  under its head. `raised` marks the one panel that holds the page's primary
  action (the payment aside). It never links as a whole.
- `zm-message` is one note in a booking's thread, an artist's public reply under
  a review, or a short status note ("Your session ended"): a sunken block with a
  4 px yellow rule on the left and a mono meta line.
- `zm-stat` is a figure card on the artist dashboard ("Awaiting reply 3");
  `zm-stat-skeleton` is its loading shape.

Use something else when:

- it is an artist in search results or on Saved artists → [ticket](ticket.md);
- it is the featured artist → [headliner](headliner.md);
- it is a church's review → [review](review.md) (which composes `zm-message`
  for the artist's reply);
- it is the booking form, or the sign-in "Admit one" card (`.stub.auth-card`) →
  [booking form](booking-form.md);
- it is one choice among several (a package, a kind of gathering) →
  [radio group](radio-group.md) choice cards (D-3);
- it is a list of bookings → [booking list](booking-list.md); a one-line item →
  [list](list.md).

Out of scope:

- The grids and stacks around the cards: `.grid--cards`, `.detail-layout`,
  `.stack` ([container](container.md)) and `.stat-grid` (specified here as a
  layout utility, D-9). The page owns the `<ul>`, `<ol>` and `<li>` elements.
- The content inside a panel or card: definition lists and receipts
  ([description list](description-list.md)), timelines ([steps](steps.md)),
  tour dates ([tour dates](tour-dates.md)), tables, forms, buttons, badges,
  stamps, meters ([progress bar](progress-bar.md)) and the save toggle
  ([save toggle](save-toggle.md)). They arrive through slots and style
  themselves.
- Masking contact details in messages (L2-046), formatting dates and money
  (L2-110) and the read-only rule for administrators (L2-045). The API does
  them; the page passes finished strings.
- Sending messages. The thread's form belongs to the page.

## Usage

The mocks render about 420 panels, 200 messages and 12 stats across 130 screens
(dialogs and toasts show them only on the inert page behind). The generic
`.card` appears only on the design-system page. Every row is buildable with the
API below.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `pages/booking-detail/*` (14 states), and behind `dialogs/cancel-booking`, `pay-deposit`, `pay-balance`, `withdraw-request`, `write-review`, `report-problem`, `notifications/booking-toast/*` | `zm-panel` h2 "Where it stands" + `caption` "Requested today, 10:15 a.m."; "The request" with no aside; "Messages" + `caption` "Only you and Abigail see these" | timeline, definition list, messages, send form | default, loading | canvas |
| same, payment aside | `zm-panel` `raised`, `region` false inside the page's `<aside>`, `headingId` for the aside's label, h2 "Payment" + `code` "No. ZAM-0114" | receipt, block button "Withdraw request", fine print | default, loading | canvas |
| `pages/request-detail/*` (10 states), `dialogs/accept-request`, `decline-request`, `artist-cancel-booking` behind | `zm-panel` `raised`, h2 "Your fee" + `caption` "ZAM-0114"; "You're booked", "Waiting for the deposit", "Completed" | receipt, "Reply by Mon 12 Oct, 10:15 a.m.", Accept / Decline buttons | default, loading | canvas |
| `pages/request-detail/*` thread | `zm-message` × n in the page's `<ol role="list">`, meta "Naomi Fraser · Fri 9 Oct, 10:15 a.m.", "You declined · Fri 9 Oct, 1:40 p.m." | the church's words with "[contact details shared after booking]" muted | default | canvas |
| `pages/booking-detail/default` thread | `zm-message` meta "You · Fri 9 Oct, 10:15 a.m.", `note` "Abigail sees “[contact details shared after booking]” in place of your phone number until the booking is confirmed." | quoted words | default, with note | panel |
| `pages/admin-booking/default`, `held` | `zm-panel` h2 "Messages" + `caption` "Read only · opening the thread is recorded in the audit log"; `zm-message` meta "Grace Ampofo, booker · Tue 1 Sep, 11:30 a.m."; "Booking", "Status history", "Payment history" panels; raised "Money" + `code` "No. ZAM-0104" | definition list, timeline, table, receipt, buttons | default, loading | canvas |
| `pages/artist/default`, `pages/artist-reviews/default`, `pages/profile-preview`, `dialogs/reply-review`, `report-review`, `photo-viewer`, `notifications/share-toast` behind | `zm-message` under a review, meta "Reply from Abigail Mensah · October 2026", "… · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m.", "… · Tue 16 Jun · locked Tue 23 Jun" | quoted reply | default | canvas, surface |
| `pages/sign-in/expired` | `zm-message` `quoted` false, `status`, meta "Your session ended" | "Sign in again to keep your request to Abigail Mensah for Sat 14 Nov. Nothing you typed is lost." | announced | auth card (surface) |
| `pages/dashboard/default` stats | `zm-stat` × 4 in `.stat-grid`; first `accent` "Awaiting reply 3"; "Profile complete 100%" with a meter | hint text "First one due Sat 10 Oct, 3:15 p.m." | default, accent | canvas |
| `pages/dashboard/empty` stats | `zm-stat` none accent, "Awaiting reply 0"; "Profile complete 40%" with a meter and a hint link "3 things left, starting with a video" | hint link | default, link in hint | canvas |
| `pages/dashboard/loading` | `zm-stat-skeleton` × 4; `zm-panel` with a skeleton in its head (`[slot=aside]`) and skeleton rows | skeletons | loading | canvas |
| `pages/dashboard/default` panels | `zm-panel` h2 "Coming up" + link "Calendar"; "Reviews" + link "All reviews" | tour dates, rating, caption | default | canvas |
| `pages/apply/step-4` | `zm-panel` h2 "About you", "Your music", "Price and travel", each + link "Edit" with hidden " about you" | definition list | default | canvas |
| `pages/apply/*` (9 states) | `zm-panel` `region` false, h2 "After you apply" | timeline | default | canvas |
| `pages/apply/success` | `zm-panel` `raised` h2 "Thanks, Tobi" + stamp "Submitted"; `zm-panel` `region` false "Questions?" | lead, receipt "A-0219", reply by "Thu 15 Oct" | default | canvas |
| `pages/book/*` (8 states) | `zm-panel` `raised` h2 "Abigail Mensah" + `code` "No. ACT-0027"; loading panel of skeletons | art thumb, receipt, fine print | default, loading | canvas |
| `pages/book/success` | `zm-panel` `raised`, no heading, `code` "Booking ZAM-0114" + stamp "Requested", `labelledBy` the page's h1 "Request sent to Abigail"; `zm-panel` `region` false "What you asked for" | h1, lead, timeline, receipt | default | canvas |
| `pages/admin-application/*` | `zm-panel` "Applicant", "Bio" + `caption` "336 characters", "Videos" + "1 uploaded", "Church references" + "0 of 2 verified", "Vulnerable Sector Check"; raised "Decision" + `code` "A-0219" | definition lists, video, checkboxes, buttons | default, verified, approved, loading | canvas |
| `pages/admin-artist/*`, `dialogs/suspend-artist`, `reinstate-artist` behind | `zm-panel` "Details", "Upcoming bookings", "Suspension history"; raised "Standing" + badge "Approved" / "Suspended" | definition list, tour dates, danger button | default, suspended, loading | canvas |
| `pages/admin-reviews/*`, `dialogs/hide-review` behind | `zm-panel` h2 "Review of Hosanna Collective" + warning badge "2 reports" | review, definition list, buttons | default, loading | canvas |
| `pages/earnings/setup` | `zm-panel` `raised` h2 "Set up payouts" + badge "Not set up" | timeline, primary button | default | canvas |
| `pages/edit-profile/empty` | `zm-panel` h2 "3 things to finish" + flat stamp "40%" | list of links | default | canvas |
| `pages/booking-detail/loading`, `request-detail/loading`, `admin-*/loading`, `artist-reviews/loading` | `zm-panel` (and `raised`) with no heading and only skeleton blocks | skeletons | loading | canvas |
| Design system only: bookings | `zm-card` h3 "Marcus Bell Trio" + stamp "Confirmed"; body "Sun 25 Oct · Sunday service"; footer `code` "Balance $712.50 after" + sm button "View booking" | stamp, button | default | canvas |
| Design system only: saved artist | `zm-card` `link` `/artists/elijah-park`, media artwork, save toggle aside, footer `price` "$350" + badge "Free Sat 14 Nov" | artwork, toggle, badge | default, hover, focus, selected | canvas |
| Design system only: summaries | `zm-card` `flat`, h3 "2 requests", "1 booking", "3 saved" | muted text | default | canvas |

## Anatomy

`zm-card`:

1. **Frame** — the host, `.card`: `--card-bg` with a `--border-width-thick`
   `--card-border` frame, square corners, a flex column. No shadow at rest.
2. **Media (optional)** — `.card__media`: artwork or a photo, full bleed, with a
   `--card-border` rule under it. Hidden when empty.
3. **Header** — `.card__header`: the title and the header aside, spaced apart,
   wrapping. Hidden when both are empty.
4. **Title** — `.card__title`: an `h2` or `h3` in `--text-h3`, uppercase. When
   the card has a `link`, it holds the card's one link, whose `::after` stretches
   over the whole card.
5. **Header aside (optional)** — a status stamp, a badge or a save toggle, at the
   top right.
6. **Body** — `.card__body`: facts and short copy, `--space-3` apart.
7. **Footer (optional)** — `.card__footer`: a dashed `--card-border` tear line,
   then the price or code on the left and actions on the right, pushed to the
   bottom with `margin-top: auto` so footers in one row line up.

`zm-panel`:

1. **Frame** — the host, `.panel`: `--color-bg-surface`, `--border-width-thick`
   `--color-border-strong` frame, `--space-6` padding, a flex column with
   `--space-4` between children, `min-width: 0`.
2. **Head (optional)** — `.panel__head`: the title, then the caption or code,
   then the aside, spaced apart on a baseline and wrapping, over a
   `--border-width-thick` dashed `--color-border-strong` rule. Hidden when empty.
3. **Title (optional)** — `.panel__title`: an `h2` or `h3` in `--text-h3`,
   uppercase.
4. **Caption (optional)** — `.text-caption`: muted small print ("Only you and
   Abigail see these").
5. **Code (optional)** — `.stub__code`: a mono reference ("No. ZAM-0114").
6. **Aside (optional)** — badges, stamps, links or a skeleton.
7. **Body** — the projected children, directly in the panel's column.
8. **Print shadow** — `.panel--raised` only: `--shadow-3`.

`zm-message`:

1. **Block** — the host, `.message`: `--color-bg-surface-sunken`,
   `--border-width-poster` `--color-accent` rule on the left, a grid with
   `--space-2` between rows.
2. **Meta** — `.message__meta`: `--text-stub`, uppercase, muted. Who and when.
3. **Body** — a `<blockquote>` around the projected paragraphs when the text is
   a person's own words, or the paragraphs alone for a status note.
4. **Note (optional)** — `.field__help`: a caption under the body, for the
   sender only.

`zm-stat`:

1. **Frame** — the host, `.stat`: surface, strong frame, `--space-5` padding, a
   grid with `--space-1` between rows. `.stat--accent` fills it with
   `--color-accent`.
2. **Label** — `.stat__label`: overline, `--letter-spacing-stamp`, muted.
3. **Value** — `.stat__value`: `--text-h2`, line height 1, tabular figures.
4. **Meter (optional)** — a projected meter.
5. **Hint** — `.stat__hint`: caption, muted, may hold one link.

Host: each `zm-*` host carries its block class and is the frame itself (as
`zm-ticket` does). None renders an `<li>`; the page puts each card, message or
stat in its own `<li>` when they form a list (D-4).

## API

### `zm-card` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | `''` | no | The title text. Empty: no `.card__title` (a loading card). |
| `headingLevel` | `2 \| 3` | `3` | no | The title's heading level. |
| `link` | `string \| unknown[] \| null` | `null` | no | `routerLink` for the title link. Set: adds `.card--interactive` and stretches the link over the card. Needs `heading`. |
| `queryParams` | `Record<string, string>` | `{}` | no | Carried-forward search state: `{ date: '2026-11-14' }`. |
| `selected` | `boolean` (attribute) | `false` | no | Adds `.card--selected`. Writes `aria-current="true"` on the title link, or on the host when the card has no link. |
| `flat` | `boolean` (attribute) | `false` | no | Adds `.card--flat`. A flat card is never interactive or selected: with `link` or `selected` it logs a dev-mode console error and renders without `.card--flat` (D-14). |
| `priceLabel` | `string` | `''` | no | "From". Rendered as the overline over `price`. |
| `price` | `string` | `''` | no | "$350", formatted by the page. Rendered as `.ticket__price` at the start of the footer. |
| `code` | `string` | `''` | no | "Balance $712.50 after", "$650 · nothing paid". Rendered as `.stub__code` at the start of the footer, after the price. |
| `label` | `string` | `''` | no | The host's `aria-label` when there is no `heading`. |

The host always has `role="article"` and, when `heading` is set,
`aria-labelledby` pointing at the title's generated ID (D-15).

### `zm-panel` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | `''` | no | The title text. Empty: no `.panel__title`. |
| `headingLevel` | `2 \| 3` | `2` | no | The title's heading level (D-8). |
| `headingId` | `string` | generated | no | The title's `id`. Set it when a page element outside the panel (the `<aside>`) is labelled by the title. |
| `caption` | `string` | `''` | no | Rendered as `.text-caption` after the title. |
| `code` | `string` | `''` | no | Rendered as `.stub__code` after the caption. |
| `raised` | `boolean` (attribute) | `false` | no | Adds `.panel--raised`. At most one per page. |
| `region` | `boolean` | `true` | no | `true` with a name: the host gets `role="region"` and `aria-labelledby`. `false`: no role, for a panel inside a page landmark or a minor note ("After you apply"). |
| `labelledBy` | `string` | `''` | no | The ID of a heading elsewhere in the panel (the h1 of `pages/book/success`). Used for `aria-labelledby` instead of the title. |

A panel is a region only when it has a name (`heading` or `labelledBy`) and
`region` is true; a loading panel has neither, so it is never a region.

### `zm-message` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `meta` | `string` | — | yes | "You · Fri 9 Oct, 10:15 a.m.", "Reply from Abigail Mensah · October 2026", "Your session ended". |
| `quoted` | `boolean` | `true` | no | `true`: the body is wrapped in `<blockquote>`, for a person's own words. `false`: the paragraphs sit directly in the block, for a status note (D-5). |
| `note` | `string` | `''` | no | Rendered as `.field__help` after the body. |
| `status` | `boolean` (attribute) | `false` | no | Sets `role="status"` on the host, so the note is announced politely when it appears. |

### `zm-stat` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `label` | `string` | — | yes | "Awaiting reply". |
| `value` | `string` | — | yes | "3", "100%", formatted by the page. |
| `accent` | `boolean` (attribute) | `false` | no | Adds `.stat--accent`: the one stat that needs action. The page sets it only while the figure calls for action ("Awaiting reply 3", not "Awaiting reply 0"). |

### `zm-stat-skeleton` inputs

None. It renders the stat's loading shape.

### Outputs

None, for every member. Navigation is the card's title link; every other action
belongs to a projected button or link.

### Content slots

| Component | Slot | Accepts | Rule |
|---|---|---|---|
| `zm-card` | `[slot=media]` | `zm-artwork` with `.art--wide`, or an `<img>` with `width` and `height` | Rendered in `.card__media`; hidden when empty. |
| `zm-card` | `[slot=aside]` | one `zm-stamp`, `zm-badge` or `zm-save-toggle` | Rendered in `.card__header` after the title. |
| `zm-card` | default | paragraphs, definition lists, chips | Rendered in `.card__body`. |
| `zm-card` | `[slot=footer]` | `zm-badge`, `zm-button`, `zm-button-link` with `size="sm"` | Rendered in `.card__footer` after the price and code; the footer is hidden when all three are empty. |
| `zm-panel` | `[slot=aside]` | `zm-badge`, `zm-stamp`, a link (`zm-link` or `<a class="text-sm">`), `zm-skeleton` | Rendered in `.panel__head` after the code. |
| `zm-panel` | default | anything: timeline, definition list, receipt, messages list, table, form, buttons, skeletons | Rendered as the panel's own children. |
| `zm-message` | default | one or more `<p>` | The message body. Inline `.text-muted` spans (masked contacts) are allowed. |
| `zm-stat` | `[slot=meter]` | one `zm-progress-bar` meter | Rendered between the value and the hint. In an accent stat it uses the ink fill (D-17). |
| `zm-stat` | default | hint text, optionally one link | Rendered in `.stat__hint`. |

Each slot is declared once. Wrappers always render and hide with `:empty`, so
no `@if` wraps a slot. `zm-message` renders its body inside or outside the
`<blockquote>` by condition, so its default slot lives in one `<ng-template>`
rendered with `ngTemplateOutlet` in both branches (AGENTS.md).

Translation: none of the components has copy of its own. `heading`, `caption`,
`code`, `meta`, `note`, `label`, `value`, `priceLabel` and the slots come from
the page, already translated and formatted (L2-111).

## Variants and sizes

| Component | Variant | Modifier | Use for |
|---|---|---|---|
| `zm-card` | Default | — | An item with its own actions; the card itself is not a link. |
| `zm-card` | Interactive | `.card--interactive` | The whole card opens the item; set by `link`. |
| `zm-card` | Selected | `.card--selected` | The current item among cards, with `aria-current`. |
| `zm-card` | Flat | `.card--flat` | Low-emphasis summaries at the top of a page. |
| `zm-panel` | Default | — | A headed block of a detail page. |
| `zm-panel` | Raised | `.panel--raised` | The one panel with the page's primary action. |
| `zm-message` | Quoted | — | Thread notes and review replies. |
| `zm-message` | Status | — (`quoted` false, `status`) | A short system note on the sign-in card. |
| `zm-stat` | Default | — | A dashboard figure. |
| `zm-stat` | Accent | `.stat--accent` | The one figure that needs action. |

There is one size. Card padding is `--space-6` at the sides; panel padding
`--space-6`; stat padding `--space-5`. Width comes from the grid or column the
page puts them in.

## States

| State | Component | Trigger | Visual | Assistive technology |
|---|---|---|---|---|
| Default | all | — | Surface, strong frame (flat: hairline) | Article, region or nothing, named by the title |
| Hover | interactive card | `:host(:hover)` | Lifts by `--transform-lift` over `--shadow-2` | — |
| Focus | interactive card | `:host(:focus-within)` | The title link shows the two-tone ring; the card lifts as on hover | Focus on the title link |
| Focus | default card, panel | a projected control is focused | No change to the frame; the control shows its own ring | — |
| Selected | card | `selected` | `--color-border-selected` frame doubled inside, `--color-accent-subtle` fill, `--shadow-1` | `aria-current="true"` |
| Selected + hover | interactive card | both | Selected look, lifted over `--shadow-2` | as selected |
| Raised | panel | `raised` | `--shadow-3` print shadow | — |
| Loading | panel, card | page projects only skeletons and no heading | Frame kept; skeleton blocks inside; no head rule unless a skeleton is in the aside | The page sets `aria-busy="true"` on its main region; the panel is not a region |
| Loading | stat | `zm-stat-skeleton` | Same frame and three skeleton rows (label, value, hint) | `aria-hidden="true"` on the skeleton |
| Accent | stat | `accent` | `--color-accent` fill, `--color-fg-on-accent` text and frame | The label and hint carry the meaning, not the colour |
| With note | message | `note` | Caption under the body | Read after the body |
| Status | message | `status` | Same block | `role="status"`: announced politely |
| Read-only | thread panel | page shows the caption "Read only · …" and no form | Same panel | The caption is read after the title |
| Inert | all | an open dialog makes the page `inert` | No hover response | Not reachable |
| Forced colours | all | `forced-colors: active` | Frames take `CanvasText` through the border tokens; the selected card adds a `--color-focus-ring` (Highlight) outline because the inset shadow is dropped | — |

## Markup

`zm-panel`, rendered, with a caption:

```html
<zm-panel class="panel" role="region" aria-labelledby="messages-title">
  <div class="panel__head">
    <h2 class="panel__title" id="messages-title">Messages</h2>
    <span class="text-caption">Only you and Abigail see these</span>
  </div>
  <ol class="stack" role="list">
    <li><zm-message class="message">…</zm-message></li>
  </ol>
  <form>…</form>
</zm-panel>
```

Raised, inside the page's aside, with a code:

```html
<aside aria-labelledby="money-title">
  <zm-panel class="panel panel--raised">
    <div class="panel__head">
      <h2 class="panel__title" id="money-title">Payment</h2>
      <span class="stub__code">No. ZAM-0114</span>
    </div>
    <dl class="receipt">…</dl>
    <zm-button-link block …>Withdraw request</zm-button-link>
    <p class="stub__fine">…</p>
  </zm-panel>
</aside>
```

No heading, labelled by the page's h1 (`pages/book/success`); and loading:

```html
<zm-panel class="panel panel--raised" role="region" aria-labelledby="sent-title">
  <div class="panel__head"><span class="stub__code">Booking ZAM-0114</span><zm-stamp …>Requested</zm-stamp></div>
  <h1 class="page-head__title" id="sent-title">Request sent to Abigail</h1>
  …
</zm-panel>

<zm-panel class="panel">
  <div class="panel__head"></div>   <!-- hidden: :empty -->
  <zm-skeleton shape="title" width="short" />…
</zm-panel>
```

`zm-message`, quoted with a note, and as a status:

```html
<li>
  <zm-message class="message">
    <p class="message__meta">You · Fri 9 Oct, 10:15 a.m.</p>
    <blockquote><p>We’re hosting a worship night for churches across Burlington, about 250 people. …</p></blockquote>
    <p class="field__help">Abigail sees “[contact details shared after booking]” in place of your phone number until the booking is confirmed.</p>
  </zm-message>
</li>

<zm-message class="message" role="status">
  <p class="message__meta">Your session ended</p>
  <p>Sign in again to keep your request to Abigail Mensah for Sat 14 Nov. Nothing you typed is lost.</p>
</zm-message>
```

`zm-stat`, accent, with a meter, and the skeleton:

```html
<ul class="stat-grid" role="list">
  <li><zm-stat class="stat stat--accent">
    <span class="stat__label">Awaiting reply</span>
    <span class="stat__value">3</span>
    <span class="stat__hint">First one due Sat 10 Oct, 3:15 p.m.</span>
  </zm-stat></li>
  <li><zm-stat class="stat">
    <span class="stat__label">Profile complete</span>
    <span class="stat__value">100%</span>
    <zm-progress-bar …><div class="meter" role="progressbar" aria-label="Profile complete" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">…</div></zm-progress-bar>
    <span class="stat__hint">Updated Tue 6 Oct</span>
  </zm-stat></li>
  <li><zm-stat-skeleton class="stat" aria-hidden="true">
    <span class="skeleton skeleton--text skeleton--medium"></span><span class="skeleton skeleton--title skeleton--short"></span><span class="skeleton skeleton--text skeleton--long"></span>
  </zm-stat-skeleton></li>
</ul>
```

`zm-card`, interactive, with media, aside and footer:

```html
<li>
  <zm-card class="card card--interactive" role="article" aria-labelledby="zm-card-1">
    <div class="card__media"><zm-artwork class="art art--wide" role="img" aria-label="Elijah Park seated on a stool with an acoustic guitar"></zm-artwork></div>
    <div class="card__header">
      <h3 class="card__title" id="zm-card-1"><a href="/artists/elijah-park?date=2026-11-14">Elijah Park</a></h3>
      <zm-save-toggle>…<button class="save" type="button" aria-pressed="true" aria-label="Remove Elijah Park from your saved artists">…</button></zm-save-toggle>
    </div>
    <div class="card__body"><p class="text-muted">Solo vocalist · Acoustic guitar · Markham · 74 km</p></div>
    <div class="card__footer"><span class="ticket__price">$350</span><zm-badge>…Free Sat 14 Nov</zm-badge></div>
  </zm-card>
</li>
```

Default, selected and flat add only their modifier (and `aria-current="true"`
for selected); a default card's title has no link; a price label renders as
`<span class="ticket__price"><small>From</small>$900</span>`; a code renders as
`<span class="stub__code">Balance $712.50 after</span>`.

Consumer templates:

```html
<zm-panel [heading]="'booking.messages.title' | transloco" [caption]="'booking.messages.private' | transloco: { name: artist.firstName }" id="messages">
  <ol class="stack" role="list">
    @for (m of thread(); track m.id) {
      <li><zm-message [meta]="m.meta" [note]="m.maskedNote"><p>{{ m.body }}</p></zm-message></li>
    }
  </ol>
  <form …>…</form>
</zm-panel>

<aside aria-labelledby="money-title">
  <zm-panel raised [region]="false" headingId="money-title" [heading]="'booking.payment.title' | transloco" [code]="'booking.number' | transloco: { number: booking.number }">…</zm-panel>
</aside>

<zm-panel [heading]="'apply.review.about' | transloco">
  <a slot="aside" routerLink="/apply">{{ 'common.edit' | transloco }}<span class="visually-hidden"> {{ 'apply.review.aboutLower' | transloco }}</span></a>
  <dl class="definition definition--two">…</dl>
</zm-panel>

<ul class="stat-grid" role="list">
  <li><zm-stat [label]="'dashboard.awaiting' | transloco" [value]="awaiting().count" [accent]="awaiting().count > 0">{{ awaiting().hint }}</zm-stat></li>
</ul>

<zm-card [heading]="saved.name" [link]="['/artists', saved.slug]" [queryParams]="{ date: searchDate() }" [price]="saved.price">
  <zm-artwork slot="media" class="art--wide" [label]="saved.artLabel" />
  <zm-save-toggle slot="aside" [artistName]="saved.name" [saved]="true" />
  <p class="text-muted">{{ saved.facts }}</p>
  <zm-badge slot="footer" variant="free">{{ saved.availability }}</zm-badge>
</zm-card>
```

The classes (`.card*`, `.panel*`, `.message*`, `.stat*`), the headings, the
roles and `aria-current` are a contract: e2e page objects find a panel by its
heading, a message by `.message` and its meta, a stat by its label.

## Design

- **Card**: frame `--border-width-thick` `--card-border` on `--card-bg`, square
  (`--radius-md`). Header padding `--space-5` `--space-6` 0, gap `--space-3`,
  items aligned to the start. Body padding `--space-4` `--space-6` `--space-6`,
  gap `--space-3`. Footer padding `--space-4` `--space-6`, gap `--space-3`,
  `--border-width-thick` dashed `--card-border` on top, `margin-top: auto`,
  wraps. Media rule `--border-width-thick` solid `--card-border`; the artwork
  inside drops its own frame.
- **Card title**: `--text-h3`, uppercase; its link inherits colour with no
  underline, and its hover has no background. Long names wrap; a word wider than
  the column breaks inside the word (`overflow-wrap: anywhere`).
- **Card price**: `--text-figure`; its label `--text-overline` on its own line.
  **Code**: `--text-stub`, `--letter-spacing-stamp`, uppercase, muted.
- **Interactive card**: `position: relative` on the host; the title link's
  `::after` is `position: absolute; inset: 0`. Hover and `:focus-within`:
  `transform: var(--transform-lift)`, `box-shadow: var(--shadow-2)`. Transitions
  on transform and box-shadow, `--duration-base`, `--ease-standard`. Controls in
  the card raise themselves to `--z-raised` (D-12).
- **Selected card**: `--card-border` becomes `--color-border-selected`;
  `box-shadow: inset 0 0 0 var(--border-width-thick) var(--color-border-selected), var(--shadow-1)`;
  background `--color-accent-subtle`.
- **Flat card**: `--card-border` becomes `--color-border-default`.
- **Panel**: padding `--space-6`, gap `--space-4`. Head gap `--space-2`
  `--space-4`, `padding-bottom: var(--space-3)`, `--border-width-thick` dashed
  `--color-border-strong` underneath; items on the baseline, spaced apart,
  wrapping. Title `--text-h3`, uppercase. Raised: `--shadow-3`.
- **Message**: padding `--space-4` `--space-5`, gap `--space-2`; left rule
  `--border-width-poster` `--color-accent`; fill `--color-bg-surface-sunken`.
  Meta `--text-stub`, uppercase, `--color-fg-muted`. Quoted body
  `--text-body-lg`. Line breaks typed in a message are kept
  (`white-space: pre-line`, D-13). Messages in a thread stack `--space-4` apart
  (the page's `.stack`).
- **Stat**: padding `--space-5`, gap `--space-1`, content at the start; label
  `--text-overline`, `--letter-spacing-stamp`, uppercase, muted; value
  `--text-h2`, line height 1, `font-variant-numeric: tabular-nums`; hint
  `--text-caption`, muted, its link inherits colour. The host fills its list
  item's height, so stats in a row are equal. The host has `min-width: 0` and
  its label and hint `overflow-wrap: anywhere`, so a word wider than the column
  breaks inside the word instead of overflowing the frame (D-19).
- **Stat grid** (utility, D-9): `display: grid`, gap `--space-4`, two equal
  columns; four from `--layout-breakpoint-lg` (992 px); no list style, margin or
  padding.

Component tokens declared on `.card`:

| Token | Aliases | Overridden by |
|---|---|---|
| `--card-bg` | `--color-bg-surface` | the consumer, through `--zm-card-bg` |
| `--card-border` | `--color-border-strong` | `.card--flat` → `--color-border-default`; `.card--selected` → `--color-border-selected`; the consumer, through `--zm-card-border` |

`--card-bg` reads `var(--zm-card-bg, var(--color-bg-surface))` and
`--card-border` `var(--zm-card-border, var(--color-border-strong))`; the media
rule and the footer's tear line read `--card-border`, so a re-skin is two
variables. Panels, messages and stats have no component tokens; they read the
semantic tokens directly, as the design system does.

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Card, panel and stat surface | `--color-bg-surface` | `--palette-paper-bright` | `--palette-ink-850` |
| Frame, tear line, head rule | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Flat frame | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Selected frame | `--color-border-selected` | `--palette-ink-750` | `--palette-signal-500` |
| Selected fill | `--color-accent-subtle` | `--palette-signal-300` | `--palette-signal-950` |
| Title, value, body text | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Caption, code, meta, label, hint, muted facts | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Message fill | `--color-bg-surface-sunken` | `--palette-paper-warm` | `--palette-ink-950` |
| Message rule, accent stat fill | `--color-accent` | `--palette-signal-500` | `--palette-signal-500` |
| Accent stat text and frame | `--color-fg-on-accent` | `--palette-ink-750` | `--palette-ink-750` |
| Hover, selected and raised shadows | `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface` | 4.5:1 | Titles and text on a card, panel or stat |
| `--color-fg-muted` | `--color-bg-surface` | 4.5:1 | Captions, codes, labels, hints |
| `--color-border-strong` | `--color-bg-canvas` | 3:1 | Frame against the page |
| `--color-fg-default` | `--color-accent-subtle` | 4.5:1 | Text on a selected card |
| `--color-border-selected` | `--color-accent-subtle` | 3:1 | Selected frame against its own fill |
| `--color-fg-default` | `--color-bg-surface-sunken` | 4.5:1 | Message body |
| `--color-fg-muted` | `--color-bg-surface-sunken` | 4.5:1 | Message meta and note |
| `--color-fg-on-accent` | `--color-accent` | 4.5:1 | Accent stat text |
| `--color-focus-ring` | `--color-bg-surface` | 3:1 | Focus ring on a card |

The flat card's hairline frame and the message's yellow rule are decoration and
exempt from 1.4.11: flat cards are never interactive, and the message's meta line
says who wrote it. Under forced colours the frames follow `CanvasText` through
the border tokens; the selected card, whose inset shadow and fill are dropped,
draws a `--border-width-thick` `--color-focus-ring` outline inside its frame, so
selection survives.

## Responsive behaviour

- Cards fill the column they are given. In `.grid--cards` they are at least
  18 rem wide (or the whole column when narrower), so one per row on phones and
  two or three on larger screens. Footers wrap: on a narrow card the action moves
  under the price rather than shrinking.
- Card media keeps its aspect ratio (16:9 with `.art--wide`) and never crops to a
  fixed height.
- Panels fill their column at every width; in `.detail-layout` the raised aside
  sits beside the main panels from LG (992 px) and above or below them earlier
  (the page's layout). The panel head wraps: at 320 px "Only you and Abigail see
  these" drops under "Messages".
- `.stat-grid` is two columns on phones and tablets and four from LG. At 320 px
  each stat is about 136 px wide: labels and hints wrap at word boundaries, a
  single word wider than the column ("AWAITING" in a narrower column) breaks
  inside the word, and the value ("100%") stays on one line.
- Titles, metas and hints wrap and never truncate. At 320 px nothing overflows;
  at 200 % zoom panels and cards grow taller and every part stays reachable.
- On touch devices the interactive card is one large target; its controls are at
  least 44 × 44 CSS px with `--space-2` around them, so a tap meant for the card
  never hits the save toggle.

## Accessibility

### Role and pattern

- `zm-card` is `role="article"`, named by its title. It is never wrapped in an
  `<a>`: an interactive card contains exactly one real link, in the title, whose
  hit area is stretched over the card (the inclusive "block link" approach;
  there is no APG pattern for it). Buttons inside it stay reachable.
- `zm-panel` is `role="region"` named by its title when it stands alone in the
  page, so screen-reader users can jump between "Where it stands", "The request"
  and "Messages". Inside a page landmark (`<aside>`) or without a name it has no
  role.
- `zm-message` has no role, except `role="status"` for a status note. A thread is
  an ordered list (`<ol role="list">`) the page owns, oldest first.
- `zm-stat` has no role; the page's `<ul role="list">` gives the count. A meter
  inside is a `progressbar` named "Profile complete".

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves to an interactive card's title link, then to each control in the card, in DOM order. Panels, messages and stats are not focusable; their controls are. |
| <kbd>Enter</kbd> | On a card's title link: opens the item. On a control: its own action. |
| <kbd>Space</kbd> | On a control: activates it. |

### Focus

The ring is drawn on the title link (`:focus-visible`), and `:focus-within`
lifts the whole interactive card, so the focused card stands out in a grid. No
member sets `overflow: hidden`, so rings on links and buttons inside are never
clipped. Pages reserve `scroll-padding` so a focused control in a panel is never
under the sticky top bar.

### Labelling

- A card is named by its title ("Elijah Park"); the title link's name is the
  item's name alone, not the card's whole text. Without a title, `label` names
  it.
- A panel is named by its title, or by `labelledBy`. Hidden text extends a head
  link's name: "Edit about you".
- A selected card exposes `aria-current="true"`; the highlight alone says nothing
  to a screen reader.
- A message is read meta first ("You · Fri 9 Oct, 10:15 a.m."), then the body,
  then the note. A quoted body is a `<blockquote>`.
- A stat is read label, value, then hint: "Awaiting reply, 3, First one due Sat
  10 Oct, 3:15 p.m.".

### Announcements

Only a `status` message announces itself, politely, when it renders. A thread
that gains a message is announced by the page's own status region, not by the
message.

### Motion

The interactive card's lift and shadow take `--duration-base`. Under
`prefers-reduced-motion: reduce` the duration drops to near zero: the card
changes position without animating, and the shadow still appears, so the hover
cue remains. Panels, messages and stats do not move. Skeletons stop shimmering
([skeleton](skeleton.md)).

## Content and internationalisation

- **Card title**: the thing's name — an artist, a booking code, a package — in
  one or two lines. **Body**: date, kind of gathering, place, separated by a
  middle dot: "Sun 25 Oct · Sunday service". **Footer**: money with the right
  word: "From $900" for a starting price, "$650" for an agreed one, "Balance
  $712.50 after" for what is left. One status per card at most.
- **Panel title**: a short noun phrase, sentence case in the source and
  uppercase by CSS: "Where it stands", "The request", "Your fee". **Caption**:
  when or for whom ("Requested today, 10:15 a.m.", "Only you and Abigail see
  these"). **Code**: "No. ZAM-0114", "No. ACT-0027", "A-0219".
- **Message meta**: who, then when: "You · Fri 9 Oct, 10:15 a.m.", "Naomi
  Fraser · Fri 9 Oct, 10:15 a.m.", "Grace Ampofo, booker · Tue 1 Sep, 11:30
  a.m."; replies read "Reply from {artist name} · {month year}" (L2-018).
- **Stat**: label in a few words ("Free Saturdays in Nov"), the figure alone,
  then a hint that says what is behind it ("First one due Sat 10 Oct, 3:15
  p.m.", "3 things left, starting with a video").
- Dates "Sat 14 Nov", times "10:15 a.m.", money "$712.50" and "$1,800",
  distance "74 km" (L2-110), formatted by the API library's formatting service
  before they reach the component.
- Translatable inputs: `heading`, `caption`, `priceLabel`, `meta` patterns,
  `note`, `label` and stat labels and hints. Data values: names, codes, prices,
  counts and message bodies. French runs about 30 % longer: titles, captions and
  labels wrap, never clip.

## Performance

- Change detection: `OnPush`, signal inputs. Computed values only: the heading
  tag, the region attributes and the generated IDs. No subscriptions, no
  `effect`, no host listeners.
- Perf-test scenarios, each tuned in
  `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms:
  - `Card.ts` renders Elijah Park's interactive saved-artist card (wide
    artwork, "Remove Elijah Park from your saved artists" toggle, "Solo vocalist
    · Acoustic guitar · Markham · 74 km", "$350", badge "Free Sat 14 Nov").
  - `Panel.ts` renders the raised "Payment" panel of ZAM-0114 (`code` "No.
    ZAM-0114", a paragraph and a block button "Withdraw request").
  - `Message.ts` renders Naomi's message of Fri 9 Oct, 10:15 a.m. with its note.
  - `Stat.ts` renders the accent "Awaiting reply 3" stat; `StatSkeleton.ts`
    renders one `zm-stat-skeleton`.
- Composite scenarios (repeated compositions): `MessageThread.ts` renders the
  "Messages" panel of ZAM-0114 with three messages (You 10:15 a.m., Abigail
  2:40 p.m., Abigail Sun 15 Nov 9:02 a.m.); `StatGrid.ts` renders the dashboard's
  four stats in `.stat-grid`. Add each to `scenarios/index.ts`. The `DarkTheme`
  composite gains a panel.
- Layout stability: the stat skeleton has the stat's frame, padding and three
  rows at the final heights, and loading panels use skeletons sized like their
  content, so swapping them shifts nothing (L2-105). Card media has explicit
  dimensions.
- Imports: Angular core, `RouterLink` and `NgTemplateOutlet` only. Artwork,
  badges, stamps, buttons, toggles, meters and skeletons arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given the booking detail of ZAM-0114, when the "Messages" panel renders with `caption` "Only you and Abigail see these", then the host has `.panel`, `role="region"` and `aria-labelledby` pointing at an `h2.panel__title` reading "Messages", the caption follows the title in `.panel__head`, and the thread and form follow the head. (L2-045)
- **AC-2** Given the raised "Payment" panel with `code` "No. ZAM-0114", `region` false and `headingId` "money-title" inside the page's `<aside aria-labelledby="money-title">`, when it renders, then the host has `.panel.panel--raised`, no `role`, the title's `id` is "money-title", and the head shows "No. ZAM-0114" as `.stub__code`. (L2-102)
- **AC-3** Given the apply success panel with heading "Thanks, Tobi", a projected "Submitted" stamp and the receipt "A-0219 · reply by Thu 15 Oct", when it renders, then the stamp sits at the end of `.panel__head` and the application number and reply-by date are visible in the body. (L2-047)
- **AC-4** Given the `pages/book/success` panel with no heading, `code` "Booking ZAM-0114", a "Requested" stamp and `labelledBy` "sent-title", when it renders, then there is no `.panel__title`, the head holds the code then the stamp, and the region is named "Request sent to Abigail". (L2-102)
- **AC-5** Given a loading panel holding only skeleton blocks, when it renders, then `.panel__head` takes no space, the panel has no `role` and no name, and the frame and padding match the loaded panel. (L2-105)
- **AC-6** Given Naomi's message of Fri 9 Oct, 10:15 a.m. in the booking thread, when it renders, then the host has `.message`, `.message__meta` reads "You · Fri 9 Oct, 10:15 a.m.", and the body is inside a `<blockquote>`. (L2-045)
- **AC-7** Given the same message with the masking `note`, when it renders, then "Abigail sees “[contact details shared after booking]” in place of your phone number until the booking is confirmed." follows the body as `.field__help`. (L2-046)
- **AC-8** Given Tomi Oduya's review on Abigail's profile, when the reply renders beneath it, then a `zm-message` reads "Reply from Abigail Mensah · October 2026" with the reply quoted. (L2-018)
- **AC-9** Given Abigail's editable reply on `pages/artist-reviews`, when it renders, then its meta reads "Reply from Abigail Mensah · Thu 8 Oct · editable until Thu 15 Oct, 11:20 a.m." and the reply text keeps the line breaks it was typed with. (L2-061)
- **AC-10** Given the request-detail thread, when three messages render in the page's `<ol role="list">`, then each `zm-message` sits in its own `<li>`, oldest first, and a screen reader announces a list of 3 items. (L2-045)
- **AC-11** Given the admin view of ZAM-0104, when the "Messages" panel renders with `caption` "Read only · opening the thread is recorded in the audit log" and no form, then the caption is visible beside the title and the panel contains no focusable control. (L2-045)
- **AC-12** Given the dashboard, when the "Awaiting reply" stat renders with `value` "3", `accent` and the hint "First one due Sat 10 Oct, 3:15 p.m.", then the host has `.stat.stat--accent`, and the label, value and hint render in `.stat__label`, `.stat__value` and `.stat__hint`, in that order. (L2-034)
- **AC-13** Given the "Profile complete" stat with a projected meter at 40 % and the hint link "3 things left, starting with a video", when it renders, then the meter sits between the value and the hint, and the link inherits the hint's colour. (L2-102)
- **AC-14** Given Elijah Park's card with `link` `/artists/elijah-park` and `queryParams` `{ date: '2026-11-14' }`, when the booker activates anywhere on the card outside the save toggle, then they navigate to `/artists/elijah-park?date=2026-11-14`, and activating the toggle runs only the toggle. (L2-100)
- **AC-15** Given the bookings card for Marcus Bell Trio with a "Confirmed" stamp in the aside, `code` "Balance $712.50 after" and a "View booking" button in the footer, when it renders, then the card has no `.card--interactive`, the title has no link, and the footer holds the code then the button after a dashed tear line. (L2-110)
- **AC-16** Given a card with no media and no footer content, when it renders, then neither `.card__media` nor `.card__footer` takes up space. (L2-096)

### States

- **AC-17** Given a pointer over an interactive card, when it hovers, then the card lifts by `--transform-lift` and shows `--shadow-2`; a default or flat card does not move. (L2-104)
- **AC-18** Given a selected interactive card, when it renders, then it has `.card--selected`, the doubled `--color-border-selected` frame, the `--color-accent-subtle` fill, and its title link has `aria-current="true"`. (L2-102)
- **AC-19** Given `zm-stat-skeleton` in place of a stat, when four skeletons are replaced by the four dashboard stats, then each skeleton had the stat's frame and height and the cumulative layout shift from the swap is 0.05 or less. (L2-105)
- **AC-20** Given the session-ended note on the sign-in card (`quoted` false, `status`), when it renders, then the host has `role="status"`, the meta reads "Your session ended", the body is not in a `<blockquote>`, and a screen reader announces it politely. (L2-100)

### Keyboard and focus

- **AC-21** Given keyboard focus on an interactive card's title link, when it is focused, then the link shows the two-tone focus ring and the whole card lifts as on hover. (L2-101)
- **AC-22** Given Elijah Park's interactive card, when the booker tabs through it, then focus moves to the title link, then to the save toggle, and each shows its own ring that is not clipped. (L2-101)

### Screen readers

- **AC-23** Given an interactive card, when the page's links are listed by a screen reader, then the card contributes exactly one link, named "Elijah Park". (L2-102)
- **AC-24** Given the booking detail of ZAM-0114, when a screen reader lists regions, then "Where it stands", "The request" and "Messages" are listed by name, and the payment panel is reached through the page's complementary landmark "Payment". (L2-102)
- **AC-25** Given every member in every state in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-26** Given the dark theme, when a panel, a card and a stat render, then each is a `--color-bg-surface` charcoal with a `--color-border-strong` frame, the raised panel's and hovered card's shadows are `--color-shadow` (yellow), and the selected frame is `--color-border-selected` (yellow). (L2-104)
- **AC-27** Given both themes, when contrast is measured, then text, captions, codes, metas, labels and hints are at least 4.5:1 on their surfaces (card, selected fill, sunken message, accent stat), and the frame and selected frame are at least 3:1 against the page and the selected fill. (L2-103)

### Responsive

- **AC-28** Given a 320 px viewport, when the "Messages" panel, the dashboard stat grid and a card render, then the panel head wraps the caption under the title, the stats sit two per row with labels wrapping (a word wider than its column breaks inside the word), nothing is clipped or truncated, and the page does not scroll horizontally. (L2-096)
- **AC-29** Given an LG viewport (992 px), when the dashboard renders, then the stat grid shows four stats in one row with equal heights. (L2-096)
- **AC-30** Given the French catalogue, when panel titles, captions and stat labels are about 30 % longer, then they wrap inside the frame without clipping. (L2-111)

### Motion

- **AC-31** Given `prefers-reduced-motion: reduce`, when an interactive card is hovered or focused, then it moves to its lifted position without a transition and the shadow still appears. (L2-103)

### Performance

- **AC-32** Given the `Card`, `Panel`, `Message`, `Stat`, `StatSkeleton`, `MessageThread` and `StatGrid` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

- Folder `frontend/projects/components/src/lib/card/` with `card.ts`
  (`Card`, `zm-card`), `panel.ts` (`Panel`, `zm-panel`), `message.ts`
  (`Message`, `zm-message`), `stat.ts` (`Stat`, `zm-stat`) and
  `stat-skeleton.ts` (`StatSkeleton`, `zm-stat-skeleton`), each with its own
  `.scss`; export all five from `public-api.ts`.
- Each host binds its block and modifier classes (`[class.card--interactive]`,
  `[class.panel--raised]`, `[class.stat--accent]`…) and its role and labelling
  attributes; the classes are on the host so the e2e contract holds.
- Render headings with one `@switch` on the level; the card's title link sits
  inside each branch and holds no `ng-content`.
- Generate IDs with a module counter (`zm-card-title-1`, `zm-panel-title-1`),
  stable on the server and the client, as SSR hydration needs.
- Every slot wrapper renders always and hides with `:empty`; wrappers of the
  card's header and footer contain `@if` blocks only for input-driven text
  (title, price, code), never around a slot.
- `zm-message`: `<ng-template #body><ng-content /></ng-template>`, then
  `@if (quoted()) { <blockquote><ng-container [ngTemplateOutlet]="body" /></blockquote> } @else { <ng-container [ngTemplateOutlet]="body" /> }`.
  `:host { white-space: pre-line }`.
- `zm-stat-skeleton` uses `zm-skeleton` blocks with the skeleton CRD's text,
  title and width modifiers.
- Ship `.stat-grid` in the library's global utilities stylesheet
  (`projects/components/src/styles/`) beside the container utilities.
- The panel styles its own `.stub__code` and the card its `.ticket__price` and
  `.stub__code` spans under encapsulation (D-7); `.text-caption`, `.text-muted`
  and `.visually-hidden` are global utilities.
- Under `forced-colors: active`, `.card--selected` adds
  `outline: var(--border-width-thick) solid var(--color-focus-ring); outline-offset: calc(var(--border-width-thick) * -2)`.
- In dev mode, log a console error naming the component when `zm-card` gets
  `link` without `heading`, or `flat` together with `link` or `selected`.
- Add the seven perf-test scenarios and export them from `scenarios/index.ts`;
  add a panel to `DarkTheme.ts`.

## Decisions

- **D-1** *One CRD for card, panel, message and stat?* Yes. The design-system card page specifies all four, with shared frame rules and tokens, and no other design-system page owns the panel, the message or the stat. Five selectors in one library folder keep them together; each is still its own component, because their semantics differ (article, region, quote, figure).
- **D-2** *The design-system page says a selected card's frame is `--color-border-on-accent`; `components.css` uses `--color-border-selected`. Which?* `--color-border-selected`. The stylesheet and `contrast-pairs.json` ("outline of a selected choice card, card or nav item") agree on it, and in the dark theme `--color-border-on-accent` (ink) would nearly vanish against the dark `--color-accent-subtle` fill, failing 3:1. The page's prose is the drift.
- **D-3** *The design-system page shows a choosable card as `<label class="card card--selected">` around a radio. Is that `zm-card`?* No. A choice among options is a form control and is the [radio group](radio-group.md)'s choice card (`.choice-card`), which already owns the label, the radio and its focus. `zm-card`'s `selected` marks the current item among cards and exposes `aria-current`, so the state is never colour alone.
- **D-4** *Does a member render its own `<li>`, and is a thread a list?* No `<li>`: the host carries the block class inside the page's list item, as `zm-ticket` does, so the page owns list semantics. A thread is always an `<ol role="list">`, oldest first, as on `pages/request-detail`; `pages/booking-detail` renders bare `div.message` siblings, which is drift. A list tells screen-reader users how many messages there are.
- **D-5** *Blockquote or paragraph for the body?* A `<blockquote>` for a person's own words: thread notes and review replies, as the design system says. `pages/request-detail` renders the church's words as a bare `<p>`, which is drift. A status note (`pages/sign-in/expired`) is the product talking, so it is not quoted.
- **D-6** *How does a panel get section semantics from a custom-element host?* `role="region"` with `aria-labelledby`, which is what a named `<section>` exposes. `region` false covers the mocks' `div.panel`s inside a labelled `<aside>` and the unnamed notes; `headingId` lets that aside reference the title.
- **D-7** *Why are the panel's caption and code, and the card's price and code, inputs rather than slots?* Their classes (`.stub__code`, `.ticket__price`) belong to other components, and Angular's style encapsulation does not style projected elements from the panel's stylesheet. Rendering them from inputs lets each component style them while keeping the mocks' classes. Badges, stamps, links and skeletons style themselves, so they stay in the aside slot.
- **D-8** *Panel and card heading levels?* Panels default to `h2`: every mock panel sits directly under the page's `h1`. Cards default to `h3`, as on the design-system page, because a card grid sits under a section heading. Both accept 2 or 3.
- **D-9** *Who owns `.stat-grid`?* The library's global utilities, specified here. It is layout (two columns, four from LG), like the container's grids, and AGENTS.md allows shared utilities globally. A component would only wrap a `<ul>` and make the page's list items harder to own.
- **D-10** *Skeleton components for card and panel too?* No. Only the stat has one fixed loading shape. Loading panels in the mocks hold different skeletons per page (`pages/booking-detail/loading` has four different panels), so the page projects skeleton blocks into a heading-less panel or card.
- **D-11** *The generic card appears in no mock. Specify it anyway?* Yes, in full. The design system marks it stable with every state, and the next summary that links as a whole would otherwise reshape the API.
- **D-12** *How do controls inside an interactive card stay clickable above the stretched link?* Each control raises itself: `zm-button`, `zm-button-link`, `zm-button-anchor`, `zm-save-toggle` and `zm-link` map `:host-context(.card--interactive)` to `position: relative; z-index: var(--z-raised)` (as the button CRD specifies). The card does not raise its footer or header wrappers, because then a tap on the price or the badge would no longer open the item.
- **D-13** *Do typed line breaks survive in a message?* Yes: `white-space: pre-line` on the host. L2-045 messages are plain text up to 2,000 characters, and a church's request often has a list of songs on separate lines.
- **D-14** *What if a card is both flat and interactive or selected?* It is a usage error, logged in dev mode, and the card renders as interactive or selected without `.card--flat`. The design system says flat cards are never interactive or selected, and losing navigation would be worse than losing the quiet frame.
- **D-15** *Does `zm-card` take a role?* `role="article"`, named by its title, as the design system recommends `<article>` for a self-contained item. Inside a list the page's `<li>` wraps it, which is valid and keeps the item count.
- **D-16** *Is the "Admit one" sign-in card (`.stub.auth-card`) a card?* No. It is a booking stub without the price and belongs to the [booking form](booking-form.md) CRD; only the status `zm-message` inside it is specified here.
- **D-17** *What colour is a meter inside an accent stat?* Ink (`.meter--ink`), per the progress-bar page, so a yellow bar never sits on a yellow fill. The consumer sets it on the meter; the stat never restyles projected content.
- **D-18** *How does an accent stat stay accessible without colour?* The label and hint say what needs action ("First one due Sat 10 Oct, 3:15 p.m."), and the accent is dropped when nothing does ("Awaiting reply 0" on `pages/dashboard/empty`). The yellow is a cue, not the information.
- **D-19** *What happens when a stat label is wider than its column?* It breaks inside the word (`overflow-wrap: anywhere`, `min-width: 0` on the host). The rendering shows the design-system stylesheet letting "AWAITING" in spaced uppercase mono run out of a 90 px column. Shrinking the overline would break the type scale and truncating is forbidden (L2-096), so breaking the word is the remaining option.
- **D-20** *A yellow "Free Sat 14 Nov" badge or a pressed save toggle on a selected card sits on a yellow fill. Is that acceptable?* Yes. Both keep their `--color-border-on-accent` ink frames, which carry their edge against `--color-accent-subtle`, and their text keeps 4.5:1 on their own fill. The card does not restyle projected content; the rendering shows the combination in both themes.
