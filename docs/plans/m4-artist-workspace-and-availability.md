# Milestone 4 plan: artist workspace and availability

**Status:** Not started; depends on M1–M3.

## Context

**What exists after M3:**
- **Public side (M1):** the profile at `/artists/{slug}` serves photos, videos (hls.js, ADR-0009), reviews and tour dates.
  - **Media:** the seeded photos and videos come from the API's local disk. The user decided against object storage in M1.
  - **Slugs:** `slug_histories` and the 301 for a renamed slug are in place (ADR-0010).
  - **Tables M4 builds on:** `artists` (with `pronoun`, `headline`, `about_heading`, `bio`, `languages`), `artist_styles` (string values of `App\Enums\Style`), `setlist_songs` (`writer`, `key` as `App\Enums\MusicalKey`, the deferrable `(artist_id, position)` unique), `availability_rules`, `availability_overrides`, `bookings` (number, status, event_date, kind, church_name, church_city only), `booking_transitions`, `reviews`, `review_replies` and `artist_ratings`.
  - **Search:** `AvailabilityService::freeArtistIds()` already applies the override-then-weekly-default rule.
- **M2:** sessions, `auth:sanctum` on `routes/api.php`, `role:` middleware that answers 404, rate limits, log redaction, the email foundation (Mailpit), Horizon jobs, the form components and toasts.
- **M3:**
  - The Artist role, granted on approval. Approval assigns the slug and the ticket number.
  - The admin app and the audit log.
  - The upload pipeline from `security/scan-and-serve-uploads`: `uploads`, `ContentTypeDetector`, the `MediaScanner` port with its fake, `RecordSecurityEvent`, `ReceiveUpload` and `ScanUpload`.
  - The Vulnerable Sector Check upload, and chunked application-video uploads.
  - Files stay on local Laravel disks, following the M1 storage decision.

**Goal:** an approved artist runs their side of Zamaro from `/artist/*`:
- a dashboard;
- a profile editor with preview, address, setlist, photos and videos;
- an 18-month availability calendar that stays consistent with bookings;
- a secret iCalendar feed.

Uploads bring S3-compatible object storage, with its own ADR, and the M1 and M3 files move off local disk. Every workspace change reaches the public profile within 60 seconds through one cache-invalidation path, which also gets its own ADR. The work follows AGENTS.md:
- ATDD;
- thin slices using the `implementing-incrementally` skill;
- one page object per screen and one dialog object per dialog;
- a perf scenario for every new `zm-*` component, including the availability calendar month composite;
- no architecture tests.

## Entry criteria and dependencies

- **M1 done through S16.** If S16 is skipped, `zm-toast` and `zm-toast-region` come from M2. The `bookingRequests` flag mechanism exists.
- **M2 provides:**
  - `signInAs(cast)` e2e fixture for Abigail Mensah, Miriam Haile, Elijah Park and Naomi Fraser.
  - `EnsureUserHasRole` (`role:artist`), which answers 404.
  - `PrivateNoStore` on the authenticated group.
  - The anonymous limit of 120/min per IP.
  - Log redaction rules that M4 can extend.
  - Queued mail through Mailpit.
  - Form components: `zm-text-field`, `zm-select`, `zm-textarea`, `zm-checkbox`, `zm-error-summary`, `zm-banner`, `zm-avatar`.
  - The signed-in account menu, with its artist variant from `dialogs/account-menu/artist`.
- **M3 provides:**
  - Abigail and Miriam as approved, published artists with users. Naomi Fraser as a church account.
  - `GenerateArtistSlug`, called on approval.
  - The VSC upload dialog (`dialogs/upload-check`) and its status components, so the editor's Background check section can host them.
  - `ArtistVideo` rows written by the application flow.
- **Check against the M3 plan when M4 starts:**
  - whether M3 built `VideoTranscoder` and its fake;
  - which chunk protocol M3's application videos use.

  If M3 already built the transcoder, S15 reuses it. If M3 used a different chunk protocol, S14 moves the application upload onto the M4 protocol (see conflict C9).
- **API image:** Imagick with libheif and AVIF support, plus `ffprobe`. S12 and S14 add them if they are missing.
- **Out of scope:** the requests inbox and the request page (M5), Earnings (M6) and Your reviews (M7). M4 links to them only behind flags (decision D2).

## Decisions to make or confirm

Each decision has a recommended default. Those marked **Needs your OK** wait for the user.

**Cross-cutting**
- **D1 — e2e clock.** **Needs your OK.**
  - **The problem:** the artist-side mocks are drawn at about Fri 9 Oct, 3:15 p.m.: "Good afternoon, Abigail", "1 day left · reply by Sat 10 Oct, 3:15 p.m." and "2 days 19 hr left". Riverside's request was sent at 10:15 a.m. The e2e clock is frozen at 10:00.
  - **Default:** move `page.clock`, and the time the stub API answers as of, to Fri 9 Oct 2026 15:15 America/Toronto for the whole suite. M1's specs depend only on the date; re-run them once. Backend Feature tests set their own time with `travelTo`.
- **D2 — Links to screens of later milestones.** **Needs your OK.**
  - **Behind flags (default):** M1's footer rule, "link only to screens that exist", applies here. Three off flags hide the links:
    - `artistRequests` (M5): the Requests nav link and badge, "Answer requests", "All requests", "Open requests", the "Open request" toast action, and the church links on dashboard and calendar rows. The rows show the church name as text.
    - `earnings` (M6): the Earnings nav and footer links, and the "Fees and payouts are on Earnings." sentence.
    - `artistReviews` (M7): "All reviews".
  - **No earnings card.** The mock and the design have none: the dashboard deliberately shows no money totals (L2-039; the mock note reads "No money totals here; they live on Earnings").
  - **The only money on the dashboard** is each row's "$650 quoted · you get $598", which `PriceBreakdown` computes (D3). M6 turns the `earnings` flag on and adds nothing else to the dashboard.
- **D3 — Pull the read side of the requests inbox forward.** **Needs your OK.**
  - **Why:** the dashboard rows, the calendar's Requested days and the feed need booking columns that M5 owns.
  - **Default:** M4 adds them as expand columns, which M5 will write:
    - `respond_by` and `start_time` (S3)
    - `church_address` (S7)
    - `quoted_price_cents` (S8)
    - `church_distance_km` and `request_message` (S16)
  - M4 also builds the read-only pieces: `ListArtistRequests`, `ArtistRequestResource`, `PriceBreakdown::forBooking()` (8% fee) and `ContactMasker` (L2-046). M5 extends them; it does not replace them.
- **D4 — Pull the decline transition forward.** **Needs your OK.**
  - **Default:** S6 builds `BookingStateMachine` with only Requested → Declined and Accepted → Declined, plus the `RequestDeclined` email to the booker with the reason and 3 similar artists (L2-030, L2-063).
  - M5 adds every other transition and owns the email's final template.
- **D5 — Rendering of `/artist/**`.** Default: `RenderMode.Client`, unless M2 has already set a rule for signed-in pages. This keeps personal HTML and private API responses out of SSR and the transfer cache. The greeting comes from the session.
- **D6 — Background jobs in e2e.** Default: none run. A spec sees Processing, then Ready, Live or Failed, because its stub-API fixture answers the next poll with the job's outcome. The jobs themselves are proven in backend Feature tests, and end to end on the dev stack's worker.

