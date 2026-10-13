<?php

namespace Tests\Feature\Security;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route as Router;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-066.1, L2-074.1 (administration/secure-admin-access): every admin API route, with any ID, gives a
 * guest, a booker, an artist and an administrator who has only given their password the same 404 as
 * an address that does not exist, so nothing reveals that the route or the record exists.
 */
class AdminRoutesConcealedTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    private const ABIGAIL = 'abigail@abigailmensah.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_every_admin_route_is_not_found_for_anyone_but_a_fully_signed_in_administrator(): void
    {
        $routes = $this->adminRoutes();
        $this->assertNotEmpty($routes);
        $callers = [
            'a guest' => null,
            'a booker' => $this->signedIn(self::NAOMI),
            'an artist' => $this->signedIn(self::ABIGAIL),
            'an administrator after the password alone' => $this->administratorAfterThePassword(),
        ];
        $unknown = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/__nothing-here');

        foreach ($routes as [$method, $uri]) {
            foreach ($callers as $caller => $session) {
                $response = $this->send($method, $uri, $session);

                $this->assertSame(404, $response->getStatusCode(), "{$method} /{$uri} as {$caller}");
                foreach (['type', 'title', 'detail'] as $field) {
                    $this->assertSame($unknown->json($field), $response->json($field), "{$method} /{$uri} as {$caller}: {$field}");
                }
            }
        }
    }

    private function send(string $method, string $uri, ?string $session): TestResponse
    {
        $request = $this->asANewRequest()->withoutCookies()->fromTheWebApp();
        if ($session !== null) {
            $request = $request->withCookie('zamaro_session', $session);
        }

        return $request->json($method, '/'.$uri, []);
    }

    /** @return list<array{string, string}> method and URI, with every parameter set to an ID that may or may not exist */
    private function adminRoutes(): array
    {
        return collect(Router::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => str_starts_with((string) $route->getName(), 'admin.'))
            ->flatMap(fn (Route $route) => collect($route->methods())
                ->reject(fn (string $method) => $method === 'HEAD')
                ->map(fn (string $method) => [$method, preg_replace('/\{[^}]+\}/', '1', $route->uri())]))
            ->values()
            ->all();
    }

    private function signedIn(string $email): string
    {
        return $this->asANewRequest()->withoutCookies()->signIn($email)->assertOk()->getCookie('zamaro_session')->getValue();
    }

    /** An administrator with two-step sign-in on, who has given the right password but no code yet. */
    private function administratorAfterThePassword(): string
    {
        $email = 'priya-'.uniqid().'@zamaro.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();
        $this->artisan('zamaro:admin:grant', ['email' => $email])->assertSuccessful();
        $session = $this->signedIn($email);
        $as = fn () => $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session);
        $key = str_replace(' ', '', $as()->postJson('/api/v1/account/two-factor')->json('data.key'));
        $as()->postJson('/api/v1/account/two-factor/confirm', ['code' => (new Google2FA)->getCurrentOtp($key)])->assertOk();
        $as()->deleteJson('/api/v1/session')->assertNoContent();

        return $this->asANewRequest()->withoutCookies()->signIn($email)->assertStatus(202)->getCookie('zamaro_session')->getValue();
    }
}
