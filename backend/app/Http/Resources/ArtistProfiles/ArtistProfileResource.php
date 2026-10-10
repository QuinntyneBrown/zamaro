<?php

namespace App\Http\Resources\ArtistProfiles;

use App\Models\Artist;
use App\Models\ArtistStyle;
use App\Models\SetlistSong;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The public profile. Every field is listed here on purpose: coordinates, the account email, phone
 * numbers and payout data never leave the server (L2-083).
 *
 * @property Artist $resource
 */
class ArtistProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $artist = $this->resource;

        return [
            'slug' => $artist->slug,
            'displayName' => $artist->display_name,
            /** A solo act's first name, or a group's whole name, for "Songs Abigail leads". */
            'firstName' => $artist->firstName(),
            /** @var 'she'|'he'|'they' */
            'pronoun' => $artist->pronoun->value,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $artist->act_type->value,
            'headline' => $artist->headline,
            /** Null when the artist has not set one: show "About {firstName}". */
            'aboutHeading' => $artist->about_heading,
            /** Plain text; paragraphs are separated by a blank line. Never render it as HTML. */
            'bio' => (string) $artist->bio,
            /** The city only, never an address (L2-083). */
            'baseCity' => $artist->base_city,
            'maxDriveKm' => $artist->max_drive_km,
            'fromPrice' => [
                'cents' => $artist->from_price_cents,
                'currency' => 'CAD',
            ],
            'ticketNumber' => $artist->ticket_number,
            'rating' => $artist->rating?->rating,
            'reviewCount' => $artist->rating?->review_count ?? 0,
            'styles' => $artist->styles->map(fn (ArtistStyle $style) => $style->style->value)->values()->all(),
            'setlist' => $artist->setlist->map(fn (SetlistSong $song) => [
                'position' => $song->position,
                'title' => $song->title,
                'writer' => $song->writer,
                /** A key such as `B-flat` or `E-minor`, or `any`. */
                'key' => $song->key->value,
            ])->values()->all(),
        ];
    }
}
