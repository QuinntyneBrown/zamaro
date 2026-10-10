<?php

namespace Tests\Feature\Security;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route as Router;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\EnforcesCsrf;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-073.2: a state-changing request without a valid CSRF token gets 419 and changes nothing
 * (security/manage-sessions-and-csrf).
 */
class CsrfProtectionTest extends TestCase
{
    use AssertsOpenApiContract;
    use EnforcesCsrf;
    use RefreshDatabase;
    use UsesTheWebApp;

    private string $session;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $signedIn = $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();
        $this->session = $signedIn->getCookie('zamaro_session')->getValue();
        $this->token = $this->xsrfTokenFrom($signedIn);
        $this->enforceCsrf();
    }

    public function test_signing_out_without_the_token_gets_419_and_naomi_stays_signed_in(): void
    {
        $response = $this->signOut(token: null);

        $response->assertStatus(419)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/csrf-token-mismatch')
            ->assertJsonPath('status', 419);
        $this->assertMatchesContract($response);
        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->session)
            ->getJson('/api/v1/me')->assertOk();
    }

    public function test_a_wrong_token_gets_the_same_419(): void
    {
        $this->signOut(token: Str::random(40))->assertStatus(419);

        $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->session)
            ->getJson('/api/v1/me')->assertOk();
    }

    public function test_a_same_origin_request_without_the_token_is_refused_too(): void
    {
        // Laravel 13 lets a request marked `Sec-Fetch-Site: same-origin` through without a token;
        // L2-073.2 asks for the token on every state-changing request (ADR-0018).
        $this->withHeader('Sec-Fetch-Site', 'same-origin')->signOut(token: null)->assertStatus(419);
    }

    public function test_the_token_from_the_xsrf_cookie_lets_the_request_through(): void
    {
        $this->signOut(token: $this->token)->assertNoContent();
    }

    public function test_every_state_changing_api_route_refuses_a_request_without_the_token(): void
    {
        $routes = collect(Router::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => str_starts_with($route->uri(), 'api/v1/'))
            ->flatMap(fn (Route $route) => collect($route->methods())
                ->intersect(['POST', 'PUT', 'PATCH', 'DELETE'])
                ->map(fn (string $method) => [$method, $route->uri()]));
        $this->assertNotEmpty($routes);

        foreach ($routes as [$method, $uri]) {
            $path = '/'.preg_replace('/\{[^}]+\}/', '1', $uri);
            $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->session)
                ->json($method, $path)
                ->assertStatus(419);
        }
    }

    private function signOut(?string $token): TestResponse
    {
        $request = $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
        if ($token !== null) {
            $request->withHeader('X-XSRF-TOKEN', $token);
        }

        return $request->deleteJson('/api/v1/session');
    }
}
