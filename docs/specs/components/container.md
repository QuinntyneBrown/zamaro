# Container and stack

| Field | Value |
|---|---|
| Selector | `zm-page-head`, `section[zm-section]`; layout classes `.container`, `.stack`, `.cluster`, `.grid`, `.section`, `.page-body`, `.page-crumbs`, `.detail-layout`, `.profile-layout`, `.auth-layout`, `.page-error` |
| Library path | `frontend/projects/components/src/lib/page-head/`, `frontend/projects/components/src/lib/section/`, `frontend/projects/components/src/styles/layout.scss` |
| Status | planned |
| Traces to | L2-019, L2-086, L2-096, L2-097, L2-098, L2-100, L2-101, L2-102, L2-103, L2-104, L2-105, L2-111 |
| Design system | [`container.html`](../../design-system/components/container.html) |
| Source mocks | [`pages/discover/default`](../../mocks/pages/discover/default.html), [`pages/artist/default`](../../mocks/pages/artist/default.html), [`pages/bookings/default`](../../mocks/pages/bookings/default.html), [`pages/booking-detail/default`](../../mocks/pages/booking-detail/default.html), [`pages/booking-detail/loading`](../../mocks/pages/booking-detail/loading.html), [`pages/request-detail/default`](../../mocks/pages/request-detail/default.html), [`pages/requests/loading`](../../mocks/pages/requests/loading.html), [`pages/edit-profile/default`](../../mocks/pages/edit-profile/default.html), [`pages/sign-in/default`](../../mocks/pages/sign-in/default.html), [`pages/dashboard/default`](../../mocks/pages/dashboard/default.html), [`pages/apply/default`](../../mocks/pages/apply/default.html), and every other screen (see Usage) |
| Rendering | [`container.html`](container.html) |

## Purpose and scope

These are the layout primitives every page is built from. A container sets the
page width and margins; stacks and clusters set the space between things; the
grid lines them up in 4, 8 or 12 columns; a section is a band of the page with
its kicker and heading; the page head opens every workspace page with its one
`h1`; and four page layouts (page body, detail, profile, auth) place a page's
blocks. Components stay free of outer spacing because these primitives own it.

The family is two components and a set of global layout classes:

- `zm-page-head` renders the page header: optional kicker, the page's `h1`, the
  facts line, and an aside (an action, a status stamp, a search field, a
  progress block), including its loading state.
- `section[zm-section]` turns a native `<section>` into a page band labelled by
  its own heading, with an optional kicker and aside.
- The layout classes (`.container`, `.stack`, `.cluster`, `.grid`, `.section`,
  `.page-body`, `.page-crumbs`, `.detail-layout`, `.profile-layout`,
  `.auth-layout`, `.page-error`) are global utilities in the components
  library's `layout.scss`, put on whatever semantic element the page chooses.

Use something else when:

- the block is a headed box on the page (a "Payment" panel) → [card](card.md)'s panel;
- the hero at the top of Discover or a profile → [poster](poster.md);
- a form's sections, rows and action bar → [form layout](form-layout.md);
- a rule between two groups → [divider](divider.md);
- the trail above a record's page head → [breadcrumb](breadcrumb.md) (with `class="page-crumbs"`);
- a full error page → [error page](error-page.md).

Out of scope:

- What goes inside the bands and columns (lineups, panels, forms, stubs).
- The landmarks around the page (`header`, `nav`, `main`, `footer`): the app
  shell renders them ([top bar](top-bar.md), [footer](footer.md)). These
  primitives sit inside `<main>`.
- `aria-busy` on the loading region. The page sets it on `<main>` or on the
  region it loads (L2-105); the page head only shows its own placeholders.
- Focus management on route change. The router integration focuses the page
  head's `h1`; the page head makes it focusable.

## Usage

