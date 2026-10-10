<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Notifications\DuplicateSignUpNotification;
use App\Notifications\VerifyEmailNotification;
use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Symfony\Component\Mime\Email;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-022.1–.2: a guest registers as a booker and is sent a verification link; an address that already
 * has an account gets the same answer, and its owner is told instead. L2-072.1–.2: passwords of 12 to
 * 128 characters, not in a known breach, stored as Argon2id (accounts/register-booker).
 */
class RegisterBookerTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const EMAIL = 'ruth.adeyemi@gracepoint.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed([LegalDocumentSeeder::class, CastSeeder::class]);
    }

    public function test_a_guest_registers_as_a_booker_and_is_sent_a_verification_link(): void
    {
        Notification::fake();

        $response = $this->register();

        $response->assertStatus(202)->assertExactJson(['data' => ['email' => self::EMAIL]]);
        $this->assertMatchesContract($response);
        $user = User::where('email', self::EMAIL)->firstOrFail();
        $this->assertSame('Ruth Adeyemi', $user->name);
        $this->assertSame(['booker'], array_map(fn ($role) => $role->value, $user->roleNames()));
        $this->assertNull($user->email_verified_at);
        $this->assertStringStartsWith('$argon2id$', $user->password);
        $this->assertTrue(Hash::check('hosanna-in-the-highest', $user->password));
        Notification::assertSentTo($user, VerifyEmailNotification::class,
            fn (VerifyEmailNotification $notification) => $notification->queue === 'notifications');
        Notification::assertNotSentTo($user, DuplicateSignUpNotification::class);
    }

    public function test_registering_does_not_sign_the_guest_in(): void
    {
        Notification::fake();

        $this->register()->assertStatus(202);

        $this->assertGuest('web');
    }

    public function test_the_verification_email_has_both_parts_and_a_24_hour_link_to_the_web_app(): void
    {
        $this->register(['returnUrl' => '/artists/abigail-mensah?date=2026-11-14'])->assertStatus(202);

        $email = $this->onlySentEmail();
        $this->assertSame('hello@zamaro.ca', $email->getFrom()[0]->getAddress());
        $this->assertSame('Zamaro', $email->getFrom()[0]->getName());
        $this->assertSame(self::EMAIL, $email->getTo()[0]->getAddress());
        $this->assertSame('Verify your email for Zamaro', $email->getSubject());
        $this->assertNotEmpty($email->getHtmlBody());
        $this->assertNotEmpty($email->getTextBody());
        $this->assertStringContainsString('Hi Ruth,', $email->getTextBody());

        preg_match('#'.preg_quote(config('zamaro.web_url'), '#').'/verify-email\?token=([A-Za-z0-9]+)&returnUrl=(\S+)#', $email->getTextBody(), $link);
        $this->assertNotEmpty($link, 'The text part holds the verification link.');
        $this->assertSame('/artists/abigail-mensah?date=2026-11-14', urldecode($link[2]));
        $token = DB::table('email_verification_tokens')->where('token_hash', hash('sha256', $link[1]))->first();
        $this->assertNotNull($token, 'Only the token’s SHA-256 is stored.');
        $this->assertSame(User::where('email', self::EMAIL)->value('id'), $token->user_id);
        $this->assertTrue(Carbon::parse($token->expires_at)->equalTo(now()->addDay()));
        $this->assertNull($token->used_at);
    }

    public function test_an_address_with_an_account_gets_the_same_answer_and_its_owner_is_told(): void
    {
        Notification::fake();
        $naomi = User::where('email', 'naomi.fraser@riversidecc.ca')->firstOrFail();
        $before = $naomi->only(['name', 'password', 'email_verified_at']);
        $users = User::count();

        $response = $this->register(['email' => 'Naomi.Fraser@RiversideCC.ca', 'name' => 'Someone Else']);

        // The same answer a new address gets: the address, as it will be written to.
        $response->assertStatus(202)->assertExactJson(['data' => ['email' => 'naomi.fraser@riversidecc.ca']]);
        $this->assertSame($users, User::count());
        $this->assertSame($before, $naomi->fresh()->only(['name', 'password', 'email_verified_at']));
        $this->assertSame(0, DB::table('consent_records')->where('user_id', $naomi->id)->where('source', 'registration')->count());
        Notification::assertSentTo($naomi, DuplicateSignUpNotification::class);
        Notification::assertNotSentTo($naomi, VerifyEmailNotification::class);
    }

    public function test_the_owner_is_emailed_someone_tried_to_sign_up_with_your_email(): void
    {
        $this->register(['email' => 'naomi.fraser@riversidecc.ca'])->assertStatus(202);

        $email = $this->onlySentEmail();
        $this->assertSame('naomi.fraser@riversidecc.ca', $email->getTo()[0]->getAddress());
        $this->assertSame('Someone tried to sign up with your email', $email->getSubject());
        $this->assertNotEmpty($email->getHtmlBody());
        $this->assertStringContainsString(config('zamaro.web_url').'/sign-in', $email->getTextBody());
    }

    public function test_a_password_under_12_characters_is_refused(): void
    {
        $response = $this->register(['password' => 'grace2026']);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
        $this->assertMatchesContract($response);
        $this->assertDatabaseMissing('users', ['email' => self::EMAIL]);
    }

    public function test_a_password_of_12_or_128_characters_is_accepted_and_129_is_refused(): void
    {
        Notification::fake();

        $this->register(['email' => 'twelve@gracepoint.ca', 'password' => str_repeat('g', 12)])->assertStatus(202);
        $this->register(['email' => 'long@gracepoint.ca', 'password' => str_repeat('g', 128)])->assertStatus(202);
        $this->register(['email' => 'too-long@gracepoint.ca', 'password' => str_repeat('g', 129)])
            ->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_a_password_found_in_a_known_breach_is_refused_with_the_reason(): void
    {
        $response = $this->register(['password' => 'password1234']);

        $response->assertStatus(422)
            ->assertJsonPath('errors.password.0', 'This password appears in a known data breach. Choose another.');
        $this->assertDatabaseMissing('users', ['email' => self::EMAIL]);
    }

    public function test_the_terms_must_be_accepted(): void
    {
        foreach ([false, null] as $accepted) {
            $this->register(['acceptedTerms' => $accepted])
                ->assertStatus(422)->assertJsonValidationErrors(['acceptedTerms']);
        }
        $this->assertDatabaseMissing('users', ['email' => self::EMAIL]);
    }

    public function test_a_name_and_a_valid_email_are_required(): void
    {
        $this->register(['name' => '  '])->assertStatus(422)->assertJsonValidationErrors(['name']);
        $this->register(['email' => 'not-an-email'])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_the_11th_registration_in_an_hour_from_one_address_is_refused(): void
    {
        Notification::fake();
        for ($i = 1; $i <= 10; $i++) {
            $this->register(['email' => "booker{$i}@gracepoint.ca"])->assertStatus(202);
        }

        $response = $this->register(['email' => 'booker11@gracepoint.ca']);

        $response->assertStatus(429)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/too-many-requests');
        $this->assertGreaterThan(0, (int) $response->headers->get('Retry-After'));
        $this->assertMatchesContract($response);
    }

    /** @param  array<string, mixed>  $overrides */
    private function register(array $overrides = []): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/register', array_merge([
            'name' => 'Ruth Adeyemi',
            'email' => self::EMAIL,
            'password' => 'hosanna-in-the-highest',
            'acceptedTerms' => true,
            'marketingOptIn' => false,
            'termsVersion' => '2026-10',
            'privacyPolicyVersion' => '2026-10',
            'challengeToken' => 'pass',
        ], $overrides));
    }

    private function onlySentEmail(): Email
    {
        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);

        return $messages[0]->getOriginalMessage();
    }
}
