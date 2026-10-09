# Ten ways to gather — Zamaro concepts

Open [the visual gallery](index.html). Each named direction contains **Discover artists**
and **Artist profile**, with default, loading, empty and error views.

**10 concepts · 20 screen interpretations · 80 page-state HTML files · 11 galleries.**
The collection is standalone and preserves the earlier concepts beside this folder.

| Concept | Visual direction | Distinct interaction |
|---|---|---|
| [Spotlight](spotlight/index.html) | Arched portraits, ivory, gold, theatrical serif | Slide the featured performer |
| [Cloud Nine](cloud-nine/index.html) | Sky blue, floating rounded portrait, cloud companion | Character tilts on interaction |
| [Encore](encore/index.html) | Large sans type, coral, slanted portrait, horizontal rail | Swipe or scroll the artist rail |
| [Halo](halo/index.html) | Circular imagery, pearl, lavender, very open spacing | Pointer-responsive WebGPU halo |
| [Gather](gather/index.html) | Warm paper, photo collage, illustrated host | Three-voice shortlist progress |
| [Constellation](constellation/index.html) | Orbiting portraits, fine paths, violet | WebGPU stars and shortlist progress |
| [Sunday Paper](sunday-paper/index.html) | Editorial rules, monochrome images, serif columns | Quiet image zoom and tactile controls |
| [Joy Club](joy-club/index.html) | Rounded tiles, citrus, musical companion | Shortlist progress and save celebration |
| [Reverie](reverie/index.html) | Sage, wide panoramic compositions, linen | User-controlled image slides |
| [Headliner](headliner/index.html) | Oversized condensed type and stage portrait | Switch the featured performer |

## Cast and catalog

All artists, churches, reviews and availability are fictional. Photographs are mood/reference
imagery, not representations of actual Zamaro artists or their religious affiliation.

- Today: Friday 9 October 2026. Default event: Saturday 14 November 2026, Toronto, within 100 km.
- Booker: Naomi Fraser, Riverside Community Church, Burlington.
- Abigail Mensah: solo gospel vocalist, Brampton, from CAD $650; the single fully mocked profile.
- Hosanna Collective: band, Mississauga, from CAD $1,800.
- Elijah Park: acoustic and hymns, Markham, from CAD $350.
- Luz Viva: Spanish/English worship, North York, from CAD $900.
- Grace Tabernacle Choir: gospel choir, Scarborough, from CAD $2,400.
- Daniel & Ruth: acoustic duo, Ajax, from CAD $700.
- Sample reviewer: Tomi Oduya, Harvest Point Church, Milton.

## Opening and interaction

Open `index.html` directly from disk. Everything needed to display the collection is local.
Page links preserve the current theme and chrome visibility.

- `?theme=dark` / `?theme=light`: force a theme; press **T** outside an input to toggle.
- `?chrome=0`: hide review controls and prototype notes.
- Date, style, budget and radius filters use a small local fixture dataset.
- **15 November 2026** demonstrates no availability; **14 or 21 November** demonstrates an available date.
- Location text updates the search summary; distances are fixed illustrative GTA values, not geocoded routes.
- Saving updates the heart, shared shortlist count and playful progress indicators. Browser storage is used
  when available, with in-memory behavior when it is blocked. No account or network is required.
- Featured artist arrows work by keyboard and pointer. Encore's artist rail also supports touch scrolling.
- Only Abigail's profile is mocked. Other performers can be saved without incorrectly opening her profile.
- Booking validates the date and shows explicit **demo request** feedback; nothing is sent.
- Performance preview opens an explanatory preview panel. No licensed artist video was supplied, so no
  recording is played. Photos, bio, songs and church reviews remain present in the default view.
- Saved artists, account and artist sign-up information appear inline. No extra product pages or dialogs.

Halo and Constellation use a real WebGPU render pipeline. A pause control, reduced-motion handling,
background-tab suspension and a static fallback are included. Unsupported GPUs keep the photography and
CSS artwork intact. For a secure local browser context, serve the project root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/docs/mocks/concepts/index.html`.
WebGPU implementation reference: [W3C WebGPU specification](https://www.w3.org/TR/webgpu/).

## Assets and provenance

The SVG cloud/host characters are original code-native illustrations created for this collection.
System fonts are used; there are no CDN runtime dependencies.

The following Unsplash reference images were downloaded on 9 October 2026 and stored locally.
Source URLs identify the exact original image; all use `auto=format&fit=crop` with JPEG delivery.
See [Unsplash license](https://unsplash.com/license). Reference imagery does not imply endorsement.

| Local asset | Source image |
|---|---|
| `assets/portrait.jpg` | https://images.unsplash.com/photo-1534528741775-53994a69daeb |
| `assets/elijah.jpg` | https://images.unsplash.com/photo-1500648767791-00dcc994a43e |
| `assets/band.jpg` | https://images.unsplash.com/photo-1511379938547-c1f69419868d |
| `assets/guitar.jpg` | https://images.unsplash.com/photo-1510915361894-db8b60106cb1 |
| `assets/vocalist.jpg` | https://images.unsplash.com/photo-1516280440614-37939bbacd81 |
| `assets/stage.jpg` | https://images.unsplash.com/photo-1506157786151-b8491531f063 |
| `assets/crowd.jpg` | https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3 |

## Structure and rebuilding

Each concept owns its manifest and eight static HTML files. Its asset entry points import one shared
component kit and the concept-specific token/layout rules. Edit the shared generator to keep copies
consistent; generated HTML does not require Python to view.

From the project root:

```powershell
python docs/mocks/concepts/build.py
python docs/mocks/concepts/gallery.py
Get-ChildItem docs/mocks/concepts -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'manifest.json') } |
  ForEach-Object { python .agents/skills/writing-html-mocks/scripts/check_mocks.py $_.FullName --write }
python docs/mocks/concepts/verify.py
python .agents/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/concepts --out docs/mocks/concepts/.cache/screenshots
```

Verification requires Python `playwright` and `pillow`, plus `python -m playwright install chromium`.
The preview JPEGs are intentional gallery assets. Full screenshots and reports stay in ignored `.cache/`.

## Open questions and assumptions

- The supplied guideline is the source of scope; no L1/L2 specs or application code exist yet.
- The two-page limit takes precedence over the skill's full-product screen inventory.
- Default, loading, empty and error views are separate files; validation and success are demonstrated inline.
- Empty profile means no videos or reviews, not a missing artist. Profile essentials remain visible.
- Prices and driving distances are illustrative; no deposit, travel-fee or response-time policy is assumed.
- Progressive JavaScript is intentional for the expressly requested sliders, micro-animations and WebGPU.
- The collections are visual explorations. After choosing a direction, use `extracting-design-systems`
  to develop the selected design into the production design system.

## Validation

See [VALIDATION.md](VALIDATION.md) for the completed browser and visual checks.
