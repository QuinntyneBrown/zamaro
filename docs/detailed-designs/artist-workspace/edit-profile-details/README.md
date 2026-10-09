# Edit profile details

## Overview

Zamaro is a marketplace where churches in and around Toronto book Christian praise
and worship artists. Each approved artist has a public profile at `/artists/{slug}`,
and bookers decide whom to book from what that profile says. The artist workspace is
the `/artist/*` area of Zamaro Web where a signed-in approved artist maintains that
profile.

This feature is the profile editor at `/artist/profile`. An artist changes the
written details of their profile and the facts that drive search: name, pronoun,
headline, bio, base city, styles, languages, maximum driving distance and "From"
price. The same page offers "Preview", which shows the profile as the public would
see it before the artist saves.

Sibling slices in the workspace cover the rest of the profile:
`artist-workspace/change-profile-address` (the slug in the profile URL),
`artist-workspace/upload-photos`, `artist-workspace/upload-videos` and
`artist-workspace/manage-setlist`. The public profile page that renders these details
belongs to the artist profile subsystem.

Terms used in this design:

- **artist** — approved worship artist, a solo performer, duo, band or choir acting as one account
- **artist workspace** — signed-in area of Zamaro Web under `/artist/*` reserved for approved artists
- **profile details** — written and numeric facts on a profile, excluding media, setlist and slug
- **group act** — artist whose act type is duo, band or choir, always described with they/them
- **"From" price** — lowest price an artist quotes, in whole Canadian dollars, shown on cards and the profile
- **locked quoted price** — price copied onto a booking when it is requested and never recalculated
- **service area** — every address within 200 km road distance of Toronto City Hall (L2-001)
- **draft** — form values in the editor that have not been saved
- **preview** — rendering of the public profile with the draft applied, persisted nowhere

Two rules shape the slice. A save is all or nothing: any invalid field rejects the
whole save and nothing changes (L2-050). A price change never reaches existing
Requested, Accepted or Confirmed bookings, because each booking carries its own
locked quoted price (L2-050).

## Description

The slice runs from the profile editor in Zamaro Web to the artist profile endpoints
in the Zamaro API, the Zamaro database and the geocoding and routing providers.

**Frontend (Zamaro Web, `features/artist-workspace`)**

- **`ArtistProfileEditorPage`** — routed page component for `/artist/profile`. It
  loads the profile, hosts the details form and the Save and "Preview" actions, and
  shows a toast after a successful save. The confirmation copy is `<TO SUPPLY>`.
- **`ProfileDetailsFormComponent`** — reactive form built from design-system text
  field, textarea, select, chip and radio-group components. It mirrors the server
  rules for immediate feedback: display name 2–80 characters, headline up to 80, bio
  100–1,500 with a live character count, 1–4 styles, maximum driving distance 20–200
  km in 10 km steps, and a whole-dollar price from $100 to $20,000. For a group act
  the pronoun control is fixed to they/them. After a rejected save it marks each
  invalid field and moves focus to the first one.
- **`ArtistProfileEditorStore`** — signal-based store holding the saved
  `ArtistProfile`, the current draft, a status (`idle`, `saving`, `saved`, `invalid`,
  `error`) and per-field errors from the API. It lives at the workspace route level,
  so the draft survives navigation between the editor and the preview.
- **`ArtistProfileApi`** — typed client for `GET /api/v1/artist/profile`,
  `PUT /api/v1/artist/profile` and `POST /api/v1/artist/profile/preview`.
- **`ProfilePreviewPage`** — routed page component for `/artist/profile/preview`. It
  renders `ArtistProfileViewComponent`, the presentational root shared with the public
  `ArtistProfilePage`, so the preview uses the same layout as the public page
  (L2-054). It adds `PreviewBannerComponent` and a "Back to editing" link. Whether
  Book, Save and Share are inert or hidden in the preview is `<TO SUPPLY>`.
- **`PreviewBannerComponent`** — design-system inline message that reads "This is a
  preview" and stays visible above the profile.

**Backend (Zamaro API)**

- **`EnsureArtistRole`** — route middleware on every `/api/v1/artist/*` endpoint. It
  answers 404 to any caller who is not a signed-in approved artist (L2-074).
- **`ArtistProfileController`** — `show` returns the editor payload and `update`
  saves the details. Both act on the signed-in artist only; no artist identifier
  appears in the URL.
- **`UpdateArtistProfileRequest`** — FormRequest holding the L2-050 rules. Display
  name is 2–80 characters, headline at most 80 and bio 100–1,500, all stored as plain
  text. Pronoun is an `App\Enums\Pronoun` value (`She`, `He`, `They`) and shall be
  `They` for a group act. Styles are 1–4 existing `Style` IDs. Languages are codes
  from an allowed list; the list and any maximum count are `<TO SUPPLY>`. Maximum
  driving distance is an integer from 20 to 200 divisible by 10. Price is an integer
  number of dollars from 100 to 20,000. When the base city differs from the saved
  value, the rule geocodes it through `Geocoder` and checks it with `ServiceArea`
  (L2-001). A failure produces 422 with per-field errors (L2-075). The request
  produces an `ArtistProfileData` value object carrying the resolved coordinates.
