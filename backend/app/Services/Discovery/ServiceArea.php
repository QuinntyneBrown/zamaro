<?php

namespace App\Services\Discovery;

use App\Contracts\Geocoder;
use Illuminate\Validation\ValidationException;

/** Every address within 200 km by road of Toronto City Hall (L2-001). */
class ServiceArea
{
    public const MAX_ROAD_KM = 200;

    public function __construct(private readonly DistanceService $distances, private readonly Geocoder $geocoder) {}

    /**
     * A place as an applicant or a church types it, found and inside the area (L2-001).
     *
     * @throws ValidationException on `$attribute`: "We couldn’t find that address…" or "Zamaro serves churches within 200 km of Toronto."
     */
    public function locate(string $address, string $attribute): GeocodedAddress
    {
        $place = $this->geocoder->geocode($address);
        if ($place === null) {
            throw ValidationException::withMessages([$attribute => 'We couldn’t find that address. Check the street and postal code.']);
        }
        if (! $this->contains($place->point)) {
            throw ValidationException::withMessages([$attribute => 'Zamaro serves churches within 200 km of Toronto.']);
        }

        return $place;
    }

    public static function cityHall(): Coordinates
    {
        return new Coordinates(43.6534, -79.3841);
    }

    public function contains(Coordinates $point): bool
    {
        return $this->distances->fromOrigin(self::cityHall(), [$point])[0]->km <= self::MAX_ROAD_KM;
    }
}
