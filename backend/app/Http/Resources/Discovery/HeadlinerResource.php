<?php

namespace App\Http\Resources\Discovery;

use App\Services\Discovery\Lineup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The headliner (L2-006.2): a lineup card plus the season it leads and its quote.
 *
 * @property Lineup $resource
 */
class HeadlinerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $quote = $this->resource->quote;

        return [
            ...(new LineupCardResource($this->resource->headliner))->toArray($request),
            /** "Most booked this autumn". */
            'season' => $this->resource->season->value,
            /** The most recent visible 5-star review, at most 160 characters; null when there is none. */
            'quote' => $quote === null ? null : [
                'text' => $quote->text,
                'reviewerName' => $quote->reviewerName,
                'city' => $quote->city,
            ],
        ];
    }
}
