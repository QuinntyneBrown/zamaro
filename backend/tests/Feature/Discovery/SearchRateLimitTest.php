<?php

namespace Tests\Feature\Discovery;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-077.2: more than 30 searches a minute from one address are refused with a 429 problem that
 * says when to try again.
 */
class SearchRateLimitTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    private const SEARCH = '/api/v1/search?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_the_thirty_first_search_in_a_minute_is_refused_with_retry_after(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $this->getJson(self::SEARCH)->assertOk();
        }

        $response = $this->getJson(self::SEARCH);

        $response->assertStatus(429)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/too-many-requests')
            ->assertJsonPath('status', 429);
        $this->assertGreaterThan(0, (int) $response->headers->get('Retry-After'));
        $this->assertMatchesContract($response);
    }

    public function test_searching_resumes_once_the_minute_has_passed(): void
    {
        for ($i = 1; $i <= 31; $i++) {
            $this->getJson(self::SEARCH);
        }

        $this->travel(61)->seconds();

        $this->getJson(self::SEARCH)->assertOk();
    }

    public function test_another_address_has_its_own_allowance(): void
    {
        for ($i = 1; $i <= 31; $i++) {
            $this->getJson(self::SEARCH);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])->getJson(self::SEARCH)->assertOk();
    }
}
