# Dialog

| Field | Value |
|---|---|
| Selector | `zm-dialog` (plus the `openDialog()` helper in the same folder) |
| Library path | `frontend/projects/components/src/lib/dialog/` |
| Status | built |
| Traces to | L2-086, L2-096, L2-099, L2-100, L2-101, L2-102, L2-103, L2-104, L2-108, L2-111 |
| Design system | [`dialog.html`](../../design-system/components/dialog.html), with [Dialogs & overlays](../../design-system/patterns/dialogs-and-overlays.html) |
| Source mocks | every state of all 30 folders in [`dialogs/`](../../mocks/dialogs/), for example [`dialogs/withdraw-request/default`](../../mocks/dialogs/withdraw-request/default.html), [`dialogs/cancel-booking/late`](../../mocks/dialogs/cancel-booking/late.html), [`dialogs/pay-deposit/failed`](../../mocks/dialogs/pay-deposit/failed.html), [`dialogs/add-photo/busy`](../../mocks/dialogs/add-photo/busy.html), [`dialogs/menu/default`](../../mocks/dialogs/menu/default.html), [`dialogs/account-menu/default`](../../mocks/dialogs/account-menu/default.html) (see Usage) |
| Rendering | [`dialog.html`](dialog.html) |

## Purpose and scope

A dialog stops the page to ask one question before something important
happens: pay the $162.50 deposit, cancel the worship night with Abigail, reject
Tobi Adeyemi's application. It is a paper card on a dimmed page with a dashed
tear line under its title. Below 576 px it fills the screen. The same frame,
in two other variants, is the navigation drawer behind the menu button and the
anchored account menu behind the avatar.

`zm-dialog` is the frame: header (icon, kicker, title, consequence line, close
button), a scrolling body and a footer for the actions. Opening, the focus
trap, Escape, the backdrop and focus return come from the Angular CDK Dialog
(`@angular/cdk/dialog`), configured once by `openDialog()`. No page hand-rolls a
modal (AGENTS.md). Each product dialog (for example `WithdrawRequestDialog` in
`frontend/projects/zamaro/src/app/dialogs/withdraw-request/`) is a component that
renders one `zm-dialog`.

Use something else when:

- the person needs to know something worked → [toast](toast.md);
- something on the page failed → [alert](alert.md);
- an icon-only control needs a name → [tooltip](tooltip.md);
- the task is long, linkable or compared against (the booking request, a
  profile) → a page;
- it is a list of actions tied to one control inside the page → [menu](menu.md)
  alone. The account menu is a dialog only because it is modal and anchored to
  the top bar (D-3).

Out of scope:

- The content of the body: fields ([form field](form-field.md)), the
  failure alert ([alert](alert.md)), the error summary, receipts and definition
  lists ([description list](description-list.md)), the upload
  [progress bar](progress-bar.md), the [menu](menu.md) list. The consumer
  projects them.
- The footer buttons ([button](button.md)). The consumer projects them and sets
  their `busy` and `disabled` state; the button CRD makes them stretch in
  `.dialog__footer` at XS.
- What happens on submit, which state follows, and which element the consumer
  focuses after a failure or an invalid submission. The dialog guarantees that
  it stays open and keeps its content; the consumer moves focus (see Focus).
- Toast queuing while a dialog is open ([toast](toast.md)).
- The trigger's own state (`expanded` on the menu button) — the
  [top bar](top-bar.md) and [button](button.md) own it.

## Usage

All 125 dialog renderings in the mocks live in `docs/mocks/dialogs/`; no page,
notification or design-system pattern draws one inline. Each row is one
distinct configuration; the API below builds every row. "Focus" is the element
the consumer marks `cdkFocusInitial`.

| Where | Configuration | Slots / content | States seen | Surface |
|---|---|---|---|---|
| `withdraw-request` | md, `icon="info"`, kicker "ZAM-0114 · Requested · Sat 14 Nov", title "Withdraw your request to Abigail?", description "Nothing has been charged and nothing will be." | body: paragraph + definition list; footer: "Keep request" + danger "Withdraw request"; focus "Keep request" | default, busy "Withdrawing…" (way back and close disabled), failed (alert, focus stays on "Keep request") | dialog |
| `cancel-booking/default` → `confirm` (a step in the same dialog) | md, `icon="info"` then `icon="warning" iconTone="danger"` without `danger` | receipt, policy fine print; footer "Keep booking" + danger "Cancel booking", then "Go back" + danger "Yes, cancel the booking"; focus the way back | default, confirm, busy "Cancelling…", failed | dialog |
| `cancel-booking/late` | md, `danger`, `icon="warning" iconTone="danger"`, title "Cancel the worship night with Abigail?" | receipt "You lose $162.50"; footer "Keep booking" + danger "Cancel and lose $162.50" | default | dialog |
| `pay-deposit`, `pay-balance` | lg, `icon="card"`, kicker "ZAM-0114 · Accepted · Sat 14 Nov", title "Pay the $162.50 deposit" | receipt, processor card fields, fine print; footer "Not now" + primary lg "Pay $162.50"; focus first card field | default, invalid (error summary), busy "Paying $162.50…" (close and "Not now" disabled), failed card declined (focus the alert, primary "Pay with another card") | dialog |
| `pay-deposit/conflict` | md, `danger`, `icon="warning" iconTone="danger"`, title "Sat 14 Nov is no longer free" | receipt; footer "Close" + primary "Find who's free Sat 14 Nov"; focus primary | default | dialog |
| `accept-request` | md, `icon="check"`, kicker "Riverside Community Church · ZAM-0114", title "Accept this request" | receipt "You receive $598"; footer "Cancel" + primary with check icon "Accept request"; focus primary | default, busy "Accepting…", failed "Try again" | dialog |
| `accept-request/no-phone`, `accept-request/conflict` | md, `icon="phone"`; or `danger` + `icon="warning" iconTone="danger"` "You're already booked on Sat 21 Nov" | footer "Not now" + "Add contact phone"; or "Back to requests" + primary "Close"; focus primary | default | dialog |
| `decline-request`, `artist-cancel-booking` | md, `danger`, `icon="x-circle"` / `"warning"`, `iconTone="danger"` | radio reasons + note, receipt; footer "Cancel" / "Keep booking" + danger "Decline request" / "Cancel booking"; focus first field or the way back | default, invalid, busy "Declining…", "Cancelling…", failed (focus the way back) | dialog |
| `add-photo`, `add-song`, `add-video`, `upload-check` | md, `icon="image"`, `"music"`, `"film"`, `"shield-check"`, kicker "Photos · 4 of 12" | fields; footer "Cancel" + primary "Upload photo" / "Add song"; focus first field | default, invalid, failed ("Resume upload" for video); add-song busy "Adding…" is `busy`; uploads are **not** `busy`: progress bar in the body, "Cancel upload" and close stay enabled | dialog |
| `add-photo/limit`, `add-song/limit`, `add-video/limit` | md, same icon, kicker "Photos · 12 of 12", no form | one paragraph; footer one primary "Back to my photos"; focus it | default | dialog |
| `block-dates`, `weekly-default` | md, `icon="block"` / `"repeat"`, kicker "Availability · November 2026" | date fields, radios; footer "Cancel" + "Mark 2 days unavailable" / "Save weekly default" | default, invalid, busy "Saving…", failed; `block-dates/warning`: `danger`, `icon="warning" iconTone="danger"`, warning alert, "Keep Sun 22 Nov open" + danger "Mark unavailable and decline", focus the way back | dialog |
| `calendar-feed` | md, `icon="feed"`, no form | feed link with copy button; footer "Make a new link" + primary "Done"; `off`: "Cancel" + "Turn on calendar feed" | default, off, busy "Turning on…", failed; `confirm`: `danger` "Make a new link?", "Keep current link" + danger "Make a new link" | dialog |
| `write-review`, `reply-review`, `report-problem`, `report-review`, `add-church` (lg) | md or lg, `icon="star"`, `"reply"`, `"warning"` (info tone), `"flag"`, `"church"` | rating, textarea, radios, review quote; footer "Not now" / "Cancel" + primary "Post review", "Post reply", "Report and hold the balance", "Send report", "Save and send request" | default, edit ("Edit your reply to Tomi", "Save changes"), invalid, busy "Posting…", "Sending report…", "Saving…", failed | dialog |
| `delete-account`, `two-step-code` | md, `danger`, `icon="trash"` / `"lock"`, `iconTone="danger"` | password or code field; footer "Keep my account" / "Keep it on" + danger "Delete my account" / "Turn off" | default, invalid, busy "Deleting…", "Turning off…", failed (focus the way back) | dialog |
| `delete-account/blocked`, `two-step-code/codes`, `two-step-code/new-codes` | md, `icon="calendar"` / `"key"`, info | receipt or recovery codes; footer "Close" + primary "Go to your bookings"; or one primary "I've saved them"; or "Cancel" + "Get new codes" | default | dialog |
| Admin app: `reject-application`, `suspend-artist`, `hide-review` | md, `danger`, `icon="warning"` / `"eye-off"`, `iconTone="danger"`, kicker "A-0219 · Submitted · Fri 9 Oct" | select or textarea reason; footer "Cancel" + danger "Reject application" / "Suspend artist" / "Hide review" | default, invalid, busy "Rejecting…", "Suspending…", "Hiding…", failed (focus "Cancel") | dialog |
| Admin app: `reinstate-artist`, `resolve-hold`, `issue-refund` | md; `icon="undo"`, `"shield"`, `"wallet"`; `issue-refund/confirm` switches to `danger` + `icon="warning" iconTone="danger"` "Refund $237.50 to Naomi Fraser?" | definition list, radios, amount field; footer "Cancel" + primary "Reinstate artist", "Resolve hold", "Continue"; confirm "Go back" + danger "Refund $237.50" | default, confirm, invalid, busy "Reinstating…", "Resolving…", "Refunding…", failed | dialog |
| `photo-viewer` | md, no icon, kicker "Abigail Mensah · Photos", title "Photo 1 of 4", `closeLabel` "Close photo viewer" | artwork or photo + caption; footer "Previous photo" (disabled on the first) + primary "Next photo" with arrows; focus close | default | dialog |
| `menu/default`, `menu/artist`, `menu/admin` | `variant="drawer"`, title "Menu", description "Saved artists and your account stay in the top bar.", `closeLabel` "Close menu" | body: `<nav aria-label="Main menu">` + [menu](menu.md) list ending in "Dark theme"; no footer; focus close | open | dialog (drawer from the left) |
| `account-menu/default`, `account-menu/artist` | `variant="menu"`, visually hidden title "Account menu for Naomi Fraser", no close, no footer | `.menu__who` (name, church, email) as the description + [menu](menu.md) list; focus first item "Your bookings" | open | dialog (anchored, transparent backdrop) |
| Design system only | `size="sm"` "Remove Luz Viva from saved?"; `size="lg"` "Booking terms" with `bodyLabel` | footer "Keep" + "Remove"; one "Close" | default | dialog |

