<?php

namespace App\Http\Controllers\Api\V1\ArtistProfiles;

use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Actions\ArtistProfiles\ShowArtistProfile;
use App\Actions\Reviews\ListArtistReviews;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArtistProfiles\ShowArtistProfileRequest;
use App\Http\Resources\ArtistProfiles\ArtistProfileResource;
use App\Services\Discovery\SimilarArtistFinder;
use Illuminate\Http\JsonResponse;

class ArtistProfileController extends Controller
{
    /**
     * An artist's public profile, for guests and bookers alike. A retired slug answers 301 to the
     * current one; a missing or hidden artist is a 404 problem with up to 3 similar artists free on
     * the carried search date (L2-021).
     *
     * @throws ArtistMoved when the address is the artist's retired slug
     * @throws ArtistNotFound when no viewable artist has the address
     */
    public function show(
        ShowArtistProfileRequest $request,
        ShowArtistProfile $profiles,
        ListArtistReviews $reviews,
        SimilarArtistFinder $similar,
        string $slug,
    ): JsonResponse {
        try {
            $artist = $profiles->handle($slug);
        } catch (ArtistNotFound $missing) {
            throw $missing->withSimilarArtists($similar->forMissingArtist($missing->primaryStyle, $request->carriedSearch()));
        }

        // Public and shared: the server render's copy reaches the browser and the CDN may reuse it for
        // 60 seconds; the route's cache.headers middleware adds the ETag and answers 304 (L2-089.1).
        return (new ArtistProfileResource($artist))
            ->withReviews($reviews->page($artist, ListArtistReviews::ON_PROFILE), $reviews->total($artist))
            ->response($request)
            ->setPublic()
            ->setMaxAge(0)
            ->setSharedMaxAge(60);
    }
}
