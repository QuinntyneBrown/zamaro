<?php

namespace App\Actions\Accounts;

use App\Models\EmailVerificationToken;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Support\ReturnUrl;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sends a fresh verification link (L2-022.3) and revokes every earlier one. The person is the signed-in
 * booker, the owner of an expired link, or, just after signing up, the address they typed. Nothing is
 * sent to an unknown or already verified address, and the caller answers the same either way.
 */
class ResendVerificationEmail
{
    public function __construct(private readonly IssueEmailVerificationToken $issueToken) {}

    public function handle(?User $signedIn, ?string $token, ?string $email, ?string $returnUrl): void
    {
        $user = $signedIn ?? $this->owner($token, $email);
        if ($user === null || $user->email_verified_at !== null) {
            return;
        }

        DB::transaction(function () use ($user, $returnUrl) {
            // Used up rather than deleted, so an expired link still names its owner for the next resend.
            EmailVerificationToken::where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);
            $user->notify(new VerifyEmailNotification($this->issueToken->handle($user), ReturnUrl::orDiscover($returnUrl)));
        });
    }

    private function owner(?string $token, ?string $email): ?User
    {
        if ($token !== null) {
            $userId = EmailVerificationToken::where('token_hash', hash('sha256', $token))->value('user_id');

            return $userId === null ? null : User::find($userId);
        }

        return $email === null ? null : User::whereRaw('lower(email) = ?', [Str::lower(trim($email))])->first();
    }
}
