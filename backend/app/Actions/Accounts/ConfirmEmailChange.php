<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\EmailChangeToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Opens an email change link (L2-025.1): once, within 24 hours, and only while the new address is
 * still free, the account moves to it, verified. Anything else is the 410 `link-expired`; a link that
 * existed names the address the account still signs in with.
 */
class ConfirmEmailChange
{
    public function __construct(private readonly RecordAuditEntry $audit) {}

    /**
     * @throws LinkExpired
     */
    public function handle(string $token): User
    {
        return DB::transaction(function () use ($token) {
            $row = EmailChangeToken::with('user')->where('token_hash', hash('sha256', $token))->lockForUpdate()->first()
                ?? throw new LinkExpired;
            $user = $row->user;
            $taken = User::whereRaw('lower(email) = ?', [$row->new_email])->whereKeyNot($user->id)->exists();
            if (! $row->isUsable() || $taken) {
                throw new LinkExpired($user->email, $row->created_at);
            }

            $row->update(['used_at' => now()]);
            $previous = $user->email;
            $user->forceFill(['email' => $row->new_email, 'pending_email' => null, 'email_verified_at' => now()])->save();
            $this->audit->handle($user, AuditAction::EmailChanged, $user, AuditOutcome::Succeeded, ['from' => $previous, 'to' => $user->email]);

            return $user;
        });
    }
}
