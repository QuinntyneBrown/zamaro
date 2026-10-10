# ADR-0010: hls.js plays adaptive video where the browser cannot, loaded on demand

**Date:** 2026-10-10
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner (accepted default, 2026-10-10), Claude

## Context

Profile videos stream as HLS: L2-052 transcodes uploads to 360p, 720p and 1080p renditions behind a
manifest, and L2-014 plays them in place with native controls, captions and no autoplay. Safari and,
since recent releases, Chrome play an HLS manifest set as a `<video>` `src`. Firefox and older
Chromium-based browsers do not; they need a library that feeds the stream to Media Source
Extensions. `view-artist-profile` left that library as `<TO SUPPLY>`, and the video card CRD (D-2)
asks for a dynamic import behind an injection token so the library stays out of the initial bundle
(L2-087) and tests can bind a fake.

The profile is server-rendered and is a budgeted page, so whatever we pick must cost nothing until a
booker presses play.

## Decision

- `zm-video-card` plays the manifest natively when `video.canPlayType('application/vnd.apple.mpegurl')`
  says it can, and otherwise through **hls.js** (`hls.js@^1.7`).
- hls.js is reached only through `ZM_HLS_LOADER` (`components/src/lib/video-card/hls-loader.ts`), whose
  default factory runs `import('hls.js')` on the first press. The build puts it in its own lazy chunk.
- The loader configures `capLevelToPlayerSize`, so the first rendition fits the frame and playback
  starts quickly (L2-088).
- Captions stay a native `<track kind="captions" default>` on the `<video>`, in both paths; hls.js
  does not handle subtitles here.

## Options Considered

### Option 1: hls.js behind a lazy loader (chosen)
- **Pros:** The de facto MSE HLS player; plays the manifests L2-052 produces with no server change;
  small API (`loadSource`, `attachMedia`, `destroy`); no UI of its own, so the native controls stay.
- **Cons:** About 590 kB raw (roughly 170 kB compressed) in its chunk; another dependency to keep
  current.

### Option 2: Video.js or Shaka Player
- **Pros:** Full players with their own skins, DASH support (Shaka) and plugins.
- **Cons:** Larger, ship their own controls and styling that fight the design system's native-controls
  choice, and add a second HLS implementation we would not use.

### Option 3: Native playback only
- **Pros:** No dependency.
- **Cons:** Firefox and older Chromium browsers could not play any video, which fails L2-014.2.

### Option 4: Progressive MP4 instead of HLS
- **Pros:** Every browser plays it natively.
- **Cons:** No adaptive bitrate, so a 1080p file on a slow connection misses the 2-second start of
  L2-088; contradicts L2-052's renditions.

## Consequences

### Positive
- No video code is downloaded until a press, and none at all in browsers with native HLS.
- Tests and the perf-test app bind a fake loader; the e2e suite covers both paths (Chromium plays
  natively, and a spec hides native HLS to exercise hls.js).

### Negative
- Two playback paths to keep working. A failure in either shows the card's "This video didn't load"
  message after an error or 10 seconds without playback.

### Risks
- Browser support for native HLS keeps changing; the `canPlayType` check decides per browser, so no
  user-agent sniffing is needed.

## Implementation Notes

- In M1 the manifests, segments, posters and captions come from the API's local `media` disk under
  `/media` (no object storage until M4); the SSR server and the dev proxy forward `/media` to the API.
  M4 points `zamaro.media.disk` at object storage behind the CDN without changing the player.
- The card creates the `<video>` only after a press and destroys the hls.js instance when the card is
  destroyed or fails.

## References

- `docs/specs/components/video-card.md` (D-2, D-3, D-7)
- `docs/detailed-designs/artist-profiles/view-artist-profile/README.md`
- L2-014, L2-052, L2-087, L2-088
