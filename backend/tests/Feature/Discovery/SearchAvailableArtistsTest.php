<?php

namespace Tests\Feature\Discovery;

use App\Contracts\RoutingProvider;
use App\Enums\ArtistStatus;
use App\Enums\OverrideState;
use App\Enums\VscStatus;
use App\Integrations\Routing\CastRoutes;
use App\Integrations\Routing\FakeRoutingProvider;
use App\Models\Artist;
use App\Models\AvailabilityOverride;
use App\Models\VulnerableSectorCheck;
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
            ->assertJsonPath('headliner.name', 'Abigail Mensah')
            ->assertJsonPath('headliner.distance.km', 44)
            ->assertJsonPath('data.*.name', [
                'Marcus Bell Trio',
                'Hosanna Collective',
                'Luz Viva',
                'Elijah Park',
                'Grace Tabernacle Mass Choir',
                'Daniel & Ruth Okonkwo',
            ])
            ->assertJsonPath('data.*.distance.km', [14, 32, 63, 74, 81, 97])
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

    // L2-003: the travel rule.

    public function test_a_40_km_radius_leaves_out_abigail_44_km_away(): void
    {
        $response = $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 40])->assertOk();

        $this->assertSame(['Marcus Bell Trio', 'Hosanna Collective'], $this->lineupNames($response));
    }

    public function test_an_artist_whose_own_limit_is_shorter_than_the_drive_is_left_out(): void
    {
        Artist::where('slug', 'daniel-and-ruth-okonkwo')->update(['max_drive_km' => 60]);

        $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonMissing(['name' => 'Daniel & Ruth Okonkwo']);
    }

    public function test_an_artist_exactly_at_both_limits_is_included(): void
    {
        $this->routing()->override(CastRoutes::anchor('Burlington'), CastRoutes::anchor('Ajax'), 120);

        $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonPath('data.5.name', 'Daniel & Ruth Okonkwo')
            ->assertJsonPath('data.5.distance.km', 120);
    }

    // L2-005: free on the date.

    public function test_a_confirmed_booking_on_the_date_leaves_the_artist_out(): void
    {
        $this->search(['date' => '2026-11-15', 'kind' => 'sunday-service', 'radius' => 120])
            ->assertOk()
            ->assertJsonPath('meta.total', 6)
            ->assertJsonMissing(['name' => 'Abigail Mensah']);
    }

    public function test_a_requested_booking_on_the_date_does_not(): void
    {
        $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Abigail Mensah']);
    }

    public function test_a_date_the_artist_marked_unavailable_leaves_them_out(): void
    {
        $this->search(['date' => '2026-11-26', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonMissing(['name' => 'Abigail Mensah']);
    }

    public function test_a_weekly_day_off_leaves_the_artist_out_unless_that_date_is_marked_free(): void
    {
        $this->search(['date' => '2026-11-16', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonMissing(['name' => 'Abigail Mensah']);

        $abigail = Artist::where('slug', 'abigail-mensah')->firstOrFail();
        AvailabilityOverride::create(['artist_id' => $abigail->id, 'date' => '2026-11-16', 'state' => OverrideState::Free]);

        $this->search(['date' => '2026-11-16', 'kind' => 'worship-night', 'radius' => 120])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Abigail Mensah']);
    }

    public function test_suspended_unpublished_and_payout_pending_artists_are_left_out(): void
    {
        Artist::where('slug', 'marcus-bell-trio')->update(['status' => ArtistStatus::Suspended]);
        Artist::where('slug', 'hosanna-collective')->update(['published_at' => null]);
        Artist::where('slug', 'luz-viva')->update(['payout_ready' => false]);

        $response = $this->search(['date' => '2026-11-14', 'kind' => 'worship-night', 'radius' => 120])->assertOk();

        $this->assertSame(
            ['Abigail Mensah', 'Elijah Park', 'Grace Tabernacle Mass Choir', 'Daniel & Ruth Okonkwo'],
            $this->lineupNames($response),
        );
    }

    public function test_a_youth_event_needs_a_verified_check_still_valid_on_the_event_date(): void
    {
        $elijah = Artist::where('slug', 'elijah-park')->firstOrFail();
        VulnerableSectorCheck::create(['user_id' => $elijah->user_id, 'issued_on' => '2023-11-01', 'expires_on' => '2026-11-01', 'status' => VscStatus::Verified]);
        $grace = Artist::where('slug', 'grace-tabernacle-mass-choir')->firstOrFail();
        VulnerableSectorCheck::create(['user_id' => $grace->user_id, 'issued_on' => '2026-09-30', 'expires_on' => '2029-09-30', 'status' => VscStatus::Pending]);

        $response = $this->search(['date' => '2026-11-14', 'kind' => 'youth-event', 'radius' => 120])->assertOk();

        $this->assertSame(['Abigail Mensah'], $this->lineupNames($response));
    }

    /**
     * Everyone in the lineup in order: the headliner, then the tickets.
     *
     * @return list<string>
     */
    private function lineupNames(TestResponse $response): array
    {
        return array_values(array_filter([$response->json('headliner.name'), ...$response->json('data.*.name')]));
    }

    private function routing(): FakeRoutingProvider
    {
        return $this->app->make(RoutingProvider::class);
    }

    private function search(array $query): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query($query + self::BURLINGTON));
    }
}
