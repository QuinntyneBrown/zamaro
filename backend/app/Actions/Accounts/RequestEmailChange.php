<?php

namespace App\Actions\Accounts;

use App\Models\EmailChangeToken;
use App\Models\User;
use App\Notifications\ConfirmNewEmailNotification;
use App\Notifications\EmailChangeRequestedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

/**
 * Asks for a new account email (L2-025.1): the new address gets a link that works once, for 24 hours
 * (M2 D11), and the current one a notice. The account email stays until the link is opened. An address
 * another account uses gets the same answer, no link and no pending change, so the form never says
 * which addresses have accounts. Earlier links stop working.
 */
class RequestEmailChange
{
    public const LIFETIME_HOURS = 24;

    /** @return string the new address in lower case */
    public function handle(User $user, string $email): string
    {
        $email = Str::lower(trim($email));

        DB::transaction(function () use ($user, $email) {
            EmailChangeToken::where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);
            $taken = User::whereRaw('lower(email) = ?', [$email])->exists();
            $user->forceFill(['pending_email' => $taken ? null : $email])->save();

            if (! $taken) {
                $token = Str::random(64);
                EmailChangeToken::create([
                    'user_id' => $user->id,
                    'token_hash' => hash('sha256', $token),
                    'new_email' => $email,
                    'expires_at' => now()->addHours(self::LIFETIME_HOURS),
                ]);
                Notification::route('mail', $email)->notify(new ConfirmNewEmailNotification($token, $user->name));
            }
            $user->notify(new EmailChangeRequestedNotification($email));
        });

        return $email;
    }
}