## Anatomy

1. **Backdrop** — the CDK overlay backdrop with the global class
   `.zm-backdrop` (`--color-bg-backdrop`). Transparent for the menu variant.
   Does not animate.
2. **Frame** — the `zm-dialog` host, `.dialog` plus modifiers. Paper surface,
   2 px `--color-border-strong` rule, hard `--shadow-4` print shadow.
3. **Danger rule (optional)** — `.dialog--danger`: a 4 px
   `--color-danger-solid` rule across the top of the header.
4. **Header** — `.dialog__header`: icon, heading block and close button in a
   row, with a 2 px dashed tear line under it. Never scrolls.
5. **Icon (optional)** — `.dialog__icon` with `.dialog__icon--info` or
   `.dialog__icon--danger`: a 40 px framed square holding a `zm-icon`. It repeats
   the title, so it is `aria-hidden`.
6. **Heading block** — an unclassed `<div>` that takes the free width
   (`flex: 1`, `min-width: 0`).
7. **Kicker (optional)** — `.dialog__kicker`: the context in the overline
   style, "ZAM-0114 · Requested · Sat 14 Nov".
8. **Title** — `.dialog__title`, an `<h2>` in `--text-h3`, uppercase by CSS. It
   is the dialog's accessible name.
9. **Description (optional)** — a `<p class="text-muted">` under the title: the
   consequence in one sentence. It is the dialog's accessible description.
10. **Close** — `.close`, the generic 36 px icon button (44 px under a coarse
    pointer) with a small `close` icon and an `aria-label`.
11. **Body** — `.dialog__body`: the projected content in a column with
    `--space-4` gaps. The only part that scrolls.
12. **Footer (optional)** — `.dialog__footer`: the projected actions, the way
    back first and the primary or danger action last, right-aligned. Sticky at
    the bottom at XS. Not rendered when nothing is projected into it.

Host: `zm-dialog` is the card itself and carries `.dialog` and its modifiers
(it is `display: flex; flex-direction: column`). The CDK renders it inside its
own `cdk-dialog-container`, which carries `role="dialog"`, `aria-modal`,
`aria-labelledby` and `aria-describedby` and holds the focus trap. Inside the
container sits the consumer's dialog component, then `zm-dialog`.

## API

### `zm-dialog` inputs

| Input | Type | Default | Required | Rule |
|---|---|---|---|---|
| `heading` | `string` | — | yes | The title text: "Withdraw your request to Abigail?". In the menu variant it is rendered visually hidden ("Account menu for Naomi Fraser"). |
| `titleId` | `string` | — | yes | `id` of the `<h2>`. Pass the same value to `openDialog()` as `titleId`. Unique per open dialog. |
| `kicker` | `string` | `''` | no | Rendered as `.dialog__kicker` above the title when not empty. |
| `description` | `string` | `''` | no | Rendered as `<p class="text-muted" [id]="descriptionId">` under the title when not empty. |
| `descriptionId` | `string` | `` `${titleId}-desc` `` | no | `id` of the description. Pass it to `openDialog()` as `descriptionId`. When the consequence is a body paragraph instead, the consumer gives that paragraph an id and passes it. |
| `icon` | `IconName \| null` | `null` | no | A `zm-icon` name from the [icon](icon.md) set, rendered in `.dialog__icon`. `null` renders no icon block. |
| `iconTone` | `'info' \| 'danger'` | `'info'` | no | `.dialog__icon--info` or `.dialog__icon--danger`. Independent of `danger`: the cancel-booking confirm step has a danger icon without the danger rule. |
| `danger` | `boolean` (attribute) | `false` | no | Adds `.dialog--danger` (the red top rule). Use it when the action cannot be undone and costs something, or when a conflict blocks the action. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Adds `.dialog--sm` (24 rem) or `.dialog--lg` (44 rem). Ignored by the drawer and menu variants. |
| `variant` | `'default' \| 'drawer' \| 'menu'` | `'default'` | no | Adds `.dialog--drawer` or `.dialog--menu`. The menu variant renders no header, no close and no footer (see Markup). |
| `closeLabel` | `string` | `''` | yes, except `variant="menu"` | The close button's `aria-label`: "Close", "Close menu", "Close photo viewer". In dev mode an empty label outside the menu variant logs a console error naming the component. |
| `busy` | `boolean` | `false` | no | Sets `aria-busy="true"` on the host, dims the body, disables the close button, and ignores Escape and backdrop clicks. Set it from the moment the request is sent until it settles. Do not set it for an upload that the person can cancel. |
| `dirty` | `boolean` | `false` | no | The dialog holds input the person has not sent. Backdrop clicks are ignored; Escape and the close button still dismiss. |
| `bodyLabel` | `string` | `''` | no | For a body that is long text to read ("Booking terms text"): adds `tabindex="0"`, `role="region"` and this `aria-label` to `.dialog__body` so it can be scrolled with the keyboard. |

