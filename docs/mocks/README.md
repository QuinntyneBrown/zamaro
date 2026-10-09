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
9:1 or better (at least 7:1 on dark surfaces). Copy is kept to one or two short sentences per block, and the
spacing scale leaves generous room between sections.

| Token decision | Value |
|---|---|
| Ink / paper | Charcoal `#34322e` on newsprint `#f4f2ec`; dark canvas `#1b1b19`, dark text `#e9e6de` |
| Muted / subtle | `#5a5853` (6:1) and `#67655f` (4.9:1 on the warmest surface) on light; `#b5b2aa` and `#a19e97` on dark |
| Accent | Butter yellow `#f3cc3f`, a fill colour only on light (text on it is always ink, 8:1); text-safe on dark (10:1) |
| Type | Condensed display (Bebas Neue / Anton / Oswald / Impact fallback), uppercase; Helvetica/Arial body at 1.6 leading; mono for stub small print |
| Shape | Square corners, 2–4 px rules in charcoal (not ink), hard offset shadows instead of blur |
| Focus | Yellow inner ring + ink outer ring (light); ink inner + yellow outer (dark) |
| Breakpoints | The L2 viewport classes: XS < 576 px, SM 576, MD 768, LG 992, XL 1200 (`--layout-breakpoint-sm/md/lg/xl`: 36, 48, 62, 75rem) |

The tokens and components now live in the design system. `assets/tokens.css` and
`assets/ui.css` only forward to [`docs/design-system/tokens/tokens.css`](../design-system/tokens/tokens.css)
and [`docs/design-system/assets/components.css`](../design-system/assets/components.css), so the mocks and the
system cannot drift apart. See the [design system](../design-system/README.md) for every token and component.

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON. 3 saved artists.
Riverside's church profile: 2150 Lakeshore Road, Burlington ON L7R 1A3, 905-555-0123, non-denominational, about 350 people.
Two-step sign-in is off for Naomi; the mfa-setup page shows her turning it on, and account two-step-on with the two-step-code
dialog shows it after (new recovery codes b6tn-3qzk … y4mf-3xne replace 7kq4-m2xd … j7ve-5pkh).
Default search: Saturday 14 November 2026 · Burlington, ON · Worship night · within 120 km (the kind carries to the
profile stub and the request page, as on ZAM-0114).
Artists: Abigail Mensah (headliner, Brampton, 44 km by road from Riverside, from $650, 4.9/38), Hosanna Collective, Elijah Park,
Grace Tabernacle Mass Choir, Luz Viva, Daniel & Ruth Okonkwo, Marcus Bell Trio.
Ratings (score/churches): Hosanna 4.8/21, Elijah 4.7/9, Grace Tabernacle 4.8/26, Luz Viva 5.0/6, Daniel & Ruth 4.9/14, Marcus Bell 4.6/17.
Abigail headlines as the most-booked artist free that day (L2-006); the tickets follow Closest first by road distance from
Riverside: No. 02 Marcus Bell Trio (Hamilton, 14 km), No. 03 Hosanna (Mississauga, 32 km), No. 04 Luz Viva (North York, 63 km),
No. 05 Elijah (Markham, 74 km), No. 06 Grace Tabernacle (Scarborough, 81 km), No. 07 Daniel & Ruth (Ajax, 97 km).
Naomi's saved artists: Abigail, Hosanna Collective, Luz Viva.
Empty profile: Miriam Haile, new to Zamaro (no videos or reviews yet), Etobicoke, drives up to 40 km; Riverside is 48 km away,
so she is not in Naomi's lineup, and her public profile is opened from a shared link with no search date ("Check dates").
Artist ticket numbers on the profile stub: Abigail ACT-0027, Miriam ACT-0154 (booking numbers use ZAM-).

