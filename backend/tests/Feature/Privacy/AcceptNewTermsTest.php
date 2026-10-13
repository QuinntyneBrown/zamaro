<?php

namespace Tests\Feature\Privacy;

use App\Enums\ConsentKind;
use App\Models\LegalDocument;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-080.3 (privacy/record-consent): a person who has not accepted the current terms is stopped on
 * every signed-in call but sign-out and `/me` until they accept them; the acceptance is recorded with
 * the version they saw. A new privacy policy alone does not stop anyone (M2 D15).
 */
class AcceptNewTermsTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const TOMI = 'tomi.oduya@harvestpointchurch.ca';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed([LegalDocumentSeeder::class, CastSeeder::class]);
    }

    public function test_me_says_who_must_accept_the_new_terms(): void
    {
        $this->signIn(self::TOMI)->assertOk()->assertJsonPath('data.termsAcceptanceRequired', true);
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.termsAcceptanceRequired', true);

        $this->asANewRequest()->withoutCookies()->signIn('naomi.fraser@riversidecc.ca')->assertJsonPath('data.termsAcceptanceRequired', false);
    }

    public function test_every_other_signed_in_call_gets_409_until_then(): void
    {
        $this->signIn(self::TOMI)->assertOk();

        $response = $this->getJson('/api/v1/account/church');

        $response->assertStatus(409)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/terms-acceptance-required');
        $this->assertMatchesContract($response);
        $this->fromTheWebApp()->putJson('/api/v1/account/profile', ['name' => 'Tomi Oduya'])->assertStatus(409);
        $this->fromTheWebApp()->deleteJson('/api/v1/session')->assertNoContent();
    }

    public function test_accepting_records_the_version_seen_and_opens_the_account_again(): void
    {
        $this->signIn(self::TOMI)->assertOk();
        $before = DB::table('consent_records')->where('user_id', $this->tomi()->id)->count();

        $response = $this->accept('2026-10');

        $response->assertOk()->assertJsonPath('data.termsAcceptanceRequired', false);
        $this->assertMatchesContract($response);
        $this->assertSame($before + 1, DB::table('consent_records')->where('user_id', $this->tomi()->id)->count());
        $record = DB::table('consent_records')->where('user_id', $this->tomi()->id)->orderByDesc('id')->first();
        $this->assertSame([ConsentKind::Terms->value, '2026-10', true, 'terms-update'], [$record->kind, $record->document_version, (bool) $record->granted, $record->source]);
        $this->assertNotNull($record->ip_address);
        $this->getJson('/api/v1/account/church')->assertOk();
    }

    public function test_a_version_no_longer_current_is_refused_and_nothing_is_written(): void
    {
        $this->signIn(self::TOMI)->assertOk();
        $before = DB::table('consent_records')->count();

        $response = $this->accept('2026-03');

        $response->assertStatus(409)->assertJsonPath('type', config('zamaro.problems.base_uri').'/legal-document-outdated');
        $this->assertMatchesContract($response);
        $this->assertSame($before, DB::table('consent_records')->count());
    }

    public function test_a_new_privacy_policy_alone_stops_no_one(): void
    {
        LegalDocument::create([
            'kind' => ConsentKind::PrivacyPolicy, 'version' => '2026-11', 'effective_from' => '2026-11-01',
            'url' => 'https://zamaro.ca/legal/privacy', 'summary_of_changes' => [],
        ]);
        $this->travelTo(Carbon::parse('2026-11-02 10:00', 'America/Toronto'));

        $this->signIn('naomi.fraser@riversidecc.ca')->assertJsonPath('data.termsAcceptanceRequired', false);
        $this->getJson('/api/v1/account/church')->assertOk();
    }

    public function test_before_the_new_terms_take_effect_nobody_is_stopped(): void
    {
        $this->travelTo(Carbon::parse('2026-10-07 10:00', 'America/Toronto'));

        $this->signIn(self::TOMI)->assertJsonPath('data.termsAcceptanceRequired', false);
        $this->getJson('/api/v1/account/church')->assertOk();
    }

    public function test_a_guest_gets_401(): void
    {
        $this->accept('2026-10')->assertUnauthorized();
    }

    private function accept(string $version): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/account/consents/terms', ['termsVersion' => $version]);
    }

    private function tomi(): User
    {
        return User::where('email', self::TOMI)->sole();
    }
}
