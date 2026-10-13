<?php

namespace App\Actions\Accounts;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Gives someone a role they did not have, and audits the change (L2-069.1). `by` is the administrator
 * who did it, or null for the system: a console command or an automated step such as an approval's
 * job. Granting a role already held changes nothing and writes nothing.
 */
class GrantRole
{
    public function __construct(private readonly RecordAuditEntry $audit) {}

    public function handle(User $user, Role $role, ?User $by): void
    {
        if (in_array($role, $user->roleNames(), true)) {
            return;
        }

        DB::transaction(function () use ($user, $role, $by) {
            $user->grantRoles([$role]);
            $user->unsetRelation('roles');
            $this->audit->handle($by, AuditAction::RoleChanged, $user, AuditOutcome::Succeeded, ['granted' => $role->value]);
        });
    }
}
