<?php

namespace Tests\Feature\Administration;

use App\Enums\ArtistStatus;
use App\Models\Artist;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-067 (list entry, M3 D18): the read-only Artists list and detail an administrator reads before
 * suspend-and-reinstate (M8) adds its actions.
 */
class ListAdminArtistsTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const ARTISTS = '/api/v1/admin/artists';

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->signInPriya();
    }

    public function test_every_approved_and_suspended_artist_is_listed_a_to_z_with_the_counts(): void
    {
        $response = $this->asPriya()->getJson(self::ARTISTS);

        // The seed holds the eight mock artists, Selah Brooks (suspended) and the supporting cast.
        $response->assertOk()
            ->assertJsonPath('meta.total', Artist::count())
            ->assertJsonPath('meta.approved', Artist::where('status', ArtistStatus::Approved)->count())
            ->assertJsonPath('meta.suspended', 1);
        $this->assertMatchesContract($response);
        $rows = collect($response->json('data'));
        $this->assertCount(Artist::count(), $rows);
        $mockCast = ['Abigail Mensah', 'Daniel & Ruth Okonkwo', 'Elijah Park', 'Grace Tabernacle Mass Choir', 'Hosanna Collective', 'Luz Viva', 'Marcus Bell Trio', 'Miriam Haile', 'Selah Brooks'];
        $this->assertSame($mockCast, $rows->pluck('name')->filter(fn (string $name) => in_array($name, $mockCast, true))->values()->all());
        $abigail = $rows->firstWhere('name', 'Abigail Mensah');
        $this->assertSame('solo', $abigail['actType']);
        $this->assertSame('Brampton', $abigail['baseCity']);
        $this->assertSame(4.9, $abigail['rating']);
        $this->assertSame('approved', $abigail['status']);
        $this->assertNull($rows->firstWhere('name', 'Miriam Haile')['rating']);
        $this->assertSame('suspended', $rows->firstWhere('name', 'Selah Brooks')['status']);
    }

    public function test_the_search_matches_name_city_or_email_and_an_applicant_is_not_an_artist(): void
    {
        $this->assertSame([], $this->asPriya()->getJson(self::ARTISTS.'?q=Tobi')->assertOk()->json('data'));
        $hamilton = collect($this->asPriya()->getJson(self::ARTISTS.'?q=hamilton')->json('data'));
        $this->assertContains('Marcus Bell Trio', $hamilton->pluck('name')->all());
        $hamilton->each(fn (array $row) => $this->assertTrue(str_contains(strtolower($row['name'].' '.$row['baseCity']), 'hamilton'), $row['name']));
        $this->assertSame(['Marcus Bell Trio'], collect($this->asPriya()->getJson(self::ARTISTS.'?q=marcus@marcusbelltrio.ca')->json('data'))->pluck('name')->all());
        $this->assertSame(['Daniel & Ruth Okonkwo'], collect($this->asPriya()->getJson(self::ARTISTS.'?q=okonkwo')->json('data'))->pluck('name')->all());
    }

    public function test_an_artists_details_show_the_account_the_profile_the_upcoming_bookings_and_the_standing(): void
    {
        $marcus = Artist::where('slug', 'marcus-bell-trio')->sole();

        $response = $this->asPriya()->getJson(self::ARTISTS."/{$marcus->id}");

        $response->assertOk()
            ->assertJsonPath('data.name', 'Marcus Bell Trio')
            ->assertJsonPath('data.email', 'marcus@marcusbelltrio.ca')
            ->assertJsonPath('data.actType', 'band')
            ->assertJsonPath('data.styles', ['band', 'acoustic', 'hymns'])
            ->assertJsonPath('data.baseCity', 'Hamilton')
            ->assertJsonPath('data.fromPriceCents', 95000)
            ->assertJsonPath('data.rating', 4.6)
            ->assertJsonPath('data.slug', 'marcus-bell-trio')
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.approvedAt', '2026-03-02T09:00:00-05:00')
            ->assertJsonPath('data.upcomingBookings.0.number', 'ZAM-0097')
            ->assertJsonPath('data.upcomingBookings.0.eventDate', '2026-10-25')
            ->assertJsonPath('data.upcomingBookings.0.churchName', 'Riverside Community Church')
            ->assertJsonPath('data.upcomingBookings.0.churchCity', 'Burlington')
            ->assertJsonPath('data.upcomingBookings.0.kind', 'sunday-service')
            ->assertJsonPath('data.upcomingBookings.0.status', 'confirmed')
            ->assertJsonPath('data.suspensions', []);
        $this->assertMatchesContract($response);
        $this->asPriya()->getJson(self::ARTISTS.'/999999')->assertNotFound();
    }

    private function signInPriya(): void
    {
        $pending = $this->asANewRequest()->withoutCookies()->signIn(CastSeeder::PRIYA_EMAIL)->assertStatus(202)->getCookie('zamaro_session')->getValue();
        $this->session = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp(CastSeeder::PRIYA_TOTP_SECRET)])
            ->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function asPriya(): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
    }
}
