<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Models\ArtistApplication;
use App\Models\AuditEntry;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-048.1 (verification), L2-066, L2-067.1, L2-069.1, L2-079.2, L2-089.3 (review-artist-application):
 * the admin queue lists submitted applications oldest first; opening one shows every detail with the
 * decrypted reference contacts and is audited; each reference tick saves at once, names who and
 * when, and is audited; the answers are never cached.
 */
class ReviewArtistApplicationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const QUEUE = '/api/v1/admin/artist-applications';

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->signInPriya();
    }

    public function test_the_queue_lists_the_submitted_applications_oldest_first(): void
    {
        $response = $this->asPriya()->getJson(self::QUEUE);

        $response->assertOk()->assertJsonPath('meta.waiting', 3)->assertJsonPath('meta.lastDecidedAt', null)->assertHeader('Cache-Control', 'no-store, private');
        $this->assertMatchesContract($response);
        $this->assertSame(['Ebenezer Brass Band', 'Kezia & Mark Thompson', 'Tobi Adeyemi'], $response->json('data.*.name'));
        $this->assertSame(['A-0217', 'A-0218', 'A-0219'], $response->json('data.*.number'));
        $ebenezer = $response->json('data.0');
        $this->assertSame('band', $ebenezer['actType']);
        $this->assertSame('Oshawa', $ebenezer['baseCity']);
        $this->assertSame('2026-10-06T16:20:00-04:00', $ebenezer['submittedAt']);
        $this->assertSame('submitted', $ebenezer['status']);
        $kezia = $response->json('data.1');
        $this->assertSame('duo', $kezia['actType']);
        $this->assertSame('Pickering', $kezia['baseCity']);
        $this->assertSame('2026-10-08T21:05:00-04:00', $kezia['submittedAt']);
        $this->assertSame('2026-10-09T10:42:00-04:00', $response->json('data.2.submittedAt'));
        // The queue never carries what the review screen shows (the email, the references).
        $this->assertArrayNotHasKey('email', $ebenezer);
        $this->assertArrayNotHasKey('references', $ebenezer);

        // Once an application is decided, the queue names when ("The last one was decided Mon 5 Oct").
        $this->application('A-0217')->update(['status' => ApplicationStatus::Rejected, 'decided_at' => Carbon::parse('2026-10-05 15:30', 'America/Toronto')->utc()]);
        $this->asPriya()->getJson(self::QUEUE)->assertOk()->assertJsonPath('meta.waiting', 2)->assertJsonPath('meta.lastDecidedAt', '2026-10-05T15:30:00-04:00');
    }

    public function test_opening_an_application_shows_everything_with_the_decrypted_contacts_and_is_audited(): void
    {
        $tobi = $this->application('A-0219');

        $response = $this->asPriya()->getJson(self::QUEUE."/{$tobi->id}");

        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.number', 'A-0219')
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.name', 'Tobi Adeyemi')
            ->assertJsonPath('data.email', 'tobi@tobiadeyemi.ca')
            ->assertJsonPath('data.actType', 'solo')
            ->assertJsonPath('data.baseCity', 'Scarborough')
            ->assertJsonPath('data.styles', ['solo-vocalist', 'acoustic', 'hymns'])
            ->assertJsonPath('data.fromPriceCents', 40000)
            ->assertJsonPath('data.maxDriveKm', 80)
            ->assertJsonPath('data.submittedAt', '2026-10-09T10:42:00-04:00')
            ->assertJsonPath('data.videos.0.title', 'Way Maker — live at Cornerstone')
            ->assertJsonPath('data.videos.0.durationSeconds', 348)
            ->assertJsonPath('data.videos.0.status', 'live')
            ->assertJsonPath('data.references.0.name', 'Pastor Samuel Osei')
            ->assertJsonPath('data.references.0.church', 'Cornerstone Baptist, Scarborough')
            ->assertJsonPath('data.references.0.contact', 'samuel.osei@cornerstonebaptist.ca')
            ->assertJsonPath('data.references.0.verifiedAt', null)
            ->assertJsonPath('data.references.0.verifiedBy', null)
            ->assertJsonPath('data.references.1.name', 'Ruth Kim')
            ->assertJsonPath('data.references.1.contact', '647 555 0192')
            ->assertJsonPath('data.vulnerableSectorCheck', null)
            ->assertJsonPath('data.decision', null);
        $this->assertMatchesContract($response);
        $this->assertSame(336, mb_strlen($response->json('data.bio')));
        $this->assertStringContainsString('/stream.m3u8', $response->json('data.videos.0.stream'));

        $entry = AuditEntry::where('action', AuditAction::ApplicationViewed)->sole();
        $this->assertSame(User::where('email', CastSeeder::PRIYA_EMAIL)->sole()->id, $entry->actor_id);
        $this->assertSame($tobi->id, $entry->target_id);
    }

    public function test_ticking_a_reference_saves_who_and_when_and_unticking_clears_it(): void
    {
        $tobi = $this->application('A-0219');
        $osei = $tobi->references()->where('name', 'Pastor Samuel Osei')->sole();
        $priya = User::where('email', CastSeeder::PRIYA_EMAIL)->sole();

        $ticked = $this->asPriya()->putJson(self::QUEUE."/{$tobi->id}/references/{$osei->id}/verification", ['verified' => true]);

        $ticked->assertOk()
            ->assertJsonPath('data.id', $osei->id)
            ->assertJsonPath('data.verifiedAt', '2026-10-09T10:00:00-04:00')
            ->assertJsonPath('data.verifiedBy.name', 'Priya Nair');
        $this->assertMatchesContract($ticked);
        $osei->refresh();
        $this->assertSame($priya->id, $osei->verified_by);
        $entry = AuditEntry::where('action', AuditAction::ReferenceVerified)->sole();
        $this->assertSame($priya->id, $entry->actor_id);
        $this->assertSame($osei->id, $entry->target_id);
        $this->assertTrue($entry->context['verified']);

        // The review screen counts it.
        $this->asPriya()->getJson(self::QUEUE."/{$tobi->id}")->assertOk()->assertJsonPath('data.references.0.verifiedBy.name', 'Priya Nair');

        $unticked = $this->asPriya()->putJson(self::QUEUE."/{$tobi->id}/references/{$osei->id}/verification", ['verified' => false]);

        $unticked->assertOk()->assertJsonPath('data.verifiedAt', null)->assertJsonPath('data.verifiedBy', null);
        $this->assertNull($osei->fresh()->verified_at);
        $this->assertSame(2, AuditEntry::where('action', AuditAction::ReferenceVerified)->count());
        $this->assertFalse(AuditEntry::where('action', AuditAction::ReferenceVerified)->latest('id')->first()?->context['verified']);
    }

    public function test_a_reference_of_a_decided_application_or_another_application_cannot_be_ticked(): void
    {
        $tobi = $this->application('A-0219');
        $kezia = $this->application('A-0218');
        $osei = $tobi->references()->first();

        // The reference must belong to the application in the address.
        $this->asPriya()->putJson(self::QUEUE."/{$kezia->id}/references/{$osei->id}/verification", ['verified' => true])->assertNotFound();
        // `verified` is required and boolean.
        $this->asPriya()->putJson(self::QUEUE."/{$tobi->id}/references/{$osei->id}/verification", [])->assertStatus(422)->assertJsonValidationErrors(['verified']);

        $tobi->update(['status' => ApplicationStatus::Rejected, 'decided_at' => now()]);
        $this->asPriya()->putJson(self::QUEUE."/{$tobi->id}/references/{$osei->id}/verification", ['verified' => true])
            ->assertStatus(409)->assertJsonPath('type', fn (string $type) => str_ends_with($type, '/problems/application-already-decided'));
        $this->assertNull($osei->fresh()->verified_at);
    }

    public function test_only_administrators_reach_the_queue(): void
    {
        $tobi = $this->application('A-0219');

        $this->asANewRequest()->withoutCookies()->fromTheWebApp()->getJson(self::QUEUE)->assertNotFound();
        $this->asANewRequest()->withoutCookies()->signIn('abigail@abigailmensah.ca')->assertOk();
        $this->fromTheWebApp()->getJson(self::QUEUE."/{$tobi->id}")->assertNotFound();
        $this->assertSame(0, AuditEntry::where('action', AuditAction::ApplicationViewed)->count());
    }

    private function application(string $number): ArtistApplication
    {
        return ArtistApplication::where('number', $number)->sole();
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
