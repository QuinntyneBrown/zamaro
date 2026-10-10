<?php

namespace Tests\Feature\Accounts;

use App\Actions\Accounts\IssueEmailVerificationToken;
use App\Enums\Role;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-022.3: the verification link marks the address verified once, within 24 hours; after that, or
 * after one use, it has expired and a new link can be sent, which stops the earlier ones working
 * (accounts/register-booker; resend limit M2 D6).
 */
class VerifyEmailTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private User $ruth;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed([LegalDocumentSeeder::class, CastSeeder::class]);
        $this->ruth = User::create([
            'name' => 'Ruth Adeyemi',
            'email' => 'ruth.adeyemi@gracepoint.ca',
            'password' => Hash::make(config('zamaro.cast_password')),
        ]);
        $this->ruth->grantRoles([Role::Booker]);
    }

    public function test_the_link_marks_the_address_verified_and_names_the_person(): void
    {
        $token = $this->issueToken();

        $response = $this->verify($token);

        $response->assertOk()->assertExactJson(['data' => ['name' => 'Ruth Adeyemi']]);
        $response->assertHeader('Cache-Control', 'no-store, private');
        $this->assertMatchesContract($response);
        $this->assertTrue($this->ruth->fresh()->email_verified_at->equalTo(now()));
        $this->assertNotNull(DB::table('email_verification_tokens')->where('token_hash', hash('sha256', $token))->value('used_at'));
    }

    public function test_verifying_does_not_sign_the_person_in(): void
    {
        $this->verify($this->issueToken())->assertOk();

        $this->assertGuest('web');
    }

    public function test_a_link_works_only_once(): void
    {
        $token = $this->issueToken();
        $this->verify($token)->assertOk();

        $response = $this->verify($token);

        $response->assertStatus(410)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/link-expired')
            ->assertJsonPath('title', 'This link has expired');
        $this->assertMatchesContract($response);
    }

    public function test_a_link_works_for_24_hours(): void
    {
        $token = $this->issueToken();

        $this->travel(24 * 60 - 1)->minutes();

        $this->verify($token)->assertOk();
    }

    public function test_a_link_older_than_24_hours_has_expired_and_verifies_nothing(): void
    {
        $token = $this->issueToken();

        $this->travel(24 * 60 + 1)->minutes();

        $this->verify($token)->assertStatus(410);
        $this->assertNull($this->ruth->fresh()->email_verified_at);
    }

    public function test_an_unknown_token_has_expired(): void
    {
        $this->verify('e2e-unknown')->assertStatus(410)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/link-expired');
    }

    public function test_a_signed_in_booker_is_sent_a_new_link_and_the_earlier_one_stops_working(): void
    {
        Notification::fake();
        $earlier = $this->issueToken();
        $this->signIn('ruth.adeyemi@gracepoint.ca')->assertOk();

        $response = $this->resend();

        $response->assertStatus(202)->assertExactJson(['data' => ['accepted' => true]]);
        $this->assertMatchesContract($response);
        Notification::assertSentTo($this->ruth, VerifyEmailNotification::class);
        $this->assertSame(1, DB::table('email_verification_tokens')->where('user_id', $this->ruth->id)->count());
        $this->verify($earlier)->assertStatus(410);
    }

    public function test_the_new_link_is_a_working_24_hour_link(): void
    {
        $this->signIn('ruth.adeyemi@gracepoint.ca')->assertOk();

        $this->resend()->assertStatus(202);

        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        $text = $messages[0]->getOriginalMessage()->getTextBody();
        preg_match('#/verify-email\?token=([A-Za-z0-9]+)&returnUrl=%2F#', $text, $link);
        $this->assertNotEmpty($link, 'The new email holds a link back to Discover.');
        $this->verify($link[1])->assertOk();
    }

    public function test_a_guest_with_an_expired_link_is_sent_a_new_one(): void
    {
        Notification::fake();
        $expired = $this->issueToken();
        $this->travel(2)->days();

        $this->resend(['token' => $expired])->assertStatus(202)->assertExactJson(['data' => ['accepted' => true]]);

        Notification::assertSentTo($this->ruth, VerifyEmailNotification::class);
    }

    public function test_a_guest_who_just_signed_up_is_sent_a_new_link_by_address(): void
    {
        Notification::fake();

        $this->resend(['email' => 'Ruth.Adeyemi@GracePoint.ca'])->assertStatus(202);

        Notification::assertSentTo($this->ruth, VerifyEmailNotification::class);
    }

    public function test_an_unknown_address_or_token_gets_the_same_answer_and_nothing_is_sent(): void
    {
        Notification::fake();

        $this->resend(['email' => 'nobody@gracepoint.ca'])->assertStatus(202)->assertExactJson(['data' => ['accepted' => true]]);
        $this->resend(['token' => 'e2e-unknown'])->assertStatus(202)->assertExactJson(['data' => ['accepted' => true]]);

        Notification::assertNothingSent();
    }

    public function test_a_verified_address_is_not_sent_another_link(): void
    {
        Notification::fake();

        $response = $this->resend(['email' => 'naomi.fraser@riversidecc.ca']);

        $response->assertStatus(202)->assertExactJson(['data' => ['accepted' => true]]);
        Notification::assertNothingSent();
    }

    public function test_the_4th_resend_in_15_minutes_is_refused(): void
    {
        Notification::fake();
        $this->signIn('ruth.adeyemi@gracepoint.ca')->assertOk();
        for ($i = 1; $i <= 3; $i++) {
            $this->resend()->assertStatus(202);
        }

        $response = $this->resend();

        $response->assertStatus(429)->assertJsonPath('type', config('zamaro.problems.base_uri').'/too-many-requests');
        $this->assertMatchesContract($response);
        $this->travel(15)->minutes();
        $this->resend()->assertStatus(202);
    }

    private function issueToken(): string
    {
        return app(IssueEmailVerificationToken::class)->handle($this->ruth);
    }

    private function verify(string $token): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/email/verify', ['token' => $token]);
    }

    /** @param  array<string, string>  $body */
    private function resend(array $body = []): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/email/verification-notification', $body);
    }
}
