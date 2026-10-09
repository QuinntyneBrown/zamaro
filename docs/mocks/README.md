# Zamaro mocks

The mocks treat booking worship like booking a band for worship night. They are
a screen-printed gig poster: charcoal ink on warm newsprint, one butter-yellow
accent, condensed grotesque headlines, the event date set huge like a tour
poster, artists as admission tickets with a perforated price stub, and the
songs an artist leads as a numbered setlist. The dark theme is the stage: a
deep charcoal canvas, paper text, yellow hard shadows.

Contrast is deliberately softened from pure black on white, and every pair
still clears WCAG 2.2 AA: body text sits around 11:1, muted text around 6:1,
subtle text at or above 4.9:1 on the warmest surface, and control borders at
9:1 or better. Copy is kept to one or two short sentences per block, and the
spacing scale leaves generous room between sections.

| Token decision | Value |
|---|---|
| Ink / paper | Charcoal `#34322e` on newsprint `#f4f2ec`; dark canvas `#1b1b19`, dark text `#e9e6de` |
| Muted / subtle | `#5a5853` (6:1) and `#67655f` (4.9:1 on the warmest surface) on light; `#b5b2aa` and `#a19e97` on dark |
| Accent | Butter yellow `#f3cc3f`, a fill colour only on light (text on it is always ink, 8:1); text-safe on dark (10:1) |
| Type | Condensed display (Bebas Neue / Anton / Oswald / Impact fallback), uppercase; Helvetica/Arial body at 1.6 leading; mono for stub small print |
| Shape | Square corners, 2–4 px rules in charcoal (not ink), hard offset shadows instead of blur |
| Focus | Yellow inner ring + ink outer ring (light); ink inner + yellow outer (dark) |

The tokens and components now live in the design system. `assets/tokens.css` and
`assets/ui.css` only forward to [`docs/design-system/tokens/tokens.css`](../design-system/tokens/tokens.css)
and [`docs/design-system/assets/components.css`](../design-system/assets/components.css), so the mocks and the
system cannot drift apart. See the [design system](../design-system/README.md) for every token and component.

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON. 3 saved artists.
Default search: Saturday 14 November 2026 · Burlington, ON · Sunday service · within 120 km.
Artists: Abigail Mensah (headliner, Brampton, from $650, 4.9/38), Hosanna Collective, Elijah Park,
Grace Tabernacle Mass Choir, Luz Viva, Daniel & Ruth Okonkwo, Marcus Bell Trio.
Empty profile: Miriam Haile, new to Zamaro (no videos or reviews yet).

