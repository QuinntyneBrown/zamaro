<?php

namespace App\Actions\ArtistOnboarding;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Enums\VscStatus;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * An administrator verifies a check (L2-049.2): it counts for 3 years from its issue date, so one
 * issued more than 3 years ago is refused (M3 D11), and a check already decided is a conflict. The
 * decision is audited as `vsc.verified` in the same transaction.
 */
class VerifyVulnerableSectorCheck
{
    public const VALID_YEARS = 3;

    public function __construct(private readonly RecordAuditEntry $audit) {}

    /**
     * @throws VscAlreadyDecided
     * @throws ValidationException on `issuedOn` when the check is too old to count
     */
    public function handle(VulnerableSectorCheck $check, User $administrator): VulnerableSectorCheck
    {
        return DB::transaction(function () use ($check, $administrator): VulnerableSectorCheck {
            $check = VulnerableSectorCheck::whereKey($check->id)->lockForUpdate()->firstOrFail();
            if ($check->status !== VscStatus::Pending) {
                throw new VscAlreadyDecided;
            }
            $expiresOn = $check->issued_on->addYears(self::VALID_YEARS);
            if ($expiresOn->isBefore(today())) {
                throw ValidationException::withMessages(['issuedOn' => 'This check was issued more than 3 years ago. Ask the artist for a newer one.']);
            }
            $check->forceFill([
                'status' => VscStatus::Verified,
                'verified_at' => now(),
                'verified_by' => $administrator->id,
                'expires_on' => $expiresOn->toDateString(),
            ])->save();
            $this->audit->handle($administrator, AuditAction::VscVerified, $check, AuditOutcome::Succeeded, ['expires_on' => $expiresOn->toDateString()]);

            return $check;
        });
    }
}
