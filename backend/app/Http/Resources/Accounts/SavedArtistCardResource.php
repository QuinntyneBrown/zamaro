<?php

namespace App\Http\Resources\Accounts;

use App\Models\ArtistStyle;
use App\Services\Accounts\SavedArtistCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One saved artist's ticket (L2-027): the lineup card's public fields, when it was saved and whether
 * the artist is free on the date.
 *
 * @property SavedArtistCard $resource
 */
class SavedArtistCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $artist = $this->resource->artist;
        $distance = $this->resource->distance;

        return [
            'id' => $artist->id,
            'slug' => $artist->slug,
            /** @var 'she'|'he'|'they' */
            'pronoun' => $artist->pronoun->value,
            'name' => $artist->display_name,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $artist->act_type->value,
            'styles' => $artist->styles->map(fn (ArtistStyle $style) => $style->style->value)->values()->all(),
            'city' => $artist->base_city,
            /** From the booker's church; null until they have one. */
            'distance' => $distance === null ? null : [
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
            /**
             * When the booker saved the artist.
             *
             * @format date-time
             */
            'savedAt' => $this->resource->savedAt->toIso8601String(),
            /**
             * On the date asked for; null when no date was given.
             */
            'availability' => $this->resource->free === null ? null : ($this->resource->free ? 'free' : 'booked'),
        ];
    }
}
