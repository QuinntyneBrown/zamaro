<?php

namespace Tests\Feature\Security;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-079.2 (security/protect-secrets-and-data): phone numbers are encrypted by the API with a field key
 * held outside the database. Each value names its key version, so values written under an earlier key
 * still read after the key changes.
 */
class FieldEncryptionTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
    }

    public function test_no_phone_number_is_stored_in_plain_text(): void
    {
        $churchPhones = DB::table('churches')->pluck('phone');
        $artistPhones = DB::table('artists')->whereNotNull('contact_phone')->pluck('contact_phone');

        $this->assertNotEmpty($churchPhones);
        $this->assertNotEmpty($artistPhones);
        foreach ([...$churchPhones, ...$artistPhones] as $stored) {
            $this->assertMatchesRegularExpression('/^v1:/', $stored);
            $this->assertDoesNotMatchRegularExpression('/\d{3}.?555/', $stored);
        }
    }

    public function test_a_value_written_under_an_earlier_key_still_reads_and_new_values_use_the_new_key(): void
    {
        config([
            'security.field_encryption.version' => 'v2',
            'security.field_encryption.key' => 'base64:'.base64_encode(random_bytes(32)),
            'security.field_encryption.previous_keys' => 'v1:'.config('security.field_encryption.key'),
        ]);
        $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();

        $this->getJson('/api/v1/account/church')->assertOk()->assertJsonPath('data.phone', '905-555-0123');

        $church = $this->getJson('/api/v1/account/church')->json('data');
        $this->fromTheWebApp()->putJson('/api/v1/account/church', $church)->assertOk();
        $this->assertStringStartsWith('v2:', DB::table('churches')->where('name', 'Riverside Community Church')->value('phone'));
    }

    public function test_a_value_under_an_unknown_key_is_not_read_as_plain_text(): void
    {
        config([
            'security.field_encryption.version' => 'v2',
            'security.field_encryption.key' => 'base64:'.base64_encode(random_bytes(32)),
            'security.field_encryption.previous_keys' => '',
        ]);
        $this->signIn('naomi.fraser@riversidecc.ca')->assertOk();

        $this->getJson('/api/v1/account/church')->assertServerError();
    }
}
