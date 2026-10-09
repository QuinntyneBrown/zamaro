# Zamaro mocks

The mocks treat booking worship like booking a band for worship night. They are
a screen-printed gig poster: black ink on newsprint, one electric accent
(signal yellow), condensed grotesque headlines, the event date set huge like a
tour poster, artists as admission tickets with a perforated price stub, and the
songs an artist leads as a numbered setlist. The dark theme is the stage: black
canvas, paper text, yellow hard shadows.

| Token decision | Value |
|---|---|
| Ink / paper | `#0c0c0c` on newsprint `#f3f1ea`; dark canvas `#0c0c0c` |
| Accent | Signal yellow `#ffd400`, a fill colour only on light (text on it is always ink); text-safe on dark |
| Type | Condensed display (Bebas Neue / Anton / Oswald / Impact fallback), uppercase; Helvetica/Arial body; mono for stub small print |
| Shape | Square corners, 3–6 px rules, hard offset shadows instead of blur |
| Focus | Yellow inner ring + ink outer ring (light); ink inner + yellow outer (dark) |

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON. 3 saved artists.
Default search: Saturday 14 November 2026 · Burlington, ON · Sunday service · within 120 km.
Artists: Abigail Mensah (headliner, Brampton, from $650, 4.9/38), Hosanna Collective, Elijah Park,
Grace Tabernacle Mass Choir, Luz Viva, Daniel & Ruth Okonkwo, Marcus Bell Trio.
Empty profile: Miriam Haile, new to Zamaro (no videos or reviews yet).
All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, Riverside Community Church, Burlington
- **Featured artist:** Abigail Mensah. The empty profile shows Miriam Haile, who is new.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- The display face falls back to Impact when Bebas Neue/Anton/Oswald are not installed; the product would self-host one.
- Every ticket links to Abigail’s profile, since there is only one full profile mock.
- Deposit (25%), artist fee (8%) and 14-day free cancellation are assumed.

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
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```
