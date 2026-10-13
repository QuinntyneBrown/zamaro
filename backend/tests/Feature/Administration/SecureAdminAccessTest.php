<?php

namespace Tests\Feature\Administration;

use App\Enums\AuditAction;
use App\Enums\Role;
use App\Enums\VscStatus;
use App\Models\AuditEntry;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-066.1–.2 (administration/secure-admin-access): the admin API answers only an administrator who
 * signed in with a code, and an administrator's session ends after 30 minutes without a request.
 * Administrators are made by `zamaro:admin:grant` (M3 D6) and cannot turn two-step sign-in off.
 */
class SecureAdminAccessTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const OVERVIEW = '/api/v1/admin/overview';

    private string $email;

    private ?string $secret = null;

    private ?string $session = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'priya-'.uniqid().'@zamaro.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
    }

    public function test_granting_the_role_from_the_console_records_a_role_change_by_the_system(): void
    {
        $this->artisan('zamaro:admin:grant', ['email' => strtoupper($this->email)])
            ->expectsOutputToContain('is now an administrator')
            ->assertSuccessful();
        $this->artisan('zamaro:admin:grant', ['email' => $this->email])->assertSuccessful();

        $this->assertContains(Role::Administrator, $this->user()->roleNames());
        $entry = AuditEntry::where('action', AuditAction::RoleChanged)->sole();
        $this->assertNull($entry->actor_id);
        $this->assertSame($this->user()->id, $entry->target_id);
    }

    public function test_granting_the_role_to_an_address_with_no_account_fails(): void
    {
        $this->artisan('zamaro:admin:grant', ['email' => 'nobody@zamaro.ca'])->assertFailed();

        $this->assertSame(0, AuditEntry::where('action', AuditAction::RoleChanged)->count());
    }

    public function test_the_seeded_administrator_priya_signs_in_with_her_seeded_key(): void
    {
        $pending = $this->asANewRequest()->withoutCookies()->signIn('priya@zamaro.ca')->assertStatus(202)
            ->assertJsonPath('data.email', 'priya@zamaro.ca')
            ->getCookie('zamaro_session')->getValue();

        $signedIn = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp(CastSeeder::PRIYA_TOTP_SECRET)]);

        $signedIn->assertOk()->assertJsonPath('data.name', 'Priya Nair')->assertJsonPath('data.roles', ['admin']);
        $this->session = $signedIn->getCookie('zamaro_session')->getValue();
        $this->asAdministrator()->getJson(self::OVERVIEW)->assertOk();
    }

    public function test_an_administrator_signed_in_with_a_code_sees_the_overview(): void
    {
        $this->makeAdministratorWithTwoStep();
        DB::table('vulnerable_sector_checks')->insert([
            ['user_id' => $this->user()->id, 'issued_on' => '2026-09-25', 'expires_on' => '2029-09-25', 'status' => VscStatus::Pending->value, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $this->user()->id, 'issued_on' => '2026-10-05', 'expires_on' => '2029-10-05', 'status' => VscStatus::Pending->value, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $this->user()->id, 'issued_on' => '2025-03-03', 'expires_on' => '2028-03-03', 'status' => VscStatus::Verified->value, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->signInWithCode();
        $response = $this->asAdministrator()->getJson(self::OVERVIEW);

        // Two waiting from the seed (Elijah's and Abigail's) plus the two above.
        $response->assertOk()
            ->assertExactJson(['data' => ['checksWaiting' => 4]])
            ->assertHeader('Cache-Control', 'no-store, private');
        $this->assertMatchesContract($response);
    }

    public function test_after_the_password_alone_the_admin_api_is_not_found(): void
    {
        $this->makeAdministratorWithTwoStep();

        $response = $this->asANewRequest()->withoutCookies()->signIn($this->email);
        $response->assertStatus(202)->assertJsonPath('data.twoFactorRequired', true);
        $this->session = $response->getCookie('zamaro_session')->getValue();

        $this->assertNotFoundProblem($this->asAdministrator()->getJson(self::OVERVIEW));
    }

    public function test_an_administrator_without_two_step_sign_in_is_not_found_until_they_turn_it_on(): void
    {
        $this->artisan('zamaro:admin:grant', ['email' => $this->email])->assertSuccessful();
        $signIn = $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertOk();
        $signIn->assertJsonPath('data.mfaEnabled', false)->assertJsonPath('data.roles', ['admin', 'booker']);
        $this->session = $signIn->getCookie('zamaro_session')->getValue();

        $this->assertNotFoundProblem($this->asAdministrator()->getJson(self::OVERVIEW));

        $key = str_replace(' ', '', $this->asAdministrator()->postJson('/api/v1/account/two-factor')->assertOk()->json('data.key'));
        $this->asAdministrator()->postJson('/api/v1/account/two-factor/confirm', ['code' => (new Google2FA)->getCurrentOtp($key)])->assertOk();

        $this->asAdministrator()->getJson(self::OVERVIEW)->assertOk();
    }

    public function test_an_administrators_session_ends_after_30_minutes_without_a_request(): void
    {
        $this->makeAdministratorWithTwoStep();
        $this->signInWithCode();

        $this->travel(29)->minutes();
        $this->asAdministrator()->getJson(self::OVERVIEW)->assertOk();
        $this->travel(29)->minutes();
        $this->asAdministrator()->getJson('/api/v1/me')->assertOk();

        $this->travel(31)->minutes();
        $ended = $this->asAdministrator()->getJson(self::OVERVIEW);

        $ended->assertUnauthorized()->assertJsonPath('type', config('zamaro.problems.base_uri').'/unauthenticated');
        $this->asAdministrator()->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_a_bookers_session_is_not_held_to_the_administrators_limit(): void
    {
        $booker = $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertOk();
        $this->session = $booker->getCookie('zamaro_session')->getValue();

        $this->travel(31)->minutes();

        $this->asAdministrator()->getJson('/api/v1/me')->assertOk();
    }

    public function test_an_administrator_cannot_turn_two_step_sign_in_off(): void
    {
        $this->makeAdministratorWithTwoStep();
        $this->signInWithCode();

        $response = $this->asAdministrator()->deleteJson('/api/v1/account/two-factor', ['code' => (new Google2FA)->getCurrentOtp($this->secret)]);

        $response->assertStatus(409)->assertJsonPath('type', config('zamaro.problems.base_uri').'/two-factor-required');
        $this->assertMatchesContract($response);
        $this->assertTrue($this->user()->fresh()->mfa_enabled);
    }

    /** Priya with the Administrator role and two-step sign-in on, signed out. */
    private function makeAdministratorWithTwoStep(): void
    {
        $this->artisan('zamaro:admin:grant', ['email' => $this->email])->assertSuccessful();
        $this->session = $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertOk()
            ->getCookie('zamaro_session')->getValue();
        $this->secret = str_replace(' ', '', $this->asAdministrator()->postJson('/api/v1/account/two-factor')->json('data.key'));
        $this->asAdministrator()->postJson('/api/v1/account/two-factor/confirm', [
            'code' => (new Google2FA)->getCurrentOtp($this->secret),
        ])->assertOk();
        $this->asAdministrator()->deleteJson('/api/v1/session')->assertNoContent();
        $this->session = null;
    }

    private function signInWithCode(): void
    {
        $pending = $this->asANewRequest()->withoutCookies()->signIn($this->email)->assertStatus(202)
            ->getCookie('zamaro_session')->getValue();
        $this->session = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp($this->secret)])
            ->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function asAdministrator(): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', (string) $this->session);
    }

    private function assertNotFoundProblem(TestResponse $response): void
    {
        $unknown = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/__nothing-here');
        $response->assertNotFound()->assertHeader('Content-Type', 'application/problem+json');
        $this->assertSame($unknown->json('type'), $response->json('type'));
        $this->assertSame($unknown->json('title'), $response->json('title'));
        $this->assertSame($unknown->json('detail'), $response->json('detail'));
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
