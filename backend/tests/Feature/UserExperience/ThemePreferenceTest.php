<?php

namespace Tests\Feature\UserExperience;

use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-104.2 (user-experience/switch-theme): a signed-in person's theme is saved to their account and
 * read back through `/me`, so every device they sign in on follows the latest choice.
 */
class ThemePreferenceTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const NAOMI = 'naomi.fraser@riversidecc.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed([LegalDocumentSeeder::class, CastSeeder::class]);
    }

    public function test_an_account_has_no_theme_until_one_is_chosen(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.themePreference', null);
    }

    public function test_choosing_dark_saves_it_to_the_account_and_me_reads_it_back(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'dark']);

        $response->assertOk()->assertJsonPath('data.themePreference', 'dark')->assertJsonPath('data.email', self::NAOMI);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $this->assertSame('dark', DB::table('users')->where('email', self::NAOMI)->value('theme_preference'));
        $this->getJson('/api/v1/me')->assertJsonPath('data.themePreference', 'dark');
    }

    public function test_light_replaces_dark_and_null_follows_the_device_again(): void
    {
        $this->signIn(self::NAOMI)->assertOk();
        $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'dark'])->assertOk();

        $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'light'])->assertOk()->assertJsonPath('data.themePreference', 'light');
        $this->patchJson('/api/v1/me/preferences', ['themePreference' => null])->assertOk()->assertJsonPath('data.themePreference', null);

        $this->assertNull(DB::table('users')->where('email', self::NAOMI)->value('theme_preference'));
    }

    public function test_a_theme_that_is_not_light_or_dark_is_refused(): void
    {
        $this->signIn(self::NAOMI)->assertOk();

        $response = $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'blue']);

        $response->assertUnprocessable()->assertJsonValidationErrors('themePreference');
        $this->assertMatchesContract($response);
        $this->assertNull(DB::table('users')->where('email', self::NAOMI)->value('theme_preference'));
    }

    public function test_a_booker_who_must_accept_new_terms_can_still_save_a_theme(): void
    {
        $this->signIn('tomi.oduya@harvestpointchurch.ca')->assertOk();
        $this->getJson('/api/v1/account/church')->assertStatus(409);

        $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'dark'])->assertOk()->assertJsonPath('data.themePreference', 'dark');
    }

    public function test_a_guest_has_no_preferences_to_save(): void
    {
        $this->patchJson('/api/v1/me/preferences', ['themePreference' => 'dark'])->assertUnauthorized();
    }
}
