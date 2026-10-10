<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * A fresh booker for e2e specs that change data (M2 plan D19), so the seeded cast stays as the mocks
 * show it. Registration itself is tested through the sign-up page.
 */
class CastBookerCommand extends Command
{
    protected $signature = 'cast:booker {email : An address no other spec uses}';

    protected $description = 'Create a verified booker who signs in with ZAMARO_CAST_PASSWORD (never in production)';

    public function handle(): int
    {
        $password = config('zamaro.cast_password');
        if (! app()->environment(['local', 'testing', 'e2e']) || blank($password)) {
            $this->error('cast:booker runs only in local, testing and e2e, with ZAMARO_CAST_PASSWORD set.');

            return self::FAILURE;
        }

        $email = Str::lower(trim($this->argument('email')));
        $user = User::firstOrNew(['email' => $email]);
        $user->forceFill([
            'name' => Str::headline(Str::before($email, '@')),
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ])->save();
        $user->grantRoles([Role::Booker]);

        $this->line($email);

        return self::SUCCESS;
    }
}