All inputs are signal inputs; booleans accept bare attributes (`booleanAttribute`).

### Outputs

| Output | Payload | Emitted when |
|---|---|---|
| `dismissed` | `'close-button' \| 'escape' \| 'backdrop'` | The person dismisses the dialog by the close button, Escape or the backdrop, and the dialog is not `busy` (and, for the backdrop, not `dirty`). Emitted before the dialog closes its own `DialogRef` with no result. An upload dialog listens to it to abort the upload. |

The footer's own buttons are not outputs: the consumer handles their `click`
and closes the dialog with `dialogRef.close(result)`.

### Content slots

| Slot | Accepts | Rule |
|---|---|---|
| default | any body content: paragraphs, `zm-alert`, the error summary, form fields, receipts, `zm-progress-bar`, a `<nav>` with `zm-menu`, an image | Rendered in `.dialog__body` (in the menu variant, in an unclassed wrapper with `display: contents`). |
| `[slot=footer]` | `zm-button`, `zm-button-link` (one per node) | Rendered in `.dialog__footer`, the way back first and the primary or danger action last. The wrapper is not rendered (`:empty { display: none }`) when nothing is projected. |

Each slot is declared once in the template. The variant switches classes on
always-rendered wrappers; no slot sits inside an `@if` branch.

### `openDialog()`

`openDialog<C, D, R>(dialog: CdkDialog, component: ComponentType<C>, options: DialogOpenOptions<D>): DialogRef<R, C>`
opens a product dialog with the Zamaro defaults. Pages and the shell call it;
they never call `CdkDialog.open` with their own config.

| Option | Type | Default | Rule |
|---|---|---|---|
| `titleId` | `string` | — (required) | CDK `ariaLabelledBy`. |
| `descriptionId` | `string \| null` | `null` | CDK `ariaDescribedBy`. |
| `variant` | `'default' \| 'drawer' \| 'menu'` | `'default'` | Chooses the position strategy and backdrop below. Must match the `zm-dialog`'s `variant`. |
| `data` | `D` | — | CDK `data`, read with `inject(DIALOG_DATA)`. |
| `restoreFocus` | `boolean \| string \| HTMLElement` | `true` | CDK `restoreFocus`. Pass the page's `h1` (or its selector) when the action removes the trigger. |
| `injector` | `Injector` | — | CDK `injector`, for dialogs opened outside a component's injection context. |

Fixed config it always sets: `role: 'dialog'`, `ariaModal: true`,
`autoFocus: 'first-tabbable'` (which honours `cdkFocusInitial`),
`disableClose: true` (the `zm-dialog` handles Escape and the backdrop itself so
it can honour `busy` and `dirty`), `hasBackdrop: true`,
`closeOnNavigation: true`, `maxWidth: '100vw'`, `panelClass: 'zm-dialog-pane'`,
`scrollStrategy: block` (the page does not scroll behind). Per variant:

| Variant | Position | Backdrop class |
|---|---|---|
| default | global, centred | `zm-backdrop` |
| drawer | global, `left(0)`, `top(0)` | `zm-backdrop` |
| menu | global, `top(calc(var(--layout-topbar-height) + var(--space-2)))`, `right(var(--layout-margin))` | `zm-backdrop zm-backdrop--clear` |

## Variants and sizes

| Variant | Modifier | Use for |
|---|---|---|
| Default (decision or form) | — | Every decision and small form: withdraw, pay, accept, add a song, reply to a review. |
| Danger | `.dialog--danger` (`danger`) | An action that cannot be undone and costs something (late cancellation, decline, delete the account, turn off two-step sign-in, reject, suspend, hide, refund confirm), or a conflict that blocks the action ("Sat 14 Nov is no longer free"). Pair with `iconTone="danger"` and a danger button. |
| Drawer | `.dialog--drawer` (`variant="drawer"`) | The navigation drawer below LG (below XL for the artist and admin bars): full height from the left, `--layout-drawer-width` wide, a thick rule on its open edge, no shadow. |
| Menu | `.dialog--menu` (`variant="menu"`) | The account menu behind the avatar: `--layout-menu-width` wide, hanging under the top bar's right edge with `--shadow-2`, no dim, anchored at every width. |

| Size | Modifier | Width (`--dialog-width`) | Use for |
|---|---|---|---|
| Small | `.dialog--sm` | 24 rem | A one-line question with no body. |
| Medium | — | `--layout-dialog-width` (32 rem) | The default; every product dialog except the three below. |
| Large | `.dialog--lg` | 44 rem | Payments (`pay-deposit`, `pay-balance`), `add-church`, and long reading such as the booking terms. |

The rendered width is `min(100% - var(--space-8), var(--dialog-width))`; the
height is at most `min(100dvh - var(--space-8), 48rem)`. Below 576 px every
size fills the screen.

## States

| State | Trigger | Visual | Assistive technology |
|---|---|---|---|
| Opening | `openDialog()` | Fades in and rises `--space-4` over `--duration-slow` with `--ease-enter`; drawer slides in from the left (`slide-in-left`); menu scales in from its top-right corner (`scale-in`). Backdrop appears at once. | Container `role="dialog"`, `aria-modal="true"`; the page's other top-level elements get `aria-hidden="true"` from the CDK. Focus moves inside. |
| Open | — | Paper card on the dimmed page; the page cannot be clicked or scrolled. | Name from the title, description from the consequence line; Tab cycles inside only. |
| Danger | `danger` | 4 px `--color-danger-solid` rule over the header | — (the title and description carry the meaning) |
| Busy | `busy = true` | Body at 60 % opacity and `pointer-events: none`; close button disabled; the primary shows the button's busy spinner and "Verb…" label; the way back is disabled by the consumer. | `aria-busy="true"` on the frame; Escape and backdrop ignored; focus stays on the busy primary. |
| Upload in progress | primary button `busy`, frame **not** `busy` | A progress bar in the body; fields read-only; "Cancel upload" and close stay enabled | The progress bar's `role="status"` region announces; Escape still dismisses (and the consumer aborts). |
| Invalid | consumer renders the error summary and field errors | Error summary at the top of the body; field errors under their fields | The summary has `role="alert"` and takes focus (`tabindex="-1"`); fields have `aria-invalid` and `aria-describedby`. |
| Failed | consumer renders a compact danger alert at the top of the body | The dialog stays open with every value kept; the primary becomes "Try again" (or "Pay with another card") | Alert `role="alert"`; focus moves per the Focus table. |
| Step | consumer swaps the content (cancel-booking default → confirm, issue-refund default → confirm) | Same dialog, new title, icon and footer; never a second dialog on top | The CDK container keeps its labels; the title `id` is reused so the name updates. Focus moves to the new step's marked element. |
| Dirty | `dirty = true` | — | Backdrop clicks ignored. |
| Hover / focus on controls | `:hover`, `:focus-visible` on `.close` and the footer buttons | `.close` hover fills `currentColor` at 12 %; focus shows the two-tone ring (`--color-focus-ring` on `--color-bg-surface-raised`) | — |
| Closed | `dialogRef.close()`, `dismissed` | Removed at once (no exit animation) | Focus returns to the trigger, or to `restoreFocus`. |

