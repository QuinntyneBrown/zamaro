<?php

namespace App\Services\ArtistProfiles;

use InvalidArgumentException;

/**
 * Public URLs for media files on the media domain (L2-088). In M1 the files are public and the URL
 * is the base plus the key; signing for private documents (L2-076.3) arrives with uploads.
 */
class MediaUrlSigner
{
    /** The rendition the `src` falls back to; the srcset offers every width. */
    private const FALLBACK_WIDTH = 800;

    public function url(string $key): string
    {
        return rtrim(config('zamaro.media.base_url'), '/').'/'.$key;
    }

    /**
     * An image's WebP widths as `src`, `srcset` and the intrinsic size of `src`.
     *
     * @param  list<array{width: int, height: int, format: string, key: string}>  $renditions
     * @return array{src: string, srcset: string, width: int, height: int}
     */
    public function image(array $renditions): array
    {
        $webp = collect($renditions)->where('format', 'webp')->sortBy('width')->values();
        $fallback = $webp->firstWhere('width', self::FALLBACK_WIDTH) ?? $webp->last()
            ?? throw new InvalidArgumentException('An image needs at least one WebP rendition.');

        return [
            'src' => $this->url((string) $fallback['key']),
            'srcset' => $webp->map(fn (array $rendition) => $this->url($rendition['key']).' '.$rendition['width'].'w')->implode(', '),
            'width' => (int) $fallback['width'],
            'height' => (int) $fallback['height'],
        ];
    }
}
