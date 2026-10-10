<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Mockery;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-023.1–.2: valid credentials start a session; invalid ones get one message whichever was wrong.
 * L2-072.2: passwords are hashed with Argon2id. L2-073.1: the session cookie is HttpOnly, Secure and
 * SameSite=Lax, and its ID changes at sign-in. L2-089.3: the answer is private and never stored.
 */
class SignInTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_naomi_signs_in_with_her_email_and_password_and_gets_her_account(): void
    {
        $response = $this->signIn(self::NAOMI);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Naomi Fraser')
            ->assertJsonPath('data.email', self::NAOMI)
            ->assertJsonPath('data.initials', 'NF')
            ->assertJsonPath('data.roles', ['booker'])
            ->assertJsonPath('data.emailVerified', true);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertAuthenticatedAs(User::where('email', self::NAOMI)->sole());
        $this->assertMatchesContract($response);
    }

    public function test_the_address_is_matched_whatever_its_case_and_surrounding_spaces(): void
    {
        $this->signIn('  Naomi.Fraser@RiversideCC.ca ')->assertOk();
    }

    public function test_the_session_cookie_is_http_only_secure_and_same_site_lax(): void
    {
        $cookie = $this->signIn(self::NAOMI)->getCookie('zamaro_session');

        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertTrue($cookie->isSecure());
        $this->assertSame('lax', $cookie->getSameSite());
    }

    public function test_the_session_id_changes_at_sign_in(): void
    {
        $before = Str::random(40);

        $after = $this->withCookie('zamaro_session', $before)->signIn(self::NAOMI)->getCookie('zamaro_session');

        $this->assertNotNull($after);
        $this->assertNotSame($before, $after->getValue());
    }

    public function test_a_wrong_password_gets_one_message_that_does_not_say_which_was_wrong(): void
    {
        $response = $this->signIn(self::NAOMI, 'not-her-password-at-all');

        $response->assertStatus(422)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('errors', ['credentials' => ['Email or password is incorrect.']]);
        $this->assertGuest();
        $this->assertMatchesContract($response);
    }

    public function test_an_unknown_email_gets_the_same_answer_as_a_wrong_password(): void
    {
        $wrongPassword = $this->signIn(self::NAOMI, 'not-her-password-at-all')->json();
        $unknownEmail = $this->signIn('nobody@riversidecc.ca', 'not-her-password-at-all')->assertStatus(422)->json();

        unset($wrongPassword['requestId'], $unknownEmail['requestId']);
        $this->assertSame($wrongPassword, $unknownEmail);
        $this->assertGuest();
    }

    public function test_an_unknown_email_is_checked_against_a_dummy_hash_so_it_takes_as_long(): void
    {
        // A proxy of the real hasher: every call reaches it, and the checks are counted.
        $hasher = Mockery::mock(Hash::getFacadeRoot());
        $hasher->shouldReceive('check')->once()->passthru();
        Hash::swap($hasher);

        $this->signIn('nobody@riversidecc.ca', 'not-her-password-at-all')->assertStatus(422);
    }

    public function test_an_empty_email_or_password_is_refused_before_any_check(): void
    {
        $response = $this->fromTheWebApp()->postJson('/api/v1/session', ['email' => '', 'password' => '']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password'], 'errors');
        $this->assertMatchesContract($response);
    }

    public function test_each_attempt_is_written_to_the_audit_log(): void
    {
        $this->signIn('nobody@riversidecc.ca', 'not-her-password-at-all');
        $this->signIn(self::NAOMI);

        $naomi = User::where('email', self::NAOMI)->sole();
        $entries = DB::table('audit_entries')->orderBy('id')->get();
        $this->assertSame(['auth.sign_in_failed', 'auth.sign_in'], $entries->pluck('action')->all());
        $this->assertSame(['failed', 'succeeded'], $entries->pluck('outcome')->all());
        $this->assertNull($entries[0]->actor_id);
        $this->assertSame('nobody@riversidecc.ca', json_decode($entries[0]->context)->email);
        $this->assertSame($naomi->id, $entries[1]->actor_id);
        $this->assertSame('booker', $entries[1]->actor_role);
    }

    public function test_passwords_are_stored_as_argon2id_hashes(): void
    {
        $naomi = User::where('email', self::NAOMI)->sole();

        $this->assertSame('argon2id', Hash::info($naomi->password)['algoName']);
        $this->assertNotSame(config('zamaro.cast_password'), $naomi->password);
    }
}
