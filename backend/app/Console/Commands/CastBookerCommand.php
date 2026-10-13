<?php

namespace App\Console\Commands;

use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Enums\Role;
use App\Models\ConsentRecord;
use App\Models\User;
use App\Services\Privacy\LegalDocumentRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * A fresh booker for e2e specs that change data (M2 plan D19), so the seeded cast stays as the mocks
 * show it. Registration itself is tested through the sign-up page.
 */
class CastBookerCommand extends Command
{
    protected $signature = 'cast:booker {email : An address no other spec uses} {--unverified : Leave the address waiting for its verification link} {--terms= : The terms version last accepted; the current one when left out}';

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
            'email_verified_at' => $this->option('unverified') ? null : now(),
        ])->save();
        $user->grantRoles([Role::Booker]);
        $this->acceptTerms($user);

        $this->line($email);

        return self::SUCCESS;
    }

    /** The terms and privacy policy a registration records (L2-080.1), at `--terms` or the current version. */
    private function acceptTerms(User $user): void
    {
        $documents = app(LegalDocumentRegistry::class);
        $version = $this->option('terms') ?: $documents->currentOrNull(ConsentKind::Terms)?->version;
        if ($version === null) {
            return;
        }
        foreach ([[ConsentKind::Terms, $version], [ConsentKind::PrivacyPolicy, $version]] as [$kind, $documentVersion]) {
            ConsentRecord::create([
                'user_id' => $user->id, 'kind' => $kind, 'document_version' => $documentVersion, 'granted' => true,
                'recorded_at' => now(), 'source' => ConsentSource::Registration,
            ]);
        }
        ConsentRecord::create([
            'user_id' => $user->id, 'kind' => ConsentKind::MarketingEmail, 'document_version' => null, 'granted' => false,
            'recorded_at' => now(), 'source' => ConsentSource::Registration,
        ]);
    }
}
