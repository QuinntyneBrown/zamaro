<?php

namespace App\Services\Discovery;

final class GeocodedAddress
{
    public function __construct(
        /** As the location field shows it, e.g. "Burlington, ON". */
        public readonly string $normalisedAddress,
        public readonly string $city,
        public readonly Coordinates $point,
    ) {}
}
