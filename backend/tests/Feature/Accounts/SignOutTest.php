<?php

namespace Tests\Feature\Accounts;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-023.5: signing out ends the session on the server, so the cookie the browser held is worth
 * nothing afterwards. The CSRF token is rotated with it (manage-sessions-and-csrf).
 */
class SignOutTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_naomi_signs_out_and_is_a_guest_afterwards(): void
    {
        $session = $this->signIn('naomi.fraser@riversidecc.ca')->getCookie('zamaro_session')->getValue();

        $response = $this->fromTheWebApp()->withCookie('zamaro_session', $session)->deleteJson('/api/v1/session');

        $response->assertNoContent();
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertGuest('web');
        $this->assertMatchesContract($response);
    }

    public function test_the_session_cookie_she_held_gets_401_once_she_has_signed_out(): void
    {
        $session = $this->signIn('naomi.fraser@riversidecc.ca')->getCookie('zamaro_session')->getValue();
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $session)->getJson('/api/v1/me')->assertOk();

        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $session)->deleteJson('/api/v1/session')->assertNoContent();

        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $session)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_signing_out_gives_the_browser_a_new_session_and_csrf_token(): void
    {
        $signedIn = $this->signIn('naomi.fraser@riversidecc.ca');
        $session = $signedIn->getCookie('zamaro_session')->getValue();

        $signedOut = $this->fromTheWebApp()->withCookie('zamaro_session', $session)->deleteJson('/api/v1/session');

        $this->assertNotSame($session, $signedOut->getCookie('zamaro_session')->getValue());
        $this->assertNotSame(
            $signedIn->getCookie('XSRF-TOKEN')->getValue(),
            $signedOut->getCookie('XSRF-TOKEN')->getValue(),
        );
    }

    public function test_a_guest_who_signs_out_gets_the_401_problem(): void
    {
        $response = $this->fromTheWebApp()->deleteJson('/api/v1/session');

        $response->assertUnauthorized()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/unauthenticated');
        $this->assertMatchesContract($response);
    }
}
