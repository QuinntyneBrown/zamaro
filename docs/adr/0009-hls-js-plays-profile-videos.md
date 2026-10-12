# ADR-0009: Profile videos stream as HLS, played natively or by hls.js loaded on demand

**Date:** 2026-10-12
**Category:** frontend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

L2-014 asks for a profile's videos to stream in place with standard controls, captions when the
artist supplied them, and no autoplay. L2-052 transcodes uploads to adaptive renditions, and L2-087
and L2-088 keep the initial bundle small and start playback within 2 s on 10 Mbps.
`artist-profiles/view-artist-profile` left the player library for browsers without native HLS as
`<TO SUPPLY>`, and the video card's CRD (D-2) puts it behind an injection token, `ZM_HLS_LOADER`.

Safari plays HLS natively. Chromium and Firefox need Media Source Extensions and a library that turns
an HLS manifest into appended segments. The candidates were hls.js, Shaka Player and video.js:
- **hls.js** (Apache-2.0) plays HLS only, has no UI of its own and leaves the native `<video controls>`
  in charge, which is what the design system draws. It is about 150 kB compressed.
- **Shaka Player** plays DASH and HLS and brings its own UI and more weight; DASH is not needed.
- **video.js** wraps a player UI around hls.js-like tech; its controls replace the native ones the
  design system uses.

## Decision

- Uploads are packaged as HLS (fMP4 segments). The API returns the manifest as `stream`.
- `zm-video-card` gives a browser with native HLS (`canPlayType('application/vnd.apple.mpegurl')`)
  the manifest as `src`. Elsewhere it calls `ZM_HLS_LOADER`, whose default factory loads `hls.js` with
  a dynamic `import()`, so the library is its own chunk, fetched on the first press and never in the
  initial bundle.
- Tests and the perf-test app may bind a fake loader.
- `hls.js` is a frontend dependency at `^1.7.3`.

## Consequences

- Nothing about video is downloaded until a visitor presses play; the stream, captions and library
  all wait for the press.
- The native controls, captions menu and full screen are the browser's, so they need no styling or
  accessibility work of ours.
- M1's seeded stream is a 4-second VP9 sample in fMP4 segments, which Chromium plays through hls.js
  without proprietary codecs. M4's transcoder chooses the production codecs (H.264 for reach) in its
  own ADR.
- Replacing the library later touches only the loader's default factory.