Signed-in artist (artist side): Abigail Mensah (AM), New Covenant Chapel, Brampton, from $650, drives 120 km.
Artist-side empty states switch to Miriam Haile (MH), approved Mon 5 Oct 2026, from $300, nothing blocked, no requests yet.
Applicant (apply flow): Tobi Adeyemi, Scarborough, solo vocalist and keys, leads at Cornerstone Baptist, from $400, 80 km.
Churches: Riverside Community Church, Burlington (Naomi Fraser); St. Brendan's Anglican, Oshawa (Rev. Janet Clarke);
Harvest Point Church, Milton (Tomi Oduya); Living Waters Fellowship, Brampton (Pastor Femi Adebayo);
Lakeshore Alliance Church, Oakville (Pastor Dave Mwangi); Kingdom Life Centre, Mississauga (Grace Ampofo);
Trinity Lutheran, Kitchener (declined for distance, 130 km).
Money on a $650 booking: deposit 25% $162.50, balance $487.50, Zamaro 8% $52, artist receives $598.
Naomi's bookings: ZAM-0114 Abigail Sat 14 Nov worship night 7 pm, Sent today (every booking-detail state reuses this id);
ZAM-0097 Marcus Bell Trio Sun 25 Oct, Paid (deposit $237.50, balance $712.50); ZAM-0088 Luz Viva Sat 5 Dec, Accepted,
deposit $225 due Fri 16 Oct; ZAM-0075 Grace Tabernacle Sun 20 Sep, Declined; ZAM-0080 Elijah Park Sat 3 Oct, Cancelled free;
ZAM-0061 Abigail Sun 14 Jun, Done (matches Naomi's June review).
Abigail's incoming requests: Riverside Sat 14 Nov $650 Sent today, reply by Mon 12 Oct (72 h); St. Brendan's Sun 22 Nov $650;
Harvest Point Sat 5 Dec Christmas concert $800; Trinity Lutheran Sun 29 Nov, declined; St. Brendan's Sun 13 Sep, done.
Abigail's confirmed dates: Sun 18 Oct Living Waters; Sun 15 Nov Lakeshore Alliance; Sat 21 Nov Kingdom Life women's
conference; Sun 13 Dec Living Waters carol service.
Abigail's calendar Nov-Dec 2026: booked 1, 15, 21 Nov, 13, 20 Dec; requested 14, 22 Nov, 5 Dec; blocked 26-27 Nov (studio),
24-26 Dec (family), 31 Dec. Default view November 2026.
Dashboard numbers: Awaiting reply 3 / Confirmed dates 4 / Free Saturdays in Nov 2 / Profile complete 100%. No payouts in MVP.
Entry: naomi.fraser@riversidecc.ca; reset links expire after 1 hour; verification e-mail can be resent.
All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, Riverside Community Church, Burlington
- **Featured artist:** Abigail Mensah. The empty profile shows Miriam Haile, who is new.
- **Signed-in artist:** Abigail Mensah. Artist-side empty states switch to Miriam Haile.
- **Applicant:** Tobi Adeyemi, Scarborough, applying through the artist form.
- **Current booking:** ZAM-0114, Abigail for Riverside's worship night, Sat 14 Nov, 7 pm.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- The display face falls back to Impact when Bebas Neue/Anton/Oswald are not installed; the product would self-host one.
- Every ticket links to Abigail’s profile, since there is only one full profile mock.
- Deposit (25%), artist fee (8%) and 14-day free cancellation are assumed.
- Requests expire after 72 hours without a reply; a reply-by time is shown to the artist.
- No payout, admin review or messaging screens are in the MVP. Artist applications say "we review within 3 business days"; the only message is the one inside a request and the accept/decline note.
- Church accounts that open an artist route see a forbidden state with a way back, not a redirect.
- Sign-in is required before a request is sent; the book page assumes Naomi is signed in.

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | invalid | duplicate | submitting | success | no-results | past | accepted | confirmed | declined | completed | withdrawn | cancelled | expired | forbidden | artist | step-2 | step-3 | step-4 | selected | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Discover artists (`discover`) | [✅](pages/discover/default.html) | [✅](pages/discover/loading.html) | [✅](pages/discover/empty.html) | [✅](pages/discover/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-004`, `L2-005`, `L2-006`, `L2-007`, `L2-008`, `L2-009`, `L2-010`, `L2-011`, `L2-097`, `L2-105`, `L2-106` |
| Artist profile (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-012`, `L2-013`, `L2-014`, `L2-015`, `L2-016`, `L2-017`, `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-098`, `L2-105`, `L2-107` |
| Request to book (`book`) | [✅](pages/book/default.html) | [✅](pages/book/loading.html) | ➖ | [✅](pages/book/error.html) | [✅](pages/book/invalid.html) | [✅](pages/book/duplicate.html) | [✅](pages/book/submitting.html) | [✅](pages/book/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-019`, `L2-024`, `L2-028`, `L2-032`, `L2-044`, `L2-105`, `L2-108`, `L2-110` |
| Your bookings (`bookings`) | [✅](pages/bookings/default.html) | [✅](pages/bookings/loading.html) | [✅](pages/bookings/empty.html) | [✅](pages/bookings/error.html) |  |  |  |  | [✅](pages/bookings/no-results.html) | [✅](pages/bookings/past.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-033`, `L2-105`, `L2-110` |
| Booking (`booking-detail`) | [✅](pages/booking-detail/default.html) | [✅](pages/booking-detail/loading.html) | ➖ | [✅](pages/booking-detail/error.html) |  |  |  |  |  |  | [✅](pages/booking-detail/accepted.html) | [✅](pages/booking-detail/confirmed.html) | [✅](pages/booking-detail/declined.html) | [✅](pages/booking-detail/completed.html) | [✅](pages/booking-detail/withdrawn.html) | [✅](pages/booking-detail/cancelled.html) | [✅](pages/booking-detail/expired.html) | [✅](pages/booking-detail/forbidden.html) |  |  |  |  |  | `L2-029`, `L2-030`, `L2-031`, `L2-032`, `L2-033`, `L2-036`, `L2-037`, `L2-040`, `L2-042`, `L2-044`, `L2-045`, `L2-046`, `L2-059`, `L2-105`, `L2-108`, `L2-110` |
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) | [✅](pages/sign-in/invalid.html) |  | [✅](pages/sign-in/submitting.html) |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/expired.html) |  |  |  |  |  |  | `L2-023`, `L2-072`, `L2-073`, `L2-108` |
| Sign up (`sign-up`) | [✅](pages/sign-up/default.html) | ➖ | ➖ | [✅](pages/sign-up/error.html) | [✅](pages/sign-up/invalid.html) |  | [✅](pages/sign-up/submitting.html) | [✅](pages/sign-up/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-022`, `L2-072`, `L2-077`, `L2-080`, `L2-108` |
| Forgot password (`forgot-password`) | [✅](pages/forgot-password/default.html) | ➖ | ➖ | [✅](pages/forgot-password/error.html) | [✅](pages/forgot-password/invalid.html) |  | [✅](pages/forgot-password/submitting.html) | [✅](pages/forgot-password/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-023`, `L2-077`, `L2-108` |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | [✅](pages/reset-password/loading.html) | ➖ | [✅](pages/reset-password/error.html) | [✅](pages/reset-password/invalid.html) |  | [✅](pages/reset-password/submitting.html) | [✅](pages/reset-password/success.html) |  |  |  |  |  |  |  |  | [✅](pages/reset-password/expired.html) |  |  |  |  |  |  | `L2-023`, `L2-072`, `L2-105`, `L2-108` |
| Not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/not-found/artist.html) |  |  |  |  | `L2-021` |
| Server error (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-093` |
| Offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-026`, `L2-027` |
| Apply as an artist (`apply`) | [✅](pages/apply/default.html) | ➖ | ➖ | [✅](pages/apply/error.html) | [✅](pages/apply/invalid.html) |  | [✅](pages/apply/submitting.html) | [✅](pages/apply/success.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/apply/step-2.html) | [✅](pages/apply/step-3.html) | [✅](pages/apply/step-4.html) |  | `L2-039`, `L2-047`, `L2-052`, `L2-077`, `L2-108` |
| Saved artists (`saved`) | [✅](pages/saved/default.html) | [✅](pages/saved/loading.html) | [✅](pages/saved/empty.html) | [✅](pages/saved/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-026`, `L2-027`, `L2-105` |
| Account settings (`account`) | [✅](pages/account/default.html) | [✅](pages/account/loading.html) | ➖ | [✅](pages/account/error.html) | [✅](pages/account/invalid.html) |  | [✅](pages/account/submitting.html) | [✅](pages/account/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-024`, `L2-025`, `L2-065`, `L2-072`, `L2-080`, `L2-081`, `L2-082`, `L2-105`, `L2-108` |
| Edit profile (`edit-profile`) | [✅](pages/edit-profile/default.html) | [✅](pages/edit-profile/loading.html) | [✅](pages/edit-profile/empty.html) | [✅](pages/edit-profile/error.html) | [✅](pages/edit-profile/invalid.html) |  | [✅](pages/edit-profile/submitting.html) | [✅](pages/edit-profile/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-049`, `L2-050`, `L2-051`, `L2-052`, `L2-053`, `L2-054`, `L2-055`, `L2-105`, `L2-108` |
| Dashboard (`dashboard`) | [✅](pages/dashboard/default.html) | [✅](pages/dashboard/loading.html) | [✅](pages/dashboard/empty.html) | [✅](pages/dashboard/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/dashboard/forbidden.html) |  |  |  |  |  | `L2-034`, `L2-039`, `L2-056`, `L2-074`, `L2-096`, `L2-105` |
| Availability (`availability`) | [✅](pages/availability/default.html) | [✅](pages/availability/loading.html) | [✅](pages/availability/empty.html) | [✅](pages/availability/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/availability/selected.html) | `L2-056`, `L2-057`, `L2-058`, `L2-105` |
| Requests (`requests`) | [✅](pages/requests/default.html) | [✅](pages/requests/loading.html) | [✅](pages/requests/empty.html) | [✅](pages/requests/error.html) |  |  |  |  | [✅](pages/requests/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-030`, `L2-034`, `L2-105` |
| Request (`request-detail`) | [✅](pages/request-detail/default.html) | [✅](pages/request-detail/loading.html) | ➖ | [✅](pages/request-detail/error.html) |  |  |  |  |  |  | [✅](pages/request-detail/accepted.html) | [✅](pages/request-detail/confirmed.html) | [✅](pages/request-detail/declined.html) | [✅](pages/request-detail/completed.html) |  |  | [✅](pages/request-detail/expired.html) |  |  |  |  |  |  | `L2-029`, `L2-030`, `L2-034`, `L2-037`, `L2-039`, `L2-043`, `L2-045`, `L2-046`, `L2-105` |
| Earnings (`earnings`) | [✅](pages/earnings/default.html) | [✅](pages/earnings/loading.html) | [✅](pages/earnings/empty.html) | [✅](pages/earnings/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-039`, `L2-105`, `L2-110` |

### Dialogs

| Screen | default | busy | invalid | failed | confirm | late | blocked | artist | limit | warning | conflict | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Withdraw request (`withdraw-request`) | [✅](dialogs/withdraw-request/default.html) | [✅](dialogs/withdraw-request/busy.html) | ➖ | [✅](dialogs/withdraw-request/failed.html) |  |  |  |  |  |  |  | `L2-031`, `L2-099`, `L2-101`, `L2-108` |
| Cancel booking (`cancel-booking`) | [✅](dialogs/cancel-booking/default.html) | [✅](dialogs/cancel-booking/busy.html) | ➖ | [✅](dialogs/cancel-booking/failed.html) | [✅](dialogs/cancel-booking/confirm.html) | [✅](dialogs/cancel-booking/late.html) |  |  |  |  |  | `L2-042`, `L2-044`, `L2-099`, `L2-101`, `L2-108` |
| Pay deposit (`pay-deposit`) | [✅](dialogs/pay-deposit/default.html) | [✅](dialogs/pay-deposit/busy.html) | [✅](dialogs/pay-deposit/invalid.html) | [✅](dialogs/pay-deposit/failed.html) |  |  |  |  |  |  |  | `L2-035`, `L2-036`, `L2-037`, `L2-044`, `L2-099`, `L2-101`, `L2-108` |
| Write a review (`write-review`) | [✅](dialogs/write-review/default.html) | [✅](dialogs/write-review/busy.html) | [✅](dialogs/write-review/invalid.html) | [✅](dialogs/write-review/failed.html) |  |  |  |  |  |  |  | `L2-059`, `L2-099`, `L2-101`, `L2-108` |
| Delete account (`delete-account`) | [✅](dialogs/delete-account/default.html) | [✅](dialogs/delete-account/busy.html) | [✅](dialogs/delete-account/invalid.html) | [✅](dialogs/delete-account/failed.html) |  |  | [✅](dialogs/delete-account/blocked.html) |  |  |  |  | `L2-082`, `L2-099`, `L2-101`, `L2-108` |
| Account menu (`account-menu`) | [✅](dialogs/account-menu/default.html) | ➖ | ➖ |  |  |  |  | [✅](dialogs/account-menu/artist.html) |  |  |  | `L2-023`, `L2-024`, `L2-099`, `L2-101` |
| Menu (`menu`) | [✅](dialogs/menu/default.html) | ➖ | ➖ |  |  |  |  | [✅](dialogs/menu/artist.html) |  |  |  | `L2-099`, `L2-101` |
| Add video (`add-video`) | [✅](dialogs/add-video/default.html) | [✅](dialogs/add-video/busy.html) | [✅](dialogs/add-video/invalid.html) | [✅](dialogs/add-video/failed.html) |  |  |  |  | [✅](dialogs/add-video/limit.html) |  |  | `L2-052`, `L2-099`, `L2-101`, `L2-108` |
| Mark dates unavailable (`block-dates`) | [✅](dialogs/block-dates/default.html) | [✅](dialogs/block-dates/busy.html) | [✅](dialogs/block-dates/invalid.html) | [✅](dialogs/block-dates/failed.html) |  |  |  |  |  | [✅](dialogs/block-dates/warning.html) |  | `L2-056`, `L2-057`, `L2-099`, `L2-108` |
| Weekly default (`weekly-default`) | [✅](dialogs/weekly-default/default.html) | [✅](dialogs/weekly-default/busy.html) | ➖ | [✅](dialogs/weekly-default/failed.html) |  |  |  |  |  |  |  | `L2-056`, `L2-099`, `L2-108` |
| Accept request (`accept-request`) | [✅](dialogs/accept-request/default.html) | [✅](dialogs/accept-request/busy.html) | ➖ | [✅](dialogs/accept-request/failed.html) |  |  |  |  |  |  | [✅](dialogs/accept-request/conflict.html) | `L2-030`, `L2-032`, `L2-034`, `L2-099`, `L2-108` |
| Decline request (`decline-request`) | [✅](dialogs/decline-request/default.html) | [✅](dialogs/decline-request/busy.html) | [✅](dialogs/decline-request/invalid.html) | [✅](dialogs/decline-request/failed.html) |  |  |  |  |  |  |  | `L2-030`, `L2-099`, `L2-108` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | persistent | Requirements |
|---|---|---|---|---|---|---|---|---|
| Booking toast (`booking-toast`) | [✅](notifications/booking-toast/info.html) | [✅](notifications/booking-toast/success.html) | [✅](notifications/booking-toast/warning.html) | [✅](notifications/booking-toast/danger.html) | [✅](notifications/booking-toast/with-action.html) | [✅](notifications/booking-toast/stacked.html) |  | `L2-037`, `L2-063`, `L2-109` |
| System banner (`system-banner`) | [✅](notifications/system-banner/info.html) | [✅](notifications/system-banner/success.html) | [✅](notifications/system-banner/warning.html) | [✅](notifications/system-banner/danger.html) |  |  | [✅](notifications/system-banner/persistent.html) | `L2-022`, `L2-026`, `L2-090` |
| Saved toast (`saved-toast`) | [✅](notifications/saved-toast/info.html) | [✅](notifications/saved-toast/success.html) | [✅](notifications/saved-toast/warning.html) | [✅](notifications/saved-toast/danger.html) | [✅](notifications/saved-toast/with-action.html) | ➖ |  | `L2-026`, `L2-109` |
| Availability toast (`availability-toast`) | [✅](notifications/availability-toast/info.html) | [✅](notifications/availability-toast/success.html) | [✅](notifications/availability-toast/warning.html) | [✅](notifications/availability-toast/danger.html) | [✅](notifications/availability-toast/with-action.html) | ➖ |  | `L2-056`, `L2-057`, `L2-109` |
| Request toast (`request-toast`) | [✅](notifications/request-toast/info.html) | [✅](notifications/request-toast/success.html) | [✅](notifications/request-toast/warning.html) | [✅](notifications/request-toast/danger.html) | [✅](notifications/request-toast/with-action.html) | [✅](notifications/request-toast/stacked.html) |  | `L2-030`, `L2-034`, `L2-037`, `L2-109` |

<!-- coverage:end -->

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```
