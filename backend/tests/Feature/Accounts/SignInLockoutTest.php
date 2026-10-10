<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Notifications\AccountLockedNotification;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-072.4: 5 failed sign-ins for one address within 15 minutes pause sign-in for that address for 15
 * minutes, and the owner is emailed once per pause. An address with no account is paused the same
 * way, so the answer never says which addresses have one (accounts/sign-in-and-recover-access).
 */
class SignInLockoutTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:42', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_the_sixth_try_after_five_failures_is_refused_even_with_the_right_password(): void
    {
        $this->failSignIns(self::NAOMI, 5);

        $response = $this->signIn(self::NAOMI);

        $response->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/sign-in-paused')
            ->assertJsonPath('title', 'Sign-in is paused for 15 minutes')
            ->assertJsonPath('pausedUntil', Carbon::parse('2026-10-09 10:57', 'America/Toronto')->toIso8601String());
        $this->assertSame(900, (int) $response->headers->get('Retry-After'));
        $this->assertGuest('web');
        $this->assertMatchesContract($response);
    }

    public function test_four_failures_do_not_pause_sign_in(): void
    {
        $this->failSignIns(self::NAOMI, 4);

        $this->signIn(self::NAOMI)->assertOk();
    }

    public function test_the_owner_is_emailed_once_per_pause(): void
    {
        Notification::fake();
        $naomi = User::where('email', self::NAOMI)->sole();
        $this->failSignIns(self::NAOMI, 5);

        $this->signIn(self::NAOMI)->assertStatus(429);
        $this->signIn(self::NAOMI, 'wrong-again')->assertStatus(429);

        Notification::assertSentToTimes($naomi, AccountLockedNotification::class, 1);
    }

    public function test_the_locked_email_says_when_sign_in_resumes_and_offers_a_reset(): void
    {
        $this->failSignIns(self::NAOMI, 5);

        $this->signIn(self::NAOMI)->assertStatus(429);

        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        $email = $messages[0]->getOriginalMessage();
        $this->assertSame(self::NAOMI, $email->getTo()[0]->getAddress());
        $this->assertSame('Sign-in to your Zamaro account is paused', $email->getSubject());
        $this->assertNotEmpty($email->getHtmlBody());
        $this->assertStringContainsString('10:57 a.m.', $email->getTextBody());
        $this->assertStringContainsString(config('zamaro.web_url').'/forgot-password', $email->getTextBody());
    }

    public function test_an_address_with_no_account_is_paused_the_same_way_and_nobody_is_emailed(): void
    {
        Notification::fake();
        $this->failSignIns('nobody@gracepoint.ca', 5);

        $this->signIn('nobody@gracepoint.ca')->assertStatus(429)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/sign-in-paused');

        Notification::assertNothingSent();
    }

    public function test_the_pause_counts_the_address_in_any_case(): void
    {
        $this->failSignIns('Naomi.Fraser@RiversideCC.ca', 5);

        $this->signIn(self::NAOMI)->assertStatus(429);
    }

    public function test_one_address_being_paused_leaves_others_alone(): void
    {
        $this->failSignIns('nobody@gracepoint.ca', 5);

        $this->signIn(self::NAOMI)->assertOk();
    }

    public function test_sign_in_resumes_after_15_minutes(): void
    {
        $this->failSignIns(self::NAOMI, 5);
        $this->signIn(self::NAOMI)->assertStatus(429);

        $this->travel(15)->minutes();

        $this->signIn(self::NAOMI)->assertOk();
    }

    public function test_failures_more_than_15_minutes_apart_do_not_add_up(): void
    {
        $this->failSignIns(self::NAOMI, 4);
        $this->travel(16)->minutes();
        $this->failSignIns(self::NAOMI, 1);

        $this->signIn(self::NAOMI)->assertOk();
    }

    public function test_a_successful_sign_in_starts_the_count_again(): void
    {
        $this->failSignIns(self::NAOMI, 4);
        $this->signIn(self::NAOMI)->assertOk();
        $this->asANewRequest();

        $this->failSignIns(self::NAOMI, 4);

        $this->signIn(self::NAOMI)->assertOk();
    }

    private function failSignIns(string $email, int $times): void
    {
        for ($i = 0; $i < $times; $i++) {
            $this->signIn($email, 'not-the-password')->assertStatus(422);
        }
    }
}
