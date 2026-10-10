<?php

namespace App\Services\Discovery;

use App\Enums\GatheringKind;
use App\Enums\SearchSort;
use Carbon\CarbonImmutable;

/** A validated search: who is free on `eventDate` within `radiusKm` of the event location. */
final class SearchCriteria
{
    public function __construct(
        public readonly CarbonImmutable $eventDate,
        public readonly GatheringKind $kind,
        public readonly Coordinates $location,
        public readonly int $radiusKm,
        public readonly SearchSort $sort = SearchSort::Closest,
        public readonly LineupFilter $filter = new LineupFilter,
    ) {}
}