**Object storage**
- **D7 — Local S3 server.** **Needs your OK.**
  - **Default:** RustFS, with Garage as the fallback. S1 picks whichever first passes a scripted check:
    - multipart upload;
    - presigned PUT and GET;
    - ListParts;
    - bucket CORS that exposes `ETag`.
  - **Production:** the vendor, in a Canadian region (L2-084), is the M10 ADR.
- **D8 — Buckets.**
  - `zamaro-quarantine`: private, with CORS `PUT` from the web origin and a 24-hour lifecycle.
  - `zamaro-private`: VSC documents.
  - `zamaro-media`: public-read objects under random keys.
  - In development the media host is `http://localhost:9000/zamaro-media`, standing in for the media domain. The production media domain name is set in M10.

**Dashboard**
- **D9 — Row counts.** Up to 5 open requests. "Coming up" shows the Confirmed dates of the current and next month, up to 5, the same set as the "Confirmed dates" tile. The caption counts the later ones.
- **D10 — Payout setup.** No "Set up payouts" prompt in M4, because no mock shows one. M6 decides.
- **D11 — The 100% hint.** "Updated Tue 6 Oct" reads a new `artists.profile_updated_at`, which `ArtistProfileUpdated` sets.

**Edit profile and address**
- **D12 — Languages.** ISO 639-1 codes `en`, `fr`, `es`, `tw`, `am`, `ko`, as M1 already seeds them. At most 6, the offered list.
- **D13 — Concurrent saves.** **Needs your OK.** Default: last write wins, because no conflict state is mocked. The payload carries `updatedAt` so an `If-Match` check can follow later.
- **D14 — Saving several sections.** "Save changes" saves the details first, then the address, the setlist order and keys, and the photo alt text and order.
  - It stops at the first failure and marks that section inline.
  - The "Live" banner shows only when every part succeeds.
- **D15 — Slug rules.**
  - 3 to 60 characters.
  - Reserved: `apply`, `preview`, `new`, `edit`, `search`, `admin`, `api`.
  - A name with no ASCII letters becomes `artist-{ticket digits}`, for example `artist-0219`. That rule lives in M3's generator.
  - An artist may take back their own retired slug.
  - `slug_histories` rows are kept after account deletion; M9 confirms.
- **D16 — Copy for states without a mock.** **Needs your OK.**

  | State | Proposed copy |
  |---|---|
  | Slug taken | "That address is taken. Try another." |
  | Slug malformed | "Use 3 to 60 lowercase letters, numbers and single hyphens." |
  | Slug reserved | "That address is reserved. Try another." |
  | Base city outside the area | Reuse M2's account out-of-area copy |
  | Scan unavailable (503) | "We couldn't check this file right now. Try again in a few minutes." |
  | Video, wrong type by content | "That file isn't an MP4, MOV or WebM video." |
  | Video, infected | "Our safety scan flagged the file, so we deleted it." |
  | Video, transcode failed | "We couldn't process this video. Upload it again." |

- **D17 — Leaving with unsaved changes.** **Needs your OK.** Default: only the browser's `beforeunload` prompt, whose copy the browser supplies. An in-app confirm dialog waits for a mock.
- **D18 — Undo.**
  - Removing a song re-adds it and restores its position.
  - Photos and videos are soft-deleted. Their objects are purged 60 seconds after the toast closes.

**Photos and videos**
- **D19 — Polling and timeouts.**
  - Photos are polled every 2 s, for up to 2 minutes.
  - Videos are polled every 10 s.
  - The synchronous scan times out after 30 s, which returns 503.
  - A security event writes to the `security` log only, with no `AuditEntry`, as in M3.
- **D20 — Video provider and pipeline.** **Needs your OK.**
  - **Vendor:** chosen in M10.
  - **Port, fixed now:** `VideoTranscoder::submit(sourceUrl, outputPrefix, maxHeight): jobId`.
  - **Output:** the provider writes HLS into our `zamaro-media` bucket, so URLs stay on our media domain (L2-076.3). HLS is already settled by ADR-0009.
    - fMP4 segments of 6 s;
    - 360p, 720p and 1080p, never above the source height;
    - a poster frame at 10% of the duration.
  - **Results:** arrive by webhook, signed with HMAC-SHA256 over the timestamp and body. The replay window is 5 minutes, and handling is idempotent per `processor_job_id`.
- **D21 — Multipart uploads.**
  - Parts of 8 MB, 3 sent in parallel.
  - Presigned part URLs last 1 hour and are signed again on resume.
  - Resume after a page reload is not supported, because there is no mock for it; the session is pruned instead.
  - The source is deleted once the video is Live.
  - Captions are labelled "English" (`srclang="en"`).
  - `PruneAbandonedVideoUploads` removes `Uploading` rows older than 24 h, hourly.
  - `ReconcileProcessingVideos` checks videos in `Processing` for more than 30 min, every 10 min.
  - The M10 scanner must stream-scan 1 GB.

**Availability and feed**
- **D22 — A weekly default over open requests.** **Needs your OK.** Default: no warning and no decline, because the weekly-default dialog mocks have no warning state.
  - The requests stay open.
  - The day shows Unavailable, and its accessible name keeps the request, for example "Mon 16 Nov, Unavailable, weekly default, Requested · 1".
- **D23 — Calendar loading and Undo.**
  - One GET loads the whole 18-month window; the pager moves through months locally.
  - Undo restores overrides only. A confirmed decline is never undone, and the toast then has no Undo.
- **D24 — Feed rotation and contents.** **Needs your OK.**
  - "Make a new link" invalidates the old token at once, with no grace period (L2-058.2).
  - There is no "turn off" in M4, because there is no mock.
  - The feed is served under `/api/v1`, as the mock's `zamaro.ca/api/v1/calendar-feeds/….ics` shows.
  - Each event is 2 hours long (`DURATION:PT2H`).
  - The feed lists **Confirmed and Completed** bookings, so past dates do not vanish from the artist's calendar.
  - It is written with `spatie/icalendar-generator`.

## Design conflicts (resolved)

The pattern follows M1: each resolution updates the affected designs in the same slice.

- **C1 — Frontend layout.** The designs use `features/artist-workspace`; ADR-0007 maps it to the AGENTS.md layout:
  - Pages: `pages/dashboard`, `pages/edit-profile` (one subfolder per section), `pages/profile-preview` and `pages/availability` (route `/artist/calendar`, nav label "Availability").
  - Dialogs: `dialogs/{add-song,add-photo,add-video,block-dates,weekly-default,calendar-feed}`.
  - The profile view shared with the public page is extracted as `pages/artist/profile-view/ArtistProfileView` and imported by the preview. It is page markup, not a library component, as decided in M1 S11.
