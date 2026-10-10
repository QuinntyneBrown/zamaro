<?php

namespace App\Actions\ArtistProfiles;

use App\Models\Artist;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * A visible artist's public profile (L2-012): styles, rating and setlist. It reads no bookings,
 * churches or account records. Renamed slugs and similar artists arrive with S15.
 */
class ShowArtistProfile
{
    public function handle(string $slug): Artist
    {
        return Artist::query()
            ->visible()
            ->where('slug', $slug)
            ->with(['styles', 'rating', 'setlist'])
            ->first() ?? throw new NotFoundHttpException('No artist has that address.');
    }
}