The mocks use these primitives on every one of their 364 screens. Each row is a
distinct configuration; the API and classes below build every row.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| Every screen: top bar, footer, poster grids | `.container` combined with the component's grid (`.container.footer__grid`, `.container.poster__grid`) | — | — | stage |
| Every workspace page (`bookings`, `account`, `requests`, `availability`, `earnings`, `dashboard`, admin lists) | `div.container` > `zm-page-head` + `.page-body` | — | default, loading | canvas |
| `pages/apply/*` | `main.container` > page head + stepper + `.detail-layout` | — | default | canvas |
| `pages/discover/*` lineup and how-it-works | `section[zm-section]` contained (`.container.stack.stack--lg`), kicker "Sat 14 Nov · 7 free · within 120 km", h2 "The lineup" | aside: the sort field (`.field--inline`); content: filters, headliner, lineup | default, loading, empty, error | canvas |
| `pages/discover/default` "How booking works" | as above, kicker "Three songs and you're done" | aside: "Cancel free up to 14 days before your event." | default | canvas |
| `pages/discover/default` `#join` | `section[zm-section]` headless, contained, `aria-labelledby="join-title"` | content: `zm-band` | default | canvas |
| `pages/not-found/artist` "Free that night instead" | contained, `flush` (no top padding after the error) | aside: "See the full lineup" link | default | canvas |
| `pages/artist/*`, `pages/profile-preview/*` | `.container.profile-layout` > `div` of sections + `<aside aria-labelledby="book-title">` | aside: the booking stub | default, loading (`aria-hidden` skeleton layout), error | canvas |
| `pages/artist/default` About | `section[zm-section]` `prose`, not contained, kicker "About", h2 "Raised in the choir loft" | content: two paragraphs in `.stack.section__body` | default | canvas |
| `pages/artist/default` Videos, Photos, Setlist, Dates, Reviews | not contained, kickers "Live", "Gallery", "The setlist", "On tour", "Word of mouth" | aside: "Ask for any of these, or send your own list.", "Pick a free date to book it instead.", the rating | default, empty | canvas |
| `pages/bookings/default`, `pages/admin-*` lists | `zm-page-head` with kicker ("Riverside Community Church", "Admin · Artist management") | aside: secondary "Find who's free" with search icon; after: standalone link "Vulnerable Sector Checks · 2 waiting" | default, loading (sub only) | canvas |
| `pages/requests/*`, `pages/admin-artists/*` | `zm-page-head` | aside: `form.field.page-head__search[role=search]` "Search requests" | default, loading, no-results | canvas |
| `pages/edit-profile/*`, editor dialogs | `zm-page-head`, sub "Abigail Mensah · zamaro.ca/artists/abigail-mensah" | aside: `div.stack.stack--sm.page-head__aside` with the completeness meter and "Preview" | default, loading (aside skeleton) | canvas |
| `pages/availability/*`, `pages/dashboard/*` | `zm-page-head` | aside: `.cluster` of "Mark dates unavailable" + "Subscribe in your calendar"; or primary "Answer requests" | default, loading (sub and aside skeletons) | canvas |
| `pages/saved/default` | `zm-page-head` | aside: `form.cluster` with "Who's free on" date field and "Check date" | default | canvas |
| `pages/booking-detail/*`, `pages/book/*`, `pages/admin-booking/*`, `pages/admin-application/*`, `pages/admin-artist/*` and their dialogs | `.page-crumbs` breadcrumb, then `zm-page-head` `afterBreadcrumb` with kicker "Booking ZAM-0114", h1 "Worship night with Abigail Mensah", sub "Sat 14 Nov 2026 · 7:00 p.m. · Burlington" | aside: `zm-stamp` lg (Requested, Accepted, Confirmed, Completed, Declined, Withdrawn, Expired, Cancelled) or `zm-badge` ("Held", "Approved") or a `.cluster` | default, loading (whole head: kicker, title and sub skeletons) | canvas |
| `pages/request-detail/*` | `zm-page-head` | before: "Back to requests" link; aside: status stamp | default, loading (title skeleton) | canvas |
| `pages/admin-checks/*` | `zm-page-head` | before: in-head breadcrumb "Artists / Vulnerable Sector Checks" | default | canvas |
| `pages/booking-detail/*`, `pages/admin-booking/*` | `.detail-layout.detail-layout--aside-first.detail-layout--flush` | main `.stack.stack--lg` of panels; `<aside aria-labelledby="money-title">` Payment | default, every status | canvas |
| `pages/request-detail/*`, `pages/admin-application/*`, `pages/admin-artist/*` | `.detail-layout.detail-layout--flush` | main; aside last | default | canvas |
| `pages/apply/*`, `pages/book/*`, `pages/dashboard/*` | `.detail-layout` (inside `.page-body` on the dashboard) | form + aside panel | default | canvas |
| `pages/sign-in`, `sign-up`, `forgot-password`, `reset-password`, `verify-email`, `confirm-email`, `mfa-challenge`, `mfa-setup`, `accept-terms`, `data-export` | `main.poster` > `.container.auth-layout` > `.stub.auth-card` | the auth card | default, every state | stage |
| `pages/artist/error`, `pages/profile-preview/error` | `.container.page-error` after the poster | the error alert | error | canvas |
| Everywhere inside components and pages | `.stack` (16 px), `.stack--sm` (8 px), `.stack--lg` (40 px) on `div`, `section`, `li`, `form`, `span`, `ul`, `aside`; `.cluster`, `.cluster--between` on `div`, `span`, `p`, `form` | — | — | any |
| Design system only | `.grid`, `.grid--cards`, `.span-full`, `.cluster--lg`, `.section--tight` | — | — | canvas |

## Anatomy

Layout classes (global):

1. **Container** — `.container`: centred, at most `--layout-container-max`, side
   padding `--layout-margin`.
2. **Stack** — `.stack` (`.stack--sm`, `.stack--lg`): a column with one gap.
3. **Cluster** — `.cluster` (`.cluster--between`, `.cluster--lg`): a wrapping
   row, centred on the cross axis.
4. **Grid** — `.grid` (`.grid--cards`, `.span-full`): `--layout-columns`
   columns with `--layout-gutter` gutters.
5. **Section band** — `.section` (`.section--tight`, `.section--flush`) with
   `.section__head`, `.section__kicker` and `.section__body`; a hairline between
   neighbouring sections.
6. **Page body** — `.page-body`: the blocks of a workspace page, `--space-8`
   apart, `--space-20` before the footer.
7. **Breadcrumb room** — `.page-crumbs`: `--space-8` above the breadcrumb.
8. **Detail layout** — `.detail-layout` (`--aside-first`, `--flush`): a main
   column and a sticky `--layout-sidebar-width` aside from LG.
9. **Profile layout** — `.profile-layout`: the profile's sections and the
   sticky booking stub from LG.
10. **Auth layout** — `.auth-layout`: one auth card centred on the stage.
11. **Page error** — `.page-error`: block padding around an error under a poster.

`zm-page-head`:

12. **Head** — `header.page-head` (`--after-breadcrumb`, `--loading`): a
    wrapping row, title block left, aside right.
13. **Before (optional)** — `.page-head__before`: a back link or an in-head
    breadcrumb above the title.
14. **Kicker (optional)** — `p.overline`.
15. **Title** — `h1.page-head__title`, `tabindex="-1"`, `--text-h1`, uppercase.
16. **Sub (optional)** — `p.page-head__sub`: the facts line.
17. **After (optional)** — content under the sub (a standalone link).
18. **Aside (optional)** — the projected action, stamp, badge, cluster, search
    form (`.page-head__search`) or block (`.page-head__aside`).

`section[zm-section]`:

19. **Band** — the host `<section class="section">`, `aria-labelledby` its
    heading.
