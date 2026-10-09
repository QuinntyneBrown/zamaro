# Zamaro mocks — concept “Vespers”

**Vespers** is evening prayer. This concept treats booking worship like stepping
into a sanctuary at dusk. It uses a deep violet sky, candle-gold accents, parchment
surfaces and serif headings (Iowan Old Style / Palatino). It should feel reverent
and warm without looking like a church bulletin. The dark theme is candlelit
rather than inverted.

| Token decision | Value |
|---|---|
| Accent | Dusk violet `#64409a` (light) / `#bfa2e2` (dark) |
| Highlight | Candle gold `#7f5d0c` text-safe (light) / `#e8c063` (dark), used for stars, rules and the hero glow |
| Neutrals | Warm parchment greys; dark canvas `#120f17` |
| Type | Serif display for h1–h3 and artist names; system sans for UI |
| Shape | Softer radii (10 / 16 / 24 px) |

This concept is one of several under `docs/mocks/<concept>/`. Each concept is
self-contained, with its own tokens, kit, manifest and gallery, so you can compare
them side by side.

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON.
Default search: Saturday 14 November 2026 · Burlington, ON · Sunday service.
Artists:
  Abigail Mensah — gospel & contemporary vocalist, Brampton, 120 km, from $650, 4.9 (38). Profile page.
  Hosanna Collective — five-piece band, Mississauga, from $1,800, 4.8 (61)
  Luz Viva — bilingual Spanish/English worship, North York, from $900, 5.0 (17), New
  Selah Strings — string quartet, Oakville, from $1,200, 4.9 (24)
  Grace Tabernacle Mass Choir — 30-voice choir, Scarborough, from $2,400, 4.8 (45)
  Elijah Park — solo acoustic, Markham, from $350, 4.7 (29)
  Daniel & Ruth Okonkwo — duo, Ajax, from $700, 4.9 (33)
  Marcus Bell Trio — contemporary/youth, Hamilton, from $950, 4.6 (19)
  Miriam Haile — new solo vocalist & pianist, Etobicoke, 60 km, $300, no reviews yet (empty profile)
Reviewers: Rev. Janet Clarke (St. Brendan’s Anglican, Oshawa), Tomi Oduya (Harvest Point Church, Milton).
All people and churches are fictional.
-->

- **Today:** Friday 9 October 2026
- **Booker:** Naomi Fraser, worship coordinator at Riverside Community Church, Burlington
- **Featured artist:** Abigail Mensah (Brampton). The empty profile shows Miriam Haile, who is new to Zamaro.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions & assumptions

- No specs exist yet. “Two main pages” is read as **Discover** (home + search
  results) and **Artist profile**.
- Search is by date first, because availability is the main constraint, then by
  place (driving distance) and kind of gathering.
- Pricing is shown as “from $X per service” plus a travel fee. It is still open
  whether artists set travel fees themselves or Zamaro calculates them.
- The deposit (25%) is held until after the event. This is assumed, not confirmed.
- Artist photography is represented by tokenised gradient artwork with
  descriptive `aria-label`s. Real photos replace these in the product.
- Every artist card links to Abigail’s profile, since there is only one
  profile mock.

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
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/vespers --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/vespers
```
