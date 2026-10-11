<?php

namespace App\Integrations\Geocoding;

use App\Contracts\Geocoder;
use App\Integrations\Routing\CastRoutes;
use App\Services\Discovery\GeocodedAddress;
use Illuminate\Support\Str;

/**
 * Deterministic geocoder for development and tests (ADR-0002): resolves the towns in CastRoutes,
 * ignoring case and a trailing ", ON", to the same anchors the fake router uses, and the cast's church
 * addresses ("2150 Lakeshore Road, Burlington, ON L7R 1A3") to their towns. Any other street address
 * cannot be found.
 */
class FakeGeocoder implements Geocoder
{
    /** "street, town" in lower case => the town's anchor. */
    public const STREETS = [
        '2150 lakeshore road, burlington' => 'Burlington',
        '180 elgin street, ottawa' => 'Ottawa',
        '8150 main street east, milton' => 'Milton',
    ];

    public function geocode(string $address): ?GeocodedAddress
    {
        $lower = Str::of($address)->squish()->lower()->value();
        foreach (self::STREETS as $street => $town) {
            if (str_starts_with($lower, $street)) {
                return new GeocodedAddress(Str::of($address)->squish()->value(), $town, CastRoutes::anchor($town));
            }
        }

        $town = Str::of($address)->trim()->replaceMatches('/(,\s*|\s+)(ON|Ontario)$/i', '')->trim()->lower()->value();

        foreach (CastRoutes::TOWNS as $name => $anchor) {
            if (Str::lower($name) === $town) {
                return new GeocodedAddress("{$name}, ON", $name, CastRoutes::anchor($anchor));
            }
        }

        return null;
    }
}