20. **Inner container (contained)** — `div.container.stack.stack--lg`.
21. **Head** — `div.section__head` > `div` > `p.overline.section__kicker` +
    `h2` (or `h3`), then the projected aside.
22. **Content** — the projected default content (wrapped in
    `div.stack.section__body` for prose).

Hosts: `zm-page-head` is `display: block` and renders one `<header
class="page-head">`. `zm-section`'s host is the native `<section>` itself
(attribute selector), so the page's `id` and classes stay on the band.

## API

### Layout classes

| Class | Effect | Combine with |
|---|---|---|
| `.container` | `width: 100%`, `max-width: var(--layout-container-max)`, `margin-inline: auto`, `padding-inline: var(--layout-margin)` | Any block, including `<main>` and a component's grid class. Never nested. |
| `.stack` / `.stack--sm` / `.stack--lg` | Flex column, gap `--space-4` / `--space-2` / `--space-10` | Any element. Never wraps. |
| `.cluster` / `.cluster--between` / `.cluster--lg` | Flex row, wraps, `align-items: center`, gap `--space-2`; ends apart; gap `--space-4` | Any element. Button rows use `.cluster--lg` or `.cluster`. |
| `.grid` / `.span-full` | `repeat(var(--layout-columns), minmax(0, 1fr))`, gap `--layout-gutter`; a child across every column | A region overrides columns with `style="--layout-columns: 4"`, never by editing the class. |
| `.grid--cards` | `repeat(auto-fill, minmax(min(100%, 18rem), 1fr))` | `<ul role="list">` of cards. |
| `.section` / `.section--tight` / `.section--flush` | Block padding `--space-16` (`--space-20` from LG) / `--space-10` / no top padding; `.section + .section` draws a `--border-width-hairline` `--color-border-default` top rule | Put on the host by `zm-section`. |
| `.section__head`, `.section__kicker`, `.section__body` | Head row (wraps, `align-items: end`, gap `--space-4` `--space-8`, `--space-8` below); kicker `--space-2` below; body `--space-4` above | Rendered by `zm-section`. |
| `.page-body` | Grid, gap `--space-8`, `--space-20` bottom padding; a `.detail-layout` inside it has no block padding | After `zm-page-head`. |
| `.page-crumbs` | `padding-top: var(--space-8)` | On the `zm-breadcrumb` host. |
| `.detail-layout` / `--aside-first` / `--flush` | One column, gap `--space-10`, padding `--space-10` `--space-16`; from LG main plus `--layout-sidebar-width`, gap `--space-16`, `align-items: start`, sticky aside. `--aside-first`: the page writes the aside first in the DOM, and from LG it is placed in the second column (D-3). `--flush`: no top padding | Children: one main block and one `<aside aria-labelledby>`. |
| `.profile-layout` | One column, gap `--space-12`, padding `--space-16`; from LG content plus `--layout-sidebar-width`, gap `--space-16`, sticky aside; its sections pad `--space-12` and the first has no top padding | With `.container`. Children: a `div` of sections, then the `<aside>`. |
| `.auth-layout` | `min-height: calc(100dvh - var(--layout-topbar-height))`, grid, `place-items: center`; the card is at most `--layout-auth-width` | With `.container`, inside `main.poster`. |
| `.page-error` | `padding-block: var(--space-10)` | With `.container`. |
| `.page-head__aside`, `.page-head__search` | `min-width: 16rem`; `min-width: min(100%, 18rem)` | On the element projected into the page head's aside. |

### `zm-page-head` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | `''` | yes, unless `loading` with an unknown title | The page's `h1` text: "Your bookings", "Worship night with Abigail Mensah". |
| `headingId` | `string` | `'page-title'` | no | The `h1`'s `id`, for `aria-labelledby` on `<main>` or a region. |
| `kicker` | `string` | `''` | no | `p.overline` above the title: "Booking ZAM-0114". Empty renders nothing. |
| `sub` | `string` | `''` | no | `p.page-head__sub`: "Sat 14 Nov 2026 · 7:00 p.m. · Burlington". Empty renders nothing. |
| `afterBreadcrumb` | `boolean` (attribute) | `false` | no | Adds `.page-head--after-breadcrumb` (`--space-4` top padding) when a `.page-crumbs` breadcrumb precedes the head. |
| `loading` | `boolean` | `false` | no | With a `heading`: the sub becomes a status line holding `loadingLabel` (visually hidden) and a text skeleton. Without a `heading`: the kicker, title and sub become skeletons and the `h1` holds `loadingLabel`, visually hidden. Adds `.page-head--loading`. |
| `loadingLabel` | `string` | `''` | when `loading` | "Loading your requests", "Loading booking ZAM-0114". |

### `zm-page-head` content slots

| Slot | Accepts | Rule |
|---|---|---|
| `[slot=before]` | a back `<a>` in `p.text-sm`, or a `zm-breadcrumb` | Rendered in `.page-head__before` above the kicker, `--space-3` above the title. Hidden when empty. |
| `[slot=after]` | one `<p>` with a standalone [link](link.md) | Rendered after the sub, `--space-3` below it. Hidden when empty. |
| `[slot=aside]` | `zm-button` / `zm-button-link`, `zm-stamp` lg, `zm-badge`, a `.cluster` of those, a `form.field.page-head__search[role=search]`, a `div.stack.stack--sm.page-head__aside`, or a `zm-skeleton` while loading | Rendered as the head's second flex child, after the title block. Nothing renders when empty. |

Each slot is declared once in the template; the loading and loaded title blocks
are one `<ng-template>` each, and the slots sit outside them.

