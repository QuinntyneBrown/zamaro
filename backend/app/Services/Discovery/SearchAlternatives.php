<?php

namespace App\Services\Discovery;

/** Ways forward from a sold-out search (L2-011). */
final class SearchAlternatives
{
    /**
     * @param  list<array{date: string, count: int}>  $nearbyDates  closest first, at most three
     * @param  array{km: int, count: int}|null  $widerRadius  the smallest wider radius with matches
     */
    public function __construct(
        public readonly array $nearbyDates,
        public readonly ?array $widerRadius,
        public readonly bool $filtersApplied,
    ) {}
}
