# ADR-0014: Visual parity runs on a self-hosted display face with one baseline set per platform

**Date:** 2026-10-10
**Category:** testing
**Status:** Accepted
**Deciders:** Claude (M1 close, visual and axe suites)

## Context

`adapt-layout-to-screens` asks for a Playwright suite that captures every route state in
`e2e/routes.manifest.ts` at one width per viewport class (320, 576, 768, 992 and 1200 px) and fails
on any unreviewed difference (L2-096.2). The design left the threshold and the themes `<TO SUPPLY>`;
M9's D22 recommends `maxDiffPixelRatio: 0.001` in both themes unless M1 fixed a value. The M1 plan's
risks say the suite should run in the Playwright Docker image with Bebas Neue self-hosted.

Two things made captures depend on the machine:

- **The display face.** The tokens name `"Bebas Neue", "Anton", "Oswald", Impact, …`, and the
  typography foundation says the product self-hosts Bebas Neue, but nothing served it. Every
  headline therefore rendered in Impact on Windows and in a plain sans in the Linux image, so a
  baseline from one machine could never match another.
- **Text rendering.** Even with the same fonts, Chromium on Windows and on Linux rasterise text
  differently, and the body stack (`Helvetica Neue, Helvetica, Arial, …`) resolves to different
  files. No threshold that still catches layout regressions absorbs that.

The suite also has to work on the development machine, a Windows host, where the e2e API and the
seeded database run in Docker Compose but Playwright runs natively.

## Decision

1. **Self-host Bebas Neue from `@fontsource/bebas-neue`.** Each application copies the Latin and
   Latin Extended `woff2` files to `/fonts/` through an `angular.json` asset glob, so the address is
   stable. `projects/components/src/styles/fonts.scss` declares the faces (`font-display: swap`,
   with the package's unicode ranges), and the zamaro shell preloads the Latin file. The font is
   not committed; the package version pins it.
2. **One baseline set per platform.** Playwright's default snapshot names carry the platform, so
   `visual/visual.spec.ts-snapshots/` holds a `-win32` set made on the Windows host and a `-linux`
   set made in `mcr.microsoft.com/playwright:v1.64.0-noble`. `npm run test:docker` (`e2e/run-in-docker.mjs`)
   seeds the e2e database on the host and runs Playwright in that image against the host's API
   (`E2E_API_ORIGIN=http://host.docker.internal:8001`). The Linux set is the one CI uses when the
   e2e job is added.
3. **Threshold and themes:** `maxDiffPixelRatio: 0.001` (M9 D22), animations disabled, caret
   hidden, full-page captures in the light and dark themes, five widths each. Parts the frozen clock
   cannot hold still are masked (the rate-limit countdown).

## Options Considered

### Option 1: Docker only, with one Linux baseline set
- **Pros:** one set of images; matches CI.
- **Cons:** every local run of the suite (and of the full e2e run) needs the image and the
  host-gateway networking; a plain `npx playwright test` on Windows fails on missing snapshots.

### Option 2: Windows only
- **Pros:** one set; the simplest local loop.
- **Cons:** CI runs on Linux and could never pass; the plan asks for the Docker image.

### Option 3: Both platforms (chosen)
- **Pros:** the local run and the image each compare like with like; no font-rendering tolerance
  hides real changes.
- **Cons:** about 55 MB of PNGs for 13 states, and an intended design change regenerates both sets.

### Font delivery: Google Fonts CDN, a committed `woff2`, or the npm package (chosen)
- The CDN adds a third-party origin to every page (privacy, CSP in M9) and a network dependency in
  tests. A committed file works but hides its version and licence. The npm package carries the OFL
  licence and a version, and the asset glob gives a stable URL to preload.

## Consequences

### Positive
- Headlines render in the designed face everywhere, so captures are deterministic and match the
  design system.
- The visual and axe suites run in the ordinary `npx playwright test` on this host and in the image.

### Negative
- Baselines double in size and in upkeep: run `npx playwright test visual --update-snapshots` and
  `npm run test:docker -- visual --update-snapshots` together, and review both.
- Bebas Neue is narrower than the mocks' Impact fallback, so headings wrap differently from the
  mocks; the mocks stay the reference for layout, not for glyph widths.

### Risks
- A Playwright upgrade changes the image tag and the browser build; both sets must be regenerated
  in the same change.
- Docker Desktop must support `host-gateway`; on a host without it, set `E2E_API_ORIGIN` to an
  address the container can reach.

## Implementation Notes

- `e2e/routes.manifest.ts` names each state; `e2e/fixtures/route-states.ts` opens it (holding,
  failing or rate-limiting requests through the page objects) and waits until images and fonts
  are ready (`Shell.settle()`).
- The axe suite (`e2e/a11y/`) reads the same manifest; it has no baselines and runs the same on
  both platforms.

## References

- `docs/detailed-designs/user-experience/adapt-layout-to-screens/README.md`
- `docs/detailed-designs/user-experience/meet-accessibility-standards/README.md`
- `docs/design-system/foundations/typography.html`
- `docs/plans/m1-foundations-and-browse.md` (Known risks), `docs/plans/m9-hardening.md` (D22)
