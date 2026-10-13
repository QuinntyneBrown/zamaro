<?php

namespace App\Actions\ArtistOnboarding;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\ApplicationReference;
use App\Models\ArtistApplication;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * An administrator ticks or unticks a church reference of a Submitted application
 * (review-artist-application, L2-048.1): who and when are kept, and each change is audited (L2-069.1).
 */
class SetReferenceVerification
{
    public function __construct(private readonly RecordAuditEntry $audit) {}

    /**
     * @throws ApplicationAlreadyDecided when the application is no longer Submitted
     */
    public function handle(ArtistApplication $application, ApplicationReference $reference, bool $verified, User $administrator): ApplicationReference
    {
        return DB::transaction(function () use ($application, $reference, $verified, $administrator): ApplicationReference {
            $application = ArtistApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ($application->status !== ApplicationStatus::Submitted) {
                throw new ApplicationAlreadyDecided;
            }

            $reference->forceFill([
                'verified_at' => $verified ? now()->utc() : null,
                'verified_by' => $verified ? $administrator->id : null,
            ])->save();

            $this->audit->handle($administrator, AuditAction::ReferenceVerified, $reference, AuditOutcome::Succeeded, [
                'application_id' => $application->id,
                'application_number' => $application->number,
                'verified' => $verified,
            ]);

            return $reference->fresh(['verifier']);
        });
    }
}
