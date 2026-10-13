<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\PasswordResetToken;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Services\Accounts\SessionRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Reset links (L2-023.3–.4): `check` says whether one still works without using it; `handle` sets the
 * new password with it, once, ends every session of the account, emails its owner and signs this
 * browser in. A link that was used or has run out names its account and when it was sent; an unknown
 * one names no one.
 */
class ResetPassword
{
    public function __construct(
        private readonly SessionRegistry $sessions,
        private readonly StartSession $startSession,
        private readonly RecordAuditEntry $audit,
        private readonly TwoFactorChallenge $challenge,
    ) {}

    /**
     * @throws LinkExpired
     */
    public function check(string $token): PasswordResetToken
    {
        $row = $this->find($token);
        if (! $row->isUsable()) {
            throw $this->expired($row);
        }

        return $row;
    }

    /**
     * @throws LinkExpired
     */
    public function handle(string $token, string $password, Request $request): User
    {
        $user = DB::transaction(function () use ($token, $password) {
            $row = $this->find($token, lock: true);
            if (! $row->isUsable()) {
                throw $this->expired($row);
            }

            $row->update(['used_at' => now()]);
            $user = $row->user;
            $user->forceFill(['password' => $password])->save();
            $this->sessions->endAll($user);
            $this->audit->handle($user, AuditAction::PasswordReset, $user, AuditOutcome::Succeeded);
            $user->notify(new PasswordChangedNotification(now()));

            return $user;
        });

        if ($user->mfa_enabled) {
            $this->challenge->begin($user, $request);

            return $user;
        }

        return $this->startSession->handle($user, $request);
    }

    private function find(string $token, bool $lock = false): PasswordResetToken
    {
        $query = PasswordResetToken::with('user')->where('token_hash', hash('sha256', $token));

        return ($lock ? $query->lockForUpdate() : $query)->first() ?? throw new LinkExpired;
    }

    private function expired(PasswordResetToken $row): LinkExpired
    {
        return new LinkExpired($row->user->email, $row->created_at);
    }
}
