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
| Muted / subtle | `#5a5853` (6:1) and `#67655f` (4.9:1 on the warmest surface) on light; `#b5b2aa` and `#97948d` on dark |
| Accent | Butter yellow `#f3cc3f`, a fill colour only on light (text on it is always ink, 8:1); text-safe on dark (10:1) |
| Type | Condensed display (Bebas Neue / Anton / Oswald / Impact fallback), uppercase; Helvetica/Arial body at 1.6 leading; mono for stub small print |
| Shape | Square corners, 2–4 px rules in charcoal (not ink), hard offset shadows instead of blur |
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
