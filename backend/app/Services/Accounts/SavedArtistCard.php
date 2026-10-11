<?php

namespace App\Services\Accounts;

use App\Models\Artist;
use App\Services\Discovery\Distance;
use Carbon\CarbonImmutable;

/** One saved artist on the list (accounts/view-saved-artists). */
final class SavedArtistCard
{
    public function __construct(
        public readonly Artist $artist,
        /** From the booker's church; null when they have none yet. */
        public readonly ?Distance $distance,
        public readonly CarbonImmutable $savedAt,
        /** Free on the date asked for; null when no date was given. */
        public readonly ?bool $free,
    ) {}
}
