<?php

namespace Tests\Feature\Accounts;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use App\Models\Artist;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-026 (accounts/save-artist): a booker saves and unsaves artists, at most 200; the answer always
 * carries the server's count. Only approved, published artists can be saved. Bookers only (L2-074.1).
 */
class SaveArtistTest extends TestCase
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

    public function test_naomi_reads_the_ids_she_saved_and_their_count(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->getJson('/api/v1/saved-artists/ids');

        $response->assertOk()->assertJsonPath('data.count', 3);
        $this->assertEqualsCanonicalizing(
            [$this->idOf('abigail-mensah'), $this->idOf('hosanna-collective'), $this->idOf('luz-viva')],
            $response->json('data.artistIds'),
        );
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_saving_and_unsaving_answer_the_new_count_and_repeat_safely(): void
    {
        $this->signIn(self::NAOMI)->assertOk();
        $elijah = $this->idOf('elijah-park');

        $saved = $this->save($elijah);
        $saved->assertOk()->assertExactJson(['data' => ['artistId' => $elijah, 'saved' => true, 'savedCount' => 4, 'firstSave' => false]]);
        $this->assertMatchesContract($saved);
        $this->save($elijah)->assertOk()->assertJsonPath('data.savedCount', 4);

        $removed = $this->unsave($elijah);
        $removed->assertOk()->assertExactJson(['data' => ['artistId' => $elijah, 'saved' => false, 'savedCount' => 3, 'firstSave' => false]]);
        $this->assertMatchesContract($removed);
        $this->unsave($elijah)->assertOk()->assertJsonPath('data.savedCount', 3);
    }

    public function test_a_bookers_first_ever_save_says_so_once(): void
    {
        $email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();
        $this->signIn($email)->assertOk();
        $elijah = $this->idOf('elijah-park');

        $this->save($elijah)->assertJsonPath('data.firstSave', true)->assertJsonPath('data.savedCount', 1);
        $this->unsave($elijah)->assertOk();
        $this->save($elijah)->assertJsonPath('data.firstSave', false);
    }

    public function test_the_201st_save_is_refused_and_nothing_changes(): void
    {
        $email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();
        $booker = User::where('email', $email)->sole();
        for ($i = 0; $i < 200; $i++) {
            $artist = Artist::create([
                'user_id' => User::create(['name' => "Artist {$i}", 'email' => "artist{$i}@example.ca", 'password' => 'x'])->id,
                'slug' => "artist-{$i}", 'ticket_number' => "ACT-8{$i}", 'display_name' => "Artist {$i}",
                'act_type' => ActType::Solo, 'base_city' => 'Brampton', 'base_latitude' => 43.7315,
                'base_longitude' => -79.7624, 'max_drive_km' => 80, 'from_price_cents' => 50000,
                'status' => ArtistStatus::Approved, 'published_at' => now(),
            ]);
            DB::table('saved_artists')->insert(['user_id' => $booker->id, 'artist_id' => $artist->id, 'created_at' => now()]);
        }
        $this->signIn($email)->assertOk();

        $response = $this->save($this->idOf('elijah-park'));

        $response->assertStatus(422)->assertJsonPath('type', config('zamaro.problems.base_uri').'/saved-artist-limit');
        $this->assertMatchesContract($response);
        $this->assertSame(200, DB::table('saved_artists')->where('user_id', $booker->id)->count());
    }

    public function test_a_suspended_or_unknown_artist_cannot_be_saved(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->save($this->idOf('selah-brooks'))->assertNotFound();
        $this->save(999999)->assertNotFound();
    }

    public function test_an_artist_has_no_saved_artists(): void
    {
        $this->signIn('abigail@abigailmensah.ca')->assertOk();

        $this->getJson('/api/v1/saved-artists/ids')->assertNotFound();
        $this->save($this->idOf('elijah-park'))->assertNotFound();
    }

    public function test_a_guest_gets_401(): void
    {
        $this->fromTheWebApp()->putJson('/api/v1/saved-artists/'.$this->idOf('elijah-park'))->assertUnauthorized();
    }

    public function test_lineup_cards_and_profiles_carry_the_id_and_pronoun_for_the_toggle(): void
    {
        $profile = $this->getJson('/api/v1/artists/abigail-mensah');

        $profile->assertOk()->assertJsonPath('data.id', $this->idOf('abigail-mensah'))->assertJsonPath('data.pronoun', 'she');
        $search = $this->getJson('/api/v1/search?date=2026-11-14&kind=worship-night&lat=43.325&lng=-79.799&radius=120');
        $search->assertOk();
        $card = collect($search->json('data.cards'))->firstWhere('slug', 'elijah-park');
        $this->assertSame($this->idOf('elijah-park'), $card['id']);
        $this->assertSame('he', $card['pronoun']);
        $this->assertMatchesContract($search);
    }

    private function save(int $artistId): TestResponse
    {
        return $this->fromTheWebApp()->putJson("/api/v1/saved-artists/{$artistId}");
    }

    private function unsave(int $artistId): TestResponse
    {
        return $this->fromTheWebApp()->deleteJson("/api/v1/saved-artists/{$artistId}");
    }

    private function idOf(string $slug): int
    {
        return (int) Artist::where('slug', $slug)->value('id');
    }
}
