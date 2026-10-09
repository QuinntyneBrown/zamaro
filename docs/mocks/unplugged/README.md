# Zamaro mocks — concept “Unplugged”

**Unplugged** is the acoustic set of [Setlist](../setlist/README.md). It keeps
Setlist's idea (a lineup of artists, a setlist of songs, a booking stub) but
turns the volume down:

- **Less text.** Labels replace sentences. Explanations live in small
  popovers, and long lists collapse behind “more”.
- **More white space.** Sections sit on a `clamp(5rem, 11vw, 9.5rem)` rhythm,
  inside a 68 rem container with wide gutters.
- **Lower contrast.** Body text is about 8:1 instead of 19:1. There are no hard
  shadows or pure black, and borders are hairlines.

The palette is live. Viewers can swap presets, mix their own colours and set
the contrast themselves.

| Token decision | Value |
|---|---|
| Seeds | `--seed-ink`, `--seed-paper`, `--seed-accent`, `--seed-tint-a`, `--seed-tint-b` and `--contrast` (60–100, default 90). Everything else is derived. |
| Derivation | Relative colour syntax (`oklch(from …)`), `color-mix()` and `light-dark()`. The dark theme is computed from the same seeds. |
| Accent | A fill only. Text on it flips light or dark from the accent's own lightness (`clamp()` step trick). |
| Type | Light condensed display (Bahnschrift / Avenir Next Condensed) for names and dates only. System sans at 17 px / 1.7 for everything else. |
| Shape | 14–24 px radii, 1 px hairlines and one soft shadow tier. |
| Photos | Grey-scale photos are blended (`luminosity`) over a palette tint, so they recolour with the palette. They return to full colour on hover. |

## Palette presets

Six hand-curated five-swatch themes in the style of Adobe Color
(color.adobe.com). Adobe's pages can't be read as data, so the hex values were
chosen here. At the default contrast, body text and muted text both pass AA
(≥ 4.5:1) in the light and dark themes.

| Preset | Ink | Paper | Accent | Tint A | Tint B |
|---|---|---|---|---|---|
| Newsprint Soft (default) | `#3b3a36` | `#f6f3ea` | `#f2d36b` | `#e9dcae` | `#d8d3c4` |
| Sage & Linen | `#34413a` | `#f3f0e7` | `#c9825f` | `#b9c4a7` | `#dcd3bf` |
| Dusty Rose | `#4a3442` | `#f8f0ef` | `#d99aa5` | `#e8c6c4` | `#cdb8c6` |
| Harbour Fog | `#2f3b48` | `#f1f3f3` | `#c7a35a` | `#b7c6d3` | `#d9dcd6` |
| Clay Studio | `#47342a` | `#f5eee4` | `#a65a33` | `#e2c3a3` | `#b9b48f` |
| Lavender Hour | `#3c3550` | `#f5f3f7` | `#d6b25e` | `#cdc3e3` | `#e3dccb` |

The **Palette** button in the top bar opens a panel with these controls:

- **Presets**, which cross-fade with a View Transition.
- **Ink / paper / accent** pickers. The two photo tints follow the colours you pick.
- **Contrast** slider, with a live WCAG readout for body and muted text. It warns below AA, which starts at about 84.
- **Surprise me**, which makes a random OKLCH palette (a hue plus a complementary accent).
- **Pick accent**, an EyeDropper that picks the accent from anywhere on screen (Chromium only).
- **Copy CSS** and **Reset**.

The palette is saved to `localStorage`, and sharing works through the URL:
`?palette=sage&contrast=85`, or
`?palette=custom&colors=3b3a36.f6f3ea.f2d36b.e9dcae.d8d3c4`. Mock-bar links
carry the palette to sibling states.

## Newer browser features

Each feature is optional. In a browser without one, the page still works.

| Feature | Where | Without it |
|---|---|---|
| Cross-document View Transitions (`@view-transition`) | Abigail's photo and name morph from Discover into her profile | Normal navigation |
| `@property`-registered colours | Palette changes glide when View Transitions are missing | Instant swap |
| Relative colour syntax, `light-dark()`, `color-mix()` | The whole token system | Needs a 2024+ browser |
| Scroll-driven animations (`animation-timeline: view()` / `scroll()`) | Cards rise in as they scroll into view; reading-progress hairline | Static |
| Popover API + anchor positioning (`position-area`, `position-try-fallbacks`) | Palette, Saved and “How it works” notes sit next to their buttons | Popovers centre on screen |
| Interest invokers (`interestfor`) | “How it works” notes open on hover or focus | Click to open |
| Invoker commands (`commandfor` / `command`) | Video buttons open and close the player `<dialog>` without JS | `mock.js` fallback |
| `@starting-style` + `allow-discrete` | Popovers, dialog, toasts and select pickers animate in and out | Instant |
| Customizable select (`appearance: base-select`) | Soft rounded pickers | Native select |
| `interpolate-size` + `::details-content` | “4 more songs” and “2 more reviews” expand smoothly | Instant expand |
| Scroll-state container queries | The top bar gains a hairline and shadow only once it is stuck | Always flat |
| `field-sizing: content` | The booking message grows as you type | Fixed rows |
| `:has()` | Hovering one ticket dims the others; the search glows while focused | No dimming |
| Speculation Rules | Hovering a ticket prerenders the profile (served over http only) | Normal load |
| `text-wrap: balance / pretty` | Headings and short copy | Normal wrapping |

`prefers-reduced-motion` turns all motion off, including view transitions.

## Cast & catalog

<!--
Today: Friday 9 October 2026. Same cast as Setlist and Vespers so the concepts compare side by side.
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
- **Photos:** mood imagery from `docs/mocks/assets/`, resized into `assets/img/`. The photos do not show the fictional artists.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and
`?chrome=0` to hide the mock bar and notes. Press `t` to toggle the theme.
View Transitions and Speculation Rules need the mocks served over http, for
example with `python -m http.server` from `docs/mocks`.

## Open questions & assumptions

- In the product, the palette would belong to the church's account, not to each viewer. Here it is a design-review tool.
- If the church picks a custom palette below AA, should we block it or only warn? The mock only warns.
- Every ticket links to Abigail's profile, since there is only one full profile mock.
- Deposit (25%) and 14-day free cancellation are assumed, matching Setlist.

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
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/unplugged --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/unplugged
```
