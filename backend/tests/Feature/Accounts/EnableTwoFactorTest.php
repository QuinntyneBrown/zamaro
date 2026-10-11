<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Notifications\TwoStepSignInChangedNotification;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-072.3 (accounts/sign-in-and-recover-access): a booker or artist turns on TOTP two-step sign-in
 * with a key for their authenticator app; the first right code turns it on and gives 10 single-use
 * recovery codes, shown once. The owner is emailed (M2 D21).
 */
class EnableTwoFactorTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private string $email;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
        $this->signIn($this->email)->assertOk();
    }

    public function test_beginning_gives_a_key_and_a_qr_code_and_turns_nothing_on(): void
    {
        $response = $this->fromTheWebApp()->postJson('/api/v1/account/two-factor');

        $response->assertOk();
        $this->assertMatchesContract($response);
        $key = $response->json('data.key');
        $this->assertMatchesRegularExpression('/^([A-Z2-7]{4} )+[A-Z2-7]{1,4}$/', $key, 'The key is base32, in groups of four.');
        $this->assertStringStartsWith('otpauth://totp/Zamaro:', $response->json('data.otpauthUri'));
        $this->assertStringContainsString('secret='.str_replace(' ', '', $key), $response->json('data.otpauthUri'));
        $this->assertFalse($this->user()->mfa_enabled);
        $this->assertStringStartsWith('v1:', DB::table('users')->where('email', $this->email)->value('two_factor_secret'));

        $qr = $this->fromTheWebApp()->get('/api/v1/account/two-factor/qr');
        $qr->assertOk()->assertHeader('Content-Type', 'image/svg+xml');
        $this->assertStringContainsString('<svg', $qr->getContent());
        $this->assertStringContainsString('no-store', $qr->headers->get('Cache-Control'));
    }

    public function test_the_first_right_code_turns_it_on_with_10_recovery_codes(): void
    {
        Notification::fake();
        $secret = $this->begin();

        $response = $this->confirm((new Google2FA)->getCurrentOtp($secret));

        $response->assertOk();
        $this->assertMatchesContract($response);
        $codes = $response->json('data.recoveryCodes');
        $this->assertCount(10, $codes);
        $this->assertCount(10, array_unique($codes));
        foreach ($codes as $code) {
            $this->assertMatchesRegularExpression('/^[a-z0-9]{4}-[a-z0-9]{4}$/', $code);
        }
        $this->assertTrue($this->user()->mfa_enabled);
        $this->assertNotNull($this->user()->two_factor_confirmed_at);
        $stored = DB::table('recovery_codes')->where('user_id', $this->user()->id)->pluck('code_hash');
        $this->assertCount(10, $stored);
        $this->assertNotContains($codes[0], $stored->all(), 'Only hashes are stored.');
        $this->getJson('/api/v1/me')->assertJsonPath('data.mfaEnabled', true);
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.two_factor_enabled', 'actor_id' => $this->user()->id]);
        Notification::assertSentTo($this->user(), TwoStepSignInChangedNotification::class);
    }

    public function test_the_on_email_says_so(): void
    {
        $secret = $this->begin();

        $this->confirm((new Google2FA)->getCurrentOtp($secret))->assertOk();

        $email = app('mailer')->getSymfonyTransport()->messages()->last()->getOriginalMessage();
        $this->assertSame('Two-step sign-in is on for your Zamaro account', $email->getSubject());
        $this->assertSame($this->email, $email->getTo()[0]->getAddress());
    }

    public function test_a_wrong_code_turns_nothing_on(): void
    {
        $this->begin();

        $response = $this->confirm('000000');

        $response->assertUnprocessable()->assertJsonPath('errors.code.0', 'That code didn’t match. Codes change every 30 seconds; enter the one showing now.');
        $this->assertMatchesContract($response);
        $this->assertFalse($this->user()->mfa_enabled);
        $this->assertSame(0, DB::table('recovery_codes')->count());
    }

    public function test_a_code_needs_a_key_first_and_a_second_key_replaces_the_first(): void
    {
        $this->confirm('123456')->assertUnprocessable()->assertJsonValidationErrors('code');
        $first = $this->begin();
        $second = $this->begin();

        $this->assertNotSame($first, $second);
        $this->confirm((new Google2FA)->getCurrentOtp($first))->assertUnprocessable();
        $this->confirm((new Google2FA)->getCurrentOtp($second))->assertOk();
    }

    public function test_it_cannot_be_turned_on_twice(): void
    {
        $this->confirm((new Google2FA)->getCurrentOtp($this->begin()))->assertOk();

        $this->fromTheWebApp()->postJson('/api/v1/account/two-factor')->assertStatus(409);
    }

    public function test_a_guest_gets_401(): void
    {
        $this->asANewRequest()->withoutCookies()->fromTheWebApp()->postJson('/api/v1/account/two-factor')->assertUnauthorized();
    }

    /** Begins setup; answers the secret without spaces. */
    private function begin(): string
    {
        return str_replace(' ', '', $this->fromTheWebApp()->postJson('/api/v1/account/two-factor')->assertOk()->json('data.key'));
    }

    private function confirm(string $code): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/account/two-factor/confirm', ['code' => $code]);
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
