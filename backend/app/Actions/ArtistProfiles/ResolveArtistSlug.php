<?php

namespace App\Actions\ArtistProfiles;

use App\Models\Artist;
use App\Models\SlugHistory;

/**
 * Turns `/artists/{slug}` into a viewable artist (ADR-0011), for every route under it. A retired slug
 * follows its history straight to the artist, so a chain of renames is one hop. A slug that never
 * existed and a hidden artist end alike (L2-021.2).
 */
class ResolveArtistSlug
{
    /**
     * @throws ArtistMoved when the slug is a viewable artist's retired one
     * @throws ArtistNotFound when no viewable artist has the slug
     */
    public function handle(string $slug): Artist
    {
        $artist = Artist::query()->where('slug', $slug)->first()
            ?? SlugHistory::query()->where('slug', $slug)->whereNotNull('retired_at')->first()?->artist;

        if ($artist === null) {
            throw new ArtistNotFound;
        }
        if (! $artist->isVisible()) {
            throw new ArtistNotFound($artist->primaryStyle());
        }
        if ($artist->slug !== $slug) {
            throw new ArtistMoved($artist->slug);
        }

        return $artist;
    }
}
