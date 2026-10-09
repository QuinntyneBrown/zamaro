# Zamaro mocks — concept “Sabbath”

**Sabbath** is the day set apart and kept on the calendar. This concept is
calendar first and Swiss minimal, built for a busy church administrator.
Availability is the hero: a month calendar counts how many artists are free
each day, and a two-week availability matrix shows every artist’s open dates
at a glance. Everything sits on a strict 4 / 8 / 12-column grid, divided by
hairline rules rather than boxes and shadows.

| Token decision | Value |
|---|---|
| Accent | Sage `#4b6a53` (light) / `#9dbba4` (dark), the only colour. It marks free dates, the selected day and primary actions |
| Neutrals | True neutral greys with no blue cast; dark canvas `#111110` |
| Type | Neo-grotesque stack (Neue Haas Grotesk, Helvetica Neue, Helvetica, Arial Nova, Arial), medium-weight headings, tight tracking |
| Numerals | `tabular-nums lining-nums` everywhere, so dates, counts and fees line up in columns |
| Shape | 2 px corners, 1 px hairlines, a 2 px rule over every section; no card shadows |
| Availability marks | Free = solid sage square · On hold = hatched square · Booked = short dash (shape plus text, never colour alone) |

This concept is one of several under `docs/mocks/<concept>/`. Each concept has
its own tokens, kit, manifest and gallery, so you can compare them side by side
with `vespers`.

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON.
Default selection: Saturday 14 November 2026 · within 120 km of Burlington · 42 artists in range, 9 free.
Artists (distance from Burlington):
  Marcus Bell Trio — contemporary/youth band, Hamilton, 15 km, from $950
  Hosanna Collective — five-piece band, Mississauga, 30 km, from $1,800
  Abigail Mensah — gospel & contemporary vocalist, Brampton, 45 km, from $650, 4.9 (38). Profile page.
  Luz Viva — Spanish/bilingual band, North York, 60 km, from $900
  Elijah Park — solo acoustic, Markham, 75 km, from $350
  Grace Tabernacle Mass Choir — 30-voice choir, Scarborough, 75 km, from $2,400
  Daniel and Ruth Okonkwo — duo, Ajax, 95 km, from $700
  Miriam Haile — new vocalist & pianist, Etobicoke, from $300, no videos or reviews (empty profile)
Saved by Naomi: Abigail Mensah, Luz Viva, Elijah Park.
Reviewers: Pastor James Whitfield (Knox Presbyterian, Oakville), Tomi Oduya (Harvest Point Church, Milton),
Rev. Janet Clarke (St. Brendan’s Anglican, Oshawa). All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, worship coordinator at Riverside Community Church, Burlington
- **Featured artist:** Abigail Mensah (Brampton). The empty profile shows Miriam Haile, who is new to Zamaro.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- No specs exist yet. The brief (`docs/mocks/GUIDELINE FOR MOCK.txt`) is read as
  two pages, **Discover** and **Artist profile**. Saved artists, account and
  artist sign-up are shared pieces on those pages: the Saved list beside the
  calendar, the account menu in the top bar and the “Do you lead worship?” band.
- The week starts on Sunday, and the Sunday column is shaded. Many artists lead
  their own congregations on Sunday mornings, so Sunday counts are lower.
- The calendar opens on the month of the last date picked (November here).
  “Today” jumps back to October.
- “On hold” means another church has a pending request. Those dates may open
  up again, so they are shown but cannot be selected.
- The travel fee is shown as a flat estimate. It is still open whether artists
  set it themselves or Zamaro calculates it from the distance.
- The deposit (25%) and free cancellation up to 30 days before are assumed, not
  confirmed.
- Photography is shown as tokenised SVG placeholders with descriptive
  `aria-label`s. Real photos replace these in the product.

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | Requirements |
|---|---|---|---|---|---|
| Discover artists (`discover`) | [✅](pages/discover/default.html) | [✅](pages/discover/loading.html) | [✅](pages/discover/empty.html) | [✅](pages/discover/error.html) |  |
| Artist profile (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |

<!-- coverage:end -->

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/sabbath --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/sabbath
```
