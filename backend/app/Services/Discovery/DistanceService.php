<?php

namespace App\Services\Discovery;

use App\Contracts\RoutingProvider;

/** Driving distances between an event location and artists' bases (L2-002). */
class DistanceService
{
    public function __construct(private readonly RoutingProvider $routing) {}

    /**
     * @param  array<int|string, Coordinates>  $destinations
     * @return array<int|string, Distance> keyed like `$destinations`
     */
    public function fromOrigin(Coordinates $origin, array $destinations): array
    {
        if ($destinations === []) {
            return [];
        }

        $legs = $this->routing->matrix($origin, array_values($destinations));

        return array_combine(
            array_keys($destinations),
            array_map(fn (array $leg) => Distance::fromRoute($leg['metres'], $leg['seconds']), $legs),
        );
    }
}