- **C2 — "No inline forms in pages".** `/artist/profile` is the screen the artist navigates to for editing, so it is allowed. Every button-triggered addition (song, photo, video, check) opens a CDK Dialog, as the mocks show. The inline key selects and alt-text fields belong to that one form, which "Save changes" saves.
- **C3 — Upload pipeline.** Three designs disagree:
  - **upload-photos:** a synchronous `UploadInspector` and `MalwareScanner`, with an `Unavailable` verdict.
  - **scan-and-serve-uploads:** an asynchronous `ScanUpload`, `ContentTypeDetector`, and an `Error` verdict.
  - **ADR-0002 and AGENTS.md:** a port named `MediaScanner`.

  Resolution:
  - Use M3's `ContentTypeDetector` (it gains the WebVTT header check) and the `App\Contracts\MediaScanner` port.
  - Photos (15 MB at most) and captions (1 MB) scan inside the request through a new `ReceiveUpload::receiveAndScan()`, because the mocks show the scan result in the open dialog. They still write an `uploads` row.
  - Videos scan in `InspectArtistVideo`.
  - ADR: "Small uploads scan in the request; videos scan in the worker".
- **C4 — Cache invalidation names.** Five designs name it differently:
  - events: `ArtistProfileUpdated`, `ArtistProfileChanged`, `ArtistAvailabilityChanged`, `ArtistSlugChanged`;
  - listeners: `InvalidateProfileCache`, `InvalidateArtistProfileCache`;
  - jobs: `PurgeProfileCache`, `PurgeCdnPaths`.

  The S4 ADR settles a single `ArtistProfileUpdated(artistId, previousSlug)`, the listener `InvalidateArtistProfileCache` and the job `PurgeProfileCache`, which calls the `CdnPurger` port.
- **C5 — Profile endpoint verb.** `operations/meet-response-time-budgets` uses `PATCH /api/v1/artist/profile`; edit-profile-details uses `PUT`. Keep `PUT` and update the budgets design.
- **C6 — Styles.** The design says "1–4 existing `Style` IDs", but M1 stores the `App\Enums\Style` string values. The request validates `Rule::enum(Style::class)`, for example `["solo-vocalist","hymns"]`.
- **C7 — Key labels.** manage-setlist's `MusicalKey::label()` gives way to ADR-0008: the API sends `E` or `B-flat`, and the frontend catalogue renders "Key of B♭".
- **C8 — Slug generation and nullability.** M1 made `artists.slug` NOT NULL. M3's approval assigns the slug; change-profile-address says it is assigned at publication.
  - Keep the slug assigned at approval: an unpublished profile is unreachable anyway (`scopePubliclyVisible`).
  - M4 adds only `slug_changed_at`, `ChangeArtistSlug` and `SlugRegistry`.
  - The resolver name is the one M1 S15 settled.
- **C9 — Two chunk protocols.** apply-as-artist sends API-proxied `PATCH` chunks; upload-videos sends presigned S3 multipart parts.
  - Keep presigned multipart (resume through ListParts, no video bytes through the API).
  - If M3 shipped the other protocol, S14 moves the application upload onto `ChunkedUploader` in the same slice.
  - ADR: "Resumable video uploads".
- **C10 — Preview error copy.** The design says "This preview didn't load"; the mock says "We couldn't build your preview". The mock wins.
- **C11 — Calendar payload.** The design's `CalendarDay` carries only `status`, `requestCount` and `editable`, but the mocks also need the church name, the note ("Studio"), the source ("weekly default") and the "In November" rows (kind, city, reply-by). The resource adds `label`, `source`, `churches[]` and a `bookings[]` list, and the design is updated.
- **C12 — Background check section.** It is drawn in the editor but owned by `verify-vulnerable-sector-check` (M3). S8 hosts M3's components in `#check`; the completeness check reads `vulnerable_sector_checks`.
- **C13 — The editor reaches into M5 and M6 data.** See D2–D4. The flags follow M1's `bookingRequests` precedent.

## Slices

**Every slice** follows M1's loop:
1. Write the Given-When-Then criteria.
2. Write the acceptance test and run it red for the expected reason.
3. Implement, refactor while green, then run the regression set (backend tests, frontend lint, `format:check` and builds, Playwright, and the perf test with `--fail-on-regression` when a `zm-*` component changes).
4. Commit.

Branch: `feat/m4-artist-workspace-and-availability`.

**Every new authenticated route** joins the cross-user suite in `tests/Feature/Security/` (L2-074.3). Abigail is refused Elijah Park's song, photo, video and feed, and Naomi gets 404 on every `/api/v1/artist/*` route.

#### S1 — Object storage and the move off local disk
- **L2:** 076.3, 084 (region recorded for M10), with 014 and 015 kept green.
- **Behaviour:**
  - Abigail's profile still shows her 4 photos and "Watch her lead". Each URL is on the media host, under a random 32-hex key, with server-set `Content-Type` and `Content-Disposition: inline`.
  - A VSC document link still opens through its 5-minute signed URL.
- **Tests first:**
  - `tests/Feature/Operations/ObjectStorageTest.php`: the same cases run against the fake and the S3 adapter:
    - a multipart round trip;
    - ListParts after an aborted part;
    - presigned URL expiry.
  - `tests/Feature/ArtistProfiles/ServeMediaFromMediaHostTest.php`.
  - M1's `ProfileMediaTest` and the profile e2e media cases as the regression set.
- **Build:**
  - Compose `object-storage` and `object-storage-init` services (D7, D8).
  - `Contracts/ObjectStorage`, `Integrations/ObjectStorage/{S3ObjectStorage,FakeObjectStorage}`.
  - Disks `media`, `quarantine` and `private` move to the `s3` driver.
  - `MediaUrl` builds media-host URLs.
  - An idempotent `media:move-to-object-storage` command copies the M1 and M3 local files.
  - Seeders write through the disks.
- **ADR:** "Object storage: S3-compatible buckets, a local stand-in, and the move off local disk". It amends ADR-0002 item 4.

#### S2 — Workspace shell, artists-only state, dashboard header
- **L2:** 074.1, 096.1, 099.1, 101.3.
- **Behaviour:**
  - **Abigail at `/artist`:**
    - The page shows "Good afternoon, Abigail" and "Fri 9 Oct · 3 requests to answer · next date Sun 18 Oct".
    - The top bar shows Dashboard, Availability and Profile (D2) and "View public profile" (`/artists/abigail-mensah`).
    - At 375 px the links move into the menu dialog's artist variant.
  - **Naomi at `/artist`:** "This page is for artists", with her account and church named, "Back to Discover" and "Lead worship yourself? Apply as an artist". Her `GET /api/v1/artist/dashboard` returns 404 with no body data.
  - **A guest** is sent to sign-in.
- **Tests first:**
  - `tests/Feature/ArtistWorkspace/ViewArtistDashboardTest.php` (header summary, 404 for a booker and for a guest).
  - `e2e/specs/artist-workspace/view-artist-dashboard.spec.ts` with `e2e/pages/artist-dashboard.page.ts` (it owns the artists-only state) and `e2e/pages/workspace-shell.ts`.
- **Build:**
  - The `Route::prefix('artist')->middleware('role:artist')` group in `routes/api.php`.
  - `Api/V1/ArtistWorkspace/ArtistDashboardController`, `Actions/ArtistWorkspace/BuildArtistDashboard` (header part), `Resources/ArtistWorkspace/ArtistDashboardResource`.
  - Frontend:
    - `pages/dashboard/` with `artists-only/`;
    - a `workspace` route parent that renders `ArtistsOnly` in place of its outlet for non-artists;
    - `api/lib/services/artist-workspace/dashboard.ts` (contract, `ARTIST_DASHBOARD_API` token, HTTP implementation) and its fake in `lib/testing/`;
    - the `artistRequests`, `earnings` and `artistReviews` flags.
