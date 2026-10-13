<?php

namespace App\Actions\Accounts;

use App\Models\EmailVerificationToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Opens a verification link (L2-022.3): an unused token issued less than 24 hours ago marks its
 * owner's address verified and is used up. Anything else has expired, whichever reason, so the
 * answer says nothing about which tokens exist. Verifying does not sign anyone in.
 */
class VerifyEmail
{
    /** @throws LinkExpired */
    public function handle(string $token): User
    {
        return DB::transaction(function () use ($token) {
            $row = EmailVerificationToken::where('token_hash', hash('sha256', $token))->lockForUpdate()->first();
            if ($row === null || $row->used_at !== null || $row->expires_at->isPast()) {
                throw new LinkExpired;
            }

            $row->update(['used_at' => now()]);
            $user = User::findOrFail($row->user_id);
            $user->email_verified_at ??= now();
            $user->save();

            return $user;
        });
    }
}
