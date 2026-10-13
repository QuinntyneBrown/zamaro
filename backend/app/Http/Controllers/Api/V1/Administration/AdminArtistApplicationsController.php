<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Http\Controllers\Controller;
use App\Http\Resources\Administration\AdminArtistApplicationResource;
use App\Http\Resources\Administration\AdminArtistApplicationRowResource;
use App\Models\ArtistApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

/** The administrator's application queue and review screen (review-artist-application, L2-067.1). */
class AdminArtistApplicationsController extends Controller
{
    /**
     * The applications waiting for a decision.
     *
     * Submitted, oldest first.
     */
    public function index(): AnonymousResourceCollection
    {
        $waiting = ArtistApplication::where('status', ApplicationStatus::Submitted)
            ->orderBy('submitted_at')->orderBy('id')
            ->get();

        $lastDecided = ArtistApplication::whereNotNull('decided_at')->max('decided_at');

        return AdminArtistApplicationRowResource::collection($waiting)->additional([
            'meta' => [
                /** How many are waiting. */
                'waiting' => $waiting->count(),
                /**
                 * When the last decision was made, Toronto time, or null before the first ("The last one was decided Mon 5 Oct").
                 *
                 * @var string|null
                 */
                'lastDecidedAt' => $lastDecided === null ? null : Carbon::parse($lastDecided)->setTimezone(config('app.timezone'))->toIso8601String(),
            ],
        ]);
    }

    /**
     * One application, in full.
     *
     * Every applicant detail, the videos, the references with their contacts, the latest Vulnerable
     * Sector Check and the decision. Opening it is audited (L2-069.1).
     */
    public function show(Request $request, ArtistApplication $application, RecordAuditEntry $audit): AdminArtistApplicationResource
    {
        $audit->handle($request->user(), AuditAction::ApplicationViewed, $application, AuditOutcome::Succeeded, ['application_number' => $application->number]);

        return new AdminArtistApplicationResource($application->load(['videos', 'references.verifier', 'decider']));
    }
}
