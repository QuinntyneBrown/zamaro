<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\User;
use App\Notifications\TwoStepSignInChangedNotification;
use App\Services\Accounts\RecoveryCodes;
use App\Services\Accounts\TotpVerifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Turning on two-step sign-in (L2-072.3): `begin` stores a new key, encrypted, that counts for nothing
 * yet; `confirm` checks the first code against it, turns two-step sign-in on and answers 10 recovery
 * codes, once. The owner is emailed (M2 D21) and the change is audited.
 */
class EnableTwoFactor
{
    public function __construct(
        private readonly TotpVerifier $totp,
        private readonly RecoveryCodes $recoveryCodes,
        private readonly RecordAuditEntry $audit,
    ) {}

    /**
     * @return string the new key, base32
     *
     * @throws TwoFactorAlreadyOn
     */
    public function begin(User $user): string
    {
        if ($user->mfa_enabled) {
            throw new TwoFactorAlreadyOn;
        }
        $secret = $this->totp->newSecret();
        $user->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => null])->save();

        return $secret;
    }

    /**
     * @return list<string> the recovery codes
     *
     * @throws ValidationException on `code` when it does not match the key begun
     * @throws TwoFactorAlreadyOn
     */
    public function confirm(User $user, string $code): array
    {
        if ($user->mfa_enabled) {
            throw new TwoFactorAlreadyOn;
        }
        if ($user->two_factor_secret === null || ! $this->totp->verify($user->two_factor_secret, $code)) {
            throw ValidationException::withMessages(['code' => 'That code didn’t match. Codes change every 30 seconds; enter the one showing now.']);
        }

        return DB::transaction(function () use ($user) {
            $user->forceFill(['mfa_enabled' => true, 'two_factor_confirmed_at' => now()])->save();
            $codes = $this->recoveryCodes->replace($user);
            $this->audit->handle($user, AuditAction::TwoFactorEnabled, $user, AuditOutcome::Succeeded);
            $user->notify(new TwoStepSignInChangedNotification(TwoStepSignInChangedNotification::ON));

            return $codes;
        });
    }
}