- **Components and scenarios:** `zm-top-bar` gains the `workspace` variant; run perf against the base and add a `TopBarWorkspace` scenario.
- **Route states:** `/artist` as Naomi → `dashboard/forbidden.html`. Add an `as` field if M2 has not.

#### S3 — Availability calendar (read)
- **L2:** 056.1, 056.4, 057.1, 057.3, 105, 110.1.
- **Behaviour:**
  - **The header:** `/artist/calendar` opens on November 2026 with "November 2026 · 3 booked · 2 requested · 2 free Saturdays" and "Weekly default: **Unavailable every Monday**".
  - **Day names:**
    - "Sat 14 Nov, Requested · 1, Riverside Community Church"
    - "Sun 15 Nov, Booked, Lakeshore Alliance Church. Booked dates can't be changed"
    - "Mon 16 Nov, Unavailable, weekly default"
    - "Thu 26 Nov, Unavailable, studio"
  - **"In November"** lists the five dated rows and "Studio · Through Fri 27 Nov".
  - **The pager** runs from October 2026 to April 2028. The caption reads "Your calendar runs 18 months ahead, to Sun 9 Apr 2028, the last date churches can ask for."
  - **Miriam:** every date is Free.
  - **A Cancelled booking** returns its date to Free or the weekly default.
  - **States:** skeletons with `aria-busy`, and the error "We couldn't load your calendar".
- **Tests first:**
  - `tests/Feature/ArtistAvailability/ViewArtistCalendarTest.php`: precedence Booked > Unavailable > Requested > Free, the window end, a Cancelled booking, and Accepted counting as Requested.
  - `e2e/specs/artist-availability/manage-availability-calendar.spec.ts` with `e2e/pages/availability.page.ts`.
- **Build:**
  - Migration: `bookings` gains `respond_by` and `start_time` (D3).
  - `Api/V1/ArtistAvailability/ArtistCalendarController`, `Actions/ArtistAvailability/BuildArtistCalendar`, and `Services/ArtistAvailability/{CalendarWindow,DayStatus,CalendarDay}`.
  - `AvailabilityService::unavailableByChoice()` holds the shared in-memory rule; the SQL in `freeArtistIds()` is unchanged.
  - `CalendarResource` (C11) with `private, no-store`.
  - Frontend: `pages/availability/`, `AvailabilityStore`, and `api/lib/services/artist-availability/calendar.ts` with its fake.
- **Components and scenarios:**
  - `zm-calendar-month` (`CalendarMonth`), with arrow keys, Space to select, `data-status`, and dots under 768 px.
  - `zm-stamp` (`Stamp`).
  - `zm-tour-dates` gains a status column; run perf against the base.
  - Composite `AvailabilityCalendarMonth`: Abigail's November with its head, legend and "In November" list.
- **Route states:** `/artist/calendar` as Abigail → `availability/default.html`; as Miriam → `availability/empty.html`.

#### S4 — Weekly default and profile cache invalidation
- **L2:** 056.2, 089.2, 101.4, 109.
- **Behaviour:**
  - **Save:** "Change weekly default" opens "Weekly default" under "Unavailable every". Abigail ticks Tuesday, saves, and every Tuesday shows "Unavailable, weekly default", except a date with a Free override.
  - **Search:** a search for Tue 17 Nov excludes her.
  - **Failure:** the dialog keeps the ticks, with "Your weekly default wasn't saved" and "Your calendar still uses Unavailable every Monday."
  - **Cache:** the save raises `ArtistProfileUpdated`. Redis forgets `artist-profile:{id}` and `sitemap`, and `FakeCdnPurger` receives `/artists/abigail-mensah`, `/api/v1/artists/abigail-mensah` and its `/tour-dates` and `/availability` paths.
- **Tests first:**
  - `tests/Feature/ArtistAvailability/SetWeeklyAvailabilityTest.php`.
  - `tests/Feature/ArtistProfiles/ProfileCacheInvalidationTest.php` (the purge is retried on failure; the jobs are unique per artist for 5 s).
  - An e2e case, with `e2e/pages/weekly-default.dialog.ts`.
- **Build:**
  - `ArtistAvailabilityController@weekly`, `SetWeeklyAvailabilityRequest`, `SetWeeklyAvailability`.
  - `Events/ArtistProfileUpdated`, `Listeners/InvalidateArtistProfileCache`, `Jobs/ArtistProfiles/PurgeProfileCache`.
  - `Contracts/CdnPurger`, `Integrations/Cdn/FakeCdnPurger`.
  - `artists.profile_updated_at` (D11).
  - `dialogs/weekly-default/`.
- **ADR:** "Profile cache invalidation: one ArtistProfileUpdated event purges the app cache and the CDN". It updates edit-profile-details, manage-setlist, upload-photos, upload-videos, change-profile-address, manage-availability-calendar, index-and-share-profile and meet-response-time-budgets (C4, C5).

#### S5 — Mark dates unavailable or free
- **L2:** 056.3, 057.1, 075.1, 108.1, 109.
- **Behaviour:**
  - **Bulk bar:** selecting Sat 28 and Sun 29 Nov shows "2 days selected · Sat 28 – Sun 29 Nov". "Mark unavailable" saves at once.
  - **Success toast:** "Saved" with Undo, in the pattern of "26–27 Nov marked unavailable" / "Churches won't find you on Thu 26 or Fri 27 Nov."
  - **Search:** the next Burlington search for 28 Nov excludes her.
  - **Mark free:** selecting Mon 16 Nov offers "Mark free", which overrides the weekly default.
  - **"Mark dates unavailable"** opens the dialog:
    - A range of 19–21 Nov gives the warning toast "Sat 21 Nov is still Booked".
    - Start 27 Nov with end 26 Nov shows "Check the dates" / "End date can't be before the start date" and "Choose Fri 27 Nov or later."
  - **Activating a day that is not Free:**
    - Sun 15 Nov gives the info toast "Sun 15 Nov is Booked".
    - Sat 14 Nov gives "Sat 14 Nov · Requested · 1", with "Open request" behind `artistRequests`.
  - **Failure:** the danger toast "Couldn't save your dates" with Try again.
- **Tests first:** `tests/Feature/ArtistAvailability/SetDateAvailabilityTest.php` (validation, the window, Booked days skipped, the note at most 100 characters and never in public payloads), and e2e cases with `e2e/pages/block-dates.dialog.ts` and `e2e/pages/toasts.ts`.
- **Build:** `ArtistAvailabilityController@dates`, `SetDateAvailabilityRequest`, `SetDateAvailability` (the Free and the no-request Unavailable paths, returning a `RangeResult`), and `dialogs/block-dates/`.
- **Components and scenarios:** `zm-bulk-bar` (`BulkBar`). `zm-toast` gains its action variant if it lacks one; run perf against the base.

