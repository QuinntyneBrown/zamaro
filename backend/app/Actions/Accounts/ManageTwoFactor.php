<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Enums\Role;
use App\Models\RecoveryCode;
use App\Models\User;
use App\Notifications\AccountLockedNotification;
use App\Notifications\TwoStepSignInChangedNotification;
use App\Services\Accounts\RecoveryCodes;
use App\Services\Accounts\SignInThrottle;
use App\Services\Accounts\TotpVerifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Turning two-step sign-in off, and new recovery codes (L2-072.5): each needs a current code from
 * the app or an unused recovery code first. Wrong codes count toward the 5-in-15-minutes pause, as at
 * sign-in. Each change is audited and emailed to the owner (M2 D21).
 */
class ManageTwoFactor
{
    public const WRONG = 'That code is wrong or has expired. Enter the code your app shows now, or an unused recovery code.';

    public function __construct(
        private readonly TotpVerifier $totp,
        private readonly RecoveryCodes $recoveryCodes,
        private readonly SignInThrottle $throttle,
        private readonly RecordAuditEntry $audit,
    ) {}

    /**
     * @throws TwoFactorRequired when the person is an administrator (L2-066.2)
     * @throws SignInPaused
     * @throws ValidationException on `code` when it is wrong
     */
    public function turnOff(User $user, string $code): void
    {
        if (in_array(Role::Administrator, $user->roleNames(), true)) {
            throw new TwoFactorRequired;
        }
        $this->prove($user, $code);

        DB::transaction(function () use ($user) {
            $user->forceFill(['mfa_enabled' => false, 'two_factor_secret' => null, 'two_factor_confirmed_at' => null])->save();
            RecoveryCode::where('user_id', $user->id)->delete();
            $this->audit->handle($user, AuditAction::TwoFactorDisabled, $user, AuditOutcome::Succeeded);
            $user->notify(new TwoStepSignInChangedNotification(TwoStepSignInChangedNotification::OFF));
        });
    }

    /**
     * @return list<string> the new codes, shown once
     *
     * @throws SignInPaused
     * @throws ValidationException on `code` when it is wrong
     */
    public function newRecoveryCodes(User $user, string $code): array
    {
        $this->prove($user, $code);

        return DB::transaction(function () use ($user) {
            $codes = $this->recoveryCodes->replace($user);
            $this->audit->handle($user, AuditAction::RecoveryCodesReplaced, $user, AuditOutcome::Succeeded);
            $user->notify(new TwoStepSignInChangedNotification(TwoStepSignInChangedNotification::NEW_CODES));

            return $codes;
        });
    }

    /** A current code, or an unused recovery code (which is used up). */
    private function prove(User $user, string $code): void
    {
        $email = strtolower($user->email);
        if ($pausedUntil = $this->throttle->pausedUntil($email)) {
            if ($this->throttle->firstRefusal($email, $pausedUntil)) {
                $user->notify(new AccountLockedNotification($pausedUntil));
            }
            throw new SignInPaused($pausedUntil);
        }

        $isTotp = preg_match('/^\s*\d{6}\s*$/', $code) === 1;
        $right = $isTotp
            ? $this->totp->verify((string) $user->two_factor_secret, $code)
            : $this->recoveryCodes->use($user, $code);
        if (! $right) {
            $this->audit->handle($user, AuditAction::SignInFailed, $user, AuditOutcome::Failed, ['email' => $email, 'reason' => 'two_factor_change']);
            $this->throttle->recordFailure($email);
            throw ValidationException::withMessages(['code' => self::WRONG]);
        }
        $this->throttle->clear($email);
    }
}
