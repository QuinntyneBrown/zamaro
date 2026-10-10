<?php

namespace Tests\Feature\Discovery;

use App\Contracts\RoutingProvider;
use App\Contracts\RoutingUnavailable;
use App\Integrations\Routing\FakeRoutingProvider;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * L2-002.2-3: road distances are cached for 30 days; when routing is unavailable the search still
 * runs on straight-line distance x 1.3, marked approximate, and that estimate is not cached.
 */
class DistanceCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_repeated_search_reuses_the_cached_distances(): void
    {
        $this->search()->assertOk();
        $callsAfterFirstSearch = $this->routing()->calls();

        $this->search()->assertOk()->assertJsonPath('data.2.distance.km', 44);

        $this->assertGreaterThan(0, $callsAfterFirstSearch);
        $this->assertSame($callsAfterFirstSearch, $this->routing()->calls());
    }

    public function test_cached_distances_expire_after_thirty_days(): void
    {
        $this->search()->assertOk();
        $calls = $this->routing()->calls();

        $this->travel(31)->days();
        $this->search()->assertOk();

        $this->assertGreaterThan($calls, $this->routing()->calls());
    }

    public function test_when_routing_fails_the_search_uses_approximate_straight_line_distances(): void
    {
        Log::spy();
        $this->routing()->failWith(new RoutingUnavailable('Timed out after 2 s'));

        $this->search()
            ->assertOk()
            ->assertJsonPath('data.*.name', [
                'Marcus Bell Trio',
                'Hosanna Collective',
                'Abigail Mensah',
                'Luz Viva',
                'Grace Tabernacle Mass Choir',
                'Elijah Park',
                'Daniel & Ruth Okonkwo',
            ])
            ->assertJsonPath('data.*.distance.km', [13, 41, 59, 75, 88, 91, 111])
            ->assertJsonPath('data.*.distance.approximate', array_fill(0, 7, true));
        Log::shouldHaveReceived('warning')->withArgs(fn (string $message) => $message === 'routing.unavailable');
    }

    public function test_approximate_distances_are_not_cached(): void
    {
        $this->routing()->failWith(new RoutingUnavailable('Timed out after 2 s'));
        $this->search()->assertOk();

        $this->routing()->recover();
        $this->search()
            ->assertOk()
            ->assertJsonPath('data.2.name', 'Abigail Mensah')
            ->assertJsonPath('data.2.distance', ['km' => 44, 'driveMinutes' => 35, 'approximate' => false]);
    }

    private function routing(): FakeRoutingProvider
    {
        return $this->app->make(RoutingProvider::class);
    }

    private function search(): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query([
            'date' => '2026-11-14', 'kind' => 'worship-night', 'lat' => 43.325, 'lng' => -79.799, 'radius' => 120,
        ]));
    }
}
