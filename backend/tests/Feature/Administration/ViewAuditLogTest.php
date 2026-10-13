<?php

namespace Tests\Feature\Administration;

use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\AuditEntry;
use App\Models\Booking;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-069.2–.3, L2-095.1 (administration/record-audit-log): an administrator reads the audit log, newest
 * first, filtered and paged by cursor; nothing changes or deletes an entry.
 */
class ViewAuditLogTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const ENTRIES = '/api/v1/admin/audit-entries';

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->signInPriya();
    }

    public function test_entries_come_newest_first_with_actor_target_address_and_outcome(): void
    {
        $abigail = User::where('email', 'abigail@abigailmensah.ca')->sole();
        $booking = Booking::where('number', 'ZAM-0101')->sole();
        $this->entry($abigail, AuditAction::PasswordChanged, $abigail, AuditOutcome::Succeeded, '2026-10-09 09:36', '142.112.60.21');
        $this->entry(null, AuditAction::SignInFailed, null, AuditOutcome::Failed, '2026-10-09 03:12', '185.220.101.7', ['email' => 'admin@riversidecc.ca']);
        $this->entry(null, AuditAction::SignIn, $booking, AuditOutcome::Succeeded, '2026-10-09 08:05', null);

        $response = $this->asPriya()->getJson(self::ENTRIES);

        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertMatchesContract($response);
        $actions = collect($response->json('data'))->pluck('action')->all();
        // Priya's own code step and sign-in from setUp come first, then the three entries above.
        $this->assertSame(['auth.sign_in', 'auth.mfa_challenge', 'auth.password_changed', 'auth.sign_in', 'auth.sign_in_failed'], $actions);
        $changed = $response->json('data.2');
        $this->assertSame('2026-10-09T09:36:00-04:00', $changed['occurredAt']);
        $this->assertSame(['name' => 'Abigail Mensah', 'email' => 'abigail@abigailmensah.ca', 'role' => 'artist'], $changed['actor']);
        $this->assertSame(['type' => 'User', 'label' => 'Abigail Mensah'], $changed['target']);
        $this->assertSame('142.112.60.21', $changed['ipAddress']);
        $this->assertSame('succeeded', $changed['outcome']);
        $failed = $response->json('data.4');
        $this->assertNull($failed['actor']);
        $this->assertSame('admin@riversidecc.ca', $failed['attemptedEmail']);
        $this->assertNull($failed['target']);
        $system = $response->json('data.3');
        $this->assertNull($system['actor']);
        $this->assertNull($system['attemptedEmail']);
        $this->assertSame(['type' => 'Booking', 'label' => 'ZAM-0101'], $system['target']);
        $this->assertNull($system['ipAddress']);
    }

    public function test_filters_narrow_by_actor_email_action_target_outcome_and_dates(): void
    {
        $abigail = User::where('email', 'abigail@abigailmensah.ca')->sole();
        $naomi = User::where('email', 'naomi.fraser@riversidecc.ca')->sole();
        $this->entry($abigail, AuditAction::PasswordChanged, $abigail, AuditOutcome::Succeeded, '2026-10-09 09:36', '142.112.60.21');
        $this->entry($abigail, AuditAction::SignInFailed, $abigail, AuditOutcome::Failed, '2026-10-09 09:30', '142.112.60.21');
        $this->entry($naomi, AuditAction::SignIn, $naomi, AuditOutcome::Succeeded, '2026-10-01 08:00', '99.230.14.9');
        $this->entry($naomi, AuditAction::SignIn, $naomi, AuditOutcome::Succeeded, '2026-09-30 23:59', '99.230.14.9');

        $byActor = $this->asPriya()->getJson(self::ENTRIES.'?actor=ABIGAIL@abigailmensah.ca');
        $this->assertSame(['auth.password_changed', 'auth.sign_in_failed'], collect($byActor->json('data'))->pluck('action')->all());

        $byAction = $this->asPriya()->getJson(self::ENTRIES.'?action=auth.sign_in_failed');
        $this->assertCount(1, $byAction->json('data'));

        $byOutcome = $this->asPriya()->getJson(self::ENTRIES.'?outcome=failed&actor=abigail@abigailmensah.ca');
        $this->assertSame(['auth.sign_in_failed'], collect($byOutcome->json('data'))->pluck('action')->all());

        $byTarget = $this->asPriya()->getJson(self::ENTRIES.'?target=Naomi');
        $this->assertCount(2, $byTarget->json('data'));

        $byDates = $this->asPriya()->getJson(self::ENTRIES.'?from=2026-10-01&to=2026-10-08');
        $this->assertSame(['2026-10-01T08:00:00-04:00'], collect($byDates->json('data'))->pluck('occurredAt')->all());

        $this->asPriya()->getJson(self::ENTRIES.'?from=2026-10-09&to=2026-10-01')->assertStatus(422)->assertJsonValidationErrors(['to']);
        $this->asPriya()->getJson(self::ENTRIES.'?outcome=maybe')->assertStatus(422)->assertJsonValidationErrors(['outcome']);
    }

    public function test_older_entries_follow_by_cursor_50_at_a_time(): void
    {
        $naomi = User::where('email', 'naomi.fraser@riversidecc.ca')->sole();
        foreach (range(1, 60) as $minute) {
            $this->entry($naomi, AuditAction::SignIn, $naomi, AuditOutcome::Succeeded, Carbon::parse('2026-10-01 08:00', 'America/Toronto')->addMinutes($minute)->format('Y-m-d H:i'), '99.230.14.9');
        }

        $first = $this->asPriya()->getJson(self::ENTRIES.'?actor=naomi.fraser@riversidecc.ca')->assertOk();
        $this->assertCount(50, $first->json('data'));
        $this->assertSame(50, $first->json('meta.perPage'));
        $this->assertSame('2026-10-01T09:00:00-04:00', $first->json('data.0.occurredAt'));
        $cursor = $first->json('meta.nextCursor');
        $this->assertNotNull($cursor);

        $second = $this->asPriya()->getJson(self::ENTRIES.'?actor=naomi.fraser@riversidecc.ca&cursor='.urlencode($cursor))->assertOk();
        $this->assertCount(10, $second->json('data'));
        $this->assertSame('2026-10-01T08:01:00-04:00', $second->json('data.9.occurredAt'));
        $this->assertNull($second->json('meta.nextCursor'));
        $this->assertMatchesContract($second);
    }

    public function test_nothing_changes_or_deletes_an_entry(): void
    {
        $entry = AuditEntry::where('action', AuditAction::SignIn)->latest('id')->sole();

        $this->asPriya()->patchJson(self::ENTRIES.'/'.$entry->id, ['outcome' => 'failed'])->assertStatus(405);
        $this->asPriya()->deleteJson(self::ENTRIES.'/'.$entry->id)->assertStatus(405);
        $this->asPriya()->putJson(self::ENTRIES.'/'.$entry->id, ['outcome' => 'failed'])->assertStatus(405);

        $this->assertSame(AuditOutcome::Succeeded, $entry->fresh()->outcome);
    }

    private function entry(?User $actor, AuditAction $action, mixed $target, AuditOutcome $outcome, string $at, ?string $ip, array $context = []): void
    {
        DB::table('audit_entries')->insert([
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->roleNames()[0]->value,
            'action' => $action->value,
            'target_type' => $target?->getMorphClass(),
            'target_id' => $target?->getKey(),
            'occurred_at' => Carbon::parse($at, 'America/Toronto')->toIso8601String(),
            'ip_address' => $ip,
            'outcome' => $outcome->value,
            'context' => json_encode($context),
        ]);
    }

    private function signInPriya(): void
    {
        $pending = $this->asANewRequest()->withoutCookies()->signIn(CastSeeder::PRIYA_EMAIL)->assertStatus(202)
            ->getCookie('zamaro_session')->getValue();
        $this->session = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp(CastSeeder::PRIYA_TOTP_SECRET)])
            ->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function asPriya(): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
    }
}
