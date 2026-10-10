<?php

namespace App\Contracts;

use App\Services\Discovery\Coordinates;

/**
 * Driving distances from a routing vendor (L2-002). One matrix call covers every destination of a
 * search. The vendor is chosen in M10; until then FakeRoutingProvider is bound (ADR-0002).
 */
interface RoutingProvider
{
    /**
     * @param  list<Coordinates>  $destinations
     * @return list<array{metres: int, seconds: int}> one leg per destination, in the same order
     *
     * @throws RoutingUnavailable when the vendor fails or takes longer than 2 seconds
     */
    public function matrix(Coordinates $origin, array $destinations): array;
}
