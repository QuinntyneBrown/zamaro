<?php

namespace Tests\Feature\Discovery;

use App\Enums\OverrideState;
use App\Models\Artist;
use App\Models\AvailabilityOverride;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-011.2-4: when nobody is free, up to three nearby dates with their counts (closest first,
 * within 7 days either side), the smallest wider radius with matches, and whether filters apply.
 * Christmas Eve near Burlington, gospel choirs, 40 km (docs/mocks/pages/discover/empty.html).
 */
class SearchAlternativesTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    private const CHRISTMAS_EVE = [
        'date' => '2026-12-24', 'kind' => 'worship-night', 'lat' => 43.325, 'lng' => -79.799,
        'radius' => 40, 'styles' => 'gospel-choir',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_christmas_eve_offers_nearby_dates_closest_first_and_a_wider_radius(): void
    {
        $this->getJson('/api/v1/search?'.http_build_query(self::CHRISTMAS_EVE))->assertJsonPath('meta.total', 0);

        $response = $this->alternatives();

        $response->assertOk()->assertExactJson(['data' => [
            'nearbyDates' => [
                ['date' => '2026-12-23', 'count' => 1],
                ['date' => '2026-12-27', 'count' => 3],
                ['date' => '2026-12-20', 'count' => 2],
            ],
            'widerRadius' => ['km' => 120, 'count' => 2],
            'filtersApplied' => true,
        ]]);
        $this->assertMatchesContract($response);
    }

    public function test_two_dates_equally_far_away_list_the_earlier_first(): void
    {
        $halton = Artist::where('slug', 'halton-praise-choir')->firstOrFail();
        AvailabilityOverride::updateOrCreate(['artist_id' => $halton->id, 'date' => '2026-12-28'], ['state' => OverrideState::Free]);

        $this->alternatives()->assertJsonPath('data.nearbyDates.*.date', ['2026-12-23', '2026-12-27', '2026-12-20']);
    }

    public function test_without_filters_it_says_so(): void
    {
        $this->alternatives(['styles' => null])->assertJsonPath('data.filtersApplied', false);
    }

    public function test_dates_outside_the_bookable_window_are_skipped(): void
    {
        $dates = $this->alternatives(['date' => '2026-10-13', 'styles' => null])->json('data.nearbyDates.*.date');

        $this->assertNotEmpty($dates);
        foreach ($dates as $date) {
            $this->assertGreaterThanOrEqual('2026-10-12', $date);
        }
    }

    public function test_the_widest_radius_has_no_wider_option(): void
    {
        $this->alternatives(['radius' => 200])->assertJsonPath('data.widerRadius', null);
    }

    private function alternatives(array $overrides = []): TestResponse
    {
        return $this->getJson('/api/v1/search/alternatives?'.http_build_query(array_filter(
            $overrides + self::CHRISTMAS_EVE,
            fn ($value) => $value !== null,
        )));
    }
}
