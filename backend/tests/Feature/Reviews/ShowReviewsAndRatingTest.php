<?php

namespace Tests\Feature\Reviews;

use App\Enums\ArtistStatus;
use App\Enums\BookingStatus;
use App\Jobs\Reviews\RecalculateArtistRating;
use App\Models\Artist;
use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-018, L2-020.2, L2-060 and L2-083.2: the reviews on a profile and the rating above them.
 *
 * - Given Abigail, when her profile loads, then it carries 4.9 from 38 churches and her 4 newest
 *   visible reviews, with her replies, and a cursor to the rest.
 * - Given that cursor, when the reviews are paged, then 10 come at a time, newest first, until all
 *   38 are shown.
 * - Given any review, when it is serialised, then it carries only stars, text, reviewer name,
 *   church, city, month and the reply: no booker ID, email, booking number or event date.
 * - Given Miriam, when her profile loads, then there are no reviews.
 * - Given a hidden review, when reviews are listed and the rating is recalculated, then it is left
 *   out of both.
 * - Given reviews averaging 4.857 from 6 churches, when the rating is recalculated, then it reads
 *   4.9 from 6 churches.
 */
class ShowReviewsAndRatingTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    private const REVIEW_FIELDS = ['id', 'stars', 'text', 'attribution', 'reply'];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_the_profile_carries_the_rating_and_the_four_newest_reviews_with_replies(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonPath('data.rating', 4.9)
            ->assertJsonPath('data.reviewCount', 38)
            ->assertJsonPath('data.reviews.total', 38)
            ->assertJsonCount(4, 'data.reviews.items')
            ->assertJsonPath('data.reviews.items.0.stars', 5)
            ->assertJsonPath('data.reviews.items.0.text', 'She had the whole congregation singing in three-part harmony by the last verse.')
            ->assertJsonPath('data.reviews.items.0.attribution', [
                'reviewerName' => 'Rev. Janet Clarke',
                'churchName' => 'St. Brendan’s Anglican',
                'city' => 'Oshawa',
                'month' => '2026-09',
            ])
            ->assertJsonPath('data.reviews.items.0.reply', null)
            ->assertJsonPath('data.reviews.items.1.attribution.reviewerName', 'Tomi Oduya')
            ->assertJsonPath('data.reviews.items.1.reply', [
                'text' => 'Thank you, Tomi! Your volunteers were ready for everything I threw at them. See you on Sun 1 Nov.',
                'artistName' => 'Abigail Mensah',
                'month' => '2026-10',
            ])
            ->assertJsonPath('data.reviews.items.2.attribution.reviewerName', 'Naomi Fraser')
            ->assertJsonPath('data.reviews.items.2.reply.month', '2026-06')
            ->assertJsonPath('data.reviews.items.3.attribution.reviewerName', 'Pastor Femi Adebayo')
            ->assertJsonPath('data.reviews.items.3.stars', 4)
            ->assertJsonPath('data.reviews.items.3.attribution.month', '2026-05');
        $this->assertNotNull($response->json('data.reviews.nextCursor'));
        $this->assertMatchesContract($response);
    }

    public function test_show_all_pages_through_the_rest_ten_at_a_time_newest_first(): void
    {
        $profile = $this->getJson('/api/v1/artists/abigail-mensah')->json('data.reviews');
        $cursor = $profile['nextCursor'];
        $ids = array_column($profile['items'], 'id');
        $months = array_column(array_column($profile['items'], 'attribution'), 'month');
        $pageSizes = [];

        while ($cursor !== null) {
            $response = $this->getJson('/api/v1/artists/abigail-mensah/reviews?'.http_build_query(['cursor' => $cursor]));
            $response->assertOk()->assertJsonPath('meta.perPage', 10);
            $this->assertMatchesContract($response);
            $page = $response->json('data');
            $pageSizes[] = count($page);
            $ids = [...$ids, ...array_column($page, 'id')];
            $months = [...$months, ...array_column(array_column($page, 'attribution'), 'month')];
            $cursor = $response->json('meta.nextCursor');
        }

        $this->assertSame([10, 10, 10, 4], $pageSizes);
        $this->assertCount(38, array_unique($ids));
        $sorted = $months;
        rsort($sorted);
        $this->assertSame($sorted, $months, 'Newest first.');
    }

    public function test_the_first_page_of_the_reviews_endpoint_starts_with_the_newest(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah/reviews');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.attribution.reviewerName', 'Rev. Janet Clarke');
        $this->assertNotNull($response->json('meta.nextCursor'));
        $this->assertMatchesContract($response);
    }

    public function test_a_review_shows_only_public_fields(): void
    {
        $reviews = [
            ...$this->getJson('/api/v1/artists/abigail-mensah')->json('data.reviews.items'),
            ...$this->getJson('/api/v1/artists/abigail-mensah/reviews')->json('data'),
        ];

        foreach ($reviews as $review) {
            $this->assertEqualsCanonicalizing(self::REVIEW_FIELDS, array_keys($review));
            $this->assertEqualsCanonicalizing(['reviewerName', 'churchName', 'city', 'month'], array_keys($review['attribution']));
        }
        $json = json_encode($reviews);
        $this->assertStringNotContainsString('@', $json);
        $this->assertStringNotContainsString('ZAM-', $json);
        $this->assertStringNotContainsString('booker', $json);
        $this->assertStringNotContainsString('2026-09-13', $json, 'No event dates.');
    }

    public function test_a_new_artist_has_no_reviews(): void
    {
        $this->getJson('/api/v1/artists/miriam-haile')
            ->assertOk()
            ->assertJsonPath('data.reviews', ['total' => 0, 'items' => [], 'nextCursor' => null]);

        $response = $this->getJson('/api/v1/artists/miriam-haile/reviews');
        $response->assertOk()->assertJsonPath('data', [])->assertJsonPath('meta.nextCursor', null);
        $this->assertMatchesContract($response);
    }

    public function test_a_hidden_review_leaves_the_list_and_the_rating(): void
    {
        $abigail = Artist::where('slug', 'abigail-mensah')->firstOrFail();
        Review::whereHas('booking', fn ($query) => $query->where('number', 'ZAM-0089'))->update(['hidden_at' => '2026-10-08 12:00']);

        $this->getJson('/api/v1/artists/abigail-mensah')
            ->assertJsonPath('data.reviews.total', 37)
            ->assertJsonPath('data.reviews.items.0.attribution.reviewerName', 'Tomi Oduya');
        $this->getJson('/api/v1/artists/abigail-mensah/reviews')
            ->assertJsonPath('data.0.attribution.reviewerName', 'Tomi Oduya');

        RecalculateArtistRating::dispatchSync($abigail->id);

        // 180 stars from 37 churches: 4.86 rounds to 4.9.
        $this->getJson('/api/v1/artists/abigail-mensah')
            ->assertJsonPath('data.rating', 4.9)
            ->assertJsonPath('data.reviewCount', 37);
    }

    public function test_the_rating_is_the_mean_to_one_decimal_and_the_count_is_of_distinct_churches(): void
    {
        $miriam = Artist::where('slug', 'miriam-haile')->firstOrFail();
        $churches = ['Grace Chapel', 'Hope Church', 'Bethel Assembly', 'Zion Fellowship', 'Cornerstone Baptist', 'Grace Chapel', 'New Life Church'];
        foreach ([5, 5, 5, 5, 5, 5, 4] as $index => $stars) {
            $this->review($miriam, $stars, $churches[$index], "2026-09-{$this->day($index)} 12:00");
        }
        $this->review($miriam, 1, 'Agincourt Community Church', '2026-09-30 12:00', hidden: true);

        RecalculateArtistRating::dispatchSync($miriam->id);

        // 34 / 7 = 4.857, shown as 4.9; Grace Chapel reviewed twice, so 6 churches.
        $this->getJson('/api/v1/artists/miriam-haile')
            ->assertJsonPath('data.rating', 4.9)
            ->assertJsonPath('data.reviewCount', 6)
            ->assertJsonPath('data.reviews.total', 7);
    }

    public function test_recalculating_the_seeded_cast_keeps_abigails_rating(): void
    {
        RecalculateArtistRating::dispatchSync(Artist::where('slug', 'abigail-mensah')->value('id'));

        $this->getJson('/api/v1/artists/abigail-mensah')
            ->assertJsonPath('data.rating', 4.9)
            ->assertJsonPath('data.reviewCount', 38);
    }

    public function test_an_artist_with_every_review_hidden_has_no_rating(): void
    {
        $abigail = Artist::where('slug', 'abigail-mensah')->firstOrFail();
        Review::where('artist_id', $abigail->id)->update(['hidden_at' => '2026-10-08 12:00']);

        RecalculateArtistRating::dispatchSync($abigail->id);

        $this->getJson('/api/v1/artists/abigail-mensah')
            ->assertJsonPath('data.rating', null)
            ->assertJsonPath('data.reviewCount', 0)
            ->assertJsonPath('data.reviews.total', 0);
    }

    public function test_a_burst_of_recalculations_for_one_artist_queues_one_job(): void
    {
        Queue::fake();
        $id = Artist::where('slug', 'abigail-mensah')->value('id');

        RecalculateArtistRating::dispatch($id);
        RecalculateArtistRating::dispatch($id);

        Queue::assertPushedOn('high', RecalculateArtistRating::class);
        Queue::assertPushed(RecalculateArtistRating::class, 1);
    }

    public function test_reviews_of_a_suspended_or_unknown_artist_are_not_found(): void
    {
        Artist::where('slug', 'abigail-mensah')->update(['status' => ArtistStatus::Suspended]);

        $response = $this->getJson('/api/v1/artists/abigail-mensah/reviews');
        $response->assertNotFound()->assertHeader('Content-Type', 'application/problem+json');
        $this->assertMatchesContract($response);
        $this->getJson('/api/v1/artists/nobody-at-all/reviews')->assertNotFound();
    }

    public function test_a_cursor_that_does_not_decode_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah/reviews?cursor=not-a-cursor');

        $response->assertUnprocessable()->assertJsonPath('errors.cursor.0', 'These reviews have changed. Reload the page.');
        $this->assertMatchesContract($response);
    }

    private function day(int $index): string
    {
        return sprintf('%02d', $index + 1);
    }

    private function review(Artist $artist, int $stars, string $church, string $createdAt, bool $hidden = false): void
    {
        $booker = User::factory()->create();
        $booking = Booking::create([
            'number' => 'ZAM-9'.random_int(100, 999).random_int(10, 99), 'artist_id' => $artist->id, 'status' => BookingStatus::Completed,
            'event_date' => '2026-08-30', 'kind' => 'sunday-service', 'church_name' => $church, 'church_city' => 'Toronto',
        ]);
        Review::create([
            'booking_id' => $booking->id, 'artist_id' => $artist->id, 'booker_id' => $booker->id, 'stars' => $stars,
            'text' => 'A warm and faithful evening of worship.', 'created_at' => $createdAt,
            'hidden_at' => $hidden ? '2026-10-01 09:00' : null,
        ]);
    }
}
