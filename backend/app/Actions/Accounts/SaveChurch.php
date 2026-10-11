<?php

namespace App\Actions\Accounts;

use App\Contracts\Geocoder;
use App\Models\Church;
use App\Models\User;
use App\Rules\NorthAmericanPhone;
use App\Services\Discovery\ServiceArea;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Saves a booker's one church (L2-024, L2-001): the address is geocoded and must be within 200 km of
 * Toronto by road before anything is written. Bookings keep their own snapshot of the address, so
 * this never changes them.
 */
class SaveChurch
{
    public function __construct(private readonly Geocoder $geocoder, private readonly ServiceArea $serviceArea) {}

    /**
     * @param  array{name: string, streetAddress: string, city: string, postalCode: string, phone: string, denomination?: ?string, typicalAttendance?: ?int}  $church
     *
     * @throws ValidationException on `streetAddress` when the address cannot be found, or on
     *                             `serviceArea` when it is outside the service area
     */
    public function handle(User $booker, array $church): Church
    {
        $street = Str::squish($church['streetAddress']);
        $city = Str::squish($church['city']);
        $postalCode = self::postalCode($church['postalCode']);

        $place = $this->geocoder->geocode("{$street}, {$city}, ON {$postalCode}");
        if ($place === null) {
            throw ValidationException::withMessages(['streetAddress' => 'We couldn’t find that address. Check the street and postal code.']);
        }
        if (! $this->serviceArea->contains($place->point)) {
            throw ValidationException::withMessages(['serviceArea' => 'Zamaro serves churches within 200 km of Toronto.']);
        }

        return DB::transaction(fn () => Church::updateOrCreate(['booker_id' => $booker->id], [
            'name' => Str::squish($church['name']),
            'street_address' => $street,
            'city' => $city,
            'province' => 'ON',
            'postal_code' => $postalCode,
            'latitude' => $place->point->latitude,
            'longitude' => $place->point->longitude,
            'phone' => NorthAmericanPhone::toE164($church['phone']),
            'denomination' => filled($church['denomination'] ?? null) ? Str::squish($church['denomination']) : null,
            'typical_attendance' => $church['typicalAttendance'] ?? null,
        ]));
    }

    /** "L7R 1A3" from "l7r1a3". */
    private static function postalCode(string $value): string
    {
        $compact = Str::upper(preg_replace('/\s/', '', $value));

        return substr($compact, 0, 3).' '.substr($compact, 3);
    }
}
