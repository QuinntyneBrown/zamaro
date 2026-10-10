<?php

namespace Tests\Feature\Discovery;

use App\Enums\ArtistStatus;
use App\Enums\BookingStatus;
use App\Models\Artist;
use App\Models\ArtistRating;
use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-006.2, .5-.7: the most-booked artist this season leads the lineup as the headliner, with the
 * most recent visible 5-star quote; the tickets follow from "No. 02". Today is Fri 9 Oct 2026
 * (autumn).
 */
class HeadlinerTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_abigail_most_booked_this_autumn_is_the_headliner_and_the_tickets_follow_closest_first(): void
    {
        $response = $this->search();

        $response->assertOk()
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('headliner.slug', 'abigail-mensah')
            ->assertJsonPath('headliner.season', 'autumn')
            ->assertJsonPath('headliner.distance.km', 44)
            ->assertJsonPath('headliner.quote', [
                'text' => 'She had the whole congregation singing in three-part harmony by the last verse.',
                'reviewerName' => 'Rev. Janet Clarke',
                'city' => 'Oshawa',
            ])
            ->assertJsonPath('data.*.name', [
                'Marcus Bell Trio',
                'Hosanna Collective',
                'Luz Viva',
                'Elijah Park',
                'Grace Tabernacle Mass Choir',
                'Daniel & Ruth Okonkwo',
            ]);
        $this->assertMatchesContract($response);
    }

    public function test_bookings_confirmed_before_the_season_began_do_not_count(): void
    {
        DB::table('booking_transitions')
            ->whereIn('booking_id', $this->bookingIds('abigail-mensah'))
            ->update(['occurred_at' => '2026-08-20 12:00:00']);

        $this->search()->assertJsonPath('headliner.slug', 'marcus-bell-trio');
    }

    public function test_bookings_cancelled_later_do_not_count(): void
    {
        Booking::whereIn('id', $this->bookingIds('abigail-mensah'))->update(['status' => BookingStatus::Cancelled]);

        $this->search()->assertJsonPath('headliner.slug', 'marcus-bell-trio');
    }

    public function test_a_tie_goes_to_the_higher_rating_then_the_shorter_distance(): void
    {
        Booking::whereIn('id', $this->bookingIds('abigail-mensah'))->update(['status' => BookingStatus::Cancelled]);
        $hosanna = Artist::where('slug', 'hosanna-collective')->firstOrFail();
        $this->confirmThisSeason($hosanna, 'ZAM-0301');

        // Marcus 4.6 and Hosanna 4.8 each have one booking this autumn: the rating decides.
        $this->search()->assertJsonPath('headliner.slug', 'hosanna-collective');

        // Equal ratings: Marcus is closer (14 km against 32 km).
        ArtistRating::where('artist_id', $hosanna->id)->update(['rating' => 4.6]);
        $this->search()->assertJsonPath('headliner.slug', 'marcus-bell-trio');
    }

    public function test_a_single_result_is_the_headliner_with_no_tickets(): void
    {
        Artist::where('slug', 'hosanna-collective')->update(['status' => ArtistStatus::Suspended]);

        $this->search(['radius' => 40])
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('headliner.slug', 'marcus-bell-trio')
            ->assertJsonPath('headliner.quote', null)
            ->assertJsonPath('data', []);
    }

    public function test_the_quote_is_the_newest_visible_five_star_review_cut_at_a_word_boundary(): void
    {
        $abigail = Artist::where('slug', 'abigail-mensah')->firstOrFail();
        $this->review($abigail, 'Hidden praise.', createdAt: '2026-10-05 09:00', hidden: true);
        $long = 'From the first note she held the room, and by the closing hymn even the ushers were singing along '
            .'with her, which nobody at our church can remember happening before in all our years together.';
        $this->review($abigail, $long, createdAt: '2026-10-02 09:00');

        $quote = $this->search()->json('headliner.quote.text');

        $this->assertLessThanOrEqual(161, mb_strlen($quote));
        $this->assertStringEndsWith('…', $quote);
        $this->assertStringStartsWith(mb_substr($quote, 0, -1), $long);
        $this->assertSame(' ', mb_substr($long, mb_strlen($quote) - 1, 1), 'The cut falls between words.');
    }

    private function search(array $overrides = []): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query($overrides + [
            'date' => '2026-11-14', 'kind' => 'worship-night', 'lat' => 43.325, 'lng' => -79.799, 'radius' => 120,
        ]));
    }

    /** @return list<int> */
    private function bookingIds(string $slug): array
    {
        return Booking::whereHas('artist', fn ($query) => $query->where('slug', $slug))->pluck('id')->all();
    }

    private function confirmThisSeason(Artist $artist, string $number): void
    {
        $booking = Booking::create([
            'number' => $number, 'artist_id' => $artist->id, 'status' => BookingStatus::Confirmed,
            'event_date' => '2026-12-06', 'kind' => 'sunday-service', 'church_name' => 'Harvest Point', 'church_city' => 'Milton',
        ]);
        DB::table('booking_transitions')->insert([
            'booking_id' => $booking->id, 'from_status' => BookingStatus::Accepted->value,
            'to_status' => BookingStatus::Confirmed->value, 'actor_kind' => 'booker', 'occurred_at' => '2026-09-30 12:00:00',
        ]);
    }

    private function review(Artist $artist, string $text, string $createdAt, bool $hidden = false): void
    {
        $booker = User::factory()->create(['name' => 'Grace Ampofo']);
        $booking = Booking::create([
            'number' => 'ZAM-'.random_int(5000, 9999), 'artist_id' => $artist->id, 'status' => BookingStatus::Completed,
            'event_date' => '2026-09-27', 'kind' => 'sunday-service', 'church_name' => 'Kingdom Life Centre', 'church_city' => 'Mississauga',
        ]);
        Review::create([
            'booking_id' => $booking->id, 'artist_id' => $artist->id, 'booker_id' => $booker->id, 'stars' => 5,
            'text' => $text, 'created_at' => $createdAt, 'hidden_at' => $hidden ? '2026-10-06 09:00' : null,
        ]);
    }
}
