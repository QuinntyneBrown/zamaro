<?php

namespace Tests\Feature\Accounts;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * The Profile section of account settings (accounts/manage-account-settings): the person's name,
 * which artists see on requests and the header turns into initials (L2-024.2).
 */
class AccountProfileTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_a_new_name_is_saved_and_the_initials_follow_it(): void
    {
        $email = 'renamed-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $email])->assertSuccessful();
        $this->signIn($email)->assertOk();

        $response = $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => '  Ruth Okafor  ']);

        $response->assertOk()->assertJsonPath('data.name', 'Ruth Okafor')->assertJsonPath('data.initials', 'RO');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $this->getJson('/api/v1/me')->assertJsonPath('data.name', 'Ruth Okafor');
    }

    public function test_a_blank_or_overlong_name_is_refused(): void
    {
        $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();

        $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => '   '])
            ->assertUnprocessable()->assertJsonPath('errors.name.0', 'Enter your name.');
        $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => str_repeat('a', 121)])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->getJson('/api/v1/me')->assertJsonPath('data.name', 'Naomi Fraser');
    }

    public function test_an_artist_renames_their_account_too(): void
    {
        $this->signIn('abigail@abigailmensah.ca')->assertOk();

        $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => 'Abigail Mensah'])->assertOk();
    }

    public function test_a_guest_gets_401(): void
    {
        $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => 'Someone'])->assertUnauthorized();
    }
}
