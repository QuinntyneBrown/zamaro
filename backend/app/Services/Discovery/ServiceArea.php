<?php

namespace App\Services\Discovery;

/** Every address within 200 km by road of Toronto City Hall (L2-001). */
class ServiceArea
{
    public const MAX_ROAD_KM = 200;

    public function __construct(private readonly DistanceService $distances) {}

    public static function cityHall(): Coordinates
    {
        return new Coordinates(43.6534, -79.3841);
    }

    public function contains(Coordinates $point): bool
    {
        return $this->distances->fromOrigin(self::cityHall(), [$point])[0]->km <= self::MAX_ROAD_KM;
    }
}
