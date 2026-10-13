<?php

namespace App\Actions\Accounts;

use App\Models\EmailVerificationToken;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * A new single-use verification link's token, valid for 24 hours (L2-022.3). Only its SHA-256 is
 * stored; the plain token goes into the email and nowhere else.
 */
class IssueEmailVerificationToken
{
    public const LIFETIME_HOURS = 24;

    public function handle(User $user): string
    {
        $token = Str::random(64);
        EmailVerificationToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addHours(self::LIFETIME_HOURS),
        ]);

        return $token;
    }
}