### `section[zm-section]` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | `''` | yes, unless headless | The band's heading text: "The lineup". Empty makes the section headless: no head renders and the consumer sets `aria-labelledby` on the host to a heading in the content. |
| `headingId` | `string` | — | with `heading` | The heading's `id`; the host's `aria-labelledby`. |
| `headingLevel` | `2 \| 3` | `2` | no | `h2` on a page, `h3` inside a page section. |
| `kicker` | `string` | `''` | no | `p.overline.section__kicker`: "Sat 14 Nov · 7 free · within 120 km". |
| `contained` | `boolean` | `true` | no | Wraps everything in `div.container`, plus `.stack.stack--lg` when there is a head. `false` inside `.profile-layout` and `.detail-layout`, which are already in a container. |
| `prose` | `boolean` (attribute) | `false` | no | Renders the kicker and heading without the head row and wraps the content in `div.stack.section__body`, `--space-4` below the heading (About). The aside slot is not rendered. |
| `tight` | `boolean` (attribute) | `false` | no | Adds `.section--tight`. |
| `flush` | `boolean` (attribute) | `false` | no | Adds `.section--flush`: no top padding, for a band that follows an error block on the same page. |

### `section[zm-section]` content slots

| Slot | Accepts | Rule |
|---|---|---|
| `[slot=aside]` | one short sentence (`p.text-muted`), one control (sort field with `.field--inline`), one link, or a rating | Rendered after the title block in `.section__head`. |
| default | the band's content | After the head. |

### Outputs

None. Layout is not interactive.