## Markup

Rendered by the CDK and `zm-dialog`, default variant with every header part
(`dialogs/withdraw-request/default`):

```html
<div class="cdk-overlay-backdrop zm-backdrop cdk-overlay-backdrop-showing"></div>
<div class="cdk-global-overlay-wrapper">
  <div class="cdk-overlay-pane zm-dialog-pane">
    <cdk-dialog-container role="dialog" aria-modal="true" aria-labelledby="withdraw-title" aria-describedby="withdraw-title-desc" tabindex="-1">
      <zm-withdraw-request-dialog>
        <form class="dialog__form" [formGroup]="form" (ngSubmit)="withdraw()" novalidate>
          <zm-dialog class="dialog">
            <div class="dialog__header">
              <div class="dialog__icon dialog__icon--info" aria-hidden="true"><zm-icon name="info" /></div>
              <div>
                <span class="dialog__kicker">ZAM-0114 · Requested · Sat 14 Nov</span>
                <h2 class="dialog__title" id="withdraw-title">Withdraw your request to Abigail?</h2>
                <p class="text-muted" id="withdraw-title-desc">Nothing has been charged and nothing will be.</p>
              </div>
              <button class="close" type="button" aria-label="Close"><zm-icon name="close" size="sm" /></button>
            </div>
            <div class="dialog__body">
              <p>Abigail is told straight away and the request leaves her inbox. If she's still free on Sat 14 Nov later, you can ask her again.</p>
              …
            </div>
            <div class="dialog__footer">
              <zm-button cdkFocusInitial>…Keep request</zm-button>
              <zm-button variant="danger" type="submit">…Withdraw request</zm-button>
            </div>
          </zm-dialog>
        </form>
      </zm-withdraw-request-dialog>
    </cdk-dialog-container>
  </div>
</div>
```

The form wraps `zm-dialog` (D-4); `.dialog__form` is `display: contents`, so
the frame still lays out header, body and footer. A dialog with nothing to
submit (`photo-viewer`, `calendar-feed`, the `limit` states) has no form.

Danger, busy (`dialogs/delete-account/busy`):

```html
<zm-dialog class="dialog dialog--danger" aria-busy="true">
  <div class="dialog__header">
    <div class="dialog__icon dialog__icon--danger" aria-hidden="true"><zm-icon name="trash" /></div>
    <div>…<h2 class="dialog__title" id="delete-title">Delete your account?</h2>…</div>
    <button class="close" type="button" aria-label="Close" disabled>…</button>
  </div>
  <div class="dialog__body">…</div>
  <div class="dialog__footer">…<button class="btn" type="button" disabled>Keep my account</button>…<button class="btn btn--danger" type="submit" aria-busy="true" aria-disabled="true">Deleting…</button>…</div>
</zm-dialog>
```

No icon and no footer, long text (`size="lg"`, `bodyLabel`):

```html
<zm-dialog class="dialog dialog--lg">
  <div class="dialog__header"><div><span class="dialog__kicker">Before you book</span><h2 class="dialog__title" id="terms-title">Booking terms</h2></div><button class="close" …></button></div>
  <div class="dialog__body" tabindex="0" role="region" aria-label="Booking terms text">…</div>
</zm-dialog>
```

Drawer (`dialogs/menu/default`):

```html
<zm-dialog class="dialog dialog--drawer">
  <div class="dialog__header">
    <div><h2 class="dialog__title" id="menu-title">Menu</h2><p class="text-muted" id="menu-title-desc">Saved artists and your account stay in the top bar.</p></div>
    <button class="close" type="button" aria-label="Close menu">…</button>
  </div>
  <div class="dialog__body"><nav aria-label="Main menu"><zm-menu …><ul class="menu-list" role="list">…</ul></zm-menu></nav></div>
</zm-dialog>
```

Anchored account menu (`dialogs/account-menu/default`). No header element, no
close, no footer; the title is visually hidden and the content is projected
without the body's padding:

```html
<zm-dialog class="dialog dialog--menu">
  <h2 class="dialog__title visually-hidden" id="account-title">Account menu for Naomi Fraser</h2>
  <div class="dialog__content">
    <div class="menu__who" id="account-who"><strong>Naomi Fraser</strong><span>Riverside Community Church</span><span class="text-muted">naomi.fraser@riversidecc.ca</span></div>
    <zm-menu …><ul class="menu-list" role="list">…</ul></zm-menu>
  </div>
</zm-dialog>
```

In the menu variant the default slot's wrapper is `.dialog__content`
(`display: contents`) instead of `.dialog__body`; that wrapper's class is free
to change, every other class above is a contract.

Consumer templates:

```html
<!-- WithdrawRequestDialog -->
<form class="dialog__form" [formGroup]="form" (ngSubmit)="withdraw()" novalidate>
  <zm-dialog [heading]="'bookings.withdraw.title' | transloco: { artist: data.artistFirstName }" titleId="withdraw-title"
    [kicker]="data.kicker" [description]="'bookings.withdraw.nothingCharged' | transloco"
    icon="info" [closeLabel]="'common.close' | transloco" [busy]="sending()" [dirty]="false">
    @if (failed()) { <zm-alert variant="danger" compact …>…</zm-alert> }
    <p>{{ 'bookings.withdraw.body' | transloco: { artist: data.artistFirstName, date: data.shortDate } }}</p>
    <zm-button slot="footer" cdkFocusInitial [disabled]="sending()" (click)="dialogRef.close()">{{ 'bookings.withdraw.keep' | transloco }}</zm-button>
    <zm-button slot="footer" variant="danger" type="submit" [busy]="sending()">{{ (sending() ? 'bookings.withdraw.busy' : 'bookings.withdraw.submit') | transloco }}</zm-button>
  </zm-dialog>
</form>
```

```ts
openDialog(this.dialog, WithdrawRequestDialog, { titleId: 'withdraw-title', descriptionId: 'withdraw-title-desc', data: { number: 'ZAM-0114' } });
openDialog(this.dialog, MenuDialog, { variant: 'drawer', titleId: 'menu-title', descriptionId: 'menu-title-desc', injector: this.injector });
openDialog(this.dialog, AccountMenuDialog, { variant: 'menu', titleId: 'account-title', descriptionId: 'account-who' });
```

The `.dialog*` and `.close` classes, the `<h2>` title, `role="dialog"` with its
name, and `aria-busy` are a contract: the e2e page objects find a dialog by
role and name and its buttons by role and name, and the visual tests compare
the classes with `docs/mocks/dialogs`.

## Design

