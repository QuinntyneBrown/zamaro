<?php

namespace Tests\Feature\Discovery;

use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-004.6: a typed town or a quick-pick city resolves to its centre point. The Discover form
 * sends the coordinates with the search; the label is what the location field shows.
 */
class PlaceLookupTest extends TestCase
{
    use AssertsOpenApiContract;

    public function test_a_town_resolves_to_its_centre_point(): void
    {
        $response = $this->getJson('/api/v1/places?q=burlington');

        $response->assertOk()
            ->assertExactJson(['data' => ['label' => 'Burlington, ON', 'city' => 'Burlington', 'lat' => 43.325, 'lng' => -79.799]]);
        $this->assertMatchesContract($response);
    }

    public function test_every_quick_pick_city_resolves(): void
    {
        foreach (['Toronto', 'Burlington', 'Mississauga', 'Brampton', 'Hamilton', 'Markham', 'Ajax', 'Oshawa', 'Barrie', 'Kitchener', 'Niagara'] as $city) {
            $this->getJson('/api/v1/places?q='.urlencode($city))->assertOk()->assertJsonPath('data.city', $city);
        }
    }

    public function test_the_province_suffix_the_field_shows_is_accepted(): void
    {
        $this->getJson('/api/v1/places?q='.urlencode('Burlington, ON'))->assertOk()->assertJsonPath('data.city', 'Burlington');
    }

    public function test_an_unknown_place_is_a_404_problem(): void
    {
        $response = $this->getJson('/api/v1/places?q=Atlantis');

        $response->assertNotFound()->assertHeader('Content-Type', 'application/problem+json');
        $this->assertMatchesContract($response);
    }

    public function test_an_empty_query_is_refused(): void
    {
        $this->getJson('/api/v1/places?q=')
            ->assertUnprocessable()
            ->assertJsonPath('errors.q', ['Enter your church’s address or town, or pick a city below.']);
    }
}
