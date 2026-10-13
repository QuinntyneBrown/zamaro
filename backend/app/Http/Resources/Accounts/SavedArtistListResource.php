<?php

namespace App\Http\Resources\Accounts;

use App\Services\Accounts\SavedArtistList;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A booker's saved artists, newest save first, with the visible total and the date checked (L2-027).
 *
 * @property SavedArtistList $resource
 */
class SavedArtistListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'artists' => SavedArtistCardResource::collection($this->resource->cards),
            /** Visible saved artists; a suspended one is not counted. */
            'total' => count($this->resource->cards),
            /**
             * The date the artists were checked against, or null.
             *
             * @format date
             */
            'date' => $this->resource->date?->toDateString(),
        ];
    }
}
