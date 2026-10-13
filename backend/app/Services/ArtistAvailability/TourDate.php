<?php

namespace App\Services\ArtistAvailability;

use App\Enums\GatheringKind;
use App\Enums\TourDateStatus;
use Carbon\CarbonImmutable;

/** One row of the "On tour" list. A booked date names only the gathering and the church's city. */
final readonly class TourDate
{
    public function __construct(
        public CarbonImmutable $date,
        public TourDateStatus $status,
        public ?GatheringKind $kind = null,
        public ?string $city = null,
    ) {}
}