- Inputs are signal inputs; boolean attributes use `booleanAttribute`.
- Every string arrives as an input or slot, from the translation catalogue or
  the API (L2-111). The components hold no copy.

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Stack sm / default / lg | `.stack--sm` / — / `.stack--lg` | Label and field / paragraphs / blocks. Closer means more related. |
| Cluster / between / lg | — / `.cluster--between` / `.cluster--lg` | Badges, small controls / two ends of a row / button rows. |
| Section / tight / flush | — / `.section--tight` / `.section--flush` | A page band / a short band / a band after an error. |
| Page head / after breadcrumb / loading | — / `--after-breadcrumb` / `--loading` | Every workspace page / a record page under its breadcrumb / while the page loads. |
| Detail / aside first / flush | — / `--aside-first` / `--flush` | A record page / when the aside holds the one primary action (the booker's payment) / under a page head. |

| Size | Token | Phone (base) | MD (768) | LG (992) | Wide (1280+) |
|---|---|---|---|---|---|
| Container margin | `--layout-margin` | 20 px | 40 px | 64 px | 64 px, width capped at 1216 px |
| Grid columns / gutter | `--layout-columns` / `--layout-gutter` | 4 / 16 px | 8 / 24 px | 12 / 32 px | 12 / 32 px |
| Section padding | `--space-16` / `--space-20` | 64 px | 64 px | 80 px | 80 px |
| Detail and profile aside | `--layout-sidebar-width` | — | — | 22 rem | 22 rem |

## States

Layout primitives are not interactive. What changes is the breakpoint and,
for the page head, loading.

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Default | — | As specified | Section: region named by its heading. Page head: one `h1`. |
| Narrow (below LG) | viewport < 992 px | Detail and profile layouts are one column; aside last, or first with `--aside-first` (by DOM order) | Reading and tab order equal the visual order |
| Wide (LG and up) | viewport ≥ 992 px | Two columns; the aside sticks at `calc(var(--layout-topbar-height) + var(--space-6))` | Same order as narrow |
| Page head wraps | the aside does not fit beside the title | The aside drops under the title block; the `h1` never shrinks | — |
| Page head loading, title known | `loading` + `heading` | Title shown; sub is a `text` skeleton; the page projects aside skeletons | `role="status"` sub with the visually hidden `loadingLabel`; the `h1` is present |
| Page head loading, title unknown | `loading`, no `heading` | Kicker, title and sub skeletons (`text` medium, `poster`, `text` medium) | The `h1` exists, visually hidden, containing a `role="status"` span with `loadingLabel` |
| Section empty | the page renders an empty state as content | Head kept; content is the [empty state](empty-state.md) | Region keeps its name |
| Inert | an open dialog makes the page `inert` | No change | Not reachable |

## Markup

Page head, list page with a kicker and an action:

```html
<zm-page-head kicker="Riverside Community Church" heading="Your bookings" sub="3 upcoming · Luz Viva deposit due Sat 10 Oct, 4:00 p.m.">
  <header class="page-head">
    <div>
      <p class="overline">Riverside Community Church</p>
      <h1 class="page-head__title" id="page-title" tabindex="-1">Your bookings</h1>
      <p class="page-head__sub">3 upcoming · Luz Viva deposit due Sat 10 Oct, 4:00 p.m.</p>
    </div>
    <zm-button-link slot="aside" link="/">…Find who's free</zm-button-link>
  </header>
</zm-page-head>
```

Record page under a breadcrumb, with a status stamp:

```html
<div class="container">
  <zm-breadcrumb class="page-crumbs" …>…</zm-breadcrumb>
  <header class="page-head page-head--after-breadcrumb">
    <div><p class="overline">Booking ZAM-0114</p><h1 class="page-head__title" id="page-title" tabindex="-1">Worship night with Abigail Mensah</h1><p class="page-head__sub">Sat 14 Nov 2026 · 7:00 p.m. · Burlington</p></div>
    <zm-stamp slot="aside" …><span class="stamp stamp--lg stamp--requested">Requested</span></zm-stamp>
  </header>
  <div class="detail-layout detail-layout--aside-first detail-layout--flush">
    <aside aria-labelledby="money-title">…Payment…</aside>
    <div class="stack stack--lg">…Where it stands, messages…</div>
  </div>
</div>
```

Before and after slots:

```html
<header class="page-head">
  <div>
    <div class="page-head__before"><p class="text-sm"><a href="/artist/requests">Back to requests</a></p></div>
    <h1 class="page-head__title" id="page-title" tabindex="-1">Riverside Community Church</h1>
    <p class="page-head__sub">Worship night · Sat 14 Nov · 7:00 p.m. · requested today, 10:15 a.m.</p>
  </div>
  …stamp…
</header>

<header class="page-head">
  <div>
    <p class="overline">Admin · Artist management</p>
    <h1 class="page-head__title" id="page-title" tabindex="-1">Artists</h1>
    <p class="page-head__sub">8 artists · 8 approved · 0 suspended</p>
    <div class="page-head__after"><p><a class="link link--standalone" href="/admin/vulnerable-sector-checks">Vulnerable Sector Checks · 2 waiting…</a></p></div>
  </div>
  <form class="field page-head__search" role="search">…Search artists…</form>
</header>
```

Loading, title known and title unknown:

```html
<header class="page-head page-head--loading">
  <div>
    <h1 class="page-head__title" id="page-title" tabindex="-1">Requests</h1>
    <p class="page-head__sub" role="status"><span class="visually-hidden">Loading your requests</span><zm-skeleton shape="text" width="medium" inline /></p>
  </div>
  <zm-skeleton slot="aside" shape="none" style="height: var(--space-16)" width="medium" />
</header>

<header class="page-head page-head--after-breadcrumb page-head--loading">
  <div class="stack stack--sm">
    <zm-skeleton shape="text" width="medium" />
    <h1 class="page-head__title visually-hidden" id="page-title" tabindex="-1"><span role="status">Loading booking ZAM-0114</span></h1>
    <zm-skeleton shape="poster" />
    <zm-skeleton shape="text" width="medium" />
  </div>
  <zm-skeleton slot="aside" shape="stamp" />
</header>
```

Sections:

```html
<!-- contained, with an aside -->
<section zm-section id="lineup" class="section" aria-labelledby="lineup-title">
  <div class="container stack stack--lg">
    <div class="section__head">
      <div><p class="overline section__kicker">Sat 14 Nov · 7 free · within 120 km</p><h2 id="lineup-title">The lineup</h2></div>
      <label slot="aside" class="field field--inline">…Sort…</label>
    </div>
    …filters, headliner, lineup…
  </div>
</section>

<!-- not contained, inside the profile layout -->
<section zm-section class="section" aria-labelledby="songs-title">
  <div class="section__head"><div><p class="overline section__kicker">The setlist</p><h2 id="songs-title">Songs Abigail leads</h2></div><p slot="aside" class="text-muted">Ask for any of these, or send your own list.</p></div>
  <zm-setlist …>…</zm-setlist>
</section>

<!-- prose -->
<section zm-section class="section" aria-labelledby="about-title">
  <p class="overline section__kicker">About</p>
  <h2 id="about-title">Raised in the choir loft</h2>
  <div class="stack section__body">…paragraphs…</div>
</section>

<!-- headless: the band holds the heading -->
<section zm-section id="join" class="section" aria-labelledby="join-title">
  <div class="container"><zm-band headingId="join-title" …>…</zm-band></div>
</section>
```

Consumer templates:

```html
<div class="container">
  <zm-page-head [heading]="'bookings.title' | transloco" [kicker]="church().name" [sub]="summary()" [loading]="loading()" [loadingLabel]="'bookings.loading' | transloco">
    <zm-button-link slot="aside" link="/"><zm-icon name="search" />{{ 'bookings.find' | transloco }}</zm-button-link>
  </zm-page-head>
  <div class="page-body">…</div>
</div>

<section zm-section id="lineup" headingId="lineup-title" [heading]="'discover.lineup.title' | transloco" [kicker]="lineupKicker()">
  <zm-form-field slot="aside" class="field--inline" …>…</zm-form-field>
  …
</section>

<div class="container profile-layout">
  <div>
    <section zm-section prose [contained]="false" headingId="about-title" [heading]="artist().aboutHeading" [kicker]="'artist.about.kicker' | transloco">…</section>
  </div>
  <aside aria-labelledby="book-title"><zm-booking-form …>…</zm-booking-form></aside>
</div>
```

The classes, the `h1` and its `id`, the `section` hosts and their
`aria-labelledby` are the contract: e2e page objects find a page by its `h1`,
a band by its region name, and check layout by these classes.

## Design

- All layout CSS lives in `frontend/projects/components/src/styles/layout.scss`,
  loaded by both applications after `reset.scss` (D-2). Values are copied from
  `docs/design-system/assets/components.css`, plus the additions below.
- Page head: flex, wraps, `align-items: end`, `justify-content: space-between`,
  gap `--space-4` `--space-8`, padding `--space-12` top and `--space-8` bottom
  (`--space-4` top after a breadcrumb). Title `--text-h1`, uppercase,
  `overflow-wrap: anywhere`. Sub `--text-stub`, uppercase, `--color-fg-muted`,
  `--space-3` above. `.page-head__before` `--space-3` below;
  `.page-head__after` `--space-3` above; both hidden with `:empty`.
  `.page-head--loading > div` takes `flex: 1` so the skeletons have width.
- Section: as in the API table. Kicker uses `.overline` (`--text-overline`,
  `--letter-spacing-stamp`, uppercase). Headings take the page's `h2` / `h3`
  styles.
- Sticky asides: `position: sticky; top: calc(var(--layout-topbar-height) +
  var(--space-6))`. The reset's `scroll-padding-top` (`--layout-topbar-height`
  plus `--space-4`) keeps a focused field clear of the top bar.
- `--aside-first` from LG: `> aside { grid-column: 2; grid-row: 1 }` and the
  main block `grid-column: 1; grid-row: 1`. No `order` anywhere (D-3).
