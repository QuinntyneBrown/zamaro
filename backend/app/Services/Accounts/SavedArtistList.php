<?php

namespace App\Services\Accounts;

use Carbon\CarbonImmutable;

/** A booker's visible saved artists, newest save first (accounts/view-saved-artists). */
final class SavedArtistList
{
    /**
     * @param  list<SavedArtistCard>  $cards
     */
    public function __construct(
        public readonly array $cards,
        public readonly ?CarbonImmutable $date,
    ) {}
}
