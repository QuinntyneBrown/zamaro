<?php

namespace Tests\Feature\Discovery;

use App\Models\Artist;
use App\Models\ArtistRating;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-007 (sort the tickets; the headliner stays first) and L2-008 (style chips OR together, the
 * price chip ANDs). The API is strict: unknown values are refused, only the frontend substitutes
 * defaults.
 */
class SortAndFilterResultsTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_price_low_to_high_keeps_the_headliner_and_orders_the_tickets_by_from_price(): void
    {
        $response = $this->search(['sort' => 'price']);

        $response->assertOk()
            ->assertJsonPath('headliner.name', 'Abigail Mensah')
            ->assertJsonPath('data.*.name', [
                'Elijah Park',
                'Daniel & Ruth Okonkwo',
                'Luz Viva',
                'Marcus Bell Trio',
                'Hosanna Collective',
                'Grace Tabernacle Mass Choir',
            ])
            ->assertJsonPath('meta.sort', 'price');
        $this->assertMatchesContract($response);
    }

    public function test_highest_rated_breaks_ties_by_review_count_and_puts_unreviewed_artists_last(): void
    {
        ArtistRating::where('artist_id', Artist::where('slug', 'luz-viva')->value('id'))
            ->update(['rating' => null, 'review_count' => 0]);

        $this->search(['sort' => 'rating'])
            ->assertOk()
            ->assertJsonPath('data.*.name', [
                'Daniel & Ruth Okonkwo',
                'Grace Tabernacle Mass Choir',
                'Hosanna Collective',
                'Elijah Park',
                'Marcus Bell Trio',
                'Luz Viva',
            ]);
    }

    public function test_style_chips_match_any_selected_style(): void
    {
        $response = $this->search(['styles' => 'band,gospel-choir']);

        $response->assertOk()
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.styles', ['band', 'gospel-choir'])
            ->assertJsonPath('headliner.name', 'Marcus Bell Trio')
            ->assertJsonPath('data.*.name', ['Hosanna Collective', 'Luz Viva', 'Grace Tabernacle Mass Choir']);
    }

    public function test_under_800_applies_on_top_of_the_styles(): void
    {
        $this->search(['styles' => 'hymns', 'price' => 'under-800'])
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.price', 'under-800')
            ->assertJsonPath('headliner.name', 'Abigail Mensah')
            ->assertJsonPath('data.*.name', ['Daniel & Ruth Okonkwo']);
    }

    public function test_unknown_sort_styles_or_price_are_refused(): void
    {
        $this->search(['sort' => 'cheapest', 'styles' => 'band,polka', 'price' => 'under-500'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort', 'styles', 'price']);
    }

    private function search(array $overrides): TestResponse
    {
        return $this->getJson('/api/v1/search?'.http_build_query($overrides + [
            'date' => '2026-11-14', 'kind' => 'worship-night', 'lat' => 43.325, 'lng' => -79.799, 'radius' => 120,
        ]));
    }
}