- `.page-body > .detail-layout { padding-block: 0; }` (D-9).
- No motion; breakpoint changes are instant.

Component tokens: none. A region changes its grid by overriding the layout
tokens on its element (`style="--layout-columns: 4"`).

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Hairline between sections | `--color-border-default` | `--palette-ink-200` | `--palette-ink-700` |
| Page head title, section heading | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Page head sub, section aside text | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Page background | `--color-bg-canvas` | `--palette-paper` | `--palette-ink-900` |
| Auth layout background | `--color-bg-stage` (from `main.poster`) | `--palette-ink-850` | `--palette-ink-950` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-canvas` | 4.5:1 | Titles, headings and section text |
| `--color-fg-muted` | `--color-bg-canvas` | 4.5:1 | Page head sub, kickers, section asides |
| `--color-border-default` | `--color-bg-canvas` | 1:1 (exempt) | Hairline between sections: decorative |

## Responsive behaviour

- Mobile first: base styles are for 360 px; `tokens.css` raises
  `--layout-columns`, `--layout-gutter` and `--layout-margin` at MD and LG. The
  layout classes read the tokens; components never write their own breakpoint
  for margins or columns.
- **XS and SM**: Discover's poster, search and lineup stack in one column
  (L2-097); section heads stack their kicker and heading above the aside; the
  profile and detail layouts are one column, the booking stub after the reviews
  (L2-098, L2-019); the page-head aside drops under the title.
- **MD**: the container margin is 40 px; the grid has 8 columns; section heads
  sit side by side when they fit.
- **LG and up**: detail and profile layouts are two columns with a sticky
  22 rem aside (L2-098, L2-019); section padding is 80 px; margins 64 px.
- **XL+**: the container stops at 1216 px and centres.
- No sideways scrolling: grid tracks are `minmax(0, 1fr)`, card minimums
  `min(100%, 18rem)`, page-head titles break inside a word that is wider than
  the column, and `.page-head__search` is at most the full width.
- Clusters wrap and never shrink their buttons; stacks never wrap.
- At 200 % and 400 % zoom the grid falls to 4 columns and the layouts to one,
  so nothing needs two-dimensional scrolling. The primitives are not targets;
  clusters keep at least 8 px between targets.

## Accessibility

### Role and pattern

- Layout classes add no role. Meaning comes from the element: `<main>`,
  `<aside aria-labelledby>`, `<ul role="list">`.
- `section[zm-section]` is a native `<section>` with `aria-labelledby`, so it is
  a region landmark named by its heading ("The lineup").
- `zm-page-head` renders `<header>` inside `<main>`, which has no landmark role,
  and the page's only `h1` (L2-102).

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> | Follows DOM order, which is always the visual order: no `order`, and no grid placement that moves a block before another in one column. |

### Focus

- On route change the router integration calls `focus()` on the page head's
  `h1`, which has `tabindex="-1"` so it can take focus without entering the tab
  sequence (L2-101). While the title is unknown it focuses the visually hidden
  loading `h1`, which keeps its `id`.
- A sticky aside never covers a focused element: it sits below the top bar, and
  `scroll-padding-top` keeps scrolled-to fields clear (WCAG 2.4.11).

### Labelling

- Each section is labelled by its heading; kickers are paragraphs read before
  it, so they stay short.
- The page head's `h1` is the page's name; the document title is set by the
  page from the same string.

### Announcements

The loading page head carries a `role="status"` element with `loadingLabel`
("Loading your requests"). The page sets `aria-busy="true"` on the loading
region (L2-105).

### Motion

None. Layout changes at breakpoints are instant.

## Content and internationalisation

- Section kickers are short stub-style labels ("About", "Live", "On tour",
  "Word of mouth") or the search context ("Sat 14 Nov · 7 free · within 120
  km"). Headings say something specific ("Raised in the choir loft", "Watch her
  lead"), not "Biography".
- Page head subs are facts joined by middle dots: "Sat 14 Nov 2026 · 7:00 p.m. ·
  Burlington", in the L2-110 formats, formatted before they reach the input.
- The section aside is one short sentence or one control.
- Prose stays under `--layout-measure` per line.
- French runs about 30 % longer: titles, subs and kickers wrap; nothing
  truncates.
- Translatable inputs: `heading`, `kicker`, `sub`, `loadingLabel`. Data values:
  names, numbers and dates inside them come from the API.

## Performance

- Change detection: `OnPush`, signal inputs; the heading tag of `zm-section`
  and the host classes from `computed`. No `effect`, no subscriptions.
- Perf-test scenarios: `PageHead.ts` renders Naomi's "Your bookings" head
  (kicker "Riverside Community Church", sub "3 upcoming · Luz Viva deposit due
  Sat 10 Oct, 4:00 p.m.", the "Find who's free" button); `Section.ts` renders
  Discover's "How booking works" band (kicker "Three songs and you're done",
  aside "Cancel free up to 14 days before your event."). Iterations in
  `e2e/perf-test/config/scenario-iterations.mjs` keep each at roughly
  100–300 ms; export both from `scenarios/index.ts`.
- The layout classes have no scenario; they are measured through every
  composite that uses them (`Lineup`, `Setlist`, `DarkTheme`).
- Layout stability: the loading page head has the loaded head's padding and
  title height (`poster` skeleton), and the layouts reserve their columns, so
  content replacing skeletons shifts the page by 0.05 or less (L2-105).
- Imports: `zm-page-head` imports `zm-skeleton`; `zm-section` imports nothing.
  `layout.scss` uses tokens only.

## Acceptance criteria

### Layout classes

- **AC-1** Given a `.container` at 360, 768, 992 and 1440 px, when it renders, then its side padding is 20, 40, 64 and 64 px, and at 1440 px its width is `--layout-container-max` (1216 px) centred. (L2-096)
- **AC-2** Given a `.grid` of twelve cells, when it renders at 360, 768 and 1280 px, then it has 4, 8 and 12 columns with 16, 24 and 32 px gutters, and at 320 px no cell overflows. (L2-096)
- **AC-3** Given the Availability page head's `.cluster` with "Mark dates unavailable" and "Subscribe in your calendar" at 360 px, when it renders, then the buttons wrap onto two rows `--space-2` apart and neither button shrinks below its label. (L2-096)
- **AC-4** Given `.stack--sm`, `.stack` and `.stack--lg`, when they render, then their gaps are `--space-2`, `--space-4` and `--space-10`. (L2-096)
- **AC-5** Given Discover at XS, when it renders, then the lineup section's kicker and "The lineup" heading sit above the sort field in one column, and neighbouring sections are divided by a `--border-width-hairline` rule in `--color-border-default`. (L2-097)
- **AC-6** Given Abigail Mensah's profile at XS and SM, when it renders, then its sections and the booking stub are one column and the stub follows the "What churches say" reviews section. (L2-098)
- **AC-7** Given Abigail Mensah's profile at LG, when the page scrolls, then the booking stub stays pinned in the right-hand 22 rem column at `--layout-topbar-height` plus `--space-6` from the top. (L2-019)
- **AC-8** Given booking ZAM-0114 below LG, when it renders, then the "Payment" aside comes straight after the page head, and Tab reaches its controls before the "Where it stands" panel, matching the visual order. (L2-101)
- **AC-9** Given booking ZAM-0114 at LG, when it renders, then the main column is on the left and the "Payment" aside is in the 22 rem right column, both starting at the top, with no CSS `order` used. (L2-096)
- **AC-10** Given Riverside's request page below LG, when it renders, then the aside follows the main column. (L2-096)
- **AC-11** Given the sign-in page at 360 and 1280 px, when it renders, then the "Admit one · Your account" card is centred in the stage under the top bar, at most `--layout-auth-width` wide, and the page does not scroll horizontally. (L2-096)
- **AC-12** Given the dashboard's `.page-body` with the stat grid and a `.detail-layout`, when it renders, then blocks are `--space-8` apart, the detail layout inside it has no block padding, and `--space-20` separates the last block from the footer. (L2-096)

### Page head

- **AC-13** Given `zm-page-head` for Naomi's bookings, when it renders, then it contains one `header.page-head` with `p.overline` "Riverside Community Church", `h1.page-head__title#page-title` "Your bookings", `p.page-head__sub` "3 upcoming · Luz Viva deposit due Sat 10 Oct, 4:00 p.m." and the projected "Find who's free" button on the right. (L2-102)
- **AC-14** Given any page built with these primitives, when it renders, then it has exactly one `h1`, the page head's, and every `zm-section` heading is an `h2` or `h3`. (L2-102)
- **AC-15** Given a route change to booking ZAM-0114, when the new page renders, then focus is on the `h1` "Worship night with Abigail Mensah", which has `tabindex="-1"` and is not in the Tab sequence. (L2-101)
- **AC-16** Given `afterBreadcrumb` under a `.page-crumbs` breadcrumb, when the head renders, then the breadcrumb has `--space-8` above it and the head has `--space-4` top padding instead of `--space-12`. (L2-096)
- **AC-17** Given the head "Worship night with Abigail Mensah" with a "Requested" stamp at 360 px, when it renders, then the stamp wraps under the title block, the title keeps its `--text-h1` size, and nothing scrolls horizontally. (L2-096)
- **AC-18** Given the Requests head with its search form and the Edit profile head with its completeness block, when they render at 1280 px, then the form is at least 18 rem wide and the block at least 16 rem; at 320 px the form takes the full width. (L2-096)
- **AC-19** Given "Back to requests" in the `before` slot, when the head renders, then the link sits above "Riverside Community Church" with `--space-3` between them and no inline style. (L2-096)
- **AC-20** Given the Requests page loading, when the head renders with `loading` and `loadingLabel` "Loading your requests", then the `h1` "Requests" is visible, the sub is a `role="status"` line containing the visually hidden "Loading your requests" and a text skeleton. (L2-105)
- **AC-21** Given booking ZAM-0114 loading with no title yet, when the head renders, then the page still has one `h1` with the heading role whose text is "Loading booking ZAM-0114" (visually hidden, inside a `role="status"` span), and the kicker, title and sub are `aria-hidden` skeletons. (L2-105)
- **AC-22** Given the loading head of booking ZAM-0114 replaced by the loaded head, when the swap is measured, then the cumulative layout shift from it is 0.05 or less. (L2-105)

