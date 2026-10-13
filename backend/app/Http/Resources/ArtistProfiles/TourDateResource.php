<?php

namespace App\Http\Resources\ArtistProfiles;

use App\Services\ArtistAvailability\TourDate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One "On tour" row. A booked date carries only the kind of gathering and the church's city, never
 * the church, its address, the booker or the booking number (L2-017, L2-083).
 *
 * @property TourDate $resource
 */
class TourDateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /** `YYYY-MM-DD`. */
            'date' => $this->resource->date->toDateString(),
            'status' => $this->resource->status->value,
            /** The booked gathering's kind; null on a free date. */
            'kind' => $this->resource->kind?->value,
            /** The booked church's city; null on a free date. */
            'city' => $this->resource->city,
        ];
    }
}
