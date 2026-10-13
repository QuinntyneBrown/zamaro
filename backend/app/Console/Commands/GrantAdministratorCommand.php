<?php

namespace App\Console\Commands;

use App\Actions\Accounts\GrantRole;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Makes an account an administrator (M3 D6). Nothing in the product grants the role, so the Zamaro
 * team does it from the console; the grant is audited as `user.role_changed` by the system. The
 * admin API stays 404 to them until they turn two-step sign-in on (L2-066.2).
 */
class GrantAdministratorCommand extends Command
{
    protected $signature = 'zamaro:admin:grant {email : The account to make an administrator}';

    protected $description = 'Give an account the Administrator role, recorded in the audit log';

    public function handle(GrantRole $grant): int
    {
        $email = Str::lower(trim($this->argument('email')));
        $user = User::whereRaw('lower(email) = ?', [$email])->first();
        if ($user === null) {
            $this->error("No account has the address {$email}.");

            return self::FAILURE;
        }

        $grant->handle($user, Role::Administrator, null);
        $this->info("{$user->email} is now an administrator.");

        return self::SUCCESS;
    }
}
