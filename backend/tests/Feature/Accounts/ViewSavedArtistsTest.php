<?php

namespace Tests\Feature\Accounts;

use App\Enums\ArtistStatus;
use App\Models\Artist;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-027 (accounts/view-saved-artists): a booker's saved artists, newest save first, each free or
 * booked on the date asked for. Artists no longer visible are left out and not counted.
 */
class ViewSavedArtistsTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_naomi_sees_her_saved_artists_newest_first_free_on_her_date(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->getJson('/api/v1/saved-artists?date=2026-11-14');

        $response->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.date', '2026-11-14')
            ->assertJsonPath('data.artists.*.slug', ['abigail-mensah', 'hosanna-collective', 'luz-viva'])
            ->assertJsonPath('data.artists.*.availability', ['free', 'free', 'free'])
            ->assertJsonPath('data.artists.*.distance.km', [44, 32, 63]);
        $abigail = $response->json('data.artists.0');
        $this->assertSame(
            ['id', 'slug', 'pronoun', 'name', 'actType', 'styles', 'city', 'distance', 'rating', 'reviewCount', 'fromPrice', 'savedAt', 'availability'],
            array_keys($abigail),
        );
        $this->assertSame('Abigail Mensah', $abigail['name']);
        $this->assertSame('Brampton', $abigail['city']);
        $this->assertSame(['cents' => 65000, 'currency' => 'CAD'], $abigail['fromPrice']);
        $this->assertTrue(Carbon::parse($abigail['savedAt'])->equalTo(Carbon::parse('2026-10-07 20:14', 'America/Toronto')));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_another_date_rechecks_every_artist(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->getJson('/api/v1/saved-artists?date=2026-11-15')
            ->assertOk()
            ->assertJsonPath('data.date', '2026-11-15')
            ->assertJsonPath('data.artists.*.availability', ['booked', 'free', 'free']);
    }

    public function test_without_a_date_no_artist_is_marked(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->getJson('/api/v1/saved-artists');

        $response->assertOk()
            ->assertJsonPath('data.date', null)
            ->assertJsonPath('data.artists.*.availability', [null, null, null]);
        $this->assertMatchesContract($response);
    }

    public function test_a_suspended_artist_is_left_out_and_not_counted_but_stays_saved(): void
    {
        $naomi = User::where('email', self::NAOMI)->firstOrFail();
        $selah = Artist::where('slug', 'selah-brooks')->firstOrFail();
        DB::table('saved_artists')->insert(['user_id' => $naomi->id, 'artist_id' => $selah->id, 'created_at' => now()->toIso8601String()]);
        $this->signIn(self::NAOMI)->assertOk();

        $this->getJson('/api/v1/saved-artists?date=2026-11-14')
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.artists.*.slug', ['abigail-mensah', 'hosanna-collective', 'luz-viva']);

        $selah->update(['status' => ArtistStatus::Approved]);
        $this->getJson('/api/v1/saved-artists')->assertJsonPath('data.total', 4)->assertJsonPath('data.artists.0.slug', 'selah-brooks');
    }

    public function test_a_new_booker_has_none_and_a_booker_without_a_church_has_no_distance(): void
    {
        $email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();
        $this->signIn($email)->assertOk();

        $this->getJson('/api/v1/saved-artists?date=2026-11-14')
            ->assertOk()
            ->assertExactJson(['data' => ['artists' => [], 'total' => 0, 'date' => '2026-11-14']]);

        $this->putJson('/api/v1/saved-artists/'.Artist::where('slug', 'elijah-park')->value('id'))->assertOk();
        $this->getJson('/api/v1/saved-artists')->assertJsonPath('data.artists.0.distance', null);
    }

    public function test_a_date_that_is_not_a_calendar_date_is_refused(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->getJson('/api/v1/saved-artists?date=14-11-2026')->assertUnprocessable()->assertJsonValidationErrors('date');
    }

    public function test_only_a_signed_in_booker_has_a_list(): void
    {
        $this->getJson('/api/v1/saved-artists')->assertUnauthorized();

        $this->signIn('abigail@abigailmensah.ca')->assertOk();
        $this->getJson('/api/v1/saved-artists')->assertNotFound();
    }
}
