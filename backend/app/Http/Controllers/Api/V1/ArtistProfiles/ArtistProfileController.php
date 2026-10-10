<?php

namespace App\Http\Controllers\Api\V1\ArtistProfiles;

use App\Actions\ArtistProfiles\ShowArtistProfile;
use App\Actions\Reviews\ListArtistReviews;
use App\Http\Controllers\Controller;
use App\Http\Resources\ArtistProfiles\ArtistProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ArtistProfileController extends Controller
{
    /**
     * An artist's public profile, for guests and bookers alike.
     *
     * @throws NotFoundHttpException when no visible artist has the address
     */
    public function show(Request $request, ShowArtistProfile $profiles, ListArtistReviews $reviews, string $slug): JsonResponse
    {
        $artist = $profiles->handle($slug);

        // Public and shared: the server render's copy reaches the browser and the CDN may reuse it
        // briefly. Validators (ETag) arrive with index-and-share-profile.
        return (new ArtistProfileResource($artist))
            ->withReviews($reviews->page($artist, ListArtistReviews::ON_PROFILE), $reviews->total($artist))
            ->response($request)
            ->setPublic()
            ->setMaxAge(0)
            ->setSharedMaxAge(60);
    }
}
