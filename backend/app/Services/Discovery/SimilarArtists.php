<?php

namespace App\Services\Discovery;

use Carbon\CarbonImmutable;

/** Artists free on `date` within `radiusKm` of the search location, nearest first. */
final class SimilarArtists
{
    /**
     * @param  list<LineupCard>  $cards
     */
    public function __construct(
        public readonly CarbonImmutable $date,
        public readonly int $radiusKm,
        public readonly array $cards,
    ) {}
}
