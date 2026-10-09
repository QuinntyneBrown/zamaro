# Zamaro mocks — concept “Lumen”

**Lumen** is light through stained glass. Every key surface is a *window*:
jewel-tone panes (sapphire, ruby, emerald, amber) set in charcoal leading, with
soft rays of light falling across them from the upper right. The product sits
on bright limewash white by day and deep charcoal by night, where the same glass
seems lit from within. Type is a confident geometric sans (Futura / Century
Gothic) for headings and controls, with a humanist sans for reading.

| Token decision | Value |
|---|---|
| Panes | Sapphire `#1f4fb0`, ruby `#a8162f`, emerald `#0d7449` (white text ≥ 5.7:1), amber `#f0a92a` (ink text ≈ 9:1). The same glass in both themes |
| Leading | `--color-lead` charcoal, 3 px between panes, 6 px window frames |
| Accent | Sapphire (light) / `#8fb0ee` (dark); focus ring is sapphire in light, amber in dark |
| Neutrals | Limewash white `#f8f6f1` canvas; charcoal `#121317` canvas in dark |
| Shape | Crisp glass (0–6 px radii); round-headed arches for portraits |
| Signature pieces | Leaded transom under the top bar, mosaic hero, single-light artist cards, rose-window logo, date tiles with jewel caps, four-light “How booking works” |

This concept sits next to the others under `docs/mocks/<concept>/`. It is
self-contained, with its own tokens, kit, manifest and gallery, and uses the same
cast as Vespers so the concepts can be compared side by side.

## Cast & catalog

<!--
Today: Friday 9 October 2026.
Signed-in booker: Naomi Fraser (NF), worship coordinator, Riverside Community Church, Burlington ON.
Default search: Saturday 14 November 2026 · Burlington · within 1½ hours' drive.
Artists:
  Abigail Mensah — gospel & contemporary vocalist, Brampton, 40 min, from $650, 4.9 (38). Profile page. Saved.
  Hosanna Collective — five-piece band, Mississauga, from $1,800, 4.8 (61)
  Elijah Park — acoustic & hymns, Markham, from $350, 4.7 (29)
  Grace Tabernacle Mass Choir — 30-voice choir, Scarborough, from $2,400, 4.8 (45)
  Luz Viva — bilingual Spanish/English band, North York, from $900, 5.0 (17). Saved.
  Daniel & Ruth Okonkwo — duo, Ajax, from $700, 4.9 (33)
  Marcus Bell Trio — contemporary/youth, Hamilton, from $950, 4.6 (19)
  Miriam Haile — new solo vocalist & pianist, Etobicoke, from $300, no videos or reviews yet (empty profile)
Reviewers: Tomi Oduya (Harvest Point Church, Milton), Rev. Janet Clarke (St. Brendan's Anglican, Oshawa),
  Pastor Delroy Whitfield (New Covenant Tabernacle, Brampton).
Empty search: Thursday 24 December 2026 (Christmas Eve).
All people and churches are fictional.
-->

## How to open

Open [index.html](index.html) from disk. Add `?theme=dark` or `?theme=light` to force
a theme, and `?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.

## Open questions and assumptions

- Scope follows `docs/mocks/GUIDELINE FOR MOCK.txt`: **Discover** and **Artist
  profile**, each in default, loading, empty and error. Saved artists, account and
  artist sign-up are reached from the shared header, the saved shortlist section
  and the “Join Zamaro” band on every page.
- Pricing is “from $X” plus a travel fee; whether artists or Zamaro set travel
  fees is still open. The 25% deposit and 48-hour reply window are assumed.
- Artist photography is CSS/SVG stained-glass artwork with descriptive
  `aria-label`s; real photos replace it in the product.
- Every artist card links to Abigail’s profile, the only profile mock.

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
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/lumen --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/lumen
```
