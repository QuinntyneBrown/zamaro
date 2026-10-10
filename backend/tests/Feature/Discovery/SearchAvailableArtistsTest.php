<?php

namespace Tests\Feature\Discovery;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-002.1, L2-003, L2-005: who is free on a date and within driving range.
 * The cast is the one in docs/mocks/README.md; today is Fri 9 Oct 2026.
 */
class SearchAvailableArtistsTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    /** Burlington, as the Discover quick-pick chip sends it. */
    private const BURLINGTON = ['lat' => 43.325, 'lng' => -79.799];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_worship_night_in_burlington_lists_the_seven_free_artists_closest_first(): void
    {
        $response = $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 120]);

        $response->assertOk()
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('data.*.name', [
                'Marcus Bell Trio',
                'Hosanna Collective',
                'Abigail Mensah',
                'Luz Viva',
                'Elijah Park',
                'Grace Tabernacle Mass Choir',
                'Daniel & Ruth Okonkwo',
            ])
            ->assertJsonPath('data.*.distance.km', [14, 32, 44, 63, 74, 81, 97])
            ->assertJsonPath('data.0', [
                'slug' => 'marcus-bell-trio',
                'name' => 'Marcus Bell Trio',
                'actType' => 'band',
                'styles' => ['band', 'acoustic', 'hymns'],
                'city' => 'Hamilton',
                'distance' => ['km' => 14, 'driveMinutes' => 10, 'approximate' => false],
                'rating' => 4.6,
                'reviewCount' => 17,
                'fromPrice' => ['cents' => 95000, 'currency' => 'CAD'],
            ]);
        $this->assertMatchesContract($response);
    }

    private function search(array $query): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query($query + self::BURLINGTON));
    }
}
