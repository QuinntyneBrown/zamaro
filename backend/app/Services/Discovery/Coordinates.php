<?php

namespace App\Services\Discovery;

/** A point in decimal degrees. */
final class Coordinates
{
    private const EARTH_RADIUS_KM = 6371.0;

    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude,
    ) {}

    /** Rounded to 4 decimal places (about 11 m), the precision distances are cached at (L2-002). */
    public function key(): string
    {
        return sprintf('%.4f,%.4f', $this->latitude, $this->longitude);
    }

    /** Great-circle (straight-line) distance in kilometres. */
    public function straightLineKmTo(self $other): float
    {
        $lat1 = deg2rad($this->latitude);
        $lat2 = deg2rad($other->latitude);
        $a = sin(($lat2 - $lat1) / 2) ** 2
            + cos($lat1) * cos($lat2) * sin(deg2rad($other->longitude - $this->longitude) / 2) ** 2;

        return 2 * self::EARTH_RADIUS_KM * asin(min(1.0, sqrt($a)));
    }
}
