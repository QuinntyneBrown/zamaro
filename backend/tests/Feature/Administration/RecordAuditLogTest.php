<?php

namespace Tests\Feature\Administration;

use App\Actions\Accounts\GrantRole;
use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Enums\Role;
use App\Models\AuditEntry;
use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use RuntimeException;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-069.1 (administration/record-audit-log): sign-ins, code steps and role changes are each written
 * to the audit log with the actor, the target, the outcome and the address the request came from, as
 * the trusted proxies report it. Secrets never reach an entry, and an entry rolls back with its change.
 */
class RecordAuditLogTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    /** A load balancer or the web app's server, on the private network phpunit.xml trusts. */
    private const PROXY = '10.0.0.5';

    private const PRIYA_AT_HOME = '99.230.14.8';

    private string $email;

    private string $secret;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 11:41', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'priya-'.uniqid().'@zamaro.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
        $this->signIn($this->email)->assertOk();
        $this->secret = str_replace(' ', '', $this->fromTheWebApp()->postJson('/api/v1/account/two-factor')->json('data.key'));
        $this->fromTheWebApp()->postJson('/api/v1/account/two-factor/confirm', [
            'code' => (new Google2FA)->getCurrentOtp($this->secret),
        ])->assertOk();
    }

    public function test_a_password_and_code_sign_in_writes_both_steps_with_the_forwarded_address(): void
    {
        $since = $this->lastEntryId();

        $this->signInWithCode((new Google2FA)->getCurrentOtp($this->secret), self::PROXY)->assertOk();

        $entries = AuditEntry::where('id', '>', $since)->orderBy('id')->get();
        $this->assertSame(['auth.mfa_challenge', 'auth.sign_in'], $entries->pluck('action.value')->all());
        foreach ($entries as $entry) {
            $this->assertSame(AuditOutcome::Succeeded, $entry->outcome);
            $this->assertSame($this->user()->id, $entry->actor_id);
            $this->assertSame(self::PRIYA_AT_HOME, $entry->ip_address);
        }
    }

    public function test_on_a_frozen_clock_an_entry_takes_the_frozen_time_so_the_viewer_matches_the_mocks(): void
    {
        $since = $this->lastEntryId();

        $this->signInWithCode((new Google2FA)->getCurrentOtp($this->secret), self::PROXY)->assertOk();

        $entry = AuditEntry::where('id', '>', $since)->orderByDesc('id')->firstOrFail();
        $this->assertSame('2026-10-09T11:41:00-04:00', $entry->occurred_at->setTimezone('America/Toronto')->toIso8601String());
    }

    public function test_a_forwarded_address_from_a_caller_that_is_not_a_trusted_proxy_is_ignored(): void
    {
        $since = $this->lastEntryId();

        $this->signInWithCode((new Google2FA)->getCurrentOtp($this->secret), '203.0.113.9')->assertOk();

        $this->assertSame(['203.0.113.9'], AuditEntry::where('id', '>', $since)->pluck('ip_address')->unique()->values()->all());
    }

    public function test_a_wrong_code_writes_a_failed_code_step(): void
    {
        $since = $this->lastEntryId();

        $this->signInWithCode('000000', self::PROXY)->assertUnprocessable();

        $entry = AuditEntry::where('id', '>', $since)->sole();
        $this->assertSame(AuditAction::MfaChallenge, $entry->action);
        $this->assertSame(AuditOutcome::Failed, $entry->outcome);
        $this->assertSame($this->user()->id, $entry->actor_id);
    }

    public function test_granting_a_role_writes_a_role_change_by_the_system_once(): void
    {
        $since = $this->lastEntryId();

        app(GrantRole::class)->handle($this->user(), Role::Administrator, by: null);
        app(GrantRole::class)->handle($this->user(), Role::Administrator, by: null);

        $entry = AuditEntry::where('id', '>', $since)->sole();
        $this->assertSame(AuditAction::RoleChanged, $entry->action);
        $this->assertNull($entry->actor_id, 'No one signed in made the change: the actor is the system.');
        $this->assertSame($this->user()->id, $entry->target_id);
        $this->assertSame(['granted' => 'admin'], $entry->context);
        $this->assertContains(Role::Administrator, $this->user()->roleNames());
    }

    public function test_a_password_in_the_context_never_reaches_the_entry(): void
    {
        $entry = app(RecordAuditEntry::class)->handle(null, AuditAction::SignInFailed, null, AuditOutcome::Failed, [
            'email' => 'admin@riversidecc.ca',
            'password' => 'hosanna-in-the-highest',
        ]);

        $stored = DB::table('audit_entries')->where('id', $entry->id)->value('context');
        $this->assertStringNotContainsString('hosanna-in-the-highest', $stored);
        $this->assertSame(['email' => 'admin@riversidecc.ca', 'password' => '[REDACTED]'], json_decode($stored, true));
    }

    public function test_an_entry_written_in_a_transaction_that_rolls_back_is_gone_with_it(): void
    {
        $since = $this->lastEntryId();

        try {
            DB::transaction(function () {
                app(RecordAuditEntry::class)->handle($this->user(), AuditAction::RoleChanged, $this->user(), AuditOutcome::Succeeded);
                throw new RuntimeException('the change it describes failed');
            });
        } catch (RuntimeException) {
        }

        $this->assertSame(0, AuditEntry::where('id', '>', $since)->count());
    }

    private function signInWithCode(string $code, string $from): TestResponse
    {
        $headers = ['X-Forwarded-For' => self::PRIYA_AT_HOME];
        $session = $this->asANewRequest()->withoutCookies()->withServerVariables(['REMOTE_ADDR' => $from])
            ->withHeaders($headers)->signIn($this->email)->assertStatus(202)
            ->getCookie('zamaro_session')->getValue();

        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withServerVariables(['REMOTE_ADDR' => $from])
            ->withHeaders($headers)->withCookie('zamaro_session', $session)
            ->postJson('/api/v1/session/two-factor', ['code' => $code]);
    }

    private function lastEntryId(): int
    {
        return (int) AuditEntry::max('id');
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
