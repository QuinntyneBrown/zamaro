<?php

namespace Tests\Feature\ArtistProfiles;

use App\Enums\ArtistStatus;
use App\Models\Artist;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-017 and L2-019: the "On tour" list and the booking stub's date check, with the cancellation
 * window a booking on that date would have (L2-044). Today is Fri 9 Oct 2026.
 */
class PickADateTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_abigails_next_six_dates_from_the_search_date_skip_her_monday_off(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14');

        // Sat 14 Nov has only a Requested booking, so it stays free; Mon 16 Nov is her weekly day off.
        $response->assertOk()->assertExactJson(['data' => [
            ['date' => '2026-11-14', 'status' => 'free', 'kind' => null, 'city' => null],
            ['date' => '2026-11-15', 'status' => 'booked', 'kind' => 'sunday-service', 'city' => 'Oakville'],
            ['date' => '2026-11-17', 'status' => 'free', 'kind' => null, 'city' => null],
            ['date' => '2026-11-18', 'status' => 'free', 'kind' => null, 'city' => null],
            ['date' => '2026-11-19', 'status' => 'free', 'kind' => null, 'city' => null],
            ['date' => '2026-11-20', 'status' => 'free', 'kind' => null, 'city' => null],
        ]]);
        $this->assertStringContainsString('public', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_a_booked_date_never_names_the_church_or_its_booking(): void
    {
        $body = $this->getJson('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14')->getContent();

        $this->assertStringNotContainsString('Lakeshore', $body);
        $this->assertStringNotContainsString('ZAM-', $body);
    }

    public function test_dates_the_artist_marked_unavailable_are_left_out(): void
    {
        // Thu 26 and Fri 27 Nov are blocked, Mon 30 Nov is her day off.
        $dates = $this->getJson('/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-24')->json('data.*.date');

        $this->assertSame(['2026-11-24', '2026-11-25', '2026-11-28', '2026-11-29', '2026-12-01', '2026-12-02'], $dates);
    }

    public function test_without_a_search_date_the_list_starts_three_days_from_today(): void
    {
        $response = $this->getJson('/api/v1/artists/miriam-haile/tour-dates');

        $response->assertOk();
        $this->assertSame(
            ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'],
            $response->json('data.*.date'),
        );
        $this->assertSame(['free'], array_values(array_unique($response->json('data.*.status'))));
        $this->assertMatchesContract($response);
    }

    public function test_a_search_date_sooner_than_three_days_away_starts_the_list_at_three_days(): void
    {
        $dates = $this->getJson('/api/v1/artists/miriam-haile/tour-dates?from=2026-10-10')->json('data.*.date');

        $this->assertSame('2026-10-12', $dates[0]);
    }

    public function test_a_from_date_that_is_not_a_date_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/artists/miriam-haile/tour-dates?from=next-week');

        $response->assertUnprocessable()->assertJsonValidationErrors(['from']);
        $this->assertMatchesContract($response);
    }

    public function test_the_date_check_says_abigail_is_booked_on_sun_15_nov(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah/availability?date=2026-11-15');

        $response->assertOk()
            ->assertJsonPath('data.date', '2026-11-15')
            ->assertJsonPath('data.free', false);
        $this->assertMatchesContract($response);
    }

    public function test_the_date_check_says_abigail_is_free_on_sat_14_nov_and_until_when_it_cancels_free(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah/availability?date=2026-11-14');

        $response->assertOk()->assertExactJson(['data' => [
            'date' => '2026-11-14',
            'free' => true,
            'freeCancellationUntil' => '2026-10-31',
        ]]);
        $this->assertMatchesContract($response);
    }

    public function test_a_weekly_day_off_is_not_free(): void
    {
        $this->getJson('/api/v1/artists/abigail-mensah/availability?date=2026-11-16')
            ->assertOk()
            ->assertJsonPath('data.free', false);
    }

    public function test_the_date_check_takes_dates_from_three_days_to_eighteen_months_ahead(): void
    {
        $soon = $this->getJson('/api/v1/artists/abigail-mensah/availability?date=2026-10-10');
        $soon->assertUnprocessable()->assertJsonPath('errors.date.0', 'Pick a date at least 3 days away.');
        $this->assertMatchesContract($soon);

        $this->getJson('/api/v1/artists/abigail-mensah/availability?date=2028-05-01')
            ->assertUnprocessable()
            ->assertJsonPath('errors.date.0', 'We take bookings up to 18 months ahead.');
        $this->getJson('/api/v1/artists/abigail-mensah/availability')
            ->assertUnprocessable()
            ->assertJsonPath('errors.date.0', 'Pick your event date.');
    }

    public function test_a_suspended_or_unknown_artist_has_no_dates(): void
    {
        Artist::where('slug', 'miriam-haile')->update(['status' => ArtistStatus::Suspended]);

        $this->getJson('/api/v1/artists/miriam-haile/tour-dates')->assertNotFound();
        $this->getJson('/api/v1/artists/miriam-haile/availability?date=2026-11-14')->assertNotFound();
        $response = $this->getJson('/api/v1/artists/nobody/tour-dates');
        $response->assertNotFound();
        $this->assertMatchesContract($response);
    }

    public function test_miriam_has_the_ticket_number_the_mocks_show(): void
    {
        $this->getJson('/api/v1/artists/miriam-haile')->assertJsonPath('data.ticketNumber', 'ACT-0154');
    }
}
