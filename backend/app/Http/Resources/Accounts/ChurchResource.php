<?php

namespace App\Http\Resources\Accounts;

use App\Models\Church;
use App\Rules\NorthAmericanPhone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A booker's church, for its owner only: the phone is decrypted for them and is never in a public
 * resource (L2-083, accounts/manage-church-profile).
 *
 * @property Church $resource
 */
class ChurchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $church = $this->resource;

        return [
            'name' => $church->name,
            'streetAddress' => $church->street_address,
            'city' => $church->city,
            /** Two letters: "ON". */
            'province' => $church->province,
            /** "L7R 1A3". */
            'postalCode' => $church->postal_code,
            /** "905-555-0123". */
            'phone' => NorthAmericanPhone::format($church->phone),
            'denomination' => $church->denomination,
            'typicalAttendance' => $church->typical_attendance,
        ];
    }
}
