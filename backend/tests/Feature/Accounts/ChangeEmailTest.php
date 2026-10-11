<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Symfony\Component\Mime\Email;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-025.1 (accounts/manage-account-settings): a new email, confirmed with the current password,
 * takes over only once the link sent to it is opened; the old address is told. An address another
 * account uses gets the same answer and no link. The link works once, for 24 hours (M2 D11).
 */
class ChangeEmailTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NEW_EMAIL = 'ruth@gracepoint.ca';

    private string $email;

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
        $this->userId = User::where('email', $this->email)->value('id');
        $this->signIn($this->email)->assertOk();
    }

    public function test_asking_for_a_new_email_sends_a_link_to_it_and_a_notice_to_the_old_one(): void
    {
        $response = $this->ask('Ruth@GracePoint.ca');

        $response->assertStatus(202)->assertExactJson(['data' => ['email' => self::NEW_EMAIL]]);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $this->assertSame($this->email, $this->user()->email, 'The address changes only once the link is opened.');
        $this->assertSame(self::NEW_EMAIL, $this->user()->pending_email);

        $link = $this->emailTo(self::NEW_EMAIL);
        $this->assertSame('Confirm your new email for Zamaro', $link->getSubject());
        $this->assertNotEmpty($link->getHtmlBody());
        $token = $this->tokenIn($link);
        $row = DB::table('email_change_tokens')->where('token_hash', hash('sha256', $token))->first();
        $this->assertNotNull($row, 'Only the token’s SHA-256 is stored.');
        $this->assertSame(self::NEW_EMAIL, $row->new_email);
        $this->assertTrue(Carbon::parse($row->expires_at)->equalTo(now()->addDay()));

        $notice = $this->emailTo($this->email);
        $this->assertSame('Your Zamaro email is changing', $notice->getSubject());
        $this->assertStringContainsString(self::NEW_EMAIL, $notice->getTextBody());
    }

    public function test_the_link_moves_the_account_to_the_new_address(): void
    {
        $this->ask(self::NEW_EMAIL)->assertStatus(202);
        $token = $this->tokenIn($this->emailTo(self::NEW_EMAIL));

        $response = $this->asANewRequest()->withoutCookies()->confirm($token);

        $response->assertOk()->assertExactJson(['data' => ['email' => self::NEW_EMAIL]]);
        $this->assertMatchesContract($response);
        $user = $this->user();
        $this->assertSame(self::NEW_EMAIL, $user->email);
        $this->assertNull($user->pending_email);
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseHas('audit_entries', ['action' => 'account.email_changed', 'actor_id' => $user->id]);
        $this->asANewRequest()->withoutCookies()->signIn(self::NEW_EMAIL)->assertOk();
    }

    public function test_the_link_works_once_and_for_24_hours(): void
    {
        $this->ask(self::NEW_EMAIL)->assertStatus(202);
        $token = $this->tokenIn($this->emailTo(self::NEW_EMAIL));
        $this->travel(24)->hours();
        $this->travel(1)->minutes();

        $response = $this->confirm($token);

        $response->assertStatus(410)
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/link-expired')
            ->assertJsonPath('email', $this->email);
        $this->assertMatchesContract($response);
        $this->assertSame($this->email, $this->user()->email);
    }

    public function test_a_used_or_unknown_link_has_expired(): void
    {
        $this->ask(self::NEW_EMAIL)->assertStatus(202);
        $token = $this->tokenIn($this->emailTo(self::NEW_EMAIL));
        $this->confirm($token)->assertOk();

        $this->confirm($token)->assertStatus(410)->assertJsonPath('email', self::NEW_EMAIL);
        $this->confirm('e2e-unknown')->assertStatus(410)->assertJsonMissingPath('email');
    }

    public function test_a_new_request_replaces_the_earlier_link(): void
    {
        $this->ask(self::NEW_EMAIL)->assertStatus(202);
        $earlier = $this->tokenIn($this->emailTo(self::NEW_EMAIL));

        $this->ask('ruth.okafor@gracepoint.ca')->assertStatus(202);

        $this->confirm($earlier)->assertStatus(410);
        $this->assertSame('ruth.okafor@gracepoint.ca', $this->user()->pending_email);
    }

    public function test_an_address_another_account_uses_gets_the_same_answer_and_no_link(): void
    {
        $response = $this->ask('naomi.fraser@riversidecc.ca');

        $response->assertStatus(202)->assertExactJson(['data' => ['email' => 'naomi.fraser@riversidecc.ca']]);
        $this->assertSame([$this->email], $this->recipients());
        $this->assertNull($this->user()->pending_email);
        $this->assertSame(0, DB::table('email_change_tokens')->count());
    }

    public function test_an_address_taken_after_the_link_was_sent_is_not_moved_to(): void
    {
        $this->ask(self::NEW_EMAIL)->assertStatus(202);
        $token = $this->tokenIn($this->emailTo(self::NEW_EMAIL));
        $this->artisan('cast:booker', ['email' => self::NEW_EMAIL])->assertSuccessful();

        $this->confirm($token)->assertStatus(410);

        $this->assertSame($this->email, $this->user()->email);
    }

    public function test_a_wrong_current_password_or_a_bad_address_is_refused_and_nothing_is_sent(): void
    {
        $this->ask(self::NEW_EMAIL, 'not-my-password')
            ->assertUnprocessable()
            ->assertJsonPath('errors.currentPassword.0', 'That password isn’t right. Check it and try again.');
        $this->ask('ruth@gracepoint')->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->ask($this->email)->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertSame([], $this->recipients());
        $this->assertNull($this->user()->pending_email);
    }

    public function test_a_guest_cannot_ask_for_a_change(): void
    {
        $this->asANewRequest()->withoutCookies()->fromTheWebApp()
            ->putJson('/api/v1/account/email', ['email' => self::NEW_EMAIL, 'currentPassword' => 'x'])
            ->assertUnauthorized();
    }

    private function ask(string $email, ?string $password = null): TestResponse
    {
        return $this->fromTheWebApp()->putJson('/api/v1/account/email', [
            'email' => $email,
            'currentPassword' => $password ?? config('zamaro.cast_password'),
        ]);
    }

    private function confirm(string $token): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/account/email/confirm', ['token' => $token]);
    }

    private function user(): User
    {
        return User::findOrFail($this->userId);
    }

    private function emailTo(string $address): Email
    {
        $sent = array_values(array_filter(
            array_map(fn ($message) => $message->getOriginalMessage(), app('mailer')->getSymfonyTransport()->messages()->all()),
            fn (Email $email) => $email->getTo()[0]->getAddress() === $address,
        ));
        $this->assertNotEmpty($sent, "An email went to {$address}.");

        return end($sent);
    }

    /** @return list<string> */
    private function recipients(): array
    {
        return array_map(
            fn ($message) => $message->getOriginalMessage()->getTo()[0]->getAddress(),
            app('mailer')->getSymfonyTransport()->messages()->all(),
        );
    }

    private function tokenIn(Email $email): string
    {
        preg_match('#'.preg_quote(config('zamaro.web_url'), '#').'/account/email/confirm\?token=([A-Za-z0-9]+)#', $email->getTextBody(), $link);
        $this->assertNotEmpty($link, 'The text part holds the confirmation link.');

        return $link[1];
    }
}
