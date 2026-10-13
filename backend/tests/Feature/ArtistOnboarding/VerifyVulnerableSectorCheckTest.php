<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\AuditAction;
use App\Enums\VscStatus;
use App\Models\Artist;
use App\Models\AuditEntry;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-049.2, L2-069.1 (verify-vulnerable-sector-check): the admin queue lists checks waiting, oldest
 * first; verifying one makes the artist eligible for Youth events for 3 years from the issue date and
 * is audited; a check issued more than 3 years ago is refused, and a second decision is a conflict.
 */
class VerifyVulnerableSectorCheckTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const QUEUE = '/api/v1/admin/vulnerable-sector-checks';

    private const BURLINGTON = ['lat' => 43.325, 'lng' => -79.799, 'place' => 'Burlington', 'radius' => 120];

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->signInPriya();
    }

    public function test_the_queue_lists_the_checks_waiting_oldest_first_with_what_they_replace(): void
    {
        $response = $this->asPriya()->getJson(self::QUEUE);

        $response->assertOk()->assertJsonPath('meta.waiting', 2);
        $this->assertMatchesContract($response);
        $this->assertSame(['Elijah Park', 'Abigail Mensah'], collect($response->json('data'))->pluck('artist.name')->all());
        $elijah = $response->json('data.0');
        $this->assertSame('2026-09-25', $elijah['issuedOn']);
        $this->assertSame('2026-10-07T16:10:00-04:00', $elijah['uploadedAt']);
        $this->assertSame('pending', $elijah['status']);
        $this->assertNull($elijah['replaces']);
        $abigail = $response->json('data.1');
        $this->assertSame('2026-10-05', $abigail['issuedOn']);
        $this->assertSame('2026-10-09T09:52:00-04:00', $abigail['uploadedAt']);
        $this->assertSame(['verifiedUntil' => '2028-03-03'], $abigail['replaces']);
    }

    public function test_verifying_a_check_counts_it_for_three_years_from_its_issue_date_and_is_audited(): void
    {
        $elijah = $this->pendingCheckOf('elijah-park');
        $this->assertNotContains('Elijah Park', $this->youthLineupOn('2026-11-14'));

        $response = $this->asPriya()->postJson(self::QUEUE."/{$elijah->id}/verification");

        $response->assertOk()
            ->assertJsonPath('data.status', 'verified')
            ->assertJsonPath('data.expiresOn', '2029-09-25')
            ->assertJsonPath('data.verifiedAt', '2026-10-09T10:00:00-04:00')
            ->assertJsonPath('data.verifiedBy.name', 'Priya Nair');
        $this->assertMatchesContract($response);
        $check = $elijah->fresh();
        $this->assertSame(VscStatus::Verified, $check->status);
        $this->assertSame(User::where('email', CastSeeder::PRIYA_EMAIL)->sole()->id, $check->verified_by);
        $entry = AuditEntry::where('action', AuditAction::VscVerified)->sole();
        $this->assertSame($check->verified_by, $entry->actor_id);
        $this->assertSame($check->id, $entry->target_id);
        $this->assertContains('Elijah Park', $this->youthLineupOn('2026-11-14'));
        $this->asPriya()->getJson(self::QUEUE)->assertJsonPath('meta.waiting', 1);
    }

    public function test_a_check_issued_more_than_three_years_ago_is_refused(): void
    {
        $marcus = Artist::where('slug', 'marcus-bell-trio')->sole();
        $old = VulnerableSectorCheck::create(['user_id' => $marcus->user_id, 'issued_on' => '2023-10-01', 'status' => VscStatus::Pending]);

        $response = $this->asPriya()->postJson(self::QUEUE."/{$old->id}/verification");

        $response->assertStatus(422)->assertJsonPath('errors.issuedOn.0', 'This check was issued more than 3 years ago. Ask the artist for a newer one.');
        $this->assertSame(VscStatus::Pending, $old->fresh()->status);
    }

    public function test_verifying_twice_is_a_conflict(): void
    {
        $elijah = $this->pendingCheckOf('elijah-park');
        $this->asPriya()->postJson(self::QUEUE."/{$elijah->id}/verification")->assertOk();

        $response = $this->asPriya()->postJson(self::QUEUE."/{$elijah->id}/verification");

        $response->assertStatus(409)->assertJsonPath('type', config('zamaro.problems.base_uri').'/vsc-already-decided');
        $this->assertMatchesContract($response);
        $this->assertSame(1, AuditEntry::where('action', AuditAction::VscVerified)->count());
    }

    private function pendingCheckOf(string $slug): VulnerableSectorCheck
    {
        $artist = Artist::where('slug', $slug)->sole();

        return VulnerableSectorCheck::where('user_id', $artist->user_id)->where('status', VscStatus::Pending)->sole();
    }

    /** @return list<string> */
    private function youthLineupOn(string $date): array
    {
        $response = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/search?'.http_build_query(['date' => $date, 'kind' => 'youth-event'] + self::BURLINGTON))->assertOk();

        return array_values(array_filter([$response->json('headliner.name'), ...$response->json('data.*.name')]));
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