### Sections

- **AC-23** Given the Discover lineup band, when the accessibility tree is read, then there is a region named "The lineup", its host is the native `<section id="lineup">`, and the kicker "Sat 14 Nov · 7 free · within 120 km" is read before the heading. (L2-102)
- **AC-24** Given the About section with `prose`, when it renders, then "About" and "Raised in the choir loft" are not in a `.section__head`, and the paragraphs start `--space-4` below the heading in `.stack.section__body`. (L2-098)
- **AC-25** Given the headless `#join` section with `aria-labelledby="join-title"`, when it renders, then no section head is drawn and the region is named "Lead worship? Get on the bill." by the band's heading. (L2-102)
- **AC-26** Given every route built with these primitives in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Theming

- **AC-27** Given the dark theme, when Discover and the bookings page render, then the section hairline is `--color-border-default` on `--color-bg-canvas`, and titles and subs use `--color-fg-default` and `--color-fg-muted`. (L2-104)
- **AC-28** Given both themes, when contrast is measured, then page-head subs, section kickers and section aside text are at least 4.5:1 on `--color-bg-canvas`. (L2-103)

### Responsive

- **AC-29** Given 320 px with text zoomed to 200 %, when Discover, the profile, booking ZAM-0114, sign-in and the dashboard render, then nothing scrolls horizontally, every layout is one column, and every function remains available. (L2-096)
- **AC-30** Given the French catalogue, when page-head titles, subs and section kickers run about 30 % longer, then they wrap within their blocks without clipping or truncation. (L2-111)

