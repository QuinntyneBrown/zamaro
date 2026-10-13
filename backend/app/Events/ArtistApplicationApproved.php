<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * An application was approved and committed (review-artist-application); the next-step email
 * follows. `setPasswordToken` is the plain reset token for an applicant who had no account (M3 D3).
 */
class ArtistApplicationApproved
{
    use Dispatchable;

    public function __construct(public readonly int $applicationId, public readonly ?string $setPasswordToken) {}
}
