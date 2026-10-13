<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\User;
use App\Notifications\AccountLockedNotification;
use App\Services\Accounts\RecoveryCodes;
use App\Services\Accounts\SignInThrottle;
use App\Services\Accounts\TotpVerifier;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * The code step of signing in (L2-072.3–.4). The password step leaves a 10-minute marker in the
 * session instead of signing in; a current code, or an unused recovery code once, completes it with a
 * new session. Wrong codes count toward the same 5-in-15-minutes pause as wrong passwords.
 */
class TwoFactorChallenge
{
    public const LIFETIME_MINUTES = 10;

    private const KEY = 'auth.two_factor';

    public function __construct(
        private readonly TotpVerifier $totp,
        private readonly RecoveryCodes $recoveryCodes,
        private readonly SignInThrottle $throttle,
        private readonly StartSession $startSession,
        private readonly RecordAuditEntry $audit,
    ) {}

    /** The password was right and two-step sign-in is on: ask for a code before signing in. */
    public function begin(User $user, Request $request): void
    {
        $request->session()->put(self::KEY, [
            'user_id' => $user->id,
            'expires_at' => now()->addMinutes(self::LIFETIME_MINUTES)->getTimestamp(),
        ]);
    }

    /**
     * @param  array{code?: string, recoveryCode?: string}  $answer
     *
     * @throws AuthenticationException when no password step is waiting, or it ran out
     * @throws SignInPaused
     * @throws ValidationException on `code` or `recoveryCode` when it is wrong
     */
    public function complete(array $answer, Request $request): User
    {
        $pending = $request->session()->get(self::KEY);
        $user = is_array($pending) && $pending['expires_at'] > now()->getTimestamp() ? User::find($pending['user_id']) : null;
        if ($user === null || ! $user->mfa_enabled) {
            $request->session()->forget(self::KEY);
            throw new AuthenticationException;
        }

        $email = strtolower($user->email);
        if ($pausedUntil = $this->throttle->pausedUntil($email)) {
            $this->audit->handle($user, AuditAction::SignInFailed, $user, AuditOutcome::Denied, ['email' => $email, 'reason' => 'paused']);
            if ($this->throttle->firstRefusal($email, $pausedUntil)) {
                $user->notify(new AccountLockedNotification($pausedUntil));
            }
            throw new SignInPaused($pausedUntil);
        }

        $recovery = isset($answer['recoveryCode']);
        $right = $recovery
            ? $this->recoveryCodes->use($user, $answer['recoveryCode'])
            : $this->totp->verify((string) $user->two_factor_secret, $answer['code'] ?? '');
        if (! $right) {
            $this->audit->handle($user, AuditAction::MfaChallenge, $user, AuditOutcome::Failed, ['email' => $email, 'method' => $recovery ? 'recovery_code' : 'code']);
            $this->throttle->recordFailure($email);
            throw ValidationException::withMessages($recovery
                ? ['recoveryCode' => 'That recovery code is wrong or was used. Enter another of your saved codes.']
                : ['code' => 'That code is wrong or has expired. Enter the code your app shows now.']);
        }

        $request->session()->forget(self::KEY);
        $this->throttle->clear($email);
        $this->audit->handle($user, AuditAction::MfaChallenge, $user, AuditOutcome::Succeeded, ['method' => $recovery ? 'recovery_code' : 'code']);
        $this->audit->handle($user, AuditAction::SignIn, $user, AuditOutcome::Succeeded, ['two_factor' => $recovery ? 'recovery_code' : 'code']);

        return $this->startSession->handle($user, $request);
    }
}