Signed-in artist (artist side): Abigail Mensah (AM), New Covenant Chapel, Brampton, from $650, drives 120 km.
Artist-side empty states switch to Miriam Haile (MH), approved Mon 5 Oct 2026, from $300, nothing blocked, no requests yet.
Applicant (apply flow): Tobi Adeyemi, Scarborough, solo vocalist and keys, leads at Cornerstone Baptist, from $400, 80 km.
Churches: Riverside Community Church, Burlington (Naomi Fraser); St. Brendan's Anglican, Oshawa (Rev. Janet Clarke);
Harvest Point Church, Milton (Tomi Oduya); Living Waters Fellowship, Brampton (Pastor Femi Adebayo);
Lakeshore Alliance Church, Oakville (Pastor Dave Mwangi); Kingdom Life Centre, Mississauga (Grace Ampofo);
Trinity Lutheran, Kitchener (declined for distance, 130 km).
Money on a $650 booking: deposit 25% $162.50, balance $487.50, Zamaro 8% $52, artist receives $598. No HST line: Abigail has no HST number.
ZAM-0114 timeline: requested Fri 9 Oct 10:15 a.m.; accepted 2:40 p.m.; deposit paid on Visa 4242 and Confirmed 3:05 p.m.; event Sat 14 Nov
7:00 p.m.; Completed Sun 15 Nov 7:00 p.m.; balance charged Mon 16 Nov 7:00 p.m. (problem reports until then); payout $598 by Wed 18 Nov.
Alternative endings: declined Fri 9 Oct 1:40 p.m. ("I'm not free that day" + note); withdrawn or cancelled by Naomi 4:30 p.m.; cancelled by
Abigail 4:30 p.m. (full refund); expired Mon 12 Oct 10:15 a.m.; problem reported Mon 16 Nov 9:20 a.m. (held); balance declined Mon 16 Nov
7:00 p.m., next try Tue 17 Nov. Thread: Naomi 10:15 a.m. (her phone masked for Abigail), Abigail 2:40 p.m. (her email masked for Naomi),
Abigail Sun 15 Nov 9:02 a.m. Contacts once Confirmed: Riverside church phone 905-555-0123, 2150 Lakeshore Rd, Burlington;
Abigail 905-555-0148, abigail@abigailmensah.ca. Routes: /bookings/:number (church), /artist/bookings/:number (artist).
Earnings setup state: Tobi Adeyemi as if approved, payouts not set up yet ($400 booking pays $368).
Statuses (L2-029): Requested, Accepted, Confirmed, Completed, Declined, Withdrawn, Expired, Cancelled.
Deadlines (America/Toronto): artists reply within 72 hours (24 if the event is under 7 days away); bookers pay the deposit
within 48 hours of acceptance; free cancellation until 14 full days before the event (Sat 31 Oct for Sat 14 Nov).
Naomi's bookings: ZAM-0114 Abigail Sat 14 Nov worship night 7:00 p.m., Requested Fri 9 Oct 10:15 a.m., price locked at $650
(every booking-detail state reuses this id; its "accepted" state assumes acceptance Fri 9 Oct 2:40 p.m., deposit due
Sun 11 Oct 2:40 p.m.); ZAM-0097 Marcus Bell Trio Sun 25 Oct, Confirmed (deposit $237.50 paid, balance $712.50 after);
ZAM-0088 Luz Viva Sat 5 Dec, Accepted Thu 8 Oct 4:00 p.m., deposit $225 due Sat 10 Oct 4:00 p.m.; ZAM-0075 Grace Tabernacle
Sun 20 Sep, Declined; ZAM-0080 Elijah Park Sat 3 Oct, Withdrawn; ZAM-0061 Abigail Sun 14 Jun, Completed (Naomi's June review).
Abigail's incoming requests: Riverside Sat 14 Nov $650, reply by Mon 12 Oct 10:15 a.m.; Harvest Point Sat 5 Dec worship
night $650, reply by Sat 10 Oct 3:15 p.m.; St. Brendan's Sun 22 Nov $650, reply by Sun 11 Oct 9:00 a.m.;
Living Waters Sat 21 Nov Youth event (ZAM-0121, used for the "already booked" conflict); Trinity Lutheran Sun 29 Nov, Declined;
St. Brendan's Sun 13 Sep, Completed ($650 / $52 fee / $598 paid out Tue 15 Sep).
Abigail's confirmed dates: Sun 18 Oct Living Waters; Sun 1 Nov Harvest Point; Sun 15 Nov Lakeshore Alliance; Sat 21 Nov
Kingdom Life women's conference (Conference or retreat, $900); Sun 13 Dec Living Waters carol service (Sunday service); Sun 20 Dec
Lakeshore Alliance. Kinds of gathering on cards and lists use the L2-004 names only.
Abigail's calendar (route /artist/calendar, 18 months): weekly default Unavailable every Monday; booked 1, 15, 21 Nov,
13, 20 Dec; requested 14, 22 Nov, 5 Dec; unavailable 26-27 Nov (studio), 24-26 Dec (family), 31 Dec. Default view November 2026.
Abigail's vulnerable sector check: issued Mon 3 Mar 2025, verified until Fri 3 Mar 2028 (check-pending state: newer check
issued Mon 5 Oct 2026, uploaded Fri 9 Oct). Abigail's profile address: abigail-mensah, last changed Mon 3 Aug (address-locked
state assumes a change on Mon 28 Sep, next change from Wed 28 Oct). Abigail's calendar feed is on.
Profile completeness: five checks of 20% (details, primary photo, a Live video, 5 songs, verified check). Abigail 100%:
8 songs, 4 videos, 4 photos. Miriam 40%: 4 songs, no videos, 2 photos, no check; slug miriam-haile, changeable now.
Dashboard numbers: Awaiting reply 3 / Confirmed dates 4 (Oct-Nov) / Free Saturdays in Nov 2 / Profile complete 100%.
Entry: naomi.fraser@riversidecc.ca; verification links last 24 hours; reset links are single-use and expire after 60 minutes.
Administrator (admin area): Priya Nair (PN), Zamaro team, priya@zamaro.ca; signs in with a TOTP code at 11:41 a.m.
Application queue (oldest first): Ebenezer Brass Band, Band, Oshawa, Tue 6 Oct 4:20 p.m.; Kezia & Mark Thompson, Duo, Pickering,
Thu 8 Oct 9:05 p.m.; Tobi Adeyemi, A-0219, Fri 9 Oct 10:42 a.m. Tobi's references: Pastor Samuel Osei (Cornerstone Baptist,
Scarborough, samuel.osei@cornerstonebaptist.ca) and Ruth Kim (Agincourt Community Church, 647 555 0192), verified by Priya at
1:50 and 2:05 p.m.; approved 2:10 p.m.; no VSC uploaded. Rejection reasons (L2-048): References could not be confirmed; Videos don't
show you leading worship; Outside the Zamaro service area; Application incomplete or inaccurate; Other.
Suspension example: Marcus Bell Trio (Hamilton, from $950, approved Mon 2 Mar 2026), suspended Fri 9 Oct 2:30 p.m.; open requests
ZAM-0109 (St. Brendan's, Sat 7 Nov, Requested) and ZAM-0112 (Lakeshore Alliance, Sun 29 Nov, Accepted) become Declined; ZAM-0097
(Riverside, Sun 25 Oct, Confirmed, deposit $237.50 paid Tue 29 Sep with Visa ending 4242) is left to resolve and fully refunded.
Held booking: ZAM-0104, Hosanna Collective at Kingdom Life Centre (Grace Ampofo, grace.ampofo@kingdomlife.ca), Sun 4 Oct 10:00 a.m.,
$800 (deposit $200 paid, balance $600 and payout $736 paused); Completed Mon 5 Oct 10:00 a.m.; problem reported Mon 5 Oct 4:12 p.m.; balance would have been charged Tue 6 Oct 10:00 a.m., payout by Thu 8 Oct
VSC queue (/admin/vulnerable-sector-checks, oldest first): Elijah Park, first check issued Fri 25 Sep 2026, uploaded Wed 7 Oct
4:10 p.m. (verified state: by Priya, until Tue 25 Sep 2029); Abigail Mensah's newer check issued Mon 5 Oct 2026, uploaded Fri 9 Oct 9:52 a.m.
Reported reviews: Pastor Dave Mwangi's 2-star review of Hosanna Collective (2 reports, Not about this artist); Grace Ampofo's
2-star review of Elijah Park (1 report, Personal information), hidden with a reason.
Abigail's replies: to Tomi Oduya (Thu 8 Oct, editable until Thu 15 Oct 11:20 a.m.) and to Naomi Fraser (Tue 16 Jun, locked);
Janet Clarke's and Femi Adebayo's reviews have no reply. Naomi's review of ZAM-0114 posted Tue 17 Nov, editable until Tue 24 Nov 8:15 p.m.
All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, Riverside Community Church, Burlington
- **Featured artist:** Abigail Mensah. The empty profile shows Miriam Haile, who is new.
- **Signed-in artist:** Abigail Mensah. Artist-side empty states switch to Miriam Haile.
- **Applicant:** Tobi Adeyemi, Scarborough, applying through the artist form.
- **Current booking:** ZAM-0114, Abigail for Riverside's worship night, Sat 14 Nov, 7:00 p.m.
- **Administrator:** Priya Nair, Zamaro team, in the admin area under `/admin`.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- The display face falls back to Impact when Bebas Neue/Anton/Oswald are not installed; the product would self-host one.
- Every ticket links to Abigail’s profile, since there is only one full profile mock.
- Deposit (25%), artist fee (8%) and 14-day free cancellation follow L2-037, L2-039 and L2-042. Abigail has no HST number, so no mock shows a tax line (L2-036).
- Rules follow `docs/specs/L2.md`; every mock lists the L2 ids it serves in `manifest.json` and a `mock:requirements` meta.
- The admin area under `/admin` uses the workspace top bar with an Admin tag and its own sections, never the public links. A non-administrator gets the ordinary 404 page there (L2-066).
- Booking messages appear as a thread on the booking page (church) and the request page (artist). Contact details are masked until a booking is Confirmed.
- A church account that opens an artist route sees a forbidden state with a way back, not a redirect.
- Another booker's booking URL shows a not-found state, matching the 404 in L2-033.
- Sign-in is required before a request is sent; the book page assumes Naomi is signed in and verified.
- Only Riverside's request has a detail mock; other request rows link to it and say so in a note.
- Dialog mocks are native `<dialog>` elements; `assets/mock.js` reopens them with `showModal()` so the backdrop, focus trap and Escape match the product.

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | invalid | limited | booked-date | no-photos | duplicate | limit | unverified | submitting | success | no-results | past | accepted | confirmed | declined | completed | withdrawn | cancelled | expired | deposit-expired | forbidden | artist-cancelled | balance-due | held | balance-failed | locked | challenge | artist | step-2 | step-3 | step-4 | outside-area | failed | out-of-area | export-requested | export-ready | two-step-on | codes | address-locked | check-pending | video-processing | selected | booker-cancelled | setup | recovery | verified | approved | suspended | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Discover artists (`discover`) | [✅](pages/discover/default.html) | [✅](pages/discover/loading.html) | [✅](pages/discover/empty.html) | [✅](pages/discover/error.html) | [✅](pages/discover/invalid.html) | [✅](pages/discover/limited.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-002`, `L2-003`, `L2-004`, `L2-005`, `L2-006`, `L2-007`, `L2-008`, `L2-009`, `L2-010`, `L2-011`, `L2-044`, `L2-060`, `L2-077`, `L2-097`, `L2-105`, `L2-106`, `L2-112` |
| Artist profile (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |  | [✅](pages/artist/booked-date.html) | [✅](pages/artist/no-photos.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-012`, `L2-013`, `L2-014`, `L2-015`, `L2-016`, `L2-017`, `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-060`, `L2-083`, `L2-098`, `L2-105`, `L2-107`, `L2-112`, `L2-113` |
| Request to book (`book`) | [✅](pages/book/default.html) | [✅](pages/book/loading.html) | ➖ | [✅](pages/book/error.html) | [✅](pages/book/invalid.html) |  |  |  | [✅](pages/book/duplicate.html) | [✅](pages/book/limit.html) | [✅](pages/book/unverified.html) | [✅](pages/book/submitting.html) | [✅](pages/book/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-019`, `L2-022`, `L2-024`, `L2-028`, `L2-032`, `L2-044`, `L2-077`, `L2-105`, `L2-108`, `L2-110` |
| Your bookings (`bookings`) | [✅](pages/bookings/default.html) | [✅](pages/bookings/loading.html) | [✅](pages/bookings/empty.html) | [✅](pages/bookings/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/bookings/no-results.html) | [✅](pages/bookings/past.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-033`, `L2-105`, `L2-110` |
| Booking (`booking-detail`) | [✅](pages/booking-detail/default.html) | [✅](pages/booking-detail/loading.html) | ➖ | [✅](pages/booking-detail/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/booking-detail/accepted.html) | [✅](pages/booking-detail/confirmed.html) | [✅](pages/booking-detail/declined.html) | [✅](pages/booking-detail/completed.html) | [✅](pages/booking-detail/withdrawn.html) | [✅](pages/booking-detail/cancelled.html) | [✅](pages/booking-detail/expired.html) | [✅](pages/booking-detail/deposit-expired.html) | [✅](pages/booking-detail/forbidden.html) | [✅](pages/booking-detail/artist-cancelled.html) | [✅](pages/booking-detail/balance-due.html) | [✅](pages/booking-detail/held.html) | [✅](pages/booking-detail/balance-failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-030`, `L2-031`, `L2-032`, `L2-033`, `L2-036`, `L2-037`, `L2-038`, `L2-040`, `L2-042`, `L2-043`, `L2-044`, `L2-045`, `L2-046`, `L2-059`, `L2-105`, `L2-108`, `L2-110` |
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) | [✅](pages/sign-in/invalid.html) |  |  |  |  |  |  | [✅](pages/sign-in/submitting.html) |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/expired.html) |  |  |  |  |  |  | [✅](pages/sign-in/locked.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-023`, `L2-072`, `L2-073`, `L2-108` |
| Sign up (`sign-up`) | [✅](pages/sign-up/default.html) | ➖ | ➖ | [✅](pages/sign-up/error.html) | [✅](pages/sign-up/invalid.html) |  |  |  |  |  |  | [✅](pages/sign-up/submitting.html) | [✅](pages/sign-up/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/sign-up/challenge.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-022`, `L2-072`, `L2-077`, `L2-080`, `L2-108` |
| Verify email (`verify-email`) | [✅](pages/verify-email/default.html) | ➖ | ➖ | [✅](pages/verify-email/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/verify-email/expired.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-022`, `L2-105` |
| Forgot password (`forgot-password`) | [✅](pages/forgot-password/default.html) | ➖ | ➖ | [✅](pages/forgot-password/error.html) | [✅](pages/forgot-password/invalid.html) |  |  |  |  |  |  | [✅](pages/forgot-password/submitting.html) | [✅](pages/forgot-password/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-023`, `L2-077`, `L2-108` |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | [✅](pages/reset-password/loading.html) | ➖ | [✅](pages/reset-password/error.html) | [✅](pages/reset-password/invalid.html) |  |  |  |  |  |  | [✅](pages/reset-password/submitting.html) | [✅](pages/reset-password/success.html) |  |  |  |  |  |  |  |  | [✅](pages/reset-password/expired.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-023`, `L2-072`, `L2-105`, `L2-108` |
| Not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/not-found/artist.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-021` |
| Server error (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-093` |
| Offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-026`, `L2-089`, `L2-108`, `L2-114` |
| Apply as an artist (`apply`) | [✅](pages/apply/default.html) | ➖ | ➖ | [✅](pages/apply/error.html) | [✅](pages/apply/invalid.html) |  |  |  |  |  |  | [✅](pages/apply/submitting.html) | [✅](pages/apply/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/apply/step-2.html) | [✅](pages/apply/step-3.html) | [✅](pages/apply/step-4.html) | [✅](pages/apply/outside-area.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-001`, `L2-039`, `L2-047`, `L2-052`, `L2-077`, `L2-108` |
| Saved artists (`saved`) | [✅](pages/saved/default.html) | [✅](pages/saved/loading.html) | [✅](pages/saved/empty.html) | [✅](pages/saved/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-026`, `L2-027`, `L2-105` |
| Account settings (`account`) | [✅](pages/account/default.html) | [✅](pages/account/loading.html) | ➖ | [✅](pages/account/error.html) | [✅](pages/account/invalid.html) |  |  |  |  |  |  | [✅](pages/account/submitting.html) | [✅](pages/account/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/account/artist.html) |  |  |  |  | [✅](pages/account/failed.html) | [✅](pages/account/out-of-area.html) | [✅](pages/account/export-requested.html) | [✅](pages/account/export-ready.html) | [✅](pages/account/two-step-on.html) |  |  |  |  |  |  |  |  |  |  |  | `L2-001`, `L2-024`, `L2-025`, `L2-065`, `L2-072`, `L2-080`, `L2-081`, `L2-082`, `L2-105`, `L2-108` |
| Confirm new email (`confirm-email`) | [✅](pages/confirm-email/default.html) | ➖ | ➖ | [✅](pages/confirm-email/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/confirm-email/expired.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-025`, `L2-105` |
| Accept updated terms (`accept-terms`) | [✅](pages/accept-terms/default.html) | [✅](pages/accept-terms/loading.html) | ➖ | [✅](pages/accept-terms/error.html) |  |  |  |  |  |  |  | [✅](pages/accept-terms/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-080`, `L2-105`, `L2-108` |
| Download your data (`data-export`) | [✅](pages/data-export/default.html) | ➖ | ➖ | [✅](pages/data-export/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/data-export/expired.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-074`, `L2-081` |
| Turn on two-step sign-in (`mfa-setup`) | [✅](pages/mfa-setup/default.html) | [✅](pages/mfa-setup/loading.html) | ➖ | [✅](pages/mfa-setup/error.html) | [✅](pages/mfa-setup/invalid.html) |  |  |  |  |  |  | [✅](pages/mfa-setup/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/mfa-setup/codes.html) |  |  |  |  |  |  |  |  |  |  | `L2-072`, `L2-105`, `L2-108` |
| Edit profile (`edit-profile`) | [✅](pages/edit-profile/default.html) | [✅](pages/edit-profile/loading.html) | [✅](pages/edit-profile/empty.html) | [✅](pages/edit-profile/error.html) | [✅](pages/edit-profile/invalid.html) |  |  |  |  |  |  | [✅](pages/edit-profile/submitting.html) | [✅](pages/edit-profile/success.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/edit-profile/address-locked.html) | [✅](pages/edit-profile/check-pending.html) | [✅](pages/edit-profile/video-processing.html) |  |  |  |  |  |  |  | `L2-049`, `L2-050`, `L2-051`, `L2-052`, `L2-053`, `L2-054`, `L2-055`, `L2-105`, `L2-108` |
| Profile preview (`profile-preview`) | [✅](pages/profile-preview/default.html) | [✅](pages/profile-preview/loading.html) | [✅](pages/profile-preview/empty.html) | [✅](pages/profile-preview/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-054`, `L2-074`, `L2-105` |
| Dashboard (`dashboard`) | [✅](pages/dashboard/default.html) | [✅](pages/dashboard/loading.html) | [✅](pages/dashboard/empty.html) | [✅](pages/dashboard/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/dashboard/forbidden.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-034`, `L2-039`, `L2-056`, `L2-074`, `L2-096`, `L2-105` |
| Availability (`availability`) | [✅](pages/availability/default.html) | [✅](pages/availability/loading.html) | [✅](pages/availability/empty.html) | [✅](pages/availability/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/availability/selected.html) |  |  |  |  |  |  | `L2-056`, `L2-057`, `L2-058`, `L2-105` |
| Requests (`requests`) | [✅](pages/requests/default.html) | [✅](pages/requests/loading.html) | [✅](pages/requests/empty.html) | [✅](pages/requests/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/requests/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-030`, `L2-034`, `L2-105` |
| Request (`request-detail`) | [✅](pages/request-detail/default.html) | [✅](pages/request-detail/loading.html) | ➖ | [✅](pages/request-detail/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/request-detail/accepted.html) | [✅](pages/request-detail/confirmed.html) | [✅](pages/request-detail/declined.html) | [✅](pages/request-detail/completed.html) | [✅](pages/request-detail/withdrawn.html) | [✅](pages/request-detail/cancelled.html) | [✅](pages/request-detail/expired.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/request-detail/booker-cancelled.html) |  |  |  |  |  | `L2-029`, `L2-030`, `L2-031`, `L2-034`, `L2-037`, `L2-039`, `L2-042`, `L2-043`, `L2-045`, `L2-046`, `L2-105` |
| Earnings (`earnings`) | [✅](pages/earnings/default.html) | [✅](pages/earnings/loading.html) | [✅](pages/earnings/empty.html) | [✅](pages/earnings/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/earnings/setup.html) |  |  |  |  | `L2-039`, `L2-105`, `L2-110` |
| Your reviews (`artist-reviews`) | [✅](pages/artist-reviews/default.html) | [✅](pages/artist-reviews/loading.html) | [✅](pages/artist-reviews/empty.html) | [✅](pages/artist-reviews/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-060`, `L2-061`, `L2-062`, `L2-105` |
| Two-step sign-in (`mfa-challenge`) | [✅](pages/mfa-challenge/default.html) | ➖ | ➖ | [✅](pages/mfa-challenge/error.html) | [✅](pages/mfa-challenge/invalid.html) |  |  |  |  |  |  | [✅](pages/mfa-challenge/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/mfa-challenge/locked.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/mfa-challenge/recovery.html) |  |  |  | `L2-066`, `L2-072`, `L2-073`, `L2-108` |
| Applications (`admin-applications`) | [✅](pages/admin-applications/default.html) | [✅](pages/admin-applications/loading.html) | [✅](pages/admin-applications/empty.html) | [✅](pages/admin-applications/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-048`, `L2-066`, `L2-067`, `L2-105` |
| Application (`admin-application`) | [✅](pages/admin-application/default.html) | [✅](pages/admin-application/loading.html) | ➖ | [✅](pages/admin-application/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/admin-application/verified.html) | [✅](pages/admin-application/approved.html) |  | `L2-048`, `L2-049`, `L2-066`, `L2-067`, `L2-105` |
| Artists (`admin-artists`) | [✅](pages/admin-artists/default.html) | [✅](pages/admin-artists/loading.html) | ➖ | [✅](pages/admin-artists/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/admin-artists/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-066`, `L2-067`, `L2-105` |
| Artist (`admin-artist`) | [✅](pages/admin-artist/default.html) | [✅](pages/admin-artist/loading.html) | ➖ | [✅](pages/admin-artist/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/admin-artist/suspended.html) | `L2-066`, `L2-067`, `L2-105` |
| Vulnerable Sector Checks (`admin-checks`) | [✅](pages/admin-checks/default.html) | [✅](pages/admin-checks/loading.html) | [✅](pages/admin-checks/empty.html) | [✅](pages/admin-checks/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/admin-checks/verified.html) |  |  | `L2-049`, `L2-066`, `L2-069`, `L2-105` |
| Bookings support (`admin-bookings`) | [✅](pages/admin-bookings/default.html) | [✅](pages/admin-bookings/loading.html) | ➖ | [✅](pages/admin-bookings/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/admin-bookings/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/admin-bookings/held.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-066`, `L2-068`, `L2-105`, `L2-110` |
| Booking support (`admin-booking`) | [✅](pages/admin-booking/default.html) | [✅](pages/admin-booking/loading.html) | ➖ | [✅](pages/admin-booking/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/admin-booking/held.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-029`, `L2-038`, `L2-045`, `L2-066`, `L2-068`, `L2-105`, `L2-110` |
| Reported reviews (`admin-reviews`) | [✅](pages/admin-reviews/default.html) | [✅](pages/admin-reviews/loading.html) | [✅](pages/admin-reviews/empty.html) | [✅](pages/admin-reviews/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-060`, `L2-062`, `L2-066`, `L2-105` |
| Audit log (`admin-audit`) | [✅](pages/admin-audit/default.html) | [✅](pages/admin-audit/loading.html) | ➖ | [✅](pages/admin-audit/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/admin-audit/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-066`, `L2-069`, `L2-105` |

### Dialogs

| Screen | default | busy | invalid | failed | confirm | late | conflict | edit | blocked | new-codes | codes | artist | admin | limit | warning | off | no-phone | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Add your church (`add-church`) | [✅](dialogs/add-church/default.html) | [✅](dialogs/add-church/busy.html) | [✅](dialogs/add-church/invalid.html) | [✅](dialogs/add-church/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-001`, `L2-024`, `L2-099`, `L2-101`, `L2-108` |
| Withdraw request (`withdraw-request`) | [✅](dialogs/withdraw-request/default.html) | [✅](dialogs/withdraw-request/busy.html) | ➖ | [✅](dialogs/withdraw-request/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-031`, `L2-099`, `L2-101`, `L2-108` |
| Cancel booking (`cancel-booking`) | [✅](dialogs/cancel-booking/default.html) | [✅](dialogs/cancel-booking/busy.html) | ➖ | [✅](dialogs/cancel-booking/failed.html) | [✅](dialogs/cancel-booking/confirm.html) | [✅](dialogs/cancel-booking/late.html) |  |  |  |  |  |  |  |  |  |  |  | `L2-042`, `L2-044`, `L2-099`, `L2-101`, `L2-108` |
| Pay deposit (`pay-deposit`) | [✅](dialogs/pay-deposit/default.html) | [✅](dialogs/pay-deposit/busy.html) | [✅](dialogs/pay-deposit/invalid.html) | [✅](dialogs/pay-deposit/failed.html) |  |  | [✅](dialogs/pay-deposit/conflict.html) |  |  |  |  |  |  |  |  |  |  | `L2-032`, `L2-035`, `L2-036`, `L2-037`, `L2-044`, `L2-099`, `L2-101`, `L2-108` |
| Report a problem (`report-problem`) | [✅](dialogs/report-problem/default.html) | [✅](dialogs/report-problem/busy.html) | [✅](dialogs/report-problem/invalid.html) | [✅](dialogs/report-problem/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-038`, `L2-099`, `L2-101`, `L2-108` |
| Pay balance (`pay-balance`) | [✅](dialogs/pay-balance/default.html) | [✅](dialogs/pay-balance/busy.html) | [✅](dialogs/pay-balance/invalid.html) | [✅](dialogs/pay-balance/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-035`, `L2-036`, `L2-038`, `L2-099`, `L2-101`, `L2-108` |
| Write a review (`write-review`) | [✅](dialogs/write-review/default.html) | [✅](dialogs/write-review/busy.html) | [✅](dialogs/write-review/invalid.html) | [✅](dialogs/write-review/failed.html) |  |  |  | [✅](dialogs/write-review/edit.html) |  |  |  |  |  |  |  |  |  | `L2-059`, `L2-099`, `L2-101`, `L2-108` |
| Delete account (`delete-account`) | [✅](dialogs/delete-account/default.html) | [✅](dialogs/delete-account/busy.html) | [✅](dialogs/delete-account/invalid.html) | [✅](dialogs/delete-account/failed.html) |  |  |  |  | [✅](dialogs/delete-account/blocked.html) |  |  |  |  |  |  |  |  | `L2-082`, `L2-099`, `L2-101`, `L2-108` |
| Two-step code (`two-step-code`) | [✅](dialogs/two-step-code/default.html) | [✅](dialogs/two-step-code/busy.html) | [✅](dialogs/two-step-code/invalid.html) | [✅](dialogs/two-step-code/failed.html) |  |  |  |  |  | [✅](dialogs/two-step-code/new-codes.html) | [✅](dialogs/two-step-code/codes.html) |  |  |  |  |  |  | `L2-072`, `L2-099`, `L2-101`, `L2-108` |
| Account menu (`account-menu`) | [✅](dialogs/account-menu/default.html) | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](dialogs/account-menu/artist.html) |  |  |  |  |  | `L2-023`, `L2-024`, `L2-099`, `L2-101` |
| Menu (`menu`) | [✅](dialogs/menu/default.html) | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](dialogs/menu/artist.html) | [✅](dialogs/menu/admin.html) |  |  |  |  | `L2-099`, `L2-101`, `L2-104` |
| Photo viewer (`photo-viewer`) | [✅](dialogs/photo-viewer/default.html) | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-015`, `L2-099`, `L2-101` |
| Add video (`add-video`) | [✅](dialogs/add-video/default.html) | [✅](dialogs/add-video/busy.html) | [✅](dialogs/add-video/invalid.html) | [✅](dialogs/add-video/failed.html) |  |  |  |  |  |  |  |  |  | [✅](dialogs/add-video/limit.html) |  |  |  | `L2-052`, `L2-076`, `L2-099`, `L2-101`, `L2-108` |
| Add photo (`add-photo`) | [✅](dialogs/add-photo/default.html) | [✅](dialogs/add-photo/busy.html) | [✅](dialogs/add-photo/invalid.html) | [✅](dialogs/add-photo/failed.html) |  |  |  |  |  |  |  |  |  | [✅](dialogs/add-photo/limit.html) |  |  |  | `L2-051`, `L2-076`, `L2-099`, `L2-101`, `L2-108` |
| Add song (`add-song`) | [✅](dialogs/add-song/default.html) | [✅](dialogs/add-song/busy.html) | [✅](dialogs/add-song/invalid.html) | [✅](dialogs/add-song/failed.html) |  |  |  |  |  |  |  |  |  | [✅](dialogs/add-song/limit.html) |  |  |  | `L2-053`, `L2-099`, `L2-101`, `L2-108` |
| Upload check (`upload-check`) | [✅](dialogs/upload-check/default.html) | [✅](dialogs/upload-check/busy.html) | [✅](dialogs/upload-check/invalid.html) | [✅](dialogs/upload-check/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-049`, `L2-076`, `L2-099`, `L2-101`, `L2-108` |
| Mark dates unavailable (`block-dates`) | [✅](dialogs/block-dates/default.html) | [✅](dialogs/block-dates/busy.html) | [✅](dialogs/block-dates/invalid.html) | [✅](dialogs/block-dates/failed.html) |  |  |  |  |  |  |  |  |  |  | [✅](dialogs/block-dates/warning.html) |  |  | `L2-056`, `L2-057`, `L2-099`, `L2-108` |
| Weekly default (`weekly-default`) | [✅](dialogs/weekly-default/default.html) | [✅](dialogs/weekly-default/busy.html) | ➖ | [✅](dialogs/weekly-default/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-056`, `L2-099`, `L2-108` |
| Calendar feed (`calendar-feed`) | [✅](dialogs/calendar-feed/default.html) | [✅](dialogs/calendar-feed/busy.html) | ➖ | [✅](dialogs/calendar-feed/failed.html) | [✅](dialogs/calendar-feed/confirm.html) |  |  |  |  |  |  |  |  |  |  | [✅](dialogs/calendar-feed/off.html) |  | `L2-058`, `L2-074`, `L2-099`, `L2-101`, `L2-108` |
| Accept request (`accept-request`) | [✅](dialogs/accept-request/default.html) | [✅](dialogs/accept-request/busy.html) | ➖ | [✅](dialogs/accept-request/failed.html) |  |  | [✅](dialogs/accept-request/conflict.html) |  |  |  |  |  |  |  |  |  | [✅](dialogs/accept-request/no-phone.html) | `L2-025`, `L2-030`, `L2-032`, `L2-034`, `L2-046`, `L2-099`, `L2-101`, `L2-108` |
| Decline request (`decline-request`) | [✅](dialogs/decline-request/default.html) | [✅](dialogs/decline-request/busy.html) | [✅](dialogs/decline-request/invalid.html) | [✅](dialogs/decline-request/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-030`, `L2-099`, `L2-101`, `L2-108` |
| Cancel booking (artist) (`artist-cancel-booking`) | [✅](dialogs/artist-cancel-booking/default.html) | [✅](dialogs/artist-cancel-booking/busy.html) | [✅](dialogs/artist-cancel-booking/invalid.html) | [✅](dialogs/artist-cancel-booking/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-043`, `L2-099`, `L2-101`, `L2-108` |
| Reply to a review (`reply-review`) | [✅](dialogs/reply-review/default.html) | [✅](dialogs/reply-review/busy.html) | [✅](dialogs/reply-review/invalid.html) | [✅](dialogs/reply-review/failed.html) |  |  |  | [✅](dialogs/reply-review/edit.html) |  |  |  |  |  |  |  |  |  | `L2-061`, `L2-099`, `L2-101`, `L2-108` |
| Report a review (`report-review`) | [✅](dialogs/report-review/default.html) | [✅](dialogs/report-review/busy.html) | [✅](dialogs/report-review/invalid.html) | [✅](dialogs/report-review/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-062`, `L2-099`, `L2-101`, `L2-108` |
| Reject application (`reject-application`) | [✅](dialogs/reject-application/default.html) | [✅](dialogs/reject-application/busy.html) | [✅](dialogs/reject-application/invalid.html) | [✅](dialogs/reject-application/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-048`, `L2-099`, `L2-101`, `L2-108` |
| Suspend artist (`suspend-artist`) | [✅](dialogs/suspend-artist/default.html) | [✅](dialogs/suspend-artist/busy.html) | [✅](dialogs/suspend-artist/invalid.html) | [✅](dialogs/suspend-artist/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-067`, `L2-099`, `L2-101`, `L2-108` |
| Reinstate artist (`reinstate-artist`) | [✅](dialogs/reinstate-artist/default.html) | [✅](dialogs/reinstate-artist/busy.html) | ➖ | [✅](dialogs/reinstate-artist/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-067`, `L2-099`, `L2-101`, `L2-108` |
| Issue refund (`issue-refund`) | [✅](dialogs/issue-refund/default.html) | [✅](dialogs/issue-refund/busy.html) | [✅](dialogs/issue-refund/invalid.html) | [✅](dialogs/issue-refund/failed.html) | [✅](dialogs/issue-refund/confirm.html) |  |  |  |  |  |  |  |  |  |  |  |  | `L2-068`, `L2-099`, `L2-101`, `L2-108`, `L2-110` |
| Resolve held booking (`resolve-hold`) | [✅](dialogs/resolve-hold/default.html) | [✅](dialogs/resolve-hold/busy.html) | [✅](dialogs/resolve-hold/invalid.html) | [✅](dialogs/resolve-hold/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-038`, `L2-068`, `L2-099`, `L2-101`, `L2-108` |
| Hide review (`hide-review`) | [✅](dialogs/hide-review/default.html) | [✅](dialogs/hide-review/busy.html) | [✅](dialogs/hide-review/invalid.html) | [✅](dialogs/hide-review/failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-060`, `L2-062`, `L2-099`, `L2-101`, `L2-108` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | persistent | undeliverable | Requirements |
|---|---|---|---|---|---|---|---|---|---|
| Booking toast (`booking-toast`) | [✅](notifications/booking-toast/info.html) | [✅](notifications/booking-toast/success.html) | [✅](notifications/booking-toast/warning.html) | [✅](notifications/booking-toast/danger.html) | [✅](notifications/booking-toast/with-action.html) | [✅](notifications/booking-toast/stacked.html) |  |  | `L2-028`, `L2-037`, `L2-045`, `L2-063`, `L2-109` |
| System banner (`system-banner`) | [✅](notifications/system-banner/info.html) | [✅](notifications/system-banner/success.html) | [✅](notifications/system-banner/warning.html) | [✅](notifications/system-banner/danger.html) |  |  | [✅](notifications/system-banner/persistent.html) | [✅](notifications/system-banner/undeliverable.html) | `L2-022`, `L2-026`, `L2-065`, `L2-090`, `L2-114` |
| Saved toast (`saved-toast`) | [✅](notifications/saved-toast/info.html) | [✅](notifications/saved-toast/success.html) | [✅](notifications/saved-toast/warning.html) | [✅](notifications/saved-toast/danger.html) | [✅](notifications/saved-toast/with-action.html) | ➖ |  |  | `L2-026`, `L2-109` |
| Share toast (`share-toast`) | ➖ | [✅](notifications/share-toast/success.html) | ➖ | ➖ |  |  |  |  | `L2-109`, `L2-113` |
| Availability toast (`availability-toast`) | [✅](notifications/availability-toast/info.html) | [✅](notifications/availability-toast/success.html) | [✅](notifications/availability-toast/warning.html) | [✅](notifications/availability-toast/danger.html) | [✅](notifications/availability-toast/with-action.html) | ➖ |  |  | `L2-056`, `L2-057`, `L2-109` |
| Request toast (`request-toast`) | [✅](notifications/request-toast/info.html) | [✅](notifications/request-toast/success.html) | [✅](notifications/request-toast/warning.html) | [✅](notifications/request-toast/danger.html) | [✅](notifications/request-toast/with-action.html) | [✅](notifications/request-toast/stacked.html) |  |  | `L2-030`, `L2-034`, `L2-037`, `L2-109` |
| Admin session toast (`session-toast`) | ➖ | ➖ | [✅](notifications/session-toast/warning.html) | ➖ |  |  |  |  | `L2-066`, `L2-109` |

<!-- coverage:end -->

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```
