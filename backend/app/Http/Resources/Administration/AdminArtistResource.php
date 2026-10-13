<?php

namespace App\Http\Resources\Administration;

use App\Models\Artist;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One row of the admin Artists list (pages/admin-artists, L2-067).
 *
 * @property Artist $resource
 */
class AdminArtistResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $artist = $this->resource;

        return [
            'id' => $artist->id,
            'name' => $artist->display_name,
            'slug' => $artist->slug,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $artist->act_type->value,
            'baseCity' => $artist->base_city,
            /** One decimal, or null before the first review. */
            'rating' => $artist->rating?->rating === null ? null : (float) $artist->rating->rating,
            /** @var 'approved'|'suspended' */
            'status' => $artist->status->value,
        ];
    }
}
