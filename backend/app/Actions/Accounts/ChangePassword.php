<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Services\Accounts\SessionRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * A new password while signed in (L2-025.2): every other session of the account ends, and this one
 * gets a new ID and CSRF token, so a session ID known before the change is useless after it. The
 * owner is emailed, and the change is audited.
 */
class ChangePassword
{
    public function __construct(private readonly SessionRegistry $registry, private readonly RecordAuditEntry $audit) {}

    public function handle(User $user, string $password, Request $request): void
    {
        DB::transaction(function () use ($user, $password) {
            $user->forceFill(['password' => $password])->save();
            $this->audit->handle($user, AuditAction::PasswordChanged, $user, AuditOutcome::Succeeded);
            $user->notify(new PasswordChangedNotification(now()));
        });

        $this->registry->endAll($user);
        $request->session()->regenerate(destroy: true);
        $request->session()->regenerateToken();
        $this->registry->register($user, $request);
    }
}
