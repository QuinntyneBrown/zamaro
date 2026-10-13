<?php

namespace App\Http\Controllers\Api\V1\ArtistOnboarding;

use App\Actions\ArtistOnboarding\ApplicationInReview;
use App\Actions\ArtistOnboarding\SubmitArtistApplication;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArtistOnboarding\SubmitArtistApplicationRequest;
use App\Http\Resources\ArtistOnboarding\ArtistApplicationResource;
use App\Models\ArtistApplication;
use Illuminate\Http\JsonResponse;

/** Applying as an artist (apply-as-artist, L2-047). */
class ArtistApplicationsController extends Controller
{
    /**
     * Send an application.
     *
     * 201 with the application, its number and its reply-by date. A retry carrying the same
     * `Idempotency-Key` answers 200 with the application it already created (L2-047.5). The bot
     * challenge runs first (L2-077.4).
     *
     * @throws ApplicationInReview 409 `application-in-review` when the email already has one pending
     */
    public function store(SubmitArtistApplicationRequest $request, SubmitArtistApplication $submit): JsonResponse
    {
        $data = $request->validated();
        $result = $submit->handle($data, $data['idempotencyKey'], $request->user());
        // Read back from the database, so the timestamps carry their zone as every later read does.
        $application = ArtistApplication::with(['videos', 'references'])->findOrFail($result['application']->id);

        if (! $result['created']) {
            return (new ArtistApplicationResource($application))->response();
        }

        return (new ArtistApplicationResource($application))->response()->setStatusCode(201);
    }
}
