# ADR-0026: Application videos are uploaded in chunks with a small tus-style protocol

**Date:** 2026-10-13
**Category:** backend
**Status:** Accepted; amended by [ADR-0027](0027-nextjs-backend.md), which replaces the Laravel mechanisms named here
**Deciders:** Claude (M3 S10), with the user's OK on M3 D7

## Context

An applicant attaches at least one performance video of up to 1 GB and 15 minutes before any account
exists (L2-047.1, L2-052.1), and an upload over 50 MB must resume from the last completed chunk when
the connection drops (L2-052.5). The design (`apply-as-artist`) left the chunked-upload protocol and
the retention of unattached videos `<TO SUPPLY>`. The S6 pipeline (`scan-and-serve-uploads`, ADR-0024)
already types a file by its bytes, quarantines it, scans it and promotes it; it took whole files from
a signed-in person.

## Decision

1. **A small tus-style protocol on three public routes, keyed by a token.**
   - `POST /api/v1/artist-applications/videos` with JSON `title` (5–100 characters), `fileName` and
     `size` (1 byte to 1 GB) answers 201, `Location` and the video with its `token`: 64 hex characters
     from 32 random bytes, the only key to the upload and the handle the application names (S11).
   - `PATCH /api/v1/artist-applications/videos/{token}` takes one chunk as
     `application/offset+octet-stream` (415 otherwise), up to 8 MB (the route's `uploads:8192`, 413
     above it), with `Upload-Offset` saying where it starts. It must start where the upload ends,
     else 409 `upload-offset-mismatch` with the upload's `Upload-Offset`. 204 answers with the new
     `Upload-Offset`.
   - `GET` and `HEAD` on the same address answer `Upload-Offset` and `Upload-Length`; the body (on
     GET) says whether the video is uploading, processing, live (with its length and poster) or failed
     (with its reason). A browser resumes by asking HEAD and continuing from the answer.
2. **Each chunk is its own part on the quarantine disk** (`video-parts/{token}/{offset}`), through
   `Storage::disk()` as ADR-0024 requires, so no chunk rewrites what came before and the disks can move
   to object storage unchanged. The row is locked while a chunk is appended, so two chunks sent at once
   cannot both be accepted.
3. **The last chunk hands the whole file to the S6 pipeline.** The parts are joined into one quarantined
   object under a random name, the type is read from the first bytes (`ContentTypeDetector::detectBytes`),
   an `Upload` with no user is created, and `ScanUpload` is queued. A file that is not an MP4, MOV or
   WebM, or is markup, fails the video there with the purpose's message and leaves nothing behind.
   `PromoteUpload` then hands a clean video to `ProcessApplicationVideo`, which probes it (over 15
   minutes fails with its reason and the original is deleted) and transcodes it through the
   `VideoTranscoder` port (`FakeVideoTranscoder` until M10 picks the vendor) into
   `applications/videos/{id}/` on the media disk. Malware fails the video with its reason through
   `RejectInfectedUpload`.
4. **Unattached videos live 24 hours.** `uploads:prune-unattached` runs daily at 04:00 and deletes the
   row, its parts, its original, its renditions and its upload row when no application has claimed the
   token.

## Options Considered

### Option 1: a small tus-style protocol (chosen)
- **Pros:** one request per chunk with a plain offset is easy for the browser to resume and for the API
  to police (size, type, offset); it fits the existing body-size and JSON middleware through the
  route's `uploads:` mark; the token doubles as the application's handle.
- **Cons:** not the full tus specification (no `Upload-Metadata`, no `Tus-Resumable` negotiation), so
  an off-the-shelf tus client would need its headers mapped.

### Option 2: full tus
- **Cons:** the extra headers and the OPTIONS discovery buy nothing for one first-party client.

### Option 3: S3 multipart upload with pre-signed part URLs
- **Cons:** the quarantine disk is local until M4 (ADR-0024), and the scan must see the whole file
  before anything is promoted; pre-signed parts would bypass the pipeline's front door.

## Consequences

### Positive
- Resuming is a HEAD and a PATCH; the browser keeps no state but the token.
- The S6 pipeline stays the only way a file leaves quarantine.

### Negative
- Joining the parts reads the whole file once more on the API; a 1 GB upload costs a temporary file.
- The token in the URL is a bearer secret: it is never logged in full, and the request logger masks
  it as any path parameter.

## Links
- ADR-0024, `docs/detailed-designs/artist-onboarding/apply-as-artist/README.md`,
  `docs/plans/m3-artist-onboarding-and-admin.md` (D7, S10)
