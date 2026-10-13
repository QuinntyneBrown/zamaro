<?php

namespace Tests\Feature\Accounts;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * GET /api/v1/me: the signed-in person as the app needs them (current-user names, ADR-0016).
 * L2-089.3: personal data is private and never stored by a cache.
 */
class CurrentUserTest extends TestCase
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

    public function test_naomi_signed_in_gets_her_name_initials_roles_and_preferences(): void
    {
        $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();

        $response = $this->fromTheWebApp()->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('data.name', 'Naomi Fraser')
            ->assertJsonPath('data.email', 'naomi.fraser@riversidecc.ca')
            ->assertJsonPath('data.initials', 'NF')
            ->assertJsonPath('data.roles', ['booker'])
            ->assertJsonPath('data.emailVerified', true)
            ->assertJsonPath('data.themePreference', null)
            ->assertJsonPath('data.termsAcceptanceRequired', false);
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_abigail_is_an_artist(): void
    {
        $this->signIn('abigail@abigailmensah.ca')->assertOk();

        $this->fromTheWebApp()->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.initials', 'AM')
            ->assertJsonPath('data.roles', ['artist']);
    }

    public function test_a_guest_gets_a_401_problem(): void
    {
        $response = $this->fromTheWebApp()->getJson('/api/v1/me');

        $response->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/unauthenticated')
            ->assertJsonPath('status', 401);
        $this->assertMatchesContract($response);
    }

    public function test_a_guest_without_an_accept_header_gets_the_same_401_problem(): void
    {
        $this->get('/api/v1/me')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/problem+json');
    }
}
