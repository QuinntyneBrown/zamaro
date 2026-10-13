<?php

namespace Tests\Feature\Accounts;

use App\Models\Artist;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-025.4: an artist keeps a private contact phone in the Contact section of account settings. It is
 * encrypted at rest (L2-079.2), never public, and a booker has no such route (L2-074.1).
 */
class ArtistContactPhoneTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const ABIGAIL = 'abigail@abigailmensah.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_abigail_reads_her_contact_phone(): void
    {
        $this->signIn(self::ABIGAIL)->assertOk();

        $response = $this->getJson('/api/v1/account/contact-phone');

        $response->assertOk()->assertExactJson(['data' => ['contactPhone' => '905-555-0148']]);
        $this->assertMatchesContract($response);
    }

    public function test_a_new_number_is_saved_encrypted_in_e164(): void
    {
        $this->signIn(self::ABIGAIL)->assertOk();

        $response = $this->fromTheWebApp()->putJson('/api/v1/account/contact-phone', ['contactPhone' => '+1 (416) 555-0190']);

        $response->assertOk()->assertJsonPath('data.contactPhone', '416-555-0190');
        $this->assertMatchesContract($response);
        $stored = DB::table('artists')->where('slug', 'abigail-mensah')->value('contact_phone');
        $this->assertStringStartsWith('v1:', $stored);
        $this->assertSame('+14165550190', Artist::where('slug', 'abigail-mensah')->first()->contact_phone);
    }

    public function test_a_number_outside_north_america_or_a_blank_one_is_refused(): void
    {
        $this->signIn(self::ABIGAIL)->assertOk();

        foreach (['+44 20 7946 0958', '905-555-01', '', '123-555-0148'] as $phone) {
            $this->fromTheWebApp()->putJson('/api/v1/account/contact-phone', ['contactPhone' => $phone])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('contactPhone');
        }
        $this->getJson('/api/v1/account/contact-phone')->assertJsonPath('data.contactPhone', '905-555-0148');
    }

    public function test_a_booker_gets_the_same_404_as_an_unknown_address(): void
    {
        $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();

        $this->fromTheWebApp()->putJson('/api/v1/account/contact-phone', ['contactPhone' => '905-555-0123'])->assertNotFound();
        $this->getJson('/api/v1/account/contact-phone')->assertNotFound();
    }

    public function test_the_phone_is_never_on_the_public_profile(): void
    {
        $response = $this->getJson('/api/v1/artists/abigail-mensah');

        $response->assertOk();
        $this->assertStringNotContainsString('555-0148', $response->getContent());
        $this->assertStringNotContainsString('5550148', $response->getContent());
    }
}
