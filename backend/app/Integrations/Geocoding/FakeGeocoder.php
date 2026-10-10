<?php

namespace App\Integrations\Geocoding;

use App\Contracts\Geocoder;
use App\Integrations\Routing\CastRoutes;
use App\Services\Discovery\GeocodedAddress;
use Illuminate\Support\Str;

/**
 * Deterministic geocoder for development and tests (ADR-0002): resolves the towns in CastRoutes,
 * ignoring case and a trailing ", ON", to the same anchors the fake router uses.
 */
class FakeGeocoder implements Geocoder
{
    public function geocode(string $address): ?GeocodedAddress
    {
        $town = Str::of($address)->trim()->replaceMatches('/(,\s*|\s+)(ON|Ontario)$/i', '')->trim()->lower()->value();

        foreach (CastRoutes::TOWNS as $name => $anchor) {
            if (Str::lower($name) === $town) {
                return new GeocodedAddress("{$name}, ON", $name, CastRoutes::anchor($anchor));
            }
        }

        return null;
    }
}
