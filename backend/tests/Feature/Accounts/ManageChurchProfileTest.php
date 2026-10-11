<?php

namespace Tests\Feature\Accounts;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-024 and L2-001 (accounts/manage-church-profile): a booker keeps one church. Its address is
 * geocoded and checked against the 200 km service area before anything is stored, and its phone is a
 * North American number, encrypted at rest (L2-079.2).
 */
class ManageChurchProfileTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    private const RIVERSIDE = [
        'name' => 'Riverside Community Church',
        'streetAddress' => '2150 Lakeshore Road',
        'city' => 'Burlington',
        'postalCode' => 'L7R 1A3',
        'phone' => '905-555-0123',
        'denomination' => 'Non-denominational',
        'typicalAttendance' => 350,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_naomi_reads_her_church(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->getJson('/api/v1/account/church');

        $response->assertOk()
            ->assertJsonPath('data.name', 'Riverside Community Church')
            ->assertJsonPath('data.streetAddress', '2150 Lakeshore Road')
            ->assertJsonPath('data.city', 'Burlington')
            ->assertJsonPath('data.province', 'ON')
            ->assertJsonPath('data.postalCode', 'L7R 1A3')
            ->assertJsonPath('data.phone', '905-555-0123')
            ->assertJsonPath('data.denomination', 'Non-denominational')
            ->assertJsonPath('data.typicalAttendance', 350);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_a_booker_without_a_church_reads_none(): void
    {
        $this->signIn($this->freshBooker())->assertOk();

        $this->getJson('/api/v1/account/church')->assertOk()->assertExactJson(['data' => null]);
    }

    public function test_a_burlington_address_is_geocoded_and_saved(): void
    {
        $email = $this->freshBooker();
        $this->signIn($email)->assertOk();

        $response = $this->save(self::RIVERSIDE);

        $response->assertOk()->assertJsonPath('data.city', 'Burlington')->assertJsonPath('data.phone', '905-555-0123');
        $this->assertMatchesContract($response);
        $row = DB::table('churches')->where('booker_id', $this->idOf($email))->first();
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(43.325, (float) $row->latitude, 0.001);
        $this->assertEqualsWithDelta(-79.799, (float) $row->longitude, 0.001);
        $this->assertSame('L7R 1A3', $row->postal_code);
    }

    public function test_saving_again_replaces_the_one_church(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->save([...self::RIVERSIDE, 'typicalAttendance' => 400])->assertOk()->assertJsonPath('data.typicalAttendance', 400);

        $this->assertSame(1, DB::table('churches')->where('booker_id', $this->idOf(self::NAOMI))->count());
    }

    public function test_the_phone_is_stored_encrypted_and_read_back_plain(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->save([...self::RIVERSIDE, 'phone' => '(905) 555 0199'])->assertOk()->assertJsonPath('data.phone', '905-555-0199');

        $stored = DB::table('churches')->where('booker_id', $this->idOf(self::NAOMI))->value('phone');
        $this->assertStringStartsWith('v1:', $stored);
        $this->assertStringNotContainsString('555', $stored);
    }

    public function test_an_ottawa_address_is_outside_the_service_area_and_nothing_is_stored(): void
    {
        $this->signIn(self::NAOMI)->assertOk();
        $before = DB::table('churches')->where('booker_id', $this->idOf(self::NAOMI))->first();

        $response = $this->save([...self::RIVERSIDE, 'streetAddress' => '180 Elgin Street', 'city' => 'Ottawa', 'postalCode' => 'K2P 2K3']);

        $response->assertUnprocessable()->assertJsonPath('errors.serviceArea.0', 'Zamaro serves churches within 200 km of Toronto.');
        $this->assertMatchesContract($response);
        $this->assertEquals($before, DB::table('churches')->where('booker_id', $this->idOf(self::NAOMI))->first());
    }

    public function test_an_address_that_cannot_be_found_is_refused_and_nothing_is_stored(): void
    {
        $email = $this->freshBooker();
        $this->signIn($email)->assertOk();

        $response = $this->save([...self::RIVERSIDE, 'streetAddress' => '1 Nowhere Lane']);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.streetAddress.0', 'We couldn’t find that address. Check the street and postal code.');
        $this->assertFalse(DB::table('churches')->where('booker_id', $this->idOf($email))->exists());
    }

    public function test_each_field_is_checked_before_the_address_is_looked_up(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $cases = [
            'postalCode' => ['L7R 1A', 'Enter a postal code like L7R 1A3, with six characters.'],
            'name' => ['R', 'Use 2 to 120 characters for the church name.'],
            'phone' => ['555-0123', 'Enter a North American phone number, like 905-555-0123.'],
            'typicalAttendance' => [0, 'Enter the typical attendance as a whole number above 0.'],
        ];
        foreach ($cases as $field => [$value, $message]) {
            $this->save([...self::RIVERSIDE, $field => $value])->assertUnprocessable()->assertJsonPath("errors.{$field}.0", $message);
        }
        $this->save([...self::RIVERSIDE, 'name' => str_repeat('a', 121)])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->save([...self::RIVERSIDE, 'streetAddress' => '', 'city' => ''])->assertUnprocessable()->assertJsonValidationErrors(['streetAddress', 'city']);
    }

    public function test_denomination_and_attendance_are_optional_and_a_lower_case_postal_code_is_tidied(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->save([...self::RIVERSIDE, 'denomination' => null, 'typicalAttendance' => null, 'postalCode' => 'l7r1a3'])
            ->assertOk()
            ->assertJsonPath('data.denomination', null)
            ->assertJsonPath('data.typicalAttendance', null)
            ->assertJsonPath('data.postalCode', 'L7R 1A3');
    }

    public function test_the_header_and_discover_read_the_church_from_me(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('data.church.name', 'Riverside Community Church')
            ->assertJsonPath('data.church.city', 'Burlington');
        $this->assertEqualsWithDelta(43.325, $response->json('data.church.latitude'), 0.001);
        $this->assertMatchesContract($response);
    }

    public function test_an_artist_has_no_church_route(): void
    {
        $this->signIn('abigail@abigailmensah.ca')->assertOk();

        $this->getJson('/api/v1/account/church')->assertNotFound();
        $this->save(self::RIVERSIDE)->assertNotFound();
    }

    public function test_a_guest_gets_401(): void
    {
        $this->fromTheWebApp()->getJson('/api/v1/account/church')->assertUnauthorized();
    }

    /** @param  array<string, mixed>  $church */
    private function save(array $church): TestResponse
    {
        return $this->fromTheWebApp()->putJson('/api/v1/account/church', $church);
    }

    private function freshBooker(): string
    {
        $email = 'fresh-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();

        return $email;
    }

    private function idOf(string $email): int
    {
        return (int) DB::table('users')->where('email', $email)->value('id');
    }
}
