<?php

namespace App\Actions\Accounts;

use App\Actions\Privacy\LegalDocumentOutdated;
use App\Actions\Privacy\RecordConsent;
use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use App\Enums\Role;
use App\Models\User;
use App\Notifications\DuplicateSignUpNotification;
use App\Notifications\VerifyEmailNotification;
use App\Services\Privacy\LegalDocumentRegistry;
use App\Support\ReturnUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Turns a guest into a booker (L2-022.1): the account, its three consent records (L2-080) and a
 * verification email, in one transaction. An address that already has an account changes nothing and
 * its owner is emailed instead (L2-022.2); both return the same address, so the answer never says
 * which happened. The guest is not signed in.
 */
class RegisterBooker
{
    public function __construct(
        private readonly LegalDocumentRegistry $legalDocuments,
        private readonly RecordConsent $recordConsent,
        private readonly IssueEmailVerificationToken $issueToken,
    ) {}

    /**
     * @param  array{name: string, email: string, password: string, marketingOptIn?: bool, termsVersion: string, privacyPolicyVersion: string, returnUrl?: ?string}  $data
     * @return string the address, as written
     *
     * @throws LegalDocumentOutdated when the versions shown are no longer current
     */
    public function handle(array $data, Request $request): string
    {
        $email = Str::lower(trim($data['email']));

        DB::transaction(function () use ($data, $email, $request) {
            $this->legalDocuments->assertCurrent($data['termsVersion'], $data['privacyPolicyVersion']);

            $owner = User::whereRaw('lower(email) = ?', [$email])->lockForUpdate()->first();
            if ($owner !== null) {
                // Hash anyway, so a known address answers as slowly as a new one.
                Hash::make($data['password']);
                $owner->notify(new DuplicateSignUpNotification(now()));

                return;
            }

            $user = User::create(['name' => trim($data['name']), 'email' => $email, 'password' => $data['password']]);
            $user->grantRoles([Role::Booker]);
            $this->recordConsent->handle($user, [
                [ConsentKind::Terms, $data['termsVersion'], true],
                [ConsentKind::PrivacyPolicy, $data['privacyPolicyVersion'], true],
                [ConsentKind::MarketingEmail, null, (bool) ($data['marketingOptIn'] ?? false)],
            ], ConsentSource::Registration, $request);
            $user->notify(new VerifyEmailNotification($this->issueToken->handle($user), ReturnUrl::orDiscover($data['returnUrl'] ?? null)));
        });

        return $email;
    }
}
