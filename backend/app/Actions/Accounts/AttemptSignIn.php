<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Checks an email and password and starts the session (L2-023.1). A wrong password and an unknown
 * email get the same answer (L2-023.2), and an unknown email is checked against a dummy hash so
 * both take as long. Every attempt is audited.
 */
class AttemptSignIn
{
    public function __construct(
        private readonly StartSession $startSession,
        private readonly RecordAuditEntry $audit,
    ) {}

    /**
     * @throws ValidationException as `errors.credentials` when the email or password is wrong
     */
    public function handle(string $email, string $password, Request $request): User
    {
        $email = Str::lower(trim($email));
        $user = User::whereRaw('lower(email) = ?', [$email])->first();

        if (! Hash::check($password, $user?->password ?? $this->dummyHash())) {
            $this->audit->handle($user, AuditAction::SignInFailed, $user, AuditOutcome::Failed, ['email' => $email]);

            throw ValidationException::withMessages(['credentials' => 'Email or password is incorrect.']);
        }

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
