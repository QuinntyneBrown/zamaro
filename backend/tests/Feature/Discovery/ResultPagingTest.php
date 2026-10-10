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
 * L2-010 and L2-095.1: results come 24 cards at a time, the headliner included, with a cursor for
 * the rest. The supporting cast around Barrie has 30 artists free on Sat 14 Nov within 40 km.
 */
class ResultPagingTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_the_first_page_holds_24_cards_and_a_cursor_for_the_rest(): void
    {
        $response = $this->searchBarrie();

        $response->assertOk()
            ->assertJsonPath('meta.total', 30)
            ->assertJsonPath('meta.perPage', 24)
            ->assertJsonCount(23, 'data');
        $this->assertNotNull($response->json('headliner'));
        $this->assertNotNull($response->json('meta.nextCursor'));
        $this->assertMatchesContract($response);
    }

    public function test_the_next_page_holds_the_remaining_six_tickets_and_no_headliner(): void
    {
        $first = $this->searchBarrie();

        $next = $this->searchBarrie(['cursor' => $first->json('meta.nextCursor')]);

        $next->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('headliner', null)
            ->assertJsonPath('meta.nextCursor', null);
        $this->assertSame([], array_intersect($first->json('data.*.slug'), $next->json('data.*.slug')));
        $this->assertNotContains($first->json('headliner.slug'), $next->json('data.*.slug'));
    }

    public function test_paging_is_stable_under_every_sort(): void
    {
        foreach (['closest', 'rating', 'price'] as $sort) {
            $first = $this->searchBarrie(['sort' => $sort]);
            $next = $this->searchBarrie(['sort' => $sort, 'cursor' => $first->json('meta.nextCursor')]);
            $tickets = [...$first->json('data'), ...$next->json('data')];

            $this->assertCount(29, array_unique(array_column($tickets, 'slug')), "{$sort}: every ticket once");
            for ($i = 1; $i < count($tickets); $i++) {
                $this->assertLessThanOrEqual(
                    0,
                    $this->sortKey($tickets[$i - 1], $sort) <=> $this->sortKey($tickets[$i], $sort),
                    "{$sort}: {$tickets[$i - 1]['slug']} should not follow {$tickets[$i]['slug']}",
                );
            }
        }
    }

    public function test_24_or_fewer_results_have_no_next_page(): void
    {
        $this->getJson('/api/v1/search?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120')
            ->assertOk()
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('meta.nextCursor', null);
    }

    public function test_a_cursor_that_does_not_decode_or_belongs_to_another_sort_is_refused(): void
    {
        $this->searchBarrie(['cursor' => 'not-a-cursor'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cursor']);

        $priceCursor = $this->searchBarrie(['sort' => 'price'])->json('meta.nextCursor');
        $this->searchBarrie(['sort' => 'rating', 'cursor' => $priceCursor])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cursor']);
    }

    /** L2-007's order for a card, from the fields the response carries (the id tie-break aside). */
    private function sortKey(array $card, string $sort): array
    {
        return match ($sort) {
            'closest' => [$card['distance']['km'], -($card['rating'] ?? 0)],
            'rating' => [$card['rating'] === null ? 1 : 0, -($card['rating'] ?? 0), -$card['reviewCount'], $card['distance']['km']],
            'price' => [$card['fromPrice']['cents'], $card['distance']['km']],
        };
    }

    private function searchBarrie(array $overrides = []): TestResponse
    {
        $barrie = CastRoutes::anchor('Barrie');

        return $this->getJson('/api/v1/search?'.http_build_query(array_filter($overrides + [
            'date' => '2026-11-14', 'kind' => 'worship-night', 'lat' => $barrie->latitude, 'lng' => $barrie->longitude, 'radius' => 40,
        ], fn ($value) => $value !== null)));
    }
}
