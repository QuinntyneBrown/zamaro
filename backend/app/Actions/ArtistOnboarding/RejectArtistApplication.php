<?php

namespace App\Actions\ArtistOnboarding;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\ApplicationRejectionReason;
use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Events\ArtistApplicationRejected;
use App\Models\ArtistApplication;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * An administrator rejects a Submitted application (review-artist-application, L2-048.2): the reason
 * from the fixed list and the optional note are stored and audited, and reach the applicant by email.
 */
class RejectArtistApplication
{
    public function __construct(private readonly RecordAuditEntry $audit) {}

    /**
     * @throws ApplicationAlreadyDecided when the application is no longer Submitted
     */
    public function handle(ArtistApplication $application, ApplicationRejectionReason $reason, ?string $note, User $administrator): ArtistApplication
    {
        $application = DB::transaction(function () use ($application, $reason, $note, $administrator): ArtistApplication {
            $application = ArtistApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ($application->status !== ApplicationStatus::Submitted) {
                throw new ApplicationAlreadyDecided;
            }

            $application->forceFill([
                'status' => ApplicationStatus::Rejected,
                'decided_at' => now()->utc(),
                'decided_by' => $administrator->id,
                'rejection_reason' => $reason->value,
                'rejection_note' => $note === null || trim($note) === '' ? null : trim($note),
            ])->save();

            $this->audit->handle($administrator, AuditAction::ApplicationRejected, $application, AuditOutcome::Succeeded, [
                'application_number' => $application->number,
                'reason' => $reason->value,
                'note_length' => mb_strlen((string) $application->rejection_note),
            ]);

            return $application;
        });

        ArtistApplicationRejected::dispatch($application->id);

        return $application->fresh(['videos', 'references.verifier', 'decider', 'artist']);
    }
}
