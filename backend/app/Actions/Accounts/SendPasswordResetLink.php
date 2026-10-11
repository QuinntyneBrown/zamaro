<?php

namespace App\Actions\Accounts;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Emails a reset link when the address has an account (L2-023.3). Either way it returns the address in
 * lower case, so the answer never says which addresses have one.
 */
class SendPasswordResetLink
{
    public function __construct(private readonly IssuePasswordResetToken $issueToken) {}

    public function handle(string $email): string
    {
        $email = Str::lower(trim($email));

        DB::transaction(function () use ($email) {
            $user = User::whereRaw('lower(email) = ?', [$email])->lockForUpdate()->first();
            $user?->notify(new ResetPasswordNotification($this->issueToken->handle($user)));
        });

        return $email;
    }
}
