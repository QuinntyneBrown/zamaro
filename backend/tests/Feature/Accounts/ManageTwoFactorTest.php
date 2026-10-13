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
 * L2-072.5 (accounts/sign-in-and-recover-access): turning two-step sign-in off, or getting new
 * recovery codes, needs a current code or an unused recovery code first; new codes replace every
 * earlier one. Wrong codes count toward the pause. Each change is emailed (M2 D21) and audited.
 */
class ManageTwoFactorTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const WRONG = 'That code is wrong or has expired. Enter the code your app shows now, or an unused recovery code.';

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
            'code' => $this->currentCode(),
        ])->assertOk()->json('data.recoveryCodes');
    }

    public function test_a_current_code_turns_it_off(): void
    {
        Notification::fake();

        $response = $this->turnOff($this->currentCode());

        $response->assertNoContent();
        $this->assertMatchesContract($response);
        $user = $this->user();
        $this->assertFalse($user->mfa_enabled);
        $this->assertNull($user->two_factor_secret);
        $this->assertSame(0, DB::table('recovery_codes')->where('user_id', $user->id)->count());
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.two_factor_disabled', 'actor_id' => $user->id]);
        Notification::assertSentTo($user, TwoStepSignInChangedNotification::class);
        $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertOk()->assertJsonPath('data.mfaEnabled', false);
    }

    public function test_an_unused_recovery_code_turns_it_off_too(): void
    {
        $this->turnOff($this->recoveryCodes[0])->assertNoContent();

        $this->assertFalse($this->user()->mfa_enabled);
    }

    public function test_a_wrong_code_changes_nothing_and_counts_toward_the_pause(): void
    {
        $response = $this->turnOff('000000');

        $response->assertUnprocessable()->assertJsonPath('errors.code.0', self::WRONG);
        $this->assertMatchesContract($response);
        $this->assertTrue($this->user()->mfa_enabled);

        for ($i = 0; $i < 4; $i++) {
            $this->turnOff('000000')->assertUnprocessable();
        }
        $this->turnOff($this->currentCode())->assertStatus(429)->assertJsonPath('type', config('zamaro.problems.base_uri').'/sign-in-paused');
        $this->assertTrue($this->user()->mfa_enabled);
    }

    public function test_new_codes_replace_every_earlier_one(): void
    {
        Notification::fake();

        $response = $this->newCodes($this->currentCode());

        $response->assertOk();
        $this->assertMatchesContract($response);
        $codes = $response->json('data.recoveryCodes');
        $this->assertCount(10, $codes);
        $this->assertEmpty(array_intersect($codes, $this->recoveryCodes));
        $this->assertTrue($this->user()->mfa_enabled);
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.recovery_codes_replaced', 'actor_id' => $this->user()->id]);
        Notification::assertSentTo($this->user(), TwoStepSignInChangedNotification::class);

        $this->turnOff($this->recoveryCodes[1])->assertUnprocessable();
        $this->turnOff($codes[1])->assertNoContent();
    }

    public function test_a_recovery_code_can_prove_it_is_you_for_new_codes(): void
    {
        $this->newCodes($this->recoveryCodes[2])->assertOk();

        $this->newCodes('000000')->assertUnprocessable()->assertJsonPath('errors.code.0', self::WRONG);
    }

    public function test_the_emails_name_the_change(): void
    {
        $this->newCodes($this->currentCode())->assertOk();
        $this->turnOff($this->currentCode())->assertNoContent();

        $subjects = array_map(
            fn ($message) => $message->getOriginalMessage()->getSubject(),
            app('mailer')->getSymfonyTransport()->messages()->all(),
        );
        $this->assertContains('New recovery codes for your Zamaro account', $subjects);
        $this->assertContains('Two-step sign-in is off for your Zamaro account', $subjects);
    }

    public function test_with_two_step_sign_in_off_there_is_nothing_to_turn_off(): void
    {
        $this->turnOff($this->currentCode())->assertNoContent();

        $this->turnOff($this->currentCode())->assertNotFound();
        $this->newCodes($this->currentCode())->assertNotFound();
    }

    private function turnOff(string $code): TestResponse
    {
        return $this->fromTheWebApp()->deleteJson('/api/v1/account/two-factor', ['code' => $code]);
    }

    private function newCodes(string $code): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/account/two-factor/recovery-codes', ['code' => $code]);
    }

    private function currentCode(): string
    {
        return (new Google2FA)->getCurrentOtp($this->secret);
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
