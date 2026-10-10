<?php

namespace App\Integrations\Routing;

use App\Services\Discovery\Coordinates;

/**
 * The places in docs/mocks/README.md and the road distances the mocks show, so the fake router
 * reproduces the mock numbers exactly. FakeGeocoder uses the same anchors.
 */
final class CastRoutes
{
    /** @var array<string, array{float, float}> */
    public const ANCHORS = [
        'Toronto City Hall' => [43.6534, -79.3841],
        'Burlington' => [43.325, -79.799],
        'Hamilton' => [43.2557, -79.8711],
        'Mississauga' => [43.589, -79.6441],
        'Brampton' => [43.7315, -79.7624],
        'Etobicoke' => [43.6205, -79.5132],
        'North York' => [43.7615, -79.4111],
        'Markham' => [43.8561, -79.337],
        'Scarborough' => [43.7764, -79.2318],
        'Ajax' => [43.8509, -79.0204],
        'Oshawa' => [43.8971, -78.8658],
        'Barrie' => [44.3894, -79.6903],
        'Kitchener' => [43.4516, -80.4925],
        'Niagara' => [43.0896, -79.0849],
        'Ottawa' => [45.4215, -75.6972],
    ];

    /** Towns the fake geocoder knows; Toronto resolves to City Hall. */
    public const TOWNS = [
        'Toronto' => 'Toronto City Hall',
        'Burlington' => 'Burlington',
        'Mississauga' => 'Mississauga',
        'Brampton' => 'Brampton',
        'Hamilton' => 'Hamilton',
        'Markham' => 'Markham',
        'Ajax' => 'Ajax',
        'Oshawa' => 'Oshawa',
        'Barrie' => 'Barrie',
        'Kitchener' => 'Kitchener',
        'Niagara' => 'Niagara',
        'Etobicoke' => 'Etobicoke',
        'North York' => 'North York',
        'Scarborough' => 'Scarborough',
        'Ottawa' => 'Ottawa',
    ];

    /** Road kilometres between anchor pairs; symmetric. */
    public const ROAD_KM = [
        ['Burlington', 'Hamilton', 14],
        ['Burlington', 'Mississauga', 32],
        ['Burlington', 'Brampton', 44],
        ['Burlington', 'Etobicoke', 48],
        ['Burlington', 'North York', 63],
        ['Burlington', 'Markham', 74],
        ['Burlington', 'Scarborough', 81],
        ['Burlington', 'Ajax', 97],
        ['Toronto City Hall', 'Burlington', 55],
        ['Toronto City Hall', 'Ottawa', 450],
    ];

    public static function anchor(string $place): Coordinates
    {
        [$latitude, $longitude] = self::ANCHORS[$place];

        return new Coordinates($latitude, $longitude);
    }
}
