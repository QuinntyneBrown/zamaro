<?php

namespace Tests\Feature\Privacy;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-080.4 (privacy/record-consent): the marketing choice can change in account settings; each change
 * appends a `settings` record and the earlier ones stay. The latest record is the choice.
 */
class MarketingConsentTest extends TestCase
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
        $this->signIn(self::NAOMI)->assertOk();
    }

    public function test_the_choice_reads_from_the_latest_record(): void
    {
        $response = $this->getJson('/api/v1/account/consents/marketing');

        $response->assertOk()->assertExactJson(['data' => ['granted' => false]]);
        $this->assertMatchesContract($response);
    }

    public function test_ticking_the_box_appends_a_settings_record_and_keeps_the_earlier_ones(): void
    {
        $naomi = User::where('email', self::NAOMI)->sole();
        $earlier = DB::table('consent_records')->where('user_id', $naomi->id)->where('kind', 'marketing-email')->get();

        $response = $this->fromTheWebApp()->postJson('/api/v1/account/consents/marketing', ['granted' => true]);

        $response->assertOk()->assertExactJson(['data' => ['granted' => true]]);
        $this->assertMatchesContract($response);
        $records = DB::table('consent_records')->where('user_id', $naomi->id)->where('kind', 'marketing-email')->orderBy('id')->get();
        $this->assertCount($earlier->count() + 1, $records);
        $this->assertSame($earlier->pluck('id')->all(), $records->take($earlier->count())->pluck('id')->all());
        $this->assertTrue((bool) $records->last()->granted);
        $this->assertSame('settings', $records->last()->source);
        $this->assertNull($records->last()->document_version);
        $this->getJson('/api/v1/account/consents/marketing')->assertJsonPath('data.granted', true);

        $this->fromTheWebApp()->postJson('/api/v1/account/consents/marketing', ['granted' => false])->assertOk();
        $this->getJson('/api/v1/account/consents/marketing')->assertJsonPath('data.granted', false);
    }

    public function test_the_choice_must_be_yes_or_no(): void
    {
        $this->fromTheWebApp()->postJson('/api/v1/account/consents/marketing', ['granted' => 'maybe'])
            ->assertUnprocessable()->assertJsonValidationErrors('granted');
    }
}
