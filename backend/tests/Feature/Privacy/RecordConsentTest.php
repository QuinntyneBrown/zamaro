<?php

namespace Tests\Feature\Privacy;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-080.1–.2: registration stores the terms and privacy policy versions accepted, and the separate
 * marketing choice, each with the time, as CASL evidence. Records are never changed (privacy/
 * record-consent).
 */
class RecordConsentTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed([LegalDocumentSeeder::class, CastSeeder::class]);
        Notification::fake();
    }

    public function test_registration_records_the_terms_the_privacy_policy_and_the_marketing_choice(): void
    {
        $this->register()->assertStatus(202);

        $user = User::where('email', 'ruth.adeyemi@gracepoint.ca')->firstOrFail();
        $records = DB::table('consent_records')->where('user_id', $user->id)->orderBy('id')->get();
        $this->assertSame(
            [['terms', '2026-10', true], ['privacy-policy', '2026-10', true], ['marketing-email', null, false]],
            $records->map(fn ($record) => [$record->kind, $record->document_version, (bool) $record->granted])->all(),
        );
        foreach ($records as $record) {
            $this->assertTrue(Carbon::parse($record->recorded_at)->equalTo(now()));
            $this->assertSame('registration', $record->source);
            $this->assertSame('203.0.113.24', $record->ip_address);
            $this->assertSame('Mozilla/5.0 (Windows NT 10.0) Chrome/130', $record->user_agent);
        }
    }

    public function test_ticking_the_news_box_records_marketing_consent_as_granted(): void
    {
        $this->register(['marketingOptIn' => true])->assertStatus(202);

        $this->assertTrue((bool) DB::table('consent_records')->where('kind', 'marketing-email')->value('granted'));
    }

    public function test_versions_that_are_no_longer_current_are_refused_and_nothing_is_written(): void
    {
        $response = $this->register(['termsVersion' => '2026-03']);

        $response->assertStatus(409)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/legal-document-outdated');
        $this->assertMatchesContract($response);
        $this->assertDatabaseMissing('users', ['email' => 'ruth.adeyemi@gracepoint.ca']);
        $this->register(['privacyPolicyVersion' => '2025-01'])->assertStatus(409);
    }

    public function test_consent_records_cannot_be_changed_or_deleted(): void
    {
        $this->register()->assertStatus(202);
        $id = DB::table('consent_records')->value('id');

        $this->assertThrows(fn () => DB::table('consent_records')->where('id', $id)->update(['granted' => false]), QueryException::class);
        $this->assertThrows(fn () => DB::table('consent_records')->where('id', $id)->delete(), QueryException::class);
    }

    public function test_the_current_versions_are_public(): void
    {
        $response = $this->getJson('/api/v1/legal-documents/current');

        $response->assertOk()
            ->assertJsonPath('data.terms.version', '2026-10')
            ->assertJsonPath('data.terms.effectiveFrom', '2026-10-08')
            ->assertJsonPath('data.privacyPolicy.version', '2026-10');
        $this->assertMatchesContract($response);
    }

    public function test_before_thu_8_oct_the_march_terms_were_current(): void
    {
        $this->travelTo(Carbon::parse('2026-10-07 12:00', 'America/Toronto'));

        $this->getJson('/api/v1/legal-documents/current')->assertJsonPath('data.terms.version', '2026-03');
    }

    /** @param  array<string, mixed>  $overrides */
    private function register(array $overrides = []): TestResponse
    {
        return $this->fromTheWebApp()
            ->withServerVariables(['REMOTE_ADDR' => '203.0.113.24'])
            ->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0) Chrome/130')
            ->postJson('/api/v1/register', array_merge([
                'name' => 'Ruth Adeyemi',
                'email' => 'ruth.adeyemi@gracepoint.ca',
                'password' => 'hosanna-in-the-highest',
                'acceptedTerms' => true,
                'marketingOptIn' => false,
                'termsVersion' => '2026-10',
                'privacyPolicyVersion' => '2026-10',
                'challengeToken' => 'pass',
            ], $overrides));
    }
}