#### S6 — Declining open requests from the calendar
- **L2:** 057.2, 029, 030.2, 063.1.
- **Behaviour:**
  - **The warning:** Abigail marks Sun 22 – Tue 24 Nov unavailable with the note "Family visiting". The API answers 409 with `affectedRequests`, and the dialog switches to its warning state:
    - "1 church has asked about this date. They'll be told you're not available."
    - "St. Brendan's Anglican asked for Sun 22 Nov. …"
    - "Keep Sun 22 Nov open" (focused first) and "Mark unavailable and decline".
  - **On confirm:**
    - St. Brendan's request becomes Declined, and a `booking_transitions` row records the artist as actor and the reason "I'm not free that day".
    - Rev. Janet Clarke receives an email within 2 minutes, with the reason and 3 similar artists free on Sun 22 Nov. "Family visiting" never appears in it.
    - The success toast has no Undo (D23).
  - **The bulk bar** shows the same warning when the selection holds Requested days.
- **Tests first:** `tests/Feature/ArtistAvailability/DeclineRequestsByAvailabilityTest.php` (409 without `confirm`; Accepted also declined; a Confirmed date skipped; the re-read under a lock; the email's content asserted with `Notification::fake`), and an e2e case for the warning and confirm flow against stub fixtures. The 2-minute delivery is checked on the dev stack (manual walkthrough step 7.2).
- **Build:**
  - `Services/Bookings/BookingStateMachine` (decline only, D4).
  - `Events/RequestDeclined`, `Notifications/RequestDeclinedNotification`.
  - `SimilarArtistFinder` (M1 S15), reused for "free on that date".
  - The dialog's warning state.

#### S7 — Calendar feed
- **L2:** 058.1–2, 074, 077.1, 079.3, 089.3.
- **Behaviour:**
  - **Feed on (Abigail's seed):** "Subscribe in your calendar" opens straight to "Your secret calendar link", a 43-character token URL ending `.ics`. "Copy link" reads "Copied" for a few seconds.
  - **Feed off (Miriam):** she sees the off state and "Turn on calendar feed", which shows "Turning on…" while busy.
  - **Fetching the URL** returns `text/calendar` with one `VEVENT` per Confirmed date: Sun 18 Oct Living Waters … Sun 20 Dec Lakeshore Alliance. Each has `DTSTART;TZID=America/Toronto`, the kind, the church name and the address, with `X-Robots-Tag: noindex`.
  - **"Make a new link"** asks "Make a new link? Your current link stops working straight away." with "Keep current link" focused. After confirming, the old URL answers 404.
  - **Failure:** "We couldn't make a new link" / "Your current link still works."
  - **Abuse:** the 121st anonymous request in a minute returns 429. The token appears in logs as `[redacted]`.
- **Tests first:**
  - `tests/Feature/ArtistAvailability/CalendarFeedTest.php` (enable is idempotent; regenerate; 404 before enabling).
  - `ServeCalendarFeedTest.php` (unknown token 404, events, Cancelled dropped, Completed kept per D24, the hash-only lookup, redaction).
  - `e2e/specs/artist-availability/publish-calendar-feed.spec.ts` with `e2e/pages/calendar-feed.dialog.ts`, covering the dialog's states against stub fixtures. The `.ics` body is proven in `ServeCalendarFeedTest`.
- **Build:**
  - `calendar_feeds` migration.
  - `bookings.church_address` (D3).
  - `ArtistCalendarFeedController`, `FeedTokenGenerator`, `EnableCalendarFeed`, `RegenerateCalendarFeed`.
  - `CalendarFeedController` in `api_public.php`.
  - `BuildCalendarFeed`, `ICalendarWriter`.
  - `dialogs/calendar-feed/` and `api/lib/services/artist-availability/calendar-feed.ts` with its fake.
- **ADR:** "Calendar feed: a token-addressed, non-JSON response under /api/v1" (an exception to ADR-0005's JSON and problem conventions).
- **Components and scenarios:** `zm-copy-field` (`CopyField`).

#### S8 — Edit profile details and completeness
- **L2:** 050.1–3, 001, 075.1, 089.2, 105, 108.1.
- **Behaviour:**
  - **The form:** `/artist/profile` shows "Edit profile", "Abigail Mensah · zamaro.ca/artists/abigail-mensah", "Profile 100% complete" and "Everything a church needs to book you is here." The sections are Photo & name, Bio, Rate & travel and Languages.
  - **An invalid save** (a 97-character bio and $60):
    - "Fix 2 things before saving", "Write at least 100 characters. You have 97." and "Set a price of at least $100. Churches see it as “From $…”."
    - The status reads "2 fields to fix · not saved", focus moves to the summary, and nothing changes.
  - **A valid save** shows "Publishing…", then the "Live" banner: "Your changes are on your public profile now. Churches see them in their next search." with "View your profile", and "Saved just now · live".
  - **Price:** raising it to $700 leaves ZAM-0114's locked $650 unchanged.
  - **Group acts:** Marcus Bell Trio cannot pick she/her.
  - **Base city:** Ottawa is rejected, and nothing is saved.
  - **Miriam:** "Profile 40% complete" (details and a primary photo). She still lacks a Live video, a fifth song and a verified check.
  - **Load error:** "We couldn't load your profile".
- **Tests first:** `tests/Feature/ArtistWorkspace/EditProfileDetailsTest.php` (every L2-050 bound, all-or-nothing, the booking price locked, the purge dispatched) and `ProfileCompletenessTest.php`, plus `e2e/specs/artist-workspace/edit-profile-details.spec.ts` with `e2e/pages/edit-profile.page.ts`.
- **Build:**
  - Migration: `bookings.quoted_price_cents` (D3), and check constraints on `max_drive_km` (20–200, step 10) and `from_price_cents`.
  - `ArtistWorkspace\ProfileDetailsController` (`show`, `update` = `PUT`), `UpdateArtistProfileRequest`, `ArtistProfileData`, `UpdateArtistProfile`, `Services/ArtistWorkspace/ProfileCompleteness`, `ProfileDetailsResource`.
  - Frontend: `pages/edit-profile/{details-form,check-section}/`, `ArtistProfileEditorStore` at the workspace route level, `beforeunload` (D17), and `api/lib/services/artist-workspace/profile.ts`.
- **Components and scenarios:**
  - `zm-progress-bar`, with a meter variant (`ProgressBar`).
  - `zm-settings-nav` (`SettingsNav`).
  - `zm-form-actions`, the sticky save bar with its status (`FormActions`).
  - `zm-select`, `zm-textarea`, `zm-checkbox` and `zm-banner` if M2 has not built them.
- **Route states:** `/artist/profile` as Abigail → `edit-profile/default.html`; as Miriam → `edit-profile/empty.html`.

#### S9 — Profile preview
- **L2:** 054, 074, 105.
- **Behaviour:**
  - **Preview with a draft:** Abigail changes the headline to "Gospel, hymns & contemporary vocalist" without saving and presses "Preview". `/artist/profile/preview` shows the public layout with the new headline, under "This is a preview" / "Churches see your profile like this. Unsaved changes are included." and "Back to editing".
  - **What is switched off:** Book, Save and Share are disabled, and Upcoming dates start 3 days from today.
  - **Returning:** "Back to editing" keeps the draft. The public profile still shows the old headline.
  - **Processing media** is not shown in the preview.
  - **Failure:** "We couldn't build your preview" (C10), with the banner kept.
- **Tests first:** `tests/Feature/ArtistWorkspace/PreviewProfileTest.php` (persists nothing, raises no event, `no-store`, `preview: true`) and `e2e/specs/artist-workspace/preview-profile.spec.ts` with `e2e/pages/profile-preview.page.ts`.
- **Build:** `ArtistProfilePreviewController`, `BuildProfilePreview`, `pages/profile-preview/`, and the `ArtistProfileView` extraction (C1).
- **Route states:** `/artist/profile/preview` as Abigail, with no draft → `profile-preview/default.html`.

#### S10 — Change the profile address
- **L2:** 055.2–3, 021.
- **Behaviour:**
  - **Changing it:** "Lowercase letters, numbers and hyphens. Last changed Mon 3 Aug, so you can change it now; …". Abigail saves `abigail-mensah-music`, and the page head shows the new address.
  - **The old address:** `/artists/abigail-mensah?date=2026-11-14` answers 301 to the new one with the query string kept, and `FakeCdnPurger` gets both slugs.
  - **The lock:** the field turns read-only with "You changed it on Fri 9 Oct. You can change it again from Sun 8 Nov." With the `address-locked` fixture it reads "You changed it on Mon 28 Sep. You can change it again from Wed 28 Oct."
  - **Rejections:** `miriam-haile`, another artist's retired slug and `apply` are rejected with D16's copy.
- **Tests first:** `tests/Feature/ArtistWorkspace/ChangeProfileAddressTest.php` (the 30 days in America/Toronto, the unique race, reclaiming one's own retired slug, the redirect in one hop) and `e2e/specs/artist-workspace/change-profile-address.spec.ts`.
- **Build:** the `artists.slug_changed_at` migration, `ProfileAddressController`, `ChangeProfileAddressRequest`, `ChangeArtistSlug`, `SlugRegistry`, `ProfileAddressResource`, and `pages/edit-profile/address-section/`.
- **Route states:** `/artist/profile` with the `address-locked` fixture → `edit-profile/address-locked.html`.

#### S11 — Manage the setlist
- **L2:** 053.1–3, 012, 016, 074.
- **Behaviour:**
  - **The section:** "Songs Abigail leads", "Your first 5 show in the strip under your name. Use the arrows to reorder." and "8 of 50 songs."
  - **Adding a song:** "Add a song" opens "Songs · 8 of 50". "Here I Am to Worship", "Tim Hughes", "Key of E", then "Add song", appends it as the 9th.
  - **An invalid song:** an empty title and a 112-character credit give "Fix 2 things to add the song", "Write the song title, 1 to 100 characters." and "Use up to 100 characters. This has 112."
  - **Reordering:** moving "Twi praise medley" up into position 5 and saving puts it in the public header strip. `LiveAnnouncer` reads each new position.
  - **Keys:** "Key for Way Maker" set to Key of F is saved.
  - **Removing:** removing "Build My Life" shows Undo.
  - **The limit:** the 51st song gives "You can list up to 50 songs." with "Back to my songs".
  - **Stale and foreign data:** a stale reorder set returns 422, and Elijah's song ID returns 404.
- **Tests first:** `tests/Feature/ArtistWorkspace/ManageSetlistTest.php` and `e2e/specs/artist-workspace/manage-setlist.spec.ts` with `e2e/pages/add-song.dialog.ts`.
- **Build:** `SetlistSongController`, `SetlistOrderController`, `SetlistSongRequest`, `ReorderSetlistRequest`, `AddSetlistSong`, `ReorderSetlist`, `RemoveSetlistSong`, `SetlistSongPolicy`, `SetlistSongResource`, `SetlistStore`, `pages/edit-profile/setlist-section/`, `dialogs/add-song/` and `api/lib/services/artist-workspace/setlist.ts`.
- **Components and scenarios:** `zm-setlist` gains the `edit` variant; run perf against the base. Scenarios `SetlistEdit` (8 rows) and composite `SetlistEditor` (50 rows with key selects).

#### S12 — Upload a photo
- **L2:** 051.1–3, 076.1–3, 092.1.
- **Behaviour:**
  - **The section:** "4 of 12 photos · JPEG, PNG, WebP or HEIC up to 15 MB, at least 800 px on the short side."
  - **A good upload:** "Add a photo" opens "Photos · 4 of 12". A 1600 × 1200 JPEG with GPS EXIF and the alt text "Abigail leading an Easter sunrise service on the Lakeshore boardwalk" shows a progress bar with megabytes sent. The tile shows Processing, then Ready, with renditions at 400, 800, 1200 and 1600 px in AVIF and WebP and no EXIF.
  - **Rejections:**
    - 640 px: "This photo is 640 px on its short side. Choose one at least 800 px."
    - "Me": "Write alt text of 5 to 150 characters. “Me” has 2."
    - An SVG renamed `.jpg`: "That file isn't a JPEG, PNG, WebP or HEIC photo."
    - 16 MB: "This photo is 16 MB. Choose one up to 15 MB."
    - EICAR: "This photo wasn't uploaded" / "Our safety scan flagged the file, so we deleted it. Export the photo again and try that copy.", with the alt text kept and a security event logged.
    - The 13th photo: "You can have up to 12 photos."
- **Tests first:**
  - `tests/Feature/ArtistWorkspace/UploadPhotosTest.php` (the check order, 503 on a scanner `Error`, the 16 MB body limit on this route only).
  - `ProcessArtistPhotoTest.php` (idempotent, Failed after 5 tries, no upscaling).
  - `e2e/specs/artist-workspace/upload-photos.spec.ts` with `e2e/pages/add-photo.dialog.ts`.
- **Build:**
  - `artist_photos` expand: `status`, `original_key`, `renditions` jsonb, `width`, `height`, `deleted_at`, and the partial unique primary.
  - `ArtistPhotoController@index/store`, `UploadArtistPhotoRequest`, `StoreArtistPhoto`.
  - `ReceiveUpload::receiveAndScan()` (C3).
  - `Contracts/ImageProcessor`, `Integrations/Images/ImagickImageProcessor`.
  - `Jobs/ArtistWorkspace/ProcessArtistPhoto`, `ArtistPhotoResource`.
  - `pages/edit-profile/photos-section/`, `dialogs/add-photo/`, `api/lib/services/artist-workspace/photos.ts` (`reportProgress`).
- **ADR:** "Small uploads scan in the request; videos scan in the worker".
- **Components and scenarios:** `zm-file-field` (`FileField`), if M3 has not built it.

#### S13 — Arrange photos
- **L2:** 051.4, 006, 113.
- **Behaviour:**
  - **Alt text and order:** an edited alt text and "Move photo 4 earlier" are saved by "Save changes".
  - **Primary:** "Make photo 2 your primary photo" saves at once and moves the "Primary" tag. The profile poster and the headliner use the new primary.
  - **Removing the primary:** "Remove photo 1" promotes the first Ready photo and offers Undo (D18).
  - **Stale sets:** a stale order set returns 422.
- **Tests first:** `tests/Feature/ArtistWorkspace/ArrangePhotosTest.php` and an e2e case.
- **Build:** `ArtistPhotoController@update/destroy`, `ArtistPhotoOrderController`, `PrimaryArtistPhotoController`, `ReorderArtistPhotos`, `SetPrimaryArtistPhoto`, `ArtistPhotoPolicy`, and `Jobs/ArtistWorkspace/PurgeRemovedMedia`.
- **Components and scenarios:** `zm-photo-tile` (`PhotoTile`) and composite `PhotoGrid` (12 tiles).

#### S14 — Upload a video (resumable)
- **L2:** 052.2–5, 076.1, 075.4.
- **Behaviour:**
  - **The section:** "4 of 8 videos · MP4, MOV or WebM, up to 1 GB and 15 minutes each".
  - **A good upload:** "Add a video" opens "Videos · 4 of 8". `jireh-living-waters.mp4` with the title "Jireh — live at Living Waters, Brampton" shows percent and megabytes sent. The dialog closes, and the row reads "… · Processing".
  - **Resuming:** going offline at about 60% shows "Upload stopped at 61%" / "Your connection dropped. The 492 MB already sent are kept, so Resume picks up from there.". "Resume upload" sends only the missing parts.
  - **Rejections:**
    - An AVI: "That's an AVI file. Choose an MP4, MOV or WebM video."
    - "Live": "Write a title of 5 to 100 characters. “Live” has 4."
    - The 9th video: "You can have up to 8 videos."
  - **Failed videos do not count:** the seeded failed video gives "5 of 8".
- **Tests first:** `tests/Feature/ArtistWorkspace/UploadVideosTest.php` (the limit under a lock, the session, signed parts, ListParts, the size checked on complete) and `e2e/specs/artist-workspace/upload-videos.spec.ts` with `e2e/pages/add-video.dialog.ts`. The e2e case uses a 20 MB fixture with 5 MB parts and Playwright's `setOffline`; the stub API hands out part URLs that `page.route` answers with an `ETag`.
- **Build:**
  - `artist_videos` expand: `status`, `failure_reason`, `size_bytes`, `source_key`, `upload_id`, unique `processor_job_id`, `manifest_key`, `poster_key`, `captions_key`, `duration_seconds`, `max_height`, `deleted_at`.
  - `ArtistVideoUploadController`, `InitiateVideoUploadRequest`, `InitiateVideoUpload`, `CompleteVideoUpload`, `ArtistVideoPolicy`.
  - `api/lib/services/artist-workspace/{videos,chunked-uploader}.ts`, `pages/edit-profile/videos-section/`, `dialogs/add-video/`.
  - Move the apply flow onto the uploader if C9 applies.
- **ADR:** "Resumable video uploads: S3 multipart with presigned parts, one protocol for application and workspace videos".

#### S15 — Process videos: inspect, scan, transcode, captions
- **L2:** 052.1, 052.2, 052.4, 014, 076.1–2, 092.
- **Behaviour:**
  - **The happy path:** a clean 720p source is probed and submitted. The fake's signed webhook marks it Live with 360p and 720p renditions (no 1080p) and a poster. The row reads "Jireh — live at Living Waters, Brampton · 7:42 · Live", and "Watch her lead" shows it with captions.
  - **Failures:**
    - A 16:20 source: "Longer than 15 minutes. Trim it and upload it again."
    - EICAR: Failed, with a security event.
    - A bad signature: rejected.
    - A replayed webhook: no effect.
    - A lost webhook: `ReconcileProcessingVideos` fixes it.
  - **Captions:** a `WEBVTT` file of 1 MB or less is stored as `text/vtt`. A file without the header is rejected.
  - **Removing:** "Remove the Way Maker video" shows Undo.
- **Tests first:** `tests/Feature/ArtistWorkspace/{InspectArtistVideoTest,VideoProcessingWebhookTest,VideoCaptionsTest,PruneAndReconcileVideosTest}.php` and e2e cases in `upload-videos.spec.ts`.
- **Build:**
  - `Jobs/ArtistWorkspace/InspectArtistVideo`.
  - `Contracts/{VideoTranscoder,VideoProbe}`, `Integrations/Video/{FakeVideoTranscoder,FfprobeVideoProbe,FakeVideoProbe}`.
  - `VideoProcessingWebhookController` in `api_public.php`, `RecordVideoProcessingResult`, `StoreVideoCaptions`, `ArtistVideoCaptionsController`.
  - `PruneAbandonedVideoUploads` and `ReconcileProcessingVideos` in `routes/console.php`.
  - `ArtistVideoResource`.
- **ADR:** "Video processing: VideoTranscoder port, HLS into our media bucket, signed webhook and reconciliation" (D20).
- **Components and scenarios:** `zm-video-card` gains its Processing and Failed states; run perf against the base. Composite `VideoList` (8 rows).
- **Route states:** `/artist/profile` with the `video-processing` fixture → `edit-profile/video-processing.html`.

#### S16 — Dashboard: stats, requests, coming up, reviews
- **L2:** 034.1, 039 (no totals), 056, 074, 096.1–3, 105.
- **Behaviour:**
  - **Abigail's tiles:**
    - "Awaiting reply 3 · First one due Sat 10 Oct, 3:15 p.m."
    - "Confirmed dates 4 · Oct and Nov · next Sun 18 Oct"
    - "Free Saturdays in Nov 2 · Sat 7 and Sat 28 Nov"
    - "Profile complete 100% · Updated Tue 6 Oct"
  - **"Needs your reply"**, ordered by reply-by:
    - Harvest Point, Sat 5 Dec: "1 day left · reply by Sat 10 Oct, 3:15 p.m."
    - St. Brendan's, Sun 22 Nov
    - Riverside, Sat 14 Nov: "2 days 19 hr left · reply by Mon 12 Oct, 10:15 a.m."

    Each row shows "$650 quoted · you get $598" and a message preview with contact details replaced. The time left refreshes every minute, and the counts refresh on focus.
  - **"Coming up":** 4 rows and "Two more confirmed dates in December."
  - **"Reviews":** "4.9 · 38 churches" and "Rev. Janet Clarke's September review and one other have no reply yet."
  - **Miriam:**
    - "Fri 9 Oct · approved Mon 5 Oct · no requests yet".
    - "Free Saturdays in Nov 4 · Every Saturday is open" and "40% · 3 things left, starting with a video".
    - "Your first request will land here" with "Set your availability".
  - **States:** "We couldn't load your dashboard" on error; skeletons with CLS of 0.05 or less while loading. At 320 px nothing scrolls sideways.
- **Tests first:** extend `ViewArtistDashboardTest.php` (ordering, the payout, masking, free Saturdays from `BuildArtistCalendar`, only the caller's data), `e2e/perf/cls.spec.ts` for `/artist`, and the dashboard spec.
- **Build:**
  - Migration: `bookings.church_distance_km` and `request_message` (D3).
  - `Actions/Bookings/ListArtistRequests`, `Resources/Bookings/ArtistRequestResource`, `Services/Payments/PriceBreakdown`, `Services/Bookings/ContactMasker`.
  - The full `BuildArtistDashboard` and `ArtistDashboardStore`.
- **Components and scenarios:**
  - `zm-stat` (`Stat`).
  - `zm-panel` (`Panel`).
  - `zm-request-row`, the requests inbox row composite AGENTS.md names (`RequestRow`); M5 reuses it.
- **Route states:** `/artist` as Abigail → `dashboard/default.html`; as Miriam → `dashboard/empty.html`.

### Changes made while implementing

None yet.

## Vendor ports and fakes

The real adapters arrive in M10, one ADR per vendor, and binding a fake in production throws at boot.

**New in M4:**

| Port | Fake or adapter | Behaviour and test hooks |
|---|---|---|
| `ObjectStorage` | `FakeObjectStorage` | In memory, with multipart and ListParts. Hooks: `failPart(n)`, `objects()`. |
| `ObjectStorage` | `S3ObjectStorage` | The adapter for the compose server, and later production. |
| `CdnPurger` | `FakeCdnPurger` | Hooks: `purged()`, `failNext()`. |
| `VideoTranscoder` | `FakeVideoTranscoder` | Hooks: `submissions()`, `complete(jobId)`, `failNext(reason)`. |
| `VideoProbe` | `FfprobeVideoProbe` (real), `FakeVideoProbe` | The fake returns set durations and heights, so no 16-minute fixture is needed. |
| `ImageProcessor` | `ImagickImageProcessor` | Real in tests. |

- **`FakeVideoTranscoder` in dev:** `CompleteFakeTranscode` runs after `FAKE_TRANSCODER_DELAY` (3 s). It copies M1's sample HLS ladder and poster into `zamaro-media` under random keys, then posts a correctly signed webhook.

**Reused:**
- `MediaScanner` (M3): `FakeMediaScanner` flags any file that contains the EICAR string. It also has `unavailableNext()`.
- `Geocoder` and `RoutingProvider` (M1): `FakeGeocoder` and `FakeRoutingProvider`.
- Mail goes through M2's Mailpit.

## Seed data additions

All seeds stay idempotent, upserting on natural keys.

- **Abigail Mensah**
  - **Photos:** 4 Ready, with the mock's alt texts. Photo 1, "Abigail at the microphone during a Sunday service", is primary.
  - **Videos:** 4 Live:
    - "Way Maker — live at Bethel Pentecostal, Hamilton" (6:12)
    - "Great Is Thy Faithfulness — acoustic" (4:40)
    - "Twi praise medley — Harvest Sunday 2025" (8:05)
    - "Goodness of God — women's retreat, Muskoka" (5:30)
  - **Profile:** `slug_changed_at` Mon 3 Aug 2026 and `profile_updated_at` Tue 6 Oct 2026.
  - **Calendar:** weekly rule Monday. Overrides: 26–27 Nov "Studio", 24–26 Dec "Family", and 31 Dec.
  - **Feed:** on, with the mock's token, in dev only. e2e's stub fixture uses the same token.
  - **Bookings:**
    - Confirmed: 18 Oct Living Waters, 1 Nov Harvest Point, 15 Nov Lakeshore Alliance, 21 Nov Kingdom Life (Conference or retreat, $900), 13 Dec Living Waters, 20 Dec Lakeshore Alliance. Each has a start time and a church address.
    - Requested, at $650:
      - Riverside, 14 Nov, 7:00 p.m., reply by Mon 12 Oct 10:15 a.m.
      - St. Brendan's, 22 Nov, 10:30 a.m., reply by Sun 11 Oct 9:00 a.m.
      - Harvest Point, 5 Dec, 7:00 p.m., reply by Sat 10 Oct 3:15 p.m.

      Each carries the mock's distance and message.
- **Miriam Haile:** 4 songs, 2 photos, no videos and no check. No `slug_changed_at` and no rules.
- **Elijah Park:** a song, a photo and a video, as the other artist in the cross-user tests.
- **e2e fixtures:** `address-locked` (Abigail changed her slug Mon 28 Sep) and `video-processing` (Jireh Processing; "O Holy Night — carol service 2025", 16:20, Failed) are stub-API states in `e2e/fixtures/`, which a spec applies per test. They are not seeded.

## Known risks

- **Biggest: the resumable video path.**
  - **Parity:** browser `PUT` to presigned parts needs the local S3 server to match S3 on CORS, the exposed `ETag`, ListParts and expiry. If it diverges, the dev results stop predicting production; e2e answers the parts with `page.route` and cannot catch it. S1 proves this first with a scripted check.
  - **Collision with M3:** if M3 shipped its own chunk protocol, S14 must migrate it.
- **e2e state:** M4 is the first milestone whose specs change data (saves, slugs, uploads, declines). Each spec sets up its before and after states through stub-API fixtures, so specs stay parallel and never share state. The fixtures must follow the OpenAPI contract, or e2e passes against a shape the API doesn't send.
- **Clock and copy parity:** without D1, the greeting and time-left copy differ from the mocks in visual tests.
- **Pulling M5 work forward (D3, D4):** M5 must extend `ListArtistRequests`, `BookingStateMachine` and the booking columns, not rewrite them. Record this in the M5 plan.
- **Image toolchain:** HEIC needs libheif and AVIF needs libavif in Imagick, which can break the PHP image build. Pin them in S12.
- **Perf:**
  - `SetlistEditor` renders 50 selects with 25 options each, and `AvailabilityCalendarMonth` renders 42 buttons with long accessible names. Both may be heavy; measure them early.
  - Fix any flagged rows instead of shrinking scenarios.
- **Check constraints (S8):** they can fail on existing supporting-cast rows. Validate the seed before adding them.
- **Cache purge noise:** reorders and key changes raise many events. `PurgeProfileCache` must be unique per artist.
- **Personal data in SSR:** see D5. A slip would cache one artist's dashboard for another.

## Verification at the end of the milestone

1. `docker compose up -d --wait`, then `docker compose exec api php artisan test`. Every Feature test passes, including the contract assertions and the cross-user suite with the new routes.
2. `docker compose exec api php artisan db:seed` twice: row counts are unchanged. `php artisan media:move-to-object-storage` twice: the second run copies nothing.
3. `docker compose exec api php artisan schedule:list` shows `PruneAbandonedVideoUploads` and `ReconcileProcessingVideos`.
4. `cd frontend && npm run lint && npm run format:check && npx ng build zamaro && NG_BUILD_MANGLE=0 npx ng build perf-test`.
5. `cd e2e && npx playwright test` in Chromium, with no API, database or Docker running: the specs, `visual/` (new route states, light and dark), `a11y/` and `perf/`.
6. `npm run perf-test -- --baseline <main dist> --fail-on-regression`: no flagged rows. The new scenarios are listed.
7. **Manual walkthrough** at Fri 9 Oct, 3:15 p.m.:
   1. **Dashboard:** sign in as Abigail. Check 3 / 4 / 2 / 100% and the three rows.
   2. **Calendar:** check November. Set Tuesday as a weekly default, then undo it. Mark Sun 22 – Tue 24 Nov unavailable, confirm the decline, and find Janet's email in Mailpit.
   3. **Feed:** subscribe in a desktop calendar app. Make a new link and confirm the old one returns 404.
   4. **Profile details:** edit the bio, preview, save, and see the public profile change within 60 s.
   5. **Address:** change the slug, follow the old link (301), and confirm the field is locked.
   6. **Setlist:** add a song, move it into the top 5, and check the strip.
   7. **Photos:** upload a phone HEIC with GPS, confirm the AVIF and WebP renditions carry no EXIF, and make it primary.
   8. **Videos:** upload a 300 MB video, go offline at about 60%, resume, and watch Processing turn Live.
   9. **Church account:** sign in as Naomi and open `/artist`: "This page is for artists".
   10. **Widths:** repeat at 320 px and 375 px.
