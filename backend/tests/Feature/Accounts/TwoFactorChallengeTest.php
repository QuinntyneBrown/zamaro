<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-072.3–.4 (accounts/sign-in-and-recover-access): with two-step sign-in on, the right password
 * leads to a code, not a session. A current code, or an unused recovery code once, completes the
 * sign-in. Wrong codes share the 5-in-15-minutes lockout with wrong passwords.
 */
class TwoFactorChallengeTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private string $email;

    private string $secret;

    /** @var list<string> */
    private array $recoveryCodes;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
        $this->signIn($this->email)->assertOk();
        $this->secret = str_replace(' ', '', $this->fromTheWebApp()->postJson('/api/v1/account/two-factor')->json('data.key'));
        $this->recoveryCodes = $this->fromTheWebApp()->postJson('/api/v1/account/two-factor/confirm', [
            'code' => (new Google2FA)->getCurrentOtp($this->secret),
        ])->assertOk()->json('data.recoveryCodes');
    }

    public function test_the_right_password_asks_for_a_code_and_signs_no_one_in(): void
    {
        $response = $this->newBrowser()->signIn($this->email);

        $response->assertStatus(202)->assertExactJson(['data' => ['twoFactorRequired' => true, 'email' => $this->email]]);
        $this->assertMatchesContract($response);
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $response->getCookie('zamaro_session')->getValue())
            ->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_a_current_code_completes_the_sign_in(): void
    {
        $session = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();

        $response = $this->challenge($session, ['code' => (new Google2FA)->getCurrentOtp($this->secret)]);

        $response->assertOk()->assertJsonPath('data.email', $this->email)->assertJsonPath('data.mfaEnabled', true);
        $this->assertMatchesContract($response);
        $signedIn = $response->getCookie('zamaro_session')->getValue();
        $this->assertNotSame($session, $signedIn, 'The session gets a new ID once signed in.');
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $signedIn)->getJson('/api/v1/me')->assertOk();
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.sign_in', 'actor_id' => $this->user()->id]);
    }

    public function test_a_wrong_code_is_refused_and_the_challenge_stays_open(): void
    {
        $session = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();

        $response = $this->challenge($session, ['code' => '000000']);

        $response->assertUnprocessable()->assertJsonPath('errors.code.0', 'That code is wrong or has expired. Enter the code your app shows now.');
        $this->assertMatchesContract($response);
        $this->challenge($session, ['code' => (new Google2FA)->getCurrentOtp($this->secret)])->assertOk();
    }

    public function test_a_recovery_code_works_once(): void
    {
        $session = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();

        $this->challenge($session, ['recoveryCode' => strtoupper(str_replace('-', '', $this->recoveryCodes[3]))])->assertOk();

        $again = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();
        $this->challenge($again, ['recoveryCode' => $this->recoveryCodes[3]])
            ->assertUnprocessable()
            ->assertJsonPath('errors.recoveryCode.0', 'That recovery code is wrong or was used. Enter another of your saved codes.');
        $this->challenge($again, ['recoveryCode' => $this->recoveryCodes[4]])->assertOk();
    }

    public function test_without_a_password_step_there_is_no_challenge(): void
    {
        $response = $this->newBrowser()->fromTheWebApp()->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp($this->secret)]);

        $response->assertUnauthorized();
    }

    public function test_the_challenge_lasts_10_minutes(): void
    {
        $session = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();
        $this->travel(11)->minutes();

        $this->challenge($session, ['code' => (new Google2FA)->getCurrentOtp($this->secret)])->assertUnauthorized();
    }

    public function test_wrong_codes_and_wrong_passwords_share_the_lockout(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->newBrowser()->signIn($this->email, 'not-my-password')->assertUnprocessable();
        }
        $session = $this->newBrowser()->signIn($this->email)->getCookie('zamaro_session')->getValue();
        $this->challenge($session, ['code' => '000000'])->assertUnprocessable();
        $this->challenge($session, ['code' => '000001'])->assertUnprocessable();

        $response = $this->challenge($session, ['code' => (new Google2FA)->getCurrentOtp($this->secret)]);

        $response->assertStatus(429)->assertJsonPath('type', config('zamaro.problems.base_uri').'/sign-in-paused');
        $this->newBrowser()->signIn($this->email)->assertStatus(429);
    }

    public function test_a_reset_password_leads_to_the_challenge_too(): void
    {
        $token = app(\App\Actions\Accounts\IssuePasswordResetToken::class)->handle($this->user());

        $response = $this->newBrowser()->fromTheWebApp()->postJson('/api/v1/password/reset', [
            'token' => $token, 'password' => 'a-song-of-ascents-121', 'passwordConfirmation' => 'a-song-of-ascents-121',
        ]);

        $response->assertStatus(202)->assertJsonPath('data.twoFactorRequired', true);
        $session = $response->getCookie('zamaro_session')->getValue();
        $this->challenge($session, ['code' => (new Google2FA)->getCurrentOtp($this->secret)])->assertOk();
    }

    private function newBrowser(): static
    {
        return $this->asANewRequest()->withoutCookies();
    }

    /** @param  array<string, string>  $body */
    private function challenge(string $session, array $body): TestResponse
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session)
            ->postJson('/api/v1/session/two-factor', $body);
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
