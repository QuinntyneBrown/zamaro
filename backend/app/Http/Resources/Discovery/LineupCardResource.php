<?php

namespace App\Http\Resources\Discovery;

use App\Models\ArtistStyle;
use App\Services\Discovery\LineupCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One ticket in the lineup (L2-006): public fields only.
 *
 * @property LineupCard $resource
 */
class LineupCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $artist = $this->resource->artist;
        $distance = $this->resource->distance;

        return [
            'slug' => $artist->slug,
            'name' => $artist->display_name,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $artist->act_type->value,
            'styles' => $artist->styles->map(fn (ArtistStyle $style) => $style->style->value)->values()->all(),
            'city' => $artist->base_city,
            'distance' => [
                /** Whole kilometres by road. */
                'km' => $distance->km,
                /** Rounded to 5 minutes. */
                'driveMinutes' => $distance->driveMinutes,
                /** Estimated from the straight line because routing was unavailable; show "about". */
                'approximate' => $distance->approximate,
            ],
            /** Mean over distinct churches, one decimal; null until the first review. */
            'rating' => $artist->rating?->rating,
            'reviewCount' => $artist->rating?->review_count ?? 0,
            'fromPrice' => [
                'cents' => $artist->from_price_cents,
                'currency' => 'CAD',
            ],
        ];
    }
}