- Frame: `--border-width-thick` solid `--color-border-strong`,
  `--color-bg-surface-raised` paper, `--color-fg-default` text, `--shadow-4`,
  square corners, `overflow: hidden`. Width and height as in Variants and
  sizes.
- Header: flex row, `align-items: flex-start`, gap `--space-4`, padding
  `--space-6` `--space-6` `--space-4`; tear line `--border-width-thick` dashed
  `--color-border-strong` underneath. Danger: `--border-width-poster` solid
  `--color-danger-solid` on top.
- Icon: 2.5 rem square, `--border-width-thick` solid `currentColor`, the icon
  centred at its default 20 px size; info `--color-info-icon` on
  `--color-info-bg`, danger `--color-danger-icon` on `--color-danger-bg`.
- Kicker: `--text-overline`, `--letter-spacing-stamp`, uppercase, margin below
  `--space-1`.
- Title: `--text-h3`, uppercase, wraps (`overflow-wrap: anywhere` as the last
  resort, D-9).
- Description: `--text-body-sm` in `--color-fg-muted`, margin above `--space-1`.
- Close: `--control-height-sm` square (`--target-comfortable` under a coarse
  pointer), no border, transparent; hover `color-mix` of `currentColor` at 12 %.
- Body: flex column, gap `--space-4`, padding `--space-5` `--space-6`,
  `overflow-y: auto`, `overscroll-behavior: contain`.
- Footer: flex row, wraps, `justify-content: flex-end`, gap `--space-3`,
  padding `--space-4` `--space-6` `--space-6`.
- Drawer: width `min(100%, var(--layout-drawer-width))`, full `100dvh` height,
  no frame except `--border-width-thick` on the right, no shadow.
- Menu: width `--layout-menu-width`, at most `calc(100vw - var(--layout-margin) * 2)`
  wide and `calc(100dvh - var(--layout-topbar-height) - var(--space-4))` tall,
  padding `--space-2`, `--shadow-2`.
- Motion: `dialog-in` (opacity and a `--space-4` rise) over `--duration-slow`
  with `--ease-enter`; `slide-in-left` for the drawer, `scale-in` from the top
  right for the menu. No exit animation; the backdrop never animates.
