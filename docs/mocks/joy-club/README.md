# Zamaro — Joy Club

Rounded tiles / citrus / musical mascot. A musical character cheers on your personal shortlist.

## Cast and catalog

Today: 9 October 2026. Default gathering: 14 November 2026, Toronto, within 100 km.
Booker: Naomi Fraser, Riverside Community Church, Burlington. Featured artist: Abigail Mensah,
gospel vocalist, Brampton, from CAD $650. Supporting artists and prices are shared across all concepts.
All artists, churches, availability, distances and reviews are fictional. Photography is visual reference only.

## Review

Open `index.html` from disk. Use `?theme=dark` or `?chrome=0`; T switches theme.
The eight views cover two pages in four states. Theme and responsive variants are runtime styles.
See [collection README](../README.md) for imagery provenance, interaction scope and validation.

## Open questions and assumptions

- Only Discover and Artist profile are in scope; no extra account, payment or sign-up pages.
- Empty artist means no videos or reviews yet; bio, photos and booking remain available.
- Only Abigail has a profile mock; other artists can be saved without misleading profile links.
- 15 November has no fixture availability; 14 and 21 November demonstrate available dates.
- Requests show local feedback only. No deposit, fee or confirmation policy is implied.
- Progressive scripts are included to demonstrate the motion and interactions explicitly requested.

## Commands

From the project root:

```powershell
python .agents/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/concepts/joy-club --write
python .agents/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/concepts/joy-club
```

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | Requirements |
|---|---|---|---|---|---|
| Discover artists (`discover`) | [✅](pages/discover/default.html) | [✅](pages/discover/loading.html) | [✅](pages/discover/empty.html) | [✅](pages/discover/error.html) |  |
| Artist profile (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |

<!-- coverage:end -->
