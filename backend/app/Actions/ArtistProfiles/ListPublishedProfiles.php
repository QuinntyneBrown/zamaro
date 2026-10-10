<?php

namespace App\Actions\ArtistProfiles;

use App\Models\Artist;
use Illuminate\Support\Collection;

/**
 * Every profile the public can open, for the sitemap (L2-112.3). Suspended, unpublished and deleted
 * artists fall outside the visible scope, as they do for the profile itself.
 */
class ListPublishedProfiles
{
    /**
     * @return Collection<int, Artist>
     */
    public function handle(): Collection
    {
        return Artist::query()->visible()->orderBy('slug')->get(['slug', 'updated_at']);
    }
}
