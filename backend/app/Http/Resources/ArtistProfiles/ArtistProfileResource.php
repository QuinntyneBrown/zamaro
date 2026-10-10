<?php

namespace App\Http\Resources\ArtistProfiles;

use App\Http\Resources\Reviews\ReviewResource;
use App\Models\Artist;
use App\Models\ArtistPhoto;
use App\Models\ArtistStyle;
use App\Models\ArtistVideo;
use App\Models\SetlistSong;
use App\Support\Media;
use Illuminate\Contracts\Pagination\CursorPaginator;
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
    /** The photo rendition used as `src`; browsers pick from the srcsets. */
    private const PHOTO_SRC_WIDTH = 800;

    /** Poster frames are stored as one 16:9 WebP. */
    private const POSTER_WIDTH = 800;

    private const POSTER_HEIGHT = 450;

    private ?CursorPaginator $latestReviews = null;

    private int $reviewTotal = 0;

    /** The newest visible reviews and how many there are in all (L2-018.1). */
    public function withReviews(CursorPaginator $latest, int $total): static
    {
        $this->latestReviews = $latest;
        $this->reviewTotal = $total;

        return $this;
    }

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
            /** In the artist's order. `src` is the 800 px WebP, and `width` and `height` are its size. */
            'photos' => $artist->photos->map(fn (ArtistPhoto $photo) => [
                'id' => $photo->id,
                /** The artist's alt text (L2-015.1). */
                'alt' => $photo->alt_text,
                'src' => Media::url($this->rendition($photo, 'webp', self::PHOTO_SRC_WIDTH)['key']),
                'width' => self::PHOTO_SRC_WIDTH,
                'height' => (int) round($photo->height * self::PHOTO_SRC_WIDTH / $photo->width),
                /** WebP renditions with width descriptors (400, 800, 1200 and 1600 px). */
                'srcset' => $this->srcset($photo, 'webp'),
                /** The same widths in AVIF. */
                'avifSrcset' => $this->srcset($photo, 'avif'),
            ])->values()->all(),
            /** Live videos only, in the artist's order (L2-014.3). */
            'videos' => $artist->videos->map(fn (ArtistVideo $video) => [
                'id' => $video->id,
                /** Song and setting: "Way Maker — live at Bethel Pentecostal, Hamilton". */
                'title' => $video->title,
                'durationSeconds' => (int) $video->duration_seconds,
                /** The poster frame, or null to keep the halftone placeholder. */
                'poster' => $video->poster_key === null ? null : [
                    'src' => Media::url($video->poster_key),
                    'width' => self::POSTER_WIDTH,
                    'height' => self::POSTER_HEIGHT,
                ],
                /** The HLS manifest of the adaptive renditions. */
                'stream' => Media::url((string) $video->manifest_key),
                /** The artist's WebVTT captions, or null when they supplied none (L2-014.2). */
                'captions' => $video->captions_key === null ? null : [
                    'src' => Media::url($video->captions_key),
                    'lang' => 'en',
                ],
            ])->values()->all(),
            /** The newest visible reviews, so the section renders without a second request. */
            'reviews' => [
                /** Visible reviews in all, for "Show all 38 reviews". */
                'total' => $this->reviewTotal,
                /** Up to 4, newest first. */
                'items' => ReviewResource::collection($this->latestReviews?->items() ?? []),
                /** Pass as `cursor` to `GET /artists/{slug}/reviews` for the rest; null when there are no more. */
                'nextCursor' => $this->latestReviews?->nextCursor()?->encode(),
            ],
        ];
    }

    private function srcset(ArtistPhoto $photo, string $format): string
    {
        return implode(', ', array_map(
            fn (array $rendition) => Media::url($rendition['key'])." {$rendition['width']}w",
            $photo->renditionsIn($format),
        ));
    }

    /**
     * @return array{width: int, format: string, key: string}
     */
    private function rendition(ArtistPhoto $photo, string $format, int $width): array
    {
        return collect($photo->renditionsIn($format))->firstWhere('width', $width);
    }
}
