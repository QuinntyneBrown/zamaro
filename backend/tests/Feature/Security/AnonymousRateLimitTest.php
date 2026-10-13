<?php

namespace Tests\Feature\Security;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-077.1: anonymous traffic from one address gets 120 API requests a minute; the next is refused
 * with a 429 problem and `Retry-After`. A signed-in person is counted by account instead, at 300 a
 * minute (M2 D7), wherever they connect from (security/limit-request-rates).
 */
class AnonymousRateLimitTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
    }

    public function test_the_121st_anonymous_request_in_a_minute_is_refused_with_retry_after(): void
    {
        $this->spend(120, fn () => $this->getJson('/api/v1/features'));

        $response = $this->getJson('/api/v1/features');

        $response->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/too-many-requests');
        $this->assertGreaterThan(0, (int) $response->headers->get('Retry-After'));
        $this->assertMatchesContract($response);
    }

    public function test_every_api_route_counts_toward_the_same_allowance(): void
    {
        $this->spend(60, fn () => $this->getJson('/api/v1/features'));
        $this->spend(60, fn () => $this->getJson('/api/v1/i18n/en'));

        $this->getJson('/api/v1/features')->assertStatus(429);
    }

    public function test_another_address_has_its_own_allowance(): void
    {
        $this->spend(120, fn () => $this->getJson('/api/v1/features'));
        $this->getJson('/api/v1/features')->assertStatus(429);

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])->getJson('/api/v1/features')->assertOk();
    }

    public function test_requests_resume_once_the_minute_has_passed(): void
    {
        $this->spend(120, fn () => $this->getJson('/api/v1/features'));
        $this->getJson('/api/v1/features')->assertStatus(429);

        $this->travel(61)->seconds();

        $this->getJson('/api/v1/features')->assertOk();
    }

    public function test_a_signed_in_booker_is_counted_by_account_from_any_address(): void
    {
        $this->seed(CastSeeder::class);
        $session = $this->signIn('naomi.fraser@riversidecc.ca')->getCookie('zamaro_session')->getValue();
        $asNaomi = fn (string $ip) => $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $session)
            ->withServerVariables(['REMOTE_ADDR' => $ip])->getJson('/api/v1/me');

        $this->spend(300, fn () => $asNaomi('127.0.0.1'));

        $asNaomi('198.51.100.20')->assertStatus(429);
    }

    /** @param  callable(): TestResponse  $request */
    private function spend(int $requests, callable $request): void
    {
        for ($i = 1; $i <= $requests; $i++) {
            $request()->assertSuccessful();
        }
    }
}