- Layering: the CDK overlay container sits above the page. Its backdrop and
  pane use `--z-overlay` and `--z-modal` (set on `.cdk-overlay-container` by the
  application's global styles); the sticky top bar (`--z-sticky`) stays below.

Component tokens declared on the host:

| Token | Aliases | Overridden by |
|---|---|---|
| `--dialog-width` | `--layout-dialog-width` | `.dialog--sm` (24 rem), `.dialog--lg` (44 rem) |

## Colour

| Part | Token | Light | Dark |
|---|---|---|---|
| Paper | `--color-bg-surface-raised` | `--palette-paper-bright` | `--palette-ink-800` |
| Text, title | `--color-fg-default` | `--palette-ink-750` | `--palette-ink-100` |
| Kicker colour inherits; description | `--color-fg-muted` | `--palette-ink-600` | `--palette-ink-300` |
| Frame, tear line, drawer edge | `--color-border-strong` | `--palette-ink-700` | `--palette-ink-300` |
| Print shadow | `--shadow-4` in `--color-shadow` | `--palette-ink-700` | `--palette-signal-500` |
| Backdrop | `--color-bg-backdrop` | ink at 65 % | black at 70 % |
| Danger rule | `--color-danger-solid` | `--palette-red-600` | `--palette-red-300` |
| Danger icon / fill | `--color-danger-icon` / `--color-danger-bg` | `--palette-red-600` / `--palette-red-50` | `--palette-red-300` / `--palette-red-950` |
| Info icon / fill | `--color-info-icon` / `--color-info-bg` | `--palette-ink-750` / `--palette-paper-warm` | `--palette-signal-500` / `--palette-ink-800` |
| Focus ring | `--color-focus-ring` | `--palette-ink-750` | `--palette-signal-500` |

| Foreground | Background | Minimum | Use |
|---|---|---|---|
| `--color-fg-default` | `--color-bg-surface-raised` | 4.5:1 | Title and body text |
| `--color-fg-muted` | `--color-bg-surface-raised` | 4.5:1 | Description and secondary text |
| `--color-border-strong` | `--color-bg-surface-raised` | 3:1 | Frame, tear line, drawer and menu edge |
| `--color-danger-solid` | `--color-bg-surface-raised` | 3:1 | Danger rule |
| `--color-danger-icon` | `--color-danger-bg` | 3:1 | Danger header icon |
| `--color-info-icon` | `--color-info-bg` | 3:1 | Info header icon |
| `--color-focus-ring` | `--color-bg-surface-raised` | 3:1 | Focus ring inside dialogs |
| `--color-fg-on-danger` | `--color-danger-solid` | 4.5:1 | Danger button label (button CRD) |

Under forced colours the frame and rules use system `CanvasText` through the
border tokens, the backdrop stays (it is a background), and the danger rule
keeps a visible border. Meaning never relies on the red rule alone: the title
and the danger button say what is lost.

## Responsive behaviour

- **SM and up (≥ 576 px)**: centred in the viewport with at least `--space-4`
  of backdrop on each side; never taller than the viewport minus `--space-8`;
  the body scrolls between the fixed header and footer (L2-096).
- **XS (< 576 px)**: every default-variant dialog fills the screen: width 100 %,
  height `100dvh`, no frame and no shadow. The header stays at the top with the
  top safe-area inset added to its padding, so the close button is always
  reachable without scrolling. Only the body scrolls. The footer is sticky at
  the bottom on the paper colour, with the bottom safe-area inset, and its
  buttons stretch to fill the width: side by side when both labels fit on one
  row ("Not now" / "Pay $162.50"), otherwise one per row at full width with the
  way back above the primary ("Keep booking" / "Cancel and lose $162.50" at
  360 px), so the primary sits nearest the thumb (L2-099, D-15).
- **Short viewports (height < 30 rem, at XS)**: a phone in landscape or a page
  zoomed to 400 % leaves too little height for a fixed header, so the header,
  body and footer scroll together as one column and the footer is no longer
  sticky. The dialog opens scrolled to the top, so the close button is still
  reachable without scrolling (L2-099, D-16).
- The drawer keeps `--layout-drawer-width` (or the full width when the screen
  is narrower) and full height at every width; the menu stays anchored under
  the top bar's right edge at every width.
- At 320 px the longest titles ("Reject Tobi Adeyemi's application?", "Cancel
  the worship night with Abigail?") wrap inside the heading block beside the
  icon and close; nothing scrolls sideways. At 200 % and 400 % zoom the viewport
  falls below 576 CSS px, so the dialog takes the full-screen layout and
  reflows.
- Footer buttons are 44 px tall; the close button is 36 px and 44 px under a
  coarse pointer (L2-096).

## Accessibility

### Role and pattern

[APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
built on the CDK Dialog: the container has `role="dialog"` and
`aria-modal="true"`, is labelled by the title and described by the consequence
line. The CDK hides the rest of the page from assistive technology with
`aria-hidden="true"` on the overlay container's siblings, and the backdrop
blocks pointer input. Every variant uses `role="dialog"`, destructive ones
included (D-6). The title is an `<h2>`, so the page keeps its single `<h1>`.
The account menu's list follows the [menu](menu.md) CRD inside the dialog.

### Keyboard

| Key | Action |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves through the dialog's controls only, wrapping from the last to the first; the page behind cannot be reached. |
| <kbd>Esc</kbd> | Dismisses the dialog (`dismissed` "escape"), the same as the way back or Close. Ignored while `busy`. |
| <kbd>Enter</kbd> | Activates the focused button; in a form dialog, submits from a single-line field. |
| <kbd>Space</kbd> | Activates the focused button. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd> | In the account menu and the drawer list: moves between items (menu CRD). |

### Focus

On open the CDK focuses the element the consumer marks `cdkFocusInitial`, or
the first tabbable element (the close button) when none is marked:

| Dialog | Initial focus |
|---|---|
| Has fields (forms, payments, typed confirmations) | The first field |
| Confirm with no fields (accept, reinstate, turn on the calendar feed, conflict, limit) | The primary action |
| Destructive with no fields (withdraw, cancel, cancel confirm, refund confirm, block-dates warning, new calendar link) | The safe way back ("Keep request", "Keep booking", "Go back") |
| Long text (`bodyLabel`) | The body |
| Drawer, photo viewer | The close button |
| Account menu | The first menu item |

After a state change the consumer moves focus: invalid → the error summary;
failed → "Try again", except destructive dialogs (the way back, so a second
Enter cannot repeat the loss) and a declined card (the decline alert, primary
"Pay with another card"); a new step → its marked element. On close, focus
returns to the trigger; when the action removed the trigger, the consumer
passes `restoreFocus` with the page's `<h1>` or list. Busy never moves focus.
Focus rings inside the dialog are never clipped by the frame's `overflow:
hidden`, because the body pads every control by at least `--space-5`, and
never hidden under the fixed header, because the body is the scroll container.

### Labelling

- Name: the title ("Withdraw your request to Abigail?"); the visually hidden
  title in the menu variant ("Account menu for Naomi Fraser").
- Description: the consequence line, or the `.menu__who` block in the account
  menu.
- Close: `closeLabel`, "Close" by default in the catalogue.
- The header icon is `aria-hidden`; the title says the same in words.
- A busy dialog has `aria-busy="true"`; its primary carries the button's
  `aria-busy` and `aria-disabled` with the "Verb…" label (L2-108).

### Announcements

Opening announces the name, the role and the description. The dialog itself
has no live region: failures announce through the projected alert's
`role="alert"`, invalid submissions through the error summary's `role="alert"`,
and upload progress through its `role="status"`.

### Motion

The rise, slide and scale use `--duration-slow`. Under
`prefers-reduced-motion: reduce` the duration token drops to near zero and the
dialog simply appears. The backdrop never animates, and nothing animates on
close.

## Content and internationalisation

- Title: a direct question with the object ("Withdraw your request to
  Abigail?", "Suspend Marcus Bell Trio?"), the outcome for payments ("Pay the
  $162.50 deposit"), or a task name for forms ("Add a song", "Mark dates
  unavailable"). The title names the decision; it is never "Are you sure?".
- Kicker: booking or record code, status and short date, joined by " · ":
  "ZAM-0114 · Accepted · Sat 14 Nov", "A-0219 · Submitted · Fri 9 Oct",
  "Photos · 4 of 12".
- Description and body: the consequence in dollars and dates, one or two
  sentences: "Due by Sun 11 Oct, 2:40 p.m. Paying confirms Sat 14 Nov with
  Abigail." Money, dates and times are formatted by the API library before
  they reach the dialog (L2-110).
- Buttons answer the title with verbs: "Keep booking" / "Cancel booking",
  "Not now" / "Pay $162.50". Never "OK", "Yes", "No" or "Confirm" alone
  ("Yes, cancel the booking" names the action).
- Failures follow the error formula: what happened, that the input is safe,
  what to do ("We couldn't send it just now. Your choice is still here; try
  again in a moment.").
- Translatable inputs: `heading`, `kicker` pattern, `description`,
  `closeLabel`, `bodyLabel`, and every projected string. Data values: names,
  codes, dates, money. The component has no copy of its own (L2-111). French
  runs about 30 % longer; titles and footer labels wrap, never clip.

## Performance

- Change detection: `OnPush`, signal inputs, the host classes from one
  `computed`. The only subscriptions are the injected `DialogRef`'s
  `keydownEvents` and `backdropClick`, taken with `takeUntilDestroyed`.
- Perf-test scenarios:
  - `Dialog.ts` (exists) renders the drawer frame: "Menu", "Close menu" and the
    description "Saved artists and your account stay in the top bar.", without
    the CDK overlay. Keep it.
  - Add `DialogConfirm.ts`: the default variant as `dialogs/withdraw-request/default`
    renders it: info icon, kicker "ZAM-0114 · Requested · Sat 14 Nov", title
    "Withdraw your request to Abigail?", description, a two-row definition
    list and the footer "Keep request" / "Withdraw request".
  - Add `DialogDanger.ts`: `dialogs/cancel-booking/late` with `danger`, the
    warning icon, the receipt and "Cancel and lose $162.50".
  - Export both from `scenarios/index.ts` and tune their iterations in
    `e2e/perf-test/config/scenario-iterations.mjs` to roughly 100–300 ms.
- Composite scenarios: `DarkTheme` wraps the confirm dialog once its scenario
  exists.
- Layout stability: the dialog is in the top layer, so it causes no layout
  shift on the page. Swapping a state (busy, failed, step) keeps the header and
  footer in place; only the body changes height (L2-086).
- Lazy loading: each product dialog component is loaded with a dynamic
  `import()` when its trigger is first activated, as the shell does for the
  menu, so dialogs stay out of the initial bundle.
- Imports: `@angular/cdk/dialog` (`DialogRef`, `Dialog`), `@angular/cdk/overlay`
  position strategies, `zm-icon`. Nothing else; buttons, alerts and fields
  arrive through slots.

## Acceptance criteria

### Rendering

- **AC-1** Given the withdraw dialog (`heading` "Withdraw your request to Abigail?", `kicker` "ZAM-0114 · Requested · Sat 14 Nov", `description` "Nothing has been charged and nothing will be.", `icon` "info"), when it renders, then the host has `.dialog`, the header holds `.dialog__icon.dialog__icon--info` with `aria-hidden="true"`, `.dialog__kicker`, an `<h2 class="dialog__title" id="withdraw-title">`, the description paragraph and a `.close` button named "Close", followed by `.dialog__body` and `.dialog__footer`. (L2-100)
- **AC-2** Given the withdraw dialog opened with `openDialog()`, when a screen reader reads it, then it is announced as "Withdraw your request to Abigail?, dialog" followed by "Nothing has been charged and nothing will be.", the container has `aria-modal="true"`, and the page still has exactly one `<h1>`. (L2-102)
- **AC-3** Given `danger` with `iconTone="danger"` on "Cancel the worship night with Abigail?", when it renders, then the host has `.dialog--danger`, the header has a top rule of `--border-width-poster` in `--color-danger-solid`, and the icon block has `.dialog__icon--danger`. (L2-100)
- **AC-4** Given a dialog with no `[slot=footer]` content (the navigation drawer), when it renders, then `.dialog__footer` takes no space and the body runs to the bottom of the frame. (L2-099)
- **AC-5** Given `size` "sm", "md" and "lg" at a 1280 px viewport, when each renders, then the frame is 384 px, 512 px and 704 px wide; at a 600 px viewport the large dialog is 568 px wide, the viewport minus 32 px. (L2-096)
- **AC-6** Given `variant="menu"` with heading "Account menu for Naomi Fraser", when it opens from the avatar, then the frame has `.dialog--menu`, sits under the top bar's right edge, the title is visually hidden but names the dialog, there is no close button, no tear line and no dim backdrop, and focus is on "Your bookings". (L2-101)

### Opening, Escape and focus

- **AC-7** Given the withdraw dialog is open, when Tab is pressed repeatedly, then focus cycles through "Close", "Keep request" and "Withdraw request" only, and nothing on the page behind receives focus. (L2-101)
- **AC-8** Given the withdraw dialog opened from the "Withdraw request" button on `pages/booking-detail/default`, when Escape is pressed, then `dismissed` emits "escape", the dialog closes, and focus returns to the "Withdraw request" button. (L2-101)
- **AC-9** Given the withdraw dialog, when its close button is activated, then `dismissed` emits "close-button", the dialog closes, and focus returns to the trigger. (L2-101)
- **AC-10** Given the late cancel-booking dialog with `cdkFocusInitial` on "Keep booking", when it opens, then "Keep booking" has focus with its visible focus ring; given the add-song dialog with `cdkFocusInitial` on its first field, "Song title", when it opens, then that field has focus. (L2-101)
- **AC-11** Given the navigation drawer opened from the top bar's menu button at 360 px, when it opens, then focus is on "Close menu", Escape closes it, and focus returns to the menu button. (L2-101)
- **AC-12** Given Naomi cancels ZAM-0114 and the "Cancel booking" trigger is removed from the page, when the dialog closes with `restoreFocus` set to the page's `<h1>`, then focus is on that heading, not on `<body>`. (L2-101)
- **AC-13** Given the cancel-booking dialog's default step, when "Cancel booking" moves it to the confirm step, then the same dialog shows "Last step: cancel ZAM-0114?" with the danger icon, no second dialog or backdrop is added, the dialog's name is the new title, and focus is on "Go back". (L2-101)

### States

- **AC-14** Given the pay-deposit dialog, when `busy` becomes true while "Paying $162.50…" is sent, then the frame has `aria-busy="true"`, the body is at 60 % opacity and ignores clicks, the close button is disabled, and focus stays on the busy primary. (L2-108)
- **AC-15** Given the pay-deposit dialog is `busy`, when Escape is pressed or the backdrop is clicked, then the dialog stays open, `dismissed` does not emit, and no second charge request is sent. (L2-108)
- **AC-16** Given the busy pay-deposit dialog, when the request fails and `busy` returns to false, then the dialog stays open, every value entered except the processor's card fields is kept, Escape and Close work again, and the projected "Your bank declined the card" alert can take focus. (L2-108)
- **AC-17** Given the add-photo dialog uploading "easter-sunrise-lakeshore.jpg" (primary busy "Uploading…", frame not busy), when Escape is pressed, then `dismissed` emits "escape" so the consumer can abort, and "Cancel upload" and Close are enabled throughout. (L2-101)
- **AC-18** Given the report-review dialog with `dirty` true (a reason chosen), when the backdrop is clicked, then the dialog stays open with the choice kept; when `dirty` is false, then a backdrop click dismisses it with "backdrop". (L2-108)
- **AC-19** Given the write-review dialog in its invalid state with an error summary at the top of a body that has been scrolled down, when the consumer focuses the summary, then the summary is scrolled into view below the fixed header and its focus ring is fully visible. (L2-101)

### Responsive

- **AC-20** Given a 360 × 640 viewport, when the pay-deposit dialog opens, then it fills the viewport with no frame or shadow, the header with "Pay the $162.50 deposit" and "Close" is at the top, and the close button stays visible while the body is scrolled to its end. (L2-099)
- **AC-21** Given a 360 px viewport, when the withdraw dialog renders, then the footer is pinned to the bottom of the screen and "Keep request" and "Withdraw request" fill its width; given the late cancel-booking dialog, whose two labels do not fit on one row, then each button takes a full row with "Keep booking" above "Cancel and lose $162.50". (L2-099)
- **AC-22** Given a 320 px viewport and the reject-application dialog titled "Reject Tobi Adeyemi's application?" with the danger icon, when it renders, then the title wraps inside the heading block, nothing is clipped, and the page does not scroll horizontally. (L2-096)
- **AC-23** Given a 1280 px viewport zoomed to 400 %, when the withdraw dialog opens, then it takes the full-screen layout, the header, body and footer scroll together because the viewport is shorter than 30 rem, the close button is visible when it opens, and every control remains reachable without horizontal scrolling. (L2-096)
- **AC-24** Given a coarse pointer, when the dialog's close button is measured, then its target is at least 44 × 44 CSS px. (L2-096)

### Theming

- **AC-25** Given the dark theme, when the late cancel-booking dialog renders, then the paper is `--color-bg-surface-raised` charcoal, the frame and tear line are `--color-border-strong`, the print shadow is yellow (`--color-shadow`), and the danger rule is the lighter `--color-danger-solid` red. (L2-104)
- **AC-26** Given both themes, when contrast is measured, then title and body text are at least 4.5:1 on the paper, the description at least 4.5:1, and the frame, danger rule, header icons and focus ring at least 3:1 against their backgrounds. (L2-103)

### Screen readers

- **AC-27** Given every variant and state in the HTML rendering and every dialog mock open in both themes, when axe-core runs, then there are zero serious or critical violations. (L2-100)

### Motion

- **AC-28** Given `prefers-reduced-motion: reduce`, when a dialog, the drawer or the account menu opens, then it appears in place with no rise, slide or scale transition. (L2-103)

### Content

- **AC-29** Given the French catalogue, when "Withdraw your request to Abigail?" and the footer labels are replaced by strings about 30 % longer, then the title and the buttons wrap within the frame and nothing clips; the component renders no string that did not come through an input or a slot. (L2-111)

### Performance

- **AC-30** Given the `Dialog`, `DialogConfirm` and `DialogDanger` scenarios, when the perf test runs against the base branch with `--fail-on-regression`, then none is flagged as a possible regression and each renders in its tuned window. (L2-086)

## Implementation notes

The library has `zm-dialog` with `heading`, `titleId`, `closeLabel`, `variant`
(`'default' | 'drawer'`) and a `closed` output; the shell opens the drawer with
its own CDK config in `dialogs/menu/menu.ts`. To meet this CRD:

- Add `kicker`, `description`, `descriptionId`, `icon`, `iconTone`, `danger`,
  `size`, `busy`, `dirty` and `bodyLabel`, and the `menu` variant. Make
  `closeLabel` optional for the menu variant with the dev-mode check.
- Render the heading block as an unclassed `<div>` with `flex: 1; min-width: 0`
  so the close button stays at the right and long titles wrap (AC-22). Today
  the `<h2>` is a direct child of the header.
- Add the `[slot=footer]` wrapper `.dialog__footer`, hidden with `:empty`, with
  the XS sticky rule and safe-area padding (the code has no footer at all).
- Add the danger rule, the icon block styles, `.dialog--sm`, `.dialog--lg`,
  `.dialog--menu`, `.dialog[aria-busy="true"] .dialog__body` dimming and
  `--dialog-width` on the host.
- Replace `closed` with `dismissed` (payload `'close-button' | 'escape' |
  'backdrop'`). Inject `DialogRef` optionally; subscribe to `keydownEvents`
  (Escape) and `backdropClick`, honour `busy` and `dirty`, emit, then call
  `dialogRef.close()`. Remove the `(closed)="dialogRef.close()"` wiring from
  `MenuDialog`.
- Disable the close button while `busy`.
- Add `open-dialog.ts` with `openDialog()` and `DialogOpenOptions`, and export
  both from `public-api.ts`. It must set `ariaModal: true` (the CDK default is
  `false`), `disableClose: true`, `maxWidth: '100vw'` and the block scroll
  strategy, which the current menu config does not. Move `openMenuDialog` onto
  it.
- Add `.zm-backdrop--clear { background: transparent; }` beside `.zm-backdrop`
  in `components/src/styles/utilities.scss`, and the `--z-overlay` /
  `--z-modal` stacking for `.cdk-overlay-container` in the same file.
- Fix the XS full-screen rule so the drawer and the menu variants are exempt
  (today `:host` at XS forces `100vw` × `100dvh` on the drawer too, which
  matches by accident, and would break the menu).
- Add the short-viewport rule (D-16): `@media (max-width: 35.99rem) and (max-height: 29.99rem)` makes the host the scroll container (`overflow-y: auto`), the body `overflow: visible` and the footer `position: static`. Make the XS footer's stretched buttons stack with the way back first (D-15); the design system's `.dialog__footer > .btn { flex: 1 1 auto }` already wraps them.
- Add `overflow-wrap: anywhere` to `.dialog__title` (D-9) and
  `overscroll-behavior: contain` to the body.
- Add the `DialogConfirm` and `DialogDanger` perf-test scenarios.
- The header icons this CRD names (`info`, `warning`, `check`, `phone`,
  `church`, `image`, `music`, `film`, `block`, `feed`, `x-circle`, `calendar`,
  `trash`, `eye-off`, `wallet`, `card`, `undo`, `reply`, `flag`, `shield`,
  `lock`, `key`, `shield-check`, `repeat`, `star`) and the footer icons
  (`arrow-left`, `arrow-right`, `refresh`) come from the [icon](icon.md) set.

## Decisions

- **D-1** *Native `<dialog>` with `showModal()`, as the design system's code shows, or the CDK Dialog?* The CDK Dialog. AGENTS.md requires the CDK for modal behaviour and forbids hand-rolled modals, and the built drawer already uses it. The CDK gives the same contract the design system asks of `showModal()`: focus trap, Escape, focus return and a page hidden from assistive technology. The `.dialog` classes stay identical, so the mocks and the visual tests still match.
- **D-2** *Is the navigation drawer this component?* Yes, `variant="drawer"`, as built. The design system defines it as `.dialog--drawer`, a modal dialog with a trapped focus, a title and a close button.
- **D-3** *Is the account menu a dialog or the menu component?* Both: `zm-dialog variant="menu"` is the anchored modal panel and [`zm-menu`](menu.md) renders the list and its arrow-key behaviour inside it. The design system defines `.dialog--menu` as a modal dialog with a hidden title (`dialogs/account-menu`), while the pattern page asks for APG Menu Button keyboard behaviour on the list; splitting panel and list keeps each behaviour in one component.
- **D-4** *How does a form cover header, body and footer when `zm-dialog` renders the header?* The consumer's `<form class="dialog__form">` wraps `zm-dialog`. Angular forms need the consumer to own the `<form>` element, and `.dialog__form` is `display: contents`, so the frame lays out the same as the mocks' `.dialog > form` order. The footer's submit button is then inside the form.
- **D-5** *While busy, do Close and the way back stay enabled?* No. Close, the way back, Escape and the backdrop are all held until the request settles, as the dialog design-system page and every busy mock with a server request show. The patterns page says "Close and Not now still work until the charge starts"; the busy state begins when the request is sent, so the two agree. Uploads are the exception the design system names: they are not `busy`, keep "Cancel upload" and Close enabled, and abort on `dismissed`. The mocks that leave Close enabled beside a disabled way back (`add-church`, `block-dates`, `weekly-default`, `calendar-feed`, `delete-account`, `two-step-code` busy) are drift; they follow this rule.
- **D-6** *`role="alertdialog"` for destructive confirmations, as the patterns page says, or `role="dialog"`, as the dialog page and every mock use?* `role="dialog"` everywhere. The component page and all 125 mock renderings use `dialog`; the description is already announced on open through `aria-describedby`, which is what an alert dialog adds; and a step that turns a form into a destructive confirmation (`issue-refund`) cannot change the container's role after opening. The patterns page should drop the alertdialog line. **Sources conflict: confirm with the user.**
- **D-7** *Close the dialog on a backdrop click?* Yes, unless it is `busy` or `dirty`. The design system says a backdrop tap does not close a dialog that is busy or holds unsent input, and is otherwise silent; the CDK default closes on the backdrop.
- **D-8** *Which element gets focus on open: the `autofocus` attribute, as in the mocks, or CDK markers?* `cdkFocusInitial`, which the CDK focus trap reads (it does not read `autofocus`), placed on the element the Focus table names. The CDK moves focus to the first tabbable descendant when the marker is on a `zm-button` host.
- **D-9** *What if one word of the title is wider than the heading block at 320 px?* It breaks inside the word (`overflow-wrap: anywhere`). At 320 px the block beside a 40 px icon and a 36 px close is about 164 px wide, and uppercase `--text-h3` words such as "APPLICATION?" come close to it. Shrinking the type would break the scale and truncating is forbidden (L2-096), as decided for the ticket name.
- **D-10** *Exit animation?* None. The design system specifies only the enter motion and says the backdrop never animates; closing at once also returns focus without a delay.
- **D-11** *Does the dialog close on browser Back?* Yes (`closeOnNavigation`), the CDK default. A request already sent completes on the server and its idempotency key prevents a duplicate if it is retried (L2-108).
- **D-12** *Does the page behind get the `inert` attribute?* No. The CDK hides it from assistive technology with `aria-hidden`, the focus trap keeps keyboard focus inside, and the backdrop blocks the pointer and hover (so tickets behind do not lift). Adding `inert` as well would fight the CDK's own restoration of the page.
- **D-13** *Is the header icon free, or limited to info and warning?* Free: `icon` takes any name from the icon set, with `iconTone` choosing the info or danger tint. The mocks use 25 different header glyphs (a card for payments, a trash can for deleting the account), and limiting the input would change its type when the next dialog arrives.
- **D-14** *The design-system specimens use a ghost icon-only `.btn` for Close, the product mocks use `.close`. Which?* `.close`, as built and as in every mock; the design system's own "product dialogs" section names it the generic close button.
- **D-15** *At XS, do footer buttons always share one row?* No. They stretch to fill the width and share a row when both labels fit; otherwise each takes a full row, the way back above the primary. The 360 px rendering shows "Keep booking" and "Cancel and lose $162.50" cannot share 312 px without clipping, and labels never truncate (button CRD). Source order (way back first) is kept, so focus order and reading order stay the same as on wider screens.
- **D-16** *What if the viewport is too short for a fixed header?* Below 30 rem of height at XS (landscape phones, 400 % zoom on a laptop), the whole dialog scrolls as one column. The renderings show the late-cancellation header alone takes about 270 px at 360 px wide, so a fixed header would leave a 400 % zoomed viewport (about 180 CSS px tall) no body at all. The close button is at the top when the dialog opens, which keeps L2-099's "reachable without scrolling".
