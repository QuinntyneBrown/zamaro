# ADR-0008: Artist profile names: one public profile, a separate editor, and the designs' shared enums

**Date:** 2026-10-09
**Category:** backend
**Status:** Accepted
**Deciders:** Project owner, Claude

## Context

Two designs name the same things differently, and one name is claimed twice:
- `artist-profiles/view-artist-profile` serves the public profile from `ArtistProfileController` through
  `ArtistProfileResource`.
- `artist-workspace/edit-profile-details` gives the artist's editor an `ArtistProfileController` and an
  `ArtistProfileResource` too, and calls the public shape `PublicProfileResource`.
- view-artist-profile names the pronoun cases `SheHer`, `HeHim` and `TheyThem`; edit-profile-details
  names them `She`, `He` and `They`.
- manage-setlist stores a song's credit in `setlist_songs.writer`; view-artist-profile's class diagram
  calls it `writerOrSource`.

The public profile ships first (M1, S11), so its names are fixed now.

## Decision

- The public profile keeps `App\Http\Controllers\Api\V1\ArtistProfiles\ArtistProfileController`,
  `App\Actions\ArtistProfiles\ShowArtistProfile` and
  `App\Http\Resources\ArtistProfiles\ArtistProfileResource`. That resource is the allowlist of public
  fields; edit-profile-details' `PublicProfileResource` is this class.
- The editor (M4) takes `ArtistWorkspace\ProfileDetailsController` and `ProfileDetailsResource` for
  its payload.
- `App\Enums\Pronoun` has the cases `She`, `He` and `They`, serialised as `she`, `he` and `they`.
- The setlist column and the API field are both `writer`.
- `App\Enums\MusicalKey` serialises keys as `E`, `B-flat`, `F-sharp-minor` or `any`. The frontend
  turns them into "Key of B♭" from catalogue templates.

## Consequences

- Each controller and resource name is used once, so the editor cannot change the public allowlist
  by accident.
- view-artist-profile, edit-profile-details and change-profile-address are updated to these names in
  the same change. change-profile-address's `PublicArtistProfileController` is this
  `ArtistProfileController`. Its slug resolver keeps its name until the missing-artist slice settles it.
