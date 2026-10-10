<?php

namespace App\Contracts;

use App\Services\Discovery\GeocodedAddress;

/**
 * Turns an address or town into coordinates. The vendor is chosen in M10; until then FakeGeocoder is
 * bound (ADR-0002).
 */
interface Geocoder
{
    /** Null when the place cannot be resolved. */
    public function geocode(string $address): ?GeocodedAddress;
}
