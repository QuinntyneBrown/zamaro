# Zamaro mocks — concept “Psalter”

**Psalter** treats booking worship like opening a well-made hymnal. The pages are
ivory paper and ink-black type with one deep oxblood accent. A Baskerville/Garamond
serif sets the display type and a quiet humanist sans (Gill Sans) handles the UI.
Margins are generous, sections are numbered (No. I, II., III.), and labels are
set in small caps between hairline and double rules. Artists appear as a numbered
register, profiles read like a title page, and the booking card sits in the margin.
The dark theme is the vestry by lamplight: warm brown-black with rose-oxblood ink.

| Token decision | Value |
|---|---|
| Accent | Oxblood `#731a29` (light) / `#dfa0a7` (dark): the only accent |
| Paper / ink | Canvas `#f4eee1`, ink `#1c1915`; dark canvas `#13100d`, text `#ece4d3` |
| Type | Serif (Baskerville, Garamond) for display and prose; Gill Sans / Segoe UI for UI |
| Shape | Square (0–2 px radii), hairline rules, double rules for the masthead and title page |
| Images | Engraving-style hatched “plates” with `role="img"` and descriptive labels |

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON.
Default search: Saturday 14 November 2026 · Burlington · within 100 km.
Artists (same as Vespers): Abigail Mensah (profile), Hosanna Collective, Marcus Bell Trio, Luz Viva,
Grace Tabernacle Mass Choir, Elijah Park, Daniel & Ruth Okonkwo. Empty profile: Miriam Haile (new).
Reviewers: Rev. Janet Clarke (St. Brendan’s Anglican, Oshawa), Tomi Oduya (Harvest Point Church, Milton),
Pastor Michael Osei (Bethel Pentecostal, Kitchener). All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, Riverside Community Church, Burlington (saved: Abigail Mensah, Elijah Park)
- **Featured artist:** Abigail Mensah. The empty profile shows Miriam Haile, who is new to Zamaro.

## How to open

Open `index.html` from disk. Add `?theme=dark` to force the dark theme and `?chrome=0`
to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- The brief’s shared items (saved artists, account, artist sign-up) live in the masthead,
  the Discover margin column and the colophon’s “For artists” panel, not as separate screens.
- The deposit (25%) and the 14-day free cancellation are assumptions shared with Vespers.
- Travel fees are shown as a separate ledger line. Who sets them is still open.

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
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/psalter --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/psalter
```
