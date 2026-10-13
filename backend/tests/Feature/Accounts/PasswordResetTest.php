<?php

namespace Tests\Feature\Accounts;

use App\Actions\Accounts\IssuePasswordResetToken;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\ResetPasswordNotification;
use Database\Seeders\CastSeeder;
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
 * L2-023.3: asking for a reset always gets the same answer, and the link works once, for 60 minutes.
 * L2-023.4: a reset ends every other session, and this browser is signed in. L2-072.1: the new
 * password follows the policy. L2-077.4: asking for a link needs a passing bot check. Limits: 5 links
 * an hour per address and per email, 30 resets a minute per address (M2 D6).
 */
class PasswordResetTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    private const NEW_PASSWORD = 'a-song-of-ascents-121';

    private User $naomi;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:31', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->naomi = User::where('email', self::NAOMI)->sole();
    }

    public function test_asking_for_a_link_answers_202_and_emails_one_that_works_for_60_minutes(): void
    {
        $response = $this->forgot(self::NAOMI);

        $response->assertStatus(202)->assertExactJson(['data' => ['email' => self::NAOMI]]);
        $this->assertMatchesContract($response);
        $email = $this->onlySentEmail();
        $this->assertSame(self::NAOMI, $email->getTo()[0]->getAddress());
        $this->assertSame('Reset your Zamaro password', $email->getSubject());
        $this->assertNotEmpty($email->getHtmlBody());
        $this->assertStringContainsString('Hi Naomi,', $email->getTextBody());
        preg_match('#'.preg_quote(config('zamaro.web_url'), '#').'/reset-password/([A-Za-z0-9]+)#', $email->getTextBody(), $link);
        $this->assertNotEmpty($link, 'The text part holds the reset link.');
        $token = DB::table('password_reset_tokens')->where('token_hash', hash('sha256', $link[1]))->first();
        $this->assertNotNull($token, 'Only the token’s SHA-256 is stored.');
        $this->assertSame($this->naomi->id, $token->user_id);
        $this->assertTrue(Carbon::parse($token->expires_at)->equalTo(now()->addHour()));
    }

    public function test_an_address_with_no_account_gets_the_same_answer_and_nothing_is_sent(): void
    {
        Notification::fake();

        $this->forgot('nobody@gracepoint.ca')->assertStatus(202)->assertExactJson(['data' => ['email' => 'nobody@gracepoint.ca']]);
        $this->forgot('Naomi.Fraser@RiversideCC.ca')->assertStatus(202)->assertExactJson(['data' => ['email' => self::NAOMI]]);

        Notification::assertSentToTimes($this->naomi, ResetPasswordNotification::class, 1);
        $this->assertSame(1, DB::table('password_reset_tokens')->count());
    }

    public function test_a_failed_bot_check_sends_nothing(): void
    {
        Notification::fake();

        $response = $this->forgot(self::NAOMI, 'fail');

        $response->assertStatus(422)->assertJsonValidationErrors(['challengeToken']);
        Notification::assertNothingSent();
    }

    public function test_a_new_link_replaces_the_earlier_one(): void
    {
        $earlier = $this->issueToken();

        $this->forgot(self::NAOMI)->assertStatus(202);

        $this->check($earlier)->assertStatus(410);
    }

    public function test_the_6th_link_in_an_hour_from_one_address_or_for_one_email_is_refused(): void
    {
        Notification::fake();
        for ($i = 1; $i <= 5; $i++) {
            $this->forgot("someone{$i}@gracepoint.ca")->assertStatus(202);
        }
        $response = $this->forgot('someone6@gracepoint.ca');
        $response->assertStatus(429)->assertJsonPath('type', config('zamaro.problems.base_uri').'/too-many-requests');
        $this->assertMatchesContract($response);

        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => "203.0.113.{$i}"])->forgot(self::NAOMI)->assertStatus(202);
        }
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.99'])->forgot(self::NAOMI)->assertStatus(429);
    }

    public function test_checking_a_link_names_the_account_and_when_it_runs_out_without_using_it(): void
    {
        $token = $this->issueToken();

        $response = $this->check($token);

        $response->assertOk()->assertExactJson(['data' => [
            'email' => self::NAOMI,
            'expiresAt' => Carbon::parse('2026-10-09 11:31', 'America/Toronto')->toIso8601String(),
        ]]);
        $this->assertMatchesContract($response);
        $this->check($token)->assertOk();
    }

    public function test_an_unknown_link_has_expired_and_names_no_one(): void
    {
        $response = $this->check('e2e-unknown');

        $response->assertStatus(410)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/link-expired')
            ->assertJsonMissingPath('email');
        $this->assertMatchesContract($response);
    }

    public function test_a_link_works_for_60_minutes_and_then_names_its_account_and_when_it_was_sent(): void
    {
        $token = $this->issueToken();

        $this->travel(59)->minutes();
        $this->check($token)->assertOk();
        $this->travel(2)->minutes();

        $this->check($token)->assertStatus(410)
            ->assertJsonPath('email', self::NAOMI)
            ->assertJsonPath('sentAt', Carbon::parse('2026-10-09 10:31', 'America/Toronto')->toIso8601String());
        $this->reset($token)->assertStatus(410);
        $this->assertTrue(Hash::check(config('zamaro.cast_password'), $this->naomi->fresh()->password));
    }

    public function test_a_new_password_signs_this_browser_in_and_uses_the_link_up(): void
    {
        Notification::fake();
        $token = $this->issueToken();

        $response = $this->reset($token);

        $response->assertOk()->assertJsonPath('data.email', self::NAOMI);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $this->assertAuthenticatedAs($this->naomi);
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $this->naomi->fresh()->password));
        $this->assertStringStartsWith('$argon2id$', $this->naomi->fresh()->password);
        Notification::assertSentTo($this->naomi, PasswordChangedNotification::class);
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.password_reset', 'actor_id' => $this->naomi->id]);
        $this->asANewRequest()->reset($token)->assertStatus(410);
    }

    public function test_a_reset_ends_every_other_session(): void
    {
        $elsewhere = $this->signIn(self::NAOMI)->getCookie('zamaro_session')->getValue();
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $elsewhere)->getJson('/api/v1/me')->assertOk();
        $token = $this->issueToken();

        $here = $this->asANewRequest()->withoutCookies()->reset($token)->assertOk()->getCookie('zamaro_session')->getValue();

        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $elsewhere)->getJson('/api/v1/me')->assertUnauthorized();
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $here)->getJson('/api/v1/me')->assertOk();
        $this->assertSame(1, DB::table('user_sessions')->where('user_id', $this->naomi->id)->count());
    }

    public function test_the_password_changed_email_is_sent_to_the_account(): void
    {
        $this->reset($this->issueToken())->assertOk();

        $email = $this->onlySentEmail();
        $this->assertSame(self::NAOMI, $email->getTo()[0]->getAddress());
        $this->assertSame('Your Zamaro password was changed', $email->getSubject());
        $this->assertStringContainsString(config('zamaro.web_url').'/forgot-password', $email->getTextBody());
    }

    public function test_the_new_password_follows_the_policy_and_both_must_match(): void
    {
        $token = $this->issueToken();

        $this->reset($token, ['password' => 'grace2026', 'passwordConfirmation' => 'grace2026'])
            ->assertStatus(422)->assertJsonValidationErrors(['password']);
        $this->reset($token, ['password' => 'password1234', 'passwordConfirmation' => 'password1234'])
            ->assertStatus(422)->assertJsonPath('errors.password.0', 'This password appears in a known data breach. Choose another.');
        $response = $this->reset($token, ['passwordConfirmation' => 'a-song-of-ascents-12l']);
        $response->assertStatus(422)->assertJsonValidationErrors(['passwordConfirmation']);
        $this->assertMatchesContract($response);

        $this->reset($token)->assertOk();
    }

    public function test_the_31st_reset_in_a_minute_from_one_address_is_refused(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $this->check('e2e-unknown')->assertStatus(410);
        }

        $this->reset('e2e-unknown')->assertStatus(429);
    }

    private function issueToken(): string
    {
        return app(IssuePasswordResetToken::class)->handle($this->naomi);
    }

    private function forgot(string $email, string $challengeToken = 'pass'): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/password/forgot', ['email' => $email, 'challengeToken' => $challengeToken]);
    }

    private function check(string $token): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/password/reset/check', ['token' => $token]);
    }

    /** @param  array<string, string>  $overrides */
    private function reset(string $token, array $overrides = []): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/password/reset', array_merge([
            'token' => $token,
            'password' => self::NEW_PASSWORD,
            'passwordConfirmation' => self::NEW_PASSWORD,
        ], $overrides));
    }

    private function onlySentEmail(): Email
    {
        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);

        return $messages[0]->getOriginalMessage();
    }
}
