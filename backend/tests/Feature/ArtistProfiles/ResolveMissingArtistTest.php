<?php

namespace Tests\Feature\ArtistProfiles;

use App\Models\Artist;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * L2-021 (and L2-055.3): an address that leads to no viewable artist is one 404 problem with up to
 * 3 similar artists free on the carried date, whether the slug never existed or the artist is hidden;
 * a retired slug answers 301 to the current one. Today is Fri 9 Oct 2026. The cast seeds Selah Brooks,
 * a suspended solo vocalist, and Abigail's retired address `abigail-sings`.
 */
class ResolveMissingArtistTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    /** Naomi's search, carried from Discover: Burlington, Sat 14 Nov, worship night, 120 km. */
    private const BURLINGTON = '?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_slug_that_never_existed_suggests_the_nearest_artists_free_on_the_carried_date(): void
    {
        $response = $this->getJson('/api/v1/artists/nobody-at-all'.self::BURLINGTON);

        // Any style: the three nearest of the seven free that night (Hamilton 14, Mississauga 32, Brampton 44).
        $response->assertNotFound()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('title', 'This artist isn’t on Zamaro')
            ->assertJsonPath('status', 404)
            ->assertJsonPath('similarArtists.date', '2026-11-14')
            ->assertJsonPath('similarArtists.radiusKm', 120)
            ->assertJsonPath('similarArtists.items.*.slug', ['marcus-bell-trio', 'hosanna-collective', 'abigail-mensah'])
            ->assertJsonPath('similarArtists.items.2.distance.km', 44);
        $this->assertStringEndsWith('/artist-not-found', $response->json('type'));
        $this->assertMatchesContract($response);
    }

    public function test_a_suspended_artist_gets_the_same_problem_with_free_artists_of_their_primary_style(): void
    {
        $response = $this->getJson('/api/v1/artists/selah-brooks'.self::BURLINGTON);

        // Solo vocalists, nearest first; Miriam drives only 40 km and Burlington is 48 away.
        $response->assertNotFound()
            ->assertJsonPath('title', 'This artist isn’t on Zamaro')
            ->assertJsonPath('similarArtists.items.*.slug', ['abigail-mensah', 'elijah-park'])
            ->assertJsonPath('similarArtists.items.0.distance.km', 44)
            ->assertJsonPath('similarArtists.items.1.distance.km', 74);
        $this->assertSame(
            array_keys($this->getJson('/api/v1/artists/nobody-at-all'.self::BURLINGTON)->json()),
            array_keys($response->json()),
        );
        $this->assertMatchesContract($response);
    }

    public function test_a_hidden_artist_reveals_nothing_of_their_profile(): void
    {
        $body = $this->getJson('/api/v1/artists/selah-brooks'.self::BURLINGTON)->getContent();

        $this->assertStringNotContainsStringIgnoringCase('selah', $body);
        $this->assertStringNotContainsString('Brooks', $body);
        $this->assertStringNotContainsString('ACT-0044', $body);
    }

    public function test_an_unpublished_artist_is_missing_like_any_other(): void
    {
        Artist::where('slug', 'elijah-park')->update(['published_at' => null]);

        $this->getJson('/api/v1/artists/elijah-park'.self::BURLINGTON)
            ->assertNotFound()
            ->assertJsonPath('title', 'This artist isn’t on Zamaro')
            ->assertJsonPath('similarArtists.items.*.slug', ['abigail-mensah']);
    }

    public function test_without_a_carried_location_the_suggestions_are_measured_from_toronto(): void
    {
        $response = $this->getJson('/api/v1/artists/selah-brooks?date=2026-11-14');

        // From City Hall within 120 km: Etobicoke, then Markham, then Brampton.
        $response->assertNotFound()
            ->assertJsonPath('similarArtists.date', '2026-11-14')
            ->assertJsonPath('similarArtists.radiusKm', 120)
            ->assertJsonPath('similarArtists.items.*.slug', ['miriam-haile', 'elijah-park', 'abigail-mensah']);
    }

    public function test_without_a_usable_date_the_suggestions_are_free_on_the_first_bookable_day(): void
    {
        // Mon 12 Oct is three days away; Abigail never works Mondays.
        foreach (['', '?date=2026-10-10', '?date=2028-10-10'] as $query) {
            $this->getJson('/api/v1/artists/selah-brooks'.$query)
                ->assertNotFound()
                ->assertJsonPath('similarArtists.date', '2026-10-12')
                ->assertJsonPath('similarArtists.items.0.slug', 'miriam-haile')
                ->assertJsonPath('similarArtists.items.1.slug', 'elijah-park');
        }
    }

    public function test_a_retired_slug_answers_301_to_the_current_one_and_keeps_the_query_string(): void
    {
        $response = $this->get('/api/v1/artists/abigail-sings?date=2026-11-14');

        $response->assertStatus(301)->assertHeader('Location', '/api/v1/artists/abigail-mensah?date=2026-11-14');
    }

    public function test_the_profile_s_other_addresses_follow_a_retired_slug_too(): void
    {
        $this->get('/api/v1/artists/abigail-sings/tour-dates?from=2026-11-14')
            ->assertStatus(301)
            ->assertHeader('Location', '/api/v1/artists/abigail-mensah/tour-dates?from=2026-11-14');
        $this->get('/api/v1/artists/abigail-sings/availability?date=2026-11-14')
            ->assertStatus(301)
            ->assertHeader('Location', '/api/v1/artists/abigail-mensah/availability?date=2026-11-14');
        $this->get('/api/v1/artists/abigail-sings/reviews')
            ->assertStatus(301)
            ->assertHeader('Location', '/api/v1/artists/abigail-mensah/reviews');
    }

    public function test_a_retired_slug_of_a_hidden_artist_is_missing_not_moved(): void
    {
        Artist::where('slug', 'abigail-mensah')->update(['payout_ready' => false]);

        $response = $this->getJson('/api/v1/artists/abigail-sings'.self::BURLINGTON);

        $response->assertNotFound()->assertJsonPath('similarArtists.items.*.slug', ['elijah-park']);
        $this->assertStringNotContainsString('abigail', $response->getContent());
    }

    public function test_the_profile_s_other_addresses_are_missing_for_a_hidden_artist(): void
    {
        $response = $this->getJson('/api/v1/artists/selah-brooks/tour-dates');

        $response->assertNotFound()->assertJsonPath('title', 'This artist isn’t on Zamaro');
        $this->assertMatchesContract($response);
    }

    public function test_a_found_profile_ignores_the_carried_search(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah'.self::BURLINGTON);

        $response->assertOk()->assertJsonPath('data.slug', 'abigail-mensah');
        $this->assertMatchesContract($response);
    }
}
