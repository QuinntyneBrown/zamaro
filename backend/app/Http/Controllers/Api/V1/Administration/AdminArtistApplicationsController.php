<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Actions\ArtistOnboarding\ApplicationAlreadyDecided;
use App\Actions\ArtistOnboarding\ApproveArtistApplication;
use App\Actions\ArtistOnboarding\RejectArtistApplication;
use App\Actions\Audit\RecordAuditEntry;
use App\Enums\ApplicationRejectionReason;
use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Http\Controllers\Controller;
use App\Http\Requests\Administration\RejectArtistApplicationRequest;
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

        return new AdminArtistApplicationResource($application->load(['videos', 'references.verifier', 'decider', 'artist']));
    }

    /**
     * Approve an application.
     *
     * Both references must be verified (422 on `references` otherwise). The applicant gains the Artist
     * role, an Approved artist is created and stays hidden until payout setup (L2-048.1, L2-048.3), and
     * the next-step email follows. Audited (L2-069.1).
     *
     * @throws ApplicationAlreadyDecided 409 `application-already-decided` once approved or rejected
     */
    public function approve(Request $request, ArtistApplication $application, ApproveArtistApplication $approve): AdminArtistApplicationResource
    {
        return new AdminArtistApplicationResource($approve->handle($application, $request->user()));
    }

    /**
     * Reject an application.
     *
     * A reason from the fixed list and an optional note of up to 1,000 characters, both emailed to the
     * applicant (L2-048.2). Audited (L2-069.1).
     *
     * @throws ApplicationAlreadyDecided 409 `application-already-decided` once approved or rejected
     */
    public function reject(RejectArtistApplicationRequest $request, ArtistApplication $application, RejectArtistApplication $reject): AdminArtistApplicationResource
    {
        $note = $request->validated('note');

        return new AdminArtistApplicationResource($reject->handle(
            $application,
            ApplicationRejectionReason::from($request->validated('reason')),
            is_string($note) ? $note : null,
            $request->user(),
        ));
    }
}
