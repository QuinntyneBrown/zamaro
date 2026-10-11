<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\User;
use App\Notifications\AccountLockedNotification;
use App\Services\Accounts\SignInThrottle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Checks an email and password and starts the session (L2-023.1). A wrong password and an unknown
 * email get the same answer (L2-023.2), and an unknown email is checked against a dummy hash so
 * both take as long. Every attempt is audited. After 5 failures for one address in 15 minutes, sign-in
 * for it is paused for 15 minutes, whatever the password, and the owner is emailed once (L2-072.4).
 */
class AttemptSignIn
{
    public function __construct(
        private readonly StartSession $startSession,
        private readonly RecordAuditEntry $audit,
        private readonly SignInThrottle $throttle,
    ) {}

    /**
     * @throws ValidationException as `errors.credentials` when the email or password is wrong
     * @throws SignInPaused when sign-in for the address is paused
     */
    public function handle(string $email, string $password, Request $request): User
    {
        $email = Str::lower(trim($email));
        $user = User::whereRaw('lower(email) = ?', [$email])->first();

        if ($pausedUntil = $this->throttle->pausedUntil($email)) {
            $this->audit->handle($user, AuditAction::SignInFailed, $user, AuditOutcome::Denied, ['email' => $email, 'reason' => 'paused']);
            if ($user !== null && $this->throttle->firstRefusal($email, $pausedUntil)) {
                $user->notify(new AccountLockedNotification($pausedUntil));
            }

            throw new SignInPaused($pausedUntil);
        }

        if (! Hash::check($password, $user?->password ?? $this->dummyHash())) {
            $this->audit->handle($user, AuditAction::SignInFailed, $user, AuditOutcome::Failed, ['email' => $email]);
            $this->throttle->recordFailure($email);

            throw ValidationException::withMessages(['credentials' => 'Email or password is incorrect.']);
        }

        $this->throttle->clear($email);
        $this->audit->handle($user, AuditAction::SignIn, $user, AuditOutcome::Succeeded);

        return $this->startSession->handle($user, $request);
    }

    /** A hash of nothing anyone knows, made with the current cost so checking it takes as long. */
    private function dummyHash(): string
    {
        $cost = implode(':', [config('hashing.driver'), ...array_values(config('hashing.argon'))]);

        return Cache::rememberForever("auth:dummy-hash:{$cost}", fn () => Hash::make(Str::random(40)));
    }
}
