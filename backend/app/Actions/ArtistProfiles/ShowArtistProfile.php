<?php

namespace App\Actions\ArtistProfiles;

use App\Models\Artist;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * A visible artist's public profile (L2-012): styles, rating, setlist, photos and live videos
 * (L2-014.3). It reads no bookings, churches or account records. Renamed slugs and similar artists
 * arrive with S15.
 */
class ShowArtistProfile
{
    public function handle(string $slug): Artist
    {
        return Artist::query()
            ->visible()
            ->where('slug', $slug)
            ->with(['styles', 'rating', 'setlist', 'photos', 'videos' => fn (HasMany $videos) => $videos->live()])
            ->first() ?? throw new NotFoundHttpException('No artist has that address.');
    }
}
