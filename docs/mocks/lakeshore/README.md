# Zamaro — Lakeshore mocks

Concept **Lakeshore**: map-led and local. Discovery centres on a stylised SVG map of Toronto and the
region (Lake Ontario shoreline from Hamilton to Oshawa, Barrie to the north, Kitchener-Waterloo to the
west) with drive-time rings around the church and numbered pins that match the artist list. Lake blue
for water and wayfinding, sand for land and page, a warm coral accent for pins and primary actions,
rounded shapes and a humanist sans. Dark theme is "the lake at night".

Scope: `../GUIDELINE FOR MOCK.txt`. Open [index.html](index.html) from disk; add `?theme=dark` or
`?chrome=0` to any page.

## Cast and catalog

- Today: Friday 9 October 2026. Searched date: Saturday 14 November 2026.
- Signed-in user: Naomi Fraser, booking for Brant Street Community Church, 2186 Brant St, Burlington.
- Saved artists (3): Abigail Mensah, Luz Viva, Elijah Park.
- Featured artist: Abigail Mensah, Brampton, 38 min drive, from $650, 4.9 from 38 reviews.
- Discover list: Hosanna Collective (Mississauga, 26 min), Marcus Bell Trio (Hamilton, 19 min),
  Luz Viva (North York, 52 min), Grace Tabernacle Mass Choir (Scarborough, 61 min), Elijah Park
  (Markham, 58 min), Daniel & Ruth Okonkwo (Ajax, 74 min), Selah Strings (Oakville, 15 min).
- New artist (artist/empty): Miriam Haile, Etobicoke, 31 min, $300, no videos or reviews yet.

## Open questions

- Drive times are shown for the chosen date and start time; whether they should reflect traffic is undecided.
- The map is a stylised illustration, not a tile map; the list is the accessible equivalent of the pins.

## Re-check and re-screenshot

    python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/lakeshore --write
    python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/lakeshore --out <scratch folder>

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | Requirements |
|---|---|---|---|---|---|
| Discover artists (`discover`) | [✅](pages/discover/default.html) | [✅](pages/discover/loading.html) | [✅](pages/discover/empty.html) | [✅](pages/discover/error.html) |  |
| Artist profile (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |

<!-- coverage:end -->