### Performance

- **AC-31** Given the `PageHead` and `Section` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then neither is flagged as a possible regression and each renders in its tuned 100–300 ms window. (L2-086)

## Implementation notes

`utilities.scss` in the library already has `.container`, `.stack`, `.cluster`
and `.section`; the artist page copies `.profile-layout` and the section head
into its own stylesheet. No page-head or section component exists. To meet this
CRD:

- Create `frontend/projects/components/src/styles/layout.scss` with every class
  in the API table, copied from `components.css` with the additions in Design
  (`.section--flush`, `.page-head__before`, `.page-head__after`,
  `.page-head--loading`, `.page-body > .detail-layout`, the DOM-order
  `--aside-first` and `overflow-wrap: anywhere` on `.page-head__title`).
  Use it from `index.scss`; move the four existing classes out of
  `utilities.scss`.
- Remove `.profile-layout`, `.section__*`, `.stack--lg` and `.page-error` from
  `pages/artist/artist.scss`. Its values drift from the design system
  (`.stack--lg` `--space-8`, head margin `--space-6`, body margin `--space-6`);
  the design-system values apply, so the profile's visual baselines change
  intentionally.
- Add `zm-page-head` (`lib/page-head/page-head.ts`, class `PageHead`) and
  `section[zm-section]` (`lib/section/section.ts`, class `Section`); export
  both. `PageHead` composes `zm-skeleton`. `Section` renders its heading with
  one `@switch` on `headingLevel`; its slots sit outside every branch.
- Put the kicker class `.overline` on section kickers (the artist page omits it
  and restyles the kicker locally).
- Add `PageHead.ts` and `Section.ts` perf-test scenarios and export them.
- The router integration that focuses the `h1` after navigation belongs to the
  app shell; it targets `#page-title`.

## Decisions

- **D-1** *Components or classes?* Both. The page head and the section have structure worth guaranteeing (one `h1` that takes focus, a region named by its heading, a correct loading state), so they are components. Container, stack, cluster, grid and the page layouts only place elements the page chooses (`main.container`, `ul.grid--cards`, `aside`), are combined with other components' classes (`.container.footer__grid`), and would break list and landmark semantics if wrapped, so they stay global utility classes, as AGENTS.md allows for utilities and as the form-layout CRD decided for its grids.
- **D-2** *Where do `.section` and `.page-head` styles live?* In the global `layout.scss`, with the other layout classes. `.section + .section`, `.profile-layout .section` and `.page-crumbs` spacing are sibling and ancestor rules that encapsulated component styles cannot express, and splitting the family would leave half its values in each place.
- **D-3** *How does `--aside-first` put the aside first below LG?* By DOM order: the page writes the `<aside>` before the main block, and from LG the class places it in the second column. The design-system CSS uses `order: -1`, but its own accessibility section forbids `order` because it separates tab order from what people see. On phones the aside then comes first both visually and in tab order; on desktop both columns start at the top, so either reading order matches the layout. This resolves a conflict inside the design system; the design-system page's `order` rule should be updated to match.
- **D-4** *`<header>` or `<div>` for the page head?* `<header>`. The mocks split (107 of 274 page heads are `<header>`, the rest `<div>`); `<header>` says what the block is, and inside `<main>` it has no landmark role, so it adds structure without a second banner.
- **D-5** *The loading mocks put `role="status"` on the visually hidden `h1`. Keep it?* No. `role="status"` replaces the heading role, so the page would have no `h1` while loading and route focus would land on a status box. The `h1` keeps its role and contains a `role="status"` span.
- **D-6** *How does route-change focus reach the title?* The `h1` has `tabindex="-1"` and a stable `id` (`page-title`), so the shell can focus it without adding it to the Tab sequence (L2-101).
- **D-7** *The request-detail mock spaces its back link with an inline `margin-top` on the `h1`. How is it built?* With a `before` slot whose wrapper has `--space-3` below it. The design system already replaced the mocks' other inline layout styles with classes.
- **D-8** *Not-found's similar-artists band uses `style="padding-top: 0"`. How is it built?* With `.section--flush` (`flush` input), for the same reason.
- **D-9** *The dashboard's detail layout uses `style="padding-block: 0"` inside the page body. How is it built?* `.page-body > .detail-layout` has no block padding; the page body's gap already spaces it.
- **D-10** *The About section has no head row and a 16 px body gap. A variant?* Yes, `prose`. It is the design system's own Do example (`.section__body`), and forcing it into the head row would double the gap under the heading.
- **D-11** *How does the `#join` band, whose heading is inside `zm-band`, get a section?* A headless `zm-section` (no `heading`), with the page setting `aria-labelledby="join-title"` on the host, as the band CRD's D-1 expects the page to own the section.
- **D-12** *Keep `.grid`, `.grid--cards`, `.span-full`, `.cluster--lg` and `.section--tight`, which no mock uses?* Yes. The design system specifies each, the card and footer CRDs reference `.grid--cards` and `.cluster--lg`, and the call-to-action band is `.section--tight`; removing them would change the class contract later.
- **D-13** *A page-head title wider than its column at 320 px?* It breaks inside the word (`overflow-wrap: anywhere`), as the ticket and dialog CRDs decided for their names. "Vulnerable Sector Checks" in `--text-h1` uppercase comes close to the 280 px column; shrinking the type breaks the scale and truncation is forbidden (L2-096).