- **`UpdateArtistProfile`** — action that writes the artist row and replaces the
  `artist_styles` rows inside one `DB::transaction`. It stores the price as
  `fromPriceCents` and never reads or writes `bookings`, which keeps every locked
  `quotedPriceCents` unchanged (L2-050). After commit it dispatches
  `ArtistProfileUpdated`.
- **`ArtistProfileUpdated`** — domain event. Its queued listener
  `InvalidateProfileCache` purges the public profile URL from the CDN and the
  application cache within 60 seconds (L2-089).
- **`ArtistProfilePreviewController`** — invokable controller for
  `POST /api/v1/artist/profile/preview`. It validates the draft with the
  `UpdateArtistProfileRequest` rules and calls `BuildProfilePreview`.
- **`BuildProfilePreview`** — action that loads the saved profile with its Live
  photos and videos, setlist, rating and upcoming dates, overlays the draft values
  in memory and returns a `PublicProfile`. It persists nothing and dispatches no
  event. Media that is not public, such as a video still processing (L2-014), stays
  out of the preview as it stays out of the public page.
- **`ServiceArea`** — domain service that checks a point lies within 200 km road
  distance of Toronto City Hall through `DistanceService`.
- **`Geocoder`** — interface with one adapter for the geocoding provider (vendor
  `<TO SUPPLY>`).
- **`ArtistProfileResource`** and **`PublicProfileResource`** — API resources. The
  first serialises the editor payload. The second is shared with the public profile
  endpoint and carries `preview: true` on preview responses, which are sent with
  `Cache-Control: no-store`.

**Data**

The slice writes `artists` (`display_name`, `pronoun`, `headline`, `bio`,
`base_city`, `base_latitude`, `base_longitude`, `languages` as `jsonb`,
`max_drive_km`, `from_price_cents`) and `artist_styles`. Database check constraints
repeat the range rules for `max_drive_km` and `from_price_cents`. Each `bookings` row
keeps its own `quoted_price_cents`, written when the booking is requested. Handling
of two concurrent saves from different devices (last write wins or an `If-Match`
version check) is `<TO SUPPLY>`.

## Requirements

The feature realises the following level-2 (L2) requirements. Each refines the
level-1 (L1) requirement shown, and the text is quoted from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-050` | `L1-011` | **Edit profile details.**<br>Acceptance criteria:<br>1. Given an artist on `/artist/profile`, when they save, then they can change display name (2–80 characters), pronoun used in profile copy (she/her, he/him or they/them; groups always use they/them), headline (up to 80), bio (100–1,500), base city (inside the service area), styles (1–4), languages, maximum driving distance (20–200 km in 10 km steps) and "From" price (whole dollars, $100–$20,000).<br>2. Given an artist changes their price, when they save, then existing Requested, Accepted and Confirmed bookings keep their locked quoted price.<br>3. Given an invalid value, when they save, then each invalid field shows an inline error and nothing is saved. |
| `L2-054` | `L1-011` | **Profile preview.**<br>Acceptance criteria:<br>1. Given an artist editing their profile, when they activate "Preview", then they see their profile exactly as the public would, with a banner "This is a preview" and unpublished changes included. |

## Diagrams

### System context

An artist edits and previews profile details in Zamaro, which geocodes a changed
base city, checks it against the service area by road distance and purges cached
copies of the public profile.

![C4 system context for editing profile details](diagrams/c4-context.png)

### Containers

The profile editor in Zamaro Web calls the artist profile endpoints in the Zamaro
API, which writes the database and queues the cache purge that the Zamaro Worker runs
against the CDN.

![C4 container view for editing profile details](diagrams/c4-container.png)

### Components

Inside the Zamaro API, both controllers share `UpdateArtistProfileRequest`. Saving
goes through `UpdateArtistProfile`, and previewing goes through
`BuildProfilePreview`, which reads but never writes.

![C4 component view for editing profile details](diagrams/c4-component.png)

### Class structure

The editor store and client mirror the backend controllers. `ArtistProfileData`
carries validated values into the action, and `Booking` keeps its own quoted price
apart from the artist's "From" price.

![Class diagram for editing profile details](diagrams/class-structure.png)

### Behaviour — save profile details

The request validates every field, geocodes a changed base city and checks the
service area before anything is written. An invalid field rejects the whole save,
and a valid save updates the artist in one transaction without touching bookings.

![Sequence diagram for saving profile details](diagrams/sequence-save-profile-details.png)

### Behaviour — preview with unsaved changes

"Preview" sends the draft to the preview endpoint, which overlays it on the saved
profile in memory. The preview page renders the public layout under the "This is a
preview" banner and returns to the editor with the draft intact.

![Sequence diagram for previewing a profile with unsaved changes](diagrams/sequence-preview-profile.png)
