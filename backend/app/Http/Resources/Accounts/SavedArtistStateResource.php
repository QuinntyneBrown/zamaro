<?php

namespace App\Http\Resources\Accounts;

use App\Services\Accounts\SavedArtistState;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Where a saved artist stands after a save or removal, with the server's count so the header always
 * matches it (accounts/save-artist).
 *
 * @property SavedArtistState $resource
 */
class SavedArtistStateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'artistId' => $this->resource->artistId,
            'saved' => $this->resource->saved,
            /** The booker's saved artists now. */
            'savedCount' => $this->resource->savedCount,
            /** The booker's first save ever: "Saved artists are private" shows once. */
            'firstSave' => $this->resource->firstSave,
        ];
    }
}
