<?php

namespace App\Http\Resources\ArtistProfiles;

use App\Models\Artist;
use App\Models\ArtistPhoto;
use App\Models\ArtistStyle;
use App\Models\ArtistVideo;
use App\Models\SetlistSong;
use App\Services\ArtistProfiles\MediaUrlSigner;
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
        $media = app(MediaUrlSigner::class);

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
            /** Live photos in the artist's order, each in WebP widths from the media domain (L2-015). */
            'photos' => $artist->photos->map(fn (ArtistPhoto $photo) => $this->photo($photo, $media))->values()->all(),
            /** Live videos only, in the artist's order (L2-014). */
            'videos' => $artist->videos->map(fn (ArtistVideo $video) => $this->video($video, $media))->values()->all(),
        ];
    }

    private function photo(ArtistPhoto $photo, MediaUrlSigner $media): array
    {
        $image = $media->image($photo->renditions);

        return [
            'id' => (string) $photo->id,
            // The artist's alt text (5–150 characters).
            'alt' => (string) $photo->alt_text,
            'src' => $image['src'],
            'srcset' => $image['srcset'],
            'width' => $image['width'],
            'height' => $image['height'],
            // AVIF widths arrive with uploads (M4).
            'avifSrcset' => null,
        ];
    }

    private function video(ArtistVideo $video, MediaUrlSigner $media): array
    {
        return [
            'id' => (string) $video->id,
            // Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton".
            'title' => (string) $video->title,
            'durationSeconds' => (int) $video->duration_seconds,
            // The HLS manifest of the adaptive renditions.
            'stream' => $media->url((string) $video->manifest_key),
            // The poster frame in WebP widths, or null before one exists.
            'poster' => $video->poster_renditions === [] ? null : $media->image($video->poster_renditions),
            // The artist's WebVTT file, or null when they supplied none.
            'captions' => $video->captions_key === null ? null : [
                'src' => $media->url($video->captions_key),
                'language' => (string) $video->captions_language,
            ],
        ];
    }
}
