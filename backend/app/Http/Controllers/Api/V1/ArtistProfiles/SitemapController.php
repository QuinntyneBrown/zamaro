<?php

namespace App\Http\Controllers\Api\V1\ArtistProfiles;

use App\Actions\ArtistProfiles\ListPublishedProfiles;
use App\Http\Controllers\Controller;
use App\Models\Artist;
use Illuminate\Http\JsonResponse;

class SitemapController extends Controller
{
    /**
     * Every published profile and when it last changed. The web server serves it as `/sitemap.xml`
     * with the site's own addresses (L2-112.3).
     */
    public function __invoke(ListPublishedProfiles $profiles): JsonResponse
    {
        return response()->json(['data' => $profiles->handle()->map(fn (Artist $artist) => [
            'slug' => $artist->slug,
            /** `YYYY-MM-DD`, the day the artist's record last changed. */
            'lastModified' => $artist->updated_at->toDateString(),
        ])->all()])->setPublic()->setMaxAge(0)->setSharedMaxAge(60);
    }
}
