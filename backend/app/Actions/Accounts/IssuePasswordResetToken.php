<?php

namespace App\Actions\Accounts;

use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * A new single-use reset link's token, valid for 60 minutes (L2-023.3). Earlier links are used up, so
 * only the newest works. Only the SHA-256 is stored; the plain token goes into the email.
 */
class IssuePasswordResetToken
{
    public const LIFETIME_MINUTES = 60;

    public function handle(User $user): string
    {
        PasswordResetToken::where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);

        $token = Str::random(64);
        PasswordResetToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addMinutes(self::LIFETIME_MINUTES),
        ]);

        return $token;
    }
}
