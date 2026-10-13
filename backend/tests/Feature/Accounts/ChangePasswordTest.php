<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-025.2 (accounts/manage-account-settings): a new password, given the current one, ends every
 * other session and gives this one a new ID. L2-072.1: it follows the password policy.
 */
class ChangePasswordTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NEW_PASSWORD = 'a-song-of-ascents-121';

    private string $email;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
    }

    public function test_a_new_password_ends_every_other_session_and_renews_this_one(): void
    {
        $elsewhere = $this->signIn($this->email)->getCookie('zamaro_session')->getValue();
        $here = $this->asANewRequest()->withoutCookies()->signIn($this->email)->getCookie('zamaro_session')->getValue();

        $response = $this->asANewRequest()->withCookie('zamaro_session', $here)->change();

        $response->assertNoContent();
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $renewed = $response->getCookie('zamaro_session')->getValue();
        $this->assertNotSame($here, $renewed);
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $elsewhere)->getJson('/api/v1/me')->assertUnauthorized();
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $here)->getJson('/api/v1/me')->assertUnauthorized();
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $renewed)->getJson('/api/v1/me')->assertOk();
        $this->assertSame(1, DB::table('user_sessions')->where('user_id', $this->user()->id)->count());
    }

    public function test_the_new_password_signs_in_and_the_old_one_does_not(): void
    {
        $this->signIn($this->email)->assertOk();

        $this->change()->assertNoContent();

        $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertUnprocessable();
        $this->asANewRequest()->withoutCookies()->signIn($this->email, self::NEW_PASSWORD)->assertOk();
        $this->assertDatabaseHas('audit_entries', ['action' => 'auth.password_changed', 'actor_id' => $this->user()->id]);
    }

    public function test_the_owner_is_emailed_that_the_password_changed(): void
    {
        Notification::fake();
        $this->signIn($this->email)->assertOk();

        $this->change()->assertNoContent();

        Notification::assertSentTo($this->user(), PasswordChangedNotification::class);
    }

    public function test_a_wrong_current_password_changes_nothing(): void
    {
        $this->signIn($this->email)->assertOk();

        $response = $this->change(['currentPassword' => 'not-my-password']);

        $response->assertUnprocessable()->assertJsonPath('errors.currentPassword.0', 'That password isn’t right. Check it and try again.');
        $this->assertMatchesContract($response);
        $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertOk();
    }

    public function test_the_new_password_follows_the_policy_and_both_must_match(): void
    {
        $this->signIn($this->email)->assertOk();

        $this->change(['password' => 'grace2026', 'passwordConfirmation' => 'grace2026'])
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'This one has 9 characters. Use at least 12.');
        $this->change(['passwordConfirmation' => 'a-song-of-ascents-12l'])
            ->assertUnprocessable()->assertJsonValidationErrors('passwordConfirmation');
    }

    public function test_a_guest_gets_401(): void
    {
        $this->fromTheWebApp()->putJson('/api/v1/account/password', [])->assertUnauthorized();
    }

    /** @param  array<string, string>  $overrides */
    private function change(array $overrides = []): TestResponse
    {
        return $this->fromTheWebApp()->putJson('/api/v1/account/password', array_merge([
            'currentPassword' => config('zamaro.cast_password'),
            'password' => self::NEW_PASSWORD,
            'passwordConfirmation' => self::NEW_PASSWORD,
        ], $overrides));
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
