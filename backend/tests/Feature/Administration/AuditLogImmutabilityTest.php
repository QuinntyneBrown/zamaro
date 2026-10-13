<?php

namespace Tests\Feature\Administration;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\AuditEntry;
use App\Models\ImmutableAuditEntry;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * L2-069.2 (administration/record-audit-log): no operation in the application changes or deletes an
 * entry. The model refuses, and the database refuses a raw UPDATE from anyone and a raw DELETE from
 * anyone but the retention role that `audit:prune` uses.
 */
class AuditLogImmutabilityTest extends TestCase
{
    use RefreshDatabase;

    private AuditEntry $entry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->entry = app(RecordAuditEntry::class)->handle(null, AuditAction::SignInFailed, null, AuditOutcome::Failed, ['email' => 'admin@riversidecc.ca']);
    }

    public function test_the_model_refuses_to_change_an_entry(): void
    {
        $this->expectException(ImmutableAuditEntry::class);

        try {
            $this->entry->update(['outcome' => AuditOutcome::Succeeded]);
        } finally {
            $this->assertSame('failed', DB::table('audit_entries')->where('id', $this->entry->id)->value('outcome'));
        }
    }

    public function test_the_model_refuses_to_delete_an_entry(): void
    {
        $this->expectException(ImmutableAuditEntry::class);

        try {
            $this->entry->delete();
        } finally {
            $this->assertTrue(DB::table('audit_entries')->where('id', $this->entry->id)->exists());
        }
    }

    public function test_the_database_refuses_a_raw_update_or_delete_from_the_application(): void
    {
        $this->assertRefused(fn () => DB::table('audit_entries')->update(['outcome' => 'succeeded']));
        $this->assertRefused(fn () => DB::table('audit_entries')->delete());

        $this->assertSame('failed', DB::table('audit_entries')->where('id', $this->entry->id)->value('outcome'));
    }

    public function test_the_retention_role_may_delete_but_never_update(): void
    {
        DB::statement('SET ROLE zamaro_audit_retention');
        try {
            // The role holds no UPDATE privilege, so the database refuses before the trigger runs.
            $this->assertRefused(fn () => DB::table('audit_entries')->update(['outcome' => 'succeeded']), 'permission denied for table audit_entries');
            DB::table('audit_entries')->where('id', $this->entry->id)->delete();
        } finally {
            DB::statement('RESET ROLE');
        }

        $this->assertFalse(DB::table('audit_entries')->where('id', $this->entry->id)->exists());
    }

    /** The refused statement runs in a savepoint so the test's own transaction carries on. */
    private function assertRefused(Closure $statement, string $because = 'audit entries are append-only'): void
    {
        try {
            DB::transaction($statement);
        } catch (QueryException $e) {
            $this->assertStringContainsString($because, $e->getMessage());

            return;
        }
        $this->fail('The database allowed the statement.');
    }
}
