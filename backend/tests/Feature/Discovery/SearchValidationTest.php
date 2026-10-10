<?php

namespace Tests\Feature\Discovery;

use App\Integrations\Routing\CastRoutes;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-004.3-4, L2-001.2 and L2-095.2: a search that cannot run returns a 422 problem whose
 * `errors` are keyed by field, with the copy the Discover form shows. Today is Fri 9 Oct 2026.
 */
class SearchValidationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    private const VALID = ['date' => '2026-11-14', 'kind' => 'worship-night', 'lat' => 43.325, 'lng' => -79.799, 'radius' => 120];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_date_less_than_three_days_away_is_refused(): void
    {
        $response = $this->search(['date' => '2026-10-11']);

        $response->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 422)
            ->assertJsonPath('errors', ['date' => ['Pick a date at least 3 days away.']]);
        $this->assertMatchesContract($response);
    }

    public function test_three_days_away_is_the_first_date_allowed(): void
    {
        $this->search(['date' => '2026-10-12'])->assertOk();
    }

    public function test_a_date_more_than_eighteen_months_away_is_refused(): void
    {
        $this->search(['date' => '2028-04-10'])
            ->assertUnprocessable()
            ->assertJsonPath('errors', ['date' => ['We take bookings up to 18 months ahead.']]);
        $this->search(['date' => '2028-04-09'])->assertOk();
    }

    public function test_a_location_outside_the_service_area_is_refused(): void
    {
        $ottawa = CastRoutes::anchor('Ottawa');

        $this->search(['lat' => $ottawa->latitude, 'lng' => $ottawa->longitude])
            ->assertUnprocessable()
            ->assertJsonPath('errors', ['location' => ['Zamaro serves churches within 200 km of Toronto.']]);
    }

    public function test_missing_date_and_location_name_the_fields_to_fill(): void
    {
        $this->getJson('/api/v1/search?'.http_build_query(['kind' => 'worship-night', 'radius' => 120]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.date', ['Pick your event date.'])
            ->assertJsonPath('errors.location', ['Enter your church’s address or town, or pick a city below.']);
    }

    public function test_an_unknown_kind_or_radius_is_refused(): void
    {
        $this->search(['kind' => 'concert', 'radius' => 50])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['kind', 'radius']);
    }

    private function search(array $overrides): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query($overrides + self::VALID));
    }
}
