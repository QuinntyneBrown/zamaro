<?php

namespace App\Services\ArtistOnboarding;

use App\Models\Artist;
use App\Models\SlugHistory;
use Illuminate\Support\Str;

/**
 * An artist's address from their name (M3 D4): "tobi-adeyemi", then "tobi-adeyemi-2" and on when the
 * name is taken, retired (slug_histories, change-profile-address) or reserved for a page of the site.
 */
class GenerateArtistSlug
{
    /** Paths under /artists that are pages, never an artist (L2-087). */
    public const RESERVED = ['apply', 'new', 'search', 'saved', 'me'];

    public function handle(string $name): string
    {
        $base = Str::slug($name) ?: 'artist';
        $candidate = $base;
        for ($suffix = 2; $this->taken($candidate); $suffix++) {
            $candidate = "{$base}-{$suffix}";
        }

        return $candidate;
    }

    private function taken(string $slug): bool
    {
        return in_array($slug, self::RESERVED, true)
            || Artist::where('slug', $slug)->exists()
            || SlugHistory::where('slug', $slug)->exists();
    }
}
