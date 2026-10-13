<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Actions\ArtistOnboarding\ApplicationAlreadyDecided;
use App\Actions\ArtistOnboarding\SetReferenceVerification;
use App\Http\Controllers\Controller;
use App\Http\Requests\Administration\SetReferenceVerificationRequest;
use App\Http\Resources\Administration\AdminApplicationReferenceResource;
use App\Models\ApplicationReference;
use App\Models\ArtistApplication;

/** The tick on each church reference of an application under review (review-artist-application, L2-048.1). */
class AdminApplicationReferencesController extends Controller
{
    /**
     * Tick or untick a reference.
     *
     * Saves at once with who and when, and is audited (L2-069.1). The reference must belong to the
     * application in the address.
     *
     * @throws ApplicationAlreadyDecided 409 `application-already-decided` once the application is approved or rejected
     */
    public function update(SetReferenceVerificationRequest $request, ArtistApplication $application, ApplicationReference $reference, SetReferenceVerification $set): AdminApplicationReferenceResource
    {
        abort_unless($reference->artist_application_id === $application->id, 404);

        return new AdminApplicationReferenceResource($set->handle($application, $reference, $request->boolean('verified'), $request->user()));
    }
}
