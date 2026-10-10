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
 * L2-012, L2-013, L2-016 and L2-083.1: the public profile, public fields only.
 */
class ViewArtistProfileTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;

    /** Every field the public profile may carry; anything else must stay server-side (L2-083). */
    private const PUBLIC_FIELDS = [
        'slug', 'displayName', 'firstName', 'pronoun', 'actType', 'headline', 'aboutHeading', 'bio',
        'baseCity', 'maxDriveKm', 'fromPrice', 'ticketNumber', 'rating', 'reviewCount', 'styles', 'setlist',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_guest_sees_abigails_public_profile(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk()
            ->assertJsonPath('data.displayName', 'Abigail Mensah')
            ->assertJsonPath('data.firstName', 'Abigail')
            ->assertJsonPath('data.pronoun', 'she')
            ->assertJsonPath('data.headline', 'Gospel & contemporary vocalist')
            ->assertJsonPath('data.aboutHeading', 'Raised in the choir loft')
            ->assertJsonPath('data.baseCity', 'Brampton')
            ->assertJsonPath('data.maxDriveKm', 120)
            ->assertJsonPath('data.rating', 4.9)
            ->assertJsonPath('data.reviewCount', 38)
            ->assertJsonPath('data.styles', ['solo-vocalist', 'hymns'])
            ->assertJsonPath('data.setlist.0', ['position' => 1, 'title' => 'Way Maker', 'writer' => 'Sinach', 'key' => 'E'])
            ->assertJsonPath('data.setlist.3.key', 'B-flat')
            ->assertJsonCount(8, 'data.setlist');
        $this->assertStringContainsString("nine years.\n\nI lead in English and Twi", $response->json('data.bio'));
        $this->assertStringContainsString('public', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_only_public_fields_leave_the_server(): void
    {
        $data = $this->getJson('/api/v1/artists/abigail-mensah')->json('data');

        $this->assertEqualsCanonicalizing(self::PUBLIC_FIELDS, array_keys($data));
        $this->assertStringNotContainsString('@', json_encode($data));
    }

    public function test_a_new_artist_has_no_rating_and_a_group_is_called_by_its_name(): void
    {
        $this->getJson('/api/v1/artists/miriam-haile')
            ->assertOk()
            ->assertJsonPath('data.rating', null)
            ->assertJsonPath('data.reviewCount', 0);

        $this->getJson('/api/v1/artists/marcus-bell-trio')
            ->assertOk()
            ->assertJsonPath('data.firstName', 'Marcus Bell Trio')
            ->assertJsonPath('data.aboutHeading', null);
    }

    public function test_markup_in_a_bio_is_returned_as_the_text_it_is(): void
    {
        Artist::where('slug', 'miriam-haile')->update(['bio' => '<script>alert(1)</script> Hello.']);

        $this->getJson('/api/v1/artists/miriam-haile')->assertJsonPath('data.bio', '<script>alert(1)</script> Hello.');
    }

    public function test_a_suspended_or_unknown_artist_is_not_found(): void
    {
        Artist::where('slug', 'marcus-bell-trio')->update(['status' => ArtistStatus::Suspended]);

        $this->getJson('/api/v1/artists/marcus-bell-trio')->assertNotFound()->assertHeader('Content-Type', 'application/problem+json');
        $response = $this->getJson('/api/v1/artists/nobody-at-all');
        $response->assertNotFound();
        $this->assertMatchesContract($response);
    }
}
