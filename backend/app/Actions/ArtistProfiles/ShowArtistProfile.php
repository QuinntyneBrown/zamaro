<?php

namespace App\Actions\ArtistProfiles;

use App\Models\Artist;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A visible artist's public profile (L2-012): styles, rating, setlist, photos and live videos
 * (L2-014.3). It reads no bookings, churches or account records.
 */
class ShowArtistProfile
{
    public function __construct(private readonly ResolveArtistSlug $slugs) {}

    /**
     * @throws ArtistMoved when the slug is the artist's retired one
     * @throws ArtistNotFound when no visible artist has the slug
     */
    public function handle(string $slug): Artist
    {
        return $this->slugs->handle($slug)
            ->load(['styles', 'rating', 'setlist', 'photos', 'videos' => fn (HasMany $videos) => $videos->live()]);
    }
}
